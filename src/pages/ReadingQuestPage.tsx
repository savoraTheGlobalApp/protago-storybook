import { useState, useEffect, useRef, useCallback } from 'react';

// ── Inject keyframe animations ─────────────────────────────────────────────
const CSS = `
@keyframes pop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
@keyframes float-up { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-120px) scale(0.5);opacity:0} }
@keyframes wiggle { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
@keyframes bounce-in { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
@keyframes confetti-fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
@keyframes star-burst { 0%{transform:scale(0) rotate(-30deg);opacity:1} 100%{transform:scale(2.5) rotate(30deg);opacity:0} }
@keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,0.4)} 50%{box-shadow:0 0 0 16px rgba(255,107,53,0)} }
@keyframes tick { 0%{transform:scale(1)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
.btn-game { transition: transform 0.12s, box-shadow 0.12s !important; }
.btn-game:active { transform: scale(0.93) !important; }
.btn-game:hover { transform: scale(1.04) !important; }
`;

if (!document.getElementById('rq-styles')) {
  const s = document.createElement('style');
  s.id = 'rq-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ── Audio engine ───────────────────────────────────────────────────────────
function useAudio() {
  const ctx = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!ctx.current) ctx.current = new AudioContext();
    if (ctx.current.state === 'suspended') ctx.current.resume();
    return ctx.current;
  };

  const playTone = (freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.25) => {
    try {
      const c = getCtx();
      freqs.forEach((f, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = type;
        const t = c.currentTime + i * (duration / freqs.length);
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration / freqs.length - 0.02);
        osc.start(t); osc.stop(t + duration / freqs.length);
      });
    } catch {}
  };

  return {
    correct: () => playTone([523, 659, 784, 1047], 0.6, 'sine', 0.22),
    wrong:   () => playTone([220, 180], 0.4, 'sawtooth', 0.15),
    tick:    () => playTone([880], 0.08, 'square', 0.08),
    fanfare: () => playTone([523, 659, 784, 1047, 1319, 1568], 1.2, 'sine', 0.2),
    start:   () => playTone([440, 550, 660], 0.5, 'sine', 0.18),
    click:   () => playTone([600], 0.1, 'sine', 0.1),
  };
}

// ── Text-to-speech ─────────────────────────────────────────────────────────
function useTTS() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find(v => v.lang.startsWith('en') && v.localService) ||
        voices.find(v => v.lang.startsWith('en')) || null;
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, [supported]);

  const speak = useCallback((text: string, rate = 0.85) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = rate; utt.pitch = 1.05; utt.volume = 1;
    if (voiceRef.current) utt.voice = voiceRef.current;
    window.speechSynthesis.speak(utt);
  }, [supported]);

  const stop = useCallback(() => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  return { speak, stop, supported };
}

// ── Speech-to-text ─────────────────────────────────────────────────────────
function useSTT() {
  const SR: any = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;
  const supported = !!SR;
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const activeRef = useRef(false); // true = we want to keep listening

  // Each session passes its accumulated base through closure — no external effect needed
  const startSession = useCallback((base: string) => {
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
      let sessionFinal = '';

      rec.onresult = (e: any) => {
        let fin = ''; let inter = '';
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' ';
          else inter += e.results[i][0].transcript;
        }
        sessionFinal = fin;
        setTranscript(base + fin);
        setInterim(inter);
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech') setError(e.error);
        // onend will fire after onerror and handle restart
      };

      rec.onend = () => {
        setInterim('');
        if (activeRef.current) {
          // Auto-restart, carrying forward everything heard so far
          startSession(base + sessionFinal);
        } else {
          setIsListening(false);
        }
      };

      recRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch (e: any) { setError((e as Error).message); setIsListening(false); }
  }, [SR]);

  const start = useCallback(() => {
    activeRef.current = true;
    setError(null); setTranscript(''); setInterim('');
    startSession('');
  }, [startSession]);

  const stop = useCallback(() => {
    activeRef.current = false;
    recRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript(''); setInterim(''); setError(null);
  }, []);

  useEffect(() => () => { activeRef.current = false; recRef.current?.stop(); }, []);

  return { transcript, interim, isListening, error, start, stop, reset, supported };
}

// ── Edit distance (Levenshtein) ───────────────────────────────────────────
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99; // fast reject
  const m = a.length, n = b.length;
  const prev = Array.from({ length: n + 1 }, (_, j) => j);
  const curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++)
      curr[j] = a[i-1] === b[j-1] ? prev[j-1] : 1 + Math.min(prev[j-1], prev[j], curr[j-1]);
    prev.splice(0, n + 1, ...curr);
  }
  return curr[n];
}

// Fuzzy match: short words must be exact; longer words allow 1–2 edits.
// Handles common Indian-accent STT drops: pond→pod, stand→stad, school→skool.
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const len = Math.max(a.length, b.length);
  if (len <= 3) return false;
  return editDistance(a, b) <= (len <= 5 ? 1 : 2);
}

// ── ORF scoring ─────────────────────────────────────────────────────────────
// Bidirectional window alignment with fuzzy matching.
//
// On mismatch, we look ahead in BOTH directions:
//   foundInPassage   → current transcript word appears later in passage
//                      (child skipped a word → advance pi)
//   foundInTranscript → current passage word appears soon in transcript
//                      (STT garbled/delayed it → advance ti and wait)
//
// Priority: if the passage word is coming in the transcript soon, WAIT for it
// rather than abandoning it. This fixes early words not going green when STT
// misses the first syllable of a sentence.
function scoreORF(passageText: string, transcriptText: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const pWords = passageText.split(/\s+/).filter(Boolean);
  const pNorm = pWords.map(norm);
  const tNorm = transcriptText.split(/\s+/).map(norm).filter(Boolean);
  const matched = new Set<number>();
  let pi = 0, ti = 0;
  const PASSAGE_SKIP = 8;    // how far ahead to look in passage for transcript word
  const TRANSCRIPT_WAIT = 4; // how far ahead to look in transcript for passage word
  while (pi < pNorm.length && ti < tNorm.length) {
    if (wordsMatch(pNorm[pi], tNorm[ti])) {
      matched.add(pi); pi++; ti++;
    } else {
      let foundInPassage = false;
      for (let w = 1; w <= PASSAGE_SKIP && pi + w < pNorm.length; w++) {
        if (wordsMatch(pNorm[pi + w], tNorm[ti])) { foundInPassage = true; break; }
      }
      let foundInTranscript = false;
      for (let w = 1; w <= TRANSCRIPT_WAIT && ti + w < tNorm.length; w++) {
        if (wordsMatch(pNorm[pi], tNorm[ti + w])) { foundInTranscript = true; break; }
      }
      // If passage word is coming soon in transcript, wait for it (advance ti)
      // Only skip the passage word if the transcript word matches ahead AND
      // the passage word isn't about to appear.
      if (foundInPassage && !foundInTranscript) pi++;
      else ti++;
    }
  }
  return { correct: matched.size, total: pWords.length, matched };
}

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  saffron: '#FF6B35', navy: '#1B3A6B', gold: '#F5A623',
  mint: '#2ECC71', purple: '#7C3AED', rose: '#E91E8C',
  sky: '#00BCD4', bg: '#FFF8F0', card: '#FFFFFF',
};

// ── Floating star component ────────────────────────────────────────────────
interface Star { id: number; x: string; emoji: string }

function FloatingStars({ stars }: { stars: Star[] }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: s.x, top: '50%',
          fontSize: 32, animation: 'float-up 1s ease-out forwards',
        }}>{s.emoji}</div>
      ))}
    </div>
  );
}

function useStars() {
  const [stars, setStars] = useState<Star[]>([]);
  const id = useRef(0);
  const spawn = (emoji = '⭐') => {
    const newStar = { id: id.current++, x: Math.random() * 80 + 10 + '%', emoji };
    setStars(s => [...s, newStar]);
    setTimeout(() => setStars(s => s.filter(x => x.id !== newStar.id)), 1000);
  };
  return { stars, spawn };
}

// ── Confetti ───────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    i, x: Math.random() * 100, delay: Math.random() * 0.8,
    color: [C.saffron, C.gold, C.mint, C.purple, C.sky, C.rose][i % 6],
    size: 8 + Math.random() * 8,
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100vh', pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.i} style={{
          position: 'absolute', left: `${p.x}%`, top: -20,
          width: p.size, height: p.size, borderRadius: 2,
          background: p.color, opacity: 0.9,
          animation: `confetti-fall 2.5s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ── Mascot ─────────────────────────────────────────────────────────────────
function Mascot({ mood }: { mood: 'idle' | 'happy' | 'sad' | 'excited' }) {
  const emojis = { idle: '🦉', happy: '🦉', sad: '🦉', excited: '🦉' };
  const faces = { idle: '😊', happy: '🤩', sad: '😬', excited: '🥳' };
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8,
      animation: mood === 'happy' ? 'wiggle 0.4s ease-in-out 2' : mood === 'sad' ? 'shake 0.4s' : mood === 'excited' ? 'bounce-in 0.5s' : 'pulse 3s infinite',
    }}>
      <div style={{ fontSize: 44, lineHeight: 1 }}>{emojis[mood]}</div>
      <div style={{ fontSize: 18, marginTop: -8 }}>{faces[mood]}</div>
    </div>
  );
}

// ── Score bubble ───────────────────────────────────────────────────────────
function ScoreBubble({ score, total, color }: { score: number; total: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: `${color}22`, border: `2px solid ${color}`, borderRadius: 99, padding: '4px 14px',
    }}>
      <span style={{ fontSize: 16 }}>⭐</span>
      <span style={{ fontWeight: 900, fontSize: 16, color }}>{score}/{total}</span>
    </div>
  );
}

// ── Timer ring ─────────────────────────────────────────────────────────────
function TimerRing({ timeLeft, maxTime, color }: { timeLeft: number; maxTime: number; color: string }) {
  const pct = timeLeft / maxTime;
  const r = 22; const circ = 2 * Math.PI * r;
  const urgent = timeLeft <= 10;
  return (
    <div style={{ position: 'relative', width: 56, height: 56, animation: urgent ? 'tick 1s infinite' : 'none' }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none"
          stroke={urgent ? C.rose : color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 15, color: urgent ? C.rose : C.navy,
      }}>{timeLeft}</div>
    </div>
  );
}

// ── DIBELS data ────────────────────────────────────────────────────────────
const LNF_LETTERS = 'trnfyIRDGYVrbPLZicAOJpTxKavMUQhgNjXsCHqomSBzeuEFVdkRUXhyOqtmSxKecTGZrgP'.split('');

const PSF_WORDS = [
  { word: 'sun',   sounds: ['s','u','n'],         count: 3 },
  { word: 'for',   sounds: ['f','or'],             count: 2 },
  { word: 'bit',   sounds: ['b','i','t'],          count: 3 },
  { word: 'ask',   sounds: ['a','s','k'],          count: 3 },
  { word: 'ball',  sounds: ['b','o','l'],          count: 3 },
  { word: 'wave',  sounds: ['w','A','v'],          count: 3 },
  { word: 'bring', sounds: ['b','r','i','ng'],     count: 4 },
  { word: 'soft',  sounds: ['s','o','f','t'],      count: 4 },
  { word: 'drop',  sounds: ['d','r','o','p'],      count: 4 },
  { word: 'stand', sounds: ['s','t','a','n','d'],  count: 5 },
  { word: 'map',   sounds: ['m','a','p'],          count: 3 },
  { word: 'run',   sounds: ['r','u','n'],          count: 3 },
  { word: 'cat',   sounds: ['k','a','t'],          count: 3 },
  { word: 'fish',  sounds: ['f','i','sh'],         count: 3 },
  { word: 'chip',  sounds: ['ch','i','p'],         count: 3 },
  { word: 'ship',  sounds: ['sh','i','p'],         count: 3 },
  { word: 'hope',  sounds: ['h','O','p'],          count: 3 },
  { word: 'rope',  sounds: ['r','O','p'],          count: 3 },
  { word: 'plan',  sounds: ['p','l','a','n'],      count: 4 },
  { word: 'frog',  sounds: ['f','r','o','g'],      count: 4 },
  { word: 'clip',  sounds: ['k','l','i','p'],      count: 4 },
  { word: 'milk',  sounds: ['m','i','l','k'],      count: 4 },
  { word: 'just',  sounds: ['j','u','s','t'],      count: 4 },
  { word: 'flat',  sounds: ['f','l','a','t'],      count: 4 },
  { word: 'flag',  sounds: ['f','l','a','g'],      count: 4 },
  { word: 'chest', sounds: ['ch','e','s','t'],     count: 4 },
  { word: 'think', sounds: ['th','i','ng','k'],    count: 4 },
  { word: 'green', sounds: ['g','r','E','n'],      count: 4 },
  { word: 'stamp', sounds: ['s','t','a','m','p'],  count: 5 },
  { word: 'blend', sounds: ['b','l','e','n','d'],  count: 5 },
];


const WRF_BY_GRADE: Record<number, string[]> = {
  1: ['no','they','if','one','for','there','help','came','stop','first','note','head','nice','line','stay','turn','said','walk','play','sing'],
  2: ['did','going','point','over','time','made','still','write','nearly','seen','saying','bear','need','say','picture','foot','best','blue','drink','leader'],
  3: ['further','front','station','deep','powerful','double','meaning','quick','answer','behind','happy','doctor','drive','daily','morning','straight','waiting','circle','himself','safety'],
  4: ['achieve','ancient','border','century','climate','colony','compare','continent','culture','debate','declare','depend','describe','develop','discover','distance','divide','energy','explore','famous'],
  5: ['accompany','accomplish','accurate','category','challenge','character','communicate','community','conclude','contribute','determine','evaluate','evidence','generate','illustrate','influence','interpret','maintain','opportunity','perspective'],
};

const MAZE_BY_GRADE: Record<number, { passage: string; choices: string[]; answer: string }[]> = {
  2: [
    { passage: 'Ravi and his sister went to the market to buy _____ for their mother.', choices: ['vegetables','elephants','numbers'], answer: 'vegetables' },
    { passage: 'The vegetable seller had piled up his cart with bright green and orange _____.', choices: ['colours','furniture','music'], answer: 'colours' },
    { passage: 'When it started to rain, everyone ran under the big _____ at the corner.', choices: ['tree','mountain','ocean'], answer: 'tree' },
    { passage: 'Ravi liked the rain because it made the air feel cool and _____.', choices: ['fresh','hot','loud'], answer: 'fresh' },
    { passage: 'He splashed through a puddle and his shoes got very _____.', choices: ['wet','tall','square'], answer: 'wet' },
    { passage: 'At home his mother laughed and said he looked like a little _____ who had jumped in a pond.', choices: ['frog','clock','mountain'], answer: 'frog' },
  ],
  3: [
    { passage: 'The old fort on the hill had stood for five hundred years, through battles and _____.', choices: ['monsoons','laughter','pillows'], answer: 'monsoons' },
    { passage: 'Nisha climbed its ancient steps slowly, running her fingers along the _____ stone walls.', choices: ['rough','musical','invisible'], answer: 'rough' },
    { passage: 'At the top she could see the entire city spread out below her like a _____.', choices: ['map','river','cloud'], answer: 'map' },
    { passage: 'Her history teacher had told her the kings who lived here were famous for their _____.', choices: ['justice','cooking','sleeping'], answer: 'justice' },
    { passage: 'Nisha took out her notebook and began to _____ everything she could see from the fort.', choices: ['sketch','eat','forget'], answer: 'sketch' },
    { passage: 'She decided to return with her grandfather, who would have a _____ story about every stone.', choices: ['fascinating','boring','quiet'], answer: 'fascinating' },
  ],
  4: [
    { passage: 'Sachin had played cricket since he was six, and everyone in the _____ knew he was talented.', choices: ['colony','ocean','forest'], answer: 'colony' },
    { passage: 'His coach said that to become great, practice alone was not enough — you also needed _____.', choices: ['courage','furniture','weather'], answer: 'courage' },
    { passage: 'During the big inter-school match, Sachin walked out to bat with his hands _____.', choices: ['trembling','floating','singing'], answer: 'trembling' },
    { passage: 'The bowler ran up fast and sent a spinning ball straight toward the _____.', choices: ['stumps','clouds','window'], answer: 'stumps' },
    { passage: 'Sachin swung hard — the ball flew over the boundary rope for a _____.', choices: ['six','river','plate'], answer: 'six' },
    { passage: 'His teammates rushed onto the field, cheering so _____ the whole neighbourhood could hear.', choices: ['loudly','quietly','slowly'], answer: 'loudly' },
  ],
  5: [
    { passage: 'ISRO scientists had worked for seven years to design the spacecraft that would _____ the Moon.', choices: ['orbit','forget','decorate'], answer: 'orbit' },
    { passage: 'Every calculation had to be _____ because even a tiny error could destroy the mission.', choices: ['precise','colourful','ordinary'], answer: 'precise' },
    { passage: 'Dr Meera stayed at the control centre for three nights, monitoring _____ from the probe.', choices: ['signals','recipes','paintings'], answer: 'signals' },
    { passage: 'When the lander safely touched down, the team broke into cheers — years of _____ had paid off.', choices: ['dedication','confusion','hesitation'], answer: 'dedication' },
    { passage: 'The mission proved that India could _____ with the most advanced space programmes in the world.', choices: ['compete','disagree','disappear'], answer: 'compete' },
    { passage: 'Dr Meera told students later that the greatest tool any scientist has is simply a _____ mind.', choices: ['curious','empty','ancient'], answer: 'curious' },
  ],
};

const ORF_PASSAGES: Record<number, string> = {
  1: `Priya has a dog named Moti. Moti is brown and has big ears. Every day Priya gives Moti a roti from her plate. Moti wags his tail and jumps up. Her dadi laughs and says Moti is just like one of the family. After school Priya and Moti play in the park near their home. Moti can run very fast. Priya has to run hard to keep up with him.`,
  2: `Every summer Arjun went to his nani's house in the village. There was a big neem tree in the courtyard. After lunch, when the sun was too hot, everyone rested in its shade. His nani would tell stories about the old days. His favourite was about a clever crow who outsmarted a fox near the river. At night the whole family slept on the roof under the open sky and counted the stars together.`,
  3: `The old bazaar in Jaipur came alive every morning. Vendors called out to passing shoppers, cloth merchants spread bright fabrics on their carts, and the smell of fresh jalebis drifted through the narrow lanes. Kavya walked carefully through the crowd, her canvas bag bumping against her hip. She was looking for one thing — the perfect shade of blue thread to finish her mother's kurta before the festival next week.`,
  4: `Ratan had never seen the sea before the day his father's train pulled into Mumbai. When they stepped onto the platform and into the thick, salty air, he understood at once why people spoke of the city with such longing. The next morning they walked along Marine Drive as the sun rose over the water. Fishermen were already hauling in their nets, and a row of old men sat on the sea wall doing their morning exercises, looking out at the horizon as though they owned it.`,
  5: `India has over fourteen hundred languages, but Hindi and English serve as bridges between them. When Leila moved from Kerala to Delhi for her father's new job, she discovered this firsthand. At her new school she understood almost nothing the first week — the teacher switched between Hindi and English the way some people mix spices in a dish. By the third month Leila found herself doing the same thing without thinking, her sentences weaving between both languages, and she realised that being caught between two worlds was not a problem at all. It was a superpower.`,
};

// ── Timers by grade ────────────────────────────────────────────────────────
const TIMERS: Record<string, Record<number, number>> = {
  lnf:  { 1: 90, 2: 75, 3: 60, 4: 50, 5: 45 },
  psf:  { 1: 80, 2: 65, 3: 50, 4: 45, 5: 40 },
  wrf:  { 1: 90, 2: 75, 3: 65, 4: 55, 5: 50 },
  maze: { 1: 120, 2: 100, 3: 90, 4: 80, 5: 75 },
  orf:  { 1: 65, 2: 65, 3: 65, 4: 65, 5: 65 },
};

// DIBELS ORF end-of-year benchmark (words correct per minute) by grade
const ORF_BENCHMARK: Record<number, number> = { 1: 47, 2: 87, 3: 107, 4: 123, 5: 139 };

// ── Types ──────────────────────────────────────────────────────────────────
type Grade = 1 | 2 | 3 | 4 | 5;
type Module = 'lnf' | 'psf' | 'wrf' | 'maze' | 'orf';
interface ModuleResult { module: Module; score: number; total: number; pct: number }

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }
function pickN<T>(arr: T[], n: number): T[] { return shuffle(arr).slice(0, n) }

// ── Shared game hook ───────────────────────────────────────────────────────
function useGameTimer(seconds: number, onExpire: () => void, active: boolean) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const audio = useAudio();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(t); onExpire(); return 0; }
        if (p <= 11) audio.tick();
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [active]);
  return timeLeft;
}

// ── Answer feedback overlay ────────────────────────────────────────────────
function FeedbackBadge({ feedback }: { feedback: 'correct' | 'wrong' | null }) {
  if (!feedback) return null;
  return (
    <div style={{
      position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9000, pointerEvents: 'none',
      animation: 'bounce-in 0.3s ease-out',
    }}>
      <div style={{
        background: feedback === 'correct' ? C.mint : C.rose,
        color: '#fff', borderRadius: 20, padding: '12px 28px',
        fontSize: 26, fontWeight: 900, fontFamily: "'Baloo 2', sans-serif",
        boxShadow: `0 8px 30px ${feedback === 'correct' ? C.mint : C.rose}66`,
      }}>
        {feedback === 'correct' ? '🌟 Correct!' : '💪 Try next!'}
      </div>
    </div>
  );
}

// ── Game shell ─────────────────────────────────────────────────────────────
function GameShell({ title, emoji, timeLeft, maxTime, score, total, color, mascotMood, children }: {
  title: string; emoji: string; timeLeft: number; maxTime: number;
  score: number; total: number; color: string; mascotMood: 'idle' | 'happy' | 'sad' | 'excited'; children: React.ReactNode;
}) {
  const progress = Math.round((score / Math.max(total, 1)) * 100);
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '16px 16px 40px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: C.navy }}>{emoji} {title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ScoreBubble score={score} total={total} color={color} />
          <TimerRing timeLeft={timeLeft} maxTime={maxTime} color={color} />
        </div>
      </div>
      {/* Mascot */}
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <Mascot mood={mascotMood} />
      </div>
      {children}
    </div>
  );
}

// ── Letter Lightning ───────────────────────────────────────────────────────
function LNFGame({ grade, onDone }: { grade: Grade; onDone: (r: ModuleResult) => void }) {
  const items = useRef(shuffle(LNF_LETTERS).slice(0, 12));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [mascot, setMascot] = useState<'idle' | 'happy' | 'sad' | 'excited'>('idle');
  const audio = useAudio();
  const { stars, spawn } = useStars();
  const maxTime = TIMERS.lnf[grade];

  const finish = useCallback((s: number, i: number) => {
    if (done) return;
    setDone(true);
    const total = Math.max(i, 1);
    audio.fanfare();
    onDone({ module: 'lnf', score: s, total, pct: Math.round((s / total) * 100) });
  }, [done]);

  const timeLeft = useGameTimer(maxTime, () => finish(score, idx), !done);

  const current = items.current[idx];
  const opts = useRef<string[]>([]);
  if (!opts.current.length || !opts.current.includes(current)) {
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('').filter(l => l.toLowerCase() !== current.toLowerCase());
    opts.current = shuffle([current, ...shuffle(pool).slice(0, 3)]);
  }

  const handlePick = (letter: string) => {
    if (feedback || done) return;
    const correct = letter.toLowerCase() === current.toLowerCase();
    const ns = correct ? score + 1 : score;
    if (correct) { setScore(ns); audio.correct(); spawn('⭐'); setMascot('happy'); }
    else { audio.wrong(); setMascot('sad'); }
    setFeedback(correct ? 'correct' : 'wrong');
    opts.current = [];
    setTimeout(() => {
      setFeedback(null);
      setMascot('idle');
      if (idx + 1 >= items.current.length) finish(ns, idx + 1);
      else setIdx(i => i + 1);
    }, 800);
  };

  return (
    <>
      <FloatingStars stars={stars} />
      <FeedbackBadge feedback={feedback} />
      <GameShell title="Letter Lightning" emoji="⚡" timeLeft={timeLeft} maxTime={maxTime} score={score} total={idx} color={C.gold} mascotMood={mascot}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>What is the name of this letter?</div>
          <div style={{
            fontSize: 120, fontWeight: 900, lineHeight: 1.1, color: C.navy, fontFamily: 'monospace',
            background: `${C.gold}22`, borderRadius: 20, padding: '8px 0', margin: '0 40px',
            animation: 'pop 0.3s ease-out',
            boxShadow: `inset 0 0 0 3px ${C.gold}44`,
          }}>{current}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {opts.current.map(l => (
            <button key={l} className="btn-game" onClick={() => handlePick(l)} style={{
              padding: '20px 8px', fontSize: 32, fontWeight: 900, fontFamily: 'monospace',
              border: `3px solid ${C.gold}55`, borderRadius: 18,
              background: 'linear-gradient(135deg, #fff, #FFFBF0)',
              cursor: 'pointer', color: C.navy,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}>{l}</button>
          ))}
        </div>
      </GameShell>
    </>
  );
}

// ── Sound Smasher ──────────────────────────────────────────────────────────
function PSFGame({ grade, onDone }: { grade: Grade; onDone: (r: ModuleResult) => void }) {
  const items = useRef(shuffle(PSF_WORDS).slice(0, 8));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [mascot, setMascot] = useState<'idle' | 'happy' | 'sad' | 'excited'>('idle');
  const audio = useAudio();
  const tts = useTTS();
  const { stars, spawn } = useStars();
  const maxTime = TIMERS.psf[grade];

  const finish = useCallback((s: number, i: number) => {
    if (done) return;
    setDone(true);
    audio.fanfare();
    onDone({ module: 'psf', score: s, total: Math.max(i, 1), pct: Math.round((s / Math.max(i, 1)) * 100) });
  }, [done]);

  const timeLeft = useGameTimer(maxTime, () => finish(score, idx), !done);
  const current = items.current[idx];
  const options = [current.count - 1, current.count, current.count + 1].filter(n => n >= 1 && n <= 6);

  // Speak the word automatically when a new item appears
  useEffect(() => { tts.speak(current.word, 0.72); }, [idx]);

  const handlePick = (n: number) => {
    if (feedback || done) return;
    const correct = n === current.count;
    const ns = correct ? score + 1 : score;
    if (correct) { setScore(ns); audio.correct(); spawn('💥'); setMascot('happy'); }
    else { audio.wrong(); setMascot('sad'); }
    setFeedback(correct ? 'correct' : 'wrong');
    setRevealed(true);
    setTimeout(() => {
      setFeedback(null); setRevealed(false); setMascot('idle');
      if (idx + 1 >= items.current.length) finish(ns, idx + 1);
      else setIdx(i => i + 1);
    }, 1000);
  };

  return (
    <>
      <FloatingStars stars={stars} />
      <FeedbackBadge feedback={feedback} />
      <GameShell title="Sound Smasher" emoji="💥" timeLeft={timeLeft} maxTime={maxTime} score={score} total={idx} color={C.purple} mascotMood={mascot}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>How many SOUNDS do you hear in this word?</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, animation: 'pop 0.3s ease-out' }}>
            <div style={{
              fontSize: 64, fontWeight: 900, color: C.navy, letterSpacing: 6,
              background: `${C.purple}18`, borderRadius: 18, padding: '12px 24px',
            }}>{current.word}</div>
            <button onClick={() => tts.speak(current.word, 0.72)} title="Hear the word" style={{
              width: 48, height: 48, borderRadius: '50%', border: `2px solid ${C.purple}44`,
              background: `${C.purple}18`, cursor: 'pointer', fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🔊</button>
          </div>
        </div>
        {revealed && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', animation: 'pop 0.3s ease-out' }}>
            {current.sounds.map((s, i) => (
              <div key={i} style={{
                background: feedback === 'correct' ? C.mint : C.rose, color: '#fff',
                borderRadius: 12, padding: '8px 14px', fontSize: 22, fontWeight: 800,
              }}>/{s}/</div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
          {options.map(n => (
            <button key={n} className="btn-game" onClick={() => handlePick(n)} style={{
              width: 80, height: 80, borderRadius: '50%', fontSize: 36, fontWeight: 900,
              border: `4px solid ${C.purple}55`, cursor: 'pointer', color: C.navy,
              background: 'linear-gradient(135deg, #fff, #F5F0FF)',
              boxShadow: '0 6px 16px rgba(124,58,237,0.2)',
            }}>{n}</button>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 12 }}>Tap the number of sounds</div>
      </GameShell>
    </>
  );
}

// ── Word Flash ─────────────────────────────────────────────────────────────
function WRFGame({ grade, onDone }: { grade: Grade; onDone: (r: ModuleResult) => void }) {
  const bank = WRF_BY_GRADE[grade];
  const items = useRef(shuffle(bank).slice(0, 12));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showWord, setShowWord] = useState(true);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [mascot, setMascot] = useState<'idle' | 'happy' | 'sad' | 'excited'>('idle');
  const audio = useAudio();
  const { stars, spawn } = useStars();
  const maxTime = TIMERS.wrf[grade];

  const finish = useCallback((s: number, i: number) => {
    if (done) return; setDone(true); audio.fanfare();
    onDone({ module: 'wrf', score: s, total: Math.max(i, 1), pct: Math.round((s / Math.max(i, 1)) * 100) });
  }, [done]);

  const timeLeft = useGameTimer(maxTime, () => finish(score, idx), !done);
  const current = items.current[idx];

  const opts = useRef<string[]>([]);
  if (!opts.current.length || !opts.current.includes(current)) {
    opts.current = shuffle([current, ...shuffle(bank.filter(w => w !== current)).slice(0, 3)]);
  }

  const flashDuration = grade === 1 ? 2000 : grade === 2 ? 1500 : 1200;

  useEffect(() => {
    setShowWord(true);
    const t = setTimeout(() => setShowWord(false), flashDuration);
    return () => clearTimeout(t);
  }, [idx]);

  const handlePick = (w: string) => {
    if (feedback || done) return;
    const correct = w === current;
    const ns = correct ? score + 1 : score;
    if (correct) { setScore(ns); audio.correct(); spawn('✨'); setMascot('happy'); }
    else { audio.wrong(); setMascot('sad'); }
    setFeedback(correct ? 'correct' : 'wrong');
    opts.current = [];
    setTimeout(() => {
      setFeedback(null); setMascot('idle');
      if (idx + 1 >= items.current.length) finish(ns, idx + 1);
      else setIdx(i => i + 1);
    }, 800);
  };

  return (
    <>
      <FloatingStars stars={stars} />
      <FeedbackBadge feedback={feedback} />
      <GameShell title="Word Flash" emoji="✨" timeLeft={timeLeft} maxTime={maxTime} score={score} total={idx} color={C.saffron} mascotMood={mascot}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Remember the word — then find it!</div>
          <div style={{
            minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 20, margin: '0 16px', transition: 'all 0.4s ease',
            background: showWord ? `linear-gradient(135deg, ${C.navy}, #2A5298)` : '#F3F4F6',
            boxShadow: showWord ? `0 8px 24px ${C.navy}44` : 'none',
            animation: showWord ? 'glow 1.5s infinite' : 'none',
          }}>
            <span style={{
              fontSize: 52, fontWeight: 900, transition: 'all 0.4s',
              color: showWord ? '#fff' : '#CBD5E1',
              filter: showWord ? 'none' : 'blur(4px)',
            }}>{showWord ? current : '?'}</span>
          </div>
        </div>
        {showWord
          ? <div style={{ textAlign: 'center', fontSize: 13, color: '#aaa', marginTop: 8 }}>Read it carefully…</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, animation: 'pop 0.25s ease-out' }}>
              {opts.current.map(w => (
                <button key={w} className="btn-game" onClick={() => handlePick(w)} style={{
                  padding: '16px 8px', fontSize: 20, fontWeight: 800, color: C.navy,
                  border: `3px solid ${C.saffron}44`, borderRadius: 14,
                  background: 'linear-gradient(135deg, #fff, #FFFBF5)',
                  cursor: 'pointer', boxShadow: '0 4px 10px rgba(255,107,53,0.1)',
                }}>{w}</button>
              ))}
            </div>
          )
        }
      </GameShell>
    </>
  );
}

// ── Story Fill (Maze) ──────────────────────────────────────────────────────
function MazeGame({ grade, onDone }: { grade: Grade; onDone: (r: ModuleResult) => void }) {
  const items = MAZE_BY_GRADE[grade] ?? MAZE_BY_GRADE[2];
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [mascot, setMascot] = useState<'idle' | 'happy' | 'sad' | 'excited'>('idle');
  const audio = useAudio();
  const { stars, spawn } = useStars();
  const maxTime = TIMERS.maze[grade];

  const finish = useCallback((s: number, i: number) => {
    if (done) return; setDone(true); audio.fanfare();
    onDone({ module: 'maze', score: s, total: Math.max(i, 1), pct: Math.round((s / Math.max(i, 1)) * 100) });
  }, [done]);

  const timeLeft = useGameTimer(maxTime, () => finish(score, idx), !done);
  const current = items[idx];
  const shuffledChoices = useRef<string[]>([]);
  if (shuffledChoices.current.length === 0 || !shuffledChoices.current.includes(current.answer)) {
    shuffledChoices.current = shuffle(current.choices);
  }

  const handlePick = (w: string) => {
    if (feedback || done) return;
    const correct = w === current.answer;
    const ns = correct ? score + 1 : score;
    if (correct) { setScore(ns); audio.correct(); spawn('📖'); setMascot('happy'); }
    else { audio.wrong(); setMascot('sad'); }
    setFeedback(correct ? 'correct' : 'wrong');
    shuffledChoices.current = [];
    setTimeout(() => {
      setFeedback(null); setMascot('idle');
      if (idx + 1 >= items.length) finish(ns, idx + 1);
      else setIdx(i => i + 1);
    }, 900);
  };

  return (
    <>
      <FloatingStars stars={stars} />
      <FeedbackBadge feedback={feedback} />
      <GameShell title="Story Fill" emoji="📖" timeLeft={timeLeft} maxTime={maxTime} score={score} total={idx} color={C.rose} mascotMood={mascot}>
        <div style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 12 }}>
          Pick the word that fits the story!
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #FFF0F8, #F5F0FF)', border: `2px solid ${C.rose}33`,
          borderRadius: 18, padding: '18px 20px', marginBottom: 20,
          fontSize: 18, lineHeight: 1.8, color: C.navy, fontWeight: 600,
          animation: 'pop 0.3s ease-out',
        }}>
          {current.passage}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shuffledChoices.current.map(w => (
            <button key={w} className="btn-game" onClick={() => handlePick(w)} style={{
              padding: '16px 20px', fontSize: 22, fontWeight: 800, textAlign: 'left',
              border: `3px solid ${C.rose}33`, borderRadius: 14, color: C.navy,
              background: 'linear-gradient(135deg, #fff, #FFF5FB)',
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(233,30,140,0.08)',
            }}>{w}</button>
          ))}
        </div>
      </GameShell>
    </>
  );
}

// ── Read Aloud (ORF) ───────────────────────────────────────────────────────
function ORFGame({ grade, onDone }: { grade: Grade; onDone: (r: ModuleResult) => void }) {
  const passage = ORF_PASSAGES[grade] ?? ORF_PASSAGES[5];
  const stt = useSTT();
  const [phase, setPhase] = useState<'intro' | 'reading' | 'done'>('intro');
  const [timeLeft, setTimeLeft] = useState(65);
  const [manualMode, setManualMode] = useState(!stt.supported);
  const [wordsRead, setWordsRead] = useState('');
  const [errorsInput, setErrorsInput] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const audio = useAudio();
  const maxTime = 65;

  useEffect(() => {
    if (phase !== 'reading') return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t);
          stt.stop();
          setPhase('done');
          return 0;
        }
        if (p <= 11) audio.tick();
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const allTranscript = stt.transcript + ' ' + stt.interim;
  const { correct: liveCorrect, total: totalWords, matched } = scoreORF(passage, allTranscript);
  const passageWords = passage.split(/\s+/);

  const handleStart = () => {
    audio.start();
    stt.reset();
    setErrorCount(0);
    if (!manualMode) stt.start();
    setPhase('reading');
  };

  // Pre-fill error input from tap count when timer ends in manual mode
  useEffect(() => {
    if (phase === 'done' && manualMode) setErrorsInput(String(errorCount));
  }, [phase]);

  const handleSubmit = () => {
    if (manualMode) {
      const wr = parseInt(wordsRead) || 0;
      const err = parseInt(errorsInput) || 0;
      const wrc = Math.max(0, wr - err);
      audio.fanfare();
      onDone({ module: 'orf', score: wrc, total: totalWords, pct: Math.min(100, Math.round((wrc / totalWords) * 100)) });
    } else {
      audio.fanfare();
      onDone({ module: 'orf', score: liveCorrect, total: totalWords, pct: Math.min(100, Math.round((liveCorrect / totalWords) * 100)) });
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '16px 16px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: C.navy }}>🎤 Read Aloud</div>
        {phase === 'reading' && <TimerRing timeLeft={timeLeft} maxTime={maxTime} color={C.mint} />}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Mascot mood={phase === 'done' ? 'excited' : phase === 'reading' ? 'happy' : 'idle'} />
      </div>

      {phase === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          {!manualMode ? (
            <div style={{ background: '#F0FFF4', border: `2px solid ${C.mint}55`, borderRadius: 18, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎤</div>
              <div style={{ fontSize: 15, color: '#444', lineHeight: 1.8 }}>
                Read the passage aloud!<br />
                Words turn <strong style={{ color: '#16A34A' }}>green</strong> as you read them.<br />
                <span style={{ fontSize: 13, color: '#888' }}>Microphone access needed.</span>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FFF8F0', border: `2px solid ${C.saffron}55`, borderRadius: 18, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontSize: 15, color: '#444', lineHeight: 1.7 }}>
                👨‍👩‍👧 <strong>For the parent:</strong> Your child reads aloud.<br />
                You have <strong>65 seconds</strong>. Count errors after.
              </div>
            </div>
          )}
          {stt.supported && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setManualMode(m => !m)} style={{
                background: 'none', border: 'none', color: C.sky, cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
              }}>
                {manualMode ? '🎤 Use microphone instead' : '✏️ Enter manually instead'}
              </button>
            </div>
          )}
          <button className="btn-game" onClick={handleStart} style={{
            background: `linear-gradient(135deg, ${C.mint}, #27AE60)`, color: '#fff',
            border: 'none', borderRadius: 16, padding: '18px 48px',
            fontSize: 20, fontWeight: 900, cursor: 'pointer',
            boxShadow: `0 6px 20px ${C.mint}55`, fontFamily: "'Baloo 2', sans-serif",
          }}>▶ Start Reading!</button>
        </div>
      )}

      {phase === 'reading' && (
        <>
          {/* Passage with live word highlighting */}
          <div style={{
            background: '#fff', border: `2px solid ${C.mint}44`,
            borderRadius: 18, padding: '18px 20px', fontSize: 18, marginBottom: 12,
            display: 'flex', flexWrap: 'wrap', gap: '0.35em', alignItems: 'baseline',
            lineHeight: 2,
          }}>
            {passageWords.map((word, i) => (
              <span key={i} style={{
                borderRadius: 4, padding: '2px 4px',
                background: matched.has(i) ? '#DCFCE7' : 'transparent',
                color: matched.has(i) ? '#16A34A' : C.navy,
                fontWeight: matched.has(i) ? 800 : 500,
                transition: 'background 0.25s, color 0.25s',
              }}>{word}</span>
            ))}
          </div>

          {/* Mic status bar */}
          {!manualMode && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <div style={{ fontSize: 13, color: '#666' }}>{liveCorrect}/{totalWords} words ✓</div>
              <div style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 99,
                background: stt.isListening ? '#F0FFF4' : '#FFF5F5',
                color: stt.isListening ? C.mint : C.rose,
                border: `1px solid ${stt.isListening ? C.mint : C.rose}55`,
              }}>
                {stt.isListening ? '● Listening' : '○ Paused'}
              </div>
            </div>
          )}
          {/* Heard strip */}
          {!manualMode && (stt.transcript || stt.interim) && (
            <div style={{ background: '#F8F8F8', border: '1px solid #E5E7EB', borderRadius: 10, padding: '6px 12px', marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
              🎙 <span style={{ color: C.navy }}>{stt.transcript}</span>
              {stt.interim && <span style={{ color: '#aaa' }}>{stt.interim}</span>}
            </div>
          )}
          {/* Proctor error tap button (manual mode) */}
          {manualMode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <button className="btn-game" onClick={() => setErrorCount(c => c + 1)} style={{
                width: 96, height: 96, borderRadius: '50%', background: C.rose, color: '#fff',
                border: 'none', fontSize: 20, fontWeight: 900, cursor: 'pointer',
                boxShadow: `0 6px 20px ${C.rose}55`, lineHeight: 1.3,
              }}>✗<br /><span style={{ fontSize: 12 }}>Error</span></button>
              <div style={{ fontSize: 14, color: C.rose, fontWeight: 800 }}>
                {errorCount} error{errorCount !== 1 ? 's' : ''} marked
              </div>
              {errorCount > 0 && (
                <button onClick={() => setErrorCount(c => Math.max(0, c - 1))} style={{
                  background: 'none', border: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer',
                }}>↩ undo last</button>
              )}
            </div>
          )}
          {/* Mic error */}
          {stt.error && (
            <div style={{ background: '#FFF5F5', border: `1px solid ${C.rose}44`, borderRadius: 10, padding: '10px 14px', marginTop: 8, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
              {stt.error === 'not-allowed' || stt.error === 'permission-denied'
                ? '🚫 Microphone access was blocked. Please allow mic access in your browser settings, then refresh.'
                : stt.error === 'network'
                ? '📶 Speech recognition needs an internet connection. Switch to manual mode below.'
                : `Mic issue: ${stt.error}.`}{' '}
              <button onClick={() => setManualMode(true)} style={{ color: C.sky, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                Switch to manual mode
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'done' && (() => {
        const wcmAuto = Math.round(liveCorrect * 60 / 65);
        const manualWR = parseInt(wordsRead) || 0;
        const manualErr = parseInt(errorsInput) || 0;
        const wcmManual = Math.round(Math.max(0, manualWR - manualErr) * 60 / 65);
        const benchmark = ORF_BENCHMARK[grade] ?? 139;
        const WCMBadge = ({ wcm }: { wcm: number }) => (
          <div style={{ marginTop: 8, fontSize: 13, color: '#555', lineHeight: 1.8 }}>
            <strong style={{ color: C.navy }}>~{wcm} WCM</strong>
            {' · '}Grade {grade} benchmark: <strong>{benchmark} WCM</strong>
            {' '}
            <span style={{ fontWeight: 800, color: wcm >= benchmark ? C.mint : wcm >= benchmark * 0.7 ? C.gold : C.rose }}>
              {wcm >= benchmark ? '🌟 Above!' : wcm >= benchmark * 0.7 ? '⚡ Approaching' : '💪 Keep practising'}
            </span>
          </div>
        );
        return (
          <div>
            <div style={{ textAlign: 'center', fontSize: 24, marginBottom: 20, animation: 'bounce-in 0.3s' }}>⏱ Time's up!</div>
            {!manualMode ? (
              <>
                <div style={{ background: '#F0FFF4', border: `2px solid ${C.mint}`, borderRadius: 20, padding: '24px', textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 4 }}>🎤 Auto-scored</div>
                  <div style={{ fontSize: 60, fontWeight: 900, color: C.navy, lineHeight: 1 }}>
                    {liveCorrect}<span style={{ fontSize: 20, color: '#888' }}>/{totalWords}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>words read correctly</div>
                  <WCMBadge wcm={wcmAuto} />
                </div>
                <button className="btn-game" onClick={handleSubmit} style={{
                  width: '100%', background: `linear-gradient(135deg, ${C.saffron}, #FF8C42)`,
                  color: '#fff', border: 'none', borderRadius: 16, padding: '18px',
                  fontSize: 18, fontWeight: 900, cursor: 'pointer',
                  fontFamily: "'Baloo 2', sans-serif", boxShadow: `0 6px 20px ${C.saffron}55`,
                }}>See My Report! 🎉</button>
              </>
            ) : (
              <div>
                <div style={{ background: '#FFF8F0', borderRadius: 18, padding: '20px', marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
                    <strong>Parent:</strong> Enter words reached and adjust errors (pre-filled from your taps).
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6, fontWeight: 700 }}>Words reached</label>
                      <input type="number" min={0} max={totalWords} placeholder="e.g. 48" value={wordsRead}
                        onChange={e => setWordsRead(e.target.value)}
                        style={{ width: '100%', padding: '14px', fontSize: 22, border: `2px solid ${C.mint}`, borderRadius: 12, textAlign: 'center', boxSizing: 'border-box', fontWeight: 800 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6, fontWeight: 700 }}>Errors</label>
                      <input type="number" min={0} placeholder="e.g. 2" value={errorsInput}
                        onChange={e => setErrorsInput(e.target.value)}
                        style={{ width: '100%', padding: '14px', fontSize: 22, border: `2px solid ${C.rose}`, borderRadius: 12, textAlign: 'center', boxSizing: 'border-box', fontWeight: 800 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Passage has {totalWords} words</div>
                  {wordsRead && <WCMBadge wcm={wcmManual} />}
                </div>
                <button className="btn-game" onClick={handleSubmit} disabled={!wordsRead}
                  style={{
                    width: '100%', background: wordsRead ? `linear-gradient(135deg, ${C.saffron}, #FF8C42)` : '#E5E7EB',
                    color: wordsRead ? '#fff' : '#aaa', border: 'none', borderRadius: 16,
                    padding: '18px', fontSize: 18, fontWeight: 900, cursor: wordsRead ? 'pointer' : 'default',
                    fontFamily: "'Baloo 2', sans-serif", boxShadow: wordsRead ? `0 6px 20px ${C.saffron}55` : 'none',
                  }}>See My Report! 🎉</button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Module celebration screen ──────────────────────────────────────────────
function ModuleCelebration({ result, onNext, onRetry, isLast }: { result: ModuleResult; onNext: () => void; onRetry: () => void; isLast: boolean }) {
  const audio = useAudio();
  useEffect(() => {
    setTimeout(() => audio.fanfare(), 100);
  }, []);

  const stars = result.pct >= 75 ? 3 : result.pct >= 45 ? 2 : 1;

  return (
    <>
      {stars === 3 && <Confetti />}
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 8, animation: 'bounce-in 0.5s' }}>
          {stars === 3 ? '🏆' : stars === 2 ? '🎯' : '💪'}
        </div>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 28, fontWeight: 900, color: C.navy, marginBottom: 8 }}>
          {stars === 3 ? 'Amazing!' : stars === 2 ? 'Good job!' : 'Keep going!'}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              fontSize: 44, animation: i <= stars ? `pop 0.4s ${i * 0.15}s both` : 'none',
              opacity: i <= stars ? 1 : 0.2,
            }}>⭐</div>
          ))}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginBottom: 32 }}>
          {result.score} out of {result.total} correct!
        </div>
        <button className="btn-game" onClick={onNext} style={{
          background: `linear-gradient(135deg, ${C.saffron}, #FF8C42)`, color: '#fff',
          border: 'none', borderRadius: 18, padding: '18px 48px',
          fontSize: 20, fontWeight: 900, cursor: 'pointer',
          fontFamily: "'Baloo 2', sans-serif", boxShadow: `0 8px 24px ${C.saffron}55`,
          animation: 'glow 2s infinite',
        }}>
          {isLast ? '🎉 See My Report!' : '➡ Next Game!'}
        </button>
        <button onClick={onRetry} style={{
          marginTop: 14, background: 'none', border: 'none', color: '#aaa',
          fontSize: 14, cursor: 'pointer', textDecoration: 'underline',
        }}>↩ Try this game again</button>
      </div>
    </>
  );
}

// ── Reading level helpers ──────────────────────────────────────────────────
function getReadingLevel(pct: number) {
  if (pct >= 75) return { label: 'Confident Reader', emoji: '🌟', color: C.mint, stars: 3 };
  if (pct >= 45) return { label: 'Growing Reader',   emoji: '⚡', color: C.gold, stars: 2 };
  return               { label: 'Emerging Reader',   emoji: '💪', color: C.saffron, stars: 1 };
}

function getBookRec(grade: Grade, pct: number): { name: string; slug: string; emoji: string; desc: string } {
  if (pct >= 75) {
    if (grade >= 4) return { name: 'Internet Safety',  slug: 'internet-safety',  emoji: '🔒', desc: 'Complex real-world themes for confident older readers.' };
    if (grade >= 3) return { name: 'History of India', slug: 'history-india',    emoji: '🏛️', desc: 'Rich vocabulary and fascinating stories — perfect for advanced readers.' };
    return               { name: 'Growth Mindset',    slug: 'growth-mindset',   emoji: '🧠', desc: 'Big ideas and bold language for confident young readers.' };
  }
  if (pct >= 45) {
    if (grade >= 3) return { name: 'Managing Emotions', slug: 'managing-emotions', emoji: '❤️', desc: 'Relatable situations and vocabulary just right for growing readers.' };
    return               { name: 'Bedtime Routines',   slug: 'bedtime-routines',  emoji: '🌙', desc: 'Familiar, comforting themes at just the right reading level.' };
  }
  if (grade >= 2)  return { name: 'Numbers & Maths',  slug: 'numbers-maths',    emoji: '🔢', desc: 'Simple, engaging language that builds reading confidence step by step.' };
  return                  { name: 'Colours & Shapes', slug: 'colours-shapes',   emoji: '🎨', desc: 'Joyful, repetitive language — perfect for building early reading confidence.' };
}

// ── Results data ───────────────────────────────────────────────────────────
type Resource = { label: string; desc: string; url?: string; free: boolean };

const ACTION: Record<Module, {
  title: string;
  weak: string;
  strong: string;
  resources: Resource[];
}> = {
  lnf: {
    title: 'Letter Recognition',
    weak: 'Play "Alphabet Snap" daily — flashcards or a letter app. Label household objects with sticky notes. The goal is instant recognition in under 1 second.',
    strong: 'Great letter knowledge! Move to letter sounds and simple 3-letter words like "cat", "dog", "run".',
    resources: [
      { label: 'Duolingo ABC', desc: 'Free app with letter recognition games — beautifully designed for ages 3–6.', url: 'https://abc.duolingo.com', free: true },
      { label: 'Starfall.com', desc: 'Free website: click letters to hear their sounds and names. Works great on a tablet.', url: 'https://www.starfall.com', free: true },
      { label: 'Sticky-note hunt', desc: 'Label 10 objects at home (door, fan, table). Child reads the label every time they touch the object.', free: true },
    ],
  },
  psf: {
    title: 'Hearing Sounds',
    weak: 'Try "sound counting" in the car — say a word, count sounds on fingers. "cat" = 3 sounds /k/ /a/ /t/. Clapping syllables also helps a lot.',
    strong: 'Excellent phonemic awareness! The best predictor of reading success. Now focus on blending sounds smoothly into words.',
    resources: [
      { label: 'Duolingo ABC', desc: 'The phonics module teaches sound isolation in a fun game format. Free.', url: 'https://abc.duolingo.com', free: true },
      { label: 'Sound counting game', desc: '"I say a word, you hold up fingers for each sound." Play for 5 minutes daily — in the car, at dinner, anywhere.', free: true },
      { label: 'Khan Academy Kids', desc: 'Free app covering phonemic awareness through interactive stories and songs.', url: 'https://learn.khanacademy.org/khan-academy-kids/', free: true },
    ],
  },
  wrf: {
    title: 'Sight Words',
    weak: 'The top 100 sight words make up 50% of all text. 10 words a week via sticky notes around the house. Make it a treasure hunt — find the word in a book!',
    strong: 'Good sight word bank! Try Dolch Grade 2–3 words next. Reading at the "just right" level — 90% known words — builds the most fluency.',
    resources: [
      { label: 'Sight Words Ninja (app)', desc: 'Free app where kids slash sight words with a sword. Covers Dolch and Fry lists. Very motivating.', free: true },
      { label: 'Dolch word list', desc: 'Search "Dolch sight word list Grade 1" — print it free, 100 words. Make flashcards 10 at a time.', free: true },
      { label: 'Scholastic Guided Readers', desc: 'Affordable levelled readers available in India that naturally repeat high-frequency words. ₹150–300 per book.', free: false },
    ],
  },
  maze: {
    title: 'Reading Comprehension',
    weak: 'Read together daily. Pause and ask "why did they do that?" and "what happens next?" Audiobooks while following the text are also very effective.',
    strong: 'Strong comprehension! Try non-fiction and longer chapter books. Ask deeper questions: "What was the main idea? What would you have done differently?"',
    resources: [
      { label: 'Pratham Storyweaver', desc: 'Free Indian stories with comprehension-friendly narratives. Read together and discuss — perfect for building meaning-making.', url: 'https://storyweaver.org.in', free: true },
      { label: 'Epic! (free for schools)', desc: 'Digital library with thousands of books and built-in quizzes. Ask your child\'s school if they have a class code.', url: 'https://www.getepic.com', free: true },
      { label: '"5-finger retell" technique', desc: 'After reading, child holds up one finger per point: Who? Where? Problem? Events? Solution? No app needed — just a hand.', free: true },
    ],
  },
  orf: {
    title: 'Reading Fluency',
    weak: '"Repeated reading" works best — same short passage 3 times in a row. Echo reading (parent reads a sentence, child repeats) builds rhythm and confidence fast.',
    strong: 'Fluent reader! Focus on expression and pace. Try reader\'s theatre — acting out stories with different voices builds advanced fluency and comprehension together.',
    resources: [
      { label: 'Repeated reading (no app needed)', desc: 'Pick any passage. Child reads it 3 times in a row. Time them. Celebrate the improvement — usually 10–20% faster by the third read.', free: true },
      { label: 'Librivox / YouTube read-alouds', desc: 'Free audiobooks. Play while child follows the text. The model of fluent reading trains their internal voice.', url: 'https://librivox.org', free: true },
      { label: 'Pratham Storyweaver (read-aloud mode)', desc: 'Free Indian stories with audio narration — child can listen first, then read along independently.', url: 'https://storyweaver.org.in', free: true },
    ],
  },
};

function getLevel(pct: number) {
  if (pct >= 75) return { label: 'At Benchmark', color: C.mint, emoji: '🌟', stars: 3 };
  if (pct >= 45) return { label: 'Approaching',  color: C.gold, emoji: '⚡', stars: 2 };
  return               { label: 'Needs Support', color: C.rose, emoji: '💪', stars: 1 };
}

function ResultsScreen({ results, childName, grade, onRetake, onBook }: {
  results: ModuleResult[]; childName: string; grade: Grade; onRetake: () => void; onBook: (slug: string) => void;
}) {
  const orfBenchmark = ORF_BENCHMARK[grade] ?? 139;
  const audio = useAudio();
  useEffect(() => { setTimeout(() => audio.fanfare(), 400); }, []);
  const overall = Math.round(results.reduce((s, r) => s + r.pct, 0) / results.length);
  const lvl = getReadingLevel(overall);
  const weak = results.filter(r => r.pct < 60);
  const strong = results.filter(r => r.pct >= 75);
  const book = getBookRec(grade, overall);

  const shareOnWhatsApp = () => {
    const text = `${childName} just completed a Reading Quest! 📚\n\n${lvl.emoji} ${lvl.label} · Grade ${grade} · ${overall}% overall\n\nDiscover your child's reading level free at protago.in/reading-quest`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      {overall >= 75 && <Confetti />}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 60px' }}>

        {/* ── Child reveal card ── */}
        <div style={{
          background: `linear-gradient(135deg, ${lvl.color}22, ${lvl.color}08)`,
          border: `3px solid ${lvl.color}`, borderRadius: 24, padding: '28px 20px',
          textAlign: 'center', marginBottom: 20, animation: 'pop 0.5s ease-out',
        }}>
          <div style={{ fontSize: 72, marginBottom: 4, animation: 'bounce-in 0.5s' }}>{lvl.emoji}</div>
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 28, fontWeight: 900, color: C.navy, margin: '0 0 4px' }}>
            {childName} is a
          </h2>
          <div style={{ fontSize: 26, fontWeight: 900, color: lvl.color, marginBottom: 8 }}>{lvl.label}!</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {[1,2,3].map(i => <span key={i} style={{ fontSize: 32, opacity: i <= lvl.stars ? 1 : 0.15 }}>⭐</span>)}
          </div>
          <div style={{ fontSize: 13, color: '#777' }}>Grade {grade} · {overall}% overall · DIBELS 8th Edition</div>
        </div>

        {/* ── WhatsApp share ── */}
        <button className="btn-game" onClick={shareOnWhatsApp} style={{
          width: '100%', background: '#25D366', color: '#fff', border: 'none',
          borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800,
          cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 8, fontFamily: "'Baloo 2', sans-serif",
          boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share {childName}'s Report on WhatsApp
        </button>

        {/* ── Skills breakdown ── */}
        <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 900, color: C.navy, marginBottom: 14 }}>Skills Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {results.map(r => {
            const l = getLevel(r.pct);
            return (
              <div key={r.module} style={{ background: '#fff', border: `2px solid ${l.color}44`, borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.navy }}>{ACTION[r.module].title}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: l.color, background: `${l.color}18`, padding: '3px 10px', borderRadius: 99 }}>
                    {l.emoji} {l.label}
                  </div>
                </div>
                <div style={{ height: 10, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: `linear-gradient(90deg, ${l.color}, ${l.color}BB)`, borderRadius: 99, transition: 'width 1.5s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  {r.score}/{r.total} correct · {r.pct}%
                  {r.module === 'orf' && (() => {
                    const wcm = Math.round(r.score * 60 / 65);
                    return <span> · <strong style={{ color: C.navy }}>~{wcm} WCM</strong> (benchmark: {orfBenchmark} WCM)</span>;
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Weak areas: home activities + resources ── */}
        {weak.length > 0 && <>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 900, color: C.navy, marginBottom: 14 }}>💪 This Week's Focus</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {weak.map(r => (
              <div key={r.module} style={{ background: '#fff', border: `2px solid ${C.saffron}33`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ background: `${C.saffron}14`, padding: '14px 16px', borderBottom: `1px solid ${C.saffron}22` }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: C.saffron }}>📌 {ACTION[r.module].title}</div>
                  <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginTop: 6 }}>{ACTION[r.module].weak}</div>
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Resources</div>
                  {ACTION[r.module].resources.map((res, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        flexShrink: 0, marginTop: 2, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                        background: res.free ? '#F0FFF4' : '#FFF8F0',
                        color: res.free ? C.mint : C.gold,
                        border: `1px solid ${res.free ? C.mint : C.gold}44`,
                      }}>{res.free ? 'FREE' : 'PAID'}</div>
                      <div>
                        {res.url
                          ? <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 800, fontSize: 13, color: C.navy, textDecoration: 'underline' }}>{res.label}</a>
                          : <span style={{ fontWeight: 800, fontSize: 13, color: C.navy }}>{res.label}</span>
                        }
                        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginTop: 2 }}>{res.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ── Strengths ── */}
        {strong.length > 0 && <>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 900, color: C.navy, marginBottom: 14 }}>🌟 Celebrate These!</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {strong.map(r => (
              <div key={r.module} style={{ background: '#F0FFF4', border: `2px solid ${C.mint}55`, borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ fontWeight: 900, fontSize: 14, color: C.mint, marginBottom: 4 }}>✅ {ACTION[r.module].title}</div>
                <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>{ACTION[r.module].strong}</div>
              </div>
            ))}
          </div>
        </>}

        {/* ── Protago book match ── */}
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #2A5298)`, borderRadius: 20, padding: '22px', color: '#fff', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Your Personalised Book Match</div>
          <div style={{ fontSize: 36, marginBottom: 6 }}>{book.emoji}</div>
          <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 6 }}>{book.name}</div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.7, marginBottom: 16 }}>{book.desc}</div>
          <button className="btn-game" onClick={() => onBook(book.slug)} style={{
            background: `linear-gradient(135deg, ${C.saffron}, #FF8C42)`, color: '#fff',
            border: 'none', borderRadius: 14, padding: '14px 28px',
            fontSize: 15, fontWeight: 900, cursor: 'pointer',
            fontFamily: "'Baloo 2', sans-serif", boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
          }}>See {childName}'s Book →</button>
        </div>

        <button className="btn-game" onClick={onRetake} style={{
          width: '100%', background: 'none', border: `2px solid ${C.saffron}55`,
          borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 800,
          cursor: 'pointer', color: C.saffron, fontFamily: "'Baloo 2', sans-serif",
        }}>🔄 Try Again / Change Grade</button>
      </div>
    </>
  );
}

// ── Module config ──────────────────────────────────────────────────────────
const MODULE_META: Record<Module, { name: string; emoji: string; desc: string; tip: string; color: string }> = {
  lnf: { name: 'Letter Lightning', emoji: '⚡', color: C.gold, desc: 'Name letters as fast as you can!', tip: 'Tap the name of each letter you see.' },
  psf: { name: 'Sound Smasher', emoji: '💥', color: C.purple, desc: 'Smash words into sounds!', tip: 'Tap how many sounds you hear in the word.' },
  wrf: { name: 'Word Flash', emoji: '✨', color: C.saffron, desc: 'Remember the flashing word!', tip: 'A word will flash — then find it from 4 choices.' },
  maze: { name: 'Story Fill', emoji: '📖', color: C.rose, desc: 'Fill in the missing words!', tip: 'Pick the word that makes the most sense in the story.' },
  orf: { name: 'Read Aloud', emoji: '🎤', color: C.mint, desc: 'Read the story out loud!', tip: 'Read clearly — a parent will count any tricky words.' },
};

function getModules(grade: Grade): Module[] {
  if (grade === 1) return ['lnf', 'psf', 'wrf', 'orf'];
  return ['wrf', 'maze', 'orf'];
}

// ── Module intro card ──────────────────────────────────────────────────────
function ModuleIntro({ module, moduleNum, total, onStart }: { module: Module; moduleNum: number; total: number; onStart: () => void }) {
  const m = MODULE_META[module];
  const audio = useAudio();
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>Game {moduleNum} of {total}</div>
      <div style={{
        fontSize: 88, marginBottom: 16,
        animation: 'bounce-in 0.5s ease-out',
        filter: `drop-shadow(0 8px 16px ${m.color}55)`,
      }}>{m.emoji}</div>
      <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 30, fontWeight: 900, color: C.navy, margin: '0 0 8px' }}>
        {m.name}
      </h2>
      <div style={{ fontSize: 17, color: '#666', marginBottom: 8 }}>{m.desc}</div>
      <div style={{
        background: `${m.color}18`, border: `2px solid ${m.color}44`, borderRadius: 14,
        padding: '12px 20px', fontSize: 14, color: '#555', marginBottom: 32, lineHeight: 1.6,
      }}>💡 {m.tip}</div>
      <button className="btn-game" onClick={() => { audio.start(); onStart(); }} style={{
        background: `linear-gradient(135deg, ${m.color}, ${m.color}BB)`, color: '#fff',
        border: 'none', borderRadius: 18, padding: '18px 56px',
        fontSize: 22, fontWeight: 900, cursor: 'pointer',
        fontFamily: "'Baloo 2', sans-serif", boxShadow: `0 8px 24px ${m.color}55`,
        animation: 'glow 2s infinite',
      }}>Let's Go! {m.emoji}</button>
    </div>
  );
}

// ── Parent brief screen ────────────────────────────────────────────────────
function ParentBriefScreen({ childName, grade, onStart }: { childName: string; grade: Grade; onStart: () => void }) {
  const audio = useAudio();
  const modules = getModules(grade);
  const tips = [
    { emoji: '🗣️', title: 'What to tell your child', body: `"We're going to play a reading game with Ollie the owl — he needs your help!"` },
    { emoji: '🪑', title: 'Sit together', body: 'Stay next to them. Cheer when words turn green. Your presence makes all the difference.' },
    { emoji: '🎤', title: 'For the Read Aloud game', body: 'Tap the big red ✗ button each time your child stumbles or skips a word. The mic tracks the rest.' },
  ];
  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '32px 20px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>👨‍👩‍👧</div>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 26, fontWeight: 900, color: C.navy, margin: '0 0 6px' }}>
          Quick note for you
        </h2>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Before {childName} starts — 30 seconds</p>
      </div>
      {tips.map(({ emoji, title, body }) => (
        <div key={title} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 12, display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>{emoji}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.navy, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{body}</div>
          </div>
        </div>
      ))}
      <div style={{ background: `${C.saffron}12`, border: `2px solid ${C.saffron}33`, borderRadius: 14, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#666', textAlign: 'center' }}>
        ⏱ About <strong>8 minutes</strong> · {modules.length} games · Grade {grade}
      </div>
      <button className="btn-game" onClick={() => { audio.start(); onStart(); }} style={{
        width: '100%', background: `linear-gradient(135deg, ${C.saffron}, #FF8C42)`, color: '#fff',
        border: 'none', borderRadius: 18, padding: '18px', fontSize: 20, fontWeight: 900,
        cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: `0 8px 24px ${C.saffron}55`,
        animation: 'glow 2s infinite',
      }}>Ready — Let's Go! 🚀</button>
    </div>
  );
}

// ── Landing ────────────────────────────────────────────────────────────────
function LandingScreen({ onStart }: { onStart: (grade: Grade, name: string) => void }) {
  const [grade, setGrade] = useState<Grade>(1);
  const [name, setName] = useState('');
  const audio = useAudio();

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '32px 20px 60px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 4, animation: 'pulse 2s infinite' }}>🦉</div>
      <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 34, fontWeight: 900, color: C.navy, margin: '0 0 8px' }}>
        Reading Quest
      </h1>
      <p style={{ color: '#666', fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
        Find your child's perfect book —<br />
        and exactly what they need to read better.
      </p>

      <div style={{ background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20, textAlign: 'left' }}>
        <label style={{ fontWeight: 800, fontSize: 14, color: C.navy, display: 'block', marginBottom: 8 }}>
          ✏️ Child's Name
        </label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Arjun" onFocus={() => audio.click()}
          style={{
            width: '100%', padding: '14px 16px', fontSize: 20, fontWeight: 700,
            border: `2px solid ${name ? C.saffron : '#E5E7EB'}`, borderRadius: 14,
            boxSizing: 'border-box', outline: 'none', fontFamily: "'Baloo 2', sans-serif",
            transition: 'border-color 0.2s',
          }} />

        <label style={{ fontWeight: 800, fontSize: 14, color: C.navy, display: 'block', margin: '20px 0 12px' }}>
          🎓 School Grade
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {([1,2,3,4,5] as Grade[]).map(g => (
            <button key={g} className="btn-game" onClick={() => { setGrade(g); audio.click(); }} style={{
              flex: '1 1 auto', padding: '14px 0', fontSize: 17, fontWeight: 900,
              border: `3px solid ${grade === g ? C.saffron : '#E5E7EB'}`,
              borderRadius: 16, cursor: 'pointer',
              background: grade === g ? `linear-gradient(135deg, ${C.saffron}22, ${C.saffron}0A)` : '#F9FAFB',
              color: grade === g ? C.saffron : '#999',
              boxShadow: grade === g ? `0 4px 14px ${C.saffron}33` : 'none',
            }}>Grade {g}</button>
          ))}
        </div>
      </div>

      {/* Mini preview of games */}
      <div style={{ background: '#F0F4FF', borderRadius: 16, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: C.navy, marginBottom: 10 }}>🎮 Games you'll play:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {getModules(grade).map(m => {
            const meta = MODULE_META[m];
            return (
              <div key={m} style={{ background: `${meta.color}22`, border: `1.5px solid ${meta.color}44`, borderRadius: 99, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: meta.color }}>
                {meta.emoji} {meta.name}
              </div>
            );
          })}
        </div>
      </div>

      <button className="btn-game" onClick={() => name.trim() && onStart(grade, name.trim())}
        disabled={!name.trim()} style={{
          width: '100%', padding: '18px',
          background: name.trim() ? `linear-gradient(135deg, ${C.saffron}, #FF8C42)` : '#E5E7EB',
          color: name.trim() ? '#fff' : '#aaa',
          border: 'none', borderRadius: 18, fontSize: 20, fontWeight: 900, cursor: name.trim() ? 'pointer' : 'default',
          fontFamily: "'Baloo 2', sans-serif", boxShadow: name.trim() ? `0 8px 24px ${C.saffron}55` : 'none',
          animation: name.trim() ? 'glow 2s infinite' : 'none',
        }}>Start Adventure! 🚀</button>
      <p style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>Based on DIBELS 8th Edition · University of Oregon</p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export function ReadingQuestPage() {
  const params = new URLSearchParams(window.location.search);
  const testModule = params.get('module') as Module | null;

  const [phase, setPhase] = useState<'landing' | 'brief' | 'intro' | 'game' | 'celebrate' | 'results'>(
    testModule ? 'game' : 'landing'
  );
  const [grade, setGrade] = useState<Grade>((parseInt(params.get('grade') || '1') as Grade) || 1);
  const [childName, setChildName] = useState(params.get('name') || 'Test');
  const [modules, setModules] = useState<Module[]>(testModule ? [testModule] : []);
  const [modIdx, setModIdx] = useState(0);
  const [results, setResults] = useState<ModuleResult[]>([]);
  const [lastResult, setLastResult] = useState<ModuleResult | null>(null);

  const currentMod = modules[modIdx];

  const handleStart = (g: Grade, name: string) => {
    setGrade(g); setChildName(name);
    setModules(getModules(g)); setModIdx(0); setResults([]);
    setPhase('brief');
  };

  const handleModuleDone = (r: ModuleResult) => {
    setResults(prev => [...prev, r]);
    setLastResult(r);
    setPhase('celebrate');
  };

  const handleNextModule = () => {
    const next = modIdx + 1;
    if (next >= modules.length) { setPhase('results'); }
    else { setModIdx(next); setPhase('intro'); }
  };

  const handleRetryModule = () => {
    setResults(prev => prev.slice(0, -1)); // remove the last (current module's) result
    setPhase('intro');
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Baloo 2', Nunito, sans-serif" }}>
      {/* Top bar */}
      {phase !== 'landing' && phase !== 'brief' && phase !== 'results' && (
        <div style={{
          background: '#fff', borderBottom: '1px solid #F0F0F0', padding: '10px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: C.navy }}>🦉 {childName} · Grade {grade}</div>
          {modules.length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {modules.map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: i < modIdx ? C.mint : i === modIdx ? C.saffron : '#E5E7EB',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {phase === 'landing' && <LandingScreen onStart={handleStart} />}
      {phase === 'brief' && <ParentBriefScreen childName={childName} grade={grade} onStart={() => setPhase('intro')} />}
      {phase === 'intro' && currentMod && (
        <ModuleIntro module={currentMod} moduleNum={modIdx + 1} total={modules.length} onStart={() => setPhase('game')} />
      )}
      {phase === 'game' && currentMod === 'lnf' && <LNFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'psf' && <PSFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'wrf' && <WRFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'maze' && <MazeGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'orf' && <ORFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'celebrate' && lastResult && (
        <ModuleCelebration result={lastResult} onNext={handleNextModule} onRetry={handleRetryModule} isLast={modIdx + 1 >= modules.length} />
      )}
      {phase === 'results' && (
        <ResultsScreen results={results} childName={childName} grade={grade} onRetake={() => setPhase('landing')} onBook={slug => { window.location.href = `/theme/${slug}`; }} />
      )}
    </div>
  );
}

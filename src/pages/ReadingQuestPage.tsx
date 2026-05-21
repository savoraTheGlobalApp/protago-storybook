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

// ── ORF scoring ─────────────────────────────────────────────────────────────
// Window-based alignment: if a transcript word doesn't match the current passage
// word, look ahead SKIP words in the passage. If found → passage word was skipped
// (advance pi). If not found → transcript word was misrecognized (advance ti).
// This prevents one bad word from breaking all subsequent matches.
function scoreORF(passageText: string, transcriptText: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const pWords = passageText.split(/\s+/).filter(Boolean);
  const pNorm = pWords.map(norm);
  const tNorm = transcriptText.split(/\s+/).map(norm).filter(Boolean);
  const matched = new Set<number>();
  let pi = 0, ti = 0;
  const SKIP = 5;
  while (pi < pNorm.length && ti < tNorm.length) {
    if (pNorm[pi] === tNorm[ti]) {
      matched.add(pi); pi++; ti++;
    } else {
      let foundAhead = false;
      for (let w = 1; w <= SKIP && pi + w < pNorm.length; w++) {
        if (pNorm[pi + w] === tNorm[ti]) { foundAhead = true; break; }
      }
      if (foundAhead) pi++; // child skipped this passage word
      else ti++;            // this transcript word is a misrecognition
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
  { word: 'sun', sounds: ['s','u','n'], count: 3 },
  { word: 'for', sounds: ['f','or'], count: 2 },
  { word: 'bit', sounds: ['b','i','t'], count: 3 },
  { word: 'ask', sounds: ['a','s','k'], count: 3 },
  { word: 'ball', sounds: ['b','o','l'], count: 3 },
  { word: 'wave', sounds: ['w','A','v'], count: 3 },
  { word: 'bring', sounds: ['b','r','i','ng'], count: 4 },
  { word: 'soft', sounds: ['s','o','f','t'], count: 4 },
  { word: 'drop', sounds: ['d','r','o','p'], count: 4 },
  { word: 'stand', sounds: ['s','t','a','n','d'], count: 5 },
];

const NWF_BY_GRADE: Record<number, string[]> = {
  1: ['tib','rep','hab','com','tep','tut','nup','sep','dat','nen','hon','yan','nop','sug','teg','nug'],
  2: ['tud','neg','sut','gan','fom','hode','tur','pide','tage','hime','lome','surp','hage','mide','vem','sish'],
  3: ['nibe','dort','corm','nade','nork','rame','dern','dant','flin','thag','dorn','gop','mard','tirk','fime','prab'],
};

const WRF_BY_GRADE: Record<number, string[]> = {
  1: ['no','they','if','one','for','there','help','came','stop','first','note','head','nice','line','stay','turn','said','walk','play','sing'],
  2: ['did','going','point','over','time','made','still','write','nearly','seen','saying','bear','need','say','picture','foot','best','blue','drink','leader'],
  3: ['further','front','station','deep','powerful','double','meaning','quick','answer','behind','happy','doctor','drive','daily','morning','straight','waiting','circle','himself','safety'],
};

const MAZE_BY_GRADE: Record<number, { passage: string; choices: string[]; answer: string }[]> = {
  2: [
    { passage: 'Cindy and Anne were on the soccer _____ and liked to practice together.', choices: ['team','food','rain'], answer: 'team' },
    { passage: 'They set up a net in the field for a _____.', choices: ['goal','table','shoe'], answer: 'goal' },
    { passage: 'When the sun was shining they got hot and _____.', choices: ['thirsty','happy','tired'], answer: 'thirsty' },
    { passage: 'Soccer is a hard game. You do plenty of fast _____ when you play.', choices: ['running','eating','sleeping'], answer: 'running' },
    { passage: 'Kicking the ball takes strength and _____.', choices: ['practice','colour','weather'], answer: 'practice' },
    { passage: 'After the game, they sat down on the _____ to rest.', choices: ['grass','cloud','music'], answer: 'grass' },
  ],
  3: [
    { passage: 'The library was special for Maya. She visited every _____ after school.', choices: ['week','apple','river'], answer: 'week' },
    { passage: 'She always chose books about _____. Wolves, elephants, dolphins — she loved them all.', choices: ['animals','colours','numbers'], answer: 'animals' },
    { passage: 'Maya found a book she had never seen before. She picked it up and began to _____.', choices: ['read','dance','swim'], answer: 'read' },
    { passage: 'She forgot all about going home. When the librarian said it was closing time, Maya was _____ to leave.', choices: ['sad','loud','early'], answer: 'sad' },
    { passage: 'She checked out three books and _____ them home carefully in her bag.', choices: ['carried','painted','dropped'], answer: 'carried' },
    { passage: 'That night she read until her mum turned off the _____.', choices: ['light','water','table'], answer: 'light' },
  ],
};

const ORF_PASSAGES: Record<number, string> = {
  1: `I have a pond in my yard and there are lots of fish in it. There are lights in the pond. They light up the yard at night. My grandpa helped my dad build this pond many years ago. They used a lot of tools to make a big hole in the ground. My dad said it was hard work, but he is happy he did it.`,
  2: `The church on our street has a big parking lot. On a patch of grass at one end is a pear tree. The church lot and its tree are our playground. Most days there are no cars in the lot. On those days, my brother and I ride our bikes around and around. But our favourite thing is to climb the church pear tree.`,
  3: `Maria loved the night sky more than anything else. Every evening she would drag her blanket outside and lie on the grass, looking up at the stars. Her grandfather had taught her the names of the constellations when she was small. Now she could find them herself — Orion, the Big Dipper, the bright star Sirius.`,
};

// ── Timers by grade ────────────────────────────────────────────────────────
const TIMERS: Record<string, Record<number, number>> = {
  lnf: { 1: 90, 2: 75, 3: 60 },
  psf: { 1: 80, 2: 65, 3: 50 },
  nwf: { 1: 90, 2: 75, 3: 65 },
  wrf: { 1: 90, 2: 75, 3: 65 },
  maze: { 1: 120, 2: 100, 3: 90 },
  orf: { 1: 65, 2: 65, 3: 65 },
};

// ── Types ──────────────────────────────────────────────────────────────────
type Grade = 1 | 2 | 3;
type Module = 'lnf' | 'psf' | 'nwf' | 'wrf' | 'maze' | 'orf';
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

// ── Alien Words ────────────────────────────────────────────────────────────
function NWFGame({ grade, onDone }: { grade: Grade; onDone: (r: ModuleResult) => void }) {
  const bank = NWF_BY_GRADE[grade];
  const items = useRef(shuffle(bank).slice(0, 10));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [mascot, setMascot] = useState<'idle' | 'happy' | 'sad' | 'excited'>('idle');
  const audio = useAudio();
  const { stars, spawn } = useStars();
  const maxTime = TIMERS.nwf[grade];

  const finish = useCallback((s: number, i: number) => {
    if (done) return; setDone(true); audio.fanfare();
    onDone({ module: 'nwf', score: s, total: Math.max(i, 1), pct: Math.round((s / Math.max(i, 1)) * 100) });
  }, [done]);

  const timeLeft = useGameTimer(maxTime, () => finish(score, idx), !done);
  const current = items.current[idx];

  function makeWrong(w: string): string {
    const v = 'aeiou'; const c = 'bdfghjklmnprstvwyz';
    return w.split('').map(ch => Math.random() > 0.55 ? (v.includes(ch) ? v[Math.floor(Math.random()*v.length)] : c.includes(ch) ? c[Math.floor(Math.random()*c.length)] : ch) : ch).join('');
  }

  const opts = useRef<string[]>([]);
  if (!opts.current.length || !opts.current.includes(current)) {
    let w1 = makeWrong(current), w2 = makeWrong(current);
    while (w1 === current) w1 = makeWrong(current);
    while (w2 === current || w2 === w1) w2 = makeWrong(current);
    opts.current = shuffle([current, w1, w2]);
  }

  const handlePick = (w: string) => {
    if (feedback || done) return;
    const correct = w === current;
    const ns = correct ? score + 1 : score;
    if (correct) { setScore(ns); audio.correct(); spawn('👽'); setMascot('happy'); }
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
      <GameShell title="Alien Words" emoji="👽" timeLeft={timeLeft} maxTime={maxTime} score={score} total={idx} color={C.sky} mascotMood={mascot}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>The alien wants you to read its word!</div>
          <div style={{ fontSize: 13, color: C.sky, marginBottom: 10, fontWeight: 600 }}>👽 "How do you say this?"</div>
          <div style={{
            fontSize: 72, fontWeight: 900, color: C.navy, letterSpacing: 8, fontFamily: 'monospace',
            background: `${C.sky}18`, borderRadius: 20, padding: '12px 32px',
            display: 'inline-block', animation: 'pop 0.3s ease-out',
          }}>{current}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {opts.current.map(w => (
            <button key={w} className="btn-game" onClick={() => handlePick(w)} style={{
              padding: '18px', fontSize: 30, fontWeight: 900, fontFamily: 'monospace',
              letterSpacing: 6, color: C.navy, textAlign: 'center',
              border: `3px solid ${C.sky}44`, borderRadius: 16,
              background: 'linear-gradient(135deg, #fff, #F0FBFF)',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,188,212,0.15)',
            }}>{w}</button>
          ))}
        </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {opts.current.map(w => (
            <button key={w} className="btn-game" onClick={() => handlePick(w)} style={{
              padding: '16px 8px', fontSize: 20, fontWeight: 800, color: C.navy,
              border: `3px solid ${C.saffron}44`, borderRadius: 14,
              background: 'linear-gradient(135deg, #fff, #FFFBF5)',
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(255,107,53,0.1)',
            }}>{w}</button>
          ))}
        </div>
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

  const handlePick = (w: string) => {
    if (feedback || done) return;
    const correct = w === current.answer;
    const ns = correct ? score + 1 : score;
    if (correct) { setScore(ns); audio.correct(); spawn('📖'); setMascot('happy'); }
    else { audio.wrong(); setMascot('sad'); }
    setFeedback(correct ? 'correct' : 'wrong');
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
          {current.choices.map(w => (
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
  const passage = ORF_PASSAGES[grade];
  const stt = useSTT();
  const [phase, setPhase] = useState<'intro' | 'reading' | 'done'>('intro');
  const [timeLeft, setTimeLeft] = useState(65);
  const [manualMode, setManualMode] = useState(!stt.supported);
  const [wordsRead, setWordsRead] = useState('');
  const [errorsInput, setErrorsInput] = useState('');
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
    if (!manualMode) stt.start();
    setPhase('reading');
  };

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
              <div style={{ fontSize: 13, color: '#666' }}>
                {liveCorrect}/{totalWords} words ✓
              </div>
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
          {/* Debug: raw transcript so user can see what Chrome is hearing */}
          {(stt.transcript || stt.interim) && (
            <div style={{ background: '#F8F8F8', border: '1px solid #E5E7EB', borderRadius: 10, padding: '6px 12px', marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
              🎙 Heard: <span style={{ color: C.navy }}>{stt.transcript}</span>
              {stt.interim && <span style={{ color: '#aaa' }}>{stt.interim}</span>}
            </div>
          )}
          {stt.error && (
            <div style={{ color: C.rose, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Mic error: {stt.error}.{' '}
              <button onClick={() => setManualMode(true)} style={{ color: C.sky, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                Switch to manual
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'done' && (
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
                  <strong>Parent:</strong> Enter how many words your child read and how many errors.
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 6, fontWeight: 700 }}>Words read</label>
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
                <div style={{ fontSize: 12, color: '#aaa' }}>Passage has {totalWords} words</div>
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
      )}
    </div>
  );
}

// ── Module celebration screen ──────────────────────────────────────────────
function ModuleCelebration({ result, onNext, isLast }: { result: ModuleResult; onNext: () => void; isLast: boolean }) {
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
      </div>
    </>
  );
}

// ── Results ────────────────────────────────────────────────────────────────
const ACTION: Record<Module, { title: string; weak: string; strong: string }> = {
  lnf: {
    title: 'Letter Recognition',
    weak: 'Play "Alphabet Snap" daily — flashcards or a letter app. Label household objects with sticky notes. The goal is instant recognition in under 1 second.',
    strong: 'Great letter knowledge! Move to practising letter sounds and simple 3-letter words like "cat", "dog", "run".',
  },
  psf: {
    title: 'Hearing Sounds',
    weak: 'Try "sound counting" in the car — say a word, count sounds on fingers. "cat" = 3 sounds. Clapping syllables also helps a lot.',
    strong: 'Excellent phonemic awareness! The single best predictor of reading success. Now focus on blending sounds smoothly into words.',
  },
  nwf: {
    title: 'Phonics & Decoding',
    weak: 'Focus on word families: -at, -an, -it, -og. Make rhyming card sets. Read decodable books (not just picture books) — look for "Level 1 Readers".',
    strong: 'Solid phonics! Introduce digraphs (sh, ch, th) and blends (sl, br, tr). Oxford Reading Tree Level 3+ is a great next step.',
  },
  wrf: {
    title: 'Sight Words',
    weak: 'The top 100 sight words make up 50% of all text. 10 words a week via sticky notes around the house. Make it a treasure hunt — find the word in a book!',
    strong: 'Good sight word bank! Try Dolch Grade 2–3 words next. Reading at the "just right" level — 90% known words — builds the most fluency.',
  },
  maze: {
    title: 'Reading Comprehension',
    weak: 'Read together daily. Pause and ask "why did they do that?" and "what happens next?" Audiobooks while following the text is also very effective.',
    strong: 'Strong comprehension! Try non-fiction and longer chapter books. Ask deeper questions: "What was the main idea? What would you have done differently?"',
  },
  orf: {
    title: 'Reading Fluency',
    weak: '"Repeated reading" works best — read the same short book 3 times in a row. Echo reading (parent reads a sentence, child repeats) builds rhythm and confidence.',
    strong: 'Fluent reader! Focus on expression and pace. Try reader\'s theatre — acting out stories with different voices builds advanced fluency and comprehension together.',
  },
};

function getLevel(pct: number) {
  if (pct >= 75) return { label: 'At Benchmark', color: C.mint, emoji: '🌟', stars: 3 };
  if (pct >= 45) return { label: 'Approaching', color: C.gold, emoji: '⚡', stars: 2 };
  return { label: 'Needs Support', color: C.rose, emoji: '💪', stars: 1 };
}

function ResultsScreen({ results, childName, grade, onRetake }: {
  results: ModuleResult[]; childName: string; grade: Grade; onRetake: () => void;
}) {
  const audio = useAudio();
  useEffect(() => { setTimeout(() => audio.fanfare(), 400); }, []);
  const overall = Math.round(results.reduce((s, r) => s + r.pct, 0) / results.length);
  const lvl = getLevel(overall);
  const weak = results.filter(r => r.pct < 60);
  const strong = results.filter(r => r.pct >= 75);

  return (
    <>
      {overall >= 75 && <Confetti />}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 16px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 64, animation: 'bounce-in 0.5s' }}>📊</div>
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 26, fontWeight: 900, color: C.navy, margin: '8px 0 4px' }}>
            {childName}'s Reading Report
          </h2>
          <div style={{ fontSize: 13, color: '#888' }}>Grade {grade} Assessment · DIBELS 8th Edition</div>
        </div>

        {/* Overall */}
        <div style={{
          background: `linear-gradient(135deg, ${lvl.color}22, ${lvl.color}0A)`,
          border: `3px solid ${lvl.color}`, borderRadius: 22, padding: '24px', textAlign: 'center', marginBottom: 24,
          animation: 'pop 0.5s ease-out',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 4 }}>Overall Score</div>
          <div style={{ fontSize: 72, fontWeight: 900, color: lvl.color, lineHeight: 1 }}>{overall}%</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '8px 0' }}>
            {[1,2,3].map(i => <span key={i} style={{ fontSize: 28, opacity: i <= lvl.stars ? 1 : 0.2 }}>⭐</span>)}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: lvl.color }}>{lvl.emoji} {lvl.label}</div>
        </div>

        {/* Skills */}
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
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{r.score}/{r.total} correct · {r.pct}%</div>
              </div>
            );
          })}
        </div>

        {/* Action items */}
        {weak.length > 0 && <>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 900, color: C.navy, marginBottom: 14 }}>💪 This Week's Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {weak.map(r => (
              <div key={r.module} style={{ background: '#FFF8F0', border: `2px solid ${C.saffron}55`, borderRadius: 16, padding: '16px' }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: C.saffron, marginBottom: 8 }}>📌 {ACTION[r.module].title}</div>
                <div style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>{ACTION[r.module].weak}</div>
              </div>
            ))}
          </div>
        </>}

        {strong.length > 0 && <>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 900, color: C.navy, marginBottom: 14 }}>🌟 Celebrate These!</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {strong.map(r => (
              <div key={r.module} style={{ background: '#F0FFF4', border: `2px solid ${C.mint}55`, borderRadius: 16, padding: '16px' }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: C.mint, marginBottom: 8 }}>✅ {ACTION[r.module].title}</div>
                <div style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>{ACTION[r.module].strong}</div>
              </div>
            ))}
          </div>
        </>}

        {/* Book rec */}
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #2A5298)`, borderRadius: 20, padding: '22px', color: '#fff', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
          <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 10 }}>Personalised Book Match</div>
          <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.7 }}>
            {overall >= 75
              ? `${childName} is a confident reader! We'd recommend "History of India" or "Growth Mindset" — rich vocabulary stories that challenge and delight.`
              : overall >= 45
              ? `${childName} is building great foundations. "Bedtime Routines" or "Sharing & Sorry" would be a perfect match — familiar themes at just the right level.`
              : `${childName} is on the journey! "Colours & Shapes" or "Numbers & Maths" uses simple, repetitive language that builds reading confidence through joy.`}
          </div>
        </div>

        <button className="btn-game" onClick={onRetake} style={{
          width: '100%', background: `linear-gradient(135deg, ${C.saffron}, #FF8C42)`,
          color: '#fff', border: 'none', borderRadius: 18, padding: '18px',
          fontSize: 17, fontWeight: 900, cursor: 'pointer',
          fontFamily: "'Baloo 2', sans-serif", boxShadow: `0 6px 20px ${C.saffron}55`,
        }}>🔄 Try Again / Change Grade</button>
      </div>
    </>
  );
}

// ── Module config ──────────────────────────────────────────────────────────
const MODULE_META: Record<Module, { name: string; emoji: string; desc: string; tip: string; color: string }> = {
  lnf: { name: 'Letter Lightning', emoji: '⚡', color: C.gold, desc: 'Name letters as fast as you can!', tip: 'Tap the name of each letter you see.' },
  psf: { name: 'Sound Smasher', emoji: '💥', color: C.purple, desc: 'Smash words into sounds!', tip: 'Tap how many sounds you hear in the word.' },
  nwf: { name: 'Alien Words', emoji: '👽', color: C.sky, desc: 'Help the alien read its language!', tip: 'Pick the right way to read the made-up word.' },
  wrf: { name: 'Word Flash', emoji: '✨', color: C.saffron, desc: 'Remember the flashing word!', tip: 'A word will flash — then find it from 4 choices.' },
  maze: { name: 'Story Fill', emoji: '📖', color: C.rose, desc: 'Fill in the missing words!', tip: 'Pick the word that makes the most sense in the story.' },
  orf: { name: 'Read Aloud', emoji: '🎤', color: C.mint, desc: 'Read the story out loud!', tip: 'Read clearly — a parent will count any tricky words.' },
};

function getModules(grade: Grade): Module[] {
  return grade === 1 ? ['lnf', 'psf', 'nwf', 'wrf', 'orf'] : ['nwf', 'wrf', 'maze', 'orf'];
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
        A fun 8-minute reading adventure.<br />
        Discover exactly what your child knows — and what to do next!
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
        <div style={{ display: 'flex', gap: 10 }}>
          {([1,2,3] as Grade[]).map(g => (
            <button key={g} className="btn-game" onClick={() => { setGrade(g); audio.click(); }} style={{
              flex: 1, padding: '16px 0', fontSize: 17, fontWeight: 900,
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

  const [phase, setPhase] = useState<'landing' | 'intro' | 'game' | 'celebrate' | 'results'>(
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
    setPhase('intro');
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

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Baloo 2', Nunito, sans-serif" }}>
      {/* Top bar */}
      {phase !== 'landing' && phase !== 'results' && (
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
      {phase === 'intro' && currentMod && (
        <ModuleIntro module={currentMod} moduleNum={modIdx + 1} total={modules.length} onStart={() => setPhase('game')} />
      )}
      {phase === 'game' && currentMod === 'lnf' && <LNFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'psf' && <PSFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'nwf' && <NWFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'wrf' && <WRFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'maze' && <MazeGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'game' && currentMod === 'orf' && <ORFGame grade={grade} onDone={handleModuleDone} />}
      {phase === 'celebrate' && lastResult && (
        <ModuleCelebration result={lastResult} onNext={handleNextModule} isLast={modIdx + 1 >= modules.length} />
      )}
      {phase === 'results' && (
        <ResultsScreen results={results} childName={childName} grade={grade} onRetake={() => setPhase('landing')} />
      )}
    </div>
  );
}

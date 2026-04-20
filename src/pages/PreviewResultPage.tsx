import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const C = {
  saffron: '#FF6B35',
  gold:    '#F7B731',
  navy:    '#1A1A2E',
  gray:    '#555555',
  lgray:   '#999999',
};

const WAITING_LINES = [
  (name: string) => `Placing ${name} inside the story…`,
  (name: string) => `Our AI is illustrating ${name} right now…`,
  (_name: string) => `Painting each scene with care…`,
  (name: string) => `Making ${name} the hero of every page…`,
  (_name: string) => `Almost there — the best things take a moment…`,
  (name: string) => `${name}'s adventure is coming to life…`,
];

function ShimmerCard() {
  return (
    <div style={{
      width: '100%', aspectRatio: '16/9', borderRadius: 16,
      background: 'linear-gradient(90deg, #F0EEE8 0%, #E8E4DC 40%, #F0EEE8 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s infinite linear',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function SceneCard({ url, index }: { url: string | null; index: number }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', background: '#F0EEE8' }}>
        {!loaded && <div style={{ position: 'absolute', inset: 0 }}><ShimmerCard /></div>}
        {url && (
          <motion.img
            src={url}
            alt={`Preview scene ${index + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            onLoad={() => setLoaded(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
        Scene {index + 1}
      </div>
    </div>
  );
}

function FeedbackWidget({ jobId, API_BASE }: { jobId: string; API_BASE: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/preview/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, rating, comment }),
      });
    } catch { /* non-critical */ }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ fontSize: 22, marginBottom: 6 }}>🙏</p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, margin: 0 }}>
          Thanks for your feedback!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        How did we do?
      </p>

      {/* Stars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 32, lineHeight: 1,
              color: star <= (hovered || rating) ? '#F7B731' : 'rgba(255,255,255,0.2)',
              transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
              transition: 'color 0.15s, transform 0.15s' }}>
            ★
          </button>
        ))}
      </div>

      {/* Optional comment */}
      {rating > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.2 }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Anything else to share? (optional)"
            rows={2}
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 10,
              padding: '10px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button onClick={handleSubmit} disabled={submitting}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 50,
              color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 28px', cursor: 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: 'inherit' }}>
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Progress bar + story teaser ─────────────────────────────────────────────
const TOTAL_SECS = 120;

const STORY_LINES = [
  (n: string) => `${n} stood at the edge of the enchanted forest, heart pounding with excitement…`,
  (n: string) => `The pages began to glow as the story recognized ${n} and only ${n}…`,
  (n: string) => `"This is my adventure," whispered ${n}, eyes wide with wonder…`,
  (n: string) => `Every illustration was painting itself — just for ${n}…`,
  (n: string) => `The hero of this story? ${n}. The magic? Already happening…`,
  (n: string) => `Somewhere in the story, ${n} smiled. Because this moment was theirs alone…`,
];

function StoryTeaser({ childName }: { childName: string }) {
  const [progress, setProgress] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const charIdxRef = useRef(0);
  const startRef = useRef(Date.now());

  // Smooth progress bar over TOTAL_SECS
  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      // Clamp raw to [0,1] so negative base never hits Math.pow
      const raw = Math.min(1, elapsed / TOTAL_SECS);
      const eased = Math.min(0.95, 1 - Math.pow(1 - raw, 2.2));
      setProgress(eased);
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, []);

  // Cycle story lines every 8s
  useEffect(() => {
    const id = setInterval(() => {
      setLineIdx(i => (i + 1) % STORY_LINES.length);
      charIdxRef.current = 0;
      setDisplayed('');
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Typewriter per character
  useEffect(() => {
    const full = STORY_LINES[lineIdx](childName);
    charIdxRef.current = 0;
    setDisplayed('');
    const id = setInterval(() => {
      charIdxRef.current++;
      setDisplayed(full.slice(0, charIdxRef.current));
      if (charIdxRef.current >= full.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [lineIdx, childName]);

  const pct = Math.round(progress * 100);

  return (
    <div style={{ width: '100%', marginBottom: 28 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})` }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.gold, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
      </div>

      {/* Typewriter story line */}
      <div style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
        <p style={{
          fontFamily: "'Baloo 2', sans-serif", fontWeight: 700,
          fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
          color: 'rgba(255,255,255,0.75)', textAlign: 'center',
          lineHeight: 1.5, margin: 0, letterSpacing: 0.2,
        }}>
          {displayed}
          <motion.span
            animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
            style={{ display: 'inline-block', width: 2, height: '1em', background: C.saffron, verticalAlign: 'text-bottom', marginLeft: 2, borderRadius: 1 }}
          />
        </p>
      </div>
    </div>
  );
}

// ── Mini storybook runner game ──────────────────────────────────────────────
const CHAR_X = 55;
const CHAR_SIZE = 34;
const OBS_SIZE = 30;
const GRAVITY = 0.45;
const JUMP_VEL = -12;
const BASE_SPEED = 2.8;
const OBS_EMOJIS = ['📚', '✏️', '🌟', '🎨', '🦋'];

function StoryGame({ childName }: { childName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'idle' | 'playing'>('idle');
  const [score, setScore] = useState(0);

  const gs = useRef({
    charBottom: 0, velY: 0, onGround: true,
    frame: 0, nextObsIn: 70,
    obstacles: [] as { el: HTMLDivElement; x: number }[],
    rafId: 0, gameW: 400,
  });

  const clearObstacles = useCallback(() => {
    gs.current.obstacles.forEach(o => o.el.remove());
    gs.current.obstacles = [];
  }, []);

  const startGame = useCallback(() => {
    const s = gs.current;
    clearObstacles();
    Object.assign(s, { charBottom: 0, velY: JUMP_VEL, onGround: false, frame: 0, nextObsIn: 70 });
    if (charRef.current) charRef.current.style.bottom = '0px';
    setScore(0);
    setPhase('playing');
  }, [clearObstacles]);

  const doJump = useCallback(() => {
    const s = gs.current;
    if (s.onGround || s.charBottom < 4) { s.velY = JUMP_VEL; s.onGround = false; }
  }, []);

  const handleTap = useCallback(() => {
    if (phase === 'idle') startGame();
    else doJump();
  }, [phase, startGame, doJump]);

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleTap(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTap]);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const s = gs.current;
    const gameEl = containerRef.current;
    const charEl = charRef.current;
    if (!gameEl || !charEl) return;
    s.gameW = gameEl.offsetWidth;

    const tick = () => {

      // Physics
      s.velY += GRAVITY;
      s.charBottom = Math.max(0, s.charBottom - s.velY);
      s.onGround = s.charBottom <= 0;
      if (s.onGround) s.velY = 0;
      charEl.style.bottom = `${s.charBottom}px`;

      // Spawn obstacles
      s.nextObsIn--;
      if (s.nextObsIn <= 0) {
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;bottom:0;font-size:${OBS_SIZE}px;line-height:1;pointer-events:none;user-select:none;`;
        el.textContent = OBS_EMOJIS[Math.floor(Math.random() * OBS_EMOJIS.length)];
        gameEl.appendChild(el);
        s.obstacles.push({ el, x: s.gameW + 30 });
        const speed = Math.min(5, BASE_SPEED + s.frame / 900);
        s.nextObsIn = Math.max(60, 100 - s.frame / 150) + Math.random() * 60;
        el.dataset.speed = String(speed);
      }

      // Move + collide
      const speed = Math.min(5, BASE_SPEED + s.frame / 900);
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const obs = s.obstacles[i];
        obs.x -= Number(obs.el.dataset.speed || speed);
        obs.el.style.left = `${obs.x}px`;
        if (obs.x < -50) { obs.el.remove(); s.obstacles.splice(i, 1); continue; }
      }

      s.frame++;
      if (s.frame % 30 === 0) setScore(Math.floor(s.frame / 30));
      s.rafId = requestAnimationFrame(tick);
    };

    s.rafId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(s.rafId); };
  }, [phase]);

  return (
    <div style={{ width: '100%' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
          {phase === 'idle' ? `Keep ${childName} jumping! 🎮` : `${score}s and counting…`}
        </span>
      </div>

      {/* Game area */}
      <div
        ref={containerRef}
        onClick={handleTap}
        style={{
          position: 'relative', width: '100%', height: 240,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.08)',
          overflow: 'hidden', cursor: 'pointer', userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Ground */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />

        {/* Character */}
        <div ref={charRef} style={{
          position: 'absolute', left: CHAR_X, bottom: 0,
          fontSize: CHAR_SIZE, lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>
          📖
        </div>

        {/* Idle overlay */}
        {phase === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(26,26,46,0.6)', backdropFilter: 'blur(2px)' }}>
            <span style={{ fontSize: 22 }}>👆</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Tap to start!</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 220 }}>
              Keep {childName} jumping while the story generates
            </span>
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
        Space / Arrow Up to jump · Story ready in ~2 min
      </p>
    </div>
  );
}

export function PreviewResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const childName = searchParams.get('name') || 'Your child';
  const themeSlug = searchParams.get('theme') || '';
  const themeName = themeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const navigate = useNavigate();

  const [resultUrls, setResultUrls] = useState<[string | null, string | null]>([null, null]);
  const [status, setStatus] = useState<'processing' | 'done' | 'failed'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for results
  useEffect(() => {
    if (!jobId) return;
    intervalRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/preview/status/${jobId}`);
        const d = await r.json();
        // Show scenes as soon as they're available, even if still processing
        if (d.resultScene1 || d.resultScene2) {
          setResultUrls([d.resultScene1 || null, d.resultScene2 || null]);
        }
        if (d.status === 'done') {
          clearInterval(intervalRef.current!);
          setStatus('done');
          // Fire-and-forget — send preview email if job has one
          fetch(`${API_BASE}/api/preview/send-email`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId }),
          }).catch(() => {/* non-critical */});
        } else if (d.status === 'failed') {
          clearInterval(intervalRef.current!);
          setErrorMsg(d.error_message || 'Something went wrong.');
          setStatus('failed');
        }
      } catch { /* network blip — keep polling */ }
    }, 3000);
    return () => clearInterval(intervalRef.current!);
  }, [jobId, API_BASE]);

  const handleOrder = () => {
    navigate(`/theme/${themeSlug}`, {
      state: { previewUrls: resultUrls, childName, fromPreview: true },
    });
  };

  const done = status === 'done';

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: C.saffron }}>protago</div>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Free Preview</div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 60px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            {done ? '✨ Preview ready!' : 'Generating preview'}
          </p>
          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: '#fff', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', lineHeight: 1.1, margin: '0 0 8px' }}>
            {done ? `${childName}'s story` : `${childName}'s preview is generating`}
          </h1>
          {themeName && (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              {themeName}
            </p>
          )}
        </motion.div>

        {/* Progress bar + story teaser */}
        {status === 'processing' && <StoryTeaser childName={childName} />}

        {/* Mini game while waiting */}
        {status === 'processing' && (
          <div style={{ width: '100%', marginBottom: 32 }}>
            <StoryGame childName={childName} />
          </div>
        )}

        {/* Scene cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, width: '100%', marginBottom: 32 }}>
          <SceneCard url={resultUrls[0]} index={0} />
          <SceneCard url={resultUrls[1]} index={1} />
        </div>

        {/* Error */}
        {status === 'failed' && (
          <p style={{ color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Something went wrong: {errorMsg}
          </p>
        )}

        {/* Order CTA — fades in when done */}
        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, margin: 0 }}>
                Loved it? Make it real — printed and shipped to your door.
              </p>
              <button onClick={handleOrder}
                style={{ background: C.saffron, color: '#fff', border: 'none', borderRadius: 50, padding: '16px 40px', fontWeight: 800, fontSize: 18, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 6px 24px rgba(255,107,53,0.45)' }}>
                Order this Book →
              </button>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                Delivered in 5–7 days · Premium 200GSM glossy paper
              </p>

              {/* Divider */}
              <div style={{ width: '100%', maxWidth: 400, height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

              {/* Feedback */}
              {jobId && <FeedbackWidget jobId={jobId} API_BASE={API_BASE} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing indicator dots */}
        {status === 'processing' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: C.saffron }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

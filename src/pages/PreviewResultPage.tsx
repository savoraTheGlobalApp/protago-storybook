import { useState, useEffect, useRef, useCallback } from 'react';
import { trackPreviewGenerated } from '../utils/analytics';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

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
      width: '100%', height: '100%', minHeight: 180,
      background: 'linear-gradient(90deg, #2a2840 0%, #1e1c36 40%, #2a2840 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s infinite linear',
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

// ── Book viewer with 3D page flip ────────────────────────────────────────────
const FLIP_DURATION = 0.85;

function FlippingPage({
  fromUrl, toUrl, dir, onDone,
}: { fromUrl: string | null; toUrl: string | null; dir: 1 | -1; onDone: () => void }) {
  // Use keyframe arrays so we don't need a MotionValue — no conditional hooks
  const gleamAnim   = { opacity: [0, 0, 0.55, 0] as number[] };
  const gleamTimes  = [0, 0.3, 0.5, 1];
  const shadowAnim  = { opacity: [0, 0.5, 0.5, 0] as number[] };
  const shadowTimes = [0, 0.25, 0.6, 1];
  const t = { duration: FLIP_DURATION, ease: [0.33, 0, 0.15, 1] as [number,number,number,number] };

  return (
    <>
      {/* Shadow cast onto the destination half — sweeps as page turns */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={shadowAnim}
        transition={{ duration: FLIP_DURATION, times: shadowTimes, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 0, bottom: 0, zIndex: 2, pointerEvents: 'none',
          ...(dir === 1 ? { left: '50%', right: 0 } : { left: 0, right: '50%' }),
          background: dir === 1
            ? 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)'
            : 'linear-gradient(to left,  rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
        }}
      />

      {/* The turning page */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: dir === 1 ? -180 : 180 }}
        transition={t}
        onAnimationComplete={onDone}
        style={{
          position: 'absolute', top: 0, bottom: 0, zIndex: 3,
          ...(dir === 1 ? { left: '50%', right: 0 } : { left: 0, right: '50%' }),
          transformOrigin: dir === 1 ? 'left center' : 'right center',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── Front face — peeling half of the from-scene ── */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden' }}>
          {fromUrl
            ? <img src={fromUrl} style={{
                position: 'absolute', top: 0, height: '100%', objectFit: 'cover', display: 'block',
                ...(dir === 1 ? { right: 0, width: '200%', objectPosition: 'right' }
                              : { left: 0,  width: '200%', objectPosition: 'left'  }),
              }} />
            : <ShimmerCard />}

          {/* Spine lift shadow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: dir === 1
              ? 'linear-gradient(to right, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.04) 20%, transparent 50%)'
              : 'linear-gradient(to left,  rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.04) 20%, transparent 50%)',
          }} />

          {/* Light gleam at ~90° */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={gleamAnim}
            transition={{ duration: FLIP_DURATION, times: gleamTimes, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(to right, transparent 15%, rgba(255,255,255,0.7) 50%, transparent 85%)',
            }}
          />
        </div>

        {/* ── Back face — destination scene content ── */}
        {/*
          The back face has rotateY(180deg). When parent is at -180deg, net = 0deg (faces viewer).
          But horizontal axis is mirrored by the parent's flip, so we apply scaleX(-1) to the img
          to show the correct orientation of the destination scene's matching half.
        */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)', overflow: 'hidden',
          background: '#0d0a04',
        }}>
          {toUrl && (
            <img src={toUrl} style={{
              position: 'absolute', top: 0, height: '100%', objectFit: 'cover', display: 'block',
              // No scaleX needed: back face rotateY(180°) + parent's flip compound to net 0° —
              // content renders correctly oriented without any extra mirror correction.
              ...(dir === 1
                ? { left: 0,  width: '200%', objectPosition: 'left'  }
                : { right: 0, width: '200%', objectPosition: 'right' }),
            }} />
          )}
          {/* Edge shading on the back face */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: dir === 1
              ? 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, transparent 40%)'
              : 'linear-gradient(to left,  rgba(0,0,0,0.18) 0%, transparent 40%)',
          }} />
        </div>
      </motion.div>
    </>
  );
}

function BookViewer({ urls, firstIsCover = false, isComplete = false, onOrder }: { urls: (string | null)[], firstIsCover?: boolean, isComplete?: boolean, onOrder?: () => void }) {
  const [page, setPage]         = useState(0);
  const [flip, setFlip]         = useState<{ from: number; to: number; dir: 1 | -1 } | null>(null);
  const [loaded, setLoaded]     = useState<boolean[]>(Array(urls.length).fill(false));

  const total = urls.filter(Boolean).length;
  const isFlipping = flip !== null;

  const go = (d: 1 | -1) => {
    const next = page + d;
    if (next < 0 || next >= total || isFlipping) return;
    setFlip({ from: page, to: next, dir: d });
  };

  const onFlipDone = useCallback(() => {
    if (!flip) return;
    setPage(flip.to);
    setFlip(null);
  }, [flip]);

  const markLoaded = (i: number) =>
    setLoaded(prev => { const n = [...prev]; n[i] = true; return n; });

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 32 }}>
      <style>{`
        @keyframes pageHint { 0%,100%{transform:translateX(0);opacity:.6} 50%{transform:translateX(7px);opacity:1} }
      `}</style>

      <div style={{ position: 'relative', width: '100%', maxWidth: 860, perspective: '1600px', perspectiveOrigin: '50% 45%' }}>

        {/* Ground shadow */}
        <div style={{
          position: 'absolute', bottom: -22, left: '5%', right: '5%', height: 30,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.52) 0%, transparent 75%)',
          filter: 'blur(12px)', zIndex: 0,
        }} />

        {/* Book body */}
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 3,
          boxShadow: '0 22px 60px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.06)',
          background: '#0d0a04', zIndex: 1,
        }}>

          {/* Layer 0 — destination always underneath */}
          {/* Skip for backward flip to cover: animation only covers left half so the cover
              would show on the right prematurely. Layer 1 handles it after flip completes. */}
          {isFlipping && urls[flip.to] && !(firstIsCover && flip.to === 0 && flip.dir === -1) && (
            <img src={urls[flip.to]!} onLoad={() => markLoaded(flip.to)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block' }} />
          )}

          {/* Layer 1 — idle: full current scene (cover pinned to right half) */}
          {!isFlipping && (() => {
            const isCoverPage = firstIsCover && page === 0;
            if (!urls[page]) return <div style={{ position: 'absolute', inset: 0 }}><ShimmerCard /></div>;
            return isCoverPage ? (
              <img src={urls[page]!} onLoad={() => markLoaded(page)}
                style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', objectFit: 'cover', borderRadius: '0 3px 3px 0', display: 'block', opacity: loaded[page] ? 1 : 0, transition: 'opacity 0.5s' }} />
            ) : (
              <img src={urls[page]!} onLoad={() => markLoaded(page)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 3, display: 'block', opacity: loaded[page] ? 1 : 0, transition: 'opacity 0.5s' }} />
            );
          })()}

          {/* Layer 2 — static half of from-scene during flip */}
          {/* Skip when flipping forward from cover — its left half is empty */}
          {isFlipping && !(firstIsCover && flip.from === 0 && flip.dir === 1) && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0, zIndex: 2, overflow: 'hidden',
              ...(flip.dir === 1 ? { left: 0, width: '50%' } : { right: 0, width: '50%' }),
            }}>
              {urls[flip.from]
                ? <img src={urls[flip.from]!} style={{
                    height: '100%', objectFit: 'cover', display: 'block',
                    ...(flip.dir === 1
                      ? { width: '200%', objectPosition: 'left' }
                      : { width: '200%', objectPosition: 'right', marginLeft: '-100%' }),
                  }} />
                : <ShimmerCard />}
            </div>
          )}

          {/* Layer 3 — the animated flip (isolated component so hooks are stable) */}
          {isFlipping && (
            <FlippingPage
              key={`${flip.from}-${flip.to}`}
              fromUrl={urls[flip.from]}
              toUrl={firstIsCover && flip.to === 0 && flip.dir === -1 ? null : urls[flip.to]}
              dir={flip.dir}
              onDone={onFlipDone}
            />
          )}

          {/* Page numbers — bottom corners */}
          {(() => {
            const isCover = firstIsCover && page === 0;
            const leftPage  = isCover ? null : page * 2;
            const rightPage = isCover ? 1 : page * 2 + 1;
            const numStyle: React.CSSProperties = {
              position: 'absolute', bottom: 10, zIndex: 9, pointerEvents: 'none',
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Nunito', sans-serif", letterSpacing: '0.05em',
            };
            return <>
              {leftPage && <span style={{ ...numStyle, left: 18 }}>{leftPage}</span>}
              <span style={{ ...numStyle, right: 18 }}>{rightPage}</span>
            </>;
          })()}

          {/* Spine — always on top */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%',
            width: 24, transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.26) 100%)',
          }} />

          {/* Click zones */}
          {!isFlipping && page > 0 && (
            <button onClick={() => go(-1)} aria-label="Previous"
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 11 }} />
          )}
          {!isFlipping && page < total - 1 && (
            <button onClick={() => go(1)} aria-label="Next"
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 11 }} />
          )}

          {/* Hint arrow */}
          {!isFlipping && page === 0 && total > 1 && (
            <div style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              fontSize: 22, color: 'rgba(255,255,255,0.4)', zIndex: 11, pointerEvents: 'none',
              animation: 'pageHint 1.7s ease-in-out infinite',
            }}>›</div>
          )}
        </div>

        {/* Side arrow buttons */}
        <button onClick={() => go(-1)} disabled={page === 0 || isFlipping} style={{
          position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%', border: 'none', zIndex: 12,
          background: page === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.13)',
          color: page === 0 ? 'rgba(255,255,255,0.12)' : '#fff',
          cursor: page === 0 ? 'default' : 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s',
        }}>‹</button>

        {page >= total - 1 && isComplete ? (
          <button onClick={onOrder} style={{
            position: 'absolute', right: -52, top: '50%', transform: 'translateY(-50%)',
            height: 44, padding: '0 14px', borderRadius: 22, border: 'none', zIndex: 12,
            background: 'rgba(255,107,53,0.95)', color: '#fff',
            cursor: 'pointer', fontSize: 12, fontWeight: 800,
            fontFamily: "'Nunito', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 20px rgba(255,107,53,0.6)', transition: 'all 0.2s',
          }}>
            Order Now ›
          </button>
        ) : (
          <button onClick={() => go(1)} disabled={page >= total - 1 || isFlipping} style={{
            position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%', border: 'none', zIndex: 12,
            background: page >= total - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,107,53,0.9)',
            color: page >= total - 1 ? 'rgba(255,255,255,0.12)' : '#fff',
            cursor: page >= total - 1 ? 'default' : 'pointer', fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', transition: 'all 0.2s',
            boxShadow: page < total - 1 ? '0 4px 20px rgba(255,107,53,0.5)' : 'none',
          }}>›</button>
        )}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {urls.map((u, i) => u && (
          <button key={i} onClick={() => !isFlipping && go((i > page ? 1 : -1) as 1 | -1)}
            style={{
              width: i === page ? 22 : 7, height: 7, borderRadius: 99, padding: 0,
              background: i === page ? C.saffron : 'rgba(255,255,255,0.2)',
              border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
            }} />
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
        {firstIsCover && page === 0 ? 'Cover' : `Pages ${page * 2}–${page * 2 + 1}`} · {page < total - 1 ? 'Tap right to turn page' : 'End of preview'}
      </p>
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

// ── Sample book video overlay ─────────────────────────────────────────────────
const SAMPLE_VIDEO_ID = 'UoNgye4Y2DA'; // Harsh's book — real customer

function SampleVideoOverlay({ childName, onDismiss }: { childName: string; onDismiss: () => void }) {

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(10,8,20,0.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Skip button */}

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ textAlign: 'center', marginBottom: 22, maxWidth: 500 }}
      >
        <p style={{ fontSize: 11, fontWeight: 800, color: C.saffron, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
          While {childName}'s preview is being generated
        </p>
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: '#fff', fontSize: 'clamp(1.2rem, 3.5vw, 1.7rem)', lineHeight: 1.25, margin: '0 0 10px' }}>
          Watch how we made Harsh's book
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          The previews are just a glimpse — the final book your child receives will be something they'll treasure forever.
        </p>
      </motion.div>

      {/* Video */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
        style={{
          width: '100%', maxWidth: 380,
          aspectRatio: '9/16',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          background: '#000',
          position: 'relative',
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${SAMPLE_VIDEO_ID}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </motion.div>

      {/* Skip button — bottom center */}
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: C.saffron, border: 'none',
          borderRadius: 50, color: '#fff', fontSize: 15, fontWeight: 800,
          padding: '12px 32px', cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: 0.4, boxShadow: '0 4px 20px rgba(255,107,53,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        Skip — show me the preview ›
      </button>
    </motion.div>
  );
}

export function PreviewResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const childName  = searchParams.get('name') || 'Your child';
  const themeSlug  = searchParams.get('theme') || '';
  const previewGender   = searchParams.get('gender') || '';
  const previewAgeGroup = searchParams.get('ageGroup') || '';
  const previewAge      = searchParams.get('age') || '';
  const previewEmail    = searchParams.get('email') || '';
  const themeName = themeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';


  const [resultUrls, setResultUrls] = useState<(string | null)[]>([null, null, null, null, null]);
  const [status, setStatus] = useState<'processing' | 'done' | 'failed'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const [videoState, setVideoState] = useState<'overlay' | 'mini'>('overlay');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewGeneratedFired = useRef(false);

  // Poll for results — fetch immediately on mount, then every 3s while processing
  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/preview/status/${jobId}`);
        const d = await r.json();
        const scenes = [d.resultScene1, d.resultScene2, d.resultScene3, d.resultScene4, d.resultScene5].map((u: string | null) => u || null);
        if (scenes.some(Boolean)) setResultUrls(scenes);
        if (d.status === 'done') {
          clearInterval(intervalRef.current!);
          setStatus('done');
          if (!previewGeneratedFired.current) {
            previewGeneratedFired.current = true;
            trackPreviewGenerated(themeSlug, jobId!);
          }
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
    };

    poll(); // immediate fetch — no waiting for first interval tick
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current!);
  }, [jobId, API_BASE]);

  const handleOrder = () => {
    const params = new URLSearchParams({
      fromPreview: 'true',
      name: childName,
      gender: previewGender,
      ageGroup: previewAgeGroup,
      age: previewAge,
      email: previewEmail,
    });
    window.open(`/theme/${themeSlug}?${params}`, '_blank');
  };

  const done = status === 'done';

  return (
    <div style={{ minHeight: '100vh', background: C.navy, fontFamily: "'Nunito', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Sample video overlay — full screen while processing */}
      <AnimatePresence>
        {status === 'processing' && videoState === 'overlay' && (
          <SampleVideoOverlay childName={childName} onDismiss={() => setVideoState('mini')} />
        )}
      </AnimatePresence>

      {/* Mini bar — persistent at top while still processing */}
      <AnimatePresence>
        {status === 'processing' && videoState === 'mini' && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            onClick={() => setVideoState('overlay')}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
              background: 'linear-gradient(90deg, #1a1230 0%, #1e1538 100%)',
              borderBottom: `2px solid ${C.saffron}`,
              padding: '10px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: C.saffron,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="#fff">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              Watch how Harsh's book was made
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
              Tap to watch
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 20, color: C.saffron }}>protago</div>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>Free 4-Page Preview</div>
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

        {/* Book viewer */}
        {resultUrls.some(Boolean) && <BookViewer urls={resultUrls} firstIsCover={['colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school', 'managing-emotions', 'indian-festivals', 'phonics-reading', 'history-india', 'financial-literacy', 'growth-mindset'].includes(themeSlug ?? '')} isComplete={done} onOrder={handleOrder} />}

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
                Delivered in 5–7 business days · Premium 200GSM glossy paper
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

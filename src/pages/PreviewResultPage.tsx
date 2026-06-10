import React, { useState, useEffect, useRef, useCallback } from 'react';
import { trackPreviewGenerated } from '../utils/analytics';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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

const CUSTOMER_VIDEOS: { name: string; embedUrl: string }[] = [
  { name: 'Pransh',    embedUrl: 'https://www.instagram.com/p/DXwdV83zex3/embed/' },
  { name: 'Shreyansh', embedUrl: 'https://www.instagram.com/p/DWvGPa8j5g8/embed/' },
  { name: 'Adishi',    embedUrl: 'https://www.instagram.com/p/DYZhLw6TZ8E/embed/' },
  { name: 'Vihaan',    embedUrl: 'https://www.instagram.com/p/DXAAreLDxkZ/embed/' },
  { name: 'Vihaan',    embedUrl: 'https://www.instagram.com/p/DYAN2zKpGK8/embed/' },
  { name: 'Customer',  embedUrl: 'https://www.youtube.com/embed/At_FrzzTpQ0?loop=1&playlist=At_FrzzTpQ0&autoplay=1&mute=1&playsinline=1&controls=0&rel=0' },
];

type ReviewData = {
  rating: number;
  userRatingCount: number;
  reviews: { authorName: string; authorPhoto: string | null; authorUrl: string | null; rating: number; relativeTime: string; text: string }[];
};

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function WhileWaitingSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    fetch(`${API_BASE}/api/reviews`).then(r => r.json()).then(setReviewData).catch(() => {});
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' });
  };

  const avatarColors = ['#FF6B35', '#1A1A2E', '#F7B731', '#2E7D32', '#6A1B9A'];
  const avatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];
  const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{ width: '100%', marginTop: 48, marginBottom: 40 }}>
      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 40 }} />

      {/* Google Reviews */}
      {reviewData && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <GoogleG />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Google Reviews</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: "'Baloo 2', sans-serif" }}>{reviewData.rating.toFixed(1)}</span>
            <span style={{ color: '#F7B731', fontSize: 18 }}>{'★'.repeat(Math.round(reviewData.rating))}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>· {reviewData.userRatingCount} reviews</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviewData.reviews.slice(0, 4).map((r, i) => (
              <a key={i} href={r.authorUrl || 'https://g.page/r/CfdEg8f3DVL6EAE/review'} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {r.authorPhoto
                    ? <img src={r.authorPhoto} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(r.authorName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials(r.authorName)}</div>
                  }
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.authorName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{r.relativeTime}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#F7B731', fontSize: 12 }}>{'★'.repeat(r.rating)}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>{r.text}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Customer videos */}
      <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 }}>
        Real families, real stories
      </p>
      <div style={{ position: 'relative' }}>
        <button onClick={() => scroll('left')}
          style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'rgba(30,28,54,0.92)', border: '1.5px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          ‹
        </button>
        <div ref={scrollRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {CUSTOMER_VIDEOS.map((v, i) => (
            <div key={i} style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 240, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <iframe
                src={v.embedUrl}
                width="240"
                height="400"
                allowFullScreen
                allow="autoplay; encrypted-media"
                style={{ display: 'block', border: 'none' }}
              />
            </div>
          ))}
        </div>
        <button onClick={() => scroll('right')}
          style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'rgba(30,28,54,0.92)', border: '1.5px solid rgba(255,255,255,0.18)', color: '#fff', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          ›
        </button>
      </div>
    </div>
  );
}

function ScrollViewer({ urls }: { urls: (string | null)[] }) {
  type PageEntry = { url: string; side: 'left' | 'right'; num: number };
  const pages: PageEntry[] = [];
  let num = 1;
  for (const url of urls) {
    if (url) {
      pages.push({ url, side: 'left',  num: num++ });
      pages.push({ url, side: 'right', num: num++ });
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 32 }}>
      {pages.map((p, i) => (
        <div key={i} style={{ position: 'relative', width: '75%', aspectRatio: '8/9', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.55)', background: '#0d0a04' }}>
          <img
            src={p.url}
            loading="lazy"
            style={{
              position: 'absolute', top: 0, height: '100%', width: '200%',
              objectFit: 'cover', display: 'block',
              ...(p.side === 'left'
                ? { left: 0, objectPosition: 'left' }
                : { right: 0, objectPosition: 'right' }),
            }}
          />
          <span style={{
            position: 'absolute', bottom: 10,
            ...(p.side === 'left' ? { left: 14 } : { right: 14 }),
            fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
            background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 7px',
            backdropFilter: 'blur(4px)',
          }}>
            {p.num}
          </span>
        </div>
      ))}
    </div>
  );
}

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

// Themes where scene_01 (cover) is skipped during face-swap — Modal still
// treats index 0 as a cover and overlays a title, so we drop it from display.
const SKIP_COVER_THEMES = new Set([
  'colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school',
  'managing-emotions', 'indian-festivals', 'history-india',
  'financial-literacy', 'growth-mindset', 'professions', 'internet-safety', 'body-safety',
]);

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

// ── Paired page viewer for ABC theme ─────────────────────────────────────────
// Shows left-half of scene[2i] and left-half of scene[2i+1] side by side.
// Flip moves between spreads with a fade transition.
function PairedPageViewer({ urls, isComplete = false, onOrder }: {
  urls: (string | null)[]; isComplete?: boolean; onOrder?: () => void;
}) {
  const [spread, setSpread] = useState(0);
  const [fading, setFading] = useState(false);

  // Pair consecutive URLs into spreads; include spread if either URL is set
  const spreads: [string | null, string | null][] = [];
  for (let i = 0; i + 1 < urls.length; i += 2) {
    if (urls[i] || urls[i + 1]) spreads.push([urls[i] ?? null, urls[i + 1] ?? null]);
  }
  const total = spreads.length;

  const go = (target: number) => {
    if (target < 0 || target >= total || fading) return;
    setFading(true);
    setTimeout(() => {
      setSpread(target);
      setFading(false);
    }, 300);
  };

  const [left, right] = spreads[spread] ?? [null, null];

  const leftNum  = spread * 2 + 1;
  const rightNum = spread * 2 + 2;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 32 }}>
      <style>{`@keyframes pageHint{0%,100%{transform:translateX(0);opacity:.6}50%{transform:translateX(7px);opacity:1}}`}</style>

      <div style={{ position: 'relative', width: '100%', maxWidth: 860 }}>
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
          background: '#0d0a04', zIndex: 1, overflow: 'hidden',
        }}>
          {/* Left page — left-half crop of scene[2i] */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', overflow: 'hidden',
            opacity: fading ? 0 : 1, transition: 'opacity 0.25s ease',
          }}>
            {left
              ? <img src={left} style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '200%', objectFit: 'cover', objectPosition: 'left', display: 'block' }} />
              : <ShimmerCard />}
          </div>

          {/* Right page — left-half crop of scene[2i+1] */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', overflow: 'hidden',
            opacity: fading ? 0 : 1, transition: 'opacity 0.25s ease',
          }}>
            {right
              ? <img src={right} style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '200%', objectFit: 'cover', objectPosition: 'left', display: 'block' }} />
              : <ShimmerCard />}
          </div>

          {/* Spine */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%',
            width: 24, transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.26) 100%)',
          }} />

          {/* Page numbers */}
          <span style={{ position: 'absolute', bottom: 10, left: 18, zIndex: 9, pointerEvents: 'none', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif", letterSpacing: '0.05em' }}>{leftNum}</span>
          <span style={{ position: 'absolute', bottom: 10, right: 18, zIndex: 9, pointerEvents: 'none', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif", letterSpacing: '0.05em' }}>{rightNum}</span>

          {/* Click zones */}
          {!fading && spread > 0 && (
            <button onClick={() => go(spread - 1)} aria-label="Previous"
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 11 }} />
          )}
          {!fading && spread < total - 1 && (
            <button onClick={() => go(spread + 1)} aria-label="Next"
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 11 }} />
          )}

          {/* Hint arrow */}
          {!fading && spread === 0 && total > 1 && (
            <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 22, color: 'rgba(255,255,255,0.4)', zIndex: 11, pointerEvents: 'none', animation: 'pageHint 1.7s ease-in-out infinite' }}>›</div>
          )}
        </div>

        {/* Side arrow buttons */}
        <button onClick={() => go(spread - 1)} disabled={spread === 0 || fading} style={{
          position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)',
          width: 44, height: 44, borderRadius: '50%', border: 'none', zIndex: 12,
          background: spread === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.13)',
          color: spread === 0 ? 'rgba(255,255,255,0.12)' : '#fff',
          cursor: spread === 0 ? 'default' : 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'all 0.2s',
        }}>‹</button>

        {spread >= total - 1 && isComplete ? (
          <button onClick={onOrder} style={{
            position: 'absolute', right: -52, top: '50%', transform: 'translateY(-50%)',
            height: 44, padding: '0 14px', borderRadius: 22, border: 'none', zIndex: 12,
            background: 'rgba(255,107,53,0.95)', color: '#fff',
            cursor: 'pointer', fontSize: 12, fontWeight: 800,
            fontFamily: "'Nunito', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 20px rgba(255,107,53,0.6)',
          }}>Order Now ›</button>
        ) : (
          <button onClick={() => go(spread + 1)} disabled={spread >= total - 1 || fading} style={{
            position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%', border: 'none', zIndex: 12,
            background: spread >= total - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,107,53,0.9)',
            color: spread >= total - 1 ? 'rgba(255,255,255,0.12)' : '#fff',
            cursor: spread >= total - 1 ? 'default' : 'pointer', fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', transition: 'all 0.2s',
            boxShadow: spread < total - 1 ? '0 4px 20px rgba(255,107,53,0.5)' : 'none',
          }}>›</button>
        )}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {spreads.map((_, i) => (
          <button key={i} onClick={() => !fading && go(i)}
            style={{
              width: i === spread ? 22 : 7, height: 7, borderRadius: 99, padding: 0,
              background: i === spread ? C.saffron : 'rgba(255,255,255,0.2)',
              border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
            }} />
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
        Pages {leftNum}–{rightNum} · {spread < total - 1 ? 'Tap right to turn page' : 'End of preview'}
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
  const navigate = useNavigate();
  const childName  = searchParams.get('name') || 'Your child';
  const themeSlug  = searchParams.get('theme') || '';
  const previewGender   = searchParams.get('gender') || '';
  const previewAgeGroup = searchParams.get('ageGroup') || '';
  const previewAge      = searchParams.get('age') || '';
  const previewEmail    = searchParams.get('email') || '';
  const fromOrderForm   = searchParams.get('fromOrderForm') === 'true';
  const orderPhone      = searchParams.get('phone') || '';
  const orderParentName = searchParams.get('parentName') || '';
  const orderBindingType = searchParams.get('bindingType') || 'paperback';
  const orderPhotoPath  = searchParams.get('photoPath') || '';
  const themeName = themeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const [orderOverlayOpen, setOrderOverlayOpen] = useState(false);
  const [overlayForm, setOverlayForm] = useState({ addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', dedicationMessage: '', couponInput: '' });
  const [overlayCoupon, setOverlayCoupon] = useState<{ code: string; discountAmount: number; finalPrice: number; discountType: string; discountValue: number } | null>(null);
  const [overlayCouponError, setOverlayCouponError] = useState('');
  const [overlayCouponLoading, setOverlayCouponLoading] = useState(false);
  const [overlayConsent, setOverlayConsent] = useState(false);
  const [overlaySubmitting, setOverlaySubmitting] = useState(false);
  const [overlayError, setOverlayError] = useState('');
  const setOf = (k: string, v: string) => setOverlayForm(f => ({ ...f, [k]: v }));

  // Pricing (same overrides as backend)
  const THEME_PRICE_OVERRIDES: Record<string, { paperback: number; hardcover: number }> = {
    'abc':            { paperback: 849, hardcover: 1449 },
    'hindi-alphabet': { paperback: 849, hardcover: 1449 },
  };
  const themeOverride = THEME_PRICE_OVERRIDES[themeSlug] || null;
  const basePrice = themeOverride
    ? (orderBindingType === 'hardcover' ? themeOverride.hardcover : themeOverride.paperback)
    : orderBindingType === 'hardcover' ? 1595 : 974;
  const displayPrice = overlayCoupon ? overlayCoupon.finalPrice : basePrice;

  const handleOverlayCoupon = async () => {
    if (!overlayForm.couponInput.trim()) return;
    setOverlayCouponError('');
    setOverlayCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/validate-coupon`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: overlayForm.couponInput.trim(), theme: themeSlug, bindingType: orderBindingType }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setOverlayCoupon({ code: overlayForm.couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        setOverlayCouponError('');
      } else {
        setOverlayCoupon(null);
        setOverlayCouponError(data.error || 'Invalid coupon code');
      }
    } catch { setOverlayCouponError('Could not validate coupon. Try again.'); }
    setOverlayCouponLoading(false);
  };

  const handleOverlaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overlayConsent) return;
    setOverlaySubmitting(true);
    setOverlayError('');
    try {
      const res = await fetch(`${API_BASE}/api/order-inquiry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: orderParentName,
          email: previewEmail,
          phone: orderPhone,
          childName,
          childAge: previewAge,
          childGender: previewGender === 'boy' ? 'Boy' : previewGender === 'girl' ? 'Girl' : '',
          storyTheme: themeSlug,
          bindingType: orderBindingType,
          addressLine1: overlayForm.addressLine1,
          addressLine2: overlayForm.addressLine2,
          city: overlayForm.city,
          state: overlayForm.state,
          pincode: overlayForm.pincode,
          dedicationMessage: overlayForm.dedicationMessage,
          photoPath: orderPhotoPath,
          couponCode: overlayCoupon?.code || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to create order'); }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();
      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        navigate('/order-confirmed', { state: { childName, email: previewEmail, amount: amount / 100 } });
        return;
      }
      const options: RazorpayOptions = {
        key: razorpayKeyId, amount, currency,
        name: 'Protago',
        description: `Personalised Storybook — ${themeName}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            fetch(`${API_BASE}/api/order/send-confirmation-email`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id }),
            }).catch(() => {});
            navigate('/order-confirmed', { state: { childName, email: previewEmail, amount: amount / 100 } });
          } catch {
            setOverlayError('Payment verification failed. Please contact support.');
            setOverlaySubmitting(false);
          }
        },
        prefill: { name: orderParentName, email: previewEmail, contact: orderPhone },
        theme: { color: '#FF6B35' },
        modal: { ondismiss: () => { setOverlaySubmitting(false); setOverlayError('Payment was cancelled. Please try again.'); } },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setOverlayError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setOverlaySubmitting(false);
    }
  };


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

  const [viewMode, setViewMode] = useState<'book' | 'scroll'>('scroll');
  const [shareCopied, setShareCopied] = useState(false);
  const handleShare = async () => {
    const imageUrl = resultUrls[1] || resultUrls.find(Boolean);
    if (!imageUrl) return;
    try {
      const blob = await fetch(imageUrl, { mode: 'cors' }).then(r => r.blob());
      const file = new File([blob], `${childName}-storybook-preview.jpg`, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${childName}'s personalised storybook`, text: `Look how ${childName} looks as the hero of their own storybook! 📖✨` });
      } else {
        // fallback: download the image
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${childName}-storybook-preview.jpg`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      // last resort: copy page URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      } catch { /* silent */ }
    }
  };

  const handleOrder = () => {
    if (fromOrderForm) {
      setOrderOverlayOpen(true);
      return;
    }
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

      {/* Order completion overlay — shown when arriving from order form */}
      <AnimatePresence>
        {orderOverlayOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,8,20,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '28px 24px', fontFamily: "'Nunito', sans-serif", position: 'relative' }}>
              <button onClick={() => setOrderOverlayOpen(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF', lineHeight: 1 }}>×</button>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.saffron, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Almost there!</p>
              <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: '#1A1A2E', margin: '0 0 20px', lineHeight: 1.2 }}>Where should we ship it?</h2>
              <form onSubmit={handleOverlaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { key: 'addressLine1', label: 'Address line 1 *', placeholder: 'Flat / House no., Building, Street', required: true },
                  { key: 'addressLine2', label: 'Address line 2 (optional)', placeholder: 'Area, Landmark', required: false },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                    <input required={required} placeholder={placeholder} value={overlayForm[key as keyof typeof overlayForm]}
                      onChange={e => setOf(key, e.target.value)}
                      style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '9px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{ key: 'city', label: 'City *', placeholder: 'e.g. Mumbai' }, { key: 'state', label: 'State *', placeholder: 'e.g. Maharashtra' }].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{label}</label>
                      <input required placeholder={placeholder} value={overlayForm[key as keyof typeof overlayForm]}
                        onChange={e => setOf(key, e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '9px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Pincode *</label>
                  <input required placeholder="e.g. 400001" inputMode="numeric" maxLength={6} pattern="[0-9]{6}"
                    value={overlayForm.pincode} onChange={e => setOf('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '9px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    Personal message <span style={{ color: '#C4B5A0', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <textarea placeholder={`e.g. "To my little star — with all my love"`}
                    value={overlayForm.dedicationMessage} onChange={e => setOf('dedicationMessage', e.target.value)}
                    rows={2} maxLength={200}
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '9px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Promo code (optional)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="e.g. WELCOME20" value={overlayForm.couponInput}
                      onChange={e => { setOf('couponInput', e.target.value.toUpperCase()); setOverlayCoupon(null); setOverlayCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleOverlayCoupon())}
                      style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '9px 11px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    <button type="button" onClick={handleOverlayCoupon} disabled={overlayCouponLoading || !overlayForm.couponInput.trim()}
                      style={{ background: '#1A1A2E', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: overlayCouponLoading || !overlayForm.couponInput.trim() ? 0.5 : 1 }}>
                      {overlayCouponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {overlayCoupon && (
                    <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, margin: '6px 0 0' }}>
                      ✓ {overlayCoupon.code} applied — {overlayCoupon.discountType === 'percent' ? `${overlayCoupon.discountValue}% off` : `₹${overlayCoupon.discountAmount} off`}
                    </p>
                  )}
                  {overlayCouponError && <p style={{ fontSize: 12, color: '#EF4444', margin: '6px 0 0' }}>{overlayCouponError}</p>}
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" required checked={overlayConsent} onChange={e => setOverlayConsent(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: C.saffron, width: 15, height: 15, cursor: 'pointer' }} />
                  <span style={{ fontSize: 11, lineHeight: 1.6, color: '#9CA3AF' }}>
                    I confirm I am 18+ and have obtained parental consent to share this information per the{' '}
                    <a href="/privacy" style={{ color: C.saffron, textDecoration: 'underline' }}>Privacy Policy</a>.
                  </span>
                </label>
                {overlayError && <p style={{ fontSize: 12, color: '#EF4444', margin: '0', textAlign: 'center' }}>{overlayError}</p>}
                <button type="submit" disabled={overlaySubmitting || !overlayConsent}
                  style={{ background: overlayConsent ? `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)` : '#E5E7EB', color: overlayConsent ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 800, fontSize: 16, cursor: overlayConsent ? 'pointer' : 'default', fontFamily: "'Baloo 2', sans-serif", boxShadow: overlayConsent ? '0 4px 16px rgba(255,107,53,0.4)' : 'none' }}>
                  {overlaySubmitting ? 'Processing…' : `Pay ₹${displayPrice} & Order →`}
                </button>
                <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', margin: '-4px 0 0' }}>
                  {orderBindingType === 'hardcover' ? 'Hardcover' : 'Paperback'} · Delivered in 7–9 business days
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* Waiting message */}
        {status === 'processing' && (
          <div style={{ width: '100%', marginBottom: 32, textAlign: 'center', padding: '28px 24px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: "'Baloo 2', sans-serif" }}>
              ⏱ All pages are generating simultaneously — ready in ~2 min
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
              We'll notify you when it's ready — you don't need to wait on this page.
            </p>
          </div>
        )}


        {/* Buttons — shown as soon as done, above the scenes */}
        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                <button onClick={handleOrder}
                  style={{ background: C.saffron, color: '#fff', border: 'none', borderRadius: 50, padding: '15px 32px', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 6px 24px rgba(255,107,53,0.45)' }}>
                  Order this Book →
                </button>
                <button onClick={handleShare}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 50, padding: '15px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", backdropFilter: 'blur(8px)' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  {shareCopied ? 'Link copied!' : 'Share'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px' }}>
                Delivered in 5–7 business days · Premium 300GSM glossy paper
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                Tag <strong style={{ color: '#fff' }}>@protago.in</strong> in your story &amp; send us a screenshot on{' '}
                <a
                  href="https://wa.me/919606037934?text=Hi!%20I%20shared%20my%20Protago%20preview%20on%20Instagram.%20Here's%20my%20screenshot%20for%20the%2020%25%20discount!"
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: C.saffron, fontWeight: 700, textDecoration: 'none' }}
                >WhatsApp</a>
                {' '}to claim <strong style={{ color: C.gold }}>20% off</strong> your order.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View toggle */}
        {done && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: 4 }}>
            {(['book', 'scroll'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  background: viewMode === mode ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: viewMode === mode ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: 'none', borderRadius: 50, padding: '7px 20px',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.2s, color 0.2s',
                }}>
                {mode === 'book' ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg> Book</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="5" rx="1"/></svg> Scroll</>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Book viewer */}
        {done && (
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0 0 8px', width: '100%' }}>
            Not happy with the preview?{' '}
            <a href="https://wa.me/919606037934" target="_blank" rel="noopener noreferrer"
              style={{ color: C.saffron, fontWeight: 700, textDecoration: 'none' }}>
              DM us on WhatsApp
            </a>{' '}and we'll sort it out.
          </p>
        )}
        {resultUrls.some(Boolean) && (
          viewMode === 'scroll'
            ? <ScrollViewer urls={SKIP_COVER_THEMES.has(themeSlug ?? '') ? resultUrls.slice(1) : resultUrls} />
            : themeSlug === 'abc'
              ? <PairedPageViewer urls={resultUrls} isComplete={done} onOrder={handleOrder} />
              : <BookViewer urls={SKIP_COVER_THEMES.has(themeSlug ?? '') ? resultUrls.slice(1) : resultUrls} firstIsCover={false} isComplete={done} onOrder={handleOrder} />
        )}

        {/* Error */}
        {status === 'failed' && (
          <p style={{ color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Something went wrong: {errorMsg}
          </p>
        )}

        {/* Preview disclaimer — fades in when done */}
        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: '16px 20px', marginBottom: 8 }}>
              <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', margin: '0 0 6px' }}>
                🎨 This is just a sneak peek
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.65 }}>
                These previews show your child's face blended into the story scenes. In the <strong style={{ color: 'rgba(255,255,255,0.85)' }}>printed book</strong>, our artists refine every page — perfecting body proportions, skin tone, clothing, and gender — so the illustrations feel truly made for your child. ✨
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order CTA — fades in when done */}
        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
              {/* Divider */}
              <div style={{ width: '100%', maxWidth: 400, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

              {/* Feedback */}
              {jobId && <FeedbackWidget jobId={jobId} API_BASE={API_BASE} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews + customer videos — always below the preview */}
        <WhileWaitingSection />

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

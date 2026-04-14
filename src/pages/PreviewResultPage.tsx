import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      {/* Shimmer underneath */}
      {!loaded && <ShimmerCard />}

      {/* Actual image fades in */}
      {url && (
        <motion.img
          src={url}
          alt={`Preview scene ${index + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onLoad={() => setLoaded(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', borderRadius: 16,
          }}
        />
      )}
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

  const [resultUrls, setResultUrls] = useState<[string | null, string | null]>([null, null]);
  const [status, setStatus] = useState<'processing' | 'done' | 'failed'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const [waitLine, setWaitLine] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotate waiting messages
  useEffect(() => {
    if (status !== 'processing') return;
    const t = setInterval(() => setWaitLine(i => (i + 1) % WAITING_LINES.length), 3500);
    return () => clearInterval(t);
  }, [status]);

  // Poll for results
  useEffect(() => {
    if (!jobId) return;
    intervalRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/preview/status/${jobId}`);
        const d = await r.json();
        if (d.status === 'done') {
          clearInterval(intervalRef.current!);
          setResultUrls([d.resultScene1 || null, d.resultScene2 || null]);
          setStatus('done');
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
    window.open(`/?theme=${themeSlug}#order`, '_blank');
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 60px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

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

        {/* Waiting message */}
        {status === 'processing' && (
          <div style={{ marginBottom: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.p key={waitLine}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textAlign: 'center', margin: 0 }}>
                {WAITING_LINES[waitLine](childName)}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* Scene cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, width: '100%', marginBottom: 32 }}>
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
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing indicator dots */}
        {status === 'processing' && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
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

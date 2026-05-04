import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { NavBar } from '../components/NavBar';
import { THEMES, ThemeEntry, ageToRange } from '../data/themes';
import { DEFAULT_FACE_SAMPLES, getFaceSamples, getArrowTarget } from '../data/themeMockups';
import { trackEvent } from '../utils/analytics';

// ── Palette — two backgrounds (white / navy), one warm gradient, saffron + gold accents
const C = {
  saffron:  '#FF6B35',
  gold:     '#F7B731',
  navy:     '#1A1A2E',
  navyCard: '#252540',   // slightly lighter card bg inside navy sections
  white:    '#FFFFFF',
  warmTint: '#FFF8F3',   // very subtle warm tint for alternating white sections
  gray:     '#555555',
  lgray:    '#999999',
  gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7B731 100%)',
};

// Section rhythm:  gradient → white → navy → white → warmTint → white → navy → gradient → white → navy footer

const faqs = [
  { q: 'How does the personalisation work?',
    a: "You share your child's name, age, and a photo. Our AI recreates their likeness across every page, making them the true hero of the adventure." },
  { q: 'How long does delivery take?',
    a: 'We deliver within 5–7 business days across India on premium 200GSM glossy paper, carefully packaged.' },
  { q: 'What age group are these books for?',
    a: 'We have stories for children aged 3–12, with language calibrated precisely to their age.' },
  { q: 'Can I see a sample before buying?',
    a: 'Yes! We provide sample previews so you can see illustration quality and storytelling style before ordering.' },
  { q: "What if I'm not satisfied?",
    a: "Reach out within 7 days and we'll make it right or offer a full refund." },
];


const boyStyles = [
  { label: 'Pixar 3D',  img: '/styles/boy_pixar.webp' },
  { label: 'Realistic', img: '/styles/boy_base.webp' },
];

const girlStyles = [
  { label: 'Pixar 3D',  img: '/styles/girl_pixar.webp' },
  { label: 'Realistic', img: '/styles/girl_base.webp' },
];

const ageTiers = [
  { emoji: '🌱', range: 'Ages 3–5',  tone: 'Warm · Simple · Reassuring',  words: '6',  scenes: '8',
    desc: 'Short rhythmic sentences, gentle repetition, a safe and warm resolution.',
    borderColor: C.saffron },
  { emoji: '🚀', range: 'Ages 6–8',  tone: 'Energetic · Punchy · Action',  words: '10', scenes: '12',
    desc: 'Punchy sentences with real tension. Ready for the thrill of a proper adventure.',
    borderColor: C.gold },
  { emoji: '📖', range: 'Ages 9–12', tone: 'Rich · Emotional · Witty',     words: '15', scenes: '16',
    desc: 'Richer vocabulary, emotional depth, genuine humour. Stories older kids want to read.',
    borderColor: C.saffron },
];

const qualityItems = [
  { emoji: '🎯', title: 'Right for their age',  desc: 'Every sentence is measured for length and vocabulary. Too hard or too easy — it gets rewritten.' },
  { emoji: '💡', title: 'One clear lesson',      desc: 'Every story teaches exactly one thing, clearly and beautifully. No mixed messages.' },
  { emoji: '🎨', title: 'Every scene is vivid',  desc: 'Each scene is verified to be fully illustratable. No vague feelings — what you read gets painted.' },
];

const whyItems = [
  { emoji: '🌟', title: 'Builds real confidence',    desc: "Seeing themselves solve problems and be brave gives children a self-image that lasts far beyond bedtime." },
  { emoji: '🇮🇳', title: 'Culture they recognise',  desc: 'Indian names, mango trees, marigolds, mohalla streets. A world that looks like theirs.' },
  { emoji: '📚', title: 'Supports reading growth',   desc: 'Age-calibrated language challenges them just enough, building vocabulary without frustration.' },
  { emoji: '📖', title: 'A keepsake they return to', desc: 'Their name on every page. Children ask to read this one again and again.' },
];

// ── Shared typography helpers
const eyebrow = (text: string, onDark = false) => (
  <p className="text-xs font-bold uppercase tracking-widest mb-3"
    style={{ color: onDark ? C.gold : C.saffron, letterSpacing: '0.15em' }}>
    {text}
  </p>
);

const heading = (text: React.ReactNode, onDark = false) => (
  <h2 style={{
    fontFamily: "'Baloo 2', sans-serif", fontWeight: 800,
    color: onDark ? C.white : C.navy,
    fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)', lineHeight: 1.05,
  }}>
    {text}
  </h2>
);

const HERO_SLIDES = [
  { src: '/styles/cover_scene.webp',      caption: 'Aarav · Courage' },
  { src: '/styles/scene_03.webp',         caption: 'Something catches their ear…' },
  { src: '/styles/scene_07.webp',         caption: 'A moment of triumph!' },
  { src: '/styles/scene_10.webp',         caption: 'Everyone celebrates together.' },
  { src: '/styles/bhanvi_cover.webp',     caption: 'Naina & Meera · Sky High' },
  { src: '/styles/bhanvi_scene_05.webp',  caption: 'Look! Paris! cried Meera.' },
  { src: '/styles/bhanvi_scene_10.webp',  caption: 'You can be a pilot one day too!' },
  { src: '/styles/prisha_cover.webp',     caption: 'Diya · The Magic of Learning' },
  { src: '/styles/prisha_scene_09.webp',  caption: 'She searched all night — and found it.' },
];

// ── FACE → SCENE ANIMATION ────────────────────────────────────────────────
const FACE_SAMPLES = DEFAULT_FACE_SAMPLES;

const FACE_SCENE_SAMPLES = [
  { name: 'Boy',  face: '/faces/face_boy_1.webp',  scene: '/themes_mockup/bedtime-routines_boy_1_mockup.webp' },
  { name: 'Boy',  face: '/faces/face_boy_2.webp',  scene: '/themes_mockup/bedtime-routines_boy_2_mockup.webp' },
  { name: 'Girl', face: '/faces/face_girl_1.webp', scene: '/themes_mockup/bedtime-routines_girl_1_mockup.webp' },
];

const FACE_SIZE_CSS = 'clamp(70px, 18vw, 140px)';

const HERO_FACE_SLIDES = [
  { slug: 'bedtime-routines',  key: 'boy_1',  face: '/faces/face_boy_1.webp',  label: 'Bedtime Routines' },
  { slug: 'bedtime-routines',  key: 'girl_1', face: '/faces/face_girl_1.webp', label: 'Bedtime Routines' },
  { slug: 'colours-shapes',    key: 'boy_1',  face: '/faces/face_boy_1.webp',  label: 'Colours & Shapes' },
  { slug: 'colours-shapes',    key: 'girl_1', face: '/faces/face_girl_1.webp', label: 'Colours & Shapes' },
  { slug: 'financial-literacy',key: 'boy_1',  face: '/faces/face_boy_1.webp',  label: 'Financial Literacy' },
  { slug: 'financial-literacy',key: 'girl_1', face: '/faces/face_girl_1.webp', label: 'Financial Literacy' },
  { slug: 'first-day-school',  key: 'boy_1',  face: '/faces/face_boy_1.webp',  label: 'First Day at School' },
  { slug: 'first-day-school',  key: 'girl_1', face: '/faces/face_girl_1.webp', label: 'First Day at School' },
];

function HeroFaceSwapAnimation() {
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '200px 0px' });

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % HERO_FACE_SLIDES.length), 2500);
    return () => clearInterval(t);
  }, [inView]);

  const FACE_SIZE = 72;
  const current = HERO_FACE_SLIDES[activeIdx];

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', paddingTop: FACE_SIZE / 2 }}>
      {/* Mockup images */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden', background: '#1a1a2e', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        {HERO_FACE_SLIDES.map((s, i) => (
          <motion.img
            key={`${s.slug}-${s.key}`}
            src={`/themes_mockup/${s.slug}_${s.key}_mockup.webp`}
            alt={s.label}
            loading="lazy" decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.3)' }}
            animate={{ opacity: i === activeIdx ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ))}
        {/* Arrow */}
        <svg viewBox="0 0 160 90" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
          <motion.path d="M 148 4 Q 148 40 98 28" fill="none" stroke={C.saffron}
            strokeWidth="2.2" strokeDasharray="5 3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: 1.0, ease: 'easeInOut', delay: 0.2 }, opacity: { duration: 0.2 } }}
            key={activeIdx} />
          <motion.path d="M 106 23 L 98 28 L 105 33" fill="none" stroke={C.saffron}
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
            key={`ah-${activeIdx}`} />
        </svg>
        {/* Theme label */}
        <motion.div key={current.label}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ position: 'absolute', bottom: 10, left: 12, zIndex: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '3px 10px', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{current.label}</span>
        </motion.div>
        {/* Dot indicators */}
        <div style={{ position: 'absolute', bottom: 10, right: 12, zIndex: 6, display: 'flex', gap: 4 }}>
          {[0,1,2,3].map(themeIdx => (
            <div key={themeIdx} style={{ width: 6, height: 6, borderRadius: '50%', background: Math.floor(activeIdx / 2) === themeIdx ? C.saffron : 'rgba(255,255,255,0.4)', transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>
      {/* Face circle */}
      <div style={{ position: 'absolute', top: 0, right: 12, width: FACE_SIZE, height: FACE_SIZE, zIndex: 10 }}>
        {HERO_FACE_SLIDES.map((s, i) => (
          <motion.img key={`${s.slug}-${s.key}-face`} src={s.face} alt="" loading="lazy" decoding="async"
            className="rounded-full"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              border: `2.5px solid ${C.saffron}`, boxShadow: '0 2px 10px rgba(255,107,53,0.4), 0 0 0 2px #fff' }}
            animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.9 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }} />
        ))}
      </div>
    </div>
  );
}

function FaceToSceneAnimation() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapperRef, { margin: '200px 0px' });

  // Latch: once the section enters the viewport, mount images and keep them mounted forever.
  useEffect(() => {
    if (inView && !hasLoaded) setHasLoaded(true);
  }, [inView, hasLoaded]);

  // Animation interval still pauses when offscreen — saves CPU without unmounting images.
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % FACE_SCENE_SAMPLES.length), 3500);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div className="mb-4" ref={wrapperRef}>
      {/* Outer wrapper — extra top padding so face circle can overflow upward */}
      <div className="relative" style={{ paddingTop: `calc(${FACE_SIZE_CSS} / 2)` }}>

        {/* Scene spread */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full"
          style={{ aspectRatio: '16 / 9', background: '#fff' }}>

          {/* Slide images */}
          {hasLoaded && FACE_SCENE_SAMPLES.map((sample, i) => (
            <motion.img
              key={sample.scene}
              src={sample.scene}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover block"
              animate={{ opacity: i === activeIdx ? 1 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{ zIndex: i === activeIdx ? 1 : 0 }}
            />
          ))}

          {/* Arrow SVG overlay */}
          <svg
            viewBox="0 0 160 90"
            className="absolute inset-0 w-full h-full hidden sm:block"
            style={{ zIndex: 5, pointerEvents: 'none' }}>
            <motion.path
              d="M 148 4 Q 148 45 95 45"
              fill="none"
              stroke={C.saffron}
              strokeWidth="2"
              strokeDasharray="5 4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ pathLength: { duration: 1.2, ease: 'easeInOut', delay: 0.3 }, opacity: { duration: 0.3 } }}
              key={activeIdx}
            />
            <motion.path
              d="M 100 40 L 95 45 L 100 50"
              fill="none"
              stroke={C.saffron}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              key={`arrow-${activeIdx}`}
            />
          </svg>
        </div>

        {/* Face circle — hovering top-right corner, half above the scene */}
        <div className="absolute"
          style={{ top: 0, right: 12, width: FACE_SIZE_CSS, height: FACE_SIZE_CSS, zIndex: 10 }}>
          {hasLoaded && FACE_SCENE_SAMPLES.map((sample, i) => (
            <motion.img
              key={sample.face}
              src={sample.face}
              alt={`${sample.name}'s photo`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover rounded-full"
              animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.9 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{
                border: `5px solid ${C.saffron}`,
                boxShadow: '0 8px 32px rgba(255,107,53,0.35), 0 0 0 4px #fff',
              }}
            />
          ))}
          {/* Name label */}
          <div className="absolute left-1/2 flex flex-col items-center"
            style={{ top: `calc(${FACE_SIZE_CSS} + 6px)`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            <AnimatePresence mode="wait">
              <motion.p key={activeIdx} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.2 }}
                className="text-sm font-extrabold" style={{ color: C.navy }}>
                {FACE_SCENE_SAMPLES[activeIdx].name}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Indicator dots */}
      <div className="flex justify-center gap-2 mt-4">
        {FACE_SCENE_SAMPLES.map((_, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIdx ? 22 : 7, height: 7,
              background: i === activeIdx ? C.saffron : '#E5D5C0', border: 'none', cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}


const FACE_SIZE_BROCHURE = 72;

function BrochureThemeCard({ slug, icon, name, badge, description, ageRange, onClick }: { slug: string; icon: string; name: string; badge?: string; description?: string; ageRange?: string; onClick: () => void }) {
  const faceSamples = getFaceSamples(slug);
  const arrowTarget = getArrowTarget(slug);
  const [activeIdx, setActiveIdx] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { margin: '300px 0px' });

  // Latch: once the card has been visible once, keep its full image set mounted forever.
  useEffect(() => {
    if (inView && !hasLoaded) setHasLoaded(true);
  }, [inView, hasLoaded]);

  // Cycle interval pauses while offscreen, but the images themselves stay in the DOM.
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % faceSamples.length), 2000);
    return () => clearInterval(t);
  }, [inView, faceSamples.length]);

  return (
    <motion.div
      ref={cardRef}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: '1px solid #EBEBEB',
        background: C.white,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={onClick}>

      {/* Mockup image + face circle */}
      <div style={{ paddingTop: FACE_SIZE_BROCHURE / 2, position: 'relative' }}>
        <div style={{ aspectRatio: '4/3', background: '#F7F5F0', position: 'relative', overflow: 'hidden' }}>
          {!hasLoaded ? (
            <img
              src={`/themes_mockup/${slug}_${faceSamples[0].key}_mockup.webp`}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(1.3)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : faceSamples.map((sample, i) => (
            <motion.img
              key={sample.key}
              src={`/themes_mockup/${slug}_${sample.key}_mockup.webp`}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(1.3)' }}
              animate={{ opacity: i === activeIdx ? 1 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}
          {/* Arrow */}
          <svg viewBox="0 0 160 90" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
            <motion.path
              d={`M 148 4 Q 148 40 ${arrowTarget.x} ${arrowTarget.y}`}
              fill="none" stroke={C.saffron} strokeWidth="2.2" strokeDasharray="5 3" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ pathLength: { duration: 1.0, ease: 'easeInOut', delay: 0.2 }, opacity: { duration: 0.2 } }}
              key={activeIdx}
            />
            <motion.path
              d={`M ${arrowTarget.x + 8} ${arrowTarget.y - 5} L ${arrowTarget.x} ${arrowTarget.y} L ${arrowTarget.x + 7} ${arrowTarget.y + 5}`}
              fill="none" stroke={C.saffron} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
              key={`arrowhead-${activeIdx}`}
            />
          </svg>
          {badge && (
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 6, background: C.saffron, color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 50, padding: '3px 10px', letterSpacing: 0.3 }}>
              {badge}
            </div>
          )}
        </div>
        {/* Face circle */}
        <div style={{ position: 'absolute', top: 0, right: 12, width: FACE_SIZE_BROCHURE, height: FACE_SIZE_BROCHURE, zIndex: 10 }}>
          {!hasLoaded ? (
            <img src={faceSamples[0].face} alt="" loading="lazy" decoding="async" className="rounded-full"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                border: `2.5px solid ${C.saffron}`, boxShadow: '0 2px 10px rgba(255,107,53,0.3), 0 0 0 2px #fff' }} />
          ) : faceSamples.map((sample, i) => (
            <motion.img key={sample.face} src={sample.face} alt="" loading="lazy" decoding="async" className="rounded-full"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                border: `2.5px solid ${C.saffron}`, boxShadow: '0 2px 10px rgba(255,107,53,0.3), 0 0 0 2px #fff' }}
              animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.9 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }} />
          ))}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 14px 14px' }}>
        {/* Tags row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {badge && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,107,53,0.12)', color: C.saffron, borderRadius: 20, padding: '2px 9px' }}>{badge}</span>}
          <span style={{ fontSize: 11, fontWeight: 600, background: '#F3F4F6', color: '#555', borderRadius: 20, padding: '2px 9px' }}>26 Pages</span>
          {ageRange && <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginLeft: 'auto' }}>Ages {ageRange}</span>}
        </div>
        {/* Title */}
        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 17, color: C.navy, margin: '0 0 4px', lineHeight: 1.3 }}>
          {icon} {name}
        </p>
        {/* Description */}
        {description && (
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>
        )}
        {/* Price + button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: "'Baloo 2', sans-serif" }}>₹1,274</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', borderRadius: 20, padding: '2px 8px' }}>15% off</span>
            </div>
            <span style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 500 }}>₹1,499</span>
          </div>
          <button
            onClick={onClick}
            style={{ padding: '12px 22px', borderRadius: 12, background: `linear-gradient(135deg, ${C.saffron} 0%, #F7B731 100%)`, color: '#fff', border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 3px 12px rgba(255,107,53,0.35)', whiteSpace: 'nowrap', letterSpacing: 0.2 }}>
            Personalize
          </button>
        </div>
      </div>
    </motion.div>
  );
}


// ── ORDER FORM ─────────────────────────────────────────────────────────────

const STYLES = [
  { label: 'Pixar 3D',  img: '/styles/boy_pixar.webp',    available: true,  price: null,                                                       originalPrice: null },
  { label: 'Realistic', img: '/styles/boy_base.webp',     available: true,  price: Number(import.meta.env.VITE_REALISTIC_PRICE) || 1499,       originalPrice: 1699 },
];
const FORMATS = [
  { label: 'Immersive (Cinematic)', available: true },
  { label: 'Comic Book (Panels)',   available: false },
];

// ── Google "G" logo SVG ──────────────────────────────────────────────────────
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

type ReviewData = {
  rating: number;
  userRatingCount: number;
  reviews: { authorName: string; authorPhoto: string | null; rating: number; relativeTime: string; text: string }[];
};

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function ReviewsSection() {
  const [data, setData] = useState<ReviewData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reviews`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const avatarColors = ['#FF6B35', '#1A1A2E', '#F7B731', '#2E7D32', '#6A1B9A'];
  const avatarColor = (name: string) =>
    avatarColors[name.charCodeAt(0) % avatarColors.length];

  return (
    <section style={{ background: '#FAFAFA' }} className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GoogleG />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5F6368' }}>Google Reviews</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#1A1A2E' }}>
                {data.rating.toFixed(1)}
              </span>
              <span style={{ color: '#F7B731', fontSize: 22, letterSpacing: -1 }}>{'★'.repeat(Math.round(data.rating))}</span>
              <span className="text-sm" style={{ color: '#888' }}>· {data.userRatingCount} reviews</span>
            </div>
          </div>
          <a
            href={`https://search.google.com/local/reviews?placeid=${import.meta.env.VITE_GOOGLE_PLACE_ID || ''}`}
            target="_blank" rel="noopener noreferrer"
            className="text-sm font-bold flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-full border transition-colors hover:bg-gray-50"
            style={{ color: '#4285F4', borderColor: '#DADCE0' }}>
            <GoogleG /> See all on Google
          </a>
        </motion.div>

        {/* Scrollable cards */}
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {data.reviews.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="flex-shrink-0 rounded-2xl p-5 flex flex-col gap-3"
              style={{ width: 300, scrollSnapAlign: 'start', background: '#FFFFFF', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #F0F0F0' }}>
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {r.authorPhoto ? (
                    <img src={r.authorPhoto} alt={r.authorName}
                      className="rounded-full object-cover" style={{ width: 38, height: 38 }} />
                  ) : (
                    <div className="rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ width: 38, height: 38, background: avatarColor(r.authorName), flexShrink: 0 }}>
                      {initials(r.authorName)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold leading-tight" style={{ color: '#1A1A2E' }}>{r.authorName}</p>
                    <p className="text-xs" style={{ color: '#AAA' }}>{r.relativeTime}</p>
                  </div>
                </div>
                <GoogleG />
              </div>
              {/* Stars */}
              <p style={{ color: '#F7B731', fontSize: 16, letterSpacing: 1 }}>{stars(r.rating)}</p>
              {/* Text */}
              <p className="text-sm leading-relaxed" style={{ color: '#444' }}>{r.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrderForm({ price }: { price: number; scrollTo: (id: string) => void }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedTheme = searchParams.get('theme') || '';

  const FORM_STORAGE_KEY = 'protago_form_draft';
  const savedDraft = (() => { try { return JSON.parse(localStorage.getItem(FORM_STORAGE_KEY) || '{}'); } catch { return {}; } })();

  const [form, setForm] = useState({
    parentName: savedDraft.parentName || '',
    email: savedDraft.email || '',
    phone: savedDraft.phone || '',
    childName: savedDraft.childName || '',
    childAge: savedDraft.childAge || '',
    childGender: savedDraft.childGender || '',
    storyTheme: preselectedTheme || savedDraft.storyTheme || '',
    artStyle: savedDraft.artStyle || '',
    storyFormat: savedDraft.storyFormat || '',
    addressLine1: savedDraft.addressLine1 || '',
    addressLine2: savedDraft.addressLine2 || '',
    city: savedDraft.city || '',
    state: savedDraft.state || '',
    pincode: savedDraft.pincode || '',
    notes: savedDraft.notes || '',
  });
  type PhotoEntry = { file: File; preview: string; uploading: boolean; progress: number; uploadedPath: string | null; signedUrl: string | null };
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number; finalPrice: number; discountType: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const selectedStyle = STYLES.find(s => s.label === form.artStyle);
  const stylePrice = selectedStyle?.price ?? null;
  const styleOriginalPrice = selectedStyle?.originalPrice ?? null;
  const effectivePrice = stylePrice ?? price;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const set = (k: string, v: string) => setForm(f => {
    const next = { ...f, [k]: v };
    try { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
    return next;
  });

  // Sync storyTheme when ?theme= param changes (e.g. navigating from modal)
  useEffect(() => {
    if (preselectedTheme) setForm(f => ({ ...f, storyTheme: preselectedTheme }));
  }, [preselectedTheme]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, finalPrice: data.finalPrice, discountType: data.discountType, discountValue: data.discountValue });
        setCouponError('');
        trackEvent('coupon_applied', { coupon_code: couponInput.trim().toUpperCase(), discount_amount: data.discountAmount });
      } else {
        setCouponApplied(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const anyUploading = photos.some(p => p.uploading);

  const handlePhotoAdd = async (file: File) => {
    if (photos.length >= 3) return;
    trackEvent('photo_added', { photo_count: photos.length + 1 });
    const preview = URL.createObjectURL(file);
    const idx = photos.length;
    setPhotos(prev => [...prev, { file, preview, uploading: true, progress: 0, uploadedPath: null, signedUrl: null }]);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/upload-photo`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, progress: Math.round((e.loaded / e.total) * 100) } : p));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, uploading: false, progress: 100, uploadedPath: data.photo_url || null, signedUrl: data.photo_signed_url || null } : p));
            } catch (err) {
              console.error('[upload] parse error:', err, xhr.responseText);
            }
            resolve();
          } else {
            console.error('[upload] failed:', xhr.status, xhr.responseText);
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload error'));
        xhr.send(JSON.stringify({ photo: base64 }));
      });
    } catch {
      setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, uploading: false } : p));
    }
  };

  const handlePhotoRemove = (idx: number) => {
    setPhotos(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  };

  const proceedWithPayment = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setSubmitError('');
    trackEvent('order_initiated', {
      theme: form.storyTheme,
      art_style: form.artStyle,
      story_format: form.storyFormat,
      has_coupon: !!couponApplied,
      coupon_code: couponApplied?.code || '',
      photo_count: photos.length,
    });
    try {
      const photoPath = photos[0]?.uploadedPath || null;
      const photoSignedUrl = photos[0]?.signedUrl || null;
      const additionalPhotoPaths = photos.slice(1).map(p => p.uploadedPath).filter(Boolean);
      const additionalPhotoSignedUrls = photos.slice(1).map(p => p.signedUrl).filter(Boolean);

      const res = await fetch(`${API_BASE}/api/order-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photoPath,
          photoSignedUrl,
          additionalPhotoPaths,
          additionalPhotoSignedUrls,
          couponCode: couponApplied?.code || null,
          referralSource: localStorage.getItem('protago_ref') || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create order');
      }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();

      // Dev/mock mode — no real Razorpay keys
      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        localStorage.removeItem(FORM_STORAGE_KEY);
        setSubmitting(false);
        navigate('/order-confirmed', { state: { childName: form.childName, email: form.email, amount: amount / 100 } });
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Protago',
        description: `Personalised Storybook for ${form.childName}`,
        order_id: orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            localStorage.removeItem(FORM_STORAGE_KEY);
            // Fire-and-forget confirmation email
            fetch(`${API_BASE}/api/order/send-confirmation-email`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id }),
            }).catch(() => {/* non-critical */});
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'Purchase');
            trackEvent('purchase', {
              theme: form.storyTheme,
              art_style: form.artStyle,
              coupon_code: couponApplied?.code || '',
              value: couponApplied ? couponApplied.finalPrice : effectivePrice,
              currency: 'INR',
            });
            navigate('/order-confirmed', { state: { childName: form.childName, email: form.email, amount: amount / 100 } });
          } catch {
            setSubmitError('Payment verification failed. Please contact support.');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: { name: form.parentName, email: form.email, contact: form.phone },
        theme: { color: '#FF6B35' },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setSubmitError('Payment was cancelled. Please try again.');
          },
        },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setShowConfirm(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid #E5E7EB`,
    fontSize: 14, color: C.navy, outline: 'none', background: C.white,
    fontFamily: "'Nunito', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: C.gray,
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <section id="order" style={{ background: C.warmTint }} className="py-16 sm:py-20">
      <div className="max-w-2xl mx-auto px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
          {eyebrow('Place your order')}
          {heading(<>Create your child's<br />personalised storybook.</>)}
          <p className="text-sm mt-3 leading-relaxed" style={{ color: C.gray }}>
            Fill in the details below and we'll bring your child's story to life. Starting at ₹{price}.
          </p>
        </motion.div>

        {(
          <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="rounded-3xl p-6 sm:p-8 flex flex-col gap-6"
            style={{ background: C.white, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

            {/* ── Parent details */}
            <div>
              <p className="text-sm font-extrabold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                Your details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Your name *</label>
                  <input required style={inputStyle} placeholder="e.g. Priya Sharma"
                    value={form.parentName} onChange={e => set('parentName', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input required type="email" style={inputStyle} placeholder="you@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label style={labelStyle}>WhatsApp / Phone *</label>
                  <input required style={inputStyle} placeholder="+91 98765 43210"
                    value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#F0F0F0' }} />

            {/* ── Child details */}
            <div>
              <p className="text-sm font-extrabold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                About your child
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Child's name *</label>
                  <input required style={inputStyle} placeholder="e.g. Arjun"
                    value={form.childName} onChange={e => set('childName', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Age *</label>
                  <select required style={inputStyle} value={form.childAge} onChange={e => set('childAge', e.target.value)}>
                    <option value="">Select age</option>
                    {Array.from({ length: 10 }, (_, i) => i + 3).map(a => (
                      <option key={a} value={a}>{a} years old</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Gender *</label>
                  <div className="flex gap-2">
                    {['Boy', 'Girl', 'Other'].map(g => (
                      <button type="button" key={g}
                        onClick={() => set('childGender', g)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: form.childGender === g ? C.saffron : '#F5F5F5',
                          color: form.childGender === g ? C.white : C.gray,
                          border: `1.5px solid ${form.childGender === g ? C.saffron : 'transparent'}`,
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label style={labelStyle}>Child's photos * <span style={{ color: C.lgray, fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(up to 3)</span></label>

                  {/* Visual tips */}
                  <div className="rounded-xl p-3 mb-3" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-center mb-3" style={{ color: C.lgray }}>Tips</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { img: '/photo-tips/good.avif',        label: 'Clear front-facing photo',  good: true  },
                        { img: '/photo-tips/group.jpg',        label: 'Only one person',            good: false },
                        { img: '/photo-tips/sunglasses.avif',  label: 'No accessories',             good: false },
                        { img: '/photo-tips/sideangle.jpg',    label: 'No side angle',              good: false },
                      ].map(({ img, label, good }) => (
                        <div key={label} className="flex flex-col items-center gap-1.5">
                          <div className="relative" style={{ width: 80, height: 80 }}>
                            <img src={img} alt={label}
                              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top',
                                border: `3px solid ${good ? '#22C55E' : '#EF4444'}` }} />
                            <div style={{
                              position: 'absolute', bottom: 0, right: 0,
                              width: 22, height: 22, borderRadius: '50%',
                              background: good ? '#22C55E' : '#EF4444',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, color: '#fff', fontWeight: 800,
                              border: '2px solid #fff',
                            }}>
                              {good ? '✓' : '✕'}
                            </div>
                          </div>
                          <p className="text-center leading-tight" style={{ fontSize: 9, color: C.gray }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photo slots */}
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden"
                        style={{ aspectRatio: '1/1', background: '#F0EEE8', border: `2px solid ${C.saffron}` }}>
                        <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {p.uploading && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <p className="text-white text-xs font-bold">{p.progress}%</p>
                            <div style={{ width: '70%', height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${p.progress}%`, background: '#fff', borderRadius: 2, transition: 'width 0.2s' }} />
                            </div>
                          </div>
                        )}
                        {!p.uploading && (
                          <button type="button" onClick={() => handlePhotoRemove(i)}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <label className="rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                        style={{ aspectRatio: '1/1', border: `2px dashed #D1D5DB`, background: '#FAFAFA' }}>
                        <span style={{ fontSize: 22 }}>+</span>
                        <span className="text-xs font-semibold" style={{ color: C.lgray }}>Add photo</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoAdd(f); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#F0F0F0' }} />

            {/* ── Story customisation */}
            <div>
              <p className="text-sm font-extrabold mb-4" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                Customise the story
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label style={labelStyle}>Theme *</label>

                  {(['3–5', '6–8', '9–12'] as const).map(range => {
                    const rangeThemes = THEMES.filter(t => !t.category && (Array.isArray(t.ageRange) ? t.ageRange.includes(range) : t.ageRange === range));
                    const isRelevant = form.childAge ? ageToRange(Number(form.childAge)) === range : true;
                    return (
                      <div key={range} className="mb-3">
                        <p className="text-xs font-bold mb-2" style={{ color: isRelevant ? C.saffron : C.lgray }}>
                          Ages {range} {isRelevant && form.childAge ? '✓ recommended' : ''}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {rangeThemes.map(t => {
                            const selected = form.storyTheme === t.slug;
                            return (
                              <button type="button" key={t.slug}
                                onClick={() => set('storyTheme', t.slug)}
                                className="rounded-xl overflow-hidden text-left transition-all"
                                style={{
                                  border: `2.5px solid ${selected ? C.saffron : '#E5E7EB'}`,
                                  opacity: isRelevant ? 1 : 0.5,
                                  outline: 'none',
                                }}>
                                <div style={{ aspectRatio: '16/9', background: '#F0EEE8', position: 'relative' }}>
                                  <img src={`/themes/${t.slug}@thumb.webp`} alt={t.name}
                                    loading="lazy" decoding="async"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                  {selected && (
                                    <div style={{ position: 'absolute', top: 4, right: 4, background: C.saffron, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>
                                    </div>
                                  )}
                                </div>
                                <div style={{ padding: '4px 6px 5px', background: selected ? C.saffron : C.navy }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{t.icon} {t.name}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Mythology themes group */}
                  {(() => {
                    const mythThemes = THEMES.filter(t => t.category === 'mythology');
                    if (!mythThemes.length) return null;
                    return (
                      <div className="mb-3">
                        <p className="text-xs font-bold mb-2" style={{ color: C.gold }}>🪬 Mythology</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                          {mythThemes.map(t => {
                            const selected = form.storyTheme === t.slug;
                            return (
                              <button type="button" key={t.slug}
                                onClick={() => set('storyTheme', t.slug)}
                                className="rounded-xl overflow-hidden text-left transition-all"
                                style={{ border: `2.5px solid ${selected ? C.saffron : '#E5E7EB'}`, outline: 'none' }}>
                                <div style={{ aspectRatio: '4/3', background: '#F0EEE8', position: 'relative' }}>
                                  <img src={`/themes_mockup/${t.slug}_boy_young_mockup.webp`} alt={t.name}
                                    loading="lazy" decoding="async"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(1.3)' }} />
                                  {selected && (
                                    <div style={{ position: 'absolute', top: 4, right: 4, background: C.saffron, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>
                                    </div>
                                  )}
                                </div>
                                <div style={{ padding: '4px 6px 5px', background: selected ? C.saffron : C.navy }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{t.icon} {t.name}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label style={labelStyle}>Art style *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STYLES.map(s => {
                      const lockedOut = false;
                      const discountPct = s.originalPrice && s.price
                        ? Math.round(((s.originalPrice - s.price) / s.originalPrice) * 100)
                        : 0;
                      return (
                      <button type="button" key={s.label}
                        onClick={() => !lockedOut && s.available && set('artStyle', s.label)}
                        className="rounded-xl overflow-hidden transition-all text-left relative"
                        style={{
                          border: `2px solid ${form.artStyle === s.label ? C.saffron : s.available ? '#E5E7EB' : '#F0F0F0'}`,
                          opacity: lockedOut ? 0.35 : s.available ? 1 : 0.6,
                          cursor: lockedOut || !s.available ? 'default' : 'pointer',
                        }}>
                        <div className="overflow-hidden relative" style={{ aspectRatio: '1/1', background: '#F5F5F5' }}>
                          <img src={s.img} alt={s.label} loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
                          {discountPct > 0 && !lockedOut && (
                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md"
                                style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7B731 100%)', color: '#fff', letterSpacing: 0.3 }}>
                                {discountPct}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-2"
                          style={{ background: form.artStyle === s.label ? C.saffron : s.available ? C.navy : '#CCCCCC' }}>
                          <span className="text-xs font-bold text-white">{s.label}</span>
                          {!s.available && (
                            <span className="text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5"
                              style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>
                              Soon
                            </span>
                          )}
                          {s.available && s.price && !lockedOut && (
                            <span className="flex items-center gap-1">
                              {s.originalPrice && (
                                <span className="text-[9px] font-semibold line-through"
                                  style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  ₹{s.originalPrice}
                                </span>
                              )}
                              <span className="text-[10px] font-extrabold rounded-full px-1.5 py-0.5"
                                style={{ background: '#F7B731', color: C.navy }}>
                                ₹{s.price}
                              </span>
                            </span>
                          )}
                          {form.artStyle === s.label && !s.price && (
                            <span className="text-xs text-white">✓</span>
                          )}
                        </div>
                        {!s.available && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.45)' }}>
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full"
                              style={{ background: C.navy, color: C.white }}>
                              Coming Soon
                            </span>
                          </div>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Story format *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATS.map(({ label, available }) => (
                      <button type="button" key={label}
                        onClick={() => available && set('storyFormat', label)}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all relative"
                        style={{
                          background: form.storyFormat === label ? C.gold : '#F5F5F5',
                          color: form.storyFormat === label ? C.navy : available ? C.gray : '#BBBBBB',
                          border: `1.5px solid ${form.storyFormat === label ? C.gold : 'transparent'}`,
                          cursor: available ? 'pointer' : 'default',
                          opacity: available ? 1 : 0.7,
                        }}>
                        {label}
                        {!available && (
                          <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: C.saffron, color: '#fff' }}>Soon</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#F0F0F0' }} />

            {/* ── Delivery */}
            <div>
              <p className="text-sm font-extrabold mb-3" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
                Delivery address
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={labelStyle}>Address line 1 *</label>
                  <input required style={inputStyle} placeholder="Flat / House no., Building, Street"
                    value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Address line 2 (optional)</label>
                  <input style={inputStyle} placeholder="Area, Landmark"
                    value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label style={labelStyle}>City *</label>
                    <input required style={inputStyle} placeholder="e.g. Mumbai"
                      value={form.city} onChange={e => set('city', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>State *</label>
                    <input required style={inputStyle} placeholder="e.g. Maharashtra"
                      value={form.state} onChange={e => set('state', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label style={labelStyle}>Pincode *</label>
                    <input required style={inputStyle} placeholder="e.g. 400001" maxLength={6}
                      inputMode="numeric" pattern="[0-9]{6}"
                      value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Country</label>
                    <input style={{ ...inputStyle, color: C.lgray, background: '#F9FAFB' }} value="India" readOnly />
                  </div>
                </div>
              </div>
              <p className="text-xs mt-1.5" style={{ color: C.lgray }}>📦 Hardcopy delivered in 5–7 business days</p>
            </div>

            {/* ── Notes */}
            <div>
              <label style={labelStyle}>Any special requests? (optional)</label>
              <p className="text-xs mb-1.5" style={{ color: C.saffron, fontWeight: 600 }}>The more information you give, the better the story will be!</p>
              <textarea rows={2} style={{ ...inputStyle, resize: 'none' }}
                placeholder="e.g. My child loves dinosaurs, include them in the story!"
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

            {/* ── Coupon code */}
            <div style={{ height: 1, background: '#F0F0F0' }} />
            <div>
              <label style={labelStyle}>Coupon code (optional)</label>
              <div className="flex gap-2">
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="e.g. SHREYANKA20"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponApplied(null); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                  className="px-4 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
                  style={{ background: C.navy, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {couponLoading ? '…' : 'Apply'}
                </button>
              </div>
              {couponApplied && (
                <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ background: '#F0FFF4', border: '1.5px solid #22C55E' }}>
                  <div>
                    <span className="text-xs font-bold" style={{ color: '#16A34A' }}>✓ {couponApplied.code} applied!</span>
                    <span className="text-xs ml-2" style={{ color: '#16A34A' }}>
                      {couponApplied.discountType === 'percent' ? `${couponApplied.discountValue}% off` : `₹${couponApplied.discountAmount} off`}
                    </span>
                  </div>
                  <button type="button" onClick={() => { setCouponApplied(null); setCouponInput(''); }}
                    className="text-xs font-semibold" style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>{couponError}</p>}
            </div>

            {/* ── Submit */}
            {submitError && (
              <p className="text-sm text-red-500 text-center">{submitError}</p>
            )}
            {styleOriginalPrice && styleOriginalPrice > effectivePrice && !couponApplied && (
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(247,183,49,0.12) 100%)', border: '1.5px dashed rgba(255,107,53,0.35)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.saffron }}>Launch offer</span>
                    <span className="text-xs" style={{ color: C.gray }}>{form.artStyle} style</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold line-through" style={{ color: C.lgray }}>₹{styleOriginalPrice}</span>
                    <span className="text-lg font-extrabold" style={{ color: C.navy, fontFamily: "'Baloo 2', sans-serif" }}>₹{effectivePrice}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7B731 100%)', color: '#fff' }}>
                      {Math.round(((styleOriginalPrice - effectivePrice) / styleOriginalPrice) * 100)}% OFF
                    </span>
                  </div>
                </div>
              </div>
            )}
            {couponApplied && (
              <div className="flex items-center justify-between text-sm px-1">
                <span style={{ color: C.lgray }}>Original price</span>
                <span style={{ color: C.lgray, textDecoration: 'line-through' }}>₹{effectivePrice}</span>
              </div>
            )}
            <button type="submit" disabled={submitting || anyUploading}
              className="w-full py-4 rounded-2xl text-base font-extrabold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: C.gradient, fontFamily: "'Baloo 2', sans-serif" }}>
              {submitting ? 'Processing…' : anyUploading ? `Uploading photos…` : <>Pay ₹{couponApplied ? couponApplied.finalPrice : effectivePrice} & Order <ArrowRight size={16} /></>}
            </button>
            <p className="text-center text-xs" style={{ color: C.lgray }}>
              We'll confirm your order via WhatsApp/email within 24 hours.
            </p>
          </motion.form>
        )}
      </div>

      {/* ── Phone confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl p-8 w-full max-w-sm text-center"
              style={{ background: C.white }}>
              <p className="text-3xl mb-3">📱</p>
              <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.navy, fontSize: '1.2rem' }}>
                Confirm your number
              </h3>
              <p className="text-sm mt-2 mb-2" style={{ color: C.gray }}>
                We'll send order updates to:
              </p>
              <p className="text-xl font-bold mb-6" style={{ color: C.navy }}>{form.phone}</p>
              <button onClick={proceedWithPayment}
                className="w-full py-3 rounded-xl font-extrabold text-white mb-3"
                style={{ background: C.gradient, fontFamily: "'Baloo 2', sans-serif" }}>
                Yes, proceed to payment
              </button>
              <button onClick={() => setShowConfirm(false)}
                className="text-sm font-semibold" style={{ color: C.gray }}>
                Edit number
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Real child reaction carousel ────────────────────────────────────────────

const REACTION_VIDEOS = [
  { id: 'UoNgye4Y2DA', name: 'Harsh' },
  { id: 'OsUGHz9LILY', name: 'Shreyansh' },
];


function HeroVideo() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  // Auto-advance thumbnails only when not on the first video
  useEffect(() => {
    if (playing || active === 0) return;
    const t = setInterval(() => setActive(i => (i + 1) % REACTION_VIDEOS.length), 4000);
    return () => clearInterval(t);
  }, [playing, active]);

  // Reset state when slide changes
  useEffect(() => { setPlaying(false); setMuted(true); }, [active]);

  const { id, name } = REACTION_VIDEOS[active];
  const isFirst = active === 0;
  const showIframe = isFirst || playing;

  const iframeSrc = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}&controls=1&rel=0`;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl mx-auto aspect-[9/16] max-h-[55vh] sm:aspect-auto sm:max-h-none sm:h-full">
      {showIframe ? (
        <>
          <iframe
            key={id}
            src={iframeSrc}
            title={name}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
          {muted && (
            <button
              onClick={() => {
                setMuted(false);
                // Reload iframe without mute to unmute
                const iframe = document.querySelector(`iframe[title="${name}"]`) as HTMLIFrameElement;
                if (iframe) iframe.src = iframeSrc.replace('mute=1', 'mute=0');
              }}
              style={{
                position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
                zIndex: 5, background: 'rgba(0,0,0,0.65)', border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: 50, color: '#fff', fontSize: 13, fontWeight: 700,
                padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
                backdropFilter: 'blur(6px)',
              }}
            >
              🔇 Tap to unmute
            </button>
          )}
        </>
      ) : (
        <div onClick={() => setPlaying(true)} style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
          <img
            src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Dark overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          {/* Play button */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill={C.saffron}>
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', zIndex: 3, pointerEvents: 'none' }}>
        <p className="text-[11px] font-bold text-white">Real child reaction</p>
        <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Watch their story unfold
        </p>
      </div>

      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 4 }}>
        {REACTION_VIDEOS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ width: i === active ? 20 : 7, height: 7, borderRadius: 4, background: i === active ? C.saffron : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.3s ease, background 0.3s ease' }} />
        ))}
      </div>
    </div>
  );
}

// ── Custom story inquiry section ─────────────────────────────────────────────

function CustomStorySection() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const navigate = useNavigate();
  const CUSTOM_PRICE = 1980;

  const [form, setForm] = useState({ parentName: '', email: '', phone: '', childName: '', childAge: '', childGender: '', customStoryBrief: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
  const [photo, setPhoto] = useState<{ preview: string; uploading: boolean; uploadedPath: string | null; signedUrl: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', ...style,
  });
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#9CA3AF', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' };

  const handlePhotoChange = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setPhoto({ preview, uploading: true, uploadedPath: null, signedUrl: null });
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${API_BASE}/api/upload-photo`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: base64 }),
      });
      const data = await res.json();
      setPhoto({ preview, uploading: false, uploadedPath: data.photo_url || null, signedUrl: data.photo_signed_url || null });
    } catch {
      setPhoto(prev => prev ? { ...prev, uploading: false } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.phone || !form.childName || !form.customStoryBrief) return;
    if (!photo?.uploadedPath) {
      setError("Please upload your child's photo");
      return;
    }
    if (!form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setError('Please fill in the full delivery address');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/order-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isCustomStory: true,
          photoPath: photo?.uploadedPath || null,
          photoSignedUrl: photo?.signedUrl || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to submit'); }
      const { orderId, razorpayKeyId, amount, currency } = await res.json();

      if (!razorpayKeyId || razorpayKeyId.includes('your_')) {
        navigate('/order-confirmed', { state: { childName: form.childName, email: form.email, amount: CUSTOM_PRICE } });
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Protago',
        description: `Custom Story for ${form.childName}`,
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
            navigate('/order-confirmed', { state: { childName: form.childName, email: form.email, amount: amount / 100 } });
          } catch {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setSubmitting(false);
          }
        },
        prefill: { name: form.parentName, email: form.email, contact: form.phone },
        theme: { color: '#FF6B35' },
        modal: { ondismiss: () => { setSubmitting(false); setError('Payment was cancelled. Please try again.'); } },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div id="custom-story" style={{ background: C.warmTint, borderRadius: 24, padding: '48px 32px', border: '1px solid #F0EEE8' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ display: 'inline-block', background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 20, padding: '4px 14px', marginBottom: 16 }}>Custom Story</span>
          <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 5vw, 38px)', color: C.navy, margin: '0 0 12px', lineHeight: 1.2 }}>
            Your story, your rules
          </h2>
          <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.65, maxWidth: 520, margin: '0 auto' }}>
            Have a unique idea — a birthday adventure, a family trip, a lesson you want them to live?
            Share the brief and we'll write &amp; illustrate it completely bespoke.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '32px 28px', border: '1px solid #F0EEE8' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Parent details */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Your details</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {([['parentName', 'Your name', 'Priya Sharma', 'text'], ['email', 'Email *', 'you@email.com', 'email']] as [string,string,string,string][]).map(([key, label, placeholder, type]) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input required={label.includes('*')} type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                      onChange={e => set(key, e.target.value)}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                ))}
                <div>
                  <label style={lbl}>WhatsApp *</label>
                  <div style={{ display: 'flex', border: '1.5px solid #E5E7EB', borderRadius: 9, overflow: 'hidden', background: '#fff' }}>
                    <span style={{ padding: '10px 10px', fontSize: 14, fontWeight: 700, color: C.gray, background: '#F9FAFB', borderRight: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center' }}>+91</span>
                    <input required type="tel" placeholder="98765 43210" maxLength={10}
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{ border: 'none', padding: '10px 12px', fontSize: 14, outline: 'none', flex: 1, fontFamily: 'inherit', background: 'transparent' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Child info */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Child's details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={lbl}>Name *</label>
                  <input required placeholder="Arjun" value={form.childName} onChange={e => set('childName', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    style={inp()} />
                </div>
                <div>
                  <label style={lbl}>Age</label>
                  <select value={form.childAge} onChange={e => set('childAge', e.target.value)} style={inp({ background: '#fff' })}>
                    <option value="">Age</option>
                    {Array.from({ length: 10 }, (_, i) => i + 3).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Gender</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Boy', 'Girl'].map(g => (
                      <button type="button" key={g} onClick={() => set('childGender', g)}
                        style={{ padding: '10px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${form.childGender === g ? C.saffron : '#E5E7EB'}`, background: form.childGender === g ? '#FFF3EE' : '#fff', color: form.childGender === g ? C.saffron : '#9CA3AF' }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Child photo */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Child's photo</p>
              {/* Photo tips */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.lgray, textAlign: 'center', margin: '0 0 8px' }}>Tips</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { img: '/photo-tips/good.avif',       label: 'Clear front-facing', good: true },
                    { img: '/photo-tips/group.jpg',       label: 'Only one person',    good: false },
                    { img: '/photo-tips/sunglasses.avif', label: 'No accessories',     good: false },
                    { img: '/photo-tips/sideangle.jpg',   label: 'No side angle',      good: false },
                  ].map(({ img, label, good }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ position: 'relative', width: 52, height: 52 }}>
                        <img src={img} alt={label} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: `2.5px solid ${good ? '#22C55E' : '#EF4444'}` }} />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: good ? '#22C55E' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 800, border: '1.5px solid #fff' }}>
                          {good ? '✓' : '✕'}
                        </div>
                      </div>
                      <p style={{ fontSize: 8, color: C.gray, textAlign: 'center', lineHeight: 1.3, margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {photo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={photo.preview} alt="Child" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '2px solid #E5E7EB' }} />
                  <div style={{ flex: 1 }}>
                    {photo.uploading
                      ? <p style={{ fontSize: 13, color: C.lgray, margin: 0 }}>Uploading…</p>
                      : <p style={{ fontSize: 13, color: '#22C55E', fontWeight: 700, margin: 0 }}>✓ Photo uploaded</p>
                    }
                  </div>
                  <button type="button" onClick={() => setPhoto(null)}
                    style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.gray, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px', border: '2px dashed #E5E7EB', borderRadius: 12, cursor: 'pointer', background: '#FAFAFA' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.saffron)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                  <span style={{ fontSize: 34 }}>📸</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Upload child's photo</span>
                  <span style={{ fontSize: 11, color: C.lgray }}>Clear, front-facing · JPG or PNG</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f); }} />
                </label>
              )}
            </div>

            {/* Story brief */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Your story idea</p>
              <textarea required rows={5} value={form.customStoryBrief} onChange={e => set('customStoryBrief', e.target.value)}
                placeholder="e.g. Arjun's 5th birthday — he loves dinosaurs and wants to be a palaeontologist. The story should show him on a dig discovering a new species, learning that patience pays off, and naming it after his little sister..."
                onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                style={{ ...inp(), resize: 'vertical', lineHeight: 1.6 }} />
              <p style={{ fontSize: 13, color: C.lgray, margin: '4px 0 0' }}>Characters · setting · the lesson · any real names or places — more detail = better book</p>
            </div>

            {/* Delivery address */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Delivery address</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={lbl}>Address line 1 *</label>
                  <input required placeholder="House / flat / building" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    style={inp()} />
                </div>
                <div>
                  <label style={lbl}>Address line 2</label>
                  <input placeholder="Street / area / landmark" value={form.addressLine2} onChange={e => set('addressLine2', e.target.value)}
                    onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    style={inp()} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 10 }}>
                  <div>
                    <label style={lbl}>City *</label>
                    <input required placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                  <div>
                    <label style={lbl}>State *</label>
                    <input required placeholder="Maharashtra" value={form.state} onChange={e => set('state', e.target.value)}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                  <div>
                    <label style={lbl}>Pincode *</label>
                    <input required placeholder="400001" maxLength={6} value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onFocus={e => (e.target.style.borderColor = C.saffron)} onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                      style={inp()} />
                  </div>
                </div>
              </div>
            </div>

            {error && <p style={{ fontSize: 13, color: '#C0392B', margin: 0 }}>{error}</p>}

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', background: '#FFF7ED', borderRadius: 12, border: '1px solid #FFE4CC' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#22C55E', borderRadius: 50, padding: '2px 10px' }}>10% OFF</span>
              <span style={{ fontSize: 18, color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>₹2,200</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: "'Baloo 2', sans-serif" }}>Starting ₹1,980</span>
            </div>

            <button type="submit" disabled={submitting || !!photo?.uploading || !photo?.uploadedPath}
              style={{ background: (submitting || photo?.uploading || !photo?.uploadedPath) ? '#E5E7EB' : `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, color: (submitting || photo?.uploading || !photo?.uploadedPath) ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 800, fontSize: 16, cursor: (submitting || photo?.uploading || !photo?.uploadedPath) ? 'default' : 'pointer', fontFamily: "'Baloo 2', sans-serif", boxShadow: (submitting || photo?.uploading || !photo?.uploadedPath) ? 'none' : '0 4px 16px rgba(255,107,53,0.4)' }}>
              {photo?.uploading ? 'Uploading photo…' : submitting ? 'Processing…' : 'Pay ₹1,980 & Order →'}
            </button>
            <p style={{ fontSize: 11, color: C.lgray, textAlign: 'center', margin: '-8px 0 0' }}>Secure payment · We'll contact you within 24 hours to finalise the story</p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export function BrochurePage() {
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [themesTab, setThemesTab]     = useState<'3–5' | '6–8' | '9–12'>('3–5');
  const [heroSlide, setHeroSlide]     = useState(0);
  const price = Number(import.meta.env.VITE_STORYBOOK_PRICE) || 499;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(i => (i + 1) % HERO_SLIDES.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Pre-warm the next hero slide so it's ready by the time we cycle to it,
  // without blocking initial paint.
  useEffect(() => {
    const next = (heroSlide + 1) % HERO_SLIDES.length;
    const id = setTimeout(() => {
      const img = new Image();
      img.src = HERO_SLIDES[next].src;
    }, 500);
    return () => clearTimeout(id);
  }, [heroSlide]);

  // Auto-scroll when arriving from another page via ?scroll= or ?theme=
  useEffect(() => {
    const anchor = searchParams.get('scroll') || (searchParams.get('theme') ? 'order' : null);
    if (anchor) {
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [searchParams]);

  // Capture influencer referral from ?ref= and persist in localStorage
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('protago_ref', ref);
  }, [searchParams]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* ── HEADER ─────────────────────────────── */}
      <NavBar />

      {/* ══════════════════════════════════════════
          § 0  TOP HERO — face-swap animation + video testimonial
      ══════════════════════════════════════════ */}
      <section style={{ background: C.navy }} className="pt-36 pb-14 sm:pt-32 sm:pb-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-center mb-4"
            style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white,
              fontSize: 'clamp(1.3rem, 3vw, 2rem)', lineHeight: 1.1 }}>
            Give your child a storybook<br />where they are the hero
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col items-center mb-6 sm:mb-8">
            <button
              onClick={() => scrollTo('themes')}
              className="py-4 px-10 rounded-2xl font-extrabold"
              style={{ background: C.saffron, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", fontSize: 16, boxShadow: '0 4px 20px rgba(255,107,53,0.45)' }}>
              ✨ Generate Free Preview
            </button>
            <p className="text-center mt-2 text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Free · ~2 min · No card required
            </p>
          </motion.div>
          {/* Two-panel: animation + video — same height, aligned top-to-bottom */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-6 items-stretch">

            {/* Left on desktop, bottom on mobile — multi-theme face swap animation */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full sm:w-1/2 min-w-0 flex flex-col">
              <HeroFaceSwapAnimation />
              {/* Free preview CTA */}
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                onClick={() => scrollTo('themes')}
                className="w-full py-4 rounded-2xl font-extrabold text-base mt-3"
                style={{ background: C.saffron, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Baloo 2', sans-serif", fontSize: 16, boxShadow: '0 4px 20px rgba(255,107,53,0.45)' }}>
                ✨ Generate Free Preview
              </motion.button>
              <p className="text-center mt-2 text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Free · ~2 min · No card required
              </p>
            </motion.div>

            {/* Right on desktop, top on mobile — real child reaction carousel */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full sm:w-1/2 mx-auto sm:mx-0">
              <HeroVideo />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § THEMES — white
      ══════════════════════════════════════════ */}
      <section id="themes" style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            {heading(<>Choose your story &amp; start personalising</>)}
            <p className="text-sm mt-3 leading-relaxed" style={{ color: C.gray }}>
              Pick a theme, enter your child's name and photo — we'll put them at the centre of the adventure.
            </p>
          </motion.div>

          {(() => {
            const AGE_TABS = [
              { range: '3–5'  as const, label: 'Pre-school',    color: '#FF6B35' },
              { range: '6–8'  as const, label: 'Early School',  color: '#F7B731' },
              { range: '9–12' as const, label: 'Upper Primary', color: '#1A1A2E' },
            ];
            const tabThemes = THEMES.filter(t => !t.category && (Array.isArray(t.ageRange) ? t.ageRange.includes(themesTab) : t.ageRange === themesTab));
            const mythologyThemes = THEMES.filter(t => t.category === 'mythology');
            return (
              <>
                <div className="flex gap-2 mb-6">
                  {AGE_TABS.map(g => (
                    <button key={g.range} onClick={() => setThemesTab(g.range)}
                      className="flex-1 py-2.5 rounded-2xl font-extrabold transition-all text-center"
                      style={{
                        background: themesTab === g.range ? g.color : C.white,
                        color: themesTab === g.range ? '#fff' : C.lgray,
                        border: `2px solid ${themesTab === g.range ? g.color : '#E5E7EB'}`,
                        fontFamily: "'Baloo 2', sans-serif",
                        fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer',
                      }}>
                      {g.range}
                      <span className="block opacity-80" style={{ fontSize: 10, fontWeight: 600 }}>{g.label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={themesTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {tabThemes.slice(0, 6).map(t => (
                      <BrochureThemeCard key={t.slug} slug={t.slug} icon={t.icon} name={t.name} description={t.description} ageRange={Array.isArray(t.ageRange) ? t.ageRange.join(', ') : t.ageRange} badge={['colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school', 'managing-emotions', 'indian-festivals', 'phonics-reading', 'history-india', 'financial-literacy', 'growth-mindset', 'professions', 'internet-safety', 'body-safety'].includes(t.slug) ? '✨ 9-Page Preview' : undefined} onClick={() => navigate(`/theme/${t.slug}`)} />
                    ))}

                    {/* ── Custom story card — 7th slot ── */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      onClick={() => document.getElementById('custom-story')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      style={{ borderRadius: 20, border: `2px dashed ${C.saffron}`, background: 'linear-gradient(135deg, #FFF3EE 0%, #FFF8F0 100%)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '32px 24px', textAlign: 'center', minHeight: 200 }}
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(255,107,53,0.18)' }}>
                      <span style={{ fontSize: 48 }}>✨</span>
                      <div>
                        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 21, color: C.navy, margin: '0 0 8px' }}>Your own story</p>
                        <p style={{ fontSize: 15, color: C.gray, margin: 0, lineHeight: 1.5 }}>Don't see the right theme?<br />We'll write it from scratch.</p>
                      </div>
                      <span style={{ background: `linear-gradient(135deg, ${C.saffron} 0%, #FF8C42 100%)`, color: '#fff', borderRadius: 10, padding: '10px 22px', fontWeight: 800, fontSize: 15, fontFamily: "'Baloo 2', sans-serif", boxShadow: '0 4px 12px rgba(255,107,53,0.35)' }}>
                        Request Custom Story →
                      </span>
                    </motion.div>

                    {tabThemes.slice(6).map(t => (
                      <BrochureThemeCard key={t.slug} slug={t.slug} icon={t.icon} name={t.name} description={t.description} ageRange={Array.isArray(t.ageRange) ? t.ageRange.join(', ') : t.ageRange} badge={['colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school', 'managing-emotions', 'indian-festivals', 'phonics-reading', 'history-india', 'financial-literacy', 'growth-mindset', 'professions', 'internet-safety', 'body-safety'].includes(t.slug) ? '✨ 9-Page Preview' : undefined} onClick={() => navigate(`/theme/${t.slug}`)} />
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* ── Mythology Themes ─────────────────────────────── */}
                {mythologyThemes.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mt-10 rounded-3xl p-6 sm:p-8"
                    style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #2D1B4E 100%)', border: '1.5px solid rgba(247,183,49,0.25)' }}>
                    <div className="mb-5">
                      <span className="text-xs font-extrabold tracking-widest uppercase px-3 py-1 rounded-full"
                        style={{ background: 'rgba(247,183,49,0.15)', color: C.gold, border: '1px solid rgba(247,183,49,0.3)' }}>
                        🪬 Mythology Themes
                      </span>
                      <p className="mt-3 font-extrabold text-lg" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#fff' }}>
                        Epics reimagined — your child as the hero
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Step into Ramayana and Mahabharata scenes with your child's face in every illustration.
                      </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                      {mythologyThemes.map(t => (
                        <BrochureThemeCard key={t.slug} slug={t.slug} icon={t.icon} name={t.name} description={t.description} ageRange={Array.isArray(t.ageRange) ? t.ageRange.join(', ') : t.ageRange} badge={['colours-shapes', 'bedtime-routines', 'numbers-maths', 'sharing-sorry', 'first-day-school', 'managing-emotions', 'indian-festivals', 'phonics-reading', 'history-india', 'financial-literacy', 'growth-mindset', 'professions', 'internet-safety', 'body-safety'].includes(t.slug) ? '✨ 9-Page Preview' : undefined} onClick={() => navigate(`/theme/${t.slug}`)} />
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="mt-8 text-center">
                  <p className="text-xs" style={{ color: C.lgray }}>Click any theme to see how we personalise it for your child</p>
                </div>
              </>
            );
          })()}

          {/* Custom story — below all themes */}
          <div className="mt-10">
            <CustomStorySection />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § HERO  — warm gradient (hidden)
      ══════════════════════════════════════════ */}
      {false && <section id="hero" style={{ background: C.gradient }} className="pt-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-start gap-0">

          {/* Text — left column */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="flex-none w-full sm:w-[44%] pt-10 sm:pt-16 pb-8 sm:pb-16 pr-0 sm:pr-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-xs font-bold uppercase tracking-widest w-fit"
              style={{ background: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.9)' }}>
              Ages 3–12
            </div>
            <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: '#3D1A00', lineHeight: 1.05, fontSize: 'clamp(1.9rem,3.5vw,3rem)' }}
              className="mb-4">
              Every child is the{' '}
              <span style={{ color: C.white }}>protagonist</span>{' '}
              of their story.
            </h1>
            <p className="text-base font-semibold mb-2 leading-relaxed" style={{ color: '#5C2E00' }}>
              Personalised storybooks written and illustrated by AI — with your child's name, face, and world on every page.
            </p>
            <p className="text-sm italic font-semibold mb-8" style={{ color: '#7B3F00' }}>
              Because every child deserves to be the protagonist.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => scrollTo('order')}
                className="px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: C.navy, color: C.white }}>
                Order Your Book <ArrowRight size={14} />
              </button>
              <button onClick={() => scrollTo('art-styles')}
                className="px-6 py-3 rounded-full font-bold text-sm transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.28)', color: '#3D1A00' }}>
                See Art Styles
              </button>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <span style={{ color: C.navy, fontSize: 13 }}>★★★★★</span>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Loved by 500+ families · from ₹{price}
              </span>
            </div>
          </motion.div>

          {/* Carousel — right column, fixed square aspect ratio, scenes anchored left */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex-1 relative sm:rounded-tl-3xl overflow-hidden"
            style={{ aspectRatio: '1 / 1' }}>
            {HERO_SLIDES.map((slide, i) => (
              <motion.img
                key={slide.src}
                src={slide.src}
                alt={slide.caption}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-left"
                animate={{ opacity: i === heroSlide ? 1 : 0, x: i === heroSlide ? 0 : (i < heroSlide ? -40 : 40) }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                style={{ zIndex: i === heroSlide ? 1 : 0 }}
              />
            ))}

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-20"
              style={{ background: 'linear-gradient(to top, #F7B731, transparent)', zIndex: 2 }} />

            {/* Caption */}
            <div className="absolute bottom-9 left-0 right-0 flex justify-center px-4" style={{ zIndex: 3 }}>
              <AnimatePresence mode="wait">
                <motion.span key={heroSlide}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
                  {HERO_SLIDES[heroSlide].caption}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setHeroSlide(i)}
                  className="rounded-full transition-all duration-300"
                  style={{ width: i === heroSlide ? 18 : 6, height: 6, background: i === heroSlide ? C.white : 'rgba(255,255,255,0.4)' }}
                />
              ))}
            </div>
          </motion.div>

        </div>
      </section>}

      {/* ══════════════════════════════════════════
          § 1.5  TESTIMONIAL VIDEO — soft bg
      ══════════════════════════════════════════ */}
      <section style={{ background: '#FFFAF5' }} className="py-14 sm:py-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col items-center text-center">
            {eyebrow('Real parents, real reactions')}
            {heading('See what parents are saying')}
            <p className="text-sm mt-3 mb-8 leading-relaxed max-w-md" style={{ color: C.gray }}>
              Nothing we say matters more than what they say.
            </p>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{ width: '100%', maxWidth: 360, aspectRatio: '9 / 16' }}>
              <iframe
                src="https://www.youtube.com/embed/OsUGHz9LILY"
                title="Parent testimonial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 2  ONE PHOTO — white
      ══════════════════════════════════════════ */}
      <section style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Your child, the hero')}
            {heading('One photo. Every scene, their face.')}
            <p className="text-sm mt-3 leading-relaxed max-w-lg" style={{ color: C.gray }}>
              Our AI preserves their likeness in your chosen art style — keeping everything that makes them recognisably them.
            </p>
          </motion.div>

          <FaceToSceneAnimation />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 3  ART STYLES — navy
      ══════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════
          § 4  STORY FORMATS — hidden
      ══════════════════════════════════════════ */}
      {false && <section id="books" style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-10">
            {eyebrow('Step 2 · Choose your story format')}
            {heading('Two ways to tell your child\'s story.')}
          </motion.div>

          <div className="flex flex-col gap-8">

            {/* Immersive */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="rounded-3xl overflow-hidden shadow-xl border" style={{ borderColor: '#F0F0F0' }}>
              <div className="px-6 py-5" style={{ background: C.saffron }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Format 1 of 2</p>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white, fontSize: '1.8rem', lineHeight: 1.05 }}>Immersive</h3>
                <p className="text-sm font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Cinematic · Full-page · Film-like</p>
              </div>
              {/* Full scene — natural aspect ratio, no cropping */}
              <img src="/styles/scene_immersive.webp" alt="Immersive scene" loading="lazy" decoding="async" className="w-full h-auto block" />
              <div className="px-6 py-5" style={{ background: C.white }}>
                <p className="text-sm leading-relaxed mb-3" style={{ color: C.gray }}>
                  Each page is a <strong style={{ color: C.navy }}>full-bleed cinematic illustration</strong> — rich scenery,
                  dramatic lighting, and your child at the centre of a vivid, beautiful world.
                </p>
                <div className="flex flex-wrap gap-5 mb-3">
                  {['Deep scene detail', 'Immersive atmosphere', 'Perfect for bedtime'].map(f => (
                    <span key={f} className="text-xs font-bold" style={{ color: C.navy }}>✓ {f}</span>
                  ))}
                </div>
                <span className="inline-block text-xs font-bold px-3 py-1 rounded-full" style={{ background: C.gold + '28', color: C.navy, border: `1px solid ${C.gold}` }}>
                  📖 26 pages including cover
                </span>
              </div>
            </motion.div>

            {/* Comic Book */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} className="rounded-3xl overflow-hidden shadow-xl border" style={{ borderColor: '#F0F0F0' }}>
              <div className="px-6 py-5" style={{ background: C.navy }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Format 2 of 2</p>
                <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white, fontSize: '1.8rem', lineHeight: 1.05 }}>Comic Book</h3>
                <p className="text-sm font-semibold mt-1" style={{ color: C.gold }}>Bold · Action panels · Graphic novel</p>
              </div>
              {/* Full comic spread — natural aspect ratio, no cropping */}
              <img src="/styles/scene_comic.webp" alt="Comic scene" loading="lazy" decoding="async" className="w-full h-auto block" />
              <div className="px-6 py-5" style={{ background: C.white }}>
                <p className="text-sm leading-relaxed mb-3" style={{ color: C.gray }}>
                  Each page is a <strong style={{ color: C.navy }}>bold comic panel spread</strong> — punchy action captions,
                  dramatic angles, and your child leaping off every page like a graphic novel hero.
                </p>
                <div className="flex flex-wrap gap-5">
                  {['High-energy action', 'Bold captions', 'Reluctant readers love it'].map(f => (
                    <span key={f} className="text-xs font-bold" style={{ color: C.navy }}>✓ {f}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>}

      {/* ══════════════════════════════════════════
          § 5  AGE INTELLIGENCE — warm tint
      ══════════════════════════════════════════ */}
      <section style={{ background: C.warmTint }} className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Age intelligence')}
            {heading('Written for their exact age.')}
            <p className="text-sm mt-3 leading-relaxed" style={{ color: C.gray }}>
              Our AI calibrates every sentence — length, vocabulary, tone — precisely to your child's age.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {ageTiers.map((tier, i) => (
              <motion.div key={tier.range} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: C.white, borderLeft: `5px solid ${tier.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                {/* Top row: emoji + range + tone + stat pills */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl flex-none">{tier.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold leading-tight" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy, fontSize: '1rem' }}>{tier.range}</p>
                    <p className="text-xs italic" style={{ color: C.lgray }}>{tier.tone}</p>
                  </div>
                  <div className="flex gap-2 flex-none">
                    {[['words/pg', tier.words], ['scenes', tier.scenes]].map(([lbl, val]) => (
                      <div key={lbl} className="text-center rounded-xl px-2.5 py-1.5" style={{ background: C.warmTint }}>
                        <p className="text-lg font-extrabold leading-none" style={{ fontFamily: "'Baloo 2', sans-serif", color: tier.borderColor }}>{val}</p>
                        <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: C.lgray }}>{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description below */}
                <p className="text-sm leading-relaxed" style={{ color: C.gray, paddingLeft: '2.25rem' }}>{tier.desc}</p>

              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 6  QUALITY & TRUST — hidden
      ══════════════════════════════════════════ */}
      {false && <section style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Quality you can trust')}
            {heading(<>Every story is checked,<br />then checked again.</>)}
            <p className="text-sm mt-3 leading-relaxed max-w-xl" style={{ color: C.gray }}>
              Our AI writes your child's story, then a completely separate AI independently reviews everything.
              If anything falls short, it's rewritten — before you ever see it.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4 mb-5">
            {qualityItems.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 flex items-center gap-5"
                style={{ background: C.warmTint, borderLeft: `4px solid ${C.saffron}` }}>
                <span className="text-3xl flex-none">{item.emoji}</span>
                <div>
                  <p className="font-bold mb-0.5" style={{ color: C.navy }}>{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: C.gray }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Score card */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: C.warmTint, borderLeft: `4px solid ${C.gold}` }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.gray }}>Typical story quality score</p>
              <p className="text-xs" style={{ color: C.lgray }}>Reviewed by a human quality expert</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.saffron }}>9.8 / 10</p>
              <p style={{ fontSize: 15 }}>⭐⭐⭐⭐⭐</p>
            </div>
          </motion.div>
        </div>
      </section>}

      {/* ══════════════════════════════════════════
          § 7  WHY IT MATTERS — hidden
      ══════════════════════════════════════════ */}
      {false && <section style={{ background: C.navy }} className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Why it matters', true)}
            {heading('A book with their name hits differently.', true)}
            <p className="text-sm mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Children engage more deeply and retain lessons better when they see themselves in the story.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {whyItems.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex items-start gap-4 p-5 rounded-2xl"
                style={{ background: C.navyCard, borderLeft: `4px solid ${C.saffron}` }}>
                <span className="text-2xl flex-none mt-0.5">{item.emoji}</span>
                <div>
                  <p className="font-bold mb-0.5" style={{ color: C.white }}>{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>}

      {/* ══════════════════════════════════════════
          § 8  HOW IT WORKS — warm gradient
      ══════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: C.gradient }} className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.75)', letterSpacing: '0.15em' }}>Simple process</p>
            <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: C.white, fontSize: 'clamp(1.7rem,3.5vw,2.4rem)', lineHeight: 1.05 }}>
              From name to printed book.
            </h2>
            <p className="text-sm font-semibold mt-2" style={{ color: 'rgba(255,255,255,0.85)' }}>Minutes on your side. Magic behind the scenes.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { emoji: '📝', n: '01', title: 'Tell us about\nyour child',   desc: 'Name, age, photo, theme and art style.' },
              { emoji: '✍️', n: '02', title: 'AI writes\nthe story',        desc: 'Unique, personalised, quality-checked.' },
              { emoji: '🎨', n: '03', title: 'AI creates\nevery scene',     desc: 'Full-page illustrations, your child in each.' },
              { emoji: '📦', n: '04', title: 'Your book\nships',            desc: 'Hardcopy delivered to your door in 5–7 business days.' },
            ].map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.35)' }}>
                <span className="text-3xl block mb-3">{step.emoji}</span>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Step {step.n}</p>
                <p className="font-extrabold text-sm mb-2 whitespace-pre-line leading-snug"
                  style={{ fontFamily: "'Baloo 2', sans-serif", color: C.white }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center rounded-2xl py-4 px-8" style={{ background: 'rgba(255,255,255,0.92)' }}>
            <p className="font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy, fontSize: '1.1rem' }}>
              Starting at ₹{price} · protago.in
            </p>
            <p className="text-xs mt-0.5" style={{ color: C.gray }}>Hardcopy delivered in 5–7 business days</p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 9  ORDER FORM — warm tint
      ══════════════════════════════════════════ */}
      {false && <OrderForm price={price} scrollTo={scrollTo} />}

      {/* ══════════════════════════════════════════
          § 10  FAQ — white
      ══════════════════════════════════════════ */}
      <section id="faq" style={{ background: C.white }} className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            {eyebrow('Common questions')}
            {heading('Got questions?')}
            <p className="text-sm mt-2" style={{ color: C.lgray }}>Everything you need to know before ordering.</p>
          </motion.div>

          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden border transition-colors duration-200"
                style={{ borderColor: openFaq === i ? C.saffron : '#EBEBEB', background: openFaq === i ? '#FFF8F3' : C.white }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left">
                  <span className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold"
                    style={{ background: openFaq === i ? C.saffron : '#F3F4F6', color: openFaq === i ? C.white : C.lgray }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-bold pr-2" style={{ color: openFaq === i ? '#3D1A00' : C.navy }}>
                    {faq.q}
                  </span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-none">
                    <ChevronDown size={16} style={{ color: openFaq === i ? C.saffron : '#D1D5DB' }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <p className="text-sm leading-relaxed pb-5" style={{ paddingLeft: '3.75rem', paddingRight: '1.25rem', color: C.gray }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center">
            <p className="text-sm mb-2" style={{ color: C.lgray }}>Still have questions?</p>
            <a href="mailto:hello@protago.in" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity"
              style={{ color: C.saffron }}>
              <MessageCircle size={14} /> hello@protago.in
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TEAM
      ══════════════════════════════════════════ */}
      <section id="team" style={{ background: C.warmTint }} className="py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>
              Meet the Team
            </h2>
            <p className="text-sm mb-10" style={{ color: C.lgray }}>An initiative by IIT Kanpur alumni</p>
            <div className="flex flex-col sm:flex-row justify-center gap-8">
              {[
                { name: 'Piyush Kumar', role: 'Co-Founder & CEO', edu: 'B.Tech, IIT Kanpur', photo: '/team/piyush.jpg', objectPosition: 'top', scale: 1, linkedin: 'https://linkedin.com/in/kpiyush25', twitter: 'https://x.com/PiyushKThisSide/' },
                { name: 'Shorya Kumar', role: 'Co-Founder & CTO', edu: 'B.Tech, IIT Kanpur', photo: '/team/shorya.jpg', objectPosition: 'center 30%', scale: 1.8, linkedin: 'https://www.linkedin.com/in/shoryak/', twitter: 'https://x.com/meet_shoryak' },
              ].map(({ name, role, edu, photo, objectPosition, scale, linkedin, twitter }) => (
                <div key={name} className="flex flex-col items-center gap-3 flex-1 max-w-xs mx-auto">
                  <div className="w-72 h-72 rounded-full overflow-hidden flex-shrink-0"
                    style={{ border: `3px solid ${C.saffron}` }}>
                    <img src={photo} alt={name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition, transform: `scale(${scale})`, transformOrigin: 'center' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-lg" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy }}>{name}</p>
                    <p className="text-sm font-semibold" style={{ color: C.saffron }}>{role}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.lgray }}>{edu}</p>
                    <div className="flex justify-center gap-3 mt-2">
                      <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" style={{ color: C.navy }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                      <a href={twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" style={{ color: C.navy }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — navy
      ══════════════════════════════════════════ */}
      <footer style={{ background: C.navy }} className="pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div id="footer-contact">
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>protago</span>
              <p className="text-sm mt-3 leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Magical, personalised storybooks that make every Indian child the hero of their own adventure.
              </p>
              <a href="mailto:hello@protago.in" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity mb-2"
                style={{ color: C.gold }}>
                <MessageCircle size={14} /> hello@protago.in
              </a>
              <a href="https://wa.me/919452868857" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm mt-2 hover:opacity-80 transition-opacity"
                style={{ color: C.gold }}>
                <MessageCircle size={14} /> WhatsApp: +91 94528 68857
              </a>
              <a href="https://www.instagram.com/protago.in/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm mt-2 hover:opacity-80 transition-opacity"
                style={{ color: C.gold }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                @protago.in
              </a>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Explore</h4>
              <ul className="space-y-3">
                {[['Art Styles','art-styles'],['How It Works','how-it-works'],['FAQ','faq']].map(([label, id]) => (
                  <li key={id}>
                    <button onClick={() => scrollTo(id)} className="text-sm hover:text-white transition-colors"
                      style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</button>
                  </li>
                ))}
                <li><button onClick={() => scrollTo('footer-contact')} className="text-sm hover:text-white transition-colors"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>Contact Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Secure Payments</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Razorpay','UPI','Cards','Net Banking'].map(p => (
                  <span key={p} className="text-xs font-semibold rounded-full px-3 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{p}</span>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>An initiative by IIT Kanpur alumni</p>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>&copy; {new Date().getFullYear()} Protago. All rights reserved.</span>
            <div className="flex items-center gap-4">
              {[['Privacy Policy','/privacy'],['Terms & Conditions','/terms'],['Refund Policy','/refund']].map(([label, href]) => (
                <a key={href} href={href} className="text-xs hover:opacity-60 transition-opacity" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</a>
              ))}
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Made with love in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

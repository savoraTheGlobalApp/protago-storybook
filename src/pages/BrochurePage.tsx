import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, X, MessageCircle } from 'lucide-react';

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

const artStyles = [
  { label: 'Pixar 3D',          img: '/styles/shreyansh_pixar.png',        caption: 'Warm, expressive · cinematic depth' },
  { label: 'DreamWorks',        img: '/styles/shreyansh_dreamworks.png',   caption: 'Bold, dynamic · full of personality' },
  { label: 'Comic Book',        img: '/styles/shreyansh_comic.png',        caption: 'Punchy panels · graphic novel energy' },
  { label: 'Flat Illustration', img: '/styles/shreyansh_illustration.png', caption: 'Clean, colourful · great for young readers' },
];

const boyStyles = [
  { label: 'Pixar 3D',          img: '/styles/boy_pixar.png' },
  { label: 'DreamWorks',        img: '/styles/boy_dreamworks.png' },
  { label: 'Comic Book',        img: '/styles/boy_comic.png' },
  { label: 'Flat Illustration', img: '/styles/boy_illustration.png' },
];

const girlStyles = [
  { label: 'Pixar 3D',          img: '/styles/girl_pixar.png' },
  { label: 'DreamWorks',        img: '/styles/girl_dreamworks.png' },
  { label: 'Comic Book',        img: '/styles/girl_comic.png' },
  { label: 'Flat Illustration', img: '/styles/girl_illustration.png' },
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

export function BrochurePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq]       = useState<number | null>(null);
  const price = Number(import.meta.env.VITE_STORYBOOK_PRICE) || 499;

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* ── HEADER ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderColor: '#F0F0F0' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
          <button onClick={() => scrollTo('hero')} style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>
            protago
          </button>

          <nav className="hidden md:flex items-center gap-7">
            {[['Books','books'],['Art Styles','art-styles'],['How It Works','how-it-works'],['FAQ','faq']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm font-semibold transition-colors hover:opacity-70"
                style={{ color: C.gray }}>
                {label}
              </button>
            ))}
            <button onClick={() => scrollTo('books')}
              className="px-5 py-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: C.gradient }}>
              Get Started
            </button>
          </nav>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" style={{ color: C.gray }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden border-t" style={{ borderColor: '#F0F0F0' }}>
              <div className="px-5 py-4 flex flex-col gap-3 bg-white">
                {[['Books','books'],['Art Styles','art-styles'],['How It Works','how-it-works'],['FAQ','faq']].map(([label, id]) => (
                  <button key={id} onClick={() => scrollTo(id)} className="text-sm text-left py-1 font-semibold" style={{ color: C.gray }}>{label}</button>
                ))}
                <button onClick={() => scrollTo('books')} className="mt-1 px-5 py-2.5 rounded-full text-sm font-bold text-white text-center"
                  style={{ background: C.gradient }}>
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════════════════════════════════════════
          § 1  HERO  — warm gradient
      ══════════════════════════════════════════ */}
      <section id="hero" style={{ background: C.gradient }} className="pt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-end gap-0">

          {/* Text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex-none w-full sm:w-[46%] pb-10 sm:pb-16 pt-10 sm:pt-20 pr-0 sm:pr-8">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.9)' }}>
              Ages 3–12 · Indian stories
            </div>
            <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, color: '#3D1A00', lineHeight: 1.05, fontSize: 'clamp(1.9rem,4vw,3rem)' }}
              className="mb-4">
              Every child is the{' '}
              <span className="px-1 rounded" style={{ color: C.white, background: 'rgba(0,0,0,0.18)' }}>protagonist</span>{' '}
              of their story.
            </h1>
            <p className="text-base font-semibold mb-2 leading-relaxed" style={{ color: '#5C2E00' }}>
              Personalised storybooks written and illustrated by AI — with your child's name, face, and world on every page.
            </p>
            <p className="text-sm italic font-semibold mb-8" style={{ color: '#7B3F00' }}>
              Because every child deserves to be the protagonist.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => scrollTo('books')}
                className="px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: C.navy, color: C.white }}>
                Browse Our Books <ArrowRight size={14} />
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

          {/* Hero image — shows full, fades at bottom into gradient */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 relative overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
            <img src="/styles/cover_scene.png" alt="Story preview" className="w-full h-auto block" />
            <div className="absolute bottom-0 left-0 right-0 h-20"
              style={{ background: 'linear-gradient(to top, #F7B731, transparent)' }} />
          </motion.div>
        </div>

        {/* Bottom strip */}
        <div className="flex items-center justify-between px-6 sm:px-12 py-3" style={{ background: 'rgba(0,0,0,0.15)' }}>
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Indian children · Indian stories · Indian settings</span>
          <span className="text-xs font-bold text-white">protago.in</span>
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {artStyles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl overflow-hidden shadow-md border" style={{ borderColor: '#F0F0F0' }}>
                <div className="overflow-hidden bg-gray-50">
                  <img src={s.img} alt={s.label} className="w-full h-auto block object-top" />
                </div>
                <div className="py-2.5 text-center text-xs font-bold" style={{ background: C.navyCard, color: C.gold }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Photo tips */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="rounded-2xl p-5 flex gap-4 items-start"
            style={{ background: C.warmTint, borderLeft: `4px solid ${C.saffron}` }}>
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: C.navy }}>For best results, your photo should be:</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                {['Clear face, looking at camera','Plain or simple background','Well lit, no harsh shadows','Any recent photo works'].map(t => (
                  <p key={t} className="text-xs font-semibold" style={{ color: C.gray }}>✓ {t}</p>
                ))}
              </div>
            </div>
          </motion.div>
          <p className="text-center text-xs mt-4" style={{ color: C.lgray }}>
            Your photo is never stored or shared. Used only to generate your book.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 3  ART STYLES — navy
      ══════════════════════════════════════════ */}
      <section id="art-styles" style={{ background: C.navy }} className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            {eyebrow('Step 1 · Choose your art style', true)}
            {heading('Four worlds. One hero. Your child.', true)}
          </motion.div>

          {/* Boy row */}
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Arjun, Age 7</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {boyStyles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-hidden" style={{ background: C.navyCard }}>
                  <img src={s.img} alt={s.label} className="w-full h-auto block object-top" />
                </div>
                <div className="py-2 text-center text-xs font-bold" style={{ background: C.navyCard, color: C.gold }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Girl row */}
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Priya, Age 7</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {girlStyles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-hidden" style={{ background: C.navyCard }}>
                  <img src={s.img} alt={s.label} className="w-full h-auto block object-top" />
                </div>
                <div className="py-2 text-center text-xs font-bold" style={{ background: C.navyCard, color: C.gold }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 4  STORY FORMATS — white
           Scenes shown full-size, no cropping
      ══════════════════════════════════════════ */}
      <section id="books" style={{ background: C.white }} className="py-16 sm:py-20">
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
              <img src="/styles/scene_immersive.png" alt="Immersive scene" className="w-full h-auto block" />
              <div className="px-6 py-5" style={{ background: C.white }}>
                <p className="text-sm leading-relaxed mb-3" style={{ color: C.gray }}>
                  Each page is a <strong style={{ color: C.navy }}>full-bleed cinematic illustration</strong> — rich scenery,
                  dramatic lighting, and your child at the centre of a vivid, beautiful world.
                </p>
                <div className="flex flex-wrap gap-5">
                  {['Deep scene detail', 'Immersive atmosphere', 'Perfect for bedtime'].map(f => (
                    <span key={f} className="text-xs font-bold" style={{ color: C.navy }}>✓ {f}</span>
                  ))}
                </div>
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
              <img src="/styles/scene_comic.png" alt="Comic scene" className="w-full h-auto block" />
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
      </section>

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
                className="rounded-2xl p-5 sm:p-6 flex items-center gap-5"
                style={{ background: C.white, borderLeft: `5px solid ${tier.borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <span className="text-3xl flex-none">{tier.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold mb-0.5" style={{ fontFamily: "'Baloo 2', sans-serif", color: C.navy, fontSize: '1rem' }}>{tier.range}</p>
                  <p className="text-xs italic mb-1.5" style={{ color: C.lgray }}>{tier.tone}</p>
                  <p className="text-sm leading-relaxed" style={{ color: C.gray }}>{tier.desc}</p>
                </div>
                <div className="flex gap-3 flex-none">
                  {[['words / page', tier.words], ['scenes', tier.scenes]].map(([lbl, val]) => (
                    <div key={lbl} className="text-center rounded-xl px-3 py-2" style={{ background: C.warmTint }}>
                      <p className="text-xl font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: tier.borderColor }}>{val}</p>
                      <p className="text-[9px] uppercase tracking-wide leading-tight" style={{ color: C.lgray }}>{lbl}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 6  QUALITY & TRUST — white
      ══════════════════════════════════════════ */}
      <section style={{ background: C.white }} className="py-16 sm:py-20">
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
      </section>

      {/* ══════════════════════════════════════════
          § 7  WHY IT MATTERS — navy
      ══════════════════════════════════════════ */}
      <section style={{ background: C.navy }} className="py-16 sm:py-20">
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
      </section>

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
              { emoji: '📦', n: '04', title: 'Your book\nships',            desc: 'Hardcover to your door or instant PDF.' },
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
            <p className="text-xs mt-0.5" style={{ color: C.gray }}>Digital PDF instant · Print delivered in 5–7 days</p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          § 9  FAQ — white
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
            <a href="mailto:hello@icurious.ai" className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity"
              style={{ color: C.saffron }}>
              <MessageCircle size={14} /> hello@icurious.ai
            </a>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER — navy
      ══════════════════════════════════════════ */}
      <footer style={{ background: C.navy }} className="pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div>
              <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 22, color: C.saffron }}>protago</span>
              <p className="text-sm mt-3 leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Magical, personalised storybooks that make every Indian child the hero of their own adventure.
              </p>
              <a href="mailto:hello@icurious.ai" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: C.gold }}>
                <MessageCircle size={14} /> hello@icurious.ai
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
                <li><a href="mailto:hello@icurious.ai" className="text-sm hover:text-white transition-colors"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>Contact Us</a></li>
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
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>An initiative by IIT Kanpur &amp; AIIMS Delhi alumni</p>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>&copy; {new Date().getFullYear()} iCurious AI. All rights reserved.</span>
            <div className="flex items-center gap-4">
              {['Privacy Policy','Terms of Service'].map(t => (
                <span key={t} className="text-xs cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'rgba(255,255,255,0.25)' }}>{t}</span>
              ))}
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Made with love in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

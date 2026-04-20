import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NavBar } from '../components/NavBar';

const C = {
  navy: '#1A1A2E', saffron: '#FF6B35', gold: '#F7B731',
  white: '#FFFFFF', gray: '#555555', lgray: '#888888',
  warmTint: '#FFF8F3',
};

type Theme = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  personalizationLevers: string[];
  samplePrompt: string;
  score: number; // 1–5
};

type AgeGroup = {
  range: string;
  label: string;
  color: string;
  themes: Theme[];
};

const FACE_SAMPLES = [
  { key: 'boy_young', face: '/faces/face_boy_young.png' },
  { key: 'boy_older', face: '/faces/face_boy_older.png' },
  { key: 'girl',      face: '/faces/face_girl_medium.png' },
];

const AGE_GROUPS: AgeGroup[] = [
  {
    range: '3–5',
    label: 'Pre-school',
    color: '#FF6B35',
    themes: [
      {
        slug: 'colours-shapes',
        name: 'Colours & Shapes',
        icon: '🎨',
        description: 'Child learns colours and shapes through a fun adventure in a world built from them.',
        personalizationLevers: ['Favourite colour', 'Favourite animal', 'Home setting', 'Child name & photo'],
        samplePrompt: '[Aarav] discovers a world where everything is made of shapes. His favourite [blue] triangle leads him home.',
        score: 3,
      },
      {
        slug: 'sharing-sorry',
        name: 'Sharing & Saying Sorry',
        icon: '🤝',
        description: 'Story about learning to share toys and apologise — with a real friend as a side character.',
        personalizationLevers: ['Friend\'s name', 'Favourite toy', 'Child name & photo', 'Parent message at end'],
        samplePrompt: '[Priya] and her best friend [Riya] both want the same [red car]. What happens next teaches them both something.',
        score: 4,
      },
      {
        slug: 'first-day-school',
        name: 'First Day at School',
        icon: '🏫',
        description: 'Helps anxious children prepare for school by seeing themselves navigate it confidently.',
        personalizationLevers: ['School name', 'Teacher name', 'Child\'s fear (making friends / separation)', 'Child name & photo'],
        samplePrompt: '[Kabir] is nervous about [DPS Indiranagar]. But when he meets [Ms Priya], everything changes.',
        score: 5,
      },
      {
        slug: 'bedtime-routines',
        name: 'Bedtime Routines',
        icon: '🌙',
        description: 'Child goes on a dream adventure that starts only after they brush teeth, wash up and sleep.',
        personalizationLevers: ['Child\'s dream world (space/jungle/ocean)', 'Stuffed animal name', 'Child name & photo'],
        samplePrompt: 'Every night [Sia] brushes her teeth, hugs [Biscuit the bear], and flies off to [the jungle].',
        score: 4,
      },
      {
        slug: 'new-sibling',
        name: 'New Sibling',
        icon: '👶',
        description: 'Helps older child embrace and bond with a new baby through a relatable story.',
        personalizationLevers: ['Sibling name', 'Child\'s feelings (jealous/excited)', 'Family setting', 'Child name & photo'],
        samplePrompt: '[Arjun] wasn\'t sure about baby [Ananya at first. Then he discovered something special only big brothers can do.',
        score: 5,
      },
    ],
  },
  {
    range: '5–8',
    label: 'Early School',
    color: '#F7B731',
    themes: [
      {
        slug: 'numbers-maths',
        name: 'Numbers & Maths Adventure',
        icon: '🔢',
        description: 'Child solves puzzles using addition and subtraction to save the day.',
        personalizationLevers: ['Child\'s current maths level', 'Favourite subject', 'Hero setting (school/space/jungle)', 'Child name & photo'],
        samplePrompt: '[Veer] must count [12 fireflies] and subtract the ones who are sleeping to unlock the magic door.',
        score: 3,
      },
      {
        slug: 'indian-festivals',
        name: 'Indian Festivals',
        icon: '🪔',
        description: 'Story set during Holi, Diwali, Navratri — explaining the meaning behind the celebration.',
        personalizationLevers: ['Festival', 'Region/cultural background', 'Family members to include', 'Child name & photo'],
        samplePrompt: '[Meera] helps her [Nani] prepare for [Diwali] and learns why we light diyas — and what it means for her family.',
        score: 5,
      },
      {
        slug: 'body-safety',
        name: 'Body Safety',
        icon: '🛡️',
        description: 'Age-appropriate story teaching consent and safe vs unsafe touch — expert reviewed.',
        personalizationLevers: ['Gender', 'Trusted adult name (parent/teacher)', 'Child name & photo'],
        samplePrompt: '[Riya] learns that her body belongs to her, and that [Mama] is always there when something feels wrong.',
        score: 4,
      },
      {
        slug: 'managing-emotions',
        name: 'Managing Emotions',
        icon: '😤',
        description: 'Story built around a specific emotion the child struggles with — anger, fear, or jealousy.',
        personalizationLevers: ['Target emotion', 'Trigger situation (sibling/school/sport)', 'Coping strategy', 'Child name & photo'],
        samplePrompt: 'When [Rohan] loses the cricket match, the anger dragon grows. Here\'s how he shrinks it.',
        score: 5,
      },
      {
        slug: 'phonics-reading',
        name: 'Phonics & Reading',
        icon: '📖',
        description: 'Story written with target letter sounds, rhyming patterns — tied to their school curriculum.',
        personalizationLevers: ['Target phonics level', 'Favourite words', 'School curriculum (CBSE/ICSE)', 'Child name & photo'],
        samplePrompt: '[Aisha] follows the sound of [S] through a silly, slimy, shimmery world.',
        score: 3,
      },
      {
        slug: 'professions',
        name: 'Dream Careers',
        icon: '🚀',
        description: 'Child steps into the shoes of their dream career — astronaut, artist, doctor and more — discovering what it truly takes to get there.',
        personalizationLevers: ['Dream career (astronaut/artist/doctor)', 'Child name & photo'],
        samplePrompt: '[Arya] has always dreamed of going to space. Today, she finally gets to find out what it really takes.',
        score: 5,
      },
    ],
  },
  {
    range: '8–12',
    label: 'Upper Primary',
    color: '#1A1A2E',
    themes: [
      {
        slug: 'growth-mindset',
        name: 'Growth Mindset',
        icon: '🧠',
        description: 'Story where the child fails, learns and tries again — tied to something they\'re working on.',
        personalizationLevers: ['Area of struggle (sport/academics/art)', 'Role model they admire', 'Child name & photo'],
        samplePrompt: '[Ishaan] failed his [swimming test] three times. This is the story of the fourth.',
        score: 5,
      },
      {
        slug: 'internet-safety',
        name: 'Internet Safety',
        icon: '💻',
        description: 'Digital adventure where the child navigates online risks — strangers, screen time, privacy.',
        personalizationLevers: ['Platforms they use', 'Specific concern (gaming/social)', 'Child name & photo'],
        samplePrompt: '[Zara] gets a friend request from someone she doesn\'t know. What happens in the next 24 hours changes everything.',
        score: 4,
      },
      {
        slug: 'history-india',
        name: 'History of India',
        icon: '🏛️',
        description: 'Child time-travels to meet a freedom fighter or historical figure — and helps them.',
        personalizationLevers: ['Historical figure/era', 'Child\'s city/region', 'Subject interest', 'Child name & photo'],
        samplePrompt: '[Dev] from [Pune] travels back to 1942 and ends up helping [Bhagat Singh] deliver a secret message.',
        score: 4,
      },
      {
        slug: 'financial-literacy',
        name: 'Financial Literacy',
        icon: '💰',
        description: 'Story teaching saving, spending wisely and giving — through a real-world goal the child has.',
        personalizationLevers: ['Child\'s savings goal (toy/trip/gift)', 'Pocket money amount', 'Child name & photo'],
        samplePrompt: '[Ananya] wants [new football boots] that cost ₹800. Over 8 weeks she learns exactly how to get there.',
        score: 5,
      },
      {
        slug: 'environmental-science',
        name: 'Environmental Science',
        icon: '🌿',
        description: 'Adventure where the child solves a real ecological problem in their own city or region.',
        personalizationLevers: ['City/region', 'Environmental issue (pollution/water/trees)', 'Child name & photo'],
        samplePrompt: '[Krish] notices the lake near [his school in Bengaluru] is turning green. He sets out to find out why.',
        score: 4,
      },
      {
        slug: 'professions',
        name: 'Dream Careers',
        icon: '🚀',
        description: 'Child steps into the shoes of their dream career — astronaut, artist, doctor and more — discovering what it truly takes to get there.',
        personalizationLevers: ['Dream career (astronaut/artist/doctor)', 'Child name & photo'],
        samplePrompt: '[Arya] has always dreamed of going to space. Today, she finally gets to find out what it really takes.',
        score: 5,
      },
    ],
  },
];


function ThemeModal({ theme, groupColor, onClose }: { theme: Theme; groupColor: string; onClose: () => void }) {
  const navigate = useNavigate();

  const handleCreate = () => {
    onClose();
    navigate(`/?theme=${theme.slug}#order`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        style={{ background: C.white, borderRadius: '20px 20px 0 0', overflow: 'hidden', width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Image */}
        <div style={{ aspectRatio: '16/9', background: '#F0EEE8', position: 'relative' }}>
          <img
            src={`/themes/${theme.slug}.png`}
            alt={theme.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 20px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))' }}>
            <p className="font-extrabold text-2xl" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#fff' }}>{theme.icon} {theme.name}</p>
          </div>
          <button onClick={onClose}
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm leading-relaxed" style={{ color: C.gray }}>{theme.description}</p>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.lgray }}>Personalisation levers</p>
            <div className="flex flex-wrap gap-1.5">
              {theme.personalizationLevers.map(l => (
                <span key={l} className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: groupColor + '18', color: groupColor, border: `1px solid ${groupColor}30` }}>
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: C.navy, borderRadius: 12, padding: '14px 16px' }}>
            <p className="text-xs font-bold mb-1.5" style={{ color: C.gold }}>Sample story prompt</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
              "{theme.samplePrompt}"
            </p>
          </div>

          <button onClick={handleCreate}
            className="w-full py-4 rounded-2xl font-extrabold text-base transition-all"
            style={{ background: C.saffron, color: C.white, fontFamily: "'Baloo 2', sans-serif", border: 'none', cursor: 'pointer' }}>
            Create this story for my child →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const FACE_SIZE_CARD = 80;

function ThemeCard({ theme, onClick }: { theme: Theme; groupColor: string; onClick: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % FACE_SAMPLES.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div layout className="rounded-2xl overflow-hidden cursor-pointer"
      style={{ border: '1.5px solid #E5E7EB', background: C.white }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      onClick={onClick}>

      {/* Scene + hovering face */}
      {theme.slug === 'growth-mindset' ? (
        <div style={{ aspectRatio: '16/9', background: '#F0EEE8', position: 'relative', overflow: 'hidden' }}>
          <img src={`/themes/${theme.slug}.png`} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}>
            <p className="font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#fff', fontSize: 20 }}>{theme.icon} {theme.name}</p>
          </div>
        </div>
      ) : (
      <div style={{ paddingTop: FACE_SIZE_CARD / 2, position: 'relative' }}>
        {/* Scene */}
        <div style={{ aspectRatio: '4/3', background: '#F0EEE8', position: 'relative', overflow: 'hidden' }}>
          {FACE_SAMPLES.map((sample, i) => (
            <motion.img
              key={sample.key}
              src={`/themes_mockup/${theme.slug}_${sample.key}_mockup.webp`}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(1.3)' }}
              animate={{ opacity: i === activeIdx ? 1 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ))}

          {/* Arrow SVG */}
          <svg viewBox="0 0 160 90" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
            <motion.path
              d="M 148 4 Q 148 45 52 30"
              fill="none" stroke={C.saffron} strokeWidth="2.2" strokeDasharray="5 3" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ pathLength: { duration: 1.0, ease: 'easeInOut', delay: 0.2 }, opacity: { duration: 0.2 } }}
              key={activeIdx}
            />
            <motion.path
              d="M 60 25 L 52 30 L 58 36"
              fill="none" stroke={C.saffron} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
              key={`arrowhead-${activeIdx}`}
            />
          </svg>

          {/* Title overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.55))', zIndex: 4 }}>
            <p className="font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif", color: '#fff', fontSize: 20 }}>{theme.icon} {theme.name}</p>
          </div>
        </div>

        {/* Face circle — hovering top-right */}
        <div style={{ position: 'absolute', top: 0, right: 12, width: FACE_SIZE_CARD, height: FACE_SIZE_CARD, zIndex: 10 }}>
          {FACE_SAMPLES.map((sample, i) => (
            <motion.img
              key={sample.face}
              src={sample.face}
              alt=""
              className="rounded-full"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                border: `3px solid ${C.saffron}`,
                boxShadow: '0 4px 16px rgba(255,107,53,0.35), 0 0 0 2px #fff',
              }}
              animate={{ opacity: i === activeIdx ? 1 : 0, scale: i === activeIdx ? 1 : 0.9 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
      )}

      <div className="p-4">
        <p className="text-xs leading-relaxed" style={{ color: C.gray }}>{theme.description}</p>
      </div>
    </motion.div>
  );
}

export function ThemesExplorer() {
  const [activeGroup, setActiveGroup] = useState('3–5');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const group = AGE_GROUPS.find(g => g.range === activeGroup)!;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: "'Nunito', sans-serif" }}>
      <NavBar />

      {/* Page title */}
      <div style={{ background: C.navy }} className="px-5 pt-20 pb-8 text-center">
        <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Baloo 2', sans-serif" }}>
          Themes Explorer
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Browse themes by age group — click any to create a story
        </p>
      </div>

      {/* Age group tabs */}
      <div className="flex justify-center gap-2 px-4 py-5">
        {AGE_GROUPS.map(g => (
          <button key={g.range} onClick={() => setActiveGroup(g.range)}
            className="flex-1 py-2.5 rounded-2xl font-extrabold transition-all text-center"
            style={{
              background: activeGroup === g.range ? g.color : C.white,
              color: activeGroup === g.range ? C.white : C.lgray,
              border: `2px solid ${activeGroup === g.range ? g.color : '#E5E7EB'}`,
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}>
            {g.range}
            <span className="block opacity-80" style={{ fontSize: 10, fontWeight: 600 }}>{g.label}</span>
          </button>
        ))}
      </div>

      {/* Theme cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <AnimatePresence mode="wait">
          <motion.div key={activeGroup} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {group.themes.map(theme => (
              <ThemeCard key={theme.name} theme={theme} groupColor={group.color} onClick={() => setSelectedTheme(theme)} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedTheme && (
          <ThemeModal theme={selectedTheme} groupColor={group.color} onClose={() => setSelectedTheme(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

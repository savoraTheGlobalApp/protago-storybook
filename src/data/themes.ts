export type AgeRange = '0–3' | '3–5' | '6–8' | '9–12';

export type ThemeEntry = {
  slug: string;
  name: string;
  icon: string;
  ageRange: AgeRange | AgeRange[];
  category?: 'mythology';
  description: string;
  comingSoon?: boolean;
  hidden?: boolean;
  pricing?: {
    paperback: { price: number; mrp: number };
    hardcover: { price: number; mrp: number };
  };
};

export const THEMES: ThemeEntry[] = [
  // Ages 0–3
  {
    slug: 'abc', name: 'ABC Adventure', icon: '🔤', ageRange: '0–3',
    description: 'Child goes on a magical journey through the alphabet — meeting animals and objects for every letter.',
    pricing: { paperback: { price: 849, mrp: 1499 }, hardcover: { price: 1399, mrp: 1899 } },
  },
  {
    slug: 'potty-training', name: 'Potty Training', icon: '🚽', ageRange: '0–3',
    description: 'A gentle, encouraging story that follows the child through their potty training journey — making it feel like a fun milestone, not a chore.',
    comingSoon: true,
  },
  {
    slug: 'hindi-alphabet', name: 'Hindi Alphabet', icon: '🔡', ageRange: '0–3',
    description: 'Child discovers the magic of Hindi letters — each Akshar comes alive with a character, a word and a world to explore.',
    comingSoon: true,
    pricing: { paperback: { price: 849, mrp: 1499 }, hardcover: { price: 1399, mrp: 1899 } },
  },
  // Ages 3–5
  {
    slug: 'colours-shapes', name: 'The Rainbow Kingdom Quest', icon: '🎨', ageRange: '3–5',
    description: 'Child learns colours and shapes through a fun adventure in a world built from them.',
  },
  {
    slug: 'bedtime-routines', name: 'Bedtime Routines', icon: '🌙', ageRange: '3–5',
    description: 'Child goes on a dream adventure that starts only after they brush teeth, wash up and sleep.',
  },
  {
    slug: 'sharing-sorry', name: 'Sharing & Saying Sorry', icon: '🤝', ageRange: '3–5',
    description: 'Story about learning to share toys and apologise — with a real friend as a side character.',
  },
  {
    slug: 'first-day-school', name: 'First Day at School', icon: '🏫', ageRange: '3–5',
    description: 'Helps anxious children prepare for school by seeing themselves navigate it confidently.',
  },
  {
    slug: 'pet-buddy', name: 'My Pet & Me', icon: '🐾', ageRange: ['0–3', '3–5', '6–8', '9–12'],
    description: 'Your child and their furry best friend go on adventures together — morning walks, bath time, treat hunts and cuddles at bedtime.',
    comingSoon: true,
    hidden: true,
  },
  // Ages 5–8
  {
    slug: 'managing-emotions', name: 'Managing Emotions', icon: '😤', ageRange: '6–8',
    description: 'Story built around a specific emotion the child struggles with — anger, fear, or jealousy.',
    hidden: true,
  },
  {
    slug: 'professions', name: 'My Dream Career', icon: '🚀', ageRange: ['6–8', '9–12'],
    description: 'Child steps into their dream profession — astronaut, doctor, chef, engineer — and saves the day using their skills.',
  },
  {
    slug: 'numbers-maths', name: 'Numbers & Maths Adventure', icon: '🔢', ageRange: '6–8',
    description: 'Child solves puzzles using addition and subtraction to save the day.',
  },
  {
    slug: 'indian-festivals', name: 'Indian Festivals', icon: '🪔', ageRange: '6–8',
    description: 'Story set during Holi, Diwali, Navratri — explaining the meaning behind the celebration.',
    hidden: true,
  },
  {
    slug: 'body-safety', name: 'Body Safety', icon: '🛡️', ageRange: '6–8',
    description: 'Age-appropriate story teaching consent and safe vs unsafe touch — expert reviewed.',
    hidden: true,
  },
  // Ages 8–12
  {
    slug: 'growth-mindset', name: 'Growth Mindset', icon: '🧠', ageRange: '9–12',
    description: 'Story where the child fails, learns and tries again — tied to something they\'re working on.',
    hidden: true,
  },
  {
    slug: 'internet-safety', name: 'Internet Safety', icon: '💻', ageRange: '9–12',
    description: 'Digital adventure where the child navigates online risks — strangers, screen time, privacy.',
    hidden: true,
  },
  {
    slug: 'history-india', name: 'History of India', icon: '🏛️', ageRange: '9–12',
    description: 'Child time-travels to meet a freedom fighter or historical figure — and helps them.',
    hidden: true,
  },
  {
    slug: 'financial-literacy', name: 'Financial Literacy', icon: '💰', ageRange: '9–12',
    description: 'Story teaching saving, spending wisely and giving — through a real-world goal the child has.',
  },
  {
    slug: 'environmental-science', name: 'Environmental Science', icon: '🌿', ageRange: '9–12',
    description: 'Adventure where the child solves a real ecological problem in their own city or region.',
    hidden: true,
  },
  // Mythology
  {
    slug: 'ram-setu-squirrel', name: 'Ram Setu — The Squirrel', icon: '🐿️', ageRange: '6–8', category: 'mythology',
    description: 'Child joins the squirrels at Ram Setu — rolling in sand and shaking it into the sea to help build the bridge to Lanka. Even the tiniest act of devotion counts.',
    hidden: true,
  },
  {
    slug: 'hanuman-leap', name: 'Hanuman\'s Leap', icon: '🌅', ageRange: '6–8', category: 'mythology',
    description: 'Child soars alongside Hanuman on his legendary leap across the ocean to Lanka — discovering that belief and courage can carry you further than you imagine.',
    hidden: true,
  },
];

/** Themes that should actually appear in browsing/listing UI. Hidden themes stay in THEMES
 *  (so direct links, pricing data, etc. keep working) but are excluded here. */
export const VISIBLE_THEMES: ThemeEntry[] = THEMES.filter(t => !t.hidden);

export function ageToRange(age: number): '0–3' | '3–5' | '6–8' | '9–12' | null {
  if (age >= 0 && age <= 2) return '0–3';
  if (age >= 3 && age <= 5) return '3–5';
  if (age >= 6 && age <= 8) return '6–8';
  if (age >= 9 && age <= 12) return '9–12';
  return null;
}

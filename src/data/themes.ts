export type ThemeEntry = {
  slug: string;
  name: string;
  icon: string;
  ageRange: '3–5' | '5–8' | '8–12';
};

export const THEMES: ThemeEntry[] = [
  // Ages 3–5
  { slug: 'colours-shapes',   name: 'Colours & Shapes',        icon: '🎨', ageRange: '3–5' },
  { slug: 'sharing-sorry',    name: 'Sharing & Saying Sorry',  icon: '🤝', ageRange: '3–5' },
  { slug: 'first-day-school', name: 'First Day at School',     icon: '🏫', ageRange: '3–5' },
  { slug: 'bedtime-routines', name: 'Bedtime Routines',        icon: '🌙', ageRange: '3–5' },
  { slug: 'new-sibling',      name: 'New Sibling',             icon: '👶', ageRange: '3–5' },
  // Ages 5–8
  { slug: 'numbers-maths',    name: 'Numbers & Maths',         icon: '🔢', ageRange: '5–8' },
  { slug: 'indian-festivals', name: 'Indian Festivals',        icon: '🪔', ageRange: '5–8' },
  { slug: 'body-safety',      name: 'Body Safety',             icon: '🛡️', ageRange: '5–8' },
  { slug: 'managing-emotions',name: 'Managing Emotions',       icon: '😤', ageRange: '5–8' },
  { slug: 'phonics-reading',  name: 'Phonics & Reading',       icon: '📖', ageRange: '5–8' },
  // Ages 8–12
  { slug: 'growth-mindset',   name: 'Growth Mindset',          icon: '🧠', ageRange: '8–12' },
  { slug: 'internet-safety',  name: 'Internet Safety',         icon: '💻', ageRange: '8–12' },
  { slug: 'history-india',    name: 'History of India',        icon: '🏛️', ageRange: '8–12' },
  { slug: 'financial-literacy',name: 'Financial Literacy',     icon: '💰', ageRange: '8–12' },
  { slug: 'environmental-science', name: 'Environmental Science', icon: '🌿', ageRange: '8–12' },
];

export function ageToRange(age: number): '3–5' | '5–8' | '8–12' | null {
  if (age >= 3 && age <= 5) return '3–5';
  if (age >= 6 && age <= 8) return '5–8';
  if (age >= 9 && age <= 12) return '8–12';
  return null;
}

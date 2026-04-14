export type ThemeEntry = {
  slug: string;
  name: string;
  icon: string;
  ageRange: '3–5' | '5–8' | '8–12';
  category?: 'mythology';
  description: string;
  personalizationLevers: string[];
  samplePrompt: string;
};

export const THEMES: ThemeEntry[] = [
  // Ages 3–5
  {
    slug: 'colours-shapes', name: 'Colours & Shapes', icon: '🎨', ageRange: '3–5',
    description: 'Child learns colours and shapes through a fun adventure in a world built from them.',
    personalizationLevers: ['Favourite colour', 'Favourite animal', 'Home setting', 'Child name & photo'],
    samplePrompt: '[Aarav] discovers a world where everything is made of shapes. His favourite [blue] triangle leads him home.',
  },
  {
    slug: 'sharing-sorry', name: 'Sharing & Saying Sorry', icon: '🤝', ageRange: '3–5',
    description: 'Story about learning to share toys and apologise — with a real friend as a side character.',
    personalizationLevers: ['Friend\'s name', 'Favourite toy', 'Child name & photo', 'Parent message at end'],
    samplePrompt: '[Priya] and her best friend [Riya] both want the same [red car]. What happens next teaches them both something.',
  },
  {
    slug: 'first-day-school', name: 'First Day at School', icon: '🏫', ageRange: '3–5',
    description: 'Helps anxious children prepare for school by seeing themselves navigate it confidently.',
    personalizationLevers: ['School name', 'Teacher name', 'Child\'s fear (making friends / separation)', 'Child name & photo'],
    samplePrompt: '[Kabir] is nervous about [DPS Indiranagar]. But when he meets [Ms Priya], everything changes.',
  },
  {
    slug: 'bedtime-routines', name: 'Bedtime Routines', icon: '🌙', ageRange: '3–5',
    description: 'Child goes on a dream adventure that starts only after they brush teeth, wash up and sleep.',
    personalizationLevers: ['Child\'s dream world (space/jungle/ocean)', 'Stuffed animal name', 'Child name & photo'],
    samplePrompt: 'Every night [Sia] brushes her teeth, hugs [Biscuit the bear], and flies off to [the jungle].',
  },
  {
    slug: 'new-sibling', name: 'New Sibling', icon: '👶', ageRange: '3–5',
    description: 'Helps older child embrace and bond with a new baby through a relatable story.',
    personalizationLevers: ['Sibling name', 'Child\'s feelings (jealous/excited)', 'Family setting', 'Child name & photo'],
    samplePrompt: '[Arjun] wasn\'t sure about baby [Ananya] at first. Then he discovered something special only big brothers can do.',
  },
  // Ages 5–8
  {
    slug: 'numbers-maths', name: 'Numbers & Maths Adventure', icon: '🔢', ageRange: '5–8',
    description: 'Child solves puzzles using addition and subtraction to save the day.',
    personalizationLevers: ['Child\'s current maths level', 'Favourite subject', 'Hero setting (school/space/jungle)', 'Child name & photo'],
    samplePrompt: '[Veer] must count [12 fireflies] and subtract the ones who are sleeping to unlock the magic door.',
  },
  {
    slug: 'indian-festivals', name: 'Indian Festivals', icon: '🪔', ageRange: '5–8',
    description: 'Story set during Holi, Diwali, Navratri — explaining the meaning behind the celebration.',
    personalizationLevers: ['Festival', 'Region/cultural background', 'Family members to include', 'Child name & photo'],
    samplePrompt: '[Meera] helps her [Nani] prepare for [Diwali] and learns why we light diyas — and what it means for her family.',
  },
  {
    slug: 'body-safety', name: 'Body Safety', icon: '🛡️', ageRange: '5–8',
    description: 'Age-appropriate story teaching consent and safe vs unsafe touch — expert reviewed.',
    personalizationLevers: ['Gender', 'Trusted adult name (parent/teacher)', 'Child name & photo'],
    samplePrompt: '[Riya] learns that her body belongs to her, and that [Mama] is always there when something feels wrong.',
  },
  {
    slug: 'managing-emotions', name: 'Managing Emotions', icon: '😤', ageRange: '5–8',
    description: 'Story built around a specific emotion the child struggles with — anger, fear, or jealousy.',
    personalizationLevers: ['Target emotion', 'Trigger situation (sibling/school/sport)', 'Coping strategy', 'Child name & photo'],
    samplePrompt: 'When [Rohan] loses the cricket match, the anger dragon grows. Here\'s how he shrinks it.',
  },
  {
    slug: 'phonics-reading', name: 'Phonics & Reading', icon: '📖', ageRange: '5–8',
    description: 'Story written with target letter sounds, rhyming patterns — tied to their school curriculum.',
    personalizationLevers: ['Target phonics level', 'Favourite words', 'School curriculum (CBSE/ICSE)', 'Child name & photo'],
    samplePrompt: '[Aisha] follows the sound of [S] through a silly, slimy, shimmery world.',
  },
  // Ages 8–12
  {
    slug: 'growth-mindset', name: 'Growth Mindset', icon: '🧠', ageRange: '8–12',
    description: 'Story where the child fails, learns and tries again — tied to something they\'re working on.',
    personalizationLevers: ['Area of struggle (sport/academics/art)', 'Role model they admire', 'Child name & photo'],
    samplePrompt: '[Ishaan] failed his [swimming test] three times. This is the story of the fourth.',
  },
  {
    slug: 'internet-safety', name: 'Internet Safety', icon: '💻', ageRange: '8–12',
    description: 'Digital adventure where the child navigates online risks — strangers, screen time, privacy.',
    personalizationLevers: ['Platforms they use', 'Specific concern (gaming/social)', 'Child name & photo'],
    samplePrompt: '[Zara] gets a friend request from someone she doesn\'t know. What happens in the next 24 hours changes everything.',
  },
  {
    slug: 'history-india', name: 'History of India', icon: '🏛️', ageRange: '8–12',
    description: 'Child time-travels to meet a freedom fighter or historical figure — and helps them.',
    personalizationLevers: ['Historical figure/era', 'Child\'s city/region', 'Subject interest', 'Child name & photo'],
    samplePrompt: '[Dev] from [Pune] travels back to 1942 and ends up helping [Bhagat Singh] deliver a secret message.',
  },
  {
    slug: 'financial-literacy', name: 'Financial Literacy', icon: '💰', ageRange: '8–12',
    description: 'Story teaching saving, spending wisely and giving — through a real-world goal the child has.',
    personalizationLevers: ['Child\'s savings goal (toy/trip/gift)', 'Pocket money amount', 'Child name & photo'],
    samplePrompt: '[Ananya] wants [new football boots] that cost ₹800. Over 8 weeks she learns exactly how to get there.',
  },
  {
    slug: 'environmental-science', name: 'Environmental Science', icon: '🌿', ageRange: '8–12',
    description: 'Adventure where the child solves a real ecological problem in their own city or region.',
    personalizationLevers: ['City/region', 'Environmental issue (pollution/water/trees)', 'Child name & photo'],
    samplePrompt: '[Krish] notices the lake near [his school in Bengaluru] is turning green. He sets out to find out why.',
  },
  // Mythology
  {
    slug: 'ram-setu-squirrel', name: 'Ram Setu — The Squirrel', icon: '🐿️', ageRange: '5–8', category: 'mythology',
    description: 'Child joins the squirrels at Ram Setu — rolling in sand and shaking it into the sea to help build the bridge to Lanka. Even the tiniest act of devotion counts.',
    personalizationLevers: ['Child\'s role (squirrel / builder / scout)', 'Child name & photo'],
    samplePrompt: '[Arjun] is too small to carry rocks. But when he rolls in the sand and shakes it off into the sea at Ram Setu, Ram himself smiles.',
  },
  {
    slug: 'hanuman-leap', name: 'Hanuman\'s Leap', icon: '🌅', ageRange: '5–8', category: 'mythology',
    description: 'Child soars alongside Hanuman on his legendary leap across the ocean to Lanka — discovering that belief and courage can carry you further than you imagine.',
    personalizationLevers: ['Child\'s challenge to overcome', 'Favourite Hanuman moment', 'Child name & photo'],
    samplePrompt: '[Priya] is afraid she isn\'t strong enough. Then Hanuman shows her his leap — and asks her to jump with him.',
  },
];

export function ageToRange(age: number): '3–5' | '5–8' | '8–12' | null {
  if (age >= 3 && age <= 5) return '3–5';
  if (age >= 6 && age <= 8) return '5–8';
  if (age >= 9 && age <= 12) return '8–12';
  return null;
}

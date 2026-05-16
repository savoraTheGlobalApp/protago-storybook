export type FaceSample = { key: string; face: string };

export const DEFAULT_FACE_SAMPLES: FaceSample[] = [
  { key: 'boy_young', face: '/faces/face_boy_young.webp' },
  { key: 'boy_older', face: '/faces/face_boy_older.webp' },
  { key: 'girl',      face: '/faces/face_girl_medium.webp' },
];

const NEW_FACE_SAMPLES: FaceSample[] = [
  { key: 'boy_1', face: '/faces/face_boy_1.webp' },
  { key: 'boy_2', face: '/faces/face_boy_2.webp' },
  { key: 'girl_1', face: '/faces/face_girl_1.webp' },
];

export const THEME_FACE_SAMPLES: Record<string, FaceSample[]> = {
  'bedtime-routines':   NEW_FACE_SAMPLES,
  'colours-shapes':     NEW_FACE_SAMPLES,
  'financial-literacy': [
    { key: 'boy_1',  face: '/faces/face_boy_1.webp' },
    { key: 'girl_1', face: '/faces/face_girl_1.webp' },
  ],
  'first-day-school':   NEW_FACE_SAMPLES,
  'growth-mindset':     NEW_FACE_SAMPLES,
  'managing-emotions':  NEW_FACE_SAMPLES,
  'potty-training':     NEW_FACE_SAMPLES,
  'professions':        NEW_FACE_SAMPLES,
};

export const THEME_ARROW_TARGET: Record<string, { x: number; y: number }> = {
  'bedtime-routines':   { x: 98, y: 28 },
  'colours-shapes':     { x: 98, y: 28 },
  'financial-literacy': { x: 98, y: 28 },
  'first-day-school':   { x: 98, y: 28 },
  'growth-mindset':     { x: 98, y: 28 },
  'managing-emotions':  { x: 98, y: 28 },
  'potty-training':     { x: 98, y: 28 },
  'professions':        { x: 98, y: 28 },
};

export function getFaceSamples(slug: string): FaceSample[] {
  return THEME_FACE_SAMPLES[slug] ?? DEFAULT_FACE_SAMPLES;
}

export function getArrowTarget(slug: string): { x: number; y: number } {
  return THEME_ARROW_TARGET[slug] ?? { x: 80, y: 28 };
}

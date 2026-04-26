/**
 * preview.js — Backend-agnostic face swap preview trigger.
 *
 * Switch compute backend via env var:
 *   PREVIEW_BACKEND=modal   (default)
 *   PREVIEW_BACKEND=gcp     (when GCP quota is available)
 */

const BACKEND = process.env.PREVIEW_BACKEND || 'modal';

// Number of preview scenes per theme/ageGroup combo.
// Key format: `${storySlug}/${ageGroup}` or just `${storySlug}` as fallback.
// All themes default to 2 (cover + first story scene).
const SCENE_COUNT = {
  'colours-shapes':    5,  // all age groups
  'bedtime-routines':  5,  // all age groups
  'numbers-maths':     5,  // all age groups
  'sharing-sorry':     5,  // all age groups
  'first-day-school':  5,  // all age groups
};

function getSceneCount(storySlug, ageGroup) {
  return SCENE_COUNT[`${storySlug}/${ageGroup}`] ?? SCENE_COUNT[storySlug] ?? 2;
}

// Whitelist of storySlug+variant combos uploaded to GCS.
// Format: `${storySlug}/${ageGroup}_${gender}`
// Add entries here after uploading the corresponding folder to GCS.
const VARIATIONS_AVAILABLE = new Set([
  // older_boy — all 19 themes
  'bedtime-routines/older_boy', 'body-safety/older_boy', 'colours-shapes/older_boy',
  'environmental-science/older_boy', 'financial-literacy/older_boy', 'first-day-school/older_boy',
  'growth-mindset/older_boy', 'hanuman/older_boy', 'history-india/older_boy',
  'indian-festivals/older_boy', 'internet-safety/older_boy', 'krishna/older_boy',
  'managing-emotions/older_boy', 'new-sibling/older_boy', 'numbers-maths/older_boy',
  'phonics-reading/older_boy', 'ramayana/older_boy', 'sharing-sorry/older_boy', 'sudama/older_boy',

  // older_girl — 18 themes (history-india incomplete, skipped)
  'bedtime-routines/older_girl', 'body-safety/older_girl', 'colours-shapes/older_girl',
  'environmental-science/older_girl', 'financial-literacy/older_girl', 'first-day-school/older_girl',
  'growth-mindset/older_girl', 'hanuman/older_girl', 'indian-festivals/older_girl',
  'internet-safety/older_girl', 'krishna/older_girl', 'managing-emotions/older_girl',
  'new-sibling/older_girl', 'numbers-maths/older_girl', 'phonics-reading/older_girl',
  'ramayana/older_girl', 'sharing-sorry/older_girl', 'sudama/older_girl',

  // middle_boy — 17 themes (financial-literacy, history-india missing)
  'bedtime-routines/middle_boy', 'body-safety/middle_boy', 'colours-shapes/middle_boy', 'environmental-science/middle_boy',
  'first-day-school/middle_boy', 'growth-mindset/middle_boy', 'hanuman/middle_boy',
  'indian-festivals/middle_boy', 'internet-safety/middle_boy', 'krishna/middle_boy',
  'managing-emotions/middle_boy', 'new-sibling/middle_boy', 'numbers-maths/middle_boy',
  'phonics-reading/middle_boy', 'ramayana/middle_boy', 'sharing-sorry/middle_boy', 'sudama/middle_boy',

  // middle_girl — 16 themes (hanuman, sharing-sorry, sudama missing)
  'bedtime-routines/middle_girl', 'body-safety/middle_girl', 'colours-shapes/middle_girl',
  'environmental-science/middle_girl', 'financial-literacy/middle_girl', 'first-day-school/middle_girl',
  'growth-mindset/middle_girl', 'history-india/middle_girl', 'indian-festivals/middle_girl',
  'internet-safety/middle_girl', 'krishna/middle_girl', 'managing-emotions/middle_girl',
  'new-sibling/middle_girl', 'numbers-maths/middle_girl', 'phonics-reading/middle_girl', 'ramayana/middle_girl',

  // young_boy / young_girl — 5-scene themes
  'colours-shapes/young_boy',    'colours-shapes/young_girl',
  'bedtime-routines/young_boy',  'bedtime-routines/young_girl',
  'numbers-maths/young_boy',     'numbers-maths/young_girl',
  'sharing-sorry/young_boy',     'sharing-sorry/young_girl',
  'first-day-school/young_boy',  'first-day-school/young_girl',
  // middle_boy / middle_girl — 5-scene themes
  'numbers-maths/middle_boy',    'numbers-maths/middle_girl',
  'sharing-sorry/middle_boy',    'sharing-sorry/middle_girl',
  'first-day-school/middle_boy', 'first-day-school/middle_girl',
  // older_boy / older_girl — 5-scene themes
  'sharing-sorry/older_boy',     'sharing-sorry/older_girl',
  'first-day-school/older_boy',  'first-day-school/older_girl',
]);

// GCS story-scenes bucket is public read — no auth needed to download scenes.
// Bucket: protago-story-scenes (asia-south1)
// Generic path:  {storySlug}/scene_01_spread.png
// Variant path:  {storySlug}/{ageGroup}_{gender}/scene_01_spread.png
function getSceneUrls(storySlug, { gender, ageGroup } = {}) {
  const base = `https://storage.googleapis.com/${process.env.GCS_SCENES_BUCKET || 'protago-story-scenes'}`;
  const variantKey = gender && ageGroup ? `${storySlug}/${ageGroup}_${gender}` : null;
  const useVariant = variantKey && VARIATIONS_AVAILABLE.has(variantKey);
  const prefix = useVariant ? `${storySlug}/${ageGroup}_${gender}` : storySlug;
  const count = getSceneCount(storySlug, ageGroup);
  return Array.from({ length: count }, (_, i) =>
    `${base}/${prefix}/scene_${String(i + 1).padStart(2, '0')}_spread.png`
  );
}

// ── Modal backend ─────────────────────────────────────────────────────────────
async function triggerModalPreview({ jobId, storySlug, photoUrl, childName = '', gender, ageGroup, steps = 5 }) {
  const MODAL_URL = process.env.MODAL_PREVIEW_URL;
  if (!MODAL_URL) throw new Error('MODAL_PREVIEW_URL not set');

  const sceneUrls = getSceneUrls(storySlug, { gender, ageGroup });

  const response = await fetch(MODAL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id:               jobId,
      story_slug:           storySlug,
      age_group:            ageGroup || '',
      photo_url:            photoUrl,
      scene_urls:           sceneUrls,
      steps,
      child_name:           childName || '',
      supabase_url:         process.env.SUPABASE_URL_STORY || process.env.SUPABASE_URL,
      supabase_service_key: process.env.SUPABASE_SERVICE_KEY_STORY || process.env.SUPABASE_SERVICE_KEY,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Modal trigger failed: ${response.status} ${text}`);
  }

  return { backend: 'modal', jobId };
}

// ── GCP backend (stub — implement when GCP quota available) ───────────────────
async function triggerGCPPreview({ jobId, storySlug, photoUrl, gender, ageGroup, steps = 4 }) {
  // TODO: submit Vertex AI custom job
  // 1. Upload photo + scenes to GCS
  // 2. Submit job via google-cloud-aiplatform SDK
  // 3. Job writes results to GCS + updates Supabase DB
  throw new Error('GCP backend not yet implemented. Set PREVIEW_BACKEND=modal');
}

// ── Public interface ──────────────────────────────────────────────────────────
async function triggerPreview(args) {
  if (BACKEND === 'gcp') return triggerGCPPreview(args);
  return triggerModalPreview(args);
}

export { triggerPreview, getSceneUrls, getSceneCount, SCENE_COUNT, VARIATIONS_AVAILABLE };

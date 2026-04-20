/**
 * preview.js — Backend-agnostic face swap preview trigger.
 *
 * Switch compute backend via env var:
 *   PREVIEW_BACKEND=modal   (default)
 *   PREVIEW_BACKEND=gcp     (when GCP quota is available)
 */

const BACKEND = process.env.PREVIEW_BACKEND || 'modal';

// Always preview scene 01 (cover) and scene 02 (first story scene)
const HERO_SCENES = [1, 2];

// Whitelist of storySlug+variant combos uploaded to GCS.
// Format: `${storySlug}/${ageGroup}_${gender}`
// Add entries here after uploading the corresponding folder to GCS.
const VARIATIONS_AVAILABLE = new Set([
  // older_boy — all themes
  'bedtime-routines/older_boy',
  'body-safety/older_boy',
  'colours-shapes/older_boy',
  'environmental-science/older_boy',
  'financial-literacy/older_boy',
  'first-day-school/older_boy',
  'growth-mindset/older_boy',
  'hanuman/older_boy',
  'history-india/older_boy',
  'indian-festivals/older_boy',
  'internet-safety/older_boy',
  'krishna/older_boy',
  'managing-emotions/older_boy',
  'new-sibling/older_boy',
  'numbers-maths/older_boy',
  'phonics-reading/older_boy',
  'ramayana/older_boy',
  'sharing-sorry/older_boy',
  'sudama/older_boy',
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
  return HERO_SCENES.map(n =>
    `${base}/${prefix}/scene_${String(n).padStart(2, '0')}_spread.png`
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
      photo_url:            photoUrl,
      scene_urls:           sceneUrls,
      steps,
      // Supabase DB only — for job status updates, not storage
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

export { triggerPreview, getSceneUrls, HERO_SCENES, VARIATIONS_AVAILABLE };

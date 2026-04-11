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

// GCS story-scenes bucket is public read — no auth needed to download scenes.
// Bucket: protago-story-scenes (asia-south1)
// Path:   {storySlug}/scene_01_spread.png
function getSceneUrls(storySlug) {
  const base = `https://storage.googleapis.com/${process.env.GCS_SCENES_BUCKET || 'protago-story-scenes'}`;
  return HERO_SCENES.map(n =>
    `${base}/${storySlug}/scene_${String(n).padStart(2, '0')}_spread.png`
  );
}

// ── Modal backend ─────────────────────────────────────────────────────────────
async function triggerModalPreview({ jobId, storySlug, photoUrl, steps = 4 }) {
  const MODAL_URL = process.env.MODAL_PREVIEW_URL;
  if (!MODAL_URL) throw new Error('MODAL_PREVIEW_URL not set');

  const sceneUrls = getSceneUrls(storySlug);

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
      supabase_url:         process.env.SUPABASE_URL_STORY || process.env.SUPABASE_URL,
      supabase_service_key: process.env.SUPABASE_SERVICE_KEY,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Modal trigger failed: ${response.status} ${text}`);
  }

  return { backend: 'modal', jobId };
}

// ── GCP backend (stub — implement when GCP quota available) ───────────────────
async function triggerGCPPreview({ jobId, storySlug, photoUrl, steps = 4 }) {
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

module.exports = { triggerPreview, getSceneUrls, HERO_SCENES };

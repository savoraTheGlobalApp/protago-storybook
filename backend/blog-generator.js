/**
 * blog-generator.js
 * Generates a blog post using Gemini (text) + Imagen 3 (cover image),
 * uploads the image to GCS, and saves the post to Supabase as a draft.
 */

import { createSign } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const env = () => ({
  SUPABASE_URL:  process.env.SUPABASE_URL_STORY,
  SUPABASE_KEY:  process.env.SUPABASE_SERVICE_KEY_STORY,
  GCS_BUCKET:    process.env.GCS_SCENES_BUCKET || 'protago-story-scenes',
  GCP_PROJECT:   process.env.GCP_PROJECT || 'voice-ai-buddy',
  GEMINI_MODEL:  process.env.GEMINI_MODEL || 'gemini-2.5-pro',
  IMAGEN_MODEL:  process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001',
});

const VERTEX_BASE = (project) =>
  `https://aiplatform.googleapis.com/v1beta1/projects/${project}/locations/global/publishers/google/models`;

// ── Topic pool ────────────────────────────────────────────────────────────────
export const TOPICS = [
  { title: 'Why Reading Aloud to Your Child Every Day Changes Everything', category: 'Reading & Literacy' },
  { title: 'Screen Time vs Story Time: Finding the Right Balance', category: 'Digital Wellness' },
  { title: 'The Magic of Seeing Yourself as the Hero of a Story', category: 'Child Development' },
  { title: '10 Ways to Make Bedtime Stories More Magical', category: 'Parenting Tips' },
  { title: 'Understanding Your Child\'s Emotional Development (Ages 3–5)', category: 'Child Development' },
  { title: 'Understanding Your Child\'s Emotional Development (Ages 6–8)', category: 'Child Development' },
  { title: 'Understanding Your Child\'s Emotional Development (Ages 9–12)', category: 'Child Development' },
  { title: 'Raising Curious Kids: How to Nurture a Love of Learning', category: 'Education' },
  { title: 'The Science Behind Storytelling and Child Brain Development', category: 'Child Development' },
  { title: 'Diwali Through a Child\'s Eyes: Teaching Festivals With Stories', category: 'Indian Culture' },
  { title: 'Holi Stories: Bringing Indian Festivals to Life for Kids', category: 'Indian Culture' },
  { title: 'Teaching Kids About Money: Age-Appropriate Financial Literacy', category: 'Education' },
  { title: 'Body Safety for Children: How to Start the Conversation', category: 'Social-Emotional Learning' },
  { title: 'Managing Big Emotions: Helping Kids Handle Anger and Fear', category: 'Social-Emotional Learning' },
  { title: 'Growth Mindset for Kids: Teaching Your Child That Effort Matters', category: 'Education' },
  { title: 'Internet Safety for Children in the Age of Social Media', category: 'Digital Wellness' },
  { title: 'The First Day of School: How to Calm Back-to-School Anxiety', category: 'Parenting Tips' },
  { title: 'New Baby at Home: Helping Your Older Child Adjust', category: 'Parenting Tips' },
  { title: 'Why Indian Mythology Matters for Modern Children', category: 'Indian Culture' },
  { title: 'Phonics and Early Reading: What Every Parent Should Know', category: 'Reading & Literacy' },
  { title: 'How to Create a Reading Nook Your Child Will Actually Use', category: 'Reading & Literacy' },
  { title: 'Why Your Child\'s Self-Image Matters More Than Their Grades', category: 'Child Development' },
  { title: 'Raising Readers in a Digital Age: Practical Tips for Indian Parents', category: 'Reading & Literacy' },
  { title: 'How Stories Teach Empathy to Young Children', category: 'Social-Emotional Learning' },
  { title: 'Environmental Awareness for Kids: Starting the Conversation at Home', category: 'Education' },
  { title: 'The Role of Play in Early Childhood Learning', category: 'Child Development' },
  { title: 'Why Kids Who Read Books Become Better Communicators', category: 'Reading & Literacy' },
  { title: 'Gifting Experiences vs Things: What Research Says About Children\'s Happiness', category: 'Parenting Tips' },
  { title: 'Indian Parenting in the Modern Age: Balancing Tradition and Progress', category: 'Indian Culture' },
  { title: 'How Personalised Books Build Reading Confidence in Kids', category: 'Reading & Literacy' },
  { title: 'Raising Bilingual Children: Tips for Indian Families', category: 'Education' },
  { title: 'How to Talk to Your Child About Failure Without Breaking Their Spirit', category: 'Social-Emotional Learning' },
  { title: 'The Power of Representation: Why Kids Need to See Themselves in Books', category: 'Child Development' },
  { title: 'Building Good Study Habits from an Early Age', category: 'Education' },
  { title: 'Teaching Kids Kindness: Simple Activities for Every Day', category: 'Social-Emotional Learning' },
  { title: 'Ramayana for Kids: Timeless Values in Modern Stories', category: 'Indian Culture' },
  { title: 'How to Encourage Your Child\'s Dream Career From an Early Age', category: 'Parenting Tips' },
  { title: 'The Benefits of Audiobooks and Read-Alouds for Children Who Struggle to Read', category: 'Reading & Literacy' },
  { title: 'How Grandparents Can Bond With Grandchildren Through Stories', category: 'Parenting Tips' },
  { title: 'Helping Your Child Navigate Friendships and Social Dynamics', category: 'Social-Emotional Learning' },
];

// ── GCS helpers (no extra npm packages) ──────────────────────────────────────
import { readFileSync } from 'fs';

function getServiceAccount() {
  if (process.env.GCS_SERVICE_ACCOUNT_JSON) {
    const raw = Buffer.from(process.env.GCS_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
    return JSON.parse(raw);
  }
  if (process.env.GCS_SERVICE_ACCOUNT_PATH) {
    return JSON.parse(readFileSync(process.env.GCS_SERVICE_ACCOUNT_PATH, 'utf-8'));
  }
  throw new Error('No GCS service account configured. Set GCS_SERVICE_ACCOUNT_JSON or GCS_SERVICE_ACCOUNT_PATH.');
}

async function getGCSToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header  = b64url({ alg: 'RS256', typ: 'JWT' });
  const payload = b64url({ iss: sa.client_email, sub: sa.client_email, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600, scope: 'https://www.googleapis.com/auth/cloud-platform' });
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`GCS token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function uploadToGCS(objectPath, buffer, contentType) {
  const { GCS_BUCKET } = env();
  const sa = getServiceAccount();
  const token = await getGCSToken(sa);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o?uploadType=media&name=${encodeURIComponent(objectPath)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType, 'Content-Length': buffer.length },
    body: buffer,
  });
  if (!res.ok) throw new Error(`GCS upload failed: ${await res.text()}`);
  return `https://storage.googleapis.com/${GCS_BUCKET}/${objectPath}`;
}

// ── Gemini text generation ────────────────────────────────────────────────────
async function generateArticle(topic) {
  const prompt = `You are a warm, expert parenting and education writer for Protago — an Indian company that creates personalised storybooks for children aged 0–12.

Write a high-quality blog post for Indian parents on the topic: "${topic.title}"

Return ONLY a valid JSON object with these exact fields:
{
  "title": "the full article title (can be slightly refined)",
  "slug": "url-slug-from-title",
  "excerpt": "2-sentence teaser (max 160 chars)",
  "meta_description": "SEO meta description, max 155 chars",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "image_prompt": "A warm, colourful, child-friendly illustration prompt for Imagen 3 that represents this article topic. No text in image. Style: bright watercolour, Indian setting where relevant.",
  "content": "Full HTML article body (800–1100 words). Use <h2> for 3–4 subheadings, <p> for paragraphs, <ul>/<li> for lists where natural. Do NOT include the title as an <h1> — start directly with introductory paragraph. Warm, practical, encouraging tone. Relevant to Indian families. End with a short closing paragraph that ties back to the joy of storytelling and personalised reading."
}

Do not include any markdown, backticks, or text outside the JSON.`;

  const { GCP_PROJECT, GEMINI_MODEL } = env();
  const token = await getGCSToken(getServiceAccount());
  const res = await fetch(
    `${VERTEX_BASE(GCP_PROJECT)}/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 8192 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini text error: ${await res.text()}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini returned empty response');
  // Strip markdown code fences if present (Vertex AI doesn't honour responseMimeType)
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

// ── Imagen 3 cover image ──────────────────────────────────────────────────────
async function generateCoverImage(imagePrompt) {
  const { GCP_PROJECT, IMAGEN_MODEL } = env();
  const token = await getGCSToken(getServiceAccount());
  const res = await fetch(
    `${VERTEX_BASE(GCP_PROJECT)}/${IMAGEN_MODEL}:predict`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        instances: [{ prompt: imagePrompt }],
        parameters: { sampleCount: 1, aspectRatio: '16:9', safetyFilterLevel: 'block_few' },
      }),
    }
  );
  if (!res.ok) throw new Error(`Imagen error: ${await res.text()}`);
  const data = await res.json();
  const b64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('Imagen 3 returned no image');
  return Buffer.from(b64, 'base64');
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function supabase(method, path, body) {
  const { SUPABASE_URL, SUPABASE_KEY } = env();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path}: ${await res.text()}`);
  return res.json();
}

async function getRecentSlugs(limit = 20) {
  const data = await supabase('GET', `blog_posts?select=slug&order=created_at.desc&limit=${limit}`, null);
  return new Set(data.map(r => r.slug));
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateBlogPost(overrideTopic = null) {
  // Pick a topic not used recently
  const recentSlugs = await getRecentSlugs();
  let topic = overrideTopic;
  if (!topic) {
    const available = TOPICS.filter(t => {
      const candidateSlug = t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return !recentSlugs.has(candidateSlug);
    });
    topic = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : TOPICS[Math.floor(Math.random() * TOPICS.length)];
  }

  console.log(`[blog] Generating: "${topic.title}" (${topic.category})`);

  // Generate article text
  const article = await generateArticle(topic);
  console.log(`[blog] Article generated: ${article.slug}`);

  // Generate cover image
  let coverImageUrl = null;
  try {
    const imgBuffer = await generateCoverImage(article.image_prompt);
    const gcsPath = `blog/${article.slug}.jpg`;
    coverImageUrl = await uploadToGCS(gcsPath, imgBuffer, 'image/jpeg');
    console.log(`[blog] Cover image uploaded: ${coverImageUrl}`);
  } catch (err) {
    console.warn('[blog] Cover image failed (continuing without):', err.message);
  }

  // Append disclaimer to content
  const disclaimer = `<div class="blog-disclaimer"><strong>Disclaimer:</strong> This article is for general informational and educational purposes only. It does not constitute professional medical, psychological, or pedagogical advice. Every child is unique — always consult a qualified professional for guidance specific to your child's needs.</div>`;
  const fullContent = article.content + '\n' + disclaimer;

  // Save to Supabase as draft
  const [post] = await supabase('POST', 'blog_posts', {
    slug:             article.slug,
    title:            article.title,
    excerpt:          article.excerpt,
    content:          fullContent,
    category:         topic.category,
    tags:             article.tags || [],
    cover_image_url:  coverImageUrl,
    meta_description: article.meta_description,
    author:           'Protago Team',
    published:        false,
    published_at:     null,
  });

  console.log(`[blog] Saved draft: id=${post.id} slug=${post.slug}`);
  return post;
}

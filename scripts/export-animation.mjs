#!/usr/bin/env node
/**
 * Export face-swap animations as MP4 videos.
 * Arrow draws in slowly, then when complete → instant face transform with a flash.
 *
 * Usage:
 *   node scripts/export-animation.mjs                        # all themes
 *   node scripts/export-animation.mjs --themes ram-setu-squirrel,hanuman-leap
 *   node scripts/export-animation.mjs --outdir ./exports
 */

import sharp from 'sharp';
import { execSync } from 'child_process';
import { mkdirSync, readdirSync, existsSync, rmSync, writeFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');
const PUBLIC    = join(ROOT, 'public');
const FACESWAP  = join(PUBLIC, 'themes_faceswap');
const FACES_DIR = join(PUBLIC, 'faces');

// ── Config ──────────────────────────────────────────────────────────────────

const FACE_SIZE      = 150;
const BORDER_PX      = 5;
const BORDER_COLOR   = '#FF6B35';
const ARROW_COLOR    = '#FF6B35';
const ARROW_PATH_LEN = 115;  // approx bezier length in viewBox 0 0 160 90

const FPS          = 30;
const ANIM_FRAMES  = 60;                        // arrow draw-in (~2s)
const HOLD_FRAMES  = Math.round(0.6 * FPS);    // brief hold after arrow lands
const FLASH_FRAMES = 4;                         // white flash frames on transform
const LOOPS        = 2;

const FACES = [
  { key: 'boy_young', file: 'face_boy_young.webp' },
  { key: 'boy_older', file: 'face_boy_older.webp' },
  { key: 'girl',      file: 'face_girl_medium.webp' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get  = flag => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
  return {
    themes: get('--themes')?.split(',').map(s => s.trim()) ?? null,
    outDir: get('--outdir') ?? join(ROOT, 'exports'),
  };
}

function detectSlugs() {
  return readdirSync(FACESWAP)
    .filter(f => f.endsWith('_boy_young.webp') && !f.includes('@thumb'))
    .map(f => f.replace('_boy_young.webp', ''));
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function arrowSvg(w, h, progress) {
  const eased      = easeInOut(Math.max(0, Math.min(1, progress)));
  const dashoffset = (ARROW_PATH_LEN * (1 - eased)).toFixed(2);
  const headOpacity = progress > 0.8 ? ((progress - 0.8) / 0.2).toFixed(3) : '0';
  const sw         = (2 / (w / 160)).toFixed(3);

  return Buffer.from(
    `<svg width="${w}" height="${h}" viewBox="0 0 160 90" ` +
    `preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M 148 4 Q 148 45 52 30" fill="none" stroke="${ARROW_COLOR}" ` +
    `stroke-width="${sw}" stroke-dasharray="${ARROW_PATH_LEN}" ` +
    `stroke-dashoffset="${dashoffset}" stroke-linecap="round"/>` +
    `<path d="M 60 25 L 52 30 L 58 36" fill="none" stroke="${ARROW_COLOR}" ` +
    `stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ` +
    `opacity="${headOpacity}"/>` +
    `</svg>`
  );
}

async function buildFaceCircle(facePath) {
  const total = FACE_SIZE + BORDER_PX * 2;
  const half  = total / 2;

  const clipped = await sharp(facePath)
    .resize(FACE_SIZE, FACE_SIZE, { fit: 'cover' })
    .composite([{
      input: Buffer.from(`<svg width="${FACE_SIZE}" height="${FACE_SIZE}"><circle cx="${FACE_SIZE/2}" cy="${FACE_SIZE/2}" r="${FACE_SIZE/2}"/></svg>`),
      blend: 'dest-in',
    }])
    .png().toBuffer();

  return sharp({
    create: { width: total, height: total, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([
    { input: Buffer.from(`<svg width="${total}" height="${total}"><circle cx="${half}" cy="${half}" r="${half}" fill="${BORDER_COLOR}"/></svg>`) },
    { input: Buffer.from(`<svg width="${total}" height="${total}"><circle cx="${half}" cy="${half}" r="${FACE_SIZE/2+1}" fill="white"/></svg>`) },
    { input: clipped, left: BORDER_PX, top: BORDER_PX },
  ]).png().toBuffer();
}

async function makeFrame(sceneBuf, w, h, faceCircleBuf, arrowProgress) {
  const total = FACE_SIZE + BORDER_PX * 2;
  const left  = w - total - 16;
  const top   = Math.max(Math.round(-total / 2) + 20, 8);

  return sharp(sceneBuf)
    .composite([
      { input: arrowSvg(w, h, arrowProgress) },
      { input: faceCircleBuf, left, top },
    ])
    .png().toBuffer();
}

/** Flash only the face circle area — scene stays static */
async function flashFaceCircle(frameBuf, w, h, faceCircleBuf, opacity) {
  const total = FACE_SIZE + BORDER_PX * 2;
  const left  = w - total - 16;
  const top   = Math.max(Math.round(-total / 2) + 20, 8);
  const cx    = left + total / 2;
  const cy    = top  + total / 2;
  const r     = total / 2;

  return sharp(frameBuf)
    .composite([
      // New face circle underneath (already composited), overlaid by white
      { input: faceCircleBuf, left, top },
      // White circle flash on top of face area only
      { input: Buffer.from(
          `<svg width="${w}" height="${h}">` +
          `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white" opacity="${opacity.toFixed(3)}"/>` +
          `</svg>`
        )
      },
    ])
    .png().toBuffer();
}

// ── Per-theme export ──────────────────────────────────────────────────────────

async function exportTheme(slug, outDir, tmpDir) {
  console.log(`\n▶ ${slug}`);

  const faces = [];
  for (const { key, file } of FACES) {
    const scenePath = join(FACESWAP, `${slug}_${key}.webp`);
    if (!existsSync(scenePath)) { console.warn(`  ⚠ missing ${slug}_${key}.webp`); continue; }
    const meta = await sharp(scenePath).metadata();
    faces.push({
      sceneBuf: await sharp(scenePath).png().toBuffer(),
      faceBuf:  await buildFaceCircle(join(FACES_DIR, file)),
      w: meta.width, h: meta.height,
    });
  }
  if (faces.length < 2) { console.warn('  ⚠ need at least 2 faces, skipping'); return; }

  const { w, h } = faces[0];

  const concatLines = [];
  let frameIdx = 0;
  let lastFramePath = null;

  const saveFrame = (buf, label) => {
    const p = join(tmpDir, `${slug}_${String(frameIdx++).padStart(5,'0')}_${label}.png`);
    writeFileSync(p, buf);
    concatLines.push(`file '${p}'`);
    concatLines.push(`duration ${(1/FPS).toFixed(6)}`);
    lastFramePath = p;
  };

  // Use the first face's scene as the fixed background throughout
  const fixedSceneBuf = faces[0].sceneBuf;

  for (let loop = 0; loop < LOOPS; loop++) {
    for (let fi = 0; fi < faces.length; fi++) {
      const { faceBuf } = faces[fi];
      process.stdout.write(`  loop${loop+1} face${fi+1}: draw`);

      // Phase 1: arrow draws in (scene stays fixed, only face circle changes)
      for (let f = 0; f < ANIM_FRAMES; f++) {
        const rawProg = f / (ANIM_FRAMES - 1);
        saveFrame(await makeFrame(fixedSceneBuf, w, h, faceBuf, rawProg), `l${loop}f${fi}a${f}`);
      }

      // Phase 2: brief hold (arrow fully drawn)
      process.stdout.write(' hold');
      const endFrame = await makeFrame(fixedSceneBuf, w, h, faceBuf, 1.0);
      for (let f = 0; f < HOLD_FRAMES; f++) saveFrame(endFrame, `l${loop}f${fi}h${f}`);

      // Phase 3: flash face circle only → new face appears (scene unchanged)
      const isLast = loop === LOOPS - 1 && fi === faces.length - 1;
      if (!isLast) {
        process.stdout.write(' flash');
        const nextFi   = (fi + 1) % faces.length;
        const nextFaceBuf = faces[nextFi].faceBuf;

        // Flash out: white circle grows over current face
        for (let f = 0; f < FLASH_FRAMES; f++) {
          const opacity = (f + 1) / FLASH_FRAMES;
          saveFrame(
            await flashFaceCircle(endFrame, w, h, faceBuf, opacity),
            `l${loop}f${fi}fo${f}`
          );
        }
        // Flash in: white circle fades revealing next face (arrow reset to 0)
        const nextStart = await makeFrame(fixedSceneBuf, w, h, nextFaceBuf, 0);
        for (let f = FLASH_FRAMES - 1; f >= 0; f--) {
          const opacity = (f + 1) / FLASH_FRAMES;
          saveFrame(
            await flashFaceCircle(nextStart, w, h, nextFaceBuf, opacity),
            `l${loop}f${fi}fi${f}`
          );
        }
      }
      process.stdout.write(' ✓\n');
    }
  }

  // ffmpeg concat needs the last file listed twice (no duration on final entry)
  concatLines.push(`file '${lastFramePath}'`);

  const concatFile = join(tmpDir, `${slug}.txt`);
  writeFileSync(concatFile, concatLines.join('\n'));

  const outPath = join(outDir, `${slug}.mp4`);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r ${FPS} -movflags +faststart "${outPath}"`,
    { stdio: 'pipe' }
  );
  console.log(`  ✓ saved → ${outPath}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { themes, outDir } = parseArgs();
  const slugs = themes ?? detectSlugs();
  if (!slugs.length) { console.error('No themes found.'); process.exit(1); }

  console.log(`Exporting ${slugs.length} theme(s): ${slugs.join(', ')}`);
  console.log(`Output dir: ${outDir}`);

  mkdirSync(outDir, { recursive: true });
  const tmpDir = join(outDir, '.tmp');
  mkdirSync(tmpDir, { recursive: true });

  for (const slug of slugs) {
    try {
      await exportTheme(slug, outDir, tmpDir);
    } catch (err) {
      console.error(`  ✗ ${slug}: ${err.message}\n${err.stack}`);
    }
  }

  rmSync(tmpDir, { recursive: true, force: true });
  console.log('\nDone.');
}

main();

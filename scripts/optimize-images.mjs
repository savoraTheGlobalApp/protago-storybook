#!/usr/bin/env node
// Walks public/ and produces .webp + @thumb.webp variants for PNG/JPG sources.
// Skips already-optimized files (mtime newer than source). Run with: npm run optimize:images
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const SKIP_DIRS = new Set(['photo-tips', 'team']);
const SOURCE_EXT = new Set(['.png', '.jpg', '.jpeg']);

const FULL_QUALITY = 82;
const THUMB_QUALITY = 75;
const THUMB_MAX_WIDTH = 800;

let stats = { converted: 0, thumbed: 0, skipped: 0, savedBytes: 0 };

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = path.relative(PUBLIC_DIR, full);
      const top = rel.split(path.sep)[0];
      if (SKIP_DIRS.has(top)) continue;
      await walk(full);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXT.has(ext)) continue;
    if (entry.name.includes('@thumb')) continue;
    await convert(full);
  }
}

async function isStale(srcPath, outPath) {
  try {
    const [src, out] = await Promise.all([fs.stat(srcPath), fs.stat(outPath)]);
    return src.mtimeMs > out.mtimeMs;
  } catch {
    return true;
  }
}

async function convert(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, path.extname(srcPath));
  const fullOut = path.join(dir, `${base}.webp`);
  const thumbOut = path.join(dir, `${base}@thumb.webp`);

  const srcSize = (await fs.stat(srcPath)).size;
  const rel = path.relative(PUBLIC_DIR, srcPath);

  // Full-size webp
  if (await isStale(srcPath, fullOut)) {
    await sharp(srcPath).webp({ quality: FULL_QUALITY }).toFile(fullOut);
    const outSize = (await fs.stat(fullOut)).size;
    stats.converted++;
    stats.savedBytes += srcSize - outSize;
    console.log(`  ✓ ${rel} → .webp (${fmt(srcSize)} → ${fmt(outSize)})`);
  } else {
    stats.skipped++;
  }

  // Thumb webp
  if (await isStale(srcPath, thumbOut)) {
    const meta = await sharp(srcPath).metadata();
    const pipeline = sharp(srcPath);
    if (meta.width && meta.width > THUMB_MAX_WIDTH) {
      pipeline.resize({ width: THUMB_MAX_WIDTH });
    }
    await pipeline.webp({ quality: THUMB_QUALITY }).toFile(thumbOut);
    stats.thumbed++;
  }
}

function fmt(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

console.log(`Optimizing images in ${PUBLIC_DIR}…\n`);
await walk(PUBLIC_DIR);
console.log(`\nDone. Converted ${stats.converted} full + ${stats.thumbed} thumbs, skipped ${stats.skipped}. Saved ${fmt(stats.savedBytes)}.`);

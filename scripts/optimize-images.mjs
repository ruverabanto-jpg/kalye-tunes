// Generate modern image variants (AVIF + WebP) for every rendered image in
// public/assets. The generated files are committed next to their sources and
// referenced from index.html through <picture>, so the deploy does no image
// processing. Social cards, icons and the merch order QR keep their original
// formats (crawler compatibility, icon metadata, scannability).
//
// Run after changing any source image: pnpm images
import { readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, 'public', 'assets');

/** Files that must keep their original format. */
const SKIP_PATTERNS = [
  /^og-/, // social cards served to crawlers as JPEG
  /^favicon\.png$/,
  /^apple-touch-icon\.png$/,
  /^icon-\d+\.png$/,
  /^kalye-tunes-logo-160\.png$/,
  /order-qr\.png$/, // QR codes must stay lossless PNG
];

const PHOTO_AVIF = { quality: 58, effort: 4 };
const PHOTO_WEBP = { quality: 80 };
const GRAPHIC_AVIF = { quality: 62, effort: 4 }; // logos/badges with flat colour + alpha
const GRAPHIC_WEBP = { quality: 88, lossless: false };

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let converted = 0;
let originalBytes = 0;
let avifBytes = 0;
let webpBytes = 0;

for await (const source of walk(assets)) {
  const ext = extname(source).toLowerCase();
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') continue;
  const relativePath = relative(assets, source).replace(/\\/g, '/');
  if (SKIP_PATTERNS.some((pattern) => pattern.test(relativePath))) continue;

  const base = source.replace(/\.(jpe?g|png)$/i, '');
  const graphic = ext === '.png';
  const [avif, webp] = await Promise.all([
    sharp(source).avif(graphic ? GRAPHIC_AVIF : PHOTO_AVIF).toFile(base + '.avif'),
    sharp(source).webp(graphic ? GRAPHIC_WEBP : PHOTO_WEBP).toFile(base + '.webp'),
  ]);
  const original = (await stat(source)).size;
  originalBytes += original;
  avifBytes += avif.size;
  webpBytes += webp.size;
  converted += 1;
  console.log(`${relativePath}: ${kb(original)} -> avif ${kb(avif.size)} / webp ${kb(webp.size)}`);
}

console.log(
  `\n${converted} images: ${kb(originalBytes)} source -> ${kb(avifBytes)} avif / ${kb(webpBytes)} webp ` +
  `(${(100 - (avifBytes / originalBytes) * 100).toFixed(0)}% smaller as AVIF)`,
);

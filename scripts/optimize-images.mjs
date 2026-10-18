// Generate modern image variants (AVIF + WebP) for the images that render above
// the fold. The generated files are committed next to their source and referenced
// from index.html through <picture>, so the deploy needs no image processing.
//
// Run after changing one of the source images: pnpm images
import { access, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Images worth a modern-format variant: the LCP photo and the header wordmark. */
const TARGETS = [
  { source: 'public/assets/kalye-tunes-hero.jpg', avif: { quality: 52, effort: 4 }, webp: { quality: 80 } },
  { source: 'public/assets/kalye-tunes-wordmark.png', avif: { quality: 62, effort: 4 }, webp: { quality: 88 } },
];

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

for (const target of TARGETS) {
  const source = join(root, target.source);
  await access(source);
  const base = source.replace(/\.(jpe?g|png)$/i, '');
  const input = sharp(source);
  const [avif, webp] = await Promise.all([
    input.clone().avif(target.avif).toFile(base + '.avif'),
    input.clone().webp(target.webp).toFile(base + '.webp'),
  ]);
  const original = (await stat(source)).size;
  console.log(`${target.source}: ${kb(original)} -> avif ${kb(avif.size)} / webp ${kb(webp.size)}`);
}

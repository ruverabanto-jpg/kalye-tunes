// Post-build verification: every local file URL referenced from the built HTML
// (including paths inside inline scripts) and the built CSS must resolve inside
// dist/. Run locally with `pnpm check` and in CI after `pnpm build`.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

const failures = [];
const seen = new Set();

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

function stripUrl(url) {
  return url.split('#')[0].split('?')[0];
}

function localPath(url) {
  const clean = stripUrl(url.trim());
  if (!clean.startsWith('/')) return null; // external, data:, mailto:, pure hash
  return join(dist, clean);
}

async function checkUrl(url, source) {
  const path = localPath(url);
  if (!path || seen.has(path)) return;
  seen.add(path);
  if (!(await exists(path))) failures.push(`${source}: ${url}`);
}

const html = await readFile(join(dist, 'index.html'), 'utf8');

// <img src>, <source srcset>, <link href>, preload URLs, poster...
for (const match of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)) await checkUrl(match[1], 'html attribute');
for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const candidate of match[1].split(',')) await checkUrl(candidate.trim().split(/\s+/)[0], 'srcset');
}
// Paths quoted inside inline scripts (dynamic line-up / advocacy images).
for (const match of html.matchAll(/["'`](\/assets\/[^"'`\s]+)["'`]/g)) await checkUrl(match[1], 'inline script');

// Built stylesheet: local url(...) references and expected design-system hooks.
const cssFiles = await readdir(join(dist, 'build'));
const cssFile = cssFiles.find((file) => file.endsWith('.css'));
if (!cssFile) {
  failures.push('build: no CSS bundle found in dist/build');
} else {
  const css = await readFile(join(dist, 'build', cssFile), 'utf8');
  for (const match of css.matchAll(/url\((?:'|")?([^)'"]+)(?:'|")?\)/g)) {
    const url = match[1];
    // Skip data URIs (the noise/grain textures), fragments and remote URLs.
    if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('#') || url.startsWith('%23')) continue;
    if (url.startsWith('/')) await checkUrl(url, 'css url()');
    else failures.push(`css url(): unresolved relative URL ${url}`);
  }
  for (const needle of ['.hero-title', '.kern-t-u', 'Pirata One', 'Bebas Neue', 'Space Mono']) {
    if (!css.includes(needle)) failures.push(`css: expected "${needle}" in the bundle`);
  }
  if (!css.includes('@font-face')) failures.push('css: no self-hosted @font-face rules found');
}

// Guardrails: no third-party font CDN, no stale committed Tailwind artifact,
// and the performance hints for the hashed CSS / self-hosted fonts / AVIF hero.
if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) failures.push('html: still references Google Fonts');
if (html.includes('/assets/tailwind.css')) failures.push('html: still references the old committed Tailwind CSS');
if (!html.includes('/assets/fonts/pirata-one-400-latin.woff2')) failures.push('html: missing the self-hosted font preload');
if (!/type="image\/avif"[^>]*href="\/assets\/kalye-tunes-hero\.avif"/.test(html)) failures.push('html: missing the AVIF hero preload');
if (!/href="\/build\/style-[A-Za-z0-9_-]+\.css"/.test(html)) failures.push('html: hashed stylesheet link missing');

// Font files must ship with the build.
const fonts = await readdir(join(dist, 'assets', 'fonts')).catch(() => []);
if (!fonts.some((file) => file.endsWith('.woff2'))) failures.push('fonts: no .woff2 files in dist/assets/fonts');

// Every rendered image (static attributes, JSON-LD and inline-script data) must
// have AVIF + WebP siblings; social cards, icons and the QR keep original formats.
const IMAGE_SKIP = [/\/assets\/og-/, /\/assets\/favicon\.png$/, /\/assets\/apple-touch-icon\.png$/, /\/assets\/icon-\d+\.png$/, /\/assets\/kalye-tunes-logo-160\.png$/, /\/assets\/merch\/order-qr\.png$/];
const renderedImages = new Set();
for (const match of html.matchAll(/(?:\/assets\/)[A-Za-z0-9_\-./]+\.(?:jpe?g|png)/g)) {
  const url = match[0];
  if (IMAGE_SKIP.some((pattern) => pattern.test(url))) continue;
  renderedImages.add(url);
}
let modernVariants = 0;
for (const url of renderedImages) {
  for (const ext of ['avif', 'webp']) {
    const variant = url.replace(/\.(?:jpe?g|png)$/i, '.' + ext);
    if (!(await exists(join(dist, variant)))) failures.push(`images: missing ${variant} for ${url}`);
    modernVariants += 1;
  }
}
if (modernVariants < 100) failures.push(`images: expected modern variants for the rendered images (found ${modernVariants})`);
const avifSources = (html.match(/type="image\/avif"/g) || []).length;
if (avifSources < 25) failures.push(`html: expected AVIF <source> elements across the rendered images (found ${avifSources})`);

if (failures.length) {
  console.error(`✗ ${failures.length} build verification failure(s):`);
  for (const failure of failures) console.error('  - ' + failure);
  process.exit(1);
}
console.log(`✓ build verified: ${seen.size} local files resolve, ${renderedImages.size} images with modern variants, CSS bundle ${cssFile}, ${fonts.length} font files`);

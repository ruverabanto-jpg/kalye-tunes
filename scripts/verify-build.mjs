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

// Guardrails: no third-party font CDN, no stale committed Tailwind artifact.
if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) failures.push('html: still references Google Fonts');
if (html.includes('/assets/tailwind.css')) failures.push('html: still references the old committed Tailwind CSS');

// Font files must ship with the build.
const fonts = await readdir(join(dist, 'assets', 'fonts')).catch(() => []);
if (!fonts.some((file) => file.endsWith('.woff2'))) failures.push('fonts: no .woff2 files in dist/assets/fonts');

// Modern formats used by the above-the-fold <picture> elements must be present.
for (const image of ['kalye-tunes-hero.avif', 'kalye-tunes-hero.webp', 'kalye-tunes-wordmark.avif']) {
  if (!(await exists(join(dist, 'assets', image)))) failures.push(`images: missing ${image}`);
}

if (failures.length) {
  console.error(`✗ ${failures.length} build verification failure(s):`);
  for (const failure of failures) console.error('  - ' + failure);
  process.exit(1);
}
console.log(`✓ build verified: ${seen.size} local files resolve, CSS bundle ${cssFile}, ${fonts.length} font files`);

# Kalye Tunes 2026 — UP Fair Wednesday

A single-page landing page for **Kalye Tunes 2026: UP Fair Wednesday**, the Wednesday night of UP Fair 2026 at the University of the Philippines Diliman.

The content and posters are adapted from the official [Kalye Tunes: UP Fair Wednesday](https://www.facebook.com/kalyetunes) Facebook page (selected posts, March–October 2026).

## Live site

[https://kalye-tunes.vercel.app](https://kalye-tunes.vercel.app)

## Event at a glance

| | |
| --- | --- |
| **Date** | Wednesday, April 15, 2026 |
| **Venue** | UP Diliman Sunken Garden, Quezon City |
| **Ticket booth** | 10:00 AM |
| **Gates** | 3:00 PM |
| **Event ends** | 2:00 AM |
| **Lineup** | 29 acts — the Kalye Class of 2026 |
| **Hosts** | Maroon FM's Bunny, Sab, Jill, and Millo, plus resident hosts Paris Agero and Menchie Glendo |
| **Tickets** | UP Student ₱250 / Non-UP Student ₱400; online via [HelixPay](https://kalyetunes.helixpay.ph/), walk-ins available |
| **Presented by** | EMC² Fraternity, with Kadamay and SIKAD |

## Design system

The page implements the **Kalye Tunes Grunge / Brutalist System (V1)** — a raw, high-contrast, protest-poster visual language built for urgency and subversion.

### Palette

| Token | Hex | Role |
| --- | --- | --- |
| Pitch Black | `#050505` | Base canvas |
| Deep Crimson | `#660000` | Brand bulk, primary actions, advocacy section |
| Cyan / Teal | `#00e5ff` | Signal colour, highlights, links, focus rings |
| Stark White | `#ffffff` | Type, borders, inverted surfaces |
| Olive | `#2e4a22` | Underground accent |
| Gray 900 / 800 / 400 | `#111111` / `#222222` / `#888888` | Surfaces, hairlines, secondary type |

### Typography

- **Pirata One** (`font-display`) — gothic display: wordmark, hero, poster quotes
- **Bebas Neue** (`font-heading`) — condensed headings, buttons, nav, artist names
- **Space Mono** (`font-mono`) — body copy and terminal-style labels, tags, metadata

### Texture and effects

- Fixed film-grain and CRT scanline overlays plus a soft vignette
- Glitch text (hard crimson/cyan offset shadows) and hover skew
- Crimson/cyan **duotone** treatment for stock photography
- Brutalist components: 2px borders, square corners, hard `4px 4px 0` offset shadows
- Technical grid lines, terminal markers (`//`, `[+]`, `▸`), giant outline background words
- Custom crimson scrollbar and cyan text selection

Tokens live in the `tailwind.config` block and the `:root` custom properties in `index.html`.

### Breakpoints

- `< 1024px` — full-screen menu, sticky two-button action dock, hero reduced to one primary CTA
- `≥ 1024px` — desktop navigation and inline ticket CTA
- `≥ 1280px` — extra header meta
- `≥ 1536px` — larger nav tracking

## Stack

- HTML5 single-page site with vanilla JavaScript (no runtime framework)
- [Vite 8](https://vite.dev/) build (`index.html` is the entry; output in `dist/`)
- [Tailwind CSS v4](https://tailwindcss.com/) through `@tailwindcss/vite`, configured CSS-first in `src/styles.css` (`@theme` tokens + the hand-written design system)
- Self-hosted, subsetted WOFF2 fonts: Pirata One, Bebas Neue, Space Mono (`public/assets/fonts/`, preloaded, no third-party font CDN)
- AVIF/WebP variants for every rendered image — static markup and JS-rendered carousels alike — served through `<picture>` with the original JPEG/PNG as fallback
- GitHub Actions CI (install → build → verify on every push and PR) and Dependabot for weekly npm + Actions updates; every Vercel build additionally runs `pnpm build && pnpm check`, so a broken reference or missing asset fails the deploy
- Vercel builds and deploys `dist/`

Node.js 22+ and pnpm 11 are required for local development.

## Structure

```text
kalye-tunes/
├── index.html              # Markup + inline interaction scripts (Vite entry)
├── src/
│   └── styles.css          # Tailwind v4 entry: @theme tokens, @font-face, design system
├── public/                 # Copied verbatim into dist/
│   ├── assets/
│   │   ├── kalye-tunes-hero.jpg      # Hero background photo (+ .avif / .webp variants)
│   │   ├── kalye-tunes-wordmark.png  # Header wordmark (+ .avif / .webp variants)
│   │   ├── kalye-class-2026.jpg      # Official Kalye Class of 2026 poster
│   │   ├── kalye-gates-open.jpg      # Official gates-open poster
│   │   ├── kalye-tunes-logo.png      # Transparent badge artwork (master)
│   │   ├── kalye-tunes-logo-160.png  # Small badge variant
│   │   ├── kalye-tunes-playlist-cover.jpg  # Playlist artwork (vinyl label)
│   │   ├── fonts/                    # Self-hosted WOFF2 subsets
│   │   ├── artists/                  # 720×720 artist spotlight images
│   │   ├── advocacy/                 # 12 official advocacy-post images
│   │   ├── hosts/                    # Maroon FM host cards and photos
│   │   ├── brands/                   # Official logos and ticket art
│   │   ├── upfair/                   # Traffic-plan map and prohibited-items artwork
│   │   ├── merch/                    # Official merch designs and order QR
│   │   ├── favicon.png               # Browser / home-screen icon
│   │   ├── og-kalye-tunes-home.jpg   # 1200×630 homepage social card
│   │   └── og-fallback.jpg           # Branded 1200×630 fallback social card
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── site.webmanifest
│   └── 28c6222333ef447695a6989d7837a899.txt  # IndexNow verification key
├── scripts/
│   ├── optimize-images.mjs   # Regenerates the AVIF/WebP variants (pnpm images)
│   └── verify-build.mjs      # Post-build link/asset/CSS verification (pnpm check)
├── .github/
│   ├── workflows/ci.yml      # Install → build → verify on every push and PR
│   └── dependabot.yml        # Weekly npm + GitHub Actions updates
├── package.json / pnpm-lock.yaml
├── vite.config.js
├── vercel.json             # Vercel build settings, caching, and security headers
├── .vercelignore           # Keeps docs and local metadata out of deployments
├── .gitignore
├── README.md
├── _archive/
│   └── index.original.html # Pre-redesign snapshot (not deployed)
└── .vercel/                # Local link to the existing Vercel project
```

## Local preview

```powershell
pnpm install
pnpm dev        # http://127.0.0.1:5173
```

Production build preview:

```powershell
pnpm build      # writes dist/
pnpm check      # verifies every local URL in dist/ resolves
pnpm preview    # http://127.0.0.1:4173
```

## Deploy

Pushes to `main` trigger a Vercel production deployment automatically. Vercel runs
`pnpm install --frozen-lockfile && pnpm build` and serves `dist/` (see `vercel.json`).

To deploy from this folder instead:

```powershell
vercel deploy --prod
```

The production alias is `kalye-tunes.vercel.app`.

## Quality-of-life features

- **Navigation** — six tabs (Lineup, Advocacy, Hosts, Updates, Guide, Tickets), scroll-spy with `aria-current`, smooth anchor scrolling with fixed-header offset, `#` links that update history without reloading
- **Mobile menu** — focus trap, `inert` background, scroll lock, Escape-to-close with focus return, scrollable on short screens, hidden behind the header close button
- **Mobile action dock** — persistent Tickets / Lineup actions under `lg`, with a body spacer so footer content is never trapped behind it
- **Back to top** — appears after 640px of scroll, restores focus to the main content
- **Share** — native `navigator.share` with clipboard fallback (and a toast confirmation) plus Google Maps directions
- **Social icons** — real inline SVG icons for Facebook, Linktree, Spotify, Maps, and email in the footer and mobile menu, with accessible labels instead of abbreviated text
- **Radio stability** — play/pause/next keep the status label stable while a preview loads (no Paused→Playing flash), preview failures stop cleanly instead of skipping titles, and native tooltip titles are removed from the transport controls
- **Toast** — accessible (`role="status"`, `aria-live`) feedback with timestamped auto-dismiss
- **Lineup** — the auto-advancing artist spotlight replaces the old text roster; the official Kalye Class of 2026 poster is centered below the carousel with no text column beside it
- **Artist spotlight** — auto-advancing carousel showing 3 artists at a time on desktop (2 tablet / 1 mobile), with portraits, short bios, genre tags, playlist credits, prev/next and pause controls, and a 7-second progress bar. The running order is shuffled on every visit so the bigger names do not always lead; it pauses on hover/focus, when off-screen, and under `prefers-reduced-motion`
- **Updates** — curated official page posts with dates and links: Hev Abi reveal, physical ticket selling, the Class of 2026 announcement, gates-open, the Pook Amorsolo statement, and the latest reels
- **Hosts** — a dedicated "Meet the hosts" section with six profiles: Maroon FM's Bunny, Sab, Jill, and Millo, plus resident hosts Paris Agero and Menchie Glendo. Each card uses the official host image, a short hosting story, and a "Stands for" line; Maroon FM's Facebook/Instagram/X links sit alongside the group
- **Guide** — ticket booth and gate times, entry/re-entry cutoffs, prices, HelixPay links, contact details, and a native `<details>` FAQ with `FAQPage` structured data
- **UP Fair advisories** — a Guide block with the official traffic-plan map, pre-event entry/safety reminders, and the prohibited-items list; all sourced and linked to the official UP Fair posts, with the April 15 Kalye Tunes date stated explicitly
- **Advocacy partners** — a coalition band introducing **Kadamay** (history, mission, and demands drawn from its official about page) and **SIKAD** (co-presenter context and the values carried by its mark), with large dark logo watermarks and no logo frames
- **Advocacy carousel** — 12 official advocacy posts in an auto-advancing, pausable card carousel modeled on the artist spotlight: image, category, headline, short excerpt, and direct post link
- **Kalye Radio** — persistent floating player docked above the mobile action bar and bottom-left on desktop. It opens as a compact title/play strip and expands into the full vinyl, transport, queue, and volume panel; it stays available across every section and can be minimized out of the way. Metadata rows and the explicit badge slot are fixed so track changes never shift the title, seek bar, or controls.
- **Tickets** — real UP Student / Non-UP Student pricing, HelixPay links, walk-in details, merch links
- **Official branding** — the Kalye Tunes 2026 badge in the Advocacy statement panel, the EMC² Fraternity logo in the Advocacy/footer areas, and dark-background Kadamay/SIKAD logo variants in Advocacy and the footer partner directory, all treated consistently on the dark surface
- **Physical ticket art** — the uploaded official ticket design is shown in the Tickets header as the "Official physical ticket" visual, linked to HelixPay
- **Merch drop** — three official ₱650 shirt designs (Beware of Gods, Buhay Kalye, RE: PORMA) in the Tickets section, with the official reopened-order post and PIXEL order QR
- **Partner directory** — a footer directory of organizations and sponsors with verified official outbound links; partners without a confirmed public page are listed without links to avoid dead URLs
- **Accessibility** — skip link, visible `:focus-visible` rings, labelled landmarks and controls, decorative art marked `aria-hidden`, reduced-motion support
- **Performance** — self-hosted preloaded WOFF2 fonts (no font CDN), `fetchpriority="high"` hero photo, AVIF/WebP `<picture>` variants for every rendered image (≈80 % less image weight on a full page load), hashed and immutable-cached CSS bundle, lazy-loaded posters and photography, rAF-throttled scroll work, no JavaScript libraries
- **SEO / sharing** — canonical URL, Open Graph + Twitter cards, PNG favicon, `MusicEvent` and `FAQPage` JSON-LD

## Repository & deployment

- **GitHub:** [ruverabanto-jpg/kalye-tunes](https://github.com/ruverabanto-jpg/kalye-tunes) — production branch `main`
- **Vercel:** the existing `kalye-tunes` project is linked to the repository; pushes to `main` trigger production deployments automatically (Vite build → `dist/`)
- **Build:** Vite 8 + Tailwind CSS v4 (`@tailwindcss/vite`); `src/styles.css` is the Tailwind entry, `index.html` the app entry
- **Verification:** GitHub Actions runs `pnpm install --frozen-lockfile`, `pnpm build` and `pnpm check` on every push and PR (`.github/workflows/ci.yml`); the Vercel build runs the same `build + check` gate, so a missing asset, URL or modern image variant fails both CI and the deploy
- **Testing:** `pnpm check` resolves every local URL in `dist/` (HTML attributes, srcsets, inline-script paths, CSS `url()`), verifies the self-hosted fonts, every rendered image's AVIF/WebP variant, and the design-system hooks
- **Images:** every rendered image ships AVIF/WebP siblings generated by `pnpm images` (`scripts/optimize-images.mjs`, sharp) and referenced through `<picture>` (static markup and the JS carousels both negotiate the format). Social cards, favicons/icons and the merch order QR keep their original formats. Rerun `pnpm images` after replacing any source image

## Content notes

- Event details (date, times, prices, lineup, partners) are adapted from the official Kalye Tunes page and the **April 14, 2026 lineup poster**. Always confirm last-minute changes on the page.
- Artist spotlight portraits come from Spotify artist profiles (via track embeds + oEmbed); acts without a public portrait use official artwork or a designed artist card (JLEM, Vitrum, Siklaban). Bios are short editorial summaries, not official biographies — check with the artists before publishing deeper profiles.
- Host profiles are based on the official April 14, 2026 host reveal and Maroon FM's public page; they describe each host's role and hosting ethos rather than private biographical details. Host images are the supplied official Maroon FM promo cards and resident-host photos.
- Partner links in the footer point only to official pages verified live at build time (EMC², Kadamay, MetroMart, THRD, Joyride, The Watch Alley, Vibe Coders PH, PIXEL, DBTV, MYX, OPTICS, and the UP organization partners). SIKAD, Maduming Timog, Noble Timepieces, Quantum Roadrunners, Sueño Cafe, Ground Lifted, UP Sigma Delta Pi Sorority, and Engage UP are listed without hyperlinks because no official public page could be confirmed — no dead URLs are rendered.
- The physical ticket artwork in the Tickets header is the official ticket design supplied for the site.
- The traffic plan, pre-event reminders, and prohibited-items list are adapted from official UP Fair 2026 posts. The traffic plan is effective April 15–18; Kalye Tunes is the April 15 night of the fair.
- The hero uses supplied stage photography with a muted crimson/cyan grade; the merch block uses the official reopened-drop images and order QR.
- The public guest view of the Facebook page exposed posts from **March 19, 2026 onward**; earlier 2026 posts are behind Facebook's login wall. The Updates section covers the publicly accessible rollout (March–October 2026).
- **Kalye Radio** streams Spotify's official 30-second preview clips for the ["KALYE TUNES 2026" playlist](https://open.spotify.com/playlist/1asIpFUz2KztLcPxQ4o6tc); no audio files are hosted. Full tracks open on Spotify, and playback only starts after an intentional click (browser autoplay rules).
- Playlist snapshot: 100 tracks, 58 distinct artists, 97 with previews, 59 marked explicit. The shuffle is a permutation of all previewable tracks and guarantees that no two consecutive tracks share an artist (including the queue wrap-around).
- Ticket prices use a `PHP` prefix so the display never depends on a missing peso glyph in the display/mono fonts.
- The run of show is intentionally **not** published; the lineup lists acts only.
- Statements quoted in the Advocacy section are from official page posts (Toboso 19 statement, July 10 Pook Amorsolo statement) and are adapted for layout.
- Kadamay background is sourced from [kadamay.org/about](https://kadamay.org/about/); the 12 advocacy carousel entries link to the official posts supplied for the build.
- The Kalye Tunes 2026 badge artwork is supplied brand material. Its transparent white wordmark is used in the header and organizer strip; the full badge is used for the favicon and social share card.
- Replace the remaining stock photo with final event photography when available.

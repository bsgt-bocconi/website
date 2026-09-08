# BSGT Website — CLAUDE.md

Public site for the Bocconi Shipping and Global Trade Student Association.
Full brief: `bsgt-website-spec.md`. This file is the durable summary — read
that spec when something here is unclear or missing.

## Stack

- **Astro 6.x** (pinned `^6.4.8` in `package.json`), static output only. No
  client-side rendering for content. **Do not upgrade to Astro 7.x on this
  machine** — see "Astro version constraint" below before touching this.
- **Content collections**: Markdown files in-repo, typed schemas. No CMS.
- **Hosting**: Cloudflare Pages, auto-deploy from `main`.
- **Domain**: `bocconishippingandglobaltrade.com`, non-`www` canonical.
- **Analytics**: Cloudflare Web Analytics only.
- **Fonts**: Newsreader (headlines/body) + IBM Plex Sans (nav/meta), both
  self-hosted in-repo. Never load from Google Fonts CDN.
- **Forms**: none in v1. Recruiting CTA links out instead.

## Hard constraints (do not introduce without an explicit decision)

- No database. No server-side logic. No authentication.
- No third-party embeds that set cookies before consent (no Instagram/YouTube
  embeds — link out or use click-to-load placeholders).
- No Google Analytics, no tag manager, no tracking pixels.
- No Google Fonts CDN — fonts are bundled locally.

## Content model (see spec §4 for exact field types)

- **Article**: title, slug (stable, never change post-publish), summary,
  author, date, tags, heroImage?, draft (default true).
- **Event**: title, date, startTime?, location, type (lecture|workshop|
  social|other), description, registrationUrl?. Upcoming/past is derived
  from `date`, never a manual flag.
- **Team member**: name, role, programme?, photo?, linkedin?, order.

## Brand tokens

| Token | Hex | Use |
|---|---|---|
| `navy-deep` | `#070A1D` | Primary ground, header, footer |
| `navy-mid` | `#111834` | Secondary surfaces, hover states, card grounds |
| `gold` | `#F5C877` | Accent only — mark, rules, one element per page. Never on `paper`. |
| `paper` | `#F2F4F6` | Article body background |
| `ink` | `#101820` | Body text on paper |
| `slate` | `#5A6B7A` | Metadata, captions, secondary text |

Fonts: Newsreader (serif, headlines + article body), IBM Plex Sans (nav,
metadata, labels). `bsgt-mark.svg` uses `currentColor` — set to `gold` on
navy grounds. The "BSGT" wordmark is live HTML text in the heading serif,
never an image. `favicon.svg` is a separate heavier-weight drawing — don't
substitute the full mark for it at small sizes.

## Astro version constraint

Pinned to **Astro 6.4.8**, not the current `latest` (7.3.1), for a
machine-specific reason:

- Astro 7 moved to Vite 8, which bundles **Rolldown** as its default bundler.
  Rolldown ships a native `.node` binary, and this machine's Windows
  Application Control policy blocks it outright (`ERR_DLOPEN_FAILED`). Forcing
  Rolldown's WASM fallback (`@rolldown/binding-wasm32-wasi`) doesn't work
  either — `astro sync` succeeds under WASM but both `astro dev` and
  `astro build` fail.
- Astro 6.x still uses Vite 7 (Rollup + esbuild, no Rolldown), so it installs
  and runs cleanly here. Confirmed: `astro sync`, `astro dev`, and
  `astro build` all work on 6.4.8.
- Astro 5.18.2 was tried first as a fallback and also works, but 6.x has two
  since-patched high-severity XSS advisories fixed (CVE-2026-41067 in 6.1.6,
  CVE-2026-50146 in 6.3.3) that 5.18.2 doesn't have, so 6.x is the better
  choice while 7.x remains blocked.
- `npm audit` still flags 3 remaining issues on 6.4.8 (unescaped spread
  attribute names / `transition:*` / view-transition XSS, an esbuild
  Windows-dev-server file-read issue, and sharp/libvips CVEs) that are only
  patched in 7.3.1. Accepted as low practical risk for a fully static site
  with no server, no user input, and no dynamic content beyond our own
  markdown — but worth re-checking before this goes live.
- **Do not "helpfully" bump to Astro 7 in a future session** without first
  confirming the Rolldown native binary actually loads on whatever machine
  is running the command (`node -e "require('@rolldown/binding-win32-x64-msvc')"`
  on Windows, adjusted for platform) — it may work fine in Cloudflare Pages'
  Linux build environment even though it fails here; that doesn't mean it's
  safe to upgrade the pinned local dev dependency.

## Build vs. launch (spec §9)

Placeholder articles/team entries exist to verify templates and are seeded
under `draft: true` so they're excluded from production builds. **Build
complete ≠ launch.** Do not point the custom domain, submit sitemaps to
Search Console/Bing, or share the link publicly until there is real content
(real articles, real committee roster with recorded consent). A Pages
preview URL existing is fine pre-launch; a live custom domain is not.

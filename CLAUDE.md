# BSGT Website — CLAUDE.md

Public site for the Bocconi Shipping and Global Trade Student Association.
Full brief: `bsgt-website-spec.md`. This file is the durable summary — read
that spec when something here is unclear or missing.

## Stack

- **Astro 6.x** (pinned `^6.4.8` in `package.json`), static output only. No
  client-side rendering for content. **Do not upgrade to Astro 7.x on this
  machine** — see "Astro version constraint" below before touching this.
- **Content collections**: Markdown files in-repo, typed schemas. No CMS.
  If a collection directory was empty when `astro dev` started, adding the
  first `.md` file to it while the server is still running doesn't always
  get picked up — restart `astro dev` if a collection that should now have
  entries still 404s.
- **Hosting**: Cloudflare Pages, auto-deploy from `main`.
- **Domain**: `bocconishippingandglobaltrade.com`, non-`www` canonical.
- **Analytics**: Cloudflare Web Analytics only.
- **Fonts**: Newsreader (headlines/body) + IBM Plex Sans (nav/meta), both
  self-hosted in-repo. Never load from Google Fonts CDN. Variable-weight
  woff2 files (latin + latin-ext only, normal style, weight-axis only —
  no opsz/italic) live in `public/fonts/{newsreader,ibm-plex-sans}/`,
  loaded via `src/styles/fonts.css`. They were extracted once from the
  `@fontsource-variable/*` npm packages; those packages are **not** a
  runtime dependency — don't reinstall them, just add more subset/weight
  files the same way if a future need arises.
- **Forms**: none hosted on this site. The recruiting "Apply" CTA links out to an
  external Google Form (`https://forms.gle/Ng2gsTbMKWgNvbAM7`), which handles
  division/track choice internally — don't build separate buttons per division.

## Site structure

`/` is the homepage **and** the About page — they were merged; there is no separate
`/about` route (it 301-redirects to `/` via `public/_redirects`, a Cloudflare Pages
redirect — this only works once deployed, not in local `astro dev`/`astro preview`).
Nav is About → Team → Articles → Events, with About pointing to `/`. The homepage is a
full-viewport hero (animated mark, staggered fade-in content, a once-per-session intro
animation) followed by the About prose + image carousel (sharing one scroll-linked
vessel background), then the recruiting block, all now one continuous `navy-deep`
ground end to end. See spec §3 for the full description — don't rebuild an
articles-led homepage, that design was retired.

`/team` and `/events` are also `navy-deep` now — see "Light vs dark grounds" below
before touching either.

**Intro animation timing**: one knob, `--intro-duration-ms` (currently `2500`), declared
on `#intro-overlay` in `src/pages/index.astro`'s `<style>` block. The JS auto-dismiss
timer reads this same custom property via `getComputedStyle` rather than having its own
hardcoded number — change the CSS value only, both the animation length and the timer
follow it automatically.

**Scroll-linked vessel**: `brand/vessel-silhouette.svg` (canonical, editable) /
`public/vessel-silhouette.svg` (served copy — keep both in sync if it's edited), a flat
gold geometric ship silhouette, sits behind the About + carousel region only (not the
hero — that's the animated mark's territory, and not the recruiting block, which is its
own closing section). Moves horizontally via `animation-timeline: view()`
(`@supports`-gated) with a `CSS.supports`-feature-detected rAF-scroll-listener fallback
for browsers without it — both paths track `.scroll-vessel`'s own box, not the taller
`.scroll-vessel-area` wrapper, so they pace the same way; if you touch one, check the
other still matches. Opacity is `0.2` (bumped up from an initial `0.08` once the region
went from `paper` to `navy-deep` — gold reads properly on dark, which is what it's for)
and is contrast-verified, not assumed: gold at that opacity blended into navy-deep, with
paper body text over the worst case (directly over the densest part of the silhouette),
computes to ~11.7:1 for full-opacity text and ~7.4:1 for the 0.75-opacity secondary
tier — see the code comment on `.scroll-vessel img` in `index.astro` for the numbers,
and re-verify both tiers (not just one) if the opacity changes again.
`.scroll-vessel-area` needs `overflow: hidden` to guarantee no horizontal scrollbar
from the animation's travel range; don't remove it.

## Light vs dark grounds — this is deliberate, not an inconsistency

**Dark (`navy-deep`) = the association. Light (`paper`) = where you read.** The
homepage, `/team`, and `/events` are dark. Article pages (`/articles/[slug]`) and the
`/articles` index stay on `paper` with `ink` text, on purpose, permanently — do **not**
"fix" this by making them consistent with the rest of the site in either direction.

Why: long-form reading on a dark background is measurably harder, and articles are the
one template on this site whose entire job is getting read start to finish (spec §1,
§3). Every other page is association-facing (identity, people, events) rather than
reading-facing, so it can afford — and per this rule, should have — the darker, more
branded treatment gold actually needs to read as luminous (spec §5: "`navy-deep` is
nearly black, and that is correct").

If a future page is unambiguously about *reading* (a long-form page, not a listing),
default it to `paper`/`ink`, matching articles. If it's association-facing chrome
(identity, recruiting, listings of people/events), default it to `navy-deep`/`paper`,
matching everything else. When genuinely unsure which a new page is, ask rather than
picking — this distinction is intentional, not a starting point for gradual
convergence toward one theme.

On any `navy-deep` page: body text is `paper`, never `slate` — `slate`-on-`navy-deep`
is only ~3.6:1, well under the 4.5:1 AA floor at body size (this was verified by hand,
not assumed; see `TeamMemberCard.astro`/`EventItem.astro`/`Carousel.astro`/
`team.astro`/`events.astro` for the fix already applied everywhere it was needed).
Secondary/metadata text uses `paper` at reduced opacity (0.7–0.85 depending on context)
instead of `slate`, for a visual hierarchy that stays AA-safe. Links use `paper` with
an underline (not `navy-deep`, which is invisible against its own background) and
`gold` on hover. Add `on-dark` to any new dark-ground container — it switches
`--focus-ring` to `gold` so `:focus-visible` outlines stay visible; it does **not** set
text colour, which still needs an explicit `color: var(--color-paper)` on that
container (everything under it inherits from there unless it has its own more specific
colour rule, in which case that needs fixing individually — see the components above
for the pattern).

## Naming convention

The full association name has two forms, applied consistently sitewide (see spec §5):

- **Display text people read** (hero, footer, prose): "Bocconi Shipping **&** Global
  Trade Student Association" — ampersand.
- **Machine-readable text** (`<title>`, meta description, Organization JSON-LD, Open
  Graph tags): "Bocconi Shipping **and** Global Trade Student Association" — spelled out.

Doesn't apply to "BSGT" itself, which is used freely in both contexts.

## Hard constraints (do not introduce without an explicit decision)

- No database. No server-side logic. No authentication.
- No third-party embeds that set cookies before consent (no Instagram/YouTube
  embeds — link out or use click-to-load placeholders).
- No Google Analytics, no tag manager, no tracking pixels.
- No Google Fonts CDN — fonts are bundled locally.
- No client-side JS beyond interaction-only scripts that render no content of
  their own. Currently three, all in `src/pages/index.astro` /
  `src/components/Carousel.astro`: the carousel's keyboard-arrow handling,
  the once-per-session intro-animation `sessionStorage` check, and the
  scroll-linked vessel's fallback for browsers without
  `animation-timeline: view()` (feature-detected via `CSS.supports`, not
  UA-sniffed — see "Scroll-linked vessel" below). Don't add a fourth without
  a real reason — CSS/native-HTML solves almost everything else on this site.

## Content model (see spec §4 for exact field types)

- **Article**: title, slug (stable, never change post-publish), summary,
  author, date, tags, heroImage?, draft (default true).
- **Event**: title, date, startTime?, location, type (lecture|workshop|
  social|other), description, registrationUrl?, draft (default true).
  Upcoming/past is derived from `date`, never a manual flag.
- **Team member**: name, role, programme?, photo?, linkedin?, order,
  draft (default true).
- **Slide** (homepage carousel, `src/content/slides/`): caption (doubles as
  alt text when `image` is set, or the visible placeholder message when it
  isn't), image?, order, draft (default true).

All four collections have `draft`, same treatment: every page/query that
reads a collection must filter `import.meta.env.DEV || data.draft === false`
(see `src/pages/index.astro`, `articles/*`, `team.astro`, `events.astro`,
`Carousel.astro` for the pattern). A placeholder person, event, or carousel
slide leaking to production is worse than a placeholder article — don't add
a new placeholder entry to any of these four collections without
`draft: true`, and don't add a new page/query against them without the same
filter. If filtering drops the carousel to one slide or zero, that's the
correct, honest state — `Carousel.astro` already handles both; don't "fix"
it by making placeholders un-draftable again to keep the carousel looking
full.

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

Placeholder articles/events/team entries exist to verify templates and are
seeded under `draft: true` so they're excluded from production builds.
**Build complete ≠ launch.** Do not point the custom domain, submit
sitemaps to Search Console/Bing, or share the link publicly until there is
real content (real articles, real committee roster with recorded consent,
real events). A Pages preview URL existing is fine pre-launch; a live
custom domain is not.

The homepage carousel's slides are a content collection too (`src/content/slides/`),
same `draft` treatment as the other three — placeholder slides don't leak to
production. As of this writing that leaves exactly one real slide
(`vessel.jpg`) in a production build; the carousel is built to handle one
slide or zero gracefully, not just several, so don't treat a sparse carousel
as a bug.

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
animation), then — all inside `.scroll-vessel-area`, sharing the one scroll-linked
vessel background — the About prose, the three-divisions section, and the image
carousel, then the recruiting block outside that area, all now one continuous
`navy-deep` ground end to end. See spec §3 for the full description — don't rebuild an
articles-led homepage, that design was retired.

**Divisions section** (`src/data/divisions.ts`, rendered in `index.astro` between the
About content and the carousel): three fixed items (Events, Research, Marketing),
three-column grid at desktop width (`.divisions-grid`/`.division`), separated by thin
vertical hairlines rather than cards — dropped entirely, not rotated to horizontal, when
it stacks to one column below 900px. This is a small typed data file, not a content
collection — three permanent structural items don't need drafts/dates/an id per entry,
just an array of `{ name, tagline, description }`; add a fourth by adding a fourth
object, nothing about the layout assumes exactly three. Gold is used **only** on the
tagline in this section (verified: ~12.5:1 on plain navy-deep, ~8.3:1 in the worst case
of sitting directly over the densest part of the ship graphic) — name and description
stay plain `paper`, inherited, no gold added anywhere else here.

`/team` and `/events` are also `navy-deep` now — see "Light vs dark grounds" below
before touching either.

**Intro animation timing**: one knob, `--intro-duration-ms` (currently `2500`), declared
on `#intro-overlay` in `src/pages/index.astro`'s `<style>` block. The JS auto-dismiss
timer reads this same custom property via `getComputedStyle` rather than having its own
hardcoded number — change the CSS value only, both the animation length and the timer
follow it automatically.

**Scroll-linked vessel**: `brand/vessel-silhouette.svg` (canonical, editable, detailed —
hull, bow, bridge, funnel, individual containers, masts) / `public/vessel-silhouette.svg`
(served copy, kept only for reference — the site itself no longer loads this file at
runtime, see below). Sits behind the About + carousel region only, not the hero (that's
the animated mark's territory) and not the recruiting block (its own closing section) —
never more than one moving element in view at once.

The SVG's `viewBox` is `"0 -36 920 202"` — the negative min-y is real, not a typo (the
radar mast sits above the deck's y=0 origin). Preserve it exactly; changing it clips the
mast.

**Inlined, not `<img src>`.** It uses `fill="currentColor"` so gold can be set via CSS
the same way `Mark.astro` does — which only works for SVG embedded directly in the page,
not referenced by URL. `src/components/VesselSilhouette.astro` holds the inlined markup;
if `brand/vessel-silhouette.svg` is ever edited, that component needs regenerating to
match — the two are not auto-synced, and were verified byte-for-byte identical (every
`<rect>`/`<path>`/`<ellipse>` and every coordinate) when the component was created. Don't
hand-edit one without the other.

**Motion: one continuous `requestAnimationFrame` loop, no CSS animation at all** (see
`<script>` in `index.astro`, right after the intro-overlay script).

**Horizontal range is computed, not a fixed constant** — `range = (window.innerWidth +
vessel.offsetWidth) / 2`, recalculated on resize (not every frame). This is what makes
the crossing "full": the ship starts entirely off the left edge and ends entirely off the
right, however wide the viewport or the ship's own (responsive, `clamp()`-based) width
happen to be. If you want a *partial* crossing again, that's a deliberate different
design, not a tuning tweak — don't just clamp the computed range down; ask first.

**Progress is derived from the section's whole passage through the viewport, not a fixed
scroll distance**: `progress = (viewportHeight - rect.top) / (rect.height +
viewportHeight)`, clamped 0–1, where `rect` is `.scroll-vessel-area`'s live
`getBoundingClientRect()` read fresh every frame (not cached — it has to change
continuously as the page scrolls, unlike the range above). 0 is the section's top edge
just touching the viewport's bottom edge (motion starts the moment it first appears, not
once it's fully in frame); 1 is its bottom edge just clearing the viewport's top edge.
`TRAVEL_VIEWPORTS` (3) is declared but **not used by this formula** — kept for a possible
future pass, not deleted, per an explicit ask to keep it available; don't assume it's
wired up anywhere just because it's declared.

`DAMPING` (0.35) is the only motion-feel constant left: each frame, `current += (target -
current) * DAMPING`. `SETTLE_EPSILON_PX` (0.05) snaps `current` to `target` once the gap
is negligible, so the loop doesn't ease toward a fixed point forever. Writes are
`transform: translate3d(x, 0, 0)` only, un-rounded (subpixel positioning is what keeps it
smooth) — never anything that touches layout. `will-change: transform` is set in CSS on
`.scroll-vessel`. An `IntersectionObserver` on `.scroll-vessel-area` starts/stops the rAF
loop itself (not just its visual output) when the section leaves/enters the viewport.
Under `prefers-reduced-motion`, the vessel is set to a static mid-travel transform once
and the loop never starts at all.

**Why not `animation-timeline: scroll()`/`view()`** — which is what an earlier version of
this used, and looks like the obviously better choice (native, GPU-composited, no JS):
tried, and rejected on purpose. CSS scroll-driven animation binds progress directly to
raw scroll position, and a mouse wheel moves the page in discrete ~100px jumps — anything
bound straight to that moves in visible steps rather than gliding. The damping in the
loop above (easing `current` toward `target` over several frames rather than snapping
directly to it) is what produces the glide, and there's no way to express that kind of
easing in a scroll-driven CSS animation — it can only ever be direct scroll-to-progress
mapping. **Don't "optimise" this back to CSS scroll-driven animation** — that's a
regression, not a simplification, however native-and-JS-free it looks on paper. (The
hero's own separate parallax effect, `.hero-mark-wrap`, still legitimately uses
`animation-timeline: scroll(root)` as a small progressive enhancement — that one wasn't
touched and isn't affected by this.)

Opacity is `0.2`, contrast-verified (not assumed) against the worst case — paper body
text sitting directly over the densest part of the silhouette: ~11.7:1 for full-opacity
text, ~7.4:1 for the 0.75-opacity secondary tier, both clear of the 4.5:1 AA floor. This
was re-checked, not just carried over, when the artwork changed from a simple silhouette
to the current detailed one — the contrast math is a per-pixel colour computation
(gold-at-0.2-blended-into-navy-deep is the same colour regardless of how much of the page
it covers), so a busier drawing doesn't change the ratio, only how much text has a chance
to sit over it. See the code comment on `.scroll-vessel :global(svg)` in `index.astro`
for the numbers; re-verify both tiers again if the opacity changes.

`.scroll-vessel-area` needs `overflow: hidden` to guarantee no horizontal scrollbar from
the animation's travel range, at any viewport width; don't remove it.

## Layout width: `.wrap` vs `.wrap-wide`

Two container utilities in `global.css`, both `margin-inline: auto` + `padding-inline:
1.5rem`, differing only in `max-width`:
- **`.wrap`** — 72rem (1152px). The reading-measure container. Used on article pages and
  anywhere else text is meant to be read start to finish. **Never widen this one** — it's
  shared sitewide, including by the pages that must stay narrow (see "Light vs dark
  grounds" below).
- **`.wrap-wide`** — 75rem (1200px). The association-facing container: homepage (hero,
  About, carousel, recruiting all use it now), `/team`, `/events`. Exists specifically so
  widening those pages doesn't touch `.wrap` and therefore doesn't touch articles.

Within `.wrap-wide`, cap the *text*, not the container, wherever a reading measure still
matters — e.g. the homepage's `.about-pair p` at `62ch`, the hero's `.slogan` at `42rem`,
`EventItem`'s `.description` at `var(--measure)`. A wide container with unconstrained text
inside it is a readability regression, not a fix; a wide container with the text still
properly capped just gives the surrounding page (dividers, grids, whitespace) room to use
that width instead of floating as a narrow strip in the middle of a full-width dark page —
that was the actual bug this fixed, not the measure itself, which was already right.

The homepage's About section is a two-column editorial grid at desktop widths
(`.about-grid` / `.about-pair`, `grid-template-columns: 1fr 2fr` — heading left, its own
paragraph right, repeated once per heading/paragraph pair — not one heading column plus
one paragraph column for the whole section), stacking to a single column below 900px.
`/team`'s and `/events`' fixes were narrower: widen the container, drop `max-width`
constraints that were capping short non-reading elements (page headers, the team grid,
the event-section wrapper) for no real reason, and leave the actual per-item reading text
(`EventItem`'s `.description`) capped as it already was.

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
  scroll-linked vessel's `requestAnimationFrame` motion loop (see
  "Scroll-linked vessel" below — this one runs the whole effect itself now,
  it isn't a fallback for a CSS path anymore). Don't add a fourth without a
  real reason — CSS/native-HTML solves almost everything else on this site.

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

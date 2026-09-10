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
animation), sharing `.scroll-vessel-area` (the scroll-linked vessel background) with the
About prose right after it, then the divisions section, the recruitment timeline, the
recruiting block, and the contact section — each a plain sibling with its own explicit
`navy-deep` background rather than sharing the vessel wrapper's, so the page still reads
as one continuous dark surface end to end even though the ship itself only runs behind
the hero and About. See spec §3 for the full description — don't rebuild an
articles-led homepage, that design was retired.

**The image carousel is not currently rendered on the homepage** — removed deliberately,
not by accident. `Carousel.astro` and the `slides` content collection are both still in
the repo, untouched and fully working; they're just not imported/used from `index.astro`
any more. Reinstate by importing `Carousel` in `index.astro` and rendering `<Carousel />`
wherever it should sit again — no other changes needed, the component and its data
source were left exactly as they were. Worth having real photography ready before
bringing it back; see "Build vs. launch" below for why placeholder slides were never meant
to be the permanent state.

**Divisions.** `src/data/divisions.ts` — three fixed items (Events, Research, Marketing),
each `{ slug, name, tagline, description }` — is the single source of truth for both the
homepage cards and the `/divisions/[slug]` pages; neither hardcodes the copy. A small
typed data file, not a content collection — permanent structural items don't need
drafts/dates/an id-per-file, just an array; add a fourth division by adding a fourth
object with a `slug`, nothing about either the homepage layout or the dynamic route
assumes exactly three.

*Homepage* (`index.astro`, its own `<section class="divisions-section on-dark">`, a
sibling after `.scroll-vessel-area` closes, not nested inside it): **stacking cards, pure
CSS, zero JavaScript.** Cards sit in normal document flow; each is `position: sticky`
at its own `top` offset (`calc(var(--header-clearance) + var(--i) * 12px)`, `--i` set
inline per card in the markup, 0-indexed), so as the reader scrolls, each subsequent
card slides up and covers the one before it, leaving a ~12px sliver of it showing above.
`--header-clearance: 96px` leaves the first card's stuck position clear of the site
header (measured height ~76px) with a little margin — the header isn't actually
`position: sticky` itself today, but this keeps the offset correct if that ever changes,
per an explicit ask to account for it. `z-index: calc(var(--i) + 1)` makes the paint order
explicit (later cards on top) rather than leaning on the default DOM-order stacking
behaviour sibling `position: sticky` elements get with `z-index: auto` — correct either
way, but worth being explicit about.

Cards are **full width** — `width: 100%` inside `.wrap-wide`, not the ~520px-capped
block an earlier version used — so they read as page-width panels; per the site's usual
"cap the text, not the container" rule (see "Layout width" below), `.division-card
.description` still gets its own `max-width: 60ch` so the prose itself doesn't stretch
edge-to-edge just because the panel does. Spacing between cards' natural (unstuck)
positions is `--card-gap: 70vh`, a named custom property (not a bare number in the rule)
specifically because a first attempt at `80px` let the next card start covering the
previous one almost immediately at real browser heights — the reader never got a settled,
full read of a card before the next started sliding over it. `70vh` is viewport-relative
on purpose, so "enough room to read a card before it's covered" scales with the reader's
actual window rather than assuming a fixed height; verified at both 800px and 1200px
viewport heights that each card gets a genuinely static, fully-visible window before the
next begins overlapping it (see the measurement note two paragraphs down). All three
cards also share one `--card-min-height: 340px` rather than sizing to their own content —
measured natural (unconstrained) heights at the real 1152px card width are 285.7px /
312.9px / 285.7px for Events/Research/Marketing, so 340px clears the tallest (Research)
with a little room to spare without leaving obviously dead space on the shorter two.
Without this, the three cards' differing natural heights would make the 12px sliver
offsets look like a layout accident rather than a deliberate rhythm. Re-measure both
figures if the copy in `src/data/divisions.ts` changes meaningfully in length.

**The last card needs its own trailing space, and it can't just be that card's own
`margin-bottom`.** `.divisions-stack` renders `<div class="divisions-tail" aria-hidden
="true" />` after the three cards, styled with `height: var(--card-gap)` — a genuine,
empty block-level sibling, not a spacing value on the last card itself. Diagnosed by
measurement in two stages, not assumed at either: **(1)** with no trailing space at all,
a full scroll sweep showed the last card's `rect.top` never held constant even once — it
moved exactly 1:1 with scroll throughout, and its distance to the section's bottom edge
stayed a fixed 128px (the section's old `padding-bottom`) the whole time, meaning it was
permanently in plain, unstuck flow, hitting its `top` offset at the exact instant the
container ran out of room and releasing instantly, before ever holding. **(2)** The first
attempted fix — giving the last card `margin-bottom: var(--card-gap)` the same as the
other two — measurably didn't work either, for a different reason: that trailing margin
collapses straight through `.divisions-stack`'s own bottom edge (an ordinary block with
no padding or border of its own doesn't contain a child's trailing margin — standard CSS
margin collapsing, not a bug), so it never became real height inside the container the
sticky calculation runs against; the card still released almost immediately. A real
sibling with an explicit `height` doesn't have that problem. Verified after switching to
`.divisions-tail`: all three cards now hold a comparable, genuinely static `rect.top` —
Events ~2261px of scroll at 800px viewport height / ~3104px at 1200px, Research ~1391px /
~1954px, Marketing ~435px / ~805px (shorter than the other two, since it's still the last
card and there's nothing after *it* to be covered by — but no longer near-zero, which is
what mattered). Don't try `display: flow-root` (or any other block-formatting-context
trick) on `.divisions-stack` as an alternative to the spacer — it was tried, it does stop
the margin-collapse-through, but the last card's held window was still far shorter than
the other two's for a different, not-fully-diagnosed reason tied to how multiple sticky
siblings share one containing block's remaining scroll room; the real sibling spacer is
the version that was actually verified to work, so it's the one to keep.

This **replaced** an earlier JS-driven pinned sequence (a `requestAnimationFrame` loop,
damped progress maths shared with the vessel via `DAMPING` in `src/lib/motion.ts`,
`BAND`/`TRAVEL` constants, a `height: 300vh` section, a pip position-indicator, a
`focusin` handler to keep a faded block visible) — all removed outright, not disabled.
**Do not reintroduce a JS implementation of this section.** The case for CSS-only:
nothing here animates in the transition sense — elements simply stop where the browser
is told to stick them — so there's no `requestAnimationFrame` loop to pause/resume, no
`prefers-reduced-motion` special case to write (nothing to opt out of), no accessibility
work needed (every card is always in normal flow, always fully visible in the DOM, always
reachable by Tab — there was never a faded/invisible state to design around, unlike the
old sequence's opacity-based blocks), and it degrades to a plain stacked card list by
construction anywhere `position: sticky` isn't supported (an unsupported browser just
renders it as `position: static` — no separate fallback CSS needed). One caveat worth
knowing, not fixed: a covered card's "Visit division" link is still in the DOM and still
focusable, but visually obscured underneath the card stacked on top of it while covered —
adding JS to force a focused card back to the top would reintroduce exactly the kind of
script this change removed, so it wasn't added; browsers generally scroll a focused
element into view when it isn't, which for this pattern tends to resolve the overlap
naturally as the scroll position that follows also changes which card is on top.

Cards need a **solid** background — this is what makes the stacking illusion read at all;
a transparent card would let the one sliding up behind it show straight through instead
of being covered. 1px gold border at 0.5 opacity, 8px radius, a soft upward `box-shadow`
so the stacking edge itself reads as an edge. Content per card: a `01`/`02`/`03` number
(gold, small, letter-spaced), the division name (serif), a gold tagline, a
paper-at-0.78-opacity description (capped `60ch`, independent of the card's own width —
see "Layout width" below), a gold underlined "Visit division" link. Section heading is
paper at 0.7 opacity, sitting directly on the section's own `navy-deep` background (not
blended with any ship graphic — there's no ship behind this section, see "Scroll-linked
vessel" below).

**Each card's background is now a real photograph**, not a flat colour, per real photos
supplied for this — `src/assets/divisions/{events,research,marketing}.jpg`, referenced
from `src/data/divisions.ts` (each division carries a `photo: ImageMetadata` + a real,
non-decorative `photoAlt`) so image and copy stay paired in one place, not wired
separately in the template. Two layers sit on top of the photo, in this DOM/paint order:
`.division-veil` (`.division-photo`'s first child) — a flat `navy-deep` wash at 66%
opacity across the whole photo, needed because real photography at full brightness is far
too bright for this palette on its own — then `.division-gradient` (painted after it, so
on top) — a horizontal gradient, `navy-deep` at 82% opacity at the card's left edge fading
to fully transparent by 78% across its width. The gradient is what actually makes the
text legible without flattening the photo into muddy near-black everywhere: text sits
over near-solid navy on the left (where `.division-content`'s padding puts it), while the
right two-fifths of the card stays visibly photographic. `.division-card` itself still
carries `background: var(--color-navy-mid)` underneath all of this, as the fallback if
a photo fails to load or is slow — the photo/veil/gradient stack paints *over* that
fallback, it doesn't replace it, so a failed image still leaves an opaque navy card, never
a see-through one. `.division-card` also picked up `overflow: hidden` (to clip the photo
to its `border-radius`) — safe specifically because it's on the sticky element's own box,
not an ancestor of it; overflow on a sticky element itself doesn't touch its own
positioning, only overflow on something *containing* it does (see the vessel section
below for the bug that distinction avoided once already).

Photos are `1536×1024` JPEGs (3:2), served through Astro's `<Image>` (explicit
`width={1536} height={1024}`, `astro:assets` re-encodes to WebP automatically — 60KB /
84KB / 108KB for events/research/marketing respectively, ~252KB combined, a real but
modest addition to what was previously an almost entirely text page). `.division-photo
img` is `object-fit: cover; object-position: center`, so at the cards' actual rendered
box (1152×340 at this page's container width) it's width-constrained: the full photo
width shows, cropped to a centred horizontal band vertically. All three images load
`loading="lazy"` — including the first card, despite an initial instruction to make it
`eager` "if it's near the fold": it isn't. The divisions section only begins after the
full hero + About passage (~1870px down the page at common viewport sizes), nowhere near
the fold at typical viewport heights, so eager-loading it would just cost initial-load
bytes for an image nobody's scrolled to yet.

**Contrast is checked against the actual rendered photo, not the flat colours underneath
it** — computed by sampling the real image pixels (not guessed): for each photo, the
brightest pixel within the region text can actually appear over (the visible cropped
band, card-relative x 0–600px, covering both the tagline and the full wrapped
`.description`) was located programmatically, then the veil and gradient were composited
over it exactly as CSS does (`navy-deep` at 66% over the photo pixel, then `navy-deep` at
the gradient's opacity *at that specific x position* over that result), and contrast
computed against that worst-case composite. Results: Events — tagline (gold, full
opacity) ~8.33:1, description (paper @0.78) ~7.86:1. Research — tagline ~9.35:1,
description ~8.66:1. Marketing — tagline ~10.29:1, description ~9.36:1. All comfortably
clear the 4.5:1 AA floor with real margin; the veil/gradient opacities as specified didn't
need raising. Re-run this measurement (script pattern: crop the visible cover-cropped
band, find max relative-luminance pixel, composite the CSS layers over it in DOM order,
recompute contrast) if the photos are ever swapped for different ones — a brighter
replacement photo could genuinely need a higher veil opacity, and eyeballing a screenshot
isn't precise enough to catch that reliably.

*Division pages* (`src/pages/divisions/[slug].astro`, one dynamic route generated from
`divisions` via `getStaticPaths`, not three separate files): header (name + tagline),
description, then division-specific real content — Research pulls the 3 most recent
non-draft articles (a bespoke small teaser list, not `ArticleCard`, since that component's
colours are tuned for the paper ground articles use and reusing it here would need making
it ground-aware for a single call site), Events pulls upcoming events via `EventItem`
(already dark-ground-safe from the `/events` page work, reused directly), Marketing
renders `<Carousel />` directly — then a placeholder section (same visible treatment as
`Carousel.astro`'s `.placeholder-slide`) for detail content to be written later, then
`ApplyButton` + a link back to `/`. Empty states (draft-filtered to nothing) reuse the
same "check back soon" wording already established on `/articles` and `/events`, so a
production build with everything still drafted looks like an intentional early state, not
a broken page — verified directly against a real build, not assumed. Reached only from
the homepage blocks; **not** added to the nav (stays About → Team → Articles → Events).

**`ApplyButton.astro`**: the one place `https://forms.gle/Ng2gsTbMKWgNvbAM7` is written in
the codebase. Used on the homepage recruiting block and on every division page — if the
form URL ever changes, it changes in exactly one file. Layout-agnostic on purpose (no
margin of its own); callers add their own spacing around it.

**Contact & social.** `src/data/contact.ts` — same small-typed-data-file pattern as
`divisions.ts` — is the single source for both `CONTACT_EMAIL` (`as.bsgt@unibocconi.it`;
was `as.bsgt@studbocconi.it` until that was caught and fixed — wrong address, not a typo
in a domain) and `SOCIAL_LINKS` (Instagram + LinkedIn, each `{ name, icon, url }`). Every
place that needs either imports from here — never hardcode the email or a profile URL
again. The two URLs are the exact public-facing profile addresses; the versions
originally supplied carried `?stkn=` and `?viewAsMember=true`, session/admin-preview
artefacts that must never appear on a public page — stripped before they ever reached
this file.

*Homepage* — a dedicated `<section class="contact-section on-dark">`, the true last
section before the footer (after `.recruiting`): "Contact us" / "We are open to external
partnerships and collaborations.", then two columns — Email (the mailto link) and Follow
us (icon + visible label per platform, from `SOCIAL_LINKS`). Deliberately smaller and
quieter than `.recruiting` above it — no oversized display type, no button, heading sized
like the page's other in-flow section headings (`.divisions-heading`'s same
`text-2xl`/`0.7`-opacity treatment) specifically so it reads as a closing footnote rather
than a second call-to-action competing with Apply. Contrast verified: heading (paper
@0.7) ~8.83:1, intro (paper @0.75) ~10.05:1, gold labels and full-opacity paper links
higher still — all well past 4.5:1 AA.

*Footer* (`Footer.astro`, every page): the same two `SOCIAL_LINKS` as small icon-only
links next to the page nav, `target="_blank" rel="noopener noreferrer"`, each with its
own `aria-label` (its `name`) since there's no visible text here to supply an accessible
name the way the homepage section's icon+label pairing does. `CONTACT_EMAIL` sits right
beside them, `.footer-contact` grouping the two — a small, quiet `mailto:` link (paper
@0.75, underlined, gold on hover), deliberately not the full-strength treatment
`.email-link` gets on the homepage's own contact section; that fuller version is
untouched, this is just enough for the address to be reachable from every page, not a
second copy of the homepage block. Same `CONTACT_EMAIL` constant either way — never
hardcode the address a second time.

**`SocialIcon.astro`**: hand-drawn inline SVG (`rect`/`circle`/`line`/`path` primitives,
`currentColor` stroke) for `instagram` and `linkedin` — no icon library, no CDN, nothing
fetched at runtime, per the no-third-party-embeds constraint below. Always
`aria-hidden="true" focusable="false"` on the `<svg>` itself; it never carries its own
accessible name — that's the caller's job (visible text on the homepage, `aria-label` on
the enclosing link in the footer). Don't call it without arranging one or the other.

## Recruitment timeline

Homepage only, `<section class="timeline-section">` directly above `.recruiting`,
sharing its lead-in: "Join BSGT" over a three-milestone timeline (horizontal gold
hairline with three markers at desktop widths, stacking to a vertical rule down the left
side below ~700px). Dates and labels live in `src/data/timeline.ts`
(`RECRUITMENT_MILESTONES`), never in the template — running this again next year is
editing that file only.

**State is derived from the dates at build time, every build — never hardcoded.**
`index.astro`'s frontmatter compares each milestone's date against the build's own
`new Date()`, both normalised to UTC midnight (these are whole-day milestones, not
specific moments, so day-granularity comparison is deliberate — see
`toUTCMidnight()`), and assigns exactly one of three states per milestone: `past`
(marker filled solid gold, label dimmed to paper @0.6 — verified ~6.68:1, still clear of
4.5:1 AA), `current` (the first milestone that isn't past yet — filled, larger, with a
soft glow ring, label at normal weight), or `future` (marker outlined/hollow, label at
normal weight). Exactly one milestone is ever `current`; the loop that assigns it
(`currentAssigned`) stops handing it out after the first match, so if a build ever runs
exactly *on* a milestone date, that milestone becomes `current` rather than `past` (a
milestone's own day hasn't finished being "now" yet).

**The whole section is absent from the DOM outright after 30 September 2026** — not
hidden with CSS, not still-present-but-empty, genuinely not rendered — checked via
`showRecruitmentTimeline` (`todayUTC <= RECRUITMENT_CLOSES`) wrapping the `<section>` in
a `{condition && (...)}` block. This is time-limited content: it must not still be
advertising a closed recruitment round in November. Verified by isolated simulation, not
by moving the system clock — mocked "now" values before, on, and after the close date
all produced the correct `true`/`true`/`false` result before this shipped. **To run the
same timeline again for a future round, only `src/data/timeline.ts` needs editing** —
new `RECRUITMENT_MILESTONES` dates/labels and a new `RECRUITMENT_CLOSES` date; nothing
in `index.astro` needs to change.

**Organization JSON-LD** (`BaseLayout.astro`): `sameAs` (both `SOCIAL_LINKS` URLs) and a
`ContactPoint` (`CONTACT_EMAIL`) were added once real, confirmed profiles existed — both
were deliberately omitted before that, since publishing `sameAs` against unconfirmed or
placeholder profiles would be worse than omitting it. Sourced from the same
`src/data/contact.ts`, so the structured data can't drift from what the page itself
actually publishes.

**Fixed — the footer's light gap, in two separate stages.** Stage one:
`Footer.astro`'s `.site-footer` used to carry `margin-top: 4rem`. A margin sits *outside*
an element's own background, so it exposed whatever was behind it — and that was never
any specific page's ground, it was `body`'s own default `background: paper` from
`global.css`, since nothing paints behind `<main>` and `<footer>` except `body` itself.
On light (`paper`) pages the exposed strip happened to match its surroundings, so it read
as intentional spacing and no one noticed anything wrong; on every `navy-deep` page
(homepage, `/team`, `/events`) the same margin exposed that same `paper` strip regardless
— a jarring light band between two dark surfaces meant to read as one continuous ground.
Fixed by deleting the margin outright, not replacing it with something page-aware — every
page that renders `<Footer />` (`.article`, `.team-page`, `.events-page`,
`.division-page`, `.privacy`, the homepage's `.contact-section`) already ends in its own
`padding-block` reaching `4rem`, in *that page's own* correct background colour; the
footer's margin was redundant space stacked on top of that, in the one place sitewide
where spacing came from `body`'s background instead of the page's own.

Stage two, found afterwards: a **second, separate** cause produced the same visible
symptom specifically on short pages — `/articles` with every article still `draft: true`
being the one that surfaced it, since it's short enough in production to matter. With the
margin gone, the footer sits flush against whatever precedes it — correct — but on a page
whose *total* content (everything above the footer) is shorter than the viewport, there
was still nothing making the footer itself sit at the bottom of the viewport. The leftover
viewport space below the footer showed `body`'s own background once again, same
underlying cause as stage one (nothing paints behind the footer except `body`) via a
different route (page too short, not a stray margin). Fixed with the standard sticky-
footer pattern: `body` is `display: flex; flex-direction: column; min-height: 100dvh` in
`global.css`, and `<main>` gets `flex: 1` in `BaseLayout.astro` to absorb any leftover
height, pushing `<footer>` to the bottom of the viewport at minimum on a short page while
a normally long page scrolls exactly as before (a flex item's default `min-height: auto`
protects its content from being clipped by `flex-basis: 0`, so this doesn't risk cutting
off a tall page's content). Verified, not assumed: after the fix,
`document.documentElement.scrollHeight` was measured `>= window.innerHeight` on every
page shape at every width sampled (360/768/1280/1920px) — no page comes up short any
more, on light or dark ground alike. Screenshot the bottom of a genuinely short page
(currently `/articles`, since real articles will eventually make it long enough that this
stops being the easiest page to check on) if you ever touch this area again.

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
runtime, see below). Sits behind the hero **and** About — `.scroll-vessel-area` wraps
both of them now, so the ship's whole crossing spans their combined height and it's
gone entirely by the time the divisions section begins (verified by measurement: the
ship's clip layer reports zero viewport intersection at every sampled scroll position
once past that boundary). This reverses an earlier version where the vessel ran behind
About + the divisions section + the carousel instead, and the hero had its own separate,
untouched animated-mark territory with no ship at all — that separation is gone now: the
hero's own drifting mark (`.hero-mark-wrap`) and the ship both run at once behind the
hero, which is a deliberate instruction, not an oversight of the "one moving element at a
time" rule this page used to follow. The recruiting block still sits outside
`.scroll-vessel-area` entirely (its own closing section, no ship).

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

**Holding a constant vertical position while translating horizontally** is a second,
separate `position: sticky` use on this page, structurally nested inside
`.scroll-vessel-area`:

```
.scroll-vessel-area          plain block — no overflow, no position property at all
  .scroll-vessel-sticky      position: sticky; top: 50vh; height: 0
    .scroll-vessel-clip      overflow: hidden; width: 100%; transform: translateY(-50%)
      .scroll-vessel-position  margin-inline: auto; width: clamp(...) — horizontal centring only
        .scroll-vessel         JS writes transform: translate3d(x, 0, 0) here, every frame
```

An earlier version had `.scroll-vessel-clip` as an absolutely-positioned, `inset: 0`
layer directly inside `.scroll-vessel-area` — which meant the ship scrolled up and off
with the rest of the hero/About content instead of holding its vertical position, since
nothing was actually pinning it. `.scroll-vessel-sticky` fixes that: `height: 0` so it
never itself consumes layout space (it isn't part of the hero/About reading flow, just an
anchor point its one child hangs off of), `top: 50vh` so it sticks at the vertical middle
of the viewport for as long as `.scroll-vessel-area` (its containing block) has room left
to scroll through — `50vh` after an initial `33vh` sat too high, per explicit feedback.
Verified by measurement, not assumed: `.scroll-vessel-clip`'s `rect.top` holds within a
fraction of a pixel across the whole hero+About scroll range at both 800px and 1200px
viewport heights, only releasing right at the very end as `.scroll-vessel-area` runs out
of room, which is correct sticky behaviour, not a bug. `.scroll-vessel-clip`'s
`transform: translateY(-50%)` centres it vertically *on* that 50vh anchor point (shifting
the whole clipped box up by half its own rendered height) rather than pinning its top
edge there — the same visual centring the very first version's
`top: 33%; translate(-50%, -50%)` approach gave the ship, just expressed on the box that
now actually determines what's visible, and now anchored at 50vh instead of 33%.

**This changes which element the horizontal-clip rule applies to, and makes the
"never add `overflow` to `.scroll-vessel-area`" rule immediately load-bearing again, not
just future-proofing.** `.scroll-vessel-area` now nests a `position: sticky` element
inside it (`.scroll-vessel-sticky`, above) the same way it used to nest the divisions
sequence's sticky panel — so the exact same trap applies right now, not hypothetically:
`overflow: hidden` (or even just `overflow-x: hidden` alone, unset `overflow-y` included
— per the CSS Overflow spec, an element can't have one axis compute to `hidden` and the
other stay `visible`; if either axis is non-`visible` the browser forces the *other*
axis's computed value from `visible` to `auto`, which breaks sticky exactly the same way)
on `.scroll-vessel-area` would silently break `.scroll-vessel-sticky`'s stickiness, the
same real, shipped bug the divisions sequence hit before (see CLAUDE.md history / git log
for that one — caught only by scroll-position instrumentation, `getBoundingClientRect()`,
not by inspecting the animation code, since the JS was correct the whole time and only
the CSS pinning was broken). The horizontal clip is on `.scroll-vessel-clip` instead — a
**descendant** of the sticky element, not an ancestor of it, which is what makes clipping
there safe: overflow on a descendant only ever affects that descendant's own children, it
has no bearing on how its sticky ancestor gets positioned. Keep it that way. If you ever
touch this area, re-verify with rect instrumentation, not visual inspection — a broken
sticky element can look deceptively close to working before silently failing for the rest
of its scroll range.

## Layout width: `.wrap` vs `.wrap-wide`

Two container utilities in `global.css`, both `margin-inline: auto` + `padding-inline:
1.5rem`, differing only in `max-width`:
- **`.wrap`** — 72rem (1152px). The reading-measure container. Used on article pages and
  anywhere else text is meant to be read start to finish. **Never widen this one** — it's
  shared sitewide, including by the pages that must stay narrow (see "Light vs dark
  grounds" below).
- **`.wrap-wide`** — 75rem (1200px). The association-facing container: homepage (hero,
  About, divisions, the timeline, recruiting, contact all use it), `/team`, `/events`.
  Exists
  specifically so widening those pages doesn't touch `.wrap` and therefore doesn't touch
  articles.

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

## Social preview image

`public/og-image.jpg` (1200×630) is the default share-card image for **every** page —
`BaseLayout.astro`'s `ogImage` prop defaults to `/og-image.jpg`, so a page only needs to
pass its own `ogImage` if it wants a *different* image, not to opt into having one at all.
Before this, no page passed `ogImage`, so `og:image`/`twitter:image` never rendered
anywhere and `twitter:card` was stuck on `summary` (no image ever shows on `summary`,
regardless of whether one's set) — fixed by making the default non-empty and setting
`twitter:card` to `summary_large_image` unconditionally.

Lives in `public/`, not `src/assets/` — deliberately. `astro:assets`
(`import`-and-optimise, used for the division-card photos) hashes the output filename on
every build, which is exactly wrong for a URL crawlers and social platforms need to
resolve indefinitely, potentially long after whatever build produced a given hash. A
file in `public/` gets served at that exact path, unhashed, forever.

`og:image:width`/`height` are fixed at `1200`/`630` (the actual asset's size), not derived
from the image — fine while every page shares one image; if a page is ever given its own
differently-sized `ogImage` (e.g. a future per-article card, explicitly out of scope for
now), these need to become props too. `og:locale` is `en_GB`, not `en_US` — this site is
written in British English throughout, that was wrong before.

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
  it isn't a fallback for a CSS path anymore). The divisions section used to
  have a fourth — a `requestAnimationFrame` pinned-sequence loop — removed
  entirely and replaced with pure-CSS `position: sticky` stacking cards (see
  "Divisions" below); don't reintroduce a JS implementation there. Don't add
  a fourth script back without a real reason — CSS/native-HTML solves almost
  everything else on this site.

## Content model (see spec §4 for exact field types)

- **Article**: title, slug (stable, never change post-publish), summary,
  author, date, tags, heroImage?, draft (default true).
- **Event**: title, date, startTime?, location, type (lecture|workshop|
  social|other), description, registrationUrl?, image?, imageAlt?, draft
  (default true). Upcoming/past is derived from `date`, never a manual
  flag. `image`/`imageAlt` are a pair, not one dual-purpose field like
  Slide's `caption` — an event photo needs a real description of what's
  actually in it, which is rarely related to the event's own title or
  description text. See "Events page" below for the missing-photo
  placeholder.
- **Team member**: name, role, group (`board`|`departments`|`directors`),
  programme?, photo?, linkedin?, order, draft (default true). `group`
  sections `/team` into three tiers, rendered in that fixed order
  regardless of the collection's own file order — see "Team page" below.
  `order` is scoped *within* a group, not global: two members in
  different groups can share the same `order` value without conflict.
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

## Events page

**"Associations on Display" (24 September 2026) is the first real, non-draft event** —
`/events` had never shown anything but its empty state before this. Verified, not
assumed, that the page actually holds up with real content: the upcoming/past split
(both already existed in `events.astro`, driven by comparing each event's `date` against
`todayStart`, today's date with the time zeroed out) correctly keeps this event in
"Upcoming" through the whole of 24 September itself and moves it to "Past" starting 25
September — checked with an isolated date simulation (mocked `now` values before, on,
and the day after the event date), not by changing the system clock. With exactly one
upcoming event and zero past ones, the page reads as a deliberate single-event listing,
not a list template with something missing — no dangling dividers, no "Past" heading
rendering over an empty list (that section already only rendered when `past.length > 0`,
unchanged from before).

**`EventItem.astro` now handles a photo (or its absence) the same way
`TeamMemberCard.astro` handles a missing headshot** — solid `navy-mid` panel, gold
border, centred gold Newsreader text — but at `16:9`, not Team's `4:5`: event photography
(a venue, a stand, a crowd) reads more naturally wide than a portrait headshot does; the
shared part is the *placeholder system* (panel + border + centred gold label), not the
exact ratio. Capped at `max-width: 36rem`, not full-bleed to the card's own width — at
`wrap-wide`'s measure a full-width `16:9` photo would tower over the text below it. When
there's no photo, the placeholder's centred label is the event's own `type`
(capitalised) — the one short, meaningful thing an event has to offer in place of a
photo, the same role a person's initials play on `/team`. `image`/`imageAlt` are a pair
on the schema (see "Content model" above) — always supply a real, specific `imageAlt`
describing what's actually in the photo, not the event's own title or description
restated; for "Associations on Display" that's *"Association stands under blue gazebos
along a Bocconi campus walkway during Welcome Days, with students visiting them"* —
deliberately not naming BSGT, since BSGT itself isn't identifiable in that particular
photo.

**The source photo lives at `src/assets/events/associations-on-display.jpg`** (was
supplied as a 2.2MB PNG; converted to JPEG via `sharp` before import, ~236KB — still
large enough that Astro's own pipeline re-encodes it to WebP at build time, ~64KB in the
final output). Same rule as the division-card photos: real photography goes in
`src/assets/`, not `public/`, specifically so `astro:assets`/`<Image>` can optimise it —
explicit `width`/`height`, `loading="lazy"`.

**The homepage recruitment timeline's "24 September — Associations on display" milestone
deliberately does *not* link to this event.** Considered and rejected: the timeline's
whole visual system (marker + date + label, three identical-looking items) has no
interactive affordance anywhere in it today, and linking exactly one of the three
milestones would read as an inconsistency rather than a deliberate feature — two plain
items and one that's suddenly clickable, with no visual cue distinguishing which is
which before a reader hovers. The timeline's actual job, per its own "Join BSGT" heading,
is leading into the Apply button below it, not general site navigation — `/events` is
already one click away via the main nav regardless. If a future pass wants this link, it
should come with its own visual treatment (e.g. only the linked milestone gets an
underline or a visible affordance) rather than a bare, silent `<a>` around one date.

## Team page

`/team` currently renders the whole roster as **one flat grid, no section headings** —
not grouped by tier. The schema still has `group` (`board` | `departments` | `directors`)
and every entry still sets it; the field was deliberately kept rather than removed when
the three-heading layout was dropped, specifically so re-introducing tiered sections later
is a template change in `team.astro`, not a content-schema migration touching every
entry again. Don't delete `group` from the schema just because nothing currently reads it
for display.

**Order still carries real meaning with no headings to signal it.** `team.astro` sorts by
a `GROUP_RANK` lookup (`board` = 0, `departments` = 1, `directors` = 2) first, then by
each member's own `order` within that rank — `order` alone can't produce the right
sequence, since it's scoped *within* a group, not global, and two people in different
groups can share a value. The result reads top-to-bottom, left-to-right as seniority:
President → VPs → department heads → directors/leads, exactly the sequence the three
headings used to make explicit visually. Don't resort this to alphabetical or
collection-file order.

**Grid is a plain `repeat(4, 1fr)`, not tuned per any group any more.** With one flat
list of 11 people, four across doesn't divide evenly — 4/4/3 — and that's fine, left as
CSS grid's own default behaviour: the last row's three cards sit left-aligned, at their
normal width, with empty space to their right. Don't add `justify-content`/stretch rules
to fill or centre a short last row — that's compensating for something that isn't
actually a problem. Steps down to `repeat(2, 1fr)` at 900px and `1fr` at 560px, same
breakpoints as before.

**Photo placeholders** (`TeamMemberCard.astro`): no photographs exist yet for anyone on
the roster, and `photo` stays optional in the schema — nothing should force a photo to
exist before a member can be added. When absent, the card renders a `navy-mid` panel,
gold `1px` border (same treatment as the division cards' border, already verified ~3.7:1
against `navy-mid` — a non-text but functional boundary, not decoration), with the
person's own initials centred in gold Newsreader serif — deliberately not a generic
silhouette avatar, which reads as a broken image rather than an intentional placeholder.
Initials are first-word-initial + last-word-initial (middle names skipped, same as an
ordinary monogram) computed from `name` directly, not a separate field. The box is a
fixed `aspect-ratio: 4 / 5` in both states (photo and placeholder) — chosen as the ratio
real headshots will eventually use, specifically so a photo arriving later drops into the
existing box with zero reflow; don't change it without updating every already-published
member at the same time. Contrast verified: gold initials vs `navy-mid` is the same
~11.1:1 already established for the division cards' gold text on that background.

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

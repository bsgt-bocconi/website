# BSGT Website — Build Spec

**Project:** Public website for the Bocconi Shipping and Global Trade Student Association (BSGT)
**Domain:** `bocconishippingandglobaltrade.com` (registered, Cloudflare Registrar)
**Canonical form:** non-`www`. Redirect `www` → bare domain.
**Status:** v1 brief, for handover to Claude Code
**Last updated:** 8 September 2026

---

## 1. What this is

BSGT is a recognised student association at Università Bocconi focused on shipping,
maritime economics, and global trade. It is interdisciplinary by design, drawing students
from economics, management, finance, international relations, operations, law, and
sustainability.

The site has three jobs, in order:

1. **Publish** student-authored articles and analysis on maritime and trade topics.
2. **Establish credibility** with the companies and professionals BSGT approaches for
   guest lectures, workshops, and partnerships.
3. **Recruit** new members from the Bocconi student body.

Audience is roughly: Bocconi students (recruitment), industry professionals (credibility),
and general search traffic arriving at individual articles (reach).

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro | Static output. No client-side rendering for content — see note below on the small exception. |
| Content | Markdown files in-repo, via Astro content collections | No CMS. Content is edited by the maintainer using Claude Code. |
| Hosting | Cloudflare Pages | Auto-deploy from `main`. Preview URLs on branches. |
| Repo | GitHub, under a BSGT organisation | Not a personal account. |
| Analytics | Cloudflare Web Analytics | Cookieless, no consent banner required. |
| Fonts | Self-hosted, bundled locally | Must NOT load from Google Fonts CDN. See §7. |
| Forms | None hosted on this site | Recruiting CTA links out to an external Google Form. See §3, §8. |

"No client-side rendering for content" means what it says — content is not JS-rendered. It
does not forbid small, scoped interaction-only scripts that add no content of their own: the
homepage carousel's keyboard-arrow handling, its once-per-session intro-animation check, and
the scroll-linked vessel's motion loop are the only such scripts on the site (see §3). The
divisions section used to have a fourth (a pinned-sequence rAF loop) but that was removed
and replaced with pure CSS — see §3's "Divisions". Nothing else should use client-side JS.

**No database. No server. No authentication. No third-party embeds that set cookies.**
These are deliberate constraints, not omissions — they keep the security and compliance
surface near zero. Do not introduce any of them without an explicit decision to do so.

---

## 3. Sitemap

```
/                       Home / About — hero, about content, divisions, carousel, recruiting
/team                   The Team
/articles               Article index
/articles/[slug]        Individual article
/events                 Events — upcoming and past
/divisions/[slug]       One per division (events, research, marketing) — reached from the
                        homepage divisions blocks, not from the nav
/privacy                Privacy policy
```

Flat and shallow on purpose. Six routes plus article pages plus one route per division —
the last two are the only dynamic ones, both generated from data rather than hand-written
per page.

**URL structure is a one-time decision.** Changing `/articles/[slug]` later costs
accumulated search ranking. Lock it now.

`/about` no longer exists as a separate route — it redirects to `/` (`public/_redirects`,
a Cloudflare Pages redirect, 301). Nav is About, Team, Articles, Events; About points to `/`.

### Home / About

These are the same page now — About *is* the homepage, not a separate route. One `<h1>`
(the hero slogan).

**Hero.** Full-viewport, on `navy-deep`. Behind the content, an ambient SVG/CSS-only
animated treatment of the mark — slow drift/rotation, a subtle scroll parallax (progressive
enhancement via `animation-timeline: scroll()`, degrades to just the drift where
unsupported), gold catching light. No Three.js, no WebGL. Fully disabled under
`prefers-reduced-motion`. Content fades in on load, in order: the slogan (dominant, the
page's `<h1>`), the full association name, then the founding line and mission statement
(smaller, quieter tier).

A brief once-per-session intro animation (a short mark animation, ~2.5s — tunable via the
single `--intro-duration-ms` custom property on `#intro-overlay`, which both the CSS
animation and the JS auto-dismiss timer read, so there's exactly one place to change it —
gated on `sessionStorage` so it doesn't replay on every page within a session) plays over
the hero before resolving. It must never delay or block the hero content underneath from
rendering — the hero renders and starts its own fade-in immediately regardless of the
overlay; the overlay is purely an additive layer on top of it. Skippable on click, scroll,
or keypress. Entirely skipped (not just shortened) under `prefers-reduced-motion`.

**Scroll-linked vessel.** A detailed gold vessel silhouette (`vessel-silhouette.svg`, not
`vessel.jpg` — hull, bow, bridge, funnel, individual containers, masts; inlined in
`VesselSilhouette.astro` so `currentColor` can set the gold via CSS, the same reason the
mark is inlined) sits behind the hero **and** the About region — both share one wrapping
container, so the ship's travel spans their combined height and stops entirely once the
divisions section begins (verified by measurement, not just by trusting the DOM
structure). It drifts horizontally as the page scrolls, a full crossing (starts entirely
off the left edge, ends entirely off the right — the travel range is computed from the
viewport's and the ship's own rendered width, not a fixed guess), reversing on scroll-up
for free because motion is driven by actual scroll position every frame, not a one-shot
trigger. Progress starts the moment the wrapping container first enters the viewport, not
once it's fully in frame, and spans its entire passage through — see CLAUDE.md's
"Scroll-linked vessel" section for the exact formula. Driven by a single
`requestAnimationFrame` loop with a damping/easing step (`current` eases toward a
scroll-derived `target`) so it glides rather than jumping in the ~100px steps a mouse
wheel actually scrolls in — deliberately **not** CSS `animation-timeline:
scroll()`/`view()`, which was tried first and rejected because it can only bind straight
to raw scroll position with no way to express that easing (see CLAUDE.md for the full
reasoning — don't re-introduce the CSS approach thinking it's a simplification). Paused
via `IntersectionObserver` when off-screen; static at mid-travel, loop never started,
under `prefers-reduced-motion`. Its opacity must be verified, not assumed, against AA
contrast for whatever body copy it can sit behind — see the code comment in `index.astro`
for the actual computed numbers.

The ship also **holds a constant vertical position** — the vertical middle of the
viewport — for the whole hero+About passage, moving only horizontally, rather than
scrolling up and off with the rest of the content. This is a second `position: sticky`
use, nested inside the wrapping container: a zero-height sticky element anchored at
`top: 50vh` (so it never itself consumes layout space, it's purely an anchor point —
raised from an initial `33vh`, which sat too high, per explicit feedback), holding its
one child — the actual clipped, horizontally-animated ship — at that fixed viewport
height for as long as the wrapping container has room left to scroll through. Verified by
measurement at two different viewport heights (800px and 1200px): the ship's clipped box
holds its `rect.top` within a fraction of a pixel across the whole scroll range, only
releasing right at the very end as the container runs out of room, which is expected
sticky behaviour, not a bug.

The horizontal travel still needs clipping so it can never produce a page-level
scrollbar (checked at narrow mobile widths specifically), and that clip is a
**descendant** of this new sticky element, not an ancestor of it and never on the shared
wrapping container itself — that container must never carry an `overflow` property on
any axis, full stop, because `overflow` on any axis on an ancestor of a
`position: sticky` element silently breaks that element's stickiness (`overflow-x` alone
doesn't dodge it either — the CSS Overflow spec forces the other, unset axis from
`visible` to `auto`, which breaks it just the same). This was a real, shipped bug from an
earlier version where the divisions section — then a pinned sticky sequence — was nested
inside this same wrapper; found by scroll-position instrumentation, not visual
inspection. Divisions isn't nested in here at all any more (see below), but the wrapping
container now nests a *different* sticky element (the ship's own vertical-position
anchor, above) — so the rule is immediately relevant again, not just future-proofing.
Clipping on a descendant of the sticky element, rather than an ancestor, is what makes it
safe: a descendant's `overflow` only ever affects its own children, never how its sticky
ancestor gets positioned. See CLAUDE.md's "Scroll-linked vessel" section for the full
story and the exact element structure.

**About content**, below the hero, a two-column editorial grid at desktop widths —
statement heading in the serif on the left, its own paragraph (capped near 62 characters)
on the right, repeated per heading/paragraph pair, stacking to one column below ~900px —
rather than one long column of prose or cards. Container is the wide, page-consistent
`.wrap-wide` (§5), not the narrow reading-measure `.wrap`; the text within it still keeps
its own measure. See the copy in the repo (`src/pages/index.astro`) for the exact
wording, which should be treated as fixed unless BSGT itself asks for a copy change;
don't silently rewrite it.

**Divisions**, its own section after the vessel-wrapped hero/About region ends and before
the carousel: "One vision, supported by three divisions" above **stacking cards, pure
CSS, no JavaScript** (Events, Research, Marketing). Cards sit in normal document flow;
each is `position: sticky` at its own increasing `top` offset (a base clearance that
accounts for the site header's height, plus 12px per card), so as the reader scrolls,
each subsequent card slides up and covers the one before it, leaving a ~12px sliver of it
showing above — not a pinned/scroll-jacked sequence, and not a static three-column grid
either. Per division, in order: number (01/02/03, gold, small, letter-spaced), name
(serif, large), a one-line tagline (gold), a description (paper at ~0.78 opacity, its own
`60ch` measure cap independent of the card's width — see below), and a "Visit division"
link to that division's page (gold, underlined). Each card is a **solid** `navy-mid`
panel — required for the stacking illusion, since a transparent card would let the one
sliding up behind it show straight through instead of being covered — with a 1px gold
border at 0.5 opacity (held to the 3:1 WCAG non-text guideline since it's a functional
divider between cards, not decoration), 8px radius, generous padding, and a soft upward
shadow so the stacking edge itself reads.

Cards are **full width**, spanning the whole `.wrap-wide` container as page-width panels
— not the ~520px-capped block an earlier version used. The description keeps its own
measure cap regardless (`60ch`), per the site's usual "cap the text, not the container"
rule (§5) — a page-width panel isn't the same thing as page-width body text. Spacing
between cards is a named `70vh` (viewport-relative, not a fixed pixel count), reached
after an initial `80px` proved far too tight at real browser heights — the next card
started covering the previous one almost immediately, before the reader had a chance to
read it in full. Verified at both 800px and 1200px viewport heights that each card gets
a genuinely static, fully-visible window before the next begins overlapping it. All
three cards also share one fixed `min-height`, set to clear the tallest division's
measured natural content height with a little room to spare — without it, the three
cards' differing natural heights would make the 12px sliver offsets look accidental
rather than a deliberate rhythm.

The last card needs its own dedicated trailing space after it, and — measured, not
assumed — that space has to be a real empty sibling element, not a margin on the card
itself. Without any trailing space, the last card never held its sticky position at all;
giving it its own `margin-bottom` equal to the same gap looked like the obvious fix but
measurably wasn't one, because a block with no padding or border of its own doesn't
contain its last child's trailing margin (ordinary CSS margin collapsing) — the margin
never became real height inside the container the sticky calculation runs against, so the
card still released almost immediately. A plain, empty, `aria-hidden` block after all
three cards, given an explicit `height` equal to the gap, is what actually works —
verified afterward that all three cards hold a comparable, genuinely static position, not
just the first two.

This **replaced** an earlier pinned, scroll-linked sequence — a `requestAnimationFrame`
loop, damped progress maths shared with the ship, a `height: 300vh` section, opacity/
`translateY` per-block maths, a pip position indicator, a `focusin` handler to keep a
faded block visible — all removed outright, not disabled, per an explicit instruction not
to reintroduce a JS implementation of this section. The case for CSS-only: nothing here
animates in the transition sense, so there's no `requestAnimationFrame` loop to pause and
resume and no `prefers-reduced-motion` special case to write — elements simply stop where
they're told to stick, with nothing to opt out of. No accessibility work was needed
either: every card stays in normal document flow, fully visible in the DOM, and always
reachable by Tab — unlike the old sequence, there was never an invisible or faded-out
state to design a workaround for. And it degrades to a plain stacked card list by
construction anywhere `position: sticky` isn't supported, since an unsupported browser
just renders it as `position: static` — no separate fallback CSS required. One nuance
worth naming honestly rather than glossing over: a covered card's "Visit division" link
remains focusable even while visually obscured under the card stacked on top of it;
fixing that with JS would reintroduce exactly the kind of script this change removed, so
it wasn't added.

Data lives in `src/data/divisions.ts` — a small typed array, not a content collection;
these are permanent structural items, not posts, and the same file drives both this card
stack and the division pages below, so the copy is never duplicated. See the copy in
the repo for the exact wording, same rule as the About content above.

**Division pages** (`/divisions/[slug]`, one dynamic route generated from
`divisions.ts`, not three hand-written files): the division's name and tagline as a
header, its description as an opening paragraph, then real content specific to that
division — Research shows the most recent non-draft articles with a link to the full
index, Events shows upcoming non-draft events with a link to the full events page,
Marketing embeds the homepage's own carousel — then a clearly-marked placeholder section
(matching the site's existing placeholder treatment) for detail to be written later, an
Apply button to the same external form as the homepage recruiting block, and a link back
to `/`. If a division's real content is empty (e.g. everything is still `draft: true`),
that must read as an intentional early state — reusing the same empty-state wording
already established on `/articles` and `/events` — not a broken page. `navy-deep`
ground, same as the homepage; reached only from the homepage blocks, not added to the
nav.

**Image carousel.** A CSS scroll-snap carousel (no library), swipeable and keyboard-arrow
navigable, that must not trap focus. Slides are a content collection (§4) with the same
`draft` gate as articles/events/team — one real slide exists (`brand/vessel.jpg`); the rest
are placeholder slides, clearly marked, `draft: true` until real photography is supplied.
Whatever that leaves in production — one slide, several, or none — is the honest state; the
carousel handles it gracefully rather than padding itself out with placeholders.

**Recruiting block**, at the end of the page: a quiet, large statement ("Think beyond the
vessel.") set back against the navy — deliberately lower-contrast than the foreground, but
still sized as WCAG large text so it clears the AA large-text 3:1 floor rather than actually
failing contrast — with one prominent "Apply" button linking out to the membership form
(external, `rel="noopener"`, opens in a new tab). The form itself handles which
division/track the applicant wants; the site does not build separate buttons per division.

### Team

Committee members with name, role, and degree programme. Photos optional — see §7 for the
consent requirement before publishing any. `navy-deep` ground — see "Light vs dark grounds"
below.

### Articles

Reverse-chronological index. Filterable by tag. Individual article pages are the most
important template on the site: they are what search traffic lands on and what a prospective
industry partner is most likely to read. Prioritise reading comfort over everything else.
`paper` ground — deliberately, always, see "Light vs dark grounds" below.

### Events

Two groups on one page: upcoming first, then past. Past events are not clutter — they are the
evidence of activity that makes the association look real to an outside reader. Do not hide
them. `navy-deep` ground — see "Light vs dark grounds" below.

---

## 4. Content model

Define these as Astro content collections with typed schemas so bad frontmatter fails the
build rather than the page.

**Article**
```yaml
title: string
slug: string              # stable, never change after publish
summary: string           # 1–2 sentences, also used as meta description
author: string | string[]
date: date
tags: string[]
heroImage: image?
draft: boolean            # default true
```

**Event**
```yaml
title: string
date: date
startTime: string?
location: string
type: enum                # lecture | workshop | social | other
description: string
registrationUrl: url?
draft: boolean            # default true
```
Upcoming versus past is derived from `date`. Never a manual flag.

**Team member**
```yaml
name: string
role: string
programme: string?
photo: image?
linkedin: url?
order: number
draft: boolean            # default true
```

**Slide** (homepage image carousel, §3)
```yaml
caption: string           # alt text if `image` is set; the visible message on a placeholder slide if not
image: image?
order: number
draft: boolean            # default true
```

All four collections carry `draft`, same treatment: placeholder entries are seeded
`draft: true` and excluded from production builds by default. A placeholder person, event,
or carousel slide leaking to production is worse than a placeholder article — don't skip
this on Event, Team, or Slide just because it's more work. If filtering placeholder slides
down to one real photo (or zero) is the honest state of the carousel in production, that's
correct — the carousel must handle a single slide or no slides gracefully rather than
padding itself out with placeholders to look fuller than it is.

---

## 5. Design direction

BSGT's identity already exists from the Instagram work and the site must match it, not
invent a second one.

### Brand assets

Supplied in `/brand`:

- `bsgt-mark.svg` — the mast mark as vector. Uses `currentColor`, so it takes its colour
  from CSS rather than carrying a baked-in fill. Set it to `gold` on navy grounds.
- `favicon.svg` — a deliberately heavier-weight redraw of the same mark. The full-size
  mark's hairlines vanish below about 48px, so the favicon is its own drawing. Do not
  substitute one for the other.
- `vessel.jpg` — the first real photograph supplied for the site, used as the first slide
  of the homepage carousel. More photography will follow; until it does, the remaining
  carousel slides are clearly-marked placeholders (see §3).
- `vessel-silhouette.svg` — a detailed container-vessel silhouette in gold (hull, bow,
  bridge, funnel, individual containers, masts), currentColor-based. Used as the
  scroll-linked background behind the About/carousel region (see §3). Inlined into
  `src/components/VesselSilhouette.astro` rather than referenced by URL, so currentColor
  works — that inlined copy is the one actually served; the copy under `public/` is kept
  only for reference and isn't loaded by the site. If this file is edited, the inlined
  component needs regenerating to match; the two aren't auto-synced. viewBox is
  `"0 -36 920 202"` — the negative min-y is intentional (the radar mast sits above the
  deck's y=0 origin); preserve it exactly.

**The "BSGT" wordmark is live HTML text, not an image.** Set it in the heading serif
alongside the mark. This keeps it sharp at all sizes, selectable, readable by screen
readers, and indexable. There is no wordmark asset and none should be created.

An Open Graph share image (1200×630, mark and full association name on `navy-deep`) still
needs producing.

### Naming convention

The association's full name appears in two different forms depending on context:

| Context | Form |
|---|---|
| Display text a person reads on the page (hero, footer, prose) | "Bocconi Shipping **&** Global Trade Student Association" |
| Machine-readable text: `<title>`, meta description, Organization JSON-LD, Open Graph tags | "Bocconi Shipping **and** Global Trade Student Association" |

Apply this consistently sitewide. It doesn't apply to the "BSGT" abbreviation itself, which
is used freely in both contexts.

### Colour

Values sampled directly from the logo file — these are the real brand colours, not
approximations.

| Token | Hex | Use |
|---|---|---|
| `navy-deep` | `#070A1D` | Primary ground, header, footer |
| `navy-mid` | `#111834` | Secondary surfaces, hover states, card grounds |
| `gold` | `#F5C877` | Accent. Rules, the mark, active states — **not** button fills everywhere |
| `paper` | `#F2F4F6` | Article body background. Cool off-white, not cream |
| `ink` | `#101820` | Body text on paper |
| `slate` | `#5A6B7A` | Metadata, captions, secondary text |

`navy-deep` is nearly black, and that is correct — it is what makes the gold read as
luminous rather than merely yellow. Do not lighten it toward a conventional navy.

Note that `#F5C877` is a light gold. It has strong contrast on `navy-deep` and **fails
badly on `paper`** — never use it for text on light grounds. Gold is for dark surfaces only.

Gold is the association's signature and loses its force if used everywhere. Spend it on the
mark, on rules, and on one element per page.

### Light vs dark grounds

**Dark (`navy-deep`) is the association's ground. Light (`paper`) is where you read.** Home,
Team, and Events are dark, end to end, one continuous ground including headers/sections that
used to be `paper`. Articles — the index and every individual article page — stay on `paper`
with `ink` text, permanently, on purpose. This is not an inconsistency to converge later in
either direction: long-form reading on a dark background is measurably harder, and articles
are the one template whose entire job is being read start to finish (§1, §3). Everything else
is association-facing (identity, people, events, recruiting) and can carry the fuller, more
branded dark treatment gold needs to read as luminous rather than just "a website with a dark
mode."

On any dark-ground page: body text is `paper`, not `slate` — `slate`-on-`navy-deep` is only
about 3.6:1, under the 4.5:1 AA floor at body size. Secondary/metadata text is `paper` at
reduced opacity instead. Links are `paper` with an underline (not `navy-deep`, invisible
against its own background) and `gold` on hover.

### Typography

Two families, clearly distinct, both open-source and self-hosted:

- **Newsreader** — headlines and article body. An editorial serif; the association's core
  output is written analysis, and the type should say so.
- **IBM Plex Sans** — navigation, metadata, labels, event details. Its slightly technical,
  industrial character suits a shipping subject without being a costume.

Set a proper type scale. Article body around 18–19px with generous line-height, measure
capped near 68 characters. Sentence case throughout.

**Avoid:** all-caps tracked-out labels above headings; accenting one word of a headline in
gold; middle-dot meta strings; arrows appended to link text; identical rounded cards for
every content type. These are template tells and will make a genuine association look
generated.

### Layout

Left-aligned, single strong column for reading content. Asymmetric rather than centred —
centred everything is the association-website default. Structural devices (rules, dividers)
should encode real information: a gold hairline separating article metadata from body earns
its place; decorative dividers do not.

Two container widths, not one: `.wrap` (1152px) is the reading-measure container — article
pages, and anything else meant to be read start to finish — and must not widen. `.wrap-wide`
(1200px) is the association-facing container — the homepage, `/team`, `/events` — for pages
that are chrome (identity, listings, recruiting) rather than long-form reading, where the
narrower container read as an unfinished, floating strip in the middle of a full-width dark
page. Widening the *container* doesn't mean leaving *text* unconstrained inside it — cap the
measure on the text itself (a paragraph, a heading, a description) wherever reading comfort
still matters, the same as on `.wrap` pages.

Motion: one deliberate moment at most — **except the homepage**, which carries two scoped,
intentional exceptions: the hero (ambient mark animation, intro sequence, staggered content
reveal) and the scroll-linked vessel behind the About/carousel region below it — deliberately
never both moving in the same view at once (see §3). Everywhere else on the site, no
fade-and-slide on every section.

### Quality floor

Responsive to mobile, visible keyboard focus states, `prefers-reduced-motion` respected,
AA contrast throughout. Navy-on-gold and gold-on-navy both need checking — gold at `#C9A063`
does not pass on light backgrounds at body sizes.

---

## 6. SEO requirements

Build these in from the start, not afterwards.

- `@astrojs/sitemap` generating `sitemap.xml`; `robots.txt` allowing all.
- Unique `<title>` and meta description per page. Article descriptions come from `summary`.
- Canonical URL on every page.
- JSON-LD structured data: `Organization` sitewide, `Article` on article pages,
  `Event` on event entries.
- Open Graph and Twitter card tags — links get shared to Instagram and LinkedIn.
- Semantic HTML: one `<h1>` per page, real heading hierarchy, `<article>`, `<time datetime>`.
- Images: explicit width and height, lazy loading below the fold, Astro's image optimisation.
- Internal linking between related articles.

Post-launch, outside the build: verify in Google Search Console and Bing Webmaster Tools,
submit the sitemap, request indexing on the homepage and key pages. Pursue a listing in
Bocconi's official association directory — an inbound link from `unibocconi.it` is the
single most valuable one available.

---

## 7. Privacy and compliance

Italian association, EU audience. The constraints in §2 exist largely to keep this section
short.

**Required in the build:**

- **Self-host all fonts.** Loading from Google's CDN transmits visitor IP addresses to the
  US and has drawn a court fine in Germany. Bundle the font files in the repo.
- **No third-party embeds** that set cookies before consent. No Instagram or YouTube
  embeds — link out, or use a click-to-load placeholder. This will come up given BSGT's
  Instagram presence.
- **Cloudflare Web Analytics only.** No Google Analytics, no tag manager, no pixels.
- **Privacy policy page** disclosing the analytics, naming the data controller, and giving
  a contact address.

**Required outside the build, before launch:**

- Confirm with CASA / Bocconi's data protection office whether the controller for the site
  is BSGT or the university, and whether Bocconi has visual identity or domain rules for
  recognised associations.
- **Get written consent from every committee member** before publishing their name, role,
  or photograph. This is personal data and consent must be recorded and revocable — build
  the team page so removing someone is a one-file change.

---

## 8. Explicit non-goals for v1

Do not build these. Each can be added later if there is a real reason.

- Member login or any authentication
- Contact, membership, or newsletter signup forms — the recruiting CTA links to the
  existing membership process or an external form instead, keeping personal data out of
  this infrastructure entirely
- A CMS admin interface
- Comments
- Multilingual routing (revisit if an Italian version is genuinely wanted)
- Live freight-index or market-data widgets — appealing for the subject matter, but an API
  dependency and a maintenance burden on a site whose main job is publishing

---

## 9. Placeholder content policy

Real articles and the committee roster are not yet available. Build the full structure now
and populate it later.

**Build with placeholders:**

- Seed 3 example articles and 4–6 example team entries so every template, index, filter and
  empty state can be verified. Mark them unmistakably — author "Placeholder", body text that
  visibly is not real copy. Nothing that could be mistaken for genuine content if it
  survives to production by accident.
- Put every placeholder article behind `draft: true` so it is excluded from the production
  build by default. The pages work in development; nothing fake can leak live.
- Design the empty states properly — what `/articles` looks like with nothing published,
  what `/events` looks like with no upcoming event. These are real states the site will pass
  through, not edge cases.

**Build ≠ launch.** These are separate events:

| | Build complete | Launch |
|---|---|---|
| Site exists on a Pages preview URL | ✓ | ✓ |
| Custom domain live | — | ✓ |
| Submitted to Search Console / Bing | — | ✓ |
| Link shared publicly | — | ✓ |
| Requires real content | no | **yes** |

Do not point the domain, submit the sitemap, or share the link until there are real
articles and a real committee. Google's first crawl shapes its impression of the site, and
an industry contact clicking through to placeholder names is worse than no site at all.

---

## 10. Open items — to resolve before or during the build

Done:

- [x] Domain registered — `bocconishippingandglobaltrade.com`, non-`www` canonical
- [x] GitHub organisation created, base permission set to Read
- [x] Logo vectorised — mark and favicon in `/brand`

Before launch (not before build):

- [ ] Three or four real articles written
- [ ] Committee roster confirmed, with written photo/name consent from each member
- [ ] CASA checked on branding rules and the data controller question
- [ ] BSGT contact email address, for the privacy policy
- [ ] Open Graph share image produced
- [ ] Domain auto-renew, registrar lock and WHOIS privacy confirmed on
- [ ] Second org owner added, so access does not depend on one person
- [ ] Handover README written

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
homepage carousel's keyboard-arrow handling and its once-per-session intro-animation check
are the only two such scripts on the site (see §3). Nothing else should use client-side JS.

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
mark is inlined) sits behind the About + carousel region — not the hero, which keeps the
animated mark as its one moving element — and drifts horizontally as the page scrolls, a
full crossing (starts entirely off the left edge, ends entirely off the right — the
travel range is computed from the viewport's and the ship's own rendered width, not a
fixed guess), reversing on scroll-up for free because motion is driven by actual scroll
position every frame, not a one-shot trigger. Progress starts the moment the section
first enters the viewport, not once it's fully in frame, and spans its entire passage
through — see CLAUDE.md's "Scroll-linked vessel" section for the exact formula. Driven by
a single `requestAnimationFrame` loop with a damping/easing step (`current` eases toward
a scroll-derived `target`) so it glides rather than jumping in the ~100px steps a mouse
wheel actually scrolls in — deliberately **not** CSS `animation-timeline:
scroll()`/`view()`, which was tried first and rejected because it can only bind straight
to raw scroll position with no way to express that easing (see CLAUDE.md for the full
reasoning — don't re-introduce the CSS approach thinking it's a simplification). Paused
via `IntersectionObserver` when off-screen; static at mid-travel, loop never started,
under `prefers-reduced-motion`. Its opacity must be verified, not assumed, against AA
contrast for whatever body copy it can sit behind — see the code comment in `index.astro`
for the actual computed numbers. The wrapping container needs `overflow: hidden` so the
animation's horizontal travel can never produce a page-level scrollbar, checked at narrow
mobile widths specifically.

**About content**, below the hero, a two-column editorial grid at desktop widths —
statement heading in the serif on the left, its own paragraph (capped near 62 characters)
on the right, repeated per heading/paragraph pair, stacking to one column below ~900px —
rather than one long column of prose or cards. Container is the wide, page-consistent
`.wrap-wide` (§5), not the narrow reading-measure `.wrap`; the text within it still keeps
its own measure. See the copy in the repo (`src/pages/index.astro`) for the exact
wording, which should be treated as fixed unless BSGT itself asks for a copy change;
don't silently rewrite it.

**Divisions**, between the About content and the carousel: "One vision, supported by
three divisions" above a **pinned, scroll-linked sequence** (Events, Research,
Marketing) — the section pins in place for ~3 viewport heights while scrolling and each
division's outlined block takes over the sticky panel in turn, reversing smoothly on
scroll up. Not a static three-column grid. Per division, in order: number (01/02/03,
gold, small, letter-spaced), name (serif, large), a one-line tagline (gold), a
description (paper at ~0.78 opacity), and a "Visit division" link to that division's
page (gold, underlined). The block itself is an outlined panel — 1px gold border at
0.42 opacity, 6px radius, generous padding, ~520px max-width, vertically centred in the
sticky viewport. Three thin horizontal rules beneath the blocks act as a position
indicator, each rising from 0.2 to 0.9 opacity as its block becomes active.

Progress through the section is scroll-derived and eased with the same damped-follow
formula as the ship (`current += (target - current) * DAMPING`, `DAMPING` imported from
`src/lib/motion.ts` so the two independent animation loops on this page can't drift
apart). Per block `i` of `n`: `d = progress - (i + 0.5) / n`, `opacity =
smoothstep(1 - min(1, |d| / BAND))`, `translateY = d * -TRAVEL / BAND * 0.5`, with
`BAND = 0.18` and `TRAVEL = 110px` as named constants. Only `transform` and `opacity`
are animated (plus `pointer-events: none` below 0.5 opacity, so a faded block's link
isn't mouse-clickable, and `z-index` to keep the absolutely-stacked blocks painting in
the right order). Only one block is meaningfully visible at a time.

**Fallbacks are required, not a nice-to-have, and all three collapse to the same
state**: under `prefers-reduced-motion`, on a viewport under ~600px tall ("pinning on a
short screen traps the reader"), or with JavaScript unavailable, the section renders as
normal document flow — no pinning, no `height: 300vh`, no rAF loop — with all three
blocks stacked vertically, stationary, and fully visible in document order. The
stylesheet never sets a division block's default opacity below 1; the enhancement
(pinning + animation) is added by JS as an opt-in class only when none of those three
conditions apply, so there is one fallback path, not three ad hoc ones. All three
blocks stay in the DOM and in the accessibility tree at all times regardless of visual
opacity — a screen reader or keyboard (Tab) user can always reach all three "Visit
division" links, and a block that receives keyboard focus is forced fully visible and
frontmost for as long as it holds focus, so focus is never trapped on a visually-hidden
block. An `IntersectionObserver` pauses the rAF loop while the section is off-screen,
mirroring the ship's own pause behaviour; it's a second, independent rAF loop on this
page (the ship's is the first), deliberately not merged into one shared loop — see the
comment in `src/pages/index.astro` for why.

Data lives in `src/data/divisions.ts` — a small typed array, not a content collection;
these are permanent structural items, not posts, and the same file drives both this
sequence and the division pages below, so the copy is never duplicated. See the copy in
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

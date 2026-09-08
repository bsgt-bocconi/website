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
| Framework | Astro | Static output. No client-side rendering for content. |
| Content | Markdown files in-repo, via Astro content collections | No CMS. Content is edited by the maintainer using Claude Code. |
| Hosting | Cloudflare Pages | Auto-deploy from `main`. Preview URLs on branches. |
| Repo | GitHub, under a BSGT organisation | Not a personal account. |
| Analytics | Cloudflare Web Analytics | Cookieless, no consent banner required. |
| Fonts | Self-hosted, bundled locally | Must NOT load from Google Fonts CDN. See §7. |
| Forms | None in v1 | Recruiting CTA links out. See §8. |

**No database. No server. No authentication. No third-party embeds that set cookies.**
These are deliberate constraints, not omissions — they keep the security and compliance
surface near zero. Do not introduce any of them without an explicit decision to do so.

---

## 3. Sitemap

```
/                       Home
/about                  About Us / What We Do  → recruiting block at page bottom
/team                   The Team
/articles               Article index
/articles/[slug]        Individual article
/events                 Events — upcoming and past
/privacy                Privacy policy
```

Flat and shallow on purpose. Seven routes plus article pages.

**URL structure is a one-time decision.** Changing `/articles/[slug]` later costs
accumulated search ranking. Lock it now.

### Home

Not a landing page with feature cards. It is a front page. The most recent three or four
articles are the primary content, set at full editorial weight — headline, author, date,
standfirst — followed by the next upcoming event and a single short line on what BSGT is
with a link through to /about.

The reasoning: the articles are the thing that makes BSGT worth visiting and the thing that
brings in search traffic. Leading with them is both more distinctive than a generic hero and
a more honest signal of what the association actually does.

### About Us / What We Do

Single page, continuous prose rather than chopped into cards. Covers: why the association
exists, what makes it distinct from Bocconi's other associations, and the four activity
strands — industry exposure and guest lectures, knowledge production (the articles),
practical workshops, and networking.

The recruiting block sits at the bottom of this page, after a reader has the context to want
it. It is a section, not a separate route. Contains: who BSGT is looking for, what membership
involves, when recruitment happens, and a single clear action.

### Team

Committee members with name, role, and degree programme. Photos optional — see §7 for the
consent requirement before publishing any.

### Articles

Reverse-chronological index. Filterable by tag. Individual article pages are the most
important template on the site: they are what search traffic lands on and what a prospective
industry partner is most likely to read. Prioritise reading comfort over everything else.

### Events

Two groups on one page: upcoming first, then past. Past events are not clutter — they are the
evidence of activity that makes the association look real to an outside reader. Do not hide
them.

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
```

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

**The "BSGT" wordmark is live HTML text, not an image.** Set it in the heading serif
alongside the mark. This keeps it sharp at all sizes, selectable, readable by screen
readers, and indexable. There is no wordmark asset and none should be created.

An Open Graph share image (1200×630, mark and full association name on `navy-deep`) still
needs producing.

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

Motion: one deliberate moment at most. No fade-and-slide on every section.

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

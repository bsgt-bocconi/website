# BSGT Website — CLAUDE.md

Public site for the Bocconi Shipping and Global Trade Student Association.
Full brief: `bsgt-website-spec.md`. This file is the durable summary — read
that spec when something here is unclear or missing.

## Stack

- **Astro**, static output only. No client-side rendering for content.
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

## Build vs. launch (spec §9)

Placeholder articles/team entries exist to verify templates and are seeded
under `draft: true` so they're excluded from production builds. **Build
complete ≠ launch.** Do not point the custom domain, submit sitemaps to
Search Console/Bing, or share the link publicly until there is real content
(real articles, real committee roster with recorded consent). A Pages
preview URL existing is fine pre-launch; a live custom domain is not.

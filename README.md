# BSGT Website

This is the source for the public website of BSGT — the Bocconi Shipping and Global
Trade Student Association — at `bocconishippingandglobaltrade.com`.

This README is written for whoever maintains the site after the person who built it.
It assumes you can use a terminal and edit text files, but have never touched this
project or the framework it's built on before.

## What this is

A static website: every page is plain files that get built into HTML ahead of time —
there's no database, no server, no login system, and no admin panel. Content (articles,
team members, events) lives as text files in this repository, written in Markdown. To
publish something, you add or edit a file and push it to GitHub; the live site rebuilds
itself automatically.

**Stack:**

- **[Astro](https://astro.build)** — the framework that turns the files in `src/` into
  the actual website. You mostly won't need to understand how it works to do routine
  content updates (adding an article, a team member, an event) — those are just text
  files, covered below.
- **Content is Markdown files** in `src/content/` — no CMS, no login, just files in this
  repo.
- **Hosting: Cloudflare Pages.** Pushing to the `main` branch on GitHub automatically
  rebuilds and redeploys the live site. See "Deployment" below.
- **Analytics: Cloudflare Web Analytics** — cookieless, no consent banner. Do not add
  Google Analytics or any tracking pixel/tag manager; see `CLAUDE.md` for why.
- **Fonts are self-hosted** in `public/fonts/` — never point the site at Google Fonts'
  CDN (see `CLAUDE.md` and `bsgt-website-spec.md` §7 for the reason: privacy law).

Two other files in the repo root are worth knowing about, even though you probably
won't need to open them for routine work:

- `bsgt-website-spec.md` — the original brief this site was built from.
- `CLAUDE.md` — durable notes for Claude Code (or another AI coding assistant) working
  in this repo. If you're using an AI assistant to help maintain this site, point it at
  this file first.

## Running it locally

You need [Node.js](https://nodejs.org) version 22.12 or later installed.

```sh
# from the repo root, one-time (or after pulling changes that touch package.json)
npm install

# start a local dev server, with live-reload as you edit files
npm run dev
```

Then open the URL it prints (normally `http://localhost:4321`). Leave that terminal
running while you work; stop it with `Ctrl+C` when you're done.

Two other commands you'll occasionally want:

```sh
npm run build     # builds the production version into dist/ (this is what Cloudflare runs)
npm run preview   # serves that dist/ build locally, so you can sanity-check a real build
```

**Important:** the local dev server (`npm run dev`) shows *everything*, including
placeholder/draft content (see below). A production build (`npm run build`) hides it.
If you want to see exactly what will go live, use `npm run build && npm run preview`,
not `npm run dev`.

## Adding an article

Articles live in `src/content/articles/`, one Markdown file per article. To add one,
copy an existing file as a starting point, or create a new file there — the filename
itself doesn't matter (it's not the URL), but keep it short and hyphenated,
e.g. `src/content/articles/red-sea-shipping-rates.md`.

Every article file needs frontmatter (the `---`-fenced block at the top) with these
fields, then the article body underneath as normal Markdown:

```markdown
---
title: "Your article title"
slug: red-sea-shipping-rates
summary: "One or two sentences. This is also used as the meta description and social share text."
author: "Jane Doe"
date: 2026-10-01
tags: ["Maritime Finance", "Shipping"]
draft: false
---

Your article body goes here, written as normal Markdown — paragraphs, `## headings`,
`- lists`, `> blockquotes`, `[links](/articles)`, etc.
```

Notes on the fields:

- **`slug`** is the article's URL (`/articles/red-sea-shipping-rates`). Once an article
  is published, **don't change its slug** — that breaks any links to it and loses any
  search ranking it's built up. Pick it carefully up front.
- **`author`** can be a single name (`"Jane Doe"`) or a list for multiple authors:
  `["Jane Doe", "John Smith"]`.
- **`tags`** are free text (e.g. `"Maritime Finance"`) — the site automatically
  builds a tag page for every tag that appears on at least one published article. No
  separate setup needed.
- **`draft`** is the important one. **A new article file defaults to `draft: true` if
  you omit the field at all** — meaning: *you must explicitly set `draft: false` for an
  article to actually appear on the live site.* Until then, it only shows up when you
  run the site locally (`npm run dev`), which is exactly how the placeholder articles
  already in this repo work — they exist to prove the template works, and are excluded
  from the real site by that flag.
- `heroImage` is optional and not currently used by any of the seed content — leave it
  out unless you're adding a header image for a specific article, in which case check
  `src/content.config.ts` for the exact field shape before adding one.

Once you're happy with it (with `draft: false`), commit and push to `main` — it'll be
live within a minute or two.

## Updating the committee

Team members live in `src/content/team/`, one file per person, e.g.
`src/content/team/jane-doe.md`:

```markdown
---
name: "Jane Doe"
role: "President"
programme: "BIEM, Year 3"
linkedin: "https://www.linkedin.com/in/janedoe"
order: 1
draft: false
---
```

- **`programme`** and **`linkedin`** are both optional — omit either if you don't have
  it.
- **`order`** controls display order on the Team page (lowest number first). Numbers
  don't need to be consecutive — leaving gaps (10, 20, 30…) makes it easier to insert
  someone later without renumbering everyone.
- **`draft`** works exactly like articles: omit it or leave it `true` and the person
  won't appear on the live site, only in your local dev server. **Set `draft: false`
  to actually publish someone.**
- **To remove someone** (they've graduated, stepped down, etc.), either delete their
  file or set `draft: true` again — either way, it's a one-file change.
- **Before publishing anyone's name, role, or photo, get their written consent first.**
  This is personal data. See `bsgt-website-spec.md` §7 for the full requirement — this
  isn't optional, it's a legal one given the EU/Italian audience.
- Photos are supported via an optional `photo` field but none of the current
  placeholder entries use one — check `src/content.config.ts` for the exact field
  before adding a photo, and get consent for that specifically too (a name is one thing,
  a photo is a stronger form of personal data).

## Adding an event

Events live in `src/content/events/`, one file per event:

```markdown
---
title: "Guest Lecture: Container Shipping and Global Trade"
date: 2026-10-15
startTime: "18:00"
location: "Università Bocconi, room TBC"
type: lecture
description: "A short description of the event, shown on the events page."
registrationUrl: "https://forms.gle/your-real-form"
draft: false
---
```

- **`type`** must be one of exactly: `lecture`, `workshop`, `social`, or `other`.
- **`startTime`** and **`registrationUrl`** are both optional — omit either if not
  applicable.
- The site automatically sorts events into **Upcoming** and **Past** based on
  `date` — there's no separate flag for this, and nothing to update once the date has
  passed; it just moves sections on its own.
- **`draft`** works exactly like articles and team members — a new event defaults to
  hidden from production until you set `draft: false`.
- The most imminent upcoming event automatically appears on the homepage — again,
  nothing extra to configure, it's derived from the same data.

## Deployment

This is how the site is designed to deploy, per the original brief (`bsgt-website-spec.md`
§2). If a push to `main` doesn't result in the live site updating, the most likely cause is
that the Cloudflare Pages project hasn't been connected to this repo yet (a one-time setup
step in the Cloudflare dashboard, not something you do from the command line) — check the
"Account access & contacts" section below for who can look into that.

Once that connection exists, deployment is automatic and there is no manual "publish" step
beyond pushing to GitHub:

1. You commit your changes (a new article, an edited team file, whatever) and
   `git push` to the `main` branch.
2. **Cloudflare Pages watches this repo and rebuilds automatically** whenever `main`
   changes — it runs `npm run build`, which is the same command described above, and
   deploys the result.
3. The live site at `bocconishippingandglobaltrade.com` updates within a couple of
   minutes of the push.

A couple of things worth knowing:

- If you push a branch that **isn't** `main` (e.g. to get a second opinion on a draft
  article before merging), Cloudflare Pages will normally build a **preview URL** for
  that branch too, separate from the live site. Useful for checking something looks
  right before it goes live.
- Because `draft: true` content is excluded from the build, you can safely leave
  unfinished articles/events/team entries sitting in the repo on `main` with
  `draft: true` — they will not appear on the live site until you flip that flag. This
  is the intended workflow for drafting something over several commits.
- There is no separate "build and deploy" command you need to run yourself locally —
  Cloudflare does that. `npm run build` locally is just for checking your changes build
  cleanly before you push, not part of actually publishing them.

## Where the accounts live

- **Domain** (`bocconishippingandglobaltrade.com`): registered at **Cloudflare
  Registrar**.
- **Code repository**: GitHub, under the **`bsgt-bocconi`** organisation —
  `github.com/bsgt-bocconi/website` (this repo).
- **Hosting**: **Cloudflare Pages**, meant to be connected to this GitHub repo and build
  from the `main` branch (see the deployment note above if that connection doesn't
  exist yet).
- **Analytics**: **Cloudflare Web Analytics**, attached to the same Cloudflare account
  as the domain and Pages project.

---

## Account access & contacts

> **This section is intentionally left for the site owner to fill in — do not guess at
> who holds what.** At minimum, it should end up covering:
>
> - Who owns/has admin access to the Cloudflare account (domain, Pages, Analytics)
> - Who owns/has admin access to the `bsgt-bocconi` GitHub organisation
> - A second person with access to each of the above, so continuity doesn't depend on
>   one person (see `bsgt-website-spec.md` §10 — this is an open item from the original
>   brief)
> - A current contact email for BSGT itself — confirmed as `as.bsgt@unibocconi.it` and
>   centralised in `src/data/contact.ts` (`CONTACT_EMAIL`), referenced from
>   `src/pages/privacy.astro`. Update the one constant there if it ever changes, not the
>   page.

_(fill in above)_

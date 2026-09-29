import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      summary: z.string(),
      author: z.union([z.string(), z.array(z.string())]),
      date: z.coerce.date(),
      tags: z.array(z.string()),
      heroImage: image().optional(),
      draft: z.boolean().default(true),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      startTime: z.string().optional(),
      location: z.string(),
      type: z.enum(['lecture', 'workshop', 'social', 'other']),
      description: z.string(),
      registrationUrl: z.string().url().optional(),
      // Optional, same as Team's `photo` and Slide's `image` — most
      // events won't have a photo, especially upcoming ones. imageAlt is
      // separate rather than reusing another field (unlike Slide, which
      // doubles `caption` as alt text): an event photo needs a real
      // description of what's actually in the picture, which usually has
      // nothing to do with the event's own title or description text.
      image: image().optional(),
      imageAlt: z.string().optional(),
      draft: z.boolean().default(true),
    }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      // Sections the team page into its three tiers, in this order:
      // board (President/VPs), departments (heads running the day-to-day
      // divisions), directors (the remaining director/lead roles). `order`
      // below is scoped within a group, not global — see team.astro.
      group: z.enum(['board', 'departments', 'directors']),
      programme: z.string().optional(),
      photo: image().optional(),
      // How `photo` is framed in the card's 4:5 box. x/y: the face's
      // centre as a fraction of the source image (0–1, from top-left);
      // zoom: how far to crop in beyond a plain cover fit. Unset = a plain
      // cover fit favouring the upper portion, right for a head-and-
      // shoulders shot. Set it for full-length or wide shots so the face
      // lands at the same size and height as everyone else's — see
      // TeamMemberCard for the maths.
      photoFocus: z
        .object({
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
          zoom: z.number().min(1).max(3).default(1),
        })
        .optional(),
      linkedin: z.string().url().optional(),
      order: z.number(),
      draft: z.boolean().default(true),
    }),
});

const slides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/slides' }),
  schema: ({ image }) =>
    z.object({
      // Doubles as alt text when `image` is set, or as the visible message
      // on a placeholder slide when it isn't.
      caption: z.string(),
      image: image().optional(),
      order: z.number(),
      draft: z.boolean().default(true),
    }),
});

export const collections = { articles, events, team, slides };

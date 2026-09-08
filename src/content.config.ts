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
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    startTime: z.string().optional(),
    location: z.string(),
    type: z.enum(['lecture', 'workshop', 'social', 'other']),
    description: z.string(),
    registrationUrl: z.string().url().optional(),
    draft: z.boolean().default(true),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      programme: z.string().optional(),
      photo: image().optional(),
      linkedin: z.string().url().optional(),
      order: z.number(),
      draft: z.boolean().default(true),
    }),
});

export const collections = { articles, events, team };

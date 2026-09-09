import type { ImageMetadata } from 'astro';
import eventsPhoto from '../assets/divisions/events.jpg';
import researchPhoto from '../assets/divisions/research.jpg';
import marketingPhoto from '../assets/divisions/marketing.jpg';

export interface Division {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  // Imported ImageMetadata, not a string path — keeps the photo and the
  // text it's paired with in one place, and lets astro:assets optimise
  // it (see the homepage's stacking cards for how it's used).
  photo: ImageMetadata;
  // Not decorative — these carry real meaning, so they get real
  // descriptions rather than the division name repeated back.
  photoAlt: string;
}

// Fixed, small, structural content — not a content collection (that would
// be overkill for three permanent items). Adding a fourth is just adding
// another object to this array; nothing about the layout or the
// /divisions/[slug] page depends on the count being exactly three. `slug`
// drives that route directly — see src/pages/divisions/[slug].astro.
export const divisions: Division[] = [
  {
    slug: 'events',
    name: 'Events',
    tagline: 'Bringing the industry closer.',
    description:
      'We connect Bocconi students with maritime professionals through guest speakers, workshops, case sessions and industry experiences.',
    photo: eventsPhoto,
    photoAlt:
      'A guest speaker addressing an audience at a harbourside event at sunset, a container ship crossing the water beyond the window.',
  },
  {
    slug: 'research',
    name: 'Research',
    tagline: 'Turning shipping into insight.',
    description:
      'We research, analyse and explain the forces shaping shipping, finance and global trade — from market movements and vessel investments to M&A and industry trends.',
    photo: researchPhoto,
    photoAlt:
      'A laptop showing a freight rate index chart, next to books on maritime economics, shipping finance and global trade, and a printed trade-flow map.',
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    tagline: 'Taking our ideas beyond Bocconi.',
    description:
      "We bring BSGT's events, insights and initiatives to life through creative content, building our community and connecting it with the wider maritime world.",
    photo: marketingPhoto,
    photoAlt:
      "A laptop displaying a marketing mood board beside a 'Marketing Division' branded poster, a camera and a notebook, with a sunset harbour view beyond.",
  },
];

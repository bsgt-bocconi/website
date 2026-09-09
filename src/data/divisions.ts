export interface Division {
  name: string;
  tagline: string;
  description: string;
}

// Fixed, small, structural content — not a content collection (that would
// be overkill for three permanent items). Adding a fourth is just adding
// another object to this array; nothing about the layout depends on the
// count being exactly three.
export const divisions: Division[] = [
  {
    name: 'Events',
    tagline: 'Bringing the industry closer.',
    description:
      'We connect Bocconi students with maritime professionals through guest speakers, workshops, case sessions and industry experiences.',
  },
  {
    name: 'Research',
    tagline: 'Turning shipping into insight.',
    description:
      'We research, analyse and explain the forces shaping shipping, finance and global trade — from market movements and vessel investments to M&A and industry trends.',
  },
  {
    name: 'Marketing',
    tagline: 'Taking our ideas beyond Bocconi.',
    description:
      "We bring BSGT's events, insights and initiatives to life through creative content, building our community and connecting it with the wider maritime world.",
  },
];

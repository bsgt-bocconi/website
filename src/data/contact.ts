// Single source of truth for BSGT's contact email and social profiles —
// same pattern as src/data/divisions.ts. Referenced from every page/
// component that needs them (privacy policy, the homepage contact
// section, the footer, and the Organization JSON-LD) instead of being
// hardcoded per call site, so there's exactly one place to update if
// either ever changes.
export const CONTACT_EMAIL = 'as.bsgt@unibocconi.it';

export interface SocialLink {
  name: string;
  // 'icon' selects which glyph src/components/SocialIcon.astro renders —
  // kept as a separate, explicit key rather than deriving it from `name`
  // (e.g. lowercasing it) so the two can't silently drift if a future
  // platform's display name doesn't match its icon key one-to-one.
  icon: 'instagram' | 'linkedin';
  url: string;
}

// Exact public-facing URLs only — the ones originally supplied carried
// ?stkn= and ?viewAsMember=true query params, which are session/account
// artefacts (a share-link token and an admin preview flag), not part of
// the public page address, and must never end up published here.
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/bsgtassociation',
  },
  {
    name: 'LinkedIn',
    icon: 'linkedin',
    url: 'https://www.linkedin.com/company/shipping-global-trade-student-association/',
  },
];

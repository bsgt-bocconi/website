// Recruitment timeline shown on the homepage, directly above the
// recruiting block. State (past / current / future) is derived from
// these dates at build time — see index.astro — never hardcode which
// milestone is "current" in the markup itself. Running this again next
// year is just editing the dates below; nothing else needs to change.
export interface Milestone {
  // ISO date (YYYY-MM-DD), interpreted as UTC midnight — see
  // toUTCMidnight() in index.astro. Deliberately date-only, not a
  // timestamp: these are whole-day milestones, not specific moments.
  date: string;
  label: string;
}

export const RECRUITMENT_MILESTONES: Milestone[] = [
  { date: '2026-09-11', label: 'Applications open' },
  { date: '2026-09-24', label: 'Associations on display' },
  { date: '2026-09-30', label: 'Applications close' },
];

// The whole section stops rendering after this date — time-limited
// recruitment content must not sit on the page advertising a closed
// round months later. Same date as the last milestone above, kept as
// its own constant since "when does the round close" and "what's the
// last milestone" are conceptually separate questions that just happen
// to share a date this year.
export const RECRUITMENT_CLOSES = '2026-09-30';

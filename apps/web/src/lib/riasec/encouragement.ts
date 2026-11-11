// Copyright (c) 2026 EdTech. All rights reserved.

// Milestone encouragement for the assessment (Design Vision §3): one short
// cheer as the student passes a quarter, half and three quarters of the 42
// statements. Thresholds are answer counts, not indices, so skipping around
// never fires one early. Copy carries both languages, same shape as the
// statement bank.
export const MILESTONE_CHEERS = [
  {
    at: 11,
    en: "A quarter done. Nice steady pace.",
    fil: "Sangkapat na ang tapos. Tuloy lang.",
  },
  {
    at: 21,
    en: "Halfway there. Most students never get this far.",
    fil: "Kalahati na. Ang galing mo, ituloy mo lang.",
  },
  {
    at: 32,
    en: "Three quarters done. The finish line is close.",
    fil: "Tatlong-kapat na. Malapit ka na.",
  },
] as const;

export type MilestoneCheerEntry = (typeof MILESTONE_CHEERS)[number];

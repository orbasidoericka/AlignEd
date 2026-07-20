// Copyright (c) 2026 EdTech. All rights reserved.

// Mock-phase reference data. The production path replaces MOCK_CAREERS and
// MOCK_PROGRAMS with Supabase reference tables and the match_courses RPC
// (PRD FR-6, FR-7); rankByOverlap mirrors the RPC's exact-before-partial
// semantics so the UI contract stays stable.

import type { RiasecLetter } from "./types";

export type MatchStrength = "exact" | "strong";

export interface MockCareer {
  title: string;
  blurb: string;
  letters: readonly RiasecLetter[];
}

export interface MockProgram {
  name: string;
  blurb: string;
  letters: readonly RiasecLetter[];
  strandNote: string;
}

export const MOCK_CAREERS: readonly MockCareer[] = [
  {
    title: "Registered Nurse",
    blurb: "Care for patients and support doctors in hospitals and clinics.",
    letters: ["S", "I", "C"],
  },
  {
    title: "Software Developer",
    blurb: "Design and build the apps and systems people use every day.",
    letters: ["I", "R", "C"],
  },
  {
    title: "Guidance Counselor",
    blurb: "Help students work through academic and personal decisions.",
    letters: ["S", "A", "E"],
  },
  {
    title: "Civil Engineer",
    blurb: "Plan and build roads, bridges, and structures that last.",
    letters: ["R", "I", "C"],
  },
  {
    title: "Graphic Designer",
    blurb: "Turn ideas into visuals for brands, media, and products.",
    letters: ["A", "E", "R"],
  },
  {
    title: "Entrepreneur",
    blurb: "Start and grow a business around a problem you care about.",
    letters: ["E", "S", "C"],
  },
  {
    title: "Medical Technologist",
    blurb: "Run the lab tests that doctors rely on for diagnoses.",
    letters: ["I", "C", "R"],
  },
  {
    title: "Teacher",
    blurb: "Guide the next generation through subjects you love.",
    letters: ["S", "A", "C"],
  },
  {
    title: "Accountant",
    blurb: "Keep organizations honest and healthy through their numbers.",
    letters: ["C", "E", "I"],
  },
  {
    title: "Multimedia Artist",
    blurb: "Create animation, video, and interactive stories.",
    letters: ["A", "I", "E"],
  },
];

export const MOCK_PROGRAMS: readonly MockProgram[] = [
  {
    name: "BS Nursing",
    blurb: "Four-year program preparing you for the nursing licensure exam.",
    letters: ["S", "I", "C"],
    strandNote:
      "STEM and HUMSS graduates both enter nursing; science bridging units may apply for non-STEM strands.",
  },
  {
    name: "BS Computer Science",
    blurb: "Programming, algorithms, and building real software systems.",
    letters: ["I", "R", "C"],
    strandNote:
      "STEM is the conventional route; other strands usually take bridging math units.",
  },
  {
    name: "BS Psychology",
    blurb: "The science of how people think, feel, and behave.",
    letters: ["S", "I", "A"],
    strandNote: "Open to all strands; HUMSS aligns most directly.",
  },
  {
    name: "BS Civil Engineering",
    blurb: "Design the structures communities depend on.",
    letters: ["R", "I", "C"],
    strandNote:
      "STEM is a conventional prerequisite; expect math bridging from other strands.",
  },
  {
    name: "BA Communication",
    blurb: "Storytelling across media, journalism, and public relations.",
    letters: ["A", "S", "E"],
    strandNote: "HUMSS and Arts & Design align most directly; open to all strands.",
  },
  {
    name: "BS Accountancy",
    blurb: "The path toward becoming a Certified Public Accountant.",
    letters: ["C", "E", "I"],
    strandNote: "ABM is the conventional route; strong math grades help from any strand.",
  },
];

export interface RankedMatch<T> {
  item: T;
  matchStrength: MatchStrength;
  overlap: number;
}

// Exact (3 shared letters) first, then strong (2), alphabetical tiebreak,
// mirroring the match_courses RPC contract. Items sharing fewer than 2
// letters are dropped.
export function rankByOverlap<T extends { letters: readonly RiasecLetter[] }>(
  items: readonly T[],
  code: readonly RiasecLetter[],
  nameOf: (item: T) => string,
): RankedMatch<T>[] {
  return items
    .map((item) => ({
      item,
      overlap: item.letters.filter((letter) => code.includes(letter)).length,
    }))
    .filter(({ overlap }) => overlap >= 2)
    .map(({ item, overlap }) => ({
      item,
      overlap,
      matchStrength: (overlap === 3 ? "exact" : "strong") as MatchStrength,
    }))
    .sort(
      (a, b) =>
        b.overlap - a.overlap || nameOf(a.item).localeCompare(nameOf(b.item)),
    );
}

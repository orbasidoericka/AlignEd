// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecTrait } from "@/store/useAssessmentStore";

export type { RiasecTrait };

export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

// Senior High School only (PRD audience: Grade 11-12). Junior High options
// (7-10) removed from the picker. Migration tests for old localStorage
// payloads still assert grades 7-10 pass through unchanged, since `migrate`
// takes `unknown` and never validates against this list.
export const GRADE_LEVELS = ["11", "12"] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];

export const SHS_STRANDS = [
  "Accountancy, Business and Management (ABM)",
  "Science, Technology, Engineering, and Mathematics (STEM)",
  "Humanities and Social Sciences (HUMSS)",
  "General Academic Strand (GAS)",
  "Arts and Design",
  "Sports",
  "Agri-Fishery Arts (AFA)",
  "Home Economics (HE)",
  "Industrial Arts (IA)",
  "Information and Communications Technology (ICT)",
  "Others",
] as const;

export type ShsStrand = (typeof SHS_STRANDS)[number];

// "Others" lets a student type a strand the list lacks. That text stays on the
// device and in the student's own PDF; the server only ever sees "Others".
export const STRAND_OTHER = "Others" satisfies ShsStrand;
export const STRAND_OTHER_MAX_LENGTH = 60;

// What to print for the student's strand: the typed text for "Others", the
// picked strand otherwise, null when none is chosen.
export function strandLabel(
  strand: ShsStrand | null,
  strandOther: string,
): string | null {
  if (strand === null) return null;
  return strand === STRAND_OTHER ? strandOther.trim() || null : strand;
}

// The abbreviation in brackets ("STEM"), or the whole name when it has none
// ("Sports"), for tight spaces like table cells.
export function strandShortName(strand: ShsStrand): string {
  return /\(([^)]+)\)$/.exec(strand)?.[1] ?? strand;
}

export interface StudentProfile {
  nickname: string;
  gradeLevel: GradeLevel;
  strand: ShsStrand;
  age: string;
}

export const NICKNAME_MAX_LENGTH = 8;

// Senior High ages: Grade 11 is usually 16, and 15 still admits students who
// started school early. 30 leaves room for late enrollees and returning
// learners. The database check (0004) stays at 10-30, a wider bound.
export const AGE_MIN = 15;
export const AGE_MAX = 30;

// The profile's age field holds digits only (sanitized per keystroke), so a
// whole number within the range is all there is to check.
export function isValidAge(age: string): boolean {
  if (!/^\d+$/.test(age)) return false;
  const value = Number(age);
  return value >= AGE_MIN && value <= AGE_MAX;
}

// Nicknames are uppercase letters and hyphens only (PRD FR-2). Applied on
// every keystroke, so typing a digit or symbol simply produces nothing.
export function sanitizeNickname(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z-]/g, "")
    .slice(0, NICKNAME_MAX_LENGTH);
}

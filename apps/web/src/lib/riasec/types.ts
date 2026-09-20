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

export interface StudentProfile {
  nickname: string;
  gradeLevel: GradeLevel;
  school: string;
}

export const NICKNAME_MAX_LENGTH = 8;

export const SCHOOL_MAX_LENGTH = 120;

// Nicknames are uppercase letters and hyphens only (PRD FR-2). Applied on
// every keystroke, so typing a digit or symbol simply produces nothing.
export function sanitizeNickname(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z-]/g, "")
    .slice(0, NICKNAME_MAX_LENGTH);
}

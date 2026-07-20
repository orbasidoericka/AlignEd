// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecTrait } from "@/store/useAssessmentStore";

export type { RiasecTrait };

export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

export type GradeLevel = "11" | "12";

export const STRANDS = [
  "STEM",
  "ABM",
  "HUMSS",
  "GAS",
  "TVL",
  "Arts & Design",
  "Sports",
] as const;

export type Strand = (typeof STRANDS)[number];

export interface StudentProfile {
  gradeLevel: GradeLevel;
  strand: Strand;
  school: string;
}

export const SCHOOL_MAX_LENGTH = 120;

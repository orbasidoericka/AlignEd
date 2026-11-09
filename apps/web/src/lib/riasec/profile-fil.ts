// Copyright (c) 2026 EdTech. All rights reserved.

import type { ShsStrand } from "./types";

// Filipino translation of the Profile Setup screen. Mirrors questions-fil.ts:
// the stored value (profile.strand, GradeLevel) always stays the English enum
// from types.ts, so saved records and the PDF never change shape; only the
// label shown on screen switches.
export const STRAND_LABEL_FIL: Readonly<Record<ShsStrand, string>> = {
  "Accountancy, Business and Management (ABM)":
    "Accountancy, Negosyo at Pamamahala (ABM)",
  "Science, Technology, Engineering, and Mathematics (STEM)":
    "Agham, Teknolohiya, Inhinyeriya, at Matematika (STEM)",
  "Humanities and Social Sciences (HUMSS)":
    "Humanidades at Agham Panlipunan (HUMSS)",
  "General Academic Strand (GAS)": "Pangkalahatang Akademikong Sangay (GAS)",
  "Arts and Design": "Sining at Disenyo",
  Sports: "Isports",
  "Agri-Fishery Arts (AFA)": "Sining ng Agrikultura at Pangingisda (AFA)",
  "Home Economics (HE)": "Home Economics (HE)",
  "Industrial Arts (IA)": "Sining Industriyal (IA)",
  "Information and Communications Technology (ICT)":
    "Teknolohiya ng Impormasyon at Komunikasyon (ICT)",
  Others: "Iba pa",
};

export const PROFILE_TEXT_FIL = {
  heading: "Sabihin mo sa amin ang tungkol sa iyong sarili",
  subheading:
    "Isang palayaw at antas ng iyong grado para maitugma ka namin sa mga karera at programa sa kolehiyo. Hindi na kailangan ng totoong pangalan.",
  requiredNote: "Ang mga tanong na may * ay kinakailangan.",
  nicknameLabel: "Ano ang dapat naming itawag sa'yo?",
  nicknameHint: "Maglagay ng palayaw para magpatuloy.",
  gradeGroupLabel: "Antas ng grado",
  gradeLabel: "Anong baitang ka?",
  gradeOption: (grade: string) => `Baitang ${grade}`,
  gradeHint: "Pumili ng iyong antas ng grado para magpatuloy.",
  strandLabel: "Ano ang SHS strand mo?",
  strandPlaceholder: "Pumili ng iyong strand",
  strandHint: "Pumili ng iyong SHS strand para magpatuloy.",
  strandOtherPrefix: "Iba pa:",
  strandOtherAriaLabel: "I-type ang iyong strand",
  strandOtherChangeAriaLabel: "Baguhin ang strand",
  strandOtherHint: "I-type ang iyong strand para magpatuloy.",
  ageLabel: "Ilang taon ka na?",
  ageHint: "Ilagay ang iyong edad para magpatuloy.",
  schoolLabel: "Paaralan",
  schoolOptional: "(opsyonal)",
  continueButton: "Magpatuloy sa pagtatasa",
  continueNote: "Maaari kang bumalik at baguhin ito bago matapos ang pagtatasa.",
} as const;

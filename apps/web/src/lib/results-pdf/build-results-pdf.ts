// Copyright (c) 2026 EdTech. All rights reserved.

import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

import { pathwaysForCode } from "@/lib/riasec/career-pathways";
import {
  formatHollandCode,
  TRAIT_META,
  TRAIT_ORDER,
  traitForLetter,
  type HollandCode,
} from "@/lib/riasec/scoring";
import type { RiasecScores } from "@/store/useAssessmentStore";

// The results PDF as a pdfmake document: the same facts as the results
// page (Holland Code, six trait scores, majors and pathways per letter),
// laid out as real text so it is searchable and small. Encrypted with
// AES-256 (PDF 1.7 ext 3) under the student's password; see password.ts.

export interface ResultsPdfInput {
  nickname: string;
  gradeLevel: string | null;
  school: string;
  scores: RiasecScores;
  code: HollandCode;
  maxScore: number;
  takenOn: Date;
  password: string;
  // Guards the permissions below. Nobody needs to know it: pass a random
  // one per file. Without it PDFKit forbids printing and copying even for
  // the student.
  ownerPassword: string;
}

const NAVY = "#1b2a4a";
const MUTED = "#5c6475";
const RULE = "#d9dde5";

function longDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildResultsPdf(input: ResultsPdfInput): TDocumentDefinitions {
  const { nickname, gradeLevel, school, scores, code, maxScore } = input;

  const who = [
    nickname || "Student",
    gradeLevel ? `Grade ${gradeLevel}` : null,
    school || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const traitRows: Content[][] = TRAIT_ORDER.map((trait) => {
    const { letter, label } = TRAIT_META[trait];
    const inCode = code.includes(letter);
    return [
      { text: letter, bold: true },
      { text: label, bold: inCode },
      {
        text: `${scores[trait]} / ${maxScore}`,
        alignment: "right",
        bold: inCode,
      },
    ];
  });

  const pathways: Content[] = pathwaysForCode(code).flatMap((profile) => [
    {
      text: `${profile.letter}: ${profile.name} (${TRAIT_META[traitForLetter(profile.letter)].label})`,
      style: "h3",
    },
    { text: profile.description, color: MUTED, margin: [0, 0, 0, 4] },
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "College majors", bold: true, margin: [0, 0, 0, 2] },
            { ul: [...profile.majors] },
          ],
        },
        {
          width: "*",
          stack: [
            { text: "Related pathways", bold: true, margin: [0, 0, 0, 2] },
            { ul: [...profile.relatedPathways] },
          ],
        },
      ],
      columnGap: 16,
      margin: [0, 0, 0, 12],
    },
  ]);

  return {
    info: {
      title: `AlignEd results for ${nickname || "student"}`,
      author: "AlignEd",
      subject: "RIASEC Holland Code results",
    },
    userPassword: input.password,
    ownerPassword: input.ownerPassword,
    // The student may print and copy their own results; editing stays off.
    permissions: {
      printing: "highResolution",
      copying: true,
      contentAccessibility: true,
      modifying: false,
      annotating: false,
      fillingForms: false,
      documentAssembly: false,
    },
    version: "1.7ext3",
    pageSize: "A4",
    pageMargins: [48, 56, 48, 56],
    defaultStyle: { font: "Roboto", fontSize: 10.5, color: NAVY, lineHeight: 1.25 },
    styles: {
      h1: { fontSize: 22, bold: true, margin: [0, 0, 0, 4] },
      h2: { fontSize: 14, bold: true, margin: [0, 16, 0, 6] },
      h3: { fontSize: 12, bold: true, margin: [0, 8, 0, 2] },
    },
    footer: (page, pages) => ({
      columns: [
        { text: `AlignEd · taken ${longDate(input.takenOn)}`, color: MUTED },
        { text: `Page ${page} of ${pages}`, alignment: "right", color: MUTED },
      ],
      fontSize: 8,
      margin: [48, 20, 48, 0],
    }),
    content: [
      { text: "Your AlignEd results", style: "h1" },
      { text: who, color: MUTED },
      { text: `Assessment taken ${longDate(input.takenOn)}`, color: MUTED },

      { text: "Your Holland Code", style: "h2" },
      {
        text: formatHollandCode(code),
        fontSize: 30,
        bold: true,
        characterSpacing: 2,
      },
      {
        text: code
          .map((letter) => TRAIT_META[traitForLetter(letter)].label)
          .join(" · "),
        color: MUTED,
      },

      { text: "Your six traits", style: "h2" },
      {
        table: { widths: [20, "*", 60], body: traitRows },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => RULE,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },

      { text: "Majors and pathways for your code", style: "h2" },
      ...pathways,

      {
        text: "Talk these matches over with your guidance counselor or family. Your code is a starting point for exploring, not a final answer.",
        italics: true,
        color: MUTED,
        margin: [0, 12, 0, 0],
      },
    ],
  };
}

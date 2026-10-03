// Copyright (c) 2026 EdTech. All rights reserved.

import type {
  CanvasRect,
  Content,
  TDocumentDefinitions,
} from "pdfmake/interfaces";

import { pathwaysForCode } from "@/lib/riasec/career-pathways";
import {
  formatHollandCode,
  TRAIT_META,
  TRAIT_ORDER,
  traitForLetter,
  type HollandCode,
} from "@/lib/riasec/scoring";
import type { RiasecLetter } from "@/lib/riasec/types";
import type { RiasecScores } from "@/store/useAssessmentStore";

import { ALIGNED_WORDMARK_PNG } from "./logo";

// The results PDF as a pdfmake document: the same facts as the results
// page (Holland Code, six trait scores, majors and pathways per letter),
// laid out as real text so it is searchable and small. Encrypted with
// AES-256 (PDF 1.7 ext 3) under the student's password; see password.ts.

export interface ResultsPdfInput {
  nickname: string;
  gradeLevel: string | null;
  age: string;
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
const TRACK = "#e8ebf0";
const WHITE = "#ffffff";

// Saturated twins of the pastel --trait-* tokens in globals.css: same hue per
// letter as the screen, taken up to full strength so the print still reads as
// AlignEd but carries on paper, where the on-screen pastels wash out.
const TRAIT_COLOR: Record<RiasecLetter, string> = {
  R: "#2563eb",
  I: "#7c3aed",
  A: "#f59e0b",
  S: "#16a34a",
  E: "#ea580c",
  C: "#0d9488",
};

const BAR_WIDTH = 132;

function longDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Small letterspaced caps that open each section, in place of heavier
// headings: the colour does the work, so the type can stay quiet.
function eyebrow(text: string): Content {
  return { text: text.toUpperCase(), style: "eyebrow" };
}

// One letter of the Holland Code as a filled tile.
function codeTile(letter: RiasecLetter): Content {
  return {
    fillColor: TRAIT_COLOR[letter],
    margin: [0, 12, 0, 12],
    stack: [
      {
        text: letter,
        fontSize: 34,
        bold: true,
        color: WHITE,
        alignment: "center",
        characterSpacing: 1,
        lineHeight: 1,
      },
      {
        text: TRAIT_META[traitForLetter(letter)].label,
        fontSize: 9.5,
        color: WHITE,
        alignment: "center",
        margin: [0, 4, 0, 0],
      },
    ],
  };
}

// Score as a rounded track with the trait's colour filled across it.
function scoreBar(letter: RiasecLetter, score: number, max: number): Content {
  const filled = max > 0 ? Math.max(0, Math.min(1, score / max)) : 0;
  const bars: CanvasRect[] = [
    { type: "rect", x: 0, y: 0, w: BAR_WIDTH, h: 7, r: 3.5, color: TRACK },
  ];
  // A hairline sliver reads as a smudge rather than a score, so a zero is
  // left as bare track.
  if (filled > 0) {
    bars.push({
      type: "rect",
      x: 0,
      y: 0,
      w: Math.max(7, BAR_WIDTH * filled),
      h: 7,
      r: 3.5,
      color: TRAIT_COLOR[letter],
    });
  }
  return { canvas: bars, margin: [0, 3, 0, 0] };
}

export function buildResultsPdf(input: ResultsPdfInput): TDocumentDefinitions {
  const { nickname, gradeLevel, age, school, scores, code, maxScore } = input;

  const who = [
    nickname || "Student",
    age ? `${age} years old` : null,
    gradeLevel ? `Grade ${gradeLevel}` : null,
    school || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const traitRows: Content[][] = TRAIT_ORDER.map((trait) => {
    const { letter, label } = TRAIT_META[trait];
    const inCode = code.includes(letter);
    return [
      { text: letter, bold: true, color: TRAIT_COLOR[letter], fontSize: 12 },
      { text: label, bold: inCode, margin: [0, 1, 0, 0] },
      scoreBar(letter, scores[trait], maxScore),
      {
        text: `${scores[trait]} / ${maxScore}`,
        alignment: "right",
        bold: inCode,
        color: inCode ? NAVY : MUTED,
        margin: [0, 1, 0, 0],
      },
    ];
  });

  // Each letter of the code gets its own block, hung off a colour bar in that
  // trait's colour so the three sections stay told apart at a glance.
  const pathways: Content[] = pathwaysForCode(code).map((profile) => ({
    table: {
      widths: [3, "*"],
      body: [
        [
          { text: "", fillColor: TRAIT_COLOR[profile.letter] },
          {
            margin: [10, 0, 0, 0],
            stack: [
              {
                text: `${profile.letter}: ${profile.name} (${TRAIT_META[traitForLetter(profile.letter)].label})`,
                fontSize: 12,
                bold: true,
                color: TRAIT_COLOR[profile.letter],
                margin: [0, 0, 0, 3],
              },
              { text: profile.description, color: MUTED, margin: [0, 0, 0, 7] },
              {
                columns: [
                  {
                    width: "*",
                    stack: [
                      { text: "College majors", style: "listLabel" },
                      { ul: [...profile.majors], markerColor: TRAIT_COLOR[profile.letter] },
                    ],
                  },
                  {
                    width: "*",
                    stack: [
                      { text: "Related pathways", style: "listLabel" },
                      {
                        ul: [...profile.relatedPathways],
                        markerColor: TRAIT_COLOR[profile.letter],
                      },
                    ],
                  },
                ],
                columnGap: 16,
              },
            ],
          },
        ],
      ],
    },
    layout: "noBorders",
    margin: [0, 0, 0, 14],
    // Keeps a letter's heading, colour bar and lists on one page instead of
    // splitting the bar and orphaning the heading at a page end.
    unbreakable: true,
  }));

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
    // Top margin clears the wordmark the header parks in the corner.
    pageMargins: [48, 76, 48, 56],
    defaultStyle: { font: "Roboto", fontSize: 10.5, color: NAVY, lineHeight: 1.25 },
    styles: {
      h1: { fontSize: 23, bold: true, margin: [0, 0, 0, 4] },
      eyebrow: {
        fontSize: 8.5,
        bold: true,
        color: MUTED,
        characterSpacing: 1.2,
        margin: [0, 18, 0, 7],
      },
      listLabel: { fontSize: 9, bold: true, color: MUTED, margin: [0, 0, 0, 3] },
    },
    header: () => ({
      image: ALIGNED_WORDMARK_PNG,
      width: 92,
      alignment: "right",
      margin: [0, 26, 48, 0],
    }),
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

      eyebrow("Your Holland Code"),
      {
        table: {
          widths: ["*", 10, "*", 10, "*"],
          body: [
            [
              codeTile(code[0]),
              { text: "" },
              codeTile(code[1]),
              { text: "" },
              codeTile(code[2]),
            ],
          ],
        },
        layout: "noBorders",
      },
      {
        text: `Your Holland Code is ${formatHollandCode(code)} — your three strongest interest areas, in order.`,
        color: MUTED,
        margin: [0, 8, 0, 0],
      },

      eyebrow("Your six traits"),
      {
        table: { widths: [14, "*", BAR_WIDTH, 44], body: traitRows },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 5,
          paddingBottom: () => 5,
          paddingLeft: () => 0,
          paddingRight: (i: number) => (i === 1 || i === 2 ? 10 : 0),
        },
      },

      eyebrow("Majors and pathways for your code"),
      ...pathways,

      {
        text: "Talk these matches over with your guidance counselor or family. Your code is a starting point for exploring, not a final answer.",
        italics: true,
        color: MUTED,
        margin: [0, 4, 0, 0],
      },
    ],
  };
}

// Copyright (c) 2026 EdTech. All rights reserved.

import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { TRAIT_META, TRAIT_ORDER, traitForLetter } from "@/lib/riasec/scoring";
import type { RiasecLetter } from "@/lib/riasec/types";
import type { RiasecScores, RiasecTrait } from "@/store/useAssessmentStore";

// Server-side logic for emailing results (PRD FR-8): request validation,
// rate-limit rules, and the email itself. The email is built here from
// structured results (letters and numbers), never from text the browser
// sends, so the route cannot be used to mail arbitrary content.

export interface ResultsPayload {
  nickname: string;
  code: [RiasecLetter, RiasecLetter, RiasecLetter];
  scores: RiasecScores;
  maxScore: number;
}

export interface SendResultsRequest {
  email: string;
  consent: true;
  // Honeypot: a hidden field people never see. Bots that fill it are
  // answered as if the email went out, and nothing is sent.
  website: string;
  results: ResultsPayload;
}

export type Validation =
  | { ok: true; value: SendResultsRequest }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETTERS = TRAIT_ORDER.map((trait) => TRAIT_META[trait].letter);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateRequest(body: unknown): Validation {
  if (!isRecord(body)) return { ok: false, error: "Body must be a JSON object." };

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email.length === 0 || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (body.consent !== true) {
    return { ok: false, error: "Consent is required to send your results." };
  }
  const website = typeof body.website === "string" ? body.website : "";

  const results = body.results;
  if (!isRecord(results)) return { ok: false, error: "Missing results." };

  const nickname = typeof results.nickname === "string" ? results.nickname : "";
  if (!/^[A-Z-]{0,8}$/.test(nickname)) {
    return { ok: false, error: "Invalid nickname." };
  }

  const maxScore = results.maxScore;
  if (
    typeof maxScore !== "number" ||
    !Number.isInteger(maxScore) ||
    maxScore < 1 ||
    maxScore > 100
  ) {
    return { ok: false, error: "Invalid maximum score." };
  }

  const code = results.code;
  if (
    !Array.isArray(code) ||
    code.length !== 3 ||
    !code.every((letter) => LETTERS.includes(letter as RiasecLetter)) ||
    new Set(code).size !== 3
  ) {
    return { ok: false, error: "Invalid Holland Code." };
  }

  const rawScores = results.scores;
  if (!isRecord(rawScores)) return { ok: false, error: "Missing scores." };
  const scores = {} as RiasecScores;
  for (const trait of TRAIT_ORDER) {
    const score = rawScores[trait];
    if (
      typeof score !== "number" ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > maxScore
    ) {
      return { ok: false, error: `Invalid ${trait} score.` };
    }
    scores[trait] = score;
  }

  return {
    ok: true,
    value: {
      email,
      consent: true,
      website,
      results: {
        nickname,
        code: code as [RiasecLetter, RiasecLetter, RiasecLetter],
        scores,
        maxScore,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Rate limits (PRD FR-8.4)

export const RATE_LIMITS = {
  // The same address, per rolling day.
  perEmailPerDay: 3,
  // One network per rolling hour. A school lab shares one IP, so this is
  // generous.
  perIpPerHour: 20,
} as const;

// ---------------------------------------------------------------------------
// The email

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function labelFor(letter: RiasecLetter): string {
  return TRAIT_META[traitForLetter(letter)].label;
}

export interface ResultsEmail {
  subject: string;
  html: string;
  text: string;
}

const NAVY = "#1b2a4a";
const MUTED = "#5c6475";

export function buildResultsEmail(results: ResultsPayload): ResultsEmail {
  const { nickname, code, scores, maxScore } = results;
  const codeText = code.join("-");
  const greeting = nickname ? `Hi ${nickname},` : "Hi,";
  const codeLabels = code.map(labelFor).join(" · ");
  const traits = TRAIT_ORDER.map((trait: RiasecTrait) => ({
    trait,
    ...TRAIT_META[trait],
  }));

  // --- Plain-text part ---
  const textLines = [
    greeting,
    "",
    `Your Holland Code is ${codeText} (${codeLabels}).`,
    "",
    "Your six traits:",
    ...traits.map(
      (t) => `  ${t.letter}  ${t.label.padEnd(14)} ${scores[t.trait]} / ${maxScore}`,
    ),
    "",
  ];
  for (const letter of code) {
    const p = RIASEC_PATHWAYS[letter];
    textLines.push(
      `${letter}: ${p.name} (${labelFor(letter)})`,
      p.description,
      `College majors: ${p.majors.join(", ")}`,
      `Related pathways: ${p.relatedPathways.join(", ")}`,
      "",
    );
  }
  textLines.push(
    "Talk these matches over with your guidance counselor or family. Your code is a starting point for exploring, not a final answer.",
    "",
    "You asked AlignEd to email your results. We sent this once and did not keep your address.",
  );

  // --- HTML part (inline styles: email clients ignore stylesheets) ---
  const scoreRows = traits
    .map((t) => {
      const weight = code.includes(t.letter) ? "700" : "400";
      return `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e3e6ec;font-weight:700">${t.letter}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e3e6ec;font-weight:${weight}">${escapeHtml(t.label)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e3e6ec;text-align:right;font-weight:${weight}">${scores[t.trait]} / ${maxScore}</td>
    </tr>`;
    })
    .join("");

  const list = (items: readonly string[]) =>
    `<ul style="margin:4px 0 0;padding-left:18px">${items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</ul>`;

  const letterSections = code
    .map((letter) => {
      const p = RIASEC_PATHWAYS[letter];
      return `<h3 style="margin:20px 0 4px;font-size:16px">${letter}: ${escapeHtml(p.name)} <span style="color:${MUTED};font-weight:400">(${escapeHtml(labelFor(letter))})</span></h3>
      <p style="margin:0 0 8px;color:${MUTED}">${escapeHtml(p.description)}</p>
      <table role="presentation" width="100%" style="border-collapse:collapse"><tr>
        <td valign="top" width="50%"><strong>College majors</strong>${list(p.majors)}</td>
        <td valign="top" width="50%"><strong>Related pathways</strong>${list(p.relatedPathways)}</td>
      </tr></table>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#f4f5f8">
<div style="max-width:600px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${NAVY};background:#ffffff">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700">AlignEd</p>
  <p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
  <p style="margin:0">Your Holland Code</p>
  <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:2px">${codeText}</p>
  <p style="margin:0 0 20px;color:${MUTED}">${escapeHtml(codeLabels)}</p>
  <h2 style="margin:0 0 8px;font-size:16px">Your six traits</h2>
  <table role="presentation" width="100%" style="border-collapse:collapse">${scoreRows}</table>
  <h2 style="margin:24px 0 0;font-size:16px">Majors and pathways for your code</h2>
  ${letterSections}
  <p style="margin:24px 0 0;color:${MUTED};font-style:italic">Talk these matches over with your guidance counselor or family. Your code is a starting point for exploring, not a final answer.</p>
  <p style="margin:24px 0 0;font-size:12px;color:${MUTED}">You asked AlignEd to email your results. We sent this once and did not keep your address.</p>
</div>
</body></html>`;

  return {
    subject: `Your AlignEd results: ${codeText}`,
    html,
    text: textLines.join("\n"),
  };
}

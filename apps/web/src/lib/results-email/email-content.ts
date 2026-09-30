// Copyright (c) 2026 EdTech. All rights reserved.

import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import {
  GRADE_LEVELS,
  type GradeLevel,
  type RiasecLetter,
} from "@/lib/riasec/types";
import type { RiasecScores } from "@/store/useAssessmentStore";

// Server-side logic for emailing results (PRD FR-8): request validation,
// rate-limit rules, and the email itself. The email and its PDF attachment
// are built on the server from structured results (letters, numbers, a
// date), never from text the browser sends, so the route cannot be used to
// mail arbitrary content or attachments.

export interface ResultsPayload {
  nickname: string;
  gradeLevel: GradeLevel | null;
  code: [RiasecLetter, RiasecLetter, RiasecLetter];
  scores: RiasecScores;
  maxScore: number;
  // The student's local calendar date when they finished, "YYYY-MM-DD".
  // Sets the PDF password (NICKNAME + MMDDYYYY), matching the download.
  takenOn: string;
}

// "YYYY-MM-DD" to a local Date at midnight, or null if not a real date.
export function parseTakenOn(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  const real =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return real && year >= 2020 && year <= 2100 ? date : null;
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

  const gradeLevel = results.gradeLevel ?? null;
  if (gradeLevel !== null && !GRADE_LEVELS.includes(gradeLevel as GradeLevel)) {
    return { ok: false, error: "Invalid grade level." };
  }

  const takenOn = typeof results.takenOn === "string" ? results.takenOn : "";
  if (!parseTakenOn(takenOn)) {
    return { ok: false, error: "Invalid assessment date." };
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
        gradeLevel: gradeLevel as GradeLevel | null,
        code: code as [RiasecLetter, RiasecLetter, RiasecLetter],
        scores,
        maxScore,
        takenOn,
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
// The email: a short note with the locked results PDF attached. The results
// themselves stay inside the PDF, so the body never shows the Holland Code
// or scores, and never the password: only how it is made.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ResultsEmail {
  subject: string;
  html: string;
  text: string;
  attachmentName: string;
}

const NAVY = "#1b2a4a";
const MUTED = "#5c6475";

export function buildResultsEmail(results: ResultsPayload): ResultsEmail {
  const greeting = results.nickname ? `Hi ${results.nickname},` : "Hi,";
  const passwordHint =
    "To open it, use your password: your nickname followed by the date you took the assessment, as MMDDYYYY. For example, nickname JUAN and 5 January 2026 gives JUAN01052026.";

  const text = [
    greeting,
    "",
    "Your AlignEd results are attached as a PDF.",
    "",
    passwordHint,
    "",
    "Talk your results over with your guidance counselor or family. Your code is a starting point for exploring, not a final answer.",
    "",
    "You asked AlignEd to email your results. We sent this once and did not keep your address.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#f4f5f8">
<div style="max-width:600px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${NAVY};background:#ffffff">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700">AlignEd</p>
  <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 12px">Your AlignEd results are attached as a PDF.</p>
  <p style="margin:0 0 12px;padding:12px;background:#f1f3f7;border-radius:8px">${escapeHtml(passwordHint)}</p>
  <p style="margin:0 0 12px;color:${MUTED};font-style:italic">Talk your results over with your guidance counselor or family. Your code is a starting point for exploring, not a final answer.</p>
  <p style="margin:24px 0 0;font-size:12px;color:${MUTED}">You asked AlignEd to email your results. We sent this once and did not keep your address.</p>
</div>
</body></html>`;

  return {
    subject: "Your AlignEd results (PDF)",
    html,
    text,
    attachmentName: `AlignEd-results-${results.nickname || "student"}.pdf`,
  };
}

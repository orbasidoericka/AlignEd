// Copyright (c) 2026 EdTech. All rights reserved.

import {
  isRecord,
  validateScoredResults,
  type ScoredResults,
} from "@/lib/riasec/validate-results";
import { isResultsId } from "@/lib/saved-results/results-id";

export { parseTakenOn } from "@/lib/riasec/validate-results";

// Server-side logic for emailing results (PRD FR-8): request validation,
// rate-limit rules, and the email itself. The email and its PDF attachment
// are built on the server from structured results (letters, numbers, a
// date), never from text the browser sends, so the route cannot be used to
// mail arbitrary content or attachments.

export interface ResultsPayload extends ScoredResults {
  nickname: string;
  // The saved-results ID, printed on the PDF so the student can compare
  // later; null when the results were not saved.
  resultsId: string | null;
}

export interface SendResultsRequest {
  email: string;
  consent: true;
  // Honeypot: a hidden field people never see. Bots that fill it are
  // answered as if the email went out, and nothing is sent.
  website: string;
  results: ResultsPayload;
  // The student's career-look photo (a JPEG), when they took one.
  photo: Buffer | null;
}

export type Validation =
  | { ok: true; value: SendResultsRequest }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Largest career-look photo the route will attach, in bytes of JPEG.
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

// The photo arrives as base64. Only a real JPEG within the size limit is
// accepted, so the route cannot be used to mail arbitrary files.
export function parsePhoto(value: unknown): Buffer | null | undefined {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== "string" ||
    value.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
    return undefined;
  }
  const bytes = Buffer.from(value, "base64");
  const isJpeg =
    bytes.length > 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9;
  return isJpeg && bytes.length <= MAX_PHOTO_BYTES ? bytes : undefined;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

  const resultsId = results.resultsId ?? null;
  if (resultsId !== null && !(typeof resultsId === "string" && isResultsId(resultsId))) {
    return { ok: false, error: "Invalid results ID." };
  }

  const scored = validateScoredResults(results);
  if (!scored.ok) return scored;

  const photo = parsePhoto(body.photo);
  if (photo === undefined) return { ok: false, error: "Invalid photo." };

  return {
    ok: true,
    value: {
      email,
      consent: true,
      website,
      results: { ...scored.value, nickname, resultsId },
      photo,
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
// The email: a short note with the locked results PDF attached, and the
// career-look photo when there is one. The results themselves stay inside
// the PDF, so the body never shows the Holland Code or scores, and never
// the password: only how it is made.

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
  photoName: string;
}

const NAVY = "#1b2a4a";
const MUTED = "#5c6475";

export function buildResultsEmail(
  results: ResultsPayload,
  { withPhoto = false }: { withPhoto?: boolean } = {},
): ResultsEmail {
  const greeting = results.nickname ? `Hi ${results.nickname},` : "Hi,";
  const attached = withPhoto
    ? "Your AlignEd results are attached as a PDF, along with your career look photo."
    : "Your AlignEd results are attached as a PDF.";
  const passwordHint =
    "To open it, use your password: your nickname followed by your three-letter RIASEC code, in capital letters. For example, nickname JUAN and code S-E-C gives JUANSEC.";

  const text = [
    greeting,
    "",
    attached,
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
  <p style="margin:0 0 12px">${escapeHtml(attached)}</p>
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
    photoName: `AlignEd-career-look-${results.nickname || "student"}.jpg`,
  };
}

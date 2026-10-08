// Copyright (c) 2026 EdTech. All rights reserved.

import { photoToBase64 } from "@/lib/career-look/photo-store";
import type { HollandCode } from "@/lib/riasec/scoring";
import type { GradeLevel } from "@/lib/riasec/types";
import type { RiasecScores } from "@/store/useAssessmentStore";

// Calls the app's own /api/send-results route. Only letters, numbers, the
// nickname, grade, a date and (if the student took one) their career-look
// photo are sent: the server builds the email and its locked PDF itself,
// and never stores the address or the photo.

export type SendOutcome =
  | "sent"
  | "rate_limited"
  | "invalid"
  | "failed"
  | "not_configured";

export interface SendResultsInput {
  email: string;
  consent: boolean;
  // Honeypot field value; always "" for real students.
  website: string;
  nickname: string;
  gradeLevel: GradeLevel | null;
  code: HollandCode;
  scores: RiasecScores;
  maxScore: number;
  // When the assessment was finished; printed on the PDF.
  takenOn: Date;
  // The saved-results ID, printed on the PDF; null when not saved.
  resultsId: string | null;
  // The career-look photo to attach, a JPEG.
  photo?: Blob | null;
}

// The student's own calendar date, so the emailed PDF shows the same date
// as Download PDF, whatever the server's time zone.
function localDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export async function sendResultsEmail(
  input: SendResultsInput,
): Promise<SendOutcome> {
  let response: Response;
  try {
    const photo = input.photo ? await photoToBase64(input.photo) : undefined;
    response = await fetch("/api/send-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        consent: input.consent,
        website: input.website,
        results: {
          nickname: input.nickname,
          gradeLevel: input.gradeLevel,
          code: input.code,
          scores: input.scores,
          maxScore: input.maxScore,
          takenOn: localDate(input.takenOn),
          resultsId: input.resultsId,
        },
        photo,
      }),
    });
  } catch {
    return "failed"; // offline or the server is unreachable
  }

  if (response.ok) return "sent";
  if (response.status === 429) return "rate_limited";
  if (response.status === 400) return "invalid";
  if (response.status === 500) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (body?.error === "not_configured") return "not_configured";
  }
  return "failed";
}

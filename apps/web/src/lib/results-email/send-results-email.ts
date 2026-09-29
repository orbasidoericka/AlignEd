// Copyright (c) 2026 EdTech. All rights reserved.

import type { HollandCode } from "@/lib/riasec/scoring";
import type { RiasecScores } from "@/store/useAssessmentStore";

// Calls the app's own /api/send-results route. Only letters, numbers and
// the nickname are sent: the server builds the email itself and never
// stores the address.

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
  code: HollandCode;
  scores: RiasecScores;
  maxScore: number;
}

export async function sendResultsEmail(
  input: SendResultsInput,
): Promise<SendOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/send-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        consent: input.consent,
        website: input.website,
        results: {
          nickname: input.nickname,
          code: input.code,
          scores: input.scores,
          maxScore: input.maxScore,
        },
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

// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecLetter } from "@/lib/riasec/types";

// The results PDF opens with NICKNAME + the student's three-letter RIASEC
// code: e.g. MARI with code I-R-A gives MARIIRA. Nicknames are already
// uppercase letters and hyphens (sanitizeNickname), so the password is
// exactly what the student sees on screen.

export function resultsPdfPassword(
  nickname: string,
  code: readonly RiasecLetter[],
): string {
  return `${nickname}${code.join("")}`;
}

// The date the results were taken: completion when recorded, else the last
// save (results saved before completedAt existed), else today. Printed on
// the PDF.
export function resultsTakenOn(
  completedAt: string | null,
  lastUpdated: string | null,
): Date {
  const stored = completedAt ?? lastUpdated;
  const date = stored ? new Date(stored) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

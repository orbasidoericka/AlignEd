// Copyright (c) 2026 EdTech. All rights reserved.

// The results PDF opens with NICKNAME + MMDDYYYY, the date the student
// finished the assessment, in their own time zone: e.g. MARI09302026.
// Nicknames are already uppercase letters and hyphens (sanitizeNickname),
// so the password is exactly what the student sees on screen.

export function formatPasswordDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}${dd}${date.getFullYear()}`;
}

export function resultsPdfPassword(nickname: string, takenOn: Date): string {
  return `${nickname}${formatPasswordDate(takenOn)}`;
}

// The date the results were taken: completion when recorded, else the last
// save (results saved before completedAt existed), else today.
export function resultsTakenOn(
  completedAt: string | null,
  lastUpdated: string | null,
): Date {
  const stored = completedAt ?? lastUpdated;
  const date = stored ? new Date(stored) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

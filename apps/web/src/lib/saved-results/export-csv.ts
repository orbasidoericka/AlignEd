// Copyright (c) 2026 EdTech. All rights reserved.

import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";

import type { SavedResult } from "./repository";

// The admin export: one row per saved result, every stored field, as CSV
// that opens straight in Excel or Google Sheets. Still no names: the saved
// rows hold none.

// Excel reads a file as UTF-8 only when it starts with a byte order mark.
const BOM = "﻿";

export function resultsToCsv(results: readonly SavedResult[]): string {
  const header = [
    "Results ID",
    "Date taken",
    "Saved at (UTC)",
    "Grade",
    "Strand",
    "Age",
    "Holland code",
    ...TRAIT_ORDER.map(
      (trait) => `${RIASEC_PATHWAYS[TRAIT_META[trait].letter].name} (${TRAIT_META[trait].letter})`,
    ),
    "Max score per area",
  ];
  const rows = results.map((result) => [
    result.resultsId,
    result.takenOn,
    result.createdAt,
    result.gradeLevel ?? "",
    result.strand ?? "",
    result.age ?? "",
    result.code.join(""),
    ...TRAIT_ORDER.map((trait) => result.scores[trait]),
    result.maxScore,
  ]);
  return (
    BOM +
    [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") +
    "\r\n"
  );
}

function cell(value: string | number): string {
  let text = String(value);
  // A spreadsheet runs a cell that starts with one of these as a formula.
  // Stored values never do, but an export should not depend on that.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

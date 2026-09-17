// Copyright (c) 2026 EdTech. All rights reserved.

import type { RiasecLetter } from "./types";

// One fill per RIASEC letter (tokens in globals.css), so a letter keeps the
// same color everywhere: the landing trait strip, the Holland Code chips, the
// radar legend, and the pathway cards.
export const letterChipStyles: Readonly<Record<RiasecLetter, string>> = {
  R: "bg-trait-r text-trait-foreground",
  I: "bg-trait-i text-trait-foreground",
  A: "bg-trait-a text-trait-foreground",
  S: "bg-trait-s text-trait-foreground",
  E: "bg-trait-e text-trait-foreground",
  C: "bg-trait-c text-trait-foreground",
};

export function letterChip(letter: RiasecLetter): string {
  return letterChipStyles[letter];
}

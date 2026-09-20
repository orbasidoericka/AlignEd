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

// The same six colors as a soft ground rather than a fill, for surfaces that
// sit behind artwork (the mascot band on the pathway cards). Tailwind cannot
// compile a class built at runtime, so these are literal like the fills above.
export const letterWashStyles: Readonly<Record<RiasecLetter, string>> = {
  R: "bg-trait-r/25 dark:bg-trait-r/35",
  I: "bg-trait-i/25 dark:bg-trait-i/35",
  A: "bg-trait-a/25 dark:bg-trait-a/35",
  S: "bg-trait-s/25 dark:bg-trait-s/35",
  E: "bg-trait-e/25 dark:bg-trait-e/35",
  C: "bg-trait-c/25 dark:bg-trait-c/35",
};

export function letterWash(letter: RiasecLetter): string {
  return letterWashStyles[letter];
}

// The same six colors as a border, to mark the top card of the pathway row.
// Literal for the same reason as the fills and washes above.
export const letterBorderStyles: Readonly<Record<RiasecLetter, string>> = {
  R: "border-trait-r",
  I: "border-trait-i",
  A: "border-trait-a",
  S: "border-trait-s",
  E: "border-trait-e",
  C: "border-trait-c",
};

export function letterBorder(letter: RiasecLetter): string {
  return letterBorderStyles[letter];
}

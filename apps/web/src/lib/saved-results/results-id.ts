// Copyright (c) 2026 EdTech. All rights reserved.

// A results ID, e.g. ALGN-7KQ2-MX9P: the only key to a saved result, so it
// works like a password. Eight random characters from 32 (no 0/O or 1/I to
// misread) give 2^40 possibilities; the lookup route is rate-limited, so
// guessing one is impractical.

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const PATTERN = /^ALGN-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;

export function generateResultsId(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  // 32 divides 256, so masking keeps every character equally likely.
  const chars = Array.from(bytes, (b) => ALPHABET[b & 31]).join("");
  return `ALGN-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function isResultsId(value: string): boolean {
  return PATTERN.test(value);
}

// What a student types, forgivingly read: any case, spaces or no dashes,
// with or without the ALGN prefix. Returns the canonical ID, or null if it
// cannot be one.
export function normalizeResultsId(input: string): string | null {
  let chars = input.toUpperCase().replace(/[\s-]/g, "");
  if (chars.startsWith("ALGN")) chars = chars.slice(4);
  if (chars.length !== 8) return null;
  const id = `ALGN-${chars.slice(0, 4)}-${chars.slice(4)}`;
  return isResultsId(id) ? id : null;
}

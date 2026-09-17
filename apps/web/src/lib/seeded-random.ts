// Copyright (c) 2026 EdTech. All rights reserved.

/**
 * Deterministic 0..1 value from integers (a small integer hash). Decorative
 * components use it for random-looking timing and placement: Math.random
 * differs between server render and hydration and breaks React purity.
 */
export function seededRandom(a: number, b: number, salt: number): number {
  let h = Math.imul(a + 0x9e37, 0x85ebca6b) ^ Math.imul(b + 0x7f4a, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x27d4eb2d) ^ Math.imul(salt, 0x165667b1);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

import { describe, expect, it, vi } from "vitest";

import type { RiasecLetter } from "@/lib/riasec/types";

import { drawEffects, EFFECT_MS, spawnEffect, THEMES } from "./effects";
import type { HandSign } from "./hand-signs";

const SIGNS: HandSign[] = ["wave", "thumbsUp", "peace", "love", "pointUp"];
const LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];
const origin = { x: 100, y: 200 };

// Records nothing; drawEffects only needs the calls to exist.
function fakeContext(): CanvasRenderingContext2D {
  return new Proxy({} as CanvasRenderingContext2D, {
    get: (target, key) =>
      key in target ? target[key as keyof typeof target] : vi.fn(),
    set: (target, key, value) => {
      (target as unknown as Record<PropertyKey, unknown>)[key] = value;
      return true;
    },
  });
}

describe("spawnEffect", () => {
  it("starts every burst at the hand", () => {
    for (const sign of SIGNS) {
      const effect = spawnEffect(sign, "R", origin, 80, 0, false);
      expect(effect.particles.length).toBeGreaterThan(0);
      expect(effect.x).toBe(origin.x);
      expect(effect.y).toBe(origin.y);
    }
  });

  it("fills the burst with the worn look's own shapes", () => {
    for (const letter of LETTERS) {
      const effect = spawnEffect("thumbsUp", letter, origin, 80, 0, false);
      const shapes = new Set(effect.particles.map((p) => p.shape));
      expect([...shapes].sort()).toEqual([...THEMES[letter].shapes].sort());
    }
  });

  it("gives each look different shapes", () => {
    const all = LETTERS.flatMap((letter) => THEMES[letter].shapes);
    expect(new Set(all).size).toBe(all.length);
  });

  it("raises the look's emblem alone for pointing up", () => {
    const effect = spawnEffect("pointUp", "E", origin, 80, 0, false);
    expect(effect.particles).toHaveLength(1);
    expect(effect.particles[0]!.shape).toBe(THEMES.E.shapes[0]);
    expect(effect.particles[0]!.vy).toBeLessThan(0);
  });

  it("under reduced motion, is one emblem that does not move", () => {
    for (const sign of SIGNS) {
      const effect = spawnEffect(sign, "I", origin, 80, 0, true);
      expect(effect.particles).toHaveLength(1);
      expect(effect.particles[0]).toMatchObject({
        shape: THEMES.I.shapes[0],
        vx: 0,
        vy: 0,
        spin: 0,
      });
    }
  });
});

describe("drawEffects", () => {
  it("draws every shape, keeps an effect while it runs and drops it after", () => {
    const ctx = fakeContext();
    for (const letter of LETTERS) {
      const effect = spawnEffect("wave", letter, origin, 80, 1000, false);
      expect(drawEffects(ctx, [effect], 1000 + EFFECT_MS / 2)).toEqual([effect]);
      expect(drawEffects(ctx, [effect], 1000 + EFFECT_MS)).toEqual([]);
    }
  });
});

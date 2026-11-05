import { describe, expect, it } from "vitest";

import {
  COOLDOWN_MS,
  countReversals,
  createSignDetector,
  HOLD_MS,
  type HandReading,
} from "./hand-signs";

const hand = (gesture: string, x = 0.5, score = 0.9): HandReading => ({
  gesture,
  score,
  at: { x, y: 0.5 },
});

// Feeds one reading every 100 ms (about every third frame at 30 fps) and
// collects every sign that fires.
function run(
  detect: ReturnType<typeof createSignDetector>,
  frames: HandReading[][],
  start = 0,
) {
  return frames.flatMap((hands, i) =>
    detect(hands, start + i * 100).map((fired) => fired.sign),
  );
}

describe("createSignDetector", () => {
  it("fires a held thumbs up once it has been held briefly", () => {
    const detect = createSignDetector();
    const frames = Array.from({ length: 6 }, () => [hand("Thumb_Up")]);
    expect(run(detect, frames)).toEqual(["thumbsUp"]);
  });

  it("does not fire on a sign flashed for less than the hold time", () => {
    const detect = createSignDetector();
    const short = Math.floor(HOLD_MS / 100);
    const frames = [
      ...Array.from({ length: short }, () => [hand("Victory")]),
      ...Array.from({ length: 6 }, () => []),
    ];
    expect(run(detect, frames)).toEqual([]);
  });

  it("ignores low-confidence readings and signs it has no effect for", () => {
    const detect = createSignDetector();
    const frames = Array.from({ length: 6 }, () => [
      hand("ILoveYou", 0.5, 0.3),
      hand("Closed_Fist"),
    ]);
    expect(run(detect, frames)).toEqual([]);
  });

  it("fires once per hold, and again only after letting go and the cooldown", () => {
    const detect = createSignDetector();
    const held = Array.from({ length: 20 }, () => [hand("Pointing_Up")]);
    expect(run(detect, held)).toEqual(["pointUp"]);

    const gap = Array.from({ length: COOLDOWN_MS / 100 }, () => []);
    const again = Array.from({ length: 6 }, () => [hand("Pointing_Up")]);
    expect(run(detect, [...gap, ...again], 2000)).toEqual(["pointUp"]);
  });

  it("reads two signs at once, one per hand", () => {
    const detect = createSignDetector();
    const frames = Array.from({ length: 6 }, () => [
      hand("Thumb_Up", 0.3),
      hand("Victory", 0.7),
    ]);
    expect(run(detect, frames).sort()).toEqual(["peace", "thumbsUp"]);
  });

  it("fires a wave when the open palm swings side to side", () => {
    const detect = createSignDetector();
    const xs = [0.4, 0.46, 0.52, 0.46, 0.4, 0.46, 0.52];
    expect(run(detect, xs.map((x) => [hand("Open_Palm", x)]))).toEqual(["wave"]);
  });

  it("does not take a still open palm for a wave", () => {
    const detect = createSignDetector();
    const xs = [0.5, 0.505, 0.5, 0.495, 0.5, 0.505, 0.5, 0.495];
    expect(run(detect, xs.map((x) => [hand("Open_Palm", x)]))).toEqual([]);
  });
});

describe("countReversals", () => {
  it("counts turns that move back at least one swing", () => {
    expect(countReversals([0, 0.1, 0, 0.1, 0])).toBe(3);
  });

  it("ignores wobbles smaller than a swing", () => {
    expect(countReversals([0, 0.1, 0.08, 0.12, 0.2])).toBe(0);
  });
});

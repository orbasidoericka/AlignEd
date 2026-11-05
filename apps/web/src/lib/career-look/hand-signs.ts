// Copyright (c) 2026 EdTech. All rights reserved.

// Turns MediaPipe gesture readings into one-off hand-sign events for the
// career look's effects. Readings arrive a few times a second and flicker
// between labels, so a sign must be held briefly to count, fires once per
// hold, and a wave is read from the open palm moving side to side.

export type HandSign = "wave" | "thumbsUp" | "peace" | "love" | "pointUp";

export interface HandReading {
  // MediaPipe's canned gesture label, e.g. "Thumb_Up", and its confidence.
  gesture: string;
  score: number;
  // Centre of the palm, normalized 0-1 image coordinates.
  at: { x: number; y: number };
}

export interface FiredSign {
  sign: HandSign;
  // Where the hand was when it fired, normalized like a reading.
  at: { x: number; y: number };
}

const HELD_SIGNS: Readonly<Record<string, HandSign>> = {
  Thumb_Up: "thumbsUp",
  Victory: "peace",
  ILoveYou: "love",
  Pointing_Up: "pointUp",
};

export const MIN_SCORE = 0.6;
// How long a sign must be held before it fires.
export const HOLD_MS = 250;
// A sign missing from this many ms of readings counts as let go.
export const RELEASE_MS = 300;
// Least time between two bursts of the same sign.
export const COOLDOWN_MS = 1500;
// A wave: the palm changes direction at least twice, each swing at least
// this share of the frame width, within the window.
export const WAVE_WINDOW_MS = 1200;
export const WAVE_SWING = 0.04;
export const WAVE_REVERSALS = 2;

interface HoldState {
  since: number;
  seen: number;
  fired: boolean;
}

export function createSignDetector() {
  const holds = new Map<HandSign, HoldState>();
  const lastFired = new Map<HandSign, number>();
  let palm: { t: number; x: number }[] = [];
  let palmSeen = -Infinity;

  const coolingDown = (sign: HandSign, now: number) =>
    now - (lastFired.get(sign) ?? -Infinity) < COOLDOWN_MS;

  return function update(
    hands: readonly HandReading[],
    now: number,
  ): FiredSign[] {
    const fired: FiredSign[] = [];

    // Held signs.
    const present = new Map<HandSign, HandReading>();
    for (const hand of hands) {
      const sign = HELD_SIGNS[hand.gesture];
      if (sign && hand.score >= MIN_SCORE && !present.has(sign)) {
        present.set(sign, hand);
      }
    }
    for (const [sign, state] of holds) {
      if (!present.has(sign) && now - state.seen > RELEASE_MS) {
        holds.delete(sign);
      }
    }
    for (const [sign, hand] of present) {
      let state = holds.get(sign);
      if (!state) {
        state = { since: now, seen: now, fired: false };
        holds.set(sign, state);
      }
      state.seen = now;
      if (
        !state.fired &&
        now - state.since >= HOLD_MS &&
        !coolingDown(sign, now)
      ) {
        state.fired = true;
        lastFired.set(sign, now);
        fired.push({ sign, at: hand.at });
      }
    }

    // Wave: the open palm's side-to-side swings.
    const open = hands.find(
      (hand) => hand.gesture === "Open_Palm" && hand.score >= MIN_SCORE,
    );
    if (open) {
      palmSeen = now;
      palm.push({ t: now, x: open.at.x });
      palm = palm.filter((sample) => now - sample.t <= WAVE_WINDOW_MS);
      if (
        countReversals(palm.map((sample) => sample.x)) >= WAVE_REVERSALS &&
        !coolingDown("wave", now)
      ) {
        lastFired.set("wave", now);
        palm = [];
        fired.push({ sign: "wave", at: open.at });
      }
    } else if (now - palmSeen > RELEASE_MS) {
      palm = [];
    }

    return fired;
  };
}

// Direction changes in a run of positions, ignoring wobbles smaller than
// `swing`: the position must move back at least `swing` from the furthest
// point reached before it counts as turning round.
export function countReversals(xs: readonly number[], swing = WAVE_SWING): number {
  if (xs.length === 0) return 0;
  let direction = 0;
  let extreme = xs[0]!;
  let reversals = 0;
  for (const x of xs) {
    if (direction === 0) {
      if (Math.abs(x - extreme) >= swing) {
        direction = Math.sign(x - extreme);
        extreme = x;
      }
    } else if (direction > 0) {
      if (x > extreme) extreme = x;
      else if (extreme - x >= swing) {
        direction = -1;
        extreme = x;
        reversals++;
      }
    } else if (x < extreme) {
      extreme = x;
    } else if (x - extreme >= swing) {
      direction = 1;
      extreme = x;
      reversals++;
    }
  }
  return reversals;
}

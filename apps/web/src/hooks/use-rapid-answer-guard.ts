// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Rapid-answer guard for the RIASEC quiz. Answering a statement faster than
// the threshold (measured from the moment it appears) is a strike. Strikes 1
// and 2 warn without blocking; strike 3 blocks until the student acknowledges,
// which clears the count so the cycle can start over.

export const RAPID_ANSWER_THRESHOLD_MS = 2000;
export const RAPID_ANSWER_BLOCK_AT = 3;

export type RapidAnswerEvent = "none" | "warn" | "block";

export interface RapidAnswerResult {
  count: number;
  event: RapidAnswerEvent;
}

// Pure strike rule, kept separate from timing so it is trivially testable.
export function evaluateRapidAnswer(
  count: number,
  elapsedMs: number,
  thresholdMs: number = RAPID_ANSWER_THRESHOLD_MS,
): RapidAnswerResult {
  if (elapsedMs >= thresholdMs) return { count, event: "none" };
  const next = count + 1;
  return {
    count: next,
    event: next >= RAPID_ANSWER_BLOCK_AT ? "block" : "warn",
  };
}

interface UseRapidAnswerGuardOptions {
  /** Changes whenever a new statement is shown; restarts the timer. */
  questionKey: string;
  thresholdMs?: number;
  /** Clock in ms. Must be referentially stable (defined outside render). */
  now?: () => number;
}

const defaultNow = () => performance.now();

export function useRapidAnswerGuard({
  questionKey,
  thresholdMs = RAPID_ANSWER_THRESHOLD_MS,
  now = defaultNow,
}: UseRapidAnswerGuardOptions) {
  // Refs hold the live values so back-to-back taps inside one render never
  // read a stale count; state mirrors them for rendering.
  const shownAtRef = useRef<number | null>(null);
  const countRef = useRef(0);
  const blockedRef = useRef(false);
  const [rapidAnswerCount, setRapidAnswerCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    shownAtRef.current = now();
  }, [questionKey, now]);

  /**
   * Call once when a statement is answered. Revisions (changing an answer
   * already given, e.g. after Back) are deliberate and never count.
   */
  const recordAnswer = useCallback(
    (options?: { isRevision?: boolean }): RapidAnswerEvent => {
      const shownAt = shownAtRef.current;
      if (shownAt === null || options?.isRevision || blockedRef.current) {
        return "none";
      }
      // One measurement per statement view, so a double tap cannot strike
      // twice before auto-advance.
      shownAtRef.current = null;

      const result = evaluateRapidAnswer(
        countRef.current,
        now() - shownAt,
        thresholdMs,
      );
      if (result.count !== countRef.current) {
        countRef.current = result.count;
        setRapidAnswerCount(result.count);
      }
      if (result.event === "block") {
        blockedRef.current = true;
        setIsBlocked(true);
      }
      return result.event;
    },
    [now, thresholdMs],
  );

  /** Dismisses the block, clears strikes, and restarts the current timer. */
  const acknowledge = useCallback(() => {
    countRef.current = 0;
    blockedRef.current = false;
    setRapidAnswerCount(0);
    setIsBlocked(false);
    shownAtRef.current = now();
  }, [now]);

  return { rapidAnswerCount, isBlocked, recordAnswer, acknowledge };
}

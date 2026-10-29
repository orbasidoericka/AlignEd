// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

import { useHydrated } from "@/hooks/use-hydrated";
import { seededRandom } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/encrypted-text).
// Adapted:
// - The first frame's gibberish is seeded, not Math.random, so the server
//   render and hydration agree. Later flips run only in the effect.
// - Reduced motion shows the real text at once; gated on hydration so the
//   server and first client render still match.
// - Read once by assistive tech through an sr-only copy; the animated copy is
//   aria-hidden (upstream used role="text", which is not an ARIA role).
// - The animated copy is stacked over an invisible copy of the final text,
//   so the block keeps its final height and nothing below jumps while the
//   narrower and wider scramble glyphs reflow.
// - Frame state lives in React state rather than a ref read during render.

type EncryptedTextProps = {
  text: string;
  className?: string;
  /** Milliseconds between revealing each real character. */
  revealDelayMs?: number;
  /** Character set for the gibberish. */
  charset?: string;
  /** Milliseconds between gibberish flips for unrevealed characters. */
  flipDelayMs?: number;
  /** Class for the scrambled characters. */
  encryptedClassName?: string;
  /** Class for the revealed characters. */
  revealedClassName?: string;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function pick(charset: string, r: number): string {
  return charset.charAt(Math.floor(r * charset.length));
}

function seededScramble(text: string, charset: string): string[] {
  return text
    .split("")
    .map((ch, i) =>
      ch === " " ? " " : pick(charset, seededRandom(i, ch.charCodeAt(0), 11)),
    );
}

export function EncryptedText({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const reduceMotion = hydrated && prefersReduced === true;

  const [frame, setFrame] = useState(() => ({
    count: 0,
    chars: seededScramble(text, charset),
  }));

  useEffect(() => {
    if (!isInView || reduceMotion) return;

    let cancelled = false;
    let frameId = 0;
    const start = performance.now();
    let lastFlip = start;
    let chars = seededScramble(text, charset);

    const update = (now: number) => {
      if (cancelled) return;
      const count = Math.min(
        text.length,
        Math.floor((now - start) / Math.max(1, revealDelayMs)),
      );
      if (count < text.length && now - lastFlip >= Math.max(0, flipDelayMs)) {
        chars = chars.map((c, i) =>
          i < count || text[i] === " " ? c : pick(charset, Math.random()),
        );
        lastFlip = now;
      }
      setFrame({ count, chars });
      if (count < text.length) frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [isInView, reduceMotion, text, revealDelayMs, charset, flipDelayMs]);

  if (!text) return null;

  const revealCount = reduceMotion ? text.length : frame.count;

  return (
    <span className={cn("grid", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="invisible [grid-area:1/1]">
        {text}
      </span>
      <span ref={ref} aria-hidden className="[grid-area:1/1]">
        {text.split("").map((char, index) => {
          const isRevealed = index < revealCount;
          return (
            <span
              key={index}
              className={cn(isRevealed ? revealedClassName : encryptedClassName)}
            >
              {isRevealed || char === " " ? char : frame.chars[index]}
            </span>
          );
        })}
      </span>
    </span>
  );
}

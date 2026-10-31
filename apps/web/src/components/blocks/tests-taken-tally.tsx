// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";

import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

// The hero's lifetime "tests taken" figure: one typographic line, not a stat
// card. The digits carry a short mustard mark (DESIGN.md: mustard at full
// strength is sized for a mark, never a panel) and the label finishes the
// sentence in muted text.
//
// The number is server-rendered as real text and the count-up only mutates
// textContent afterwards, so no-JS, reduced-motion and headless renders all
// show the true figure. That is why MagicUI's NumberTicker is not reused
// here: it renders 0 on the server, which would gate the content on motion.

const format = new Intl.NumberFormat("en-US");

const COUNT_SECONDS = 1;
// Exponential ease-out: fast then settling, no bounce.
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// Counting starts at the smallest number with the same digit count, so the
// row never changes width mid-animation and the figure never reads as a
// slot machine spinning up from zero.
function countFrom(value: number): number {
  const digits = String(Math.trunc(value)).length;
  return 10 ** (digits - 1);
}

// Pointy-top hexagon, the orientation the trait emblems use. r = 10, so the
// cell is 17.32 wide and 20 tall.
const HEX_POINTS = "8.66,0 17.32,5 17.32,15 8.66,20 0,15 0,5";
// Three cells read as a tally without becoming a chart.
const HEX_CELLS = [
  { x: 0, className: "fill-primary/30" },
  { x: 19.3, className: "fill-primary/50" },
  // Green, not mustard: the mustard mark on the digits sits a few pixels
  // away, and blue and yellow never touch.
  { x: 38.6, className: "fill-stage-results" },
] as const;

export function TestsTakenTally({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const digitsRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLParagraphElement>(null);
  const inView = useInView(rowRef, { once: true, margin: "-40px" });
  const hydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const reduceMotion = hydrated && prefersReduced === true;

  useEffect(() => {
    const el = digitsRef.current;
    if (!el || !inView || reduceMotion) return;

    const from = countFrom(value);
    if (from >= value) return;

    const controls = animate(from, value, {
      duration: COUNT_SECONDS,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest) => {
        el.textContent = format.format(Math.round(latest));
      },
    });

    return () => {
      controls.stop();
      // Whatever interrupted the count, the real figure stays on screen.
      el.textContent = format.format(value);
    };
  }, [inView, reduceMotion, value]);

  return (
    <p
      ref={rowRef}
      className={cn(
        "flex items-baseline justify-center gap-2.5 sm:gap-3",
        className,
      )}
    >
      <svg
        viewBox="0 0 55.92 20"
        aria-hidden="true"
        focusable="false"
        className="h-[1.1rem] w-auto shrink-0 self-center sm:h-5"
      >
        {HEX_CELLS.map((cell) => (
          <polygon
            key={cell.x}
            points={HEX_POINTS}
            transform={`translate(${cell.x} 0)`}
            className={cell.className}
          />
        ))}
      </svg>

      {/* The size lives on the wrapper so the mark's em units resolve
          against the digits, not against the paragraph. */}
      <span className="relative isolate inline-block font-heading text-3xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-4xl">
        {/* Pale mustard on Vivid, where the digits are dark ink. Dark keeps
            mustard but as a transparency: highlight-soft stays light in both
            themes, and the page's near-white ink must never sit on it
            (DESIGN.md). */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-[-0.12em] bottom-[0.02em] -z-10 block h-[0.34em] origin-left rounded-[2px] bg-highlight-soft dark:bg-highlight/30"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.42, ease: EASE_OUT_EXPO, delay: 0.3 }}
        />
        <span ref={digitsRef}>{format.format(value)}</span>
      </span>

      <span className="text-base font-medium text-muted-foreground sm:text-lg">
        {value === 1 ? "test taken" : "tests taken"}
      </span>
    </p>
  );
}

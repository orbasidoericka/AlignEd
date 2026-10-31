// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/text-generate-effect).
// Adapted: imports framer-motion (the repo's installed motion package, behind
// the root MotionConfig) instead of adding `motion`; text takes the page's ink
// token and every type utility is a default the caller can override; renders
// a <p> so it can stand in for a paragraph (a <div> inside one is invalid
// markup); `totalDuration` fits the whole reveal into a time budget; reduced
// motion shows the words at once.

const DEFAULT_STAGGER = 0.2;

// Seconds between one word starting and the next. With `totalDuration` the
// last word finishes exactly then, however long the sentence is, so a copy
// edit can never push the reveal past its budget.
export function staggerStep(
  wordCount: number,
  duration: number,
  totalDuration?: number,
): number {
  if (totalDuration === undefined) return DEFAULT_STAGGER;
  if (wordCount < 2) return 0;
  return Math.max(0, (totalDuration - duration) / (wordCount - 1));
}

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  totalDuration,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  /** Seconds each word takes to resolve from blur. */
  duration?: number;
  /** Seconds from the first word starting to the last one resolved. */
  totalDuration?: number;
}) => {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion() === true;
  const wordsArray = words.split(" ");
  const step = staggerStep(wordsArray.length, duration, totalDuration);

  useEffect(() => {
    // The root MotionConfig only drops transform animation for reduced
    // motion; opacity and blur would still play, so the words are shown at
    // once (zero duration) rather than faded in.
    const controls = animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      reduceMotion
        ? { duration: 0 }
        : { duration: duration ? duration : 1, delay: stagger(step) },
    );
    return () => controls.stop();
  }, [animate, duration, filter, reduceMotion, step]);

  return (
    <p
      className={cn(
        "text-2xl leading-snug font-bold tracking-wide text-foreground",
        className,
      )}
    >
      <motion.span ref={scope}>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="opacity-0"
            style={{
              filter: filter ? "blur(10px)" : "none",
            }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.span>
    </p>
  );
};

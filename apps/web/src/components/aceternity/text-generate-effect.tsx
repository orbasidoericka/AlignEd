// Copyright (c) 2026 EdTech. All rights reserved.

import { cn } from "@/lib/utils";

// Vendored from Aceternity UI (ui.aceternity.com/components/text-generate-effect).
// Adapted: text takes the page's ink token and every type utility is a default
// the caller can override; renders a <p> so it can stand in for a paragraph (a
// <div> inside one is invalid markup); `totalDuration` fits the whole reveal
// into a time budget.
//
// Pure CSS, server-rendered, opacity only. Upstream started every word blurred
// and invisible and waited for framer-motion to load before showing any of
// them, so on a slow phone the hero subtitle stayed blank, and 25 blurred spans
// repainted at once when it did run. Now each word fades in on its own CSS
// delay as soon as the HTML arrives, and reduced motion (motion-safe:) shows
// the words at once.

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
  duration = 0.5,
  totalDuration,
}: {
  words: string;
  className?: string;
  /** Seconds each word takes to fade in. */
  duration?: number;
  /** Seconds from the first word starting to the last one resolved. */
  totalDuration?: number;
}) => {
  const wordsArray = words.split(" ");
  const step = staggerStep(wordsArray.length, duration, totalDuration);

  return (
    <p
      className={cn(
        "text-2xl leading-snug font-bold tracking-wide text-foreground",
        className,
      )}
    >
      {wordsArray.map((word, idx) => (
        <span
          key={word + idx}
          className="motion-safe:animate-word-in"
          style={
            {
              "--word-delay": `${Math.round(idx * step * 1000)}ms`,
              "--word-duration": `${Math.round(duration * 1000)}ms`,
            } as React.CSSProperties
          }
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
};

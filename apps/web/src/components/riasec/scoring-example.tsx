// Copyright (c) 2026 EdTech. All rights reserved.

import { Check } from "lucide-react";

import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { letterVar } from "@/lib/riasec/letter-chip-styles";
import {
  computeHollandCode,
  formatHollandCode,
  TRAIT_META,
  TRAIT_ORDER,
} from "@/lib/riasec/scoring";
import type { RiasecLetter } from "@/lib/riasec/types";
import type { RiasecScores } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// Seven statements per trait, so seven points is the most a trait can score.
export const POINTS_PER_TRAIT = 7;

// The landing page's worked example of the scoring procedure. Every figure on
// it is computed with the real scoring code (computeHollandCode), so the
// example can never disagree with what the results page would show for the
// same answers.
export function ScoringExample({
  name,
  scores,
}: {
  /** Whose scores these are, e.g. "Mika". */
  name: string;
  scores: RiasecScores;
}) {
  const code = computeHollandCode(scores);
  const tie = firstTieInCode(code, scores);

  return (
    <figure className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border bg-card p-4 shadow-bento sm:p-6">
      <figcaption className="font-heading text-lg font-bold text-foreground">
        Example: {name}&apos;s scores
      </figcaption>

      <ul className="flex flex-col gap-2.5">
        {TRAIT_ORDER.map((trait) => {
          const { letter } = TRAIT_META[trait];
          const score = scores[trait];
          const inCode = code.includes(letter);
          const traitName = RIASEC_PATHWAYS[letter].name;
          return (
            <li
              key={trait}
              data-in-code={inCode || undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-2 py-1.5",
                inCode && "bg-muted",
              )}
            >
              <TraitEmblem letter={letter} className="size-8 shrink-0" />
              {/* Name above the pips on a phone, beside them from sm, so a
                  long name ("Investigative") never pushes the row wide. */}
              <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm font-semibold text-foreground sm:w-28 sm:shrink-0 sm:text-base">
                  {traitName}
                </span>
                <Pips letter={letter} filled={score} />
              </span>
              <span
                className={cn(
                  "shrink-0 text-sm tabular-nums",
                  inCode
                    ? "font-bold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span aria-hidden>
                  {score}/{POINTS_PER_TRAIT}
                </span>
                <span className="sr-only">
                  {traitName}: {score} out of {POINTS_PER_TRAIT}
                  {inCode ? ", in the top three" : ""}
                </span>
              </span>
              {/* Non-colour cue for the top three: a check, not just a tint. */}
              <Check
                aria-hidden
                className={cn(
                  "size-4 shrink-0 text-success-strong",
                  !inCode && "invisible",
                )}
              />
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-base text-foreground">
          Top three, highest first:{" "}
          <strong className="font-heading text-xl font-extrabold tracking-wide">
            {formatHollandCode(code)}
          </strong>
        </p>
        {tie && (
          <p className="text-sm text-pretty text-muted-foreground">
            {nameOf(tie.first)} and {nameOf(tie.second)} both scored{" "}
            {tie.score}. {tie.first} comes before {tie.second} in
            R-I-A-S-E-C, so {tie.first} goes first.
          </p>
        )}
      </div>
    </figure>
  );
}

// Seven small hexagons, one per statement of the trait: filled for a Yes,
// outlined for a No. Decorative; the score beside it is the readable value.
function Pips({ letter, filled }: { letter: RiasecLetter; filled: number }) {
  return (
    <span aria-hidden className="flex shrink-0 gap-0.5 sm:gap-1">
      {Array.from({ length: POINTS_PER_TRAIT }, (_, i) => {
        const on = i < filled;
        return (
          <svg
            key={i}
            viewBox="0 0 10 11.5"
            data-filled={on || undefined}
            className="size-3 sm:size-3.5"
            style={on ? { color: letterVar(letter) } : undefined}
          >
            <polygon
              points="5,0.5 9.5,3 9.5,8.5 5,11 0.5,8.5 0.5,3"
              className={
                on
                  ? "fill-current stroke-current"
                  : "fill-none stroke-muted-foreground/45"
              }
              strokeWidth="1"
            />
          </svg>
        );
      })}
    </span>
  );
}

// The first pair of neighbours in the code with the same score: that is where
// the fixed R-I-A-S-E-C order decided the order of the letters.
function firstTieInCode(
  code: readonly RiasecLetter[],
  scores: RiasecScores,
): { first: RiasecLetter; second: RiasecLetter; score: number } | null {
  const scoreOf = (letter: RiasecLetter) =>
    scores[TRAIT_ORDER.find((t) => TRAIT_META[t].letter === letter)!];
  for (let i = 0; i < code.length - 1; i++) {
    const first = code[i]!;
    const second = code[i + 1]!;
    if (scoreOf(first) === scoreOf(second)) {
      return { first, second, score: scoreOf(first) };
    }
  }
  return null;
}

function nameOf(letter: RiasecLetter): string {
  return RIASEC_PATHWAYS[letter].name;
}

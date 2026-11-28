// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { ChevronRight } from "lucide-react";

import { PathwayCard } from "@/components/riasec/pathway-card";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { PATHWAY_NAME_FIL } from "@/lib/riasec/career-pathways-fil";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import type { RiasecLetter } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

const cardId = (letter: RiasecLetter) => `other-type-${letter.toLowerCase()}`;

// The student's other three types (ranks 4 to 6), for browsing only. Nothing
// renders until the button is pressed. Same cards as the carousel, laid out
// side by side with no carousel motion. Each card still lists every major and
// related pathway in sheet order; only the traits carry a rank.
export function OtherTypesDialog({
  letters,
  firstRank,
}: {
  letters: readonly RiasecLetter[];
  /** Rank of the first letter given, e.g. 4. */
  firstRank: number;
}) {
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL.otherTypes;
  const lang = fil ? "fil" : undefined;
  const name = (letter: RiasecLetter) =>
    fil ? PATHWAY_NAME_FIL[letter] : RIASEC_PATHWAYS[letter].name;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="h-9 rounded-full border-border bg-tag px-4 font-heading text-sm font-semibold text-tag-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground print:hidden"
          />
        }
      >
        <span lang={lang}>
          {fil ? t.button : "See the other types"}
        </span>
        <ChevronRight className="size-4" aria-hidden />
      </DialogTrigger>
      {/* The popup itself never scrolls: the inner box does, inset from the
          rounded edge, so the scrollbar sits inside the corners. The page's
          tinted ground, not white, so the white cards stand off it. */}
      <DialogContent className="gap-0 overflow-hidden bg-background p-2 sm:max-w-3xl sm:p-3 lg:max-w-7xl">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain rounded-2xl p-2 [scrollbar-width:thin] sm:p-3">
          <DialogHeader lang={lang} className="flex-row items-center gap-4 pr-10">
              {/* The three types at a glance; the cards name them. Phones
                  skip it: the title needs the width. */}
              <div aria-hidden className="hidden shrink-0 -space-x-3 sm:flex">
                {letters.map((letter) => (
                  <TraitEmblem key={letter} letter={letter} className="size-11 sm:size-12" />
                ))}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle className="text-xl sm:text-2xl">
                  {fil ? t.title : "The other RIASEC types"}
                </DialogTitle>
                <DialogDescription className="text-pretty">
                  {fil
                    ? t.description
                    : "Your fourth to sixth types. They scored lower than your code, but they can still point to things you enjoy."}
                </DialogDescription>
              </div>
            </DialogHeader>
          {/* Below lg the cards stack, so the last one sits far down: these
              jump straight to each, and stay in view while the cards scroll
              under them. From lg all three are in view. */}
          <div className="sticky -top-2 z-10 -mx-2 -my-2 bg-background px-2 py-2 sm:-top-3 sm:-mx-3 sm:px-3 lg:hidden">
            <ul lang={lang} className="flex flex-wrap gap-2">
              {letters.map((letter, index) => (
                <li key={letter}>
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(cardId(letter))
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className={cn(
                      "flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 font-heading text-xs font-semibold sm:h-9 sm:px-3.5 sm:text-sm outline-none transition-[filter,box-shadow] hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50",
                      letterChip(letter),
                    )}
                  >
                    <span className="font-bold">#{firstRank + index}</span>{" "}
                    {name(letter)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {letters.map((letter, index) => (
              <div key={letter} id={cardId(letter)} className="scroll-mt-24">
                <PathwayCard letter={letter} rank={firstRank + index} />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

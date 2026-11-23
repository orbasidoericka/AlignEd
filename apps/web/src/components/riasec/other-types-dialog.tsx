// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { ChevronRight } from "lucide-react";

import { PathwayCard } from "@/components/riasec/pathway-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import type { RiasecLetter } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";

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
          rounded edge, so the scrollbar sits inside the corners. */}
      <DialogContent className="gap-0 overflow-hidden p-2 sm:max-w-3xl sm:p-3 lg:max-w-7xl">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain rounded-2xl p-2 [scrollbar-width:thin] sm:p-3">
          <DialogHeader lang={lang} className="pr-8">
            <DialogTitle className="text-xl">
              {fil ? t.title : "The other RIASEC types"}
            </DialogTitle>
            <DialogDescription>
              {fil ? t.description : "Browse the other RIASEC types."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {letters.map((letter, index) => (
              <PathwayCard
                key={letter}
                letter={letter}
                rank={firstRank + index}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

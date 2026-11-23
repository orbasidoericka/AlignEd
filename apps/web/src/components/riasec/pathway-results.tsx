// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { PathwayCard } from "@/components/riasec/pathway-card";
import { OtherTypesDialog } from "@/components/riasec/other-types-dialog";
import { TraitCarousel } from "@/components/riasec/trait-carousel";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { PATHWAY_NAME_FIL } from "@/lib/riasec/career-pathways-fil";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import type { RiasecLetter } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

interface PathwayResultsProps {
  /** The student's Holland code, e.g. ["R", "I", "A"]. */
  topThreeLetters: readonly RiasecLetter[];
  /** The other three letters, ranks 4 to 6, for the "other types" popup. */
  otherLetters?: readonly RiasecLetter[];
  className?: string;
}

// One card per top letter, in code order, as a swipeable carousel, with a
// button below that opens the other three types (ranks 4 to 6) in a popup.
// The banner ranks the student's own traits by score. Careers are never ranked:
// every major and related pathway from the official sheet is listed as an
// equal-weight tag in the sheet's order, with no match labels or scores.
export function PathwayResults({
  topThreeLetters,
  otherLetters,
  className,
}: PathwayResultsProps) {
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL;
  const lang = fil ? "fil" : undefined;

  const slides = topThreeLetters.map((letter, index) => ({
    letter,
    name: fil ? PATHWAY_NAME_FIL[letter] : RIASEC_PATHWAYS[letter].name,
    lang,
    content: <PathwayCard letter={letter} rank={index + 1} />,
  }));

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <TraitCarousel
        slides={slides}
        label={fil ? t.carousel.label : "Your top three RIASEC types"}
        showLabel={fil ? t.carousel.show : (name) => `Show ${name}`}
        slideLabel={
          fil ? t.carousel.slideOf : (position, total) => `${position} of ${total}`
        }
        className="w-full"
      />
      {otherLetters && otherLetters.length > 0 && (
        <OtherTypesDialog
          letters={otherLetters}
          firstRank={topThreeLetters.length + 1}
        />
      )}
    </div>
  );
}

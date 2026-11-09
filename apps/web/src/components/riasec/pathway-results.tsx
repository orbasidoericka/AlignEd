// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { TraitMascot } from "@/components/riasec/trait-mascot";
import { pathwaysForCode } from "@/lib/riasec/career-pathways";
import {
  PATHWAY_DESCRIPTION_FIL,
  PATHWAY_MAJORS_FIL,
  PATHWAY_NAME_FIL,
  PATHWAY_RELATED_FIL,
} from "@/lib/riasec/career-pathways-fil";
import { letterBorder, letterRing } from "@/lib/riasec/letter-chip-styles";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import type { RiasecLetter } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

interface PathwayResultsProps {
  /** The student's Holland code, e.g. ["R", "I", "A"]. */
  topThreeLetters: readonly RiasecLetter[];
  className?: string;
}

// Side by side, each card shares five subgrid rows (cover, title, description,
// majors, pathways), so a longer description never pushes one card's lists
// below its neighbours'. Print and mobile keep the plain stacked card.
const rowAligned = "md:row-span-5 md:grid md:grid-rows-subgrid print:block";

// One card per top letter, in code order. Every major and related pathway
// from the official sheet is listed as an equal-weight tag in the sheet's
// order: no ranks, match labels, badges, or scores (silent sorting).
export function PathwayResults({
  topThreeLetters,
  className,
}: PathwayResultsProps) {
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL;

  return (
    <BentoGrid className={cn("print:grid-cols-1", className)}>
      {pathwaysForCode(topThreeLetters).map((profile, index) => {
        // First letter of the code = the student's highest score. It carries a
        // badge and a double edge in its own trait color, but stays the same
        // size as the others: a ring is a box-shadow, so nothing shifts.
        const primary = index === 0;
        const { letter } = profile;
        return (
          <BentoGridItem
            key={letter}
            headingId={`pathway-${letter}-heading`}
            frameClassName={cn(
              rowAligned,
              primary &&
                cn("ring-1", letterBorder(letter), letterRing(letter)),
            )}
            header={<TraitMascot letter={letter} primary={primary} />}
            title={fil ? PATHWAY_NAME_FIL[letter] : profile.name}
            icon={<TraitEmblem letter={letter} className="size-8" />}
            className={cn("h-full", rowAligned)}
          >
            <p lang={fil ? "fil" : undefined} className="text-sm text-muted-foreground">
              {fil ? PATHWAY_DESCRIPTION_FIL[letter] : profile.description}
            </p>
            <TagList
              heading={fil ? t.collegeMajors : "College majors"}
              items={fil ? PATHWAY_MAJORS_FIL[letter] : profile.majors}
              lang={fil ? "fil" : undefined}
            />
            <TagList
              heading={fil ? t.relatedPathways : "Related pathways"}
              items={fil ? PATHWAY_RELATED_FIL[letter] : profile.relatedPathways}
              lang={fil ? "fil" : undefined}
            />
          </BentoGridItem>
        );
      })}
    </BentoGrid>
  );
}

// One neutral gray for both lists. The heading above each is what names it, so
// the chips carry no meaning of their own and a hue only implied a
// distinction that is not there: these are equal-weight tags either way, in
// the sheet's order, with no ranking between or within them.
function TagList({
  heading,
  items,
  lang,
}: {
  heading: string;
  items: readonly string[];
  lang?: string | undefined;
}) {
  return (
    <div lang={lang} className="flex flex-col gap-2">
      <h3 className="font-heading text-sm font-bold text-foreground">
        {heading}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full bg-tag px-3 py-1 text-sm font-medium text-tag-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

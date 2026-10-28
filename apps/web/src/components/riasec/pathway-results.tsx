// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { TraitMascot } from "@/components/riasec/trait-mascot";
import { pathwaysForCode } from "@/lib/riasec/career-pathways";
import { letterBorder, letterRing } from "@/lib/riasec/letter-chip-styles";
import type { RiasecLetter } from "@/lib/riasec/types";
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
  return (
    <BentoGrid className={cn("print:grid-cols-1", className)}>
      {pathwaysForCode(topThreeLetters).map((profile, index) => {
        // First letter of the code = the student's highest score. It carries a
        // badge and a double edge in its own trait color, but stays the same
        // size as the others: a ring is a box-shadow, so nothing shifts.
        const primary = index === 0;
        return (
          <BentoGridItem
            key={profile.letter}
            headingId={`pathway-${profile.letter}-heading`}
            frameClassName={cn(
              rowAligned,
              primary &&
                cn("ring-1", letterBorder(profile.letter), letterRing(profile.letter)),
            )}
            header={<TraitMascot letter={profile.letter} primary={primary} />}
            title={profile.name}
            icon={<TraitEmblem letter={profile.letter} className="size-8" />}
            className={cn("h-full", rowAligned)}
          >
            <p className="text-sm text-muted-foreground">
              {profile.description}
            </p>
            <TagList heading="College majors" items={profile.majors} />
            <TagList
              heading="Related pathways"
              items={profile.relatedPathways}
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
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-2">
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

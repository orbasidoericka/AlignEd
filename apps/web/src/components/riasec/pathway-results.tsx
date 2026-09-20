// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { TraitMascot } from "@/components/riasec/trait-mascot";
import { pathwaysForCode } from "@/lib/riasec/career-pathways";
import { letterBorder, letterChip } from "@/lib/riasec/letter-chip-styles";
import type { RiasecLetter } from "@/lib/riasec/types";
import { cn } from "@/lib/utils";

interface PathwayResultsProps {
  /** The student's Holland code, e.g. ["R", "I", "A"]. */
  topThreeLetters: readonly RiasecLetter[];
  className?: string;
}

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
        // badge, its own trait color as a border, and a deeper shadow, so the
        // reason it is bigger is legible rather than decorative.
        const primary = index === 0;
        return (
          <BentoGridItem
            key={profile.letter}
            headingId={`pathway-${profile.letter}-heading`}
            frameClassName={
              primary ? cn("border-2", letterBorder(profile.letter)) : ""
            }
            header={<TraitMascot letter={profile.letter} primary={primary} />}
            title={profile.name}
            icon={
              <span
                aria-hidden
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg font-heading text-base font-extrabold",
                  letterChip(profile.letter),
                )}
              >
                {profile.letter}
              </span>
            }
            className={cn(
              "h-full",
              primary && "shadow-[var(--shadow-bento-lifted)]",
            )}
          >
            <p className="text-sm text-muted-foreground">
              {profile.description}
            </p>
            <TagList
              heading="College majors"
              items={profile.majors}
              tone="muted"
            />
            <TagList
              heading="Related pathways"
              items={profile.relatedPathways}
              tone="accent"
            />
          </BentoGridItem>
        );
      })}
    </BentoGrid>
  );
}

function TagList({
  heading,
  items,
  tone,
}: {
  heading: string;
  items: readonly string[];
  tone: "muted" | "accent";
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
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              tone === "muted"
                ? "bg-muted text-foreground"
                : "bg-accent text-accent-foreground",
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { Crown } from "lucide-react";

import { BentoGridItem } from "@/components/aceternity/bento-grid";
import { TraitEmblem } from "@/components/riasec/trait-emblem";
import { TraitMascot } from "@/components/riasec/trait-mascot";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import {
  PATHWAY_DESCRIPTION_FIL,
  PATHWAY_MAJORS_FIL,
  PATHWAY_NAME_FIL,
  PATHWAY_RELATED_FIL,
} from "@/lib/riasec/career-pathways-fil";
import {
  letterBorder,
  letterChip,
  letterGlow,
  letterRing,
} from "@/lib/riasec/letter-chip-styles";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import type { RiasecLetter } from "@/lib/riasec/types";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

const RANK_BANNER = [
  "Your top RIASEC type",
  "Your second RIASEC type",
  "Your third RIASEC type",
  "Your fourth RIASEC type",
  "Your fifth RIASEC type",
  "Your sixth RIASEC type",
] as const;

// One trait's card: rank banner, mascot cover, emblem, description, and every
// major and related pathway. Shared by the carousel and the other-types popup,
// so both look the same. Rank 1 (the student's highest score) gets the double
// edge: a ring, a box-shadow, so the card's size never shifts.
export function PathwayCard({
  letter,
  rank,
  className,
}: {
  letter: RiasecLetter;
  rank: number;
  className?: string;
}) {
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL;
  const lang = fil ? "fil" : undefined;
  const primary = rank === 1;
  const profile = RIASEC_PATHWAYS[letter];
  const name = fil ? PATHWAY_NAME_FIL[letter] : profile.name;
  return (
    <BentoGridItem
      headingId={`pathway-${letter}-heading`}
      // Solid, or the cards behind show through the frame's padding.
      frameClassName={cn(
        "bg-background",
        primary && cn("ring-1", letterBorder(letter), letterRing(letter)),
      )}
      frameStyle={primary ? letterGlow(letter) : undefined}
      header={
        // Bleeds to the card edges against BentoGridItem's p-5 / sm:p-6.
        <div className="-mx-5 -mt-5 overflow-hidden rounded-t-[1.25rem] sm:-mx-6 sm:-mt-6">
          <RankBanner
            letter={letter}
            rank={rank}
            text={(fil ? t.rankBanner : RANK_BANNER)[rank - 1] ?? ""}
            lang={lang}
          />
          <TraitMascot letter={letter} primary={primary} />
        </div>
      }
      title={name}
      icon={<TraitEmblem letter={letter} className="size-8" />}
      className={cn("h-full", className)}
    >
      <p lang={lang} className="text-sm text-muted-foreground">
        {fil ? PATHWAY_DESCRIPTION_FIL[letter] : profile.description}
      </p>
      <TagList
        heading={fil ? t.collegeMajors : "College majors"}
        items={fil ? PATHWAY_MAJORS_FIL[letter] : profile.majors}
        lang={lang}
      />
      <TagList
        heading={fil ? t.relatedPathways : "Related pathways"}
        items={fil ? PATHWAY_RELATED_FIL[letter] : profile.relatedPathways}
        lang={lang}
      />
    </BentoGridItem>
  );
}

// Stated in words, not only in color: a colored edge tells a screen reader
// user nothing.
function RankBanner({
  letter,
  rank,
  text,
  lang,
}: {
  letter: RiasecLetter;
  rank: number;
  text: string;
  lang?: string | undefined;
}) {
  return (
    <p
      lang={lang}
      className={cn(
        "flex items-center gap-2 px-5 py-2 font-heading text-sm font-bold sm:px-6",
        letterChip(letter),
      )}
    >
      <span className="text-xl leading-none">#{rank}</span>
      {rank === 1 && <Crown className="size-4" aria-hidden />}
      <span>{text}</span>
    </p>
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

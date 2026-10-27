// Copyright (c) 2026 EdTech. All rights reserved.

"use client";

import { useState } from "react";
import { ChevronDown, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import { strandShortName } from "@/lib/riasec/types";
import type { SavedResult } from "@/lib/saved-results/repository";
import { cn } from "@/lib/utils";

// The admin page's latest results: a short list first, more on request.

const PAGE_SIZE = 10;

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function LatestResults({ results }: { results: SavedResult[] }) {
  const [shown, setShown] = useState(PAGE_SIZE);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <Inbox className="size-6" aria-hidden />
        No results yet.
      </div>
    );
  }
  const visible = results.slice(0, shown);
  return (
    <>
      <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="rounded-l-lg bg-muted px-3 py-2.5 font-semibold">Taken</th>
              <th scope="col" className="bg-muted px-3 py-2.5 font-semibold">Results ID</th>
              <th scope="col" className="bg-muted px-3 py-2.5 font-semibold">Code</th>
              <th scope="col" className="bg-muted px-3 py-2.5 font-semibold">Grade</th>
              <th scope="col" className="bg-muted px-3 py-2.5 font-semibold">Strand</th>
              <th scope="col" className="bg-muted px-3 py-2.5 font-semibold">Age</th>
              {TRAIT_ORDER.map((trait, i) => (
                <th
                  key={trait}
                  scope="col"
                  className={cn(
                    "bg-muted px-3 py-2.5 text-right font-semibold",
                    i === TRAIT_ORDER.length - 1 && "rounded-r-lg",
                  )}
                  title={RIASEC_PATHWAYS[TRAIT_META[trait].letter].name}
                >
                  {TRAIT_META[trait].letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((result) => (
              <tr
                key={result.resultsId}
                className="border-b border-border/60 transition-colors duration-150 last:border-0 hover:bg-muted/50"
              >
                <td className="px-3 py-3 whitespace-nowrap text-foreground">
                  {dateFormat.format(new Date(`${result.takenOn}T00:00:00`))}
                </td>
                <td className="px-3 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                  {result.resultsId}
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-1">
                    <span className="sr-only">{result.code.join("-")}</span>
                    {result.code.map((letter, i) => (
                      <span
                        key={i}
                        aria-hidden
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-xs font-extrabold",
                          letterChip(letter),
                        )}
                      >
                        {letter}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {result.gradeLevel ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                      Grade {result.gradeLevel}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not given</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {result.strand ? (
                    <span className="font-medium text-foreground" title={result.strand}>
                      {strandShortName(result.strand)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not given</span>
                  )}
                </td>
                <td className="px-3 py-3 text-foreground tabular-nums">
                  {result.age ?? <span className="text-muted-foreground">N/A</span>}
                </td>
                {TRAIT_ORDER.map((trait) => {
                  const inCode = result.code.includes(TRAIT_META[trait].letter);
                  return (
                    <td
                      key={trait}
                      className={cn(
                        "px-3 py-3 text-right tabular-nums",
                        inCode
                          ? "font-bold text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {result.scores[trait]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col items-center gap-3 border-t border-border pt-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {visible.length.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {results.length.toLocaleString()}
          </span>
        </p>
        {shown < results.length && (
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-4"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
          >
            See more
            <ChevronDown data-icon="inline-end" />
          </Button>
        )}
      </div>
    </>
  );
}

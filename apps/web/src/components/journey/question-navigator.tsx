// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, CircleAlert, LayoutGrid } from "lucide-react";

import { AnimatedCircularProgressBar } from "@/components/magic/animated-circular-progress-bar";
import { Button } from "@/components/ui/button";
import type { RiasecQuestion } from "@/lib/riasec/questions";
import { cn } from "@/lib/utils";
import type { AssessmentAnswer } from "@/store/useAssessmentStore";

// Below this many open statements the notice names every one of them; above
// it a list of numbers stops being readable, so it names the first instead.
const MAX_LISTED_OPEN = 6;
// Used for Up/Down when the grid's column count can't be read (no layout).
const FALLBACK_COLUMNS = 6;

const openList = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

type CellState = "answered" | "open";

const CELL_LABEL: Record<CellState, string> = {
  answered: "answered",
  open: "not answered",
};

interface QuestionNavigatorProps {
  questions: readonly Pick<RiasecQuestion, "id">[];
  answers: Record<string, AssessmentAnswer>;
  currentIndex: number;
  /** Set after a finish attempt with gaps: shows which statements are open. */
  flagOpen: boolean;
  /** True while the rapid-answer pause is up. */
  disabled?: boolean;
  onJump: (index: number) => void;
  onFinish: () => void;
  className?: string;
}

// Reads the live column count so Up/Down move by one visual row at every
// breakpoint (7, 14 or 6 columns).
function columnCount(list: HTMLElement | null): number {
  if (!list) return FALLBACK_COLUMNS;
  const template = getComputedStyle(list).gridTemplateColumns;
  const repeat = /repeat\((\d+)/.exec(template);
  if (repeat) return Number(repeat[1]);
  const tracks = template.split(" ").filter(Boolean).length;
  return tracks || FALLBACK_COLUMNS;
}

// Assessment progress and question map in one card (Focus Mode). The gauge
// heads it; beneath, one numbered cell per statement shows which are answered
// and jumps straight to any of them. At lg+ it sits beside the question; below
// that it sits above it and the number grid folds away behind a toggle so the
// statement keeps the screen.
export function QuestionNavigator({
  questions,
  answers,
  currentIndex,
  flagOpen,
  disabled = false,
  onJump,
  onFinish,
  className,
}: QuestionNavigatorProps) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const regionId = useId();
  const remainingId = useId();

  const total = questions.length;
  const openNumbers = questions.flatMap((question, i) =>
    question.id in answers ? [] : [i + 1],
  );
  const answeredCount = total - openNumbers.length;
  const remaining = openNumbers.length;
  const complete = remaining === 0;
  const showNotice = flagOpen && !complete;

  const jump = (index: number) => {
    // Fold the grid away on small screens so the chosen statement is in view.
    setExpanded(false);
    onJump(index);
  };

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLOListElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const from = Number(target.dataset.index);
    if (Number.isNaN(from)) return;

    const last = total - 1;
    let to: number;
    switch (event.key) {
      case "ArrowRight":
        to = Math.min(last, from + 1);
        break;
      case "ArrowLeft":
        to = Math.max(0, from - 1);
        break;
      case "ArrowDown":
        to = Math.min(last, from + columnCount(listRef.current));
        break;
      case "ArrowUp":
        to = Math.max(0, from - columnCount(listRef.current));
        break;
      case "Home":
        to = 0;
        break;
      case "End":
        to = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    cells.current[to]?.focus();
  };

  const firstOpen = openNumbers[0];
  const openDetail =
    remaining <= MAX_LISTED_OPEN
      ? `Still open: ${openList.format(openNumbers.map(String))}.`
      : `${remaining} are still open, starting with number ${firstOpen}.`;

  return (
    <section
      aria-label="Assessment progress and questions"
      className={cn(
        "flex flex-col gap-4 rounded-3xl bg-card p-3 shadow-bento ring-1 ring-border lg:p-4",
        className,
      )}
    >
      <div>
        {/* Progress (PRD FR-3.3): the circular gauge is the primary tracker. */}
        <div className="flex items-center gap-3 sm:gap-4">
          <AnimatedCircularProgressBar
            value={answeredCount}
            max={total}
            gaugePrimaryColor="var(--stage-assessment-strong)"
            gaugeSecondaryColor="color-mix(in oklab, var(--stage-assessment) 30%, transparent)"
            label="Assessment progress"
            valueText={`${answeredCount} of ${total} statements answered`}
            className="size-16 shrink-0 font-heading text-base font-bold text-stage-assessment-strong sm:size-20 sm:text-xl"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="font-heading text-sm font-bold text-stage-assessment-strong">
              Step 2 of 3
            </p>
            <p
              className="font-heading text-base font-bold whitespace-nowrap text-foreground sm:text-lg"
              aria-live="polite"
            >
              Question {currentIndex + 1} of {total}
            </p>
            <p id={remainingId} className="text-sm text-muted-foreground">
              {complete ? "All answered" : `${remaining} to go`}
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            aria-expanded={expanded}
            aria-controls={regionId}
            onClick={() => setExpanded((open) => !open)}
            className="h-11 min-w-11 shrink-0 self-center rounded-full bg-card px-0 sm:px-3 lg:hidden"
          >
            <LayoutGrid className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">All questions</span>
            <ChevronDown
              className="hidden size-4 transition-transform duration-200 group-aria-expanded/button:rotate-180 sm:block"
              aria-hidden
            />
          </Button>
        </div>

        {/* Always mounted so the notice is announced when it appears. */}
        <div role="status">
          {showNotice && (
            <div className="mt-3 flex gap-2.5 rounded-2xl border border-stage-profile-strong/40 bg-highlight px-3.5 py-3 text-sm text-highlight-foreground">
              <CircleAlert className="mt-0.5 size-4.5 shrink-0" aria-hidden />
              <p>
                <strong className="font-bold">
                  Answer every statement to finish.
                </strong>{" "}
                {openDetail}
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        id={regionId}
        className={cn(
          "flex-col gap-4 border-t border-border pt-4 lg:flex",
          expanded ? "flex" : "hidden",
        )}
      >
        <nav aria-label="Question navigator">
          <ol
            ref={listRef}
            onKeyDown={handleGridKeyDown}
            className="grid grid-cols-7 gap-1.5 sm:grid-cols-14 lg:grid-cols-6"
          >
            {questions.map((question, i) => {
              const answered = question.id in answers;
              const state: CellState = answered ? "answered" : "open";
              const current = i === currentIndex;
              return (
                <li key={question.id}>
                  <button
                    ref={(node) => {
                      cells.current[i] = node;
                    }}
                    type="button"
                    data-index={i}
                    data-state={state}
                    data-current={current || undefined}
                    // One tab stop for the whole grid; arrows move within it.
                    tabIndex={current ? 0 : -1}
                    aria-current={current ? "step" : undefined}
                    aria-label={`Question ${i + 1}, ${CELL_LABEL[state]}`}
                    disabled={disabled}
                    onClick={() => jump(i)}
                    className={cn(
                      "relative flex aspect-square w-full min-w-0 items-center justify-center rounded-[10px] font-sans text-sm font-bold tabular-nums transition-colors duration-150 outline-none",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      state === "open" &&
                        "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      state === "answered" &&
                        "border-2 border-success-strong bg-secondary/60 text-secondary-foreground hover:bg-secondary",
                      // Current fills in the stage blue on top of whichever
                      // border its answer state gives it.
                      current &&
                        "bg-stage-assessment text-stage-assessment-foreground hover:bg-stage-assessment/85",
                      current && state === "open" && "border-2 border-stage-assessment-strong",
                    )}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <ul
          aria-label="Legend"
          className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground"
        >
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-4 rounded-[5px] border-2 border-success-strong bg-secondary/60"
            />
            Answered
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-4 rounded-[5px] border-2 border-stage-assessment-strong bg-stage-assessment"
            />
            Current
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-4 rounded-[5px] border border-border bg-card"
            />
            Not answered
          </li>
        </ul>

        <Button
          variant={complete ? "default" : "outline"}
          size="lg"
          onClick={onFinish}
          disabled={disabled}
          aria-describedby={remainingId}
          className={cn(
            "h-11 w-full rounded-full font-heading text-base font-semibold",
            complete
              ? "bg-stage-results text-stage-results-foreground hover:bg-stage-results/85"
              : "bg-card",
          )}
        >
          Finish assessment
        </Button>
      </div>
    </section>
  );
}

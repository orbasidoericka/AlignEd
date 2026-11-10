// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useRef } from "react";
import { CircleAlert, LayoutGrid, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RiasecQuestion } from "@/lib/riasec/questions";
import { cn } from "@/lib/utils";
import type { AssessmentAnswer } from "@/store/useAssessmentStore";

// Below this many open statements the notice names every one of them; above
// it a list of numbers stops being readable, so it names the first instead.
const MAX_LISTED_OPEN = 6;
// Used for Up/Down when the grid's column count can't be read (no layout).
const FALLBACK_COLUMNS = 6;

// One notch per chunk of statements, so the bar reads as six short stretches
// instead of one long climb. 42 statements put the notches at 7/14/21/28/35.
const MILESTONE_EVERY = 7;

// The progress strip and the numbers panel's header share this height, so
// when both are on screen they line up as one row.
const BAND_HEIGHT = "h-12";

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
  /** id of the numbers panel, so the toggle can name it in aria-controls. */
  panelId: string;
  /** Closes the panel from inside it (the toggle can be a screen away). */
  onHide: () => void;
  /**
   * Whether the student has chosen to show (true) or hide (false) the
   * numbers; null while they have not chosen, which shows the panel from lg
   * and hides it below (the toggle's own default).
   */
  gridOpen: boolean | null;
  /** Placement of the progress strip in the runner's grid. */
  progressClassName?: string;
  /** Placement of the question-grid panel in the runner's grid. */
  panelClassName?: string;
  /** The QuestionGridToggle button, slotted beside the progress bar. */
  gridToggle?: React.ReactNode;
}

interface QuestionGridToggleProps {
  /** Whether the numbers are showing right now. */
  open: boolean;
  onToggle: () => void;
  /** id of the panel it shows and hides. */
  controls: string;
  disabled?: boolean;
  className?: string;
}

// Show or hide the question numbers. Icon only: the label is the accessible
// name and the tooltip. It sits in the runner beside the language switch, and
// hides only the numbers, never the language switch.
export function QuestionGridToggle({
  open,
  onToggle,
  controls,
  disabled = false,
  className,
}: QuestionGridToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              disabled={disabled}
              aria-label="All questions"
              aria-expanded={open}
              aria-controls={controls}
              onClick={onToggle}
              className={cn(
                "size-11 shrink-0 rounded-full bg-card",
                "aria-expanded:border-highlight-soft-foreground/40 aria-expanded:bg-highlight-soft aria-expanded:text-highlight-soft-foreground aria-expanded:hover:bg-highlight-soft",
                className,
              )}
            />
          }
        >
          <LayoutGrid className="size-5" aria-hidden />
        </TooltipTrigger>
        <TooltipContent>{open ? "Hide question numbers" : "All questions"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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

// Assessment progress and question map (Focus Mode), as two pieces the runner
// places on its own grid:
// - The progress strip: the question count, percent and a milestone bar,
//   straight on the page ground across the top. No card, and no "Step 2 of 3"
//   or "n to go": one count and one percent are enough numbers to read.
// - The question panel: the numbered grid (one cell per statement, jump to
//   any) and its legend, beside the statement so it never pushes it down. The
//   runner owns whether it shows (`gridOpen`, driven by QuestionGridToggle):
//   by default it is shown from lg and hidden below.
export function QuestionNavigator({
  questions,
  answers,
  currentIndex,
  flagOpen,
  disabled = false,
  onJump,
  panelId,
  onHide,
  gridOpen,
  progressClassName,
  panelClassName,
  gridToggle,
}: QuestionNavigatorProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);

  const total = questions.length;
  const openNumbers = questions.flatMap((question, i) =>
    question.id in answers ? [] : [i + 1],
  );
  const answeredCount = total - openNumbers.length;
  const remaining = openNumbers.length;
  const complete = remaining === 0;
  const showNotice = flagOpen && !complete;
  const percent = total === 0 ? 0 : Math.round((answeredCount / total) * 100);
  const milestones = Array.from(
    { length: Math.max(0, Math.ceil(total / MILESTONE_EVERY) - 1) },
    (_, k) => (k + 1) * MILESTONE_EVERY,
  );

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
    <>
      {/* Progress (PRD FR-3.3): count and percent stay in view; the bar is
          the tracker. Value is answers recorded, so Back never lowers it. */}
      <section
        aria-label="Assessment progress"
        className={cn("flex flex-col gap-2.5", progressClassName)}
      >
        <div className="flex items-center gap-3">
          {/* Fixed height (BAND_HEIGHT), the same as the numbers panel's
              header, so the two line up edge to edge when the panel is open. */}
          <div className={cn("flex min-w-0 flex-1 flex-col justify-between", BAND_HEIGHT)}>
            <div className="flex items-center gap-3">
              <p
                className="min-w-0 flex-1 font-heading text-base font-bold whitespace-nowrap text-foreground sm:text-lg"
                aria-live="polite"
              >
                Question {currentIndex + 1} of {total}
              </p>
              <p className="font-heading text-lg font-bold text-stage-assessment-strong tabular-nums sm:text-xl">
                {percent}%
              </p>
            </div>

            <div className="relative">
              <Progress
                value={answeredCount}
                max={total}
                aria-label="Assessment progress"
                aria-valuetext={`${answeredCount} of ${total} statements answered`}
                className="h-2.5 bg-stage-assessment/30"
                indicatorClassName="bg-stage-assessment-strong motion-reduce:transition-none"
              />
              {/* Decorative: gaps cut the bar into chunks of seven. The gap is
                  the page's own ground, since the bar sits on it, not on a card. */}
              {milestones.map((at) => (
                <span
                  key={at}
                  aria-hidden
                  data-milestone={at}
                  data-passed={answeredCount >= at || undefined}
                  style={{ left: `${(at / total) * 100}%` }}
                  className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-stage-assessment-soft"
                />
              ))}
            </div>
          </div>

          {/* The All-questions toggle, beside the bar rather than above the
              statement: chrome that stays put while the statement changes,
              not something that slides with it. */}
          {gridToggle}
        </div>

        {/* Always mounted so the notice is announced when it appears. */}
        <div role="status">
          {showNotice && (
            <div className="mt-1 flex gap-2.5 rounded-2xl border border-stage-profile-strong/40 bg-highlight px-3.5 py-3 text-sm text-highlight-foreground">
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
      </section>

      <section
        id={panelId}
        aria-label="All questions"
        data-grid={gridOpen ? "open" : "closed"}
        className={cn(
          "flex-col gap-4 rounded-3xl bg-card px-4 pb-4 shadow-bento ring-1 ring-border",
          gridOpen ? "flex" : "hidden",
          panelClassName,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2",
            BAND_HEIGHT,
          )}
        >
          <h2 className="font-heading text-sm font-bold text-foreground">
            All questions
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            disabled={disabled}
            aria-label="Hide question numbers"
            aria-controls={panelId}
            onClick={onHide}
            className="-mr-2 size-11 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>
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
                    onClick={() => onJump(i)}
                    className={cn(
                      "relative flex aspect-square w-full min-w-0 items-center justify-center rounded-[10px] font-sans text-sm font-bold tabular-nums transition-colors duration-150 outline-none",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      state === "open" &&
                        "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      state === "answered" &&
                        "border-2 border-success-strong bg-secondary/60 text-secondary-foreground hover:bg-secondary",
                      // Current: soft mustard tint, not a bright fill, so the
                      // marker reads as a calm highlight next to Answered's own
                      // soft-green treatment (5.9:1 light, 12:1 dark).
                      current &&
                        "border-2 border-stage-profile-strong bg-stage-profile-soft text-stage-profile-strong hover:bg-stage-profile-soft/70",
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
              className="size-4 rounded-[5px] border-2 border-stage-profile-strong bg-stage-profile-soft"
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
      </section>
    </>
  );
}

// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, CircleAlert, LayoutGrid } from "lucide-react";

import { LanguageToggle } from "@/components/journey/language-toggle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { QuestionLanguage, RiasecQuestion } from "@/lib/riasec/questions";
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
  /** Statement language pill; shown only when both props are given. */
  language?: QuestionLanguage;
  onLanguageChange?: (language: QuestionLanguage) => void;
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

// Assessment progress and question map in one card (Focus Mode). A slim
// milestone bar heads it; the numbered grid (one cell per statement, answered
// or not, jump to any) is folded away behind an "All questions" toggle at every
// width so the statement keeps the screen. A failed finish opens it on its own.
export function QuestionNavigator({
  questions,
  answers,
  currentIndex,
  flagOpen,
  disabled = false,
  onJump,
  language,
  onLanguageChange,
  className,
}: QuestionNavigatorProps) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const regionId = useId();

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

  // A failed finish names the open statements; show them in the grid too.
  // Adjusted during render, on the notice's rising edge only, so the student
  // can still fold the grid away while the notice stays up.
  const [noticeShown, setNoticeShown] = useState(false);
  if (showNotice !== noticeShown) {
    setNoticeShown(showNotice);
    if (showNotice) setExpanded(true);
  }

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
        {/* Progress (PRD FR-3.3): count and percent stay in view; the bar is
            the tracker. Value is answers recorded, so Back never lowers it. */}
        <div className="flex items-center gap-3">
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
          </div>
          <p className="font-heading text-xl font-bold text-stage-assessment-strong tabular-nums">
            {percent}%
          </p>
          <Button
            variant="outline"
            size="lg"
            disabled={disabled}
            aria-expanded={expanded}
            aria-controls={regionId}
            onClick={() => setExpanded((open) => !open)}
            className="h-11 min-w-11 shrink-0 self-center rounded-full bg-card px-0 sm:px-3"
          >
            <LayoutGrid className="size-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">All questions</span>
            <ChevronDown
              className="hidden size-4 transition-transform duration-200 group-aria-expanded/button:rotate-180 motion-reduce:transition-none sm:block"
              aria-hidden
            />
          </Button>
        </div>

        <div className="relative mt-3">
          <Progress
            value={answeredCount}
            max={total}
            aria-label="Assessment progress"
            aria-valuetext={`${answeredCount} of ${total} statements answered`}
            className="h-2 bg-stage-assessment/30"
            indicatorClassName="bg-stage-assessment-strong motion-reduce:transition-none"
          />
          {/* Decorative: gaps cut the bar into chunks of seven. */}
          {milestones.map((at) => (
            <span
              key={at}
              aria-hidden
              data-milestone={at}
              data-passed={answeredCount >= at || undefined}
              style={{ left: `${(at / total) * 100}%` }}
              className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-card"
            />
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {complete ? "All answered" : `${remaining} to go`}
          </p>
          {language && onLanguageChange && (
            <LanguageToggle
              value={language}
              onChange={onLanguageChange}
              disabled={disabled}
            />
          )}
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
          "flex-col gap-4 border-t border-border pt-4",
          expanded ? "flex" : "hidden",
        )}
      >
        <nav aria-label="Question navigator">
          <ol
            ref={listRef}
            onKeyDown={handleGridKeyDown}
            className="grid grid-cols-7 gap-1.5 sm:grid-cols-14"
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
      </div>
    </section>
  );
}

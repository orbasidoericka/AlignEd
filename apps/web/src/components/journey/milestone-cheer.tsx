// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import {
  MILESTONE_CHEERS,
  type MilestoneCheerEntry,
} from "@/lib/riasec/encouragement";
import type { QuestionLanguage } from "@/lib/riasec/questions";

const VISIBLE_MS = 4000;

interface MilestoneCheerProps {
  answeredCount: number;
  language: QuestionLanguage;
  /** True while the open-questions notice is up, so the two never stack. */
  suppressed?: boolean;
}

// A quiet pill under the progress bar at 25/50/75% answered. Absolutely
// positioned by its parent slot so it can never push the statement, and each
// milestone fires once per session: the rapid-answer guard clearing an answer
// may dip the count back under a threshold, but the cheer never replays.
export function MilestoneCheer({
  answeredCount,
  language,
  suppressed = false,
}: MilestoneCheerProps) {
  // Milestones already behind the student on arrival never fire: resuming at
  // statement 30 is not the moment to celebrate the first quarter.
  const fired = useRef<Set<number> | null>(null);
  if (fired.current === null) {
    fired.current = new Set(
      MILESTONE_CHEERS.filter((m) => m.at <= answeredCount).map((m) => m.at),
    );
  }

  const [cheer, setCheer] = useState<MilestoneCheerEntry | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unfired = MILESTONE_CHEERS.filter(
      (m) => m.at <= answeredCount && !fired.current!.has(m.at),
    );
    if (unfired.length === 0) return;
    for (const m of unfired) fired.current!.add(m.at);
    setCheer(unfired[unfired.length - 1]!);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setCheer(null), VISIBLE_MS);
  }, [answeredCount]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  return (
    // Always mounted so the cheer is announced politely when it appears; it
    // queues behind the focused statement rather than interrupting it.
    <div
      role="status"
      aria-atomic="true"
      className="pointer-events-none absolute inset-x-0 top-full flex justify-center"
    >
      <AnimatePresence>
        {cheer && !suppressed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            lang={language === "fil" ? "fil" : undefined}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold text-stage-assessment-strong shadow-chip"
          >
            <Sparkles className="size-4 shrink-0" aria-hidden />
            {language === "fil" ? cheer.fil : cheer.en}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

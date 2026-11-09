// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useState } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import { RESULTS_TEXT_FIL } from "@/lib/riasec/results-fil";
import { sessionRemainingMs, useAssessmentStore } from "@/store/useAssessmentStore";

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Tells the student how long their results stay on this device. The wipe
// itself is SessionExpiryGuard's job; this only counts down to it.
export function ResultsExpiryNote() {
  const hydrated = useHydrated();
  const lastUpdated = useAssessmentStore((state) => state.lastUpdated);
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const t = RESULTS_TEXT_FIL.expiry;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!hydrated) return;
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    // Background tabs throttle timers; catch up the moment it is visible.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated]);

  if (!hydrated) return null;
  const remaining = sessionRemainingMs(lastUpdated, now);
  if (remaining === null || remaining <= 0) return null;

  const wholeMinutes = Math.max(1, Math.ceil(remaining / 60000));

  return (
    <p
      lang={fil ? "fil" : undefined}
      className="text-sm text-muted-foreground print:hidden"
      data-print-hidden
      data-testid="results-expiry-note"
    >
      {fil ? (
        <>
          <span className="sr-only">
            {t.srPrefix} {wholeMinutes}{" "}
            {wholeMinutes === 1 ? t.srMoreMinute : t.srMoreMinutes}, {t.srSuffix}
          </span>
          <span aria-hidden="true">
            {t.visiblePrefix}{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatClock(remaining)}
            </span>{" "}
            {t.visibleSuffix}
          </span>
        </>
      ) : (
        <>
          <span className="sr-only">
            Your results stay on this device for about {wholeMinutes}{" "}
            {wholeMinutes === 1 ? "more minute" : "more minutes"}, or until you
            close this tab.
          </span>
          <span aria-hidden="true">
            Your results stay on this device for{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatClock(remaining)}
            </span>{" "}
            more, or until you close this tab.
          </span>
        </>
      )}
    </p>
  );
}

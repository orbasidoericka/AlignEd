// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect } from "react";

import { resultsTakenOn } from "@/lib/results-pdf/password";
import { QUESTIONS } from "@/lib/riasec/questions";
import { computeHollandCode, maxScorePerTrait } from "@/lib/riasec/scoring";
import { saveResults } from "@/lib/saved-results/client";
import { useAssessmentStore } from "@/store/useAssessmentStore";

// Saves one row to saved_results per session (scores, code, grade, strand,
// age, date; no name), silently and with no UI. The row exists only for the
// admin stats page (PRD FR-9, FR-10, BACKEND.md) — students never see a
// results ID or a way to delete it.

// One save per session even when React runs effects twice (StrictMode) or
// this remounts mid-request.
let pendingSave: Promise<void> | null = null;

export function SavedResultsPanel() {
  useEffect(() => {
    const { resultsId } = useAssessmentStore.getState();
    if (resultsId) return;
    pendingSave ??= (async () => {
      const store = useAssessmentStore.getState();
      const outcome = await saveResults({
        gradeLevel: store.profile.gradeLevel,
        strand: store.profile.strand,
        age: store.profile.age,
        code: computeHollandCode(store.scores),
        scores: store.scores,
        maxScore: maxScorePerTrait(QUESTIONS),
        takenOn: resultsTakenOn(store.completedAt, store.lastUpdated),
      });
      if (outcome.ok) store.setResultsId(outcome.value);
    })().finally(() => {
      pendingSave = null;
    });
  }, []);

  return null;
}

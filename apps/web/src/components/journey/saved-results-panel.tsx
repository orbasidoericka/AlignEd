// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { resultsTakenOn } from "@/lib/results-pdf/password";
import { QUESTIONS } from "@/lib/riasec/questions";
import { computeHollandCode, maxScorePerTrait } from "@/lib/riasec/scoring";
import {
  deleteSavedResult,
  saveResults,
  type SavedResultsError,
} from "@/lib/saved-results/client";
import { useAssessmentStore } from "@/store/useAssessmentStore";

// Saved results: on reaching Results the scores, code, grade, strand, age
// and date are saved once, with no name, and the student gets a results ID
// as a record of this result. Hidden entirely when the server has no
// database configured.

type SaveState =
  | { kind: "deleted" }
  | { kind: "saving" }
  | { kind: "failed" }
  | { kind: "unavailable" }
  | { kind: "saved" };

// One save per session even when React runs effects twice (StrictMode) or
// the panel remounts mid-request.
let pendingSave: Promise<void> | null = null;

function useSavedResultsId(): [SaveState, () => void] {
  const resultsId = useAssessmentStore((state) => state.resultsId);
  const deleted = useAssessmentStore((state) => state.resultsDeleted);
  const [state, setState] = useState<SaveState>(
    resultsId ? { kind: "saved" } : { kind: "saving" },
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const { resultsId: saved, resultsDeleted } = useAssessmentStore.getState();
    if (saved || resultsDeleted) return;
    let active = true;
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
      else throw outcome.error;
    })().finally(() => {
      pendingSave = null;
    });
    pendingSave.then(
      () => active && setState({ kind: "saved" }),
      (error: SavedResultsError) =>
        active &&
        setState({
          kind: error === "not_configured" ? "unavailable" : "failed",
        }),
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setState({ kind: "saving" });
    setAttempt((n) => n + 1);
  };
  if (deleted) return [{ kind: "deleted" }, retry];
  return [resultsId ? { kind: "saved" } : state, retry];
}

export function SavedResultsPanel() {
  const resultsId = useAssessmentStore((state) => state.resultsId);
  const [state, retry] = useSavedResultsId();

  if (state.kind === "unavailable") return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card/70 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-base font-bold text-foreground">
          Your results ID
        </h3>
        {state.kind === "deleted" && (
          <p className="text-sm text-muted-foreground" role="status">
            Your saved copy was deleted.
          </p>
        )}
        {state.kind === "saving" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
            Saving a copy of your results…
          </p>
        )}
        {state.kind === "failed" && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground" role="alert">
              We couldn&apos;t save a copy of your results.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-card"
              onClick={retry}
            >
              <RotateCcwIcon className="size-4" />
              Try again
            </Button>
          </div>
        )}
        {state.kind === "saved" && resultsId && (
          <>
            <p className="text-sm text-muted-foreground">
              Your results are saved with no name attached. This ID is also
              in your PDF.
            </p>
            <ResultsIdBox resultsId={resultsId} />
          </>
        )}
      </div>
      {state.kind === "saved" && resultsId && (
        <div className="flex flex-wrap gap-2">
          <DeleteSavedDialog resultsId={resultsId} />
        </div>
      )}
    </div>
  );
}

function ResultsIdBox({ resultsId }: { resultsId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resultsId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the ID is on screen to copy by hand.
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p
        className="font-mono text-xl font-bold tracking-wider text-foreground"
        data-testid="results-id"
      >
        {resultsId}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy results ID"}
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function DeleteSavedDialog({ resultsId }: { resultsId: string }) {
  const markDeleted = useAssessmentStore((state) => state.markResultsDeleted);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  const remove = async () => {
    setDeleting(true);
    setError(false);
    const outcome = await deleteSavedResult(resultsId);
    setDeleting(false);
    // Already gone counts as deleted.
    if (outcome.ok || outcome.error === "not_found") {
      // A deleted result is not saved again this session.
      markDeleted();
    } else {
      setError(true);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="lg" className="rounded-full" />}
      >
        <Trash2Icon className="size-4" />
        Delete saved copy
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your saved results?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes {resultsId} from AlignEd for good. Your results on
            this screen and any PDF you saved stay as they are.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm font-medium text-destructive" role="alert">
            We couldn&apos;t delete it just now. Please try again.
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" size="lg" />}>
            Keep it
          </AlertDialogClose>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => void remove()}
            disabled={deleting}
          >
            {deleting && <LoaderCircleIcon className="size-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

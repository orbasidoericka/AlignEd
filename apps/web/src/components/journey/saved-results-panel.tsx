// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  CopyIcon,
  GitCompareArrowsIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { resultsTakenOn } from "@/lib/results-pdf/password";
import { QUESTIONS } from "@/lib/riasec/questions";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import {
  computeHollandCode,
  formatHollandCode,
  maxScorePerTrait,
  TRAIT_META,
  TRAIT_ORDER,
} from "@/lib/riasec/scoring";
import {
  deleteSavedResult,
  loadSavedResult,
  saveResults,
  type SavedResultsError,
} from "@/lib/saved-results/client";
import type { SavedResult } from "@/lib/saved-results/repository";
import { normalizeResultsId } from "@/lib/saved-results/results-id";
import { cn } from "@/lib/utils";
import { useAssessmentStore } from "@/store/useAssessmentStore";

// Saved results (compare later): on reaching Results the scores, code,
// grade, age and date are saved once, with no name, and the student gets a
// results ID to compare a later retake against. Hidden entirely when the
// server has no database configured.

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
          Compare next time
        </h3>
        {state.kind === "deleted" && (
          <p className="text-sm text-muted-foreground" role="status">
            Your saved copy was deleted. You can still compare with an earlier
            results ID.
          </p>
        )}
        {state.kind === "saving" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
            Saving a copy you can compare with later…
          </p>
        )}
        {state.kind === "failed" && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground" role="alert">
              We couldn&apos;t save a copy to compare later.
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
              Your results are saved for one year, with no name attached. Keep
              this ID (it is also in your PDF) to compare when you retake the
              assessment.
            </p>
            <ResultsIdBox resultsId={resultsId} />
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <CompareDialog currentId={resultsId} />
        {state.kind === "saved" && resultsId && (
          <DeleteSavedDialog resultsId={resultsId} />
        )}
      </div>
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

const LOAD_ERRORS: Record<SavedResultsError, string> = {
  not_found:
    "No saved results match that ID. Check it and try again. Saved results are deleted after one year.",
  rate_limited: "Too many tries from here. Please wait a while and try again.",
  invalid: "That doesn't look like a results ID. It looks like ALGN-7KQ2-MX9P.",
  failed: "We couldn't load those results just now. Please try again.",
  not_configured: "Comparing isn't set up on this site yet.",
};

function CompareDialog({ currentId }: { currentId: string | null }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [past, setPast] = useState<SavedResult | null>(null);

  const load = async () => {
    const id = normalizeResultsId(input);
    if (!id) {
      setError(LOAD_ERRORS.invalid);
      return;
    }
    if (id === currentId) {
      setError("That's the ID for these results. Enter the ID from an earlier time.");
      return;
    }
    setLoading(true);
    setError(null);
    const outcome = await loadSavedResult(id);
    setLoading(false);
    if (outcome.ok) setPast(outcome.value);
    else setError(LOAD_ERRORS[outcome.error]);
  };

  const reset = (open: boolean) => {
    if (open) return;
    setInput("");
    setError(null);
    setPast(null);
    setLoading(false);
  };

  return (
    <Dialog onOpenChange={reset}>
      <DialogTrigger
        render={
          <Button variant="outline" size="lg" className="rounded-full bg-card" />
        }
      >
        <GitCompareArrowsIcon className="size-4" />
        Compare with past results
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compare with past results</DialogTitle>
          <DialogDescription>
            Enter the results ID from an earlier time you took AlignEd. You can
            find it in that results PDF.
          </DialogDescription>
        </DialogHeader>
        {past ? (
          <Comparison past={past} onBack={() => setPast(null)} />
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void load();
            }}
          >
            <label htmlFor="past-results-id" className="text-sm font-medium text-foreground">
              Results ID
            </label>
            <Input
              id="past-results-id"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="ALGN-XXXX-XXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="h-11 rounded-xl font-mono text-base uppercase"
            />
            {error && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={loading || input.trim().length === 0}
              className="self-end rounded-full"
            >
              {loading ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <GitCompareArrowsIcon className="size-4" />
              )}
              {loading ? "Loading…" : "Compare"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const longDate = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function Comparison({ past, onBack }: { past: SavedResult; onBack: () => void }) {
  const scores = useAssessmentStore((state) => state.scores);
  const code = computeHollandCode(scores);
  const pastDate = longDate.format(new Date(`${past.takenOn}T00:00:00`));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <CodeCard label={`Then · ${pastDate}`} code={formatHollandCode(past.code)} />
        <CodeCard label="Now" code={formatHollandCode(code)} highlight />
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Trait scores then and now</caption>
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="py-2 font-medium">Trait</th>
            <th scope="col" className="py-2 text-right font-medium">Then</th>
            <th scope="col" className="py-2 text-right font-medium">Now</th>
            <th scope="col" className="py-2 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {TRAIT_ORDER.map((trait) => {
            const before = past.scores[trait];
            const now = scores[trait];
            const change = now - before;
            return (
              <tr key={trait} className="border-b border-border/60 last:border-0">
                <th scope="row" className="py-2 text-left font-normal text-foreground">
                  {RIASEC_PATHWAYS[TRAIT_META[trait].letter].name}
                </th>
                <td className="py-2 text-right text-muted-foreground tabular-nums">
                  {before}
                </td>
                <td className="py-2 text-right font-semibold text-foreground tabular-nums">
                  {now}
                </td>
                <td className="py-2 text-right tabular-nums">
                  <ChangeLabel change={change} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm text-muted-foreground">
        Interests change as you grow. Talk any big shifts over with your
        guidance counselor.
      </p>
      <Button
        variant="outline"
        className="self-start rounded-full bg-card"
        onClick={onBack}
      >
        Compare a different ID
      </Button>
    </div>
  );
}

function CodeCard({
  label,
  code,
  highlight = false,
}: {
  label: string;
  code: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl p-3",
        highlight ? "bg-highlight text-highlight-foreground" : "bg-muted",
      )}
    >
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="font-mono text-xl font-bold tracking-wider">{code}</p>
    </div>
  );
}

// Direction is spelled out with an arrow and a sign, never color alone.
function ChangeLabel({ change }: { change: number }) {
  if (change === 0) return <span className="text-muted-foreground">same</span>;
  const Icon = change > 0 ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
      <Icon className="size-3.5" aria-hidden />
      {change > 0 ? `+${change}` : change}
    </span>
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
            This removes {resultsId} from AlignEd for good. You won&apos;t be
            able to compare against it later. Your results on this screen and
            any PDF you saved stay as they are.
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

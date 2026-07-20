// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DownloadIcon,
  MailIcon,
  PrinterIcon,
  RotateCcwIcon,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RiasecRadar } from "@/components/riasec/riasec-radar";
import { QUESTIONS } from "@/lib/riasec/questions";
import {
  MOCK_CAREERS,
  MOCK_PROGRAMS,
  rankByOverlap,
} from "@/lib/riasec/mock-matches";
import {
  computeHollandCode,
  formatHollandCode,
  maxScorePerTrait,
  TRAIT_META,
  traitForLetter,
} from "@/lib/riasec/scoring";
import { validateStrand, verdictCopy } from "@/lib/riasec/strand-validation";
import type { StrandVerdict } from "@/lib/riasec/strand-validation";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

const verdictStyles: Record<
  StrandVerdict,
  { badge: string; frame: string }
> = {
  aligned: {
    badge: "bg-positive-soft text-positive",
    frame: "border-positive/40",
  },
  "partially-aligned": {
    badge: "bg-stage-profile-soft text-stage-profile-strong",
    frame: "border-stage-profile/40",
  },
  misaligned: {
    badge: "bg-stage-results-soft text-stage-results-strong",
    frame: "border-stage-results/40",
  },
  "aligned-flexible": {
    badge: "bg-stage-assessment-soft text-stage-assessment-strong",
    frame: "border-stage-assessment/40",
  },
};

const letterChipStyles = [
  "bg-stage-results text-stage-results-foreground",
  "bg-stage-assessment text-stage-assessment-foreground",
  "bg-stage-profile text-stage-profile-foreground",
] as const;

// Results dashboard (PRD FR-4 to FR-9). Everything is computed client-side
// from the store; the strand matrix lives in lib/riasec, never here.
export function ResultsDashboard() {
  const router = useRouter();
  const scores = useAssessmentStore((state) => state.scores);
  const profile = useAssessmentStore((state) => state.profile);
  const resetAnswers = useAssessmentStore((state) => state.resetAnswers);

  const code = useMemo(() => computeHollandCode(scores), [scores]);
  const max = useMemo(() => maxScorePerTrait(QUESTIONS), []);
  const validation = useMemo(
    () => (profile.strand ? validateStrand(profile.strand, code) : null),
    [profile.strand, code],
  );
  const careers = useMemo(
    () => rankByOverlap(MOCK_CAREERS, code, (c) => c.title).slice(0, 6),
    [code],
  );
  const programs = useMemo(
    () => rankByOverlap(MOCK_PROGRAMS, code, (p) => p.name).slice(0, 4),
    [code],
  );

  const flatProfile = new Set(Object.values(scores)).size === 1;

  const handleRetake = () => {
    resetAnswers();
    router.push("/assessment");
  };

  return (
    <div className="flex flex-1 flex-col bg-stage-results-soft/60 print:bg-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        {/* Code hero */}
        <section className="flex flex-col items-center gap-4 text-center">
          <p
            className="font-heading text-sm font-bold text-stage-results-strong print:hidden"
            data-print-hidden
          >
            Step 3 of 3 · Your results
          </p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            You are an{" "}
            <span className="whitespace-nowrap">{formatHollandCode(code)}</span>
          </h1>
          <div className="flex gap-3" aria-hidden>
            {code.map((letter, i) => (
              <span
                key={letter}
                className={cn(
                  "flex size-16 items-center justify-center rounded-2xl font-heading text-3xl font-extrabold sm:size-20 sm:text-4xl",
                  letterChipStyles[i],
                )}
              >
                {letter}
              </span>
            ))}
          </div>
          <p className="max-w-xl text-base text-muted-foreground">
            {code
              .map((letter) => TRAIT_META[traitForLetter(letter)].label)
              .join(" · ")}
          </p>
          {flatProfile && (
            <p className="max-w-xl rounded-2xl bg-card px-4 py-3 text-sm text-foreground/80">
              Your six traits scored evenly, which means you are balanced
              across many interests. Read these results as a starting point for
              exploration rather than a final answer.
            </p>
          )}
        </section>

        {/* Trait breakdown */}
        <section className="grid gap-6 rounded-3xl border border-border bg-card p-6 sm:p-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Your six traits
            </h2>
            <RiasecRadar scores={scores} max={max} className="mt-4" />
          </div>
          <div className="flex flex-col justify-center gap-5">
            {code.map((letter) => {
              const trait = traitForLetter(letter);
              return (
                <div key={letter} className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {letter}: {TRAIT_META[trait].label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {TRAIT_META[trait].blurb}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Strand verdict (headline feature) */}
        {validation && profile.strand && profile.gradeLevel && (
          <section
            className={cn(
              "flex flex-col gap-4 rounded-3xl border-2 bg-card p-6 sm:p-8",
              verdictStyles[validation.verdict].frame,
            )}
          >
            <h2 className="text-xl font-bold text-foreground">
              Does {profile.strand} fit you?
            </h2>
            <span
              className={cn(
                "w-fit rounded-full px-5 py-2 font-heading text-lg font-bold",
                verdictStyles[validation.verdict].badge,
              )}
            >
              {verdictCopy(validation, profile.gradeLevel).title}
            </span>
            {validation.strandLetters.length > 0 && (
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {profile.strand} leans on
                {validation.strandLetters.map((letter) => (
                  <span
                    key={letter}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg font-heading text-base font-bold",
                      validation.sharedLetters.includes(letter)
                        ? "bg-positive-soft text-positive"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {letter}
                  </span>
                ))}
                {validation.sharedLetters.length > 0
                  ? `and your code shares ${validation.sharedLetters.length === 1 ? "one" : "both"} of them.`
                  : "and your code shares neither."}
              </p>
            )}
            <p className="text-base text-foreground/85">
              {verdictCopy(validation, profile.gradeLevel).insight}
            </p>
          </section>
        )}

        {/* Career matches */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-foreground">
            Careers that match your code
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {careers.map(({ item, matchStrength }) => (
              <article
                key={item.title}
                className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                      matchStrength === "exact"
                        ? "bg-positive-soft text-positive"
                        : "bg-stage-results-soft text-stage-results-strong",
                    )}
                  >
                    {matchStrength === "exact" ? "Exact match" : "Strong match"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.blurb}</p>
                <p className="mt-auto flex gap-1.5" aria-label="Holland tags">
                  {item.letters.map((letter) => (
                    <span
                      key={letter}
                      className="flex size-7 items-center justify-center rounded-md bg-muted font-heading text-sm font-bold text-foreground/80"
                    >
                      {letter}
                    </span>
                  ))}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Program matches */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-foreground">
            College programs to explore
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {programs.map(({ item, matchStrength }) => (
              <article
                key={item.name}
                className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    {item.name}
                  </h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                      matchStrength === "exact"
                        ? "bg-positive-soft text-positive"
                        : "bg-stage-results-soft text-stage-results-strong",
                    )}
                  >
                    {matchStrength === "exact" ? "Exact match" : "Strong match"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.blurb}</p>
                <p className="mt-1 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {item.strandNote}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Keepsake actions */}
        <section
          className="flex flex-col gap-3 rounded-3xl bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 print:hidden"
          data-print-hidden
        >
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Keep your results
            </h2>
            <p className="text-sm text-muted-foreground">
              They live only on this device until you save them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              onClick={() => window.print()}
              className="rounded-full bg-stage-results font-heading font-semibold text-stage-results-foreground hover:bg-stage-results/85"
            >
              <DownloadIcon className="size-4" />
              Download PDF
            </Button>
            <EmailResultsDialog />
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="outline" size="lg" className="rounded-full" />
                }
              >
                <RotateCcwIcon className="size-4" />
                Retake assessment
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retake the assessment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears your answers and current results. Your grade
                    level and strand are kept, and you can retake the quiz
                    right away.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogClose
                    render={<Button variant="outline" size="lg" />}
                  >
                    Keep my results
                  </AlertDialogClose>
                  <AlertDialogClose
                    render={
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={handleRetake}
                      />
                    }
                  >
                    Clear and retake
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        <p className="hidden text-center text-xs text-muted-foreground print:block">
          AlignEd results · generated {new Date().toLocaleDateString("en-PH")} ·
          aligned.example
        </p>
      </div>
    </div>
  );
}

// Email export stub (PRD FR-9): full dialog UX with validation + consent, but
// the send path ships with the send-results Edge Function phase.
function EmailResultsDialog() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" size="lg" className="rounded-full" />}
      >
        <MailIcon className="size-4" />
        Email me my results
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email my results</DialogTitle>
          <DialogDescription>
            We send one copy and immediately discard your address. Nothing
            about you is stored.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="results-email"
              className="text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="results-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-invalid={email.length > 0 && !emailValid}
              className="h-11 rounded-xl text-base"
            />
            {email.length > 0 && !emailValid && (
              <p className="text-sm font-medium text-destructive" role="alert">
                Enter a valid email address.
              </p>
            )}
          </div>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <Checkbox
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              className="mt-0.5"
            />
            <span>
              I consent to AlignEd sending my results to this address once, in
              line with the Data Privacy Act of 2012. My address is not stored.
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button
            size="lg"
            disabled
            className="rounded-full"
            title="Email delivery arrives with the next release"
          >
            <PrinterIcon className="size-4" />
            Sending arrives soon
          </Button>
        </DialogFooter>
        <p className="text-xs text-muted-foreground">
          Email delivery is coming in the next release. For now, use Download
          PDF to keep a copy.
        </p>
      </DialogContent>
    </Dialog>
  );
}

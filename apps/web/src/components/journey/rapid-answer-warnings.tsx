// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// Rapid-answer warnings (see hooks/use-rapid-answer-guard.ts). Both use the
// always-dark notice surface with brand-blue accents so they stand apart
// from the pastel quiz in either theme.

const TOAST_ID = "rapid-answer-warning";

function CautionMark() {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base leading-none font-extrabold text-primary-foreground"
    >
      !
    </span>
  );
}

function RapidAnswerToast() {
  return (
    <div className="flex w-full items-start gap-3 rounded-2xl border border-notice-border bg-notice-surface px-4 py-3.5 text-notice-foreground shadow-xl">
      <CautionMark />
      <p className="text-sm leading-snug font-medium">
        We noticed a few very quick responses. 
        For the best results, take your time and
        answer based on your actual preferences.
      </p>
    </div>
  );
}

/** Strikes 1 and 2: non-blocking. A fixed id replaces rather than stacks. */
export function showRapidAnswerToast() {
  toast.custom(() => <RapidAnswerToast />, {
    id: TOAST_ID,
    duration: 5000,
  });
}

/** Clears a lingering toast so it never sits on top of the blocking modal. */
export function dismissRapidAnswerToast() {
  toast.dismiss(TOAST_ID);
}

interface RapidAnswerDialogProps {
  open: boolean;
  onAcknowledge: () => void;
}

/** Strike 3: blocks the quiz until acknowledged. Escape also acknowledges. */
export function RapidAnswerDialog({ open, onAcknowledge }: RapidAnswerDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onAcknowledge();
      }}
    >
      <AlertDialogContent className="items-center gap-5 border-notice-border bg-notice-surface text-center text-notice-foreground">
        <CautionMark />
        <AlertDialogHeader className="items-center gap-2">
          <AlertDialogTitle className="text-xl font-bold text-notice-foreground">
            Please Answer Carefully
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-notice-muted">
            You've been submitting answers very quickly.
            To ensure the accuracy of your results, please
            take your time with the remaining questions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogClose
          render={
            <Button
              size="lg"
              className="h-12 w-full rounded-full font-heading text-base font-semibold hover:bg-primary/85 focus-visible:ring-primary/60"
            />
          }
        >
          I&apos;ll Answer Carefully
        </AlertDialogClose>
      </AlertDialogContent>
    </AlertDialog>
  );
}

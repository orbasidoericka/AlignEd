// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface FinishDialogProps {
  open: boolean;
  submitting: boolean;
  onSeeResults: () => void;
  /** Escape, outside click and "Review my answers" all land here. */
  onReview: () => void;
}

// Opens by itself once all 42 statements are answered (PRD FR-3.6). Closing it
// any way other than "See my results" returns the student to the quiz.
export function FinishDialog({
  open,
  submitting,
  onSeeResults,
  onReview,
}: FinishDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) onReview();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="items-center gap-5 text-center"
      >
        {/* Hexi, celebrating. A plain <img>: the file carries its own CSS
            animation and prefers-reduced-motion rule. Decorative; the title
            says "All done!" in words. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image
            cannot serve SVG without dangerouslyAllowSVG, and this one has to
            keep its own animation. */}
        <img
          src="/hexi-celebrate.svg"
          alt=""
          aria-hidden
          width={800}
          height={600}
          className="h-auto w-44 shrink-0 select-none"
        />
        <div className="flex flex-col items-center gap-2">
          <DialogTitle className="text-3xl font-bold">All done!</DialogTitle>
          <DialogDescription className="text-base">
            Every answer is in. Your Holland Code is ready.
          </DialogDescription>
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <Button
            size="lg"
            onClick={onSeeResults}
            disabled={submitting}
            className="h-13 w-full rounded-full bg-stage-results px-8 font-heading text-lg font-semibold text-stage-results-foreground hover:bg-stage-results/85"
          >
            See my results
          </Button>
          <Button
            variant="ghost"
            size="lg"
            disabled={submitting}
            onClick={onReview}
            className="rounded-full"
          >
            <ArrowLeft className="size-4" />
            Review my answers
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useRef } from "react";

import { LanguageToggle } from "@/components/journey/language-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SCORING_NOTICE_EN,
  SCORING_NOTICE_FIL,
} from "@/lib/riasec/scoring-notice";
import { useAssessmentStore } from "@/store/useAssessmentStore";

interface ScoringNoticeDialogProps {
  open: boolean;
  /** The button, Escape and an outside click all land here. */
  onAcknowledge: () => void;
}

// The first thing a student meets on Profile Setup: how the code is counted,
// before any answer is asked for. The profile behind it is blurred, so there
// is nothing to read but this. Stage accent is Profile's yellow. The toggle
// sits inside because the FocusBar's own one is under the overlay.
export function ScoringNoticeDialog({
  open,
  onAcknowledge,
}: ScoringNoticeDialogProps) {
  const fil = useAssessmentStore((state) => state.language) === "fil";
  const text = fil ? SCORING_NOTICE_FIL : SCORING_NOTICE_EN;
  const acknowledgeRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onAcknowledge();
      }}
    >
      <DialogContent
        showCloseButton={false}
        ref={popupRef}
        // The button, so Enter confirms. Unless the text scrolls: the button
        // is outside the scroller, but a focus jump must never leave the
        // student looking at the middle, so then the notice takes focus.
        initialFocus={() => {
          const body = bodyRef.current;
          return body && body.scrollHeight > body.clientHeight
            ? popupRef.current
            : acknowledgeRef.current;
        }}
        overlayClassName="bg-foreground/20 supports-backdrop-filter:backdrop-blur-md"
        lang={fil ? "fil" : undefined}
        className="max-w-4xl gap-0 overflow-hidden p-0 outline-none"
      >
        <div
          ref={bodyRef}
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-5 sm:gap-7 sm:p-8"
        >
          <header className="flex items-start gap-4">
            {/* Hexi, decorative: the title carries the message. A plain <img>
              because the file animates itself and honours reduced motion. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image
              cannot serve SVG without dangerouslyAllowSVG, and this one has
              to keep its own animation. */}
            <img
              src="/hexi.svg"
              alt=""
              aria-hidden
              width={800}
              height={600}
              className="hidden h-auto w-24 shrink-0 select-none sm:block"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <DialogTitle className="text-2xl font-bold text-balance sm:text-3xl">
                {text.title}
              </DialogTitle>
              <DialogDescription className="text-base text-pretty">
                {text.subtitle}
              </DialogDescription>
            </div>
            <LanguageToggle />
          </header>

          <ol className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {text.steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                {/* The order matters here, so the step earns its number. */}
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center bg-stage-profile font-heading text-lg font-extrabold text-stage-profile-foreground [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-1 pt-1">
                  <h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="text-base text-pretty text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <p className="rounded-2xl bg-stage-profile-soft px-5 py-4 text-base text-pretty text-foreground">
            {text.note}
          </p>
        </div>

        {/* Outside the scroller, so the way forward is on screen whatever the
            screen's height or the language's length. */}
        <div className="flex justify-end border-t border-border px-5 py-5 sm:px-8 sm:py-6">
          <Button
            ref={acknowledgeRef}
            size="lg"
            onClick={onAcknowledge}
            className="h-13 w-full rounded-full bg-stage-profile px-8 font-heading text-lg font-semibold text-stage-profile-foreground hover:bg-stage-profile/85 sm:w-auto"
          >
            {text.acknowledge}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

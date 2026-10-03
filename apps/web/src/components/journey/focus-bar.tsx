// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { usePathname, useRouter } from "next/navigation";
import { CheckIcon, RotateCcw, XIcon } from "lucide-react";

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
import { Wordmark } from "@/components/blocks/wordmark";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAssessmentStore } from "@/store/useAssessmentStore";

// Minimal Focus Mode top bar: brand, autosave state, guarded exit. Exit
// attempts get a reassurance dialog instead of silent data anxiety.
export function FocusBar() {
  const router = useRouter();
  const lastUpdated = useAssessmentStore((state) => state.lastUpdated);
  // Arriving on the quiz stamps lastUpdated on its own (it restarts the
  // session TTL), so the chip waits for an answer rather than claiming a save
  // the student has not made yet.
  const answeredCount = useAssessmentStore(
    (state) => Object.keys(state.answers).length,
  );
  // False on the server and during hydration, so the persisted "Saved" chip
  // never causes a hydration mismatch.
  const hydrated = useHydrated();
  const reset = useAssessmentStore((state) => state.reset);
  // Start over belongs to the quiz only; on Profile Setup there is nothing
  // answered to discard yet, and the form already starts from scratch.
  const onAssessment = usePathname() === "/assessment";

  const saved = hydrated && lastUpdated !== null && answeredCount > 0;

  // Wipes the whole session — profile and every answer — and drops the
  // student back at the start of the journey. Irreversible, so it is gated
  // behind a confirm.
  const startOver = () => {
    reset();
    router.push("/assessment/profile");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Wordmark className="h-7" priority />

        <div className="flex items-center gap-2">
          {saved && (
            <span
              className="flex items-center gap-1 text-sm font-medium text-positive"
              role="status"
            >
              <CheckIcon className="size-4" aria-hidden />
              Saved
            </span>
          )}

          <SoundToggle />
          <ThemeToggle />

          {onAssessment && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <RotateCcw className="size-4" aria-hidden />
                <span className="sr-only sm:not-sr-only">Start over</span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start over?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This erases your profile and every answer on this device
                    and takes you back to the beginning. It cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogClose
                    render={<Button variant="outline" size="lg" />}
                  >
                    Keep my progress
                  </AlertDialogClose>
                  <AlertDialogClose
                    render={
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={startOver}
                      />
                    }
                  >
                    Start over
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Exit to home" />
              }
            >
              <XIcon />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Take a break?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your answers are saved on this device. You can come back
                  anytime and continue right where you left off.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose
                  render={<Button variant="outline" size="lg" />}
                >
                  Keep going
                </AlertDialogClose>
                <AlertDialogClose
                  render={
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => router.push("/")}
                    />
                  }
                >
                  Exit to home
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}

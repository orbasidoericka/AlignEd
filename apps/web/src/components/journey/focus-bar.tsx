// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, XIcon } from "lucide-react";

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
import { useAssessmentStore } from "@/store/useAssessmentStore";

// Minimal Focus Mode top bar: brand, autosave state, guarded exit. Exit
// attempts get a reassurance dialog instead of silent data anxiety.
export function FocusBar() {
  const router = useRouter();
  const lastUpdated = useAssessmentStore((state) => state.lastUpdated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const saved = mounted && lastUpdated !== null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <span className="font-heading text-xl font-bold tracking-tight text-foreground">
          Align<span className="text-stage-profile-strong">Ed</span>
        </span>

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
      <span className="sr-only">
        <Link href="/">AlignEd home</Link>
      </span>
    </header>
  );
}

// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useState } from "react";
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
import { useAssessmentStore } from "@/store/useAssessmentStore";

// Keepsake actions for the results dashboard (PRD FR-8): PDF via print,
// email stub, and retake. Hidden from the printed PDF.
export function ResultsActions() {
  const router = useRouter();
  const resetAnswers = useAssessmentStore((state) => state.resetAnswers);

  const handleRetake = () => {
    resetAnswers();
    router.push("/assessment");
  };

  return (
    <div
      className="flex flex-col gap-4 border-t border-highlight-foreground/15 pt-4 sm:flex-row sm:items-center sm:justify-between print:hidden"
      data-print-hidden
    >
      <div>
        <h3 className="font-heading text-base font-bold text-foreground">
          Keep your results
        </h3>
        <p className="text-sm text-muted-foreground">
          They live only on this device until you save them.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          onClick={() => window.print()}
          className="rounded-full font-heading font-semibold"
        >
          <DownloadIcon className="size-4" />
          Download PDF
        </Button>
        <EmailResultsDialog />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                size="lg"
                className="rounded-full bg-card"
              />
            }
          >
            <RotateCcwIcon className="size-4" />
            Retake assessment
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retake the assessment?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears your answers and current results. Your grade level
                is kept, and you can retake the quiz right away.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" size="lg" />}>
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
    </div>
  );
}

// Email export stub (PRD FR-8): full dialog UX with validation + consent, but
// the send path ships with the send-results Edge Function phase.
function EmailResultsDialog() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="lg" className="rounded-full bg-card" />
        }
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

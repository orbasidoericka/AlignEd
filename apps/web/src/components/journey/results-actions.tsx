// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  DownloadIcon,
  LoaderCircleIcon,
  MailIcon,
  RotateCcwIcon,
  SendIcon,
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
import { SavedResultsPanel } from "@/components/journey/saved-results-panel";
import {
  useCareerLookPhoto,
  type CareerLookPhoto,
} from "@/lib/career-look/photo-store";
import {
  sendResultsEmail,
  type SendOutcome,
} from "@/lib/results-email/send-results-email";
import { downloadResultsPdf } from "@/lib/results-pdf/download-results-pdf";
import { resultsPdfPassword, resultsTakenOn } from "@/lib/results-pdf/password";
import { QUESTIONS } from "@/lib/riasec/questions";
import { computeHollandCode, maxScorePerTrait } from "@/lib/riasec/scoring";
import { useAssessmentStore } from "@/store/useAssessmentStore";

// Keepsake actions for the results dashboard (PRD FR-8): password-protected
// PDF, email stub, and retake. Hidden from the printed page.
export function ResultsActions() {
  const router = useRouter();
  const reset = useAssessmentStore((state) => state.reset);
  const clearPhoto = useCareerLookPhoto((state) => state.setPhoto);

  const handleRetake = () => {
    reset();
    clearPhoto(null);
    router.push("/assessment/profile");
  };

  return (
    <div
      className="flex flex-col gap-4 border-t border-highlight-foreground/15 pt-4 print:hidden"
      data-print-hidden
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-base font-bold text-foreground">
            Keep your results
          </h3>
          <p className="text-sm text-muted-foreground">
            This screen clears from this device after 30 minutes. Save a PDF to
            keep everything.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadPdfDialog />
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
                  This clears your profile, answers, and current results. You
                  will start fresh from the profile setup. Note your results ID
                  first if you want to compare later.
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
      </div>
      <SavedResultsPanel />
    </div>
  );
}

// Password-protected results PDF. Built and encrypted in the browser, so
// results never leave the device. The dialog shows the password before
// downloading: the student cannot open the file without it.
function DownloadPdfDialog() {
  const profile = useAssessmentStore((state) => state.profile);
  const scores = useAssessmentStore((state) => state.scores);
  const completedAt = useAssessmentStore((state) => state.completedAt);
  const lastUpdated = useAssessmentStore((state) => state.lastUpdated);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const takenOn = resultsTakenOn(completedAt, lastUpdated);
  const resultsId = useAssessmentStore((state) => state.resultsId);
  const code = computeHollandCode(scores);
  const password = resultsPdfPassword(profile.nickname, code);

  const download = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await downloadResultsPdf({
        nickname: profile.nickname,
        gradeLevel: profile.gradeLevel,
        age: profile.age,
        school: profile.school,
        scores,
        code,
        maxScore: maxScorePerTrait(QUESTIONS),
        takenOn,
        resultsId,
        password,
      });
    } catch (error) {
      console.warn("Results PDF could not be created:", error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            size="lg"
            className="rounded-full font-heading font-semibold"
          />
        }
      >
        <DownloadIcon className="size-4" />
        Download PDF
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download your results PDF</DialogTitle>
          <DialogDescription>
            Your PDF is locked with a password, so only you can open it. Keep
            this password somewhere safe.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 rounded-2xl bg-muted p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Your password
          </p>
          <p
            className="font-mono text-2xl font-bold tracking-wider break-all text-foreground"
            data-testid="pdf-password"
          >
            {password}
          </p>
          <p className="text-sm text-muted-foreground">
            Your nickname, then your three-letter RIASEC code. Password is
            CASE-SENSITIVE.
          </p>
        </div>
        {failed && (
          <p className="text-sm font-medium text-destructive" role="alert">
            The PDF could not be created. Please try again.
          </p>
        )}
        <DialogFooter>
          <Button
            size="lg"
            onClick={download}
            disabled={busy}
            className="rounded-full"
          >
            {busy ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            {busy ? "Creating PDF…" : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EMAIL_ERRORS: Record<Exclude<SendOutcome, "sent">, string> = {
  rate_limited:
    "Too many emails have been sent from here recently. Please try again later, or use Download PDF.",
  invalid:
    "That email address couldn't be used. Please check it and try again.",
  failed:
    "We couldn't send the email just now. Please try again, or use Download PDF to keep a copy.",
  not_configured:
    "Email isn't set up on this site yet. Use Download PDF to keep a copy.",
};

// Email export (PRD FR-8): validation and consent here; the app's
// /api/send-results route emails the same password-protected PDF as
// Download PDF, plus the career-look photo if the student took one, and
// never stores the address or the photo.
function EmailResultsDialog() {
  const profile = useAssessmentStore((state) => state.profile);
  const scores = useAssessmentStore((state) => state.scores);
  const completedAt = useAssessmentStore((state) => state.completedAt);
  const lastUpdated = useAssessmentStore((state) => state.lastUpdated);
  const takenOn = resultsTakenOn(completedAt, lastUpdated);
  const resultsId = useAssessmentStore((state) => state.resultsId);
  const code = computeHollandCode(scores);
  const password = resultsPdfPassword(profile.nickname, code);
  const photo = useCareerLookPhoto((state) => state.photo);
  const [includePhoto, setIncludePhoto] = useState(true);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  // Honeypot: hidden from people and screen readers, so only bots fill it.
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<SendOutcome | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const send = async () => {
    if (!emailValid || !consent || sending) return;
    setSending(true);
    setOutcome(null);
    const result = await sendResultsEmail({
      email: email.trim(),
      consent,
      website,
      nickname: profile.nickname,
      gradeLevel: profile.gradeLevel,
      code,
      scores,
      maxScore: maxScorePerTrait(QUESTIONS),
      takenOn,
      resultsId,
      photo: includePhoto ? (photo?.blob ?? null) : null,
    });
    setSending(false);
    setOutcome(result);
  };

  // Reopening starts fresh, so a past success or error never lingers.
  const reset = (open: boolean) => {
    if (open) return;
    setOutcome(null);
    setSending(false);
  };

  return (
    <Dialog onOpenChange={reset}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="rounded-full bg-card"
          />
        }
      >
        <MailIcon className="size-4" />
        Email me my results
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email my results</DialogTitle>
          <DialogDescription>
            We email your results as a password-protected PDF. We send one copy
            and don&apos;t keep your address; to stop spam, we only keep a
            scrambled code of it for a day.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 rounded-2xl bg-muted p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Your PDF password
          </p>
          <p className="font-mono text-xl font-bold tracking-wider break-all text-foreground">
            {password}
          </p>
          <p className="text-sm text-muted-foreground">
            Your nickname, then your three-letter RIASEC code. Password is
            CASE-SENSITIVE. It isn&apos;t written in the email, so keep it
            somewhere safe.
          </p>
        </div>

        {photo && outcome !== "sent" && (
          <EmailPhotoOption
            photo={photo}
            included={includePhoto}
            onIncludedChange={setIncludePhoto}
          />
        )}

        {outcome === "sent" ? (
          <div
            className="flex items-start gap-3 rounded-2xl bg-muted p-4"
            role="status"
          >
            <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary-strong" />
            <p className="text-sm text-foreground">
              Sent! Check <strong className="break-all">{email.trim()}</strong>{" "}
              for your results PDF
              {photo && includePhoto ? " and career look photo" : ""}. It may
              take a minute, and it might land in your spam folder.
            </p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
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
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-invalid={email.length > 0 && !emailValid}
                className="h-11 rounded-xl text-base"
              />
              {email.length > 0 && !emailValid && (
                <p
                  className="text-sm font-medium text-destructive"
                  role="alert"
                >
                  Enter a valid email address.
                </p>
              )}
            </div>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              className="absolute -left-[9999px] size-px opacity-0"
            />
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
              />
              <span>
                I consent to AlignEd sending my results to this address once, in
                line with the Data Privacy Act of 2012.
              </span>
            </label>
            {outcome && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {EMAIL_ERRORS[outcome]}
              </p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                size="lg"
                disabled={!emailValid || !consent || sending}
                className="rounded-full"
              >
                {sending ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <SendIcon className="size-4" />
                )}
                {sending ? "Sending…" : "Send my results"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// The career-look photo the student took, shown so they know it goes with
// the email. On by default; unticking sends the PDF alone.
function EmailPhotoOption({
  photo,
  included,
  onIncludedChange,
}: {
  photo: CareerLookPhoto;
  included: boolean;
  onIncludedChange: (included: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-muted p-3 text-sm text-foreground">
      <Checkbox
        checked={included}
        onCheckedChange={(checked) => onIncludedChange(checked === true)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
      <img
        src={photo.url}
        alt={`Your career look photo: ${photo.caption}`}
        className="h-14 w-auto shrink-0 rounded-lg object-cover"
      />
      <span>Attach my career look photo</span>
    </label>
  );
}

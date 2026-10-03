// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// The privacy notice the PRD requires (Data Privacy Act of 2012, RA 10173).
// Discloses: client-side session data, server-side statistics record (age,
// school, RIASEC scores for admin dashboard), email route, and analytics.
// Change the code and this changes too — keep claims accurate.
export const PRIVACY_POLICY_VERSION = "v1.1";

const POLICY_SECTIONS = [
  {
    heading: "1. What we collect",
    body: [
      "AlignEd has no accounts and no logins, and never asks for your real name. To run the assessment we collect the nickname you choose, your grade level, your age, the school name if you give one, and your answers to the 42 statements.",
    ],
  },
  {
    heading: "2. Where it is kept",
    body: [
      "During your session, your profile, answers, and results are stored in your own browser on this device.",
      "When you complete the assessment, a summary record — your age, school name, and interest-area scores — is saved to a secure database. This is used solely for the program statistics described in section 4. Your nickname and your individual answers are not included in that record.",
    ],
  },
  {
    heading: "3. How long we keep it",
    body: [
      "Your on-device session erases itself after 30 minutes without activity. You can also clear it at any time with Start over. This ensures the next student on a shared device cannot see your profile or answers.",
      "The summary record in the database (age, school, scores) is kept for the duration of the program. You may request its deletion by contacting the program administrators.",
    ],
  },
  {
    heading: "4. Program statistics and who sees your results",
    body: [
      "The program administrators — the team running this service and, where applicable, school guidance staff — use the collected records to understand the overall career interests, age ranges, and school distribution of participants. This helps them improve the program and identify student needs.",
      "Administrators see age, school name, and RIASEC interest scores across all participants. No record links back to your nickname or any information that would identify you personally beyond what you chose to provide.",
    ],
  },
  {
    heading: "5. If you email your results",
    body: [
      "Emailing your results is optional and asks for your agreement separately. If you use it, your address is used once to send that one email and is never stored. We keep only a scrambled, one-way hash of it, held in memory, so that the same address cannot be used to flood the service.",
      "The attached PDF is locked with a password that is shown only to you.",
    ],
  },
  {
    heading: "6. Anonymous usage counts",
    body: [
      "If analytics is switched on for this site, we count page visits without cookies and without building a profile of you. Your nickname, answers, and results are never part of that. It only tells us which pages are used.",
    ],
  },
  {
    heading: "7. Your rights",
    body: [
      "Under the Data Privacy Act of 2012 (RA 10173) you have the right to be informed, to access your data, to correct it, and to request its deletion. For the on-device session, Start over and the 30-minute timeout handle this immediately. For the server record, contact the program administrators.",
    ],
  },
  {
    heading: "8. Agreeing",
    body: [
      "Ticking the box means you have read this notice and agree to AlignEd handling your data as described above. The assessment cannot start without it.",
    ],
  },
] as const;

interface PrivacyConsentProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  /** Shown once the student has tried to continue without agreeing. */
  showHint: boolean;
}

// Consent gate for the profile step: a checkbox the student must tick, with
// the full notice a tap away. Reading it is not forced, but it is never more
// than one click from the box being agreed to.
export function PrivacyConsent({
  accepted,
  onAcceptedChange,
  showHint,
}: PrivacyConsentProps) {
  const [open, setOpen] = useState(false);
  const invalid = showHint && !accepted;

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-5",
        invalid ? "border-destructive" : "border-border",
      )}
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <ShieldCheck className="size-5 text-stage-profile-strong" aria-hidden />
        Data privacy
      </h2>
      <p className="text-sm text-muted-foreground">
        Your session erases from this device after 30 minutes. Your age, school,
        and interest scores are recorded for program statistics. No real name or
        account needed.
      </p>

      <label className="flex items-start gap-3 text-sm text-foreground">
        <Checkbox
          checked={accepted}
          onCheckedChange={(checked) => onAcceptedChange(checked === true)}
          aria-describedby={invalid ? "privacy-hint" : undefined}
          className="mt-0.5"
        />
        <span>
          I have read and agree to the{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-sm font-semibold text-stage-profile-strong underline underline-offset-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Data Privacy Policy
          </button>
          .
        </span>
      </label>

      {invalid && (
        <p
          id="privacy-hint"
          className="text-sm font-semibold text-destructive"
          role="alert"
        >
          Agree to the Data Privacy Policy to continue.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl gap-0 p-0">
          <DialogHeader className="border-b border-border p-6 pr-14">
            <DialogTitle className="text-xl">Data Privacy Policy</DialogTitle>
            <DialogDescription>
              How AlignEd handles your data ({PRIVACY_POLICY_VERSION}). Please
              read this before you start the assessment.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[55vh] flex-col gap-5 overflow-y-auto p-6">
            {POLICY_SECTIONS.map((section) => (
              <div key={section.heading} className="flex flex-col gap-2">
                <h3 className="font-heading text-base font-bold text-foreground">
                  {section.heading}
                </h3>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm text-pretty text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <DialogFooter className="border-t border-border p-6">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            <Button
              className="rounded-full bg-stage-profile font-semibold text-stage-profile-foreground hover:bg-stage-profile/85"
              onClick={() => {
                onAcceptedChange(true);
                setOpen(false);
              }}
            >
              I agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

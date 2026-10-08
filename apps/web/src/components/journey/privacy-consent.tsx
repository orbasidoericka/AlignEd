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
// Discloses: client-side session data, the saved-results record (grade,
// age, RIASEC scores and code, date, results ID; no name, nickname, school
// or answers; kept one year; see supabase/migrations/0003 and 0004), the private
// admin page, the email route with its optional photo, and analytics.
// Change the code and this changes too — keep claims accurate.
export const PRIVACY_POLICY_VERSION = "v1.3";

type PolicyItem =
  | { type: "para"; text: string }
  | { type: "list"; items: string[] }
  | { type: "subheading"; text: string };

interface PolicySection {
  heading: string;
  items: PolicyItem[];
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    heading: "1. Who is responsible for your data?",
    items: [
      {
        type: "para",
        text: "The Personal Information Controller responsible for information processed through AlignEd is:",
      },
      {
        type: "list",
        items: [
          "Organization/School: [Full name of school, organization, or program operator]",
          "Address: [Official address]",
          "Privacy Contact / Data Protection Officer: [Name or office, if applicable]",
          "Email: [Privacy or official contact email]",
        ],
      },
      {
        type: "para",
        text: "You or your parent/legal guardian may contact us through the details above if you have questions or requests concerning your personal data.",
      },
    ],
  },
  {
    heading: "2. What information do we collect?",
    items: [
      {
        type: "para",
        text: "AlignEd does not require you to create an account or log in, and it does not ask for your full legal name.",
      },
      {
        type: "para",
        text: "To provide the career-interest assessment, we may collect:",
      },
      {
        type: "list",
        items: [
          "the nickname you choose;",
          "your age;",
          "your grade level;",
          "your school name, if requested or provided;",
          "your answers to the 42 assessment statements; and",
          "the RIASEC interest scores calculated from your answers.",
        ],
      },
      {
        type: "para",
        text: "Please do not enter your full name, home address, phone number, passwords, or other information that AlignEd does not ask for.",
      },
      {
        type: "para",
        text: "Your age and information relating to your education may be considered sensitive personal information under Philippine data-protection law and will be handled with appropriate safeguards.",
      },
    ],
  },
  {
    heading: "3. Why do we collect this information?",
    items: [
      {
        type: "para",
        text: "We process this information for the following purposes:",
      },
      { type: "subheading", text: "Providing your assessment." },
      {
        type: "para",
        text: "Your answers are used to calculate your career-interest results and show them to you.",
      },
      { type: "subheading", text: "Generating RIASEC scores." },
      {
        type: "para",
        text: "Your responses are automatically scored according to the AlignEd assessment method to determine your scores in the six RIASEC interest areas: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.",
      },
      { type: "subheading", text: "Comparing your results later." },
      {
        type: "para",
        text: "A copy of your scores is saved under a random results ID so that you can compare them with a later retake of the assessment.",
      },
      { type: "subheading", text: "Program statistics." },
      {
        type: "para",
        text: "The same saved records (grade level, age, and RIASEC scores, with no name) are used to understand the general career interests and age ranges of participants. This information helps program administrators evaluate and improve AlignEd and better understand student career-guidance needs.",
      },
      {
        type: "para",
        text: "We will not use your information for advertising, sell your personal data, or use it for purposes that are incompatible with those explained in this notice.",
      },
    ],
  },
  {
    heading: "4. How does the automated scoring work?",
    items: [
      {
        type: "para",
        text: "AlignEd automatically processes your answers to calculate your RIASEC career-interest scores.",
      },
      {
        type: "para",
        text: "Your answers contribute to scores representing different career-interest areas. These scores are then used to provide your assessment results.",
      },
      {
        type: "para",
        text: "The results are intended only as career-guidance information. They do not determine your grades, school admission, employment, disciplinary status, or eligibility for a particular course or career.",
      },
      {
        type: "para",
        text: "Your results should not be treated as a final decision about what career or course you must choose.",
      },
    ],
  },
  {
    heading: "5. Where is your information stored?",
    items: [
      { type: "subheading", text: "During your assessment" },
      {
        type: "para",
        text: "While you are completing the assessment, your nickname, age, grade level, school information, answers, and assessment results are stored locally in the browser on the device you are using.",
      },
      {
        type: "para",
        text: "This allows AlignEd to maintain your assessment session without requiring an account.",
      },
      { type: "subheading", text: "After you complete the assessment" },
      {
        type: "para",
        text: "When you reach your results, AlignEd saves a limited record to the program's secure database so you can compare your results later.",
      },
      {
        type: "list",
        items: [
          "The saved record contains: your grade level, your age, your six RIASEC interest-area scores and three-letter code, the date you took the assessment, and a random results ID (for example, ALGN-7KQ2-MX9P).",
          "It does not contain your name, nickname, school, email address, photo, or your individual answers to the 42 assessment statements.",
        ],
      },
      {
        type: "para",
        text: "Your results ID is shown on your results screen and printed in your results PDF. Anyone who has your results ID can see the scores saved under it (but nothing that names you), so keep it private like a password.",
      },
      {
        type: "para",
        text: "Even without a name, AlignEd treats these records as protected data rather than claiming that they are completely anonymous.",
      },
    ],
  },
  {
    heading: "6. Who may see the information?",
    items: [
      {
        type: "para",
        text: "Access is limited to people who need the information for the purposes described in this notice.",
      },
      {
        type: "para",
        text: "Depending on how the program is implemented, this may include:",
      },
      {
        type: "list",
        items: [
          "authorized AlignEd program administrators, through a private admin page that shows the saved records (with their results IDs) but no names;",
          "authorized school guidance personnel or designated school staff; and",
          "service providers that host or support AlignEd's technical infrastructure, where necessary.",
        ],
      },
      {
        type: "para",
        text: "These persons or service providers are expected to handle the information only for authorized purposes and subject to appropriate privacy and security measures.",
      },
      {
        type: "para",
        text: "Technical service providers used by AlignEd: [Insert relevant hosting/database/email/analytics providers, or state the appropriate classes of providers.]",
      },
      {
        type: "para",
        text: "Your nickname, school, and individual assessment answers are not included in the saved record made available to administrators.",
      },
    ],
  },
  {
    heading: "7. How long do we keep your information?",
    items: [
      { type: "subheading", text: "Information stored on your device" },
      {
        type: "para",
        text: "Your active assessment session is automatically cleared after 30 minutes of inactivity.",
      },
      {
        type: "para",
        text: "You may also delete the current session immediately by selecting Start over.",
      },
      {
        type: "para",
        text: "This is especially important when using a shared computer or school device because it helps prevent the next user from seeing your assessment information.",
      },
      { type: "subheading", text: "Saved results on the server" },
      {
        type: "para",
        text: "Your saved record (grade level, age, RIASEC scores and code, date, and results ID) is kept for one year from the day it was saved, then automatically deleted.",
      },
      {
        type: "para",
        text: "You can delete it sooner at any time by selecting Delete saved copy on your results page, or by giving your results ID to the program administrators.",
      },
      {
        type: "para",
        text: "We will not keep identifiable or potentially identifiable information longer than reasonably necessary for the purposes stated in this notice.",
      },
    ],
  },
  {
    heading: "8. If you choose to email your results",
    items: [
      {
        type: "para",
        text: "Emailing your AlignEd results is optional.",
      },
      { type: "para", text: "If you choose this feature:" },
      {
        type: "list",
        items: [
          "you will be asked separately before your email address is used;",
          "your email address will be used to send the requested results;",
          "your email address will not be added to your saved results record;",
          "if you took a career look photo, it is attached to the email unless you untick it, and it is not stored by AlignEd;",
          "AlignEd will not use your address for advertising or marketing; and",
          "the generated results PDF will be protected according to the security measures implemented by the system.",
        ],
      },
      {
        type: "para",
        text: "If AlignEd uses a temporary one-way hash of your email address to prevent repeated or abusive sending, the hash is used only for that security purpose and is not intended to recover your original email address.",
      },
      {
        type: "para",
        text: "Important: The technical description above must match how the deployed AlignEd email system actually works.",
      },
    ],
  },
  {
    heading: "9. Website usage statistics",
    items: [
      {
        type: "para",
        text: "If privacy-friendly analytics are enabled, AlignEd may collect limited information about how the website is used, such as page visits or general usage counts.",
      },
      {
        type: "para",
        text: "These analytics will not include your nickname, individual assessment answers, or RIASEC results unless expressly disclosed in an updated privacy notice and supported by an appropriate lawful basis.",
      },
      {
        type: "para",
        text: "If third-party analytics or cookies are used, AlignEd will provide any additional notice or choice required by applicable law.",
      },
    ],
  },
  {
    heading: "10. How do we protect your information?",
    items: [
      {
        type: "para",
        text: "AlignEd uses reasonable and appropriate organizational, physical, and technical safeguards designed to protect personal data against unauthorized access, disclosure, alteration, loss, or destruction.",
      },
      {
        type: "para",
        text: "Access to server-side information is restricted to authorized persons and systems that need it for legitimate program purposes.",
      },
      {
        type: "para",
        text: "No online system can guarantee absolute security, but AlignEd will take appropriate steps to reduce privacy and security risks.",
      },
    ],
  },
  {
    heading: "11. What are your privacy rights?",
    items: [
      {
        type: "para",
        text: "Under the Data Privacy Act of 2012 and applicable regulations, you may have rights concerning your personal data, including the right to:",
      },
      {
        type: "list",
        items: [
          "be informed about how your data is processed;",
          "request access to personal data held about you;",
          "request correction of inaccurate or incomplete information;",
          "object to certain types of processing where applicable;",
          "request erasure or blocking of information where legally permitted;",
          "withdraw consent where processing depends on consent, subject to the consequences explained at the time;",
          "request data portability where applicable;",
          "claim damages where provided by law; and",
          "file a complaint with the National Privacy Commission if you believe your privacy rights have been violated.",
        ],
      },
      {
        type: "para",
        text: "To exercise your rights regarding information stored by AlignEd, contact your school's Data Protection Officer or program administrators.",
      },
      {
        type: "para",
        text: "For information stored only in your current browser session, selecting Start over removes the session data from that browser. Your saved results can be deleted with Delete saved copy on your results page, or by giving your results ID to the program administrators.",
      },
    ],
  },
  {
    heading: "12. Privacy of students under 18",
    items: [
      {
        type: "para",
        text: "AlignEd may be used by students who are minors.",
      },
      {
        type: "para",
        text: "Where consent is the legal basis required for processing a minor's personal or sensitive personal information, the program or participating school will obtain the appropriate consent from a parent, legal guardian, or other person legally authorized to provide consent, where required by Philippine law and applicable school policies.",
      },
      {
        type: "para",
        text: "Students will also be given information about the processing in language appropriate to them.",
      },
      {
        type: "para",
        text: "The assessment should only be made available to minors after the school or program administrator has established the appropriate consent or other lawful basis for processing their information.",
      },
    ],
  },
  {
    heading: "13. Changes to this notice",
    items: [
      {
        type: "para",
        text: "If AlignEd materially changes how personal data is collected, used, shared, or retained, this privacy notice will be updated.",
      },
      {
        type: "para",
        text: "Where required, users and/or their parents or legal guardians will be informed before the new processing takes place.",
      },
      {
        type: "para",
        text: "The date at the top of this notice shows when it was last updated.",
      },
    ],
  },
  {
    heading: "14. Consent and acknowledgment",
    items: [
      {
        type: "para",
        text: "Before starting the assessment, please read this notice carefully.",
      },
      {
        type: "para",
        text: "Where AlignEd relies on your consent to process your information, selecting the consent box confirms that you understand the information provided and agree to the processing described in this notice.",
      },
      {
        type: "para",
        text: "For users who are minors, any parent or legal guardian consent required by the school or program must also be obtained before the assessment begins.",
      },
    ],
  },
];

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
        Your session erases from this device after 30 minutes. Your grade, age,
        and interest scores are saved for one year, with no name, so you can
        compare later and for program statistics. No real name or account
        needed.
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
                {section.items.map((item, i) => {
                  if (item.type === "subheading") {
                    return (
                      <p
                        key={i}
                        className="text-sm font-semibold text-foreground"
                      >
                        {item.text}
                      </p>
                    );
                  }
                  if (item.type === "list") {
                    return (
                      <ul
                        key={i}
                        className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground"
                      >
                        {item.items.map((li, j) => (
                          <li key={j}>{li}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p
                      key={i}
                      className="text-sm text-pretty text-muted-foreground"
                    >
                      {item.text}
                    </p>
                  );
                })}
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

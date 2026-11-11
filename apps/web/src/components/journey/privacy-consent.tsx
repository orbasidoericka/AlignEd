// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { Fragment, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PRIVACY_POLICY_SECTIONS_FIL,
  TERMS_SECTIONS_FIL,
  PRIVACY_TEXT_FIL,
} from "@/lib/riasec/privacy-fil";
import type { QuestionLanguage } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// The Terms and Conditions and Data Privacy Policy the PRD requires (Data
// Privacy Act of 2012, RA 10173), written in plain words. Lists every piece of
// data AlignEd handles: the profile and session kept on the device (see
// `partialize` in the assessment store, the sound preference and the theme),
// the saved-results record (grade, strand, age, RIASEC scores and code, date,
// results ID; no name, nickname, school or answers; see
// supabase/migrations/0003 to 0007), the site-wide tests-taken counter, the
// private admin page, the email route with its optional photo, the in-memory
// abuse limiters, and PostHog analytics.
// Change the code and this changes too: keep claims accurate.
export const PRIVACY_POLICY_VERSION = "v3.0";

// First standalone version: split out of the combined notice above at v3.0.
export const TERMS_VERSION = "v1.0";

export const PRIVACY_CONTACT_EMAIL = "aligned.career.support@gmail.com";

// Wrap a phrase in **double asterisks** to bold it. Only the key points get it.
// Exported so privacy-fil.ts's Filipino translation matches this shape.
export type PolicyItem =
  | { type: "para"; text: string }
  | { type: "list"; items: string[] }
  | { type: "subheading"; text: string };

export interface PolicySection {
  heading: string;
  items: PolicyItem[];
}

const PRIVACY_POLICY_SECTIONS: PolicySection[] = [
  {
    heading: "Who runs AlignEd",
    items: [
      {
        type: "para",
        text: "AlignEd is run by the Polytechnic University of the Philippines, Santa Maria Campus. We decide what data AlignEd uses and why.",
      },
      {
        type: "para",
        text: `Questions or requests about your data? You or your parent or guardian can email us at **${PRIVACY_CONTACT_EMAIL}**.`,
      },
    ],
  },
  {
    heading: "All the data we collect",
    items: [
      {
        type: "para",
        text: "**AlignEd has no accounts and never asks for your real name.** Below is every kind of data AlignEd handles, and where it goes.",
      },
      { type: "subheading", text: "What you type in" },
      {
        type: "list",
        items: [
          "your nickname (1 to 8 letters);",
          "your age;",
          "your grade level (11 or 12);",
          "your SHS strand (if yours is not listed, you can pick Others and type it);",
          "your school name (optional); and",
          "your tick showing you agree to these Terms.",
        ],
      },
      { type: "subheading", text: "What AlignEd makes while you use it" },
      {
        type: "list",
        items: [
          "your answers (Yes or No) to the 42 statements;",
          "your six RIASEC interest scores and your three-letter code;",
          "the language you chose for the statements (English or Filipino);",
          "your place in the assessment, the time of your last activity, and the time you finished;",
          "a random results ID, like ALGN-7KQ2-MX9P; and",
          "your choices for theme (Vivid or Dark) and sound.",
        ],
      },
      { type: "subheading", text: "Only if you choose to" },
      {
        type: "list",
        items: [
          "your **email address**, if you ask us to email your results; and",
          "a **career look photo** from your camera, if you take one.",
        ],
      },
      { type: "subheading", text: "What is collected automatically" },
      {
        type: "list",
        items: [
          "**Website visit data** (when analytics is on): the pages you open, when, and your browser and device type. Your IP address is also received, and it may be used to guess your general area.",
          "**Your IP address, briefly.** Our server scrambles it (a one-way hash) and keeps it only in memory, to stop people from spamming the service.",
          "**Standard server logs** (such as IP address and time of a visit) that our hosting provider may keep for its own technical and security needs.",
          "**A tests-taken counter**: one number for the whole site that goes up each time someone finishes. It has no names or IDs.",
        ],
      },
      { type: "subheading", text: "Where each one goes" },
      {
        type: "list",
        items: [
          "**Stays on your device only:** your nickname, school, answers, language, theme, sound choice, session timing, and any strand you type under Others (it also prints in your own PDF).",
          "**Saved on our server (no name):** your grade level, SHS strand (only the word Others if you typed your own), age, six scores, three-letter code, date, and results ID.",
          "**Sent once, then thrown away:** your email address and photo.",
          "**Sent to our analytics provider:** website visit data, if analytics is on.",
        ],
      },
      { type: "subheading", text: "What we do not collect" },
      {
        type: "para",
        text: "**We do not collect** your full name, home address, phone number, or password, and we do not make accounts. **Your nickname, school, individual answers, typed strand, email address, and photo are never saved on our server.** Please do not type any of those private details into AlignEd.",
      },
      {
        type: "para",
        text: "Your age and your school details are personal. We treat them with care even though they carry no name.",
      },
    ],
  },
  {
    heading: "Why we use your data",
    items: [
      { type: "subheading", text: "To give you your results" },
      {
        type: "para",
        text: "Your answers are scored on your device to find your interest scores in six areas: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional. Then we show you careers and college programs that fit.",
      },
      { type: "subheading", text: "For program statistics" },
      {
        type: "para",
        text: "The saved records (grade level, strand, age, and scores, with no name) help us see which interests, strands, and age groups AlignEd reaches. This helps us improve AlignEd and understand what students need in career guidance.",
      },
      {
        type: "para",
        text: "**We do not show ads, we do not sell your data, and we do not use it for anything else.**",
      },
    ],
  },
  {
    heading: "Where your data is stored and who can see it",
    items: [
      { type: "subheading", text: "On your device while you take the assessment" },
      {
        type: "para",
        text: "Your nickname, age, grade, strand, school, answers, and scores are kept in your browser on the device you are using. This lets AlignEd remember your place without an account.",
      },
      { type: "subheading", text: "On our server after you finish" },
      {
        type: "para",
        text: "When you reach your results, we save one small record in our database. It holds your **grade level, SHS strand, age, six scores, three-letter code, date, and results ID**.",
      },
      {
        type: "para",
        text: "**It does not hold your name, nickname, school, email, photo, or answers.** We still treat it as protected data, because we cannot promise it is impossible to link to a person.",
      },
      {
        type: "para",
        text: "**Your results ID works like a password.** Anyone who has it can see the scores saved under it, though nothing that names you. Keep it private.",
      },
      { type: "subheading", text: "Who can see it" },
      {
        type: "list",
        items: [
          "AlignEd program administrators, through a private page that shows saved records and results IDs, but no names;",
          "school guidance staff the program authorizes; and",
          "the services that run AlignEd, only as needed to keep it working: Supabase (database), Google Gmail (sends the emails you ask for), PostHog (website statistics, when on), and our website hosting provider.",
        ],
      },
      {
        type: "para",
        text: "Everyone with access may use the data only for the reasons in this notice, and must keep it safe.",
      },
    ],
  },
  {
    heading: "How long we keep your data",
    items: [
      { type: "subheading", text: "On your device" },
      {
        type: "para",
        text: "**Your session is erased after 30 minutes of no activity.** You can erase it right away with **Start over**. Do this on a shared or school computer so the next person cannot see your answers.",
      },
      { type: "subheading", text: "On our server" },
      {
        type: "para",
        text: "You can delete your saved record at any time with **Delete saved copy** on your results page, or by giving your results ID to the program administrators.",
      },
      {
        type: "para",
        text: "We do not keep data longer than we need it for the reasons in this notice.",
      },
    ],
  },
  {
    heading: "If you email your results",
    items: [
      {
        type: "para",
        text: "Emailing your results is optional, and we ask for your agreement separately.",
      },
      {
        type: "list",
        items: [
          "**Your email address is used once** to send your results, then thrown away. It is not added to your saved record.",
          "If you took a career look photo, it is attached to the email unless you untick it. **The photo is never stored** by AlignEd.",
          "The results PDF is protected with a password.",
          "We will not use your address for ads or marketing.",
          "To block spam, our server keeps a scrambled (one-way hash) version of your address and your IP in memory for a short time. It cannot be turned back into your address.",
        ],
      },
    ],
  },
  {
    heading: "Website statistics",
    items: [
      {
        type: "para",
        text: "When analytics is on, we use PostHog to count visits: which pages are opened, when, and on what kind of browser or device. It stores a random ID in your browser, not a cookie.",
      },
      {
        type: "para",
        text: "**Analytics never receives your nickname, answers, or results.** It is not loaded on the private admin page. If we ever add other tracking or cookies, we will tell you first and give you a choice where the law requires it.",
      },
    ],
  },
  {
    heading: "How we keep your data safe",
    items: [
      {
        type: "para",
        text: "We use sensible technical and organizational protections against loss, misuse, and unauthorized access. Only people and systems that need the server data can reach it.",
      },
      {
        type: "para",
        text: "No online service is perfectly safe, but we work to keep the risks low.",
      },
    ],
  },
  {
    heading: "Your rights",
    items: [
      {
        type: "para",
        text: "Under the Data Privacy Act of 2012 (RA 10173), you have the right to:",
      },
      {
        type: "list",
        items: [
          "know how your data is used;",
          "ask to see the data we hold about you;",
          "ask us to fix wrong data;",
          "object to some uses of your data;",
          "ask us to delete or block your data;",
          "take back your agreement, where the use depends on it;",
          "get a copy of your data in a usable form;",
          "claim damages where the law allows; and",
          "**complain to the National Privacy Commission** if you think your rights were broken.",
        ],
      },
      {
        type: "para",
        text: `To use these rights, email **${PRIVACY_CONTACT_EMAIL}**. Data kept only on your device is removed with **Start over**. Your saved record is removed with **Delete saved copy**, or by giving your results ID to the program administrators.`,
      },
    ],
  },
];

const TERMS_SECTIONS: PolicySection[] = [
  {
    heading: "What your results mean",
    items: [
      {
        type: "para",
        text: "**Your results are guidance only.** They do not decide your grades, school admission, job, or whether you can take a course. They are not a final answer on what you must choose. Talk with a guidance counselor, teacher, or family before you decide.",
      },
    ],
  },
  {
    heading: "Students under 18",
    items: [
      {
        type: "para",
        text: "Many students who use AlignEd are minors. **If you are under 18, a parent or legal guardian should read this Data Privacy Policy and Terms and Conditions with you.** They give their consent for you to take the assessment by **ticking the box and selecting I agree** on the profile step. Your school or program may also need its own separate agreement before you start, where the law requires it. We explain how data is used in words students can understand.",
      },
    ],
  },
  {
    heading: "Terms and Conditions",
    items: [
      {
        type: "para",
        text: "By using AlignEd, you agree to these rules:",
      },
      {
        type: "list",
        items: [
          "**AlignEd is free career guidance.** It is not a test you can pass or fail, and it does not decide your future.",
          "**Answer honestly** so your results fit you.",
          "**Do not type private details** such as your full name, address, phone number, or passwords.",
          "**Keep your results ID private.** Do not try to look up other people's results IDs.",
          "**Do not misuse AlignEd.** No spamming the email feature, no trying to break or overload the service, and no trying to get into the admin page.",
          "AlignEd may change, pause, or be unavailable at times. We do our best to keep results accurate, but they can be wrong, so use them together with advice from people you trust.",
        ],
      },
    ],
  },
  {
    heading: "Changes to these terms",
    items: [
      {
        type: "para",
        text: "If we change how your data is collected, used, shared, or kept, or change these terms, we will update this notice and its version number. Where the law requires, we will tell you or your parent or guardian before the change starts.",
      },
    ],
  },
  {
    heading: "Agreeing to these terms",
    items: [
      {
        type: "para",
        text: "Please read this notice before you start. **Ticking the box means you have read and agree to these Terms and Conditions and the Data Privacy Policy.** You can take back your agreement at any time by unticking the box on the profile step.",
      },
      {
        type: "para",
        text: "**If you are under 18, a parent or legal guardian should read this notice and tick the box themselves** to give their consent before you begin. Your school or program may also need its own separate agreement, where the law requires it.",
      },
    ],
  },
];

// Turns **bold** markers in policy text into <strong>. Only key points are
// marked, so the weight carries meaning instead of becoming noise.
function renderInline(text: string) {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

// Renders one document's sections. Shared by both tabs below, and by both
// the profile step's consent dialog and the footer's read-only dialog, so
// each document can only ever say one thing.
function renderSections(sections: readonly PolicySection[]) {
  return sections.map((section) => (
    <div key={section.heading} className="flex flex-col gap-2">
      <h3 className="font-heading text-base font-bold text-foreground">
        {section.heading}
      </h3>
      {section.items.map((item, i) => {
        if (item.type === "subheading") {
          return (
            <p key={i} className="text-sm font-semibold text-foreground">
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
                <li key={j}>{renderInline(li)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm text-pretty text-muted-foreground">
            {renderInline(item.text)}
          </p>
        );
      })}
    </div>
  ));
}

// The two documents as separate tabs, shared by the profile step's consent
// dialog and the footer's read-only dialog, so the notice can only ever say
// one thing. One checkbox and one "I agree" still cover both tabs.
function PolicyTabs({
  language,
  defaultTab = "privacy",
}: {
  language: QuestionLanguage;
  defaultTab?: "privacy" | "terms";
}) {
  const fil = language === "fil";
  const t = fil ? PRIVACY_TEXT_FIL : null;
  const privacySections = fil ? PRIVACY_POLICY_SECTIONS_FIL : PRIVACY_POLICY_SECTIONS;
  const termsSections = fil ? TERMS_SECTIONS_FIL : TERMS_SECTIONS;

  return (
    <Tabs defaultValue={defaultTab} lang={fil ? "fil" : undefined} className="p-6 pb-0">
      <TabsList>
        <TabsTrigger value="privacy">
          {t ? t.tabPrivacy : "Data Privacy Policy"}
        </TabsTrigger>
        <TabsTrigger value="terms">
          {t ? t.tabTerms : "Terms and Conditions"}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="privacy"
        className="flex max-h-[50vh] flex-col gap-5 overflow-y-auto pb-6"
      >
        {renderSections(privacySections)}
      </TabsContent>
      <TabsContent
        value="terms"
        className="flex max-h-[50vh] flex-col gap-5 overflow-y-auto pb-6"
      >
        {renderSections(termsSections)}
      </TabsContent>
    </Tabs>
  );
}

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
  const language = useAssessmentStore((state) => state.language);
  const fil = language === "fil";
  const t = fil ? PRIVACY_TEXT_FIL : null;

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-5",
        invalid ? "border-destructive" : "border-border",
      )}
    >
      <h2
        lang={fil ? "fil" : undefined}
        className="flex items-center gap-2 text-base font-semibold text-foreground"
      >
        <ShieldCheck className="size-5 text-stage-profile-strong" aria-hidden />
        {t ? t.cardHeading : "Data Privacy Policy and Terms and Conditions"}
      </h2>
      <p lang={fil ? "fil" : undefined} className="text-sm text-muted-foreground">
        {t ? (
          <>
            <strong className="font-semibold text-foreground">
              {t.cardBlurbLead}
            </strong>{" "}
            {t.cardBlurbRest}{" "}
            <strong className="font-semibold text-foreground">
              {t.cardBlurbNoName}
            </strong>
            {t.cardBlurbTail}
          </>
        ) : (
          <>
            <strong className="font-semibold text-foreground">
              No account and no real name needed.
            </strong>{" "}
            Your session erases from this device after 30 minutes. Only your
            grade, strand, age, and interest scores are saved,{" "}
            <strong className="font-semibold text-foreground">
              with no name
            </strong>
            , for program statistics.
          </>
        )}
      </p>

      <label
        lang={fil ? "fil" : undefined}
        className="flex items-start gap-3 text-sm text-foreground"
      >
        <Checkbox
          checked={accepted}
          onCheckedChange={(checked) => onAcceptedChange(checked === true)}
          aria-describedby={invalid ? "privacy-hint" : undefined}
          className="mt-0.5"
        />
        <span>
          {t ? t.consentPrefix : "I have read and agree to the"}{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline cursor-pointer rounded-sm font-semibold text-stage-profile-strong underline underline-offset-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t
              ? t.consentLinkText
              : "Data Privacy Policy and Terms and Conditions"}
            <span aria-hidden className="ml-0.5 [text-decoration:none]">
              <span className="text-destructive">*</span>
            </span>
          </button>
        </span>
      </label>

      {invalid && (
        <p
          id="privacy-hint"
          lang={fil ? "fil" : undefined}
          className="text-sm font-semibold text-destructive"
          role="alert"
        >
          {t ? t.hint : "Agree to the Terms and Conditions to continue."}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl gap-0 p-0">
          <DialogHeader
            lang={fil ? "fil" : undefined}
            className="border-b border-border p-6 pr-14"
          >
            <DialogTitle className="text-xl">
              {t ? t.dialogTitle : "Data Privacy Policy & Terms and Conditions"}
            </DialogTitle>
            <DialogDescription>
              {t
                ? t.dialogDescriptionConsent(PRIVACY_POLICY_VERSION, TERMS_VERSION)
                : `Data Privacy Policy ${PRIVACY_POLICY_VERSION} and Terms and Conditions ${TERMS_VERSION}. Please read both before you start the assessment.`}
            </DialogDescription>
          </DialogHeader>

          <PolicyTabs language={language} />

          <DialogFooter
            lang={fil ? "fil" : undefined}
            className="border-t border-border p-6"
          >
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setOpen(false)}
            >
              {t ? t.close : "Close"}
            </Button>
            <Button
              className="rounded-full bg-stage-profile font-semibold text-stage-profile-foreground hover:bg-stage-profile/85"
              onClick={() => {
                onAcceptedChange(true);
                setOpen(false);
              }}
            >
              {t ? t.agree : "I agree"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// Read-only dialog for anyone outside the consent flow (the footer's two
// links): each shows only its own document, no tab switcher and no mention
// of the other one, because a visitor who opened "Terms and Conditions"
// should not be shown the Data Privacy Policy on the way in (or the reverse).
export function PrivacyPolicyDialog({
  trigger,
  children,
  defaultTab,
}: {
  trigger: React.ReactElement;
  children: React.ReactNode;
  /** Which single document this dialog shows. */
  defaultTab: "privacy" | "terms";
}) {
  const language = useAssessmentStore((state) => state.language);
  const fil = language === "fil";
  const t = fil ? PRIVACY_TEXT_FIL : null;
  const isPrivacy = defaultTab === "privacy";
  const sections = isPrivacy
    ? fil
      ? PRIVACY_POLICY_SECTIONS_FIL
      : PRIVACY_POLICY_SECTIONS
    : fil
      ? TERMS_SECTIONS_FIL
      : TERMS_SECTIONS;

  return (
    <Dialog>
      <DialogTrigger render={trigger}>{children}</DialogTrigger>
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader
          lang={fil ? "fil" : undefined}
          className="border-b border-border p-6 pr-14"
        >
          <DialogTitle className="text-xl">
            {isPrivacy
              ? t
                ? t.tabPrivacy
                : "Data Privacy Policy"
              : t
                ? t.tabTerms
                : "Terms and Conditions"}
          </DialogTitle>
          <DialogDescription>
            {isPrivacy
              ? t
                ? t.dialogDescriptionReadOnlyPrivacy(PRIVACY_POLICY_VERSION)
                : `Data Privacy Policy ${PRIVACY_POLICY_VERSION}.`
              : t
                ? t.dialogDescriptionReadOnlyTerms(TERMS_VERSION)
                : `Terms and Conditions ${TERMS_VERSION}.`}
          </DialogDescription>
        </DialogHeader>

        <div
          lang={fil ? "fil" : undefined}
          className="flex max-h-[55vh] flex-col gap-5 overflow-y-auto p-6"
        >
          {renderSections(sections)}
        </div>

        <DialogFooter
          lang={fil ? "fil" : undefined}
          className="border-t border-border p-6"
        >
          <DialogClose render={<Button variant="outline" className="rounded-full" />}>
            {t ? t.close : "Close"}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

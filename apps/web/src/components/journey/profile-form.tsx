// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, XIcon } from "lucide-react";

import { AuroraBackground } from "@/components/aceternity/aurora-background";
import { PrivacyConsent } from "@/components/journey/privacy-consent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  RadioCard,
  RadioCardIndicator,
  RadioGroup,
} from "@/components/ui/radio-group";
import {
  AGE_MAX,
  AGE_MIN,
  GRADE_LEVELS,
  SHS_STRANDS,
  SCHOOL_MAX_LENGTH,
  STRAND_OTHER,
  STRAND_OTHER_MAX_LENGTH,
  sanitizeNickname,
} from "@/lib/riasec/types";
import type { GradeLevel, ShsStrand } from "@/lib/riasec/types";
import { PROFILE_TEXT_FIL, STRAND_LABEL_FIL } from "@/lib/riasec/profile-fil";
import {
  selectIsProfileComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// The red star after a required question. Decorative: the form says once, in
// words, that starred fields are required, and each control carries
// aria-required.
function Required() {
  return (
    <span aria-hidden className="ml-0.5 text-destructive">
      *
    </span>
  );
}

// Profile Setup (PRD FR-2): grade as tappable cards, strand as a dropdown,
// optional school. Stage accent: soft yellow. Everything stays client-side in
// the store.
export function ProfileForm() {
  const router = useRouter();
  const profile = useAssessmentStore((state) => state.profile);
  const setProfile = useAssessmentStore((state) => state.setProfile);
  const complete = useAssessmentStore(selectIsProfileComplete);
  const language = useAssessmentStore((state) => state.language);
  const [showHints, setShowHints] = useState(false);
  const fil = language === "fil";
  const t = fil ? PROFILE_TEXT_FIL : null;
  const strandLabel = (strand: ShsStrand) =>
    fil ? STRAND_LABEL_FIL[strand] : strand;

  const handleContinue = () => {
    if (!complete) {
      setShowHints(true);
      return;
    }
    router.push("/assessment");
  };

  return (
    <AuroraBackground>
      <div
        lang={fil ? "fil" : undefined}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10"
      >
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t ? t.heading : "Tell us about yourself"}
          </h1>
          <p className="text-base text-muted-foreground">
            {t
              ? t.subheading
              : "A few quick details to get you started. No real name needed."}
          </p>
          <p className="text-sm text-muted-foreground">
            {t ? (
              t.requiredNote
            ) : (
              <>
                Questions marked with{" "}
                <span className="text-destructive">*</span> are required.
              </>
            )}
          </p>
        </header>

        {/* Nickname */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="nickname"
            className="text-lg font-semibold text-foreground"
          >
            {t ? t.nicknameLabel : "What should we call you?"}
            <Required />
          </label>
          <Input
            id="nickname"
            value={profile.nickname}
            onChange={(event) =>
              setProfile({ nickname: sanitizeNickname(event.target.value) })
            }
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-required="true"
            aria-invalid={showHints && profile.nickname.length === 0}
            aria-describedby="nickname-hint"
            className="h-12 rounded-xl bg-card text-base"
          />
          {showHints && profile.nickname.length === 0 && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              {t ? t.nicknameHint : "Enter a nickname to continue."}
            </p>
          )}
        </div>

        {/* Grade level */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-lg font-semibold text-foreground">
            {t ? t.gradeLabel : "What grade are you in?"}
            <Required />
          </legend>
          <RadioGroup
            aria-label={t ? t.gradeGroupLabel : "Grade level"}
            aria-required="true"
            value={profile.gradeLevel}
            onValueChange={(value) =>
              setProfile({ gradeLevel: value as GradeLevel })
            }
            className="grid grid-cols-2 gap-3"
          >
            {GRADE_LEVELS.map((grade) => (
              <RadioCard
                key={grade}
                value={grade}
                className="min-h-20 justify-center text-stage-profile-strong data-checked:bg-stage-profile/15"
              >
                <RadioCardIndicator className="sr-only" />
                <span className="flex flex-col items-center gap-0.5 text-center">
                  <span className="font-heading text-2xl font-bold">
                    {t ? t.gradeOption(grade) : `Grade ${grade}`}
                  </span>
                </span>
              </RadioCard>
            ))}
          </RadioGroup>
          {showHints && profile.gradeLevel === null && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              {t ? t.gradeHint : "Choose your grade level to continue."}
            </p>
          )}
        </fieldset>

        {/* SHS strand */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="strand"
            className="text-lg font-semibold text-foreground"
          >
            {t ? t.strandLabel : "What is your SHS strand?"}
            <Required />
          </label>
          {profile.strand === STRAND_OTHER ? (
            <div
              className={cn(
                "flex h-12 w-full items-center rounded-xl border border-input bg-card pl-3 pr-2 font-sans text-base font-medium text-foreground transition-colors outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                showHints &&
                  profile.strandOther.trim() === "" &&
                  "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
              )}
            >
              <span className="shrink-0 text-muted-foreground">
                {t ? t.strandOtherPrefix : "Others:"}&nbsp;
              </span>
              <input
                type="text"
                aria-label={t ? t.strandOtherAriaLabel : "Type your strand"}
                aria-required="true"
                autoFocus
                value={profile.strandOther}
                maxLength={STRAND_OTHER_MAX_LENGTH}
                onChange={(event) =>
                  setProfile({
                    strandOther: event.target.value.slice(
                      0,
                      STRAND_OTHER_MAX_LENGTH,
                    ),
                  })
                }
                autoComplete="off"
                aria-invalid={showHints && profile.strandOther.trim() === ""}
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                aria-label={
                  t ? t.strandOtherChangeAriaLabel : "Change strand"
                }
                onClick={() => setProfile({ strand: null, strandOther: "" })}
                className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <XIcon className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <NativeSelect
              id="strand"
              value={profile.strand ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "") return;
                setProfile({
                  strand: value as ShsStrand,
                  ...(value !== STRAND_OTHER && { strandOther: "" }),
                });
              }}
              aria-required="true"
              aria-invalid={showHints && profile.strand === null}
            >
              <option value="" disabled>
                {t ? t.strandPlaceholder : "Choose your strand"}
              </option>
              {SHS_STRANDS.map((strand) => (
                <option key={strand} value={strand}>
                  {strandLabel(strand)}
                </option>
              ))}
            </NativeSelect>
          )}
          {showHints && profile.strand === null && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              {t ? t.strandHint : "Choose your SHS strand to continue."}
            </p>
          )}
          {showHints &&
            profile.strand === STRAND_OTHER &&
            profile.strandOther.trim() === "" && (
              <p className="text-sm font-semibold text-destructive" role="alert">
                {t ? t.strandOtherHint : "Type your strand to continue."}
              </p>
            )}
        </div>

        {/* Age */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="age"
            className="text-lg font-semibold text-foreground"
          >
            {t ? t.ageLabel : "How old are you?"}
            <Required />
          </label>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            min={AGE_MIN}
            max={AGE_MAX}
            value={profile.age}
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, "").slice(0, 2);
              setProfile({ age: raw });
            }}
            aria-required="true"
            aria-invalid={showHints && profile.age === ""}
            className="h-12 rounded-xl bg-card text-base"
          />
          {showHints && profile.age === "" && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              {t ? t.ageHint : "Enter your age to continue."}
            </p>
          )}
        </div>

        {/* School (optional, visually quieter) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="school"
            className="text-base font-medium text-foreground"
          >
            {t ? t.schoolLabel : "School"}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {t ? t.schoolOptional : "(optional)"}
            </span>
          </label>
          <Input
            id="school"
            value={profile.school}
            maxLength={SCHOOL_MAX_LENGTH}
            onChange={(event) =>
              setProfile({
                school: event.target.value.slice(0, SCHOOL_MAX_LENGTH),
              })
            }
            className="h-11 rounded-xl bg-card text-base"
          />
          <p
            className={cn(
              "text-xs text-muted-foreground",
              profile.school.length >= SCHOOL_MAX_LENGTH &&
                "font-semibold text-destructive",
            )}
            aria-live="polite"
          >
          </p>
        </div>

        <PrivacyConsent
          accepted={profile.privacyAccepted}
          onAcceptedChange={(accepted) =>
            setProfile({ privacyAccepted: accepted })
          }
          showHint={showHints}
        />

        <div className="mt-auto flex flex-col gap-2 pb-4">
          <Button
            size="lg"
            onClick={handleContinue}
            aria-disabled={!complete}
            className={cn(
              "h-13 w-full rounded-full bg-stage-profile font-heading text-lg font-semibold text-stage-profile-foreground hover:bg-stage-profile/85",
              !complete && "opacity-60",
            )}
          >
            {t ? t.continueButton : "Continue to assessment"}
            <ArrowRight className="size-5" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t
              ? t.continueNote
              : "You can come back and edit this before finishing the assessment."}
          </p>
        </div>
      </div>
    </AuroraBackground>
  );
}

// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RadioCard,
  RadioCardIndicator,
  RadioGroup,
} from "@/components/ui/radio-group";
import { SCHOOL_MAX_LENGTH, STRANDS } from "@/lib/riasec/types";
import type { GradeLevel, Strand } from "@/lib/riasec/types";
import {
  selectIsProfileComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

const strandDescriptors: Record<Strand, string> = {
  STEM: "Science, tech, engineering, math",
  ABM: "Business, management, accountancy",
  HUMSS: "People, society, communication",
  GAS: "Exploring across many fields",
  TVL: "Hands-on technical and livelihood",
  "Arts & Design": "Creative and visual expression",
  Sports: "Athletics, fitness, and coaching",
};

// Profile Setup (PRD FR-2): grade + strand as tappable cards, optional
// school. Stage accent: amber. Everything stays client-side in the store.
export function ProfileForm() {
  const router = useRouter();
  const profile = useAssessmentStore((state) => state.profile);
  const setProfile = useAssessmentStore((state) => state.setProfile);
  const complete = useAssessmentStore(selectIsProfileComplete);
  const [showHints, setShowHints] = useState(false);

  const handleContinue = () => {
    if (!complete) {
      setShowHints(true);
      return;
    }
    router.push("/assessment");
  };

  return (
    <div className="flex flex-1 flex-col bg-stage-profile-soft">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-2">
          <p className="font-heading text-sm font-bold text-stage-profile-strong">
            Step 1 of 3
          </p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Tell us where you are
          </h1>
          <p className="text-base text-muted-foreground">
            Two quick questions so we can check how your strand matches your
            results. No name needed.
          </p>
        </header>

        {/* Grade level */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-lg font-semibold text-foreground">
            What grade are you in?
          </legend>
          <RadioGroup
            aria-label="Grade level"
            value={profile.gradeLevel}
            onValueChange={(value) =>
              setProfile({ gradeLevel: value as GradeLevel })
            }
            className="grid grid-cols-2 gap-3"
          >
            {(["11", "12"] as const).map((grade) => (
              <RadioCard
                key={grade}
                value={grade}
                className="min-h-20 justify-center text-stage-profile-strong data-checked:bg-stage-profile/15"
              >
                <RadioCardIndicator className="sr-only" />
                <span className="flex flex-col items-center gap-0.5 text-center">
                  <span className="font-heading text-2xl font-bold">
                    Grade {grade}
                  </span>
                </span>
              </RadioCard>
            ))}
          </RadioGroup>
          {showHints && profile.gradeLevel === null && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              Choose your grade level to continue.
            </p>
          )}
        </fieldset>

        {/* Strand */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground">
            What is your SHS strand?
          </legend>
          <p className="-mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <InfoIcon className="size-4 shrink-0" aria-hidden />
            We ask because your results include a check of how your strand
            matches your interests.
          </p>
          <RadioGroup
            aria-label="SHS strand"
            value={profile.strand}
            onValueChange={(value) => setProfile({ strand: value as Strand })}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {STRANDS.map((strand) => (
              <RadioCard
                key={strand}
                value={strand}
                className="text-stage-profile-strong data-checked:bg-stage-profile/15"
              >
                <RadioCardIndicator />
                <span className="flex flex-col gap-0.5">
                  <span className="font-heading text-base font-bold text-foreground">
                    {strand}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {strandDescriptors[strand]}
                  </span>
                </span>
              </RadioCard>
            ))}
          </RadioGroup>
          {showHints && profile.strand === null && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              Choose your strand to continue.
            </p>
          )}
        </fieldset>

        {/* School (optional, visually quieter) */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="school"
            className="text-base font-medium text-foreground"
          >
            School{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (optional)
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
            placeholder="e.g. San Fernando National High School"
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
            {profile.school.length}/{SCHOOL_MAX_LENGTH} characters. Never used
            to identify you.
          </p>
        </div>

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
            Continue to assessment
            <ArrowRight className="size-5" />
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            You can come back and edit this before finishing the assessment.
          </p>
        </div>
      </div>
    </div>
  );
}

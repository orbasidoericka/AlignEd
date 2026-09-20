// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AuroraBackground } from "@/components/aceternity/aurora-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RadioCard,
  RadioCardIndicator,
  RadioGroup,
} from "@/components/ui/radio-group";
import {
  GRADE_LEVELS,
  NICKNAME_MAX_LENGTH,
  SCHOOL_MAX_LENGTH,
  sanitizeNickname,
} from "@/lib/riasec/types";
import type { GradeLevel } from "@/lib/riasec/types";
import {
  selectIsProfileComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// Profile Setup (PRD FR-2): grade level as tappable cards, optional school.
// Stage accent: soft yellow. Everything stays client-side in the store.
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
    <AuroraBackground>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-2">
          <p className="font-heading text-sm font-bold text-stage-profile-strong">
            Step 1 of 3
          </p>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Tell us where you are
          </h1>
          <p className="text-base text-muted-foreground">
            A nickname and your grade level so we can match you to careers and
            college programs. No real name needed.
          </p>
        </header>

        {/* Nickname */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="nickname"
            className="text-lg font-semibold text-foreground"
          >
            What should we call you?
          </label>
          <Input
            id="nickname"
            value={profile.nickname}
            onChange={(event) =>
              setProfile({ nickname: sanitizeNickname(event.target.value) })
            }
            placeholder="Your nickname"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={showHints && profile.nickname.length === 0}
            aria-describedby="nickname-hint"
            className="h-12 rounded-xl bg-card text-base font-bold tracking-widest uppercase"
          />
          {showHints && profile.nickname.length === 0 && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              Enter a nickname to continue.
            </p>
          )}
        </div>

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
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
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
            placeholder="Your School"
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
    </AuroraBackground>
  );
}

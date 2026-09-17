// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  selectIsAssessmentComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

interface HeroCtaProps {
  /** Wording before the assessment is finished. */
  label?: string;
  /** Wording once results exist; the link always points at /results then. */
  doneLabel?: string;
  className?: string;
}

// False on the server and during hydration, so the persisted state never
// causes a hydration mismatch.
const noopSubscribe = () => () => {};

// Journey-aware CTA (PRD FR-1.4): once a completed assessment exists in local
// storage, the primary action becomes the results page. Each placement passes
// its own label so the page never repeats one CTA three times.
export function HeroCta({
  label = "Begin your journey",
  doneLabel = "View my results",
  className,
}: HeroCtaProps) {
  const assessmentComplete = useAssessmentStore(selectIsAssessmentComplete);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const done = hydrated && assessmentComplete;

  return (
    <Link
      href={done ? "/results" : "/assessment/profile"}
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-13 rounded-full bg-stage-profile px-7 font-heading text-lg font-semibold text-stage-profile-foreground shadow-lg shadow-stage-profile/30 hover:bg-stage-profile/85",
        className,
      )}
    >
      {done ? doneLabel : label}
      <ArrowRight className="size-5" />
    </Link>
  );
}

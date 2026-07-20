// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  selectIsAssessmentComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";
import { cn } from "@/lib/utils";

// Journey-aware hero CTA (PRD FR-1.4): once a completed assessment exists in
// local storage, the primary action becomes "View my results".
export function HeroCta() {
  const [mounted, setMounted] = useState(false);
  const assessmentComplete = useAssessmentStore(selectIsAssessmentComplete);

  useEffect(() => setMounted(true), []);

  const done = mounted && assessmentComplete;

  return (
    <Link
      href={done ? "/results" : "/assessment/profile"}
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-13 rounded-full bg-stage-profile px-7 font-heading text-lg font-semibold text-stage-profile-foreground shadow-lg shadow-stage-profile/30 hover:bg-stage-profile/85",
      )}
    >
      {done ? "View my results" : "Begin my journey"}
      <ArrowRight className="size-5" />
    </Link>
  );
}

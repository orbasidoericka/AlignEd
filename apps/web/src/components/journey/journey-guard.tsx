// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import {
  selectIsAssessmentComplete,
  selectIsProfileComplete,
  useAssessmentStore,
} from "@/store/useAssessmentStore";

interface JourneyGuardProps {
  require: "profile" | "results";
  children: React.ReactNode;
}

// Client-side route guard (PRD §5 navigation rules). Journey state lives in
// localStorage, so redirects must wait for zustand persist hydration; until
// then a skeleton holds the layout to avoid a content flash.
export function JourneyGuard({ require, children }: JourneyGuardProps) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(() =>
    useAssessmentStore.persist.hasHydrated(),
  );
  const profileComplete = useAssessmentStore(selectIsProfileComplete);
  const assessmentComplete = useAssessmentStore(selectIsAssessmentComplete);

  useEffect(() => {
    const unsub = useAssessmentStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    setHydrated(useAssessmentStore.persist.hasHydrated());
    return unsub;
  }, []);

  const allowed =
    require === "profile"
      ? profileComplete
      : profileComplete && assessmentComplete;

  useEffect(() => {
    if (!hydrated || allowed) return;
    if (!profileComplete) {
      router.replace("/assessment/profile");
    } else {
      router.replace("/assessment");
    }
  }, [hydrated, allowed, profileComplete, router]);

  if (!hydrated || !allowed) {
    return (
      <div
        className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-12"
        aria-busy="true"
        aria-label="Loading your progress"
      >
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  return <>{children}</>;
}

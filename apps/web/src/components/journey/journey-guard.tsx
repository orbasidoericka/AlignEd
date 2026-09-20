// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect, useSyncExternalStore } from "react";
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

// Subscribe/snapshot pair for zustand's persist hydration, so the guard reads
// it through useSyncExternalStore instead of setState-in-effect (that pattern
// also has a real race: hydration can finish in the gap between the initial
// render and the effect subscribing, and the callback-only version would miss
// it). useSyncExternalStore re-derives the snapshot on every render, so the
// gap does not exist.
function subscribeToHydration(onChange: () => void) {
  return useAssessmentStore.persist.onFinishHydration(onChange);
}
function getHydrationSnapshot() {
  return useAssessmentStore.persist.hasHydrated();
}
function getHydrationServerSnapshot() {
  return false;
}

// Client-side route guard (PRD §5 navigation rules). Journey state lives in
// localStorage, so redirects must wait for zustand persist hydration; until
// then a skeleton holds the layout to avoid a content flash.
export function JourneyGuard({ require, children }: JourneyGuardProps) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
  const profileComplete = useAssessmentStore(selectIsProfileComplete);
  const assessmentComplete = useAssessmentStore(selectIsAssessmentComplete);

  const allowed =
    require === "profile"
      ? profileComplete
      : profileComplete && assessmentComplete;

  useEffect(() => {
    if (!hydrated) return;
    // The first client render still holds the pre-hydration snapshot, so the
    // values captured above can say "incomplete" for a student who has data.
    // Read the store directly instead — by now it is authoritative.
    const state = useAssessmentStore.getState();
    const hasProfile = selectIsProfileComplete(state);
    const hasAssessment = selectIsAssessmentComplete(state);
    if (require === "profile" ? hasProfile : hasProfile && hasAssessment) return;
    router.replace(hasProfile ? "/assessment" : "/assessment/profile");
  }, [hydrated, allowed, profileComplete, assessmentComplete, require, router]);

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

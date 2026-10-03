// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useHydrated } from "@/hooks/use-hydrated";
import {
  isSessionExpired,
  SESSION_TTL_MS,
  useAssessmentStore,
} from "@/store/useAssessmentStore";

// Live counterpart to the store's rehydrate-time expiry (useAssessmentStore).
// The store only wipes a stale session on the next page load; this clears one
// in a tab that is simply left open, so a student who walks away from a shared
// or school device never leaves their profile, answers, or results sitting
// there past the TTL for whoever sits down next.
//
// Renders nothing. Mounted once near the app root so it covers every screen
// that can show a previous session (profile, quiz, results).
export function SessionExpiryGuard() {
  const router = useRouter();
  const pathname = usePathname();
  // Re-arms the timer on every saved change, so active answering keeps the
  // session alive and only real inactivity counts toward the TTL.
  const lastUpdated = useAssessmentStore((state) => state.lastUpdated);
  const reset = useAssessmentStore((state) => state.reset);
  const hydrated = useHydrated();

  useEffect(() => {
    // Nothing runs on the server, and gating on hydration keeps this off the
    // very first client render, before persist has restored lastUpdated.
    if (!hydrated) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const wipe = () => {
      // Re-check live state: a background timer can fire late, and a fresh
      // answer may have restamped the session since it was scheduled.
      if (!isSessionExpired(useAssessmentStore.getState().lastUpdated)) {
        schedule();
        return;
      }
      reset();
      useAssessmentStore.persist.clearStorage();
      // Leave any screen that was showing the wiped session. replace, so Back
      // can't return to it. The landing page shows no session data, so staying
      // there just needs the silent wipe above.
      if (pathname !== "/") router.replace("/");
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      const saved = useAssessmentStore.getState().lastUpdated;
      if (saved === null) return; // no session to expire
      const savedAt = new Date(saved).getTime();
      // Fire one tick past the deadline: isSessionExpired is strict, so an
      // age of exactly the TTL is still live. Always via setTimeout (never a
      // synchronous call), and always a positive delay, so a session already
      // at or past the TTL still re-checks on the next tick instead of
      // looping here.
      const remaining = Number.isNaN(savedAt)
        ? 0
        : SESSION_TTL_MS - (Date.now() - savedAt);
      timer = setTimeout(wipe, Math.max(0, remaining) + 1);
    };

    // Background tabs throttle timers, so a session can slip past the TTL
    // while hidden; re-check the moment the tab is looked at again.
    const recheck = () => {
      if (document.visibilityState === "visible") schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [hydrated, lastUpdated, pathname, reset, router]);

  return null;
}

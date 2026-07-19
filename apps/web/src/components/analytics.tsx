"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

// Env-guarded PostHog wiring: a complete no-op unless NEXT_PUBLIC_POSTHOG_KEY
// is set. localStorage persistence keeps the anonymous site cookie-free.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogKey || !pathname) return;
    let url = window.origin + pathname;
    const query = searchParams.toString();
    if (query) url += `?${query}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  useEffect(() => {
    if (!posthogKey) return;
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false, // SPA pageviews are captured manually above
      persistence: "localStorage",
      person_profiles: "identified_only",
    });
  }, []);

  if (!posthogKey) return null;

  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}

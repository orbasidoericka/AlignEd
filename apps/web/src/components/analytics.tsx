"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Env-guarded PostHog wiring: a complete no-op unless NEXT_PUBLIC_POSTHOG_KEY
// is set. localStorage persistence keeps the anonymous site cookie-free.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

type PostHogClient = typeof import("posthog-js").default;

let posthogPromise: Promise<PostHogClient> | null = null;

function loadPostHog(): Promise<PostHogClient> {
  posthogPromise ??= import("posthog-js").then((module) => module.default);
  return posthogPromise;
}

function whenIdle(callback: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(id);
  }

  const id = setTimeout(callback, 1);
  return () => clearTimeout(id);
}

// The admin page's URL carries its secret token, so analytics never loads
// there and never records it.
function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogKey || !pathname || isAdminPath(pathname)) return;
    const cancel = whenIdle(() => {
      let url = window.origin + pathname;
      const query = searchParams.toString();
      if (query) url += `?${query}`;
      void loadPostHog()
        .then((posthog) => {
          posthog.capture("$pageview", { $current_url: url });
        })
        .catch((error: unknown) => {
          console.error("Analytics could not record the page view:", error);
        });
    });
    return cancel;
  }, [pathname, searchParams]);

  return null;
}

export function Analytics() {
  useEffect(() => {
    if (!posthogKey || isAdminPath(window.location.pathname)) return;
    const cancel = whenIdle(() => {
      void loadPostHog()
        .then((posthog) => {
          posthog.init(posthogKey, {
            api_host: posthogHost,
            capture_pageview: false, // SPA pageviews are captured manually above
            persistence: "localStorage",
            person_profiles: "identified_only",
          });
        })
        .catch((error: unknown) => {
          console.error("Analytics could not initialize:", error);
        });
    });
    return cancel;
  }, []);

  if (!posthogKey) return null;

  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}

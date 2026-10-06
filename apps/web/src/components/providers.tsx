"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";

import { SessionExpiryGuard } from "@/components/session-expiry-guard";
import { SoundProvider } from "@/components/sound-provider";
import { THEMES } from "@/components/theme-toggle";

// Global client providers. MotionConfig reducedMotion="user" makes every
// framer-motion animation respect the OS "reduce motion" setting; pure-CSS
// animations are covered by the media query in globals.css.
// Vivid (named "light", see theme-toggle.tsx) is the default. No "system": a
// dark OS would otherwise skip the brand palette on first visit.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      themes={[...THEMES]}
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <SessionExpiryGuard />
        <SoundProvider>{children}</SoundProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}

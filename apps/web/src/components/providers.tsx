"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";

import { SessionExpiryGuard } from "@/components/session-expiry-guard";
import { SoundProvider } from "@/components/sound-provider";

// Global client providers. MotionConfig reducedMotion="user" makes every
// framer-motion animation respect the OS "reduce motion" setting; pure-CSS
// animations are covered by the media query in globals.css.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user">
        <SessionExpiryGuard />
        <SoundProvider>{children}</SoundProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}

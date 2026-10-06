"use client";

import { Moon, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";

// Two themes. The light-ground one keeps the name "light" (so next-themes,
// sonner and any stored choice keep working) but is shown as "Vivid", which is
// what its palette is.
export const THEMES = ["light", "dark"] as const;

// Both icons render and CSS decides which shows, so the server and client
// markup match and there is no hydration flash. The icon shows the current
// theme; the label names it and the one a tap switches to.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        !hydrated
          ? "Change theme"
          : isDark
            ? "Theme: Dark. Switch to Vivid"
            : "Theme: Vivid. Switch to Dark"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sparkles className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}

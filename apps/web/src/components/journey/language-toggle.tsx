// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { Button } from "@/components/ui/button";
import type { QuestionLanguage } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

const FLAG: Record<QuestionLanguage, { src: string; name: string }> = {
  en: { src: "/flags/us.svg", name: "English" },
  fil: { src: "/flags/ph.svg", name: "Filipino" },
};
const OTHER: Record<QuestionLanguage, QuestionLanguage> = {
  en: "fil",
  fil: "en",
};

// Lives in the FocusBar (quiz only): one flag, the statements' current
// language, so a tap switches straight to the other one. Two languages need
// no menu, just a toggle.
export function LanguageToggle() {
  const language = useAssessmentStore((state) => state.language);
  const setLanguage = useAssessmentStore((state) => state.setLanguage);
  const next = OTHER[language];

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Language: ${FLAG[language].name}. Switch to ${FLAG[next].name}`}
      onClick={() => setLanguage(next)}
      className="rounded-full"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image
          cannot serve SVG without dangerouslyAllowSVG. */}
      <img
        src={FLAG[language].src}
        alt=""
        aria-hidden
        width={60}
        height={40}
        className="size-5 rounded-full object-cover ring-1 ring-border"
      />
    </Button>
  );
}

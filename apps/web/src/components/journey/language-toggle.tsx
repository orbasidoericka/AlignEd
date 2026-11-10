// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { Button } from "@/components/ui/button";
import type { QuestionLanguage } from "@/lib/riasec/questions";
import { useAssessmentStore } from "@/store/useAssessmentStore";

const LABEL: Record<QuestionLanguage, { short: string; name: string }> = {
  en: { short: "EN", name: "English" },
  fil: { short: "FIL", name: "Filipino" },
};
const OTHER: Record<QuestionLanguage, QuestionLanguage> = {
  en: "fil",
  fil: "en",
};

// Lives in the FocusBar (quiz only): text toggle, the statements' current
// language, so a tap switches straight to the other one. Two languages need
// no menu, just a toggle.
export function LanguageToggle() {
  const language = useAssessmentStore((state) => state.language);
  const setLanguage = useAssessmentStore((state) => state.setLanguage);
  const next = OTHER[language];

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Language: ${LABEL[language].name}. Switch to ${LABEL[next].name}`}
      onClick={() => setLanguage(next)}
      className="rounded-full font-semibold"
    >
      {LABEL[language].short}
    </Button>
  );
}

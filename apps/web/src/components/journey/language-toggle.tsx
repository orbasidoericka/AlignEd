// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { Button } from "@/components/ui/button";
import type { QuestionLanguage } from "@/lib/riasec/questions";
import { cn } from "@/lib/utils";

const LANGUAGE_CHOICES: readonly {
  value: QuestionLanguage;
  label: string;
  lang: string;
}[] = [
  { value: "en", label: "English", lang: "en" },
  { value: "fil", label: "Filipino", lang: "fil" },
];

interface LanguageToggleProps {
  value: QuestionLanguage;
  onChange: (language: QuestionLanguage) => void;
  disabled?: boolean;
  className?: string;
}

// English / Filipino pill for the statements. Lives in the progress card, not
// the question block, so it stays put while questions slide past.
export function LanguageToggle({
  value,
  onChange,
  disabled = false,
  className,
}: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Statement language"
      className={cn(
        "flex w-fit items-center gap-0.5 rounded-full bg-muted p-0.5",
        className,
      )}
    >
      {LANGUAGE_CHOICES.map((choice) => (
        <Button
          key={choice.value}
          type="button"
          variant="ghost"
          size="sm"
          lang={choice.lang}
          disabled={disabled}
          aria-pressed={value === choice.value}
          onClick={() => onChange(choice.value)}
          className={cn(
            "h-8 rounded-full px-3 text-sm font-semibold",
            value === choice.value &&
              "bg-highlight-soft text-highlight-soft-foreground hover:bg-highlight-soft",
          )}
        >
          {choice.label}
        </Button>
      ))}
    </div>
  );
}

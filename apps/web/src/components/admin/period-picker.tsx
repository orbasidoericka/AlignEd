// Copyright (c) 2026 EdTech. All rights reserved.
"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDownIcon } from "lucide-react";

import { NativeSelect } from "@/components/ui/native-select";
import type { GradeLevel } from "@/lib/riasec/types";
import { adminHref, PRESETS, type Period } from "@/lib/saved-results/periods";
import { cn } from "@/lib/utils";

// The admin page's time filter: one dropdown of presets plus "Custom date
// range", which reveals From and To date fields. Every change is a URL
// change (adminHref), so the server renders the filtered page and a reload
// keeps the choice. Native controls on purpose: phones open their own list
// and calendar.

const FIELD =
  "relative flex h-11 items-center rounded-full border border-input bg-card text-sm font-semibold text-foreground transition-colors hover:border-ring/60 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-50";

export function PeriodPicker({
  period,
  gradeFilter,
  today,
}: {
  period: Period | null;
  gradeFilter: GradeLevel | null;
  // Today in the Philippines, from the server, so both renders agree.
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const id = useId();
  const go = (next: Period | null) =>
    startTransition(() => router.push(adminHref(gradeFilter, next), { scroll: false }));

  const value = period?.kind === "preset" ? period.preset.id : (period?.kind ?? "all");

  const choose = (choice: string) => {
    if (choice === "all") return go(null);
    if (choice === "custom") {
      // Start from the first of this year, as most reports run year to date.
      return go({ kind: "custom", from: `${today.slice(0, 4)}-01-01`, to: today });
    }
    const preset = PRESETS.find((candidate) => candidate.id === choice);
    if (preset) go({ kind: "preset", preset });
  };

  const custom = period?.kind === "custom" ? period : null;
  // A half-typed date reads as "" until it is whole; wait for it.
  const setEnd = (end: "from" | "to", date: string) => {
    if (custom && date) go({ ...custom, [end]: date });
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-3" aria-busy={pending}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-period`} className="text-sm font-medium text-muted-foreground">
          Time period
        </label>
        <div className="w-full">
          <NativeSelect
            id={`${id}-period`}
            value={value}
            onChange={(event) => choose(event.target.value)}
            className="h-11 rounded-full bg-card pl-4 text-sm font-semibold"
          >
            <option value="all">All time</option>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value="custom">Custom date range</option>
          </NativeSelect>
        </div>
      </div>

      {custom && (
        <div className="grid grid-cols-2 gap-3">
          <DateField
            id={`${id}-from`}
            label="From"
            value={custom.from ?? ""}
            max={custom.to ?? today}
            onChange={(date) => setEnd("from", date)}
          />
          <DateField
            id={`${id}-to`}
            label="To"
            value={custom.to ?? ""}
            min={custom.from ?? undefined}
            max={today}
            onChange={(date) => setEnd("to", date)}
          />
        </div>
      )}
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string | undefined;
  max?: string;
  onChange: (date: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className={FIELD}>
        <CalendarDays className="pointer-events-none absolute left-3 size-4 text-muted-foreground sm:left-3.5" aria-hidden />
        <input
          id={id}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-full w-full min-w-0 cursor-pointer appearance-none rounded-full bg-transparent pr-2 pl-9 tabular-nums sm:pr-9 sm:pl-10 outline-none [color-scheme:light] dark:[color-scheme:dark]",
            // The browser's own calendar button, stretched invisibly over the
            // whole field so a click anywhere opens the calendar.
            "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
          )}
        />
        <ChevronDownIcon className="pointer-events-none absolute right-3 hidden size-5 text-muted-foreground sm:block" aria-hidden />
      </div>
    </div>
  );
}

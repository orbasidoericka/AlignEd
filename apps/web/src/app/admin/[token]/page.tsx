// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Cake,
  Download,
  Inbox,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { InterestHexagon } from "@/components/admin/interest-hexagon";
import { LatestResults } from "@/components/admin/latest-results";
import { Wordmark } from "@/components/blocks/wordmark";
import { HexagonPattern } from "@/components/magic/hexagon-pattern";
import { ThemeToggle } from "@/components/theme-toggle";
import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import {
  GRADE_LEVELS,
  strandShortName,
  type GradeLevel,
  type RiasecLetter,
} from "@/lib/riasec/types";
import { isAdminToken } from "@/lib/saved-results/admin-access";
import {
  listResults,
  purgeExpired,
  type SavedResult,
} from "@/lib/saved-results/repository";
import { summarize, type ResultsSummary } from "@/lib/saved-results/summary";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

// Private admin page: saved results, with no names or other identifiers.
// No login; the secret link /admin/<ADMIN_TOKEN> is the key (see
// admin-access.ts). Any other token gets the ordinary 404 page, so the
// page's existence is not revealed.

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Rows loaded for the totals, and rows listed in the table.
const SUMMARY_LIMIT = 5000;
const TABLE_LIMIT = 200;

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ grade?: string | string[] }>;
}) {
  const { token } = await params;
  if (!isAdminToken(decodeURIComponent(token))) notFound();
  // ?grade=11 or ?grade=12 narrows every total and list to that grade;
  // anything else shows the overall view.
  const { grade } = await searchParams;
  const gradeFilter = GRADE_LEVELS.find((level) => level === grade) ?? null;

  const db = createSupabaseAdminClient();
  if (!db) {
    return (
      <AdminShell>
        <Notice>
          Supabase is not set up. Add SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY to apps/web/.env.local, run the
          0003_saved_results migration, then restart the server.
        </Notice>
      </AdminShell>
    );
  }

  let loaded: { results: SavedResult[]; total: number };
  try {
    await purgeExpired(db);
    loaded = await listResults(db, SUMMARY_LIMIT);
  } catch (error) {
    console.error("admin: could not load saved results:", error);
    return (
      <AdminShell>
        <Notice>
          Saved results could not be loaded. Check that every saved_results
          migration (0003 to 0005) has been run in Supabase, then reload.
        </Notice>
      </AdminShell>
    );
  }

  const overall = summarize(loaded.results);
  const results = gradeFilter
    ? loaded.results.filter((result) => result.gradeLevel === gradeFilter)
    : loaded.results;
  const summary = gradeFilter ? summarize(results) : overall;
  const partial = loaded.total > loaded.results.length;

  const gradeCounts = new Map(overall.byGrade.map((row) => [row.grade, row.count]));
  const filterOptions: FilterOption[] = [
    { label: "Overall", grade: null, count: overall.count },
    ...GRADE_LEVELS.map((level) => ({
      label: `Grade ${level}`,
      grade: level,
      count: gradeCounts.get(level) ?? 0,
    })),
  ];

  return (
    <AdminShell
      headline={<Headline summary={summary} gradeFilter={gradeFilter} />}
      filter={
        <div className="flex flex-wrap items-center gap-3">
          <GradeFilter token={token} current={gradeFilter} options={filterOptions} />
          <ExportLink token={token} gradeFilter={gradeFilter} />
        </div>
      }
    >
      <section
        aria-label="Totals"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <SavedResultsTile
          gradeFilter={gradeFilter}
          count={gradeFilter ? summary.count : loaded.total}
          overallCount={overall.count}
          byGrade={overall.byGrade}
        />
        <TopCodeTile top={summary.topCodes[0]} total={summary.count} />
        <div className="col-span-1 flex flex-col gap-4">
          <MiniStat
            icon={CalendarDays}
            label="Last 30 days"
            value={summary.last30Days.toLocaleString()}
            description="Results saved in the past month."
          />
          <MiniStat
            icon={Cake}
            label="Average age"
            value={summary.averageAge === null ? "N/A" : summary.averageAge.toFixed(1)}
            description="Of students who gave their age."
          />
        </div>
      </section>
      {partial && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          Totals cover the latest {loaded.results.length.toLocaleString()} of{" "}
          {loaded.total.toLocaleString()} saved results.
        </p>
      )}

      <Panel
        title="Strongest interest area"
        description="The first letter of each student's code, on Holland's hexagon. Areas next to each other are closely related; the shape stretches toward the areas more students lead with."
      >
        {summary.count === 0 ? (
          <EmptyState>No results yet.</EmptyState>
        ) : (
          <InterestHexagon rows={summary.byTopLetter} total={summary.count} />
        )}
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title="Most common codes"
          description="The ten three-letter Holland codes that come up most often."
        >
          {summary.topCodes.length === 0 ? (
            <EmptyState>No results yet.</EmptyState>
          ) : (
            <CodeRanking rows={summary.topCodes} total={summary.count} />
          )}
        </Panel>

        <Panel
          title="Strand"
          description="How many students are in each SHS strand, most common first."
        >
          {summary.byStrand.length === 0 && summary.strandNotGiven === 0 ? (
            <EmptyState>No results yet.</EmptyState>
          ) : (
            <CountTable
              caption="Students by SHS strand"
              rows={[
                ...summary.byStrand.map((row) => ({
                  key: row.strand,
                  label: (
                    <span className="flex flex-col">
                      <span className="font-semibold">
                        {strandShortName(row.strand)}
                      </span>
                      {strandShortName(row.strand) !== row.strand && (
                        <span className="max-w-48 truncate text-xs font-normal text-muted-foreground sm:max-w-56">
                          {row.strand.replace(/\s*\([^)]+\)$/, "")}
                        </span>
                      )}
                    </span>
                  ),
                  count: row.count,
                  barClassName: "bg-secondary",
                })),
                ...(summary.strandNotGiven > 0
                  ? [
                      {
                        key: "not-given",
                        label: <span className="text-muted-foreground">Not given</span>,
                        count: summary.strandNotGiven,
                        barClassName: "bg-muted-foreground/40",
                      },
                    ]
                  : []),
              ]}
              max={Math.max(
                1,
                summary.strandNotGiven,
                ...summary.byStrand.map((row) => row.count),
              )}
              total={summary.count}
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Age"
        description="How many students are each age, youngest first."
      >
        {summary.byAge.length === 0 && summary.ageNotGiven === 0 ? (
          <EmptyState>No ages saved yet.</EmptyState>
        ) : (
          <AgeColumns
            rows={[
              ...summary.byAge.map((row) => ({
                key: String(row.age),
                label: String(row.age),
                name: `${row.age} years old`,
                count: row.count,
              })),
              ...(summary.ageNotGiven > 0
                ? [
                    {
                      key: "not-given",
                      label: "N/A",
                      name: "Age not given",
                      count: summary.ageNotGiven,
                      muted: true,
                    },
                  ]
                : []),
            ]}
            total={summary.count}
          />
        )}
      </Panel>

      <Panel
        title="Latest results"
        description="Newest first, with each student's score in every interest area. Letters in their code are in bold."
      >
        <LatestResults results={results.slice(0, TABLE_LIMIT)} />
      </Panel>
    </AdminShell>
  );
}

// One plain sentence over the numbers: how many, and where they lean.
function Headline({
  summary,
  gradeFilter,
}: {
  summary: ResultsSummary;
  gradeFilter: GradeLevel | null;
}) {
  if (summary.count === 0) {
    return <>No {gradeFilter ? `Grade ${gradeFilter} ` : ""}results saved yet.</>;
  }
  const best = Math.max(...summary.byTopLetter.map((row) => row.count));
  const leaders = summary.byTopLetter
    .filter((row) => row.count === best)
    .map((row) => RIASEC_PATHWAYS[row.letter].name);
  return (
    <>
      <span className="font-semibold text-foreground tabular-nums">
        {summary.count.toLocaleString()}
      </span>{" "}
      {gradeFilter ? `Grade ${gradeFilter} ` : ""}
      {summary.count === 1 ? "student" : "students"} so far, and most lean{" "}
      {leaders.map((name, i) => (
        <span key={name}>
          {i > 0 && (i === leaders.length - 1 ? " and " : ", ")}
          <mark className="rounded bg-highlight-soft px-1 font-semibold text-highlight-soft-foreground">
            {name}
          </mark>
        </span>
      ))}
      .
    </>
  );
}

function AdminShell({
  headline,
  filter,
  children,
}: {
  headline?: React.ReactNode;
  filter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-chrome-border bg-chrome/90 backdrop-blur supports-backdrop-filter:bg-chrome/75">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Wordmark className="h-7" priority />
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              Admin
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative isolate overflow-hidden border-b border-border">
        <HexagonPattern
          radius={44}
          gap={6}
          animated={false}
          hexagons={[
            [1, 0, "fill-trait-r/30"],
            [4, 1, "fill-trait-a/30"],
            [7, 0, "fill-trait-s/30"],
          ]}
          className="-z-10 stroke-primary-strong/15 mask-[linear-gradient(to_bottom,white,transparent)] dark:stroke-primary-strong/10"
        />
        <div className="mx-auto flex w-full max-w-6xl items-end gap-6 px-4 pt-10 pb-8 sm:px-6 sm:pt-12">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Saved results
              </h1>
              {headline && (
                <p className="max-w-2xl text-lg text-muted-foreground">{headline}</p>
              )}
            </div>
            {filter}
            <p className="flex max-w-2xl items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-primary-strong"
                aria-hidden
              />
              <span>
                No names or other identifiers are stored: only scores, code,
                grade, strand, age and date. Results are deleted after one year.
                This link is the key to this page, so share it only with program
                admins.
              </span>
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- Hexi animates
              itself and respects reduced motion from inside the SVG, which only
              an <img> keeps; the optimizer cannot serve SVG without
              dangerouslyAllowSVG. */}
          <img
            src="/hexi.svg"
            alt=""
            aria-hidden
            width={800}
            height={600}
            className="pointer-events-none -mb-8 hidden h-auto w-64 shrink-0 select-none md:block lg:w-80 print:hidden"
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-sm text-foreground shadow-bento">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary-strong" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      <Inbox className="size-6" aria-hidden />
      {children}
    </div>
  );
}

interface FilterOption {
  label: string;
  grade: GradeLevel | null;
  count: number;
}

// Overall, Grade 11 and Grade 12 views of the same page, as links so the
// choice lives in the URL and survives a reload.
function GradeFilter({
  token,
  current,
  options,
}: {
  token: string;
  current: GradeLevel | null;
  options: FilterOption[];
}) {
  return (
    <nav
      aria-label="Filter by grade"
      className="inline-flex shrink-0 self-start rounded-full border border-input bg-card p-1 shadow-bento"
    >
      {options.map((option) => {
        const active = option.grade === current;
        return (
          <Link
            key={option.label}
            href={
              option.grade
                ? `/admin/${token}?grade=${option.grade}`
                : `/admin/${token}`
            }
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                active ? "bg-card/60 text-foreground" : "bg-muted text-foreground",
              )}
            >
              {option.count.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// The data itself, not a picture of it: a CSV of every saved result in the
// current view (see export/route.ts). A plain <a>, so the browser downloads
// the file instead of the router trying to render it.
function ExportLink({
  token,
  gradeFilter,
}: {
  token: string;
  gradeFilter: GradeLevel | null;
}) {
  return (
    <a
      href={`/admin/${token}/export${gradeFilter ? `?grade=${gradeFilter}` : ""}`}
      download
      className="inline-flex h-10 items-center gap-2 rounded-full bg-accent-strong px-4 text-sm font-bold whitespace-nowrap text-accent-strong-foreground shadow-bento transition-[filter,translate] duration-200 outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
    >
      <Download className="size-4" aria-hidden />
      Export CSV
      <span className="sr-only">
        {gradeFilter ? `, Grade ${gradeFilter} only` : ", all grades"}
      </span>
    </a>
  );
}

function HexMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0", className)}>
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
    </svg>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border bg-card p-5 shadow-bento sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
          <HexMark className="size-4 fill-primary" />
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

// The headline tile: the total, and how it splits across grades (overall)
// or what share of everything the chosen grade is.
function SavedResultsTile({
  gradeFilter,
  count,
  overallCount,
  byGrade,
}: {
  gradeFilter: GradeLevel | null;
  count: number;
  overallCount: number;
  byGrade: { grade: string; count: number }[];
}) {
  const segments = byGrade.filter((row) => row.count > 0);
  const share = overallCount ? Math.round((count / overallCount) * 100) : 0;
  return (
    <div className="relative col-span-2 flex flex-col justify-between gap-5 overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-bento-lifted sm:p-6">
      <HexMark className="pointer-events-none absolute -top-10 -right-8 size-44 fill-primary-foreground/10" />
      <div className="relative flex flex-col gap-1">
        <p className="text-sm font-semibold">
          {gradeFilter ? `Grade ${gradeFilter} results` : "Saved results"}
        </p>
        <p className="font-heading text-6xl font-extrabold tabular-nums">
          {count.toLocaleString()}
        </p>
        <p className="text-sm font-medium">
          {gradeFilter
            ? `${share}% of all saved results. Results are kept for one year.`
            : "Every result saved in the past year, split by grade below."}
        </p>
      </div>
      {!gradeFilter && overallCount > 0 && (
        <div className="relative flex flex-col gap-2">
          <div
            className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-primary-foreground/15"
            aria-hidden
          >
            {segments.map((row) => (
              <div
                key={row.grade}
                className={cn("h-full first:rounded-l-full last:rounded-r-full", gradeBar(row.grade))}
                style={{ width: `${(row.count / overallCount) * 100}%` }}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {byGrade.map((row) => (
              <li key={row.grade} className="flex items-center gap-1.5">
                <span
                  className={cn("size-2.5 rounded-full", gradeBar(row.grade))}
                  aria-hidden
                />
                {row.grade === "Not given" ? "Grade not given" : `Grade ${row.grade}`}
                <span className="font-bold tabular-nums">
                  {row.count.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {gradeFilter && overallCount > 0 && (
        <div className="relative h-3 overflow-hidden rounded-full bg-primary-foreground/15" aria-hidden>
          <div
            className="h-full rounded-full bg-highlight"
            style={{ width: `${share}%` }}
          />
        </div>
      )}
    </div>
  );
}

// On the blue tile: yellow, and a deeper blue than the tile, read apart
// from each other and from it.
function gradeBar(grade: string): string {
  if (grade === "11") return "bg-highlight";
  if (grade === "12") return "bg-primary-strong dark:bg-chrome";
  return "bg-primary-foreground/40";
}

function TopCodeTile({
  top,
  total,
}: {
  top: { code: string; count: number } | undefined;
  total: number;
}) {
  const letters = top ? (top.code.split("-") as RiasecLetter[]) : [];
  return (
    <div className="col-span-1 flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-bento">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">Most common code</p>
        <p className="text-xs text-muted-foreground">
          The three-letter Holland code students get most often.
        </p>
      </div>
      {top ? (
        <>
          <div className="flex items-center gap-1.5">
            <span className="sr-only">{top.code}</span>
            {letters.map((letter, i) => (
              <LetterChip key={i} letter={letter} size="lg" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {top.count.toLocaleString()}
            </span>{" "}
            {top.count === 1 ? "student" : "students"},{" "}
            {total ? Math.round((top.count / total) * 100) : 0}%
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No results yet.</p>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-3xl border border-border bg-card px-5 py-4 shadow-bento">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary-strong"
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-heading text-2xl font-bold text-foreground tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function LetterChip({
  letter,
  size = "md",
}: {
  letter: RiasecLetter;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-heading font-extrabold",
        size === "sm" && "size-6 text-xs",
        size === "md" && "size-7 text-sm",
        size === "lg" && "size-12 text-xl",
        letterChip(letter),
      )}
    >
      {letter}
    </span>
  );
}

// The most common codes as a ranking: place, the code's letters, then a
// bar against the most common one.
function CodeRanking({
  rows,
  total,
}: {
  rows: { code: string; count: number }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ol className="flex flex-col">
      {rows.map((row, i) => (
        <li
          key={row.code}
          className="flex items-center gap-3 border-b border-border/60 py-2 last:border-0"
        >
          <span className="w-6 shrink-0 text-right font-heading text-lg font-bold text-muted-foreground tabular-nums">
            {i + 1}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <span className="sr-only">{row.code}</span>
            {(row.code.split("-") as RiasecLetter[]).map((letter, j) => (
              <LetterChip key={j} letter={letter} size="sm" />
            ))}
          </span>
          <div className="h-2 flex-1 rounded-full bg-muted" aria-hidden>
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-sm tabular-nums">
            <span className="font-semibold text-foreground">
              {row.count.toLocaleString()}
            </span>
            <span className="ml-1.5 text-muted-foreground">
              {total ? Math.round((row.count / total) * 100) : 0}%
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// Counts with a bar beside each: the number carries the value, the bar
// only makes the comparison quick to scan.
function CountTable({
  caption,
  rows,
  max,
  total,
}: {
  caption: string;
  rows: {
    key: string;
    label: React.ReactNode;
    count: number;
    barClassName: string;
  }[];
  max: number;
  total: number;
}) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Group</th>
          <th scope="col">Share</th>
          <th scope="col">Students</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-b border-border/60 last:border-0">
            <th
              scope="row"
              className="py-2 pr-4 text-left font-medium whitespace-nowrap text-foreground"
            >
              {row.label}
            </th>
            <td className="w-full py-2 pr-4" aria-hidden>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={cn("h-2 rounded-full", row.barClassName)}
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </td>
            <td className="py-2 text-right whitespace-nowrap tabular-nums">
              <span className="font-semibold text-foreground">
                {row.count.toLocaleString()}
              </span>
              <span className="ml-1.5 inline-block w-9 text-left text-muted-foreground">
                {total ? Math.round((row.count / total) * 100) : 0}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Ages as columns, youngest on the left; each column is read out as one
// list item, so the chart itself stays out of the accessibility tree.
function AgeColumns({
  rows,
  total,
}: {
  rows: { key: string; label: string; name: string; count: number; muted?: boolean }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ul className="flex h-56 items-stretch gap-2 sm:gap-4">
      {rows.map((row) => {
        const share = total ? Math.round((row.count / total) * 100) : 0;
        const height = Math.max(4, (row.count / max) * 100);
        return (
          <li
            key={row.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            aria-label={`${row.name}: ${row.count} students, ${share}%`}
          >
            {/* The top margin leaves room for the count over the tallest column. */}
            <div className="relative mt-7 w-full flex-1" aria-hidden>
              <span
                className="absolute inset-x-0 mb-1.5 text-center text-sm font-semibold text-foreground tabular-nums"
                style={{ bottom: `${height}%` }}
              >
                {row.count.toLocaleString()}
              </span>
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 mx-auto w-full max-w-20 rounded-t-2xl",
                  row.muted ? "bg-muted-foreground/40" : "bg-primary",
                )}
                style={{ height: `${height}%` }}
              />
            </div>
            <span
              className="w-full border-t border-border pt-2 text-center font-heading text-sm font-semibold text-muted-foreground tabular-nums"
              aria-hidden
            >
              {row.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

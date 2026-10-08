// Copyright (c) 2026 EdTech. All rights reserved.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RIASEC_PATHWAYS } from "@/lib/riasec/career-pathways";
import { letterChip } from "@/lib/riasec/letter-chip-styles";
import { TRAIT_META, TRAIT_ORDER } from "@/lib/riasec/scoring";
import { isAdminToken } from "@/lib/saved-results/admin-access";
import {
  listResults,
  purgeExpired,
  type SavedResult,
} from "@/lib/saved-results/repository";
import { summarize } from "@/lib/saved-results/summary";
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
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isAdminToken(decodeURIComponent(token))) notFound();

  const db = createSupabaseAdminClient();
  if (!db) {
    return (
      <AdminShell>
        <Notice>
          Supabase is not set up. Add NEXT_PUBLIC_SUPABASE_URL and
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
          Saved results could not be loaded. Check that the 0003_saved_results
          migration has been run, then reload.
        </Notice>
      </AdminShell>
    );
  }

  const summary = summarize(loaded.results);
  const partial = loaded.total > loaded.results.length;
  const maxTop = Math.max(1, ...summary.byTopLetter.map((row) => row.count));
  const maxCode = Math.max(1, ...summary.topCodes.map((row) => row.count));
  const maxAge = Math.max(1, ...summary.byAge.map((row) => row.count));

  return (
    <AdminShell>
      <section
        aria-label="Totals"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatTile label="Saved results" value={loaded.total} />
        <StatTile label="Last 30 days" value={summary.last30Days} />
        <StatTile
          label="Average age"
          value={summary.averageAge}
          format={(age) => age.toFixed(1)}
        />
        {summary.byGrade.map((row) => (
          <StatTile
            key={row.grade}
            label={row.grade === "Not given" ? "Grade not given" : `Grade ${row.grade}`}
            value={row.count}
          />
        ))}
      </section>
      {partial && (
        <p className="text-sm text-muted-foreground">
          Totals below cover the latest {loaded.results.length.toLocaleString()}{" "}
          of {loaded.total.toLocaleString()} saved results.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Strongest interest area">
          <CountTable
            caption="Students by the first letter of their code"
            rows={summary.byTopLetter.map((row) => ({
              key: row.letter,
              label: (
                <span className="flex items-center gap-2">
                  <LetterChip letter={row.letter} />
                  {RIASEC_PATHWAYS[row.letter].name}
                </span>
              ),
              count: row.count,
            }))}
            max={maxTop}
            total={summary.count}
          />
        </Panel>
        <Panel title="Most common codes">
          {summary.topCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No results yet.</p>
          ) : (
            <CountTable
              caption="The ten most common Holland codes"
              rows={summary.topCodes.map((row) => ({
                key: row.code,
                label: <span className="font-mono font-semibold">{row.code}</span>,
                count: row.count,
              }))}
              max={maxCode}
              total={summary.count}
            />
          )}
        </Panel>
      </div>

      <Panel title="Age">
        {summary.byAge.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ages saved yet.</p>
        ) : (
          <CountTable
            caption="Students by age"
            rows={[
              ...summary.byAge.map((row) => ({
                key: String(row.age),
                label: <span className="tabular-nums">{row.age} years old</span>,
                count: row.count,
              })),
              ...(summary.ageNotGiven > 0
                ? [
                    {
                      key: "not-given",
                      label: <span className="text-muted-foreground">Not given</span>,
                      count: summary.ageNotGiven,
                    },
                  ]
                : []),
            ]}
            max={Math.max(maxAge, summary.ageNotGiven)}
            total={summary.count}
          />
        )}
      </Panel>

      <Panel
        title={`Latest results (${Math.min(TABLE_LIMIT, loaded.results.length)})`}
      >
        <ResultsTable results={loaded.results.slice(0, TABLE_LIMIT)} />
      </Panel>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="font-heading text-sm font-bold text-primary-strong">
          AlignEd admin
        </p>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Saved results
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          No names or other identifiers are stored: only scores, code, grade,
          age and date. Results are deleted after one year. This link is the key
          to this page, so share it only with program admins.
        </p>
      </header>
      {children}
    </main>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-border bg-card p-5 text-sm text-foreground">
      {children}
    </p>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-base font-bold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatTile({
  label,
  value,
  format = (n) => n.toLocaleString(),
}: {
  label: string;
  value: number | null;
  format?: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-3xl font-bold text-foreground tabular-nums">
        {value === null ? "—" : format(value)}
      </p>
    </div>
  );
}

function LetterChip({ letter }: { letter: keyof typeof RIASEC_PATHWAYS }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
        letterChip(letter),
      )}
    >
      {letter}
    </span>
  );
}

// Counts with a thin bar beside each: the number carries the value, the
// bar only makes the comparison quick to scan.
function CountTable({
  caption,
  rows,
  max,
  total,
}: {
  caption: string;
  rows: { key: string; label: React.ReactNode; count: number }[];
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
          <tr key={row.key}>
            <th
              scope="row"
              className="py-1.5 pr-3 text-left font-normal whitespace-nowrap text-foreground"
            >
              {row.label}
            </th>
            <td className="w-full py-1.5 pr-3" aria-hidden>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </td>
            <td className="py-1.5 text-right whitespace-nowrap text-foreground tabular-nums">
              {row.count.toLocaleString()}
              <span className="ml-1 text-muted-foreground">
                ({total ? Math.round((row.count / total) * 100) : 0}%)
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function ResultsTable({ results }: { results: SavedResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No results yet.</p>;
  }
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">Taken</th>
            <th scope="col" className="py-2 pr-3 font-medium">Results ID</th>
            <th scope="col" className="py-2 pr-3 font-medium">Code</th>
            <th scope="col" className="py-2 pr-3 font-medium">Grade</th>
            <th scope="col" className="py-2 pr-3 font-medium">Age</th>
            {TRAIT_ORDER.map((trait) => (
              <th
                key={trait}
                scope="col"
                className="py-2 pr-3 text-right font-medium"
                title={RIASEC_PATHWAYS[TRAIT_META[trait].letter].name}
              >
                {TRAIT_META[trait].letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr
              key={result.resultsId}
              className="border-b border-border/60 last:border-0"
            >
              <td className="py-2 pr-3 whitespace-nowrap text-foreground">
                {dateFormat.format(new Date(`${result.takenOn}T00:00:00`))}
              </td>
              <td className="py-2 pr-3 font-mono whitespace-nowrap text-muted-foreground">
                {result.resultsId}
              </td>
              <td className="py-2 pr-3 font-mono font-semibold whitespace-nowrap text-foreground">
                {result.code.join("-")}
              </td>
              <td className="py-2 pr-3 text-foreground">
                {result.gradeLevel ?? "—"}
              </td>
              <td className="py-2 pr-3 text-foreground tabular-nums">
                {result.age ?? "—"}
              </td>
              {TRAIT_ORDER.map((trait) => (
                <td
                  key={trait}
                  className="py-2 pr-3 text-right text-foreground tabular-nums"
                >
                  {result.scores[trait]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

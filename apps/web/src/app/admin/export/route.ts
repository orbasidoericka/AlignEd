// Copyright (c) 2026 EdTech. All rights reserved.

import { GRADE_LEVELS } from "@/lib/riasec/types";
import { resultsToXlsx, XLSX_TYPE } from "@/lib/saved-results/export-xlsx";
import { hasAdminSession } from "@/lib/saved-results/admin-session";
import {
  parsePeriod,
  periodKey,
  periodLabel,
  withinPeriod,
} from "@/lib/saved-results/periods";
import { listAllResults, purgeExpired } from "@/lib/saved-results/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /admin/export: every saved result as an Excel (.xlsx) download, for
// the Export button on the admin page. ?grade=11 or ?grade=12 keeps only
// that grade and ?period= (a preset, or custom with from/to; see periods.ts)
// only that window, matching the page's filters. Needs the admin session cookie (PRD FR-10); without it this is a
// plain 404.

export async function GET(request: Request) {
  if (!(await hasAdminSession())) {
    return new Response("Not found", { status: 404 });
  }

  const db = createSupabaseAdminClient();
  if (!db) return new Response("Supabase is not set up.", { status: 500 });

  const params = new URL(request.url).searchParams;
  const grade = params.get("grade");
  const gradeFilter = GRADE_LEVELS.find((level) => level === grade) ?? null;
  const period = parsePeriod({
    period: params.get("period"),
    from: params.get("from"),
    to: params.get("to"),
  });

  const today = new Date().toISOString().slice(0, 10);
  let workbook: Uint8Array;
  try {
    await purgeExpired(db);
    const results = withinPeriod(await listAllResults(db), period);
    workbook = resultsToXlsx(
      gradeFilter
        ? results.filter((result) => result.gradeLevel === gradeFilter)
        : results,
      { grade: gradeFilter, period: period ? periodLabel(period) : null, exportedOn: today },
    );
  } catch (error) {
    console.error("admin export: could not load saved results:", error);
    return new Response("Saved results could not be loaded.", { status: 502 });
  }

  const scope = [gradeFilter ? `grade-${gradeFilter}` : "all", period && periodKey(period)].filter(Boolean).join("-");
  const name = `aligned-results-${scope}-${today}.xlsx`;
  return new Response(Buffer.from(workbook), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
    },
  });
}

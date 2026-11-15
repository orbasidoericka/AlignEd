// Copyright (c) 2026 EdTech. All rights reserved.

import { GRADE_LEVELS } from "@/lib/riasec/types";
import { resultsToXlsx, XLSX_TYPE } from "@/lib/saved-results/export-xlsx";
import { hasAdminSession } from "@/lib/saved-results/admin-session";
import { listAllResults, purgeExpired } from "@/lib/saved-results/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /admin/export: every saved result as an Excel (.xlsx) download, for
// the Export button on the admin page. ?grade=11 or ?grade=12 keeps only
// that grade, matching the page's filter. Needs the admin session cookie
// (PRD FR-10); without it this is a plain 404.

export async function GET(request: Request) {
  if (!(await hasAdminSession())) {
    return new Response("Not found", { status: 404 });
  }

  const db = createSupabaseAdminClient();
  if (!db) return new Response("Supabase is not set up.", { status: 500 });

  const grade = new URL(request.url).searchParams.get("grade");
  const gradeFilter = GRADE_LEVELS.find((level) => level === grade) ?? null;

  const today = new Date().toISOString().slice(0, 10);
  let workbook: Uint8Array;
  try {
    await purgeExpired(db);
    const results = await listAllResults(db);
    workbook = resultsToXlsx(
      gradeFilter
        ? results.filter((result) => result.gradeLevel === gradeFilter)
        : results,
      { grade: gradeFilter, exportedOn: today },
    );
  } catch (error) {
    console.error("admin export: could not load saved results:", error);
    return new Response("Saved results could not be loaded.", { status: 502 });
  }

  const name = `aligned-results-${gradeFilter ? `grade-${gradeFilter}` : "all"}-${today}.xlsx`;
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

// Copyright (c) 2026 EdTech. All rights reserved.

import { GRADE_LEVELS } from "@/lib/riasec/types";
import { isAdminToken } from "@/lib/saved-results/admin-access";
import { resultsToCsv } from "@/lib/saved-results/export-csv";
import { listAllResults, purgeExpired } from "@/lib/saved-results/repository";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// GET /admin/<ADMIN_TOKEN>/export: every saved result as a CSV download,
// for the Export button on the admin page. ?grade=11 or ?grade=12 keeps
// only that grade, matching the page's filter. Same key as the page: any
// other token is a plain 404.

type Context = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Context) {
  const { token } = await params;
  if (!isAdminToken(decodeURIComponent(token))) {
    return new Response("Not found", { status: 404 });
  }

  const db = createSupabaseAdminClient();
  if (!db) return new Response("Supabase is not set up.", { status: 500 });

  const grade = new URL(request.url).searchParams.get("grade");
  const gradeFilter = GRADE_LEVELS.find((level) => level === grade) ?? null;

  let csv: string;
  try {
    await purgeExpired(db);
    const results = await listAllResults(db);
    csv = resultsToCsv(
      gradeFilter
        ? results.filter((result) => result.gradeLevel === gradeFilter)
        : results,
    );
  } catch (error) {
    console.error("admin export: could not load saved results:", error);
    return new Response("Saved results could not be loaded.", { status: 502 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const name = `aligned-results-${gradeFilter ? `grade-${gradeFilter}` : "all"}-${today}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
    },
  });
}

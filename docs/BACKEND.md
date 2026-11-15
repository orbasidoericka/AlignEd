<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Backend

Server routes, data, secrets, and privacy controls. Client code lives in `FRONTEND.md`. Privacy limits come from the PRD (no accounts, no PII at rest, RA 10173) and override convenience.

## API routes (`apps/web/src/app/api`)

| Route | Method | Does | Limits |
| :--- | :--- | :--- | :--- |
| `/api/results` | POST | Save a finished result (six scores, code, grade, age, date). Returns a results ID (`ALGN-XXXX-XXXX`), stored client-side and printed in the PDF; no route exposes a lookup or delete by ID, and the client has no UI for either. | 200 / hour per network |
| `/api/send-results` | POST | Email the encrypted results PDF, and nothing else, via Gmail SMTP (nodemailer), then discard the address. A `photo` field from an older page is ignored. | per hashed email + per hashed IP |

- Rate limiters (`lib/results-email/rate-limiter.ts`, `lib/saved-results/ip-limiter.ts`) are in-memory, keyed by salted hashes with a per-process random salt. They reset on restart and count per server instance.
- Inputs validated server-side with `lib/riasec/validate-results.ts`; email content in `lib/results-email/email-content.ts`.
- Server PDF: `lib/results-pdf/render-results-pdf.ts` (Node only; `pdfmake` is in `serverExternalPackages`).

## Admin

`/admin`: one shared password, no accounts (PRD FR-10). The form posts to the `signIn` server action (`app/admin/actions.ts`), which first counts the attempt against two in-memory `createWindowLimiter`s (5 per network per 15 min, keyed by `callerKey`, a salted IP hash; 30 per hour across all networks), then compares against `ADMIN_PASSWORD` in constant time (`lib/saved-results/admin-access.ts`; locked if unset or under 16 chars). Success sets cookie `aligned_admin` = `<expiry ms>.<HMAC-SHA256>` (HttpOnly, SameSite=Strict, Secure in production, path `/admin`, 8 hours); the HMAC key is derived from the password, so changing `ADMIN_PASSWORD` signs everyone out. Nothing about a session is stored server-side, so a copied cookie stays valid until it expires or the password changes. `signOut` deletes the cookie. `hasAdminSession()` (`lib/saved-results/admin-session.ts`) gates the page and the export. Old `/admin/<token>` links are plain 404s. Because the limits are per server instance and reset on restart, the password itself must be long and random. The global limit means someone hammering the form can lock out real admins for up to an hour.

The session is checked before anything is sent, then the dashboard streams inside a `Suspense` boundary keyed by grade. Do not add a `loading.tsx` to this route: it would stream the page frame before the session check. `purgeExpired` runs in `after()`, once the page is sent, and `listResults` filters on `expires_at` so expired rows never show.

`/admin/export` (same session check, 404 without it) downloads the current view as an Excel workbook, built by `lib/saved-results/export-xlsx.ts` with no library, in the classic Excel table look: blue (#4472C4) header rows with white bold text, light-blue banded rows, thin grey borders on every table cell, bold Total rows, gridlines on. Sheet 1, Summary, repeats the admin page from the same `summarize()` totals: an Overview table (saved results, each grade with its share, last 30 days, average age, most common code), then strongest interest area (trait-coloured letter cells), most common codes (top 10), strand and age, each with Students and Share ("0%", same rounding as the page) and, except the codes, a Total row. Sheet 2, Latest results, is the admin table: Taken, Results ID, Code over three trait-coloured cells, Grade, Strand (short name), Age, R to C scores with the code's letters bold and the rest grey; real dates, frozen header, filters; missing values read "Not given". Styles are collected per workbook by a small `StyleSheet` class, so cells only describe how they look. The file is a hand-written zip of the OOXML parts using `node:zlib`, so the route needs the Node runtime.

## Database (Supabase Postgres)

| Migration | Contents |
| :--- | :--- |
| `0001_init.sql` | `careers`, `courses`, `course_careers` (public read), anonymous `assessments` (insert-only), `match_courses` RPC. |
| `0002_universities.sql` | University directory. **Out of scope per PRD**; slated for removal (Implementation Plan 1.2). |
| `0003_saved_results.sql` | `saved_results`: results ID, six scores, `max_score`, code, grade, date; expires after one year. RLS on with no policies, so only the service role (server routes) can touch it. |
| `0004_saved_results_age.sql` | Adds nullable `age` (10–30). |
| `0005_saved_results_strand.sql` | Adds nullable `strand`, limited to the `SHS_STRANDS` list. |
| `0007_saved_results_strand_others.sql` | Widens the `strand` check to also allow `'Others'`. Only the word is stored; a typed strand never reaches the server. Run it before deploying the Others option. |

- Clients: `lib/supabase/client.ts` (anon, browser) and `lib/supabase/admin.ts` (service role, server only). Repository in `lib/saved-results/repository.ts`.
- Reference data: `data/*.csv` → `npm run seed:build` (`scripts/build-seed.mjs`) → `supabase/seed.sql`.
- Never stored: name, nickname, school, email, photo, individual answers.

## Environment (`apps/web/.env.local`)

| Var | Scope |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | server only |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | server only (Google App Password) |
| `ADMIN_PASSWORD` | server only, ≥16 random chars; changing it signs every admin out |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | public, optional |

Server secrets never take the `NEXT_PUBLIC_` prefix.

## Security headers

Set in `apps/web/next.config.ts` for every path: `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy` with `camera=(self)` (career look) and everything else off. A strict nonce CSP is deferred to hardening, and would go in `proxy.ts`.

## Known gaps

- `assessments` table and `match_courses` RPC (`0001`) are unused; `0002_universities.sql` is out of scope. Both await a cleanup migration.
- Rate limiters are in memory: reset on restart, counted per instance. Shared store needed before multi-instance deploys.
- No strict CSP yet; no Playwright specs yet; no Supabase contract test for `saved_results` constraints vs `validate-results.ts`.

## Changelog

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-11-15 · admin · Excel export restyled as classic Excel tables (blue header, banded rows, cell borders, Total rows, Overview table) with a per-workbook style registry · admins found the earlier layout hard to scan in Sheets/Excel.
- 2026-11-15 · admin · Excel export keeps Excel's gridlines and gives table cells thin grey grid borders instead of blue row lines and white gaps · it should still look like a spreadsheet.
- 2026-11-15 · admin · Excel export adds a first "Summary" sheet built from `summarize()` (the page's cards and charts as numbers); the table moves to a second "Latest results" sheet · admins wanted the overview in the file too.
- 2026-11-15 · email · `/api/send-results` attaches only the PDF; `parsePhoto`/`MAX_PHOTO_BYTES` and the photo attachment removed · requested: the email carries only the results PDF.
- 2026-11-15 · admin · Excel export laid out like the admin table (trait-coloured code cells, short strands, R to C score columns, letter key, no gridlines) · the first version was readable but did not match the page.
- 2026-11-15 · admin · Password sign-in replaces the secret-link token: `signIn`/`signOut` server actions, stateless HMAC session cookie (8 h), 5 per 15 min per network and 30 per hour global attempt limits, `ADMIN_PASSWORD` replaces `ADMIN_TOKEN`, export moved to `/admin/export` · a link-as-key leaks through history, logs and forwarding.
- 2026-11-15 · admin · Export is now a formatted Excel workbook (`export-xlsx.ts`, `.xlsx`) instead of a CSV; "Saved at (UTC)" and the constant "Max score per area" columns became a title and a note · the CSV opened in Excel as narrow columns and `########` dates.
- 2026-11-10 · admin · `purgeExpired` on the admin page moved to `after()`, and `listResults` filters out expired rows · the page no longer waits on a delete before showing anything.
- 2026-11-09 · api · Removed `/api/results/[id]` entirely (GET and DELETE) and `getResult`/`deleteResult` from the repository. `POST /api/results` still saves one row per session for the admin stats page; nothing reads or deletes a row by ID anymore. · Requested removal of the results-ID feature from the Results page.
- 2026-11-09 · api · Removed `GET /api/results/[id]` and `getResult` from the repository; the compare-by-ID feature is gone, `DELETE /api/results/[id]` is unchanged. · Comparing was cut from the results page.
- 2026-11-04 · database · Migration 0007 allows `'Others'` in `saved_results.strand`; `parseStrand` accepts it via `SHS_STRANDS`. · Students with an unlisted strand can still be saved, with no free text on the server.
- 2026-10-27 · docs · PRD and Implementation Plan aligned to this file; Known gaps corrected (grades 11–12 are intended: SHS only). · Code is the plan of record.
- 2026-10-27 · docs · Created this file from the current code. · Split backend notes out of the PRD and Implementation Plan.

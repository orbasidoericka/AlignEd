<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Backend

Server routes, data, secrets, and privacy controls. Client code lives in `FRONTEND.md`. Privacy limits come from the PRD (no accounts, no PII at rest, RA 10173) and override convenience.

## API routes (`apps/web/src/app/api`)

| Route | Method | Does | Limits |
| :--- | :--- | :--- | :--- |
| `/api/results` | POST | Save a finished result (six scores, code, grade, age, date). Returns a results ID (`ALGN-XXXX-XXXX`). | 200 / hour per network |
| `/api/results/[id]` | GET, DELETE | Fetch or delete a saved result by results ID. | per-network window limiter |
| `/api/send-results` | POST | Email the encrypted results PDF (+ optional career-look photo) via Gmail SMTP (nodemailer), then discard the address and photo. | per hashed email + per hashed IP |

- Rate limiters (`lib/results-email/rate-limiter.ts`, `lib/saved-results/ip-limiter.ts`) are in-memory, keyed by salted hashes with a per-process random salt. They reset on restart and count per server instance.
- Inputs validated server-side with `lib/riasec/validate-results.ts`; email content in `lib/results-email/email-content.ts`.
- Server PDF: `lib/results-pdf/render-results-pdf.ts` (Node only; `pdfmake` is in `serverExternalPackages`).

## Admin

`/admin/[token]`: no login; the link is the key. `lib/saved-results/admin-access.ts` compares the token in constant time and locks the page if `ADMIN_TOKEN` is unset or under 32 chars. Revoke by changing `ADMIN_TOKEN` and restarting.

## Database (Supabase Postgres)

| Migration | Contents |
| :--- | :--- |
| `0001_init.sql` | `careers`, `courses`, `course_careers` (public read), anonymous `assessments` (insert-only), `match_courses` RPC. |
| `0002_universities.sql` | University directory. **Out of scope per PRD**; slated for removal (Implementation Plan 1.2). |
| `0003_saved_results.sql` | `saved_results`: results ID, six scores, `max_score`, code, grade, date; expires after one year. RLS on with no policies, so only the service role (server routes) can touch it. |
| `0004_saved_results_age.sql` | Adds nullable `age` (10–30). |

- Clients: `lib/supabase/client.ts` (anon, browser) and `lib/supabase/admin.ts` (service role, server only). Repository in `lib/saved-results/repository.ts`.
- Reference data: `data/*.csv` → `npm run seed:build` (`scripts/build-seed.mjs`) → `supabase/seed.sql`.
- Never stored: name, nickname, school, email, photo, individual answers.

## Environment (`apps/web/.env.local`)

| Var | Scope |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | server only |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | server only (Google App Password) |
| `ADMIN_TOKEN` | server only, ≥32 random chars |
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

- 2026-10-27 · docs · PRD and Implementation Plan aligned to this file; Known gaps corrected (grades 11–12 are intended: SHS only). · Code is the plan of record.
- 2026-10-27 · docs · Created this file from the current code. · Split backend notes out of the PRD and Implementation Plan.

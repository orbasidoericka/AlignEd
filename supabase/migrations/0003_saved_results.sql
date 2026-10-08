-- Saved results: one row per completed assessment, so a student can compare
-- a later retake against it, and program admins can see the totals on the
-- private admin page.
--
-- No name, nickname, age, school, email, photo, or individual answers: only
-- the six trait scores, the Holland code, the grade level, the date, and a
-- random results ID that the student keeps. Rows expire after one year.
--
-- RLS is on with no policies, so the anon key can neither read nor write.
-- Every access goes through the app's server routes with the service role
-- key (POST/GET/DELETE /api/results, and the admin page).

create table if not exists public.saved_results (
  id            uuid primary key default gen_random_uuid(),
  results_id    text not null unique
                check (results_id ~ '^ALGN-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$'),
  realistic     smallint not null check (realistic between 0 and 100),
  investigative smallint not null check (investigative between 0 and 100),
  artistic      smallint not null check (artistic between 0 and 100),
  social        smallint not null check (social between 0 and 100),
  enterprising  smallint not null check (enterprising between 0 and 100),
  conventional  smallint not null check (conventional between 0 and 100),
  max_score     smallint not null check (max_score between 1 and 100),
  holland_code  text not null check (holland_code ~ '^[RIASEC]{3}$'),
  grade_level   text check (grade_level in ('11', '12')),
  taken_on      date not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '1 year'
);

create index if not exists idx_saved_results_created_at
  on public.saved_results (created_at desc);
create index if not exists idx_saved_results_expires_at
  on public.saved_results (expires_at);

alter table public.saved_results enable row level security;

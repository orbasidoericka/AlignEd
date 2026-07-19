-- AlignEd core schema: careers, courses, course<->career links, and anonymous
-- assessment analytics. Open-access app (no auth): reference data is public-read;
-- assessments accept anonymous inserts only. Authoritative student results live
-- client-side (localStorage); this table is optional analytics.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table if not exists public.careers (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  riasec_tag    text not null,                 -- e.g. 'SEA' (Holland code, 1-3 letters)
  summary       text not null default '',
  work_environment text not null default '',
  typical_tools text[] not null default '{}',
  day_in_life   text not null default '',       -- seed narrative for the Future Self feature
  created_at    timestamptz not null default now()
);

create table if not exists public.courses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  degree_type   text not null default 'Bachelor',
  field         text not null default '',
  riasec_tag    text not null,                 -- e.g. 'IRA'
  overview      text not null default '',
  core_subjects text[] not null default '{}',
  pros          text[] not null default '{}',
  cons          text[] not null default '{}',
  created_at    timestamptz not null default now()
);

create table if not exists public.course_careers (
  course_id uuid not null references public.courses(id) on delete cascade,
  career_id uuid not null references public.careers(id) on delete cascade,
  primary key (course_id, career_id)
);

create index if not exists idx_courses_riasec_tag on public.courses (riasec_tag);
create index if not exists idx_careers_riasec_tag on public.careers (riasec_tag);
create index if not exists idx_course_careers_career on public.course_careers (career_id);

-- ---------------------------------------------------------------------------
-- Optional anonymous analytics
-- ---------------------------------------------------------------------------

create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  anon_id     text,
  scores      jsonb not null default '{}'::jsonb,
  result_code text not null,
  top_traits  text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Matching RPC: count how many of the user's (up to 3) Holland letters appear
-- in each course's riasec_tag. Partial match = >= 2 shared letters (PRD §6:
-- exact match, else fall back to the top-2 traits). Exact = all 3 shared.
-- ---------------------------------------------------------------------------

create or replace function public.match_courses(p_code text)
returns table (
  id            uuid,
  slug          text,
  name          text,
  degree_type   text,
  field         text,
  riasec_tag    text,
  overview      text,
  core_subjects text[],
  pros          text[],
  cons          text[],
  created_at    timestamptz,
  match_score   int
)
language sql
stable
as $$
  with code as (
    select upper(coalesce(p_code, '')) as c
  )
  select
    c.id, c.slug, c.name, c.degree_type, c.field, c.riasec_tag,
    c.overview, c.core_subjects, c.pros, c.cons, c.created_at,
    (
      (case when length(code.c) >= 1 and position(substr(code.c, 1, 1) in upper(c.riasec_tag)) > 0 then 1 else 0 end) +
      (case when length(code.c) >= 2 and position(substr(code.c, 2, 1) in upper(c.riasec_tag)) > 0 then 1 else 0 end) +
      (case when length(code.c) >= 3 and position(substr(code.c, 3, 1) in upper(c.riasec_tag)) > 0 then 1 else 0 end)
    ) as match_score
  from public.courses c, code
  where (
    (case when length(code.c) >= 1 and position(substr(code.c, 1, 1) in upper(c.riasec_tag)) > 0 then 1 else 0 end) +
    (case when length(code.c) >= 2 and position(substr(code.c, 2, 1) in upper(c.riasec_tag)) > 0 then 1 else 0 end) +
    (case when length(code.c) >= 3 and position(substr(code.c, 3, 1) in upper(c.riasec_tag)) > 0 then 1 else 0 end)
  ) >= 2
  order by match_score desc, c.name asc;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.careers        enable row level security;
alter table public.courses        enable row level security;
alter table public.course_careers enable row level security;
alter table public.assessments    enable row level security;

-- Public read for reference data.
create policy "careers_public_read"
  on public.careers for select
  to anon, authenticated using (true);

create policy "courses_public_read"
  on public.courses for select
  to anon, authenticated using (true);

create policy "course_careers_public_read"
  on public.course_careers for select
  to anon, authenticated using (true);

-- Anonymous analytics: insert-only, no read-back.
create policy "assessments_anon_insert"
  on public.assessments for insert
  to anon, authenticated with check (true);

-- Allow the matching function to be called by the anon/authenticated roles.
grant execute on function public.match_courses(text) to anon, authenticated;

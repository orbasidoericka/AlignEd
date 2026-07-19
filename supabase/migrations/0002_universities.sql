-- AlignEd university directory: Central Luzon HEIs and the courses they
-- offer with tuition bands. Reference data, public-read, mutation-blocked —
-- same access model as 0001.

create table if not exists public.universities (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  city           text not null,
  province       text not null,                 -- e.g. 'Pampanga', 'Bulacan'
  type           text not null check (type in ('public', 'private')),
  description    text not null default '',
  website        text not null default '',
  admission_link text not null default '',
  created_at     timestamptz not null default now()
);

create table if not exists public.university_courses (
  university_id         uuid not null references public.universities(id) on delete cascade,
  course_id             uuid not null references public.courses(id) on delete cascade,
  -- Estimated tuition band per semester in PHP; 0/0 = no data yet.
  estimated_tuition_low  integer not null default 0 check (estimated_tuition_low >= 0),
  estimated_tuition_high integer not null default 0 check (estimated_tuition_high >= estimated_tuition_low),
  primary key (university_id, course_id)
);

create index if not exists idx_universities_city     on public.universities (city);
create index if not exists idx_universities_province on public.universities (province);
create index if not exists idx_university_courses_course on public.university_courses (course_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (public read, no mutations — matches 0001 policies)
-- ---------------------------------------------------------------------------

alter table public.universities       enable row level security;
alter table public.university_courses enable row level security;

create policy "universities_public_read"
  on public.universities for select
  to anon, authenticated using (true);

create policy "university_courses_public_read"
  on public.university_courses for select
  to anon, authenticated using (true);

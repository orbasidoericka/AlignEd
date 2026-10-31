-- Site counters: small aggregate tallies the public site can show. The only
-- key today is 'tests_taken', the lifetime number of completed assessments,
-- rendered on the landing hero.
--
-- It is a counter rather than a count(*) over saved_results on purpose: a
-- student may delete their own record, and purgeExpired hard-deletes rows a
-- year old, so a live count would make the public number go down. This one
-- only ever goes up. It is seeded below with the real row count so it is
-- accurate the moment it ships.
--
-- A counter holds no identifiers of any kind, so it stays inside the
-- anonymous-by-design commitment (PRD, RA 10173).
--
-- RLS is on with no policies, so the anon key can neither read nor write.
-- Every access goes through the app's server routes with the service role
-- key, same as saved_results (0003).

create table if not exists public.site_counters (
  key text primary key,
  value bigint not null default 0 check (value >= 0),
  updated_at timestamptz not null default now()
);

alter table public.site_counters enable row level security;

-- Start from the records that already exist, so the first render is the true
-- figure rather than zero. Does nothing on a re-run.
insert into public.site_counters (key, value)
select 'tests_taken', count(*) from public.saved_results
on conflict (key) do nothing;

-- supabase-js cannot express `value = value + 1`, and read-then-write would
-- lose increments when a class finishes together, so the add happens in one
-- statement inside the database.
create or replace function public.increment_site_counter(p_key text)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.site_counters (key, value, updated_at)
  values (p_key, 1, now())
  on conflict (key) do update
    set value = public.site_counters.value + 1,
        updated_at = now()
  returning value;
$$;

-- security definer bypasses RLS, so only the service role may call it.
revoke all on function public.increment_site_counter(text) from public;
revoke all on function public.increment_site_counter(text) from anon;
revoke all on function public.increment_site_counter(text) from authenticated;
grant execute on function public.increment_site_counter(text) to service_role;

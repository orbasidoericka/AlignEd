-- Saved results: drop the age ceiling of 30. The profile now takes any age
-- from 15 up (late enrollees and returning learners), so the check widens to
-- 10-99: 10 keeps rows saved under the old 10-30 rule valid, and 99 is the
-- profile's two-digit field. Mirrors AGE_MIN/AGE_MAX in
-- apps/web/src/lib/riasec/types.ts.

alter table public.saved_results
  drop constraint if exists saved_results_age_check;

alter table public.saved_results
  add constraint saved_results_age_check check (age between 10 and 99);

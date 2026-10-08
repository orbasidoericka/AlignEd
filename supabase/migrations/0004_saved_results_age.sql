-- Saved results: add the student's age (10-30, as entered on the profile
-- step) for the admin page's age statistics. Nullable, so rows saved before
-- this migration stay valid. Still no name, nickname, school, or answers.

alter table public.saved_results
  add column if not exists age smallint check (age between 10 and 30);

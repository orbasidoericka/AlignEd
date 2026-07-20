---
name: supabase-migration
description: Create a Supabase Postgres migration for AlignEd following project conventions (snake_case, timestamps, anonymous RLS pattern, indexes, generated seed). Use when adding or changing a table, column, policy, index, or function.
disable-model-invocation: true
---

# Supabase Migration

AlignEd has no users: never write a policy referencing `auth.uid()`. The two
RLS patterns are **public-read reference table** (courses, careers) and
**insert-only anonymous table** (assessments — no read-back, update, or
delete).

## Steps
1. Create `supabase/migrations/NNNN_short_description.sql` (next number,
   ordered; `0001_init.sql` is the pattern).
2. Start the file with a one-line rationale comment and the copyright header.
3. Define the table with snake_case names, a uuid primary key, and
   created_at timestamptz default now().
4. Constrain student inputs in the schema: check constraints for enums
   (grade level 11/12, the seven strands), length caps for free text.
5. Enable RLS and pick the matching pattern: public read (reference data) or
   insert-only (anonymous writes).
6. Add indexes for foreign keys and query patterns (e.g. `riasec_tag`);
   unique indexes for natural keys (slugs).
7. Seed data: edit the CSVs in `data/` and regenerate `supabase/seed.sql` via
   `scripts/build-seed.mjs` — never hand-edit the generated file.
8. Provide a matching test asserting the constraint and RLS behavior; if the
   migration touches `match_courses`, update the RPC contract tests with it.

## Template

```sql
-- NNNN: <why this migration exists>
-- Copyright (c) 2026 EdTech. All rights reserved.

create table public.<name> (
  id uuid primary key default gen_random_uuid(),
  -- columns here, with check constraints for enum-like fields
  created_at timestamptz not null default now()
);

alter table public.<name> enable row level security;

-- Pattern A: public-read reference table (no client mutations)
create policy "<name>_public_read" on public.<name>
  for select to anon, authenticated using (true);

-- Pattern B: insert-only anonymous table (no read-back)
create policy "<name>_anon_insert" on public.<name>
  for insert to anon, authenticated with check (true);
```

## Checklist
- [ ] snake_case names, rationale + copyright comment on top
- [ ] check constraints for enum-like student inputs
- [ ] RLS enabled with the correct anonymous pattern (no auth.uid())
- [ ] indexes for FKs and query patterns
- [ ] seed regenerated from data/ CSVs; test for constraint and RLS

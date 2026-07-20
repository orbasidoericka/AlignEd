---
name: aligned-feature
description: Scaffold a full AlignEd feature slice end to end - reference-data migration and seed CSVs, pure domain logic in src/lib/riasec, results UI component, and tests - following the project deliverable format. Use when building or extending a feature of the four-step journey (profile, assessment, results, export).
disable-model-invocation: true
---

# AlignEd Feature Slice

## Scope gate (check first)
The feature must serve the PRD's four-step journey: Landing → Profile Setup →
RIASEC Assessment → Results Dashboard (`docs/AlignEd_PRD.md`). Anything else —
accounts, directories, social features, new persistence of personal data — is
rejected and referred back to the PRD. AlignEd never adds authentication.

## Output format
Deliver in this order: Summary, Why (PRD requirement ID), Design, DB Schema
(if any), API/Edge Function, Frontend, Tests, Deployment notes, Acceptance
criteria (mapped to PRD §9). Keep each snippet small and reviewable.

## Steps
1. Confirm scope against the PRD and list edge cases (PRD §8); make a todo
   checklist and run major changes by the user first.
2. Data: if reference data changes, edit the CSVs in `data/` and regenerate
   the seed via `scripts/build-seed.mjs`; schema changes go through the
   supabase-migration skill (anonymous RLS pattern, indexes).
3. Domain logic: pure, deterministic modules in `src/lib/riasec/` (scoring,
   strand validation) — side-effect-free, exhaustively unit tested; UI never
   hard-codes their rules.
4. API: anonymous insert paths or Edge Functions only, with zod validation,
   returning { data, error, meta } (see backend-endpoint skill).
5. Frontend: shadcn/ui (Base UI) + vendored MagicUI/Aceternity components,
   client-side zod validation, accessibility, thumb-zone responsive layout,
   motion behind the global reduced-motion gate.
6. Tests: Vitest unit tests for domain logic + one Playwright happy-path
   journey using seed data; visual snapshot if the page is new.
7. Document each change with a one-line rationale + usage.

## Guardrails
- Strict types, no any. RLS enforces access in the DB (public-read reference
  tables, insert-only assessments, no auth.uid() — there are no users).
- No PII at rest; raw emails are send-and-discard.
- Do not auto-commit or auto-push.

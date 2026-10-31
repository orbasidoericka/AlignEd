---
name: plan-feature
description: Plan a new AlignEd feature, function, component, API route, hook, or behaviour change that the user proposes, before any code is written. Reads docs/ first to check scope and invariants, scans the codebase for modules/functions/components to reuse, then designs the plan in plan mode with the Plan agent and ends with ExitPlanMode. Use this whenever the user says add, build, implement, create, plan, "can we have", "I want X to do Y", "how would we do X", or describes new functionality for AlignEd — even if they never say the word "plan". Prefer this over jumping straight into code or a generic brainstorm for any non-trivial change in this repo.
---

# Plan a Feature (AlignEd)

Goal: turn a user's feature idea into an approved, scope-checked plan that reuses what already exists. Three gates, in order: **docs → reuse → plan**. Order matters: docs decide *whether* and *within what rules* to build; the reuse scan decides *what not to write*; only then is design worth doing. Skipping ahead produces plans that violate the PRD or duplicate existing code — the two most expensive mistakes in this repo.

This skill plans only. Do not edit app code or docs while running it; the only file you write is the plan file.

## 0. Enter plan mode

If plan mode is not active, call `EnterPlanMode` first (load it via ToolSearch if deferred). Plan mode keeps everything read-only until the user approves, and gives you the plan file path.

Restate the request in one line and tag areas it touches: **frontend** (routes, components, store, hooks), **backend** (API, Supabase, env, email, rate limits), **design** (tokens, copy, motion, a11y), **data** (CSV, seed, migrations). Tags pick which docs to read next.

## 1. Docs gate

Doc priority comes from `CLAUDE.md`: the PRD wins over every other doc; `DESIGN.md` wins over `AlignEd_Design_Vision.md` for surfaces/colour; code wins over docs when they disagree (flag the drift in the plan).

Read:

| Always | `docs/AlignEd_PRD.md`, `docs/PRODUCT.md`, top of `docs/AlignEd_Implementation_Plan.md` (phase status) |
| :--- | :--- |
| frontend | `docs/FRONTEND.md` |
| backend / data | `docs/BACKEND.md` |
| design / any UI | `docs/DESIGN.md`; `docs/AlignEd_Design_Vision.md` for journey architecture (Focus Mode, nav) |
| any Next.js API (routing, caching, proxy, server actions, metadata) | `docs/Next16_Delta_Notes.md` + relevant file in `node_modules/next/dist/docs/` — Next 16 is not Next 15 |

The docs are long. Grep them for the feature's keywords and read the matching sections plus each doc's `## Changelog` head (recent changes often matter most), instead of reading every file top to bottom.

Produce, in your notes:

- **Scope verdict** — in scope (cite PRD section/heading) / partially / not found. If the PRD or PRODUCT doesn't cover it, it's out of scope by project rule: stop and ask the user (AskUserQuestion) whether to extend the PRD first or drop it. Don't quietly plan an out-of-scope feature.
- **Invariants at risk** — go through the "Product invariants", "Design rules", "Motion & sound" and "Code rules" in `CLAUDE.md` and list each one this feature could touch, with how the plan will respect it. The ones that bite most often: no PII at rest / RA 10173, only one server write (`saved_results` via `/api/results`), linear journey + guards, no ranking / match % / "best match", 42 verbatim statements, tokens only (no raw hex), one stage accent per screen, animate on viewport entry, sound click-only, server secrets never `NEXT_PUBLIC_`, perf budget.
- **Doc conflicts** — anything where docs disagree with each other or with the code.

## 2. Reuse scan

Before designing anything, find what already exists. Read `references/reuse-map.md` for the map of folders and key exports — it is a starting point and may be stale, so verify paths with Grep/Glob.

Then launch 1–2 Explore agents in parallel (one is enough for a narrow feature). Give each a concrete keyword list derived from the request, the folders to cover, and ask for `path:line` hits with one-line descriptions. Typical split: one agent on `apps/web/src/components` + `app/`, one on `src/lib`, `src/hooks`, `src/store`, `app/api`, `supabase/migrations`, `tests/e2e`.

Look specifically for:
- components that already render the thing or something close (dialogs, sheets, cards, badges in `components/ui` are Base UI wrappers, not Radix)
- lib functions for validation, rate limiting, ids, scoring, formatting, PDF/email output
- store fields/selectors already holding the data
- tokens/utilities in `apps/web/src/app/globals.css` (`@theme inline`) for any colour/spacing need
- existing tests to extend (`*.test.ts` beside source, `apps/web/tests/e2e`)

Build a **reuse table**: `need → existing path:line → reuse as-is / extend / new` with a short why. "New" entries need a reason the existing thing doesn't fit.

## 3. Design with the Plan agent

Spawn one Plan agent. Its prompt must carry everything it can't rediscover cheaply:
- the one-line request and area tags
- scope verdict with PRD citation
- invariants at risk and how they constrain the design
- the reuse table (instruct it to build on these, not reinvent them)
- relevant Next 16 notes if any
- ask for: ordered steps, files to create/modify, data/API contracts, tests to add, risks, and which docs + changelog lines need updating per the Doc map in `CLAUDE.md`

Read the critical files it names yourself before accepting the design — agents occasionally misread code.

## 4. Clarify

Use AskUserQuestion only for genuine forks the user must decide (e.g. which screen hosts a feature, whether something gets stored server-side). Put the recommended option first. Don't ask things the docs or code already answer.

## 5. Write the plan file and exit

Write the plan file with exactly these sections:

```markdown
# Plan: <feature>

## Context
Why: the need, what prompted it, intended outcome.

## Scope check
In scope per <PRD section>. (Or: PRD extended in step N, per user decision.)

## Invariants at risk
- <invariant> → <how the plan respects it>

## Reuse
| Need | Existing | Decision |
| :--- | :--- | :--- |
| ... | `path:line` | reuse / extend / new (why) |

## Steps
1. <step> — files: `path`, `path`
...

## Docs to update
- `docs/<DOC>.md` § <section> + changelog: `- YYYY-MM-DD · area · what changed · why`
(per the Doc map in CLAUDE.md; omit only for pure refactors)

## Verification
- `npm run lint && npm run typecheck && npm test` (root)
- `npm -w apps/web run test:e2e` if journey/routes change
- UI: light + dark, 360px, keyboard-only, reduced motion
- <feature-specific checks>
```

Keep it scannable: recommended approach only, no surveys of alternatives. Use today's absolute date in changelog lines. Then call `ExitPlanMode`.

# AlignEd — Working Rules

Anonymous RIASEC career guidance for PH Senior High (Grade 11–12) students. Mobile-first (360px, ₱6,000 Android).

## Read before work
- Scope: `docs/AlignEd_PRD.md` wins over every other doc. Not in PRD/`docs/PRODUCT.md` = out of scope.
- Visuals: `docs/DESIGN.md` wins over `docs/AlignEd_Design_Vision.md` for surfaces/colour; Vision still owns journey architecture (Focus Mode, journey-aware nav).
- Area docs: `docs/FRONTEND.md` (routes, state, client features), `docs/BACKEND.md` (API, DB, env, privacy), `docs/DESIGN.md` (UI/UX).

## Doc map (where each change gets logged)
| Change touches | Update + log in |
| :--- | :--- |
| Scope, requirements, acceptance criteria | `docs/AlignEd_PRD.md` (+ `docs/PRODUCT.md` summary) |
| Routes, components, store, hooks, client libs, tests | `docs/FRONTEND.md` |
| API routes, Supabase, migrations, seed, env vars, email, rate limits, headers | `docs/BACKEND.md` |
| Colour, tokens, type, layout, motion, sound, copy, a11y visuals | `docs/DESIGN.md` |
| Next.js 16 behaviour discovered | `docs/Next16_Delta_Notes.md` |
| Roadmap/phase status | `docs/AlignEd_Implementation_Plan.md` |

- Same change as the code, not later. Spans areas → log in each doc concerned.
- Edit the doc body so it states current truth, then add one line at the top of that doc's `## Changelog` (create the section if missing): `- YYYY-MM-DD · area · what changed · why`. Newest first, absolute dates.
- Log behaviour/contract changes only. Skip pure refactors, typo fixes, test-only changes.
- New area (e.g. data pipeline, deploy) outgrowing these docs → new `docs/<AREA>.md` with same Changelog format, then add a row here.
- Framework: Next.js 16.2.5 is NOT Next 15. Read `node_modules/next/dist/docs/` + `docs/Next16_Delta_Notes.md` first. Middleware = `proxy.ts`. Caching = Cache Components (`'use cache'`).
- Code is the plan of record. When a doc and code disagree, code wins: fix the doc (and log it), or ask if the code looks like the bug.

## Layout
- Monorepo, npm workspaces. App in `apps/web`. Root scripts proxy: `npm run dev|build|lint|typecheck|test`. E2E: `npm -w apps/web run test:e2e`.
- `src/app`: `(site)` landing/results, `(focus)/assessment` profile+quiz, `admin/[token]`, `api/{send-results,results}`.
- `src/components`: `ui` (Base UI wrappers, not Radix), `aceternity`, `magic`, `blocks`, `journey`, `riasec`, `career-look`.
- `src/lib/riasec` (questions, scoring, career-pathways), `src/store/useAssessmentStore.ts` (Zustand + localStorage).
- `supabase/migrations`, `data/*.csv` → `npm run seed:build`.

## Product invariants (never break)
- Journey strictly linear: Landing → Profile → Assessment → Results. Guards redirect to earlier step.
- No accounts/auth. No PII at rest. Nickname, school, photo never stored server-side. Email send-and-discard; salted hash in memory only. RA 10173.
- Only server write: one nameless `saved_results` row per session (scores, code, grade, age, date) via `/api/results`, service-role key only.
- Profile: nickname 1–8 `A–Z`/`-`, normalized per keystroke; grade `11`/`12`; SHS strand enum; age 10–30; privacy notice accepted — all required. School optional ≤120.
- 42 verbatim statements, 7/trait, binary Yes=1/No=0. One question per screen, auto-advance, Back (absent on Q1). Re-answer replaces, never double-counts.
- Code = top 3 by score, tie-break R→I→A→S→E→C. Deterministic. Flat profile → R-I-A + exploratory note.
- Results show ALL majors + pathways per letter, sheet order. No ranking, match %, or "best match" labels (test-enforced).
- Session expires 30 min after last change; localStorage failure degrades to memory + notice.

## Design rules (details in docs/DESIGN.md)
- Themes: Vivid (internal `light`, default) + Dark. No `system`. Both WCAG AA.
- Tokens only, in `apps/web/src/app/globals.css` (`@theme inline`). No `tailwind.config.ts`. Never raw hex in components; pass `var(--token)`.
- Neon fills (`#2192FF #38E54D #9CFF2E #FDFF00`) carry dark ink; coloured text uses `-strong`. Larger-than-chip areas use `highlight-soft`.
- Blue and yellow never blend directly — pale bridge stop between.
- One stage accent per app screen: Profile=yellow, Assessment=blue, Results=green. Controls use `currentColor`.
- Contrast changes = re-measure numerically, never eyeball.
- Banned: gradient text (except hero "Align"), border-left accents, identical icon-card grids, uppercase eyebrows, numbered section scaffolding, cream/beige bg, em dashes in UI copy, buzzwords, motion that gates content, `bg-current/<n>` tints (use `control-wash`).
- Type: Poppins headings, Nunito Sans body. No thin weights, no all-caps body.
- Textures: Hexagon Pattern everywhere except Profile (Aurora). No third.

## Motion & sound
- Animate on viewport entry, not mount (only exceptions: hex glow, aurora drift). `motion-safe:` + root `MotionConfig reducedMotion="user"`. Reduced motion loses zero content.
- Sound is decoration: click only, never hover, every failure silent. `celebration` only on the completing answer.

## Code rules
- Every control: hover, focus-visible, disabled. Enum inputs are pickers, never free text.
- Decorative art `alt=""` + `aria-hidden`. Hexi via `<img>`, not `next/image`.
- Trait art generated: edit `assets/*-source/*.svg`, run `npm -w apps/web run generate:trait-art`, commit both.
- Registry components (`npx shadcn@latest add @aceternity|@magicui/...`): move into library folder, swap neutrals for tokens, port v3 config into `@theme`.
- Copyright header on new source files: `// Copyright (c) 2026 EdTech. All rights reserved.`
- Server secrets never `NEXT_PUBLIC_`.
- Perf budget: Lighthouse ≥90 mobile, LCP <2.5s, landing JS ≤~180KB gz.

## Before claiming done
- `npm run lint && npm run typecheck && npm test` from root.
- UI change: check light + dark, 360px, keyboard-only, reduced motion.
- Playwright (MCP browser or `test:e2e`) only for UI/UX testing of AlignEd screens. Skip it for non-UI work (docs, backend, lib logic, planning, tooling).
- Docs updated + changelog line added per Doc map.

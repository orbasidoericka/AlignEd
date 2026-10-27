<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Frontend

How the client app is built: routes, state, journey logic, and client-side features. Visual rules live in `DESIGN.md`; server routes and data live in `BACKEND.md`.

## Stack

Next.js 16.2.5 App Router, React 19, TypeScript, Tailwind v4 (tokens in `apps/web/src/app/globals.css`), Base UI wrappers in `components/ui`, framer-motion 12, Zustand 5, Recharts, sonner, next-themes. Read `Next16_Delta_Notes.md` before framework work.

## Routes (`apps/web/src/app`)

| Route | Group | Notes |
| :--- | :--- | :--- |
| `/` | `(site)` | Landing. Journey-aware CTA (`components/journey/hero-cta.tsx`). |
| `/assessment/profile` | `(focus)` | Profile form (`journey/profile-form.tsx`). Focus Mode shell, no site chrome. |
| `/assessment` | `(focus)` | Quiz (`journey/assessment-runner.tsx`, `question-navigator.tsx`: progress bar on top, question grid behind an "All questions" toggle). |
| `/results` | `(site)` | Dashboard (`journey/results-dashboard.tsx`), exports (`results-actions.tsx`), compare (`saved-results-panel.tsx`). |
| `/dev/career-looks` | `(site)` | Dev preview of career-look props. |
| `/admin/[token]` | — | Server-rendered admin stats; see `BACKEND.md`. |

`(focus)/layout.tsx` renders `FocusBar`; `(site)/layout.tsx` renders site header + footer.

## State

- `store/useAssessmentStore.ts`: Zustand + `persist` (localStorage). Holds profile (nickname, grade, strand, age, school), answers keyed by question id, scores, `questionOrder` (per-session shuffle). Re-answer replaces the old contribution. Stored data from an older bank/scale is discarded on load (PRD E7).
- Session TTL: 30 min after last change. Wiped on rehydrate by the store and live by `components/session-expiry-guard.tsx`.
- `lib/career-look/photo-store.ts`: last career-look photo, memory only, never persisted.
- `hooks/use-hydrated.ts`: gate anything that reads persisted state, so the server render never depends on it.
- `components/journey/journey-guard.tsx`: redirects to the correct earlier step and withholds content until rehydration finishes.

## Logic (`lib/riasec`)

- `questions.ts`: 42 verbatim statements + `shuffleQuestionIds` / `orderQuestions`.
- `scoring.ts`: pure, order-independent; top 3 with R→I→A→S→E→C tie-break.
- `career-pathways.ts`: official sheet data (descriptions, majors, pathways). Landing trait strip reads from it too.
- `validate-results.ts`: shared shape checks used by the API routes.

## Client features

- **PDF download** (`lib/results-pdf/download-results-pdf.ts`): pdfmake loaded lazily on click, built fully in the browser. Password = nickname + code (`password.ts`). Layout in `build-results-pdf.ts`, shared with the server email twin.
- **Email dialog** posts to `/api/send-results`; zod-style validation client-side first.
- **Saved results** (`lib/saved-results/client.ts`): calls `/api/results` to save and fetch a past result by results ID for comparison.
- **Career look** (`components/career-look`, `lib/career-look`): camera + MediaPipe face landmarks, props anchored in face widths. Model fetched by `scripts/prepare-face-model.mjs` on `predev`/`prebuild`.
- **Sound** (`lib/sound`, `components/sound-provider.tsx`): one delegated click listener; preference in `localStorage` `aligned.sound`.
- **Rapid-answer guard** (`hooks/use-rapid-answer-guard.ts`).
- **Analytics** (`components/analytics.tsx`): PostHog, no-op unless `NEXT_PUBLIC_POSTHOG_KEY` is set.

## Testing

- Unit/component: Vitest + Testing Library, co-located `*.test.ts(x)`, setup in `src/test/setup.ts`. `npm test`.
- E2E: Playwright in `apps/web/tests/e2e`. `npm -w apps/web run test:e2e`.

## Changelog

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-10-27 · frontend · `QuestionNavigator` renders `ui/Progress` bar with milestone notches plus a collapsible grid (closed by default, auto-opens on failed finish); `assessment-runner` is single-column at all breakpoints; `AnimatedCircularProgressBar` deleted · lighter quiz chrome

- 2026-10-27 · docs · Created this file from the current code. · Split frontend notes out of the PRD and Implementation Plan.

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

- `store/useAssessmentStore.ts`: Zustand + `persist` (localStorage). Holds profile (nickname, grade, strand, age, school), answers keyed by question id, scores, `questionOrder` (per-session shuffle), `language` (`en` | `fil`, set by the toggle in `assessment-runner`; persist version 9). Re-answer replaces the old contribution. Stored data from an older bank/scale is discarded on load (PRD E7).
- Session TTL: 30 min after last change. Wiped on rehydrate by the store and live by `components/session-expiry-guard.tsx`.
- Tab-close wipe: every load sets `sessionStorage` `aligned.tab`; a rehydrated session with `completedAt` set and no marker is wiped (`isOrphanedFinishedSession`). Unfinished quizzes keep resuming. Unreadable `sessionStorage` = no wipe (TTL only).
- `components/journey/results-expiry-note.tsx`: countdown under the Results h1, from `sessionRemainingMs(lastUpdated)`; ticks 1 s, hidden in print, screen readers get a per-minute sentence.
- `lib/career-look/photo-store.ts`: last career-look photo, memory only, never persisted.
- `hooks/use-hydrated.ts`: gate anything that reads persisted state, so the server render never depends on it.
- `components/journey/journey-guard.tsx`: redirects to the correct earlier step and withholds content until rehydration finishes.

## Logic (`lib/riasec`)

- `questions.ts`: 42 verbatim statements + `shuffleQuestionIds` / `orderQuestions`; `questionText` / `answerLabel` pick English or Filipino.
- `questions-fil.ts`: supplied Filipino translation keyed by question id. A test requires one entry per id.
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
- **Finish pop-up** (`components/journey/finish-dialog.tsx`, Base UI `Dialog`): `assessment-runner` opens it via `requestFinish` once the store has all 42 answers (after the 280ms advance delay); the runner's "Finish assessment" button remains only to reopen it after Review.
- **Analytics** (`components/analytics.tsx`): PostHog, no-op unless `NEXT_PUBLIC_POSTHOG_KEY` is set.

## Testing

- Unit/component: Vitest + Testing Library, co-located `*.test.ts(x)`, setup in `src/test/setup.ts`. `npm test`.
- E2E: Playwright in `apps/web/tests/e2e`. `npm -w apps/web run test:e2e`.

## Changelog

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-11-02 · components · Dialog, AlertDialog, Sheet, Tooltip, Chart tooltip, navbar, quiz warning, chips and glows use shadow tokens; new `shadow-tokens.test.ts` guard · UI uniformity, see DESIGN.md Elevation
- 2026-11-02 · store/results · tab-marker wipe of finished sessions, `ResultsExpiryNote` countdown · results gone after tab close and lifetime visible
- 2026-11-02 · frontend · New `FinishDialog`; `assessment-runner` drops the full-screen finish view and opens the dialog automatically from `advanceToNextOpen` / `goForward` when no statement is open · students no longer hunt for a finish button.
- 2026-10-31 · frontend · `BackgroundGradient` takes `glowClassName`; `assessment-runner` tones Yes/No per option (`ANSWER_TONE`) and moves the language toggle under the statement · see DESIGN.md.

- 2026-10-31 · frontend · Assessment gets an English / Filipino toggle: statements from `questions-fil.ts`, answers Oo / Hindi, O / H shortcuts beside Y / N, `language` added to the store (persist v9) · Filipino-speaking students can answer in their own language; scoring is keyed by id so it is unaffected.
- 2026-10-27 · frontend · `QuestionNavigator` renders `ui/Progress` bar with milestone notches plus a collapsible grid (closed by default, auto-opens on failed finish); `assessment-runner` is single-column at all breakpoints; `AnimatedCircularProgressBar` deleted · lighter quiz chrome

- 2026-10-27 · docs · Created this file from the current code. · Split frontend notes out of the PRD and Implementation Plan.

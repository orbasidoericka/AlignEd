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
| `/assessment` | `(focus)` | Quiz (`journey/assessment-runner.tsx`, `question-navigator.tsx`: progress strip across the top; question numbers in a sticky right panel from `lg`, shown or hidden with the icon `QuestionGridToggle` beside the language switch). |
| `/results` | `(site)` | Dashboard (`journey/results-dashboard.tsx`), exports (`results-actions.tsx`), compare (`saved-results-panel.tsx`). |
| `/dev/career-looks` | `(site)` | Dev preview of career-look props. |
| `/admin/[token]` | — | Server-rendered admin stats; see `BACKEND.md`. |

`(focus)/layout.tsx` renders `FocusBar`; `(site)/layout.tsx` renders site header + footer.

## State

- `store/useAssessmentStore.ts`: Zustand + `persist` (localStorage). Holds profile (nickname, grade, strand, `strandOther` for the typed "Others" strand, age, school), answers keyed by question id, scores, `questionOrder` (per-session shuffle), `language` (`en` | `fil`, set by the toggle in `assessment-runner`; persist version 9). Re-answer replaces the old contribution. Stored data from an older bank/scale is discarded on load (PRD E7).
- Session TTL: 30 min after last change. Wiped on rehydrate by the store and live by `components/session-expiry-guard.tsx`.
- Tab-close wipe: every load sets `sessionStorage` `aligned.tab`; a rehydrated session with `completedAt` set and no marker is wiped (`isOrphanedFinishedSession`). Unfinished quizzes keep resuming. Unreadable `sessionStorage` = no wipe (TTL only).
- `components/journey/results-expiry-note.tsx`: countdown under the Results h1, from `sessionRemainingMs(lastUpdated)`; ticks 1 s, hidden in print, screen readers get a per-minute sentence.
- `lib/career-look/photo-store.ts`: last career-look photo, memory only, never persisted.
- `hooks/use-hydrated.ts`: gate anything that reads persisted state, so the server render never depends on it.
- Persist writes are coalesced (`coalescedStorage` in the store, `STORAGE_WRITE_DELAY_MS` = 250): the latest state lands after a short pause, at once on `pagehide` / tab hidden; `removeItem` (Start over, expiry) is never delayed and cancels any pending write. Reads see the pending value.
- `hooks/use-fancy-motion.ts`: JS twin of the `fancy:` CSS variant (mouse device, no reduced motion). `GlowingEffect` attaches its scroll/pointer listeners only when true.
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
- **Terms and privacy** (`components/journey/privacy-consent.tsx`): one `POLICY_SECTIONS` array feeds the profile consent dialog and the footer's read-only `PrivacyPolicyDialog`. Text wrapped in `**...**` renders bold via `renderInline`. `PRIVACY_POLICY_VERSION` (`v2.0`) and `PRIVACY_CONTACT_EMAIL` are exported. The data list must match what the code collects; change one, change the other.

## Testing

- Unit/component: Vitest + Testing Library, co-located `*.test.ts(x)`, setup in `src/test/setup.ts`. `npm test`.
- E2E: Playwright in `apps/web/tests/e2e`. `npm -w apps/web run test:e2e`.

## Changelog

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-11-04 · frontend · Show/hide of the question numbers moved up into `assessment-runner` (`gridChoice`: null until chosen, then true/false; `useMediaQuery("(min-width: 64rem)")` for the toggle's aria state and the phone-only fold after a jump; a failed finish sets it true). `QuestionNavigator` is now controlled (`gridOpen`, `panelId`, `onHide`) and no longer owns a toggle; new exported `QuestionGridToggle` (icon only) renders in the runner's language row; new `hooks/use-media-query.ts` · the toggle had to sit beside the language switch and work at every width, so its state could no longer live inside the navigator.
- 2026-11-04 · frontend · `QuestionNavigator` now renders two sections (progress strip, "All questions" panel) and takes `progressClassName` / `panelClassName` instead of `className`; `assessment-runner` is two columns from `lg` (strip spans both, panel `lg:col-start-2` sticky) and its root is `overflow-clip`; "Step 2 of 3" and "n to go" removed · grid beside the question instead of above it, see DESIGN.md.
- 2026-11-04 · perf · Store writes coalesced; `useFancyMotion` hook gates `GlowingEffect`; `RiasecRadar` loads its Recharts half (`riasec-radar-chart.tsx`) via `next/dynamic` with a same-size placeholder (sr-only table stays eager); `Highlighter` imports rough-notation on draw and redraws without replaying on resize; `TextGenerateEffect` is a server component with CSS word delays; `BlurFade` drops blur and `AnimatePresence`; wordmark gets `sizes`; `next.config` adds `framer-motion` to `optimizePackageImports` (AVIF was tried and dropped the same day: a stuck AVIF encode left the logo blank in dev, for a few KB saved); About photo `ericka.png` (8.1 MB) replaced by `ericka.jpg` (31 KB, 600px). · Site lagged on low-end phones; see DESIGN.md Motion for measurements.
- 2026-11-04 · frontend · `SHS_STRANDS` gains "Others"; profile gets `strandOther` (no persist bump) and the form shows a "Type your strand" input when Others is picked, required by `selectIsProfileComplete`; `strandLabel()` prints the typed text in the PDF; saved record still sends only "Others". Profile heading is "Tell us about yourself" (landing journey card too), "Step 1 of 3" and placeholders removed, consent blurb shortened, policy v2.1. · Students with an unlisted strand can continue; typed text never reaches the server.
- 2026-11-04 · frontend · `privacy-consent.tsx`: policy rewritten in plain words (v2.0) with a full data-collected list, a Terms section, and `**bold**` key points via `renderInline`; consent checkbox and error hint now say "Terms and Conditions"; footer link reads "Terms and Privacy" · students see what is collected and agree to one document.
- 2026-11-02 · frontend · Extracted `journey/language-toggle.tsx`; `QuestionNavigator` takes optional `language` / `onLanguageChange`; the runner no longer renders the pill inside the question block · persistent placement, same store behaviour. Superseded 2026-11-04: the pill is back in the runner above the statement (next to `QuestionGridToggle`), `language-toggle.tsx` and the navigator `language` props were removed.
- 2026-11-02 · components · Dialog, AlertDialog, Sheet, Tooltip, Chart tooltip, navbar, quiz warning, chips and glows use shadow tokens; new `shadow-tokens.test.ts` guard · UI uniformity, see DESIGN.md Elevation
- 2026-11-02 · store/results · tab-marker wipe of finished sessions, `ResultsExpiryNote` countdown · results gone after tab close and lifetime visible
- 2026-11-02 · frontend · New `FinishDialog`; `assessment-runner` drops the full-screen finish view and opens the dialog automatically from `advanceToNextOpen` / `goForward` when no statement is open · students no longer hunt for a finish button.
- 2026-10-31 · frontend · `BackgroundGradient` takes `glowClassName`; `assessment-runner` tones Yes/No per option (`ANSWER_TONE`) and moves the language toggle under the statement · see DESIGN.md.

- 2026-10-31 · frontend · Assessment gets an English / Filipino toggle: statements from `questions-fil.ts`, answers Oo / Hindi, O / H shortcuts beside Y / N, `language` added to the store (persist v9) · Filipino-speaking students can answer in their own language; scoring is keyed by id so it is unaffected.
- 2026-10-27 · frontend · `QuestionNavigator` renders `ui/Progress` bar with milestone notches plus a collapsible grid (closed by default, auto-opens on failed finish); `assessment-runner` is single-column at all breakpoints; `AnimatedCircularProgressBar` deleted · lighter quiz chrome

- 2026-10-27 · docs · Created this file from the current code. · Split frontend notes out of the PRD and Implementation Plan.

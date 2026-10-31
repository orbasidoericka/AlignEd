# AlignEd reuse map

Snapshot of `apps/web/src` (2026-10-27). May be stale: verify with Grep/Glob before citing. Paths relative to `apps/web/src` unless noted.

## Routes (`app/`)
- `(site)/page.tsx` landing · `(site)/results/page.tsx` results · `(site)/dev/career-looks` dev page
- `(focus)/assessment/profile/page.tsx` profile · `(focus)/assessment/page.tsx` quiz · `(focus)/layout.tsx` Focus Mode shell
- `admin/[token]/page.tsx` admin (token gate via `lib/saved-results/admin-access.ts`)
- `api/results/route.ts` (save), `api/results/[id]/route.ts` (get/delete), `api/send-results/route.ts` (email)

## Components (`components/`)
- `ui/` Base UI wrappers (not Radix): alert-dialog, badge, button, card, chart, checkbox, dialog, input, progress, radio-group, separator, sheet, skeleton, sonner (toasts), tooltip
- `journey/`: assessment-runner, focus-bar, hero-cta, journey-guard (step redirects), privacy-consent, profile-form, question-navigator, rapid-answer-warnings, results-actions, results-dashboard, saved-results-panel
- `riasec/`: pathway-results, riasec-radar, trait-emblem, trait-mascot
- `career-look/career-look-dialog.tsx`
- `blocks/`: section-link, site-footer, site-header, wordmark
- `aceternity/`: aurora-background, background-gradient, background-lines, bento-grid, glowing-effect, resizable-navbar
- `magic/`: animated-circular-progress-bar, aurora-text, blur-fade (viewport-entry fade), hexagon-pattern, highlighter, number-ticker, shimmer-button, shine-border
- root: providers, analytics, session-expiry-guard, sound-provider, sound-toggle, theme-toggle

## Lib (`lib/`)
- `riasec/questions.ts`: QUESTIONS, ANSWER_OPTIONS, orderQuestions, shuffleQuestionIds, isValidQuestionOrder
- `riasec/scoring.ts`: TRAIT_ORDER, TRAIT_META, computeHollandCode, formatHollandCode, traitForLetter, maxScorePerTrait
- `riasec/career-pathways.ts`: RIASEC_PATHWAYS, pathwaysForCode, PATHWAYS_SOURCE_TITLE
- `riasec/types.ts`: GRADE_LEVELS, SHS_STRANDS, NICKNAME_MAX_LENGTH, AGE_MIN/MAX, SCHOOL_MAX_LENGTH, sanitizeNickname
- `riasec/validate-results.ts`: isRecord, parseAge, parseTakenOn, validateScoredResults (server-side payload validation)
- `riasec/letter-chip-styles.ts`: per-letter token styles (letterChip, letterWash, letterVar, letterBorder, letterArtStyle)
- `saved-results/`: repository (saveResult, getResult, deleteResult, listResults, purgeExpired, fromRow), client (saveResults, loadSavedResult, deleteSavedResult), results-id (generate/is/normalize), summary (summarize, for admin aggregates), ip-limiter (callerKey, createWindowLimiter), admin-access (isAdminToken)
- `results-email/`: email-content (validateRequest, normalizeEmail, parsePhoto, buildResultsEmail, RATE_LIMITS), rate-limiter (createRateLimiter), send-results-email
- `results-pdf/`: build/render/download-results-pdf, password (resultsPdfPassword, resultsTakenOn), logo
- `career-look/`: looks (CAREER_LOOKS), face-anchor (face/pose math), photo-store (useCareerLookPhoto, photoToBase64; photo client-only)
- `sound/`: sound-manager (SOUNDS, playSound, preloadSounds, stopAllSounds), sound-preference (useSoundEnabled, get/setSoundEnabled)
- `supabase/`: admin.ts (createSupabaseAdminClient, service role, server only), client.ts (browser)
- `utils.ts` cn · `scroll-to-section.ts` scrollToSection · `seeded-random.ts` seededRandom

## Hooks / store
- `hooks/use-hydrated.ts` useHydrated (SSR-safe client check)
- `hooks/use-rapid-answer-guard.ts` evaluateRapidAnswer, useRapidAnswerGuard
- `store/useAssessmentStore.ts` useAssessmentStore (Zustand + localStorage), SESSION_TTL_MS, isSessionExpired, selectIsProfileComplete, selectIsAssessmentComplete

## Styling
- Tokens: `app/globals.css` `@theme inline` (no tailwind.config). Use `var(--token)`, `control-wash`, `highlight-soft`, `-strong` text variants.

## Data / DB (repo root)
- `supabase/migrations/0001_init.sql` … `0004_saved_results_age.sql`
- `data/*.csv` (careers, courses, course_careers, universities, university_courses) → `npm run seed:build`

## Tests
- Unit: `*.test.ts(x)` beside source (vitest). E2E: `apps/web/tests/e2e` (Playwright).

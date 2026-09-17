# AlignEd — Product Requirements Document (PRD)

> **Status:** Approved · Single source of truth
> **Audience:** Engineering, Design, Product, QA
> Every supporting document in `/docs` derives from and must conform to this PRD.

---

## 1. Executive Summary

AlignEd is an anonymous, web-based career-guidance platform for Philippine Junior and Senior High School students. In a single guided session, a student describes their academic profile (grade level), completes a RIASEC (Holland Code) personality assessment, and receives an actionable results dashboard: their 3-letter Holland Code, curated career suggestions, and recommended college degree programs. Students can export their results as a PDF or send them to their email.

The product is deliberately narrow: **four steps, one session, no accounts.** Landing → Profile → Assessment → Results.

## 2. Problem Statement

The transition from SHS to higher education in the Philippines is shaped by parental expectations, peer pressure, and financial constraints. Students frequently choose degree programs based on external pressure rather than measured interest, because they lack access to structured assessment tools and organized, comprehensible career information. The consequences are enrollment in mismatched programs, shifted or abandoned degrees, career dissatisfaction, and diminished well-being.

AlignEd addresses this decision point directly: students discover their Holland Code and are matched to college degree programs and careers grounded in an established psychometric framework (Holland's RIASEC model) instead of hearsay.

## 3. Goals & Non-Goals

### Goals
- G1. Deliver a complete, trustworthy RIASEC assessment that a student can finish in one sitting (~5 minutes) on a low-end mobile phone.
- G2. Recommend careers and college degree programs matched to the student's Holland Code.
- G3. Let students keep their results via PDF download and email delivery — without creating an account.
- G4. Protect student data: anonymous by design, compliant with the Data Privacy Act of 2012 (RA 10173).

### Non-Goals (explicitly out of scope)
- User accounts, authentication, or login of any kind.
- A browsable university/HEI directory or university-to-program mapping.
- AR experiences, simulations, forums, counselor dashboards, scholarship/financial modules, labor-market feeds, or native mobile apps.
- Server-side persistence of personally identifiable information (raw emails, school names tied to identity).

## 4. User Personas

| Persona | Profile | Pain Points | Primary Goal |
| :--- | :--- | :--- | :--- |
| **The Undecided Senior** | Grade 12 student, mobile-first, budget Android device | College application deadlines approaching; pressured toward nursing/engineering; unsure which degree programs actually fit who they are. | Get a fast, credible read on their Holland Code and a shortlist of college programs and careers that genuinely match their interests. |
| **The Early Explorer** | Grade 9–10 student, still choosing a path | Advice from friends and family pulls in different directions; wants to pursue arts but fears it is "impractical"; still exploring options. | Discover their Holland Code early and see legitimate career and degree-program paths that match their genuine interests. |

Both personas are anonymous visitors. There are no secondary personas in scope.

## 5. End-to-End User Flow & Information Architecture

The product is a strict linear journey. Every route, component, and data model serves one of these four steps.

```
[1] Landing ──CTA──▶ [2] Profile Setup ──▶ [3] RIASEC Assessment ──▶ [4] Results Dashboard
                                                                        ├─ Holland Code + trait breakdown
                                                                        ├─ Career suggestions
                                                                        ├─ Recommended college programs
                                                                        └─ Export: PDF · Email
```

### Route map

| Step | Route | Rendering |
| :--- | :--- | :--- |
| Landing | `/` | Static (edge-cached) |
| Profile Setup | `/assessment/profile` | Client component, Focus Mode shell |
| Assessment | `/assessment` | Client component, Focus Mode shell |
| Results | `/results` | Client-computed from local state; reference data server-rendered |

Navigation rules:
- The Assessment route redirects to Profile Setup if no profile exists.
- The Results route redirects to the appropriate earlier step if the assessment is incomplete.
- A returning visitor with completed results in local storage is offered "View your results" from the landing page.

## 6. Functional Requirements

### FR-1 Landing Page
- FR-1.1. Communicates the value proposition: discover your Holland Code and find the right college degree using Holland's RIASEC framework.
- FR-1.2. One primary CTA ("Start the assessment") initiating the journey at Profile Setup.
- FR-1.3. Explains the 4-step journey and expected duration (~5 minutes).
- FR-1.4. Journey-aware CTA: if a completed assessment exists in local storage, the primary CTA becomes "View your results".

### FR-2 Student Profile Setup
Captured before the assessment begins; stored client-side only (localStorage via the persisted store) until the single anonymous submission at completion.

| Field | Type | Constraint |
| :--- | :--- | :--- |
| Nickname | Text | **Required.** 1–8 characters, uppercase letters `A–Z` and the hyphen `-` only. Input is normalized on every keystroke: characters are upper-cased, digits and all other symbols are discarded, and entry stops at 8 characters. It is a display handle, not a real name; it is never sent to the server and never included in the anonymous completion record. |
| Grade Level | Enum | **Required.** Exactly six values: `Grade 7` through `Grade 12`. No free text. |
| School | Text | **Optional.** Max 120 characters. Never used for identification; excluded from analytics aggregation keys. |

- FR-2.1. The "Continue to assessment" action is disabled until both required fields (nickname, grade level) are set.
- FR-2.2. Profile values are editable by returning to this step before completing the assessment.

### FR-3 RIASEC Assessment Engine
- FR-3.1. **Question bank:** the 42 statements of the source RIASEC instrument, statically defined, balanced at exactly 7 items per trait across the six Holland types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional). Statement text is reproduced **verbatim** from the instrument — including its original punctuation — and is not subject to editorial rewriting. Items are presented in the instrument's printed order (traits interleaved, never grouped), and each item's trait assignment is fixed by the instrument's answer key.
- FR-3.2. **Scoring:** each item maps to exactly one trait; answers are binary — **Yes contributes 1 point to that trait, No contributes 0**. A trait's total is therefore its count of Yes answers, bounded at 7. Re-answering a question replaces (never double-counts) its prior contribution; changing Yes to No decrements the trait total accordingly. A No is a recorded answer, not a skipped one, and counts toward completion.
- FR-3.3. **Presentation (strict):**
  - Exactly **one question is on screen at a time**; no list, grid, or multi-question page is permitted.
  - The only answer controls are the binary pair **Yes / No**.
  - **No "Next" control exists.** Selecting Yes or No records the answer and the interface advances to the next question on its own.
  - A **Back** control returns to the previous question. It is unavailable (not merely inert) on the first question.
  - Persistent progress indicator (percent + question count), and the whole bank is completable by keyboard alone.
- FR-3.4. **Backward navigation:** on returning to an earlier question, the student's previous answer is shown as selected and may be changed. Changing it re-scores that item in place (FR-3.2) and advances forward again; the student is never required to re-answer questions they have already completed.
- FR-3.5. **Session handling:** answers persist to localStorage on every change. On refresh or return, the student resumes at their first unanswered question ("Welcome back — continue where you left off?"). Sessions have no server component and no expiry.
- FR-3.6. **Completion:** requires all 42 questions answered (Yes or No). On completion, exactly one anonymous record is inserted into the `assessments` table (scores + profile fields, no identifiers), and the student is redirected to Results.
- FR-3.7. **Retake:** an explicit "Retake assessment" action on Results resets answers and scores (profile is retained and re-confirmable).

### FR-4 Holland Code Computation
- FR-4.1. The 3-letter Holland Code is the three highest-scoring traits, ordered by score descending.
- FR-4.2. **Tie-breaking (deterministic):** ties at any rank are broken by fixed trait order `R → I → A → S → E → C`. The same answer set always yields the same code.
- FR-4.3. The results dashboard displays the code (e.g. `I-A-S`) plus a per-trait breakdown of all six scores (radar chart, normalized against the per-trait ceiling of 7) and short plain-language descriptions of the top three traits.

### FR-5 Majors and Related Pathways
- FR-5.1. Source is the official RIASEC results sheet ("Which Career Pathway is right for you?"), stored as static data in `apps/web/src/lib/riasec/career-pathways.ts`: for each letter, its description, college majors, and related pathways, transcribed in full (only two obvious source typos corrected).
- FR-5.2. For each of the student's top 3 letters, in code order, the dashboard shows that letter's description, **all** of its majors, and **all** of its related pathways. Lists are never truncated.
- FR-5.3. No ranking is shown. Items appear as equal-weight tags in the sheet's own order; there are no "strongest/weakest match", "top choice", match-strength badges, or percentages, because there is no validated basis for ranking items within a letter.

### FR-6 Recommended College Programs (superseded)
- FR-6.1. Superseded by FR-5. The ranked program list (`match_courses(p_code)` with Exact / Strong badges) is no longer displayed. `data/careers.csv`, `data/courses.csv`, and the Supabase seed remain as backend reference data.
- FR-6.2. No university or institution mapping is displayed anywhere.

### FR-7 Export — Download as PDF
- FR-7.1. A "Download PDF" action on the results dashboard produces a shareable document containing: Holland Code + trait scores and the majors and related pathways for each code letter (FR-5), with AlignEd branding and generation date.
- FR-7.2. Implementation is client-side: a print-optimized results view rendered through the browser print-to-PDF pipeline. No server rendering, no upload, no persistence.
- FR-7.3. The PDF layout is single-column A4, legible in grayscale, and excludes all interactive chrome.

### FR-8 Export — Send to Email
- FR-8.1. "Email me my results" opens a dialog: email input + mandatory consent checkbox (Data Privacy Act copy) + send button.
- FR-8.2. Email format is validated client-side (zod) with inline errors before any request is made.
- FR-8.3. Sending calls a Supabase Edge Function (`send-results`) which delivers a branded HTML results email via Resend, then discards the address. **Raw email addresses are never persisted**; only a salted hash is stored for rate limiting.
- FR-8.4. Rate limiting: per-IP and per-hashed-email limits; a honeypot field rejects bots. Limit-exceeded responses return a friendly "try again later" message.
- FR-8.5. Delivery failure surfaces a toast with a retry action; success surfaces a confirmation toast.

## 7. Non-Functional Requirements

| Category | Requirement |
| :--- | :--- |
| **Performance** | Lighthouse ≥ 90 (Performance, Accessibility, SEO) on mobile emulation with throttled CPU, on every PR. LCP < 2.5 s on mid-tier mobile. Landing route JS ≤ ~180 KB gzipped. |
| **Responsiveness** | Mobile-first. Full functional parity from 360 px-wide budget Android devices to desktop. Assessment is fully operable one-handed (thumb zone). |
| **Accessibility** | WCAG 2.1 AA: keyboard navigability, screen-reader labeled controls, visible focus states, contrast in light and dark themes. `prefers-reduced-motion` collapses all nonessential animation with zero content loss. |
| **Privacy & security** | Anonymous by design — no accounts, no PII at rest. Single write path: one anonymous `assessments` insert. Raw emails never stored (hash only, for rate limiting); explicit consent required before sending. Compliant with the Data Privacy Act of 2012 (RA 10173); public privacy notice page. RLS enforced on all tables. Strict security headers (CSP, X-Frame-Options, X-Content-Type-Options) via the Next.js proxy. |
| **Reliability** | Assessment progress survives refresh, tab close, and network loss (local persistence; the journey has no server dependency until the completion insert and optional email send). |
| **Concurrency** | 5,000 concurrent assessment sessions without degradation — achieved architecturally: the assessment is fully client-side; server load is edge-cached reads plus one anonymous insert per completion. |

## 8. Edge Cases & Error Handling

| # | Scenario | Required behavior |
| :--- | :--- | :--- |
| E1 | Two or more traits tie in the top 3 | Deterministic tie-break by `R → I → A → S → E → C` order (FR-4.2). Ties are common on the 0–7 integer scale, so this path is routine rather than exceptional; the breakdown shows exact scores so ties are visible to the student. |
| E2 | All six traits equal (flat profile) | Code computed per FR-4.2 (`R-I-A`); dashboard adds an insight note that the profile is balanced and results should be read as exploratory. |
| E3 | Student answers No to all 42 items | Every trait scores 0 — a valid flat profile, not an error. Handled as E2: deterministic `R-I-A` code plus the exploratory insight note. Results, export, and email all remain available. |
| E4 | Student refreshes / closes tab mid-quiz | Resume from localStorage at first unanswered question (FR-3.5). |
| E5 | Student navigates to `/results` without completing | Redirect to the correct earlier step (§5 navigation rules). |
| E6 | Student uses Back and changes an earlier answer | Prior contribution replaced, never double-counted; a Yes→No change decrements the trait (FR-3.2, FR-3.4). |
| E7 | Stored answers predate the current question bank or answer scale | Discarded on load: the quiz restarts from question 1 with zeroed scores; the student's profile is preserved. |
| E7a | Stored profile predates the nickname field | An empty nickname is backfilled on load. The profile is then incomplete, so the student is routed to Profile Setup to supply one; their grade level and school are still filled in. |
| E8 | Invalid email submitted | Client-side zod validation blocks the request; inline field error (FR-8.2). |
| E9 | Email send fails (network / provider) | Toast with retry; results remain on screen; PDF download offered as fallback (FR-8.5). |
| E10 | Email rate limit exceeded | Friendly "try again later" message; no address stored (FR-8.4). |
| E11 | Completion insert fails | Results still render (computed client-side); insert retried in the background; failure never blocks the student's results. |
| E12 | localStorage unavailable (private mode edge cases) | Journey still works within the session in memory; a notice warns that refresh will lose progress. |

## 9. Acceptance Criteria (Definition of Done)

### Profile Setup
- **Given** a new visitor on Profile Setup, **when** the nickname or grade level is unset, **then** the continue action is disabled and each missing field is indicated.
- **Given** the nickname field, **when** lowercase letters are typed, **then** they appear upper-cased.
- **Given** the nickname field, **when** digits or symbols other than `-` are typed or pasted, **then** they do not appear in the field.
- **Given** a nickname already at 8 characters, **when** more characters are typed, **then** the value stays at 8.
- **Given** an empty nickname, **when** continue is attempted, **then** the journey does not advance and an inline error names the missing nickname.
- **Given** the grade level control, **then** it offers exactly `Grade 7` through `Grade 12` and no free-text entry.
- **Given** a school name of more than 120 characters, **when** typed or pasted, **then** input is truncated/blocked at 120 with a visible counter.

### Assessment
- **Given** the assessment route at any point in the bank, **then** exactly one statement is visible, the only answer controls are Yes and No, and no "Next" control is present anywhere on screen.
- **Given** a student viewing a question, **when** they choose Yes or No, **then** the answer is recorded and the next question appears without any further interaction.
- **Given** the final question, **when** it is answered, **then** the completion state is reached without a "Next" or "Submit" press.
- **Given** a student on question *n* > 1, **when** they use Back, **then** question *n − 1* appears with its previously chosen answer shown as selected.
- **Given** the first question, **then** the Back control is unavailable.
- **Given** a previously answered question, **when** the student changes Yes to No, **then** that trait's total decreases by exactly 1 and the interface advances forward again.
- **Given** any complete answer set, **then** each trait's total equals its count of Yes answers and never exceeds 7.
- **Given** a student mid-assessment, **when** they refresh the page, **then** they resume at their first unanswered question with all prior answers intact.
- **Given** an unanswered question remains, **then** completion is not reachable.
- **Given** the whole bank, **then** it is completable using the keyboard alone.
- **Given** completion, **then** exactly one anonymous `assessments` row is inserted containing the six scores, Holland code, grade level, and (if provided) school — and no identifier and no nickname.

### Holland Code
- **Given** any complete answer set, **when** scored twice, **then** the identical 3-letter code results (deterministic, property-tested).
- **Given** tied trait scores, **then** ranking follows `R → I → A → S → E → C`.

### Careers & Programs
- **Given** a computed code, **then** career suggestions are ordered exact-match-first and each card shows its Holland tags.
- **Given** a computed code, **then** 3–5 programs render with correct match-strength badges consistent with `match_courses` output, and no card displays or links to any university.

### PDF Export
- **Given** the results dashboard, **when** "Download PDF" is used, **then** the produced document contains code + scores, career suggestions, and programs, renders on A4 without clipped content, and contains no navigation chrome.

### Email Delivery
- **Given** an invalid email, **when** send is attempted, **then** no network request is made and an inline error shows.
- **Given** an unchecked consent box, **then** the send action is disabled.
- **Given** a successful send, **then** the student sees a confirmation toast and the database contains no raw email address (verified by inspecting the Edge Function's writes).
- **Given** the rate limit is exceeded, **then** the student sees the "try again later" message and no email is sent.

### Non-functional gates
- Lighthouse ≥ 90 (Perf/A11y/SEO, mobile emulation) enforced in CI on every PR.
- The complete journey is finishable with keyboard only, and with `prefers-reduced-motion` enabled, with no loss of content or function.

---

## 10. System Architecture (informative)

AlignEd ships as a mostly-static, anonymous-first Next.js application.

- **Client:** Next.js **16.2.5** App Router, React 19, TypeScript. *This Next.js version has breaking changes versus common knowledge (proxy replaces middleware; new caching model) — the bundled docs at `node_modules/next/dist/docs/` and `docs/Next16_Delta_Notes.md` are required reading before framework work.*
- **State:** Zustand with localStorage persistence for the profile + assessment session (existing `useAssessmentStore` at `apps/web/src/store/useAssessmentStore.ts`); server components own all reference data; no client state mirrors server data.
- **Styling/UI:** Tailwind **v4** (`@theme` tokens in `globals.css`; no `tailwind.config.ts`), shadcn/ui on **Base UI** for all foundational controls, MagicUI/Aceternity/Efferd vendored for motion and structure (see Design Vision).
- **Backend:** Supabase — Postgres with RLS, Edge Functions. **Supabase Auth is deliberately unused.** Email via Resend from the `send-results` Edge Function.
- **Hosting/CI:** Vercel + Supabase Cloud; GitHub Actions (lint, typecheck, Vitest, build, Lighthouse gate); Sentry, PostHog, Vercel Analytics.

### Database design

Reference tables (public read, no mutations from clients) and one anonymous write table:

| Table | Purpose | Key columns |
| :--- | :--- | :--- |
| `courses` | Degree programs | id, name, description, `riasec_tag` (indexed) |
| `careers` | Careers | id, title, description, `riasec_tag` (indexed) |
| `course_careers` | Program ↔ career links | course_id FK, career_id FK |
| `assessments` | One anonymous row per completion | id, six trait scores, `holland_code`, `grade_level` (`7`–`12`), `school` (nullable text ≤ 120), created_at |

- RLS: public read on reference tables; **insert-only** on `assessments` (no read-back); no user-scoped policies because there are no users.
- `match_courses(p_code)` RPC ranks programs by shared Holland letters (exact = 3, partial = 2, alphabetical tiebreak).
- There are **no** `users`, `student_profiles`, `universities`, or `university_courses` tables in scope.

### Testing strategy (summary — full protocol in the Implementation Plan)
- **Unit (Vitest):** scoring library incl. property-based determinism and tie-break tests; store re-answer correction.
- **Integration:** RPC contract tests against real migrations + seed; component tests with mocked Supabase.
- **E2E (Playwright):** land → profile → full quiz → results → PDF + email (Resend mocked); mid-quiz refresh/resume; invalid-email and rate-limit paths.
- **Visual regression:** key pages, light + dark, `reducedMotion: 'reduce'`.

## 11. MVP Scope Statement

**In:** the four-step journey exactly as specified in §5–§6, on seeded static reference data for programs and careers.
**Out:** everything listed in §3 Non-Goals. There is no partial or hidden version of any excluded feature.

## 12. Risks & Mitigation

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Assessment abandonment | Low completion rates | Focus Mode UI, progress indication, localStorage resume, ~5-minute length, single-tap binary answers with auto-advance, milestone encouragement (see Design Vision). |
| Email abuse / privacy exposure | Legal and trust damage | No accounts; send-and-discard; hashed-email + per-IP rate limits; consent checkbox with DPA copy; honeypot; DKIM/SPF. |
| Stale program/career data | Loss of trust | Versioned CSV → seed pipeline; data edits ship as reviewed PRs. |
| Low-end mobile performance | Primary audience bounces | Reduced-motion gate, LazyMotion, viewport-triggered animation only, CI Lighthouse gate with CPU throttling. |

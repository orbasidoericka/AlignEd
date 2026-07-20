# AlignEd — Product Requirements Document (PRD)

> **Status:** Approved · Single source of truth
> **Audience:** Engineering, Design, Product, QA
> Every supporting document in `/docs` derives from and must conform to this PRD.

---

## 1. Executive Summary

AlignEd is an anonymous, web-based career-guidance platform for Philippine Senior High School (SHS) students. In a single guided session, a student describes their academic profile (grade level and SHS strand), completes a RIASEC (Holland Code) personality assessment, and receives an actionable results dashboard: their 3-letter Holland Code, a **Strand Validation** verdict evaluating whether their current SHS strand aligns with their measured interests, curated career suggestions, and recommended college degree programs. Students can export their results as a PDF or send them to their email.

The product is deliberately narrow: **four steps, one session, no accounts.** Landing → Profile → Assessment → Results.

## 2. Problem Statement

The transition from SHS to higher education in the Philippines is shaped by parental expectations, peer pressure, and financial constraints. Students frequently choose strands and degree programs based on external pressure rather than measured interest, because they lack access to structured assessment tools and organized, comprehensible career information. The consequences are enrollment in mismatched programs, shifted or abandoned degrees, career dissatisfaction, and diminished well-being.

AlignEd addresses the two decision points where misalignment takes root:

1. **Strand choice validation** — a Grade 11 or 12 student can verify whether their current strand matches their interest profile while there is still time to adjust course.
2. **Degree program selection** — students receive program and career suggestions grounded in an established psychometric framework (Holland's RIASEC model) instead of hearsay.

## 3. Goals & Non-Goals

### Goals
- G1. Deliver a complete, trustworthy RIASEC assessment that a student can finish in one sitting (~8 minutes) on a low-end mobile phone.
- G2. Produce a Strand Validation verdict (*Aligned / Partially Aligned / Misaligned*) with constructive, non-judgmental insight copy.
- G3. Recommend careers and college degree programs matched to the student's Holland Code.
- G4. Let students keep their results via PDF download and email delivery — without creating an account.
- G5. Protect student data: anonymous by design, compliant with the Data Privacy Act of 2012 (RA 10173).

### Non-Goals (explicitly out of scope)
- User accounts, authentication, or login of any kind.
- A browsable university/HEI directory or university-to-program mapping.
- AR experiences, simulations, forums, counselor dashboards, scholarship/financial modules, labor-market feeds, or native mobile apps.
- Server-side persistence of personally identifiable information (raw emails, school names tied to identity).

## 4. User Personas

| Persona | Profile | Pain Points | Primary Goal |
| :--- | :--- | :--- | :--- |
| **The Undecided Senior** | Grade 12 SHS student, STEM strand, mobile-first, budget Android device | College application deadlines approaching; pressured toward nursing/engineering; unsure whether STEM was ever the right fit. | Get a fast, credible read on whether their strand and intended degree match who they actually are — and a shortlist of programs to research. |
| **The Early Explorer** | Grade 11 SHS student, recently chose their strand | Chose their strand on a friend's advice; wants to pursue arts but fears it is "impractical"; still has time to shift. | Validate (or challenge) their strand choice early, and see legitimate career paths for their interest profile. |

Both personas are anonymous visitors. There are no secondary personas in scope.

## 5. End-to-End User Flow & Information Architecture

The product is a strict linear journey. Every route, component, and data model serves one of these four steps.

```
[1] Landing ──CTA──▶ [2] Profile Setup ──▶ [3] RIASEC Assessment ──▶ [4] Results Dashboard
                                                                        ├─ Holland Code + trait breakdown
                                                                        ├─ Strand Validation verdict
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
- FR-1.1. Communicates the value proposition: validate your SHS strand and find the right college degree using Holland's RIASEC framework.
- FR-1.2. One primary CTA ("Start the assessment") initiating the journey at Profile Setup.
- FR-1.3. Explains the 4-step journey and expected duration (~8 minutes).
- FR-1.4. Journey-aware CTA: if a completed assessment exists in local storage, the primary CTA becomes "View your results".

### FR-2 Student Profile Setup
Captured before the assessment begins; stored client-side only (localStorage via the persisted store) until the single anonymous submission at completion.

| Field | Type | Constraint |
| :--- | :--- | :--- |
| Grade Level | Enum | **Required.** Exactly two values: `Grade 11`, `Grade 12`. No free text. |
| SHS Strand | Enum | **Required.** Exactly seven values: `STEM`, `ABM`, `HUMSS`, `GAS`, `TVL`, `Arts & Design`, `Sports`. |
| School | Text | **Optional.** Max 120 characters. Never used for identification; excluded from analytics aggregation keys. |

- FR-2.1. The "Continue to assessment" action is disabled until both required fields are set.
- FR-2.2. Profile values are editable by returning to this step before completing the assessment; editing the strand after results exist triggers re-computation of the Strand Validation verdict only (no quiz retake required).

### FR-3 RIASEC Assessment Engine
- FR-3.1. **Question bank:** 30–48 statically defined Likert items, balanced at 5–8 per trait across the six Holland types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional). Language reviewed for Filipino SHS reading level.
- FR-3.2. **Scoring:** each item maps to exactly one trait; a 5-point Likert response (1–5) adds its value to that trait's running total. Re-answering a question replaces (never double-counts) its prior contribution.
- FR-3.3. **Progress:** persistent progress indicator (percent + step count); one question in focus at a time; keyboard-completable.
- FR-3.4. **Session handling:** answers persist to localStorage on every change. On refresh or return, the student resumes at their first unanswered question ("Welcome back — continue where you left off?"). Sessions have no server component and no expiry.
- FR-3.5. **Completion:** requires all questions answered. On completion, exactly one anonymous record is inserted into the `assessments` table (scores + profile fields, no identifiers), and the student is redirected to Results.
- FR-3.6. **Retake:** an explicit "Retake assessment" action on Results resets answers and scores (profile is retained and re-confirmable).

### FR-4 Holland Code Computation
- FR-4.1. The 3-letter Holland Code is the three highest-scoring traits, ordered by score descending.
- FR-4.2. **Tie-breaking (deterministic):** ties at any rank are broken by fixed trait order `R → I → A → S → E → C`. The same answer set always yields the same code.
- FR-4.3. The results dashboard displays the code (e.g. `I-A-S`) plus a per-trait breakdown of all six scores (radar chart) and short plain-language descriptions of the top three traits.

### FR-5 Strand Validation (core logic)
Evaluates the student's inputted SHS Strand against their computed Holland Code.

**Strand → RIASEC mapping (canonical):**

| SHS Strand | Mapped Holland letters |
| :--- | :--- |
| STEM | I, R |
| ABM | E, C |
| HUMSS | S, A |
| TVL | R, C |
| Arts & Design | A, R |
| Sports | R, S |
| GAS | *Generalist — special rule (FR-5.3)* |

**Verdict rule:** count the overlap between the strand's mapped letters and the student's 3-letter code.

| Shared letters | Verdict |
| :--- | :--- |
| 2 | **Aligned** |
| 1 | **Partially Aligned** |
| 0 | **Misaligned** |

- FR-5.1. The verdict is displayed prominently on the results dashboard with the shared letters highlighted as evidence.
- FR-5.2. Every verdict includes constructive insight copy. *Misaligned* copy must never state the student "chose wrong"; it frames the result as new information and, for Grade 11 students, notes that strand shifting is still possible.
- FR-5.3. **GAS special case:** GAS is exploratory by design and maps to no fixed letters. GAS students always receive the verdict **"Aligned — Flexible"** with copy explaining that their code now gives them the direction GAS was designed to help them find.
- FR-5.4. The mapping table and verdict thresholds live in one versioned module (`src/lib/riasec/strand-validation.ts`); UI never hard-codes them.

### FR-6 Career Suggestions
- FR-6.1. Careers are seeded reference data (from `data/careers.csv`), each tagged with a Holland letter set.
- FR-6.2. The dashboard shows a curated list (top 6–10) of careers ranked by letter overlap with the student's code (exact 3-letter matches first, then 2-letter matches).
- FR-6.3. Each career shows title, one-line description, and its Holland tags.

### FR-7 Recommended College Programs
- FR-7.1. Degree programs are seeded reference data (from `data/courses.csv`), each tagged with a Holland letter set. Ranking uses the existing `match_courses(p_code)` SQL RPC (exact = 3 shared letters, partial = 2), surfacing the top 3–5 programs.
- FR-7.2. Recommendations incorporate the strand context: when the student's strand is a conventional prerequisite for a program (e.g. STEM for engineering), the card notes it; when it is not, the card notes possible bridging requirements. This is display copy driven by seeded data — no gatekeeping logic.
- FR-7.3. Each program shows name, description, match strength badge (Exact / Strong), and related careers.
- FR-7.4. No university or institution mapping is displayed anywhere. Program cards do not link to schools.

### FR-8 Export — Download as PDF
- FR-8.1. A "Download PDF" action on the results dashboard produces a shareable document containing: Holland Code + trait scores, Strand Validation verdict + insight, career suggestions, and recommended programs, with AlignEd branding and generation date.
- FR-8.2. Implementation is client-side: a print-optimized results view rendered through the browser print-to-PDF pipeline. No server rendering, no upload, no persistence.
- FR-8.3. The PDF layout is single-column A4, legible in grayscale, and excludes all interactive chrome.

### FR-9 Export — Send to Email
- FR-9.1. "Email me my results" opens a dialog: email input + mandatory consent checkbox (Data Privacy Act copy) + send button.
- FR-9.2. Email format is validated client-side (zod) with inline errors before any request is made.
- FR-9.3. Sending calls a Supabase Edge Function (`send-results`) which delivers a branded HTML results email via Resend, then discards the address. **Raw email addresses are never persisted**; only a salted hash is stored for rate limiting.
- FR-9.4. Rate limiting: per-IP and per-hashed-email limits; a honeypot field rejects bots. Limit-exceeded responses return a friendly "try again later" message.
- FR-9.5. Delivery failure surfaces a toast with a retry action; success surfaces a confirmation toast.

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
| E1 | Two or more traits tie in the top 3 | Deterministic tie-break by `R → I → A → S → E → C` order (FR-4.2). The breakdown shows exact scores so ties are visible to the student. |
| E2 | All six traits equal (flat profile) | Code computed per FR-4.2 (`R-I-A`); dashboard adds an insight note that the profile is balanced and results should be read as exploratory. |
| E3 | Student refreshes / closes tab mid-quiz | Resume from localStorage at first unanswered question (FR-3.4). |
| E4 | Student navigates to `/results` without completing | Redirect to the correct earlier step (§5 navigation rules). |
| E5 | Student changes an earlier answer | Prior contribution replaced, never double-counted (FR-3.2). |
| E6 | GAS strand | Always "Aligned — Flexible" (FR-5.3); the generic overlap rule is never applied to GAS. |
| E7 | Invalid email submitted | Client-side zod validation blocks the request; inline field error (FR-9.2). |
| E8 | Email send fails (network / provider) | Toast with retry; results remain on screen; PDF download offered as fallback (FR-9.5). |
| E9 | Email rate limit exceeded | Friendly "try again later" message; no address stored (FR-9.4). |
| E10 | Completion insert fails | Results still render (computed client-side); insert retried in the background; failure never blocks the student's results. |
| E11 | Strand edited after completion | Strand Validation verdict recomputed; scores and code unchanged (FR-2.2). |
| E12 | localStorage unavailable (private mode edge cases) | Journey still works within the session in memory; a notice warns that refresh will lose progress. |

## 9. Acceptance Criteria (Definition of Done)

### Profile Setup
- **Given** a new visitor on Profile Setup, **when** grade level or strand is unset, **then** the continue action is disabled and each missing field is indicated.
- **Given** the grade level control, **then** it offers exactly `Grade 11` and `Grade 12` and no free-text entry.
- **Given** the strand control, **then** it offers exactly the seven canonical strands (FR-2 table).
- **Given** a school name of more than 120 characters, **when** typed or pasted, **then** input is truncated/blocked at 120 with a visible counter.

### Assessment
- **Given** a student mid-assessment, **when** they refresh the page, **then** they resume at their first unanswered question with all prior answers intact.
- **Given** a student re-answers question *n*, **then** the affected trait totals reflect only the latest answer.
- **Given** an unanswered question remains, **then** completion is not reachable.
- **Given** completion, **then** exactly one anonymous `assessments` row is inserted containing the six scores, Holland code, grade level, strand, and (if provided) school — and no identifier.

### Holland Code
- **Given** any complete answer set, **when** scored twice, **then** the identical 3-letter code results (deterministic, property-tested).
- **Given** tied trait scores, **then** ranking follows `R → I → A → S → E → C`.

### Strand Validation
- **Given** a computed code sharing 2+ letters with the strand mapping, **then** the verdict is *Aligned*; 1 shared letter → *Partially Aligned*; 0 → *Misaligned* — verified by a unit test matrix covering all 7 strands × representative codes.
- **Given** a GAS student, **then** the verdict is always "Aligned — Flexible".
- **Given** any *Misaligned* verdict, **then** the displayed copy contains constructive framing and (for Grade 11) mentions the option to shift strands.

### Careers & Programs
- **Given** a computed code, **then** career suggestions are ordered exact-match-first and each card shows its Holland tags.
- **Given** a computed code, **then** 3–5 programs render with correct match-strength badges consistent with `match_courses` output, and no card displays or links to any university.

### PDF Export
- **Given** the results dashboard, **when** "Download PDF" is used, **then** the produced document contains code + scores, verdict + insight, careers, and programs, renders on A4 without clipped content, and contains no navigation chrome.

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
| `assessments` | One anonymous row per completion | id, six trait scores, `holland_code`, `grade_level` (`11`/`12`), `strand` (7-value enum), `school` (nullable text ≤ 120), created_at |

- RLS: public read on reference tables; **insert-only** on `assessments` (no read-back); no user-scoped policies because there are no users.
- `match_courses(p_code)` RPC ranks programs by shared Holland letters (exact = 3, partial = 2, alphabetical tiebreak).
- There are **no** `users`, `student_profiles`, `universities`, or `university_courses` tables in scope.

### Testing strategy (summary — full protocol in the Implementation Plan)
- **Unit (Vitest):** scoring library incl. property-based determinism and tie-break tests; strand-validation matrix (all 7 strands); store re-answer correction.
- **Integration:** RPC contract tests against real migrations + seed; component tests with mocked Supabase.
- **E2E (Playwright):** land → profile → full quiz → results → PDF + email (Resend mocked); mid-quiz refresh/resume; invalid-email and rate-limit paths.
- **Visual regression:** key pages, light + dark, `reducedMotion: 'reduce'`.

## 11. MVP Scope Statement

**In:** the four-step journey exactly as specified in §5–§6, on seeded static reference data for programs and careers.
**Out:** everything listed in §3 Non-Goals. There is no partial or hidden version of any excluded feature.

## 12. Risks & Mitigation

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Assessment abandonment | Low completion rates | Focus Mode UI, progress indication, localStorage resume, ~8-minute length, milestone encouragement (see Design Vision). |
| Strand-mapping disputes (students/educators question the matrix) | Trust damage | Mapping is versioned in one module with cited rationale; insight copy frames verdicts as guidance, not judgment; GAS special-cased. |
| Email abuse / privacy exposure | Legal and trust damage | No accounts; send-and-discard; hashed-email + per-IP rate limits; consent checkbox with DPA copy; honeypot; DKIM/SPF. |
| Stale program/career data | Loss of trust | Versioned CSV → seed pipeline; data edits ship as reviewed PRs. |
| Low-end mobile performance | Primary audience bounces | Reduced-motion gate, LazyMotion, viewport-triggered animation only, CI Lighthouse gate with CPU throttling. |

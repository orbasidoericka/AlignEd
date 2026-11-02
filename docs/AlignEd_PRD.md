# AlignEd — Product Requirements Document (PRD)

> **Status:** Approved · Single source of truth
> **Audience:** Engineering, Design, Product, QA
> Every supporting document in `/docs` derives from and must conform to this PRD.

---

## 1. Executive Summary

AlignEd is an anonymous, web-based career-guidance platform for Philippine Senior High School students (Grade 11 and 12). In a single guided session, a student describes their academic profile (grade level, strand, age), completes a RIASEC (Holland Code) personality assessment, and receives an actionable results dashboard: their 3-letter Holland Code, and the college majors and related career pathways for each code letter. Students can download their results as a password-protected PDF, send that PDF to their email, and keep a random results ID that lets them compare a later retake against a saved, nameless copy.

The product is deliberately narrow: **four steps, one session, no accounts.** Landing → Profile → Assessment → Results.

## 2. Problem Statement

The transition from SHS to higher education in the Philippines is shaped by parental expectations, peer pressure, and financial constraints. Students frequently choose degree programs based on external pressure rather than measured interest, because they lack access to structured assessment tools and organized, comprehensible career information. The consequences are enrollment in mismatched programs, shifted or abandoned degrees, career dissatisfaction, and diminished well-being.

AlignEd addresses this decision point directly: students discover their Holland Code and are matched to college degree programs and careers grounded in an established psychometric framework (Holland's RIASEC model) instead of hearsay.

## 3. Goals & Non-Goals

### Goals
- G1. Deliver a complete, trustworthy RIASEC assessment that a student can finish in one sitting (~5 minutes) on a low-end mobile phone.
- G2. Recommend careers and college degree programs matched to the student's Holland Code.
- G3. Let students keep their results via PDF download, email delivery, and a results ID for comparing a later retake — without creating an account.
- G4. Protect student data: anonymous by design, compliant with the Data Privacy Act of 2012 (RA 10173).

### Non-Goals (explicitly out of scope)
- User accounts, authentication, or login of any kind.
- A browsable university/HEI directory or university-to-program mapping.
- Simulations, forums, counselor dashboards, scholarship/financial modules, labor-market feeds, or native mobile apps. (The in-browser career-look camera preview, FR-11, is in scope; nothing else AR is.)
- Server-side persistence of personally identifiable information (raw emails, names, nicknames, schools, photos, individual answers).

## 4. User Personas

| Persona | Profile | Pain Points | Primary Goal |
| :--- | :--- | :--- | :--- |
| **The Undecided Senior** | Grade 12 student, mobile-first, budget Android device | College application deadlines approaching; pressured toward nursing/engineering; unsure which degree programs actually fit who they are. | Get a fast, credible read on their Holland Code and a shortlist of college programs and careers that genuinely match their interests. |
| **The Early Explorer** | Grade 11 student, still choosing a path | Advice from friends and family pulls in different directions; wants to pursue arts but fears it is "impractical"; still exploring options. | Discover their Holland Code early and see legitimate career and degree-program paths that match their genuine interests. |

Both personas are anonymous visitors. There are no secondary personas in scope.

## 5. End-to-End User Flow & Information Architecture

The product is a strict linear journey. Every route, component, and data model serves one of these four steps.

```
[1] Landing ──CTA──▶ [2] Profile Setup ──▶ [3] RIASEC Assessment ──▶ [4] Results Dashboard
                                                                        ├─ Holland Code + trait breakdown
                                                                        ├─ Career suggestions
                                                                        ├─ College majors + related pathways per letter
                                                                        ├─ Career-look photo (optional)
                                                                        └─ Keep: PDF · Email · Results ID (compare later)
```

### Route map

| Step | Route | Rendering |
| :--- | :--- | :--- |
| Landing | `/` | Static (edge-cached) |
| Profile Setup | `/assessment/profile` | Client component, Focus Mode shell |
| Assessment | `/assessment` | Client component, Focus Mode shell |
| Results | `/results` | Client-computed from local state; majors/pathways from static data |
| Admin (not part of the journey) | `/admin/[token]` | Server-rendered; secret-link access (FR-10) |

Server routes (Next.js route handlers, Node runtime): `POST /api/results`, `GET`/`DELETE /api/results/[id]` (FR-9), `POST /api/send-results` (FR-8).

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
- FR-1.5. Shows the lifetime number of assessments taken, read from an aggregate counter (`site_counters`, key `tests_taken`) incremented once per completion. The figure is cumulative and never decreases: deleting a saved result or purging an expired one does not un-take the test. It is a count only — no identifiers, nothing per student — so it stays inside the anonymous-by-design commitment. When the count cannot be read, nothing is shown; a placeholder or estimate is never substituted.

### FR-2 Student Profile Setup
Captured before the assessment begins; stored client-side only (localStorage via the persisted store). Only grade level and age ever reach the server, inside the nameless saved-results record (FR-9).

| Field | Type | Constraint |
| :--- | :--- | :--- |
| Nickname | Text | **Required.** 1–8 characters, uppercase letters `A–Z` and the hyphen `-` only. Input is normalized on every keystroke: characters are upper-cased, digits and all other symbols are discarded, and entry stops at 8 characters. It is a display handle, not a real name; it is never stored on the server and never included in the saved-results record. It reaches the server only inside an email request (FR-8), to name and password the PDF, and is discarded with the address. |
| Grade Level | Enum | **Required.** Exactly two values: `Grade 11` and `Grade 12`. No free text. |
| SHS Strand | Enum | **Required.** One of the supported academic, Arts and Design, Sports, or TVL strands: ABM, STEM, HUMSS, GAS, Arts and Design, Sports, AFA, HE, IA, or ICT. No free text. |
| Age | Whole number | **Required.** 10–30. Stored in the saved-results record for the admin page's age statistics. |
| School | Text | **Optional.** Max 120 characters. Never leaves the device except printed in the student's own PDF/email. |
| Privacy notice | Checkbox | **Required.** The student accepts the privacy notice (RA 10173), versioned in `components/journey/privacy-consent.tsx`, before continuing. |

- FR-2.1. The "Continue to assessment" action is unavailable until all required fields (nickname, grade level, SHS strand, age, privacy acceptance) are set.
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
- FR-3.5. **Session handling:** answers persist to localStorage on every change. On refresh or return, the student resumes at their first unanswered question ("Welcome back — continue where you left off?"). Sessions have no server component and expire 30 minutes after the last change: on the next visit an older session is wiped from localStorage — profile, answers, scores, and the saved results alike — and the student starts fresh, so an abandoned quiz is never left on a shared or school device for the next student to resume.
- FR-3.6. **Completion:** requires all 42 questions answered (Yes or No). On completion the student goes to Results, which saves exactly one nameless record per session (FR-9).
- FR-3.7. **Retake:** an explicit "Retake assessment" action on Results resets answers and scores (profile is retained and re-confirmable).
- FR-3.9. **Results lifetime:** a finished session (all 42 answered) is visible for as long as the 30-minute session allows and no longer than the tab: when the tab or browser session ends and the student returns, a finished session is wiped like an expired one and they start at Profile. An unfinished quiz still resumes (E4). The tab is detected with a `sessionStorage` marker, so a refresh keeps results while a closed tab does not; where `sessionStorage` is unreadable only the 30-minute limit applies. Results shows a live countdown note ("Your results stay on this device for 24:10 more, or until you close this tab.") with a Results ID reminder once one exists. The saved Results ID (FR-9, one year) is unaffected and is the way back to scores.
- FR-3.8. **Filipino statements:** an English / Filipino toggle on the assessment screen switches the 42 statements to the supplied Filipino translation (`lib/riasec/questions-fil.ts`, keyed by question id) and the answer pair to **Oo / Hindi**. Presentation only: ids, trait assignment, scoring, order and the English text are unchanged, answers already given are kept when the language is switched, and Y/N and O/H both work as keyboard shortcuts. The choice persists with the session (default English) and is cleared with it. The translation is reproduced as supplied, not editorially rewritten. The rest of the interface stays in English.

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
- FR-7.1. A "Download PDF" action on the results dashboard produces a document containing: nickname, grade, strand, age, school (if given), test date, Holland Code + all six trait scores, and the description, majors and related pathways for each code letter (FR-5), with AlignEd branding and page numbers.
- FR-7.2. Built entirely in the browser with pdfmake (`lib/results-pdf/download-results-pdf.ts`), loaded only on click. No upload, no persistence.
- FR-7.3. The PDF is encrypted. Its password is the nickname followed by the three code letters (e.g. `MARI` + `I-R-A` → `MARIIRA`), shown to the student on screen.
- FR-7.4. Layout is A4 and legible in grayscale.

### FR-8 Export — Send to Email
- FR-8.1. "Email me my results" opens a dialog: email input + mandatory consent checkbox (Data Privacy Act copy) + send button.
- FR-8.2. Email format is validated client-side with inline errors before any request is made; the server validates again.
- FR-8.3. Sending calls `POST /api/send-results`, a Next.js route that renders the same encrypted PDF as FR-7 on the server (`lib/results-pdf/render-results-pdf.ts`) and sends it, plus the career-look photo if the student took one (JPEG, ≤3 MB), from the program's Gmail account over SMTP (nodemailer, `GMAIL_USER` + `GMAIL_APP_PASSWORD`). The address and photo are then discarded. **Raw email addresses are never persisted.**
- FR-8.4. Rate limiting: 3 sends per address per rolling day and 20 per network per rolling hour, keyed by salted SHA-256 hashes held in server memory (per-process random salt, reset on restart). A filled `website` honeypot field is answered with a fake success and nothing is sent. Limit-exceeded responses (HTTP 429) show a friendly "try again later" message.
- FR-8.5. Delivery failure surfaces a toast with a retry action; success surfaces a confirmation toast.

### FR-9 Saved Results and Compare
- FR-9.1. On reaching Results, the client calls `POST /api/results` once per session. The server stores one row in `saved_results`: the six trait scores, the score ceiling, the Holland code, grade level, age, and test date. No name, nickname, school, email, photo, or individual answers.
- FR-9.2. The server answers with a random results ID (`ALGN-XXXX-XXXX`, 8 characters from a 32-letter alphabet without 0/O/1/I, 2^40 possibilities). The student keeps it; it is the only key to the row and works like a password.
- FR-9.3. A student can enter an earlier results ID (any case, with or without dashes or prefix) to compare their current results against that saved copy (`GET /api/results/[id]`), or delete their saved copy (`DELETE /api/results/[id]`).
- FR-9.4. Rows expire one year after creation.
- FR-9.5. Limits: 200 saves and 60 lookups per network per hour (in-memory), generous because a school lab shares one IP.
- FR-9.6. A failed save never blocks the results: the panel says so and offers "Try again". If the server is not configured, the compare panel says comparing is not set up.

### FR-10 Admin Page
- FR-10.1. `/admin/<ADMIN_TOKEN>` shows aggregate statistics over saved results (count, average age, strongest interest area, most common codes, age distribution) and a table of the latest results. Rows carry no identity, so neither does the page.
- FR-10.2. There is no login: the link is the key. The token is compared in constant time; if `ADMIN_TOKEN` is unset or shorter than 32 characters the page stays locked. Revoking means changing `ADMIN_TOKEN` and restarting.

### FR-11 Career Look (optional photo)
- FR-11.1. From Results, a student may open the camera and try on career-themed props anchored to their face (MediaPipe face landmarks, in-browser). Camera access is the only browser permission the site requests.
- FR-11.2. The last photo is kept in memory only (never persisted, gone on refresh) and can be attached to the results email (FR-8.3). It is never stored on the server.

## 7. Non-Functional Requirements

| Category | Requirement |
| :--- | :--- |
| **Performance** | Lighthouse ≥ 90 (Performance, Accessibility, SEO) on mobile emulation with throttled CPU, on every PR. LCP < 2.5 s on mid-tier mobile. Landing route JS ≤ ~180 KB gzipped. |
| **Responsiveness** | Mobile-first. Full functional parity from 360 px-wide budget Android devices to desktop. Assessment is fully operable one-handed (thumb zone). |
| **Accessibility** | WCAG 2.1 AA: keyboard navigability, screen-reader labeled controls, visible focus states, contrast in light and dark themes. `prefers-reduced-motion` collapses all nonessential animation with zero content loss. |
| **Privacy & security** | Anonymous by design — no accounts, no PII at rest. Single write path: one nameless `saved_results` row per session, written only by server routes with the service-role key (RLS on, no policies, so the anon key can neither read nor write). Raw emails never stored; rate-limit keys are salted hashes in memory only. Explicit privacy acceptance at Profile Setup and consent before each email. Compliant with the Data Privacy Act of 2012 (RA 10173); the privacy notice is versioned with the code. Security headers set in `next.config.ts` for every path: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` allowing only same-origin camera. A strict nonce-based CSP (in `proxy.ts`) is deferred to hardening. Server secrets never use the `NEXT_PUBLIC_` prefix. |
| **Reliability** | Assessment progress survives refresh, tab close, and network loss (local persistence; the journey has no server dependency until the saved-results call and optional email send, and neither blocks the results). |
| **Concurrency** | 5,000 concurrent assessment sessions without degradation — achieved architecturally: the assessment is fully client-side; server load is static pages plus one small insert per completion. In-memory rate limiters count per server instance; a shared store is needed if the app runs on several instances. |

## 8. Edge Cases & Error Handling

| # | Scenario | Required behavior |
| :--- | :--- | :--- |
| E1 | Two or more traits tie in the top 3 | Deterministic tie-break by `R → I → A → S → E → C` order (FR-4.2). Ties are common on the 0–7 integer scale, so this path is routine rather than exceptional; the breakdown shows exact scores so ties are visible to the student. |
| E2 | All six traits equal (flat profile) | Code computed per FR-4.2 (`R-I-A`); dashboard adds an insight note that the profile is balanced and results should be read as exploratory. |
| E3 | Student answers No to all 42 items | Every trait scores 0 — a valid flat profile, not an error. Handled as E2: deterministic `R-I-A` code plus the exploratory insight note. Results, export, and email all remain available. |
| E4 | Student refreshes / closes tab mid-quiz | Resume from localStorage at first unanswered question (FR-3.5). |
| E4a | Student closes the tab after finishing, then reopens the site | Finished session is wiped; the student starts at Profile. A Results ID still opens the saved copy (FR-3.9). |
| E5 | Student navigates to `/results` without completing | Redirect to the correct earlier step (§5 navigation rules). |
| E6 | Student uses Back and changes an earlier answer | Prior contribution replaced, never double-counted; a Yes→No change decrements the trait (FR-3.2, FR-3.4). |
| E7 | Stored answers predate the current question bank or answer scale | Discarded on load: the quiz restarts from question 1 with zeroed scores; the student's profile is preserved. |
| E7a | Stored profile predates the nickname field | An empty nickname is backfilled on load. The profile is then incomplete, so the student is routed to Profile Setup to supply one; their grade level and school are still filled in. |
| E8 | Invalid email submitted | Client-side validation blocks the request; inline field error (FR-8.2). |
| E9 | Email send fails (network / provider) | Toast with retry; results remain on screen; PDF download offered as fallback (FR-8.5). |
| E10 | Email rate limit exceeded | Friendly "try again later" message; no address stored (FR-8.4). |
| E11 | Saved-results call fails | Results still render (computed client-side); the compare panel reports the failure and offers "Try again"; the save is never blocking (FR-9.6). |
| E11a | Results ID mistyped or expired | Lookup answers not-found; the student sees a plain message and their current results are untouched. |
| E11b | Email or saved-results server not configured | Route answers `not_configured`; the UI says the feature is not set up and the rest of the results keep working. |
| E12 | localStorage unavailable (private mode edge cases) | Journey still works within the session in memory; a notice warns that refresh will lose progress. |

## 9. Acceptance Criteria (Definition of Done)

### Profile Setup
- **Given** a new visitor on Profile Setup, **when** the nickname, grade level, strand or age is unset, or the privacy notice is not accepted, **then** the continue action is unavailable and each missing field is indicated.
- **Given** the nickname field, **when** lowercase letters are typed, **then** they appear upper-cased.
- **Given** the nickname field, **when** digits or symbols other than `-` are typed or pasted, **then** they do not appear in the field.
- **Given** a nickname already at 8 characters, **when** more characters are typed, **then** the value stays at 8.
- **Given** an empty nickname, **when** continue is attempted, **then** the journey does not advance and an inline error names the missing nickname.
- **Given** the grade level control, **then** it offers exactly `Grade 11` and `Grade 12` and no free-text entry.
- **Given** the age field, **when** a value outside 10–30 or a non-whole number is entered, **then** it is not accepted.
- **Given** a school name of more than 120 characters, **when** typed or pasted, **then** input is truncated/blocked at 120 with a visible counter.

### Assessment
- **Given** the assessment route at any point in the bank, **then** exactly one statement is visible, the only answer controls are Yes and No, and no "Next" control is present anywhere on screen.
- **Given** a student viewing a question, **when** they choose Yes or No, **then** the answer is recorded and the next question appears without any further interaction.
- **Given** the final question, **when** it is answered, **then** the completion state is reached without a "Next" or "Submit" press.
- **Given** a student on question *n* > 1, **when** they use Back, **then** question *n − 1* appears with its previously chosen answer shown as selected.
- **Given** the first question, **then** the Back control is unavailable.
- **Given** a previously answered question, **when** the student changes Yes to No, **then** that trait's total decreases by exactly 1 and the interface advances forward again.
- **Given** any complete answer set, **then** each trait's total equals its count of Yes answers and never exceeds 7.
- **Given** a finished session, **when** the tab is closed and the site reopened, **then** the session is gone; **when** the page is only refreshed, **then** results remain and the countdown keeps running.
- **Given** a student mid-assessment, **when** they refresh the page, **then** they resume at their first unanswered question with all prior answers intact.
- **Given** an unanswered question remains, **then** completion is not reachable.
- **Given** the whole bank, **then** it is completable using the keyboard alone.
- **Given** completion, **then** reaching Results saves exactly one `saved_results` row per session containing the six scores, score ceiling, Holland code, grade level, age and date — and no name, nickname, school, email, photo or answers.

### Holland Code
- **Given** any complete answer set, **when** scored twice, **then** the identical 3-letter code results (deterministic, property-tested).
- **Given** tied trait scores, **then** ranking follows `R → I → A → S → E → C`.

### Majors & Pathways
- **Given** a computed code, **then** each of the three letters shows its description and **all** its majors and related pathways in sheet order, with no ranking, match badge or percentage, and nothing displays or links to any university.

### PDF Export
- **Given** the results dashboard, **when** "Download PDF" is used, **then** the browser produces an A4 PDF without any upload, it opens only with the nickname + code password, and it contains the code, all six scores, and every major and pathway for each code letter.

### Email Delivery
- **Given** an invalid email, **when** send is attempted, **then** no network request is made and an inline error shows.
- **Given** an unchecked consent box, **then** the send action is disabled.
- **Given** a successful send, **then** the student sees a confirmation toast, the email carries the encrypted PDF (and the photo if one was taken), and nothing about the address is written to the database (the route writes no rows).
- **Given** the rate limit is exceeded, **then** the student sees the "try again later" message and no email is sent.
- **Given** the honeypot field is filled, **then** the route answers success and sends nothing.

### Saved Results & Admin
- **Given** a student reaches Results, **then** one results ID is shown, and a refresh or a second render does not create a second row.
- **Given** a valid results ID, **then** the student can compare against it and delete it; a deleted or unknown ID returns not-found.
- **Given** `ADMIN_TOKEN` is unset or under 32 characters, or the URL token does not match, **then** the admin page shows nothing.

### Non-functional gates
- Lighthouse ≥ 90 (Perf/A11y/SEO, mobile emulation) enforced in CI on every PR.
- The complete journey is finishable with keyboard only, and with `prefers-reduced-motion` enabled, with no loss of content or function.

---

## 10. System Architecture (informative)

AlignEd ships as a mostly-static, anonymous-first Next.js application.

- **Client:** Next.js **16.2.5** App Router, React 19, TypeScript. *This Next.js version has breaking changes versus common knowledge (proxy replaces middleware; new caching model) — the bundled docs at `node_modules/next/dist/docs/` and `docs/Next16_Delta_Notes.md` are required reading before framework work.*
- **State:** Zustand with localStorage persistence for the profile + assessment session (existing `useAssessmentStore` at `apps/web/src/store/useAssessmentStore.ts`); server components own all reference data; no client state mirrors server data.
- **Styling/UI:** Tailwind **v4** (`@theme` tokens in `globals.css`; no `tailwind.config.ts`), shadcn/ui on **Base UI** for all foundational controls, MagicUI/Aceternity/Efferd vendored for motion and structure (see Design Vision).
- **Backend:** Next.js route handlers (Node runtime) in `apps/web/src/app/api` are the only server code. They reach Supabase Postgres with the service-role key (`lib/supabase/admin.ts`, server only). **No Supabase Edge Functions; Supabase Auth is deliberately unused.** Email via Gmail SMTP (nodemailer) from `/api/send-results`; PDFs via pdfmake (browser for download, server for the email attachment).
- **Hosting/CI:** Vercel + Supabase Cloud; GitHub Actions on every PR: lint, typecheck, Vitest, seed-pipeline determinism check, build. PostHog analytics, optional (no-op unless `NEXT_PUBLIC_POSTHOG_KEY` is set). Lighthouse gate and error monitoring are not wired yet.
- **Configuration** (`apps/web/.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_TOKEN`, optional `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`. Full detail in `docs/BACKEND.md`.

### Database design

| Table | Migration | Purpose | Access |
| :--- | :--- | :--- | :--- |
| `saved_results` | `0003`, `0004` | One nameless row per session: `results_id` (unique, `ALGN-XXXX-XXXX`), six trait scores, `max_score`, `holland_code`, `grade_level` (`11`/`12`), `age` (nullable, 10–30), date, created_at. Expires after one year. | RLS on, no policies: service role only, via `/api/results` and the admin page. |
| `courses`, `careers`, `course_careers` | `0001` | Reference data seeded from `data/*.csv` (`npm run seed:build`). Not displayed (FR-6). | Public read. |
| `assessments` | `0001` | Former anonymous completion log. Superseded by `saved_results`; nothing writes to it. | Insert-only. |
| `universities`, `university_courses` | `0002` | Out of scope (§3); slated for removal. | — |
| `site_counters` | `0006` | Aggregate tallies for the public site (today: `tests_taken`, FR-1.5). Key, value, updated_at. | RLS on, no policies: anon key can neither read nor write; landing page figure is read server-side. |

- The `match_courses(p_code)` RPC in `0001` is unused since FR-6 was superseded.
- `increment_site_counter(p_key)` is the only writer of `site_counters`: one atomic statement, `security definer`, execute granted to the service role alone. Called from the save route after a completion is stored; a failure there is logged and swallowed so it can never fail a student's save.
- There are **no** `users` or `student_profiles` tables.

### Testing strategy (summary — full protocol in the Implementation Plan)
- **Unit (Vitest):** scoring library incl. determinism and tie-break tests; store re-answer correction; route handlers (`api/**/route.test.ts`) with the Supabase client and mailer mocked; results ID, admin access, rate limiters, career-look anchoring.
- **E2E (Playwright, `apps/web/tests/e2e`):** land → profile → full quiz → results → PDF + email (mailer mocked); mid-quiz refresh/resume; invalid-email and rate-limit paths. Not written yet.
- **Visual regression:** key pages, light + dark, `reducedMotion: 'reduce'`.

## 11. MVP Scope Statement

**In:** the four-step journey exactly as specified in §5–§6, plus saved results (FR-9), the admin page (FR-10) and the career look (FR-11), on static majors/pathways data.
**Out:** everything listed in §3 Non-Goals. There is no partial or hidden version of any excluded feature.

## 12. Risks & Mitigation

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Assessment abandonment | Low completion rates | Focus Mode UI, progress indication, localStorage resume, ~5-minute length, single-tap binary answers with auto-advance, milestone encouragement (see Design Vision). |
| Email abuse / privacy exposure | Legal and trust damage | No accounts; send-and-discard; hashed-email + per-IP rate limits; consent checkbox with DPA copy; honeypot; Gmail App Password kept server-side; PDF encrypted. |
| Results ID guessed | Someone reads a stranger's scores | 2^40 IDs, lookups rate-limited per network, rows carry no identity, rows expire in a year. |
| Admin link leaks | Aggregate stats exposed | Rows carry no identity; token ≥32 chars, constant-time compare; revoke by rotating `ADMIN_TOKEN`. |
| In-memory limiters on several instances | Limits multiply per instance | Acceptable at one school's traffic; move to a shared store before scaling out. |
| Stale program/career data | Loss of trust | Versioned CSV → seed pipeline; data edits ship as reviewed PRs. |
| Low-end mobile performance | Primary audience bounces | Reduced-motion gate, LazyMotion, viewport-triggered animation only, CI Lighthouse gate with CPU throttling. |

---

## Changelog

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-11-02 · session · FR-3.9 and E4a: finished results wiped when the tab session ends; Results shows a countdown to the 30-minute limit · shared-device privacy and clarity about how long results stay
- 2026-10-31 · assessment · Added FR-3.8: English / Filipino toggle for the 42 statements and Oo / Hindi answers; scoring unchanged. · Students can take the assessment in Filipino.
- 2026-10-27 · backend · Aligned with the shipped code (`docs/BACKEND.md`): SHS-only grades 11–12, required age and privacy acceptance; `saved_results` + results ID replace the `assessments` insert (FR-9); admin page (FR-10); career look (FR-11, AR non-goal narrowed); encrypted pdfmake PDF (FR-7); email via Next route + Gmail SMTP with concrete limits (FR-8); headers in `next.config.ts`; database, env, CI and testing sections rewritten; acceptance criteria for majors/pathways replace the ranked careers/programs ones. · The codebase is the plan of record.

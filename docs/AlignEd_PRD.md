# AlignEd — Product Requirements Document (PRD)

> **Status:** Approved · Single source of truth
> **Audience:** Engineering, Design, Product, QA
> Every supporting document in `/docs` derives from and must conform to this PRD.

---

## 1. Executive Summary

AlignEd is an anonymous, web-based career-guidance platform for Philippine Senior High School students (Grade 11 and 12). In a single guided session, a student describes their academic profile (grade level, strand, age), completes a RIASEC (Holland Code) personality assessment, and receives an actionable results dashboard: their 3-letter Holland Code, and the college majors and related career pathways for each code letter. Students can download their results as a password-protected PDF or send that PDF to their email. A nameless copy of the scores is also saved on the server for the program's aggregate statistics; the student has no way to look it up, compare against it or delete it.

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
- Student accounts, authentication, or login of any kind. The admin page (FR-10) is gated by one shared server-side password, with no accounts or stored identities.
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
                                                                        └─ Keep: PDF · Email
```

### Route map

| Step | Route | Rendering |
| :--- | :--- | :--- |
| Landing | `/` | Static (edge-cached) |
| Profile Setup | `/assessment/profile` | Client component, Focus Mode shell |
| Assessment | `/assessment` | Client component, Focus Mode shell |
| Results | `/results` | Client-computed from local state; majors/pathways from static data |
| Admin (not part of the journey) | `/admin` | Server-rendered; shared-password sign-in (FR-10) |

Also outside the journey: the About Us page (`/about`, FR-1.8) and the admin Excel export (`/admin/export`, FR-10.3). Server routes (Next.js route handlers, Node runtime): `POST /api/results` (FR-9) and `POST /api/send-results` (FR-8). There is no lookup or delete route.

Navigation rules:
- The Assessment route redirects to Profile Setup if no profile exists.
- The Results route redirects to the appropriate earlier step if the assessment is incomplete.
- A returning visitor with completed results in local storage sees the navbar and closing calls to action switch to "View My Results" / "View my results" (FR-1.4).

## 6. Functional Requirements

### FR-1 Landing Page
- FR-1.1. Communicates the value proposition: discover your Holland Code and find the right college degree using Holland's RIASEC framework.
- FR-1.2. Calls to action that start the journey at Profile Setup, each with its own wording: "Take Assessment" in the navbar and "Find your path" in the closing panel. The hero carries no button, since the navbar CTA sits directly above it.
- FR-1.3. Explains the journey as three steps (Tell us about yourself, Discover yourself, See your alignment) and the expected duration (~5 minutes, also a badge in the hero).
- FR-1.4. Journey-aware CTA: if a completed assessment exists in local storage, the navbar CTA becomes "View My Results" and the closing CTA "View my results".
- FR-1.5. Shows the lifetime number of assessments taken, read from an aggregate counter (`site_counters`, key `tests_taken`) incremented once per completion. The figure is cumulative and never decreases: deleting a saved result or purging an expired one does not un-take the test. It is a count only — no identifiers, nothing per student — so it stays inside the anonymous-by-design commitment. When the count cannot be read, nothing is shown; a placeholder or estimate is never substituted.
- FR-1.6. Explains the scoring procedure in plain language (42 statements, 7 per trait, Yes = 1 point / No = 0, scores 0 to 7, top three form the code, ties broken R→I→A→S→E→C per FR-4.2) with a worked example computed by the real scoring function; reachable from the navbar ("Scoring").
- FR-1.7. Directly after the hero and before the journey steps, explains Holland's theory of career choice in plain, paraphrased language (John L. Holland, 1959; interests reflect personality; six RIASEC types; most people are a blend, which is why the code has three letters), with the six types drawn on Holland's hexagon in R→I→A→S→E→C order. No type is ranked or scored.
- FR-1.8. The About Us page (`/about`) acknowledges the adopted instrument after the team: assessment (42-item RIASEC Interest Test), original source (Hawai'i Department of Education), framework (Holland's RIASEC Theory), and purpose (career interest exploration). A language options row (English and Filipino, with a translation review note) is not shown until the Filipino version is cleared for use.

### FR-2 Student Profile Setup
Captured before the assessment begins; stored client-side only (localStorage via the persisted store). Only grade level, strand (just the word "Others" when a strand was typed) and age ever reach the server, inside the nameless saved-results record (FR-9).

| Field | Type | Constraint |
| :--- | :--- | :--- |
| Nickname | Text | **Required.** 1–8 characters, uppercase letters `A–Z` and the hyphen `-` only. Input is normalized on every keystroke: characters are upper-cased, digits and all other symbols are discarded, and entry stops at 8 characters. It is a display handle, not a real name; it is never stored on the server and never included in the saved-results record. It reaches the server only inside an email request (FR-8), to name and password the PDF, and is discarded with the address. |
| Grade Level | Enum | **Required.** Exactly two values: `Grade 11` and `Grade 12`. No free text. |
| SHS Strand | Enum | **Required.** One of the supported academic, Arts and Design, Sports, or TVL strands: ABM, STEM, HUMSS, GAS, Arts and Design, Sports, AFA, HE, IA, or ICT, or **Others**. Choosing Others reveals a required "Type your strand" field (max 60). That text stays in the browser and the student's own downloaded PDF only; the server and admin page record just "Others". No other free text. |
| Age | Whole number | **Required.** 15–30 (Senior High ages; the database check stays 10–30). Stored in the saved-results record for the admin page's age statistics. |
| Terms and Conditions | Checkbox | **Required.** Card heading and inline link: "Data Privacy Policy and Terms and Conditions". Full checkbox text: "I have read and agree to the Data Privacy Policy and Terms and Conditions." Opens a dialog titled "Data Privacy Policy & Terms and Conditions" (RA 10173), versioned in `components/journey/privacy-consent.tsx` (Data Privacy Policy `v3.3`, Terms `v1.0`), with the two documents on separate tabs. It lists every piece of data collected and where it goes, without stating a specific retention period or a "so you can compare later" purpose. For a student under 18, the notice tells a parent or legal guardian to read it and be the one who ticks the box: there is no separate parent account or flow, so this single checkbox is how their consent is given. Contact email `aligned.career.support@gmail.com`. Key points are bold. Required before continuing. |

- FR-2.1. The "Continue to assessment" action is unavailable until all required fields (nickname, grade level, SHS strand, age, privacy acceptance) are set.
- FR-2.2. Profile values are editable by returning to this step before completing the assessment.
- FR-2.3. **Scoring notice.** On arrival the step opens with a blocking notice, "How your code is scored" (the same four steps as the landing page's scoring section), over a blurred profile. It is dismissed with "I understand" (or Escape / an outside click), but only once the student has read it and started: it is remembered per browser tab (`sessionStorage`) and honoured only while the profile has a nickname, so a refresh or a return from the quiz does not bring it back, while an empty form (left to the landing page and returned, Start over, Retake) opens it again. It follows the English / Filipino toggle and carries its own toggle (both hidden while Filipino is on hold, FR-3.8). It collects nothing and gates nothing beyond being read first.

### FR-3 RIASEC Assessment Engine
- FR-3.1. **Question bank:** the 42 statements of the source RIASEC instrument, statically defined, balanced at exactly 7 items per trait across the six Holland types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional). Statement text is reproduced **verbatim** from the instrument — including its original punctuation — and is not subject to editorial rewriting. Items are presented in the instrument's printed order (traits interleaved, never grouped), and each item's trait assignment is fixed by the instrument's answer key.
- FR-3.2. **Scoring:** each item maps to exactly one trait; answers are binary — **Yes contributes 1 point to that trait, No contributes 0**. A trait's total is therefore its count of Yes answers, bounded at 7. Re-answering a question replaces (never double-counts) its prior contribution; changing Yes to No decrements the trait total accordingly. A No is a recorded answer, not a skipped one, and counts toward completion.
- FR-3.3. **Presentation (strict):**
  - Exactly **one question is on screen at a time**; no list, grid, or multi-question page is permitted.
  - The only answer controls are the binary pair **Yes / No**.
  - **A new statement has no "Next" control.** Selecting Yes or No records the answer and the interface advances on its own (after a 280 ms beat). Revisiting an already-answered statement (after Back) shows an outline "Next" button in the corner; re-tapping the chosen card also advances. An unanswered statement instead offers "Skip for now", which leaves it open and moves to the next open one; when it is the only one left, a hint reads "Tap an answer to continue".
  - A **Back** control returns to the previous question. It is unavailable (not merely inert) on the first question.
  - Persistent progress indicator (percent + question count), and the whole bank is completable by keyboard alone.
- FR-3.4. **Backward navigation:** on returning to an earlier question, the student's previous answer is shown as selected and may be changed. Changing it re-scores that item in place (FR-3.2) and advances forward again; the student is never required to re-answer questions they have already completed.
- FR-3.5. **Session handling:** answers persist to localStorage on every change. On refresh or return, the student resumes at their first unanswered question (there is no separate welcome-back prompt). Sessions have no server component and expire 30 minutes after the last change: on the next visit an older session is wiped from localStorage — profile, answers, scores, and the saved results alike — and the student starts fresh, so an abandoned quiz is never left on a shared or school device for the next student to resume.
- FR-3.6. **Completion:** requires all 42 questions answered (Yes or No). On completion the student goes to Results, which saves exactly one nameless record per session (FR-9).
- FR-3.7. **Retake:** an explicit "Retake assessment" action on Results, behind a confirmation, clears the whole session (profile, answers, scores) and returns to Profile Setup to start fresh. The dialog tells the student to save the PDF first.
- FR-3.9. **Results lifetime:** a finished session (all 42 answered) is visible for as long as the 30-minute session allows and no longer than the tab: when the tab or browser session ends and the student returns, a finished session is wiped like an expired one and they start at Profile. An unfinished quiz still resumes (E4). The tab is detected with a `sessionStorage` marker, so a refresh keeps results while a closed tab does not; where `sessionStorage` is unreadable only the 30-minute limit applies. Results shows a live countdown note ("Your results stay on this device for 24:10 more, or until you close this tab."). The nameless server copy (FR-9, one year) is unaffected, but the student has no way back to it.
- FR-3.8. **Filipino statements:** an English / Filipino toggle on the assessment screen switches the 42 statements to the supplied Filipino translation (`lib/riasec/questions-fil.ts`, keyed by question id) and the answer pair to **Oo / Hindi**. Presentation only: ids, trait assignment, scoring, order and the English text are unchanged, answers already given are kept when the language is switched, and Y/N and O/H both work as keyboard shortcuts. The choice persists with the session (default English) and is cleared with it. The translation is reproduced as supplied, not editorially rewritten. The rest of the interface stays in English. **On hold:** until permission to use the Filipino version of the instrument is granted, every language toggle is hidden and the app runs in English only (`FILIPINO_ENABLED = false` in `lib/riasec/questions.ts`); the Filipino translations stay in the codebase, ready to re-enable.

### FR-4 Holland Code Computation
- FR-4.1. The 3-letter Holland Code is the three highest-scoring traits, ordered by score descending.
- FR-4.2. **Tie-breaking (deterministic):** ties at any rank are broken by fixed trait order `R → I → A → S → E → C`. The same answer set always yields the same code.
- FR-4.3. The results dashboard displays the code (e.g. `I-A-S`) plus a per-trait breakdown of all six scores (radar chart, normalized against the per-trait ceiling of 7) and short plain-language descriptions of the top three traits, and a Disclaimer card stating that the result is an exploratory tool, not a prediction.

### FR-5 Majors and Related Pathways
- FR-5.1. Source is the official RIASEC results sheet ("Which Career Pathway is right for you?"), stored as static data in `apps/web/src/lib/riasec/career-pathways.ts`: for each letter, its description, college majors, and related pathways, transcribed in full (only two obvious source typos corrected).
- FR-5.2. For each of the student's top 3 letters, in code order, the dashboard shows that letter's description, **all** of its majors, and **all** of its related pathways. Lists are never truncated.
- FR-5.3. Majors and pathways are never ranked. Items appear as equal-weight tags in the sheet's own order; there are no "strongest/weakest match", "top choice", match-strength badges, or percentages, because there is no validated basis for ranking items within a letter.
- FR-5.4. The three letter cards are shown as a rotating three-card carousel, starting on the first letter with the second letter peeking on the left and the third on the right. Swiping, side arrows, or tapping a peeking card rotates the ring in either direction with no end. Each card carries a banner stating that trait's position in the student's own code (#1 "Your top trait", #2 "Your second trait", #3 "Your third trait"). The banner ranks the student's traits by score only and says nothing about careers. All three cards stack in full when printed.
- FR-5.5. Below the carousel, a "See the other types" button opens a popup with the student's remaining three letters (ranks #4 to #6 by score, same tie-break as FR-4), for browsing only. Each is the same card as FR-5.4 (banner "#4 Your fourth RIASEC type" etc., description, **all** majors and related pathways in sheet order, no match labels), laid out side by side (stacked on phones) with no carousel motion. Nothing of these letters is on the page until the button is pressed; the popup closes with its X, Escape or a backdrop tap. The Holland Code stays the top three. Not printed.

### FR-6 Recommended College Programs (superseded)
- FR-6.1. Superseded by FR-5. The ranked program list (`match_courses(p_code)` with Exact / Strong badges) is no longer displayed. `data/careers.csv`, `data/courses.csv`, and the Supabase seed remain as backend reference data.
- FR-6.2. No university or institution mapping is displayed anywhere.

### FR-7 Export — Download as PDF
- FR-7.1. A "Download PDF" action on the results dashboard produces a document containing: nickname, grade, strand, age, test date, Holland Code + all six trait scores, and the description, majors and related pathways for each code letter (FR-5), with AlignEd branding and page numbers.
- FR-7.2. Built entirely in the browser with pdfmake (`lib/results-pdf/download-results-pdf.ts`), loaded only on click. No upload, no persistence.
- FR-7.3. The PDF is encrypted. Its password is the nickname followed by the three code letters (e.g. `MARI` + `I-R-A` → `MARIIRA`), shown to the student on screen.
- FR-7.4. Layout is A4 and legible in grayscale.

### FR-8 Export — Send to Email
- FR-8.1. "Email me my results" opens a dialog: email input + mandatory consent checkbox (Data Privacy Act copy) + send button.
- FR-8.2. Email format is validated client-side with inline errors before any request is made; the server validates again.
- FR-8.3. Sending calls `POST /api/send-results`, a Next.js route that renders the same encrypted PDF as FR-7 on the server (`lib/results-pdf/render-results-pdf.ts`) and sends it, and nothing else, from the program's Gmail account over SMTP (nodemailer, `GMAIL_USER` + `GMAIL_APP_PASSWORD`). The address is then discarded. The emailed copy carries nickname, grade, code, scores and pathways only: strand and age are not included. A `photo` field sent by an older page is ignored. **Raw email addresses are never persisted.**
- FR-8.4. Rate limiting: 3 sends per address per rolling day and 20 per network per rolling hour, keyed by salted SHA-256 hashes held in server memory (per-process random salt, reset on restart). A filled `website` honeypot field is answered with a fake success and nothing is sent. Limit-exceeded responses (HTTP 429) show a friendly "try again later" message.
- FR-8.5. Delivery failure surfaces a toast with a retry action; success surfaces a confirmation toast.

### FR-9 Saved Results (server-side only, no UI)
- FR-9.1. On reaching Results, the client calls `POST /api/results` once per session. The server stores one row in `saved_results`: the six trait scores, the score ceiling, the Holland code, grade level, strand ("Others" for any typed strand), age, and test date. No name, nickname, school, email, photo, or individual answers.
- FR-9.2. The server answers with a random results ID (`ALGN-XXXX-XXXX`, 8 characters from a 32-letter alphabet without 0/O/1/I, 2^40 possibilities), stored client-side only so the result is saved once per session. It is not shown on screen or printed in the PDF; there is no display of it, no lookup, and no delete route or button; the row exists only to feed the admin stats page (FR-10), which does not display the ID.
- FR-9.3. Rows expire one year after creation.
- FR-9.4. Limits: 200 saves per network per hour (in-memory), generous because a school lab shares one IP.
- FR-9.5. A failed save never blocks the results; it is silent and never retried from the UI.

### FR-10 Admin Page
- FR-10.1. `/admin` shows aggregate statistics over saved results (count, average age, strongest interest area, most common codes, age distribution) and a table of the latest results (date, code, grade, strand, age, six scores; no results ID). Everything on it, and the Excel export, can be narrowed by grade (11, 12) and by period (all time, last 1 year, 5 years, 10 years, by when the result was saved; results are deleted after a year, so today all time and every period mostly match). Rows carry no identity, so neither does the page.
- FR-10.2. The page asks for one shared password, `ADMIN_PASSWORD` (server only, at least 16 characters), compared in constant time; if it is unset or shorter the page stays locked. A correct password sets an 8-hour session cookie (HttpOnly, SameSite=Strict, Secure in production) signed with a key derived from the password, so changing the password signs everyone out. A Log out button ends the session. There are no admin accounts and nothing about the session is stored server-side.
- FR-10.3. Sign-in attempts are limited to 5 per network per 15 minutes and 30 across all networks per hour (in memory). The Excel export (`/admin/export`) needs the same session. Old `/admin/<token>` links return 404.

### FR-11 Career Look (optional photo)
- FR-11.1. From Results, a student may open the camera and try on career-themed props anchored to their face (MediaPipe face landmarks, in-browser). Camera access is the only browser permission the site requests.
- FR-11.2. The photo stays on the device: the student can save or share it from the camera dialog. It is never sent with the results email and never stored on the server.
- FR-11.3. Hand signs in front of the camera set off short decorative effects themed to the look being worn (Realistic gears, Investigative atoms and bubbles, Artistic paint, Social hearts and smileys, Enterprising coins and arrows, Conventional checkmarks and tiles); the sign sets how the burst moves (wave: a falling fan, thumbs up and peace: a ring, I-love-you: floating up, pointing up: one big emblem rising), tracked in-browser with MediaPipe's gesture recognizer like the face. They are silent, change nothing (switching looks and taking photos stay button-only), and nothing about the hands is recorded or stored. Under reduced motion each effect is one still icon that fades. If the hand model cannot load, the looks work without effects.

### FR-12 Share Image
- FR-12.1. From Results, a student may open a preview of a square image showing their Holland Code with its three trait badges and labels. The image carries no nickname, school, age, strand, results ID, date, scores, rankings or match labels.
- FR-12.2. The image is built in the browser. AlignEd never uploads or stores it, and no request is made to create it.
- FR-12.3. Where the browser can share files, a Share action opens the device's own share menu, so the student picks the app. A Save image action is always offered once the image is ready. There are no per-network buttons and no public results page.

## 7. Non-Functional Requirements

| Category | Requirement |
| :--- | :--- |
| **Performance** | Target: Lighthouse ≥ 90 (Performance, Accessibility, SEO) on mobile emulation with throttled CPU, on every PR (the CI gate is not wired yet). LCP < 2.5 s on mid-tier mobile. Landing route JS ≤ ~180 KB gzipped. |
| **Responsiveness** | Mobile-first. Full functional parity from 360 px-wide budget Android devices to desktop. Assessment is fully operable one-handed (thumb zone). |
| **Accessibility** | WCAG 2.1 AA: keyboard navigability, screen-reader labeled controls, visible focus states, contrast in light and dark themes. `prefers-reduced-motion` collapses all nonessential animation with zero content loss. |
| **Privacy & security** | Anonymous by design — no accounts, no PII at rest. Single write path: one nameless `saved_results` row per session, written only by server routes with the service-role key (RLS on, no policies, so the anon key can neither read nor write). Raw emails never stored; rate-limit keys are salted hashes in memory only. Explicit privacy acceptance at Profile Setup and consent before each email. Compliant with the Data Privacy Act of 2012 (RA 10173); the privacy notice is versioned with the code. Security headers set in `next.config.ts` for every path: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` allowing only same-origin camera. A strict nonce-based CSP (in `proxy.ts`) is deferred to hardening. Server secrets never use the `NEXT_PUBLIC_` prefix. |
| **Reliability** | Assessment progress survives refresh, tab close, and network loss (local persistence; the journey has no server dependency until the saved-results call and optional email send, and neither blocks the results). |
| **Concurrency** | 5,000 concurrent assessment sessions without degradation — achieved architecturally: the assessment is fully client-side; server load is static pages plus one small insert per completion. In-memory rate limiters count per server instance; a shared store is needed if the app runs on several instances. |

## 8. Edge Cases & Error Handling

| # | Scenario | Required behavior |
| :--- | :--- | :--- |
| E1 | Two or more traits tie in the top 3 | Deterministic tie-break by `R → I → A → S → E → C` order (FR-4.2). Ties are common on the 0–7 integer scale, so this path is routine rather than exceptional; the breakdown shows exact scores so ties are visible to the student. |
| E2 | All six traits equal (flat profile) | Code computed per FR-4.2 (`R-I-A`). No flat-profile-specific note is shown; the Disclaimer card (FR-4.3) frames every result as exploratory. |
| E3 | Student answers No to all 42 items | Every trait scores 0 — a valid flat profile, not an error. Handled as E2: deterministic `R-I-A` code. Results, export, and email all remain available. |
| E4 | Student refreshes / closes tab mid-quiz | Resume from localStorage at first unanswered question (FR-3.5). |
| E4a | Student closes the tab after finishing, then reopens the site | Finished session is wiped; the student starts at Profile (FR-3.9). |
| E5 | Student navigates to `/results` without completing | Redirect to the correct earlier step (§5 navigation rules). |
| E6 | Student uses Back and changes an earlier answer | Prior contribution replaced, never double-counted; a Yes→No change decrements the trait (FR-3.2, FR-3.4). |
| E7 | Stored answers predate the current question bank or answer scale | Discarded on load: the quiz restarts from question 1 with zeroed scores; the student's profile is preserved. |
| E7a | Stored profile predates the nickname field | An empty nickname is backfilled on load. The profile is then incomplete, so the student is routed to Profile Setup to supply one; their grade level is still filled in. |
| E8 | Invalid email submitted | Client-side validation blocks the request; inline field error (FR-8.2). |
| E9 | Email send fails (network / provider) | Toast with retry; results remain on screen; PDF download offered as fallback (FR-8.5). |
| E10 | Email rate limit exceeded | Friendly "try again later" message; no address stored (FR-8.4). |
| E11 | Saved-results call fails | Results still render (computed client-side); the save fails silently with no retry, never blocking the page (FR-9.5). |
| E11b | Email or saved-results server not configured | Route answers `not_configured`; the rest of Results keeps working either way (the save has no UI to report it). |
| E12 | localStorage unavailable (private mode edge cases) | Journey still works within the session in memory; failed writes are ignored and no notice is shown. |

## 9. Acceptance Criteria (Definition of Done)

### Profile Setup
- **Given** a new visitor on Profile Setup, **when** the nickname, grade level, strand or age is unset, or the privacy notice is not accepted, **then** the continue action is unavailable and each missing field is indicated.
- **Given** the nickname field, **when** lowercase letters are typed, **then** they appear upper-cased.
- **Given** the nickname field, **when** digits or symbols other than `-` are typed or pasted, **then** they do not appear in the field.
- **Given** a nickname already at 8 characters, **when** more characters are typed, **then** the value stays at 8.
- **Given** an empty nickname, **when** continue is attempted, **then** the journey does not advance and an inline error names the missing nickname.
- **Given** the grade level control, **then** it offers exactly `Grade 11` and `Grade 12` and no free-text entry.
- **Given** the age field, **when** a value outside 15–30 or a non-whole number is entered, **then** it is not accepted and an inline message names the range.

### Assessment
- **Given** the assessment route at any point in the bank, **then** exactly one statement is visible, the only answer controls are Yes and No, and no "Next" control is shown on a statement that has not been answered (an answered one shows "Next" after Back).
- **Given** a student viewing a question, **when** they choose Yes or No, **then** the answer is recorded and the next question appears without any further interaction.
- **Given** the final open question, **when** it is answered, **then** the completion state (the "All done!" pop-up) opens without a "Next" or "Submit" press.
- **Given** a student on question *n* > 1, **when** they use Back, **then** question *n − 1* appears with its previously chosen answer shown as selected.
- **Given** the first question, **then** the Back control is unavailable.
- **Given** a previously answered question, **when** the student changes Yes to No, **then** that trait's total decreases by exactly 1 and the interface advances forward again.
- **Given** any complete answer set, **then** each trait's total equals its count of Yes answers and never exceeds 7.
- **Given** a finished session, **when** the tab is closed and the site reopened, **then** the session is gone; **when** the page is only refreshed, **then** results remain and the countdown keeps running.
- **Given** a student mid-assessment, **when** they refresh the page, **then** they resume at their first unanswered question with all prior answers intact.
- **Given** an unanswered question remains, **then** completion is not reachable.
- **Given** the whole bank, **then** it is completable using the keyboard alone.
- **Given** completion, **then** reaching Results saves exactly one `saved_results` row per session containing the six scores, score ceiling, Holland code, grade level, strand, age and date — and no name, nickname, school, email, photo or answers.

### Holland Code
- **Given** any complete answer set, **when** scored twice, **then** the identical 3-letter code results (deterministic, property-tested).
- **Given** tied trait scores, **then** ranking follows `R → I → A → S → E → C`.

### Majors & Pathways
- **Given** a computed code, **then** each of the three letters shows its description and **all** its majors and related pathways in sheet order, with no ranking of those items, no match badge or percentage, and nothing displays or links to any university.

### PDF Export
- **Given** the results dashboard, **when** "Download PDF" is used, **then** the browser produces an A4 PDF without any upload, it opens only with the nickname + code password, and it contains the code, all six scores, and every major and pathway for each code letter.

### Email Delivery
- **Given** an invalid email, **when** send is attempted, **then** no network request is made and an inline error shows.
- **Given** an unchecked consent box, **then** the send action is disabled.
- **Given** a successful send, **then** the student sees a confirmation toast, the email carries only the encrypted PDF, and nothing about the address is written to the database (the route writes no rows).
- **Given** the rate limit is exceeded, **then** the student sees the "try again later" message and no email is sent.
- **Given** the honeypot field is filled, **then** the route answers success and sends nothing.

### Saved Results & Admin
- **Given** a student reaches Results, **then** one row is saved server-side with no UI shown for it, and a refresh or a second render does not create a second row.
- **Given** `ADMIN_PASSWORD` is unset or under 16 characters, or no valid session cookie is present, **then** `/admin` shows only the sign-in form and `/admin/export` returns 404.
- **Given** a wrong password, **then** the form says so without revealing anything; the 6th attempt from one network within 15 minutes is refused.

### Share Image
- **Given** a student opens Share my results, **then** the preview shows only the Holland Code, its three trait badges and labels, and AlignEd branding, and no network request is made to build it.
- **Given** a browser that cannot share files, **then** Share is hidden and Save image still works.

### Non-functional gates
- Lighthouse ≥ 90 (Perf/A11y/SEO, mobile emulation) is the target; the CI gate is not wired yet (CI runs lint, typecheck, unit tests, the seed check and the build).
- The complete journey is finishable with keyboard only, and with `prefers-reduced-motion` enabled, with no loss of content or function.

---

## 10. System Architecture (informative)

AlignEd ships as a mostly-static, anonymous-first Next.js application.

- **Client:** Next.js **16.2.5** App Router, React 19, TypeScript. *This Next.js version has breaking changes versus common knowledge (proxy replaces middleware; new caching model) — the bundled docs at `node_modules/next/dist/docs/` and `docs/Next16_Delta_Notes.md` are required reading before framework work.*
- **State:** Zustand with localStorage persistence for the profile + assessment session (existing `useAssessmentStore` at `apps/web/src/store/useAssessmentStore.ts`); server components own all reference data; no client state mirrors server data.
- **Styling/UI:** Tailwind **v4** (`@theme` tokens in `globals.css`; no `tailwind.config.ts`), shadcn/ui on **Base UI** for all foundational controls, MagicUI/Aceternity/Efferd vendored for motion and structure (see Design Vision).
- **Backend:** Next.js route handlers (Node runtime) in `apps/web/src/app/api` are the only server code. They reach Supabase Postgres with the service-role key (`lib/supabase/admin.ts`, server only). **No Supabase Edge Functions; Supabase Auth is deliberately unused.** Email via Gmail SMTP (nodemailer) from `/api/send-results`; PDFs via pdfmake (browser for download, server for the email attachment).
- **Hosting/CI:** Vercel + Supabase Cloud; GitHub Actions on every PR: lint, typecheck, Vitest, seed-pipeline determinism check, build. PostHog analytics, optional (no-op unless `NEXT_PUBLIC_POSTHOG_KEY` is set). Lighthouse gate and error monitoring are not wired yet.
- **Configuration** (`apps/web/.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ADMIN_PASSWORD`, optional `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`. Full detail in `docs/BACKEND.md`.

### Database design

| Table | Migration | Purpose | Access |
| :--- | :--- | :--- | :--- |
| `saved_results` | `0003`, `0004`, `0005`, `0007` | One nameless row per session: `results_id` (unique, `ALGN-XXXX-XXXX`), six trait scores, `max_score`, `holland_code`, `grade_level` (`11`/`12`), `age` (nullable, 10–30), `strand` (nullable, the SHS list plus `Others`), date, created_at. Expires after one year. | RLS on, no policies: service role only, via `/api/results` and the admin page. |
| `courses`, `careers`, `course_careers` | `0001` | Reference data seeded from `data/*.csv` (`npm run seed:build`). Not displayed (FR-6). | Public read. |
| `assessments` | `0001` | Former anonymous completion log. Superseded by `saved_results`; nothing writes to it. | Insert-only. |
| `universities`, `university_courses` | `0002` | Out of scope (§3); slated for removal. | — |
| `site_counters` | `0006` | Aggregate tallies for the public site (today: `tests_taken`, FR-1.5). Key, value, updated_at. | RLS on, no policies: anon key can neither read nor write; landing page figure is read server-side. |

- The `match_courses(p_code)` RPC in `0001` is unused since FR-6 was superseded.
- `increment_site_counter(p_key)` is the only writer of `site_counters`: one atomic statement, `security definer`, execute granted to the service role alone. Called from the save route after a completion is stored; a failure there is logged and swallowed so it can never fail a student's save.
- There are **no** `users` or `student_profiles` tables.

### Testing strategy (summary — full protocol in the Implementation Plan)
- **Unit (Vitest):** scoring library incl. determinism and tie-break tests; store re-answer correction; route handlers (`api/**/route.test.ts`) with the Supabase client and mailer mocked; admin access, rate limiters, career-look anchoring.
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
| Admin password leaks or is guessed | Aggregate stats exposed | Rows carry no identity; password ≥16 chars, constant-time compare, rate-limited attempts, 8-hour sessions; rotating `ADMIN_PASSWORD` signs everyone out. |
| In-memory limiters on several instances | Limits multiply per instance | Acceptable at one school's traffic; move to a shared store before scaling out. |
| Stale program/career data | Loss of trust | Versioned CSV → seed pipeline; data edits ship as reviewed PRs. |
| Low-end mobile performance | Primary audience bounces | Reduced-motion gate (`MotionConfig reducedMotion="user"`), looping decoration limited to fine-pointer devices, viewport-triggered animation only; a CI Lighthouse gate with CPU throttling is planned, not wired. |

---

## Changelog
- 2026-11-25 · admin · FR-10.1: period filter is now yearly only (1, 5, 10 years); 7 days to 6 months removed · the team asked for yearly periods.

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-11-24 · profile · FR-2: age range narrowed from 10–30 to 15–30, with an inline "Enter an age from 15 to 30." message · a student entered 10, which is not a Senior High age.
- 2026-11-23 · admin · FR-10.1: period filter gains "Last 12 months" (1 year) · the team asked for a yearly option.
- 2026-11-23 · results · Added FR-5.5: "See the other types" popup showing ranks #4 to #6 as the same cards, browse-only. · Requested: let students look at their remaining types without changing the code.
- 2026-11-23 · profile/results · FR-2: the optional School field is removed from Profile Setup (and from the PDF); policy v3.4, Terms v1.1. FR-7.1/FR-8.3/FR-9.2: the results ID is no longer printed on the downloaded or emailed PDF; it stays server-side and in the client store only. · Requested removal of School and of the PDF results ID.
- 2026-11-22 · admin · FR-10.1: period filter (all time, 7 days, 30 days, 3 months, 6 months) alongside the grade filter; the Excel export follows both · the team asked to filter results by when they were saved.
- 2026-11-20 · admin · FR-10.1: the latest-results table and Excel export no longer show the results ID. FR-9.2 notes the admin page does not display it. FR-2: policy v3.3. · Not needed on the admin page.
- 2026-11-20 · privacy/edge cases · FR-2: policy is now v3.2 and no longer mentions a Delete saved copy button or results-ID lookup (neither exists, FR-9.2). E2, E12: stated as shipped behaviour (no flat-profile note, no storage-failure notice). · Site copy and docs aligned; unbuilt requirements dropped.
- 2026-11-20 · docs · Corrected to the shipped site: no results-ID compare/lookup/delete (exec summary, route map, FR-3.9); three-step landing and real CTA wording (FR-1.2 to FR-1.4); strand is saved with the result (FR-2, FR-9.1, DB table); privacy dialog title and versions v3.1/v1.0 (FR-2); retake clears the whole session (FR-3.7); quiz has Next on answered statements and Skip for now on open ones (FR-3.3, acceptance); emailed PDF omits strand, age and school (FR-8.3); Lighthouse gate and flat-profile note and storage-failure notice are not built (NFR, E2, E3, E12). · Docs audit: every statement checked against the shipped site; the site was not changed.
- 2026-11-20 · about/profile · FR-1.8: language options row removed from About Us while Filipino is held back. FR-2.3: the scoring notice reopens on an empty Profile Setup instead of once per tab. · Requested; the notice was silently skipped on every re-entry after the first dismissal.
- 2026-11-20 · assessment · FR-3.8 on hold: every English / Filipino toggle hidden, app runs English only; Filipino translations kept in code. · Awaiting permission to use the Filipino version of the assessment.
- 2026-11-17 · about · Added FR-1.8: About Us acknowledges the adopted instrument (Hawai'i DOE 42-item RIASEC Interest Test, Holland's theory, English and Filipino with the translation review, purpose) · credit the source the 42 statements come from.
- 2026-11-16 · landing · Added FR-1.7: a Holland theory overview section between the hero and the journey steps · students should know why a Holland Code means something before they start.
- 2026-11-15 · email · The results email no longer attaches the career-look photo (FR-8.3, FR-11.2, §9); the route ignores a `photo` field; privacy notice v3.1 · requested: the email carries only the results PDF.
- 2026-11-15 · admin · `/admin` now uses one shared password (`ADMIN_PASSWORD`) with an 8-hour signed cookie, rate-limited attempts and Log out; the secret-link token is removed; the Non-Goal is narrowed to student accounts · a link-as-key leaks through browser history, logs and forwarding.
- 2026-11-10 · results · FR-5.4 carousel is now a rotating ring: #2 peeks left, #3 peeks right, both tilted and dimmed, arrows on the sides. · Requested design.
- 2026-11-10 · results · Added FR-5.4: the three letter cards are a swipeable carousel with a rank banner per trait; FR-5.3 and its acceptance line now say explicitly that the no-ranking rule covers majors and pathways. · Requested: swipe through the top three and see the rank at a glance.
- 2026-11-10 · profile · The combined notice behind FR-2.1's privacy acceptance now presents the Data Privacy Policy and the Terms and Conditions as two separate tabs within the same dialog (profile step and footer), instead of one scrolled document; the single checkbox/acceptance field is unchanged, but any session that had already ticked it before this change has that acceptance reset so the split content is seen and agreed to again. · Requested separation of the two documents for legal clarity.
- 2026-11-10 · profile · Added FR-2.3: a scoring-procedure notice (four steps, English and Filipino) opens over a blurred Profile Setup and is acknowledged with "I understand", once per tab. · Requested: students should know how the code is counted before they start.
- 2026-11-09 · results · Removed the entire "Your results ID" panel and its backend (`DELETE /api/results/[id]`, `getResult`/`deleteResult`, the store's `resultsDeleted` flag). FR-9 is now server-side only: `POST /api/results` still saves one row per session for the admin stats page (FR-10), but the ID is never shown, looked up, or deleted from the UI. · Requested removal of the results-ID feature from the Results page.
- 2026-11-09 · results · Removed FR-9.3 compare-by-ID (`GET /api/results/[id]`, the "Compare with past results" dialog); FR-9 renamed "Saved Results". The results ID is now kept only as a record, with save and delete unchanged. · Comparing was cut from the results page.
- 2026-11-08 · results · Added FR-12 share image: on-device picture of the code, trait badges and labels, shared via the device menu or saved · students asked to post their result
- 2026-11-05 · landing · Added FR-1.6: a plain-language scoring section with a worked example, linked from the navbar. · Students understand how their answers become a code.
- 2026-11-04 · privacy · "Students under 18" and "Agreeing to these terms" (v2.3) now say a parent or legal guardian should read the notice and tick the box themselves to consent for a minor, since AlignEd has no separate parent account or flow. · User asked this spelled out; same single checkbox, clearer about who is meant to click it.
- 2026-11-04 · privacy · Terms/Privacy card heading and checkbox link renamed "Data Privacy Policy and Terms and Conditions" (v2.2); removed the "kept for one year" retention claim and the "so you can compare later" purpose from the privacy notice, the About page, the admin page, and the results-saved/not-found copy. The server's one-year row expiry itself is unchanged (FR-9.4, BACKEND.md) — only the user-facing claim about it is gone. · Requested removal of those two claims from the site; the dialog's own title keeps its original word order (not renamed).
- 2026-11-04 · profile · Added an "Others" strand with a typed strand kept on device and in the student's PDF only (server stores "Others"); Terms and Privacy bumped to v2.1; profile heading is "Tell us about yourself", "Step 1 of 3" and input placeholders removed, consent blurb no longer mentions compare or the retention period. · Students whose strand is not listed can still continue, without free text reaching the server.
- 2026-11-04 · privacy · Privacy notice rewritten in plain words as "Terms and Conditions and Data Privacy Policy" (v2.0): full list of data collected and where it goes, bold key points, short Terms section, contact email, no placeholders. Consent checkbox now reads "I have read and agree to the Terms and Conditions." · Less jargon, complete disclosure, and one agreement covering both.
- 2026-11-04 · career look · FR-11.3 effects themed per look (shapes from the worn look, motion from the sign) · each type gets its own burst
- 2026-11-04 · career look · FR-11.3 hand-sign effects (wave, thumbs up, peace, I-love-you, pointing up), decorative only, in-browser, nothing stored · student request for interactivity in the camera
- 2026-11-02 · session · FR-3.9 and E4a: finished results wiped when the tab session ends; Results shows a countdown to the 30-minute limit · shared-device privacy and clarity about how long results stay
- 2026-10-31 · assessment · Added FR-3.8: English / Filipino toggle for the 42 statements and Oo / Hindi answers; scoring unchanged. · Students can take the assessment in Filipino.
- 2026-10-27 · backend · Aligned with the shipped code (`docs/BACKEND.md`): SHS-only grades 11–12, required age and privacy acceptance; `saved_results` + results ID replace the `assessments` insert (FR-9); admin page (FR-10); career look (FR-11, AR non-goal narrowed); encrypted pdfmake PDF (FR-7); email via Next route + Gmail SMTP with concrete limits (FR-8); headers in `next.config.ts`; database, env, CI and testing sections rewritten; acceptance criteria for majors/pathways replace the ranked careers/programs ones. · The codebase is the plan of record.

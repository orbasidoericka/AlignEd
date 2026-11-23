<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Product

Anonymous, web-based career-guidance platform for Philippine Senior High School students (Grade 11 and 12). One guided session, no accounts: a student describes their academic profile, completes a RIASEC (Holland Code) assessment, and receives a results dashboard with their 3-letter code and the college majors and related career pathways for each letter. Results leave the device as a PDF download or an emailed copy. Separately, a nameless record (scores, code, grade, strand, age, date) is saved under a random results ID for one year, only to feed aggregate statistics; students cannot look it up or delete it, and admins see these records on a private admin page behind a shared password.

**Source of truth:** `docs/AlignEd_PRD.md`. Anything outside the journey below is out of scope until the PRD changes.

## Audience

Grade 11 and 12 (Senior High) students in the Philippines, mobile-first on budget Android devices (360 px, variable connections). Two personas: the Grade 12 "Undecided Senior" narrowing down a college program before applications, and the Grade 11 "Early Explorer" who still has time to choose a path. Both are anonymous visitors under real decision pressure; the product must feel supportive, credible, and fast.

## The journey (strict, linear)

1. **Landing** (`/`) — value proposition, ~5-minute promise, journey-aware CTA, a short overview of Holland's theory of career choice (the six RIASEC types on Holland's hexagon), a lifetime "tests taken" tally (hidden when the count cannot be read), and a plain-language "How your code is scored" section with a worked example. An About Us page (`/about`) covers the team and credits the source instrument.
2. **Profile Setup** (`/assessment/profile`) — nickname (required, up to 8 uppercase letters/hyphens, never stored server-side; sent only inside an email request), grade level (11 or 12), SHS strand (or Others with a typed strand that stays on the device and in the student's PDF), age (10–30) and acceptance of the Data Privacy Policy and Terms and Conditions (all required), and optional school (max 120 chars). Client-side only.
3. **RIASEC Assessment** (`/assessment`) — 42 yes/no statements (English only for now; the Filipino version is built but hidden pending permission, PRD FR-3.8), one per screen, auto-advancing on each answer (an answered statement shows Next after Back; an unanswered one can be skipped for later) with Back to revise; localStorage resume, deterministic scoring (tie-break R→I→A→S→E→C). Finished results stay on the device 30 minutes at most and vanish when the tab closes; Results shows the countdown. The statements are adopted from the Hawai'i Department of Education's 42-item RIASEC Interest Test (Holland's RIASEC Theory); the About Us page credits that source.
4. **Results** (`/results`) — Holland code + trait breakdown, a rotating carousel of the three traits with a rank banner each and all majors and related pathways per code letter (traits are ranked, careers never), password-protected PDF download (with the selected SHS strand, age and school) and an emailed copy of the same PDF (without strand, age or school), optional career-look photo (face props, plus hand-sign effects; saved or shared from the device, never emailed), a share image of the code with no identifying data (device share menu or save). A results ID is saved server-side for the admin stats page; it is not shown on screen, only printed in the PDF.

## Non-goals

No accounts or authentication. No university/HEI directory or school mapping. No PII at rest (email is send-and-discard; only a salted hash is kept for rate limiting; saved results carry no name, nickname, or school). No forums, counselor dashboards, AR beyond the in-browser career-look photo, or native apps. Compliant with the Data Privacy Act of 2012 (RA 10173).

## Register

Product app with one brand surface: the landing page is brand register (identity, warmth, persuasion); Profile, Assessment, and Results are product register (task-focused, consistent, calm). See `DESIGN.md`.

## Changelog

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-11-23 · admin · Admin period filter adds 1 year · the team asked for a yearly option.
- 2026-11-22 · admin · Admin page and Excel export filter by period (last 7 days to 6 months, or all time) as well as by grade · the team asked to filter results by when they were saved.
- 2026-11-20 · docs · Corrected: saved record is not for student comparison; email PDF omits strand, age and school; quiz Next/Skip; landing tally and About page named. · Docs audit: every statement checked against the shipped site; the site was not changed.
- 2026-11-20 · about/profile · About Us drops the language options row (Filipino on hold); scoring notice reopens on an empty Profile Setup. See PRD FR-1.8, FR-2.3. · Requested.
- 2026-11-20 · assessment · Language toggles hidden; English only until the Filipino version is cleared. See PRD FR-3.8. · Awaiting permission to use the Filipino version.
- 2026-11-17 · about · About Us credits the adopted instrument and the Filipino translation review. See PRD FR-1.8. · Acknowledge the instrument's source.
- 2026-11-16 · landing · Holland theory overview section after the hero. See PRD FR-1.7. · Requested: explain the RIASEC theory before the steps.
- 2026-11-15 · email · Results email sends only the PDF; the career-look photo is no longer attached · requested: the email carries only the results PDF.
- 2026-11-15 · admin · Admin page moved from a secret link to `/admin` with a shared password sign-in · the link could leak.
- 2026-11-10 · results · The trait carousel is a rotating ring: second trait peeks left, third peeks right. See PRD FR-5.4. · Requested design.
- 2026-11-10 · results · The top three traits are a swipeable carousel with a rank banner on each card. See PRD FR-5.4. · Requested: swipe through the top three and see the rank at a glance.
- 2026-11-10 · profile · Profile Setup opens with a scoring-procedure notice ("How your code is scored", English and Filipino), acknowledged with "I understand", once per tab. See PRD FR-2.3. · Requested: students should know how the code is counted before they start.
- 2026-11-09 · results · Removed the "Your results ID" panel from Results entirely (no display, copy, or delete). The save that feeds the admin stats page still runs, silently, with nothing on screen for it. · Requested removal of the results-ID feature from the Results page.
- 2026-11-09 · results · Removed compare-by-ID from Results (PRD FR-9.3 cut); the results ID is now kept only as a record, save and delete unchanged. · Comparing was cut from the results page.
- 2026-11-08 · results · Results can share an image of the code, with no identifying data (PRD FR-12). · Students asked to post their result.
- 2026-11-05 · product · Landing explains how the code is scored (PRD FR-1.6). · Transparency about the scoring before students start.
- 2026-11-04 · product · Terms/Privacy card heading and link renamed "Data Privacy Policy and Terms and Conditions"; the privacy notice, About page, admin page, and results-saved copy no longer state the one-year retention period or the "compare later" purpose. · Removal requested; the server-side one-year expiry is unchanged.
- 2026-11-04 · product · Profile Setup accepts an "Others" strand (typed text stays on the device and in the PDF). · Covers strands not in the list.
- 2026-11-04 · product · Privacy notice is now the plain-language "Terms and Conditions and Data Privacy Policy" and lists all data collected (PRD Profile Setup). · Students and parents can see exactly what is collected.
- 2026-11-04 · results · Career look reacts to hand signs with decorative effects (FR-11.3) · interactivity in the camera
- 2026-11-02 · results · Results shows a lifetime countdown; finished results wiped on tab close · shared-device privacy
- 2026-10-31 · product · Assessment statements can be shown in Filipino (PRD FR-3.8). · Wider reach for Filipino-speaking students.
- 2026-10-27 · product · Audience narrowed to Grade 11–12; profile adds age + privacy acceptance; results describe majors/pathways, encrypted PDF, career look. · Matches the shipped code and the updated PRD.

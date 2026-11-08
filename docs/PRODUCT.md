<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Product

Anonymous, web-based career-guidance platform for Philippine Senior High School students (Grade 11 and 12). One guided session, no accounts: a student describes their academic profile, completes a RIASEC (Holland Code) assessment, and receives a results dashboard with their 3-letter code and the college majors and related career pathways for each letter. Results leave the device as a PDF download, an emailed copy, or a saved record with no name (scores, code, grade, age, date) under a random results ID, kept one year so the student can compare a later retake; admins see these records on a private admin page reached by a secret link.

**Source of truth:** `docs/AlignEd_PRD.md`. Anything outside the journey below is out of scope until the PRD changes.

## Audience

Grade 11 and 12 (Senior High) students in the Philippines, mobile-first on budget Android devices (360 px, variable connections). Two personas: the Grade 12 "Undecided Senior" narrowing down a college program before applications, and the Grade 11 "Early Explorer" who still has time to choose a path. Both are anonymous visitors under real decision pressure; the product must feel supportive, credible, and fast.

## The journey (strict, linear)

1. **Landing** (`/`) — value proposition, ~5-minute promise, journey-aware CTA, and a plain-language "How your code is scored" section.
2. **Profile Setup** (`/assessment/profile`) — nickname (required, up to 8 uppercase letters/hyphens, never stored server-side; sent only inside an email request), grade level (11 or 12), SHS strand (or Others with a typed strand that stays on the device and in the student's PDF), age (10–30) and acceptance of the Data Privacy Policy and Terms and Conditions (all required), and optional school (max 120 chars). Client-side only.
3. **RIASEC Assessment** (`/assessment`) — 42 yes/no statements (English or Filipino, student's choice), one per screen, auto-advancing (no Next button) with Back to revise; localStorage resume, deterministic scoring (tie-break R→I→A→S→E→C). Finished results stay on the device 30 minutes at most and vanish when the tab closes; Results shows the countdown.
4. **Results** (`/results`) — Holland code + trait breakdown, all majors and related pathways per code letter, password-protected PDF + email export (including the selected SHS strand), optional career-look photo (face props, plus hand-sign effects), a share image of the code with no identifying data (device share menu or save), results ID + compare with a past result.

## Non-goals

No accounts or authentication. No university/HEI directory or school mapping. No PII at rest (email is send-and-discard; only a salted hash is kept for rate limiting; saved results carry no name, nickname, or school). No forums, counselor dashboards, AR beyond the in-browser career-look photo, or native apps. Compliant with the Data Privacy Act of 2012 (RA 10173).

## Register

Product app with one brand surface: the landing page is brand register (identity, warmth, persuasion); Profile, Assessment, and Results are product register (task-focused, consistent, calm). See `DESIGN.md`.

## Changelog

Newest first. Format: `- YYYY-MM-DD · area · what changed · why`.

- 2026-11-08 · results · Results can share an image of the code, with no identifying data (PRD FR-12). · Students asked to post their result.
- 2026-11-05 · product · Landing explains how the code is scored (PRD FR-1.6). · Transparency about the scoring before students start.
- 2026-11-04 · product · Terms/Privacy card heading and link renamed "Data Privacy Policy and Terms and Conditions"; the privacy notice, About page, admin page, and results-saved copy no longer state the one-year retention period or the "compare later" purpose. · Removal requested; the server-side one-year expiry is unchanged.
- 2026-11-04 · product · Profile Setup accepts an "Others" strand (typed text stays on the device and in the PDF). · Covers strands not in the list.
- 2026-11-04 · product · Privacy notice is now the plain-language "Terms and Conditions and Data Privacy Policy" and lists all data collected (PRD Profile Setup). · Students and parents can see exactly what is collected.
- 2026-11-04 · results · Career look reacts to hand signs with decorative effects (FR-11.3) · interactivity in the camera
- 2026-11-02 · results · Results shows a lifetime countdown; finished results wiped on tab close · shared-device privacy
- 2026-10-31 · product · Assessment statements can be shown in Filipino (PRD FR-3.8). · Wider reach for Filipino-speaking students.
- 2026-10-27 · product · Audience narrowed to Grade 11–12; profile adds age + privacy acceptance; results describe majors/pathways, encrypted PDF, career look. · Matches the shipped code and the updated PRD.

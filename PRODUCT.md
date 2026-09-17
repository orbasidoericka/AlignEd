<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Product

Anonymous, web-based career-guidance platform for Philippine Junior and Senior High School students. One guided session, no accounts: a student describes their academic profile, completes a RIASEC (Holland Code) assessment, and receives a results dashboard with their 3-letter code, career suggestions, and recommended college degree programs. Results leave the device only as a PDF download or an emailed copy.

**Source of truth:** `docs/AlignEd_PRD.md`. Anything outside the journey below is out of scope until the PRD changes.

## Audience

Grade 7 through 12 students in the Philippines, mobile-first on budget Android devices (360 px, variable connections). Two personas: the Grade 12 "Undecided Senior" narrowing down a college program before applications, and the Grade 9–10 "Early Explorer" who still has time to choose a path. Both are anonymous visitors under real decision pressure; the product must feel supportive, credible, and fast.

## The journey (strict, linear)

1. **Landing** (`/`) — value proposition, ~5-minute promise, journey-aware CTA.
2. **Profile Setup** (`/assessment/profile`) — nickname (required, up to 8 uppercase letters/hyphens, never leaves the device), grade level (7–12), optional school (max 120 chars). Client-side only.
3. **RIASEC Assessment** (`/assessment`) — 42 yes/no statements, one per screen, auto-advancing (no Next button) with Back to revise; localStorage resume, deterministic scoring (tie-break R→I→A→S→E→C).
4. **Results** (`/results`) — Holland code + trait breakdown, careers, degree programs, PDF + email export.

## Non-goals

No accounts or authentication. No university/HEI directory or school mapping. No PII at rest (email is send-and-discard; only a salted hash is kept for rate limiting). No forums, counselor dashboards, AR, or native apps. Compliant with the Data Privacy Act of 2012 (RA 10173).

## Register

Product app with one brand surface: the landing page is brand register (identity, warmth, persuasion); Profile, Assessment, and Results are product register (task-focused, consistent, calm). See `DESIGN.md`.

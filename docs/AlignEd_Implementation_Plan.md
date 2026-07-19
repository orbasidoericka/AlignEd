# AlignEd — Implementation Plan & Development Roadmap

> **Source:** `docs/AlignEd_PRD.md` · **Status:** Approved plan of record
> **Perspectives:** Senior Full-Stack Developer · Senior UI/UX Analyst · Senior QA Tester

## Decisions of Record (deviations from the PRD)

These override the PRD wherever they conflict, and every section below assumes them:

1. **No authentication, ever, in this product.** AlignEd is an anonymous-only website. There is no sign-up, login, OAuth, or user account of any kind. Results are **forwarded to the student via email** at the end of the assessment (opt-in, send-and-discard). The existing `(auth)/login` and `(auth)/register` placeholder routes will be deleted, and migration `0001_init.sql`'s anonymous design is confirmed as intentional.
2. **The installed stack wins over the PRD's stated stack.** The repo is on **Next.js 16.2.5** (PRD says 15), React 19.2, **Tailwind v4**, and shadcn CLI 4.x built on **Base UI** (`@base-ui/react`). We build on what is installed. `apps/web/AGENTS.md` explicitly warns that this Next.js version has breaking changes versus common knowledge — the bundled docs at `apps/web/node_modules/next/dist/docs/` are required reading before writing framework code (e.g., proxy replaces middleware; the caching model changed).
3. **Efferd (efferd.com) is confirmed real** — a registry-based shadcn/ui *blocks* library (heroes, headers, footers, FAQs, CTAs) on a freemium model. It is used for page-level structural blocks; MagicUI/Aceternity for motion and visual identity; shadcn/ui for every foundational control.

---

## 1. Executive Overview & Architecture

### Technical approach in one paragraph

AlignEd ships as a **mostly-static, anonymous-first** Next.js 16 application. All reference content — courses, careers, universities — is public-read data rendered on the server with incremental static revalidation, so the pages Filipino students hit on low-end phones over variable connections are cached HTML at the edge. The RIASEC assessment runs **entirely client-side** (the existing Zustand + localStorage store), which means the platform's only write paths are (a) one anonymous analytics insert per completed assessment and (b) an email-results Edge Function. That architecture makes the 5,000-concurrent-sessions requirement land on Vercel's edge cache rather than on Postgres — the database barely notices load.

### System layers (Input–Process–Output, mapped to real components)

- **Input:** static TypeScript question bank → client-side answers in `useAssessmentStore` (already implemented with localStorage persistence at `apps/web/src/store/useAssessmentStore.ts`); reference data seeded into Supabase Postgres.
- **Process:** pure-TS scoring library (`src/lib/riasec/`) derives the 3-letter Holland code; the existing `match_courses(p_code)` SQL RPC (migration `0001_init.sql`) ranks courses by shared Holland letters (exact = 3 shared, partial = 2).
- **Output:** server-rendered recommendations, directory, and course pages; template-generated Future Self narratives; marker-based WebAR previews; emailed results via Resend.

### Tech stack

| Layer | Choice | Justification (incl. heavy-UI support) |
|---|---|---|
| Frontend | **Next.js 16.2.5** App Router, React 19, TypeScript | Server Components keep the four UI libraries' animation code out of the shared bundle; per-route code splitting isolates three.js/MindAR to the AR route only. Breaking-change caveat per Decision 2. |
| Styling | **Tailwind v4** (`@tailwindcss/postcss`) + `tw-animate-css` | Design tokens live in `@theme` inside `globals.css`; vendored MagicUI/Aceternity keyframes are ported there once and shared by every component. |
| Components | **shadcn/ui (Base UI) + MagicUI + Aceternity + Efferd**, all vendored via the `shadcn` CLI registry system into `src/components/{ui,magic,aceternity,blocks}` | Copy-paste ownership (no runtime dependency on any of the four): every animated component can be performance-tuned, reduced-motion-gated, and visually themed locally. |
| Motion | framer-motion 12 (`motion/react`) behind a single `LazyMotion` provider | One orchestration layer for page transitions, quiz-step choreography, and stagger reveals, with tree-shaken features. |
| Backend | **Supabase** — Postgres, RLS, Edge Functions; **Auth product deliberately unused** | Anonymous by design (Decision 1). RLS still enforced: public-read on reference tables, insert-only on `assessments`, zero read-back of analytics. |
| Email | **Resend** called from a Supabase Edge Function | Results delivery without accounts. DKIM/SPF for deliverability; raw email addresses are never persisted (Data Privacy Act of 2012). |
| AR | **MindAR** (marker/image tracking) + three.js; GLB assets ≤ 2 MB, Draco-compressed | Browser-only WebAR, no native app; lazy-loaded on its own route so it never taxes the core journey. |
| Infra | Vercel (web) + Supabase Cloud (data); GitHub Actions CI; Sentry (errors) + PostHog (product analytics) + Vercel Analytics (Web Vitals) | Per PRD; staging and production are separate Vercel + Supabase environments. |

### Database plan

Migration `0001_init.sql` already provides `careers`, `courses`, `course_careers`, anonymous `assessments`, indexes on `riasec_tag`, RLS policies, and the `match_courses` RPC. **Gap:** the PRD's university directory has no tables yet. A new migration `0002_universities.sql` adds:

- `universities` — id, slug, name, city, province, type (public/private), description, website, admission_link.
- `university_courses` — university_id FK, course_id FK, estimated_tuition_low/high (band, in PHP), composite PK.
- Indexes on `universities(city)`, `universities(province)`, `university_courses(course_id)`; public-read RLS policies matching 0001's pattern.

The placeholder `supabase/seed.sql` is replaced by a schema-validated CSV → seed pipeline for the manually researched Central Luzon dataset (see Roadmap, Phase 1 — this is the schedule-critical content track).

---

## 2. UI/UX Component Mapping & Strategy

**Design language:** "Empathetic Guidance." Teal/blue base (stability), orange/yellow accents (energy and gamification), generous radii, dark mode native. All of it expressed as Tailwind v4 `@theme` tokens so shadcn, MagicUI, Aceternity, and Efferd components read from one palette and both themes stay coherent.

**Division of labor across the four libraries:** Efferd supplies page-level *structure* (headers, footers, heroes, FAQ blocks). Aceternity supplies *visual identity moments* (hero backgrounds, bento grids, spotlight cards). MagicUI supplies *micro-interactions and gamified feedback* (confetti, sparkles, shimmer, tickers). shadcn/ui supplies *every foundational control* — forms, dialogs, inputs, tabs — because it is the accessibility floor.

| Feature | Component mapping |
|---|---|
| **Landing page** | **Efferd**: free Hero block + Header/Nav + Footer + FAQ blocks as the structural skeleton. **Aceternity**: *Hero Highlight* (or *Aurora Background*) behind the hero headline; *Bento Grid* for the four feature highlights (Assessment, Recommendations, Directory, AR/Future Self); *Infinite Moving Cards* for student testimonials. **MagicUI**: *Animated Shiny Text* on the "Find your path" eyebrow badge; *Shimmer Button* on the primary "Start the assessment" CTA; *Number Ticker* for stats (HEIs listed, courses mapped). **shadcn**: `Sheet` mobile nav, `Button`. |
| **RIASEC assessment quiz** | **shadcn**: `Progress`, `Card`, `RadioGroup`/`Slider` (Likert scale), `Button`. **MagicUI**: *Animated Circular Progress Bar* step counter; *Blur Fade* on each question entering; *Confetti* on completion. **Framer Motion**: `AnimatePresence` slide transitions between questions; stagger on answer options. **State**: existing `useAssessmentStore` (kept as-is — it already handles re-answer score correction and localStorage resume). |
| **Results reveal** | **MagicUI**: *Sparkles Text* for the Holland code reveal moment; *Animated Gradient Text* for the dominant trait name. **shadcn**: `Chart` (Recharts `RadarChart`) for the six-trait radar, themed to design tokens — this is the honest implementation of the PRD's "Aceternity data visualizers" — wrapped in Aceternity's *Card Spotlight* for the premium frame. |
| **Recommendations list** | **Aceternity**: *3D Card Effect* for the #1 match; *Card Hover Effect* grid for matches 2–5. **MagicUI**: *Magic Card* cursor-glow on hover. **shadcn**: `Badge` communicating match strength ("Exact match" vs "Strong match") derived from the RPC's `match_score`. |
| **University directory** | **shadcn**: `Input` + `Command` search, `Select` filters (city, course offered), `Pagination`, `Skeleton` loading states. **Aceternity**: *Placeholders And Vanish Input* as the delight search field (plain `Input` as reduced-motion fallback); *Focus Cards* or *Card Hover Effect* for the HEI grid. Filters live in URL `searchParams` — shareable links, server-rendered results. |
| **Course details** | **Aceternity**: *Bento Grid* (PRD-mandated) tiling overview / core subjects / career paths / outlook; *Timeline* for the career trajectory strip. **shadcn**: `Tabs`, `Accordion` (pros & cons), `Breadcrumb`. |
| **Future Self simulation** | **MagicUI**: *Typing Animation* rendering the generated narrative like a story being told. **Aceternity**: *Tracing Beam* scroll container for the day-in-the-life sequence. **shadcn**: `Card` framing. |
| **AR Career Preview** | **shadcn**: `Dialog` camera-permission walkthrough; `Alert` for unsupported-device fallbacks. **MagicUI**: *Border Beam* around the live camera viewport. QR code (`qrcode` lib) so desktop users hand off the session to their phone. Entire route loaded via `next/dynamic` — three.js/MindAR never enter any other chunk. |
| **Email-my-results** | **shadcn**: `Dialog` + `Form` (zod validation) + `Input` + consent `Checkbox` (Data Privacy Act copy) + `Sonner` success toast. **MagicUI**: *Pulsating Button* send CTA. |

**State management strategy:** Server Components own all reference data — no client-side global state ever mirrors server data. Zustand is scoped to (1) the existing assessment session store and (2) one small UI store for AR/dialog flags. Directory filter state lives in the URL.

**Animation orchestration strategy:** one `LazyMotion` provider at the root; every vendored animated component consumes a shared `useReducedMotion` gate so `prefers-reduced-motion` collapses nonessential motion globally. This single lever simultaneously serves accessibility (WCAG), deterministic visual-regression snapshots, and the Lighthouse performance budget. Scroll-triggered animations fire on viewport entry (IntersectionObserver / `whileInView`), never on mount, so below-the-fold effects cost nothing at load.

---

## 3. Concrete Development Roadmap (5 phases ≈ 10 weeks)

### Phase 1 — Foundation & Data (Weeks 1–2)

*Dependencies: none. Exit criteria: deployed shell with real design tokens; seeded local database; green CI.*

| # | Task | Effort |
|---|---|---|
| 1.1 | Read Next 16 bundled docs (`node_modules/next/dist/docs/`); write a "Next 16 delta notes" doc for the team (proxy vs middleware, caching directives, breaking conventions) | 0.5 d |
| 1.2 | **Delete `(auth)/login` and `(auth)/register` routes** (Decision 1) | 0.5 d |
| 1.3 | Define `@theme` design tokens: teal/blue + orange/yellow palettes, radii, typography, dark mode | 1 d |
| 1.4 | Register the four registries with the shadcn CLI; vendor an initial component set; **verify Tailwind v4 + Base UI compatibility now, not later**; port keyframes to `@theme` | 2 d |
| 1.5 | Build the app shell: Efferd header/footer, root layout, `LazyMotion` provider, `useReducedMotion` gate | 1.5 d |
| 1.6 | Migration `0002_universities.sql` (tables, indexes, RLS per §1) | 1 d |
| 1.7 | **Content track (parallel, schedule-critical):** research Central Luzon HEIs, programs, careers; RIASEC-tag everything; build CSV → validated `seed.sql` pipeline | runs Wk 1–4 |
| 1.8 | CI: GitHub Actions running lint, typecheck, Vitest, and build on every PR; Conventional Commits enforced | 1 d |
| 1.9 | Sentry + PostHog + Vercel Analytics wiring; staging/production environment split | 1 d |

### Phase 2 — Assessment Engine (Weeks 3–4)

*Dependencies: Phase 1 tokens and shell. Exit criteria: end-to-end quiz producing a stable, tested Holland code.*

| # | Task | Effort |
|---|---|---|
| 2.1 | Static question bank (~30–48 Likert items, 5–8 per trait) in `src/lib/riasec/questions.ts` | 1.5 d |
| 2.2 | Pure scoring library `src/lib/riasec/scoring.ts`: tally → deterministic tie-breaking → 3-letter Holland code; **exhaustive unit tests including property-based cases** | 2 d |
| 2.3 | Quiz UI per §2 mapping, driving the existing `useAssessmentStore`; keyboard-completable | 3 d |
| 2.4 | Refresh-resume flow ("Welcome back — continue where you left off?") from persisted state | 1 d |
| 2.5 | Completion flow: anonymous `assessments` insert, PostHog funnel events (per-question drop-off), Confetti + results redirect | 1.5 d |

### Phase 3 — Recommendations, Directory & Course Details (Weeks 5–6)

*Dependencies: Phase 2 scoring; Phase 1 seed data. Exit criteria: the full core journey (assess → results → directory → course) works on staging.*

| # | Task | Effort |
|---|---|---|
| 3.1 | Results page: radar chart, Holland-code reveal, trait explanations | 2 d |
| 3.2 | Wire `match_courses` RPC; match-strength badges; top 3–5 curation per PRD | 1.5 d |
| 3.3 | Directory: searchParams-driven filters, ISR, empty/loading states | 2.5 d |
| 3.4 | Course detail pages: `generateStaticParams` + ISR, Bento layout, pros/cons, linked HEIs | 2.5 d |
| 3.5 | Cross-linking: course → HEIs offering it; career → Future Self & AR entry points | 1 d |

### Phase 4 — Innovation Features & Email Delivery (Weeks 7–8)

*Dependencies: Phase 3. Exit criteria: all MVP features demoable on a mid-range Android phone.*

| # | Task | Effort |
|---|---|---|
| 4.1 | Future Self template engine: procedural narratives from `careers.day_in_life` + variables (LLM/Gemini integration explicitly post-MVP, but the function signature accepts a pluggable generator) | 2 d |
| 4.2 | AR route: MindAR + three.js via `next/dynamic`; marker flow with QR hand-off; Draco-compressed GLB assets ≤ 2 MB; capability detection with static 3D-viewer fallback | 4 d |
| 4.3 | **`send-results` Supabase Edge Function**: Resend integration; per-IP + hashed-email rate limiting in a small table; consent enforcement; **raw email never stored — send and discard**; branded HTML results template | 2.5 d |
| 4.4 | Landing page final polish per §2 mapping; OG images and metadata | 1.5 d |

### Phase 5 — Hardening & Launch (Weeks 9–10)

*Dependencies: everything. Exit criteria: launch.*

| # | Task | Effort |
|---|---|---|
| 5.1 | Playwright E2E journeys + visual-regression snapshots (protocol in §4) | 3 d |
| 5.2 | Lighthouse CI gate (≥ 90 Perf/A11y/SEO, mobile emulation) wired into Actions; fix regressions | 2 d |
| 5.3 | Accessibility audit: axe automated pass + manual keyboard/screen-reader pass; contrast verification in both themes | 1.5 d |
| 5.4 | Load sanity check: k6 against the anonymous-insert and RPC paths | 1 d |
| 5.5 | UAT with Central Luzon SHS students; iterate on findings | 2 d |
| 5.6 | Production promotion: custom domain, Resend DKIM/SPF verification, privacy notice page, monitoring dashboards | 1 d |

---

## 4. QA & Testing Protocol

**Unit (Vitest — already configured).** Highest-value targets: the scoring library (property-based tests — every possible answer set yields a valid 3-letter code; ties resolve deterministically; re-answering a question never corrupts totals — the store's subtraction logic in `setAnswer` gets explicit coverage), the Future Self template generator, and utility functions. Coverage target ~90% on `src/lib/riasec/`.

**Integration.** React Testing Library with a mocked Supabase client for component behavior; plus **RPC contract tests** that run `supabase start` in CI against real migrations + seed and assert `match_courses` ranking semantics (exact-before-partial, alphabetical tiebreak) — so the SQL and the TypeScript expectations can never silently drift.

**E2E (Playwright — already installed).** Four journeys: (1) land → complete full assessment → results → email dialog with Resend mocked; (2) mid-quiz refresh → resume; (3) directory search/filter → course detail; (4) AR route with `--use-fake-device-for-media-stream`, plus the camera-denied fallback path.

**Visual regression — critical given MagicUI/Aceternity.** Playwright `toHaveScreenshot` per key page in **light and dark themes**, captured under `reducedMotion: 'reduce'` emulation so the global motion gate freezes every animation deterministically. Snapshots generated and compared on Linux CI only (avoids cross-OS font antialiasing noise). A separate "animation smoke" spec runs with motion enabled and asserts every animated component mounts without console errors — catching breakage without flaky pixel diffs.

**Performance budgeting.** Lighthouse CI asserts ≥ 90 on every PR (mobile emulation, throttled CPU). Route-level JS budgets checked from `next build` output: landing ≤ ~180 KB gzipped; three.js/MindAR must appear **only** in the AR chunk (a CI grep on the build manifest enforces this). LCP < 2.5 s on throttled mid-tier mobile. Canvas-based background effects (Aurora, Spotlight) are measured under CPU throttling — if any blows the budget, it is swapped for its CSS-gradient variant. Images through `next/image`; fonts subset and self-hosted.

**UAT.** Scripted sessions with target SHS students validating the "Empathetic Guidance" thesis, paired with PostHog funnels (per-question assessment drop-off, results → email conversion) as the quantitative companion.

---

## 5. Risk Mitigation & Edge Cases

| Risk | Impact | Mitigation |
|---|---|---|
| **Next 16 breaking changes** vs Next 15 assumptions baked into registry docs, tutorials, and habit | Subtle build/runtime failures | Phase 1 doc-reading task producing shared delta notes; versions pinned; CI build gate on every PR. |
| **Registry components assume Tailwind v3 + Radix** while the repo is Tailwind v4 + Base UI | Vendored components break or double-bundle | Vendor the full initial set in Phase 1 (task 1.4) to surface incompatibilities immediately; port keyframes to `@theme` once; keep all fixes local to `components/{magic,aceternity}`. |
| **Animation weight degrades low-end mobile** (the primary audience) | Lighthouse < 90; students bounce | Global reduced-motion gate, `LazyMotion`, viewport-triggered animation only, CSS fallback variants for canvas effects, throttled-CPU perf tests in CI. |
| **Efferd freemium wall** on a needed block | Blocked UI task | Free hero/header/footer blocks confirmed sufficient for MVP; any paid block gets a shadcn-built equivalent — a budget decision, never a dependency. |
| **Email abuse / Data Privacy Act exposure** (psychometric results + email = sensitive personal information) | Legal and trust damage | No accounts; raw email never stored (hash only, for rate limiting); explicit consent checkbox with DPA copy; public privacy notice; honeypot + per-IP rate limits in the Edge Function; DKIM/SPF via Resend. |
| **AR fails on iOS Safari / budget devices** | Feature appears broken | Capability detection → static 3D viewer fallback; assets Draco-compressed ≤ 2 MB; AR kept entirely off the core journey's critical path. |
| **Static HEI/course data goes stale** (no auth ⇒ no in-app admin CMS possible) | Loss of user trust | MVP runbook: data edits via versioned seed scripts + Supabase Studio; an admin CMS (with its own separate admin credentialing, distinct from the student-facing no-auth stance) stays on the future roadmap. |
| **Seed-data research slips** (manual, per PRD's MVP scope) | Phase 3 blocked | Content track starts day one as a parallel workstream with a schema-validated CSV pipeline; Phase 3 can proceed on partial data. |
| **5,000 concurrent assessment sessions** | Degraded response times | Assessment is fully client-side; reference pages are ISR/edge-cached; the only write is an anonymous insert. k6 sanity test in Phase 5; Upstash Redis deferred until real directory-query metrics justify it. |

---

## Out of MVP scope (unchanged from PRD)

Skills Gap Analysis, financial/scholarship modules, TESDA pathways, live labor-market feeds, full spatial AR, native mobile app, and LLM-generated Future Self narratives (the template engine's generator interface is designed so a Gemini-backed Edge Function can slot in later without UI changes).

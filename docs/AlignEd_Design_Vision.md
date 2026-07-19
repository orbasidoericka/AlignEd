# AlignEd Design Vision — "Liwanag"

> Creative blueprint for the full user journey. Feeds Phases 2–4 of the
> Implementation Plan. Status: proposed, pre-implementation.

## 1. The Vision

**Concept name: Liwanag** (Filipino: *light, clarity*). The product's entire
emotional arc is a student walking out of fog into light — from "everyone is
deciding for me" to "I can see my path." Every design decision serves that
arc.

**The vibe:** calm confidence with moments of celebration. Not a government
form, not a children's app — a premium tool that takes a 17-year-old's future
seriously. Think: the warmth of Duolingo's encouragement, the credibility of
a fintech dashboard, the glow of a sunrise palette (our existing teal → amber
tokens are literally dawn colors — we lean in).

**Design trends we commit to (and why):**
- **Soft glassmorphism** — already in the floating pill nav; extended to
  overlays and the mobile dock. Feels modern without heavy GPU cost.
- **Ambient spatial depth** — dot grids (Hero Highlight), mouse-reactive
  glow, 3D card tilt on the top recommendation. Depth = importance.
- **Narrative scrolling** — the Future Self reads like a story, not a data
  sheet (Tracing Beam + typewriter).
- **Gamified progress without points** — progress rings, milestone moments,
  a constellation that fills in as you answer. Progress you can *feel*,
  no leaderboards (this is self-discovery, not competition).
- **What we refuse:** brutalism (cold), autoplay video (data cost), motion
  that gates content (reduced-motion users get 100% of the experience).

**The one rule:** every animation must survive two tests — does it run on a
₱6,000 Android phone, and does the page still make sense with it turned off?

## 2. Navigation Reinvention — "The nav is a compass, not a menu"

Four moves, ordered by impact:

### 2.1 Journey-aware navigation (the big idea)
The nav reflects *where the student is in their journey*, powered by the
assessment store (localStorage — works anonymously):
- Before the quiz: "My Results" renders dimmed with a lock glyph and a
  shadcn `Tooltip`: "Take the 8-minute assessment to unlock." Curiosity gap.
- Quiz in progress: nav item shows a mini progress ring (MagicUI
  `AnimatedCircularProgressBar`, 16px) — the site remembers, everywhere.
- Completed: "My Results" earns a one-time MagicUI `BorderBeam` glow and a
  dot badge. The nav itself celebrates.
- Post-completion, the home hero CTA swaps from "Start the assessment" to
  "View your results" — the site converses with returning students.

### 2.2 Mobile bottom dock (app-like, thumb-first)
Our users are 90% mobile. Top-pill nav stays for brand/orientation, but the
primary journey moves to a **floating bottom dock** (MagicUI `Dock`,
glassmorphic): Home · Assessment · Results · Universities. Thumb-zone
ergonomics, app-like feel, zero app-store friction. The hamburger Sheet
remains only for secondary links (About, Privacy, Counselors).

### 2.3 Universal search (⌘K / dock search)
shadcn `Command` palette over our static dataset (courses, careers,
universities — all seeded, all client-searchable): "type 'nursing' from any
page → course, careers, 6 universities, tuition bands." Frictionless
discovery, zero backend cost. Desktop: ⌘K + header icon. Mobile: dock button.

### 2.4 Focus Mode for the assessment
During the quiz, global chrome disappears (no header links, no footer, no
dock) — replaced by a minimal bar: logo, progress, save state ("Saved ✓").
One decision per screen. Exit attempts get a shadcn `AlertDialog` reassuring
progress is saved. Fewer exits = the PRD's #1 risk (abandonment) addressed
by architecture, not nagging.

## 3. Component-Mapped Wireframes (page by page)

### Home (evolve, don't rebuild)
Keep: Hero Highlight, bento, testimonial marquee, CTA banner.
Add: **Aceternity Sticky Scroll Reveal** "How it works" (3 chapters:
Discover yourself → See your matches → Walk your future); **MagicUI
Marquee** strip of partner-university wordmarks under the hero stats;
journey-aware hero CTA (2.1).

### Assessment — "Focus Mode"
- Shell: minimal top bar (shadcn `Progress` + step count), trait
  constellation faintly glowing in the backdrop as answers accumulate
  (six fixed stars, one per RIASEC trait, brightening with each answer —
  pure CSS opacity, virtually free).
- Questions: card per question, framer-motion `AnimatePresence` slide;
  Likert scale as five large tappable cards (shadcn `RadioGroup` restyled,
  thumb-sized, emoji-anchored endpoints).
- Milestones: every 25%, a beat — MagicUI `BlurFade` interstitial ("You're
  halfway. Most students never get this far.").
- Completion: MagicUI `Confetti` (one burst, respects reduced motion) →
  results.

### Results Reveal — the payoff (staged, cinematic, skippable)
1. **The moment:** full-viewport reveal — MagicUI `SparklesText` renders the
   Holland code ("You're an S-I-A"), `AnimatedGradientText` names it
   ("The Compassionate Investigator").
2. **The evidence:** shadcn `Chart` radar (six traits) inside Aceternity
   `CardSpotlight`.
3. **The matches:** #1 course as Aceternity `3D Card`; matches 2–5 as
   `CardHoverEffect` grid with match-strength `Badge`s.
4. **The keepsake:** "Email me my results" — shadcn `Dialog` + `Form` +
   consent `Checkbox`, MagicUI `PulsatingButton`. (Anonymous-first: email is
   the only persistence, per Decision of Record.)

### University Directory — exploration, not spreadsheet
- Aceternity `PlaceholdersAndVanishInput` search ("Try 'engineering in
  Bulacan'…") with plain-input reduced-motion fallback.
- Province filter: horizontal scroll chips (shadcn `ToggleGroup`),
  thumb-reachable; course filter via `Select`.
- Results: Aceternity `FocusCards` grid (hover dims siblings); public/private
  + tuition-band `Badge`s; `Skeleton` loading; empty state suggests nearest
  provinces.
- Post-assessment personalization: "Show schools matching my results" toggle
  pre-filters via localStorage code.

### Course Details — the decision page
- Aceternity `BentoGrid`: overview / core subjects / pros & cons (shadcn
  `Accordion`) / outlook tiles.
- Aceternity `Timeline`: SHS → college years → entry job → 5-year career.
- Universities offering it: compact cards with tuition bands, deep-linked.
- Exit CTAs: "Meet your Future Self" (BorderBeam) + "See who teaches this."

### Future Self — a story, not a printout
Aceternity `TracingBeam` down the page; the day unfolds in chapters
(Morning / Midday / Evening) with MagicUI `TypingAnimation` on the opening
line of each chapter (then instant text — typewriter as seasoning, not
gatekeeper). Ends with the career's tools (icon row), real quote styling,
and CTAs: AR preview · email my results · back to matches.

### AR Preview — the wow, safely fenced
shadcn `Dialog` walkthrough → camera viewport framed by MagicUI
`BorderBeam` → GLB model. Capability detection first; fallback is an
in-page 3D viewer, never a dead end. QR hand-off from desktop.

## 4. Next Steps for Development

1. **Vendor the new components** (one batch): shadcn `command`,
   `alert-dialog`, `tooltip`, `progress`, `radio-group`, `toggle-group`,
   `select`, `dialog`, `accordion`, `tabs`, `chart`; MagicUI `dock`,
   `confetti`, `sparkles-text`, `animated-gradient-text`,
   `animated-circular-progress-bar`, `pulsating-button`, `typing-animation`,
   `marquee`; Aceternity `card-spotlight`, `3d-card`, `card-hover-effect`,
   `focus-cards`, `placeholders-and-vanish-input`, `tracing-beam`,
   `timeline`, `sticky-scroll-reveal`. Same vendoring discipline as Phase 1
   (framer-motion adaptation, tokens, reduced-motion gates).
2. **Build the journey state selector** (`useJourneyStage()` reading the
   existing assessment store): `new | in-progress | completed` — powers nav
   states, dock badges, hero CTA swap. Tiny, testable, ships first.
3. **Implement in Phase 2 order**: Focus Mode assessment → results reveal →
   journey-aware nav/dock → command palette (it needs the seeded data
   already in `data/*.csv`).
4. **Guardrails stay non-negotiable**: every new animated component behind
   the global reduced-motion gate; Lighthouse ≥ 90 checked per feature; the
   constellation and dock measured on CPU-throttled mobile before merging.

*— Liwanag: the student arrives confused, and leaves carrying a light.*

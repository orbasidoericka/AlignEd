# AlignEd Design Vision — "Liwanag"

> Creative blueprint for the four-step journey defined in `docs/AlignEd_PRD.md`
> (Landing → Profile → Assessment → Results). Feeds Phases 2–4 of the
> Implementation Plan. If this document and the PRD conflict, the PRD wins.

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
  glow, 3D card tilt on the top program recommendation. Depth = importance.
- **Gamified progress without points** — progress rings, milestone moments,
  a constellation that fills in as you answer. Progress you can *feel*,
  no leaderboards (this is self-discovery, not competition).
- **What we refuse:** brutalism (cold), autoplay video (data cost), motion
  that gates content (reduced-motion users get 100% of the experience).

**The one rule:** every animation must survive two tests — does it run on a
₱6,000 Android phone, and does the page still make sense with it turned off?

## 2. Navigation — "The nav is a compass, not a menu"

Three moves, ordered by impact:

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

### 2.2 Mobile-first, thumb-first
Our users are 90% mobile. The top pill nav stays for brand/orientation; the
journey itself is linear, so primary navigation is the journey's own
forward CTAs — always in the thumb zone. The hamburger `Sheet` holds only
secondary links (About, Privacy).

### 2.3 Focus Mode for profile + assessment
From Profile Setup through quiz completion, global chrome disappears (no
header links, no footer) — replaced by a minimal bar: logo, progress, save
state ("Saved ✓"). One decision per screen. Exit attempts get a shadcn
`AlertDialog` reassuring progress is saved. Fewer exits = the PRD's #1 risk
(abandonment) addressed by architecture, not nagging.

## 3. Component-Mapped Wireframes (page by page)

### Landing (evolve, don't rebuild)
Keep: Hero Highlight, bento, testimonial marquee, CTA banner.
Add: **Aceternity Sticky Scroll Reveal** "How it works" (4 chapters:
Tell us where you are → Discover yourself → See your alignment → Walk out
with a plan); journey-aware hero CTA (2.1); duration promise ("~8 minutes")
under the CTA.

### Profile Setup — the doorway (new step, before the quiz)
Runs inside the Focus Mode shell so the transition into the assessment feels
like one continuous corridor, not a form then a quiz.
- **Grade level:** two large tappable cards (shadcn `RadioGroup` restyled) —
  "Grade 11" / "Grade 12". Nothing else.
- **SHS Strand:** the seven strands as generous option cards (shadcn
  `ToggleGroup` single-select or `Select` on narrow screens), each with a
  five-word descriptor. A `Tooltip` explains *why we ask*: "We'll check how
  your strand matches your results."
- **School (optional):** single shadcn `Input`, character counter at 120,
  clearly labeled optional — visually quieter than the two required fields.
- Continue button disabled until grade + strand are set; missing fields
  indicated inline, never with an error modal.

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

### Results Dashboard — the payoff (staged, cinematic, skippable)
1. **The moment:** full-viewport reveal — MagicUI `SparklesText` renders the
   Holland code ("You're an S-I-A"), `AnimatedGradientText` names it
   ("The Compassionate Investigator").
2. **The evidence:** shadcn `Chart` radar (six traits) inside Aceternity
   `CardSpotlight`, with plain-language blurbs for the top three traits.
3. **The verdict — Strand Validation (the headline feature):** a
   `BorderBeam`-framed card answering the question the student actually
   walked in with: *"Does my strand fit me?"* Verdict badge (Aligned /
   Partially Aligned / Misaligned / Aligned—Flexible for GAS), the shared
   Holland letters shown as glowing evidence chips, and insight copy that
   is always constructive — a Misaligned verdict reads as a discovery, not
   a failing grade, and tells Grade 11 students the shift window is still
   open.
4. **The matches:** #1 recommended program as Aceternity `3D Card`;
   programs 2–5 as `CardHoverEffect` grid with match-strength `Badge`s
   ("Exact match" / "Strong match"); career suggestions as a compact
   tag-labeled card grid below. No university names or links anywhere.
5. **The keepsake:** two equal-weight actions closing the page —
   **"Download PDF"** (opens the print-optimized view) and **"Email me my
   results"** (shadcn `Dialog` + `Form` + consent `Checkbox`, MagicUI
   `PulsatingButton`). Anonymous-first: these two exports are the only ways
   results leave the device, per the PRD.

### Print / PDF view — the keepsake, materialized
A dedicated print-optimized rendering of the results: single column, A4,
grayscale-legible, AlignEd wordmark and generation date in the header, all
interactive chrome and motion removed. Design it as a document a student
proudly hands to a parent or counselor — it is the artifact that outlives
the session.

## 4. Next Steps for Development

1. **Vendor the new components** (one batch): shadcn `command`,
   `alert-dialog`, `tooltip`, `progress`, `radio-group`, `toggle-group`,
   `select`, `dialog`, `accordion`, `chart`, `checkbox`; MagicUI `confetti`,
   `sparkles-text`, `animated-gradient-text`,
   `animated-circular-progress-bar`, `pulsating-button`; Aceternity
   `card-spotlight`, `3d-card`, `card-hover-effect`,
   `sticky-scroll-reveal`. Same vendoring discipline as Phase 1
   (framer-motion adaptation, tokens, reduced-motion gates).
2. **Build the journey state selector** (`useJourneyStage()` reading the
   assessment store): `new | profiled | in-progress | completed` — powers
   nav states, hero CTA swap, and route guards. Tiny, testable, ships first.
3. **Implement in Phase 2–3 order**: Profile Setup → Focus Mode assessment
   → results reveal (code → verdict → matches → exports) → journey-aware
   nav.
4. **Guardrails stay non-negotiable**: every new animated component behind
   the global reduced-motion gate; Lighthouse ≥ 90 checked per feature; the
   constellation measured on CPU-throttled mobile before merging.

*— Liwanag: the student arrives confused, and leaves carrying a light.*

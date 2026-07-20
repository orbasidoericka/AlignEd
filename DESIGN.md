<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Design Language ("Liwanag at Umaga")

Light-first, friendly, student-focused visual system. Supersedes the dark-leaning surface treatments in `docs/AlignEd_Design_Vision.md`; that document's journey architecture (Focus Mode, journey-aware nav, staged results reveal) still stands, and `docs/AlignEd_PRD.md` still wins on scope.

**Voice in three words:** warm, credible, encouraging. A premium tool that takes a 17-year-old's future seriously without ever feeling like a government form.

## Theme

- **Light is the default theme** (`next-themes defaultTheme="light"`). Dark mode is preserved via the toggle and must hold WCAG AA contrast; the PRD requires both themes.
- Body background is a clean near-white (`oklch(0.99 0.01 210)`), never cream/beige, never dark dotted patterns.

## Typography

- **Headings/display:** Poppins (500–800), `--font-heading`. Geometric, rounded, friendly.
- **Body/UI:** Nunito Sans, `--font-sans`. Highly readable at small sizes.
- **Mono:** JetBrains Mono (code/data only).
- Base sizes bumped for young readers: `--text-base: 1.0625rem`, `--text-lg: 1.1875rem`. Landing heading scale ratio ≥1.25; app screens 1.125–1.2.
- `text-wrap: balance` on h1–h4. No thin weights on busy backgrounds. No all-caps body copy.

## Stage-accent system (journey wayfinding)

Each journey stage owns one accent, reinforced in nav underlines, icon chips, progress bars, section washes, and verdict framing so the student always knows where they are:

| Stage | Accent | Tokens |
| :--- | :--- | :--- |
| Profile Setup | Warm amber | `stage-profile`, `-strong`, `-soft`, `-foreground` |
| Assessment | Calming blue | `stage-assessment`, `-strong`, `-soft`, `-foreground` |
| Results | Friendly pink | `stage-results`, `-strong`, `-soft`, `-foreground` |

Rules: `-strong` is the text-safe variant (≥4.5:1 on the stage's soft wash); `-soft` is a background wash only, never a text color; base is for fills, chips, and large graphics. Both themes define all four. The landing page may use all three accents (brand register); each app screen commits to exactly one (product register).

## Register split

- **Landing = brand register.** Committed color, soft SVG shape washes, illustration, generous scale, viewport-entry motion. No gradient text, no marquee, no dark banners.
- **Profile / Assessment / Results = product register.** Restrained surfaces, one stage accent, consistent control vocabulary (Base UI wrappers in `components/ui`), 150–250 ms transitions, skeletons for loading, every control with hover/focus/disabled states.

## Motion

Framer-motion 12 behind the root `MotionConfig reducedMotion="user"`; pure-CSS animation collapsed by the global media query in `globals.css`. Animate on viewport entry, never on mount. Reduced motion loses zero content. Every animation must run acceptably on a ₱6,000 Android phone.

## Banned patterns

Gradient text (`background-clip: text`), side-stripe borders (`border-left` accents), glassmorphism as default, identical icon+heading+text card grids, uppercase tracked eyebrow labels above every section, numbered section scaffolding, cream/beige body backgrounds, em dashes in UI copy, marketing buzzwords, thin text over imagery, motion that gates content.

## Components

Vendored, locally owned: shadcn-style wrappers on **Base UI** (`@base-ui/react`, not Radix) in `components/ui`; MagicUI (`components/magic`) for micro-interactions; page blocks in `components/blocks`; journey screens in `components/journey`; charts hand-rolled SVG (`components/riasec`) until the PRD's Recharts phase. Enum inputs (grade, strand, Likert) are always pickers, never free text.

<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Design Language ("Liwanag at Umaga")

Light-first, friendly, student-focused visual system. Supersedes the dark-leaning surface treatments in `docs/AlignEd_Design_Vision.md`; that document's journey architecture (Focus Mode, journey-aware nav, staged results reveal) still stands, and `docs/AlignEd_PRD.md` still wins on scope.

**Voice in three words:** warm, credible, encouraging. A premium tool that takes a 17-year-old's future seriously without ever feeling like a government form.

## Theme

- **Light is the default theme** (`next-themes defaultTheme="light"`). Dark mode is preserved via the toggle and must hold WCAG AA contrast; the PRD requires both themes.
- Body background is light slate (`#F8FAFC`), cards pure white. Never cream/beige, never dark dotted patterns.

## Palette

Tokens live in `apps/web/src/app/globals.css` (Tailwind v4 `@theme inline`; there is no `tailwind.config.ts`).

| Role | Hex | Tokens | Use |
| :--- | :--- | :--- | :--- |
| Main | `#8EACCD` | `primary`, `primary-foreground`, `primary-strong` | Brand, active states, primary CTA fills |
| Secondary | `#D7E5CA` | `secondary`, `secondary-foreground`, `success-strong` | Success, exact matches, soft washes, secondary actions |
| Accent 1 | `#F9F3CC` | `highlight`, `highlight-foreground` | Highlights, insight/warning cards |
| Accent 2 | `#D2E0FB` | `accent`, `accent-foreground`, `border` | Hover states, borders, secondary accents |
| Neutral | `#FFFFFF` / slate | `card`, `background`, `muted`, `foreground` | Surfaces and reading text |

Contrast rules: the pastels fail AA as text on white and under white text. Pastel fills always carry dark `-foreground` text. Colored text uses `primary-strong` (`#3F5F82`) or `success-strong` (`#4A6B35`), never `text-primary`. Focus ring is `primary-strong`. Dark theme reuses the pastels as fills and as text-safe tones on dim washes.

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
| Profile Setup | Soft yellow (`#F9F3CC`) | `stage-profile`, `-strong`, `-soft`, `-foreground` |
| Assessment | Calm blue (`#8EACCD`) | `stage-assessment`, `-strong`, `-soft`, `-foreground` |
| Results | Sage green (`#D7E5CA`) | `stage-results`, `-strong`, `-soft`, `-foreground` |

Rules: `-strong` is the text-safe variant (≥4.5:1 on the stage's soft wash); `-soft` is a background wash only, never a text color; base is for fills, chips, and large graphics. Both themes define all four. The landing page may use all three accents (brand register); each app screen commits to exactly one (product register).

## Register split

- **Landing = brand register.** Committed color, soft SVG shape washes, illustration, generous scale, viewport-entry motion. No gradient text, no dark banners. One marquee allowed (career chips), pausing on hover and rendering as a static wrap under reduced motion.
- **Profile / Assessment / Results = product register.** Restrained surfaces, one stage accent, consistent control vocabulary (Base UI wrappers in `components/ui`), 150–250 ms transitions, skeletons for loading, every control with hover/focus/disabled states.

## Motion

Framer-motion 12 behind the root `MotionConfig reducedMotion="user"`; pure-CSS animation collapsed by the global media query in `globals.css`. Animate on viewport entry, never on mount (sole exception: the Hexagon Pattern cell glow, an ambient background loop). Reduced motion loses zero content. Every animation must run acceptably on a ₱6,000 Android phone.

## Banned patterns

Gradient text (`background-clip: text`), side-stripe borders (`border-left` accents), identical icon+heading+text card grids, uppercase tracked eyebrow labels above every section, numbered section scaffolding, cream/beige body backgrounds, em dashes in UI copy, marketing buzzwords, thin text over imagery, motion that gates content.

## Components

Vendored, locally owned: shadcn-style wrappers on **Base UI** (`@base-ui/react`, not Radix) in `components/ui`; Aceternity UI (`components/aceternity`) for high-impact structure; Magic UI (`components/magic`) for micro-interactions and backgrounds; page blocks in `components/blocks`; journey screens in `components/journey`; charts on shadcn Chart + Recharts (`components/riasec`). Enum inputs (grade, yes/no) are always pickers, never free text. Components that take color strings (gauges, charts) receive `var(--token)`, never raw hex; arcs and strokes that carry meaning use the `-strong` tone for 3:1 non-text contrast.

Install from the registries in `components.json` (`npx shadcn@latest add @aceternity/<name>` or `@magicui/<name>`), then move the file into its library folder and swap raw neutral/black classes for tokens. Registry sources import `motion/react`; add the `motion` package when the first one lands (it re-exports framer-motion 12 and shares the root `MotionConfig`).

### Background texture: Hexagon Pattern

Magic UI Hexagon Pattern (`components/magic/hexagon-pattern.tsx`) is the only background texture, because the RIASEC model is itself a hexagon. Rules:
- **Motion:** the grid never moves. Highlighted cells glow like slow, breathing LEDs (`hex-glow` keyframe in `globals.css`: fade up, fade down, rest dim). Each cell gets its own 5–10s cycle and phase, seeded from its coordinates so the timing looks random but is identical on server and client. Applied with `motion-safe:`; under reduced motion cells stay lit and still. This is the one ambient loop allowed on mount, and it runs on every screen including Focus Mode.
- Container gets `relative isolate overflow-hidden`; pattern gets `-z-10`, so it paints over the container background but under content. Hidden in print.
- Always masked (radial or linear) so it fades before reaching reading text. Flat grid, no skew.
- Visibility: light-mode stroke 20–50% by screen, dark 10–25%. On pale washes and near-white grounds, yellow and green cells use the stage `-strong` tone at 25–35%.
- Highlighted cells take a per-cell class as the third tuple element (`[col, row, "fill-…"]`), or come from `scatterHexagons({ count, cols, rows, classNames, seed })` for a deterministic random spread. Landing may use all three stage colors; product screens use at most four cells.

Current uses: landing hero (16 scattered cells in stage colors), Profile Setup (three yellow cells), Assessment quiz and finish views (two faint corner cells), Results Holland Code cell (four cells, mirrored with `-scale-x-100` so they hug the right edge).

### Library map per interface

**Site header (landing + results, implemented)**
- Aceternity: Resizable Navbar (`components/aceternity/resizable-navbar.tsx`, composed in `components/blocks/site-header.tsx`).
  - **Shape:** full-width bar at the top that becomes a floating pill after 100px of scroll, using token surfaces (`bg-background/80`, ring, `shadow-bento`). Desktop bar at `lg+`; below that a mobile bar with an accessible dropdown (real toggle button with `aria-expanded`, closes on Escape, link tap, or navigation).
  - **Layout:** the links sit in flow (`flex-1`, centred), never as an absolute overlay. Upstream's absolute row spanned the whole bar, so in the narrower pill it landed on top of the theme toggle and CTA.
  - **Glass chrome:** at rest the header is `bg-card/75 backdrop-blur-md` with a hairline bottom border; the scrolled pill carries its own surface and drops the border. The footer matches (`bg-card/75 backdrop-blur-md`, `border-t`, legal strip on `bg-muted/50`). Glass is reserved for these two chrome surfaces, not page content.
  - **Contents:** Assessment and My Results with stage-colored active underline (My Results locked with a tooltip until the quiz is done), How it works (`/#how-it-works`), theme toggle, and the journey-aware CTA. No login: AlignEd has no accounts.
  - **Motion:** runs on framer-motion; springs are instant under reduced motion. Focus mode keeps its own `FocusBar`.

**Landing (`/`)**
- **Sections:** hero → three journey steps → "Options, not verdicts" + privacy → "Six traits, one code" → closing CTA. Testimonials were removed (invented social proof); the trait strip replaces them, reading its copy from `lib/riasec/career-pathways.ts` so the landing can never drift from the results page.
- **CTA ladder:** one wording per surface, never the same label three times. Navbar "Take Assessment", hero "Begin your journey", closing "Find your path"; all switch to the results wording once the assessment is complete (`HeroCta` takes `label` / `doneLabel`).
- **Trait strip:** one bordered panel with dividers, two columns at `sm+`. Deliberately not six icon cards (identical card grids are banned, and the steps section above already uses cards).
- Magic UI: Hexagon Pattern (hero background, implemented), Animated Shiny Text (mantra pill), Marquee (career chips), Blur Fade and Number Ticker (existing).
- Aceternity: Hero Highlight (`Highlight` marker on the key phrase in `highlight`), Sticky Scroll Reveal ("How it works", one stage color per step; plain stacked list below `md`).
- shadcn: Button (CTA), Card (testimonials), Badge, Tooltip (privacy note).

**Assessment (`/assessment`, Focus Mode)**
- Magic UI: Hexagon Pattern, static faint grid with two slowly glowing corner cells, faded out above the answer cards (implemented). The grid itself never moves while reading.
- Magic UI: Animated Circular Progress Bar (`components/magic/animated-circular-progress-bar.tsx`) is the primary tracker (implemented): answered / 42 as a percentage, `-strong` stage arc on a 30% stage track, in a card with "Step 2 of 3", the current question, and how many are left. Progressbar semantics with a spoken value ("12 of 42 statements answered"). Going Back never lowers it.
- Aceternity: Background Lines on the "All done!" finish screen (implemented, `components/aceternity/background-lines.tsx`). Palette streaks burst out from behind the message. It follows the site theme, using tokens that are dark shades on light and pastels on dark.
  - **Motion:** a pure-CSS `animate-line-streak` keyframe with seeded per-path duration and delay (`lib/seeded-random.ts`), no framer and no `Math.random`.
  - **Burst on arrival:** the first 21 streaks launch together the moment the screen appears and ease out fast; the second 21 trickle in over the next ~10s. All 42 run on every screen size.
  - **Coverage:** the center is masked clear only right behind the text (smaller mask on phones).
  - **Reduced motion:** a faint static burst. The demo's gradient heading was not used (banned).
- Rapid-answer guard (implemented, `hooks/use-rapid-answer-guard.ts` + `components/journey/rapid-answer-warnings.tsx`): a first answer given under 2s after a statement appears is a strike. Changed answers (e.g. after Back) never count. Strikes 1 and 2 show a non-blocking sonner toast; strike 3 opens a blocking AlertDialog ("I'll Answer Carefully" or Escape resets the count). Both use the always-dark `notice-*` surface tokens with brand-blue accents in either theme, the only deliberate exception to theme-following surfaces.
- Aceternity: BackgroundGradient (`components/aceternity/background-gradient.tsx`, implemented) wraps each Yes/No `RadioCard`. Pure-CSS adaptation, no `motion` package: palette `bg-answer-gradient` 3px border, with a blurred glow and a pan animation that run only while a card is hovered, keyboard-focused, or selected (the animation stays attached but paused, so it resumes instead of snapping). `motion-safe` only. The selected card also gets an opaque `bg-accent` fill and a check mark, so selection never relies on glow alone. The question area's x-clip is widened 40px so the glow isn't cut off.
- shadcn: RadioGroup/RadioCard as the Yes/No pair, ghost Button "Back", Alert Dialog (exit).
- Quiz flow rules (hardened):
  - **Advancing:** a new answer auto-advances after 280ms. A statement that already has an answer (after Back, or after the rapid-answer pause) shows an outline "Next" button ("Finish" on the last). Re-tapping or pressing Space on the chosen card also advances.
  - **Input guard:** taps in the first 350ms after a statement appears are ignored.
  - **Keyboard:** Y/N answer from anywhere, except when a field is focused or a dialog is open. Arrow keys move the selection without committing.
  - **Focus:** moves to each new statement heading, which also names the answer group; on the finish view it moves to its heading.
  - **Resume:** reopening a fully answered quiz lands on the finish view, which has "Review my answers".
  - **Rapid-answer pause:** stays on the current statement instead of advancing behind the modal.
  - **Focus ring:** radio cards use a solid `ring` token with an offset.
- framer-motion `AnimatePresence` for the question slide.

**Results (`/results`)** (implemented)
- Aceternity: Bento Grid (`components/aceternity/bento-grid.tsx`). Holland Code (2 cols), radar (2 rows), top-three trait bars, one card per code letter (full-width row of three, `components/riasec/pathway-results.tsx`), insight + keepsake actions (full width). Letter cards show the official sheet's description, every college major, and every related pathway (`lib/riasec/career-pathways.ts`) as equal-weight tags in sheet order. Silent sorting: no match labels, badges, rankings, or percentages anywhere in them. Single column on mobile and in print. Each cell uses the Aceternity Glowing Effect frame (`components/aceternity/glowing-effect.tsx`): an outer bordered ring whose 3px border lights up in a palette arc (deep blue, brand blue, sage, cream tones via stage tokens) that follows the pointer within 64px, around the inner card. It runs on framer-motion's `animate`, with the previous tween stopped before a new one starts. Under reduced motion the arc jumps instead of sweeping. The frame and glow disappear in print.
- shadcn: Chart (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`) with Recharts `RadarChart`, Progress, Button, Dialog (email), Alert Dialog (retake).
- Magic UI: Blur Fade (staggered viewport entry), Number Ticker (trait scores), Hexagon Pattern (Holland Code cell texture).

**Profile Setup (`/assessment/profile`)**
- Magic UI: Hexagon Pattern, static grid with three glowing yellow cells (implemented).

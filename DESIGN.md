<!-- Copyright (c) 2026 EdTech. All rights reserved. -->

# AlignEd — Design Language ("Liwanag at Umaga")

Light-first, friendly, student-focused visual system. Supersedes the dark-leaning surface treatments in `docs/AlignEd_Design_Vision.md`; that document's journey architecture (Focus Mode, journey-aware nav, staged results reveal) still stands, and `docs/AlignEd_PRD.md` still wins on scope.

**Voice in three words:** warm, credible, encouraging. A premium tool that takes a 17-year-old's future seriously without ever feeling like a government form.

## Theme

- **Light is the default theme** (`next-themes defaultTheme="light"`). Dark mode is preserved via the toggle and must hold WCAG AA contrast; the PRD requires both themes.
- Body background is a brand-tinted near-white (`#EFF6FF`), cards pure white. Never cream/beige, never dark dotted patterns.

## Palette

Tokens live in `apps/web/src/app/globals.css` (Tailwind v4 `@theme inline`; there is no `tailwind.config.ts`).

| Role | Hex | Tokens | Use |
| :--- | :--- | :--- | :--- |
| Main | `#78AAE2` | `primary`, `primary-foreground`, `primary-strong` | Brand, active states, primary CTA fills |
| Secondary | `#CBE7B6` | `secondary`, `secondary-foreground`, `success-strong` | Success, exact matches, soft washes, secondary actions |
| Accent 1 | `#FBEFA8` | `highlight`, `highlight-foreground` | Highlights, insight/warning cards |
| Accent 2 | `#BFDDFF` | `accent`, `accent-foreground` | Hover/selected fills, secondary accents |
| Line | `#B5CDED` / `#638FC5` | `border`, `input` | Hairline edges; `input` bounds real controls |
| Neutral | `#FFFFFF` / tinted blue | `card`, `background`, `muted`, `foreground` | Surfaces and reading text |

**Saturation is the identity, not the hue.** Every value above is the original pastel re-cut in OKLCH at the same hue and lightness with roughly 1.7x the chroma. The first palette sat at C 0.04–0.06 with zero-chroma slate neutrals, which is below the point where a tint reads as a colour rather than as tinted grey, and it was why the product looked washed out. Neutrals carry 0.014–0.018 chroma toward the brand hue. Dark mode keeps every surface's original lightness (background 18.3%, card 22.7%, chrome 25.4%) and gains chroma only; never make the dark theme darker to make it feel richer.

Contrast rules: the pastels fail AA as text on white and under white text. Pastel fills always carry dark `-foreground` text. Colored text uses `primary-strong` (`#275A96`) or `success-strong` (`#3E6C1D`), never `text-primary`. Focus ring is `primary-strong`. Dark theme reuses the pastels as fills and as text-safe tones on dim washes.

`border` and `input` are separate values and must stay that way. They were one token, and a single pale value cannot be both a fill that carries dark text and a visible edge: at `#D2E0FB` a border measured 1.33:1 on white, so card edges, dividers and kbd outlines were invisible and every surface floated. `border` is a hairline (1.63:1 on card); `input` bounds a real control, so it owes WCAG 1.4.11 and clears 3:1 on both the card and the page.

Changing any of these means re-measuring, not eyeballing. Every pair in both themes (body text ≥4.5:1, UI boundaries and the hero word ≥3:1) was verified numerically; the AuroraText gold had silently regressed to 1.70:1 behind a comment describing a value that was no longer in the file.

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
| Profile Setup | Soft yellow (`#FBEFA8`) | `stage-profile`, `-strong`, `-soft`, `-foreground` |
| Assessment | Calm blue (`#78AAE2`) | `stage-assessment`, `-strong`, `-soft`, `-foreground` |
| Results | Sage green (`#CBE7B6`) | `stage-results`, `-strong`, `-soft`, `-foreground` |

Rules: `-strong` is the text-safe variant (≥4.5:1 on the stage's soft wash); `-soft` is a background wash only, never a text color; base is for fills, chips, and large graphics. Both themes define all four. The landing page may use all three accents (brand register); each app screen commits to exactly one (product register).

A screen sets its stage accent as `currentColor` on its controls (`text-stage-assessment-strong` on the quiz answers, `text-stage-profile-strong` on the grade picker), and the shared control states are written in `currentColor` rather than a hard-coded hue. That is what lets one rule in `ui/radio-group.tsx` stay stage-correct instead of painting a blue hover onto a yellow screen; keep it that way when adding states.

## Register split

- **Landing = brand register.** Committed color, soft SVG shape washes, illustration, generous scale, viewport-entry motion. No gradient text apart from the single hero word noted under Banned patterns, no dark banners. One marquee allowed (career chips), pausing on hover and rendering as a static wrap under reduced motion.
- **Profile / Assessment / Results = product register.** Restrained surfaces, one stage accent, consistent control vocabulary (Base UI wrappers in `components/ui`), 150–250 ms transitions, skeletons for loading, every control with hover/focus/disabled states.

## Motion

Framer-motion 12 behind the root `MotionConfig reducedMotion="user"`; pure-CSS animation collapsed by the global media query in `globals.css`. Animate on viewport entry, never on mount. Two ambient background loops are the exceptions: the Hexagon Pattern cell glow, and the Aurora Background drift on Profile Setup. Both are `motion-safe:` and neither carries meaning. Reduced motion loses zero content. Every animation must run acceptably on a ₱6,000 Android phone.

## Banned patterns

Gradient text (`background-clip: text`) — the one exception is the hero word "Align" (`components/magic/aurora-text.tsx`), which uses its own `--align-a`/`--align-b` tokens (blended lighter from `--primary-strong`/`--stage-profile-strong` toward each hue's pastel base, since a 72px bold word only needs the WCAG AA large-text floor) so every stop still clears ≥4.5:1 as text in both themes; nothing else may use it — side-stripe borders (`border-left` accents), identical icon+heading+text card grids, uppercase tracked eyebrow labels above every section, numbered section scaffolding, cream/beige body backgrounds, em dashes in UI copy, marketing buzzwords, thin text over imagery, motion that gates content.

## Audio

UI sound is decoration: it confirms what the screen already shows, never carries information on its own, and never gates an interaction. Every failure path in `lib/sound/sound-manager.ts` — muted, hidden tab, no Web Audio, a missing file — is a silent no-op, because a sound must never be able to break the click that triggered it.

- **Four sounds, one register each.** `default` is the generic acknowledgement for any pressable control; `yes` / `no` are the quiz binary and belong to nothing else; `celebration` fires only for the answer that completes the assessment.
- **Click, never hover.** Browsers block audio until the first real gesture, so early hovers would be silent anyway; touch devices have no hover at all, and most of the audience is on a phone. One delegated capture-phase listener in `components/sound-provider.tsx` covers `button, a[href], [role="button"], [data-slot="button"]`, because `ui/button.tsx` is a Base UI wrapper with no Slot to hook and several CTAs are plain `next/link` anchors wearing `buttonVariants`. `role="radio"` is deliberately excluded so the quiz cards never double up. `data-sound="off"` opts a subtree out.
- **On by default, always muteable.** `SoundToggle` sits beside the theme toggle in the site header and in the Focus Bar, so it is reachable mid-quiz. The choice persists in `localStorage` (`aligned.sound`) and syncs across tabs. Muting is silent; unmuting plays one click so the choice confirms itself.
- **Trimmed at playback, not by re-encoding.** Files keep their originals; `SOUNDS` carries `startMs` / `maxMs` / `fadeMs`. `default.mp3` is a string of four transients (98, 264, 630 and 790ms) behind 94ms of dead air, and each one reads as its own click, so it plays 94–180ms: the first transient alone, immediately. `celebration.mp3` runs 2.61s and is capped at exactly 1500ms with a 220ms ramp out, scheduled on the audio clock so it cannot drift and does not clip.
- **One sound at a time per name.** A repeat of the same sound fades the previous copy over 40ms instead of letting it overlap itself, so fast clicking stays crisp.
- **The celebration is earned, not repeated.** A ref latch in `assessment-runner.tsx`, armed at mount when the quiz is already complete, means the reward sounds for the answer that finished the quiz and stays silent on a refresh or on the Review my answers → Finish loop.

## Mascots

Six illustrated characters, one per RIASEC trait: Realistic/fox, Investigative/owl, Artistic/chameleon, Social/birds, Enterprising/otter, Conventional/ant. They exist so a 17-year-old recognises who they are before reading a word.

- **Trait cards only.** They appear in the mascot band on the three pathway cards (`components/riasec/trait-mascot.tsx`), and nowhere else. The Holland Code card already carries a ShineBorder, a hexagon pattern, a gradient and three letter chips; a mascot there would be the fifth competing element.
- **Decorative, never informative.** Always `alt=""`: the card's heading already names the trait, so a second announcement only repeats it. Nothing is lost if the images fail to load. They are `print:hidden` — a full-bleed illustration per card is a lot of ink for decoration.
- **Named by trait, mapped by letter.** Files are `public/mascots/<trait>.webp`; `traitForLetter()` in `lib/riasec/scoring.ts` is the single source of the letter→trait mapping, so nothing hardcodes a second copy of it.
- **One canvas, so they match.** The six were exported with different amounts of transparent margin. Each is trimmed, then fitted onto one 800×600 canvas, so every character fills 98–100% of the band height instead of the tightly-cropped ones towering over the loose ones. Sources live in `assets/mascots-source/` (10MB each, outside `public/`, never shipped); the served WebPs are 71–101KB.
- **Primacy is stated, not implied.** The first letter of the code is the student's highest score, and three signals say so: a crown badge reading "Your top trait" in the band, the card's frame in that letter's own trait color at 2px, and `--shadow-bento-lifted` so it sits forward of its neighbours. The badge is real text, because a border and a taller band tell a screen reader user nothing. No glow: the card already runs a `GlowingEffect` on hover.
- **The row stays in code order.** The Holland Code card reads "You are an A-I-R" with "The Creator · The Thinker · The Builder" beneath it, and "What your code means" lists the three top to bottom. Podium-centering the top card would make the row contradict the code string three times on one screen.
- **"Your top trait" is not a match label.** Pathway cards never rank careers against each other or show a match percentage (enforced by a test). Naming the student's own strongest trait is a different claim, and one the page already makes with real numbers directly above.
- **Wash, not fill.** The band ground uses `letterWash()` — the same six trait tokens as the letter chips, softened to 25% (35% in dark, where the illustrations' navy outlines need more separation from the card).

## Components

Vendored, locally owned: shadcn-style wrappers on **Base UI** (`@base-ui/react`, not Radix) in `components/ui`; Aceternity UI (`components/aceternity`) for high-impact structure; Magic UI (`components/magic`) for micro-interactions and backgrounds; page blocks in `components/blocks`; journey screens in `components/journey`; charts on shadcn Chart + Recharts (`components/riasec`). Enum inputs (grade, yes/no) are always pickers, never free text. Components that take color strings (gauges, charts) receive `var(--token)`, never raw hex; arcs and strokes that carry meaning use the `-strong` tone for 3:1 non-text contrast.

Install from the registries in `components.json` (`npx shadcn@latest add @aceternity/<name>` or `@magicui/<name>`), then move the file into its library folder and swap raw neutral/black classes for tokens. Registry sources import `motion/react`; add the `motion` package when the first one lands (it re-exports framer-motion 12 and shares the root `MotionConfig`).

### Background texture: Hexagon Pattern

Magic UI Hexagon Pattern (`components/magic/hexagon-pattern.tsx`) is the background texture everywhere but one screen, because the RIASEC model is itself a hexagon. The exception is Profile Setup, which uses the Aurora Background instead (see below); no third texture is allowed. Rules:
- **Motion:** the grid never moves. Highlighted cells glow like slow, breathing LEDs (`hex-glow` keyframe in `globals.css`: fade up, fade down, rest dim). Each cell gets its own 5–10s cycle and phase, seeded from its coordinates so the timing looks random but is identical on server and client. Applied with `motion-safe:`; under reduced motion cells stay lit and still. This is the one ambient loop allowed on mount, and it runs on every screen including Focus Mode.
- Container gets `relative isolate overflow-hidden`; pattern gets `-z-10`, so it paints over the container background but under content. Hidden in print.
- Always masked (radial or linear) so it fades before reaching reading text. Flat grid, no skew. Where a section's grid meets the next section, mask **vertically only**: the landing hero uses `linear-gradient(to bottom, white, white 55%, transparent 96%)` so the field runs the full viewport width and dissolves into the section below. A radial circle mask there did the opposite on both counts, stopping short of the left and right edges on wide screens and ending in a flat horizontal line at the section boundary.
- Visibility: light-mode stroke 20–50% by screen, dark 10–25%. On pale washes and near-white grounds, yellow and green cells use the stage `-strong` tone at 25–35%.
- Highlighted cells take a per-cell class as the third tuple element (`[col, row, "fill-…"]`), or come from `scatterHexagons({ count, cols, rows, classNames, seed })` for a deterministic random spread. Landing may use all three stage colors; product screens use at most four cells.

Current uses: landing hero (16 scattered cells in stage colors), Profile Setup (three yellow cells), Assessment quiz and finish views (two faint corner cells), Results Holland Code cell (four cells, mirrored with `-scale-x-100` so they hug the right edge).

### Background texture: Aurora Background (Profile Setup only)

`components/aceternity/aurora-background.tsx` replaces the hexagon grid on `/assessment/profile`, so the first screen of the journey feels alive before a student has typed anything.

- **Palette by token.** Stops come from `--aurora-a..d` plus `--aurora-veil`, which flip per theme: light runs the pastels over a page-colored veil that cuts them into ribbons; dark swaps in the light tones and drops the veil to `transparent`, because a near-black veil only muddies the ribbons it is meant to separate.
- **One blurred layer, not upstream's two blended with `mix-blend-difference`.** The second layer cost a full-screen composite and was invisible under this palette, and this has to stay smooth on a ₱6,000 Android phone.
- **`motion-safe:`** — reduced motion keeps the field and drops the 60s drift. Masked with a radial fade so the form never sits on texture, and `print:hidden`.
- Note the keyframe is `aurora-drift`; `aurora` already belongs to AuroraText, which pans a text gradient.
- Scoped to this one page. Every other screen keeps the hexagon grid.

### Library map per interface

**Site header (landing + results, implemented)**
- Aceternity: Resizable Navbar (`components/aceternity/resizable-navbar.tsx`, composed in `components/blocks/site-header.tsx`).
  - **Shape:** full-width bar at the top that becomes a floating pill after 100px of scroll, using token surfaces (`bg-background/80`, ring, `shadow-bento`). Desktop bar at `lg+`; below that a mobile bar with an accessible dropdown (real toggle button with `aria-expanded`, closes on Escape, link tap, or navigation).
  - **Layout:** the links sit in flow (`flex-1`, centred), never as an absolute overlay. Upstream's absolute row spanned the whole bar, so in the narrower pill it landed on top of the theme toggle and CTA.
  - **Glass chrome:** at rest the header is `bg-card/75 backdrop-blur-md` with a hairline bottom border; the scrolled pill carries its own surface and drops the border. The footer matches (`bg-card/75 backdrop-blur-md`, `border-t`, legal strip on `bg-muted/50`). Glass is reserved for these two chrome surfaces, not page content.
  - **Contents:** Assessment with a stage-colored active underline, How it works (`/#how-it-works`), sound and theme toggles, and the journey-aware CTA. No separate My Results link: the CTA itself reads "View My Results" once the quiz is done, so a second link to the same page would just repeat it (My Results stays in the footer). No login: AlignEd has no accounts.
  - **Motion:** runs on framer-motion; springs are instant under reduced motion. Focus mode keeps its own `FocusBar`.
  - **Wordmark:** header and footer both render `components/blocks/wordmark.tsx`, the brand lockup (cap + "ALIGNED"), never retyped as text, so the two cannot drift. Two PNGs, not one recolored by CSS: the mark is raster, and its navy sits at ~1.7:1 on the dark ground, so `aligned-wordmark-dark.png` lifts only the navy to `--primary-strong` and leaves the yellow, which already clears 7:1. One wrapper element holds both copies and swaps them with `dark:`, so a parent `space-y-*` counts one child and exactly one copy reaches the accessibility tree. Sized by height (`h-9` header, `h-8` mobile bar and footer, `h-7` in `FocusBar`); width follows the 4.38:1 ratio. `FocusBar` carries the lockup too, so the brand is the same mark on every screen. Every bar (site header desktop, site header mobile, `FocusBar`) carries both the sound and theme toggles; Focus Mode is not an excuse to strip them.

**Landing (`/`)**
- **Sections:** hero → three journey steps → "Options, not verdicts" + privacy → "Six traits, one code" → closing CTA. Testimonials were removed (invented social proof); the trait strip replaces them, reading its copy from `lib/riasec/career-pathways.ts` so the landing can never drift from the results page.
- **CTA ladder:** one wording per surface, never the same label three times. Navbar "Take Assessment", hero "Begin your journey", closing "Find your path"; all switch to the results wording once the assessment is complete (`HeroCta` takes `label` / `doneLabel`).
- **Trait strip:** one bordered panel with dividers, two columns at `sm+`. Deliberately not six icon cards (identical card grids are banned, and the steps section above already uses cards).
- **Hero headline:** three deliberate moments, staggered so they never land together — AuroraText on "Align" (a slow ambient gradient pan from first paint), the marker on "passion" (draws at 0.7s), the underline on "profession" (draws at 2.6s). No fourth effect goes in this headline.
- Magic UI: Hexagon Pattern (hero background, implemented), AuroraText (`components/magic/aurora-text.tsx`, the word "Align" only — gradient pans, text never transforms, `motion-safe:` so reduced motion keeps the static gradient), Highlighter (`components/magic/highlighter.tsx`, rough-notation marker and underline), Animated Shiny Text (mantra pill), Marquee (career chips), Blur Fade and Number Ticker (existing).
- Aceternity: Hero Highlight (`Highlight` marker on the key phrase in `highlight`), Sticky Scroll Reveal ("How it works", one stage color per step; plain stacked list below `md`).
- shadcn: Button (CTA), Card (journey steps), Badge, Tooltip (privacy note).

**Assessment (`/assessment`, Focus Mode)**
- **Per-session order (implemented):** the 42 statements appear in a random order seeded once per session and persisted (`questionOrder` in `useAssessmentStore`, `shuffleQuestionIds`/`orderQuestions` in `lib/riasec/questions.ts`). A refresh or resume keeps the same sequence, so the navigator's numbering stays stable; a retake (`resetAnswers`) reseeds it. Answers and scoring stay keyed by question id, so order never affects the Holland Code — scoring is order-independent (`scoring.ts`), and the printed bank keeps its printed order untouched.
- Magic UI: Hexagon Pattern, static faint grid with two slowly glowing corner cells, faded out above the answer cards (implemented). The grid itself never moves while reading.
- Magic UI: Animated Circular Progress Bar (`components/magic/animated-circular-progress-bar.tsx`) is the primary tracker (implemented): answered / 42 as a percentage, `-strong` stage arc on a 30% stage track, in a card with "Step 2 of 3", the current question, and how many are left. Progressbar semantics with a spoken value ("12 of 42 statements answered"). Going Back never lowers it.
- Question navigator (`components/journey/question-navigator.tsx`, implemented): the gauge heads one card that also holds a numbered cell per statement. Beside the question from `lg` (19rem column, `z-10` so the question's widened glow clip can never cover it); above it below `lg`, with the number grid folded behind an "All questions" toggle (icon-only on phones) that closes again after a jump.
  - **States, never color alone:** answered = 2px `success-strong` border plus sage wash (the heavier border is the non-color cue, on top of every cell's spoken status); current = stage-blue fill plus `aria-current="step"`; not answered = hairline (one state, before and after a failed finish; the notice names the open numbers). Focus is a solid `ring` outline with offset, distinct from the current fill.
  - **Keyboard:** one tab stop (the current cell); arrows, Home, End move focus; Enter jumps. Disabled while the rapid-answer pause is up.
  - **Finish gate:** "Finish assessment" (and Finish on the last statement) checks the store, never the view. With gaps it stays on the quiz, shows a polite status notice ("Answer every statement to finish. Still open: 5 and 12.") and moves to the first one. A fresh answer then advances to the next open statement, so the gaps are walked in order. "See my results" re-checks and latches against double taps.
- Aceternity: Background Lines on the "All done!" finish screen (implemented, `components/aceternity/background-lines.tsx`). Palette streaks burst out from behind the message. It follows the site theme, using tokens that are dark shades on light and pastels on dark.
  - **Motion:** a pure-CSS `animate-line-streak` keyframe with seeded per-path duration and delay (`lib/seeded-random.ts`), no framer and no `Math.random`.
  - **Burst on arrival:** the first 21 streaks launch together the moment the screen appears and ease out fast; the second 21 trickle in over the next ~10s. All 42 run on every screen size.
  - **Coverage:** the center is masked clear only right behind the text (smaller mask on phones).
  - **Reduced motion:** a faint static burst. The demo's gradient heading was not used (banned).
- Rapid-answer guard (implemented, `hooks/use-rapid-answer-guard.ts` + `components/journey/rapid-answer-warnings.tsx`): a first answer given under 1s after a statement appears is a strike. Changed answers (e.g. after Back) never count. Strikes 1 and 2 show a non-blocking sonner toast; strike 3 opens a blocking AlertDialog ("I'll Answer Carefully" or Escape resets the count). Both use the always-dark `notice-*` surface tokens with brand-blue accents in either theme, the only deliberate exception to theme-following surfaces.
- Aceternity: BackgroundGradient (`components/aceternity/background-gradient.tsx`, implemented) wraps each Yes/No `RadioCard`. Pure-CSS adaptation, no `motion` package: palette `bg-answer-gradient` 3px border, with a blurred glow and a pan animation that run only while a card is hovered, keyboard-focused, or selected (the animation stays attached but paused, so it resumes instead of snapping). `motion-safe` only. The selected card also gets an opaque `bg-accent` fill and a check mark, so selection never relies on glow alone. The question area's x-clip is widened 40px so the glow isn't cut off.
- **Answer card glow:** two gradients, deliberately not one. `bg-answer-gradient` (radial, fading to `transparent` at three anchors) draws the 3px border; `bg-answer-glow` (linear, fully opaque stops) draws the bloom. Blurring the radial one gave a lopsided halo, bright at the bottom-left corner and cut off at the right. The glow sits at `-inset-1` under `blur-2xl` so it reads as light, not as a soft-edged slab tracing the card.
- shadcn: RadioGroup/RadioCard as the Yes/No pair, ghost Button "Back", Alert Dialog (exit).
- Quiz flow rules (hardened):
  - **Advancing:** a new answer auto-advances after 280ms. A statement that already has an answer (after Back, or after the rapid-answer pause) shows an outline "Next" button ("Finish" on the last). Re-tapping or pressing Space on the chosen card also advances.
  - **Input guard:** taps in the first 350ms after a statement appears are ignored.
  - **Keyboard:** Y/N answer from anywhere, except when a field is focused or a dialog is open. Arrow keys move the selection without committing.
  - **Focus:** moves to each new statement heading, which also names the answer group; on the finish view it moves to its heading.
  - **Resume:** reopening a fully answered quiz lands on the finish view, which has "Review my answers".
  - **Rapid-answer pause:** stays on the current statement instead of advancing behind the modal.
  - **Answer card states:** rest is a white card inside the gradient frame. Hover and focus-visible are the same treatment — a 15% `currentColor` wash plus a 2px full-strength `currentColor` outline (the shared `border-current` for a bordered RadioCard; an `inset-ring` on the answer cards, which drop their border for the frame) — and focus-visible adds the offset `ring` on top, so tabbing is never the quieter path. Selected is the opaque `bg-accent` fill with a check mark and no outline, so hover reads as *outlined* and selected as *filled*: the two can never be confused, and the distinction is shape, not just colour. Hover also lifts the whole `BackgroundGradient` container by 2px under `motion-safe:`; the lift rides the container so the frame, glow and card travel as one. Press (`active:`) deepens the wash to 25%, because touch has no hover.
  - All of the above is scoped with `data-unchecked:` (Base UI sets it whenever a radio is not checked), so the hover styles can never fight the checked styles for specificity and the chosen card stops offering itself.
  - **Never tint a control with `bg-current/<n>`.** `background-color` is a single slot, so a translucent colour there replaces the card's opaque background instead of layering on it, and the blurred palette glow behind the answer cards then shows straight through a hovered card and turns it green. Use the `control-wash` / `control-wash-strong` utilities, which paint a `currentColor` gradient *image* over the background colour.
- framer-motion `AnimatePresence` for the question slide.

**Results (`/results`)** (implemented)
- **Greeting:** the page opens with the student's nickname ("Here are your results, MARI-EL"), and that line is the page's only h1; every bento cell, the Holland Code card included, is an h2 beneath it. The nickname is read from the persisted store behind `useHydrated()` and falls back to the greeting alone, never a dangling comma, for an empty nickname. `JourneyGuard` already withholds the whole dashboard until persist rehydration finishes, so nothing here reaches the server render.
- Aceternity: Bento Grid (`components/aceternity/bento-grid.tsx`). Holland Code (2 cols), radar (2 rows), top-three trait bars, one card per code letter (full-width row of three, `components/riasec/pathway-results.tsx`), insight + keepsake actions (full width). Letter cards show the official sheet's description, every college major, and every related pathway (`lib/riasec/career-pathways.ts`) as equal-weight tags in sheet order. Silent sorting: no match labels, badges, rankings, or percentages anywhere in them. Single column on mobile and in print. Each cell uses the Aceternity Glowing Effect frame (`components/aceternity/glowing-effect.tsx`): an outer bordered ring whose 3px border lights up in a palette arc (deep blue, brand blue, sage, cream tones via stage tokens) that follows the pointer within 64px, around the inner card. It runs on framer-motion's `animate`, with the previous tween stopped before a new one starts. Under reduced motion the arc jumps instead of sweeping. The frame and glow disappear in print.
- shadcn: Chart (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`) with Recharts `RadarChart`, Progress, Button, Dialog (email), Alert Dialog (retake).
- Magic UI: Blur Fade (staggered viewport entry), Number Ticker (trait scores), Hexagon Pattern (Holland Code cell texture).

**Profile Setup (`/assessment/profile`)**
- Magic UI: Hexagon Pattern, static grid with three glowing yellow cells (implemented).

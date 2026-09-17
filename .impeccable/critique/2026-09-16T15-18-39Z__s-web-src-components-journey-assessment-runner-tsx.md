---
target: apps/web/src/components/journey/assessment-runner.tsx
total_score: 19
p0_count: 1
p1_count: 3
timestamp: 2026-09-16T15-18-39Z
slug: s-web-src-components-journey-assessment-runner-tsx
---
Method: dual-agent (A: design review · B: detector evidence). Browser visualization unavailable in both (Playwright MCP not connected).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | 4 competing progress readouts; re-tapping the current answer gives no feedback |
| 2 | Match System / Real World | 3 | "Holland Code" unexplained; 👎 on self-statements reads as self-criticism |
| 3 | User Control and Freedom | 1 | After Back you cannot move forward without changing your answer (P0) |
| 4 | Consistency and Standards | 2 | Title Case modal vs sentence case; always-dark notice in light theme; Poppins on controls |
| 5 | Error Prevention | 2 | Double-tap during advance lands on the next question's card |
| 6 | Recognition Rather Than Recall | 3 | One statement per screen; no return-to-question-N after Back |
| 7 | Flexibility and Efficiency | 2 | No Y/N keys; arrow keys commit and advance |
| 8 | Aesthetic and Minimalist Design | 2 | Gradient/glow/pan on a binary choice, looping hex glow, endless streaks |
| 9 | Error Recovery | 1 | Stuck state has no message; resuming a fully answered quiz is a dead end |
| 10 | Help and Documentation | 1 | No "no right or wrong answers" framing |
| **Total** | | **19/40** | **Poor** |

## Anti-Patterns Verdict

LLM: partially AI-made. The core quiz is clean. Stacked vendored effects read as template: multicolor panning gradient borders on unselected Yes/No cards, looping glowing hex background, stock party-popper finish over 42 looping streaks. No absolute bans; breaks product-register rules (decorative motion, Poppins on buttons/labels, saturated gradient on inactive state).

Deterministic scan: 0 findings (exit 0) in assessment-runner.tsx and the 8 composed files, also with --no-config. Probe: detector parses .tsx and catches gradient text and side-tab borders, but missed an uppercase tracked eyebrow. Clean result is reliable only for those two rules; it cannot see runtime cn() classes, contrast, layout, or motion. No overlay (no browser).

## Priority Issues

1. [P0] Stuck after Back / after resume. Base UI RadioGroup fires onValueChange only via the native input change event; an already-checked radio fires none (RadioRoot.js onChange). Revisited statements: tapping the existing answer does nothing, no Next button. Reloading with all 42 answered resumes at q42 (firstUnanswered fallback) with no route to the finish screen. Fix: advance on click of the already-selected card; show "Continue" on answered statements; route allAnswered straight to finish. Command: harden.
2. [P1] Rapid-answer guard punishes decisive/clumsy students. Flat 2s threshold vs 3-word statements, slide time included; strikes never decay; double-tap on slow phones = strike; advance timer not cancelled when blocked (question changes behind modal; on q42 the modal unmounts); toast says "a few" after one strike; modal wording and forced promise button feel accusatory. Fix: word-count threshold, sliding window, ~350ms input guard on mount, cancel advance on block, gentle inline pause copy in sentence case. Command: clarify then harden.
3. [P1] Screen reader / keyboard flow broken. Focused radio unmounts each advance (focus to body), statement not associated with the radiogroup, live region announces only "Question N of 42", arrow keys commit answers, sr-only home link bypasses exit guard, focus ring ~2.2:1. Fix: aria-labelledby statement, move focus to heading/group after advance, Y/N keys, remove sr-only link, solid ring with offset. Command: audit then harden.
4. [P1] Shared classroom phones resume another student's quiz with an anonymous "Welcome back!" and no reset. Fix: "Welcome back, NICKNAME. Not you? Start fresh" with confirm. Command: onboard.
5. [P2] Decorative motion heavy for budget phones and off-register. Blurred panning gradient runs indefinitely on revisited/resumed (selected) questions; 42 finish paths animate forever; hex SVG blur filter loops; gauge transition 1s; Poppins on controls. Fix: plain token border at rest, strong border+fill+check when selected; one non-looping finish moment; Nunito Sans on controls. Command: quieter then distill.

## Persona Red Flags

- Casey (one thumb, slow phone): double-tap mis-answers next question + strike; returns after finishing and is stuck on q42; Back 36px and exit X 32px tall; toast covers progress card.
- Sam (screen reader/keyboard): focus lost every answer and on finish; hears "Question 5 of 42" but not the statement; arrow keys commit; hidden home link tab stop; at 200% zoom cards ~70px wide and pushed below fold.
- Jordan (first-timer): no "is this like you?" framing; conflicting progress numbers; taps chosen answer to continue and nothing happens; "Holland Code" and "too quickly" undefined.
- Grade 9 student, ₱6,000 Android, classroom: inherits classmate's progress; racing classmates triggers public-feeling modal; jank/battery from blur glow, filter loop, endless streaks; dark modal flashes in light theme.

## Minor Observations

- Welcome-back banner shifts layout and reappears on return to that question.
- Selected vs unselected card fill only 1.33:1; the 20px check carries the state.
- Always-dark notice surface breaks one-accent-per-screen.
- DESIGN.md drift: Tooltip on Back and hex background on finish screen are documented but not implemented.
- Raw source punctuation in statements: "organize things, (files, desks/offices)", "(problems/ situations)".
- No Back on finish screen to change the last answer.
- "Step 2 of 3" in bold Poppins acts as an eyebrow among three other counters.
- Gauge moves ~2% per answer; weak motivator versus "10 of 42".
- Forced-promise button copy "I'll Answer Carefully" is manipulative for a minor.

## Questions to Consider

- If a student sure they like to draw cannot answer honestly in under 2 seconds without a warning, is the guard measuring honesty or reading speed?
- What state does a panning multicolor glowing border on a Yes/No card convey that a 2px strong-blue border would not?
- The finish screen is the moment students remember. Why a party popper and a button instead of the first letter of their code?

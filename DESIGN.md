# Design

<!-- impeccable:design-schema 1 -->

## Direction contract

**THESIS.** A practice chart, not a habit app. This surface owns the idea that a
count against a target, repeated across nested cadences, is a discipline you
accumulate — so it refuses the category's card-grid-of-pastel-streaks and its
predictable opposite, the thin grey monochrome tracker.

**OWN-WORLD.** Plate-ink ground (deep blue-black, or slate in light mode — never
cream, never paper). Vermilion is the editorial mark a teacher leaves in a margin:
it means *in progress, attend to this*. Brass means a target reached. Ultramarine
means you went past it. Tabular numerals are the display element; there is no
decorative face. Rules and bar lines separate periods; ink weight, not boxes,
carries structure. Recognizable with all content removed by: the hairline-and-bar
grid, the three-colour semantic ramp, and rings drawn as engraved dials.

**STORY.** The user sees what today still asks of them, records it in one tap, and
can follow the same measure outward to the week, month and year without learning a
second mental model.

**FIRST VIEWPORT.** A tempo line naming the date and the day's completion at the
top-left, set in tabular figures at display scale. Beneath it, goals grouped by
category, each category introduced by a rule and a name, each goal a ring at 64px
(96px from `sm` up) with its count inside and its task name beneath. The primary
action is the ring itself — no separate button. Cadence switcher sits bottom, in
thumb reach.

**FORM.** Practice Chart. Candidate 5 of the ordered grounded list, assigned by
seed key `b9ab9dad` (direction scope, operate mode). No dealt challenger survived
weighing; none is staged.

## Platform

web — React 19, MUI 7, Redux Toolkit, Vite, installable PWA

## Color

Strategy: **Committed.** Ink owns the ground at page scale; one saturated colour
(vermilion) carries state across the whole surface, with brass and ultramarine as
the two other semantic stops.

Both themes are authored, not derived. Dark is the default: the heaviest session is
the evening catch-up, in bed, at low light. Light exists for the gym and for desktop
review in daylight.

| Role | Dark | Light | Means |
|---|---|---|---|
| `ground` | `#0D1117` | `#E8E6E1` | the page |
| `surface` | `#151B24` | `#F4F2EE` | grouped regions |
| `surfaceRaised` | `#1D2530` | `#FFFFFF` | dialogs, sheets |
| `rule` | `#2A3441` | `#C9C5BC` | bar lines, hairlines |
| `ink` | `#EDEFF2` | `#16191E` | primary text |
| `inkMuted` | `#96A1B0` | `#5A6270` | secondary text |
| `vermilion` | `#E8503F` | `#C33A2A` | in progress |
| `brass` | `#D2A03C` | `#9A6F1C` | target reached |
| `ultramarine` | `#5B84E8` | `#2D53B8` | past target |
| `empty` | `#4A5566` | `#98948A` | nothing recorded |

Secondary text is tinted from the ground's hue, never neutral grey. Text pairings
clear 4.5:1 for body and 3:1 for large text in their own mode.

`empty` is the exception worth naming: it is a non-text hairline carrying the
"nothing recorded" state, and it sits around 2.2:1 against the ground by design —
an empty dial should recede. It is never the sole carrier of that state, because
the count at the centre reads `0` and the accessible name says so.

## Type

System stack only — no webfont. Speed to first tap is a product principle and the
old build spent its first paint on fourteen unused Google families.

```
--font-ui:  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
--font-num: ui-monospace, "SF Mono", Menlo, Consolas, monospace
--font-mark: Georgia, "Times New Roman", serif   /* italic, dynamic marks only */
```

`--font-mark` exists for exactly one thing: the italic `f` / `ff` / `fff` on a
ring that has passed its target. Dynamics are set in an italic serif in every
printed score, and the system stacks have no italic that reads as one. It is not
available to any other element.

Numerals are the display element and always set `font-variant-numeric: tabular-nums`
so counts do not jitter as they increment. Monospace is used only for measurement —
counts, targets, dates, tempo marks — never as a costume for section labels.

Scale: 3rem / 2rem / 1.375rem / 1rem / 0.8125rem / 0.6875rem. Tracking floor
-0.03em on display sizes; positive tracking (0.08em) only on the small caps used for
tempo marks and category rules.

## The stave

Week, Month and Year lay goals down the page and periods across it, grouped by
category under the same rule-and-name grammar Today uses. Every row ends with its
own hit count the way a practice chart carries a total per line, so "did this hold
this week" is read rather than counted.

It is a **reading surface, not an entry surface**: cells are far below a 44px
touch target, so recording stays on Today and the row label opens the goal.

Year cannot lay out a year of days — that would be thousands of rows for one
screen. It lays out months instead, against a server-side goal × month rollup.

## Structure

- **Rules, not cards.** A category is introduced by a rule and a name, not
  wrapped in a container. No nested containers anywhere.
- **Ink weight is the hierarchy**, and there are exactly two weights:
  - **2px** — a section or category rule. On Today this rule doubles as the
    category's progress, filling from the left as goals are completed.
  - **1px** — a hairline: sub-groups inside the stave, the target reference in a
    chart, the ring track, and every bar line.
- **Bar lines** are the 1px vertical rules opening each new bar across the stave:
  every Monday in a month of days, every quarter in a year of months. Same `rule`
  colour as the horizontal rules — one grammar, two axes.
- **Fields are ruled, not boxed.** Inputs carry a bottom rule that goes vermilion
  on focus, with a small-caps tempo-mark label. There are no outlined boxes.
- **Spacing scale** 4 / 8 / 12 / 16 / 24 / 32 / 48. More space above a heading than
  below it, always.
- Touch targets never below 44px. The ring is 64px on a phone — four across a
  390px screen, so a full category is visible without scrolling — and 96px from
  `sm` up. Text inside the ring is sized from the ring but floored, so shrinking
  the dial never takes the count or the `/target` below legibility.
- **Rings wrap centred, not into a grid.** Each row centres on the page
  independently, so a category of six shows a row of four above a row of two
  sitting under its middle. The offset that produces is the point: rows stagger
  against each other and the column of dials reads as one centred object rather
  than a left-aligned table. This is the v1 layout, restored deliberately — a
  CSS grid packs short rows to the left, which reads as a ragged edge.

## The ring

The signature interaction and a binding brand commitment.

- Engraved dial: a hairline track in `empty`, a progress arc, a count in tabular
  figures at the centre, task name beneath.
- **Arc colour is the state**, and state is never carried by colour alone — the
  centre always shows `achieved` and the ring carries an accessible label naming
  count, target and state.
- `partial` → vermilion. `complete` (achieved ≥ target) → brass, and the track
  closes to a full circle. `over` → ultramarine, only for goals whose tracking mode
  is `more-is-better`.

**In the stave**, the same three states are carried by *fill height* as well as
colour — a partial period is a short block, a complete one fills the cell, and an
overshoot adds a tick at the top. Red and gold are a common confusion pair and a
flat fill would have left them as the only distinction.
- **Laps.** A `more-is-better` goal that passes its target starts a second arc
  inside the first, and picks up a dynamic mark — `f` at 2×, `ff` at 3×, `fff` at
  4× and beyond. A `target` goal simply reads complete and never laps; overshoot is
  not an achievement it claims.
- Tap increments. Every other action (decrement, note, edit, history) lives in the
  goal's detail sheet, reachable by long-press **and** by keyboard (Enter opens the
  sheet, Space increments) so the gesture is never the only route.
- **The gesture is built on Pointer Events**, not on touch and mouse handlers
  side by side. Listening to both double-counts every tap on a phone, because the
  browser synthesises a compatibility mouse pair after `touchend`.

## Motion

One authored moment: **the cadence**. When a ring reaches its target the arc closes
and settles — a 420ms exponential ease-out on the arc, with the centre figure
scaling 1 → 1.12 → 1 and the colour crossing vermilion to brass. Nothing else in the
app animates on entrance. `prefers-reduced-motion` replaces it with an instant
colour change.

Increments below target get a 120ms arc tween only. No confetti, no bounce, no
celebratory overlay — the reward is the record, not the applause.

## States

Every list and view ships: loading (skeleton at the real geometry, never a spinner
over a blank page), empty (what to do next, in the product's language), error (what
failed and how to retry), and offline-degraded (last known values, marked stale).

Optimistic writes roll back visibly on failure and say so — a tap that did not land
must never look like one that did.

## Prohibitions

Checked against this world's own materials, not borrowed from a generic list:

- No gradient text, no glass, no soft-shadowed rounded rectangles standing in for
  content.
- No coloured left-borders above 1px. Rules are the structural device and they are
  hairlines.
- No emoji, no flame icons, no gamified badges. The world's own marks — dynamics,
  bar lines, tempo indications — carry emphasis instead.
- No card containing another card.
- No notation device that needs explaining. A dynamic mark reads as intensity to
  someone who has never touched a score; a fermata or a segno does not, and does
  not ship.

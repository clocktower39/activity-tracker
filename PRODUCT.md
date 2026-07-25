# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A small group of committed individuals tracking personal habits, with one primary
user who has logged daily activity continuously since July 2021 (20 active goals,
~20k recorded periods). Two other real people keep their own independent goal sets,
plus a shared demo account used to show the app to newcomers.

Every user owns their data outright — there is no social layer, no comparison
between accounts, and no sharing. The account boundary is absolute.

## Product Purpose

Record what you actually did, one tap at a time, and see whether the pattern holds
over days, weeks, months and years.

Success is the primary user still logging five years from now. That makes
uninterrupted daily continuity the thing the product protects above all: a session
that is slow, that loses a tap, or that makes the user think before recording is a
direct threat to the streak the product exists to accumulate.

## Positioning

Most habit trackers are binary — did you do it or not. This one tracks *quantity
against a target per period*, so "run 3 times this week" and "drink 8 glasses
today" and "read 12 books this year" are the same primitive at different cadences.
The single tap-to-increment gesture works identically across all four.

## Operating Context

The product is used in four distinct moments, all of which matter:

1. **In the moment** — tapping a goal as it happens, often one-handed on a phone,
   app opened for two seconds. Launch-to-tap speed dominates.
2. **Evening catch-up** — sitting down to tick off the day in bulk. Throughput of
   many taps in sequence dominates.
3. **Review** — looking back across weeks, months or years to see whether the
   pattern held. Legibility of trend and streak dominates.
4. **Planning** — adding, editing, retargeting and reordering goals as priorities
   shift. This is infrequent but must not be buried.

Installed as a PWA on mobile and used offline-adjacent (poor signal, not full
offline). Also used on desktop during review sessions.

## Capabilities and Constraints

- **Goals** carry a task name, a category, a target quantity, a cadence, and a
  display order. They can be hidden without being deleted.
- **Cadence** is one of daily, weekly, monthly, yearly, or none (unscheduled).
  Only daily and none carry historical data today; the other three are the
  explicit reason for this rebuild.
- **Tracking mode is per goal.** Some goals are "hit the target and stop" (take
  medication); others are "more is better" and overshooting is a real achievement
  worth showing distinctly (push-ups). Each goal declares which.
- **Progress is a count against a target for the period**, not a boolean.
- **Categories** are a per-account ordered list; goals reference them by name.
- **Periods are computed in UTC**, weeks are ISO weeks starting Monday. Client and
  server must agree exactly or progress lands in the wrong bucket.
- History rows are created only when progress is recorded. A missing row means
  zero, never "not loaded".
- Stack is fixed: MongoDB, Express, React 19, Node. MUI 7 and Redux Toolkit on the
  client.
- Runs locally against MongoDB Atlas; no deployment target chosen yet.

## Brand Commitments

- Name: **Activity Tracker**.
- **The circular tap-to-complete ring is the signature interaction** and is
  binding. It stays the primary way to record daily progress. Other cadences may
  use a different representation where a ring genuinely does not fit.

## Evidence on Hand

- Five years of real history: 36,557 period records across 87 goals and 4 accounts,
  spanning 2021-07-05 to 2026-06-10. All of it is preserved.
- Roughly 75% of those rows are empty placeholders created by a defect in the old
  read path; they carry no information and are not evidence of activity.
- No testimonials, press, customers, pricing, or usage claims exist. None may be
  invented.
- Icons exist at `activity-client/public/favicon*.png`. There is no logo, no
  wordmark, and no brand palette.

## Product Principles

1. **Never lose a tap.** Every recorded action survives network failure, double
   submission and concurrent writes. Optimistic UI must roll back visibly on
   failure rather than silently diverge.
2. **Load what is on screen, nothing more.** Data volume grows without bound over
   years; the interface must not.
3. **One gesture, four cadences.** The same increment primitive spans daily
   through yearly. Do not invent a second mental model per view.
4. **Continuity is the reward.** Streaks, history and long-run pattern are what a
   five-year user has earned; surface them rather than only today's state.
5. **Planning is rare but not secondary.** Editing goals is infrequent and must
   still be reachable, forgiving, and undoable.

## Accessibility & Inclusion

- The signature interaction is a long-press, which has no keyboard equivalent
  today. Every action reachable by long-press must also be reachable by keyboard
  and by assistive technology.
- Ring progress is currently communicated by colour alone; state must also be
  carried by text or shape.
- Primary use is one-handed on a phone: touch targets must clear 44px and the
  main controls must sit within thumb reach.

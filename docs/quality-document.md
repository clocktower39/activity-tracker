# Quality document

Per-module health snapshot. Read at the start of a session to find the weakest area; update at the end of a session. Compare snapshots over time to tell whether the harness is making the codebase stronger or weaker.

Grades: **A** (verifiable, agent-legible, stable, conformant), **B** (minor gaps), **C** (real defects / verification holes), **D** (broken or unverifiable).

## Product domains

| Domain                | Grade | Verification | Agent legibility | Stability | Notable gaps                                                       |
|-----------------------|-------|--------------|------------------|-----------|--------------------------------------------------------------------|
| Auth / sessions       | B     | Manual curl  | Medium           | Stable    | F02 token-lifetime typo; demo guard is incomplete                  |
| Goals CRUD            | B     | Curl + UI    | High             | Stable    | `Goal.history` legacy field still in schema (F07)                  |
| History (progress)    | B     | Curl + UI    | High             | Stable    | Period math duplicated client/server (F10/F11)                     |
| Categories            | C     | UI only      | Medium           | Stable    | Field named `account` not `accountId` (F05)                        |
| Notifications / PWA   | C     | Manual       | High             | Flaky     | iOS/Firefox caveats in code; no end-to-end push test               |
| Charts (Metrics)      | B     | UI only      | Medium           | Stable    | Period-fill logic is bespoke; no tests                             |
| Streaks               | D     | None         | n/a              | n/a       | Promised in README, not implemented (F13)                          |

## Architectural layers

| Layer              | Grade | Boundary enforcement | Agent legibility | Notes                                              |
|--------------------|-------|----------------------|------------------|----------------------------------------------------|
| API routes         | B     | All gated by `verifyAccessToken` | High     | Public route list documented in `AGENTS.md` §3     |
| API controllers    | B     | accountId from `res.locals.user` | Medium   | Some promise/callback mixing in `userController`   |
| Mongoose models    | C     | Indexes declared; uniqueness on `GoalHistory` | High | `Category.account` vs `accountId` inconsistency     |
| Redux store        | B     | Single store, thunk only | High     | Date-keyed cache is correct but undocumented        |
| Routing (client)   | B     | `AuthRoute` wraps private paths | High     | Hard-coded `basename="/activity-tracker/"`          |
| Theme / styling    | A     | None needed           | High             | Two themes, no other variants                       |

## How to use this

- **Before a session:** read the lowest-grade row. The next feature should attack one of its gaps.
- **After a session:** update the row that changed. Add a one-line note.
- **Harness simplification:** if a row's grade has been A for four consecutive sessions, the harness rules that protect it are probably overhead. Consider removing them.

## Snapshots

| Date       | Worst domain | Worst layer | Notes |
|------------|--------------|-------------|-------|
| 2026-06-09 | Streaks (D)  | Models (C)  | Initial snapshot taken from `ARCHITECTURE.md` §8 |

# AGENTS.md — Entry file for any AI coding agent

> Read this first, every session. If you only have time to read one file, read this one. Topic-specific docs are linked below; load them on demand.

## 1. What this project is

A MERN-stack personal activity / habit tracker. Two packages:

- `activity-server/` — Node 20+ / Express 5 / Mongoose 9 API on port 8000. Entry
  point is `server.js`; all code lives under `src/`. Routes are under `/api`.
  JWT auth (access 180 m, refresh 90 d, rotating). MongoDB via `DBURL` in `.env`.
- `activity-client/` — React 19 + Vite 7 + Redux Toolkit 2 + MUI 7 PWA. Serves
  from the `/activity-tracker/` base path and reads the API URL from
  `VITE_API_URL`.

Read `ARCHITECTURE.md` for the module map, the API table, and the data-loading
contract — **especially §3, which explains the defect this codebase was rebuilt
to fix.** Read `PRODUCT.md` before changing behaviour and `DESIGN.md` before
changing anything visual.

## 2. Clock-in / clock-out (every session, no exceptions)

**Clock in**

1. Read `docs/PROGRESS.md` for current state and "Next best action."
2. Read `docs/feature_list.json`. Exactly one entry should be `in_progress`. If zero or more than one, stop and reconcile.
3. Run `bash docs/init.sh` from the repo root. It installs deps and runs the basic verification. If it fails, stop and fix the baseline before any feature work.
4. If `docs/PROGRESS.md` is missing or stale, treat the repo as drifted and follow §6.

**Clock out (end of every session)**

1. Update `docs/PROGRESS.md` with goal, completed, verification run, commits, known risks, next best action.
2. Update `docs/feature_list.json` (move the active entry to `passing` only after verification passed, or to `blocked` with a note).
3. Run `docs/clean-state-checklist.md` — all five conditions must hold.
4. Commit the progress + feature-list changes as a separate, atomic commit ("chore(progress): close session N").

If you cannot complete the checklist, do **not** commit feature code. Either finish the cleanup or revert the feature work to the previous clean commit.

## 3. Hard constraints (MUST / MUST NOT)

These are non-negotiable. If a task appears to require breaking one, stop and ask the user.

- **MUST NOT** write on a read path. `GET` handlers never create, update or
  upsert a `GoalHistory` row. The previous version upserted a placeholder for
  every goal on every page view and grew 27k empty documents doing it. A missing
  row means zero, not "not loaded".
- **MUST** bound every history query by an indexed period range, and aggregate
  rollups in MongoDB rather than shipping rows to the browser. An endpoint whose
  response grows with the account's lifetime is a bug, however fast it is today.
- **MUST** use `$inc` for progress increments, never read-modify-write. Two taps
  in quick succession must both land.
- **MUST** keep UTC for every period calculation, with ISO weeks starting Monday.
  `activity-server/src/lib/periods.js` and `activity-client/src/lib/periods.js`
  are mirrors — change both or neither.
- **MUST** gate every authenticated endpoint with `requireAuth`. Public
  endpoints: `POST /api/auth/signup`, `/api/auth/login`, `/api/auth/refresh`.
  Nothing else.
- **MUST** keep `GoalHistory` writes idempotent on the unique key `(goalId, interval, periodStart)`. Use `findOneAndUpdate` with `upsert: true` and `$setOnInsert` for default fields.
- **MUST NOT** trust the client `accountId`. It is always derived from `res.locals.user._id` after token verification.
- **MUST NOT** put a document in a JWT payload. Tokens carry identifiers only
  (`sub`, `email`, `tokenVersion`, `type`). The v1 code signed the whole user
  document, which put the bcrypt password hash in every token.
- **MUST NOT** add a `console.log` / `debugger` / commented-out code to a commit. They are removed by `clean-state-checklist.md`.
- **MUST NOT** bundle unrelated changes. One feature = one commit (or one small, related chain). Use `git status` to verify before committing.
- **MUST NOT** commit `.env`, `node_modules/`, `dist/`, or anything containing credentials. The current `activity-server/.env` is committed by mistake (see `SECURITY.md`); do not add more.
- **MUST NOT** introduce a new dependency without first checking whether an existing one in the manifest solves the problem. If a new one is needed, justify it in the commit message and add the entry to `docs/feature_list.json` as a "refactor" prerequisite.
- **MUST NOT** refactor unrelated code while implementing a feature. (WIP=1.) Knuth's "premature optimization" applies; the harness rule applies harder.

## 4. Definition of done (every task)

A task is `passing` only when **all** of the following hold:

1. The code compiles and lints (`yarn lint` for the client; Node starts cleanly for the server).
2. The feature's verification block in `docs/feature_list.json` has been run, and its exit code is recorded in the `evidence` field of the matching entry.
3. A short test (unit, integration, or curl script) lives next to the code and is reproducible from a clean checkout.
4. `docs/PROGRESS.md` has been updated and committed.
5. `docs/clean-state-checklist.md` is fully checked.

"Code looks right" or "the unit tests pass" is **not** done. End-to-end behavior must be verified.

## 5. Working rules (WIP=1, scope discipline)

- **WIP = 1.** Exactly one entry in `feature_list.json` is `in_progress`. If you find yourself starting a second, stop and either finish the first or mark it `blocked`.
- **Scope surface is the file**, not the conversation. The feature list is the source of truth for what's in scope; chat history is not.
- **Refactor only when the active feature requires it**, and only inside the file the feature touches. Larger refactors get their own feature entry first.
- **Failure attribution.** When a feature doesn't pass verification, run a "which layer failed?" check and write it into `evidence`:
  - **spec** — unclear requirement
  - **context** — missing doc, wrong assumption
  - **environment** — deps, Node version, Mongo connection
  - **verification** — no test, wrong test
  - **state** — stale progress file, drift across sessions

## 6. Drift and recovery

If at clock-in you find:

- a build that doesn't start → treat as **environment** failure; fix baseline before anything else.
- a `feature_list.json` with zero or many `in_progress` → reconcile to a single entry; record what you found in `PROGRESS.md`.
- a `PROGRESS.md` older than the last commit → read the diff between the last commit and HEAD, summarize what's actually on disk, and rewrite the file before continuing.
- a `GoalHistory` collection missing the unique index, a `Category.accountId`
  stored as a String, or legacy embedded `Goal.history` arrays → run
  `node activity-server/scripts/maintenance.js` to see a report, then re-run with
  `--apply`. It is idempotent and dry-run by default.

## 7. Topic docs (read on demand)

| When you are…                                    | Read                                            |
|--------------------------------------------------|-------------------------------------------------|
| Touching **any** read path                       | `ARCHITECTURE.md` §3 (Data-loading contract)    |
| Adding a new API endpoint                        | `ARCHITECTURE.md` §4 (API)                      |
| Touching the data model                          | `ARCHITECTURE.md` §5 (Data model)               |
| Working on auth / tokens                         | `ARCHITECTURE.md` §6 (Invariants)               |
| Frontend state                                   | `ARCHITECTURE.md` §7 (Client state)             |
| Changing anything visual                         | `DESIGN.md`                                     |
| Changing product behaviour                       | `PRODUCT.md`                                    |
| Reviewing your own output                        | `docs/evaluator-rubric.md`                      |
| Updating per-module health                       | `docs/quality-document.md`                      |
| Closing a session                                | `docs/clean-state-checklist.md`                 |
| Picking the next thing to work on                | `docs/feature_list.json` + `docs/PROGRESS.md`   |
| Touching environment, secrets, or `Dockerfile`  | `SECURITY.md`                                   |

## 8. Anti-patterns to refuse

- "Add a rule to AGENTS.md because the agent did X wrong once." → write a **test** that fails on X, not a paragraph.
- "Let me also clean up that other file while I'm here." → out of scope. Open a new feature entry.
- "I refactored 12 files to make this work." → almost certainly overreach. Roll back, find the minimal change, write a refactor entry for the rest.
- "I think this works." → run the verification, paste the output into `evidence`.
- "I'll just print the user object for debugging." → use a structured log, or don't log it at all.

## 9. Reference

- Learn Harness Engineering curriculum: <https://walkinglabs.github.io/learn-harness-engineering/en/>
- Lecture this file is shaped by: Lecture 02 (five subsystems), Lecture 03 (repo is the system of record), Lecture 06 (initialization is its own phase), Lecture 07 (WIP=1), Lecture 08 (feature list as primitive), Lecture 09 (don't declare victory), Lecture 12 (clean handoff).

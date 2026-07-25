# PROGRESS.md

> Session log. Read this at the start of every session. Update it at the end.
> When the log drifts from the code, the log is wrong; rewrite the log.

## Current verified state

- **Repository root directory:** `/home/matt/Programming/Projects/activity-tracker`
- **Standard startup path:**
  - Server: `cd activity-server && yarn dev` (port 8000)
  - Client: `cd activity-client && yarn dev` (port 5173, app at `/activity-tracker/`)
- **Standard verification path:**
  - Server: `cd activity-server && yarn verify` (22 end-to-end assertions against a running server)
  - Client: `cd activity-client && yarn lint && yarn build`
  - Data: `node activity-server/scripts/maintenance.js` (dry-run report, changes nothing)
- **Highest priority unfinished feature:** F01 — rotate leaked secrets and remove `.env` from history (see `feature_list.json`)
- **Current blocker:** user approval needed for `git filter-repo` (or equivalent) rewrite of history. The secrets in `activity-server/.env` are 19–20 characters where 32+ is required; `src/config/env.js` warns in development and refuses to start in production.

## Session record

### Session 1 — 2026-07-24 (v2 rebuild)

- **Goal:** Fix the app up — keep the MongoDB data, fix the data-loading problem, add weekly/monthly/yearly cadences, redesign the UI.
- **Root cause found:** `POST /` returned every goal with its entire history — 19,890 documents and 5.53 MB for the primary account, on every page load and again on every date change. It also ran a `bulkWrite` on that read path which upserted a placeholder row per goal, so 27,399 of 36,557 history rows were empty rows created by merely *looking* at a date.
- **Completed:**
  - Server rebuilt under `src/`, API under `/api`. Bootstrap (3.6 KB) is separate from history; history is fetched per visible window; week/month/year roll up via `$dateTrunc`. No write on any read path.
  - Progress writes are atomic `$inc` — concurrent taps no longer overwrite each other.
  - Security: JWTs no longer carry the user document (they contained the bcrypt password hash); `update_user` mass assignment removed; signup fixed (it used a Mongoose callback removed in v7 and threw on every call); CORS allow-listed; auth routes rate-limited; refresh tokens rotate; password change bumps `tokenVersion`.
  - Client rebuilt on Redux Toolkit with a period cache keyed by `(goalId, interval, periodKey)`, containment-checked range fetches, and optimistic writes that roll back visibly on failure.
  - New visual world recorded in `DESIGN.md`; `PRODUCT.md` captures the product truth behind it.
  - Weekly / monthly / yearly views, per-goal tracking mode, streaks.
- **Data bugs found and fixed in the DB:** `categories.accountId` was stored as a String while `goals.accountId` is an ObjectId, because the v1 schema declared the field as `account` and Mongoose never cast it — category lookups had silently returned nothing for every account, for years. Emails normalised to lowercase; demo account flagged via `isDemo`; legacy embedded `Goal.history` folded into `GoalHistory` (summing period collisions rather than dropping them).
- **Verification run:** `yarn verify` 22/22 passing; `yarn lint` clean; `yarn build` clean; impeccable design detector returns `[]`. All views inspected in a real browser at 390 px and 1280 px in both themes, no console errors.
- **Commits:** none yet — changes are staged in the working tree for review.
- **Known risks:**
  - 27,399 placeholder rows remain (inert). Removing them needs `maintenance.js --apply --purge-empty`, which is destructive and was deliberately left for the user to decide.
  - No unit-test harness on either side (F10, F11). `scripts/verify-api.js` covers the API end to end but nothing covers the client cache logic.
  - v1 notifications were removed rather than ported — they were a live-tab `setTimeout` with no push subscription and never fired with the app closed.
- **Next best action:** F01 (rotate secrets), then F11 (Vitest) so `features/history/historySlice.js` has regression cover.

### Session 0 — 2026-06-09 (init)
- **Goal:** Establish harness scaffolding (Lecture 02 / 03 / 04 / 06 / 07 / 08 / 12). No code changes.
- **Completed:**
  - `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `SECURITY.md` written.
  - `docs/feature_list.json` seeded with 14 entries (1 passing, 1 in-progress, 12 not-started).
  - `docs/init.sh`, `docs/clean-state-checklist.md`, `docs/evaluator-rubric.md`, `docs/quality-document.md` created.
  - Per-package READMEs refreshed.
- **Verification run:** static — file existence, `node -e "require('./activity-server/app.js')"` (loads module graph), `yarn lint` (client). Pass.
- **Evidence recorded:** see F00 in `feature_list.json`.
- **Commits:** none (repo currently has no `main` / no git history at this directory level — `activity-server/.git` and `activity-tracker-app/.git` are submodules). Recommendation: initialise a top-level git repo and add the two subpackages as subtrees or convert the layout to a single monorepo. Tracked in `feature_list.json` as a follow-up.
- **Known risks:**
  - `activity-server/.env` is committed; assumed to contain real credentials. **Do not push** until rotated.
  - Two sub-repos with their own `.git` mean version control tooling (and the agent) cannot reason about the project as one. This must be fixed before any cross-cutting refactor.
  - `yarn.lock` and `package-lock.json` are absent at the top level; whichever package manager wins needs to be decided.
- **Next best action:** decide on monorepo structure (npm workspaces vs. yarn workspaces vs. git subtrees), then address F01 / F02 / F04 in that order. F02 and F04 are the smallest, lowest-risk code changes that prove the new harness.

(Append a new section per session using the same template. Trim older sessions once the entry's `passing` evidence is older than two weeks.)

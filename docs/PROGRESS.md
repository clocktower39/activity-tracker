# PROGRESS.md

> Session log. Read this at the start of every session. Update it at the end.
> When the log drifts from the code, the log is wrong; rewrite the log.

## Current verified state

- **Repository root directory:** `/home/matt/Programming/Projects/activity-tracker`
- **Standard startup path:**
  - Server: `cd activity-server && yarn dev` (port 8000)
  - Client: `cd activity-tracker-app && yarn dev` (Vite default port)
- **Standard verification path:**
  - Server: `cd activity-server && node -e "require('./app.js')"` (must not throw on `mongoose.connect`)
  - Client: `cd activity-tracker-app && yarn lint`
- **Highest priority unfinished feature:** F01 — rotate leaked secrets and remove `.env` from history (see `feature_list.json`)
- **Current blocker:** user approval needed for `git filter-repo` (or equivalent) rewrite of history. Until then, F01 stays `in_progress` and other features can be picked up in parallel only if they do not require touching `activity-server/.env`.

## Session record

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

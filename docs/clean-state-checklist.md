# Clean-state checklist (run at end of every session)

All five conditions must hold before committing. If any one fails, do not commit feature code — either fix it or revert to the last clean commit.

- [ ] **Build / lint pass.** `cd activity-client && yarn lint && yarn build` exits 0. The server passes its end-to-end check: start it, then `cd activity-server && yarn verify` exits 0.
- [ ] **Tests pass.** When test harnesses exist (F10, F11), the relevant `yarn test` exits 0. When they don't exist, the feature list says so explicitly.
- [ ] **Feature list reflects reality.** The entry that was `in_progress` this session is now `passing` (verification ran and its exit code is in `evidence`) or `blocked` (with a one-line reason in `notes`). No entry is left `in_progress` by mistake.
- [ ] **No stale artifacts.** No `console.log`, `debugger`, commented-out code, or scratch files (`scratch.*`, `tmp/`, `*.bak`) in the diff. `git status` is the ground truth.
- [ ] **Standard startup still works.** `bash docs/init.sh` succeeds, and the printed dev-server commands are what the next session will run. If a step changed, update the script and commit it in the same change.

### Idempotency note
- Removing artifacts is safe to re-run.
- `docs/init.sh` is designed to be safe to re-run; if it isn't, that's a bug — fix the script.

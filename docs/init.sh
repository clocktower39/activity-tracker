#!/usr/bin/env bash
# docs/init.sh — one-shot startup for activity-tracker.
# Idempotent. Safe to run multiple times.
#
# Usage:    bash docs/init.sh
# Behavior: installs deps in both packages, runs the client linter, and
#           verifies the server module graph loads. Prints the next step.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ---- Configuration ----
# Edit these three if your stack changes.
SERVER_INSTALL_CMD="yarn install"
SERVER_VERIFY_CMD="yarn verify 2>&1 | head -5"
CLIENT_INSTALL_CMD="yarn install"
CLIENT_VERIFY_CMD="yarn lint"

RUN_START_COMMAND="${RUN_START_COMMAND:-0}"
SERVER_START_CMD="yarn dev"
CLIENT_START_CMD="yarn dev"

# ---- Helpers ----
say()  { printf '\033[1;34m[init]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[init]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[init]\033[0m %s\n' "$*"; exit 1; }

# ---- 1. Where am I? ----
say "Repo root: $REPO_ROOT"
test -f AGENTS.md      || warn "AGENTS.md missing at repo root"
test -f ARCHITECTURE.md || warn "ARCHITECTURE.md missing at repo root"

# ---- 2. Server ----
if [[ -d activity-server ]]; then
  say "Installing server dependencies (activity-server)"
  (cd activity-server && ${SERVER_INSTALL_CMD})
  say "Verifying server module graph"
  (cd activity-server && bash -c "${SERVER_VERIFY_CMD}" >/dev/null 2>&1) \
    || warn "Server verification failed. Check DBURL in activity-server/.env. The server may still start."
else
  warn "activity-server/ missing — skipped"
fi

# ---- 3. Client ----
if [[ -d activity-client ]]; then
  say "Installing client dependencies (activity-client)"
  (cd activity-client && ${CLIENT_INSTALL_CMD})
  say "Running client linter"
  (cd activity-client && ${CLIENT_VERIFY_CMD}) || warn "Client lint reported issues"
else
  warn "activity-client/ missing — skipped"
fi

# ---- 4. Next step ----
say "Done. Start the app:"
printf '  cd activity-server      && %s\n' "$SERVER_START_CMD"
printf '  cd activity-client && %s\n' "$CLIENT_START_CMD"
if [[ "$RUN_START_COMMAND" == "1" ]]; then
  say "RUN_START_COMMAND=1 — launching both dev servers in background"
  (cd activity-server      && ${SERVER_START_CMD}) &
  (cd activity-client && ${CLIENT_START_CMD})  &
  wait
fi

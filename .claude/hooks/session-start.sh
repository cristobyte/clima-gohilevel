#!/bin/bash
# Provisions the dev environment for Claude Code on the web:
# installs Node deps, then starts Postgres + applies migrations + seeds once.
set -euo pipefail

# Only run in the remote (web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# 1) Install JS dependencies (cached between sessions; install > frozen ci).
# Use the pnpm already on PATH; run non-interactively.
#  - confirmModulesPurge=false: never block on a TTY prompt
#  - minimumReleaseAge=0: this project pins very recent packages (e.g. the
#    latest lucide-react / Next ecosystem) that a strict freshness policy would
#    otherwise reject during a fresh install.
export CI=true
pnpm install --config.confirmModulesPurge=false --config.minimumReleaseAge=0

# 2) Bring up Postgres, run migrations, generate client, seed if empty.
bash scripts/dev-bootstrap.sh

echo "Session environment ready."

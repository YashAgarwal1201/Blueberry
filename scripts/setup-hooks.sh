#!/usr/bin/env bash
# ==============================================================================
# Blueberry Monorepo - Git Hooks Setup Script
# ==============================================================================
# Installs local git hooks into .git/hooks/ to ensure pre-push verification
# matches CI quality gates before code is pushed to GitHub.
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
HOOKS_SOURCE="${REPO_ROOT}/scripts/git-hooks"
HOOKS_TARGET="${REPO_ROOT}/.git/hooks"

echo "🫐 [Blueberry] Setting up git hooks..."

if [ ! -d "${REPO_ROOT}/.git" ]; then
  echo "❌ Error: .git directory not found at ${REPO_ROOT}."
  exit 1
fi

mkdir -p "${HOOKS_TARGET}"

# Install pre-push hook
if [ -f "${HOOKS_SOURCE}/pre-push" ]; then
  cp "${HOOKS_SOURCE}/pre-push" "${HOOKS_TARGET}/pre-push"
  chmod +x "${HOOKS_TARGET}/pre-push"
  chmod +x "${HOOKS_SOURCE}/pre-push"
  echo "✅ Installed pre-push hook -> ${HOOKS_TARGET}/pre-push"
else
  echo "⚠️  Warning: ${HOOKS_SOURCE}/pre-push not found."
fi

# Ensure run-ci-local.sh is executable
if [ -f "${REPO_ROOT}/scripts/run-ci-local.sh" ]; then
  chmod +x "${REPO_ROOT}/scripts/run-ci-local.sh"
  echo "✅ Marked scripts/run-ci-local.sh as executable"
fi

echo "✨ Git hooks setup complete! Local CI pre-push gate is active."

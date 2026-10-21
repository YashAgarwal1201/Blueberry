#!/usr/bin/env bash
# ==============================================================================
# Blueberry Monorepo - Local CI Pipeline Runner
# ==============================================================================
# Mirrors the GitHub Actions CI pipeline locally to validate static types,
# linting, automated unit/integration tests, and production builds across both
# backend and frontend workspaces.
#
# Usage:
#   ./scripts/run-ci-local.sh                # Run full 4-phase validation
#   ./scripts/run-ci-local.sh --skip-build   # Run checks without production builds
#   ./scripts/run-ci-local.sh --backend      # Run backend checks only
#   ./scripts/run-ci-local.sh --frontend     # Run frontend checks only
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"
NC="\033[0m" # No Color

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
START_TIME=$(date +%s)

# CLI Options
RUN_BACKEND=true
RUN_FRONTEND=true
RUN_BUILD=true

for arg in "$@"; do
  case "$arg" in
    --skip-build)
      RUN_BUILD=false
      ;;
    --backend)
      RUN_FRONTEND=false
      ;;
    --frontend)
      RUN_BACKEND=false
      ;;
    --help|-h)
      echo "Usage: $0 [--skip-build] [--backend] [--frontend]"
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg"
      exit 1
      ;;
  esac
done

echo -e "${BOLD}${BLUE}======================================================================${NC}"
echo -e "${BOLD}${BLUE}  🫐 Blueberry Monorepo - Local CI Verification Pipeline             ${NC}"
echo -e "${BOLD}${BLUE}======================================================================${NC}"
echo -e "Repository root: ${CYAN}${REPO_ROOT}${NC}"
echo -e "Scope: Backend=${RUN_BACKEND}, Frontend=${RUN_FRONTEND}, Build=${RUN_BUILD}"
echo ""

step_count=0
step_failed=0

run_step() {
  local title="$1"
  local cmd="$2"
  local cwd="$3"

  step_count=$((step_count + 1))
  echo -e "${BOLD}[Step ${step_count}] ${CYAN}${title}${NC} (in ${cwd})..."
  local step_start
  step_start=$(date +%s)

  if (cd "${REPO_ROOT}/${cwd}" && eval "${cmd}"); then
    local step_end
    step_end=$(date +%s)
    local step_duration=$((step_end - step_start))
    echo -e "${GREEN}✓ Passed:${NC} ${title} (${step_duration}s)\n"
  else
    local step_end
    step_end=$(date +%s)
    local step_duration=$((step_end - step_start))
    echo -e "${RED}✗ Failed:${NC} ${title} (${step_duration}s)\n"
    step_failed=$((step_failed + 1))
    return 1
  fi
}

# ------------------------------------------------------------------------------
# Phase 1: Static Type-Checking
# ------------------------------------------------------------------------------
echo -e "${BOLD}${YELLOW}--- Phase 1: Static Type-Checking ---${NC}"

if [ "$RUN_BACKEND" = true ]; then
  run_step "Backend TypeScript Compilation Check" "npx tsc -p tsconfig.build.json --noEmit" "backend" || exit 1
fi

if [ "$RUN_FRONTEND" = true ]; then
  run_step "Frontend Vue & TypeScript Check" "npx vue-tsc -p tsconfig.vitest.json --noEmit" "vue-app" || exit 1
fi

# ------------------------------------------------------------------------------
# Phase 2: Code Style & Linting
# ------------------------------------------------------------------------------
echo -e "${BOLD}${YELLOW}--- Phase 2: Code Style & Linting ---${NC}"

if [ "$RUN_FRONTEND" = true ]; then
  run_step "Frontend ESLint Verification" "npx eslint ." "vue-app" || exit 1
fi

# ------------------------------------------------------------------------------
# Phase 3: Automated Test Suites
# ------------------------------------------------------------------------------
echo -e "${BOLD}${YELLOW}--- Phase 3: Automated Test Suites ---${NC}"

if [ "$RUN_BACKEND" = true ]; then
  run_step "Backend Jest Test Suite" "npm test" "backend" || exit 1
fi

if [ "$RUN_FRONTEND" = true ]; then
  run_step "Frontend Vitest Unit & Component Suite" "npm run test:unit" "vue-app" || exit 1
fi

# ------------------------------------------------------------------------------
# Phase 4: Production Artifact Builds
# ------------------------------------------------------------------------------
if [ "$RUN_BUILD" = true ]; then
  echo -e "${BOLD}${YELLOW}--- Phase 4: Production Artifact Builds ---${NC}"

  if [ "$RUN_BACKEND" = true ]; then
    run_step "Backend Production Build (tsc)" "npm run build" "backend" || exit 1
  fi

  if [ "$RUN_FRONTEND" = true ]; then
    run_step "Frontend Production Bundle (vite build)" "npm run build" "vue-app" || exit 1
  fi
fi

# ------------------------------------------------------------------------------
# Summary & Completion
# ------------------------------------------------------------------------------
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

echo -e "${BOLD}${BLUE}======================================================================${NC}"
echo -e "${BOLD}${GREEN}🎉 All ${step_count} Local CI verification checks passed successfully! (${TOTAL_DURATION}s)${NC}"
echo -e "${BOLD}${BLUE}======================================================================${NC}"
exit 0

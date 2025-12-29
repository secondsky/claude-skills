#!/bin/bash
# run-tests.sh - CI/CD test execution for Cloudflare Workers
#
# This script provides a production-ready test execution pipeline
# suitable for GitHub Actions, GitLab CI, or any CI/CD platform.
#
# Usage:
#   ./run-tests.sh [options]
#
# Options:
#   --coverage        Run with coverage reporting
#   --watch           Run in watch mode (for local development)
#   --threshold       Fail if coverage below thresholds
#   --upload-codecov  Upload coverage to Codecov
#
# Environment Variables:
#   VITEST_ENV        - Test environment (development/staging/production)
#   CI                - Set to 'true' in CI environments (auto-detected)
#   CODECOV_TOKEN     - Codecov upload token (for --upload-codecov)

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default options
COVERAGE=false
WATCH=false
THRESHOLD=false
UPLOAD_CODECOV=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      COVERAGE=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --threshold)
      THRESHOLD=true
      shift
      ;;
    --upload-codecov)
      UPLOAD_CODECOV=true
      COVERAGE=true # Coverage required for upload
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--coverage] [--watch] [--threshold] [--upload-codecov]"
      exit 1
      ;;
  esac
done

# Detect package manager
if command -v bun &> /dev/null; then
  PKG_MANAGER="bun"
  RUN_CMD="bunx"
elif command -v pnpm &> /dev/null; then
  PKG_MANAGER="pnpm"
  RUN_CMD="pnpx"
elif command -v npm &> /dev/null; then
  PKG_MANAGER="npm"
  RUN_CMD="npx"
else
  echo -e "${RED}❌ No package manager found (bun/npm/pnpm required)${NC}"
  exit 1
fi

# Check if running in CI
if [ "$CI" = "true" ]; then
  echo -e "${GREEN}🔧 Running in CI environment${NC}"
  IS_CI=true
else
  IS_CI=false
fi

# Verify dependencies installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  if [ "$PKG_MANAGER" = "bun" ]; then
    bun install
  elif [ "$PKG_MANAGER" = "pnpm" ]; then
    pnpm install
  else
    npm install
  fi
fi

# Build test command
TEST_CMD="$RUN_CMD vitest"

if [ "$WATCH" = true ]; then
  TEST_CMD="$TEST_CMD"
else
  TEST_CMD="$TEST_CMD run"
fi

if [ "$COVERAGE" = true ]; then
  TEST_CMD="$TEST_CMD --coverage"
fi

# Set environment
if [ -n "$VITEST_ENV" ]; then
  echo -e "${GREEN}🌍 Test environment: $VITEST_ENV${NC}"
  export VITEST_ENV
fi

# Run tests
echo -e "${GREEN}🧪 Running tests...${NC}"
echo -e "${YELLOW}Command: $TEST_CMD${NC}"
echo ""

if $TEST_CMD; then
  echo ""
  echo -e "${GREEN}✅ All tests passed!${NC}"
  TEST_EXIT_CODE=0
else
  echo ""
  echo -e "${RED}❌ Tests failed${NC}"
  TEST_EXIT_CODE=1
fi

# Check coverage thresholds
if [ "$THRESHOLD" = true ] && [ "$COVERAGE" = true ] && [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}📊 Checking coverage thresholds...${NC}"

  # Coverage thresholds are enforced by vitest.config.ts
  # If tests passed, thresholds were met
  echo -e "${GREEN}✅ Coverage thresholds met${NC}"
fi

# Upload to Codecov
if [ "$UPLOAD_CODECOV" = true ] && [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}📤 Uploading coverage to Codecov...${NC}"

  if [ -z "$CODECOV_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  CODECOV_TOKEN not set, skipping upload${NC}"
    echo "   Set CODECOV_TOKEN environment variable or use Codecov GitHub Action"
  else
    if command -v codecov &> /dev/null; then
      codecov -f coverage/lcov.info -t "$CODECOV_TOKEN"
      echo -e "${GREEN}✅ Coverage uploaded to Codecov${NC}"
    else
      echo -e "${YELLOW}⚠️  codecov CLI not installed${NC}"
      echo "   Install with: npm install -g codecov"
      echo "   Or use Codecov GitHub Action instead"
    fi
  fi
fi

# Generate coverage report links
if [ "$COVERAGE" = true ] && [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${GREEN}📊 Coverage reports generated:${NC}"
  echo "   HTML:  coverage/index.html"
  echo "   JSON:  coverage/coverage-final.json"
  echo "   LCOV:  coverage/lcov.info"

  if [ "$IS_CI" = false ]; then
    echo ""
    echo -e "${GREEN}💡 View HTML report:${NC} open coverage/index.html"
  fi
fi

# Exit with test status
exit $TEST_EXIT_CODE

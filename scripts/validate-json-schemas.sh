#!/usr/bin/env bash
#
# Validate JSON schemas for claude-skills repository
#
# Validates:
# - .claude-plugin/marketplace.json against marketplace.schema.json
# - All plugin.json files against plugin.schema.json
#
# Requirements:
# - Run `npm install` to install local dev dependencies.
#
# Usage:
#   ./scripts/validate-json-schemas.sh

set -euo pipefail

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMAS_DIR="$REPO_ROOT/schemas"
MARKETPLACE_FILE="$REPO_ROOT/.claude-plugin/marketplace.json"

echo ""
echo "═══════════════════════════════════════"
echo "🔍 JSON Schema Validation"
echo "═══════════════════════════════════════"
echo ""

# Resolve ajv-cli. Prefer the repo-local dev dependency so validation does not
# depend on a global npm install.
if [ -x "$REPO_ROOT/node_modules/.bin/ajv" ]; then
  AJV="$REPO_ROOT/node_modules/.bin/ajv"
elif command -v ajv &> /dev/null; then
  AJV="$(command -v ajv)"
else
  echo -e "${RED}❌ Error: ajv-cli is not installed${NC}"
  echo ""
  echo "Install with:"
  echo "  npm install"
  echo ""
  exit 1
fi

# Validate marketplace.json
echo -e "${BLUE}📦 Validating marketplace.json...${NC}"
if "$AJV" validate \
  -s "$SCHEMAS_DIR/marketplace.schema.json" \
  -d "$MARKETPLACE_FILE" \
  --spec=draft7 \
  --strict=false \
  --all-errors 2>&1; then
  echo -e "${GREEN}✅ marketplace.json is valid${NC}"
  marketplace_valid=true
else
  echo -e "${RED}❌ marketplace.json validation FAILED${NC}"
  marketplace_valid=false
fi

echo ""

# Find all plugin.json files
echo -e "${BLUE}🔌 Finding plugin.json files...${NC}"
plugin_files=$(find "$REPO_ROOT/plugins" -name 'plugin.json' -path '*/.claude-plugin/plugin.json' | sort)
plugin_count=$(echo "$plugin_files" | wc -l | tr -d ' ')

echo -e "Found ${BLUE}$plugin_count${NC} plugin.json files"
echo ""

# Validate each plugin.json
failed_count=0
passed_count=0

while IFS= read -r plugin_file; do
  if [ -z "$plugin_file" ]; then continue; fi

  plugin_name=$(basename "$(dirname "$(dirname "$plugin_file")")")

  # Run validation and capture output
  # Temporarily disable errexit to capture exit code
  set +e
  validation_output=$("$AJV" validate \
    -s "$SCHEMAS_DIR/plugin.schema.json" \
    -d "$plugin_file" \
    --spec=draft7 \
    --strict=false \
    --all-errors 2>&1)
  validation_exit_code=$?
  set -e

  # Check exit code, not output content
  if [ $validation_exit_code -eq 0 ]; then
    echo -e "${GREEN}✅${NC} $plugin_name"
    passed_count=$((passed_count + 1))
  else
    echo -e "${RED}❌${NC} $plugin_name - VALIDATION FAILED"
    echo ""
    echo "Details:"
    echo "$validation_output"
    echo ""
    failed_count=$((failed_count + 1))
  fi
done <<< "$plugin_files"

echo ""
echo "═══════════════════════════════════════"
echo "VALIDATION SUMMARY"
echo "═══════════════════════════════════════"

if [ "$marketplace_valid" = true ]; then
  echo -e "${GREEN}✅${NC} marketplace.json: Valid"
else
  echo -e "${RED}❌${NC} marketplace.json: FAILED"
fi

echo ""
echo "Plugin Validation:"
echo -e "  Total:  ${BLUE}$plugin_count${NC}"
echo -e "  Passed: ${GREEN}$passed_count${NC}"
echo -e "  Failed: ${RED}$failed_count${NC}"

echo ""

# Exit with appropriate code
if [ "$marketplace_valid" = true ] && [ $failed_count -eq 0 ]; then
  echo -e "${GREEN}✅ All validations passed!${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Validation failed. Fix errors above.${NC}"
  echo ""
  exit 1
fi

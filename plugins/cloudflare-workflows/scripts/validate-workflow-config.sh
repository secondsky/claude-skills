#!/usr/bin/env bash
#
# validate-workflow-config.sh
# Validates wrangler.jsonc workflow configuration
#
# Usage: ./scripts/validate-workflow-config.sh [path/to/wrangler.jsonc]
#
# Exit Codes:
#   0 - Valid configuration
#   1 - Syntax errors
#   2 - Missing required fields
#   3 - Configuration issues

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Config file path
CONFIG_FILE="${1:-wrangler.jsonc}"

# Error counters
ERRORS=0
WARNINGS=0

# Helper functions
error() {
  echo -e "${RED}❌ ERROR:${NC} $1"
  ((ERRORS++))
}

warn() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
  ((WARNINGS++))
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

info() {
  echo "ℹ️  $1"
}

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  error "Configuration file not found: $CONFIG_FILE"
  exit 1
fi

echo "Validating workflow configuration: $CONFIG_FILE"
echo "========================================"
echo ""

# Step 1: Validate JSON syntax
info "Step 1: Validating JSON syntax..."
if ! grep -v '^\s*//' "$CONFIG_FILE" | jq '.' > /dev/null 2>&1; then
  error "Invalid JSON syntax"
  exit 1
fi
success "JSON syntax is valid"
echo ""

# Step 2: Check for workflows array
info "Step 2: Checking for workflows array..."
WORKFLOWS_COUNT=$(grep -v '^\s*//' "$CONFIG_FILE" | jq '.workflows // [] | length' 2>/dev/null || echo "0")

if [ "$WORKFLOWS_COUNT" = "0" ]; then
  warn "No workflows configured (workflows array is empty or missing)"
else
  success "Found $WORKFLOWS_COUNT workflow(s) configured"
fi
echo ""

# Step 3: Validate each workflow
if [ "$WORKFLOWS_COUNT" != "0" ]; then
  info "Step 3: Validating workflow configurations..."

  for ((i=0; i<WORKFLOWS_COUNT; i++)); do
    echo "  Workflow $((i+1)):"

    # Get workflow data
    WORKFLOW=$(grep -v '^\s*//' "$CONFIG_FILE" | jq ".workflows[$i]")

    # Check required fields
    NAME=$(echo "$WORKFLOW" | jq -r '.name // empty')
    CLASS_NAME=$(echo "$WORKFLOW" | jq -r '.class_name // empty')
    SCRIPT_NAME=$(echo "$WORKFLOW" | jq -r '.script_name // empty')

    # Validate name
    if [ -z "$NAME" ]; then
      error "  - Missing required field: name"
    else
      success "  - name: $NAME"

      # Check name format (lowercase, alphanumeric, hyphens)
      if ! echo "$NAME" | grep -Eq '^[a-z0-9-]+$'; then
        warn "  - Workflow name should be lowercase with hyphens only"
      fi
    fi

    # Validate class_name
    if [ -z "$CLASS_NAME" ]; then
      error "  - Missing required field: class_name"
    else
      success "  - class_name: $CLASS_NAME"

      # Check class name format (PascalCase)
      if ! echo "$CLASS_NAME" | grep -Eq '^[A-Z][a-zA-Z0-9]*$'; then
        warn "  - class_name should be PascalCase"
      fi
    fi

    # Validate script_name (optional, but should match main if present)
    if [ -n "$SCRIPT_NAME" ]; then
      success "  - script_name: $SCRIPT_NAME"
    fi

    echo ""
  done
fi

# Step 4: Check for duplicate workflow names
info "Step 4: Checking for duplicate workflow names..."
if [ "$WORKFLOWS_COUNT" != "0" ]; then
  DUPLICATE_NAMES=$(grep -v '^\s*//' "$CONFIG_FILE" | jq -r '.workflows[].name' | sort | uniq -d)

  if [ -n "$DUPLICATE_NAMES" ]; then
    error "Duplicate workflow names found:"
    echo "$DUPLICATE_NAMES" | while read -r name; do
      echo "  - $name"
    done
  else
    success "No duplicate workflow names"
  fi
fi
echo ""

# Step 5: Validate compatibility_date
info "Step 5: Checking compatibility_date..."
COMPAT_DATE=$(grep -v '^\s*//' "$CONFIG_FILE" | jq -r '.compatibility_date // empty')

if [ -z "$COMPAT_DATE" ]; then
  warn "Missing compatibility_date (recommended)"
else
  success "compatibility_date: $COMPAT_DATE"

  # Check if date is in valid format (YYYY-MM-DD)
  if ! echo "$COMPAT_DATE" | grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
    error "Invalid compatibility_date format (should be YYYY-MM-DD)"
  else
    # Check if date is recent (within last 2 years)
    COMPAT_YEAR=$(echo "$COMPAT_DATE" | cut -d'-' -f1)
    CURRENT_YEAR=$(date +%Y)

    if [ "$COMPAT_YEAR" -lt $((CURRENT_YEAR - 2)) ]; then
      warn "compatibility_date is more than 2 years old (consider updating)"
    fi
  fi
fi
echo ""

# Step 6: Check main script file
info "Step 6: Checking main script file..."
MAIN_FILE=$(grep -v '^\s*//' "$CONFIG_FILE" | jq -r '.main // "src/index.ts"')

if [ ! -f "$MAIN_FILE" ]; then
  warn "Main script file not found: $MAIN_FILE"
else
  success "Main script exists: $MAIN_FILE"

  # Check if workflow classes are exported in main file
  if [ "$WORKFLOWS_COUNT" != "0" ]; then
    for ((i=0; i<WORKFLOWS_COUNT; i++)); do
      CLASS_NAME=$(grep -v '^\s*//' "$CONFIG_FILE" | jq -r ".workflows[$i].class_name")

      if [ -n "$CLASS_NAME" ]; then
        if grep -q "export.*class.*$CLASS_NAME\|export.*{.*$CLASS_NAME" "$MAIN_FILE"; then
          success "  - $CLASS_NAME is exported"
        else
          error "  - $CLASS_NAME is not exported in $MAIN_FILE"
        fi
      fi
    done
  fi
fi
echo ""

# Summary
echo "========================================"
echo "Validation Summary"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  success "Configuration is valid! No errors or warnings."
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}Configuration is valid with $WARNINGS warning(s).${NC}"
  exit 0
else
  echo -e "${RED}Configuration has $ERRORS error(s) and $WARNINGS warning(s).${NC}"

  if [ $ERRORS -gt 0 ]; then
    exit 2
  else
    exit 3
  fi
fi

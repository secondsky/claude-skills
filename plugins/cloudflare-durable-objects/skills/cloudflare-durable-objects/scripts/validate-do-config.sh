#!/usr/bin/env bash
#
# validate-do-config.sh
#
# Validates wrangler.jsonc Durable Objects configuration
#
# Checks:
# - Durable Objects bindings are defined
# - Class names match exported classes in code
# - Migrations are properly configured
# - No common configuration errors
# - TypeScript exports match wrangler.jsonc bindings
#
# Usage:
#   ./validate-do-config.sh [path/to/wrangler.jsonc]
#
# Exit codes:
#   0 - Configuration valid
#   1 - Configuration invalid
#   2 - File not found or invalid JSON

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# ============================================================================
# Helper Functions
# ============================================================================

error() {
  echo -e "${RED}❌ ERROR: $1${NC}" >&2
  ((ERRORS++))
}

warning() {
  echo -e "${YELLOW}⚠️  WARNING: $1${NC}" >&2
  ((WARNINGS++))
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

info() {
  echo "ℹ️  $1"
}

# ============================================================================
# Main Validation Logic
# ============================================================================

main() {
  local config_file="${1:-wrangler.jsonc}"

  info "Validating Durable Objects configuration: $config_file"
  echo ""

  # Check if file exists
  if [[ ! -f "$config_file" ]]; then
    error "Configuration file not found: $config_file"
    exit 2
  fi

  # Check if jq is installed
  if ! command -v jq &> /dev/null; then
    error "jq is required but not installed. Install: brew install jq"
    exit 2
  fi

  # Parse JSON (strip comments for jsonc compatibility)
  local json_content
  if ! json_content=$(grep -v '^\s*//' "$config_file" | jq '.' 2>/dev/null); then
    error "Invalid JSON/JSONC syntax in $config_file"
    exit 2
  fi

  # ============================================================================
  # Check 1: Durable Objects Bindings
  # ============================================================================

  info "Checking Durable Objects bindings..."

  local bindings
  bindings=$(echo "$json_content" | jq -r '.durable_objects.bindings // []')

  if [[ "$bindings" == "[]" ]]; then
    error "No Durable Objects bindings found in durable_objects.bindings"
    echo "  Add at least one binding:"
    echo '  "durable_objects": {'
    echo '    "bindings": ['
    echo '      { "name": "MY_DO", "class_name": "MyDurableObject" }'
    echo '    ]'
    echo '  }'
    echo ""
  else
    local binding_count
    binding_count=$(echo "$bindings" | jq 'length')
    success "Found $binding_count Durable Object binding(s)"
    echo ""
  fi

  # ============================================================================
  # Check 2: Binding Configuration
  # ============================================================================

  info "Validating binding configurations..."

  local binding_names=()
  local class_names=()

  while IFS= read -r binding; do
    local name
    local class_name
    local script_name

    name=$(echo "$binding" | jq -r '.name // empty')
    class_name=$(echo "$binding" | jq -r '.class_name // empty')
    script_name=$(echo "$binding" | jq -r '.script_name // empty')

    # Check required fields
    if [[ -z "$name" ]]; then
      error "Binding missing required field 'name'"
      continue
    fi

    if [[ -z "$class_name" ]]; then
      error "Binding '$name' missing required field 'class_name'"
      continue
    fi

    # Check naming conventions
    if [[ ! "$name" =~ ^[A-Z_]+$ ]]; then
      warning "Binding name '$name' should be SCREAMING_SNAKE_CASE (e.g., MY_DO)"
    fi

    if [[ ! "$class_name" =~ ^[A-Z][a-zA-Z0-9]*$ ]]; then
      warning "Class name '$class_name' should be PascalCase (e.g., MyDurableObject)"
    fi

    # Track names for duplicate check
    binding_names+=("$name")
    class_names+=("$class_name")

    success "Binding '$name' → class '$class_name'"

    if [[ -n "$script_name" ]]; then
      info "  script_name: $script_name"
    fi

  done < <(echo "$bindings" | jq -c '.[]')

  echo ""

  # Check for duplicate binding names
  local duplicates
  duplicates=$(printf '%s\n' "${binding_names[@]}" | sort | uniq -d)
  if [[ -n "$duplicates" ]]; then
    error "Duplicate binding names found: $duplicates"
  fi

  # ============================================================================
  # Check 3: Migrations
  # ============================================================================

  info "Checking migrations configuration..."

  local migrations
  migrations=$(echo "$json_content" | jq -r '.migrations // []')

  if [[ "$migrations" == "[]" ]]; then
    error "No migrations found in configuration"
    echo "  Add migration entry for each Durable Object:"
    echo '  "migrations": ['
    echo '    {'
    echo '      "tag": "v1",'
    echo '      "new_sqlite_classes": ["MyDurableObject"]'
    echo '    }'
    echo '  ]'
    echo ""
  else
    local migration_count
    migration_count=$(echo "$migrations" | jq 'length')
    success "Found $migration_count migration(s)"
    echo ""

    # Validate each migration
    while IFS= read -r migration; do
      local tag
      local new_classes
      local renamed_classes
      local deleted_classes

      tag=$(echo "$migration" | jq -r '.tag // empty')
      new_classes=$(echo "$migration" | jq -r '.new_sqlite_classes // [] | join(", ")')
      renamed_classes=$(echo "$migration" | jq -r '.renamed_classes // [] | join(", ")')
      deleted_classes=$(echo "$migration" | jq -r '.deleted_classes // [] | join(", ")')

      if [[ -z "$tag" ]]; then
        error "Migration missing required field 'tag'"
        continue
      fi

      info "Migration tag: $tag"

      if [[ -n "$new_classes" ]]; then
        info "  new_sqlite_classes: $new_classes"

        # Check if new classes match bindings
        for class in $(echo "$new_classes" | tr ',' '\n'); do
          class=$(echo "$class" | xargs) # trim whitespace
          if [[ ! " ${class_names[*]} " =~ " ${class} " ]]; then
            warning "Class '$class' in new_sqlite_classes not found in bindings"
          fi
        done
      fi

      if [[ -n "$renamed_classes" ]]; then
        info "  renamed_classes: $renamed_classes"
      fi

      if [[ -n "$deleted_classes" ]]; then
        info "  deleted_classes: $deleted_classes"
      fi

    done < <(echo "$migrations" | jq -c '.[]')

    echo ""
  fi

  # ============================================================================
  # Check 4: TypeScript Class Exports
  # ============================================================================

  info "Checking TypeScript class exports..."

  local main_file
  main_file=$(echo "$json_content" | jq -r '.main // "src/index.ts"')

  if [[ ! -f "$main_file" ]]; then
    warning "Main file not found: $main_file (skipping export check)"
  else
    for class_name in "${class_names[@]}"; do
      if grep -q "export class $class_name" "$main_file"; then
        success "Class '$class_name' exported in $main_file"
      else
        error "Class '$class_name' not found in $main_file"
        echo "  Add export: export class $class_name extends DurableObject { ... }"
      fi
    done
  fi

  echo ""

  # ============================================================================
  # Check 5: Common Mistakes
  # ============================================================================

  info "Checking for common configuration mistakes..."

  # Check for old KV storage syntax
  if echo "$json_content" | jq -e '.durable_objects.bindings[] | select(.new_classes)' &> /dev/null; then
    error "Found 'new_classes' in bindings (should be in migrations)"
    echo "  Move to migrations section:"
    echo '  "migrations": [{ "tag": "v1", "new_sqlite_classes": [...] }]'
  fi

  # Check for missing compatibility_date
  if ! echo "$json_content" | jq -e '.compatibility_date' &> /dev/null; then
    warning "Missing 'compatibility_date' field (recommended for production)"
    echo "  Add: \"compatibility_date\": \"$(date +%Y-%m-%d)\""
  fi

  # Check for SQL backend usage (new_sqlite_classes)
  local has_sql_classes=false
  if echo "$migrations" | jq -e '.[] | .new_sqlite_classes // [] | length > 0' &> /dev/null; then
    has_sql_classes=true
    success "Using SQL storage backend (recommended)"
  else
    warning "No SQL storage classes found (consider using new_sqlite_classes)"
  fi

  # Check for class name consistency
  for binding_name in "${binding_names[@]}"; do
    local class_name_from_binding
    class_name_from_binding=$(echo "$bindings" | jq -r ".[] | select(.name == \"$binding_name\") | .class_name")

    # Suggest consistent naming
    local expected_class_name
    expected_class_name=$(echo "$binding_name" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}' | sed 's/_//g')

    if [[ "$class_name_from_binding" != "$expected_class_name"* ]]; then
      info "Binding '$binding_name' uses class '$class_name_from_binding'"
      info "  Consider naming pattern: binding 'MY_DO' → class 'MyDO' or 'MyDurableObject'"
    fi
  done

  echo ""

  # ============================================================================
  # Summary
  # ============================================================================

  echo "=================================================="
  echo "Validation Summary"
  echo "=================================================="
  echo "Configuration file: $config_file"
  echo "Bindings found: ${#binding_names[@]}"
  echo "Errors: $ERRORS"
  echo "Warnings: $WARNINGS"
  echo ""

  if [[ $ERRORS -eq 0 ]]; then
    success "Configuration is valid! 🎉"
    echo ""
    info "Next steps:"
    echo "  1. Deploy: wrangler deploy"
    echo "  2. Test DO creation: curl your-worker-url"
    echo "  3. Monitor logs: wrangler tail"
    exit 0
  else
    error "Configuration has $ERRORS error(s). Please fix before deploying."
    exit 1
  fi
}

# ============================================================================
# Script Entry Point
# ============================================================================

main "$@"

#!/usr/bin/env bash
#
# Validate YAML frontmatter in SKILL.md files
#
# Aligned with the official Agent Skills specification:
#   https://agentskills.io/specification
#   https://github.com/agentskills/agentskills/tree/main/skills-ref
#
# Checks:
#   - Frontmatter delimiters (--- ... ---)
#   - Required fields: name, description
#   - name: lowercase, <= 64 chars, no leading/trailing/consecutive hyphens, [a-z0-9-] only
#   - name matches skill directory name
#   - description: non-empty, <= 1024 chars
#   - compatibility: <= 500 chars if present
#   - Only allowed top-level fields: name, description, license, allowed-tools, metadata, compatibility
#   - Recommended field: license (warn)
#
# Usage:
#   ./scripts/validate-frontmatter.sh                    # Validate all skills
#   ./scripts/validate-frontmatter.sh --dir plugins/foo  # Validate one skill
#   ./scripts/validate-frontmatter.sh --quiet            # Only print errors

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ALLOWED_FIELDS="name description license allowed-tools metadata compatibility"
ALLOWED_FIELDS_PATTERN="^(name|description|license|allowed-tools|metadata|compatibility)$"
MAX_NAME_LENGTH=64
MAX_DESCRIPTION_LENGTH=1024
MAX_COMPATIBILITY_LENGTH=500

CRITICAL_COUNT=0
WARNING_COUNT=0
TOTAL=0
PASSED=0
QUIET=false

validate_skill() {
  local skill_file="$1"
  local skill_dir
  skill_dir="$(dirname "$skill_file")"
  local dir_name
  dir_name="$(basename "$skill_dir")"

  TOTAL=$((TOTAL + 1))
  local has_error=false
  local has_warning=false

  local first_line
  first_line=$(head -1 "$skill_file")

  if [ "$first_line" != "---" ]; then
    if [ "$QUIET" = false ]; then
      echo -e "  ${RED}FAIL${NC} $dir_name: missing opening --- delimiter"
    fi
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
    return 1
  fi

  local frontmatter
  frontmatter=$(awk '
    /^---$/ { count++; next }
    count == 1 { print }
    count >= 2 { exit }
  ' "$skill_file")

  if [ -z "$frontmatter" ]; then
    if [ "$QUIET" = false ]; then
      echo -e "  ${RED}FAIL${NC} $dir_name: empty or missing frontmatter"
    fi
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
    return 1
  fi

  local errors=""
  local warnings=""

  # --- Required fields ---
  if ! echo "$frontmatter" | grep -q "^name:"; then
    errors="${errors}  missing required field 'name'\n"
  fi

  if ! echo "$frontmatter" | grep -q "^description:"; then
    errors="${errors}  missing required field 'description'\n"
  fi

  # --- Extract name value ---
  local yaml_name
  yaml_name=$(echo "$frontmatter" | grep "^name:" | head -1 | sed 's/^name:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')

  # --- Name format checks (spec: lowercase, <= 64, no leading/trailing hyphen, no --, [a-z0-9-] only) ---
  if [ -n "$yaml_name" ]; then
    local name_lower
    name_lower=$(echo "$yaml_name" | tr '[:upper:]' '[:lower:]')
    if [ "$yaml_name" != "$name_lower" ]; then
      errors="${errors}  name '$yaml_name' must be lowercase\n"
    fi

    local name_len=${#yaml_name}
    if [ "$name_len" -gt "$MAX_NAME_LENGTH" ]; then
      errors="${errors}  name exceeds ${MAX_NAME_LENGTH} chars (${name_len})\n"
    fi

    if [[ "$yaml_name" == -* ]]; then
      errors="${errors}  name cannot start with a hyphen\n"
    fi

    if [[ "$yaml_name" == *- ]]; then
      errors="${errors}  name cannot end with a hyphen\n"
    fi

    if [[ "$yaml_name" == *--* ]]; then
      errors="${errors}  name cannot contain consecutive hyphens\n"
    fi

    if ! echo "$yaml_name" | grep -qE '^[a-z0-9-]+$'; then
      errors="${errors}  name '$yaml_name' contains invalid characters (only a-z, 0-9, - allowed)\n"
    fi

    if [ "$yaml_name" != "$dir_name" ]; then
      errors="${errors}  name '$yaml_name' does not match directory '$dir_name'\n"
    fi
  fi

  # --- Description length check (spec: <= 1024 chars) ---
  local desc_text
  desc_text=$(echo "$frontmatter" | awk '
    /^description:/ { flag=1; sub(/^description:[[:space:]]*/, ""); print; next }
    flag && /^[a-z-]+:/ { flag=0 }
    flag && /^  / { sub(/^  /, ""); print }
  ')

  if [ -n "$desc_text" ]; then
    local desc_len
    desc_len=$(echo "$desc_text" | tr -d '\n' | wc -c | tr -d ' ')
    if [ "$desc_len" -gt "$MAX_DESCRIPTION_LENGTH" ]; then
      errors="${errors}  description exceeds ${MAX_DESCRIPTION_LENGTH} chars (${desc_len})\n"
    fi
  else
    errors="${errors}  missing required field 'description' or description is empty\n"
  fi

  # --- Compatibility length check (spec: <= 500 chars) ---
  local compat_text
  compat_text=$(echo "$frontmatter" | awk '
    /^compatibility:/ { flag=1; sub(/^compatibility:[[:space:]]*/, ""); print; next }
    flag && /^[a-z-]+:/ { flag=0 }
    flag && /^  / { sub(/^  /, ""); print }
  ')

  if [ -n "$compat_text" ]; then
    local compat_len
    compat_len=$(echo "$compat_text" | tr -d '\n' | wc -c | tr -d ' ')
    if [ "$compat_len" -gt "$MAX_COMPATIBILITY_LENGTH" ]; then
      errors="${errors}  compatibility exceeds ${MAX_COMPATIBILITY_LENGTH} chars (${compat_len})\n"
    fi
  fi

  # --- Recommended fields ---
  if ! echo "$frontmatter" | grep -q "^license:"; then
    warnings="${warnings}  missing 'license' field (recommended)\n"
  fi

  # --- Unknown top-level fields (spec: error, not warning) ---
  local invalid_fields
  invalid_fields=$(echo "$frontmatter" | awk -v pattern="$ALLOWED_FIELDS_PATTERN" '
    /^[a-z][a-z0-9-]*:/ && !/^[[:space:]]/ {
      field = $0
      sub(/:.*$/, "", field)
      if (field !~ pattern) print field
    }
  ')

  if [ -n "$invalid_fields" ]; then
    local deduped
    deduped=$(echo "$invalid_fields" | sort -u)
    while IFS= read -r field; do
      [ -z "$field" ] && continue
      errors="${errors}  unknown field '$field' (allowed: $ALLOWED_FIELDS)\n"
    done <<< "$deduped"
  fi

  # --- Output ---
  if [ -n "$errors" ]; then
    has_error=true
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
    if [ "$QUIET" = false ]; then
      echo -e "  ${RED}FAIL${NC} $dir_name"
      printf "$errors"
    fi
  fi

  if [ -n "$warnings" ]; then
    has_warning=true
    WARNING_COUNT=$((WARNING_COUNT + 1))
    if [ "$QUIET" = false ]; then
      echo -e "  ${YELLOW}WARN${NC} $dir_name"
      printf "$warnings"
    fi
  fi

  if [ "$has_error" = false ]; then
    PASSED=$((PASSED + 1))
    if [ "$QUIET" = false ] && [ "$has_warning" = false ]; then
      echo -e "  ${GREEN} OK ${NC} $dir_name"
    fi
  fi
}

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --dir <path>   Validate a single skill directory"
  echo "  --quiet        Only print errors and warnings"
  echo "  --help         Show this help"
  echo ""
  echo "Examples:"
  echo "  $0                                  # Validate all skills"
  echo "  $0 --dir plugins/cloudflare-d1      # Validate one skill"
  echo "  $0 --quiet                          # Silent mode"
}

TARGET_DIR=""

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)
      TARGET_DIR="$2"
      shift 2
      ;;
    --quiet)
      QUIET=true
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [ "$QUIET" = false ]; then
  echo ""
  echo "═══════════════════════════════════════"
  echo " SKILL.md Frontmatter Validation"
  echo " Spec: https://agentskills.io/specification"
  echo "═══════════════════════════════════════"
  echo ""
fi

if [ -n "$TARGET_DIR" ]; then
  if [ "$(basename "$TARGET_DIR")" = "skills" ]; then
    search_dir="$TARGET_DIR"
  else
    search_dir="$TARGET_DIR/skills"
  fi

  skill_files=$(find "$search_dir" -name 'SKILL.md' 2>/dev/null | sort)

  if [ -z "$skill_files" ]; then
    if [ -f "$TARGET_DIR/SKILL.md" ]; then
      skill_files="$TARGET_DIR/SKILL.md"
    fi
  fi

  if [ -z "$skill_files" ]; then
    if [ "$QUIET" = false ]; then
      echo -e "${RED}Error: No SKILL.md found in $TARGET_DIR${NC}"
    fi
    exit 1
  fi

  while IFS= read -r file; do
    validate_skill "$file"
  done <<< "$skill_files"
else
  skill_files=$(find "$REPO_ROOT/plugins" -name 'SKILL.md' 2>/dev/null | sort)

  if [ -z "$skill_files" ]; then
    echo -e "${RED}Error: No SKILL.md files found${NC}"
    exit 1
  fi

  while IFS= read -r file; do
    validate_skill "$file"
  done <<< "$skill_files"
fi

if [ "$QUIET" = false ]; then
  echo ""
  echo "═══════════════════════════════════════"
  echo "SUMMARY"
  echo "═══════════════════════════════════════"
  echo -e "  Total:    $TOTAL"
  echo -e "  Passed:   ${GREEN}$PASSED${NC}"
  echo -e "  Failed:   ${RED}$CRITICAL_COUNT${NC}"
  echo -e "  Warnings: ${YELLOW}$WARNING_COUNT${NC}"
  echo ""
fi

if [ "$CRITICAL_COUNT" -gt 0 ]; then
  if [ "$QUIET" = false ]; then
    echo -e "${RED}Validation failed with $CRITICAL_COUNT critical issue(s)${NC}"
  fi
  exit 1
else
  if [ "$QUIET" = false ]; then
    echo -e "${GREEN}All frontmatter valid${NC}"
  fi
  exit 0
fi

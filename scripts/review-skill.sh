#!/usr/bin/env bash

# review-skill.sh - Comprehensive skill review automation
# Part of claude-skills review process
# Usage: ./scripts/review-skill.sh <skill-name> [--quick]
#
# Performs automated validation checks for skill documentation,
# providing structured report for manual verification phases.
#
# See: planning/SKILL_REVIEW_PROCESS.md for complete guide

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji for scanning
PASS="✅"
WARN="⚠️"
FAIL="❌"
INFO="ℹ️"
MANUAL="🔍"

# Paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"

# Counters
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
MANUAL_CHECKS=0

# Results arrays
declare -a CRITICAL_LIST
declare -a HIGH_LIST
declare -a MEDIUM_LIST
declare -a LOW_LIST
declare -a MANUAL_LIST

# Add findings
add_critical() { CRITICAL_LIST+=("$1"); ((CRITICAL++)); }
add_high() { HIGH_LIST+=("$1"); ((HIGH++)); }
add_medium() { MEDIUM_LIST+=("$1"); ((MEDIUM++)); }
add_low() { LOW_LIST+=("$1"); ((LOW++)); }
add_manual() { MANUAL_LIST+=("$1"); ((MANUAL_CHECKS++)); }

# Helper functions
error() { echo -e "${RED}${FAIL} $1${NC}"; }
success() { echo -e "${GREEN}${PASS} $1${NC}"; }
warning() { echo -e "${YELLOW}${WARN} $1${NC}"; }
info() { echo -e "${BLUE}${INFO} $1${NC}"; }
manual() { echo -e "${CYAN}${MANUAL} $1${NC}"; }

# Usage
usage() {
  cat << EOF
Usage: $0 <skill-name> [options]

Options:
  --quick     Quick check only (skip deep verification)
  --help      Show this help message

Examples:
  $0 better-auth
  $0 cloudflare-d1 --quick

EOF
  exit 0
}

# ============================================================================
# Phase 1: Setup & Validation
# ============================================================================

validate_skill_exists() {
  local skill="$1"
  local skill_dir="$SKILLS_DIR/$skill"

  if [ ! -d "$skill_dir" ]; then
    error "Skill '$skill' not found in $SKILLS_DIR"
    echo ""
    echo "Available skills:"
    ls -1 "$SKILLS_DIR" 2>/dev/null | /usr/bin/head -10
    exit 1
  fi

  if [ ! -f "$skill_dir/SKILL.md" ]; then
    error "SKILL.md missing for $skill"
    add_critical "Missing SKILL.md (required file)"
    return 1
  fi

  success "Skill directory found: $skill_dir"
  return 0
}

# ============================================================================
# Phase 2: YAML Frontmatter Validation
# ============================================================================

check_yaml_frontmatter() {
  local skill_file="$1"
  echo ""
  echo "📋 Checking YAML frontmatter..."

  # Extract frontmatter (between --- markers)
  local frontmatter=$(sed -n '/^---$/,/^---$/p' "$skill_file" | sed '1d;$d')

  if [ -z "$frontmatter" ]; then
    error "No YAML frontmatter found"
    add_critical "Missing YAML frontmatter (skill won't be discovered)"
    return 1
  fi

  # Check required fields
  local has_name=$(echo "$frontmatter" | grep -c "^name:" || true)
  local has_description=$(echo "$frontmatter" | grep -c "^description:" || true)
  local has_license=$(echo "$frontmatter" | grep -c "^license:" || true)

  if [ "$has_name" -eq 0 ]; then
    error "Missing 'name' field in frontmatter"
    add_critical "YAML frontmatter missing required 'name' field"
  else
    success "Field 'name' present"
  fi

  if [ "$has_description" -eq 0 ]; then
    error "Missing 'description' field in frontmatter"
    add_critical "YAML frontmatter missing required 'description' field"
  else
    local desc_lines=$(echo "$frontmatter" | sed -n '/^description:/,/^[a-z]/p' | wc -l)
    if [ "$desc_lines" -lt 5 ]; then
      warning "Description seems short ($desc_lines lines)"
      add_medium "Description may be too brief (< 5 lines)"
    else
      success "Field 'description' present (multi-line)"
    fi
  fi

  if [ "$has_license" -eq 0 ]; then
    warning "Missing 'license' field (recommended: MIT)"
    add_low "YAML frontmatter missing 'license' field"
  else
    success "Field 'license' present"
  fi

  # Check name matches directory
  local yaml_name=$(echo "$frontmatter" | grep "^name:" | /usr/bin/head -1 | sed 's/name:[[:space:]]*//')
  local dir_name=$(basename "$(dirname "$skill_file")")

  if [ "$yaml_name" != "$dir_name" ]; then
    error "Name mismatch: YAML='$yaml_name', directory='$dir_name'"
    add_critical "Skill name doesn't match directory name"
  else
    success "Name matches directory"
  fi

  # Check for metadata fields (optional but recommended)
  if echo "$frontmatter" | grep -q "metadata:"; then
    success "Metadata section present"

    # Check for version
    if ! echo "$frontmatter" | grep -q "version:"; then
      info "Metadata: version field missing (recommended)"
    fi

    # Check for last_verified
    if echo "$frontmatter" | grep -q "last_verified:"; then
      local last_verified=$(echo "$frontmatter" | grep "last_verified:" | sed 's/.*last_verified:[[:space:]]*//')
      local days_ago=$(( ($(date +%s) - $(date -d "$last_verified" +%s 2>/dev/null || echo 0)) / 86400 ))

      if [ "$days_ago" -gt 90 ]; then
        warning "Last verified ${days_ago} days ago (>90 days is stale)"
        add_medium "Skill hasn't been verified in ${days_ago} days"
      else
        success "Recently verified (${days_ago} days ago)"
      fi
    else
      info "Metadata: last_verified field missing (recommended)"
    fi
  else
    info "No metadata section (optional but recommended)"
  fi

  return 0
}

# ============================================================================
# Phase 3: Package Version Checks
# ============================================================================

check_package_versions() {
  local skill_dir="$1"
  echo ""
  echo "📦 Checking package versions..."

  # Look for package.json in skill directory or templates/
  local package_json=""
  if [ -f "$skill_dir/templates/package.json" ]; then
    package_json="$skill_dir/templates/package.json"
  elif [ -f "$skill_dir/package.json" ]; then
    package_json="$skill_dir/package.json"
  else
    info "No package.json found (not a Node.js skill)"
    return 0
  fi

  info "Found: $(basename "$(dirname "$package_json")")/package.json"

  # Use existing check-versions.sh if available
  if [ -x "$REPO_ROOT/scripts/check-versions.sh" ]; then
    "$REPO_ROOT/scripts/check-versions.sh" "$(basename "$skill_dir")" 2>/dev/null | \
      grep -E "⚠|available" | while read -r line; do
        warning "$line"
        add_medium "Package update available: $line"
      done
  else
    info "check-versions.sh not available, skipping detailed version check"
  fi

  return 0
}

# ============================================================================
# Phase 4: Link Validation
# ============================================================================

check_broken_links() {
  local skill_dir="$1"
  echo ""
  echo "🔗 Checking for broken links..."

  # Extract URLs from markdown files
  local urls=$(grep -rhoE 'https?://[^)"\s]+' "$skill_dir" 2>/dev/null | sort -u | /usr/bin/head -20)

  if [ -z "$urls" ]; then
    info "No HTTP links found"
    return 0
  fi

  local checked=0
  local broken=0

  while IFS= read -r url; do
    ((checked++))

    # Skip npm view URLs (not actual links)
    if [[ "$url" == *"npm view"* ]]; then
      continue
    fi

    # Check HTTP status (with timeout)
    local status=$(timeout 3 curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$status" = "000" ] || [ "$status" -ge 400 ]; then
      warning "Broken link [$status]: $url"
      add_high "Broken link: $url (HTTP $status)"
      ((broken++))
    fi
  done <<< "$urls"

  if [ "$broken" -eq 0 ]; then
    success "All links reachable ($checked checked)"
  else
    warning "$broken broken link(s) found"
  fi

  return 0
}

# ============================================================================
# Phase 5: TODO Markers
# ============================================================================

check_todo_markers() {
  local skill_dir="$1"
  echo ""
  echo "📝 Checking for TODO markers..."

  local todos=$(grep -rn "TODO\|FIXME\|XXX" "$skill_dir" 2>/dev/null | \
    grep -v "node_modules" | grep -v ".git" || true)

  if [ -z "$todos" ]; then
    success "No TODO markers found"
    return 0
  fi

  local count=$(echo "$todos" | wc -l)
  warning "Found $count TODO/FIXME marker(s):"
  echo "$todos" | /usr/bin/head -5 | while read -r line; do
    echo "  $line"
  done

  if [ "$count" -gt 5 ]; then
    echo "  ... and $(( count - 5 )) more"
  fi

  add_low "$count TODO/FIXME marker(s) remaining"
  return 0
}

# ============================================================================
# Phase 6: File Organization
# ============================================================================

check_file_organization() {
  local skill_dir="$1"
  echo ""
  echo "📂 Checking file organization..."

  # Check for README.md
  if [ -f "$skill_dir/README.md" ]; then
    success "README.md present"
  else
    warning "README.md missing (recommended)"
    add_medium "Missing README.md for quick reference"
  fi

  # Check bundled resources section in SKILL.md
  if grep -q "## Bundled Resources" "$skill_dir/SKILL.md"; then
    info "Bundled Resources section found, verifying..."

    # Extract resource paths
    local resources=$(grep -A 20 "## Bundled Resources" "$skill_dir/SKILL.md" | \
      grep -oE '`[^`]+\.(sh|ts|tsx|md|js|json)`' | tr -d '`')

    while IFS= read -r resource; do
      if [ -n "$resource" ] && [ ! -f "$skill_dir/$resource" ]; then
        warning "Listed resource not found: $resource"
        add_medium "Bundled resource missing: $resource"
      fi
    done <<< "$resources"
  fi

  # Check for common directories
  if [ -d "$skill_dir/scripts" ]; then
    local script_count=$(find "$skill_dir/scripts" -type f -name "*.sh" | wc -l)
    success "scripts/ directory present ($script_count files)"
  fi

  if [ -d "$skill_dir/references" ]; then
    local ref_count=$(find "$skill_dir/references" -type f | wc -l)
    success "references/ directory present ($ref_count files)"
  fi

  if [ -d "$skill_dir/templates" ]; then
    local template_count=$(find "$skill_dir/templates" -type f | wc -l)
    success "templates/ directory present ($template_count files)"
  fi

  return 0
}

# ============================================================================
# Phase 7: Manual Verification Prompts
# ============================================================================

generate_manual_checks() {
  local skill_name="$1"
  echo ""
  echo "👤 Manual verification required..."
  echo ""

  manual "MANUAL: Verify API methods against official documentation"
  add_manual "Verify all API methods exist in current package version"
  echo "         → Use Context7 MCP or WebFetch to check official docs"
  echo "         → Search for: package API reference"
  echo ""

  manual "MANUAL: Check GitHub repository for recent updates"
  add_manual "Check if package has been updated recently (last 6 months)"
  echo "         → Visit GitHub /commits/main"
  echo "         → Look for relevant changes"
  echo ""

  manual "MANUAL: Review known issues"
  add_manual "Check GitHub issues for problems affecting documented patterns"
  echo "         → Visit GitHub /issues"
  echo "         → Search for skill-related keywords"
  echo ""

  manual "MANUAL: Verify code examples compile/run"
  add_manual "Test that code examples actually work"
  echo "         → Copy examples to temp directory"
  echo "         → Try: npm install && npm run build"
  echo ""

  manual "MANUAL: Cross-file consistency check"
  add_manual "Ensure SKILL.md, README.md, and references/ are consistent"
  echo "         → Compare import statements"
  echo "         → Verify configuration examples match"
  echo ""
}

# ============================================================================
# Report Generation
# ============================================================================

generate_report() {
  local skill_name="$1"

  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  SKILL REVIEW REPORT: $skill_name"
  echo "═══════════════════════════════════════════════"
  echo ""

  # Critical issues
  if [ $CRITICAL -gt 0 ]; then
    echo -e "${RED}🔴 CRITICAL ($CRITICAL):${NC}"
    printf '  - %s\n' "${CRITICAL_LIST[@]}"
    echo ""
  fi

  # High issues
  if [ $HIGH -gt 0 ]; then
    echo -e "${YELLOW}🟡 HIGH ($HIGH):${NC}"
    printf '  - %s\n' "${HIGH_LIST[@]}"
    echo ""
  fi

  # Medium issues
  if [ $MEDIUM -gt 0 ]; then
    echo -e "${BLUE}🟠 MEDIUM ($MEDIUM):${NC}"
    printf '  - %s\n' "${MEDIUM_LIST[@]}"
    echo ""
  fi

  # Low issues
  if [ $LOW -gt 0 ]; then
    echo -e "${GREEN}🟢 LOW ($LOW):${NC}"
    printf '  - %s\n' "${LOW_LIST[@]}"
    echo ""
  fi

  # Manual checks
  if [ $MANUAL_CHECKS -gt 0 ]; then
    echo -e "${CYAN}${MANUAL} MANUAL VERIFICATION ($MANUAL_CHECKS):${NC}"
    printf '  - %s\n' "${MANUAL_LIST[@]}"
    echo ""
  fi

  echo "═══════════════════════════════════════════════"

  # Final assessment
  local total_issues=$((CRITICAL + HIGH + MEDIUM + LOW))

  if [ $CRITICAL -gt 0 ]; then
    error "REQUIRES IMMEDIATE ATTENTION"
    echo "  $CRITICAL critical issue(s) must be fixed"
    echo ""
    echo "  Recommendation: Comprehensive review required"
    echo "  Estimated effort: 2-4 hours"
    echo "  See: planning/SKILL_REVIEW_PROCESS.md"
    return 1
  elif [ $HIGH -gt 0 ]; then
    warning "REQUIRES ATTENTION"
    echo "  $HIGH high-priority issue(s) found"
    echo ""
    echo "  Recommendation: Fix high-priority issues"
    echo "  Estimated effort: 1-2 hours"
    return 0
  elif [ $total_issues -gt 0 ]; then
    info "ACCEPTABLE WITH MINOR ISSUES"
    echo "  $total_issues low/medium issue(s) found"
    echo ""
    echo "  Recommendation: Address when convenient"
    echo "  Estimated effort: 30-60 minutes"
    return 0
  else
    success "EXCELLENT - No automated issues found"
    echo ""
    echo "  Complete manual verification to confirm:"
    if [ $MANUAL_CHECKS -gt 0 ]; then
      echo "  - $MANUAL_CHECKS manual checks above"
    fi
    echo "  - API method accuracy"
    echo "  - Code example correctness"
    echo ""
    return 0
  fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
  local skill_name=""
  local quick_mode=false

  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --quick)
        quick_mode=true
        shift
        ;;
      --help)
        usage
        ;;
      *)
        if [ -z "$skill_name" ]; then
          skill_name="$1"
        fi
        shift
        ;;
    esac
  done

  if [ -z "$skill_name" ]; then
    error "Skill name required"
    echo ""
    usage
  fi

  echo "═══════════════════════════════════════════════"
  echo "   SKILL REVIEW: $skill_name"
  echo "═══════════════════════════════════════════════"
  if [ "$quick_mode" = true ]; then
    info "Mode: Quick check"
  else
    info "Mode: Comprehensive review"
  fi
  echo ""

  # Validate skill exists
  validate_skill_exists "$skill_name" || exit 1

  local skill_dir="$SKILLS_DIR/$skill_name"

  # Run automated checks
  check_yaml_frontmatter "$skill_dir/SKILL.md"
  check_package_versions "$skill_dir"

  if [ "$quick_mode" = false ]; then
    check_broken_links "$skill_dir"
    check_todo_markers "$skill_dir"
    check_file_organization "$skill_dir"
    generate_manual_checks "$skill_name"
  fi

  # Generate report
  generate_report "$skill_name"
  exit_code=$?

  echo ""
  echo "Next steps:"
  echo "1. Review findings above"
  echo "2. Complete manual verification checks"
  echo "3. Follow: planning/SKILL_REVIEW_PROCESS.md"
  echo "4. Fix issues and update skill"
  echo ""

  exit $exit_code
}

# Run main if executed directly
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
  main "$@"
fi

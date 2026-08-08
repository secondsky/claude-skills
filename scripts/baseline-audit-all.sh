#!/usr/bin/env bash

# baseline-audit-all.sh - Run quick automated checks on all skills
# Generates summary data for SKILLS_REVIEW_PROGRESS.md
# Usage: ./scripts/baseline-audit-all.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Skills live under plugins/<plugin>/skills/<skill>/ and .agents/skills/<skill>/
# (the repo was restructured away from a flat top-level skills/ directory).
PLUGINS_DIR="$REPO_ROOT/plugins"
AGENTS_SKILLS_DIR="$REPO_ROOT/.agents/skills"
REVIEW_SCRIPT="$REPO_ROOT/scripts/review-skill.sh"
OUTPUT_FILE="$REPO_ROOT/planning/baseline-audit-results.txt"

# List all skill names (one per SKILL.md) across the supported layouts.
all_skill_names() {
  find "$PLUGINS_DIR" -mindepth 4 -maxdepth 4 -type f -name "SKILL.md" \
    -path "*/skills/*/SKILL.md" 2>/dev/null \
    | sed 's#.*/skills/##; s#/SKILL\.md$##' | sort -u
  find "$AGENTS_SKILLS_DIR" -mindepth 2 -maxdepth 2 -type f -name "SKILL.md" 2>/dev/null \
    | sed 's#.*/skills/##; s#/SKILL\.md$##' | sort -u
}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_SKILLS=0
COMPLETED=0
CRITICAL_SKILLS=0
HIGH_SKILLS=0
MEDIUM_SKILLS=0
CLEAN_SKILLS=0

# Check review script exists
if [ ! -x "$REVIEW_SCRIPT" ]; then
  echo -e "${RED}Error: review-skill.sh not found or not executable${NC}"
  exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "  BASELINE AUDIT: All Skills"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Starting baseline audit..."
echo "Output will be saved to: $OUTPUT_FILE"
echo ""

# Ensure the output directory exists (planning/ is not guaranteed to be
# present; without this the `cat >` below fails under `set -e` before any
# skill is processed).
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Initialize output file
cat > "$OUTPUT_FILE" << 'EOF'
# Baseline Audit Results
# Generated: $(date +"%Y-%m-%d %H:%M:%S")
#
# Format: SKILL_NAME | CRITICAL | HIGH | MEDIUM | LOW | STATUS | NOTES
#
EOF

# Get all skill names (across plugins/ and .agents/skills/)
SKILLS=($(all_skill_names))
TOTAL_SKILLS=${#SKILLS[@]}

echo "Found $TOTAL_SKILLS skills to audit"
echo ""

# Process each skill
for skill in "${SKILLS[@]}"; do
  # `((VAR++))` returns exit status 1 when VAR is 0; under `set -e` this would
  # abort the audit on the first skill (same bug class fixed in review-skill.sh).
  ((COMPLETED++)) || true

  echo -ne "[$COMPLETED/$TOTAL_SKILLS] Checking $skill..."

  # Run review script in quick mode, capture output
  output=$("$REVIEW_SCRIPT" "$skill" --quick 2>&1 || true)

  # Extract issue counts
  critical=$(echo "$output" | grep -o "🔴 CRITICAL ([0-9]*)" | grep -o "[0-9]*" || echo "0")
  high=$(echo "$output" | grep -o "🟡 HIGH ([0-9]*)" | grep -o "[0-9]*" || echo "0")
  medium=$(echo "$output" | grep -o "🟠 MEDIUM ([0-9]*)" | grep -o "[0-9]*" || echo "0")
  low=$(echo "$output" | grep -o "🟢 LOW ([0-9]*)" | grep -o "[0-9]*" || echo "0")

  # Determine status
  status="CLEAN"
  priority="🟢 Low"

  if [ "$critical" -gt 0 ]; then
    ((CRITICAL_SKILLS++)) || true
    status="CRITICAL"
    priority="🔴 Critical"
    echo -e " ${RED}CRITICAL${NC} (${critical} critical, ${high} high, ${medium} medium)"
  elif [ "$high" -gt 0 ]; then
    ((HIGH_SKILLS++)) || true
    status="HIGH"
    priority="🟡 High"
    echo -e " ${YELLOW}HIGH${NC} (${high} high, ${medium} medium)"
  elif [ "$medium" -gt 0 ]; then
    ((MEDIUM_SKILLS++)) || true
    status="MEDIUM"
    priority="🟠 Medium"
    echo -e " ${BLUE}MEDIUM${NC} (${medium} medium, ${low} low)"
  else
    ((CLEAN_SKILLS++)) || true
    echo -e " ${GREEN}CLEAN${NC}"
  fi

  # Extract specific issues for notes
  notes=""
  if echo "$output" | grep -q "Missing YAML frontmatter"; then
    notes="$notes NO_YAML"
  fi
  if echo "$output" | grep -q "Name mismatch"; then
    notes="$notes NAME_MISMATCH"
  fi
  if echo "$output" | grep -q "Last verified.*days ago"; then
    # Default to 0 so a missing/empty match doesn't make `[ "" -gt 90 ]` throw
    # "integer expression expected" under set -e/u and abort the audit.
    days=$(echo "$output" | grep -o "Last verified [0-9]* days ago" | grep -o "[0-9]*" || echo "0")
    [ -z "$days" ] && days=0
    if [ "$days" -gt 90 ]; then
      notes="$notes STALE_${days}d"
    fi
  fi
  if echo "$output" | grep -q "hasn't been verified"; then
    notes="$notes NO_VERIFICATION"
  fi

  # Write to output file
  echo "$skill|$critical|$high|$medium|$low|$status|$priority|$notes" >> "$OUTPUT_FILE"
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  BASELINE AUDIT COMPLETE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  Total Skills:     $TOTAL_SKILLS"
echo "  🔴 Critical:      $CRITICAL_SKILLS (immediate attention)"
echo "  🟡 High:          $HIGH_SKILLS (fix soon)"
echo "  🟠 Medium:        $MEDIUM_SKILLS (minor issues)"
echo "  🟢 Clean:         $CLEAN_SKILLS (no issues found)"
echo ""
echo "Results saved to: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Review $OUTPUT_FILE for detailed breakdown"
echo "2. Update planning/SKILLS_REVIEW_PROGRESS.md"
echo "3. Prioritize critical/high issues"
echo "4. Begin systematic reviews"
echo ""

# Generate summary statistics
echo "## Summary Statistics" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "- Total Skills: $TOTAL_SKILLS" >> "$OUTPUT_FILE"
echo "- Critical Priority: $CRITICAL_SKILLS" >> "$OUTPUT_FILE"
echo "- High Priority: $HIGH_SKILLS" >> "$OUTPUT_FILE"
echo "- Medium Priority: $MEDIUM_SKILLS" >> "$OUTPUT_FILE"
echo "- Clean: $CLEAN_SKILLS" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

exit 0

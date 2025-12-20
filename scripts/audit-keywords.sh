#!/bin/bash
# =============================================================================
# Keyword Audit Script - Comprehensive Analysis of All Skills
# =============================================================================
# Audits all plugin.json files for semantically incorrect keywords
#
# Usage:
#   ./scripts/audit-keywords.sh > audit-results.json
#
# Output: JSON array of issues found
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$ROOT_DIR/skills"

# Color output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "=== Keyword Audit - All Skills ===" >&2
echo "" >&2

# Initialize counters
total_skills=0
total_issues=0

# JSON output array
echo "["

first_skill=true

# Iterate through all skills
for skill_dir in "$SKILLS_DIR"/*; do
  if [ ! -d "$skill_dir" ]; then
    continue
  fi

  skill_name=$(basename "$skill_dir")
  plugin_json="$skill_dir/.claude-plugin/plugin.json"

  if [ ! -f "$plugin_json" ]; then
    continue
  fi

  total_skills=$((total_skills + 1))

  # Extract data from plugin.json
  category=$(jq -r '.category // "unknown"' "$plugin_json" 2>/dev/null)
  keywords_json=$(jq -r '.keywords // []' "$plugin_json" 2>/dev/null)
  keywords_array=$(echo "$keywords_json" | jq -r '.[]' 2>/dev/null | tr '\n' ',' | sed 's/,$//')

  # Array to store issues for this skill
  issues=()

  # ==========================================================================
  # MISMATCH PATTERN CHECKS
  # ==========================================================================

  # 1. Frontend Framework Mismatches
  # -------------------------------------------------------------------------
  if [[ "$skill_name" =~ ^(nuxt|pinia|vue) ]]; then
    # Vue/Nuxt skills should NOT have "react"
    if echo "$keywords_array" | grep -qiE '\breact\b'; then
      issues+=('{"type":"framework_mismatch","severity":"high","keyword":"react","reason":"Vue/Nuxt skill has React keyword"}')
    fi
  fi

  if [[ "$skill_name" =~ ^(next|react) ]] && [[ ! "$skill_name" =~ nuxt ]]; then
    # React/Next.js skills should NOT have "vue"
    if echo "$keywords_array" | grep -qi ",vue," || echo "$keywords_array" | grep -qi "^vue,"; then
      issues+=('{"type":"framework_mismatch","severity":"high","keyword":"vue","reason":"React/Next.js skill has Vue keyword"}')
    fi
  fi

  # 2. Database Type Mismatches
  # -------------------------------------------------------------------------
  if [[ "$skill_name" =~ (kv|redis|mongo) ]]; then
    # NoSQL/KV stores should NOT have SQL keywords
    if echo "$keywords_array" | grep -qi "\\borm\\b"; then
      issues+=('{"type":"database_mismatch","severity":"critical","keyword":"orm","reason":"NoSQL/KV skill has ORM keyword (for SQL databases)"}')
    fi
    if echo "$keywords_array" | grep -qi "\\bsql\\b"; then
      issues+=('{"type":"database_mismatch","severity":"critical","keyword":"sql","reason":"NoSQL/KV skill has SQL keyword"}')
    fi
    if echo "$keywords_array" | grep -qi "migrations"; then
      issues+=('{"type":"database_mismatch","severity":"high","keyword":"migrations","reason":"NoSQL/KV skill has migrations keyword (for SQL schemas)"}')
    fi
  fi

  if [[ "$skill_name" =~ (postgres|mysql|sql) ]] && [[ ! "$skill_name" =~ nosql ]]; then
    # SQL databases should NOT have NoSQL keywords
    if echo "$keywords_array" | grep -qi "nosql"; then
      issues+=('{"type":"database_mismatch","severity":"high","keyword":"nosql","reason":"SQL database skill has NoSQL keyword"}')
    fi
    if echo "$keywords_array" | grep -qi "document"; then
      issues+=('{"type":"database_mismatch","severity":"medium","keyword":"document","reason":"SQL database skill has document keyword (for NoSQL)"}')
    fi
  fi

  # 3. Platform Mismatches
  # -------------------------------------------------------------------------
  if [[ "$skill_name" =~ ^swift ]] && [[ ! "$skill_name" =~ android ]]; then
    # Swift/iOS skills should NOT have "android"
    if echo "$keywords_array" | grep -qi "android"; then
      issues+=('{"type":"platform_mismatch","severity":"high","keyword":"android","reason":"iOS/Swift skill has Android keyword"}')
    fi
  fi

  # 4. Cloud Provider Mismatches
  # -------------------------------------------------------------------------
  if [[ "$skill_name" =~ ^cloudflare ]]; then
    # Cloudflare skills should NOT have AWS/Vercel keywords (unless explicitly multi-cloud)
    if echo "$keywords_array" | grep -qi "\\baws\\b"; then
      issues+=('{"type":"cloud_mismatch","severity":"medium","keyword":"aws","reason":"Cloudflare skill has AWS keyword"}')
    fi
    # Exception: cloudflare-nextjs can have "vercel" (deployment comparison)
    if [[ ! "$skill_name" =~ nextjs ]] && echo "$keywords_array" | grep -qi "vercel"; then
      issues+=('{"type":"cloud_mismatch","severity":"low","keyword":"vercel","reason":"Cloudflare skill has Vercel keyword"}')
    fi
  fi

  if [[ "$skill_name" =~ ^vercel ]]; then
    # Vercel skills should NOT have Cloudflare keywords
    if echo "$keywords_array" | grep -qi "cloudflare"; then
      issues+=('{"type":"cloud_mismatch","severity":"medium","keyword":"cloudflare","reason":"Vercel skill has Cloudflare keyword"}')
    fi
  fi

  # 5. Overly Generic Keywords on Specific Skills
  # -------------------------------------------------------------------------
  if [[ "$category" == "cloudflare" ]]; then
    # Cloudflare skills don't need generic "serverless" (they're specifically Workers)
    if echo "$keywords_array" | grep -qi "serverless" && [[ ! "$skill_name" =~ (function|lambda) ]]; then
      issues+=('{"type":"generic_keyword","severity":"low","keyword":"serverless","reason":"Cloudflare skill has generic serverless keyword (use workers instead)"}')
    fi
  fi

  # ==========================================================================
  # OUTPUT RESULTS
  # ==========================================================================

  if [ ${#issues[@]} -gt 0 ]; then
    total_issues=$((total_issues + ${#issues[@]}))

    # Add comma if not first skill
    if [ "$first_skill" = false ]; then
      echo ","
    fi
    first_skill=false

    # Build JSON object for this skill
    echo "  {"
    echo "    \"skill\": \"$skill_name\","
    echo "    \"category\": \"$category\","
    echo "    \"issues_count\": ${#issues[@]},"
    echo "    \"issues\": ["

    # Output issues
    first_issue=true
    for issue in "${issues[@]}"; do
      if [ "$first_issue" = false ]; then
        echo ","
      fi
      first_issue=false
      echo "      $issue"
    done

    echo "    ]"
    echo -n "  }"
  fi

done

# Close JSON array
echo ""
echo "]"

# Summary to stderr
echo "" >&2
echo "=== Audit Summary ===" >&2
echo "Skills audited: $total_skills" >&2
echo "Issues found: $total_issues" >&2
echo "" >&2

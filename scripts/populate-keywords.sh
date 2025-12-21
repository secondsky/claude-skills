#!/bin/bash
# =============================================================================
# DEPRECATED: Use ./scripts/sync-plugins.sh instead
# =============================================================================
# This script is kept for reference only. All keyword generation is now
# handled by the unified sync-plugins.sh script which:
# - Generates keywords from skill name, category, and description
# - Syncs version across all plugin.json files
# - Adds category field
# - Detects agents and commands directories
# - Regenerates marketplace.json
#
# Migration: Run ./scripts/sync-plugins.sh instead of this script
# =============================================================================
#
# [ORIGINAL DESCRIPTION]
# Populate keywords for skills
# Generates keywords based on skill name, description, SKILL.md, and category
#
# Usage: ./scripts/populate-keywords.sh [--force]
#   --force: Re-process ALL skills (including those with existing keywords)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$(cd "$SCRIPT_DIR/../skills" && pwd)"

# Parse args
FORCE_MODE=false
if [[ "$1" == "--force" ]]; then
  FORCE_MODE=true
fi

echo "============================================"
echo "Populating Keywords for Skills"
if [ "$FORCE_MODE" = true ]; then
  echo "Mode: FORCE (re-processing ALL skills)"
fi
echo "============================================"
echo ""
echo "Skills directory: $SKILLS_DIR"
echo ""

# Function to categorize skill
categorize_skill() {
  local skill_name="$1"

  if [[ "$skill_name" =~ ^cloudflare- ]]; then echo "cloudflare"
  elif [[ "$skill_name" =~ ^(app-store-deployment|mobile-|react-native-app|swift-) ]]; then echo "mobile"
  elif [[ "$skill_name" =~ ^(claude-code-|claude-hook-) ]]; then echo "tooling"
  elif [[ "$skill_name" =~ ^(ai-|openai-|claude-|google-gemini-|gemini-|elevenlabs-|thesys-|multi-ai-consultant|tanstack-ai|ml-|model-deployment) ]]; then echo "ai"
  elif [[ "$skill_name" =~ ^(nextjs|nuxt-|react-|pinia-|zustand-|tanstack-query|tanstack-router|tanstack-start|tanstack-table|tailwind-|shadcn-|aceternity-ui|inspira-ui|base-ui-react|auto-animate|motion|ultracite) ]]; then echo "frontend"
  elif [[ "$skill_name" =~ ^(better-auth|clerk-auth|oauth-implementation) ]]; then echo "auth"
  elif [[ "$skill_name" =~ ^(content-collections|hugo|nuxt-content|sveltia-cms|wordpress-plugin-core) ]]; then echo "cms"
  elif [[ "$skill_name" =~ ^(database-|drizzle-|neon-|vercel-blob|vercel-kv) ]]; then echo "database"
  elif [[ "$skill_name" =~ ^(api-|graphql-|rest-api-design|websocket-implementation) ]]; then echo "api"
  elif [[ "$skill_name" =~ ^(jest-generator|mutation-testing|playwright-testing|test-quality-analysis|vitest-testing) ]]; then echo "testing"
  elif [[ "$skill_name" =~ ^(access-control-rbac|csrf-protection|defense-in-depth-validation|security-headers-configuration|vulnerability-scanning|xss-prevention) ]]; then echo "security"
  elif [[ "$skill_name" =~ ^woocommerce- ]]; then echo "woocommerce"
  elif [[ "$skill_name" =~ ^(firecrawl-scraper|hono-routing|image-optimization|internationalization-i18n|payment-gateway-integration|progressive-web-app|push-notification-setup|responsive-web-design|session-management|web-performance-) ]]; then echo "web"
  elif [[ "$skill_name" =~ ^seo- ]]; then echo "seo"
  elif [[ "$skill_name" =~ ^(design-|interaction-design|kpi-dashboard-design|mobile-first-design) ]]; then echo "design"
  elif [[ "$skill_name" =~ ^(recommendation-|sql-query-optimization) ]]; then echo "data"
  elif [[ "$skill_name" =~ ^technical-specification ]]; then echo "documentation"
  elif [[ "$skill_name" =~ ^(architecture-patterns|health-check-endpoints|microservices-patterns) ]]; then echo "architecture"
  else echo "tooling"
  fi
}

# Function to get category-specific keywords
get_category_keywords() {
  local category="$1"

  case "$category" in
    "cloudflare") echo "cloudflare,workers,edge,serverless,wrangler" ;;
    "ai") echo "ai,machine-learning,ml,llm,artificial-intelligence" ;;
    "frontend") echo "frontend,ui,components,react,typescript" ;;
    "auth") echo "authentication,authorization,login,security,session" ;;
    "database") echo "database,orm,sql,storage,query" ;;
    "api") echo "api,rest,graphql,endpoints,http" ;;
    "testing") echo "testing,tests,unit-tests,integration,quality" ;;
    "security") echo "security,vulnerability,protection,csrf,xss" ;;
    "mobile") echo "mobile,ios,android,app,native" ;;
    "web") echo "web,performance,optimization,pwa" ;;
    "seo") echo "seo,search,keywords,optimization,ranking" ;;
    "design") echo "design,ui,ux,interface,user-experience" ;;
    "data") echo "data,analytics,processing,sql,queries" ;;
    "documentation") echo "documentation,docs,technical-writing,specs" ;;
    "architecture") echo "architecture,patterns,microservices,design" ;;
    "woocommerce") echo "woocommerce,wordpress,ecommerce,shop" ;;
    "cms") echo "cms,content,management,publishing" ;;
    *) echo "development,tooling,workflow" ;;
  esac
}

# Function to generate keywords from skill name
# NOTE: Only adds hyphenated name, NOT space-separated (to avoid duplicates)
generate_name_keywords() {
  local skill_name="$1"
  local keywords=""

  # Add full name (with hyphens only - no space-separated duplicate)
  keywords="$skill_name"

  # Add individual parts longer than 2 chars
  IFS='-' read -ra parts <<< "$skill_name"
  for part in "${parts[@]}"; do
    if [ ${#part} -gt 2 ]; then
      keywords="$keywords,$part"
    fi
  done

  # Add pairs of parts (for multi-word search)
  for ((i=0; i<${#parts[@]}-1; i++)); do
    keywords="$keywords,${parts[i]} ${parts[i+1]}"
  done

  echo "$keywords"
}

# NEW: Extract keywords from plugin.json description
extract_description_keywords() {
  local description="$1"
  local keywords=""

  # Extract capitalized technical terms (REST, GraphQL, JWT, OAuth, API, etc.)
  local caps_terms=$(echo "$description" | grep -oE '\b[A-Z][A-Z0-9]+\b' 2>/dev/null | sort -u | tr '\n' ',' | tr '[:upper:]' '[:lower:]')
  keywords="$caps_terms"

  # Extract CamelCase terms (NextJs, TypeScript, etc.)
  local camel_terms=$(echo "$description" | grep -oE '\b[A-Z][a-z]+[A-Z][a-zA-Z]*\b' 2>/dev/null | sort -u | tr '\n' ',' | tr '[:upper:]' '[:lower:]')
  keywords="$keywords$camel_terms"

  # Extract common valuable technical terms from description
  local valuable_terms="scalable maintainable production authentication authorization validation optimization integration implementation configuration deployment migration refactoring serverless edge caching streaming realtime real-time webhooks async asynchronous"

  for term in $valuable_terms; do
    if echo "$description" | grep -qi "\b$term"; then
      keywords="$keywords,$term"
    fi
  done

  echo "$keywords"
}

# NEW: Extract keywords from SKILL.md metadata.keywords if present
extract_skillmd_keywords() {
  local skill_md="$1"

  if [ ! -f "$skill_md" ]; then
    echo ""
    return
  fi

  # Look for keywords in YAML frontmatter metadata section
  # Pattern: metadata: -> keywords: -> list items starting with "    - "
  local metadata_keywords=$(awk '/^metadata:/,/^[a-z]/' "$skill_md" 2>/dev/null | \
    awk '/keywords:/,/^  [a-z]/' | \
    grep '^\s*- ' | \
    sed 's/^\s*- //' | \
    tr '\n' ',' || echo "")

  echo "$metadata_keywords"
}

# Generate and format keywords as JSON array
generate_keywords_json() {
  local skill_name="$1"
  local category="$2"
  local description="$3"
  local skill_md="$4"

  # Collect keywords from all sources
  local name_kw=$(generate_name_keywords "$skill_name")
  local cat_kw=$(get_category_keywords "$category")
  local desc_kw=$(extract_description_keywords "$description")
  local md_kw=$(extract_skillmd_keywords "$skill_md")

  # Combine all keywords
  local all_kw="$name_kw,$cat_kw,$desc_kw,$md_kw"

  # Convert to JSON array with deduplication
  local json_array="["
  local first=true
  local seen=""

  IFS=',' read -ra keywords <<< "$all_kw"
  for kw in "${keywords[@]}"; do
    # Clean: trim whitespace, lowercase
    kw=$(echo "$kw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')

    # Skip empty, too short (<=2 chars), or already seen
    if [ -z "$kw" ] || [ ${#kw} -le 2 ] || [[ "$seen" == *"|$kw|"* ]]; then
      continue
    fi
    seen="$seen|$kw|"

    if [ "$first" = true ]; then
      first=false
    else
      json_array="$json_array,"
    fi
    json_array="$json_array\"$kw\""
  done

  json_array="$json_array]"
  echo "$json_array"
}

# Counter for tracking progress
count=0
updated=0
skipped=0
total=$(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

echo "Scanning $total skills..."
echo ""

# Process each skill
for skill_dir in $(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | sort); do
  skill_name=$(basename "$skill_dir")
  plugin_json="$skill_dir/.claude-plugin/plugin.json"
  skill_md="$skill_dir/SKILL.md"

  count=$((count + 1))

  # Check if plugin.json exists
  if [ ! -f "$plugin_json" ]; then
    printf "[%3d/%d] %-40s SKIP (no plugin.json)\n" "$count" "$total" "$skill_name"
    skipped=$((skipped + 1))
    continue
  fi

  # Check if keywords are already populated (skip unless --force)
  keyword_count=$(jq '.keywords | length' "$plugin_json" 2>/dev/null || echo "0")
  if [ "$keyword_count" -gt 0 ] && [ "$FORCE_MODE" = false ]; then
    printf "[%3d/%d] %-40s OK (%d keywords)\n" "$count" "$total" "$skill_name" "$keyword_count"
    continue
  fi

  # Get description from plugin.json
  description=$(jq -r '.description // ""' "$plugin_json" 2>/dev/null)

  # Get category
  category=$(categorize_skill "$skill_name")

  # Generate keywords JSON
  keywords_json=$(generate_keywords_json "$skill_name" "$category" "$description" "$skill_md")

  # Update plugin.json
  jq --argjson kw "$keywords_json" '.keywords = $kw' "$plugin_json" > "$plugin_json.tmp" && \
    mv "$plugin_json.tmp" "$plugin_json"

  # Count new keywords
  new_count=$(jq '.keywords | length' "$plugin_json")

  printf "[%3d/%d] %-40s UPDATED (%d keywords)\n" "$count" "$total" "$skill_name" "$new_count"
  updated=$((updated + 1))
done

echo ""
echo "============================================"
echo "Keywords Population Complete"
echo "============================================"
echo ""
echo "Skills processed: $count"
echo "Skills updated: $updated"
echo "Skills skipped: $skipped"
echo "Skills unchanged: $((count - updated - skipped))"
echo ""
echo "Next steps:"
echo "1. Review: jq '.keywords' skills/api-design-principles/.claude-plugin/plugin.json"
echo "2. Regenerate: ./scripts/generate-marketplace.sh"
echo "3. Validate: jq '[.plugins[] | select(.keywords | length == 0)] | length' .claude-plugin/marketplace.json"
echo ""

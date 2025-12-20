#!/bin/bash
# =============================================================================
# Unified Plugin Synchronization Script
# =============================================================================
# Single entry point for all plugin management in claude-skills repository.
#
# This script consolidates functionality from:
#   - generate-plugin-manifests.sh (deprecated)
#   - populate-keywords.sh (deprecated)
#   - generate-marketplace.sh (still used for marketplace generation)
#
# Features:
#   1. Syncs version from marketplace.json to all plugin.json files
#   2. Adds/updates category field based on skill name patterns
#   3. Detects agents/ directory → adds agents array
#   4. Detects commands/ directory → adds commands array
#   5. Generates keywords from skill name, category, and description
#   6. Regenerates marketplace.json with updated data
#
# Usage:
#   ./scripts/sync-plugins.sh           # Full sync
#   ./scripts/sync-plugins.sh --dry-run # Preview changes without modifying
#   ./scripts/sync-plugins.sh --help    # Show help
#
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$ROOT_DIR/skills"
MARKETPLACE_JSON="$ROOT_DIR/.claude-plugin/marketplace.json"

# Parse arguments
DRY_RUN=false
VERBOSE=false
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --verbose|-v) VERBOSE=true ;;
    --help|-h)
      echo "Usage: $0 [--dry-run] [--verbose]"
      echo ""
      echo "Options:"
      echo "  --dry-run   Preview changes without modifying files"
      echo "  --verbose   Show detailed output"
      echo "  --help      Show this help message"
      exit 0
      ;;
  esac
done

echo "============================================"
echo "Claude Skills - Plugin Sync"
echo "============================================"
if [ "$DRY_RUN" = true ]; then
  echo "Mode: DRY RUN (no files will be modified)"
fi
echo ""

# -----------------------------------------------------------------------------
# Read global version from marketplace.json
# -----------------------------------------------------------------------------
GLOBAL_VERSION=$(jq -r '.metadata.version // "1.0.0"' "$MARKETPLACE_JSON" 2>/dev/null)
echo "Global version: $GLOBAL_VERSION"
echo "Skills directory: $SKILLS_DIR"
echo ""

# -----------------------------------------------------------------------------
# Function: Categorize skill based on name patterns
# -----------------------------------------------------------------------------
categorize_skill() {
  local skill_name="$1"

  if [[ "$skill_name" =~ ^cloudflare- ]]; then echo "cloudflare"
  elif [[ "$skill_name" =~ ^(app-store-deployment|mobile-|react-native-app|swift-) ]]; then echo "mobile"
  elif [[ "$skill_name" =~ ^(claude-code-|claude-hook-) ]]; then echo "tooling"
  elif [[ "$skill_name" =~ ^(ai-|openai-|claude-|google-gemini-|gemini-|elevenlabs-|thesys-|multi-ai-consultant|tanstack-ai|ml-|model-deployment) ]]; then echo "ai"
  elif [[ "$skill_name" =~ ^(nextjs|nuxt-|react-|pinia-|zustand-|tanstack-query|tanstack-router|tanstack-start|tanstack-table|tailwind-|shadcn-|aceternity-ui|inspira-ui|base-ui-react|auto-animate|motion|ultracite) ]]; then echo "frontend"
  elif [[ "$skill_name" =~ ^(better-auth|clerk-auth|oauth-implementation) ]]; then echo "auth"
  elif [[ "$skill_name" =~ ^(content-collections|hugo|nuxt-content|sveltia-cms|wordpress-plugin-core) ]]; then echo "cms"
  elif [[ "$skill_name" =~ ^(vercel-blob) ]]; then echo "storage"
  elif [[ "$skill_name" =~ ^(database-|drizzle-|neon-|vercel-kv) ]]; then echo "database"
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

# -----------------------------------------------------------------------------
# Function: Get category-specific keywords
# -----------------------------------------------------------------------------
get_category_keywords() {
  local category="$1"

  case "$category" in
    "cloudflare") echo "cloudflare,workers,edge,serverless,wrangler" ;;
    "ai") echo "ai,machine-learning,ml,llm,artificial-intelligence" ;;
    "frontend") echo "frontend,ui,components,typescript" ;;
    "auth") echo "authentication,authorization,login,security,session" ;;
    "storage") echo "storage,object-storage,blob,upload,files,cdn,assets" ;;
    "database") echo "database,orm,sql,query,migrations" ;;
    "api") echo "api,rest,graphql,endpoints,http" ;;
    "testing") echo "testing,tests,unit-tests,integration,quality" ;;
    "security") echo "security,vulnerability,protection,csrf,xss" ;;
    "mobile") echo "mobile,app,native" ;;
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

# -----------------------------------------------------------------------------
# Function: Generate keywords from skill name (no duplicates)
# -----------------------------------------------------------------------------
generate_name_keywords() {
  local skill_name="$1"
  local keywords="$skill_name"

  # Add individual parts longer than 2 chars
  IFS='-' read -ra parts <<< "$skill_name"
  for part in "${parts[@]}"; do
    if [ ${#part} -gt 2 ]; then
      keywords="$keywords,$part"
    fi
  done

  # Note: Space-separated pairs (e.g., "openai agents") removed to avoid
  # duplicating the hyphenated name (e.g., "openai-agents")

  echo "$keywords"
}

# -----------------------------------------------------------------------------
# Function: Extract keywords from description
# -----------------------------------------------------------------------------
extract_description_keywords() {
  local description="$1"
  local keywords=""

  # Extract capitalized technical terms (REST, GraphQL, JWT, etc.)
  local caps_terms=$(echo "$description" | grep -oE '\b[A-Z][A-Z0-9]+\b' 2>/dev/null | sort -u | tr '\n' ',' | tr '[:upper:]' '[:lower:]')
  keywords="$caps_terms"

  # Extract CamelCase terms
  local camel_terms=$(echo "$description" | grep -oE '\b[A-Z][a-z]+[A-Z][a-zA-Z]*\b' 2>/dev/null | sort -u | tr '\n' ',' | tr '[:upper:]' '[:lower:]')
  keywords="$keywords$camel_terms"

  # Extract valuable technical terms
  local valuable_terms="scalable maintainable production authentication authorization validation optimization integration implementation configuration deployment migration refactoring serverless edge caching streaming realtime real-time webhooks async asynchronous"

  for term in $valuable_terms; do
    if echo "$description" | grep -qi "\b$term"; then
      keywords="$keywords,$term"
    fi
  done

  echo "$keywords"
}

# -----------------------------------------------------------------------------
# Function: Extract explicit keywords from "Keywords: ..." line in description
# -----------------------------------------------------------------------------
extract_explicit_keywords() {
  local description="$1"
  local keywords=""

  # Look for "Keywords: ..." line in description
  if echo "$description" | grep -q "Keywords:"; then
    # Extract everything after "Keywords:" until end of line/description
    keywords=$(echo "$description" | sed -n 's/.*Keywords:\s*\(.*\)/\1/p' | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' | tr '\n' ',')
  fi

  echo "$keywords"
}

# -----------------------------------------------------------------------------
# Function: Remove "Keywords: ..." line from description
# -----------------------------------------------------------------------------
remove_keywords_line() {
  local description="$1"

  # Remove "Keywords: ..." portion from description
  echo "$description" | sed 's/Keywords:.*$//' | sed 's/[[:space:]]*$//'
}

# -----------------------------------------------------------------------------
# Function: Generate keywords JSON array with deduplication
# -----------------------------------------------------------------------------
generate_keywords_json() {
  local skill_name="$1"
  local category="$2"
  local description="$3"

  # Collect from all sources
  # PRIORITY ORDER: 1) Explicit keywords from SKILL.md, 2) Name, 3) Category, 4) Auto-extracted
  local explicit_kw=$(extract_explicit_keywords "$description")
  local name_kw=$(generate_name_keywords "$skill_name")
  local cat_kw=$(get_category_keywords "$category")
  local desc_kw=$(extract_description_keywords "$description")

  # If explicit keywords exist, prioritize them over category defaults
  if [ -n "$explicit_kw" ]; then
    local all_kw="$name_kw,$explicit_kw,$desc_kw"
  else
    local all_kw="$name_kw,$cat_kw,$desc_kw"
  fi

  # Convert to JSON array with deduplication
  local json_array="["
  local first=true
  local seen=""

  IFS=',' read -ra keywords <<< "$all_kw"
  for kw in "${keywords[@]}"; do
    kw=$(echo "$kw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')
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

# -----------------------------------------------------------------------------
# Function: Scan for agents (agents/*.md files)
# -----------------------------------------------------------------------------
scan_agents() {
  local skill_dir="$1"
  local agents_dir="$skill_dir/agents"
  local json_array="null"

  if [ -d "$agents_dir" ]; then
    local agents=$(find "$agents_dir" -name "*.md" -type f 2>/dev/null | sort)
    if [ -n "$agents" ]; then
      json_array="["
      local first=true
      while IFS= read -r agent_file; do
        local relative_path="./agents/$(basename "$agent_file")"
        if [ "$first" = true ]; then
          first=false
        else
          json_array="$json_array,"
        fi
        json_array="$json_array\"$relative_path\""
      done <<< "$agents"
      json_array="$json_array]"
    fi
  fi

  echo "$json_array"
}

# -----------------------------------------------------------------------------
# Function: Scan for commands (commands/*.md files)
# -----------------------------------------------------------------------------
scan_commands() {
  local skill_dir="$1"
  local commands_dir="$skill_dir/commands"
  local json_array="null"

  if [ -d "$commands_dir" ]; then
    local commands=$(find "$commands_dir" -name "*.md" -type f 2>/dev/null | sort)
    if [ -n "$commands" ]; then
      json_array="["
      local first=true
      while IFS= read -r cmd_file; do
        local relative_path="./commands/$(basename "$cmd_file")"
        if [ "$first" = true ]; then
          first=false
        else
          json_array="$json_array,"
        fi
        json_array="$json_array\"$relative_path\""
      done <<< "$commands"
      json_array="$json_array]"
    fi
  fi

  echo "$json_array"
}

# -----------------------------------------------------------------------------
# Main processing loop
# -----------------------------------------------------------------------------
count=0
updated=0
skipped=0
total=$(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

echo "Processing $total skills..."
echo ""

for skill_dir in $(find "$SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d | sort); do
  skill_name=$(basename "$skill_dir")
  plugin_dir="$skill_dir/.claude-plugin"
  plugin_json="$plugin_dir/plugin.json"
  skill_md="$skill_dir/SKILL.md"

  count=$((count + 1))

  # Skip if no SKILL.md
  if [ ! -f "$skill_md" ]; then
    printf "[%3d/%d] %-40s SKIP (no SKILL.md)\n" "$count" "$total" "$skill_name"
    skipped=$((skipped + 1))
    continue
  fi

  # Create .claude-plugin directory if needed
  if [ ! -d "$plugin_dir" ]; then
    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$plugin_dir"
    fi
  fi

  # Get current values or defaults
  if [ -f "$plugin_json" ]; then
    current_author=$(jq -c '.author // {"name": "Claude Skills Maintainers", "email": "maintainers@example.com"}' "$plugin_json" 2>/dev/null)
  else
    current_author='{"name": "Claude Skills Maintainers", "email": "maintainers@example.com"}'
  fi

  # ALWAYS extract description from SKILL.md (source of truth)
  # Only search within first YAML frontmatter block (between first two --- delimiters)
  current_desc=$(awk '
    BEGIN {in_frontmatter=0; found_desc=0}
    /^---$/ {
      frontmatter_count++
      if (frontmatter_count==1) {in_frontmatter=1; next}
      if (frontmatter_count==2) {exit}
    }
    in_frontmatter && /^description:/ {
      if ($0 !~ /[\|>]$/) {
        gsub(/^description: */, "")
        print
        exit
      }
    }
  ' "$skill_md")
  if [ -z "$current_desc" ]; then
    current_desc=$(awk '
      BEGIN {in_frontmatter=0}
      /^---$/ {
        frontmatter_count++
        if (frontmatter_count==1) {in_frontmatter=1; next}
        if (frontmatter_count==2) {exit}
      }
      in_frontmatter && /^description: [\|>]/{flag=1; next}
      in_frontmatter && /^[a-z-]+:/{flag=0}
      flag && /^  /{gsub(/^  /, ""); line=line $0 " "}
      END{gsub(/ $/, "", line); print line}
    ' "$skill_md")
  fi
  if [ -z "$current_desc" ] || [ "$current_desc" = "|" ] || [ "$current_desc" = ">" ]; then
    current_desc="Production-ready skill for $skill_name"
  fi

  # Get category
  category=$(categorize_skill "$skill_name")

  # Generate keywords (uses full description with Keywords line for extraction)
  keywords_json=$(generate_keywords_json "$skill_name" "$category" "$current_desc")

  # Remove "Keywords: ..." line from description for plugin.json output
  clean_desc=$(remove_keywords_line "$current_desc")

  # Scan for agents and commands
  agents_json=$(scan_agents "$skill_dir")
  commands_json=$(scan_commands "$skill_dir")

  # Build the updated plugin.json
  if [ "$DRY_RUN" = false ]; then
    # Create temp file with updated content
    cat > "$plugin_json.tmp" << EOF
{
  "name": "$skill_name",
  "description": $(echo "$clean_desc" | jq -Rs '.'),
  "version": "$GLOBAL_VERSION",
  "author": $current_author,
  "license": "MIT",
  "repository": "https://github.com/secondsky/claude-skills",
  "keywords": $keywords_json,
  "category": "$category"
EOF

    # Add agents if present
    if [ "$agents_json" != "null" ]; then
      echo ",  \"agents\": $agents_json" >> "$plugin_json.tmp"
    fi

    # Add commands if present
    if [ "$commands_json" != "null" ]; then
      echo ",  \"commands\": $commands_json" >> "$plugin_json.tmp"
    fi

    echo "}" >> "$plugin_json.tmp"

    # Validate and format JSON
    if jq '.' "$plugin_json.tmp" > /dev/null 2>&1; then
      jq '.' "$plugin_json.tmp" > "$plugin_json"
      rm "$plugin_json.tmp"
    else
      echo "  ❌ ERROR: Invalid JSON generated for $skill_name"
      rm "$plugin_json.tmp"
      continue
    fi
  fi

  # Output status
  extras=""
  if [ "$agents_json" != "null" ]; then
    agent_count=$(echo "$agents_json" | jq 'length')
    extras="$extras +${agent_count}agents"
  fi
  if [ "$commands_json" != "null" ]; then
    cmd_count=$(echo "$commands_json" | jq 'length')
    extras="$extras +${cmd_count}cmds"
  fi

  if [ "$DRY_RUN" = true ]; then
    printf "[%3d/%d] %-40s → %s%s (dry run)\n" "$count" "$total" "$skill_name" "$category" "$extras"
  else
    printf "[%3d/%d] %-40s → %s%s\n" "$count" "$total" "$skill_name" "$category" "$extras"
  fi

  updated=$((updated + 1))
done

echo ""
echo "============================================"
echo "Plugin Sync Complete"
echo "============================================"
echo ""
echo "Skills processed: $count"
echo "Skills updated: $updated"
echo "Skills skipped: $skipped"
echo "Global version: $GLOBAL_VERSION"
echo ""

if [ "$DRY_RUN" = false ]; then
  # Regenerate marketplace.json
  echo "Regenerating marketplace.json..."
  "$SCRIPT_DIR/generate-marketplace.sh"
else
  echo "Dry run complete. No files were modified."
  echo "Run without --dry-run to apply changes."
fi

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
PLUGINS_DIR="$ROOT_DIR/plugins"
MARKETPLACE_JSON="$ROOT_DIR/.claude-plugin/marketplace.json"

# Parse arguments
DRY_RUN=false
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: $0 [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --dry-run   Preview changes without modifying files"
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
echo "Plugins directory: $PLUGINS_DIR"
echo ""

# -----------------------------------------------------------------------------
# Function: Categorize skill based on name patterns
# -----------------------------------------------------------------------------
categorize_skill() {
  local skill_name="$1"

  # Explicit overrides for mismatched categories (checked first)
  case "$skill_name" in
    mobile-first-design)
      echo "design"  # Responsive web design, not native mobile
      return
      ;;
  esac

  if [[ "$skill_name" =~ ^cloudflare- ]]; then echo "cloudflare"
  elif [[ "$skill_name" =~ ^(app-store-deployment|mobile-|react-native-app|swift-) ]]; then echo "mobile"
  elif [[ "$skill_name" =~ ^(claude-code-|claude-hook-) ]]; then echo "tooling"
  elif [[ "$skill_name" =~ ^(ai-|openai-|claude-|google-gemini-|gemini-|elevenlabs-|thesys-|multi-ai-consultant|tanstack-ai|ml-|model-deployment) ]]; then echo "ai"
  elif [[ "$skill_name" =~ ^(nextjs|nuxt-|react-|pinia-|zustand-|tanstack-query|tanstack-router|tanstack-start|tanstack-table|tailwind-|shadcn-|aceternity-ui|inspira-ui|base-ui-react|auto-animate|motion|ultracite) ]]; then echo "frontend"
  elif [[ "$skill_name" =~ ^(better-auth|clerk-auth|oauth-implementation|api-authentication|session-management) ]]; then echo "auth"
  elif [[ "$skill_name" =~ ^(content-collections|hugo|nuxt-content|sveltia-cms|wordpress-plugin-core) ]]; then echo "cms"
  elif [[ "$skill_name" =~ ^(vercel-blob) ]]; then echo "storage"
  elif [[ "$skill_name" =~ ^(database-|drizzle-|neon-|vercel-kv) ]]; then echo "database"
  elif [[ "$skill_name" =~ ^(api-|graphql-|rest-api-design|websocket-implementation) ]]; then echo "api"
  elif [[ "$skill_name" =~ ^(jest-generator|mutation-testing|playwright-testing|test-quality-analysis|vitest-testing) ]]; then echo "testing"
  elif [[ "$skill_name" =~ ^(access-control-rbac|csrf-protection|defense-in-depth-validation|security-headers-configuration|vulnerability-scanning|xss-prevention) ]]; then echo "security"
  elif [[ "$skill_name" =~ ^woocommerce- ]]; then echo "woocommerce"
  elif [[ "$skill_name" =~ ^(firecrawl-scraper|hono-routing|image-optimization|internationalization-i18n|payment-gateway-integration|progressive-web-app|push-notification-setup|responsive-web-design|session-management|web-performance-) ]]; then echo "web"
  elif [[ "$skill_name" =~ ^seo- ]]; then echo "seo"
  elif [[ "$skill_name" =~ ^frontend-design$ ]]; then echo "design"
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
    "cloudflare") echo "cloudflare,workers,edge,wrangler" ;;
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
# Function: Filter category keywords for specific skills
# -----------------------------------------------------------------------------
filter_category_keywords() {
  local skill_name="$1"
  local category="$2"
  local category_kws="$3"

  # Skills that should NOT get certain category defaults
  case "$skill_name" in
    internationalization-i18n)
      # Remove web performance keywords - i18n is not about performance/pwa
      echo "$category_kws" | tr ',' '\n' | grep -v -E '^(pwa|performance|optimization)$' | tr '\n' ',' | sed 's/,$//'
      ;;
    ml-model-training)
      # Remove LLM keyword - this is for general ML, not LLM training
      echo "$category_kws" | tr ',' '\n' | grep -v -E '^llm$' | tr '\n' ',' | sed 's/,$//'
      ;;
    access-control-rbac)
      # RBAC is about roles/permissions, not attack prevention
      echo "$category_kws" | tr ',' '\n' | grep -v -E '^(csrf|xss)$' | tr '\n' ',' | sed 's/,$//'
      ;;
    mobile-first-design)
      # Responsive web design, not native mobile apps
      # Remove misleading mobile keywords, add responsive design keywords
      filtered=$(echo "$category_kws" | tr ',' '\n' | grep -v -E '^(app|native)$' | tr '\n' ',' | sed 's/,$//')
      echo "$filtered,responsive-design,media-queries,breakpoints"
      ;;
    websocket-implementation)
      # WebSockets, not REST/GraphQL
      echo "$category_kws" | tr ',' '\n' | grep -v -E '^(rest|graphql|endpoints)$' | tr '\n' ',' | sed 's/,$//'
      ;;
    payment-gateway-integration)
      # Payment integration, not PWA/performance optimization
      echo "$category_kws" | tr ',' '\n' | grep -v -E '^(pwa|performance)$' | tr '\n' ',' | sed 's/,$//'
      ;;
    push-notification-setup)
      # Keep all - notifications are a web/mobile feature
      echo "$category_kws"
      ;;
    *)
      # Default: keep all category keywords
      echo "$category_kws"
      ;;
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
  local valuable_terms="scalable maintainable production authentication authorization validation optimization integration implementation configuration deployment migration refactoring edge caching streaming realtime real-time webhooks async asynchronous"

  for term in $valuable_terms; do
    if echo "$description" | grep -qi "\b$term"; then
      keywords="$keywords,$term"
    fi
  done

  echo "$keywords"
}

# -----------------------------------------------------------------------------
# Function: Extract keywords from YAML frontmatter in SKILL.md
# -----------------------------------------------------------------------------
extract_yaml_keywords() {
  local skill_md="$1"
  local keywords=""

  if [ ! -f "$skill_md" ]; then
    echo ""
    return
  fi

  # Extract keywords from YAML frontmatter
  # Handles both top-level keywords and nested (under metadata)
  keywords=$(awk '
    BEGIN {in_frontmatter=0; in_keywords=0; indent_level=0}
    /^---$/ {
      frontmatter_count++
      if (frontmatter_count==1) {in_frontmatter=1; next}
      if (frontmatter_count==2) {exit}
    }
    # Match both top-level keywords: and nested keywords:
    in_frontmatter && /keywords:/ {
      in_keywords=1
      # Detect indentation level
      match($0, /^[[:space:]]*/)
      indent_level = RLENGTH
      next
    }
    # Exit keywords section when we hit another key at same or lower indentation
    in_frontmatter && in_keywords && /^[[:space:]]*[a-z-]+:/ {
      match($0, /^[[:space:]]*/)
      if (RLENGTH <= indent_level) {
        in_keywords=0
      }
    }
    # Extract keyword list items (with proper indentation)
    in_frontmatter && in_keywords && /[[:space:]]*- / {
      gsub(/^[[:space:]]*- /, "")
      gsub(/^"/, "")
      gsub(/"$/, "")
      # Skip comment lines
      if ($0 !~ /^#/) {
        print
      }
    }
  ' "$skill_md" | grep -v '^$' | tr '\n' ',' | sed 's/,$//')

  echo "$keywords"
}

# -----------------------------------------------------------------------------
# Function: Extract explicit keywords from "Keywords: ..." line in description
# -----------------------------------------------------------------------------
extract_explicit_keywords() {
  local description="$1"
  local skill_md="$2"
  local keywords=""

  # PRIORITY 1: Extract from YAML frontmatter in SKILL.md
  if [ -n "$skill_md" ]; then
    keywords=$(extract_yaml_keywords "$skill_md")
  fi

  # PRIORITY 2: Fallback to "Keywords: ..." line in description (legacy support)
  if [ -z "$keywords" ] && echo "$description" | grep -q "Keywords:"; then
    # Extract everything after "Keywords:" until end of line/description
    # Strip surrounding quotes from each keyword
    keywords=$(echo "$description" | sed -n 's/.*Keywords:\s*\(.*\)/\1/p' | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//; s/^"//; s/"$//' | grep -v '^$' | tr '\n' ',')
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
  local skill_md="$4"

  # Collect from all sources
  # PRIORITY ORDER: 1) Explicit keywords from SKILL.md, 2) Name, 3) Category, 4) Auto-extracted
  local explicit_kw=$(extract_explicit_keywords "$description" "$skill_md")
  local name_kw=$(generate_name_keywords "$skill_name")
  local cat_kw=$(get_category_keywords "$category")
  cat_kw=$(filter_category_keywords "$skill_name" "$category" "$cat_kw")
  local desc_kw=$(extract_description_keywords "$description")

  # If explicit keywords exist, prioritize them over category defaults
  if [ -n "$explicit_kw" ]; then
    local all_kw="$name_kw,$explicit_kw,$desc_kw"
  else
    local all_kw="$name_kw,$cat_kw,$desc_kw"
  fi

  # Convert to JSON array with deduplication
  local deduplicated_keywords=()
  local seen=""

  IFS=',' read -ra keywords <<< "$all_kw"
  for kw in "${keywords[@]}"; do
    kw=$(echo "$kw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '[:upper:]' '[:lower:]')
    if [ -z "$kw" ] || [ ${#kw} -le 2 ] || [[ "$seen" == *"|$kw|"* ]]; then
      continue
    fi

    # Skip category-redundant keywords
    if [[ "$category" == "cloudflare" && "$kw" == "serverless" ]]; then
      continue  # "serverless" is implied by "workers" + "edge"
    fi

    # Skip generic keywords for specific skills
    if [[ "$skill_name" == "nuxt-seo" && "$kw" == "configuration" ]]; then
      continue  # Too generic - "configuration" doesn't distinguish SEO functionality
    fi

    # Global generic keyword filter (all skills)
    case "$kw" in
      # Programming languages (standalone - not compounded)
      typescript|javascript|python|go|rust)
        continue ;;
      # Generic deployment/process terms
      deployment|production|development)
        continue ;;
      # Directory names (too descriptive, not searchable)
      "server directory"|"public directory"|"assets directory"|"app directory"|"components directory")
        continue ;;
      # Generic single-word terms (too broad, hurt search relevance)
      api|beta|status|integration|first|design|app|correct|not|streaming|sdk)
        # Keep if it's part of the skill name (e.g., "api" ok for "openai-api")
        if [[ ! "$skill_name" =~ $kw ]]; then
          continue
        fi
        ;;
      # Standalone generic terms (only skip if not part of skill name)
      modules|plugins|layers|middleware|configuration|optimization)
        # Keep if it's part of the skill name (e.g., "middleware" skill keeps "middleware" keyword)
        if [[ ! "$skill_name" =~ $kw ]]; then
          continue
        fi
        ;;
    esac

    seen="$seen|$kw|"
    deduplicated_keywords+=("$kw")
  done

  # Build JSON array using jq (proper escaping)
  local json_array=$(printf '%s\n' "${deduplicated_keywords[@]}" | jq -R . | jq -s .)

  # Validation: Warn if keyword count is outside optimal range
  keyword_count=$(echo "$json_array" | jq '. | length')
  if [ "$keyword_count" -lt 15 ]; then
    echo "  ⚠️  Warning: $skill_name has only $keyword_count keywords (recommend 15-35)" >&2
  elif [ "$keyword_count" -gt 35 ]; then
    echo "  ⚠️  Warning: $skill_name has $keyword_count keywords (recommend 15-35 for search relevance)" >&2
  fi

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
total=$(find "$PLUGINS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

echo "Processing $total plugins..."
echo ""

for plugin_base_dir in $(find "$PLUGINS_DIR" -mindepth 1 -maxdepth 1 -type d | sort); do
  plugin_name=$(basename "$plugin_base_dir")
  plugin_dir="$plugin_base_dir/.claude-plugin"
  plugin_json="$plugin_dir/plugin.json"
  skill_md="$plugin_base_dir/skills/$plugin_name/SKILL.md"

  count=$((count + 1))

  # Skip if no SKILL.md
  if [ ! -f "$skill_md" ]; then
    printf "[%3d/%d] %-40s SKIP (no SKILL.md)\n" "$count" "$total" "$plugin_name"
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
    current_desc="Production-ready skill for $plugin_name"
  fi

  # Get category
  category=$(categorize_skill "$plugin_name")

  # Generate keywords (uses full description with Keywords line for extraction)
  keywords_json=$(generate_keywords_json "$plugin_name" "$category" "$current_desc" "$skill_md")

  # Remove "Keywords: ..." line from description for plugin.json output
  clean_desc=$(remove_keywords_line "$current_desc")

  # Validate description length
  desc_length=${#clean_desc}
  if [ "$desc_length" -gt 250 ]; then
    echo "  ❌ ERROR: $plugin_name description is $desc_length chars (max 250)" >&2
    echo "  Description: $clean_desc" >&2
    echo "  SKIPPING - Fix SKILL.md description first (condense to <250 chars)" >&2
    continue  # Skip this plugin
  elif [ "$desc_length" -gt 150 ]; then
    echo "  ⚠️  Warning: $plugin_name description is $desc_length chars (recommend <150 for brevity)" >&2
  fi

  # Scan for agents and commands
  agents_json=$(scan_agents "$plugin_base_dir")
  commands_json=$(scan_commands "$plugin_base_dir")

  # Build the updated plugin.json
  if [ "$DRY_RUN" = false ]; then
    # Create temp file with updated content
    # Use jq to convert to JSON string and trim trailing whitespace/newlines
    desc_json=$(echo "$clean_desc" | jq -Rs '. | rtrimstr("\n") | rtrimstr(" ") | rtrimstr("\n")')
    cat > "$plugin_json.tmp" << EOF
{
  "name": "$plugin_name",
  "description": $desc_json,
  "version": "$GLOBAL_VERSION",
  "author": $current_author,
  "license": "MIT",
  "repository": "https://github.com/secondsky/claude-skills",
  "keywords": $keywords_json
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
      echo "  ❌ ERROR: Invalid JSON generated for $plugin_name"
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
    printf "[%3d/%d] %-40s → %s%s (dry run)\n" "$count" "$total" "$plugin_name" "$category" "$extras"
  else
    printf "[%3d/%d] %-40s → %s%s\n" "$count" "$total" "$plugin_name" "$category" "$extras"
  fi

  updated=$((updated + 1))
done

echo ""
echo "============================================"
echo "Plugin Sync Complete"
echo "============================================"
echo ""
echo "Plugins processed: $count"
echo "Plugins updated: $updated"
echo "Plugins skipped: $skipped"
echo "Global version: $GLOBAL_VERSION"
echo ""

if [ "$DRY_RUN" = false ]; then
  # Regenerate marketplace.json
  echo "Regenerating marketplace.json..."
  if ! "$SCRIPT_DIR/generate-marketplace.sh"; then
    echo "❌ ERROR: Failed to regenerate marketplace.json" >&2
    exit 1
  fi
else
  echo "Dry run complete. No files were modified."
  echo "Run without --dry-run to apply changes."
fi

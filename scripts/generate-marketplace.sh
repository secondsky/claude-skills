#!/bin/bash
# Generate marketplace.json from all plugins in plugins/ directory
# Creates individual plugin entries for each plugin (NO cache duplication!)
#
# Each plugin is listed with:
# - source: "./plugins/[plugin-name]" (points to plugin directory, NOT root)
# - description: from plugin's .claude-plugin/plugin.json
# - keywords: from plugin's .claude-plugin/plugin.json
# - category: from categorize_skill() function
#
# This structure prevents cache duplication:
# - Old format: source: "./" copied ENTIRE repo to each cache (18× duplication)
# - New format: source: "./plugins/[name]" copies only that plugin directory
#
# References:
# - Official docs: https://code.claude.com/docs/en/plugin-marketplaces
# - Fix for: 3,218 skill count (should be 169)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGINS_DIR="$(cd "$SCRIPT_DIR/../plugins" && pwd)"
MARKETPLACE_DIR="$(cd "$SCRIPT_DIR/../.claude-plugin" && pwd)"
MARKETPLACE_JSON="$MARKETPLACE_DIR/marketplace.json"

echo "============================================"
echo "Generating marketplace.json for Claude Skills"
echo "Format: Individual Plugins (No Cache Duplication)"
echo "============================================"
echo ""
echo "Plugins directory: $PLUGINS_DIR"
echo "Output: $MARKETPLACE_JSON"
echo ""

# Backup existing marketplace.json
if [ -f "$MARKETPLACE_JSON" ]; then
  backup_file="$MARKETPLACE_JSON.backup-$(date +%Y%m%d-%H%M%S)"
  cp "$MARKETPLACE_JSON" "$backup_file"
  echo "✅ Backed up existing marketplace.json to: $(basename "$backup_file")"
  echo ""
fi

# Function to categorize skill (for category field)
categorize_skill() {
  local skill_name="$1"

  # Cloudflare skills
  if [[ "$skill_name" =~ ^cloudflare- ]]; then
    echo "cloudflare"
  # Mobile skills (check BEFORE frontend to catch react-native-app)
  elif [[ "$skill_name" =~ ^(app-store-deployment|mobile-|react-native-app|swift-) ]]; then
    echo "mobile"
  # Claude Code tooling (check BEFORE ai-skills to avoid claude- prefix match)
  elif [[ "$skill_name" =~ ^(claude-code-|claude-hook-) ]]; then
    echo "tooling"
  # AI/ML skills
  elif [[ "$skill_name" =~ ^(ai-|openai-|claude-|google-gemini-|gemini-|elevenlabs-|thesys-|multi-ai-consultant|tanstack-ai|ml-|model-deployment) ]]; then
    echo "ai"
  # Frontend framework skills
  elif [[ "$skill_name" =~ ^(nextjs|nuxt-|react-|pinia-|zustand-|tanstack-query|tanstack-router|tanstack-start|tanstack-table|tailwind-|shadcn-|aceternity-ui|inspira-ui|base-ui-react|auto-animate|motion|ultracite) ]]; then
    echo "frontend"
  # Auth skills
  elif [[ "$skill_name" =~ ^(better-auth|clerk-auth|oauth-implementation|api-authentication|session-management) ]]; then
    echo "auth"
  # CMS skills
  elif [[ "$skill_name" =~ ^(content-collections|hugo|nuxt-content|sveltia-cms|wordpress-plugin-core) ]]; then
    echo "cms"
  # Database skills
  elif [[ "$skill_name" =~ ^(database-|drizzle-|neon-|vercel-blob|vercel-kv) ]]; then
    echo "database"
  # API skills
  elif [[ "$skill_name" =~ ^(api-|graphql-|rest-api-design|websocket-implementation) ]]; then
    echo "api"
  # Testing skills
  elif [[ "$skill_name" =~ ^(jest-generator|mutation-testing|playwright-testing|test-quality-analysis|vitest-testing) ]]; then
    echo "testing"
  # Security skills
  elif [[ "$skill_name" =~ ^(access-control-rbac|csrf-protection|defense-in-depth-validation|security-headers-configuration|vulnerability-scanning|xss-prevention) ]]; then
    echo "security"
  # WooCommerce skills
  elif [[ "$skill_name" =~ ^woocommerce- ]]; then
    echo "woocommerce"
  # Web development skills
  elif [[ "$skill_name" =~ ^(firecrawl-scraper|hono-routing|image-optimization|internationalization-i18n|payment-gateway-integration|progressive-web-app|push-notification-setup|responsive-web-design|session-management|web-performance-) ]]; then
    echo "web"
  # SEO skills
  elif [[ "$skill_name" =~ ^seo- ]]; then
    echo "seo"
  # Design skills
  elif [[ "$skill_name" =~ ^(design-|interaction-design|kpi-dashboard-design|mobile-first-design) ]]; then
    echo "design"
  # Data/recommendation skills
  elif [[ "$skill_name" =~ ^(recommendation-|sql-query-optimization) ]]; then
    echo "data"
  # Documentation skills
  elif [[ "$skill_name" =~ ^technical-specification ]]; then
    echo "documentation"
  # Architecture skills
  elif [[ "$skill_name" =~ ^(architecture-patterns|health-check-endpoints|microservices-patterns) ]]; then
    echo "architecture"
  # Default to tooling
  else
    echo "tooling"
  fi
}

# Counter for tracking progress
count=0
skipped=0
# Count total skills across all plugins (not just plugin containers)
total=0
for pd in "$PLUGINS_DIR"/*/skills/*; do
  if [ -d "$pd" ]; then
    total=$((total + 1))
  fi
done

echo "Processing $total skills across plugins..."
echo ""

# Start generating JSON header
cat > "$MARKETPLACE_JSON" << 'EOF_HEADER'
{
  "name": "claude-skills",
  "owner": {
    "name": "Claude Skills Maintainers",
    "email": "maintainers@example.com",
    "url": "https://github.com/secondsky/claude-skills"
  },
  "metadata": {
    "description": "Production-tested skills for Claude Code - Cloudflare, AI, React, Tailwind v4, and modern web development",
    "version": "3.0.0",
    "homepage": "https://github.com/secondsky/claude-skills"
  },
  "plugins": [
EOF_HEADER

# Create temp directory for category counting (bash 3.2 compatible)
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Generate individual plugin entries (sorted alphabetically)
# Scan all skills within plugins (handles both standalone and multi-skill plugins)
first=true
for plugin_dir in $(find "$PLUGINS_DIR" -mindepth 1 -maxdepth 1 -type d | sort); do
  if [ ! -d "$plugin_dir" ]; then
    continue
  fi

  plugin_container=$(basename "$plugin_dir")

  # Check if skills/ subdirectory exists
  if [ ! -d "$plugin_dir/skills" ]; then
    count=$((count + 1))
    printf "[%3d/%d] %-40s ⚠️  SKIP (no skills/ directory)\n" "$count" "$total" "$plugin_container"
    skipped=$((skipped + 1))
    continue
  fi

  # Iterate through all skills within this plugin
  for skill_dir in "$plugin_dir/skills"/*; do
    if [ ! -d "$skill_dir" ]; then
      continue
    fi

    skill_name=$(basename "$skill_dir")
    skill_md="$skill_dir/SKILL.md"
    # Look for plugin.json at plugin level (for standalone) or skill level (for multi-skill containers)
    if [ -f "$plugin_dir/.claude-plugin/plugin.json" ] && [ "$skill_name" = "$plugin_container" ]; then
      # Standalone plugin: use plugin-level manifest
      plugin_json="$plugin_dir/.claude-plugin/plugin.json"
    else
      # Multi-skill container: use skill-level manifest
      plugin_json="$skill_dir/.claude-plugin/plugin.json"
    fi

    count=$((count + 1))

    # Check if SKILL.md exists
    if [ ! -f "$skill_md" ]; then
      printf "[%3d/%d] %-40s ⚠️  SKIP (no SKILL.md)\n" "$count" "$total" "$skill_name"
      skipped=$((skipped + 1))
      continue
    fi

    # Check if plugin.json exists
    if [ ! -f "$plugin_json" ]; then
      printf "[%3d/%d] %-40s ⚠️  SKIP (no plugin.json)\n" "$count" "$total" "$skill_name"
      skipped=$((skipped + 1))
      continue
    fi

  # Read description from plugin.json (escape for JSON)
  description=$(jq -r '.description // ""' "$plugin_json" 2>/dev/null)
  if [ -z "$description" ]; then
    printf "[%3d/%d] %-40s ⚠️  SKIP (no description)\n" "$count" "$total" "$skill_name"
    skipped=$((skipped + 1))
    continue
  fi

  # Read keywords from plugin.json (as JSON array)
  keywords=$(jq -c '.keywords // []' "$plugin_json" 2>/dev/null)
  if [ "$keywords" = "null" ] || [ "$keywords" = "[]" ]; then
    keywords="[]"
  fi

  # Read version from plugin.json
  version=$(jq -r '.version // "3.0.0"' "$plugin_json" 2>/dev/null)
  if [ -z "$version" ] || [ "$version" = "null" ]; then
    version="3.0.0"
  fi

  # Get category
  category=$(categorize_skill "$skill_name")

  # Track category count (bash 3.2 compatible using temp files)
  echo "$skill_name" >> "$TEMP_DIR/$category"

  # Add comma before each entry except the first
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$MARKETPLACE_JSON"
  fi

  # Escape description for JSON (handle quotes and newlines)
  description_escaped=$(echo "$description" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ')

  # Determine source path
  # Standalone plugins: ./plugins/[name] (e.g., ./plugins/tanstack-query)
  # Multi-skill container skills: ./plugins/[container]/skills/[skill] (e.g., ./plugins/cloudflare/skills/cloudflare-d1)
  if [ "$skill_name" = "$plugin_container" ] && [ -f "$plugin_dir/.claude-plugin/plugin.json" ]; then
    source_path="./plugins/$skill_name"
  else
    source_path="./plugins/$plugin_container/skills/$skill_name"
  fi

  # Write individual plugin entry
  cat >> "$MARKETPLACE_JSON" << EOF
    {
      "name": "$skill_name",
      "source": "$source_path",
      "version": "$version",
      "description": "$description_escaped",
      "keywords": $keywords,
      "category": "$category"
    }
EOF

  printf "[%3d/%d] %-40s → %s\n" "$count" "$total" "$skill_name" "$category"
  done
done

# Close JSON
cat >> "$MARKETPLACE_JSON" << 'EOF_FOOTER'
  ]
}
EOF_FOOTER

echo ""
echo "Category summary:"
echo "--------------------"
for category_file in "$TEMP_DIR"/*; do
  if [ -f "$category_file" ]; then
    category_name=$(basename "$category_file")
    category_count=$(wc -l < "$category_file" | tr -d ' ')
    printf "%-20s %3d plugins\n" "$category_name" "$category_count"
  fi
done
echo ""

# Validate JSON
if command -v jq &> /dev/null; then
  echo "Validating JSON..."
  if jq empty "$MARKETPLACE_JSON" 2>/dev/null; then
    plugin_count=$(jq '.plugins | length' "$MARKETPLACE_JSON")

    # Check for missing descriptions
    missing_desc=$(jq '[.plugins[] | select(.description == "")] | length' "$MARKETPLACE_JSON")

    # Check for empty keywords
    missing_kw=$(jq '[.plugins[] | select(.keywords == [])] | length' "$MARKETPLACE_JSON")

    echo "✅ Valid JSON generated"
    echo "   - Total plugins: $plugin_count"
    echo "   - Missing descriptions: $missing_desc"
    echo "   - Empty keywords: $missing_kw"
    echo "   - Skipped plugins: $skipped"
  else
    echo "❌ ERROR: Invalid JSON generated"
    exit 1
  fi
else
  echo "⚠️  Warning: jq not installed, skipping JSON validation"
fi

echo ""
echo "============================================"
echo "✅ Marketplace generation complete!"
echo "============================================"
echo ""
echo "Output: $MARKETPLACE_JSON"
echo "Format: Individual plugins (NO cache duplication)"
echo "Plugins processed: $((count - skipped))"
echo ""
echo "Key fix applied:"
echo "  - Old: source: \"./\" → copied entire repo to cache (18× duplication)"
echo "  - New: source: \"./plugins/[name]\" → copies only plugin directory"
echo ""
echo "Next steps:"
echo "1. Validate: jq '.plugins | length' $MARKETPLACE_JSON"
echo "2. Check descriptions: jq '.plugins[] | select(.description == \"\") | .name' $MARKETPLACE_JSON"
echo "3. Clear cache: rm -rf ~/.claude/plugins/cache/claude-skills/"
echo "4. Commit: git add .claude-plugin/marketplace.json && git commit -m 'Reorganize: individual plugins'"
echo "5. Push: git push"
echo ""
echo "Installation (after push):"
echo "  /plugin install tanstack-query@claude-skills"
echo "  /plugin install better-auth@claude-skills"
echo "  ... (each plugin is now individually installable)"
echo ""

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

# Load shared categorization library
source "$SCRIPT_DIR/lib/categorize.sh"

# categorize_skill() function is now loaded from lib/categorize.sh

# Counter for tracking progress
count=0
skipped=0
# Count total PLUGINS (not skills - skills are auto-discovered)
total=0
for pd in "$PLUGINS_DIR"/*; do
  if [ -d "$pd" ] && [ -f "$pd/.claude-plugin/plugin.json" ]; then
    total=$((total + 1))
  fi
done

echo "Processing $total plugins..."
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

# ============================================
# Plugin-First Marketplace Generation
# ============================================
# Creates ONE marketplace entry per PLUGIN (not per skill)
# Skills are auto-discovered from plugin's skills/ directory when installed
# ============================================

echo "Processing plugins..."

# Loop through each plugin directory
while IFS= read -r plugin_dir; do
  if [ ! -d "$plugin_dir" ]; then
    continue
  fi

  plugin_name=$(basename "$plugin_dir")
  plugin_json="$plugin_dir/.claude-plugin/plugin.json"

  # Skip if no plugin.json (before counting)
  if [ ! -f "$plugin_json" ]; then
    continue  # Silent skip, don't increment count
  fi

  count=$((count + 1))  # Only count valid plugins

  # Validate JSON structure
  if ! jq empty "$plugin_json" 2>/dev/null; then
    printf "[%3d/%d] %-40s ⚠️  SKIP (invalid JSON in plugin.json)\n" \
      "$count" "$total" "$plugin_name"
    skipped=$((skipped + 1))
    continue
  fi

  # Read plugin-level metadata from plugin.json (safe now, JSON is valid)
  description=$(jq -r '.description // ""' "$plugin_json" 2>/dev/null)
  if [ -z "$description" ]; then
    printf "[%3d/%d] %-40s ⚠️  SKIP (no description)\n" "$count" "$total" "$plugin_name"
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

  # Get category based on plugin name
  category=$(categorize_skill "$plugin_name")

  # Track category count
  echo "$plugin_name" >> "$TEMP_DIR/$category"

  # Count skills in this plugin (for info only, not included in marketplace)
  skill_count=$(find "$plugin_dir/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')

  # Add comma before each entry except the first
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$MARKETPLACE_JSON"
  fi

  # Escape description for JSON (handles all control characters)
  description_escaped=$(printf '%s' "$description" | jq -Rs . | sed 's/^"//;s/"$//')

  # Source path points to plugin directory
  source_path="./plugins/$plugin_name"

  # Write marketplace entry for this PLUGIN
  # Skills auto-discovered from plugins/$plugin_name/skills/ directory
  cat >> "$MARKETPLACE_JSON" << EOF
    {
      "name": "$plugin_name",
      "source": "$source_path",
      "version": "$version",
      "description": "$description_escaped",
      "keywords": $keywords,
      "category": "$category"
    }
EOF

  # Show skill count in progress output
  if [ "$skill_count" -gt 1 ]; then
    printf "[%3d/%d] %-40s → %s (%d skills)\n" "$count" "$total" "$plugin_name" "$category" "$skill_count"
  else
    printf "[%3d/%d] %-40s → %s\n" "$count" "$total" "$plugin_name" "$category"
  fi
done < <(find "$PLUGINS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

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
echo "Format: Individual plugins (skills auto-discovered)"
echo "Total plugins: $((count - skipped))"
echo ""
echo "Key change applied:"
echo "  - One marketplace entry per PLUGIN (not per skill)"
echo "  - Skills auto-discovered from plugin's skills/ directory"
echo "  - Multi-skill plugins: bun (27 skills), cloudflare-workers (10 skills), nuxt-v4 (4 skills)"
echo ""
echo "Next steps:"
echo "1. Validate: jq '.plugins | length' $MARKETPLACE_JSON"
echo "2. Check descriptions: jq '.plugins[] | select(.description == \"\") | .name' $MARKETPLACE_JSON"
echo "3. Clear cache: rm -rf ~/.claude/plugins/cache/claude-skills/"
echo "4. Commit: git add .claude-plugin/marketplace.json && git commit -m 'refactor: plugin bundles'"
echo "5. Push: git push"
echo ""
echo "Installation (after push):"
echo "  /plugin install bun@claude-skills           # Gets all 27 bun skills"
echo "  /plugin install cloudflare-workers@claude-skills  # Gets all 10 workers skills"
echo "  /plugin install nuxt-v4@claude-skills       # Gets all 4 nuxt skills"
echo ""

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
# Count total skills (both single-skill and multi-skill patterns)
total=0
for pd in "$PLUGINS_DIR"/*; do
  if [ -d "$pd" ]; then
    plugin_name=$(basename "$pd")
    # CASE 1: Single-skill pattern (backward compatible)
    if [ -f "$pd/skills/$plugin_name/SKILL.md" ]; then
      total=$((total + 1))
    else
      # CASE 2: Multi-skill pattern (count all nested skills)
      # Note: Using mindepth 3 to handle structure like skills/[plugin-name]/[skill-name]/SKILL.md
      nested_count=$(find "$pd/skills" -mindepth 3 -maxdepth 3 -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
      if [ "$nested_count" -gt 0 ]; then
        total=$((total + nested_count))
      fi
    fi
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

# ============================================
# LOOP 1: Process parent plugins (bundles)
# REMOVED in v3.1.0 - Marketplace now contains individual skills only
# Parent bundle generation was removed to simplify marketplace structure.
# See git history (commit 677abf8) to restore this functionality if needed.
# ============================================

echo "Processing individual skills..."

# ============================================
# LOOP 2: Process individual skills (supports both single and multi-skill plugins)
# ============================================
# CASE 1: Single-skill plugins: plugins/[name]/skills/[name]/SKILL.md
# CASE 2: Multi-skill plugins: plugins/[name]/skills/[name]/[skill-name]/SKILL.md
# Use while read loop to handle directory names with spaces safely
# Process substitution avoids subshell, so variables (count, skipped, first) persist
while IFS= read -r plugin_dir; do
  if [ ! -d "$plugin_dir" ]; then
    continue
  fi

  plugin_name=$(basename "$plugin_dir")
  plugin_json="$plugin_dir/.claude-plugin/plugin.json"

  # CASE 1: Single-skill pattern (backward compatible)
  standard_skill_md="$plugin_dir/skills/$plugin_name/SKILL.md"
  if [ -f "$standard_skill_md" ]; then
    # Process as single skill (existing logic)
    skill_name="$plugin_name"
    skill_md="$standard_skill_md"

    count=$((count + 1))

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

    # Escape description for JSON (handles all control characters)
    description_escaped=$(printf '%s' "$description" | jq -Rs . | sed 's/^"//;s/"$//')

    # Source path for flat structure: ./plugins/[name]
    source_path="./plugins/$skill_name"

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
    continue  # Move to next plugin
  fi

  # CASE 2: Multi-skill pattern (scan for nested skills)
  # Note: Using mindepth 3 to handle structure like skills/[plugin-name]/[skill-name]/SKILL.md
  skill_mds=$(find "$plugin_dir/skills" -mindepth 3 -maxdepth 3 -name "SKILL.md" 2>/dev/null | sort)

  if [ -z "$skill_mds" ]; then
    # No skills found at all - skip this plugin
    continue
  fi

  # Process each nested skill in the plugin
  while IFS= read -r skill_md; do
    # Extract skill name from path
    # Example: plugins/cloudflare-workers/skills/cloudflare-workers/workers-ci-cd/SKILL.md
    # → skill_name = "workers-ci-cd"
    skill_name=$(basename "$(dirname "$skill_md")")

    count=$((count + 1))

    # Check if plugin.json exists (use plugin-level plugin.json)
    if [ ! -f "$plugin_json" ]; then
      printf "[%3d/%d] %-40s ⚠️  SKIP (no plugin.json)\n" "$count" "$total" "$skill_name"
      skipped=$((skipped + 1))
      continue
    fi

    # For multi-skill plugins, read description from SKILL.md frontmatter
    # First, try to extract from SKILL.md YAML frontmatter
    skill_description=$(awk '/^---$/,/^---$/{if (!/^---$/) print}' "$skill_md" | grep -E '^description:' | sed 's/^description: *//' | sed 's/^["'"'"']//' | sed 's/["'"'"']$//')

    # Fallback to plugin.json description if no description in SKILL.md
    if [ -z "$skill_description" ]; then
      skill_description=$(jq -r '.description // ""' "$plugin_json" 2>/dev/null)
    fi

    if [ -z "$skill_description" ]; then
      printf "[%3d/%d] %-40s ⚠️  SKIP (no description)\n" "$count" "$total" "$skill_name"
      skipped=$((skipped + 1))
      continue
    fi

    # Use plugin.json for keywords and version
    keywords=$(jq -c '.keywords // []' "$plugin_json" 2>/dev/null)
    if [ "$keywords" = "null" ] || [ "$keywords" = "[]" ]; then
      keywords="[]"
    fi

    version=$(jq -r '.version // "3.0.0"' "$plugin_json" 2>/dev/null)
    if [ -z "$version" ] || [ "$version" = "null" ]; then
      version="3.0.0"
    fi

    # Get category (based on skill name, not plugin name)
    category=$(categorize_skill "$skill_name")

    # Track category count
    echo "$skill_name" >> "$TEMP_DIR/$category"

    # Add comma before each entry except the first
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> "$MARKETPLACE_JSON"
    fi

    # Escape description for JSON
    description_escaped=$(printf '%s' "$skill_description" | jq -Rs . | sed 's/^"//;s/"$//')

    # Source path points to plugin directory (not individual skill)
    source_path="./plugins/$plugin_name"

    # Write marketplace entry for this skill
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

    printf "[%3d/%d] %-40s → %s (multi-skill from %s)\n" "$count" "$total" "$skill_name" "$category" "$plugin_name"
  done <<< "$skill_mds"
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
echo "Format: Individual skills only"
echo "Total skills: $((count - skipped))"
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

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

set -eo pipefail

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
    "version": "3.5.0",
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

  # Count skills in this plugin (for info only, not included in marketplace).
  # `find` exits non-zero if the directory doesn't exist; under `set -o pipefail`
  # that would abort the whole generator. Append `|| true` so a plugin lacking a
  # skills/ subdir simply reports count 0 instead of crashing the run.
  skill_count=$(find "$plugin_dir/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ' || true)

  # Add comma before each entry except the first
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$MARKETPLACE_JSON"
  fi

  # Source path points to plugin directory
  source_path="./plugins/$plugin_name"

  # Write marketplace entry for this PLUGIN as a single compact JSON object.
  # Previously this used an unquoted heredoc that interpolated $plugin_name,
  # $version, and $description_escaped raw into the JSON text — safe only as
  # long as no value contained a double-quote, backslash, or newline. Building
  # the object with `jq -nc --arg` escapes all values correctly (the same safe
  # pattern generate-codex-manifests.sh uses).
  # Skills auto-discovered from plugins/$plugin_name/skills/ directory.
  jq -nc \
    --arg name "$plugin_name" \
    --arg source "$source_path" \
    --arg version "$version" \
    --arg description "$description" \
    --argjson keywords "$keywords" \
    --arg category "$category" \
    '{name:$name, source:$source, version:$version, description:$description, keywords:$keywords, category:$category}' \
    >> "$MARKETPLACE_JSON"

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

    # Reject an empty marketplace before doing anything else. If every plugin
    # was skipped (misconfigured PLUGINS_DIR, all plugin.json invalid, etc.)
    # the file would contain `"plugins": []`, violating the marketplace schema
    # (minItems) and silently publishing a broken artifact. Fail loudly instead.
    if [ "$plugin_count" -eq 0 ]; then
      echo "❌ ERROR: Generated marketplace has 0 plugins (all skipped?). Aborting; $MARKETPLACE_JSON left as-is or empty." >&2
      exit 1
    fi

    # Sync top-level metadata.version from plugin entries and ENFORCE lockstep.
    # Previously this read `.plugins[0].version` (always the alphabetically-first
    # plugin), which silently masked version drift instead of detecting it — the
    # exact bug the comment claimed to fix. Now: collect the distinct set of
    # plugin versions; if more than one exists, fail loudly so drift is caught
    # at generation time rather than shipped.
    distinct_versions=$(jq -r '[.plugins[].version] | unique | join(",")' "$MARKETPLACE_JSON")
    synced_version=$(jq -r '.plugins[0].version // empty' "$MARKETPLACE_JSON")
    if [ -n "$synced_version" ]; then
      if [ "$distinct_versions" != "$synced_version" ]; then
        echo "❌ Version lockstep violated: plugins report versions [$distinct_versions]." >&2
        echo "   Expected all plugins at a single version. Fix the divergent plugin.json files." >&2
        exit 1
      fi
      jq --arg v "$synced_version" '.metadata.version = $v' "$MARKETPLACE_JSON" > "$MARKETPLACE_JSON.tmp" && mv "$MARKETPLACE_JSON.tmp" "$MARKETPLACE_JSON"
    fi

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

# -----------------------------------------------------------------------------
# Regenerate Codex CLI manifests + marketplace (derived from Claude manifests)
# -----------------------------------------------------------------------------
echo "============================================"
echo "Generating Codex CLI manifests..."
echo "============================================"
if [ -x "$SCRIPT_DIR/generate-codex-manifests.sh" ]; then
  if ! "$SCRIPT_DIR/generate-codex-manifests.sh"; then
    echo "⚠️  Warning: Failed to generate Codex manifests (non-fatal)" >&2
  fi
else
  echo "⚠️  Warning: generate-codex-manifests.sh not found or not executable" >&2
fi
echo ""

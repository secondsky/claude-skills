#!/bin/bash
# =============================================================================
# Generate Codex CLI Plugin Manifests
# =============================================================================
# Derives .codex-plugin/plugin.json for every plugin from its .claude-plugin/
# plugin.json (source of truth), and generates .agents/plugins/marketplace.json
# (Codex's standard marketplace location).
#
# Claude manifests are canonical; Codex manifests are derived. Never hand-edit
# .codex-plugin/plugin.json — re-run this script after changing the Claude
# manifest (or run sync-plugins.sh, which calls this at the end).
#
# Field mapping (Claude → Codex):
#   name, version, description, author, license, repository, keywords → copied
#   skills            → "./skills/" (Codex auto-discovers SKILL.md files)
#   interface         → derived from name + description + category
#   mcpServers        → carried through if present (same ./.mcp.json path)
#   commands, agents  → NOT carried over (Codex has no equivalent; use /import)
#
# Usage:
#   ./scripts/generate-codex-manifests.sh           # Generate all
#   ./scripts/generate-codex-manifests.sh --dry-run # Preview without writing
# =============================================================================

set -e

command -v jq &>/dev/null || { echo "Error: jq is required but not installed"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLUGINS_DIR="$ROOT_DIR/plugins"
CODEX_MARKETPLACE_DIR="$ROOT_DIR/.agents/plugins"
CODEX_MARKETPLACE_JSON="$CODEX_MARKETPLACE_DIR/marketplace.json"

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
echo "Codex CLI - Plugin Manifest Generation"
echo "============================================"
if [ "$DRY_RUN" = true ]; then
  echo "Mode: DRY RUN (no files will be modified)"
fi
echo ""

# Load shared categorization library
source "$SCRIPT_DIR/lib/categorize.sh"

# -----------------------------------------------------------------------------
# Map Claude category (lowercase enum) → Codex category (Title-Case freeform)
# Codex uses freeform category strings, not a fixed enum.
# -----------------------------------------------------------------------------
map_codex_category() {
  local claude_cat="$1"
  case "$claude_cat" in
    cloudflare)     echo "Developer Tools" ;;
    ai)             echo "AI & Machine Learning" ;;
    frontend)       echo "Frontend" ;;
    auth)           echo "Security & Authentication" ;;
    cms)            echo "Content Management" ;;
    database)       echo "Databases" ;;
    api)            echo "APIs & Backend" ;;
    testing)        echo "Testing" ;;
    security)       echo "Security & Authentication" ;;
    mobile)         echo "Mobile Development" ;;
    web)            echo "Web Development" ;;
    seo)            echo "SEO" ;;
    design)         echo "Design & UX" ;;
    data)           echo "Data & Analytics" ;;
    documentation)  echo "Documentation" ;;
    architecture)   echo "Architecture" ;;
    woocommerce)    echo "E-Commerce" ;;
    tooling)        echo "Developer Tools" ;;
    *)              echo "Developer Tools" ;;
  esac
}

# -----------------------------------------------------------------------------
# Convert kebab-case name → Title Case display name
# e.g. "cloudflare-d1" → "Cloudflare D1"
# -----------------------------------------------------------------------------
to_display_name() {
  local name="$1"
  # Split on hyphens, capitalize each word, handle common acronyms.
  # Uses awk for capitalization (portable; BSD sed lacks \U).
  local result=""
  IFS='-' read -ra parts <<< "$name"
  for part in "${parts[@]}"; do
    local lower_part
    lower_part=$(echo "$part" | tr '[:upper:]' '[:lower:]')
    # Uppercase known acronyms; capitalize first letter of others
    case "$lower_part" in
      api|css|html|http|seo|ui|ux|kv|ssr|sql|mcp|lsp|ml|ai|pwa|csrf|xss|cdn|rbac|i18n|jwt)
        part=$(echo "$part" | tr '[:lower:]' '[:upper:]')
        ;;
      *)
        # Capitalize first letter via awk (portable)
        part=$(echo "$part" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
        ;;
    esac
    if [ -z "$result" ]; then
      result="$part"
    else
      result="$result $part"
    fi
  done
  echo "$result"
}

# -----------------------------------------------------------------------------
# Generate interface.defaultPrompt (max 3 strings, ≤128 chars each) from
# plugin name and description.
# -----------------------------------------------------------------------------
generate_default_prompts() {
  local display_name="$1"
  local description="$2"
  # Build 3 generic prompts. jq handles escaping and the 128-char truncation.
  local p1="Help me with ${display_name}."
  local p2="Show me best practices for ${display_name}."
  local p3="Guide me through using ${display_name} effectively."
  printf '%s\n%s\n%s\n' "$p1" "$p2" "$p3" | jq -R . | jq -s 'map(.[0:128])'
}

# -----------------------------------------------------------------------------
# Count plugins
# -----------------------------------------------------------------------------
total=0
for pd in "$PLUGINS_DIR"/*; do
  if [ -d "$pd" ] && [ -f "$pd/.claude-plugin/plugin.json" ]; then
    total=$((total + 1))
  fi
done

echo "Processing $total plugins..."
echo ""

# Create Codex marketplace directory
if [ "$DRY_RUN" = false ]; then
  mkdir -p "$CODEX_MARKETPLACE_DIR"
fi

count=0
skipped=0
marketplace_entries=""

# Start marketplace JSON (build in temp, write atomically)
MARKETPLACE_TMP=$(mktemp)
trap 'rm -f "$MARKETPLACE_TMP"' EXIT

echo '{' > "$MARKETPLACE_TMP"
echo '  "name": "claude-skills",' >> "$MARKETPLACE_TMP"
echo '  "interface": {' >> "$MARKETPLACE_TMP"
echo '    "displayName": "Claude Skills",' >> "$MARKETPLACE_TMP"
echo '    "shortDescription": "Production-tested skills for modern web development"' >> "$MARKETPLACE_TMP"
echo '  },' >> "$MARKETPLACE_TMP"
echo '  "plugins": [' >> "$MARKETPLACE_TMP"

first_entry=true

while IFS= read -r plugin_dir; do
  if [ ! -d "$plugin_dir" ]; then
    continue
  fi

  claude_json="$plugin_dir/.claude-plugin/plugin.json"
  if [ ! -f "$claude_json" ]; then
    continue
  fi

  plugin_name=$(basename "$plugin_dir")
  count=$((count + 1))

  # Validate Claude JSON
  if ! jq empty "$claude_json" 2>/dev/null; then
    printf "[%3d/%d] %-40s SKIP (invalid Claude JSON)\n" "$count" "$total" "$plugin_name"
    skipped=$((skipped + 1))
    continue
  fi

  # Read fields from Claude manifest
  description=$(jq -r '.description // ""' "$claude_json")
  version=$(jq -r '.version // "1.0.0"' "$claude_json")
  author=$(jq -c '.author // {"name": "Claude Skills Maintainers", "email": "maintainers@example.com"}' "$claude_json")
  license=$(jq -r '.license // "MIT"' "$claude_json")
  repository=$(jq -r '.repository // "https://github.com/secondsky/claude-skills"' "$claude_json")
  keywords=$(jq -c '.keywords // []' "$claude_json")
  # Read mcpServers as raw JSON (preserves type: string, array, or object)
  mcp_servers=$(jq -c '.mcpServers // empty' "$claude_json")

  if [ -z "$description" ]; then
    printf "[%3d/%d] %-40s SKIP (no description)\n" "$count" "$total" "$plugin_name"
    skipped=$((skipped + 1))
    continue
  fi

  # Derive Codex-specific fields
  category=$(categorize_skill "$plugin_name")
  codex_category=$(map_codex_category "$category")
  display_name=$(to_display_name "$plugin_name")
  short_desc=$(echo "$description" | cut -c1-80)
  # Ensure short_desc doesn't end mid-word; trim to last space if truncated
  if [ ${#description} -gt 80 ]; then
    short_desc=$(echo "$short_desc" | sed 's/ [^ ]*$//')
    if [ -z "$short_desc" ]; then
      short_desc=$(echo "$description" | cut -c1-80)
    fi
  fi
  default_prompts=$(generate_default_prompts "$display_name" "$description")

  # Build the Codex plugin.json using jq for proper escaping
  codex_json=$(jq -n \
    --arg name "$plugin_name" \
    --arg version "$version" \
    --arg description "$description" \
    --argjson author "$author" \
    --arg license "$license" \
    --arg repository "$repository" \
    --argjson keywords "$keywords" \
    --arg skills "./skills/" \
    --arg display_name "$display_name" \
    --arg short_desc "$short_desc" \
    --arg long_desc "$description" \
    --arg dev_name "Claude Skills Maintainers" \
    --arg category "$codex_category" \
    --argjson default_prompts "$default_prompts" \
    '{
      name: $name,
      version: $version,
      description: $description,
      author: $author,
      license: $license,
      repository: $repository,
      keywords: $keywords,
      skills: $skills,
      interface: {
        displayName: $display_name,
        shortDescription: $short_desc,
        longDescription: $long_desc,
        developerName: $dev_name,
        category: $category,
        capabilities: ["Read", "Write"],
        defaultPrompt: $default_prompts
      }
    }')

  # Add mcpServers if present in Claude manifest.
  # With jq -c, a string value comes out quoted ("./.mcp.json"), arrays/objects
  # stay compact JSON. We re-parse with --argjson which handles all types.
  if [ -n "$mcp_servers" ] && [ "$mcp_servers" != "null" ]; then
    if echo "$mcp_servers" | jq -e . >/dev/null 2>&1; then
      codex_json=$(echo "$codex_json" | jq --argjson mcp "$mcp_servers" '.mcpServers = $mcp')
    fi
  fi

  # Write .codex-plugin/plugin.json
  codex_dir="$plugin_dir/.codex-plugin"
  codex_json_file="$codex_dir/plugin.json"

  if [ "$DRY_RUN" = false ]; then
    mkdir -p "$codex_dir"
    echo "$codex_json" | jq '.' > "$codex_json_file"
  fi

  printf "[%3d/%d] %-40s → %s\n" "$count" "$total" "$plugin_name" "$codex_category"

  # Add marketplace entry
  # Codex marketplace uses source object with source: "local" and path
  marketplace_entry=$(jq -n \
    --arg name "$plugin_name" \
    --arg path "./plugins/$plugin_name" \
    --arg category "$codex_category" \
    '{
      name: $name,
      source: { source: "local", path: $path },
      policy: { installation: "AVAILABLE" },
      category: $category
    }')

  if [ "$first_entry" = true ]; then
    first_entry=false
  else
    echo "," >> "$MARKETPLACE_TMP"
  fi
  echo "$marketplace_entry" | jq -c '.' | sed 's/^/    /' >> "$MARKETPLACE_TMP"

done < <(find "$PLUGINS_DIR" -mindepth 1 -maxdepth 1 -type d | sort)

# Close marketplace JSON
echo "" >> "$MARKETPLACE_TMP"
echo "  ]" >> "$MARKETPLACE_TMP"
echo "}" >> "$MARKETPLACE_TMP"

# Validate and write marketplace
if jq empty "$MARKETPLACE_TMP" 2>/dev/null; then
  if [ "$DRY_RUN" = false ]; then
    jq '.' "$MARKETPLACE_TMP" > "$CODEX_MARKETPLACE_JSON"
  fi
else
  echo "❌ ERROR: Generated Codex marketplace JSON is invalid" >&2
  exit 1
fi

echo ""
echo "============================================"
echo "Codex Manifest Generation Complete"
echo "============================================"
echo ""
echo "Plugins processed: $count"
echo "Plugins skipped:   $skipped"
echo "Codex marketplace: $CODEX_MARKETPLACE_JSON"
echo ""

if [ "$DRY_RUN" = false ]; then
  marketplace_plugin_count=$(jq '.plugins | length' "$CODEX_MARKETPLACE_JSON")
  echo "Codex marketplace plugins: $marketplace_plugin_count"
  codex_manifest_count=$(find "$PLUGINS_DIR" -path '*/.codex-plugin/plugin.json' | wc -l | tr -d ' ')
  echo "Codex manifests generated: $codex_manifest_count"
else
  echo "Dry run complete. No files were modified."
fi
echo ""
echo "Next steps:"
echo "  1. Validate: ./scripts/validate-json-schemas.sh"
echo "  2. Install in Codex: codex plugin marketplace add secondsky/claude-skills"
echo "  3. Browse in Codex TUI: /plugins"
echo ""

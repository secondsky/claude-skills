#!/bin/bash
#
# migrate-plugin-structure.sh
# Migrates all plugins to official Claude Code structure with skills/ subdirectory
#
# Usage: ./scripts/migrate-plugin-structure.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLUGINS_DIR="$REPO_ROOT/plugins"

echo "🔄 Migrating all plugins to official structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

migrated=0
skipped=0
errors=0

for plugin_path in "$PLUGINS_DIR"/*/ ; do
  [ -d "$plugin_path" ] || continue

  plugin_name=$(basename "$plugin_path")

  # Skip if already migrated
  if [ -d "$plugin_path/skills" ]; then
    echo "⏭️  Skipping $plugin_name (already has skills/ directory)"
    ((skipped++))
    continue
  fi

  # Skip if no SKILL.md exists
  if [ ! -f "$plugin_path/SKILL.md" ]; then
    echo "⚠️  Skipping $plugin_name (no SKILL.md found)"
    ((skipped++))
    continue
  fi

  echo "📦 Migrating $plugin_name..."

  # Create skills subdirectory
  mkdir -p "$plugin_path/skills/$plugin_name"

  # Move SKILL.md
  if [ -f "$plugin_path/SKILL.md" ]; then
    mv "$plugin_path/SKILL.md" "$plugin_path/skills/$plugin_name/" || { echo "❌ Error moving SKILL.md for $plugin_name"; ((errors++)); continue; }
  fi

  # Move references/ if exists
  if [ -d "$plugin_path/references" ]; then
    mv "$plugin_path/references" "$plugin_path/skills/$plugin_name/" || echo "   ⚠️  Warning: Could not move references/"
  fi

  # Move templates/ if exists
  if [ -d "$plugin_path/templates" ]; then
    mv "$plugin_path/templates" "$plugin_path/skills/$plugin_name/" || echo "   ⚠️  Warning: Could not move templates/"
  fi

  # Move scripts/ if exists
  if [ -d "$plugin_path/scripts" ]; then
    mv "$plugin_path/scripts" "$plugin_path/skills/$plugin_name/" || echo "   ⚠️  Warning: Could not move scripts/"
  fi

  # Move assets/ if exists
  if [ -d "$plugin_path/assets" ]; then
    mv "$plugin_path/assets" "$plugin_path/skills/$plugin_name/" || echo "   ⚠️  Warning: Could not move assets/"
  fi

  # Move examples/ if exists
  if [ -d "$plugin_path/examples" ]; then
    mv "$plugin_path/examples" "$plugin_path/skills/$plugin_name/" || echo "   ⚠️  Warning: Could not move examples/"
  fi

  echo "   ✅ Migrated $plugin_name"
  ((migrated++))
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Migration Summary:"
echo "   ✅ Migrated: $migrated plugins"
echo "   ⏭️  Skipped:  $skipped plugins"
echo "   ❌ Errors:   $errors plugins"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $migrated -gt 0 ]; then
  echo ""
  echo "✨ Next steps:"
  echo "   1. Review changes: git status"
  echo "   2. Regenerate marketplace: ./scripts/generate-marketplace.sh"
  echo "   3. Commit changes: git add -A && git commit -m 'refactor: Migrate all plugins to official skills/ structure'"
fi

exit 0

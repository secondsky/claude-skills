#!/bin/bash
set -e

echo "Removing invalid 'category' field from plugin.json files..."
echo ""

count=0
for plugin_json in plugins/*/.claude-plugin/plugin.json; do
  if [ -f "$plugin_json" ] && grep -q '"category"' "$plugin_json"; then
    plugin_name=$(basename "$(dirname "$(dirname "$plugin_json")")")
    echo "[$((count+1))] Fixing: $plugin_name"

    # Use jq to remove category field
    jq 'del(.category)' "$plugin_json" > "$plugin_json.tmp"
    mv "$plugin_json.tmp" "$plugin_json"

    count=$((count+1))
  fi
done

echo ""
echo "✅ Fixed $count plugin.json files"
echo ""
echo "Verification:"
for plugin_json in plugins/*/.claude-plugin/plugin.json; do
  if grep -q '"category"' "$plugin_json" 2>/dev/null; then
    echo "❌ FAILED: $(dirname "$(dirname "$plugin_json")")"
  fi
done
echo "No remaining category fields found."

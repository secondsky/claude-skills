#!/bin/bash

# Count npm/npx/pnpm instances per skill

find /home/user/claude-skills/skills -name "SKILL.md" -type f | sort | while read -r file; do
  count=$(grep -c -E '\b(npm install|npm i|npx|pnpm install|pnpm add)\b' "$file" 2>/dev/null || echo "0")
  if [ "$count" -gt 0 ]; then
    skill_name=$(basename "$(dirname "$file")")
    echo "$count|$skill_name"
  fi
done | sort -rn -t'|' -k1

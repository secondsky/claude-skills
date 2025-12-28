#!/bin/bash

# Migrate all SKILL.md files to prefer Bun package manager
# This script updates npm/npx/pnpm references to bun/bunx

SKILLS_DIR="/home/user/claude-skills/skills"

echo "Starting Bun migration for all SKILL.md files..."

# Get list of all SKILL.md files that need updating
files_to_update=$(find "$SKILLS_DIR" -name "SKILL.md" -type f -exec grep -l -E '\b(npm install|npm i|npx|pnpm install|pnpm add)\b' {} \;)

for file in $files_to_update; do
    skill_name=$(basename "$(dirname "$file")")
    echo "Processing: $skill_name"

    # Apply sed transformations directly
    # 1. Replace "npm install package" with "bun add package"
    sed -i 's/\bnpm install \([a-z@][^ \n]*\)/bun add \1/g' "$file"

    # 2. Replace "npm i package" with "bun add package"
    sed -i 's/\bnpm i \([a-z@][^ \n]*\)/bun add \1/g' "$file"

    # 3. Replace standalone "npm install" with "bun install"
    sed -i 's/\bnpm install[[:space:]]*$/bun install/g' "$file"

    # 4. Replace "npx " with "bunx "
    sed -i 's/\bnpx /bunx /g' "$file"

    # 5. Replace "pnpm add package" with "bun add package"
    sed -i 's/\bpnpm add \([a-z@][^ \n]*\)/bun add \1/g' "$file"

    # 6. Replace "pnpm install package" with "bun add package"
    sed -i 's/\bpnpm install \([a-z@][^ \n]*\)/bun add \1/g' "$file"

    # 7. Replace standalone "pnpm install" with "bun install"
    sed -i 's/\bpnpm install[[:space:]]*$/bun install/g' "$file"

    # 8. Update comment prefixes from "# npm:" to "# or:"
    sed -i 's/# npm:/# or:/g' "$file"

    # 9. Update comment prefixes from "# pnpm:" to "# or:"
    sed -i 's/# pnpm:/# or:/g' "$file"
done

echo "Migration complete!"
echo "Total files updated: $(echo "$files_to_update" | wc -w)"

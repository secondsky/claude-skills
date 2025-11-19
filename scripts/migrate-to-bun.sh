#!/bin/bash

# Migrate all SKILL.md files to prefer Bun package manager
# This script updates npm/npx/pnpm references to bun/bunx

set -e

SKILLS_DIR="/home/user/claude-skills/skills"
BACKUP_SUFFIX=".pre-bun-backup"

echo "Starting Bun migration for all SKILL.md files..."
echo "================================================"

# Counter
total=0
updated=0

# Find all SKILL.md files
while read -r file; do
    ((total++))

    skill_name=$(basename "$(dirname "$file")")

    # Check if file contains npm/npx/pnpm references
    if grep -q -E '\b(npm install|npm i|npx|pnpm install|pnpm add)\b' "$file"; then
        echo "Updating: $skill_name"

        # Create backup
        cp "$file" "${file}${BACKUP_SUFFIX}"

        # Apply transformations using sed
        # Note: Using -i.tmp for compatibility across platforms

        # 1. Replace standalone "npm install" or "npm i" with "bun add"
        #    But keep package.json installs as "bun install"
        sed -i.tmp 's/\bnpm install \([a-z@][^ ]*\)/bun add \1/g' "$file"
        sed -i.tmp 's/\bnpm i \([a-z@][^ ]*\)/bun add \1/g' "$file"

        # 2. Replace "npm install" (without package name, for package.json) with "bun install"
        sed -i.tmp 's/\bnpm install$/bun install/g' "$file"
        sed -i.tmp 's/\bnpm install\b$/bun install/g' "$file"

        # 3. Replace npx with bunx
        sed -i.tmp 's/\bnpx /bunx /g' "$file"

        # 4. Replace pnpm install/add with bun add
        sed -i.tmp 's/\bpnpm install \([a-z@][^ ]*\)/bun add \1/g' "$file"
        sed -i.tmp 's/\bpnpm add /bun add /g' "$file"
        sed -i.tmp 's/\bpnpm install$/bun install/g' "$file"

        # 5. Update comment prefixes
        # "# npm:" -> "# or:"
        # "# pnpm:" -> "# or:"
        sed -i.tmp 's/# npm:/# or:/g' "$file"
        sed -i.tmp 's/# pnpm:/# or:/g' "$file"

        # Clean up temp file
        rm -f "${file}.tmp"

        ((updated++))
    fi
done < <(find "$SKILLS_DIR" -name "SKILL.md" -type f | sort)

echo "================================================"
echo "Migration complete!"
echo "Total SKILL.md files processed: $total"
echo "Files updated: $updated"
echo ""
echo "Backup files created with suffix: $BACKUP_SUFFIX"
echo "Run 'find $SKILLS_DIR -name '*$BACKUP_SUFFIX' -delete' to remove backups after verification"

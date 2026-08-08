#!/usr/bin/env bash

# check-versions.sh - Check if skill dependencies are up-to-date
# Usage: ./scripts/check-versions.sh [skill-name]
#
# If skill-name is provided, checks that skill only
# Otherwise, checks all skills
#
# Exit code: Always 0 (info only, no failures)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Skills live under plugins/<plugin>/skills/<skill>/ and .agents/skills/<skill>/
# (the repo was restructured away from a flat top-level skills/ directory).
PLUGINS_DIR="$REPO_ROOT/plugins"
AGENTS_SKILLS_DIR="$REPO_ROOT/.agents/skills"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Dependency Version Checker${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to check a single package.json file
check_package_json() {
    local file="$1"
    local skill_name="$2"
    local warnings=0

    echo -e "${BLUE}Checking: $skill_name${NC}"

    # Extract dependencies. `head -n -1` is GNU-only and errors on macOS/BSD
    # (silently zeroing the dep list under `|| true`); use `sed '$d'` to drop
    # the closing brace line, which is portable across BSD and GNU sed.
    local deps=$(cat "$file" | grep -A 999 '"dependencies"' | grep -B 999 '}' | sed '$d' | tail -n +2 || true)
    local devDeps=$(cat "$file" | grep -A 999 '"devDependencies"' | grep -B 999 '}' | sed '$d' | tail -n +2 || true)

    # Combine all deps
    local all_deps="$deps"$'\n'"$devDeps"

    # Check each dependency
    while IFS= read -r line; do
        if [[ $line =~ \"([^\"]+)\":[[:space:]]*\"([^^~]*)([0-9]+\.[0-9]+\.[0-9]+) ]]; then
            local pkg="${BASH_MATCHES[1]}"
            local current="${BASH_MATCHES[3]}"

            # Skip @types and internal packages
            if [[ $pkg == @types/* ]] || [[ $pkg == file:* ]]; then
                continue
            fi

            # Get latest version from npm (with timeout)
            local latest=$(timeout 5 npm view "$pkg" version 2>/dev/null || echo "error")

            if [ "$latest" == "error" ]; then
                echo -e "  ${YELLOW}⚠${NC}  $pkg@$current (couldn't fetch latest)"
                continue
            fi

            # Compare versions (simple string comparison)
            if [ "$current" != "$latest" ]; then
                echo -e "  ${YELLOW}⚠${NC}  $pkg@$current → $latest available"
                ((warnings++))
            else
                echo -e "  ${GREEN}✓${NC}  $pkg@$current (up-to-date)"
            fi
        fi
    done <<< "$all_deps"

    if [ $warnings -eq 0 ]; then
        echo -e "${GREEN}  All dependencies up-to-date!${NC}"
    else
        echo -e "${YELLOW}  $warnings update(s) available${NC}"
    fi

    echo ""
    return 0
}

# Resolve a skill name to its directory across the supported layouts:
#   plugins/<plugin>/skills/<skill>/   (multi-skill plugin, or name matches plugin)
#   plugins/<skill>/skills/<skill>/    (single-skill plugin)
#   .agents/skills/<skill>/
# Echoes the resolved path (empty if not found).
resolve_skill_dir() {
    local name="$1"
    local candidate
    # Multi-skill / namespaced: plugins/<plugin>/skills/<skill>
    while IFS= read -r candidate; do
        if [ -d "$candidate" ]; then echo "$candidate"; return 0; fi
    done < <(find "$PLUGINS_DIR" -maxdepth 3 -type d -path "*/skills/$name" 2>/dev/null)
    # Agent skills
    if [ -d "$AGENTS_SKILLS_DIR/$name" ]; then
        echo "$AGENTS_SKILLS_DIR/$name"
        return 0
    fi
    return 1
}

# Find every skill directory in the repo (one per SKILL.md).
all_skill_dirs() {
    # plugins/<plugin>/skills/<skill>/ that contain a SKILL.md
    find "$PLUGINS_DIR" -mindepth 3 -maxdepth 4 -type f -name "SKILL.md" \
        -path "*/skills/*/SKILL.md" 2>/dev/null \
        | sed 's#/SKILL\.md$##' | sort -u
    # .agents/skills/<skill>/
    find "$AGENTS_SKILLS_DIR" -mindepth 2 -maxdepth 2 -type f -name "SKILL.md" 2>/dev/null \
        | sed 's#/SKILL\.md$##' | sort -u
}

# Check if specific skill provided
if [ -n "$1" ]; then
    SKILL_NAME="$1"
    SKILL_DIR="$(resolve_skill_dir "$SKILL_NAME")"

    if [ -z "$SKILL_DIR" ] || [ ! -d "$SKILL_DIR" ]; then
        echo -e "${RED}Error: Skill '$SKILL_NAME' not found${NC}"
        echo ""
        echo "Available skills:"
        all_skill_dirs | sed 's#.*/skills/##' | sort
        exit 0  # Still exit 0 (info only)
    fi

    # Check for package.json in templates/, references/, examples/, or skill root
    if [ -f "$SKILL_DIR/templates/package.json" ]; then
        check_package_json "$SKILL_DIR/templates/package.json" "$SKILL_NAME"
    elif [ -f "$SKILL_DIR/references/package.json" ]; then
        check_package_json "$SKILL_DIR/references/package.json" "$SKILL_NAME"
    elif [ -f "$SKILL_DIR/package.json" ]; then
        check_package_json "$SKILL_DIR/package.json" "$SKILL_NAME"
    else
        echo -e "${YELLOW}No package.json found for $SKILL_NAME${NC}"
        echo ""
    fi

    exit 0
fi

# Check all skills
TOTAL_SKILLS=0
SKILLS_WITH_DEPS=0

while IFS= read -r skill_dir; do
    [ -z "$skill_dir" ] && continue
    skill_name="$(basename "$skill_dir")"
    ((TOTAL_SKILLS++))

    # Look for package.json in templates/, references/, or skill root
    found=""
    for sub in templates references .; do
        if [ -f "$skill_dir/$sub/package.json" ]; then
            check_package_json "$skill_dir/$sub/package.json" "$skill_name"
            found=1
            break
        fi
    done
    [ -n "$found" ] && ((SKILLS_WITH_DEPS++))
done < <(all_skill_dirs)

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo "Total skills: $TOTAL_SKILLS"
echo "Skills with dependencies: $SKILLS_WITH_DEPS"
echo ""
echo -e "${GREEN}ℹ${NC}  This is informational only - no automatic updates performed"
echo -e "${GREEN}ℹ${NC}  Review warnings and update skills manually as needed"
echo ""

# Always exit 0 (informational only, never fail builds)
exit 0

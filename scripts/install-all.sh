#!/usr/bin/env bash

# install-all.sh - Install all skills from dev to production
# Usage: ./scripts/install-all.sh [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments: accept --dry-run and forward it to install-skill.sh.
# In dry-run mode we print the plan (which skills would be installed,
# what each symlink would look like) without mutating $HOME.
DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --help|-h)
            echo "Usage: ./scripts/install-all.sh [--dry-run]"
            exit 0
            ;;
        *)
            echo -e "${RED}Error: unknown argument '$arg'${NC}" >&2
            echo "Usage: ./scripts/install-all.sh [--dry-run]" >&2
            exit 1
            ;;
    esac
done

dry_run_echo() { [ "$DRY_RUN" = "1" ] && echo "DRY-RUN: $*"; }

# Arguments to forward to install-skill.sh on each invocation.
INSTALL_ARGS=()
[ "$DRY_RUN" = "1" ] && INSTALL_ARGS+=(--dry-run)

# Paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
INSTALL_SCRIPT="$REPO_ROOT/scripts/install-skill.sh"

# Make install script executable
chmod +x "$INSTALL_SCRIPT"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Claude Skills - Install All${NC}"
if [ "$DRY_RUN" = "1" ]; then
    echo -e "${BLUE}  (DRY-RUN mode — no filesystem changes)${NC}"
fi
echo -e "${BLUE}=====================================${NC}"
echo ""

# Count skills
SKILL_COUNT=$(find "$SKILLS_DIR" -maxdepth 1 -type d ! -path "$SKILLS_DIR" | wc -l)

if [ "$SKILL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No skills found in $SKILLS_DIR${NC}"
    exit 0
fi

echo -e "${GREEN}Found $SKILL_COUNT skill(s) to install${NC}"
echo ""

# Install each skill
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_SKILLS=()

for skill_dir in "$SKILLS_DIR"/*/ ; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")

        if [ "$DRY_RUN" = "1" ]; then
            dry_run_echo "would install '$skill_name' (~/.claude/skills/$skill_name -> $SKILLS_DIR/$skill_name)"
        else
            echo -e "${BLUE}Installing: $skill_name${NC}"
        fi

        if "$INSTALL_SCRIPT" "$skill_name" "${INSTALL_ARGS[@]}"; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            echo ""
        else
            FAIL_COUNT=$((FAIL_COUNT + 1))
            FAILED_SKILLS+=("$skill_name")
            echo -e "${RED}Failed to install: $skill_name${NC}"
            echo ""
        fi
    fi
done

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Installation Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}✓ Installed: $SUCCESS_COUNT${NC}"

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAIL_COUNT${NC}"
    echo -e "${RED}  Failed skills: ${FAILED_SKILLS[*]}${NC}"
fi

echo ""

if [ "$SUCCESS_COUNT" -gt 0 ]; then
    if [ "$DRY_RUN" = "1" ]; then
        echo -e "${GREEN}DRY-RUN: would symlink the above $SUCCESS_COUNT skill(s) to ~/.claude/skills/${NC}"
    else
        echo -e "${GREEN}All skills are now symlinked to ~/.claude/skills/${NC}"
        echo -e "${GREEN}Claude Code will auto-discover them!${NC}"
    fi
fi

# Exit with error if any failed
if [ "$FAIL_COUNT" -gt 0 ]; then
    exit 1
fi

#!/usr/bin/env bash

# install-skill.sh - Symlink a skill from dev to production
# Usage: ./scripts/install-skill.sh <skill-name> [--dry-run]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments: scan for --dry-run (anywhere in argv) and treat the
# first non-flag positional as the skill name. --dry-run lets a user
# (or install-all.sh) preview exactly what would happen without
# performing any FS mutation.
DRY_RUN=0
SKILL_NAME=""
for arg in "$@"; do
    case "$arg" in
        --dry-run)
            DRY_RUN=1
            ;;
        --help|-h)
            echo "Usage: ./scripts/install-skill.sh <skill-name> [--dry-run]"
            exit 0
            ;;
        *)
            if [ -z "$SKILL_NAME" ]; then
                SKILL_NAME="$arg"
            else
                echo -e "${RED}Error: unexpected extra argument '$arg'${NC}" >&2
                echo "Usage: ./scripts/install-skill.sh <skill-name> [--dry-run]" >&2
                exit 1
            fi
            ;;
    esac
done

dry_run_echo() { [ "$DRY_RUN" = "1" ] && echo "DRY-RUN: $*"; }

# Reject empty / missing argument explicitly (defends against `set -u` on $1
# and against trailing-slash catastrophes like `rm -rf ~/.claude/skills/`).
if [ -z "$SKILL_NAME" ]; then
    echo -e "${RED}Error: Skill name required${NC}"
    echo "Usage: ./scripts/install-skill.sh <skill-name>"
    echo ""
    echo "Example: ./scripts/install-skill.sh cloudflare-react-full-stack"
    exit 1
fi

# Reject anything that isn't a clean skill name: no slashes, no traversal
# (`..`, `.`), no leading dash (option injection), no embedded `..` paths.
# This is the critical guard against `rm -rf` traversal that could otherwise
# wipe `$HOME/.claude` (e.g. SKILL_NAME=".." or "foo/../..").
if [[ ! "$SKILL_NAME" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
    echo -e "${RED}ERROR: invalid skill name '$SKILL_NAME'.${NC}" >&2
    echo "Skill names must start with an alphanumeric character and contain only [A-Za-z0-9._-]." >&2
    exit 2
fi

# Paths
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_SOURCE="$REPO_ROOT/skills/$SKILL_NAME"
SKILL_TARGET="$HOME/.claude/skills/$SKILL_NAME"

# Verify source skill exists
if [ ! -d "$SKILL_SOURCE" ]; then
    echo -e "${RED}Error: Skill not found at $SKILL_SOURCE${NC}"
    echo ""
    echo "Available skills:"
    ls -1 "$REPO_ROOT/skills/" 2>/dev/null || echo "  (none found)"
    exit 1
fi

# Verify required files exist
if [ ! -f "$SKILL_SOURCE/README.md" ]; then
    echo -e "${YELLOW}Warning: $SKILL_NAME is missing README.md${NC}"
fi

if [ ! -f "$SKILL_SOURCE/SKILL.md" ]; then
    echo -e "${YELLOW}Warning: $SKILL_NAME is missing SKILL.md${NC}"
fi

# Create ~/.claude/skills/ directory if it doesn't exist
if [ "$DRY_RUN" = "1" ]; then
    dry_run_echo "would mkdir -p $HOME/.claude/skills"
else
    mkdir -p "$HOME/.claude/skills"
fi

# Resolve the real path of the skills directory once. We use this for the
# destructive-op bound check below (only the `rm -rf` non-symlink branch
# needs it — the `rm`-of-symlink branch is intrinsically safe).
# In dry-run we may legitimately not have a skills dir yet; tolerate that.
SKILLS_DIR_REAL="$(cd "$HOME/.claude/skills" 2>/dev/null && pwd -P)" || {
    if [ "$DRY_RUN" = "1" ]; then
        SKILLS_DIR_REAL="<absent: $HOME/.claude/skills>"
    else
        echo -e "${RED}ERROR: $HOME/.claude/skills does not exist or is not accessible.${NC}" >&2
        exit 1
    fi
}

# Remove existing symlink or directory
if [ -L "$SKILL_TARGET" ]; then
    # Safe: `rm` on a symlink just removes the link itself, never what it
    # points at. No bound check needed here.
    if [ "$DRY_RUN" = "1" ]; then
        dry_run_echo "would remove existing symlink '$SKILL_TARGET'"
    else
        echo -e "${YELLOW}Removing existing symlink...${NC}"
        rm "$SKILL_TARGET"
    fi
elif [ -d "$SKILL_TARGET" ]; then
    # Canonical-path bound check: only `pwd -P` the target if it is a real
    # directory (not a symlink). This is defense-in-depth on top of the
    # SKILL_NAME regex — if `~/.claude/skills/<name>` were itself a symlink
    # to somewhere outside (e.g. via a symlink loop or hostile pre-setup),
    # `rm -rf` would escape. We refuse before any destructive op.
    SKILL_TARGET_REAL="$(cd "$SKILL_TARGET" 2>/dev/null && pwd -P || true)"
    if [[ -z "$SKILL_TARGET_REAL" ]] || [[ "$SKILL_TARGET_REAL" != "$SKILLS_DIR_REAL"/* ]]; then
        echo -e "${RED}ERROR: resolved target '$SKILL_TARGET_REAL' is outside $SKILLS_DIR_REAL — refusing to proceed.${NC}" >&2
        exit 1
    fi
    if [ "$DRY_RUN" = "1" ]; then
        dry_run_echo "would remove existing target '$SKILL_TARGET_REAL' (if exists)"
    else
        echo -e "${YELLOW}Warning: $SKILL_TARGET_REAL exists and is not a symlink${NC}"
        read -p "Remove existing '$SKILL_TARGET_REAL' and reinstall? [y/N] " confirm
        [[ "$confirm" =~ ^[Yy]$ ]] || { echo -e "${RED}Aborted.${NC}"; exit 1; }
        rm -rf "$SKILL_TARGET"
    fi
fi

# Create symlink (atomic replace via -n: don't dereference existing dir
# symlinks; -f: force overwrite any existing entry at the target path).
if [ "$DRY_RUN" = "1" ]; then
    dry_run_echo "would create symlink $SKILL_SOURCE -> $SKILL_TARGET"
    echo -e "${GREEN}DRY-RUN complete; no files modified.${NC}"
    exit 0
fi

echo -e "${GREEN}Creating symlink...${NC}"
ln -snf "$SKILL_SOURCE" "$SKILL_TARGET"

# Verify symlink
if [ -L "$SKILL_TARGET" ]; then
    echo -e "${GREEN}✓ Skill installed successfully!${NC}"
    echo ""
    echo "Source:  $SKILL_SOURCE"
    echo "Target:  $SKILL_TARGET"
    echo ""
    echo -e "${GREEN}Claude Code will now auto-discover this skill.${NC}"
else
    echo -e "${RED}Error: Failed to create symlink${NC}"
    exit 1
fi

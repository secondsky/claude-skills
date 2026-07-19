#!/bin/bash
# Setup /ask-gemini slash command for Claude Code
# Part of gemini-cli-integration skill
# Usage: setup-slash-command.sh [--dry-run]

set -e

# Parse --dry-run from argv (anywhere). In dry-run mode we print what
# would be installed/backed up without touching the filesystem.
DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --help|-h)
            echo "Usage: setup-slash-command.sh [--dry-run]"
            exit 0
            ;;
        *)
            echo "Error: unknown argument '$arg'" >&2
            echo "Usage: setup-slash-command.sh [--dry-run]" >&2
            exit 1
            ;;
    esac
done

dry_run_echo() { [ "$DRY_RUN" = "1" ] && echo "DRY-RUN: $*"; }

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMANDS_DIR="$HOME/.claude/commands"
COMMAND_NAME="ask-gemini.md"

# Install a file without silently clobbering user customizations. If the
# destination already exists and differs from the source, back it up to
# <dst>.bak.<timestamp> before overwriting, so user edits are recoverable.
# In dry-run mode, describe what would happen instead of mutating disk.
install_file() {
    local src="$1"
    local dst="$2"
    if [ "$DRY_RUN" = "1" ]; then
        if [ -f "$dst" ] && ! diff -q "$src" "$dst" >/dev/null 2>&1; then
            local ts
            ts="$(date +%Y%m%d%H%M%S)"
            dry_run_echo "would back up existing '$dst' to '${dst}.bak.${ts}'"
        fi
        dry_run_echo "would install '$src' -> '$dst'"
        return
    fi
    if [ -f "$dst" ] && ! diff -q "$src" "$dst" >/dev/null 2>&1; then
        local ts
        ts="$(date +%Y%m%d%H%M%S)"
        cp "$dst" "${dst}.bak.${ts}"
        echo "ℹ️  Backed up existing $dst to ${dst}.bak.${ts}"
    fi
    cp "$src" "$dst"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting up /ask-gemini slash command"
if [ "$DRY_RUN" = "1" ]; then
    echo "  (DRY-RUN mode — no filesystem changes)"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if source file exists
if [ ! -f "$SKILL_DIR/assets/$COMMAND_NAME" ]; then
  echo "❌ Error: $SKILL_DIR/assets/$COMMAND_NAME not found"
  echo ""
  echo "Make sure you're running this from the skill directory:"
  echo "  cd /path/to/claude-skills/skills/gemini-cli-integration/"
  echo "  ./scripts/setup-slash-command.sh"
  exit 1
fi

# Create ~/.claude/commands if it doesn't exist
if [ "$DRY_RUN" = "1" ]; then
    if [ ! -d "$COMMANDS_DIR" ]; then
        dry_run_echo "would mkdir -p '$COMMANDS_DIR'"
    fi
else
    if [ ! -d "$COMMANDS_DIR" ]; then
      echo "Creating $COMMANDS_DIR..."
      mkdir -p "$COMMANDS_DIR"
    fi
fi

# Copy command file (backing up any pre-existing user version that differs)
if [ "$DRY_RUN" = "1" ]; then
    install_file "$SKILL_DIR/assets/$COMMAND_NAME" "$COMMANDS_DIR/$COMMAND_NAME"
    echo ""
    echo "DRY-RUN complete; no files modified."
    exit 0
fi

echo "Copying $COMMAND_NAME to $COMMANDS_DIR..."
install_file "$SKILL_DIR/assets/$COMMAND_NAME" "$COMMANDS_DIR/$COMMAND_NAME"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Slash command installed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Usage in Claude Code sessions:"
echo "  /ask-gemini Should I use D1 or KV for sessions?"
echo "  /ask-gemini architect: Best way to handle WebSockets?"
echo "  /ask-gemini review src/auth.ts for security issues"
echo ""
echo "The command will invoke gemini-coach with appropriate"
echo "prompts and return Gemini's analysis to Claude Code."
echo ""

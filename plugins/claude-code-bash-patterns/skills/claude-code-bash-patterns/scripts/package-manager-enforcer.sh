#!/bin/bash
#
# Package Manager Enforcer - PreToolUse Hook for Claude Code
#
# Enforces consistent package manager usage based on lockfile.
# Prevents mixing npm/pnpm/yarn in the same project.
#
# Usage:
#   Configure as PreToolUse hook in ~/.claude/settings.json:
#
#   {
#     "hooks": {
#       "PreToolUse": [
#         {
#           "matcher": "Bash",
#           "hooks": [
#             {
#               "type": "command",
#               "command": "~/.claude/hooks/package-manager-enforcer.sh"
#             }
#           ]
#         }
#       ]
#     }
#   }
#
# Input:
#   Reads JSON from stdin (Claude Code PreToolUse payload shape):
#     {"tool_input": {"command": "...", ...}, ...}
#   Previously this hook read $CLAUDE_TOOL_INPUT (env var) — that was wrong;
#   Claude Code sends the payload on stdin, not via env. With the wrong
#   source, COMMAND was always empty and the block logic never fired.
#
# Exit Codes:
#   0 = Allow execution
#   2 = Block with custom error message

# Parse command from stdin (Claude Code PreToolUse JSON payload)
INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Detect package manager from lockfile
DETECTED_PM=""
if [ -f "pnpm-lock.yaml" ]; then
    DETECTED_PM="pnpm"
elif [ -f "yarn.lock" ]; then
    DETECTED_PM="yarn"
elif [ -f "package-lock.json" ]; then
    DETECTED_PM="npm"
else
    # No lockfile detected, allow any package manager
    exit 0
fi

# Check if command uses a different package manager
if printf '%s' "$COMMAND" | grep -qE '^(npm|pnpm|yarn)[[:space:]]+'; then
    # Extract package manager from command
    USED_PM=$(printf '%s' "$COMMAND" | grep -oE '^(npm|pnpm|yarn)' | head -n1)

    # Check if it matches detected package manager
    if [ "$USED_PM" != "$DETECTED_PM" ]; then
        ERROR_MSG="BLOCKED: Package manager mismatch

Detected lockfile: ${DETECTED_PM}-lock.yaml / ${DETECTED_PM}.lock / package-lock.json
Command uses: ${USED_PM}

This project uses ${DETECTED_PM}. Please use '${DETECTED_PM}' instead of '${USED_PM}'.

Examples:
  ${DETECTED_PM} install
  ${DETECTED_PM} add <package>
  ${DETECTED_PM} run <script>

If you want to switch package managers:
  1. Delete the old lockfile
  2. Run '${USED_PM} install' to create new lockfile
  3. Commit the new lockfile
"
        echo "$ERROR_MSG" >&2
        exit 2
    fi
fi

# Allow execution
exit 0

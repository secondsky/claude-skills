#!/bin/bash
# Bun Command Validator
# PreToolUse hook to validate Bun commands before execution
#
# Invoked via: bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/validate-bun-command.sh
# (the shebang above is informational; the exec bit is not required)
#
# This is an ADVISORY hook: it never blocks (always exits 0) and only emits
# suggestions/warnings on stdout for Claude to surface.

set -euo pipefail
IFS=$'\n\t'

# jq is a hard dependency of Claude Code hooks (sibling plugins already require
# it). We do not implement a fragile grep/sed fallback parser here because
# half-correct JSON parsing is a security liability. If jq is missing, log and
# no-op (still exit 0 — this hook must never block).
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required for the bun hook (skipping)" >&2
  exit 0
fi

# Read tool input from stdin
INPUT=$(cat)

# Extract command from JSON input. Use `|| true` so a jq parse failure on
# malformed input does NOT abort the script under `set -e` — this is an
# advisory hook and must never block.
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // .input.command // empty' 2>/dev/null || true)

# Skip if no command found (graceful handling)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Skip if not a bun-related command
if ! printf '%s' "$COMMAND" | grep -qE '^(bun|bunx|npm|npx|yarn|pnpm)'; then
  exit 0
fi

# Check for npm/yarn/pnpm commands that should use bun
if printf '%s' "$COMMAND" | grep -qE '^(npm|npx|yarn|pnpm) '; then
  echo "SUGGESTION: Consider using Bun equivalents for faster execution:"
  echo "  npm install  -> bun install"
  echo "  npm run      -> bun run"
  echo "  npx          -> bunx"
  echo "  yarn add     -> bun add"
  echo "  pnpm install -> bun install"
fi

# Check for deprecated or problematic patterns
if printf '%s' "$COMMAND" | grep -qE 'bun install.*--legacy-peer-deps'; then
  echo "WARNING: --legacy-peer-deps is not needed with Bun"
fi

if printf '%s' "$COMMAND" | grep -qE 'bun.*--experimental'; then
  echo "NOTE: Most experimental features are stable in Bun 1.x"
fi

# Check for common mistakes
if printf '%s' "$COMMAND" | grep -qE 'bun run node '; then
  echo "WARNING: 'bun run node' is redundant. Use 'bun' directly."
fi

if printf '%s' "$COMMAND" | grep -qE 'bun.*ts-node'; then
  echo "WARNING: ts-node is not needed. Bun runs TypeScript natively."
fi

# Always allow the command to proceed
exit 0

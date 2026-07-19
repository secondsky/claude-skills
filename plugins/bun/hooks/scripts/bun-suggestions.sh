#!/bin/bash
# Bun Suggestions
# PostToolUse hook to provide helpful suggestions after Bun commands
#
# Invoked via: bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/bun-suggestions.sh
# (the shebang above is informational; the exec bit is not required)
#
# This is an ADVISORY hook: it never blocks (always exits 0) and only emits
# tips/suggestions on stdout for Claude to surface.

set -euo pipefail
IFS=$'\n\t'

# jq is a hard dependency of Claude Code hooks. We intentionally do NOT
# implement a grep/sed fallback parser — half-correct JSON parsing is a
# security liability. If jq is missing, log and no-op (still exit 0).
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required for the bun hook (skipping)" >&2
  exit 0
fi

# Read tool output from stdin
INPUT=$(cat)

# Extract command, exit code, and output from JSON.
# Try several field paths seen across Claude Code PostToolUse payloads.
# Use `|| true` on each so a jq parse failure on malformed input does NOT
# abort the script under `set -e` — this is an advisory hook.
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // .input.command // empty' 2>/dev/null || true)
EXIT_CODE=$(printf '%s' "$INPUT" | jq -r '.tool_response.exit_code // .exit_code // .exitCode // .result.exit_code // empty' 2>/dev/null || true)
OUTPUT=$(printf '%s' "$INPUT" | jq -r '.tool_response.stdout // .stdout // .output // .result.stdout // empty' 2>/dev/null || true)

# Skip if no command found (graceful handling)
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Skip if not a bun command
if ! printf '%s' "$COMMAND" | grep -qE '^bun'; then
  exit 0
fi

# Handle successful bun install
if printf '%s' "$COMMAND" | grep -qE '^bun install' && [ "${EXIT_CODE:-}" = "0" ]; then
  echo "TIP: Run 'bun run dev' to start development server"
fi

# Handle successful bun test
if printf '%s' "$COMMAND" | grep -qE '^bun test' && [ "${EXIT_CODE:-}" = "0" ]; then
  echo "TIP: Add --coverage for code coverage report"
  echo "TIP: Use --watch for continuous testing"
fi

# Handle failed bun test
if printf '%s' "$COMMAND" | grep -qE '^bun test' && [ "${EXIT_CODE:-}" != "0" ]; then
  echo "DEBUG TIP: Run 'bun test --verbose' for detailed output"
  echo "DEBUG TIP: Run 'bun test --bail' to stop on first failure"
fi

# Handle successful bun build
if printf '%s' "$COMMAND" | grep -qE '^bun build' && [ "${EXIT_CODE:-}" = "0" ]; then
  echo "TIP: Check dist/ directory for output files"
  echo "TIP: Add --minify for production builds"
fi

# Handle module not found errors
if printf '%s' "$OUTPUT" | grep -qiE 'cannot find module|module not found'; then
  echo "FIX: Run 'bun install' to install missing dependencies"
fi

# Handle port in use errors
if printf '%s' "$OUTPUT" | grep -qiE 'EADDRINUSE|address already in use'; then
  echo "FIX: Kill process using the port: lsof -i :PORT | grep LISTEN"
  echo "FIX: Or use a different port in your configuration"
fi

# Handle TypeScript errors
if printf '%s' "$OUTPUT" | grep -qiE 'typescript.*error|TS[0-9]+:'; then
  echo "FIX: Run 'bunx tsc --noEmit' to see all TypeScript errors"
fi

# Provide next steps after bun init
if printf '%s' "$COMMAND" | grep -qE '^bun init' && [ "${EXIT_CODE:-}" = "0" ]; then
  echo "NEXT STEPS:"
  echo "  1. Edit package.json to customize your project"
  echo "  2. Run 'bun add <packages>' to add dependencies"
  echo "  3. Run 'bun run index.ts' to start your app"
fi

exit 0

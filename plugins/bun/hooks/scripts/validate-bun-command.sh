#!/bin/bash
# Bun Command Validator
# PreToolUse hook to validate Bun commands before execution

# Read tool input from stdin
INPUT=$(cat)

# Extract command from JSON input
# Prefer jq for robust parsing, fall back to grep/sed if unavailable
if command -v jq >/dev/null 2>&1; then
    COMMAND=$(echo "$INPUT" | jq -r '.command // empty')
else
    echo "Warning: jq not found, using fallback parser (may fail on complex JSON)" >&2
    # Fallback to grep/sed for basic parsing
    COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
fi

# Validate required field
if [ -z "$COMMAND" ]; then
    echo "Error: Failed to extract 'command' from JSON input" >&2
    exit 1
fi

# Skip if not a bun-related command
if ! echo "$COMMAND" | grep -qE '^(bun|bunx|npm|npx|yarn|pnpm)'; then
    exit 0
fi

# Check for npm/yarn/pnpm commands that should use bun
if echo "$COMMAND" | grep -qE '^(npm|npx|yarn|pnpm) '; then
    echo "SUGGESTION: Consider using Bun equivalents for faster execution:"
    echo "  npm install  -> bun install"
    echo "  npm run      -> bun run"
    echo "  npx          -> bunx"
    echo "  yarn add     -> bun add"
    echo "  pnpm install -> bun install"
fi

# Check for deprecated or problematic patterns
if echo "$COMMAND" | grep -qE 'bun install.*--legacy-peer-deps'; then
    echo "WARNING: --legacy-peer-deps is not needed with Bun"
fi

if echo "$COMMAND" | grep -qE 'bun.*--experimental'; then
    echo "NOTE: Most experimental features are stable in Bun 1.x"
fi

# Check for common mistakes
if echo "$COMMAND" | grep -qE 'bun run node '; then
    echo "WARNING: 'bun run node' is redundant. Use 'bun' directly."
fi

if echo "$COMMAND" | grep -qE 'bun.*ts-node'; then
    echo "WARNING: ts-node is not needed. Bun runs TypeScript natively."
fi

# Always allow the command to proceed
exit 0

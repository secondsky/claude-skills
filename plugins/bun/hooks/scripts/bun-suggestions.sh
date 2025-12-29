#!/bin/bash
# Bun Suggestions
# PostToolUse hook to provide helpful suggestions after Bun commands

# Read tool output from stdin
INPUT=$(cat)

# Extract command, exit code, and output from JSON
# Prefer jq for robust parsing, fall back to grep/sed if unavailable
if command -v jq >/dev/null 2>&1; then
    COMMAND=$(echo "$INPUT" | jq -r '.command // empty')
    EXIT_CODE=$(echo "$INPUT" | jq -r '.exitCode // empty')
    OUTPUT=$(echo "$INPUT" | jq -r '.output // empty')
else
    echo "Warning: jq not found, using fallback parser (may fail on complex JSON)" >&2
    # Fallback to grep/sed for basic parsing
    COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
    EXIT_CODE=$(echo "$INPUT" | grep -o '"exitCode"[[:space:]]*:[[:space:]]*[0-9]*' | head -1 | sed 's/.*: *//')
    OUTPUT=$(echo "$INPUT" | grep -o '"output"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"\(.*\)"/\1/')
fi

# Validate required fields
if [ -z "$COMMAND" ]; then
    echo "Error: Failed to extract 'command' from JSON input" >&2
    exit 1
fi

# Skip if not a bun command
if ! echo "$COMMAND" | grep -qE '^bun'; then
    exit 0
fi

# Handle successful bun install
if echo "$COMMAND" | grep -qE '^bun install' && [ "$EXIT_CODE" = "0" ]; then
    echo "TIP: Run 'bun run dev' to start development server"
fi

# Handle successful bun test
if echo "$COMMAND" | grep -qE '^bun test' && [ "$EXIT_CODE" = "0" ]; then
    echo "TIP: Add --coverage for code coverage report"
    echo "TIP: Use --watch for continuous testing"
fi

# Handle failed bun test
if echo "$COMMAND" | grep -qE '^bun test' && [ "$EXIT_CODE" != "0" ]; then
    echo "DEBUG TIP: Run 'bun test --verbose' for detailed output"
    echo "DEBUG TIP: Run 'bun test --bail' to stop on first failure"
fi

# Handle successful bun build
if echo "$COMMAND" | grep -qE '^bun build' && [ "$EXIT_CODE" = "0" ]; then
    echo "TIP: Check dist/ directory for output files"
    echo "TIP: Add --minify for production builds"
fi

# Handle module not found errors
if echo "$OUTPUT" | grep -qiE 'cannot find module|module not found'; then
    echo "FIX: Run 'bun install' to install missing dependencies"
fi

# Handle port in use errors
if echo "$OUTPUT" | grep -qiE 'EADDRINUSE|address already in use'; then
    echo "FIX: Kill process using the port: lsof -i :PORT | grep LISTEN"
    echo "FIX: Or use a different port in your configuration"
fi

# Handle TypeScript errors
if echo "$OUTPUT" | grep -qiE 'typescript.*error|TS[0-9]+:'; then
    echo "FIX: Run 'bunx tsc --noEmit' to see all TypeScript errors"
fi

# Provide next steps after bun init
if echo "$COMMAND" | grep -qE '^bun init' && [ "$EXIT_CODE" = "0" ]; then
    echo "NEXT STEPS:"
    echo "  1. Edit package.json to customize your project"
    echo "  2. Run 'bun add <packages>' to add dependencies"
    echo "  3. Run 'bun run index.ts' to start your app"
fi

exit 0

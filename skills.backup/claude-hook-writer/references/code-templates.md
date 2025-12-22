# Code Templates

Complete working hook examples for common use cases.

---

## Template 1: Format On Save Hook

Auto-format files after editing or writing.

**Bash Script** (`format-on-save.sh`):

```bash
#!/bin/bash
set -euo pipefail

# Parse input
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

# Validate
[[ -n "$FILE" ]] || exit 0
[[ -f "$FILE" ]] || exit 0
[[ "$FILE" == "$CLAUDE_PROJECT_DIR"* ]] || exit 0

# Check formatter installed
if ! command -v prettier &> /dev/null; then
  exit 0
fi

# Format by extension
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    prettier --write "$FILE" 2>/dev/null || exit 0
    ;;
  *.py)
    black "$FILE" 2>/dev/null || exit 0
    ;;
  *.go)
    gofmt -w "$FILE" 2>/dev/null || exit 0
    ;;
esac
```

**JSON Config**:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format-on-save.sh",
        "timeout": 5000
      }]
    }]
  }
}
```

**Use when**: You want automatic formatting after file changes.

---

## Template 2: Block Sensitive Files Hook

Prevent modification of sensitive files (.env, keys, credentials).

**Bash Script** (`block-sensitive.sh`):

```bash
#!/bin/bash
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

[[ -n "$FILE" ]] || exit 0

# Sensitive patterns
BLOCKED=(
  ".env"
  ".env.*"
  "*.pem"
  "*.key"
  "*secret*"
  "*credential*"
  ".git/*"
)

for pattern in "${BLOCKED[@]}"; do
  # Use case for glob matching
  case "$FILE" in
    $pattern)
      echo "Blocked: $FILE is a sensitive file" >&2
      echo "   Pattern: $pattern" >&2
      exit 2  # Block operation
      ;;
  esac
done

exit 0  # Allow
```

**JSON Config**:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/block-sensitive.sh"
      }]
    }]
  }
}
```

**Use when**: You want to protect sensitive files from accidental modification.

---

## Template 3: Command Logger Hook

Log all bash commands executed by Claude.

**Bash Script** (`command-logger.sh`):

```bash
#!/bin/bash
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.input.command // empty')

[[ -n "$COMMAND" ]] || exit 0

LOG_FILE=~/.claude-hooks/commands.log
mkdir -p "$(dirname "$LOG_FILE")"

# Log with timestamp and context
{
  echo "---"
  echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Directory: $CLAUDE_CURRENT_DIR"
  echo "Command: $COMMAND"
} >> "$LOG_FILE"

exit 0
```

**JSON Config**:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/command-logger.sh"
      }]
    }]
  }
}
```

**Use when**: You want audit trail of all commands Claude executes.

---

## Template 4: Prompt-Based Security Hook

Use LLM to analyze file content for secrets before writing.

**JSON Config** (no bash script needed):

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "prompt",
        "prompt": "Analyze the file content being written to ${input.file_path}. Check if it contains: hardcoded API keys, AWS credentials, private keys, passwords, or secrets. Return {\"decision\": \"block\", \"reason\": \"<specific issue>\"} if found, otherwise {\"decision\": \"allow\"}.",
        "schema": {
          "type": "object",
          "properties": {
            "decision": {"enum": ["allow", "block"]},
            "reason": {"type": "string"}
          },
          "required": ["decision"]
        }
      }]
    }]
  }
}
```

**Use when**: You need AI-powered security analysis (slower, 2-10 seconds per file).

**Trade-offs**:
- ✅ Pro: Detects complex secret patterns
- ❌ Con: Slow (blocks for 2-10 seconds)
- ❌ Con: Uses AI API tokens

---

## Template 5: Lint On Save Hook

Run linter after file modifications.

**Bash Script** (`lint-on-save.sh`):

```bash
#!/bin/bash
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

# Validate
[[ -n "$FILE" ]] || exit 0
[[ -f "$FILE" ]] || exit 0
[[ "$FILE" == "$CLAUDE_PROJECT_DIR"* ]] || exit 0

# Only lint TypeScript/JavaScript
[[ "$FILE" == *.ts ]] || [[ "$FILE" == *.tsx ]] || [[ "$FILE" == *.js ]] || [[ "$FILE" == *.jsx ]] || exit 0

# Check eslint installed
if ! command -v eslint &> /dev/null; then
  exit 0
fi

# Run linter (suppress output, just check exit code)
if ! eslint "$FILE" &> /dev/null; then
  echo "⚠️  Lint errors in $FILE - run 'eslint $FILE' to see details" >&2
fi

exit 0  # Don't block, just warn
```

**JSON Config**:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/lint-on-save.sh",
        "timeout": 3000
      }]
    }]
  }
}
```

**Use when**: You want lint warnings after editing files.

---

## Template 6: Git Auto-Commit Hook

Automatically commit changes after file modifications.

**Bash Script** (`auto-commit.sh`):

```bash
#!/bin/bash
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

[[ -n "$FILE" ]] || exit 0
[[ -f "$FILE" ]] || exit 0

# Run in background to not block Claude
(
  cd "$CLAUDE_PROJECT_DIR" || exit

  # Add file
  git add "$FILE" 2>/dev/null || exit

  # Commit with auto-generated message
  FILENAME=$(basename "$FILE")
  git commit -m "Auto-commit: Update $FILENAME" 2>/dev/null || exit

  echo "[$(date)] Auto-committed: $FILE" >> ~/.claude-hooks/commits.log
) &

exit 0  # Return immediately
```

**JSON Config**:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/auto-commit.sh"
      }]
    }]
  }
}
```

**Use when**: You want automatic git commits (use carefully!).

**Warning**: Creates many commits. Consider using interactive staging instead.

---

## Template Customization

All templates can be customized:

### Add File Extension Filters

```bash
# Only process specific extensions
case "$FILE" in
  *.ts|*.tsx)
    # Your logic here
    ;;
  *)
    exit 0  # Skip other files
    ;;
esac
```

### Add Directory Filters

```bash
# Only process files in specific directories
if [[ "$FILE" == "$CLAUDE_PROJECT_DIR/src/"* ]]; then
  # Your logic here
else
  exit 0  # Skip files outside src/
fi
```

### Add Custom Blocklists

```bash
# Extend blocked patterns
BLOCKED+=(
  "node_modules/*"
  "dist/*"
  "build/*"
  "*.min.js"
)
```

### Add Logging

```bash
LOG_FILE=~/.claude-hooks/my-hook.log
echo "[$(date)] Processed: $FILE" >> "$LOG_FILE"
```

---

## Best Practices for Templates

1. **Always validate input**: Check JSON fields exist before using
2. **Always check file exists**: Don't assume files exist
3. **Always use absolute paths**: For scripts and referenced files
4. **Always quote variables**: Handle spaces in filenames
5. **Always handle missing tools**: Check with `command -v`
6. **Always set timeouts**: Prevent hanging hooks
7. **Always use `set -euo pipefail`**: Exit on errors
8. **Run heavy operations in background**: Don't block Claude

---

## Testing Templates

Test each template with edge cases:

```bash
# Test with normal file
echo '{"input":{"file_path":"test.ts"}}' | ./template.sh
echo "Exit code: $?"

# Test with spaces in filename
echo '{"input":{"file_path":"my file.ts"}}' | ./template.sh

# Test with missing file
echo '{"input":{"file_path":"nonexistent.ts"}}' | ./template.sh

# Test with sensitive file
echo '{"input":{"file_path":".env"}}' | ./template.sh
echo "Exit code: $?"  # Should be 2 for block-sensitive template

# Test with malformed JSON
echo 'not json' | ./template.sh
echo "Exit code: $?"  # Should be 1
```

# Quick Reference

Fast lookup for hook syntax, exit codes, environment variables, and common patterns.

---

## Exit Codes

- `0` = Success (continue operation)
- `2` = Block operation (PreToolUse only)
- `1` or other = Non-blocking error (logged but continues)

**For PreToolUse hooks**:
- Exit 2 blocks the tool from running
- Exit 0 allows it (optionally with modified input)

**For PostToolUse hooks**:
- Exit codes don't block (tool already ran)
- Use exit 0 for success, 1 for logging errors

---

## Hook Configuration Fields

### Required
- `type` - "command" or "prompt"
- `command` or `prompt` - Script path or prompt text

### Optional
- `timeout` - Max execution time in ms (default: 60000)
- `continue` - Continue after hook? (default: true)
- `stopReason` - Message when continue=false
- `suppressOutput` - Hide stdout from transcript (default: false)
- `systemMessage` - Warning message to user

---

## Environment Variables

Available in all hooks:

- `$CLAUDE_PROJECT_DIR` - Project root directory
- `$CLAUDE_CURRENT_DIR` - Current working directory
- `$SESSION_ID` - Unique session identifier
- `$CLAUDE_PLUGIN_ROOT` - Hook installation directory
- `$CLAUDE_ENV_FILE` - File for persisting environment vars

**Example**:
```bash
echo "Project: $CLAUDE_PROJECT_DIR" >&2
echo "Session: $SESSION_ID" >&2
```

---

## JSON Input Structure

Standard input structure for hooks:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript",
  "current_dir": "/path/to/current",
  "input": {
    // Tool-specific fields
  }
}
```

**Tool-specific fields**:
- `file_path` - Read, Write, Edit
- `command` - Bash
- `old_string`, `new_string` - Edit
- `content` - Write

---

## Common jq Patterns

Extract fields safely with fallbacks:

```bash
# Extract with default empty string
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

# Extract array elements
FILES=$(echo "$INPUT" | jq -r '.input.files[]')

# Check if field exists
if echo "$INPUT" | jq -e '.input.file_path' >/dev/null; then
  # Field exists
fi

# Parse entire object
INPUT_OBJ=$(echo "$INPUT" | jq '.input')

# Extract multiple fields
eval $(echo "$INPUT" | jq -r '@sh "FILE=\(.input.file_path) CMD=\(.input.command)"')
```

---

## Common Bash Patterns

### Validate File in Project

```bash
if [[ "$FILE" != "$CLAUDE_PROJECT_DIR"* ]]; then
  echo "File outside project" >&2
  exit 2
fi
```

### Check Tool Exists

```bash
if ! command -v prettier &> /dev/null; then
  echo "prettier not installed" >&2
  exit 0  # Skip gracefully
fi
```

### File Extension Matching

```bash
case "$FILE" in
  *.ts|*.tsx)
    # TypeScript files
    ;;
  *.py)
    # Python files
    ;;
  *)
    exit 0  # Skip other files
    ;;
esac
```

### Background Execution

```bash
# Run heavy operation in background
(heavy_operation "$FILE" &)
exit 0  # Return immediately
```

### Logging

```bash
# Log to stderr (shows in transcript)
echo "Error: something failed" >&2

# Log to file (for debugging)
LOG_FILE=~/.claude-hooks/debug.log
echo "[$(date)] Debug info" >> "$LOG_FILE"
```

---

## Hook Events

- `PreToolUse` - Before tool executes (can block)
- `PostToolUse` - After tool completes (cannot block)
- `UserPromptSubmit` - Before processing user input
- `SessionStart` - When Claude Code starts
- `SessionEnd` - When Claude Code exits
- `Notification` - During alerts
- `Stop` / `SubagentStop` - When responses finish
- `PreCompact` - Before context compaction

---

## Common Matchers

- `"Write"` - File writes only
- `"Edit"` - File edits only
- `"Edit|Write"` - All file modifications
- `"Bash"` - Shell commands
- `"Read"` - File reads
- `"*"` - All tools (use sparingly)
- `"mcp__*"` - All MCP tools
- `"mcp__github__*"` - Specific MCP provider

---

## Security Patterns

### Block Sensitive Files

```bash
BLOCKED=(".env" "*.key" "*secret*")
for pattern in "${BLOCKED[@]}"; do
  if [[ "$FILE" == $pattern ]]; then
    echo "Blocked: $FILE" >&2
    exit 2
  fi
done
```

### Sanitize Path

```bash
# No directory traversal
[[ "$FILE" != *".."* ]] || exit 2

# Must be in project
[[ "$FILE" == "$CLAUDE_PROJECT_DIR"* ]] || exit 2
```

### Quote Variables

```bash
# Always quote file paths
cat "$FILE"              # NOT: cat $FILE
prettier --write "$FILE" # NOT: prettier --write $FILE
```

---

## Performance Tips

1. **Keep PreToolUse < 100ms**
2. **Use specific matchers** (not `*`)
3. **Run heavy ops in background**
4. **Cache expensive results**
5. **Check cheap conditions first**
6. **Use built-in bash when possible**

---

## Common Commands

```bash
# Check if tool installed
command -v toolname &> /dev/null

# Check if file exists
[[ -f "$FILE" ]]

# Check if directory exists
[[ -d "$DIR" ]]

# Get file extension
ext="${FILE##*.}"

# Get filename without extension
name="${FILE%.*}"

# Get directory of file
dir="$(dirname "$FILE")"

# Get basename
base="$(basename "$FILE")"
```

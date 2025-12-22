# Reliability & Performance Requirements

Hooks must be reliable (work 100% of the time) and performant (don't block Claude).

---

## Reliability Requirements

### Handle Missing Dependencies

Never assume tools are installed:

```bash
# Check tool exists before using
if ! command -v prettier &> /dev/null; then
  echo "prettier not installed, skipping formatting" >&2
  exit 0  # Success exit (just skip)
fi

# Now safe to use
prettier --write "$FILE"
```

**Common missing tools**:
- `prettier`, `black`, `gofmt` (formatters)
- `jq` (JSON parsing - though usually installed)
- `git` (version control - might be missing)
- Language-specific tools (`npm`, `cargo`, `go`)

**Best practice**: Exit 0 (success) when tool is missing, not exit 1 (error). The hook simply doesn't run.

---

### Check File Exists

Don't assume files exist:

```bash
# Check file exists before reading
if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

# Now safe to read
content=$(cat "$FILE")
```

**Edge cases**:
- File deleted between tool invocation and hook execution
- File path typo in input
- Network drives that disconnect

---

### Set Timeouts

Default timeout is 60 seconds. For slow operations, set explicit timeout:

```json
{
  "hooks": [{
    "type": "command",
    "command": "./slow-operation.sh",
    "timeout": 10000  // 10 seconds (in milliseconds)
  }]
}
```

**Guidelines**:
- PreToolUse hooks: 1-5 seconds max
- PostToolUse hooks: 5-10 seconds max
- SessionStart/End: 30 seconds max

**For longer operations**, run in background:

```bash
# Don't block Claude for 30+ seconds
(heavy_operation "$FILE" &)
exit 0  # Return immediately
```

---

### Log Errors Properly

Log to stderr or file, not stdout:

```bash
LOG_FILE=~/.claude-hooks/my-hook.log

# Log to stderr (shown in transcript with Ctrl-R)
echo "Hook failed: $reason" >&2

# Or log to file (for debugging)
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date)] Error: $reason" >> "$LOG_FILE"
```

**Don't log to stdout** unless you want output in Claude's conversational transcript.

**Logging levels**:
- stderr: Errors, warnings, important events
- Log file: Debugging info, verbose output
- stdout: Success messages (shown to user)

---

### Test With Edge Cases

Always test with these scenarios:

#### Edge Case Files

```bash
# Files with spaces
"my file.txt"

# Unicode filenames
"文件.txt"
"файл.txt"

# Deep nested paths
"src/components/features/auth/login/LoginForm.tsx"

# Absolute paths
"/tmp/test.txt"
"/Users/name/Documents/file.txt"

# Paths with special chars
"file (1).txt"
"file-v2.0.txt"
"file@2024.txt"
```

#### Edge Case Input

```bash
# Malformed JSON
echo 'not json' | ./hook.sh

# Missing fields
echo '{"input":{}}' | ./hook.sh

# Empty strings
echo '{"input":{"file_path":""}}' | ./hook.sh

# null values
echo '{"input":{"file_path":null}}' | ./hook.sh

# Nested objects
echo '{"input":{"nested":{"file":"test.txt"}}}' | ./hook.sh
```

---

## Performance Requirements

### Keep Hooks Fast

**Target latency**:
- PreToolUse: < 100ms (blocks tool execution)
- PostToolUse: < 500ms (blocks next action)
- SessionStart: < 1000ms (one-time delay)

**Slow operations to avoid in PreToolUse**:
- Running test suites (use PostToolUse + background)
- Full project linting (lint only changed file)
- Network calls (API requests, webhooks)
- Heavy file I/O (reading large files)

**Example: Slow vs Fast**

```bash
# ❌ SLOW - type checks entire project
tsc --noEmit  # 5-10 seconds

# ✅ FAST - only check changed file
tsc --noEmit "$FILE"  # 100-500ms
```

---

### Use Specific Matchers

Broad matchers (`*`) trigger hooks unnecessarily:

```json
// ❌ BAD - runs on EVERY tool call
{
  "matcher": "*",
  "hooks": [{...}]
}

// ✅ GOOD - only file writes
{
  "matcher": "Write",
  "hooks": [{...}]
}

// ✅ BETTER - only specific tools
{
  "matcher": "Edit|Write",  // File modifications only
  "hooks": [{...}]
}

// ✅ BEST - filter by file extension in hook
{
  "matcher": "Write",
  "hooks": [{
    "command": "./format-typescript.sh"  // Checks .ts/.tsx inside
  }]
}
```

**Performance impact**:
- `matcher: "*"` on 100 tool calls = 100 hook executions
- `matcher: "Write"` on 100 tool calls (10 writes) = 10 hook executions

---

### Dedupe Expensive Operations

If multiple hooks match, they run in parallel. Avoid duplicate work:

```bash
# Use lock file to prevent parallel execution
LOCK_FILE="/tmp/claude-hook-${SESSION_ID}-${HOOK_NAME}.lock"

if [[ -f "$LOCK_FILE" ]]; then
  echo "Hook already running, skipping" >&2
  exit 0
fi

touch "$LOCK_FILE"
trap "rm -f '$LOCK_FILE'" EXIT  # Clean up on exit

# Do work here (only one instance runs)
expensive_operation
```

**When to use**: Hooks that take >1 second and might run in parallel.

---

### Cache Results

For expensive checks, cache by file hash:

```bash
CACHE_DIR=~/.claude-hooks/cache
mkdir -p "$CACHE_DIR"

# Compute file hash
FILE_HASH=$(shasum "$FILE" | cut -d' ' -f1)
CACHE_FILE="$CACHE_DIR/lint-$FILE_HASH"

# Check cache
if [[ -f "$CACHE_FILE" ]]; then
  # File unchanged, use cached result
  cat "$CACHE_FILE"
  exit 0
fi

# Run expensive operation
result=$(eslint "$FILE")

# Cache result
echo "$result" > "$CACHE_FILE"
echo "$result"
```

**Good for**: Linting, type checking, complex validation

---

### Run Heavy Operations in Background

Don't block Claude for slow operations:

```bash
# ❌ BLOCKS Claude for 30 seconds
npm test
npm run build

# ✅ RUN IN BACKGROUND - returns immediately
(npm test > /tmp/test-results.log 2>&1 &)
(npm run build > /tmp/build.log 2>&1 &)

exit 0  # Hook completes instantly
```

**Background operation pattern**:

```bash
# Run in background with logging
(
  # Subshell runs independently
  sleep 2
  result=$(expensive_operation "$FILE" 2>&1)
  echo "[$(date)] Result: $result" >> ~/.claude-hooks/async.log
) &

# Hook returns immediately
exit 0
```

**When to use**: Tests, builds, network calls, heavy linting

---

## Reliability Checklist

Before deploying:

- [ ] Checks if required tools are installed (`command -v`)
- [ ] Checks if files exist before reading (`[[ -f "$FILE" ]]`)
- [ ] Sets reasonable timeout (< 5s for PreToolUse)
- [ ] Logs errors to stderr or file, not stdout
- [ ] Handles missing JSON fields gracefully
- [ ] Handles malformed JSON without crashing
- [ ] Handles Unicode filenames
- [ ] Handles filenames with spaces
- [ ] Handles deep nested paths
- [ ] Fails gracefully on errors (doesn't crash)

---

## Performance Checklist

Before deploying:

- [ ] Hook completes in < 100ms for PreToolUse
- [ ] Hook completes in < 500ms for PostToolUse
- [ ] Uses specific matchers (not `*` unless necessary)
- [ ] Runs heavy operations in background
- [ ] Caches expensive results by file hash
- [ ] Dedupe with locks if hook might run in parallel
- [ ] Only processes relevant files (check extension)
- [ ] No unnecessary file reads or writes

---

## Testing Reliability & Performance

### Test Reliability

```bash
#!/bin/bash
# reliability-test.sh

echo "=== Testing Missing Tool ==="
PATH="/usr/bin" ./hook.sh  # Remove tool from PATH
# Expected: Exit 0, log "tool not installed"

echo "=== Testing Missing File ==="
echo '{"input":{"file_path":"/nonexistent.txt"}}' | ./hook.sh
# Expected: Exit 1, log "file not found"

echo "=== Testing Malformed JSON ==="
echo 'not json' | ./hook.sh
# Expected: Exit 1, log "JSON parse failed"

echo "=== Testing Empty Input ==="
echo '{}' | ./hook.sh
# Expected: Exit 0 or 1, no crash

echo "All reliability tests passed"
```

### Test Performance

```bash
#!/bin/bash
# performance-test.sh

echo "=== Testing Hook Speed ==="

# Measure execution time
start=$(date +%s%N)
echo '{"input":{"file_path":"test.ts"}}' | ./hook.sh
end=$(date +%s%N)

duration_ms=$(( (end - start) / 1000000 ))

echo "Hook took ${duration_ms}ms"

# Verify within limits
if [[ $duration_ms -lt 100 ]]; then
  echo "✅ Performance PASS (< 100ms)"
else
  echo "❌ Performance FAIL (>= 100ms)"
fi
```

---

## Performance Optimization Tips

1. **Profile your hook**: Use `time` command to measure performance
   ```bash
   time echo '{"input":{"file_path":"test.ts"}}' | ./hook.sh
   ```

2. **Avoid spawning processes**: Each `command -v`, `jq`, etc. spawns a process
   ```bash
   # Slow - spawns jq 3 times
   FILE=$(echo "$INPUT" | jq -r '.input.file_path')
   DIR=$(echo "$INPUT" | jq -r '.input.dir')
   CMD=$(echo "$INPUT" | jq -r '.input.command')

   # Fast - single jq call
   eval $(echo "$INPUT" | jq -r '@sh "FILE=\(.input.file_path) DIR=\(.input.dir) CMD=\(.input.command)"')
   ```

3. **Use built-in bash instead of external tools when possible**
   ```bash
   # Slow - spawns grep
   if echo "$FILE" | grep -q ".ts$"; then

   # Fast - bash pattern matching
   if [[ "$FILE" == *.ts ]]; then
   ```

4. **Lazy evaluation**: Only do expensive work when necessary
   ```bash
   # Check cheap conditions first
   [[ -f "$FILE" ]] || exit 0
   [[ "$FILE" == *.ts ]] || exit 0

   # Only now run expensive check
   result=$(expensive_operation "$FILE")
   ```

# Testing & Debugging Hooks

Guide for testing hooks thoroughly and debugging when things go wrong.

---

## Manual Testing

Create test input and verify behavior:

```bash
# Test with sample JSON
echo '{
  "session_id": "test",
  "input": {
    "file_path": "/tmp/test.ts"
  }
}' | ./my-hook.sh

# Check exit code
echo $?  # 0 = success, 2 = blocked, 1 = error
```

---

## Edge Case Testing

Always test with these scenarios:

```bash
#!/bin/bash
# test-hook.sh

HOOK=./my-hook.sh

test_case() {
  local description="$1"
  local input="$2"
  local expected_exit="$3"

  echo "Testing: $description"

  echo "$input" | $HOOK
  actual_exit=$?

  if [[ $actual_exit -eq $expected_exit ]]; then
    echo "  PASS"
  else
    echo "  FAIL (expected exit $expected_exit, got $actual_exit)"
    return 1
  fi
}

# Test cases
test_case "Normal file" \
  '{"input":{"file_path":"/tmp/test.ts"}}' \
  0

test_case "Sensitive .env file" \
  '{"input":{"file_path":".env"}}' \
  2

test_case "File with spaces" \
  '{"input":{"file_path":"/tmp/my file.ts"}}' \
  0

test_case "Missing file_path" \
  '{"input":{}}' \
  1

test_case "Malformed JSON" \
  'not json' \
  1

echo "All tests passed"
```

---

## Integration Testing

1. Register hook in Claude Code
2. Trigger the event (write file, run command)
3. Check transcript (Ctrl-R) for hook output
4. Verify expected behavior

---

## Debugging Techniques

### Enable Verbose Logging

```bash
#!/bin/bash
set -x  # Print commands as they execute
```

### Check Transcript

Run Claude Code with Ctrl-R (transcript mode):

```
PreToolUse hook: ./my-hook.sh
  stdout: Formatted file.ts
  stderr:
  exit: 0
  duration: 47ms
```

### Test JSON Parsing

```bash
# Debug what jq extracts
INPUT=$(cat)
echo "$INPUT" | jq '.' >&2  # Show full JSON
echo "$INPUT" | jq -r '.input.file_path' >&2  # Show field
```

### Check Environment Variables

```bash
echo "PROJECT_DIR: $CLAUDE_PROJECT_DIR" >&2
echo "CURRENT_DIR: $CLAUDE_CURRENT_DIR" >&2
echo "SESSION_ID: $SESSION_ID" >&2
echo "PLUGIN_ROOT: $CLAUDE_PLUGIN_ROOT" >&2
```

---

## Common Debugging Issues

### Issue: Hook Not Running

**Check**:
- Is hook registered in hook.json?
- Does matcher match the tool? (`"matcher": "Write"`)
- Is script executable? (`chmod +x hook.sh`)
- Is script path absolute? (`${CLAUDE_PLUGIN_ROOT}/hook.sh`)

### Issue: JSON Parse Errors

**Check**:
- Is input valid JSON? (test with `jq '.'`)
- Are you using `// empty` fallback? (`jq -r '.field // empty'`)
- Are you checking if field exists before using?

### Issue: Hook Times Out

**Check**:
- Is timeout set high enough? (default 60s)
- Is hook doing expensive operations? (run in background)
- Is hook hanging on user input? (use non-interactive tools)

### Issue: Files Not Found

**Check**:
- Is path absolute or relative?
- Does file exist? (`[[ -f "$FILE" ]]`)
- Are you in correct directory? (`cd "$CLAUDE_PROJECT_DIR"`)

---

## Performance Profiling

Measure hook execution time:

```bash
# Time the hook
time echo '{"input":{"file_path":"test.ts"}}' | ./hook.sh

# Output:
# real    0m0.047s  # Total time (47ms)
# user    0m0.023s  # CPU time
# sys     0m0.015s  # System time
```

Target: < 100ms for PreToolUse hooks

---

## Test Automation

Create automated test suite:

```bash
#!/bin/bash
# run-all-tests.sh

TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
  if "$@"; then
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
}

run_test ./test-normal-files.sh
run_test ./test-sensitive-files.sh
run_test ./test-edge-cases.sh
run_test ./test-performance.sh

echo "---"
echo "Tests passed: $TESTS_PASSED"
echo "Tests failed: $TESTS_FAILED"

[[ $TESTS_FAILED -eq 0 ]] || exit 1
```

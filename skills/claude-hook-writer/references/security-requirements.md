# Security Requirements

Hooks execute automatically with user permissions and can read, modify, or delete any file the user can access. Security is non-negotiable.

---

## MUST-HAVE Security Checks

Every hook must implement these security measures:

### 1. Input Validation

Always validate JSON input before using it:

```bash
#!/bin/bash
set -euo pipefail  # Exit on errors, undefined vars

INPUT=$(cat)

# Validate JSON parse
if ! FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty' 2>&1); then
  echo "JSON parse failed: $FILE" >&2
  exit 1
fi

# Validate field exists
if [[ -z "$FILE" ]]; then
  echo "No file path in input" >&2
  exit 1
fi
```

**Why this matters**: Malformed JSON or missing fields will crash hooks. Always validate before using.

---

### 2. Path Sanitization

Validate files are in the project directory:

```bash
# Validate file is in project
if [[ "$FILE" != "$CLAUDE_PROJECT_DIR"* ]]; then
  echo "File outside project: $FILE" >&2
  exit 2  # Block operation
fi

# Validate no directory traversal
if [[ "$FILE" == *".."* ]]; then
  echo "Path traversal detected: $FILE" >&2
  exit 2
fi
```

**Common attacks prevented**:
- `../../../etc/passwd` (directory traversal)
- `/etc/shadow` (absolute path outside project)
- `~/.ssh/id_rsa` (home directory access)

---

### 3. Sensitive File Protection

Block operations on sensitive files:

```bash
# Block list (extend as needed)
BLOCKED_PATTERNS=(
  ".env"
  ".env.*"
  "*.pem"
  "*.key"
  "*credentials*"
  "*secret*"
  ".git/*"
  ".ssh/*"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if [[ "$FILE" == $pattern ]]; then
    echo "Blocked: $FILE matches sensitive pattern $pattern" >&2
    exit 2
  fi
done
```

**Files to always block**:
- `.env`, `.env.local`, `.env.production` (environment secrets)
- `*.pem`, `*.key` (private keys)
- `*credentials*`, `*secret*` (anything with credentials/secrets in name)
- `.git/*` (Git internals)
- `.ssh/*` (SSH keys)

---

### 4. Quote All Variables

Spaces and special characters in paths break unquoted variables:

```bash
# ❌ WRONG - breaks on spaces
cat $FILE              # Fails on "my file.txt"
prettier --write $FILE # Fails with spaces
rm $FILE              # DANGEROUS - could delete wrong files

# ✅ RIGHT - handles spaces and special chars
cat "$FILE"              # Handles spaces
prettier --write "$FILE" # Safe
rm "$FILE"              # Scoped to exact file
```

**Test with these filenames**:
- `"my file.txt"` (spaces)
- `"文件.txt"` (Unicode)
- `"file (1).txt"` (special chars)

---

### 5. Use Absolute Paths for Scripts

Relative paths might not resolve correctly:

```bash
# ❌ WRONG - relative path might not work
./my-script.sh

# ✅ RIGHT - explicit absolute path
"${CLAUDE_PLUGIN_ROOT}/scripts/my-script.sh"

# ✅ ALSO RIGHT - use environment variable
"$HOME/.claude/scripts/my-script.sh"
```

**Why**: Hook execution directory might not be where you expect. Always use absolute paths.

---

## Security Checklist

Before deploying a hook, verify:

- [ ] All JSON input is validated before use
- [ ] All file paths are validated to be in `$CLAUDE_PROJECT_DIR`
- [ ] Path traversal attempts (`..`) are blocked
- [ ] Sensitive files (`.env`, `*.key`, etc.) are blocked
- [ ] All variables containing paths are quoted
- [ ] All script paths are absolute
- [ ] No shell injection vulnerabilities (careful with `eval`, `bash -c`)
- [ ] No command injection via unsanitized input

---

## Common Security Vulnerabilities

### Vulnerability #1: Command Injection

```bash
# ❌ DANGEROUS - command injection
COMMAND=$(echo "$INPUT" | jq -r '.input.command')
eval "$COMMAND"  # Attacker can run arbitrary code

# ✅ SAFE - validate and sanitize
COMMAND=$(echo "$INPUT" | jq -r '.input.command // empty')
# Only allow specific commands
case "$COMMAND" in
  "npm test"|"npm build")
    $COMMAND
    ;;
  *)
    echo "Command not allowed: $COMMAND" >&2
    exit 2
    ;;
esac
```

### Vulnerability #2: Path Traversal

```bash
# ❌ VULNERABLE - no path validation
FILE=$(echo "$INPUT" | jq -r '.input.file_path')
rm "$FILE"  # Could delete ../../../etc/passwd

# ✅ SAFE - validate path first
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')
[[ "$FILE" == "$CLAUDE_PROJECT_DIR"* ]] || exit 2
[[ "$FILE" != *".."* ]] || exit 2
rm "$FILE"
```

### Vulnerability #3: Trusting User Input

```bash
# ❌ DANGEROUS - trust user input
MESSAGE=$(echo "$INPUT" | jq -r '.input.message')
echo "$MESSAGE" | mail -s "Alert" admin@example.com

# ✅ SAFE - sanitize and validate
MESSAGE=$(echo "$INPUT" | jq -r '.input.message // empty')
# Remove special chars
MESSAGE=$(echo "$MESSAGE" | tr -cd '[:alnum:][:space:].')
# Limit length
MESSAGE="${MESSAGE:0:200}"
echo "$MESSAGE" | mail -s "Alert" admin@example.com
```

---

## Security Best Practices

### Principle of Least Privilege

Only access what you need:

```bash
# Don't read entire files if you only need metadata
# ❌ Unnecessary file read
content=$(cat "$FILE")

# ✅ Better - just check if exists
[[ -f "$FILE" ]] && echo "File exists"
```

### Fail Closed on Security Checks

When in doubt, block:

```bash
# If validation fails, block rather than allow
if ! validate_path "$FILE"; then
  echo "Path validation failed, blocking" >&2
  exit 2  # Block
fi

# Don't continue on validation errors
```

### Log Security Events

Log blocked operations for audit:

```bash
LOG_FILE=~/.claude-hooks/security.log

if [[ "$FILE" == ".env" ]]; then
  echo "[$(date)] BLOCKED: Attempt to modify .env" >> "$LOG_FILE"
  echo "  File: $FILE" >> "$LOG_FILE"
  echo "  Session: $SESSION_ID" >> "$LOG_FILE"
  exit 2
fi
```

---

## Testing Security

### Test Malicious Input

```bash
# Test path traversal
echo '{"input":{"file_path":"../../../etc/passwd"}}' | ./my-hook.sh
# Expected: Exit 2 (blocked)

# Test sensitive file
echo '{"input":{"file_path":".env"}}' | ./my-hook.sh
# Expected: Exit 2 (blocked)

# Test absolute path outside project
echo '{"input":{"file_path":"/etc/shadow"}}' | ./my-hook.sh
# Expected: Exit 2 (blocked)

# Test malformed JSON
echo 'not json' | ./my-hook.sh
# Expected: Exit 1 (error logged)
```

### Test Edge Cases

```bash
# File with spaces
echo '{"input":{"file_path":"my file.txt"}}' | ./my-hook.sh

# Unicode filename
echo '{"input":{"file_path":"文件.txt"}}' | ./my-hook.sh

# Special characters
echo '{"input":{"file_path":"file (1).txt"}}' | ./my-hook.sh
```

---

## Security Resources

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [Path Traversal Attacks](https://owasp.org/www-community/attacks/Path_Traversal)
- [Bash Security Pitfalls](https://mywiki.wooledge.org/BashPitfalls)

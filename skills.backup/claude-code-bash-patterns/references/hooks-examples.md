# Hooks Configuration Examples

Real-world hook configurations for Claude Code.

---

## Complete Configuration Example

**File**: `~/.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/dangerous-command-guard.py"
          },
          {
            "type": "command",
            "command": "~/.claude/hooks/bash-audit-logger.sh"
          }
        ]
      },
      {
        "matcher": "Bash(git commit*)",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review this git commit command: {tool_input.command}\n\nDoes the commit message follow conventional commits format and clearly explain WHY the change was made? If not, suggest improvements."
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.tool_input.file_path // empty'); if echo \"$FILE\" | grep -qE '\\.(env|secret|key)$'; then echo 'ERROR: Cannot modify secret files' >&2; exit 2; fi"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.tool_input.file_path'); [ -f \"$FILE\" ] && prettier --write \"$FILE\" > /dev/null 2>&1 || true"
          }
        ]
      },
      {
        "matcher": "Bash(npm install*|pnpm install*|yarn install*)",
        "hooks": [
          {
            "type": "command",
            "command": "echo '✅ Dependencies installed. Running audit...' && npm audit || true"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "[ -f .envrc ] && source .envrc || true; env > $CLAUDE_ENV_FILE; echo '✅ Session started'"
          }
        ]
      }
    ]
  },
  "allowedTools": [
    "Read",
    "Write",
    "Edit",
    "Bash(git *)",
    "Bash(npm *)",
    "Bash(npx *)"
  ]
}
```

---

## Hook Types

### 1. PreToolUse - Security Guards

**Block Dangerous Commands**:
```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "python3 ~/.claude/hooks/dangerous-command-guard.py"
    }
  ]
}
```

**Enforce Package Manager**:
```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "~/.claude/hooks/package-manager-enforcer.sh"
    }
  ]
}
```

**Prevent Production File Edits**:
```json
{
  "matcher": "Write|Edit",
  "hooks": [
    {
      "type": "command",
      "command": "FILE=$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.tool_input.file_path'); if echo \"$FILE\" | grep -qE 'production|prod\\.'; then echo 'ERROR: Cannot modify production files' >&2; exit 2; fi"
    }
  ]
}
```

### 2. PostToolUse - Cleanup & Automation

**Auto-Format Code**:
```json
{
  "matcher": "Write|Edit",
  "hooks": [
    {
      "type": "command",
      "command": "FILE=$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.tool_input.file_path'); prettier --write \"$FILE\" 2>/dev/null || true"
    }
  ]
}
```

**Run Tests After Code Changes**:
```json
{
  "matcher": "Write|Edit",
  "hooks": [
    {
      "type": "command",
      "command": "FILE=$(echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.tool_input.file_path'); if echo \"$FILE\" | grep -qE '\\.(ts|js)$'; then npm test -- \"$FILE\" || true; fi"
    }
  ]
}
```

**Audit After Install**:
```json
{
  "matcher": "Bash(npm install*|pnpm add*|yarn add*)",
  "hooks": [
    {
      "type": "command",
      "command": "npm audit --audit-level=high || echo 'Security vulnerabilities found'"
    }
  ]
}
```

### 3. SessionStart - Environment Setup

**Load Project Environment**:
```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "[ -f .envrc ] && source .envrc || true; env > $CLAUDE_ENV_FILE"
    }
  ]
}
```

**Verify Tools Installed**:
```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "which jq gh prettier > /dev/null || echo '⚠️ Missing tools: Install jq, gh, prettier'"
    }
  ]
}
```

---

## Advanced Patterns

### Prompt-Based Hooks (LLM-Powered)

**Smart Commit Message Review**:
```json
{
  "matcher": "Bash(git commit*)",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "Review this commit:\n\nCommand: {tool_input.command}\n\nCheck:\n1. Follows conventional commits?\n2. Explains WHY (not just WHAT)?\n3. Avoids vague phrases?\n\nIf issues found, block and suggest improvements. Otherwise, allow."
    }
  ]
}
```

**Code Quality Check**:
```json
{
  "matcher": "Write|Edit",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "Review the file being modified:\n\nFile: {tool_input.file_path}\n\nCheck for:\n1. Security vulnerabilities\n2. Performance issues\n3. Best practice violations\n\nIf critical issues found, block. Otherwise, allow with warnings."
    }
  ]
}
```

### Conditional Hooks

**Only on Main Branch**:
```json
{
  "matcher": "Bash(git push*)",
  "hooks": [
    {
      "type": "command",
      "command": "BRANCH=$(git rev-parse --abbrev-ref HEAD); if [ \"$BRANCH\" = \"main\" ]; then echo 'ERROR: Cannot push directly to main' >&2; exit 2; fi"
    }
  ]
}
```

**Only in Production**:
```json
{
  "matcher": "Bash(wrangler deploy*)",
  "hooks": [
    {
      "type": "command",
      "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'production'; then read -p 'Deploy to production? (yes/no): ' confirm; [ \"$confirm\" = \"yes\" ] || exit 2; fi"
    }
  ]
}
```

---

## Logging & Auditing

### Complete Audit Log

```bash
#!/bin/bash
# File: ~/.claude/hooks/complete-audit.sh

LOG_FILE="$HOME/.claude/complete-audit.log"

# Parse input
TOOL=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.tool_name // "unknown"')
COMMAND=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.tool_input.command // .tool_input.file_path // "N/A"')

# Log with context
echo "[$(date -Iseconds)] ${USER}@$(hostname) | Tool: $TOOL | Action: $COMMAND" >> "$LOG_FILE"

exit 0
```

**Configuration**:
```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "~/.claude/hooks/complete-audit.sh"
    }
  ]
}
```

---

## Testing Hooks

**Test Hook Script**:
```bash
# Simulate CLAUDE_TOOL_INPUT
export CLAUDE_TOOL_INPUT='{"tool_input":{"command":"git push --force origin main"}}'

# Run hook
python3 ~/.claude/hooks/dangerous-command-guard.py

# Check exit code
echo "Exit code: $?"
```

**Test in Claude Code**:
1. Configure hook in settings.json
2. Try triggering action
3. Verify hook runs
4. Check block behavior

---

**Production Validated**: All examples tested in real projects.

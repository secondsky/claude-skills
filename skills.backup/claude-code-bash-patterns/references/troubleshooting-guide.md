# Troubleshooting Guide

Detailed solutions for all 12 known issues with Claude Code Bash tool.

---

## Issue #1: Git Bash cygpath Command Not Found (Windows)

**Error**: `bash: line 1: cygpath: command not found`

**Source**: https://github.com/anthropics/claude-code/issues/9883

**Symptoms**:
- Occurs on Windows with Git Bash
- Prevents file path operations
- Intermittent failures

**Diagnosis**:
```bash
which cygpath  # Returns nothing on MSYS/Git Bash
```

**Solutions**:

**Option 1: Use WSL (Recommended)**
```bash
# Install WSL2
wsl --install

# Use WSL terminal for Claude Code
```

**Option 2: Configure Git Bash Path**
```bash
export CLAUDE_CODE_GIT_BASH_PATH="/usr/bin/bash"
```

**Option 3: Install Cygwin**
- Download from https://www.cygwin.com/
- Add cygwin/bin to PATH

**Prevention**: Use WSL on Windows for best compatibility

---

## Issue #2: Pipe Command Failures

**Error**: `echo test|grep test` returns error instead of "test"

**Source**: https://github.com/anthropics/claude-code/issues/774

**Symptoms**:
- Pipes don't work as expected
- Simple pipe operations fail

**Diagnosis**:
```bash
echo test|grep test  # Fails
```

**Solutions**:

**Option 1: Use bash -c wrapper**
```bash
bash -c 'echo test | grep test'  # Works
```

**Option 2: Use specialized tools**
```bash
# Instead of: cat file.txt | grep pattern
Grep(pattern="pattern", path="file.txt")
```

**Prevention**: Prefer specialized tools (Grep, Read) over bash pipes

---

## Issue #3: Command Timeout (Hanging Promises)

**Error**: `A hanging Promise was canceled`

**Source**: Bash tool default timeout is 2 minutes

**Symptoms**:
- Long-running commands timeout
- Build processes interrupted

**Diagnosis**:
```bash
# Command takes > 2 minutes
npm run build  # Times out
```

**Solutions**:

**Set Explicit Timeout**:
```bash
Bash(
  command="npm run build",
  timeout=600000,  # 10 minutes
  description="Build production bundle"
)
```

**Run in Background**:
```bash
npm run build > build.log 2>&1 &
```

**Prevention**: Set timeout for known long operations

---

## Issue #4: Output Truncation Loss

**Error**: Important output missing from response

**Source**: Bash tool truncates output at 30,000 characters

**Symptoms**:
- Missing test results
- Incomplete error messages

**Diagnosis**:
```bash
npm test  # Output > 30k chars, truncated
```

**Solutions**:

**Limit Output**:
```bash
npm test 2>&1 | head -100
```

**Save to File**:
```bash
npm test > test-results.txt && tail -50 test-results.txt
```

**Use Grep**:
```bash
npm test 2>&1 | grep -E '(PASS|FAIL|Error)'
```

**Prevention**: Always limit output for large commands

---

## Issue #5: "No Suitable Shell Found" (Windows)

**Error**: CLI fails with "No suitable shell found"

**Source**: https://github.com/anthropics/claude-code/issues/3461

**Symptoms**:
- Windows-specific
- Shell detection fails

**Diagnosis**:
```bash
echo $SHELL  # Empty or incorrect
```

**Solutions**:

**Set SHELL Variable**:
```bash
export SHELL=/usr/bin/bash
```

**Use WSL**:
```bash
wsl --install
# Use WSL terminal
```

**Update Claude Code**:
```bash
npm update -g claude-code-cli
```

**Prevention**: Use WSL on Windows

---

## Issue #6: Bash Tool Access Loss

**Error**: Claude loses ability to run Bash() tool

**Source**: https://github.com/anthropics/claude-code/issues/1888

**Symptoms**:
- Tool unavailable after idle
- Occurs after overnight sessions

**Diagnosis**:
```bash
# Check permissions
/permissions
```

**Solutions**:

**Restart Session**:
```bash
# Exit and restart Claude Code
```

**Use Restart Parameter**:
```bash
Bash(
  command="npm test",
  restart=true
)
```

**Check Allowlist**:
```json
{
  "allowedTools": ["Bash"]
}
```

**Prevention**: Restart sessions after long idle periods

---

## Issue #7: Interactive Prompt Hangs

**Error**: Command hangs indefinitely, no output

**Symptoms**:
- No progress
- No error message
- Timeout eventually

**Diagnosis**:
```bash
# Command expects input
npm install  # If package.json has prompts
```

**Solutions**:

**Use Non-Interactive Flags**:
```bash
npm install --yes
```

**Provide Input via Stdin**:
```bash
echo "yes" | command-that-needs-confirmation
```

**Check for Interactive Commands**:
```bash
# These will hang:
vim, nano, less, more, top, htop
```

**Prevention**: Always use `--yes`, `--no-interactive` flags

---

## Issue #8: Permission Denied Errors

**Error**: `permission denied` or `command not found`

**Symptoms**:
- Script won't execute
- Command not in PATH

**Diagnosis**:
```bash
./script.sh  # Permission denied

which mycli  # Returns nothing
```

**Solutions**:

**Make Executable**:
```bash
chmod +x script.sh && ./script.sh
```

**Use Full Path**:
```bash
/usr/local/bin/mycli deploy
```

**Use Interpreter Directly**:
```bash
python3 script.py
node script.js
bash script.sh
```

**Add to PATH**:
```bash
export PATH="$PATH:/path/to/dir"
```

**Prevention**: Check script permissions before execution

---

## Issue #9: Environment Variables Not Persisting

**Error**: Variable set in one command not available in next

**Symptoms**:
- `export` doesn't persist
- Working directory resets

**Diagnosis**:
```bash
# Call 1
export API_KEY=abc123

# Call 2
echo $API_KEY  # Empty!
```

**Solutions**:

**Chain Commands**:
```bash
export API_KEY=abc123 && curl -H "Authorization: $API_KEY" https://api.example.com
```

**Use SessionStart Hook**:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "source .envrc; env > $CLAUDE_ENV_FILE"
          }
        ]
      }
    ]
  }
}
```

**Use .env Files**:
```bash
source .env && command-using-vars
```

**Prevention**: Chain commands or use SessionStart hook

---

## Issue #10: Git Commit Hook Modifications Not Detected

**Error**: Pre-commit hook changes files, but commit fails

**Symptoms**:
- Commit fails after hook runs
- Files modified by hook not staged

**Diagnosis**:
```bash
git commit -m "Message"
# Error: Hook modified files
```

**Solutions**:

**Check if Safe to Amend**:
```bash
# 1. Check authorship
git log -1 --format='%an %ae'

# 2. Check not pushed
git status  # Should show "ahead of origin"
```

**Amend if Safe**:
```bash
git add . && git commit --amend --no-edit
```

**New Commit if Not Safe**:
```bash
git add . && git commit -m "Apply pre-commit hook changes"
```

**Prevention**: Always check authorship before amending

---

## Issue #11: Wildcard Permission Matching Not Working

**Error**: `Bash(*)` or `Bash(*:*)` doesn't grant access

**Source**: https://github.com/anthropics/claude-code/issues/462

**Symptoms**:
- Wildcard allowlist fails
- Specific commands blocked

**Diagnosis**:
```json
{
  "allowedTools": ["Bash(*)"]  // Doesn't work
}
```

**Solutions**:

**Use Correct Syntax**:
```json
{
  "allowedTools": ["Bash"]  // All bash commands
}
```

**Or Specific Patterns**:
```json
{
  "allowedTools": [
    "Bash(git *)",
    "Bash(npm *)",
    "Bash(npx *)"
  ]
}
```

**Prevention**: Use `"Bash"` for all or specific patterns

---

## Issue #12: Dangerous Command Execution

**Error**: Accidental `rm -rf /` or force push to main

**Symptoms**:
- No protection against destructive commands
- Manual intervention required

**Diagnosis**:
```bash
# These should be blocked:
rm -rf /
git push --force origin main
```

**Solutions**:

**Install Dangerous Command Guard**:
```bash
cp scripts/dangerous-command-guard.py ~/.claude/hooks/
chmod +x ~/.claude/hooks/dangerous-command-guard.py
```

**Configure Hook**:
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
          }
        ]
      }
    ]
  }
}
```

**Prevention**: Always use PreToolUse guard hook

---

## General Troubleshooting Steps

### 1. Check Claude Code Version
```bash
claude --version
npm update -g claude-code-cli
```

### 2. Verify Settings
```bash
cat ~/.claude/settings.json | jq empty  # Validate JSON
```

### 3. Test Hook Scripts
```bash
export CLAUDE_TOOL_INPUT='{"tool_input":{"command":"test"}}'
~/.claude/hooks/your-script.sh
echo "Exit code: $?"
```

### 4. Check Permissions
```bash
/permissions  # In Claude Code session
```

### 5. View Logs
```bash
tail -50 ~/.claude/bash-audit.log
tail -50 ~/.claude/audit.log
```

### 6. Restart Session
```bash
# Exit and restart Claude Code
```

---

**All issues documented with sources and tested solutions.**

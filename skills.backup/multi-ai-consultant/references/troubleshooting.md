# Multi-AI Consultant Troubleshooting Guide

Complete troubleshooting guide for all common issues and their solutions.

---

## Quick Diagnosis

| Error Message | Likely Cause | Quick Fix |
|---------------|--------------|-----------|
| `gemini: command not found` | Gemini CLI not installed | `bun add -g @google/generative-ai-cli` |
| `codex: command not found` | Codex CLI not installed | `bun add -g codex` |
| `API key invalid` | Missing or incorrect API key | Set `GEMINI_API_KEY` or `OPENAI_API_KEY` |
| `Token limit exceeded` | Context too large | Use specific files, not entire repo |
| `jq: parse error` | JSON parsing failed | Slash command has fallback |
| `Waiting for approval` | Codex hanging | Use `--yolo` flag (included in slash command) |
| `.env file sent` | Privacy leak | Add to `.gitignore` and `.geminiignore` |
| Skill not discovered | Installation issue | Check `~/.claude/skills/multi-ai-consultant` |

---

## Issue 1: CLI Not Installed

### Error

```
gemini: command not found
# OR
codex: command not found
```

### Cause

CLI tool not installed or not in PATH.

### Diagnosis

```bash
# Check if installed
which gemini
which codex

# Check global package location
bun pm bin -g  # Should show where global bins are
npm list -g --depth=0  # List global packages
```

### Fix

**Install Gemini CLI**:
```bash
bun add -g @google/generative-ai-cli

# Verify
which gemini  # Should show path
gemini -p "test"  # Should work
```

**Install Codex CLI**:
```bash
bun add -g codex

# Verify
which codex  # Should show path
echo "test" | codex exec - --yolo  # Should work
```

**If not in PATH**:
```bash
# Find global bin location
bun pm bin -g
# Output: /Users/name/.bun/bin

# Add to PATH in shell profile
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc  # bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc   # zsh

# Reload shell
source ~/.bashrc  # or ~/.zshrc
```

### Prevention

Slash commands include pre-flight checks that verify CLI is installed before executing.

---

## Issue 2: API Keys Invalid

### Error

```
API key invalid
# OR
Authentication failed
# OR
401 Unauthorized
```

### Cause

API key not set, incorrect, or expired.

### Diagnosis

```bash
# Check if environment variables are set
echo $GEMINI_API_KEY
echo $OPENAI_API_KEY

# Test Gemini API key directly
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"
# Should return JSON, not error

# Test OpenAI API key (if using OpenAI CLI)
openai api models.list
# Should list models, not error
```

### Fix

**Set Gemini API Key**:
```bash
# Temporary (current session only)
export GEMINI_API_KEY="your-key-from-ai-studio"

# Permanent (add to shell profile)
echo 'export GEMINI_API_KEY="your-key"' >> ~/.bashrc  # bash
echo 'export GEMINI_API_KEY="your-key"' >> ~/.zshrc   # zsh
source ~/.bashrc  # or ~/.zshrc

# Get new key if needed
# Visit: https://aistudio.google.com/apikey
```

**Set OpenAI API Key**:
```bash
# Temporary
export OPENAI_API_KEY="sk-..."

# Permanent
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc  # bash
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.zshrc   # zsh
source ~/.bashrc

# Get new key if needed
# Visit: https://platform.openai.com/api-keys
```

**Verify after setting**:
```bash
# Test Gemini
gemini -p "test"

# Test Codex
echo "test" | codex exec - --yolo
```

### Prevention

Slash commands test API keys before consultation (pre-flight check).

---

## Issue 3: Context Too Large

### Error

```
Token limit exceeded
# OR
Request too large
# OR
Very expensive consultation ($5+ for single question)
```

### Cause

Sending too much context (entire repository instead of specific files).

### Diagnosis

```bash
# Check how many files would be sent
find . -type f ! -path "*/node_modules/*" ! -path "*/.git/*" | wc -l

# Estimate total lines of code
find . -name "*.ts" -o -name "*.js" | xargs wc -l | tail -1
```

### Fix

**Use smart context selection**:

```bash
# ❌ BAD: Entire repo
/consult-gemini @.

# ✅ GOOD: Specific files only
/consult-gemini @src/auth/session.ts @src/middleware/jwt.ts

# ✅ GOOD: Specific directory
/consult-gemini @src/auth/

# Bug context (minimal)
@src/buggy-file.ts @src/imports/of/buggy-file.ts

# Architecture context (relevant directories)
@src/components/ @src/hooks/ @src/lib/

# Security context (security + config)
@src/auth/ @src/middleware/ @wrangler.toml
```

**Context guidelines by problem type**:

| Problem Type | Context Needed | Example |
|--------------|----------------|---------|
| Bug | Buggy file + direct imports | `@src/auth.ts @src/utils.ts` |
| Security | Security files + config | `@src/auth/ @.env.example` |
| Architecture | Relevant feature directories | `@src/api/ @src/types/` |
| Code review | Specific files changed | `@src/refactored.ts` |

### Prevention

Slash commands guide smart context selection and warn if context seems too large (>100k tokens).

---

## Issue 4: Privacy Leaks

### Risk

Accidentally sending `.env`, secrets, or sensitive files to external AIs.

### Diagnosis

```bash
# Check what files are NOT in .gitignore
git status --ignored

# Search for sensitive patterns
grep -r "API_KEY\|SECRET\|PASSWORD" . --include="*.env*"

# Check .geminiignore exists
ls -la .geminiignore
```

### Fix

**1. Ensure .gitignore is configured**:
```gitignore
# .gitignore
.env
.env.*
*.secret
*.key
*.pem
wrangler.toml
.dev.vars
```

**2. Create .geminiignore for extra protection**:
```gitignore
# .geminiignore (extra exclusions beyond .gitignore)
*.env*
*secret*
*credentials*
*password*
*.key
*.pem
*.crt
.dev.vars
wrangler.toml

# Build artifacts
node_modules/
dist/
.next/

# Large files
*.mov
*.mp4
*.zip
```

**3. Verify exclusions work**:
```bash
# Both CLIs respect .gitignore automatically
# Test by checking git status
git status --ignored

# Sensitive files should be listed under ignored files
```

### Prevention

- Claude Code warns if sensitive patterns detected before consultation
- Lists files being sent
- Asks permission before proceeding
- Both CLIs automatically respect `.gitignore` and `.geminiignore`

---

## Issue 5: Cost Overruns

### Issue

Expensive consultations accumulating (monthly bill higher than expected).

### Diagnosis

```bash
# Check consultation history
consultation-log-parser.sh --summary

# Output example:
# Total consultations: 47
# Gemini: 23 ($28.45), Codex: 12 ($5.85), Fresh Claude: 12 ($0.00)
# Total cost: $34.30

# View detailed log
cat ~/.claude/ai-consultations/consultations.log
```

### Fix

**Cost optimization strategies**:

1. **Use Fresh Claude for quick questions** (free):
   ```
   /consult-claude "Quick sanity check on this logic"
   ```

2. **Use smart context** (reduce tokens):
   - Specific files, not entire repo
   - Bug context: buggy file + imports only
   - Architecture: relevant directories only

3. **Combine questions** (fewer consultations):
   ```
   /consult-gemini "1. Is this secure? 2. Is it following best practices? 3. Any edge cases?"
   # Better than 3 separate consultations
   ```

4. **Start free, upgrade if needed**:
   ```
   1. Try Fresh Claude (free)
   2. If stuck → Try Gemini ($0.10-0.50)
   3. If still stuck → Try Codex ($0.05-0.30)
   ```

5. **Set weekly budget checks**:
   ```bash
   # Check costs weekly
   consultation-log-parser.sh --summary

   # If over budget, use Fresh Claude more
   ```

### Prevention

- Cost tracking logs every consultation
- Warnings for large context before sending
- Free tier (Fresh Claude) always available

---

## Issue 6: Codex Hanging

### Error

```
Waiting for approval...
[Hangs indefinitely]
```

### Cause

Codex CLI waiting for interactive approval (not suitable for non-interactive use).

### Diagnosis

```bash
# Try Codex manually
echo "test" | codex exec -

# Will prompt: "Execute this command? (y/n)"
# Hangs waiting for input
```

### Fix

**Always use `--yolo` flag** (skip approval):
```bash
echo "test" | codex exec - --yolo
```

### Prevention

Slash command `/consult-codex` includes `--yolo` flag by default - should never hang.

If hanging persists:
```bash
# Kill hung process
pkill -f codex

# Verify flag is in command
grep "yolo" ~/.claude/skills/multi-ai-consultant/commands/consult-codex.md
```

---

## Issue 7: JSON Parsing Fails (Gemini)

### Error

```
jq: parse error (at line 1, column N)
# OR
Invalid JSON response from Gemini
```

### Cause

Gemini returned plain text instead of JSON, or JSON is malformed.

### Diagnosis

```bash
# Test Gemini manually
gemini -p "test"

# Check if response is JSON or plain text
```

### Fix

**Slash command has automatic fallback**:
1. Try parsing as JSON
2. If fails, check exit code
3. Fall back to plain text parsing
4. Extract answer with regex

**Manual workaround**:
```bash
# Force plain text mode
gemini -p "test" --no-json

# OR use different model
gemini -p "test" --model gemini-pro
```

### Prevention

`/consult-gemini` checks exit code before parsing - automatically handles both JSON and plain text responses.

---

## Issue 8: Not in Git Repo (Codex)

### Warning

```
Warning: Not in a Git repository
This may send unintended files to OpenAI
```

### Cause

Codex safety feature - warns when not in Git repo (could send sensitive files not in `.gitignore`).

### Diagnosis

```bash
# Check if in Git repo
git status

# If not:
# fatal: not a git repository (or any of the parent directories): .git
```

### Fix

**Option 1: Initialize Git repo** (recommended):
```bash
git init
git add .gitignore
git commit -m "Initial commit"

# Now .gitignore will be respected
```

**Option 2: Skip check** (if appropriate):
```bash
# Add flag to skip Git check
codex exec - --skip-git-repo-check --yolo
```

### Prevention

Codex warns for safety - either initialize Git repo or explicitly skip check if you understand the risks.

---

## Troubleshooting by Component

### Gemini Not Working

**Diagnosis steps**:
```bash
# 1. Check CLI installed
which gemini
# Should show: /path/to/gemini

# 2. Check API key set
echo $GEMINI_API_KEY
# Should show your key (not empty)

# 3. Test manually
gemini -p "test"
# Should return response (not error)

# 4. Test API key directly
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GEMINI_API_KEY"
# Should return JSON response
```

**Common fixes**:
- Install: `bun add -g @google/generative-ai-cli`
- Set key: `export GEMINI_API_KEY="your-key"`
- Add to profile: `echo 'export GEMINI_API_KEY="..."' >> ~/.bashrc`
- Get new key: https://aistudio.google.com/apikey

---

### Codex Not Working

**Diagnosis steps**:
```bash
# 1. Check CLI installed
which codex
# Should show: /path/to/codex

# 2. Check API key set (if using API key auth)
echo $OPENAI_API_KEY
# Should show your key

# 3. Test manually
echo "test" | codex exec - --yolo
# Should return response (not error)

# 4. Test OpenAI API (if using OpenAI CLI)
openai api models.list
# Should list models
```

**Common fixes**:
- Install: `bun add -g codex`
- Set key: `export OPENAI_API_KEY="sk-..."`
- Add to profile: `echo 'export OPENAI_API_KEY="..."' >> ~/.bashrc`
- Get new key: https://platform.openai.com/api-keys

---

### Fresh Claude Not Working

**Diagnosis steps**:
```bash
# Fresh Claude uses Task tool (built-in to Claude Code)

# 1. Check Claude Code CLI status
claude --version
# Should show version

# 2. Task tool is built-in, no separate installation needed
```

**Common issues**:
- Task tool failing → Check Claude Code CLI is up to date
- Consultation timing out → Check if task is complex (may take longer)

---

### Skill Not Discovered

**Diagnosis steps**:
```bash
# 1. Check skill installed
ls -la ~/.claude/skills/multi-ai-consultant
# Should show directory or symlink

# 2. Check SKILL.md has YAML frontmatter
head -30 ~/.claude/skills/multi-ai-consultant/SKILL.md
# Should start with:
# ---
# name: multi-ai-consultant
# description: |
#   ...
# ---

# 3. Verify symlink is correct (if using symlink)
ls -la ~/.claude/skills/ | grep multi-ai-consultant
# Should show symlink pointing to correct location
```

**Common fixes**:
- Reinstall skill:
  ```bash
  cd ~/.claude/skills
  rm -rf multi-ai-consultant
  ln -s /path/to/claude-skills/skills/multi-ai-consultant multi-ai-consultant
  ```
- Check YAML is valid (no syntax errors)
- Restart Claude Code (if skill was just installed)

---

## Emergency Debugging

If nothing works, try this systematic approach:

```bash
# 1. Verify environment
echo "=== Environment Check ==="
which gemini
which codex
claude --version
echo $GEMINI_API_KEY | cut -c1-10  # First 10 chars only
echo $OPENAI_API_KEY | cut -c1-10

# 2. Test each CLI individually
echo "=== Gemini Test ==="
gemini -p "test" || echo "FAILED"

echo "=== Codex Test ==="
echo "test" | codex exec - --yolo || echo "FAILED"

# 3. Check skill installation
echo "=== Skill Installation ==="
ls -la ~/.claude/skills/multi-ai-consultant || echo "NOT INSTALLED"
head -5 ~/.claude/skills/multi-ai-consultant/SKILL.md || echo "SKILL.md MISSING"

# 4. Check log for recent errors
echo "=== Recent Consultations ==="
tail -5 ~/.claude/ai-consultations/consultations.log || echo "NO LOG"
```

If all tests pass but skill still doesn't work:
1. Check Claude Code version: `claude --version`
2. Update Claude Code to latest version
3. Restart Claude Code session
4. Try simple test: `/consult-claude "test"`

---

## Getting Help

If issue persists after trying all fixes:

1. **Collect diagnostics**:
   ```bash
   # Run emergency debugging (above)
   # Save output
   ```

2. **Check logs**:
   ```bash
   # Claude Code logs
   cat ~/.claude/logs/latest.log

   # Consultation logs
   cat ~/.claude/ai-consultations/consultations.log
   ```

3. **Report issue**:
   - Include error message
   - Include diagnostic output
   - Include steps to reproduce
   - GitHub: https://github.com/your-org/claude-skills/issues

---

**Last Updated**: 2025-12-17

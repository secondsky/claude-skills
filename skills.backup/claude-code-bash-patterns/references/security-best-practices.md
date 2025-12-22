# Security Best Practices for Bash Automation

Production security patterns for Claude Code bash automation.

---

## Critical Security Rules

### 1. Never Commit Secrets

**Block with PreToolUse Hook**:
```json
{
  "matcher": "Bash(git add*|git commit*)",
  "hooks": [
    {
      "type": "command",
      "command": "if git diff --cached | grep -qE '(API_KEY|SECRET|PASSWORD|TOKEN).*='; then echo 'ERROR: Secrets detected in staged files' >&2; exit 2; fi"
    }
  ]
}
```

**Use .gitignore**:
```
.env
.env.*
*.key
*.secret
credentials.json
.dev.vars
```

### 2. Principle of Least Privilege

**Allowlist Pattern**:
```json
{
  "allowedTools": [
    "Read",
    "Write",
    "Edit",
    "Bash(git *)",
    "Bash(npm install*)",
    "Bash(npm test*)"
  ]
}
```

**NOT**:
```json
{
  "allowedTools": ["Bash"]  // ❌ Too permissive
}
```

### 3. Dangerous Command Blocking

**Use dangerous-command-guard.py** (see scripts/)

**Blocks**:
- `rm -rf /`
- `dd if=`
- `mkfs.*`
- Fork bombs
- `sudo rm`
- `git push --force main`

### 4. Audit Logging

**Log All Bash Commands**:
```bash
# ~/.claude/hooks/bash-audit-logger.sh
echo "[$(date -Iseconds)] $USER: $COMMAND" >> ~/.claude/audit.log
```

### 5. Production File Protection

**Block Production Edits**:
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

---

## Secret Management

### Environment Variables

**✅ Correct**:
```bash
# Load from .env (gitignored)
export API_KEY=$(grep API_KEY .env | cut -d= -f2)
curl -H "Authorization: Bearer $API_KEY" https://api.example.com
```

**❌ Wrong**:
```bash
# Hardcoded secret
curl -H "Authorization: Bearer sk-abc123" https://api.example.com
```

### Secret Management Tools

**Doppler**:
```bash
doppler run -- npm start
```

**Infisical**:
```bash
infisical run -- npm start
```

**Dotenv Vault**:
```bash
npx dotenv-vault@latest decrypt
```

---

## Docker Security

### Never Embed Secrets in Images

**❌ Wrong**:
```dockerfile
ENV API_KEY=sk-abc123
```

**✅ Correct**:
```dockerfile
# Runtime injection
docker run -e API_KEY=$API_KEY myimage
```

### Read-Only Mounts

```bash
docker run -v $(pwd):/app:ro myimage
```

---

## CI/CD Security

### GitHub Actions

**Use Secrets**:
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

**Never**:
```yaml
env:
  API_KEY: sk-abc123  # ❌ Exposed in logs
```

### Cloudflare Secrets

```bash
# Set secret (never in code)
npx wrangler secret put API_KEY

# Use in code
const apiKey = env.API_KEY;
```

---

## File Permissions

### Scripts

```bash
# Executable, user-only
chmod 700 script.sh

# Readable, user-only
chmod 600 .env
```

### SSH Keys

```bash
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

---

## Network Security

### HTTPS Only

```bash
# ✅ Correct
curl https://api.example.com

# ❌ Wrong
curl http://api.example.com
```

### Verify Certificates

```bash
# Don't skip verification
curl -k https://...  # ❌ Dangerous

# Verify properly
curl --cacert ca.crt https://...  # ✅ Correct
```

---

## Input Validation

### Command Injection Prevention

**❌ Vulnerable**:
```bash
USER_INPUT="test; rm -rf /"
eval "echo $USER_INPUT"  # Executes rm -rf /
```

**✅ Safe**:
```bash
USER_INPUT="test; rm -rf /"
echo "$USER_INPUT"  # Just echoes the string
```

### SQL Injection Prevention

**❌ Vulnerable**:
```bash
npx wrangler d1 execute mydb --command "SELECT * FROM users WHERE name = '$INPUT'"
```

**✅ Safe**:
```bash
# Use parameterized queries in application code, not bash
```

---

## Checklist

- [ ] All secrets in .env (gitignored)
- [ ] .gitignore includes .env, .env.*, *.key
- [ ] PreToolUse hooks block dangerous commands
- [ ] Audit logging enabled
- [ ] Production files protected
- [ ] Allowlist configured (not wildcard)
- [ ] No secrets in Docker images
- [ ] CI/CD uses platform secrets
- [ ] File permissions correct (600 for secrets)
- [ ] HTTPS only
- [ ] Input validation on user input

---

**Production Validated**: Security patterns tested and verified.

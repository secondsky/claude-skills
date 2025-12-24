# CLI Tool Integration with Claude Code

How to integrate custom CLI tools with Claude Code.

---

## Quick Guide

### Step 1: Document in CLAUDE.md

```markdown
## Custom Tools

**mycli**: Internal deployment tool
- Installation: `npm install -g @company/mycli`
- Authentication: `mycli login`
- Usage: `mycli deploy --env <environment> --service <name>`
- Help: `mycli --help`
- Config: `.mycli.json` in project root
```

### Step 2: Create Custom Commands

**File**: `.claude/commands/deploy-with-mycli.md`

```markdown
Deploy using mycli tool:

1. Verify mycli installed (`which mycli`)
2. Check authentication (`mycli whoami`)
3. Deploy to staging (`mycli deploy --env staging --service api`)
4. Run health check
5. If healthy, report success
```

### Step 3: Let Claude Discover

Claude will:
1. See tool mentioned in CLAUDE.md
2. Run `mycli --help` to learn options
3. Use tool based on discovered capabilities

---

## Integration Patterns

### Pattern 1: Well-Known Tools (Auto-Discovered)

Claude knows these by default:
- git, gh (GitHub CLI)
- npm, pnpm, yarn
- docker, kubectl
- terraform, ansible
- aws, gcloud, azure

**No configuration needed!**

### Pattern 2: Tools with Good Help Text

If tool has `--help`, Claude can discover:

```bash
# Claude will run this automatically
mycli --help
```

**Requirement**: Help text must include:
- Available commands
- Common options
- Usage examples

### Pattern 3: Tools Requiring Documentation

For complex tools, document in CLAUDE.md:

```markdown
## mcp-cli Tool

**Installation**:
```bash
npx @modelcontextprotocol/create-server my-server
```

**Common Commands**:
- `mcp-cli init` - Initialize project
- `mcp-cli dev` - Start dev server
- `mcp-cli build` - Build for production
- `mcp-cli deploy --provider cloudflare` - Deploy

**Configuration**: Edit `mcp.config.json`

**Authentication**: Set `MCP_API_KEY` environment variable
```

---

## Examples

### Example 1: Wrangler (Cloudflare)

**CLAUDE.md**:
```markdown
## Wrangler CLI

Always prefix with `npx` for local install:
- `npx wrangler dev` - Start local dev server
- `npx wrangler deploy` - Deploy to Cloudflare
- `npx wrangler d1 execute <db> --command "SQL"` - Run D1 query
- `npx wrangler tail` - Stream logs

Configuration in `wrangler.jsonc`
```

**Usage**:
```bash
npx wrangler d1 execute my-db --command "SELECT * FROM users LIMIT 5"
```

### Example 2: ElevenLabs CLI

**CLAUDE.md**:
```markdown
## ElevenLabs CLI

**Installation**: `npm install -g @11labs/elevenlabs`

**Authentication**:
```bash
elevenlabs auth login
# Stores API key in ~/.agents/api_keys.json
```

**Commands**:
- `elevenlabs agents push --env dev` - Deploy to dev
- `elevenlabs agents logs --tail` - Stream logs
- `elevenlabs agents list` - List deployed agents

**Multi-environment**: dev, staging, production
```

**Usage**:
```bash
elevenlabs agents push --env staging
```

### Example 3: Custom Internal Tool

**CLAUDE.md**:
```markdown
## deploy-bot (Internal Tool)

**What It Does**: Automated deployment with approvals

**Installation**: `npm install -g @company/deploy-bot`

**Setup**:
```bash
deploy-bot init
# Creates .deploy-bot.yml config
```

**Commands**:
- `deploy-bot check` - Pre-deployment validation
- `deploy-bot deploy --env <env>` - Deploy with approval workflow
- `deploy-bot rollback` - Rollback last deployment
- `deploy-bot status` - Show deployment status

**Workflow**:
1. Run `deploy-bot check` to validate
2. Run `deploy-bot deploy --env staging`
3. Tool requests approval (manual step)
4. After approval, deploys automatically
5. Runs health checks
6. If healthy, marks as successful

**Configuration**: `.deploy-bot.yml`
```yaml
environments:
  staging:
    url: https://staging.example.com
    approvers: [user1, user2]
  production:
    url: https://example.com
    approvers: [admin1, admin2]
    require_tests: true
```
```

---

## Best Practices

### ✅ Do:
- Document installation steps
- Show authentication process
- Include common commands
- Provide usage examples
- Explain configuration files
- Note environment variables

### ❌ Don't:
- Assume tool is installed
- Skip authentication steps
- Use undocumented flags
- Ignore error messages

---

## Troubleshooting

### Tool Not Found

**Problem**: `command not found: mycli`

**Solution**:
```bash
# Check if installed
which mycli

# Install if missing
npm install -g mycli

# Verify installation
mycli --version
```

### Authentication Issues

**Problem**: `Authentication failed`

**Solution**:
```bash
# Re-authenticate
mycli login

# Or set API key
export MYCLI_API_KEY="your-key"
```

### Version Mismatch

**Problem**: `This command requires version 2.0+`

**Solution**:
```bash
# Check current version
mycli --version

# Update
npm update -g mycli

# Verify update
mycli --version
```

---

**Production Validated**: Patterns used with wrangler, gh, elevenlabs, and custom tools.

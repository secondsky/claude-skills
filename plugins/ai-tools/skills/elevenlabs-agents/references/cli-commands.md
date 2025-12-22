# CLI Commands Reference

## Installation

**Bun (Recommended)**:
```bash
bun add -g @elevenlabs/cli
```

**npm**:
```bash
npm install -g @elevenlabs/cli
```

**pnpm**:
```bash
pnpm add -g @elevenlabs/cli
```

---

## Authentication

### Login
```bash
elevenlabs auth login
```

### Check Current User
```bash
elevenlabs auth whoami
```

### Set Residency
```bash
elevenlabs auth residency eu-residency
# Options: global | eu-residency | in-residency
```

### Logout
```bash
elevenlabs auth logout
```

---

## Project Initialization

### Initialize New Project
```bash
elevenlabs agents init
```

### Recreate Project Structure
```bash
elevenlabs agents init --override
```

---

## Agent Management

### Add Agent
```bash
elevenlabs agents add "Agent Name" --template TEMPLATE
```

**Templates**: default | minimal | voice-only | text-only | customer-service | assistant

### Push to Platform
```bash
# Push all agents
elevenlabs agents push

# Push specific agent
elevenlabs agents push --agent "Agent Name"

# Push to environment
elevenlabs agents push --env prod

# Dry run (preview changes)
elevenlabs agents push --dry-run
```

### Pull from Platform
```bash
# Pull all agents
elevenlabs agents pull

# Pull specific agent
elevenlabs agents pull --agent "Agent Name"
```

### List Agents
```bash
elevenlabs agents list
```

### Check Sync Status
```bash
elevenlabs agents status
```

### Delete Agent
```bash
elevenlabs agents delete AGENT_ID
```

### Generate Widget
```bash
elevenlabs agents widget "Agent Name"
```

---

## Tool Management

### Add Webhook Tool
```bash
elevenlabs tools add-webhook "Tool Name" --config-path tool_configs/tool.json
```

### Add Client Tool
```bash
elevenlabs tools add-client "Tool Name" --config-path tool_configs/tool.json
```

### Push Tools
```bash
elevenlabs tools push
```

### Pull Tools
```bash
elevenlabs tools pull
```

### Delete Tool
```bash
elevenlabs tools delete TOOL_ID

# Delete all tools
elevenlabs tools delete --all
```

---

## Testing

### Add Test
```bash
elevenlabs tests add "Test Name" --template basic-llm
```

### Push Tests
```bash
elevenlabs tests push
```

### Pull Tests
```bash
elevenlabs tests pull
```

### Run Test
```bash
elevenlabs agents test "Agent Name"
```

---

## Multi-Environment Workflow

```bash
# Development
elevenlabs agents push --env dev

# Staging
elevenlabs agents push --env staging

# Production
elevenlabs agents push --env prod --dry-run
# Review changes...
elevenlabs agents push --env prod
```

---

## Common Workflows

### Create and Deploy Agent
```bash
elevenlabs auth login
elevenlabs agents init
elevenlabs agents add "Support Bot" --template customer-service
# Edit agent_configs/support-bot.json
elevenlabs agents push --env dev
elevenlabs agents test "Support Bot"
elevenlabs agents push --env prod
```

### Update Existing Agent
```bash
elevenlabs agents pull
# Edit agent_configs/agent-name.json
elevenlabs agents push --dry-run
elevenlabs agents push
```

### Promote Agent to Production
```bash
# Test in staging first
elevenlabs agents push --env staging
elevenlabs agents test "Agent Name"

# If tests pass, promote to prod
elevenlabs agents push --env prod
```

---

## Environment Variables

```bash
# For CI/CD
export ELEVENLABS_API_KEY=your-api-key

# Run commands
elevenlabs agents push --env prod
```

---

## Troubleshooting

### Reset Project
```bash
elevenlabs agents init --override
elevenlabs agents pull
```

### Check Version
```bash
elevenlabs --version
```

### Get Help
```bash
elevenlabs --help
elevenlabs agents --help
elevenlabs tools --help
```

---

## File Locations

### Config Files
```
~/.elevenlabs/api_key          # API key (if not using keychain)
```

### Project Files
```
./agents.json                   # Agent registry
./tools.json                    # Tool registry
./tests.json                    # Test registry
./agent_configs/*.json          # Individual agent configs
./tool_configs/*.json           # Individual tool configs
./test_configs/*.json           # Individual test configs
```

---

## Best Practices

1. **Always use --dry-run** before pushing to production
2. **Commit configs to Git** for version control
3. **Use environment-specific configs** (dev/staging/prod)
4. **Test agents** before deploying
5. **Pull before editing** to avoid conflicts
6. **Use templates** for consistency
7. **Document changes** in commit messages

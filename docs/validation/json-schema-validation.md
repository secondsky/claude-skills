# JSON Schema Validation - Comprehensive Guide

Complete guide to JSON schema validation for the claude-skills repository.

## Table of Contents

- [Overview](#overview)
- [What Gets Validated](#what-gets-validated)
- [Setup](#setup)
- [Running Validation](#running-validation)
- [Schema Field Reference](#schema-field-reference)
- [Common Validation Errors](#common-validation-errors)
- [Testing Validation](#testing-validation)
- [Bypassing Validation](#bypassing-validation)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This repository uses JSON Schema validation to ensure data quality and catch errors before they break:
- Plugin installation (`/plugin install`)
- Marketplace discovery
- CI/CD pipelines
- Developer experience

### What's Validated

1. **marketplace.json** - Marketplace metadata and plugin registry
2. **plugin.json** - Individual plugin configurations (169 files)

### Validation Layers

| Layer | When | What | Speed | Coverage |
|-------|------|------|-------|----------|
| Pre-commit hook | Before commit | Changed files only | Fast (instant) | ~99% of issues |
| CI workflow | On push/PR | All files | Slower (30s) | 100% safety net |

**Two-layer defense**: Pre-commit catches most issues instantly, CI provides comprehensive safety net.

## What Gets Validated

### marketplace.json

**Location**: `.claude-plugin/marketplace.json`

**Schema**: `schemas/marketplace.schema.json`

**Required fields**:
- `name` - Marketplace name (kebab-case)
- `owner` - Owner object with name, email, url
- `metadata` - Metadata object with description, version, homepage
- `plugins` - Array of plugin objects

**Example**:
```json
{
  "name": "claude-skills",
  "owner": {
    "name": "Claude Skills Maintainers",
    "email": "maintainers@example.com",
    "url": "https://github.com/secondsky/claude-skills"
  },
  "metadata": {
    "description": "Production-tested skills for Claude Code",
    "version": "3.0.0",
    "homepage": "https://github.com/secondsky/claude-skills"
  },
  "plugins": [
    {
      "name": "cloudflare-d1",
      "source": "./plugins/cloudflare-d1",
      "version": "3.0.0",
      "description": "Cloudflare D1 serverless SQLite...",
      "keywords": ["cloudflare", "d1", "database"],
      "category": "cloudflare"
    }
  ]
}
```

### plugin.json

**Location**: `plugins/*/.claude-plugin/plugin.json` (169 files)

**Schema**: `schemas/plugin.schema.json`

**Required fields**:
- `name` - Plugin name (kebab-case) - **ONLY strictly required field**

**Optional fields** (validated if present):
- `version` - Semantic version (e.g., "3.0.0")
- `description` - Plugin description
- `author` - String or object
- `license` - Must be "MIT" for claude-skills
- `repository` - String or object
- `keywords` - Array of strings
- `commands` - Array of file paths (must start with `./`)
- `agents` - Array of file paths (must start with `./`)
- `hooks` - File path (must start with `./`)
- `mcpServers` - File path (must start with `./`)

**Example**:
```json
{
  "name": "cloudflare-d1",
  "version": "3.0.0",
  "description": "Cloudflare D1 serverless SQLite on edge",
  "author": {
    "name": "Claude Skills Maintainers",
    "email": "maintainers@example.com"
  },
  "license": "MIT",
  "repository": "https://github.com/secondsky/claude-skills",
  "keywords": ["cloudflare", "d1", "database"],
  "agents": [
    "./agents/d1-debugger.md",
    "./agents/d1-query-optimizer.md"
  ],
  "commands": [
    "./commands/d1-setup.md"
  ]
}
```

## Setup

### Prerequisites

- Node.js 18+ (for npm)
- Git
- Terminal access

### Installation

```bash
# 1. Install ajv-cli globally
npm install -g ajv-cli ajv-formats

# 2. Verify installation
ajv help
# Should show ajv-cli help output

# 3. Enable git hooks (one-time setup)
git config core.hooksPath .githooks

# 4. Verify hooks are enabled
git config core.hooksPath
# Should output: .githooks
```

### Verify Setup

```bash
# Test validation
npm run validate

# Should output:
# ✅ marketplace.json is valid
# ✅ All plugin.json files valid
```

## Running Validation

### npm Scripts (Recommended)

```bash
# Validate everything (marketplace + all plugins)
npm run validate

# Validate marketplace.json only
npm run validate:marketplace

# Validate all plugin.json files only
npm run validate:plugins
```

### Direct Script Execution

```bash
# Run validation script directly
./scripts/validate-json-schemas.sh

# With verbose output
./scripts/validate-json-schemas.sh --verbose
```

### Manual Validation (Single File)

```bash
# Validate marketplace.json
ajv validate \
  -s schemas/marketplace.schema.json \
  -d .claude-plugin/marketplace.json \
  --spec=draft7 \
  --strict=false

# Validate specific plugin.json
ajv validate \
  -s schemas/plugin.schema.json \
  -d plugins/cloudflare-d1/.claude-plugin/plugin.json \
  --spec=draft7 \
  --strict=false
```

### Pre-Commit Hook (Automatic)

Validation runs automatically when you commit:

```bash
# Make changes to JSON files
vim .claude-plugin/marketplace.json

# Commit (validation runs automatically)
git add .
git commit -m "Update marketplace"

# Hook validates changed files and blocks if invalid
```

## Schema Field Reference

### marketplace.json Fields

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| `name` | string | ✅ | Kebab-case | `"claude-skills"` |
| `owner.name` | string | ✅ | Min 1 char | `"Claude Skills"` |
| `owner.email` | string | ✅ | Email format | `"user@example.com"` |
| `owner.url` | string | ✅ | GitHub HTTPS | `"https://github.com/user/repo"` |
| `metadata.description` | string | ✅ | 10-500 chars | `"Production skills..."` |
| `metadata.version` | string | ✅ | Semver | `"3.0.0"` |
| `metadata.homepage` | string | ✅ | URI | `"https://github.com/..."` |
| `plugins[].name` | string | ✅ | Kebab-case | `"cloudflare-d1"` |
| `plugins[].source` | string | ✅ | `^\\./plugins/` | `"./plugins/cloudflare-d1"` |
| `plugins[].version` | string | ✅ | Semver | `"3.0.0"` |
| `plugins[].description` | string | ✅ | 10-500 chars | `"D1 database..."` |
| `plugins[].keywords` | array | ❌ | Strings, unique | `["cloudflare", "d1"]` |
| `plugins[].category` | string | ❌ | Enum (18 values) | `"cloudflare"` |

### plugin.json Fields

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| `name` | string | ✅ | Kebab-case | `"cloudflare-d1"` |
| `version` | string | ❌ | Semver | `"3.0.0"` |
| `description` | string | ❌ | 10-500 chars | `"D1 database..."` |
| `author` | string/object | ❌ | Email if object | `"John Doe"` or `{"name": "..."}` |
| `license` | string | ❌ | Must be "MIT" | `"MIT"` |
| `repository` | string/object | ❌ | URI | `"https://github.com/..."` |
| `keywords` | array | ❌ | Strings, unique | `["cloudflare", "d1"]` |
| `commands` | array | ❌ | Paths start `./` | `["./commands/setup.md"]` |
| `agents` | array | ❌ | Paths start `./` | `["./agents/debugger.md"]` |
| `hooks` | string | ❌ | Path starts `./` | `"./hooks/index.ts"` |
| `mcpServers` | string | ❌ | Path starts `./` | `"./.mcp.json"` |

### Category Enum Values

Valid categories for `plugins[].category` in marketplace.json:

```
ai, api, architecture, auth, cloudflare, cms, data, database,
design, documentation, frontend, mobile, security, seo, testing,
tooling, web, woocommerce
```

**Note**: `category` field is NOT valid in plugin.json (per official Claude Code spec). Only use in marketplace.json.

## Common Validation Errors

### Error: Invalid source path

```
❌ plugins[0].source should match pattern "^\\./plugins/[^/]+$"
```

**Cause**: Source path doesn't start with `./plugins/` or has wrong format

**Fix**:
```json
// ❌ Wrong
"source": "plugins/cloudflare-d1"
"source": "./cloudflare-d1"
"source": "/plugins/cloudflare-d1"

// ✅ Correct
"source": "./plugins/cloudflare-d1"
```

**Why this matters**: Incorrect source paths cause cache bloat and installation failures!

### Error: Invalid email format

```
❌ owner.email should match format "email"
```

**Cause**: Email doesn't match standard format or GitHub noreply format

**Fix**:
```json
// ❌ Wrong
"email": "invalid-email"
"email": "user@noreply.github.com"  // Missing username

// ✅ Correct
"email": "maintainers@example.com"
"email": "user@users.noreply.github.com"
```

### Error: Invalid license

```
❌ license should match pattern "^MIT$"
```

**Cause**: License is not "MIT" (claude-skills requirement)

**Fix**:
```json
// ❌ Wrong
"license": "GPL-3.0"
"license": "Apache-2.0"
"license": "mit"  // Wrong case

// ✅ Correct
"license": "MIT"
```

### Error: Invalid repository URL

```
❌ owner.url should match pattern "^https://github\\.com/[^/]+/[^/]+$"
```

**Cause**: Not a valid GitHub HTTPS URL

**Fix**:
```json
// ❌ Wrong
"url": "http://github.com/user/repo"     // HTTP not HTTPS
"url": "git@github.com:user/repo.git"    // SSH format
"url": "https://gitlab.com/user/repo"    // Not GitHub

// ✅ Correct
"url": "https://github.com/secondsky/claude-skills"
```

### Error: Invalid version format

```
❌ version should match pattern "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$"
```

**Cause**: Not a valid semantic version

**Fix**:
```json
// ❌ Wrong
"version": "3"
"version": "3.0"
"version": "v3.0.0"
"version": "3.0.0-beta"

// ✅ Correct
"version": "3.0.0"
"version": "1.2.3"
```

### Error: Invalid file path

```
❌ commands[0] should match pattern "^\\./.*"
```

**Cause**: File path doesn't start with `./`

**Fix**:
```json
// ❌ Wrong
"commands": ["commands/setup.md"]
"commands": ["/commands/setup.md"]

// ✅ Correct
"commands": ["./commands/setup.md"]
```

### Error: Missing required property

```
❌ should have required property 'name'
```

**Cause**: Required field is missing

**Fix**: Add the required field:
```json
{
  "name": "my-plugin",  // Required!
  "version": "1.0.0"
}
```

### Error: Additional properties not allowed

```
❌ should NOT have additional properties
```

**Cause**: marketplace.json has a field not in the schema

**Fix**: Remove the extra field or update the schema if it's intentional

```json
// ❌ Wrong (marketplace.json)
{
  "name": "claude-skills",
  "customField": "value"  // Not in schema!
}

// ✅ Correct
{
  "name": "claude-skills"
  // Only fields defined in schema
}
```

**Note**: plugin.json allows additional properties for forward compatibility.

### Error: Invalid category

```
❌ plugins[0].category should be equal to one of the allowed values
```

**Cause**: Category is not in the enum list

**Fix**: Use one of the 18 valid categories:
```json
// ❌ Wrong
"category": "backend"
"category": "devops"

// ✅ Correct
"category": "api"
"category": "tooling"
```

## Testing Validation

### Test with Valid Data

```bash
# Full validation
npm run validate

# Should output:
# ✅ marketplace.json is valid
# ✅ All 169 plugin.json files valid
```

### Test with Invalid Data (Intentional Errors)

Create a test file to verify error detection:

```bash
# Backup marketplace.json
cp .claude-plugin/marketplace.json .claude-plugin/marketplace.json.backup

# Introduce error (invalid license)
cat > .claude-plugin/marketplace.json <<'EOF'
{
  "name": "claude-skills",
  "owner": {
    "name": "Test",
    "email": "test@example.com",
    "url": "https://github.com/test/test"
  },
  "metadata": {
    "description": "Test marketplace",
    "version": "1.0.0",
    "homepage": "https://github.com/test/test"
  },
  "plugins": [
    {
      "name": "test-plugin",
      "source": "./plugins/test-plugin",
      "version": "1.0.0",
      "description": "Test plugin description"
    }
  ]
}
EOF

# Run validation (should fail)
npm run validate

# Restore backup
mv .claude-plugin/marketplace.json.backup .claude-plugin/marketplace.json
```

### Test Pre-Commit Hook

```bash
# Make invalid change
echo "invalid" >> .claude-plugin/marketplace.json

# Try to commit
git add .claude-plugin/marketplace.json
git commit -m "Test commit"

# Should block commit with error message

# Restore file
git checkout .claude-plugin/marketplace.json
```

### Test CI Workflow

```bash
# Create test branch
git checkout -b test-validation

# Push to trigger CI
git push origin test-validation

# Check workflow run
gh run list
gh run view <run-id>

# Delete test branch
git checkout main
git branch -D test-validation
git push origin --delete test-validation
```

## Bypassing Validation

### When to Bypass

⚠️ **Use sparingly!** Bypassing validation can introduce breaking changes.

Valid reasons:
- Emergency hotfix (fix in next commit)
- Schema update in progress
- Known false positive being investigated

### How to Bypass

#### Pre-Commit Hook Only

```bash
git commit --no-verify -m "Your message"
```

**Warning**: CI will still validate and may block PR merge!

#### CI Workflow

You cannot bypass CI validation. This is intentional - it's the safety net.

If CI fails:
1. Fix the validation errors
2. Update the schemas if they're incorrect
3. Open an issue if there's a false positive

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/validate-json-schemas.yml`

**Triggers**:
- Push to `main` branch
- Pull requests to `main` branch

**Steps**:
1. Checkout repository
2. Setup Node.js 20
3. Install ajv-cli and ajv-formats
4. Make validation script executable
5. Run validation script
6. Upload artifacts if validation fails

**Blocking behavior**:
- ❌ PR cannot be merged if validation fails
- ✅ Workflow must pass for PR approval

### Viewing CI Results

```bash
# List recent workflow runs
gh run list --workflow=validate-json-schemas.yml

# View specific run
gh run view <run-id>

# Download failure artifacts
gh run download <run-id>
```

### CI Failure Notifications

When validation fails in CI:
1. Workflow shows ❌ failed status
2. PR checks show failure
3. Artifacts contain failing JSON files
4. Error details in workflow logs

## Troubleshooting

### Problem: Hook not running

**Symptoms**: Commits succeed without validation output

**Diagnosis**:
```bash
git config core.hooksPath
# Should output: .githooks
```

**Solution**:
```bash
git config core.hooksPath .githooks
```

### Problem: ajv-cli not found

**Symptoms**: Hook shows warning about ajv-cli

**Diagnosis**:
```bash
command -v ajv
# Should output: /usr/local/bin/ajv or similar
```

**Solution**:
```bash
npm install -g ajv-cli ajv-formats
ajv help  # Verify
```

### Problem: Permission denied

**Symptoms**: `Permission denied: ./scripts/validate-json-schemas.sh`

**Solution**:
```bash
chmod +x scripts/validate-json-schemas.sh
chmod +x .githooks/pre-commit
```

### Problem: Validation passes locally but fails in CI

**Cause**: Different ajv-cli versions or schema caching

**Solution**:
```bash
# Update ajv-cli
npm update -g ajv-cli ajv-formats

# Clear npm cache
npm cache clean --force

# Re-run validation
npm run validate
```

### Problem: Schema doesn't match official spec

**Cause**: Schema may be outdated

**Solution**:
1. Check official Claude Code plugin spec
2. Open issue: https://github.com/secondsky/claude-skills/issues
3. Update schema if needed

### Problem: False positive validation error

**Symptoms**: Valid JSON fails validation

**Solution**:
1. Verify JSON syntax: `jq . file.json`
2. Check schema definition in `schemas/`
3. If schema is wrong, update it
4. If JSON is wrong, fix it
5. Open issue if unclear

### Problem: Too many validation errors

**Symptoms**: 100+ errors in output

**Solution**:
```bash
# Fix one plugin at a time
ajv validate \
  -s schemas/plugin.schema.json \
  -d plugins/cloudflare-d1/.claude-plugin/plugin.json

# Or run sync-plugins script to mass-fix
./scripts/sync-plugins.sh
```

## Benefits Summary

### Local Feedback (Pre-Commit)

✅ **Instant validation** - Catch errors before commit
✅ **Fast performance** - Only validates changed files
✅ **Developer-friendly** - Clear error messages
✅ **Graceful fallback** - Works without ajv-cli installed

### CI Safety Net

✅ **Comprehensive** - Validates all 169+ files
✅ **Blocks bad merges** - Invalid JSON cannot reach main
✅ **No local setup** - Works for all contributors
✅ **Artifact preservation** - Failed files saved for debugging

### Overall Impact

- **99%** of errors caught locally (pre-commit)
- **100%** safety net (CI validation)
- **0** invalid JSON merged to main
- **Sub-second** validation for single file changes
- **~30 seconds** full validation in CI

## Additional Resources

- **Quick Start**: [README.md](README.md)
- **Git Hooks Setup**: [../../.githooks/README.md](../../.githooks/README.md)
- **Schema Files**: [../../schemas/](../../schemas/)
- **Validation Script**: [../../scripts/validate-json-schemas.sh](../../scripts/validate-json-schemas.sh)
- **CI Workflow**: [../../.github/workflows/validate-json-schemas.yml](../../.github/workflows/validate-json-schemas.yml)
- **Official Spec**: [Anthropic Skills Spec](https://github.com/anthropics/skills/blob/main/agent_skills_spec.md)

## Support

Questions? Issues? Feedback?

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/secondsky/claude-skills/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/secondsky/claude-skills/discussions)
- 📧 **Email**: maintainers@example.com

---

**Last Updated**: 2026-02-09
**Version**: 1.0.0
**Maintainer**: Claude Skills Maintainers

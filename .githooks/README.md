# Git Hooks for Claude Skills

This directory contains git hooks for the claude-skills repository.

## Available Hooks

### pre-commit

Validates JSON files before commit:
- Validates `marketplace.json` against `schemas/marketplace.schema.json`
- Validates all changed `plugin.json` files against `schemas/plugin.schema.json`
- Only validates CHANGED files for performance
- Graceful fallback if ajv-cli not installed

## Setup

### 1. Install ajv-cli (Required)

```bash
npm install -g ajv-cli ajv-formats
```

### 2. Enable Git Hooks

```bash
git config core.hooksPath .githooks
```

This configures git to use hooks from `.githooks/` instead of `.git/hooks/`.

### 3. Verify Setup

```bash
# Make a test change to marketplace.json
echo "" >> .claude-plugin/marketplace.json

# Try to commit (hook should run)
git add .claude-plugin/marketplace.json
git commit -m "Test commit"

# You should see validation output
```

## Usage

### Normal Workflow

Hooks run automatically on commit:

```bash
git add .
git commit -m "Your commit message"
# Hook runs automatically and validates JSON
```

### Bypass Validation (When Necessary)

If you need to bypass validation (not recommended):

```bash
git commit --no-verify -m "Your commit message"
```

**⚠️ Warning**: Bypassing validation may introduce invalid JSON that breaks CI/CD.

## What Gets Validated

### marketplace.json

- Valid JSON structure
- Required fields: `name`, `owner`, `metadata`, `plugins`
- Email format validation
- Repository URL format (must be GitHub HTTPS)
- Source paths (must start with `./plugins/`)
- Semantic versioning
- Category enum values

### plugin.json

- Valid JSON structure
- Required field: `name` (only field strictly required per spec)
- Optional fields validated if present:
  - `version`: Semantic versioning format
  - `license`: Must be "MIT"
  - `author`: String or object format
  - `repository`: URL format
  - `commands`, `agents`, `hooks`, `mcpServers`: Paths must start with `./`

## Troubleshooting

### Hook Not Running

```bash
# Check hooks path configuration
git config core.hooksPath

# Should output: .githooks

# If not, run:
git config core.hooksPath .githooks
```

### ajv-cli Not Found

```bash
# Install globally
npm install -g ajv-cli ajv-formats

# Verify installation
ajv help
```

### Validation Errors

If validation fails:

1. Read the error message carefully
2. Fix the JSON syntax or schema violation
3. Commit again
4. If stuck, check `docs/validation/json-schema-validation.md`

### Disable Hooks Temporarily

```bash
# For one commit
git commit --no-verify

# To disable permanently (not recommended)
git config --unset core.hooksPath
```

## CI Integration

Even if you bypass hooks locally with `--no-verify`, the CI workflow will catch validation errors:

- Workflow: `.github/workflows/validate-json-schemas.yml`
- Runs on: Push to main, Pull requests to main
- Blocks: PR merge if validation fails

This provides a safety net for bypassed local validation.

## Benefits

### Local Feedback (Pre-Commit Hook)

- ✅ Instant validation before commit
- ✅ Only validates changed files (fast)
- ✅ Catches 99% of issues before push
- ✅ Graceful fallback if tools not installed

### CI Safety Net

- ✅ Catches bypassed validations
- ✅ Validates all files comprehensively
- ✅ Blocks PR merge if invalid
- ✅ No local setup required

## More Information

See comprehensive documentation:
- `docs/validation/json-schema-validation.md` - Full guide
- `docs/validation/README.md` - Quick start
- `schemas/` - JSON schema definitions

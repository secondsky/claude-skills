# JSON Schema Validation - Quick Start

Automated JSON validation for `marketplace.json` and all `plugin.json` files in the claude-skills repository.

## Quick Setup

```bash
# 1. Install ajv-cli
npm install -g ajv-cli ajv-formats

# 2. Enable git hooks
git config core.hooksPath .githooks

# 3. Test validation
npm run validate
```

Done! Validation will now run automatically on commit.

## Common Commands

```bash
# Validate everything
npm run validate

# Validate marketplace.json only
npm run validate:marketplace

# Validate all plugin.json files
npm run validate:plugins

# Run full validation script
./scripts/validate-json-schemas.sh
```

## What Gets Validated

### marketplace.json
- ✅ Required fields: `name`, `owner`, `metadata`, `plugins`
- ✅ Email format (standard or GitHub noreply)
- ✅ Repository URLs (must be GitHub HTTPS)
- ✅ Source paths (must start with `./plugins/`)
- ✅ Semantic versioning
- ✅ Category enum values

### plugin.json
- ✅ Required field: `name` (only strictly required field)
- ✅ Optional fields validated if present (version, license, etc.)
- ✅ License must be "MIT" (for claude-skills)
- ✅ File paths must start with `./` (commands, agents, hooks)

## Common Issues

### Invalid source path

❌ **Error**: `source should match pattern "^\\./plugins/[^/]+$"`

**Fix**: Source path must start with `./plugins/`:
```json
"source": "./plugins/cloudflare-d1"  ✅
"source": "plugins/cloudflare-d1"    ❌
```

### Invalid email format

❌ **Error**: `email should match format "email"`

**Fix**: Use standard email or GitHub noreply:
```json
"email": "user@example.com"                    ✅
"email": "user@users.noreply.github.com"       ✅
"email": "invalid-email"                       ❌
```

### Invalid license

❌ **Error**: `license should match pattern "^MIT$"`

**Fix**: License must be exactly "MIT":
```json
"license": "MIT"       ✅
"license": "GPL-3.0"   ❌
```

### Missing required field

❌ **Error**: `should have required property 'name'`

**Fix**: Add the required field:
```json
{
  "name": "my-plugin"  // Required!
}
```

## Troubleshooting

### Validation not running on commit

```bash
# Check hooks configuration
git config core.hooksPath
# Should output: .githooks

# If not set, run:
git config core.hooksPath .githooks
```

### ajv-cli not found

```bash
# Install globally
npm install -g ajv-cli ajv-formats

# Verify
ajv help
```

### Need to bypass validation

```bash
# Use with caution - CI will still validate
git commit --no-verify
```

## More Information

- 📖 **Comprehensive Guide**: [json-schema-validation.md](json-schema-validation.md)
- 🔧 **Git Hooks Setup**: [../../.githooks/README.md](../../.githooks/README.md)
- 📋 **Schema Definitions**: [../../schemas/](../../schemas/)
- 🚀 **CI Workflow**: [../../.github/workflows/validate-json-schemas.yml](../../.github/workflows/validate-json-schemas.yml)

## Benefits

### Pre-Commit Hook (Local)
- ✅ Instant feedback before commit
- ✅ Only validates changed files (fast!)
- ✅ Catches 99% of errors early

### CI Workflow (Safety Net)
- ✅ Validates all files comprehensively
- ✅ Catches bypassed validations
- ✅ Blocks PR merge if invalid
- ✅ No local setup required

## Support

Questions? Issues? See:
- [Common mistakes](json-schema-validation.md#common-validation-errors)
- [Testing guide](json-schema-validation.md#testing-validation)
- [GitHub Issues](https://github.com/secondsky/claude-skills/issues)

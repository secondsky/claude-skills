# Ultracite Troubleshooting Guide

Solutions for common issues, errors, and configuration problems when using Ultracite.

**Last Updated**: 2025-11-22

---

## VS Code Issues

### VS Code Not Formatting on Save

**Symptom**: Files don't format when saving in VS Code

**Solution 1**: Install Biome extension

```bash
# Install from VS Code Marketplace
code --install-extension biomejs.biome
```

**Solution 2**: Configure VS Code settings

`.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

**Solution 3**: Reload VS Code

```
Cmd+Shift+P → "Developer: Reload Window"
```

---

### VS Code Shows "Biome Not Found"

**Symptom**:
```
Biome executable not found in PATH
```

**Solution 1**: Install Ultracite locally

```bash
bun add -D ultracite
```

**Solution 2**: Specify Biome path in VS Code settings

`.vscode/settings.json`:
```json
{
  "biome.lspBin": "./node_modules/.bin/biome"
}
```

**Solution 3**: Restart VS Code after installation

---

### VS Code Shows Lint Errors But CLI Doesn't

**Symptom**: VS Code shows errors that `ultracite check` doesn't report

**Cause**: VS Code extension uses different config than CLI

**Solution**: Ensure both use same config

```bash
# Check CLI config path
bunx ultracite check --verbose

# Verify VS Code uses same path
# .vscode/settings.json
{
  "biome.configPath": "./biome.json"
}
```

---

## Conflicts with ESLint/Prettier

### ESLint and Ultracite Disagreeing

**Symptom**: ESLint errors contradict Ultracite rules

**Solution 1**: Disable ESLint (recommended)

```bash
# Remove ESLint
bun remove eslint

# Remove config
rm .eslintrc.json
```

**Solution 2**: Run only Ultracite

**Before**:
```json
{
  "scripts": {
    "lint": "eslint . && ultracite check"
  }
}
```

**After**:
```json
{
  "scripts": {
    "lint": "ultracite check"
  }
}
```

**Solution 3**: Keep ESLint for specific plugins

If you need ESLint plugins without Biome equivalents:

```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:tests": "eslint **/*.test.ts --plugin testing-library"
  }
}
```

---

### Prettier and Ultracite Formatting Conflicts

**Symptom**: Files reformatted differently by Prettier vs Ultracite

**Solution 1**: Remove Prettier (recommended)

```bash
bun remove prettier
rm .prettierrc
```

**Solution 2**: Disable Prettier in pre-commit hooks

**Before** (`.husky/pre-commit`):
```bash
prettier --write . && ultracite check --write
```

**After**:
```bash
ultracite check --write
```

**Solution 3**: Disable Prettier in VS Code

`.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "biomejs.biome",  // Not Prettier
  "prettier.enable": false
}
```

---

## Parse Errors

### "Unexpected token" Error

**Symptom**:
```
Parse error: Unexpected token '<' at line 5
```

**Cause**: Biome doesn't support JSX in `.js` files by default

**Solution**: Configure JSX support

`biome.json`:
```jsonc
{
  "javascript": {
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    }
  },
  "jsx": {
    "runtime": "reactClassic"  // or "automatic" for React 17+
  }
}
```

---

### "Invalid JSON" Error

**Symptom**:
```
Configuration file contains invalid JSON
```

**Cause**: JSON syntax error in `biome.json`

**Solution**: Validate JSON

```bash
# Use JSONC (supports comments)
mv biome.json biome.jsonc

# Validate syntax
jq . biome.jsonc
```

**Common mistakes**:
- Trailing commas in JSON (use JSONC instead)
- Missing quotes around keys
- Unclosed brackets/braces

---

### "Schema Validation Failed"

**Symptom**:
```
Schema validation failed: Unknown property 'extends'
```

**Cause**: Using Biome v1.8 or earlier (no `extends` support)

**Solution**: Update to Biome v1.9+

```bash
bun update ultracite
```

---

## Pre-Commit Hook Failures

### Hook Fails Silently

**Symptom**: Git commits succeed even when linting fails

**Cause**: Hook script missing `set -e` or has incorrect exit code

**Solution**: Add error handling

`.husky/pre-commit`:
```bash
#!/usr/bin/env sh
set -e  # ← Exit on error

. "$(dirname -- "$0")/_/husky.sh"

ultracite check --staged --write
```

---

### Hook Says "Command Not Found"

**Symptom**:
```
.husky/pre-commit: line 4: ultracite: command not found
```

**Cause**: Hook runs before `node_modules` is in PATH

**Solution 1**: Use `bunx`

```bash
bunx ultracite check --staged --write
```

**Solution 2**: Use absolute path

```bash
./node_modules/.bin/ultracite check --staged --write
```

**Solution 3**: Install Ultracite globally (not recommended)

```bash
bun add -g ultracite
```

---

### Hook is Too Slow

**Symptom**: Pre-commit hook takes >10 seconds

**Solution 1**: Lint only staged files

```bash
# ✓ Fast (only staged files)
ultracite check --staged --write

# ✗ Slow (entire codebase)
ultracite check --write
```

**Solution 2**: Use lint-staged

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "ultracite check --write --no-errors-on-unmatched"
    ]
  }
}
```

**Solution 3**: Skip hook for WIP commits

```bash
git commit --no-verify -m "WIP: work in progress"
```

---

## CI Failures

### CI Fails But Local Passes

**Symptom**: `ultracite check` passes locally but fails in CI

**Cause 1**: Different Node/Bun versions

**Solution**: Pin versions in CI

**GitHub Actions**:
```yaml
- uses: oven-sh/setup-bun@v1
  with:
    bun-version: 1.0.20  # Match local version
```

**Cause 2**: Different config files

**Solution**: Verify same config in CI

```bash
# In CI, print config path
bunx ultracite check --verbose
```

---

### CI Runs Out of Memory

**Symptom**:
```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solution**: Increase Node memory limit

**GitHub Actions**:
```yaml
- name: Run Ultracite
  run: NODE_OPTIONS="--max-old-space-size=4096" bunx ultracite check
```

**GitLab CI**:
```yaml
lint:
  variables:
    NODE_OPTIONS: "--max-old-space-size=4096"
  script:
    - bunx ultracite check
```

---

### CI Fails on Formatting

**Symptom**:
```
error[OrganizeImports]: Imports not organized
```

**Cause**: Code formatted locally but not committed

**Solution**: Format before committing

```bash
bunx ultracite format --write .
git add .
git commit -m "chore: format code"
```

**Or**: Auto-format in pre-commit hook

```bash
# .husky/pre-commit
ultracite format --write --staged
```

---

## TypeScript Strictness Errors

### Ultracite Enables Strict Mode

**Symptom**: New TypeScript errors after enabling Ultracite

**Cause**: Ultracite enforces stricter TypeScript rules

**Solution 1**: Fix TypeScript errors (recommended)

```bash
# Find all TypeScript errors
tsc --noEmit
```

**Solution 2**: Disable strict checks temporarily

`biome.json`:
```jsonc
{
  "linter": {
    "rules": {
      "correctness": {
        "noUndeclaredVariables": "off",
        "noUnusedVariables": "warn"  // Warn instead of error
      }
    }
  }
}
```

**Solution 3**: Use `// @ts-expect-error` for known issues

```typescript
// @ts-expect-error - Legacy code, will fix later
const result = unsafeFunction();
```

---

### "Type is not assignable" Errors

**Symptom**:
```
Type 'string | undefined' is not assignable to type 'string'
```

**Cause**: Ultracite enforces stricter null checking

**Solution**: Add type guards

**Before**:
```typescript
const name = user.name;  // Error if name is optional
```

**After**:
```typescript
const name = user.name ?? "Anonymous";
// or
if (user.name) {
  const name = user.name;
}
```

---

## Installation Issues

### "Package Not Found"

**Symptom**:
```
error: package "ultracite" not found
```

**Solution**: Install from correct registry

```bash
# Bun
bun add -D ultracite

# npm
npm install -D ultracite

# pnpm
pnpm add -D ultracite

# Yarn
yarn add -D ultracite
```

---

### Version Conflict

**Symptom**:
```
peer dependency conflict: ultracite requires @biomejs/biome ^1.9.0
```

**Solution**: Update dependencies

```bash
bun update ultracite @biomejs/biome
```

---

### Installation Fails on Windows

**Symptom**:
```
Error: EPERM: operation not permitted
```

**Solution 1**: Run as Administrator

**Solution 2**: Use WSL (Windows Subsystem for Linux)

```bash
# Install in WSL
wsl
bun add -D ultracite
```

**Solution 3**: Disable antivirus temporarily

---

## Performance Issues

### Linting Takes Too Long

**Symptom**: `ultracite check` takes >30 seconds

**Solution 1**: Exclude unnecessary files

`biome.json`:
```jsonc
{
  "files": {
    "ignore": [
      "**/node_modules",
      "**/dist",
      "**/.next",
      "**/build",
      "**/coverage",
      "**/*.generated.ts"
    ]
  }
}
```

**Solution 2**: Use `--changed` flag (lint only changed files)

```bash
bunx ultracite check --changed
```

**Solution 3**: Enable caching in monorepos (Turborepo/Nx)

---

### High CPU Usage

**Symptom**: Ultracite uses 100% CPU

**Cause**: Linting large files or many files in parallel

**Solution 1**: Limit file size

`biome.json`:
```jsonc
{
  "files": {
    "maxSize": 1048576  // 1 MB limit
  }
}
```

**Solution 2**: Reduce parallelism

```bash
bunx ultracite check --max-diagnostics=50
```

---

## Configuration Issues

### Config Not Loaded

**Symptom**: Rules in `biome.json` ignored

**Cause**: Config file not found or invalid

**Solution 1**: Verify config path

```bash
bunx ultracite check --verbose
# Output shows: "Loaded configuration from: /path/to/biome.json"
```

**Solution 2**: Check config syntax

```bash
# Validate JSON
jq . biome.json
```

**Solution 3**: Use explicit config path

```bash
bunx ultracite check --config-path=./biome.json
```

---

### Extends Not Working

**Symptom**: Preset rules not applied

**Cause**: Using Biome v1.8 or earlier

**Solution**: Update to v1.9+

```bash
bun update ultracite
```

Verify version:
```bash
bunx ultracite --version  # Should be 1.9.0+
```

---

### Rules Randomly Change

**Symptom**: Same code lints differently on different runs

**Cause 1**: Config file changed (check git history)

**Solution**:
```bash
git diff biome.json
```

**Cause 2**: Ultracite version changed

**Solution**: Pin version in `package.json`:
```json
{
  "devDependencies": {
    "ultracite": "0.9.4"  // Pin exact version
  }
}
```

---

## Best Practices to Avoid Issues

1. **Pin Ultracite version** in `package.json`
2. **Commit `biome.json`** to version control
3. **Use `bunx`** instead of global installs
4. **Test locally** before pushing to CI
5. **Enable verbose mode** (`--verbose`) when debugging
6. **Keep dependencies updated** (quarterly)
7. **Use presets** (`ultracite/core`, `ultracite/react`) to avoid manual config
8. **Document custom rules** in comments

---

**See also:**
- `configuration-guide.md` for config details
- `migration-guides.md` for ESLint/Prettier migration
- `limitations-and-workarounds.md` for known issues

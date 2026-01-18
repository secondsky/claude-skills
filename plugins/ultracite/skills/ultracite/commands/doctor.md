---
name: ultracite:doctor
description: Validate Ultracite project setup and configuration
argument-hint: No arguments required
allowed-tools: [Read, Bash, Grep, Glob]
---

# Ultracite Doctor Command

Run comprehensive diagnostics on your Ultracite setup.

## What This Command Does

1. **Installation Check**
   - Verify ultracite is installed in package.json
   - Check @biomejs/biome version
   - Detect provider (Biome/ESLint/Oxlint)

2. **Configuration Validation**
   - Parse biome.jsonc syntax
   - Check for deprecated presets (v6 vs v7 paths)
   - Validate preset paths exist
   - Detect incompatible rule combinations

3. **Conflict Detection**
   - Check for lingering ESLint/Prettier configs
   - Warn about potential tool conflicts
   - Suggest cleanup steps

4. **Environment Check**
   - Verify Node.js version
   - Check for Git hooks integration
   - Validate editor integration

5. **Performance Analysis**
   - Estimate project size
   - Recommend provider based on size
   - Suggest optimization opportunities

## How to Use

Simply run `/ultracite:doctor` in your project directory. The command will automatically:

1. Scan your project for Ultracite installation
2. Validate your configuration files
3. Check for common issues
4. Provide actionable recommendations

## Diagnostic Steps

### Step 1: Installation Check

Check if ultracite is installed:
- Read `package.json`
- Look for `ultracite` in dependencies/devDependencies
- Verify `@biomejs/biome` version (if using Biome provider)

Expected output:
```
✅ Ultracite installed: v7.2.0
✅ Provider: Biome v1.9.4
```

### Step 2: Configuration Validation

Read and parse `biome.jsonc`:
- Check JSON/JSONC syntax
- Validate preset paths
- Detect v6 vs v7 paths

Common issues detected:
- **v6 preset paths**: `ultracite/core` → Should be `ultracite/biome/core`
- **Missing presets**: Path references non-existent preset file
- **Syntax errors**: Invalid JSON/JSONC

Expected output:
```
✅ Configuration: biome.jsonc valid
⚠️ Preset paths: Using v6 paths (upgrade to v7)
  → Run /ultracite:migrate to fix
```

### Step 3: Conflict Detection

Search for conflicting configuration files:
- `.eslintrc*` (any extension)
- `.prettierrc*` (any extension)
- `.stylelintrc*` (any extension)
- `eslint.config.js` (flat config)

If found, warn about potential conflicts:
```
⚠️ Conflicting tools detected:
  - .eslintrc.js found
  - .prettierrc found
  → Consider removing or running /ultracite:migrate
```

### Step 4: Environment Check

Check Node.js version:
```bash
node --version
```

Required: Node.js >= 18.x

Check for Git hooks:
- Look for `.husky/` directory
- Check `lefthook.yml`
- Search `package.json` for `lint-staged`

Expected output:
```
✅ Node.js: v20.10.0
⚠️ Git hooks: Not configured
  → See references/git-hooks-setup.md
```

### Step 5: Performance Analysis

Estimate project size:
- Count files matching patterns: `**/*.{js,jsx,ts,tsx,vue,svelte}`
- Exclude node_modules, dist, build

Recommend provider based on size:
- **< 500 files**: Biome (fastest)
- **500-2000 files**: Biome or Oxlint
- **> 2000 files**: Oxlint (parallel processing)
- **TypeScript heavy**: Oxlint (type-aware linting)

Expected output:
```
✅ Project size: ~350 files
✅ Provider: Biome (optimal for your project size)
```

## Output Format

The doctor command provides a comprehensive report:

```
Ultracite Doctor Report
=======================

✅ INSTALLATION
  - Ultracite: v7.2.0
  - Provider: Biome v1.9.4
  - Node.js: v20.10.0

✅ CONFIGURATION
  - Config file: biome.jsonc
  - Syntax: Valid
  ⚠️ Preset paths: Using v6 paths (upgrade recommended)
    Old: "ultracite/core"
    New: "ultracite/biome/core"
    → Run /ultracite:migrate to upgrade

⚠️ CONFLICTS
  - Found .eslintrc.js
  - Found .prettierrc
  → Consider removing or migrating with /ultracite:migrate

✅ ENVIRONMENT
  - Node.js: v20.10.0 (supported)
  ⚠️ Git hooks: Not configured
    → See references/git-hooks-setup.md for setup

✅ PERFORMANCE
  - Project size: ~350 files
  - Provider: Biome (optimal)
  - Estimated lint time: < 1s

RECOMMENDATIONS
===============
1. Run /ultracite:migrate to upgrade preset paths to v7
2. Remove conflicting .eslintrc.js and .prettierrc files
3. Set up Git hooks for automatic linting
4. Configure editor integration (see references/ai-editor-integration.md)

Overall Status: ⚠️ GOOD (with minor issues)
```

## Error Handling

### Ultracite Not Installed

```
❌ Ultracite not found in package.json

To install:
  npm install -D ultracite @biomejs/biome

Or use a different provider:
  npm install -D ultracite eslint
  npm install -D ultracite oxlint
```

### No Configuration File

```
❌ No biome.jsonc found

Run to create:
  npx ultracite init

Or copy from examples:
  cp node_modules/ultracite/presets/biome/react.jsonc biome.jsonc
```

### Invalid Configuration

```
❌ Configuration syntax error in biome.jsonc:12

  10: "linter": {
  11:   "enabled": true,
> 12:   "rules": {
             ^
  Error: Unexpected token

Fix: Check JSON/JSONC syntax
```

## When to Run

Run `/ultracite:doctor` when:

- ✅ Setting up Ultracite for the first time
- ✅ After migrating from ESLint/Prettier
- ✅ Before deploying to production
- ✅ When experiencing linting issues
- ✅ After upgrading Ultracite versions
- ✅ When configuration changes don't seem to apply
- ✅ To verify Git hooks integration

## Related Commands

- `/ultracite:migrate` - Migrate from ESLint/Prettier or upgrade v6→v7
- Load `references/troubleshooting.md` - For specific error solutions
- Load `references/configuration-guide.md` - For detailed configuration options

## Implementation Notes

This command uses:
- **Read** tool to read package.json, biome.jsonc
- **Glob** tool to find configuration files
- **Grep** tool to search for preset paths
- **Bash** tool to check Node.js version

No files are modified - this is a read-only diagnostic command.

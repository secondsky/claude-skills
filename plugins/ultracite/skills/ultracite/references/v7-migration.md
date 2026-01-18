---
title: Ultracite v7 Migration Guide
version: v7
released: 2025-11
description: Migration guide from Ultracite v6 to v7 with multi-provider architecture and preset path changes
tags: [migration, v7, multi-provider, breaking-changes]
---

# Ultracite v7 Migration Guide

**Version**: v6 → v7
**Released**: 2025-11
**Key Changes**: Multi-provider architecture, preset path migration, MCP server, AI hooks

## Overview

Ultracite v7 represents a **major architectural change** introducing multi-provider support (Biome, ESLint, Oxlint) and breaking changes to preset paths. This guide helps you migrate from v6 to v7 smoothly.

## What's New in v7

### 1. Multi-Provider Architecture

v7 supports three linting providers:

- **Biome** (default) - Fastest, Rust-based
- **ESLint + Prettier + Stylelint** - Maximum compatibility
- **Oxlint + Oxfmt** - Type-aware, ultra-fast

### 2. Breaking Change: Preset Paths

**v6 paths (deprecated)**:
```jsonc
{
  "extends": ["ultracite/core", "ultracite/react"]
}
```

**v7 paths (required)**:
```jsonc
{
  "extends": ["ultracite/biome/core", "ultracite/biome/react"]
}
```

### 3. New Features

- **MCP Server**: AI assistant integration via Model Context Protocol
- **AI Hooks**: Auto-format after AI edits (separate from AI rules)
- **Type-Aware Linting**: Oxlint provider uses TypeScript type system
- **`ultracite doctor`**: Diagnostic command to validate configuration
- **Programmatic API**: `--quiet` flag for CI/CD automation

## Migration Steps

### Step 1: Update Ultracite Package

```bash
# Using Bun (recommended)
bun update ultracite @biomejs/biome

# Using npm
npm update ultracite @biomejs/biome

# Using pnpm
pnpm update ultracite @biomejs/biome

# Using yarn
yarn upgrade ultracite @biomejs/biome
```

Verify version:
```bash
npx ultracite --version
# Should output: v7.x.x
```

### Step 2: Migrate Preset Paths (BREAKING CHANGE)

**Automatic Migration** (recommended):
```bash
# Ultracite will auto-migrate preset paths
npx ultracite migrate --from v6 --to v7

# Or use the doctor command to detect issues
npx ultracite doctor
```

**Manual Migration**:

Find all instances of `ultracite/` in `biome.jsonc` and add `/biome/` segment:

**Before (v6)**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": [
    "ultracite/core",        // ❌ Old path
    "ultracite/react"        // ❌ Old path
  ]
}
```

**After (v7)**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": [
    "ultracite/biome/core",   // ✅ New path (added /biome/)
    "ultracite/biome/react"   // ✅ New path (added /biome/)
  ]
}
```

### Preset Path Migration Table

| v6 Path | v7 Path (Biome) |
|---------|----------------|
| `ultracite/core` | `ultracite/biome/core` |
| `ultracite/react` | `ultracite/biome/react` |
| `ultracite/next` | `ultracite/biome/next` |
| `ultracite/vue` | `ultracite/biome/vue` |
| `ultracite/svelte` | `ultracite/biome/svelte` |
| `ultracite/solid` | `ultracite/biome/solid` |
| `ultracite/qwik` | `ultracite/biome/qwik` |
| `ultracite/angular` | `ultracite/biome/angular` |
| `ultracite/remix` | `ultracite/biome/remix` |
| `ultracite/astro` | `ultracite/biome/astro` |

### Step 3: Choose Your Provider (Optional)

**Keep Biome (default)** - No action needed if you want to continue using Biome.

**Switch to ESLint Provider**:
```bash
# Migrate to ESLint + Prettier + Stylelint
npx ultracite migrate --to-provider eslint

# Manual setup
bun add -D eslint prettier stylelint
# Creates .eslintrc.js, .prettierrc.json, .stylelintrc.json
```

**Switch to Oxlint Provider**:
```bash
# Migrate to Oxlint + Oxfmt (type-aware)
npx ultracite migrate --to-provider oxlint

# Manual setup
bun add -D oxlint oxfmt
# Creates oxlintrc.json
```

### Step 4: Run Diagnostics

```bash
# Validate v7 configuration
npx ultracite doctor

# Check for issues:
# ✓ Preset paths correct (v7 format)
# ✓ Configuration file valid
# ✓ Editor integration working
# ✓ Git hooks configured
# ⚠ Old v6 preset paths detected → migrate to v7
```

### Step 5: Test Configuration

```bash
# Lint codebase
npx ultracite check .

# Format codebase
npx ultracite format .

# Fix issues
npx ultracite fix .
```

### Step 6: Update CI/CD (if applicable)

Update CI pipelines to use v7:

**Before (v6)**:
```yaml
# .github/workflows/lint.yml
- name: Lint
  run: npx ultracite check .
```

**After (v7)** - No changes needed unless using provider flags:
```yaml
# .github/workflows/lint.yml
- name: Lint
  run: npx ultracite check .  # Auto-detects provider

# Or explicitly specify provider
- name: Lint with Biome
  run: npx ultracite check . --provider biome
```

## Breaking Changes

### 1. Preset Paths Require `/biome/` Segment

**Impact**: All `ultracite/*` preset paths must include `/biome/`

**Migration**: Add `/biome/` between `ultracite/` and preset name

**Error if not migrated**:
```
Error: Preset "ultracite/core" not found
  → Did you mean "ultracite/biome/core"?
  → Run: npx ultracite doctor
```

### 2. Configuration File Structure

v7 maintains backward compatibility with v6 configuration structure. Only preset paths need updating.

### 3. CLI Flags

New flags in v7:

- `--linter`: Choose provider during init (biome, eslint, oxlint)
- `--provider`: Specify provider for commands
- `--quiet`: Suppress output for CI/CD

**Example**:
```bash
# v7 new flag
bun x ultracite init --linter oxlint

# v6 equivalent (always used Biome)
bun x ultracite init
```

## New Features in v7

### 1. Multi-Provider Support

**Choose at installation**:
```bash
# Biome (default)
bun x ultracite init --linter biome

# ESLint + Prettier + Stylelint
bun x ultracite init --linter eslint

# Oxlint + Oxfmt (type-aware)
bun x ultracite init --linter oxlint
```

**See provider-specific docs**:
- `references/provider-biome.md`
- `references/provider-eslint.md`
- `references/provider-oxlint.md`

### 2. MCP Server Integration

Integrate Ultracite with AI assistants via Model Context Protocol:

```bash
# Install MCP server
npx ultracite mcp install

# Configure for Claude Desktop
npx ultracite mcp configure --client claude-desktop

# Configure for Cursor
npx ultracite mcp configure --client cursor
```

**See**: `references/mcp-integration.md`

### 3. AI Hooks (New in v7)

AI hooks auto-format code after AI edits (distinct from AI rules):

**AI Rules** (existing): Guide AI to write better code
**AI Hooks** (new): Auto-run `ultracite fix` after AI edits

```bash
# Install AI hooks for Cursor
npx ultracite ai-hooks install --editor cursor

# Install for Claude Code
npx ultracite ai-hooks install --editor claude-code
```

**See**: `references/ai-hooks.md`

### 4. Type-Aware Linting (Oxlint Provider)

Oxlint provider uses TypeScript's type system:

```json
// oxlintrc.json
{
  "extends": ["ultracite/oxlint/core"],
  "typeAware": true,
  "tsconfig": "./tsconfig.json"
}
```

Catches errors like:
- Unnecessary null checks (type is non-nullable)
- Promise handling errors (missing await)
- Type mismatches

**See**: `references/provider-oxlint.md`

### 5. `ultracite doctor` Command

Diagnostic tool to validate configuration:

```bash
npx ultracite doctor

# Output:
# ✓ Ultracite version: v7.0.0
# ✓ Provider: biome
# ✓ Configuration file: biome.jsonc (valid)
# ✓ Preset paths: v7 format
# ✓ Editor integration: VS Code (Biome extension installed)
# ✓ Git hooks: Husky configured
# ⚠ TypeScript strictNullChecks: false (recommended: true)
```

### 6. Programmatic Usage

`--quiet` flag for CI/CD:

```bash
# Suppress output, exit code only
npx ultracite check . --quiet

# Exit codes:
# 0 = No errors
# 1 = Linting errors found
# 2 = Configuration error
```

## Provider Comparison

| Feature | Biome | ESLint | Oxlint |
|---------|-------|--------|--------|
| Speed | 🚀 Fastest | 🐢 Slowest | 🚀🚀 Fastest linting |
| Setup | Zero-config | Requires config | Type-aware config |
| Ecosystem | Growing | Mature (1000+ plugins) | Newer |
| Type-Aware | ❌ No | ⚠️ Via plugins | ✅ Built-in |
| CSS Linting | ⚠️ Basic | ✅ Stylelint integration | ❌ No |

**Recommendation**:
- **Biome**: Default choice for most projects
- **ESLint**: Need specific ESLint plugins or advanced CSS linting
- **Oxlint**: Large TypeScript codebases, type-safety critical

## Troubleshooting

### "Preset not found" Error

**Problem**:
```
Error: Preset "ultracite/core" not found
```

**Solution**: Migrate to v7 preset paths

```bash
# Auto-migrate
npx ultracite doctor --fix

# Or manually add /biome/
{
  "extends": ["ultracite/biome/core"]  // Added /biome/
}
```

### Mixed v6 and v7 Paths

**Problem**: Some paths updated, others not

```jsonc
{
  "extends": [
    "ultracite/biome/core",  // ✅ v7
    "ultracite/react"        // ❌ v6 (missed)
  ]
}
```

**Solution**: Update all paths consistently

```bash
# Use doctor to detect
npx ultracite doctor

# Auto-fix
npx ultracite doctor --fix
```

### Provider-Specific Issues

**Biome**: See `references/provider-biome.md`
**ESLint**: See `references/provider-eslint.md`
**Oxlint**: See `references/provider-oxlint.md`

## Compatibility

### v6 Configurations

v6 configurations are **not compatible** with v7 without preset path migration.

**Required changes**:
- Add `/biome/` to all preset paths
- OR migrate to different provider

### TypeScript Version

- Biome: No TypeScript dependency
- ESLint: TypeScript 4.x+ recommended
- Oxlint: TypeScript 5.x+ required for type-aware linting

## Rollback to v6

If you need to roll back:

```bash
# Reinstall v6
bun add -D ultracite@6 @biomejs/biome@1.8.x

# Revert preset paths in biome.jsonc
# ultracite/biome/core → ultracite/core
```

## Next Steps

After migrating to v7:

1. **Test thoroughly**: Run linting on entire codebase
2. **Update team docs**: Document provider choice and v7 paths
3. **Explore new features**: MCP server, AI hooks, type-aware linting (Oxlint)
4. **Monitor performance**: Benchmark v7 vs v6 linting speed
5. **Consider provider switch**: Evaluate if different provider better suits needs

## Resources

- [v7 Release Notes](https://www.ultracite.ai/blog/v7-release)
- [v7 Migration FAQ](https://www.ultracite.ai/faq#v7-migration)
- [Multi-Provider Guide](https://www.ultracite.ai/guides/providers)
- [Breaking Changes](https://www.ultracite.ai/breaking-changes/v7)
- [GitHub Changelog](https://github.com/ultracite/ultracite/releases/tag/v7.0.0)

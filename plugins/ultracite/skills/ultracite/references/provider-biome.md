---
title: Biome Provider Reference
description: Rust-based linting and formatting provider for modern TypeScript development
provider: Biome
skill: ultracite
category: reference
speed: Fastest (10-100x faster than ESLint)
bestFor: New projects, TypeScript-first development, performance-critical builds
summary: Rust-based linting and formatting provider
---

# Biome Provider Reference

**Provider**: Biome (Default)
**Speed**: Fastest (10-100x faster than ESLint)
**Best for**: New projects, TypeScript-first development, performance-critical builds

## Overview

Biome is the default Ultracite provider, offering blazing-fast Rust-based linting and formatting. It provides zero-configuration setup with 200+ preconfigured rules optimized for modern TypeScript development.

## Installation

```bash
# Install with Biome provider (default)
bun x ultracite init --linter biome

# Or without explicit flag (defaults to Biome)
bun x ultracite init
```

## Configuration File

Biome uses `biome.jsonc` for configuration:

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": [
    "ultracite/biome/core",      // v7 path (required)
    "ultracite/biome/react"      // Framework preset
  ],
  "files": {
    "ignore": ["dist", "node_modules", ".next", "build"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true
  }
}
```

## V7 Preset Paths (Breaking Change)

**v6 paths (old - deprecated)**:
```jsonc
{
  "extends": ["ultracite/core", "ultracite/react"]
}
```

**v7 paths (new - required)**:
```jsonc
{
  "extends": ["ultracite/biome/core", "ultracite/biome/react"]
}
```

**Migration**: Add `/biome/` segment to all preset paths.

## Available Presets

### Core Preset
- `ultracite/biome/core` - Base rules (200+ rules)
  - TypeScript strict mode
  - Null/undefined safety
  - Import organization
  - Security rules
  - Performance optimizations

### Framework Presets
- `ultracite/biome/react` - React + JSX rules
- `ultracite/biome/next` - Next.js optimization
- `ultracite/biome/vue` - Vue 3 SFC support
- `ultracite/biome/svelte` - Svelte components
- `ultracite/biome/solid` - Solid.js patterns
- `ultracite/biome/qwik` - Qwik framework
- `ultracite/biome/angular` - Angular components
- `ultracite/biome/remix` - Remix framework
- `ultracite/biome/astro` - Astro framework

## Rule Customization

Override or extend rules in `biome.jsonc`:

```jsonc
{
  "extends": ["ultracite/biome/core", "ultracite/biome/react"],
  "linter": {
    "rules": {
      "style": {
        "useConst": "error",
        "noVar": "error"
      },
      "correctness": {
        "noUnusedVariables": "warn"  // Downgrade to warning
      },
      "suspicious": {
        "noExplicitAny": "off"  // Disable rule
      }
    }
  }
}
```

## Performance Optimization

### For Large Codebases

```jsonc
{
  "extends": ["ultracite/biome/core"],
  "files": {
    "maxSize": 1000000,  // 1MB file size limit
    "ignore": [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/*.generated.ts"  // Ignore generated files
    ]
  }
}
```

### Parallel Processing

Biome automatically uses all CPU cores. No configuration needed.

## Editor Integration

### VS Code

Install the Biome extension:

```bash
code --install-extension biomejs.biome
```

Add to `.vscode/settings.json`:

```json
{
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  }
}
```

## CLI Commands

```bash
# Check files (linting only)
npx ultracite check .

# Format files
npx ultracite format .

# Fix issues automatically
npx ultracite fix .

# Check with verbose output
npx ultracite check . --verbose

# Dry run (no changes)
npx ultracite fix . --dry-run

# Check specific files
npx ultracite check src/**/*.ts
```

## Diagnostics

Run diagnostics to validate configuration:

```bash
npx ultracite doctor
```

Checks:
- Configuration file validity
- Preset path correctness (v6 vs v7)
- File permissions
- Editor integration
- Git hooks status

## Limitations

### CSS Linting
- Basic CSS support only
- For advanced CSS/SCSS linting, use ESLint provider or add Stylelint separately

### ESLint Plugin Ecosystem
- No direct ESLint plugin support
- Most common patterns covered by Biome's built-in rules
- For specific ESLint plugins, consider ESLint provider

### Framework Support
- Angular/Ember support is basic
- Vue/Svelte support improving with each release

## Troubleshooting

### "Preset not found" Error

**Problem**: `ultracite/core` not found

**Solution**: Update to v7 preset paths:
```jsonc
{
  "extends": ["ultracite/biome/core"]  // Add /biome/ segment
}
```

### Format on Save Not Working

**Check**:
1. Biome extension installed in VS Code
2. `editor.formatOnSave: true` in settings
3. `biomejs.biome` set as default formatter

**Fix**:
```bash
# Reinstall Biome extension
code --install-extension biomejs.biome --force
```

### Slow Performance

**Solutions**:
1. Add `files.ignore` patterns for large directories
2. Set `files.maxSize` limit
3. Exclude generated files

## Resources

- [Biome Official Docs](https://biomejs.dev/)
- [Ultracite Biome Docs](https://www.ultracite.ai/providers/biome)
- [Rule Reference](https://biomejs.dev/linter/rules/)
- [Migration Guide](https://biomejs.dev/guides/migrate-eslint/)

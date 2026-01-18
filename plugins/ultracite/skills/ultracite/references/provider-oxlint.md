---
title: Oxlint Provider Reference
description: Oxlint + Oxfmt provider for type-aware linting and maximum performance
provider: Oxlint
speed: Fastest
bestFor: Large TypeScript codebases, type-safety-critical projects, maximum performance
---

# Oxlint Provider Reference

**Provider**: Oxlint + Oxfmt
**Speed**: Fastest linting (even faster than Biome for linting)
**Best for**: Large TypeScript codebases, type-safety-critical projects, maximum performance

## Overview

Oxlint is the newest Ultracite provider, offering ultra-fast Rust-based linting with **type-aware** capabilities. It uses TypeScript's type system to catch errors that traditional linters miss. Combined with Oxfmt for formatting, this provider delivers the fastest linting experience available.

## Installation

```bash
# Install with Oxlint provider
bun x ultracite init --linter oxlint

# Installs: oxlint, oxfmt, and TypeScript integration
```

## Configuration File

Oxlint uses `oxlintrc.json` for configuration:

```json
{
  "extends": [
    "ultracite/oxlint/core",
    "ultracite/oxlint/react"
  ],
  "rules": {
    "typescript": "error",
    "react": "error"
  },
  "typeAware": true,
  "tsconfig": "./tsconfig.json"
}
```

## Type-Aware Linting

Oxlint's killer feature is **type-aware linting** using TypeScript's type system:

### Enabled by Default

```json
{
  "extends": ["ultracite/oxlint/core"],
  "typeAware": true,
  "tsconfig": "./tsconfig.json"
}
```

### What Type-Aware Linting Catches

#### Example 1: Unnecessary null checks

```typescript
function greet(name: string) {
  // Oxlint detects: 'name' is always defined (type is 'string', not 'string | undefined')
  if (name !== null) {  // ❌ Unnecessary check
    console.log(`Hello, ${name}`);
  }
}
```

#### Example 2: Type mismatches

```typescript
interface User {
  id: number;
  name: string;
}

function getUserName(user: User) {
  // Oxlint detects: 'user.age' doesn't exist on type 'User'
  return user.age;  // ❌ Type error
}
```

#### Example 3: Promise handling

```typescript
async function fetchData(): Promise<string> {
  return "data";
}

// Oxlint detects: Missing 'await' for Promise
const data = fetchData();  // ❌ Returns Promise<string>, not string
console.log(data.toUpperCase());  // Runtime error
```

## Available Presets

### Core Preset
- `ultracite/oxlint/core` - Base rules with type-awareness
  - TypeScript type checking
  - Null/undefined safety (via types)
  - Promise handling
  - Import organization

### Framework Presets
- `ultracite/oxlint/react` - React + JSX with type-aware hooks
- `ultracite/oxlint/next` - Next.js optimization
- `ultracite/oxlint/vue` - Vue 3 with TypeScript
- `ultracite/oxlint/solid` - Solid.js patterns

## Performance Characteristics

### Linting Speed Comparison

**Benchmark**: 10,000 TypeScript files
- **Oxlint**: ~2 seconds (fastest)
- **Biome**: ~5 seconds
- **ESLint**: ~200 seconds

### Type-Aware Performance

Type-aware linting is slightly slower than regular linting, but still faster than ESLint:

- **Oxlint (type-aware)**: ~5 seconds
- **ESLint (type-aware)**: ~300 seconds

## Editor Integration

### VS Code

Install the Oxlint extension:

```bash
code --install-extension oxlint.vscode-oxlint
```

Add to `.vscode/settings.json`:

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "oxlint.vscode-oxlint",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "oxlint.vscode-oxlint",
    "editor.formatOnSave": true
  },
  "oxlint.typeAware": true,
  "oxlint.tsconfig": "./tsconfig.json"
}
```

## CLI Commands

```bash
# Lint with type-awareness
npx ultracite check .

# Lint without type-awareness (faster)
npx ultracite check . --no-type-aware

# Format with Oxfmt
npx ultracite format .

# Fix issues automatically
npx ultracite fix .

# Specific TypeScript project
npx ultracite check . --tsconfig ./tsconfig.app.json
```

## Type-Aware Configuration

### Multiple TypeScript Configs

For monorepos or projects with multiple `tsconfig.json` files:

```json
{
  "extends": ["ultracite/oxlint/core"],
  "typeAware": true,
  "projects": [
    "./tsconfig.json",
    "./packages/*/tsconfig.json"
  ]
}
```

### Disabling Type-Aware for Specific Files

```json
{
  "extends": ["ultracite/oxlint/core"],
  "typeAware": true,
  "tsconfig": "./tsconfig.json",
  "overrides": [
    {
      "files": ["**/*.generated.ts"],
      "typeAware": false
    }
  ]
}
```

## Rule Customization

Override or extend rules:

```json
{
  "extends": ["ultracite/oxlint/core", "ultracite/oxlint/react"],
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/no-unused-vars": "warn",
    "react/no-unstable-nested-components": "error"
  }
}
```

## Performance Optimization

### Incremental Type Checking

Oxlint caches type information for faster subsequent runs:

```json
{
  "typeAware": true,
  "incremental": true,
  "tsBuildInfoFile": ".oxlint-cache"
}
```

### Parallel Processing

Oxlint automatically uses all CPU cores. For monorepos:

```json
{
  "parallel": true,
  "maxWorkers": 8  // Or auto-detect
}
```

## Advantages Over Biome

### Type-Aware Linting
- Catches errors traditional linters miss
- Uses TypeScript's type system
- Detects type mismatches, unnecessary null checks, Promise errors

### Even Faster Linting
- 2-3x faster than Biome for linting (non-type-aware mode)
- Comparable speed to Biome when type-aware enabled

### TypeScript-First Design
- Built specifically for TypeScript codebases
- Better TypeScript integration

## Advantages Over ESLint

### Performance
- 100x faster than ESLint with type-aware rules
- Rust-based (vs JavaScript)

### Simpler Configuration
- Single tool for linting + formatting (vs ESLint + Prettier)
- Type-awareness built-in (vs separate `@typescript-eslint/*` packages)

## Limitations

### Newer Ecosystem
- Fewer community plugins than ESLint
- Less documentation and examples
- Smaller community

### Rule Coverage
- Fewer total rules than ESLint (but covers most common cases)
- Missing some niche ESLint plugins

### CSS Linting
- No CSS/SCSS support
- Use ESLint provider or add Stylelint separately

## When to Choose Oxlint Over Other Providers

### ✅ Choose Oxlint When:
- TypeScript is primary language (>80% of codebase)
- Type safety is critical (financial, healthcare, security apps)
- Large codebase (10,000+ files) needs fast CI
- Want to catch type-related bugs early
- Performance is top priority

### ⚠️ Consider Alternatives When:
- Need ESLint plugin ecosystem
- CSS/SCSS linting is important
- Team unfamiliar with type-aware linting
- JavaScript-heavy project (not TypeScript)

## Diagnostics

```bash
# Check Oxlint configuration
npx ultracite doctor

# Validate TypeScript config integration
npx oxlint --print-config

# Test type-aware linting
npx oxlint --type-aware --debug
```

## Troubleshooting

### Type-Aware Linting Not Working

**Problem**: Type errors not being detected

**Check**:
1. `typeAware: true` in `oxlintrc.json`
2. Valid `tsconfig.json` path
3. TypeScript installed as dependency

**Fix**:
```bash
# Ensure TypeScript is installed
bun add -D typescript

# Validate tsconfig.json
npx tsc --noEmit
```

### Slow Type-Aware Performance

**Solutions**:
1. Enable incremental type checking
2. Exclude large directories from type checking
3. Use `--no-type-aware` for quick checks

```json
{
  "typeAware": true,
  "incremental": true,
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"  // Exclude tests from type checking
  ]
}
```

### "Cannot find tsconfig.json" Error

**Problem**: Oxlint can't locate TypeScript config

**Solution**: Specify path explicitly:

```json
{
  "typeAware": true,
  "tsconfig": "./tsconfig.app.json"  // Explicit path
}
```

## Resources

- [Oxlint Official Docs](https://oxc-project.github.io/docs/guide/usage/linter)
- [Ultracite Oxlint Docs](https://www.ultracite.ai/providers/oxlint)
- [Type-Aware Linting Guide](https://www.ultracite.ai/guides/type-aware-linting)
- [GitHub](https://github.com/oxc-project/oxc)

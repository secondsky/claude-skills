# Ultracite v6 Migration Guide

**Version**: v5 → v6
**Released**: 2025-09
**Key Change**: Framework-specific presets introduced

## Overview

Ultracite v6 introduced framework-specific presets to provide better out-of-the-box configurations for React, Next.js, Vue, Svelte, and other popular frameworks. This version maintains backward compatibility with v5 configurations while offering enhanced framework support.

## What's New in v6

### Framework-Specific Presets

**Before v5** (generic configuration):
```jsonc
{
  "extends": ["ultracite/core"]
  // Manual framework rules configuration required
}
```

**After v6** (framework-optimized):
```jsonc
{
  "extends": [
    "ultracite/core",
    "ultracite/react"  // Framework preset
  ]
}
```

### Available Framework Presets

- `ultracite/react` - React + JSX rules
- `ultracite/next` - Next.js optimization (Image, Link components)
- `ultracite/vue` - Vue 3 SFC, composables, reactivity
- `ultracite/svelte` - Svelte components, reactive declarations
- `ultracite/solid` - Solid.js patterns
- `ultracite/qwik` - Qwik framework
- `ultracite/angular` - Angular components
- `ultracite/remix` - Remix framework
- `ultracite/astro` - Astro framework

## Migration Steps

### Step 1: Update Ultracite Package

```bash
# Using Bun
bun update ultracite @biomejs/biome

# Using npm
npm update ultracite @biomejs/biome

# Using pnpm
pnpm update ultracite @biomejs/biome

# Using yarn
yarn upgrade ultracite @biomejs/biome
```

### Step 2: Add Framework Preset

Identify your framework and add the appropriate preset:

**React Projects**:
```jsonc
{
  "extends": [
    "ultracite/core",
    "ultracite/react"  // Add this
  ]
}
```

**Next.js Projects**:
```jsonc
{
  "extends": [
    "ultracite/core",
    "ultracite/next"  // Next.js preset includes React rules
  ]
}
```

**Vue Projects**:
```jsonc
{
  "extends": [
    "ultracite/core",
    "ultracite/vue"
  ]
}
```

**Svelte Projects**:
```jsonc
{
  "extends": [
    "ultracite/core",
    "ultracite/svelte"
  ]
}
```

### Step 3: Remove Manual Framework Rules

If you manually configured framework rules in v5, you can now remove them:

**Before** (v5 manual configuration):
```jsonc
{
  "extends": ["ultracite/core"],
  "linter": {
    "rules": {
      "jsx-a11y": {
        "useKeyWithClickEvents": "error",
        "noAccessKey": "error"
      },
      "react": {
        "useJsxKeyInIterable": "error",
        "useValidAriaProps": "error"
      }
    }
  }
}
```

**After** (v6 with preset):
```jsonc
{
  "extends": [
    "ultracite/core",
    "ultracite/react"  // Includes all standard React rules
  ]
  // Manual rules removed
}
```

### Step 4: Test Configuration

```bash
# Check for linting errors
npx ultracite check .

# Format files
npx ultracite format .

# Fix issues
npx ultracite fix .
```

### Step 5: Review and Customize

Framework presets provide sensible defaults. Customize if needed:

```jsonc
{
  "extends": ["ultracite/core", "ultracite/react"],
  "linter": {
    "rules": {
      "react": {
        "useJsxKeyInIterable": "warn"  // Downgrade to warning
      }
    }
  }
}
```

## Breaking Changes

### None (v6 is Backward Compatible)

v6 maintains full backward compatibility with v5 configurations. You can continue using `ultracite/core` without framework presets if desired.

## New Features in v6

### 1. Framework-Specific Rule Tuning

Each framework preset includes optimized rules:

**React Preset** includes:
- JSX accessibility rules
- Hook dependency validation
- Component prop validation
- React-specific best practices

**Next.js Preset** includes:
- Image component optimization warnings
- Link component usage
- Next.js-specific patterns
- SEO best practices

**Vue Preset** includes:
- SFC structure validation
- Composition API patterns
- Reactivity best practices
- Vue 3 specific rules

### 2. Automatic Framework Detection

When running `ultracite init`, framework detection is now automatic:

```bash
# v6 automatically detects React and suggests preset
bun x ultracite init

# Output:
# ✓ Detected framework: React
# ✓ Adding preset: ultracite/react
```

### 3. Improved Error Messages

Framework-specific error messages:

**Before v5**:
```
Error: Missing key prop (correctness/useJsxKeyInIterable)
```

**After v6**:
```
Error: Missing key prop in React list rendering
  → Each child in a list should have a unique "key" prop
  → Framework: React
  → Preset: ultracite/react
```

## Framework Preset Details

### React Preset Rules

```jsonc
// Included in ultracite/react
{
  "jsx-a11y": {
    "useKeyWithClickEvents": "error",
    "noAccessKey": "error",
    "useAltText": "error",
    "useAnchorContent": "error"
  },
  "react": {
    "useJsxKeyInIterable": "error",
    "useValidAriaProps": "error",
    "useButtonType": "error",
    "noChildrenProp": "error",
    "noDangerouslySetInnerHtml": "warn"
  }
}
```

### Next.js Preset Rules

```jsonc
// Included in ultracite/next (extends ultracite/react)
{
  "next": {
    "useImageImport": "error",      // Use next/image
    "useLinkImport": "error",       // Use next/link
    "noHtmlLinkForPages": "error",  // Avoid <a> for internal links
    "noImgElement": "warn"          // Prefer <Image>
  }
}
```

## Compatibility

### v5 Configurations Still Work

Your existing v5 `biome.jsonc` will continue to work without changes:

```jsonc
// v5 configuration (still valid in v6)
{
  "extends": ["ultracite/core"],
  "linter": {
    "rules": {
      // ... custom rules
    }
  }
}
```

### When to Upgrade to Framework Presets

**Upgrade if**:
- You want framework-specific optimizations
- You're manually maintaining framework rules
- You want better error messages
- You're starting a new project

**Keep v5 config if**:
- You have heavily customized rules
- Migration effort outweighs benefits
- You prefer manual control

## Troubleshooting

### "Preset not found" Error

**Problem**: `ultracite/react` not found

**Solution**: Update Ultracite to v6:

```bash
bun update ultracite
# Verify version
npx ultracite --version  # Should be >= 6.0.0
```

### Conflicting Rules After Adding Preset

**Problem**: Custom rules conflict with preset rules

**Solution**: Preset rules have lower priority. Your custom rules override:

```jsonc
{
  "extends": ["ultracite/core", "ultracite/react"],
  "linter": {
    "rules": {
      "react": {
        "useJsxKeyInIterable": "off"  // Overrides preset
      }
    }
  }
}
```

### Which Preset for My Framework?

**Detection**:
```bash
# Let Ultracite detect framework
bun x ultracite init

# Manual detection
grep -E "(react|vue|svelte)" package.json
```

## Next Steps

After migrating to v6:

1. **Test thoroughly**: Run linting on entire codebase
2. **Review new errors**: Framework presets may surface new issues
3. **Customize as needed**: Override preset rules if necessary
4. **Update team docs**: Document which preset is being used
5. **Consider v7**: Plan for v7 migration (multi-provider support)

## Resources

- v6 Announcement: https://www.ultracite.ai/blog/v6-release
- Framework Presets Guide: https://www.ultracite.ai/guides/framework-presets
- Migration FAQ: https://www.ultracite.ai/faq#v6-migration
- GitHub Changelog: https://github.com/ultracite/ultracite/releases/tag/v6.0.0

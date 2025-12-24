# Ultracite Configuration Guide

Complete guide for configuring Ultracite with framework presets, customization, and file exclusion patterns.

**Last Updated**: 2025-11-22

---

## Configuration File Structure

Ultracite uses Biome's configuration format (`biome.json` or `biome.jsonc`):

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],

  // Optional: Add framework-specific preset
  // "extends": ["ultracite/core", "ultracite/react"],

  // Optional: Customize rules
  "linter": {
    "rules": {
      "a11y": {
        "noAutofocus": "off"  // Disable specific rule
      }
    }
  },

  // Optional: Exclude files/directories
  "files": {
    "ignore": [
      "dist",
      "build",
      "coverage",
      "**/*.generated.ts"
    ]
  }
}
```

---

## Framework Presets

### React Preset (`ultracite/react`)

**Extends**: `ultracite/core` + React-specific rules

**Includes**:
- React Hooks linting (exhaustive deps, rules of hooks)
- JSX accessibility (a11y) checks
- React-specific naming conventions
- Component best practices

**Configuration**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"]
}
```

**Key Rules**:
- `useExhaustiveDependencies`: Ensures all dependencies are listed in hooks
- `noArrayIndexKey`: Prevents using array indices as React keys
- `useButtonType`: Requires explicit button types
- `noChildrenProp`: Prevents passing children as props
- `useJsxKeyInIterable`: Requires keys in JSX lists

**Best For**:
- Create React App projects
- Vite React projects
- Custom React setups

---

### Next.js Preset (`ultracite/nextjs`)

**Extends**: `ultracite/react` + Next.js-specific rules

**Includes**:
- Everything from `ultracite/react`
- Next.js-specific imports (e.g., `next/link`, `next/image`)
- App Router conventions
- Server Component rules
- Performance optimizations

**Configuration**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/nextjs"]
}
```

**Key Rules**:
- `noHtmlLinkForPages`: Enforces using Next.js `<Link>`
- `noImgElement`: Enforces using Next.js `<Image>`
- `noTitleInDocumentHead`: Prevents `<title>` in custom Document
- Server/Client Component separation checks

**Best For**:
- Next.js 14+ projects (App Router)
- Next.js Pages Router projects
- Vercel deployments

---

### Vue Preset (`ultracite/vue`)

**Extends**: `ultracite/core` + Vue-specific rules

**Includes**:
- Vue 3 Composition API linting
- Template syntax validation
- Reactivity system checks
- Component naming conventions

**Configuration**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/vue"]
}
```

**Key Rules**:
- `useValidVModelName`: Ensures correct v-model naming
- `noMutatingProps`: Prevents prop mutations
- `requireEmitsOption`: Requires explicit emits declaration
- `noReactiveReassign`: Prevents reassigning reactive variables

**Best For**:
- Nuxt 3 projects
- Vue 3 + Vite projects
- Quasar Framework

---

### Svelte Preset (`ultracite/svelte`)

**Extends**: `ultracite/core` + Svelte-specific rules

**Includes**:
- Svelte 4/5 syntax validation
- Reactive declarations linting
- Component lifecycle checks
- Store best practices

**Configuration**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/svelte"]
}
```

**Key Rules**:
- `noInnerDeclarations`: Prevents function declarations in blocks
- `validEach`: Ensures each blocks have valid syntax
- `noUnusedStores`: Detects unused store subscriptions
- `preferReadableExports`: Enforces readable exports over defaults

**Best For**:
- SvelteKit projects
- Svelte 5 (runes support)
- Svelte component libraries

---

## Core Preset Features

The `ultracite/core` preset includes **200+ rules** across these categories:

### 1. Correctness (85 rules)
Catches actual bugs and logic errors:
- `noUnreachable`: Detects unreachable code
- `noUnsafeFinally`: Prevents unsafe control flow in finally blocks
- `noConstantCondition`: Catches always-true/false conditions
- `useValidForDirection`: Ensures correct for-loop direction
- `noUnusedVariables`: Removes unused variables

### 2. Suspicious (48 rules)
Flags code that might indicate bugs:
- `noDoubleEquals`: Enforces `===` over `==`
- `noAsyncPromiseExecutor`: Prevents async Promise executors
- `noConsoleLog`: Flags console.log statements
- `noDebugger`: Removes debugger statements
- `noShadowRestrictedNames`: Prevents shadowing global variables

### 3. Style (35 rules)
Enforces consistent code style:
- `useConst`: Prefers `const` over `let` when possible
- `useTemplate`: Prefers template literals over string concatenation
- `useSingleVarDeclarator`: One variable per declaration
- `noNegationElse`: Simplifies negated conditions
- `noUnusedTemplateLiteral`: Removes unnecessary template literals

### 4. Complexity (12 rules)
Reduces cognitive complexity:
- `noExcessiveCognitiveComplexity`: Limits function complexity
- `noForEach`: Prefers for-of loops over forEach
- `useFlatMap`: Suggests flatMap over map().flat()
- `noUselessFragments`: Removes unnecessary React fragments

### 5. Performance (8 rules)
Optimizes runtime performance:
- `noAccumulatingSpread`: Prevents O(n²) spread operations
- `noDelete`: Avoids delete operator (breaks V8 optimizations)
- `useArrayLiterals`: Prefers `[]` over `new Array()`

### 6. Security (6 rules)
Prevents security vulnerabilities:
- `noDangerouslySetInnerHtml`: Flags XSS risks
- `noGlobalEval`: Prevents eval() usage
- `noGlobalObjectCalls`: Prevents calling global objects as functions

### 7. Accessibility (6 rules)
Ensures inclusive UIs:
- `useAltText`: Requires alt text on images
- `useAnchorContent`: Ensures links have accessible content
- `useButtonType`: Requires explicit button types
- `useKeyWithClickEvents`: Ensures keyboard accessibility

---

## Advanced Customization

### Disabling Rules

**Single rule**:
```jsonc
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"
      }
    }
  }
}
```

**Entire category**:
```jsonc
{
  "linter": {
    "rules": {
      "suspicious": {
        "all": false  // Disable all suspicious rules
      }
    }
  }
}
```

**Re-enable specific rule in disabled category**:
```jsonc
{
  "linter": {
    "rules": {
      "suspicious": {
        "all": false,
        "noConsoleLog": "error"  // Re-enable this one
      }
    }
  }
}
```

---

### Rule Severity Levels

```jsonc
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "warn",      // Warning (doesn't fail CI)
        "noDebugger": "error",       // Error (fails CI)
        "noDoubleEquals": "off"      // Disabled
      }
    }
  }
}
```

---

### Per-File Configuration

**Disable rules for specific files**:
```jsonc
{
  "overrides": [
    {
      "include": ["**/*.test.ts", "**/*.test.tsx"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsoleLog": "off"
          }
        }
      }
    }
  ]
}
```

**Different rules for different directories**:
```jsonc
{
  "overrides": [
    {
      "include": ["src/legacy/**"],
      "linter": {
        "rules": {
          "complexity": {
            "all": false  // Legacy code exempted from complexity rules
          }
        }
      }
    }
  ]
}
```

---

## File Exclusion Patterns

### Common Exclusions

```jsonc
{
  "files": {
    "ignore": [
      // Build outputs
      "dist",
      "build",
      ".next",
      "out",

      // Dependencies
      "node_modules",
      ".pnpm-store",

      // Test coverage
      "coverage",
      ".nyc_output",

      // Generated files
      "**/*.generated.ts",
      "**/*.d.ts",

      // Cache directories
      ".cache",
      ".turbo",

      // Framework-specific
      ".nuxt",
      ".svelte-kit",
      "vite.config.ts.timestamp-*"
    ]
  }
}
```

---

### Glob Patterns

**Wildcards**:
- `*`: Matches any file/directory (non-recursive)
- `**`: Matches any file/directory (recursive)
- `?`: Matches single character

**Examples**:
```jsonc
{
  "files": {
    "ignore": [
      "*.config.js",           // All .config.js files in root
      "**/*.config.js",        // All .config.js files anywhere
      "src/generated/**",      // Everything in src/generated/
      "**/__tests__/**",       // All __tests__ directories
      "*.{spec,test}.ts"       // All .spec.ts and .test.ts files
    ]
  }
}
```

---

### Including Files

By default, Ultracite lints all supported files. Use `include` to limit scope:

```jsonc
{
  "files": {
    "include": [
      "src/**/*.ts",
      "src/**/*.tsx"
    ]
  }
}
```

---

## Formatter Configuration

### Format Options

```jsonc
{
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 80
  }
}
```

---

### Per-Language Formatting

```jsonc
{
  "formatter": {
    "enabled": true
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "es5"
    }
  },
  "json": {
    "formatter": {
      "indentWidth": 2
    }
  }
}
```

---

## Environment-Specific Configuration

### Development

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off",  // Allow console.log in dev
        "noDebugger": "off"     // Allow debugger in dev
      }
    }
  }
}
```

---

### Production/CI

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "error",  // Fail on console.log
        "noDebugger": "error"     // Fail on debugger
      }
    }
  }
}
```

**Tip**: Use different config files per environment:
```bash
# Development
ultracite check --config-path=biome.dev.json

# CI
ultracite check --config-path=biome.ci.json
```

---

**See also:**
- `git-hooks-setup.md` for pre-commit integration
- `monorepo-configuration.md` for multi-package setups
- `troubleshooting.md` for configuration issues

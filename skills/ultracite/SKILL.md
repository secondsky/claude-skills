---
name: ultracite
description: >
  Use when setting up, configuring, or migrating to Ultracite, a fast Rust-based linting and formatting tool built on Biome. This skill provides comprehensive guidance for project setup, framework-specific configurations (React, Next.js, Vue, Svelte), Git hook integrations (Husky, Lefthook, lint-staged), AI editor rules, monorepo support, and migrations from ESLint, Prettier, or Biome. Includes project suitability assessment, troubleshooting, known limitations, and best practices for JavaScript/TypeScript projects.
license: MIT
metadata:
  version: 1.0.0
  dependencies:
    ultracite: latest
    "@biomejs/biome": ">=1.0.0"
  runtime: Node.js v14.18+ (v18+ recommended)
  package_managers:
    - bun (preferred)
    - npm
    - pnpm
    - yarn
  frameworks_supported:
    - React
    - Next.js
    - Vue
    - Svelte
    - Solid
    - Angular
    - Remix
    - Qwik
    - Astro
  git_hook_managers:
    - husky
    - lefthook
    - lint-staged
  editors_supported:
    - VS Code (Biome extension)
    - Cursor
    - Claude Code
    - Zed
    - Cline
    - Windsurf
  keywords:
    - ultracite
    - biome
    - linting
    - formatting
    - code quality
    - eslint replacement
    - prettier replacement
    - typescript strict mode
    - rust linter
    - fast formatter
    - auto-fix
    - git hooks
    - pre-commit
    - husky
    - lefthook
    - lint-staged
    - react linting
    - nextjs linting
    - vue linting
    - svelte linting
    - monorepo linting
    - turborepo
    - AI coding rules
    - cursor rules
    - claude code rules
    - copilot instructions
    - accessibility linting
    - security linting
    - performance linting
    - jsx linting
    - hooks linting
    - migration from eslint
    - migration from prettier
    - biome.jsonc
    - zero config
    - code formatting
    - import sorting
    - unused imports
    - strict equality
    - type safety
---

# Ultracite Skill

**Fast, zero-config linting and formatting for modern JavaScript/TypeScript projects**

## Overview

Ultracite is a preset configuration built on Biome, a Rust-based linting and formatting toolchain. It provides a zero-configuration solution that replaces both ESLint and Prettier with a single, blazing-fast tool. Ultracite operates invisibly in the background, automatically formatting code and applying fixes on every save.

### Core Goals

1. **Lightning-Fast Performance**: Leverages Biome's Rust implementation for instant linting/formatting
2. **Zero-Config Design**: Ships with 200+ sensible defaults optimized for modern TypeScript development
3. **Simplicity & Invisibility**: Operates with minimal user interaction
4. **Type Safety**: Enforces TypeScript strict mode and comprehensive null/undefined handling
5. **Tool Compatibility**: Works alongside other development tools without conflicts

### Key Benefits vs Alternatives

**vs ESLint + Prettier:**
- 10-100x faster performance (Rust vs JavaScript)
- Single tool instead of two
- Zero configuration needed
- Auto-fixes on save by default
- Built-in TypeScript strict mode

**vs Biome alone:**
- 200+ preconfigured rules
- Framework-specific presets (React, Next.js, Vue, Svelte)
- AI editor integration (Cursor, Claude Code, Copilot)
- Git hook integrations
- Migration tooling

## When to Use This Skill

### ✅ Ideal Projects

Use Ultracite when:
- Starting a new JavaScript/TypeScript project
- Building with React, Next.js, Vue, Svelte, or other modern frameworks
- Working in monorepos (Turborepo, Nx, Lerna)
- Teams want consistent formatting without bikeshedding
- Performance is critical (large codebases, CI/CD optimization)
- Migrating from ESLint + Prettier to a faster solution
- Using AI coding assistants (Cursor, Claude Code, Windsurf)
- TypeScript projects requiring strict type safety
- Projects with accessibility requirements (ARIA, semantic HTML)

### ⚠️ Consider Alternatives When

**Limited framework support:**
- Need Angular/Ember-specific rules (Biome support is basic)
- Require advanced CSS linting (Stylelint still recommended)

**Specialized requirements:**
- Need specific ESLint plugins not replicated in Biome
- Require property ordering in CSS (Stylelint feature)
- Team has extensive custom ESLint configurations

**Legacy projects:**
- Large codebases with custom ESLint rules (migration effort required)
- Projects with extensive Prettier customization

### Project Suitability Assessment

When this skill is invoked, scan the project and assess:

1. **Check existing tooling:**
   ```bash
   # Check for ESLint
   ls -la .eslintrc* eslint.config.* package.json | grep eslint

   # Check for Prettier
   ls -la .prettierrc* prettier.config.* package.json | grep prettier

   # Check for Biome
   ls -la biome.json* package.json | grep biome
   ```

2. **Identify framework:**
   - Check `package.json` for `react`, `next`, `vue`, `svelte`, etc.
   - Recommend appropriate preset

3. **Assess project size:**
   - Large projects (1000+ files) benefit most from Rust performance
   - Small projects may not notice speed difference

4. **Check TypeScript config:**
   - If `tsconfig.json` exists, note that Ultracite requires `strictNullChecks: true`
   - Warn if disabled (will generate many warnings)

5. **Recommend or warn:**
   ```
   ✅ RECOMMENDED: This TypeScript + React project is ideal for Ultracite
   - 500+ files will benefit from Rust performance
   - React preset available
   - Can replace existing ESLint + Prettier setup

   ⚠️ CONSIDER: This project uses advanced ESLint plugins
   - Custom rule: eslint-plugin-custom-security
   - May need to retain ESLint for these specific rules
   - Could use Ultracite for formatting only
   ```

## Installation & Setup

### Prerequisites

- Node.js v14.18+ (v18+ recommended)
- Package manager: Bun (preferred), npm, pnpm, or yarn
- `package.json` file in project root

### Quick Start (Interactive)

```bash
# Using Bun (preferred for speed)
bun x ultracite init

# Using npm
npx ultracite init

# Using pnpm
pnpm dlx ultracite init

# Using yarn
yarn dlx ultracite init
```

The interactive setup will:
1. Install Ultracite and Biome as dependencies
2. Prompt for framework selection (React, Next.js, Vue, etc.)
3. Ask about editor setup (VS Code, Cursor, etc.)
4. Offer AI agent rules installation (Cursor, Claude Code, Copilot)
5. Prompt for Git hook integration (Husky, Lefthook, lint-staged)
6. Offer to migrate from existing tools (ESLint, Prettier)
7. Create/merge `biome.jsonc` configuration
8. Update `.vscode/settings.json` for editor integration
9. Enable `strictNullChecks` in `tsconfig.json`

### Non-Interactive Setup (CI/Automation)

```bash
# Auto-detect settings, skip prompts
npx ultracite init --quiet

# Specify options explicitly
npx ultracite init \
  --pm bun \
  --frameworks react,next \
  --editors vscode \
  --agents cursor,claude \
  --integrations husky \
  --migrate eslint,prettier \
  --quiet
```

**Available flags:**
- `--pm`: Package manager (bun, npm, pnpm, yarn)
- `--frameworks`: react, next, solid, vue, qwik, angular, remix, svelte
- `--editors`: vscode, zed
- `--agents`: cursor, claude, cline, copilot, windsurf, etc.
- `--integrations`: husky, lefthook, lint-staged
- `--migrate`: eslint, prettier, biome
- `--quiet`: Skip all prompts (auto-enabled when `CI=true`)

### Manual Setup (Advanced)

```bash
# 1. Install dependencies
bun add -D ultracite @biomejs/biome

# 2. Create biome.jsonc
cat > biome.jsonc << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "extends": ["ultracite/core"]
}
EOF

# 3. Create VS Code settings
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
EOF

# 4. Enable TypeScript strict mode
# Add to tsconfig.json:
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}
```

### Verify Installation

```bash
# Check installation
npx ultracite doctor

# Expected output:
# ✔ Biome is installed
# ✔ Configuration file found: biome.jsonc
# ✔ Editor integration configured
# ✔ TypeScript strict mode enabled
```

## Configuration

### File Structure

```
project-root/
├── biome.jsonc              # Main configuration
├── .vscode/
│   └── settings.json        # VS Code integration
├── tsconfig.json            # TypeScript config (strictNullChecks required)
├── package.json
└── [optional] git hooks config
```

### Basic Configuration (biome.jsonc)

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
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
  },

  // Optional: Customize formatting
  "formatter": {
    "indentWidth": 2,
    "lineWidth": 80
  }
}
```

### Framework-Specific Presets

#### React

```jsonc
{
  "extends": ["ultracite/core", "ultracite/react"]
}
```

**Includes:**
- JSX syntax and pattern rules
- React Hooks rules (exhaustive deps, rules of hooks)
- Component best practices
- Prevents: children as props, nested components, array index keys
- Enforces: function components over classes

**Rules:** 20+ React-specific linting rules

#### Next.js

```jsonc
{
  "extends": ["ultracite/core", "ultracite/next"]
}
```

**Note:** Next preset includes React rules automatically (no need for both)

**Includes:**
- Image optimization (requires `next/image`, not `<img>`)
- Document structure (prevents `<head>` in pages)
- App Router patterns (async server components)
- Prevents: importing `next/document` in pages, `next/head` in `_document`

**Special overrides:**
- `next.config.*` files: allows specific patterns
- App Router pages/layouts: allows async components

#### Vue

```jsonc
{
  "extends": ["ultracite/core", "ultracite/vue"]
}
```

**Includes:**
- Full HTML support with script/style indentation
- Multi-word component naming enforcement
- Data option declaration rules
- Reserved props/keys prevention
- Prevents React-specific props (`className`, `htmlFor`)

**`.vue` file overrides:**
- Allows unused variables/imports (may only appear in templates)
- Relaxes `useConst` (for reactive declarations)

#### Svelte

```jsonc
{
  "extends": ["ultracite/core", "ultracite/svelte"]
}
```

**Note:** Minimal preset as Biome doesn't have extensive Svelte rules yet

**Includes:**
- Full HTML support with script/style indentation
- Prevents React-specific attributes
- Component structure handling

**`.svelte` file overrides:**
- Allows unused variables/imports (template-only usage)
- Relaxes `useConst` for reactive declarations

### Core Preset Features (ultracite/core)

**Formatting defaults:**
- Indentation: 2 spaces
- Line width: 80 characters
- Line ending: LF (Unix-style)
- Semicolons: Always required
- Quotes: Single (JS/TS), double (JSON)
- Trailing commas: ES5 style
- Arrow parentheses: Always

**200+ linting rules across categories:**

1. **Accessibility (a11y):**
   - ARIA validation
   - Semantic HTML enforcement
   - Keyboard navigation requirements
   - Alt text for images
   - Valid autocomplete values

2. **Complexity:**
   - Cognitive complexity limits
   - Discourages `arguments`, comma operators

3. **Correctness:**
   - Type safety enforcement
   - Prevents const reassignment
   - Catches unreachable code
   - Removes unused variables/imports
   - Enforces exhaustive dependencies

4. **Performance:**
   - Optimizes code patterns
   - Discourages barrel files
   - Prevents inefficient namespace imports

5. **Security:**
   - Prevents `eval()` usage
   - Blocks `dangerouslySetInnerHTML` (unless explicitly allowed)
   - Requires `rel="noopener noreferrer"` for `target="_blank"`

6. **Style:**
   - Enforces consistent patterns
   - Prefers `const` declarations
   - TypeScript strictness
   - Import organization

7. **Suspicious:**
   - Catches bitwise operators (often typos)
   - Prevents loose equality (`==`)
   - Flags `debugger` statements

**TypeScript features:**
- Strict type checking enabled
- Discourages `any` types
- Requires null/undefined handling
- Enforces explicit typing

### Customizing Rules

#### Method 1: biome.jsonc Configuration

```jsonc
{
  "linter": {
    "rules": {
      "a11y": {
        "noAutofocus": "off"  // Disable rule
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"  // Change to warning
      }
    }
  }
}
```

#### Method 2: Inline Comments

```tsx
// Disable rule for single line
// biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized HTML from trusted source
<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

// Disable rule for entire file (use sparingly)
/* biome-ignore-file lint/suspicious/noArrayIndexKey */
```

### Excluding Files/Directories

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

      // Generated files
      "**/*.generated.ts",
      "**/__generated__/**",

      // Third-party components (if needed)
      "components/ui/**",

      // Coverage
      "coverage",

      // OS files
      ".DS_Store"
    ]
  }
}
```

## Usage

### IDE Integration (Recommended)

**VS Code Setup:**

1. Install Biome extension: `biomejs.biome`
2. Verify `.vscode/settings.json`:
   ```json
   {
     "editor.defaultFormatter": "biomejs.biome",
     "editor.formatOnSave": true,
     "editor.formatOnPaste": true,
     "editor.codeActionsOnSave": {
       "quickfix.biome": "explicit",
       "source.organizeImports.biome": "explicit"
     }
   }
   ```

3. Disable conflicting extensions (ESLint, Prettier)

**Features:**
- **Auto-format on save**: Every save triggers formatting
- **Auto-fix on save**: Removes unused imports, fixes import order, applies strict equality
- **Format on paste**: Pasted code formatted immediately
- **Problems panel**: Shows unfixable issues requiring manual attention
- **Quick fixes**: Lightbulb indicators for suggested fixes

### CLI Usage

#### Check Code (Lint Only)

```bash
# Check all files
npx ultracite check

# Check specific directory
npx ultracite check src/

# Filter by severity
npx ultracite check --diagnostic-level error  # Only errors
npx ultracite check --diagnostic-level warn   # Warnings and errors
```

#### Fix Code (Auto-fix)

```bash
# Fix all files
npx ultracite fix

# Fix specific directory
npx ultracite fix src/

# Apply unsafe fixes (use with caution)
npx ultracite fix --unsafe
```

**Safe vs Unsafe fixes:**
- **Safe**: Formatting, import sorting, unused import removal, strict equality
- **Unsafe**: Complex refactoring, logic changes (requires review)

#### Validate Setup

```bash
# Check configuration and installation
npx ultracite doctor

# Output example:
# ✔ Biome version: 1.9.4
# ✔ Configuration: biome.jsonc
# ✔ Extends: ultracite/core, ultracite/react
# ✔ Editor: VS Code configured
# ⚠ Warning: strictNullChecks not enabled in tsconfig.json
```

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:fix": "ultracite fix",
    "format": "ultracite fix",
    "format:check": "ultracite check",
    "prepare": "husky install"  // If using Husky
  }
}
```

## Git Hook Integrations

**IMPORTANT:** Before installing a Git hook manager, always check if one is already configured.

### Detecting Existing Git Hook Managers

```bash
# Check package.json for existing tools
grep -E "husky|lefthook|lint-staged|pre-commit" package.json

# Check for configuration files
ls -la .husky/ lefthook.yml .lintstagedrc* .git/hooks/

# Check if hooks are already configured
cat .git/hooks/pre-commit 2>/dev/null || echo "No pre-commit hook"
```

**If a Git hook manager is already installed:**
1. **Ask the user** which one to use or keep existing
2. **Do not install multiple** (causes conflicts)
3. **Update existing config** to include Ultracite

### Husky Integration

**What it does:** Runs `npx ultracite fix` before every commit

**Setup (if Husky not installed):**

```bash
# Automatic during init
npx ultracite init --integrations husky

# Manual setup
bun add -D husky
npx husky install
npx husky add .husky/pre-commit "npx ultracite fix"
chmod +x .husky/pre-commit
```

**Update existing Husky:**

```bash
# Edit .husky/pre-commit (preserve existing commands)
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Add before existing commands
npx ultracite fix

# ... existing commands ...
```

**File structure:**
```
.husky/
├── _/husky.sh
└── pre-commit    # Contains: npx ultracite fix
```

**Bypass hook (emergency only):**
```bash
git commit --no-verify
```

### Lefthook Integration

**What it does:** Fast native Git hooks manager (written in Go)

**Setup (if Lefthook not installed):**

```bash
# Automatic during init
npx ultracite init --integrations lefthook

# Manual setup
bun add -D lefthook
npx lefthook install
```

**Configuration (lefthook.yml):**

```yaml
pre-commit:
  jobs:
    - run: npx ultracite fix
      glob:
        - "*.js"
        - "*.jsx"
        - "*.ts"
        - "*.tsx"
        - "*.json"
        - "*.jsonc"
        - "*.css"
      stage_fixed: true  # Auto-stage fixed files
```

**Update existing Lefthook:**

```yaml
# Add to existing lefthook.yml
pre-commit:
  jobs:
    # Add this job
    - run: npx ultracite fix
      glob:
        - "*.{js,jsx,ts,tsx,json,jsonc,css}"
      stage_fixed: true

    # ... existing jobs ...
```

**Benefits over Husky:**
- Faster execution (native Go binary)
- More granular file pattern matching
- Cross-platform consistency
- Easier parallel job execution

### Lint-staged Integration

**What it does:** Runs commands only on staged Git files (faster than checking entire codebase)

**Setup (if lint-staged not installed):**

```bash
# Automatic during init
npx ultracite init --integrations lint-staged

# Manual setup
bun add -D lint-staged
```

**Configuration (.lintstagedrc.json):**

```json
{
  "*.{js,jsx,ts,tsx,json,jsonc,css,md,mdx}": [
    "npx ultracite fix"
  ]
}
```

**Alternative formats:**

```jsonc
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,jsonc,css}": ["npx ultracite fix"]
  }
}
```

```js
// .lintstagedrc.js (CommonJS)
module.exports = {
  '*.{js,jsx,ts,tsx,json,jsonc,css}': ['npx ultracite fix'],
};
```

```js
// .lintstagedrc.mjs (ESM)
export default {
  '*.{js,jsx,ts,tsx,json,jsonc,css}': ['npx ultracite fix'],
};
```

**Combine with Husky or Lefthook:**

```bash
# .husky/pre-commit
npx lint-staged
```

```yaml
# lefthook.yml
pre-commit:
  commands:
    lint:
      run: npx lint-staged
```

**Benefits:**
- Only processes staged files (faster)
- Prevents accidentally committing unstaged changes
- Smart configuration merging

### Choosing a Git Hook Manager

**Recommendations:**

| Use Case | Tool | Reason |
|----------|------|--------|
| Simple projects | **Husky** | Most popular, easy setup |
| Performance-critical | **Lefthook** | Native Go, faster |
| Large monorepos | **Lefthook + lint-staged** | Fast, only checks changed files |
| Existing setup | **Keep existing** | Avoid conflicts |

**Ask user if multiple options:**
```
I detected you don't have a Git hook manager installed.
Ultracite can integrate with:

1. Husky (most popular, simple)
2. Lefthook (fastest, native Go)
3. lint-staged (only checks staged files)
4. None (skip Git hooks)

Which would you like to use? [1-4]
```

## AI Editor Rules

Ultracite provides editor-specific rule files to guide AI coding assistants.

### What Are AI Editor Rules?

These rules work **alongside Biome's linting** to guide AI tools (Cursor, Claude Code, GitHub Copilot) to generate code that follows best practices.

**Key benefits:**
- Consistency across AI-generated code
- Quality: Best practices enforcement
- Accessibility: Built-in inclusive coding
- Performance: Efficient patterns
- Security: Vulnerability prevention

### Supported Editors & File Locations

| Editor | File Location | Flag |
|--------|---------------|------|
| **Cursor** | `.cursor/rules/ultracite.mdc` | `--agents cursor` |
| **Claude Code** | `.claude/CLAUDE.md` | `--agents claude` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `--agents copilot` |
| **Cline** | `.clinerules` | `--agents cline` |
| **Zed** | `.rules` | `--agents zed` |
| **Windsurf** | Framework-specific | `--agents windsurf` |
| **Aider** | `ultracite.md` | `--agents aider` |

### Setup

```bash
# Automatic during init (select editors when prompted)
npx ultracite init

# Specify editors explicitly
npx ultracite init --agents cursor,claude,copilot

# Multiple agents
npx ultracite init --agents cursor,claude,cline,windsurf
```

**What gets created:**
- Editor-specific rule files in appropriate locations
- Framework-aware rules (if React/Next/Vue preset selected)
- Accessibility guidelines
- TypeScript best practices
- Security guidelines

### Customization

Rules can be customized after creation:

```bash
# Edit Cursor rules
code .cursor/rules/ultracite.mdc

# Edit Claude Code rules
code .claude/CLAUDE.md

# Add project-specific rules
cat >> .cursor/rules/ultracite.mdc << 'EOF'

## Project-Specific Rules

- Always use our custom `useAuth()` hook instead of direct auth library calls
- API calls must use our wrapper: `import { api } from '@/lib/api'`
- Color palette: Use design tokens from `@/styles/tokens.ts`
EOF
```

## Editor Hooks (Auto-format After AI Edits)

**Note:** This is different from AI editor rules. Hooks automatically format files **after** AI assistants make edits.

### What Are Editor Hooks?

Hooks execute `npx ultracite fix` automatically after an AI agent modifies a file.

**Supported editors:**
- Cursor (`.cursor/hooks.json`)
- Claude Code (`.claude/settings.json`)

### Setup

```bash
# Automatic during init
npx ultracite init --hooks cursor,claude

# Verify configuration
cat .cursor/hooks.json  # Cursor
cat .claude/settings.json  # Claude Code
```

**Cursor configuration (.cursor/hooks.json):**
```json
{
  "hooks": {
    "postFileEdit": ["npx ultracite fix ${file}"]
  }
}
```

**Claude Code configuration (.claude/settings.json):**
```json
{
  "hooks": {
    "postToolUse": {
      "Edit": ["npx ultracite fix ${file}"],
      "Write": ["npx ultracite fix ${file}"]
    }
  }
}
```

**Benefits:**
- AI-generated code automatically formatted
- Consistent style without manual intervention
- Catches issues immediately after AI edits

**Important:** Hooks preserve existing configurations and avoid duplicates.

## Monorepo Support

Ultracite works seamlessly with monorepos out of the box.

### Configuration Strategy

**Single root configuration:**

```
my-turborepo/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   └── utils/
├── biome.jsonc       # Single config for entire repo
├── package.json      # Root scripts
└── turbo.json        # Optional Turborepo tasks
```

### Root package.json Scripts

```json
{
  "scripts": {
    "check": "ultracite check",
    "fix": "ultracite fix",
    "format": "ultracite fix"
  }
}
```

### Turborepo Integration (Optional)

**Add to turbo.json:**

```json
{
  "tasks": {
    "//#check": {
      "cache": false
    },
    "//#fix": {
      "cache": false
    }
  }
}
```

**Run via Turborepo:**

```bash
turbo run check
turbo run fix
```

### Performance Benefits

**Why root-level config works:**
- Biome is so fast (Rust) that checking entire repo is instant
- No need for per-package configs
- Simpler maintenance
- Consistent rules across all packages

### Package-Specific Overrides (Rare)

If specific packages need different rules:

```jsonc
// biome.jsonc (root)
{
  "extends": ["ultracite/core", "ultracite/react"],

  "overrides": [
    {
      "include": ["packages/legacy/**"],
      "linter": {
        "rules": {
          "style": {
            "useConst": "warn"  // Relax for legacy code
          }
        }
      }
    }
  ]
}
```

## Migration Guides

### From ESLint

**Benefits:**
- 10-100x faster performance
- Zero configuration (vs hundreds of plugin decisions)
- Unified formatting + linting
- Built-in TypeScript strict mode

**Migration process:**

```bash
# Automatic migration
npx ultracite init --migrate eslint

# What it does:
# 1. Installs Ultracite
# 2. Creates/merges biome.jsonc
# 3. Updates .vscode/settings.json
# 4. Enables strictNullChecks in tsconfig.json
# 5. Removes ESLint packages
# 6. Deletes ESLint config files
```

**Manual migration:**

```bash
# 1. Install Ultracite
bun add -D ultracite @biomejs/biome

# 2. Create biome.jsonc
cat > biome.jsonc << 'EOF'
{
  "extends": ["ultracite/core"]
}
EOF

# 3. Remove ESLint
bun remove eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
bun remove eslint-config-next eslint-config-prettier  # etc.

# 4. Delete config files
rm -f .eslintrc* eslint.config.*

# 5. Update .vscode/settings.json (see IDE Integration section)

# 6. Enable TypeScript strict mode
# Add to tsconfig.json: "strictNullChecks": true
```

**Post-migration:**
- Review `biome.jsonc` for unnecessary overrides
- Restart editor
- Run `npx ultracite check` to see initial issues
- Run `npx ultracite fix` to auto-fix

**Known differences:**
- Some ESLint plugin rules not available in Biome
- Custom ESLint rules must be ported or removed
- Different error messages (Biome's are often clearer)

### From Prettier

**Benefits:**
- Faster formatting (Rust vs JavaScript)
- Combined linting + formatting
- Auto-fix on save by default

**Migration process:**

```bash
# Automatic migration
npx ultracite init --migrate prettier

# What it does:
# 1. Installs Ultracite
# 2. Creates/merges biome.jsonc
# 3. Updates .vscode/settings.json
# 4. Enables strictNullChecks in tsconfig.json
# 5. Removes Prettier packages
# 6. Deletes Prettier config files
```

**Manual migration:**

```bash
# 1. Install Ultracite
bun add -D ultracite @biomejs/biome

# 2. Create biome.jsonc
cat > biome.jsonc << 'EOF'
{
  "extends": ["ultracite/core"]
}
EOF

# 3. Remove Prettier
bun remove prettier eslint-config-prettier eslint-plugin-prettier

# 4. Delete config files
rm -f .prettierrc* prettier.config.*

# 5. Update .vscode/settings.json
# Remove: "editor.defaultFormatter": "esbenp.prettier-vscode"
# Add: "editor.defaultFormatter": "biomejs.biome"
```

**Formatting differences:**

Ultracite's defaults:
- Indentation: 2 spaces (Prettier default: 2)
- Line width: 80 (Prettier default: 80)
- Semicolons: Always (Prettier default: true)
- Quotes: Single (Prettier default: false/double)
- Trailing commas: ES5 (Prettier default: es5)

**To match Prettier's double quotes:**

```jsonc
// biome.jsonc
{
  "formatter": {
    "quoteStyle": "double"
  }
}
```

### From Biome

**Benefits:**
- 200+ preconfigured rules (vs manual setup)
- Framework-specific presets
- AI editor integration
- Git hook integrations

**Migration process:**

```bash
# Automatic migration
npx ultracite init --migrate biome

# What it does:
# 1. Installs Ultracite
# 2. Merges existing biome.jsonc with Ultracite preset
# 3. Preserves custom rules
# 4. Updates .vscode/settings.json
# 5. Enables strictNullChecks
```

**Manual migration:**

```bash
# 1. Install Ultracite
bun add -D ultracite

# 2. Update existing biome.jsonc
{
  "extends": ["ultracite/core"],  // Add this line

  // Your existing config remains
  "linter": {
    "rules": {
      // Custom rules preserved
    }
  }
}
```

**What changes:**
- Adds `extends: ["ultracite/core"]`
- Enables 200+ additional rules
- Enforces TypeScript strict mode
- May surface new warnings/errors (all auto-fixable or valid issues)

**Review after migration:**
- Check for duplicate rule configurations
- Remove rules now covered by preset
- Simplify configuration

## Troubleshooting

### VS Code Formatting Not Working

**Symptoms:**
- Files don't format on save
- Biome extension installed but inactive

**Solutions:**

1. **Check default formatter:**
   ```json
   // .vscode/settings.json
   {
     "editor.defaultFormatter": "biomejs.biome"
   }
   ```

2. **Disable conflicting formatters:**
   - Disable Prettier extension
   - Disable ESLint formatter
   - Check: Extensions → Biome → Enabled

3. **Restart editor:**
   - CMD+Shift+P → "Reload Window"

4. **Check Biome extension logs:**
   - Output panel → "Biome"

### ESLint/Prettier Still Active

**Symptoms:**
- Duplicate error messages
- Formatting conflicts
- Multiple formatters competing

**Solutions:**

1. **Remove old config files:**
   ```bash
   rm -f .eslintrc* eslint.config.* .prettierrc* prettier.config.*
   ```

2. **Remove from package.json:**
   ```bash
   bun remove eslint prettier eslint-config-prettier
   ```

3. **Update .vscode/settings.json:**
   ```json
   {
     // Remove these:
     // "eslint.enable": true,
     // "prettier.enable": true,

     // Add this:
     "editor.defaultFormatter": "biomejs.biome"
   }
   ```

4. **Disable extensions:**
   - Disable ESLint extension
   - Disable Prettier extension

### Parse Errors on Unwanted Files

**Symptoms:**
- Biome tries to parse `components/ui/*` (shadcn)
- Errors in generated files
- Linting third-party code

**Solution: Add to `files.ignore`:**

```jsonc
// biome.jsonc
{
  "files": {
    "ignore": [
      // Build outputs
      "dist",
      "build",
      ".next",

      // Generated/third-party
      "components/ui/**",
      "**/__generated__/**",
      "**/*.generated.ts",

      // Vendored dependencies
      "lib/vendor/**"
    ]
  }
}
```

**Note:** `node_modules` is automatically ignored.

### Duplicate Error Messages

**Symptoms:**
- Same error shown twice
- TypeScript server + Biome both report issues

**Explanation:**
- This is **expected behavior**
- TypeScript server checks types
- Biome checks style/patterns
- Both may report same issue from different angles

**Solutions:**

1. **Accept complementary feedback** (recommended)
2. **Disable TypeScript diagnostics** (not recommended):
   ```json
   // .vscode/settings.json
   {
     "typescript.validate.enable": false
   }
   ```

### Pre-commit/CI Failures

**Symptoms:**
- Commits fail with formatting errors
- CI pipeline fails on `npm run lint`

**Solutions:**

1. **Run locally before committing:**
   ```bash
   npx ultracite fix
   git add .
   git commit
   ```

2. **Check what fails:**
   ```bash
   npx ultracite check
   ```

3. **Auto-fix everything:**
   ```bash
   npx ultracite fix --unsafe
   ```

4. **Bypass hook (emergency only):**
   ```bash
   git commit --no-verify
   ```

### TypeScript Strictness Errors

**Symptoms:**
- Many errors about `possibly undefined`
- Errors: "Object is possibly 'null'"

**Cause:** Ultracite requires `strictNullChecks: true`

**Solution:**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,  // Enables all strict flags including:
    "strictNullChecks": true  // Or just this one
  }
}
```

**Fix existing code:**

```typescript
// Before (error: possibly undefined)
const user = users.find(u => u.id === id);
console.log(user.name);  // Error!

// After (safe)
const user = users.find(u => u.id === id);
if (user) {
  console.log(user.name);  // OK
}

// Or with optional chaining
console.log(user?.name);

// Or with nullish coalescing
const name = user?.name ?? 'Guest';
```

### Rules Too Strict

**Symptoms:**
- Too many warnings
- Rules don't fit team preferences

**Solution: Customize in biome.jsonc:**

```jsonc
{
  "linter": {
    "rules": {
      // Disable specific rules
      "complexity": {
        "noExcessiveCognitiveComplexity": "off"
      },

      // Change to warnings
      "style": {
        "useConst": "warn"
      },

      // Disable category (not recommended)
      "a11y": {
        "*": "off"  // Disables all accessibility rules
      }
    }
  }
}
```

**Per-file overrides:**

```jsonc
{
  "overrides": [
    {
      "include": ["test/**", "**/*.test.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"  // Allow `any` in tests
          }
        }
      }
    }
  ]
}
```

### Installation Issues (Corepack Errors)

**Symptoms:**
- Error during `pnpm dlx ultracite init`
- Corepack version mismatch

**Solutions:**

1. **Upgrade Node.js:**
   ```bash
   # Requires Node.js v18+
   nvm install 22
   nvm use 22
   ```

2. **Use npx instead:**
   ```bash
   npx ultracite init  # Instead of pnpm dlx
   ```

3. **Update corepack:**
   ```bash
   npm install -g corepack@latest
   corepack enable
   ```

## Known Limitations

### CSS Linting

**Limitation:** Biome's CSS linting is basic compared to Stylelint.

**Missing features:**
- Property ordering enforcement
- Specific CSS naming conventions
- Advanced selector linting
- SCSS/Less specific rules

**Workaround:** Use Stylelint alongside Ultracite for CSS-heavy projects.

```bash
# Install Stylelint
bun add -D stylelint stylelint-config-standard

# Configure both tools
# - Ultracite for JS/TS
# - Stylelint for CSS/SCSS
```

### Framework Support Gaps

**Limited support for:**
- Angular (basic only, no comprehensive rules)
- Ember
- Older frameworks (Backbone, Knockout)

**Full support for:**
- React ✅
- Next.js ✅
- Vue ✅
- Svelte ✅
- Solid ✅
- Remix ✅
- Astro ✅

### ESLint Plugin Ecosystem

**Limitation:** Some ESLint plugins have no Biome equivalent.

**Examples:**
- `eslint-plugin-security` (custom security rules)
- `eslint-plugin-import` (advanced import rules)
- Domain-specific plugins (GraphQL, testing library)

**Workaround:**
1. Use Ultracite for core linting + formatting
2. Keep ESLint for specific plugin needs
3. Configure to avoid conflicts:

```json
// .eslintrc.json (minimal ESLint for plugins only)
{
  "extends": [],  // No base configs
  "plugins": ["security"],
  "rules": {
    "security/detect-object-injection": "warn"
  }
}
```

```json
// .vscode/settings.json (Biome for formatting)
{
  "editor.defaultFormatter": "biomejs.biome",
  "eslint.format.enable": false  // ESLint for linting only
}
```

### File Type Support

**Supported:**
- JavaScript
- TypeScript
- JSX/TSX
- JSON/JSONC
- CSS
- GraphQL (basic)

**Not supported:**
- SCSS/Sass (formatting only, limited linting)
- Less
- Stylus
- HTML (except in framework files)
- Markdown (no linting)

### Performance Edge Cases

**When Biome might be slower:**
- Very large files (>10,000 lines)
- Complex regex patterns
- Deeply nested structures

**Note:** Still faster than ESLint in these cases, but the performance advantage is less pronounced.

## Templates & Scripts

### Initial Setup Script

See `scripts/install-ultracite.sh` for automated setup.

### Migration Script

See `scripts/migrate-to-ultracite.sh` for ESLint/Prettier migration.

### Example Configurations

See `references/` directory for:
- `biome.jsonc.react.example`
- `biome.jsonc.nextjs.example`
- `biome.jsonc.vue.example`
- `biome.jsonc.svelte.example`
- `biome.jsonc.monorepo.example`

## Package Versions

**Current versions (verified 2025-11-11):**
- `ultracite`: latest
- `@biomejs/biome`: >=1.9.0

**Check for updates:**
```bash
npm view ultracite version
npm view @biomejs/biome version
```

**Update:**
```bash
bun update ultracite @biomejs/biome
```

## Resources

**Official Documentation:**
- https://www.ultracite.ai/introduction
- https://www.ultracite.ai/setup
- https://www.ultracite.ai/configuration
- https://biomejs.dev/

**Examples:**
- https://www.ultracite.ai/examples

**Troubleshooting:**
- https://www.ultracite.ai/troubleshooting
- https://www.ultracite.ai/faq

**Community:**
- GitHub Issues: https://github.com/ultracite/ultracite
- Biome Discord: https://discord.gg/biome

## Summary

Ultracite provides a zero-config, blazing-fast alternative to ESLint + Prettier:

✅ **Use when:**
- Starting new projects
- Building with React/Next/Vue/Svelte
- Working in monorepos
- Want consistent formatting without configuration
- Performance matters
- Using AI coding assistants

⚠️ **Consider alternatives when:**
- Need specific ESLint plugins
- Advanced CSS linting required (use Stylelint)
- Legacy framework support needed

**Key advantages:**
- 10-100x faster than ESLint + Prettier
- Zero configuration (200+ rules preconfigured)
- Single tool for linting + formatting
- Framework-specific presets
- AI editor integration
- Git hook support
- TypeScript strict mode enforced

**Installation:**
```bash
bun x ultracite init  # Interactive setup
```

**Most common workflow:**
1. Install with `bun x ultracite init`
2. Select framework preset (React, Next.js, etc.)
3. Choose Git hook integration (Husky, Lefthook, lint-staged)
4. Enable AI editor rules (Cursor, Claude Code, Copilot)
5. Optionally migrate from ESLint/Prettier
6. Code with auto-formatting on save
7. Commit with pre-commit hooks ensuring quality

**Remember:**
- Always check for existing Git hook managers before installing
- Assess project suitability (scan for ESLint/Prettier/frameworks)
- Recommend or warn based on project characteristics
- Enable `strictNullChecks` in TypeScript projects
- Use framework-specific presets for best results

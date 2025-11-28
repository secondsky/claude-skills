---
name: ultracite
description: >
  Use when setting up, configuring, or migrating to Ultracite, a fast Rust-based linting and formatting tool built on Biome. This skill provides comprehensive guidance for project setup, framework-specific configurations (React, Next.js, Vue, Svelte), Git hook integrations (Husky, Lefthook, lint-staged), AI editor rules, monorepo support, and migrations from ESLint, Prettier, or Biome. Includes project suitability assessment, troubleshooting, known limitations, and best practices for JavaScript/TypeScript projects.
license: MIT
metadata:
  version: 1.0.1
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

**For detailed limitations and workarounds, see**: `references/limitations-and-workarounds.md`

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
bunx ultracite init --quiet

# Specify options explicitly
bunx ultracite init \
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
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
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
bunx ultracite doctor

# Expected output:
# ✔ Biome is installed
# ✔ Configuration file found: biome.jsonc
# ✔ Editor integration configured
# ✔ TypeScript strict mode enabled
```

## Configuration

### Basic Configuration

**File structure:**
```
project-root/
├── biome.jsonc              # Main configuration
├── .vscode/settings.json    # VS Code integration
├── tsconfig.json            # TypeScript config (strictNullChecks required)
└── package.json
```

**Minimal biome.jsonc:**
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],

  // Optional: Add framework preset
  // "extends": ["ultracite/core", "ultracite/react"],

  // Optional: Customize rules
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"  // Disable specific rule
      }
    }
  },

  // Optional: Exclude files
  "files": {
    "ignore": ["dist", "build", "coverage", "**/*.generated.ts"]
  }
}
```

### Framework Presets

- **`ultracite/react`**: React Hooks, JSX a11y, component best practices
- **`ultracite/nextjs`**: React + Next.js App Router, image optimization, document structure
- **`ultracite/vue`**: Vue 3 Composition API, template syntax, reactivity
- **`ultracite/svelte`**: Svelte 4/5 syntax, reactive declarations

**Usage**:
```jsonc
{
  "extends": ["ultracite/core", "ultracite/react"]
}
```

### Core Preset

The `ultracite/core` preset includes **200+ rules** across 7 categories:

- **Accessibility**: ARIA validation, semantic HTML, keyboard navigation
- **Correctness**: Type safety, unused code removal, exhaustive dependencies
- **Performance**: Code optimization, barrel file warnings
- **Security**: Prevents `eval()`, XSS risks, unsafe patterns
- **Style**: Consistent patterns, `const` preference, import organization
- **Suspicious**: Catches loose equality, debugger statements, typos
- **Complexity**: Cognitive complexity limits

**Formatting defaults**: 2 spaces, 80 chars/line, LF endings, single quotes

**For detailed framework presets, rule descriptions, and advanced configuration, see**: `references/configuration-guide.md`

## Usage

### IDE Integration (Recommended)

**VS Code Setup:**

1. Install Biome extension: `biomejs.biome`
2. Verify `.vscode/settings.json`:
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
3. Disable conflicting extensions (ESLint, Prettier)

**Features:**
- Auto-format on save
- Auto-fix on save (removes unused imports, fixes order, applies strict equality)
- Format on paste
- Problems panel for unfixable issues
- Quick fixes via lightbulb indicators

### CLI Usage

**Check code (lint only)**:
```bash
bunx ultracite check
bunx ultracite check src/
bunx ultracite check --diagnostic-level error  # Only errors
```

**Fix code (auto-fix)**:
```bash
bunx ultracite check --write
bunx ultracite check --write src/
```

**Format code (format only)**:
```bash
bunx ultracite format --write
bunx ultracite format --write src/
```

**Package.json scripts**:
```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:fix": "ultracite check --write",
    "format": "ultracite format --write"
  }
}
```

## Git Hook Integrations

Ultracite auto-detects and integrates with:
- **Husky**: Node.js-based hook manager
- **Lefthook**: Fast Go-based hook manager
- **lint-staged**: Runs linters on staged files only

**Quick setup**:
```bash
# Husky
bunx ultracite init --integrations husky

# Lefthook
bunx ultracite init --integrations lefthook

# lint-staged
bunx ultracite init --integrations lint-staged
```

**Example `.husky/pre-commit`**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

ultracite check --staged --write
```

**For complete Git hook setup guides (Husky, Lefthook, lint-staged), see**: `references/git-hooks-setup.md`

## AI Editor Rules

Ultracite generates AI editor rules that teach AI assistants about your linting/formatting standards.

**Supported editors:**
- Cursor (`.cursorrules`)
- Claude Code (`.windsurfrules`)
- GitHub Copilot (`.github/copilot-instructions.md`)
- Continue.dev (`.continuerules`)
- Codeium (`.codeiumrules`)
- Zed (`.zedrules`)

**Generate rules**:
```bash
bunx ultracite generate-ai-rules
bunx ultracite generate-ai-rules --all  # All editors
bunx ultracite generate-ai-rules --editor=cursor  # Specific editor
```

**For complete AI editor integration guide and customization, see**: `references/ai-editor-integration.md`

## Monorepo Support

Ultracite optimizes for monorepos with:
- Shared base configurations
- Package-specific overrides
- Turborepo/Nx caching integration
- Performance optimization for large workspaces

**Example monorepo structure**:
```
monorepo/
├── biome.json              # Shared base config
├── apps/
│   └── web/
│       └── biome.json      # Next.js-specific overrides
└── packages/
    └── ui/
        └── biome.json      # React-specific overrides
```

**For complete monorepo setup, Turborepo/Nx integration, and performance tips, see**: `references/monorepo-configuration.md`

## Migration from ESLint/Prettier/Biome

**Automatic migration**:
```bash
bunx ultracite migrate eslint
bunx ultracite migrate prettier
bunx ultracite migrate biome
```

**Manual migration:**
1. Analyze current configuration
2. Map rules to Biome equivalents
3. Create `biome.json` with equivalent rules
4. Update package.json scripts
5. Remove old dependencies
6. Test thoroughly

**For complete migration guides with detailed rule mappings, see**: `references/migration-guides.md`

## Known Limitations

**CSS/SCSS**: Biome does not lint CSS. Workaround: Use Stylelint
**Framework gaps**: Limited Angular/Astro support. Workaround: Use `ultracite/core` + manual rules
**ESLint plugins**: Many ESLint plugins have no Biome equivalent. Workaround: Run ESLint alongside Ultracite for specific plugins
**File types**: No Markdown, YAML, HTML linting. Workaround: Use dedicated tools (markdownlint, yamllint, htmlhint)

**For complete list of limitations and detailed workarounds, see**: `references/limitations-and-workarounds.md`

## Troubleshooting

**Common issues:**
- VS Code not formatting on save → Install Biome extension, configure settings
- ESLint conflicts → Disable ESLint or run selectively
- Parse errors → Configure JSX support in `biome.json`
- Pre-commit hooks failing → Use `bunx` instead of global install
- CI failures → Pin Bun/Node versions, increase memory limit

**For complete troubleshooting guide, see**: `references/troubleshooting.md`

## Templates & Scripts

### Initial Setup Script

See `scripts/install-ultracite.sh` for automated setup.

### Migration Script

See `scripts/migrate-to-ultracite.sh` for ESLint/Prettier migration.

### Example Configurations

See `references/` directory for:
- `configuration-guide.md`: Framework presets and rule details
- `git-hooks-setup.md`: Husky, Lefthook, lint-staged setup
- `ai-editor-integration.md`: Cursor, Claude Code, Copilot rules
- `monorepo-configuration.md`: Turborepo, Nx, pnpm workspaces
- `migration-guides.md`: ESLint, Prettier, Biome migration
- `troubleshooting.md`: Common issues and solutions
- `limitations-and-workarounds.md`: Known gaps and fixes

## Package Versions

**Current versions (verified 2025-11-27):**
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

## When to Load References

Load reference files on-demand based on user questions or task requirements:

**`references/configuration-guide.md`**: When user asks about:
- Framework presets (React, Next.js, Vue, Svelte)
- Core preset rules (200+ rules breakdown)
- Rule customization methods
- File exclusion patterns
- Advanced configuration

**`references/git-hooks-setup.md`**: When user asks about:
- Pre-commit hooks
- Husky integration
- Lefthook integration
- lint-staged setup
- CI/CD integration
- Hook troubleshooting

**`references/ai-editor-integration.md`**: When user asks about:
- AI editor rules generation
- Cursor integration
- Claude Code integration
- GitHub Copilot setup
- Custom AI rules
- Editor-specific setup

**`references/monorepo-configuration.md`**: When user asks about:
- Monorepo setup
- Turborepo integration
- Nx integration
- Package-specific overrides
- Workspace configuration
- Performance optimization

**`references/migration-guides.md`**: When user asks about:
- ESLint migration
- Prettier migration
- Biome migration
- Rule mapping
- Migration checklist
- Post-migration steps

**`references/troubleshooting.md`**: When user asks about:
- VS Code issues
- ESLint/Prettier conflicts
- Parse errors
- Pre-commit hook failures
- CI failures
- TypeScript strictness errors
- Installation issues
- Performance problems

**`references/limitations-and-workarounds.md`**: When user asks about:
- CSS linting
- Framework support gaps
- ESLint plugin ecosystem
- File type support
- Editor integration
- Migration limitations

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
- Load reference files on-demand based on user questions

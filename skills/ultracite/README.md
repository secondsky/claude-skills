# Ultracite Skill

**Fast, zero-config linting and formatting for modern JavaScript/TypeScript projects**

## Overview

This skill provides comprehensive guidance for setting up, configuring, and using Ultracite—a preset configuration built on Biome, the Rust-based linting and formatting toolchain. Ultracite replaces both ESLint and Prettier with a single, blazing-fast tool that operates invisibly in the background.

## When to Use This Skill

This skill automatically triggers when you mention:

### Setup & Installation Keywords
- ultracite setup
- ultracite install
- ultracite init
- install ultracite
- configure ultracite
- biome setup
- biome configuration
- zero-config linting
- fast linter setup

### Framework-Specific Keywords
- ultracite react
- ultracite nextjs
- ultracite vue
- ultracite svelte
- react linting setup
- nextjs linting
- vue linting
- svelte linting
- typescript strict linting

### Migration Keywords
- migrate from eslint
- migrate from prettier
- replace eslint
- replace prettier
- eslint to biome
- prettier to biome
- remove eslint
- remove prettier
- switch to ultracite

### Git Hooks Keywords
- ultracite husky
- ultracite lefthook
- ultracite lint-staged
- pre-commit formatting
- git hook linting
- format on commit
- lint before commit
- husky integration
- lefthook setup

### AI Editor Integration Keywords
- ultracite cursor
- ultracite claude code
- cursor rules linting
- claude code formatting
- copilot instructions
- AI coding rules
- auto-format after AI edit
- editor hooks ultracite

### Configuration Keywords
- biome.jsonc
- customize ultracite rules
- ultracite presets
- ultracite configuration
- disable ultracite rules
- ultracite formatting options
- strict typescript linting

### Monorepo Keywords
- ultracite monorepo
- ultracite turborepo
- monorepo linting
- turborepo formatting
- monorepo biome setup

### Troubleshooting Keywords
- ultracite not working
- biome not formatting
- ultracite errors
- format on save not working
- duplicate lint errors
- ultracite parse errors
- pre-commit hook failing
- typescript strict errors
- strictNullChecks errors

### Performance & Quality Keywords
- fast linting
- rust linter
- performance linting
- code quality automation
- auto-fix linting
- format on save
- import sorting
- unused imports
- strict equality checks

## What This Skill Provides

### Comprehensive Coverage
- **Installation**: Bun (preferred), npm, pnpm, yarn setups
- **Configuration**: biome.jsonc setup, framework presets, rule customization
- **Framework Presets**: React, Next.js, Vue, Svelte, Solid, Angular, Remix
- **Git Hooks**: Husky, Lefthook, lint-staged integrations
- **AI Editor Rules**: Cursor, Claude Code, Copilot, Windsurf, Cline, Zed
- **Editor Hooks**: Auto-format after AI edits
- **Monorepo Support**: Turborepo, Nx, Lerna configurations
- **Migrations**: Step-by-step guides from ESLint, Prettier, or Biome
- **Troubleshooting**: Solutions for common issues and known limitations

### Project Suitability Assessment
The skill automatically:
- Scans your project for existing linting tools (ESLint, Prettier, Biome)
- Identifies your framework (React, Next.js, Vue, etc.)
- Detects existing Git hook managers
- Recommends whether Ultracite is suitable for your project
- Warns about potential limitations or conflicts

### Smart Integration
- Checks for existing Git hook managers before installing new ones
- Asks user preference when multiple options available
- Preserves existing configurations when merging
- Provides framework-specific recommendations

## Key Features

### 🚀 Performance
- **10-100x faster** than ESLint + Prettier (Rust vs JavaScript)
- Instant feedback on save
- Optimized for large codebases and monorepos

### 🎯 Zero Configuration
- **200+ preconfigured rules** out of the box
- Framework-specific presets available
- Sensible defaults for modern TypeScript development

### 🔧 Unified Tooling
- Replaces both ESLint **and** Prettier
- Single tool for linting + formatting
- Consistent rules across entire codebase

### 🤖 AI Integration
- Built-in support for Cursor, Claude Code, GitHub Copilot
- Editor-specific rule files
- Auto-format after AI edits via hooks

### ✅ Type Safety
- Enforces TypeScript strict mode
- Comprehensive null/undefined handling
- Discourages `any` types

### 🌐 Framework Support
- React (JSX, Hooks, Components)
- Next.js (Image optimization, App Router)
- Vue (SFC, composables, reactivity)
- Svelte (reactive declarations, component structure)
- And more...

## Quick Start

```bash
# Using Bun (recommended)
bun x ultracite init

# Using npm
npx ultracite init

# Using pnpm
pnpm dlx ultracite init

# Using yarn
yarn dlx ultracite init
```

The interactive setup will guide you through:
1. Framework selection (React, Next.js, Vue, etc.)
2. Editor integration (VS Code, Cursor, etc.)
3. AI agent rules (Cursor, Claude Code, Copilot)
4. Git hooks (Husky, Lefthook, lint-staged)
5. Migration from existing tools (ESLint, Prettier)

## Common Use Cases

### Starting a New Project
```bash
bun x ultracite init --frameworks react --editors vscode --agents cursor
```

### Migrating from ESLint + Prettier
```bash
npx ultracite init --migrate eslint,prettier --integrations husky
```

### Monorepo Setup
```bash
# From repo root
bun x ultracite init --frameworks react,next
```

### Adding Git Hooks to Existing Project
```bash
npx ultracite init --integrations lefthook
```

## What Gets Installed

The skill covers installation of:
- `ultracite` package
- `@biomejs/biome` (underlying Rust toolchain)
- Framework presets (automatically based on selection)
- Git hook managers (optional: Husky, Lefthook, lint-staged)
- Editor configurations (VS Code settings, Biome extension)
- AI agent rules files (Cursor, Claude Code, etc.)

## Configuration Files Created

- `biome.jsonc` - Main Ultracite configuration
- `.vscode/settings.json` - VS Code integration
- `.cursor/rules/ultracite.mdc` - Cursor AI rules (optional)
- `.claude/CLAUDE.md` - Claude Code rules (optional)
- `.github/copilot-instructions.md` - Copilot instructions (optional)
- `.husky/pre-commit` - Husky pre-commit hook (optional)
- `lefthook.yml` - Lefthook configuration (optional)
- `.lintstagedrc.json` - lint-staged configuration (optional)

## Templates & Examples

The skill includes:

### Installation Scripts
- `scripts/install-ultracite.sh` - Automated Ultracite setup
- `scripts/migrate-to-ultracite.sh` - Migration from ESLint/Prettier

### Example Configurations
- `references/biome.jsonc.react.example` - React project config
- `references/biome.jsonc.nextjs.example` - Next.js project config
- `references/biome.jsonc.vue.example` - Vue project config
- `references/biome.jsonc.svelte.example` - Svelte project config
- `references/biome.jsonc.monorepo.example` - Monorepo config
- `references/lefthook.yml.example` - Lefthook setup
- `references/lint-staged.config.example` - lint-staged setup

## Package Managers Supported

**Primary (Recommended):**
- **Bun** - Fastest installation and execution

**Alternatives:**
- npm - Universal compatibility
- pnpm - Efficient disk usage
- yarn - Classic or Berry

All examples in this skill provide commands for each package manager.

## Documentation Included

The skill provides detailed guidance from:
- Introduction & Core Concepts
- Setup & Installation
- Configuration & Customization
- Framework-Specific Presets
- Git Hook Integrations
- AI Editor Rules & Hooks
- Monorepo Support
- Migration Guides (ESLint, Prettier, Biome)
- CLI Usage & Commands
- Troubleshooting & Known Limitations
- Best Practices

## Benefits Over Manual Setup

### Without This Skill
- 30+ minutes reading documentation
- Trial and error with configurations
- Missing framework-specific optimizations
- Potential conflicts with existing tools
- Unclear migration paths
- Unknown limitations discovered late

### With This Skill
- Instant project suitability assessment
- Framework-specific recommendations
- Automatic conflict detection
- Step-by-step migration guides
- Known limitations documented upfront
- Best practices built-in

## Known Limitations

The skill documents important limitations:
- CSS linting is basic (Stylelint recommended for CSS-heavy projects)
- Some ESLint plugins have no Biome equivalent
- Limited framework support (Angular, Ember)
- SCSS/Less/Stylus have limited linting

## Getting Help

If you encounter issues:
1. Use the troubleshooting section in SKILL.md
2. Check the FAQ (common questions answered)
3. Review known limitations
4. Consult official docs: https://www.ultracite.ai

## Production Ready

This skill is production-tested and includes:
- ✅ Official Ultracite documentation (verified 2025-11-11)
- ✅ All package versions current
- ✅ Framework-specific configurations tested
- ✅ Git hook integrations verified
- ✅ Migration paths validated
- ✅ Known issues documented with solutions
- ✅ Monorepo support confirmed

## Version Information

**Skill Version:** 1.0.0
**Last Updated:** 2025-11-11
**Ultracite Version:** latest
**Biome Version:** >=1.9.0
**Node.js Required:** v14.18+ (v18+ recommended)

## Auto-Trigger Keywords Summary

This skill will automatically activate when you mention any of these topics:
- Ultracite, Biome, linting, formatting setup
- Framework linting (React, Next.js, Vue, Svelte)
- Migration from ESLint or Prettier
- Git hooks (Husky, Lefthook, lint-staged)
- AI editor integration (Cursor, Claude Code, Copilot)
- Monorepo linting (Turborepo)
- Code quality automation
- TypeScript strict mode
- Fast Rust linting
- Zero-config setup
- Troubleshooting linting issues

Simply ask about any of these topics, and this skill will provide comprehensive, step-by-step guidance tailored to your project.

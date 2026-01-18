# Ultracite Skill

**Fast, zero-config linting and formatting for modern JavaScript/TypeScript projects**

## Overview

This skill provides comprehensive guidance for setting up, configuring, and using Ultracite—a unified linting and formatting solution with **multi-provider support**. Choose from **Biome** (default, fastest), **ESLint+Prettier+Stylelint** (maximum compatibility), or **Oxlint+Oxfmt** (type-aware linting).

**Version 7** introduces multi-provider architecture, preset path migration, MCP server integration, and AI hooks.
**Version 6** introduced framework-specific presets for React, Next.js, Vue, Svelte, and more.

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
- v6 to v7 migration
- v7 upgrade
- preset path migration
- ultracite migration

### Provider Selection Keywords (v7+)
- multi-provider linting
- choose linting provider
- biome vs eslint
- biome vs oxlint
- oxlint type-aware
- eslint provider
- oxlint provider
- provider selection
- linter flag

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
- ai hooks ultracite
- mcp server ultracite
- model context protocol
- ultracite mcp integration
- ai assistant integration

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

# v7: Choose provider explicitly
bun x ultracite init --linter biome   # Default (fastest)
bun x ultracite init --linter eslint  # Maximum compatibility
bun x ultracite init --linter oxlint  # Type-aware linting

# Using npm
npx ultracite init

# Using pnpm
pnpm dlx ultracite init

# Using yarn
yarn dlx ultracite init
```

The interactive setup will guide you through:
1. Provider selection (Biome, ESLint, Oxlint) - **v7+ only**
2. Framework selection (React, Next.js, Vue, etc.)
3. Editor integration (VS Code, Cursor, etc.)
4. AI agent rules (Cursor, Claude Code, Copilot)
5. Git hooks (Husky, Lefthook, lint-staged)
6. Migration from existing tools (ESLint, Prettier)

## Interactive Features

This skill provides interactive commands and autonomous agents to streamline your Ultracite workflow.

### Commands

#### `/ultracite:doctor`
Validate your Ultracite project setup and configuration.

**What it checks:**
- Installation status (ultracite, @biomejs/biome versions)
- Configuration syntax (biome.jsonc validation)
- Preset paths (v6 vs v7 detection)
- Conflicting tools (ESLint, Prettier remnants)
- Environment compatibility (Node.js version)
- Performance optimization opportunities

**Example output:**
```
✅ Ultracite installed: v7.2.0
✅ Provider: Biome (optimal for your project size)
⚠️ Preset paths: Using v6 paths (upgrade to v7)
  → Run /ultracite:migrate to fix
✅ No conflicting tools
✅ Node.js: v20.10.0
```

**When to use:** After installation, before deployment, when experiencing issues, after version upgrades.

#### `/ultracite:migrate`
Interactive migration wizard for ESLint/Prettier to Ultracite or v6→v7 preset path upgrades.

**What it does:**
- Scans existing ESLint/Prettier configurations
- Maps rules to Biome equivalents (with gap analysis)
- Generates biome.jsonc with comments for unmapped rules
- Backs up old configurations to `.backup/`
- Validates new configuration
- Provides rollback instructions

**Supports:**
- ESLint → Ultracite/Biome
- Prettier → Ultracite/Biome
- ESLint + Prettier → Ultracite/Biome (combined)
- Ultracite v6 → v7 (preset path upgrade)

**Example output:**
```
✅ Mapped: 38 rules (84%)
⚠️ No equivalent: 7 rules (16%)
✅ Generated biome.jsonc
✅ Backed up old configs to .backup/
→ Next: npx ultracite check --write .
```

**When to use:** Migrating from ESLint/Prettier, upgrading from v6 to v7, consolidating tools.

### Agents

#### `config-validator`
Analyzes biome.jsonc configurations and provides optimization recommendations.

**Triggers on:**
- "is my ultracite config correct?"
- "validate my biome configuration"
- "check my ultracite setup"
- "optimize my biome config"

**Analysis phases:**
1. Syntax validation (JSON/JSONC parsing)
2. Preset path validation (v6 vs v7 detection)
3. Rule conflict analysis (redundant/incompatible rules)
4. Performance analysis (file count, ignore patterns)
5. Compatibility check (Node.js, TypeScript versions)

**Example output:**
```
⚠️ Using v6 preset paths (upgrade recommended)
⚠️ 2 redundant rules detected
✅ Project size: ~350 files (Biome optimal)
✅ Compatibility: Node.js v20.10.0
```

**When to use:** After configuration changes, before production deployment, when troubleshooting.

#### `migration-assistant`
Guides ESLint/Prettier migrations with comprehensive rule mapping.

**Triggers on:**
- "migrate from eslint"
- "switch to ultracite from prettier"
- "convert eslint config to ultracite"
- "upgrade ultracite v6 to v7"

**Capabilities:**
- ESLint rule mapping database (38+ common rules)
- Prettier formatter option mapping
- Framework detection (React, Next.js, Vue, Svelte)
- Gap analysis with workarounds
- Backup strategy with rollback instructions
- Validation testing and comparison

**Example output:**
```
✅ Mapped: 38 rules (84%)
❌ No equivalent: @typescript-eslint/no-floating-promises
   → Use Oxlint provider (type-aware linting)
✅ Generated biome.jsonc with React preset
✅ All Prettier options mapped to Biome formatter
```

**When to use:** Planning migrations, comparing ESLint vs Biome, evaluating migration complexity.

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

**Skill Version:** 2.0.0 (updated for v7)
**Last Updated:** 2026-01-18
**Ultracite Version:** v7.0+ (multi-provider support)
**Biome Version:** >=1.9.0
**ESLint Version:** >=8.0.0 (when using ESLint provider)
**Oxlint Version:** >=0.1.0 (when using Oxlint provider)
**Node.js Required:** v14.18+ (v18+ recommended)

### Version 7 Changes (2025-11)
- Multi-provider architecture (Biome, ESLint, Oxlint)
- Preset path migration (`ultracite/core` → `ultracite/biome/core`)
- MCP server integration for AI assistants
- AI hooks (auto-format after AI edits)
- Type-aware linting (Oxlint provider)
- `ultracite doctor` diagnostic command

### Version 6 Changes (2025-09)
- Framework-specific presets introduced
- React, Next.js, Vue, Svelte, Solid, Qwik, Angular, Remix, Astro support

## Auto-Trigger Keywords Summary

This skill will automatically activate when you mention any of these topics:
- Ultracite, Biome, Oxlint, ESLint multi-provider linting
- Provider selection (Biome vs ESLint vs Oxlint)
- Framework linting (React, Next.js, Vue, Svelte)
- Migration from ESLint or Prettier
- v6 to v7 migration, preset path migration
- MCP server integration, Model Context Protocol
- AI hooks, auto-format after AI edits
- Type-aware linting (Oxlint)
- Git hooks (Husky, Lefthook, lint-staged)
- AI editor integration (Cursor, Claude Code, Copilot)
- Monorepo linting (Turborepo)
- Code quality automation
- TypeScript strict mode
- Fast Rust linting
- Zero-config setup
- Troubleshooting linting issues
- `ultracite doctor` diagnostic command

Simply ask about any of these topics, and this skill will provide comprehensive, step-by-step guidance tailored to your project.

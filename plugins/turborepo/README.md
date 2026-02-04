# Turborepo Plugin

Official Turborepo skill for Claude Code, synchronized with Vercel's official implementation.

## Overview

Turborepo is a high-performance build system for JavaScript and TypeScript monorepos. This plugin provides comprehensive guidance for:

- Setting up and configuring monorepos
- Optimizing build pipelines and caching strategies
- Managing task dependencies and parallel execution
- Implementing remote caching for teams
- Debugging cache issues and configuration problems
- Enforcing package boundaries and best practices

## Version

**Current Version**: 2.8.3-canary.4 (synced with official Vercel Turborepo skill)

## Installation

```bash
# Install from claude-skills marketplace
/plugin install turborepo@claude-skills
```

## Structure

This plugin follows the official Turborepo skill structure from Vercel:

```
turborepo/
├── .claude-plugin/
│   └── plugin.json                      # Plugin manifest
├── README.md                            # This file
└── skills/
    └── turborepo/
        ├── SKILL.md                     # Main skill content
        ├── command/
        │   └── turborepo.md            # Turborepo command
        └── references/                  # Progressive disclosure docs
            ├── best-practices/          # Monorepo best practices
            │   ├── RULE.md
            │   ├── structure.md
            │   ├── packages.md
            │   └── dependencies.md
            ├── boundaries/              # Package boundary enforcement
            │   └── RULE.md
            ├── caching/                 # Caching system
            │   ├── RULE.md
            │   ├── remote-cache.md
            │   └── gotchas.md
            ├── ci/                      # CI/CD integration
            │   ├── RULE.md
            │   ├── github-actions.md
            │   ├── vercel.md
            │   └── patterns.md
            ├── cli/                     # CLI reference
            │   ├── RULE.md
            │   └── commands.md
            ├── configuration/           # Configuration guide
            │   ├── RULE.md
            │   ├── tasks.md
            │   ├── global-options.md
            │   └── gotchas.md
            ├── environment/             # Environment variables
            │   ├── RULE.md
            │   ├── modes.md
            │   └── gotchas.md
            ├── filtering/               # Package filtering
            │   ├── RULE.md
            │   └── patterns.md
            └── watch/                   # Watch mode
                └── README.md
```

## Features

### Core Capabilities

- **Quick Decision Trees**: Navigate common tasks with decision tree guidance
- **Anti-Pattern Detection**: Identify and fix common configuration mistakes
- **Progressive Disclosure**: Load detailed reference docs only when needed
- **Comprehensive Coverage**: 24 reference documents organized by topic

### Key Topics Covered

1. **Configuration**
   - Task dependencies and outputs
   - Global options and settings
   - Package-specific configurations
   - Common gotchas and fixes

2. **Caching**
   - How caching works
   - Remote cache setup (Vercel)
   - Cache debugging techniques
   - Common cache issues

3. **Environment Variables**
   - Strict vs loose modes
   - Framework inference
   - CI/CD integration
   - Common pitfalls

4. **Filtering & Selection**
   - `--affected` flag usage
   - Package name patterns
   - Directory filtering
   - Complex combinations

5. **CI/CD Integration**
   - GitHub Actions setup
   - Vercel deployment
   - Remote caching in CI
   - Build optimization patterns

6. **Best Practices**
   - Monorepo structure
   - Package creation
   - Dependency management
   - TypeScript & ESLint config

7. **Watch Mode**
   - Development workflows
   - Persistent tasks
   - Interruptible tasks
   - Hot reload patterns

8. **Boundaries** (Experimental)
   - Package isolation
   - Tag-based rules
   - Import restrictions

## Auto-Trigger Keywords

The skill triggers on these keywords:

- **Primary**: turborepo, turbo, monorepo, turbo.json, task pipelines
- **Configuration**: dependsOn, caching, remote cache, --filter, --affected
- **Structure**: internal packages, monorepo structure, apps/packages directories
- **Actions**: configure tasks, create packages, debug cache, run changed packages

## Commands

### /turborepo

Interactive Turborepo helper command. Use this to:
- Get quick guidance on common tasks
- Navigate to relevant reference documentation
- Troubleshoot specific issues

## Usage Examples

### Setting Up a New Monorepo

```bash
# Ask Claude to help set up Turborepo
"Set up a new turborepo with Next.js app and shared UI library"
```

Claude will:
1. Guide you through project structure
2. Configure turbo.json with proper task dependencies
3. Set up workspace configuration
4. Add example package.json scripts

### Debugging Cache Issues

```bash
"My turborepo cache isn't working for the build task"
```

Claude will:
1. Check your turbo.json configuration
2. Verify outputs are defined
3. Suggest using `--dry` to debug hash inputs
4. Guide you through common cache gotchas

### Optimizing CI/CD

```bash
"How do I set up Turborepo with GitHub Actions?"
```

Claude will:
1. Provide GitHub Actions workflow template
2. Configure remote caching
3. Set up `--affected` for changed packages only
4. Add caching strategies for faster builds

## Official Source

This skill is synchronized with the official Turborepo skill maintained by Vercel:

- **Source**: https://github.com/vercel/turborepo/tree/main/skills/turborepo
- **Documentation**: https://turborepo.dev/docs
- **Last Sync**: 2026-02-04

## License

MIT

## Maintainer

Claude Skills Maintainers
- Repository: https://github.com/secondsky/claude-skills
- Email: maintainers@example.com

---

**Note**: This plugin is kept in sync with Vercel's official Turborepo skill to ensure accuracy and up-to-date best practices.

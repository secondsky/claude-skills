---
name: turborepo
description: Guide for implementing Turborepo - a high-performance build system for JavaScript and TypeScript monorepos. Use when setting up monorepos, optimizing build performance, implementing task pipelines, configuring caching strategies, or orchestrating tasks across multiple packages.
license: MIT
version: 1.0.0
---

# Turborepo Skill

Turborepo is a high-performance build system optimized for JavaScript and TypeScript monorepos, written in Rust. It provides intelligent caching, task orchestration, and remote execution capabilities to dramatically speed up development workflows.

**Official Reference**: <https://turborepo.com/llms.txt>

---

## Quick Start (5 Minutes)

### Create New Monorepo

```bash
# Create new turborepo
bunx create-turbo@latest my-monorepo
cd my-monorepo

# Install dependencies
bun install

# Run all builds
bun run build

# Start dev servers
bun run dev
```

### Add to Existing Monorepo

```bash
# Install Turborepo
bun add turbo --dev

# Create turbo.json (see templates/turbo-basic.json)
# Copy templates/turbo-basic.json to ./turbo.json

# Run builds
bunx turbo run build
```

**Templates**: See `templates/` directory for ready-to-use configurations.

**Need Help?**: See `references/troubleshooting.md` for common issues.

---

## When to Use This Skill

### Primary Use Cases

- Setting up monorepos with 2+ packages/apps
- Optimizing CI/CD build times (50-90% reduction typical)
- Migrating from Lerna or Nx to Turborepo
- Implementing remote caching for teams
- Building full-stack applications with shared code

### Common Scenarios

- "Set up turborepo for Next.js + shared UI library"
- "Configure remote caching with Vercel"
- "Optimize monorepo builds for GitHub Actions"
- "Create Docker builds with turbo prune"
- "Migrate Lerna monorepo to Turborepo"
- "Build only changed packages in CI"

**Keywords**: monorepo, turborepo, build system, caching, task pipeline, workspace, incremental builds, remote cache, vercel, next.js monorepo, pnpm workspace, yarn workspace, npm workspace, bun workspace

---

## Core Concepts

### 1. Monorepo Architecture

Turborepo organizes code into packages within a single repository:

- **Root Package**: Contains workspace configuration
- **Internal Packages**: Shared libraries, utilities, configs
- **Applications**: Frontend apps, backend services, etc.
- **Workspaces**: npm/yarn/pnpm/bun workspace configuration

**Example Structure**: See `templates/monorepo-structure.txt`

### 2. Task Pipeline

Tasks are organized in a dependency graph:

- **Task Dependencies**: Define execution order (build before test)
- **Package Dependencies**: Respect internal package relationships
- **Parallel Execution**: Run independent tasks simultaneously
- **Topological Ordering**: Execute tasks in correct dependency order

**Configuration**: Defined in `turbo.json`

### 3. Intelligent Caching

Turborepo caches task outputs based on inputs:

- **Local Cache**: Stores outputs on local machine (`.turbo/`)
- **Remote Cache**: Shares cache across team/CI (Vercel or custom)
- **Content-Based Hashing**: Only re-run when inputs change
- **Cache Restoration**: Instant task completion from cache

**Cache Benefits**:
- 50-90% faster builds
- Reduced CI compute costs
- Consistent builds across environments

### 4. Task Outputs

Define what gets cached:

- Build artifacts (dist/, build/)
- Test results and coverage
- Generated files
- Type definitions

---

## Installation

### Prerequisites

```bash
# Requires Node.js 18+
node --version # v18.0.0+
```

### Global Installation

```bash
bun add turbo --global

# Alternatives:
# npm install turbo --global
# pnpm add turbo --global
# yarn global add turbo
```

### Per-Project Installation (Recommended)

```bash
bun add turbo --dev

# Alternatives:
# npm install turbo --save-dev
# pnpm add turbo --save-dev
# yarn add turbo --dev
```

---

## Project Setup

### Create New Monorepo

#### Option 1: Interactive CLI

```bash
bunx create-turbo@latest
```

Prompts for:
- Project name
- Package manager (npm/yarn/pnpm/bun)
- Example template selection

#### Option 2: Automated Script

```bash
# Use the setup script
./scripts/setup-monorepo.sh
```

Interactive script creates complete monorepo structure.

### Manual Setup

**1. Initialize workspace:**

```json
// package.json (root)
{
	"name": "my-turborepo",
	"private": true,
	"workspaces": ["apps/*", "packages/*"],
	"scripts": {
		"build": "turbo run build",
		"dev": "turbo run dev",
		"test": "turbo run test",
		"lint": "turbo run lint"
	},
	"devDependencies": {
		"turbo": "latest"
	}
}
```

**2. Create directory structure:**

See `templates/monorepo-structure.txt` for complete structure.

**3. Create turbo.json:**

See `templates/turbo-basic.json` for starter config or `templates/turbo-fullstack.json` for comprehensive setup.

---

## Configuration (turbo.json)

### Basic Structure

```json
{
	"$schema": "https://turbo.build/schema.json",
	"globalDependencies": [".env", "tsconfig.json"],
	"globalEnv": ["NODE_ENV"],
	"pipeline": {
		// Task definitions
	}
}
```

**Templates Available**:
- `templates/turbo-basic.json` - Minimal configuration
- `templates/turbo-fullstack.json` - Production-ready setup
- `templates/turbo-nextjs.json` - Next.js specific
- `templates/turbo-vite.json` - Vite specific

### Pipeline Configuration

**Task with dependencies:**

```json
{
	"pipeline": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**", ".next/**"],
			"env": ["NODE_ENV", "API_URL"]
		}
	}
}
```

**Key properties:**

- `dependsOn`: Tasks to run first
  - `["^build"]`: Run dependencies' build first
  - `["build"]`: Run own build first
  - `["^build", "lint"]`: Run deps' build and own lint
- `outputs`: Files/directories to cache
- `inputs`: Override input detection (default: all tracked files)
- `cache`: Enable/disable caching (default: true)
- `env`: Environment variables that affect output
- `persistent`: Keep task running (for dev servers)
- `outputMode`: Control output display

### Task Dependency Patterns

**Topological (^):**

```json
{
	"build": {
		"dependsOn": ["^build"] // Run dependencies' build first
	}
}
```

**Regular:**

```json
{
	"deploy": {
		"dependsOn": ["build", "test"] // Run own build and test first
	}
}
```

**Combined:**

```json
{
	"test": {
		"dependsOn": ["^build", "lint"] // Deps' build, then own lint
	}
}
```

---

## Commands

### turbo run

Run tasks across packages:

```bash
# Run build in all packages
turbo run build

# Run multiple tasks
turbo run build test lint

# Run in specific packages
turbo run build --filter=web
turbo run build --filter=@myorg/ui

# Run in packages matching pattern
turbo run build --filter='./apps/*'

# Force execution (skip cache)
turbo run build --force

# Parallel execution control
turbo run build --concurrency=3
turbo run build --concurrency=50%

# Continue on error
turbo run test --continue

# Dry run
turbo run build --dry-run

# Output control
turbo run build --output-logs=errors-only
turbo run build --output-logs=hash-only
```

**Advanced Filtering**: See `references/advanced-filtering.md` for complete guide.

### turbo prune

Create a subset of the monorepo:

```bash
# Prune for specific app
turbo prune --scope=web

# Prune with Docker
turbo prune --scope=api --docker

# Output to custom directory
turbo prune --scope=web --out-dir=./deploy
```

**Use cases:**
- Docker builds (only include necessary packages)
- Deploy specific apps
- Reduce CI/CD context size

**Docker Template**: See `templates/Dockerfile` for multi-stage build example.

### turbo gen

Generate code in your monorepo:

```bash
# Generate new package
turbo gen workspace

# Generate from custom generator
turbo gen my-generator

# List available generators
turbo gen --list
```

### turbo link

Link local repo to remote cache:

```bash
# Link to Vercel
turbo link

# Unlink
turbo unlink
```

**Setup Guide**: Run `scripts/link-remote-cache.sh` for interactive setup.

### turbo login

Authenticate with Vercel:

```bash
turbo login
```

### turbo ls

List packages in monorepo:

```bash
# List all packages
turbo ls

# JSON output
turbo ls --json
```

---

## Filtering

Turborepo's filtering system allows targeted task execution.

### Basic Filters

```bash
# Single package
turbo run build --filter=web

# Multiple packages
turbo run build --filter=web --filter=api

# Pattern matching
turbo run build --filter='./apps/*'
```

### Git-Based Filters

```bash
# Changed since main
turbo run build --filter='[origin/main]'

# Changed in last commit
turbo run build --filter='[HEAD~1]'

# Changed in working directory
turbo run test --filter='...[HEAD]'
```

### Dependency Filters

```bash
# Package and its dependencies
turbo run build --filter='...web'

# Package and its dependents
turbo run test --filter='ui...'

# Package, dependencies, and dependents
turbo run build --filter='...ui...'
```

**Complete Guide**: See `references/advanced-filtering.md` for all patterns and examples.

---

## Caching Strategies

### Local Caching

Enabled by default, stores in `./node_modules/.cache/turbo`

```json
{
	"pipeline": {
		"build": {
			"outputs": ["dist/**"], // Cache dist directory
			"cache": true // Enable caching (default)
		},
		"dev": {
			"cache": false // Disable for dev servers
		}
	}
}
```

**Clear cache:**

```bash
rm -rf ./node_modules/.cache/turbo
# Or
turbo run build --force # Skip cache for this run
```

### Remote Caching

Share cache across team and CI:

**Setup (Vercel - Recommended):**

```bash
turbo login
turbo link
```

**Or use automated script:**

```bash
./scripts/link-remote-cache.sh
```

**Benefits:**
- Share builds across team
- Speed up CI/CD (50-90% faster)
- Consistent builds
- Reduce compute costs

**CI/CD Setup**: See `references/ci-cd-guide.md` for platform-specific configuration.

---

## CI/CD Integration

### Quick Example (GitHub Actions)

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: bun install
      - run: bunx turbo run build test
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

**Complete Templates**:
- `templates/github-actions.yml` - GitHub Actions
- `templates/gitlab-ci.yml` - GitLab CI
- `templates/Dockerfile` - Docker builds

**Complete Guide**: See `references/ci-cd-guide.md` for:
- All major CI platforms
- Optimization strategies
- Remote caching setup
- Docker integration
- Performance benchmarks

---

## Framework Integration

### Next.js

```json
{
	"pipeline": {
		"build": {
			"outputs": [".next/**", "!.next/cache/**"]
		},
		"dev": {
			"cache": false,
			"persistent": true
		}
	}
}
```

**Template**: `templates/turbo-nextjs.json`

### Vite

```json
{
	"pipeline": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**"]
		},
		"dev": {
			"cache": false,
			"persistent": true
		}
	}
}
```

**Template**: `templates/turbo-vite.json`

### Nuxt

```json
{
	"pipeline": {
		"build": {
			"outputs": [".output/**", ".nuxt/**"]
		},
		"dev": {
			"cache": false,
			"persistent": true
		}
	}
}
```

---

## Best Practices

### 1. Structure Your Monorepo

```
my-monorepo/
├── apps/                    # Applications
│   ├── web/                # Frontend app
│   ├── api/                # Backend API
│   └── docs/               # Documentation
├── packages/               # Shared packages
│   ├── ui/                 # UI components
│   ├── config/             # Shared configs
│   ├── utils/              # Utilities
│   └── tsconfig/           # TS configs
├── tooling/                # Development tools
│   ├── eslint-config/
│   └── prettier-config/
└── turbo.json
```

**Template**: See `templates/monorepo-structure.txt`

### 2. Define Clear Task Dependencies

```json
{
	"pipeline": {
		"build": {
			"dependsOn": ["^build"]
		},
		"test": {
			"dependsOn": ["build"]
		},
		"lint": {
			"dependsOn": ["^build"]
		},
		"deploy": {
			"dependsOn": ["build", "test", "lint"]
		}
	}
}
```

### 3. Optimize Cache Configuration

- **Cache build outputs, not source files**
- **Include all generated files in outputs**
- **Exclude cache directories** (e.g., `.next/cache`)
- **Disable cache for dev servers**

```json
{
	"pipeline": {
		"build": {
			"outputs": [
				"dist/**",
				".next/**",
				"!.next/cache/**",
				"storybook-static/**"
			]
		},
		"dev": {
			"cache": false,
			"persistent": true
		}
	}
}
```

### 4. Use Environment Variables Wisely

```json
{
	"globalEnv": ["NODE_ENV", "CI"],
	"pipeline": {
		"build": {
			"env": ["NEXT_PUBLIC_API_URL"],
			"passThroughEnv": ["DEBUG"] // Don't affect cache
		}
	}
}
```

### 5. Leverage Remote Caching

- Enable for all team members
- Configure in CI/CD
- Reduces build times significantly (50-90%)
- Especially beneficial for large teams

**Setup**: Run `scripts/link-remote-cache.sh`

### 6. Use Filters Effectively

```bash
# Build only changed packages
turbo run build --filter='...[origin/main]'

# Build specific app with dependencies
turbo run build --filter='...web'

# Test only affected packages
turbo run test --filter='...[HEAD^1]'
```

**Complete Guide**: See `references/advanced-filtering.md`

### 7. Organize Scripts Consistently

Root package.json:

```json
{
	"scripts": {
		"build": "turbo run build",
		"dev": "turbo run dev",
		"lint": "turbo run lint",
		"test": "turbo run test",
		"clean": "turbo run clean && rm -rf node_modules"
	}
}
```

### 8. Handle Persistent Tasks

```json
{
	"pipeline": {
		"dev": {
			"cache": false,
			"persistent": true // Keeps running
		}
	}
}
```

---

## Common Patterns

### Full-Stack Application

```
apps/
├── web/          # Next.js frontend
├── api/          # Express backend
└── mobile/       # React Native

packages/
├── ui/           # Shared UI components
├── database/     # Database client/migrations
├── types/        # Shared TypeScript types
└── config/       # Shared configs
```

### Shared Component Library

```
packages/
├── ui/                    # Component library
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── ui-docs/              # Storybook
    ├── .storybook/
    ├── stories/
    └── package.json
```

### Microfrontends

```
apps/
├── shell/        # Container app
├── dashboard/    # Dashboard MFE
└── settings/     # Settings MFE

packages/
├── shared-ui/    # Shared components
└── router/       # Routing logic
```

---

## Troubleshooting

### Quick Fixes

**Cache not working:**
```bash
turbo run build --dry-run=json  # Check cache hash
turbo run build --force          # Force rebuild
rm -rf ./node_modules/.cache/turbo
```

**Tasks running in wrong order:**
- Check `dependsOn` configuration
- Use `^task` for dependency tasks
- Verify task names match package.json scripts

**Dev server not starting:**
```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true  // Add this
    }
  }
}
```

**Remote cache not working:**
```bash
turbo link                      # Verify authentication
echo $TURBO_TOKEN              # Check env vars
echo $TURBO_TEAM
turbo run build --output-logs=hash-only  # Test connection
```

**Complete Troubleshooting Guide**: See `references/troubleshooting.md` for:
- Cache issues
- Dependency issues
- Task execution issues
- Performance issues
- CI/CD issues
- Docker issues
- Environment variable issues
- All error messages and solutions

---

## Migration

### Migrating from Lerna

```bash
# 1. Install Turborepo
npm install turbo --save-dev

# 2. Create turbo.json (see templates/turbo-basic.json)

# 3. Update scripts in package.json
# 4. Test builds locally
# 5. Update CI/CD workflows
```

**Lerna → Turborepo Mapping:**
- `lerna run build` → `turbo run build`
- `lerna run test --scope=package` → `turbo run test --filter=package`
- `lerna run build --since main` → `turbo run build --filter='...[main]'`

### Migrating from Nx

```bash
# 1. Install Turborepo
npm install turbo --save-dev

# 2. Convert nx.json to turbo.json

# 3. Update scripts
# 4. Test locally
# 5. Update CI/CD
```

**Nx → Turborepo Mapping:**
- `nx run-many --target=build --all` → `turbo run build`
- `nx run app:build` → `turbo run build --filter=app`
- `nx affected --target=build` → `turbo run build --filter='...[origin/main]'`

**Complete Migration Guide**: See `references/migration-guide.md` for:
- Detailed step-by-step instructions
- Configuration conversion
- Common pitfalls
- Rollback strategies
- Success metrics

---

## Resources

### Templates & Scripts

- **Templates**: All configs in `templates/` directory
- **Scripts**: Setup automation in `scripts/` directory
- **References**: Detailed guides in `references/` directory

### Official Documentation

- **Documentation**: <https://turbo.build/repo/docs>
- **LLM Documentation**: <https://turborepo.com/llms.txt>
- **Examples**: <https://github.com/vercel/turbo/tree/main/examples>
- **Discord**: <https://turbo.build/discord>
- **GitHub**: <https://github.com/vercel/turbo>

### Detailed Guides

- `references/troubleshooting.md` - Complete troubleshooting guide
- `references/ci-cd-guide.md` - CI/CD platform integration
- `references/migration-guide.md` - Migration from Lerna/Nx
- `references/advanced-filtering.md` - Advanced filter patterns

---

## Implementation Checklist

When setting up Turborepo:

- [ ] Install Turborepo globally or per-project
- [ ] Set up workspace structure (apps/, packages/)
- [ ] Create turbo.json (use templates/)
- [ ] Define task dependencies (build, test, lint)
- [ ] Configure cache outputs for each task
- [ ] Set up global dependencies and environment variables
- [ ] Link to remote cache (run scripts/link-remote-cache.sh)
- [ ] Configure CI/CD integration (see references/ci-cd-guide.md)
- [ ] Add filtering strategies for large repos
- [ ] Document monorepo structure for team
- [ ] Set up code generation (turbo gen)
- [ ] Configure Docker builds (see templates/Dockerfile)
- [ ] Test caching behavior locally
- [ ] Verify remote cache in CI
- [ ] Optimize concurrency settings

---

**Last Updated**: 2025-11-19
**Skill Version**: 1.0.0
**Turborepo Version**: 2.3.0+
**Official LLM Docs**: <https://turborepo.com/llms.txt>

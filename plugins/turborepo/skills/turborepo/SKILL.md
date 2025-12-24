---
name: turborepo
description: Turborepo high-performance monorepo build system. Use for monorepo setup, build optimization, task pipelines, caching strategies, or multi-package orchestration.
license: MIT
metadata:
  version: 2.0.0
  last_verified: 2025-12-17
  optimization_date: 2025-12-17
  token_savings: ~54%
  complexity: 7/10
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

### Per-Project Installation (Recommended)

```bash
bun add turbo --dev

# Alternatives:
# npm install turbo --save-dev
# pnpm add turbo --save-dev
# yarn add turbo --dev
```

---

## Configuration

### Basic turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.json"],
  "globalEnv": ["NODE_ENV"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**For complete configuration guide**: Load `references/configuration-guide.md` when configuring turbo.json, task pipelines, or framework-specific setups.

**Available Templates**:
- `templates/turbo-basic.json` - Minimal configuration
- `templates/turbo-fullstack.json` - Production-ready setup
- `templates/turbo-nextjs.json` - Next.js specific
- `templates/turbo-vite.json` - Vite specific

---

## Essential Commands

### turbo run

```bash
# Run build in all packages
turbo run build

# Run multiple tasks
turbo run build test lint

# Run in specific packages
turbo run build --filter=web
turbo run build --filter='./apps/*'

# Build only changed packages
turbo run build --filter='...[origin/main]'
```

**For complete command reference**: Load `references/configuration-guide.md` when using advanced command options or filters.

### Other Commands

```bash
# Prune monorepo for deployment
turbo prune --scope=web --docker

# Link to remote cache
turbo login
turbo link

# List packages
turbo ls
```

---

## Filtering

### Quick Examples

```bash
# Single package
turbo run build --filter=web

# Git-based (changed since main)
turbo run build --filter='[origin/main]'

# With dependencies
turbo run build --filter='...web'

# With dependents
turbo run test --filter='ui...'
```

**For complete filtering guide**: Load `references/advanced-filtering.md` when implementing CI/CD filters, dependency-based builds, or advanced filter patterns.

---

## Caching

### Local Caching

Enabled by default, stores in `./node_modules/.cache/turbo`

```bash
# Clear cache
rm -rf ./node_modules/.cache/turbo
# Or skip cache
turbo run build --force
```

### Remote Caching

Share cache across team and CI:

```bash
turbo login
turbo link
```

**For complete caching guide**: Load `references/best-practices-patterns.md` when optimizing cache configuration or implementing remote caching strategies.

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

**For complete CI/CD guide**: Load `references/ci-cd-guide.md` when setting up CI/CD pipelines, optimizing builds, or configuring platform-specific workflows (GitHub Actions, GitLab, Docker, etc.).

**Complete Templates**:
- `templates/github-actions.yml` - GitHub Actions
- `templates/gitlab-ci.yml` - GitLab CI
- `templates/Dockerfile` - Docker builds

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

**For complete troubleshooting**: Load `references/troubleshooting.md` when encountering cache issues, dependency problems, task execution issues, or CI/CD errors.

---

## Migration

### From Lerna

```bash
# 1. Install Turborepo
npm install turbo --save-dev

# 2. Create turbo.json (see templates/turbo-basic.json)
# 3. Update scripts in package.json
# 4. Test builds locally
# 5. Update CI/CD workflows
```

**Command Mapping**:
- `lerna run build` → `turbo run build`
- `lerna run test --scope=pkg` → `turbo run test --filter=pkg`
- `lerna run build --since main` → `turbo run build --filter='...[main]'`

### From Nx

```bash
# 1. Install Turborepo
npm install turbo --save-dev

# 2. Convert nx.json to turbo.json
# 3. Update scripts
# 4. Update CI/CD
```

**Command Mapping**:
- `nx run-many --target=build` → `turbo run build`
- `nx run app:build` → `turbo run build --filter=app`
- `nx affected --target=build` → `turbo run build --filter='...[origin/main]'`

**For complete migration guide**: Load `references/migration-guide.md` when migrating from Lerna or Nx, including detailed steps, configuration conversion, and common pitfalls.

---

## When to Load References

Load reference files when working on specific aspects of Turborepo:

### configuration-guide.md
Load when:
- **Task-based**: Configuring turbo.json for the first time, setting up task pipelines with complex dependencies
- **Framework-based**: Configuring framework-specific builds (Next.js, Vite, Nuxt, Remix, Astro, SvelteKit)
- **Command-based**: Using advanced command options (prune, gen, link with custom configs)
- **Problem-based**: Need detailed examples of pipeline configuration, environment variable setup

### best-practices-patterns.md
Load when:
- **Project setup**: Structuring a new monorepo, organizing packages and apps
- **Optimization**: Optimizing task dependencies, cache configuration, environment variable usage
- **Architecture**: Implementing full-stack applications, shared component libraries, microfrontends, multi-platform setups
- **Team setup**: Implementing remote caching strategies, organizing scripts consistently

### advanced-filtering.md
Load when:
- **CI/CD optimization**: Implementing git-based filters to build only changed packages
- **Selective builds**: Building specific apps with dependencies, testing only affected packages
- **Complex filters**: Using dependency operators, exclude patterns, combined filters
- **Performance**: Need CI/CD optimization patterns, filter benchmarks, best practices

### ci-cd-guide.md
Load when:
- **Platform setup**: Configuring GitHub Actions, GitLab CI, CircleCI, Buildkite, Travis CI, Vercel
- **Docker**: Creating Docker builds with turbo prune, multi-stage builds
- **Remote cache**: Setting up Vercel remote cache or custom cache servers
- **Optimization**: Implementing optimization strategies, environment variable management, deployment strategies
- **Troubleshooting**: Debugging CI/CD cache issues, out-of-memory problems

### migration-guide.md
Load when:
- **Migration**: Migrating from Lerna or Nx to Turborepo
- **Conversion**: Converting lerna.json or nx.json to turbo.json
- **Coexistence**: Running Turborepo alongside Lerna or Nx temporarily
- **Pitfalls**: Understanding common migration pitfalls, rollback strategies, success metrics

### troubleshooting.md
Load when:
- **Cache issues**: Tasks not using cache, cache too large, remote cache not working
- **Dependency issues**: Internal packages not found, version mismatches
- **Task execution**: Tasks running in wrong order, dev servers not starting, tasks skipping unexpectedly
- **Performance**: Builds taking too long, out of memory in CI
- **CI/CD issues**: Cache not persisting, environment variable problems
- **Docker**: Docker builds failing, multi-stage build issues

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

### Detailed Guides (6 references)

- `references/configuration-guide.md` - Complete configuration, commands, framework setups
- `references/best-practices-patterns.md` - Best practices, architectural patterns
- `references/advanced-filtering.md` - Complete filtering guide
- `references/ci-cd-guide.md` - CI/CD platform integration
- `references/migration-guide.md` - Migration from Lerna/Nx
- `references/troubleshooting.md` - Complete troubleshooting guide

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
- [ ] Test caching behavior locally
- [ ] Verify remote cache in CI
- [ ] Optimize concurrency settings

---

**Last Updated**: 2025-12-17
**Skill Version**: 2.0.0
**Turborepo Version**: 2.6.1+
**Official LLM Docs**: <https://turborepo.com/llms.txt>

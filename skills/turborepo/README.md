# Turborepo Skill

High-performance build system for JavaScript and TypeScript monorepos. This skill provides comprehensive guidance for setting up, configuring, and optimizing Turborepo monorepos with intelligent caching and task orchestration.

## Auto-Trigger Keywords

**Primary**: turborepo, turbo, monorepo, build system, task pipeline, incremental builds, remote caching, workspace

**Package Managers**: pnpm workspace, yarn workspace, npm workspace, bun workspace

**Use Cases**: monorepo setup, build optimization, task orchestration, dependency management, multi-package repository, shared packages, internal packages

**Features**: intelligent caching, task dependencies, parallel execution, remote cache, vercel cache, local cache, task graph, dependency graph

**Frameworks**: next.js monorepo, vite monorepo, nuxt monorepo, react monorepo

**Migration**: lerna migration, nx migration, migrate to turborepo

**CI/CD**: github actions turborepo, gitlab ci turborepo, docker turborepo, vercel turborepo

**Commands**: turbo run, turbo build, turbo filter, turbo prune, turbo gen

## Skill Organization

This skill uses progressive disclosure to provide fast initial loading while maintaining comprehensive documentation.

### Quick Reference

- **SKILL.md**: Core concepts, quick start, and essential patterns (~650 lines)

### Templates (Copy-Paste Ready)

All in `templates/` directory:

- `turbo-basic.json` - Minimal starter configuration
- `turbo-fullstack.json` - Comprehensive production config
- `turbo-nextjs.json` - Next.js specific configuration
- `turbo-vite.json` - Vite specific configuration
- `github-actions.yml` - GitHub Actions CI workflow
- `gitlab-ci.yml` - GitLab CI configuration
- `Dockerfile` - Multi-stage Docker build
- `monorepo-structure.txt` - Directory structure template

### Reference Documentation

All in `references/` directory:

- `troubleshooting.md` - Complete troubleshooting guide for all common issues
- `ci-cd-guide.md` - Comprehensive CI/CD integration for all major platforms
- `migration-guide.md` - Detailed migration guides from Lerna and Nx
- `advanced-filtering.md` - Complete filtering syntax and patterns

### Automation Scripts

All in `scripts/` directory:

- `setup-monorepo.sh` - Automated monorepo creation with interactive prompts
- `link-remote-cache.sh` - Vercel remote cache setup and CI configuration guide

## When to Use This Skill

### Primary Use Cases

- Setting up monorepos with 2+ packages/apps
- Optimizing CI/CD build times (50-90% reduction typical)
- Migrating from Lerna or Nx to Turborepo
- Implementing remote caching for teams
- Building full-stack applications with shared code
- Creating component libraries with multiple apps
- Managing microfrontend architectures

### Common Scenarios

- "Set up turborepo for Next.js + shared UI library"
- "Configure remote caching with Vercel"
- "Optimize monorepo builds for GitHub Actions"
- "Create Docker builds with turbo prune"
- "Migrate Lerna monorepo to Turborepo"
- "Fix turborepo cache not working"
- "Build only changed packages in CI"
- "Set up task dependencies in monorepo"

## Official Documentation

- **Official Docs**: https://turbo.build/repo/docs
- **LLM Documentation**: https://turborepo.com/llms.txt
- **Examples**: https://github.com/vercel/turbo/tree/main/examples
- **Discord**: https://turbo.build/discord
- **GitHub**: https://github.com/vercel/turbo

## Related Skills

- **nextjs**: Next.js framework integration
- **typescript-mcp**: TypeScript tooling and configuration
- **github-project-automation**: CI/CD workflows and automation
- **cloudflare-workers**: Deploy monorepo apps to Cloudflare
- **drizzle-orm-d1**: Shared database packages in monorepos

## Version Information

- **Current Stable**: 2.3.0+ (as of 2025-11)
- **Minimum Required**: 2.0.0
- **Node.js Required**: 18.0.0+
- **Last Verified**: 2025-11-19

## Quick Start (30 Seconds)

### Create New Monorepo

```bash
bunx create-turbo@latest my-monorepo
cd my-monorepo
bun install
bun run dev
```

### Add to Existing Project

```bash
bun add turbo --dev
# Copy templates/turbo-basic.json to ./turbo.json
bunx turbo run build
```

See SKILL.md for detailed setup instructions.

## Performance Benefits

**Typical Improvements**:
- 50-90% faster builds in CI
- 70%+ cache hit rates with remote caching
- Parallel execution of independent tasks
- Incremental builds (only rebuild what changed)

**Real-World Example** (50-package monorepo):
- Without Turborepo: 15 minutes
- With Turborepo (local cache): 5 minutes
- With Turborepo (remote cache): 2 minutes

## Key Features

### Intelligent Caching

- **Local Cache**: Stores build artifacts on disk
- **Remote Cache**: Shares cache across team and CI
- **Content-Based**: Only rebuilds when inputs change
- **Automatic**: No configuration needed for basic caching

### Task Orchestration

- **Dependency-Aware**: Runs tasks in correct order
- **Parallel Execution**: Runs independent tasks simultaneously
- **Incremental**: Only runs affected tasks
- **Flexible**: Per-task configuration

### Advanced Filtering

- **Git-Based**: Build only changed packages
- **Pattern-Based**: Target specific workspaces
- **Dependency-Based**: Include dependencies/dependents
- **Combine Filters**: Complex targeting strategies

### CI/CD Optimization

- **Platform Support**: GitHub Actions, GitLab CI, CircleCI, etc.
- **Docker Integration**: Multi-stage builds with `turbo prune`
- **Remote Caching**: Dramatically faster CI builds
- **Smart Filtering**: Build only affected packages

## Directory Structure

```
skills/turborepo/
├── SKILL.md                          # Quick reference (~650 lines)
├── README.md                         # This file
├── templates/                        # Copy-paste configs
│   ├── turbo-basic.json
│   ├── turbo-fullstack.json
│   ├── turbo-nextjs.json
│   ├── turbo-vite.json
│   ├── github-actions.yml
│   ├── gitlab-ci.yml
│   ├── Dockerfile
│   └── monorepo-structure.txt
├── references/                       # Detailed docs
│   ├── troubleshooting.md
│   ├── ci-cd-guide.md
│   ├── migration-guide.md
│   └── advanced-filtering.md
└── scripts/                          # Automation
    ├── setup-monorepo.sh
    └── link-remote-cache.sh
```

## License

MIT

## Contributing

This skill follows the official Anthropic skills standards. See [claude-skills repository](https://github.com/secondsky/claude-skills) for contribution guidelines.

---

**Last Updated**: 2025-11-19
**Skill Version**: 1.0.0
**Turborepo Version**: 2.3.0+

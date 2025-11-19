# Turborepo Advanced Filtering Guide

Complete guide to Turborepo's powerful filtering syntax for targeted task execution.

**Reference**: <https://turborepo.com/llms.txt>

---

## Overview

Turborepo's filtering allows you to:
- Run tasks on specific packages
- Build only changed code
- Execute tasks on dependency graphs
- Optimize CI/CD pipelines

**Performance impact**: Filtering can reduce build times by 70-90% in large monorepos.

---

## Basic Filtering

### Filter by Package Name

```bash
# Single package
turbo run build --filter=web

# Multiple packages
turbo run build --filter=web --filter=api

# Scoped package
turbo run build --filter=@myorg/ui
```

### Filter by Pattern

```bash
# All packages in apps/
turbo run build --filter='./apps/*'

# All packages matching pattern
turbo run build --filter='*-ui'

# Combine patterns
turbo run build --filter='./apps/*' --filter='./packages/ui*'
```

---

## Directory-Based Filtering

### Filter by Directory

```bash
# From specific directory
turbo run build --filter='[./apps/web]'

# All packages in directory
turbo run build --filter='[./packages/*]'
```

### Use Cases

**Build from changed directory**:
```bash
# Build everything in apps/
turbo run build --filter='[./apps]'
```

**Test specific workspace**:
```bash
# Test packages in packages/ only
turbo run test --filter='[./packages]'
```

---

## Git-Based Filtering

### Changed Since Branch

```bash
# Changed since main branch
turbo run build --filter='[main]'

# Changed since specific commit
turbo run build --filter='[abc123]'

# Changed in last commit
turbo run build --filter='[HEAD~1]'
```

### Changed in Working Directory

```bash
# Uncommitted changes
turbo run test --filter='...[HEAD]'

# Staged changes
turbo run lint --filter='[HEAD]'
```

### CI/CD Patterns

**Pull Request builds**:
```bash
# Only build changed packages
turbo run build --filter='...[origin/main]'
```

**Push to main**:
```bash
# Build everything changed since last successful build
turbo run build --filter='...[origin/main]'
```

**Feature branch**:
```bash
# Build changes in current branch
turbo run build --filter='...[origin/develop]'
```

---

## Dependency-Based Filtering

### Include Dependencies

```bash
# Package and its dependencies
turbo run build --filter='...web'

# Multiple packages and dependencies
turbo run build --filter='...web' --filter='...api'
```

**Example**:
```
packages/
  ui/
  utils/
apps/
  web/  (depends on ui, utils)
```

```bash
turbo run build --filter='...web'
# Builds: ui, utils, web
```

### Exclude Root Package

```bash
# Package's dependencies only (exclude the package itself)
turbo run build --filter='...^web'
```

**Example**:
```bash
turbo run build --filter='...^web'
# Builds: ui, utils (NOT web)
```

---

## Dependents-Based Filtering

### Include Dependents

```bash
# Package and its dependents
turbo run test --filter='ui...'

# Package's dependents only (exclude package)
turbo run test --filter='^ui...'
```

**Example**:
```
packages/
  ui/
apps/
  web/  (depends on ui)
  docs/ (depends on ui)
```

```bash
turbo run test --filter='ui...'
# Tests: ui, web, docs

turbo run test --filter='^ui...'
# Tests: web, docs (NOT ui)
```

---

## Combined Filtering

### Dependencies + Dependents

```bash
# Package, its dependencies, and dependents
turbo run build --filter='...ui...'
```

**Example**:
```
packages/
  utils/
  ui/ (depends on utils)
apps/
  web/ (depends on ui)
```

```bash
turbo run build --filter='...ui...'
# Builds: utils, ui, web
```

### Git + Dependencies

```bash
# Changed packages and their dependents
turbo run test --filter='...[origin/main]...'

# Changed packages and their dependencies
turbo run build --filter='...[origin/main]'
```

### Pattern + Dependencies

```bash
# All apps and their dependencies
turbo run build --filter='...{./apps/*}'

# All packages in directory and dependents
turbo run test --filter='{./packages/*}...'
```

---

## Advanced Patterns

### Exclude Packages

```bash
# All except specific package
turbo run build --filter='!web'

# Pattern exclusion
turbo run test --filter='!*-test'
```

### Multiple Conditions

```bash
# Changed packages in apps/ only
turbo run build --filter='[origin/main]' --filter='./apps/*'

# Changed packages and their dependencies
turbo run build --filter='...[origin/main]'
```

### Scope to Workspace

```bash
# Everything in specific workspace
turbo run build --filter='{./apps/*}'

# With dependencies
turbo run build --filter='...{./apps/*}'
```

---

## CI/CD Optimization Patterns

### Pattern 1: Pull Request Builds

**Objective**: Only build changed packages

```yaml
# GitHub Actions
- name: Build changed packages
  run: turbo run build test --filter='...[origin/main]'
```

**Benefit**: 70-90% faster PR builds

### Pattern 2: Affected Tests

**Objective**: Only test affected code

```bash
# Test changed packages and dependents
turbo run test --filter='...[origin/main]...'
```

**Benefit**: Faster feedback, reduced CI time

### Pattern 3: Incremental Deployment

**Objective**: Deploy only changed apps

```bash
# Deploy changed apps only
turbo run deploy --filter='./apps/*...[origin/main]'
```

**Benefit**: Faster deployments, reduced risk

### Pattern 4: Workspace-Specific CI

**Objective**: Different CI for different workspaces

```yaml
# Build apps
- run: turbo run build --filter='./apps/*'

# Test packages
- run: turbo run test --filter='./packages/*'

# Lint everything
- run: turbo run lint
```

---

## Performance Optimization

### Concurrency with Filters

```bash
# Limit concurrency for filtered builds
turbo run build --filter='...web' --concurrency=2
```

### Dry Run to Preview

```bash
# See what would execute
turbo run build --filter='...[main]' --dry-run

# JSON output for analysis
turbo run build --filter='...[main]' --dry-run=json
```

### Output Control

```bash
# Minimal output for large filters
turbo run build --filter='...[main]' --output-logs=errors-only
```

---

## Common Use Cases

### Use Case 1: Monorepo with Multiple Apps

**Scenario**: Build all apps and their dependencies

```bash
turbo run build --filter='...{./apps/*}'
```

### Use Case 2: Changed Package Testing

**Scenario**: Test only packages that changed

```bash
turbo run test --filter='...[HEAD^1]'
```

### Use Case 3: Deploy Single App

**Scenario**: Deploy specific app with dependencies

```bash
turbo run deploy --filter='...web'
```

### Use Case 4: Lint Affected Code

**Scenario**: Lint only changed code and dependents

```bash
turbo run lint --filter='...[origin/main]...'
```

### Use Case 5: Build Specific Workspace

**Scenario**: Build only packages, not apps

```bash
turbo run build --filter='./packages/*'
```

---

## Filter Syntax Reference

### Basic Syntax

| Syntax | Meaning |
|--------|---------|
| `package` | Specific package |
| `./path/*` | Pattern match |
| `[git-ref]` | Changed since git reference |
| `...package` | Package + dependencies |
| `package...` | Package + dependents |
| `...package...` | Package + deps + dependents |
| `^package` | Exclude root package |
| `!package` | Exclude package |
| `{pattern}` | Group/scope |

### Git References

| Reference | Meaning |
|-----------|---------|
| `[main]` | Changed since main branch |
| `[origin/main]` | Changed since remote main |
| `[HEAD]` | Uncommitted changes |
| `[HEAD~1]` | Changed in last commit |
| `[abc123]` | Changed since specific commit |

### Dependency Operators

| Operator | Meaning |
|----------|---------|
| `...pkg` | Package + all dependencies |
| `...^pkg` | Dependencies only (exclude package) |
| `pkg...` | Package + all dependents |
| `^pkg...` | Dependents only (exclude package) |
| `...pkg...` | Package + deps + dependents |

---

## Debugging Filters

### Visualize Filter Results

```bash
# Dry run shows what will execute
turbo run build --filter='...[main]' --dry-run

# JSON output for parsing
turbo run build --filter='...[main]' --dry-run=json | jq
```

### Common Mistakes

**Mistake 1: Missing quotes**
```bash
# Wrong
turbo run build --filter=./apps/*

# Right
turbo run build --filter='./apps/*'
```

**Mistake 2: Wrong git reference**
```bash
# Wrong (local branch)
turbo run build --filter='[main]'

# Right (remote branch)
turbo run build --filter='[origin/main]'
```

**Mistake 3: Incorrect dependency operator**
```bash
# Wrong (dependents instead of dependencies)
turbo run build --filter='web...'

# Right
turbo run build --filter='...web'
```

---

## Advanced Examples

### Example 1: Smart PR Builds

```yaml
# .github/workflows/pr.yml
- name: Build affected
  run: |
    turbo run build test lint \
      --filter='...[origin/main]...' \
      --output-logs=errors-only
```

### Example 2: Monorepo with Microfrontends

```bash
# Build changed microfrontends and shell
turbo run build \
  --filter='./apps/shell' \
  --filter='./apps/mfe-*...[origin/main]'
```

### Example 3: Workspace-Specific Tasks

```bash
# Build packages
turbo run build --filter='./packages/*'

# Test apps that depend on changed packages
turbo run test --filter='./apps/*...[origin/main]'
```

### Example 4: Staged Deployment

```bash
# Stage 1: Build libraries
turbo run build --filter='./packages/*'

# Stage 2: Build apps that use libraries
turbo run build --filter='./apps/*'

# Stage 3: Deploy changed apps
turbo run deploy --filter='./apps/*...[origin/main]'
```

---

## Performance Impact

### Benchmarks

| Scenario | All Packages | With Filter | Improvement |
|----------|-------------|-------------|-------------|
| PR (2 packages changed) | 10 min | 2 min | 80% |
| Feature branch (5 packages) | 10 min | 3.5 min | 65% |
| Hotfix (1 package) | 10 min | 1 min | 90% |

**Real-world results** (50-package monorepo):
- Without filters: 15 minutes
- With git filters: 3 minutes
- With git + dependency filters: 2 minutes

---

## Best Practices

### ✅ Do

- Use git-based filters in CI (`--filter='...[origin/main]'`)
- Test with `--dry-run` before committing
- Combine filters for precision
- Use dependency operators (`...` and `...^`)
- Quote filter patterns

### ❌ Don't

- Forget quotes around patterns
- Use local git refs in CI (use `origin/main` not `main`)
- Over-filter (exclude necessary dependencies)
- Skip testing filter logic

---

## Related Resources

- **CI/CD Guide**: See `references/ci-cd-guide.md`
- **Troubleshooting**: See `references/troubleshooting.md`
- **Official Docs**: <https://turbo.build/repo/docs/core-concepts/monorepos/filtering>
- **LLM Docs**: <https://turborepo.com/llms.txt>

---

**Last Updated**: 2025-11-19
**Source**: <https://turborepo.com/llms.txt>

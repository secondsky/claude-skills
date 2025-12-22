# Advanced GitHub Automation Configurations

Advanced patterns and configurations for experienced GitHub Actions users.

**Last Updated**: 2025-12-17

---

## Table of Contents

1. [GitHub Projects v2 Integration](#github-projects-v2-integration)
2. [Reusable Workflows](#reusable-workflows)
3. [Composite Actions](#composite-actions)
4. [Advanced Matrix Strategies](#advanced-matrix-strategies)
5. [Workflow Optimization Techniques](#workflow-optimization-techniques)
6. [Advanced Secrets Management](#advanced-secrets-management)

---

## GitHub Projects v2 Integration

### Status
**Researched, not implemented** (see `/planning/github-projects-poc-findings.md`)

### Why Separate Skill?
- Complex GraphQL API requiring ID management
- Niche use case (team projects with automated boards)
- Significant setup overhead vs benefit for most users

### When to Consider
Use GitHub Projects automation when:
- Team needs automated project board management
- Want to auto-assign issues to project columns
- Need custom automations beyond GitHub's built-in options

### Basic Example (Reference Only)

```yaml
# This requires additional setup and GraphQL queries
name: Add to Project

on:
  issues:
    types: [opened]

jobs:
  add-to-project:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/orgs/<org>/projects/<number>
          github-token: ${{ secrets.PROJECT_TOKEN }}
```

**Note**: Requires `PROJECT_TOKEN` with `project` scope. See official docs for full setup.

---

## Reusable Workflows

### Pattern Overview

Create workflows that can be called from other workflows, reducing duplication.

**When to use**: Common CI patterns shared across multiple repositories

### Example: Reusable Test Workflow

```yaml
# .github/workflows/reusable-test.yml (in central repo)
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      working-directory:
        required: false
        type: string
        default: '.'
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  test:
    runs-on: ubuntu-24.04
    defaults:
      run:
        working-directory: ${{ inputs.working-directory }}

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'

      - run: npm ci
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - run: npm test
      - run: npm run build
```

### Calling the Reusable Workflow

```yaml
# .github/workflows/ci.yml (in project repo)
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    uses: org/central-repo/.github/workflows/reusable-test.yml@main
    with:
      node-version: '20'
      working-directory: './packages/app'
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Benefits
- Single source of truth for common workflows
- Update once, affects all consuming repos
- Easier to maintain consistency across organization

---

## Composite Actions

### Pattern Overview

Bundle multiple steps into a single action for reuse.

**When to use**: Common setup sequences (checkout + build + test)

### Example: Setup Node with Cache

```yaml
# .github/actions/setup-node/action.yml
name: 'Setup Node with Cache'
description: 'Checkout, setup Node.js, and install dependencies'

inputs:
  node-version:
    description: 'Node.js version'
    required: true
    default: '20'

runs:
  using: "composite"
  steps:
    - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

    - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'

    - run: npm ci
      shell: bash
```

### Using Composite Action

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: ./.github/actions/setup-node
        with:
          node-version: '20'

      - run: npm test
      - run: npm run build
```

---

## Advanced Matrix Strategies

### Multi-Dimensional Matrix

```yaml
strategy:
  matrix:
    os: [ubuntu-24.04, windows-latest, macos-latest]
    node-version: [18, 20, 22]
    # Creates 9 jobs: 3 OS × 3 Node versions

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}

  - run: npm test
```

### Include/Exclude Patterns

```yaml
strategy:
  matrix:
    os: [ubuntu-24.04, windows-latest, macos-latest]
    node-version: [18, 20, 22]

    # Add experimental combinations
    include:
      - os: ubuntu-24.04
        node-version: 23  # Test upcoming version
        experimental: true

    # Exclude problematic combinations
    exclude:
      - os: windows-latest
        node-version: 18  # Windows + Node 18 has known issues

steps:
  - run: npm test
    continue-on-error: ${{ matrix.experimental || false }}
```

### Dynamic Matrix from File

```yaml
jobs:
  generate-matrix:
    runs-on: ubuntu-24.04
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4

      - id: set-matrix
        run: |
          # Read matrix from JSON file
          MATRIX=$(jq -c . < .github/test-matrix.json)
          echo "matrix=$MATRIX" >> $GITHUB_OUTPUT

  test:
    needs: generate-matrix
    runs-on: ubuntu-24.04
    strategy:
      matrix: ${{ fromJSON(needs.generate-matrix.outputs.matrix) }}
    steps:
      - run: npm test
```

---

## Workflow Optimization Techniques

### 1. Dependency Caching

```yaml
# Cache node_modules
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'  # Automatic cache

# Or manual caching
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 2. Parallel Job Execution

```yaml
jobs:
  # These run in parallel
  test:
    runs-on: ubuntu-24.04
    steps:
      - run: npm test

  lint:
    runs-on: ubuntu-24.04
    steps:
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-24.04
    steps:
      - run: npm run typecheck

  # This waits for all above
  deploy:
    needs: [test, lint, typecheck]
    runs-on: ubuntu-24.04
    steps:
      - run: npm run deploy
```

### 3. Conditional Job Execution

```yaml
jobs:
  changes:
    runs-on: ubuntu-24.04
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            frontend:
              - 'src/components/**'
              - 'src/pages/**'
            backend:
              - 'api/**'
              - 'workers/**'

  test-frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-24.04
    steps:
      - run: npm run test:frontend

  test-backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-24.04
    steps:
      - run: npm run test:backend
```

### 4. Workflow Concurrency Control

```yaml
# Cancel previous runs when new commit pushed
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# Or per-branch concurrency
concurrency:
  group: ${{ github.head_ref || github.run_id }}
  cancel-in-progress: true
```

---

## Advanced Secrets Management

### Environment-Specific Secrets

```yaml
jobs:
  deploy-staging:
    environment: staging  # Uses staging secrets
    steps:
      - run: deploy
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}  # staging API_TOKEN

  deploy-production:
    environment: production  # Uses production secrets
    steps:
      - run: deploy
        env:
          API_TOKEN: ${{ secrets.API_TOKEN }}  # production API_TOKEN
```

### OIDC for Cloud Authentication (No Long-Lived Secrets)

```yaml
jobs:
  deploy:
    runs-on: ubuntu-24.04
    permissions:
      id-token: write  # Required for OIDC
      contents: read

    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
          aws-region: us-east-1

      # Now authenticated with AWS, no keys needed!
      - run: aws s3 sync ./dist s3://my-bucket
```

### Encrypted Secrets in Repository Files

**Warning**: Do NOT store secrets in files. Use encrypted secrets via GitHub UI or CLI only.

```bash
# ✅ CORRECT - Set via gh CLI
gh secret set API_TOKEN

# ✅ CORRECT - Set via GitHub UI
# Settings → Secrets and variables → Actions → New repository secret

# ❌ NEVER DO THIS
echo "API_TOKEN=sk_live_abc123" > .env  # Committed to git!
```

---

## Performance Optimization Summary

| Technique | Time Saved | Complexity | Recommended For |
|-----------|------------|------------|-----------------|
| Dependency Caching | 30-60s per run | Low | All projects |
| Parallel Jobs | 50%+ reduction | Low | Multi-component projects |
| Conditional Execution | Varies | Medium | Monorepos |
| Reusable Workflows | Maintenance only | Medium | Organizations |
| Composite Actions | Setup time | Low | Repeated patterns |
| Artifact Sharing | Build time | Low | Multi-stage pipelines |

---

**Last Updated**: 2025-12-17
**Version**: 1.0.0

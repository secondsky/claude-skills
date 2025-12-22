# GitHub Actions Workflow Patterns

Complete guide to common GitHub Actions workflow patterns with working examples.

**Last Updated**: 2025-12-17

---

## Table of Contents

1. [Multi-Framework Matrix Testing](#multi-framework-matrix-testing)
2. [Conditional Deployment](#conditional-deployment)
3. [Artifact Upload/Download](#artifact-uploaddownload)
4. [Custom Workflow Composition](#custom-workflow-composition)
5. [Multi-Environment Deployments](#multi-environment-deployments)
6. [Skill Integration Patterns](#skill-integration-patterns)

---

## Multi-Framework Matrix Testing

### Pattern Overview

Use matrix strategy to test libraries across multiple runtime versions in parallel.

**When to use**: Libraries, CLI tools, packages supporting multiple Node.js/Python/Ruby versions

**Benefits**:
- Single workflow file for all versions
- Parallel execution (faster than sequential)
- Catches version-specific bugs early

### Example: Node.js Matrix

```yaml
name: CI - Node.js Matrix

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-24.04

    strategy:
      matrix:
        node-version: [18, 20, 22]  # LTS versions
      fail-fast: false  # Test all versions even if one fails

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'  # Cache dependencies for speed

      - run: npm ci  # Use ci (not install) for reproducible builds
      - run: npm test
      - run: npm run build
```

### Example: Python Matrix

```yaml
strategy:
  matrix:
    python-version: ['3.10', '3.11', '3.12']
    os: [ubuntu-latest, windows-latest, macos-latest]
  fail-fast: false

steps:
  - uses: actions/setup-python@0b93645e9fea7318ecaed2b359559ac225c90a2b  # v5.3.0
    with:
      python-version: ${{ matrix.python-version }}
      cache: 'pip'

  - run: pip install -e .[dev]
  - run: pytest
```

### Matrix Best Practices

```yaml
# ✅ GOOD - Specific versions
matrix:
  node-version: [18, 20, 22]  # LTS releases

# ❌ BAD - Version ranges (unpredictable)
matrix:
  node-version: [18.x, 20.x]  # Can change without warning

# ✅ GOOD - fail-fast: false for debugging
strategy:
  fail-fast: false  # See all failures, not just first

# ✅ GOOD - Cache dependencies
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Speeds up subsequent runs

# ✅ GOOD - Matrix variable reference
node-version: ${{ matrix.node-version }}  # Include matrix.

# ❌ WRONG - Missing matrix prefix
node-version: ${{ node-version }}  # ERROR: undefined variable
```

---

## Conditional Deployment

### Pattern Overview

Deploy only when specific conditions are met (e.g., push to main, not PRs).

**When to use**: Production deployments, avoiding test deployments from feature branches

### Example: Deploy on Main Push Only

```yaml
jobs:
  deploy:
    runs-on: ubuntu-24.04

    # Only deploy on push to main (not PRs, not other branches)
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

      - run: bunx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Example: Conditional Steps

```yaml
steps:
  # Always run
  - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
  - run: npm ci
  - run: npm test

  # Only deploy on main
  - name: Deploy to Production
    if: github.ref == 'refs/heads/main'
    run: npm run deploy:production

  # Only deploy on develop
  - name: Deploy to Staging
    if: github.ref == 'refs/heads/develop'
    run: npm run deploy:staging
```

### Conditional Patterns

```yaml
# Condition: Push to main only
if: github.event_name == 'push' && github.ref == 'refs/heads/main'

# Condition: PRs only (no pushes)
if: github.event_name == 'pull_request'

# Condition: Specific branch
if: github.ref == 'refs/heads/develop'

# Condition: Tag pushes only
if: startsWith(github.ref, 'refs/tags/')

# Condition: Not Dependabot PRs
if: github.actor != 'dependabot[bot]'

# Condition: Success of previous job
if: success()

# Condition: Failure of previous job
if: failure()

# Condition: Always run (even on failure)
if: always()
```

---

## Artifact Upload/Download

### Pattern Overview

Share build outputs between jobs without rebuilding.

**When to use**: Separating build and deployment, sharing test results, caching compiled assets

### Example: Build Once, Deploy Twice

```yaml
jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

      - run: npm ci
      - run: npm run build

      - uses: actions/upload-artifact@b4b15b8c7c6ac21ea08fcf65892d2ee8f75cf882  # v4.4.3
        with:
          name: build-output
          path: dist/
          retention-days: 7  # Auto-delete after 7 days

  deploy-staging:
    needs: build
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/download-artifact@fa0a91b85d4f404e444e00e005971372dc801d16  # v4.1.8
        with:
          name: build-output
          path: dist/

      - run: npm run deploy:staging  # Uses dist/ from build job

  deploy-production:
    needs: build
    runs-on: ubuntu-24.04
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@fa0a91b85d4f404e444e00e005971372dc801d16
        with:
          name: build-output
          path: dist/

      - run: npm run deploy:production  # Uses same dist/ from build job
```

### Example: Multiple Artifacts

```yaml
# Upload multiple artifacts
- uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: |
      coverage/
      test-results/
      logs/

# Download specific artifact
- uses: actions/download-artifact@v4
  with:
    name: test-results
    path: ./results
```

---

## Custom Workflow Composition

### Pattern Overview

Choose between separate workflows (easier maintenance) vs integrated workflows (fewer CI minutes).

**When to use**: Deciding optimal workflow organization for your project

### Option A: Separate Workflows (Recommended for Teams)

```
.github/workflows/
  ci.yml         # Test and build
  codeql.yml     # Security scanning
  deploy.yml     # Production deployment
```

**Pros**:
- Clear separation of concerns
- Easier to maintain
- Can have different triggers
- Failed security scan doesn't block tests

**Cons**:
- 3× checkout, 3× setup, 3× CI minutes
- More workflow files to manage

### Option B: Integrated Workflow (Recommended for Personal Projects)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-24.04
    permissions:
      contents: read
      security-events: write  # For CodeQL

    steps:
      # Shared setup (runs once)
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci

      # Test
      - run: npm test

      # CodeQL security scan
      - uses: github/codeql-action/init@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f
        with:
          languages: 'javascript-typescript'
      - uses: github/codeql-action/analyze@ea9e4e37992a54ee68a9622e985e60c8e8f12d9f

      # Build
      - run: npm run build

      # Deploy (conditional)
      - if: github.ref == 'refs/heads/main'
        run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**Pros**:
- 1× checkout, 1× setup, optimized CI minutes
- Single file to review in PRs
- Faster overall execution

**Cons**:
- Failure in one step blocks all others (use `continue-on-error` if needed)
- Less modular

---

## Multi-Environment Deployments

### Pattern Overview

Deploy to staging and production environments based on branch.

**When to use**: Teams with staging/production environments, feature branch workflows

### Example: Branch-Based Deployment

```yaml
jobs:
  deploy:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

      - name: Deploy to Staging
        if: github.ref == 'refs/heads/develop'
        run: bunx wrangler deploy --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: bunx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Example: Manual Approval for Production

```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-24.04
    steps:
      - run: bunx wrangler deploy --env staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    environment:
      name: production
      url: https://my-app.example.com
    steps:
      - run: bunx wrangler deploy --env production
```

**Note**: `environment: production` requires manual approval in GitHub settings (Settings → Environments → Add protection rules)

---

## Skill Integration Patterns

### Pattern 1: cloudflare-worker-base + GitHub Automation

When user creates new Cloudflare Worker project with CI/CD:

```bash
# User: "Create Cloudflare Worker with CI/CD"

# Step 1: cloudflare-worker-base skill creates project
# Step 2: This skill adds GitHub automation

cp templates/workflows/ci-cloudflare-workers.yml .github/workflows/deploy.yml

# Configure secrets
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

**Result**: New Worker with automated deployment on push to main

### Pattern 2: project-planning + GitHub Automation

When user uses project-planning skill to plan React app:

```bash
# User: "Plan new React app with GitHub automation"

# Step 1: project-planning generates IMPLEMENTATION_PHASES.md
# Step 2: This skill sets up GitHub automation

mkdir -p .github/{workflows,ISSUE_TEMPLATE}
cp templates/workflows/ci-react.yml .github/workflows/ci.yml
cp templates/issue-templates/*.yml .github/ISSUE_TEMPLATE/
cp templates/workflows/security-codeql.yml .github/workflows/codeql.yml
```

**Result**: Planned project with complete GitHub automation and security scanning

### Pattern 3: open-source-contributions + Contributor Setup

When preparing repository for open source contributions:

```bash
# User: "Prepare repo for open source contributions"

# Step 1: open-source-contributions skill handles CONTRIBUTING.md
# Step 2: This skill adds issue templates and workflows

cp templates/issue-templates/bug_report.yml .github/ISSUE_TEMPLATE/
cp templates/issue-templates/feature_request.yml .github/ISSUE_TEMPLATE/
cp templates/misc/CODEOWNERS .github/
```

**Result**: Contributor-friendly repository with proper automation

---

**Last Updated**: 2025-12-17
**Version**: 1.0.0

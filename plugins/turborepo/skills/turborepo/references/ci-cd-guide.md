# Turborepo CI/CD Integration Guide

Complete guide to integrating Turborepo with CI/CD platforms, including remote caching, optimization strategies, and platform-specific configurations.

**Reference**: <https://turborepo.com/llms.txt>

---

## Overview

Turborepo dramatically speeds up CI/CD pipelines through:
- **Remote caching**: Share build artifacts across machines
- **Incremental builds**: Only rebuild what changed
- **Parallel execution**: Run independent tasks simultaneously
- **Smart filtering**: Build only affected packages

**Typical improvements**:
- 50-90% faster builds
- Reduced compute costs
- Consistent builds across environments

---

## GitHub Actions

### Basic Setup

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npx turbo run build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Test
        run: npx turbo run test
```

### Optimized Setup with Caching

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch all history for git filters

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'  # Cache npm dependencies

      - name: Cache Turbo
        uses: actions/cache@v3
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npx turbo run build --filter='...[origin/main]'
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - name: Test
        run: npx turbo run test --filter='...[origin/main]'

      - name: Lint
        run: npx turbo run lint --filter='...[origin/main]'
```

### Matrix Strategy (Multiple Node Versions)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm ci
      - run: npx turbo run build test
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

### Monorepo with Multiple Apps

```yaml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - run: npm ci

      # Build all apps
      - name: Build apps
        run: npx turbo run build --filter='./apps/*'
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      # Deploy web app
      - name: Deploy web
        if: github.ref == 'refs/heads/main'
        run: npx turbo run deploy --filter=web
```

---

## GitLab CI

### Basic Setup

```yaml
image: node:18

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .turbo/

build:
  stage: build
  script:
    - npm install
    - npx turbo run build
  variables:
    TURBO_TOKEN: $TURBO_TOKEN
    TURBO_TEAM: $TURBO_TEAM
```

### Multi-Stage Pipeline

```yaml
image: node:18

stages:
  - build
  - test
  - deploy

cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
    - .turbo/

build:
  stage: build
  script:
    - npm ci
    - npx turbo run build --filter='...[origin/main]'
  variables:
    TURBO_TOKEN: $TURBO_TOKEN
    TURBO_TEAM: $TURBO_TEAM
  artifacts:
    paths:
      - apps/*/dist
      - packages/*/dist
    expire_in: 1 hour

test:
  stage: test
  script:
    - npm ci
    - npx turbo run test --filter='...[origin/main]'
  variables:
    TURBO_TOKEN: $TURBO_TOKEN
    TURBO_TEAM: $TURBO_TEAM

deploy:
  stage: deploy
  script:
    - npx turbo run deploy --filter=web
  only:
    - main
```

---

## CircleCI

### Basic Setup

```yaml
version: 2.1

jobs:
  build:
    docker:
      - image: cimg/node:18.0

    steps:
      - checkout

      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-

      - run: npm ci

      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}

      - run:
          name: Build
          command: npx turbo run build
          environment:
            TURBO_TOKEN: $TURBO_TOKEN
            TURBO_TEAM: $TURBO_TEAM

      - run: npx turbo run test

workflows:
  version: 2
  build-test:
    jobs:
      - build
```

---

## Buildkite

### Basic Setup

```yaml
steps:
  - label: ":turborepo: Build"
    command: |
      npm ci
      npx turbo run build test
    env:
      TURBO_TOKEN: ${TURBO_TOKEN}
      TURBO_TEAM: ${TURBO_TEAM}
    plugins:
      - docker#v3.8.0:
          image: "node:18"
```

---

## Travis CI

### Basic Setup

```yaml
language: node_js
node_js:
  - 18

cache:
  directories:
    - node_modules
    - .turbo

script:
  - npm ci
  - npx turbo run build test

env:
  global:
    - TURBO_TOKEN=$TURBO_TOKEN
    - TURBO_TEAM=$TURBO_TEAM
```

---

## Vercel

### Automatic Integration

Vercel automatically detects and optimizes Turborepo:

```json
// vercel.json
{
  "buildCommand": "turbo run build --filter={apps/web}...",
  "ignoreCommand": "npx turbo-ignore"
}
```

### turbo-ignore

Skip builds when package unchanged:

```json
// package.json (in app)
{
  "scripts": {
    "build": "next build"
  }
}

// vercel.json
{
  "ignoreCommand": "npx turbo-ignore"
}
```

---

## Docker

### Basic Multi-Stage Build

See `templates/Dockerfile` for complete example:

```dockerfile
FROM node:18-alpine AS base

# Prune workspace
FROM base AS builder
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

# Install dependencies
FROM base AS installer
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./
RUN npm install

# Build
COPY --from=builder /app/out/full/ .
RUN npx turbo run build --filter=web

# Runner
FROM base AS runner
COPY --from=installer /app/apps/web/.next/standalone ./
CMD node apps/web/server.js
```

### Docker Compose for Development

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    command: npx turbo run dev
```

---

## Remote Caching Setup

### Vercel Remote Cache (Recommended)

**1. Login to Vercel:**
```bash
turbo login
```

**2. Link repository:**
```bash
turbo link
```

**3. Configure CI:**
```yaml
# GitHub Actions
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

**4. Get tokens:**
- Go to Vercel dashboard
- Settings → Tokens
- Create new token
- Add as CI secrets

### Custom Remote Cache

**1. Set up cache server** (e.g., S3, GCS, custom)

**2. Configure `.turbo/config.json`:**
```json
{
  "teamid": "team_123",
  "apiurl": "https://cache.example.com",
  "token": "your-token"
}
```

**3. Set environment variables:**
```bash
export TURBO_API="https://cache.example.com"
export TURBO_TOKEN="your-token"
export TURBO_TEAM="team_123"
```

---

## Optimization Strategies

### 1. Use Git-Based Filtering

Only build changed packages:

```bash
# In CI
turbo run build --filter='...[origin/main]'

# For PRs
turbo run build --filter='...[HEAD^1]'
```

### 2. Cache Dependencies

**GitHub Actions:**
```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

**GitLab CI:**
```yaml
cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
    - .turbo/
```

### 3. Parallel Execution

```yaml
# GitHub Actions
jobs:
  build:
    strategy:
      matrix:
        package: [web, api, docs]
    steps:
      - run: npx turbo run build --filter=${{ matrix.package }}
```

### 4. Limit Concurrency

For resource-constrained CI:

```bash
turbo run build --concurrency=2
```

### 5. Use Continue on Error

Don't fail fast in tests:

```bash
turbo run test --continue
```

### 6. Optimize Output Logs

```bash
# Only show errors
turbo run build --output-logs=errors-only

# Only show new output
turbo run build --output-logs=new-only

# Only show hash (fastest)
turbo run build --output-logs=hash-only
```

---

## Environment Variables in CI

### Secrets Management

**GitHub Actions:**
```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**GitLab CI:**
```yaml
variables:
  TURBO_TOKEN: $TURBO_TOKEN
  TURBO_TEAM: $TURBO_TEAM
```

### Declare in turbo.json

```json
{
  "globalEnv": ["NODE_ENV", "CI"],
  "pipeline": {
    "build": {
      "env": ["DATABASE_URL", "API_URL"],
      "passThroughEnv": ["DEBUG"]
    }
  }
}
```

---

## Monorepo Deployment Strategies

### Strategy 1: Deploy All Apps

```yaml
steps:
  - run: npx turbo run deploy --filter='./apps/*'
```

### Strategy 2: Deploy Specific App

```yaml
steps:
  - run: npx turbo run deploy --filter=web
```

### Strategy 3: Deploy Changed Apps

```yaml
steps:
  - run: npx turbo run deploy --filter='./apps/*...[origin/main]'
```

### Strategy 4: Conditional Deploy

```yaml
jobs:
  deploy-web:
    if: contains(github.event.head_commit.modified, 'apps/web/')
    steps:
      - run: npx turbo run deploy --filter=web
```

---

## Troubleshooting CI/CD

### Cache Not Working

1. Verify environment variables:
```bash
echo $TURBO_TOKEN
echo $TURBO_TEAM
```

2. Check connection:
```bash
turbo run build --output-logs=hash-only
```

3. Test locally:
```bash
turbo login
turbo link
turbo run build
```

### Builds Too Slow

1. Use filters:
```bash
turbo run build --filter='...[origin/main]'
```

2. Enable remote cache:
```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

3. Cache dependencies:
```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
```

### Out of Memory

1. Limit concurrency:
```bash
turbo run build --concurrency=1
```

2. Increase Node memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" turbo run build
```

---

## Best Practices

### ✅ Do

- Enable remote caching for all environments
- Use git-based filters to reduce builds
- Cache node_modules in CI
- Set concurrency limits appropriately
- Use `--output-logs=errors-only` for cleaner logs
- Declare all environment variables in turbo.json
- Use `turbo prune` for Docker builds

### ❌ Don't

- Skip remote caching (huge performance loss)
- Build all packages when only some changed
- Forget to declare env vars (causes cache misses)
- Use `--force` in CI (defeats caching)
- Run unnecessary tasks in parallel (resource waste)

---

## Performance Benchmarks

Typical improvements with Turborepo + remote cache:

| Project Size | Without Turbo | With Turbo | Improvement |
|-------------|---------------|------------|-------------|
| Small (5 packages) | 3 min | 45 sec | 75% faster |
| Medium (15 packages) | 8 min | 1.5 min | 81% faster |
| Large (50+ packages) | 25 min | 3 min | 88% faster |

**Note**: Results vary based on:
- Number of packages
- Task dependencies
- Cache hit rate
- CI runner specs

---

## Related Resources

- **Templates**: See `templates/` for CI config examples
- **Troubleshooting**: See `references/troubleshooting.md`
- **Official Docs**: <https://turbo.build/repo/docs/ci>
- **LLM Docs**: <https://turborepo.com/llms.txt>

---

**Last Updated**: 2025-11-19
**Source**: <https://turborepo.com/llms.txt>

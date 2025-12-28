# GitHub Actions for Cloudflare Workers

Complete guide for setting up GitHub Actions CI/CD pipelines for Workers.

## Basic Workflow Structure

```yaml
name: Deploy Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Dependencies
        run: bun install

      - name: Run Tests
        run: bun test

      - name: Deploy
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

## Multi-Environment Deployments

### Separate Workflows Approach

**`.github/workflows/deploy-staging.yml`**:
```yaml
name: Deploy Staging

on:
  push:
    branches: [develop, 'feature/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://my-worker-staging.workers.dev

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test

      - name: Deploy to Staging
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env staging
```

**`.github/workflows/deploy-production.yml`**:
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://my-worker.workers.dev

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test
      - run: bun run build

      - name: Deploy to Production
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env production

      - name: Verify Deployment
        run: |
          sleep 5
          curl -f https://my-worker.workers.dev/health || exit 1
```

### Single Workflow with Conditions

```yaml
name: Deploy

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env production

      - name: Deploy to Staging
        if: github.ref == 'refs/heads/develop'
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env staging
```

## Preview Deployments for Pull Requests

```yaml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      deployments: write

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test

      - name: Deploy Preview
        id: deploy
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env preview-${{ github.event.number }}

      - name: Comment Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = context.issue.number;
            const previewUrl = `https://my-worker-preview-${prNumber}.workers.dev`;

            github.rest.issues.createComment({
              issue_number: prNumber,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `✅ **Preview Deployment**\n\n🔗 ${previewUrl}\n\nDeployed commit: ${context.sha.substring(0, 7)}`
            });
```

### Cleanup Preview on PR Close

```yaml
name: Cleanup Preview

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Delete Preview Deployment
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: delete --name my-worker-preview-${{ github.event.number }}
```

## Deployment Approvals

### GitHub Environments

Configure in: Settings → Environments → New environment

**Create "production" environment with:**
- Required reviewers: Team leads, DevOps
- Wait timer: 5 minutes (optional)
- Deployment branches: Only `main`

**Workflow**:
```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production # Requires approval
      url: https://my-worker.workers.dev

    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env production
```

## Matrix Builds

Test across multiple Node versions:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        bun-version: [latest, '1.1.0']

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: ${{ matrix.bun-version }}

      - run: bun install
      - run: bun test
```

## Secrets Management

### Setting Secrets

1. Go to: Repository → Settings → Secrets → Actions
2. Click "New repository secret"
3. Add:
   - `CLOUDFLARE_API_TOKEN`
   - `DATABASE_URL`
   - `STRIPE_SECRET_KEY`
   - etc.

### Using Secrets in Workflows

```yaml
- name: Deploy with Secrets
  uses: cloudflare/wrangler-action@v4
  with:
    api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}

- name: Set Environment Variables
  run: |
    echo "${{ secrets.DATABASE_URL }}" | bunx wrangler secret put DATABASE_URL --env production
    echo "${{ secrets.STRIPE_SECRET_KEY }}" | bunx wrangler secret put STRIPE_SECRET_KEY --env production
```

### Environment-Specific Secrets

**Organization/Repository Secrets** (Settings → Secrets):
- `CLOUDFLARE_API_TOKEN` (used in all workflows)

**Environment Secrets** (Settings → Environments → production → Secrets):
- `DATABASE_URL_PRODUCTION`
- `STRIPE_SECRET_KEY_PRODUCTION`

**Usage**:
```yaml
jobs:
  deploy:
    environment: production # Automatically loads environment secrets
    steps:
      - run: |
          echo "${{ secrets.DATABASE_URL_PRODUCTION }}" | \
            bunx wrangler secret put DATABASE_URL --env production
```

## Caching Strategies

### Bun Cache (Automatic)

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: latest
# Bun automatically caches dependencies
```

### Manual Caching

```yaml
- name: Cache Dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.bun/install/cache
      node_modules
    key: ${{ runner.os }}-bun-${{ hashFiles('bun.lockb') }}
    restore-keys: |
      ${{ runner.os }}-bun-
```

## Notifications

### Slack Notifications

```yaml
- name: Notify Slack on Success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "✅ Deployment successful: ${{ github.sha }}"
      }

- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "❌ Deployment failed: ${{ github.sha }}"
      }
```

### Discord Notifications

```yaml
- name: Discord Notification
  uses: Ilshidur/action-discord@master
  env:
    DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK }}
  with:
    args: 'Deployed {{ EVENT_PAYLOAD.repository.full_name }} to production'
```

## Advanced Patterns

### Conditional Deployment Based on Changed Files

```yaml
- name: Check for Worker Changes
  id: changes
  uses: dorny/paths-filter@v3
  with:
    filters: |
      worker:
        - 'src/**'
        - 'wrangler.jsonc'

- name: Deploy if Worker Changed
  if: steps.changes.outputs.worker == 'true'
  uses: cloudflare/wrangler-action@v4
  with:
    api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy
```

### Deployment with Retries

```yaml
- name: Deploy with Retry
  uses: nick-fields/retry-action@v3
  with:
    timeout_minutes: 10
    max_attempts: 3
    retry_wait_seconds: 30
    command: bunx wrangler deploy --env production
```

### Parallel Deployments

```yaml
jobs:
  deploy-multiple-workers:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        worker: [api, frontend, worker3]

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install

      - name: Deploy ${{ matrix.worker }}
        working-directory: workers/${{ matrix.worker }}
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

## Troubleshooting

### Debug Mode

```yaml
- name: Enable Wrangler Debug
  run: WRANGLER_LOG=debug bunx wrangler deploy
```

### View Full Logs

Enable debug logging for GitHub Actions:

1. Repository → Settings → Secrets → New secret
2. Name: `ACTIONS_STEP_DEBUG`, Value: `true`

### Common Issues

**Error: "Repository not found"**
- Fix: Add `contents: read` permission to job

**Error: "Resource not accessible by integration"**
- Fix: Add `pull-requests: write` permission

**Deployment hangs**
- Fix: Add timeout: `timeout-minutes: 10`

## Resources

- GitHub Actions Docs: https://docs.github.com/actions
- Wrangler Action: https://github.com/cloudflare/wrangler-action
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/

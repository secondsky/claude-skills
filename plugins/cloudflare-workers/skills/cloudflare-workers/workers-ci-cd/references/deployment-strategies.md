# Deployment Strategies for Cloudflare Workers

Advanced deployment patterns for safe, reliable Workers releases.

## Blue-Green Deployment

Deploy new version alongside old, then switch traffic atomically.

**Strategy**:
1. Deploy new version to "green" environment
2. Test green environment
3. Switch traffic from "blue" to "green"
4. Keep blue as instant rollback option

**Implementation**:
```yaml
# .github/workflows/blue-green.yml
name: Blue-Green Deployment

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  deploy-green:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test

      # Deploy to green environment
      - name: Deploy Green
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env green

      # Test green environment
      - name: Smoke Test Green
        run: |
          sleep 10
          curl -f https://my-worker-green.workers.dev/health || exit 1

  switch-traffic:
    needs: deploy-green
    runs-on: ubuntu-latest
    environment:
      name: production # Manual approval required
    steps:
      # Update DNS/Route to point to green
      - name: Switch to Green
        run: |
          # Update Cloudflare route to green worker
          curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${{ secrets.ZONE_ID }}/workers/routes/${{ secrets.ROUTE_ID }}" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"script":"my-worker-green"}'

      - name: Verify Production
        run: |
          sleep 5
          curl -f https://my-worker.workers.dev/health || exit 1
```

## Canary Deployment

Gradually roll out new version to percentage of traffic.

**Strategy**:
1. Deploy canary version
2. Route 10% traffic to canary
3. Monitor metrics (errors, latency)
4. Incrementally increase to 25%, 50%, 100%
5. Rollback if issues detected

**Implementation**:
```yaml
# .github/workflows/canary.yml
name: Canary Deployment

on:
  workflow_dispatch:
    inputs:
      percentage:
        description: 'Traffic percentage (10, 25, 50, 100)'
        required: true
        default: '10'

jobs:
  canary-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install

      # Deploy canary version
      - name: Deploy Canary
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env canary

      # Configure traffic split via Cloudflare Load Balancer
      - name: Set Traffic Split
        run: |
          PERCENTAGE=${{ github.event.inputs.percentage }}
          STABLE=$((100 - PERCENTAGE))

          curl -X PUT "https://api.cloudflare.com/client/v4/zones/${{ secrets.ZONE_ID }}/load_balancers/${{ secrets.LB_ID }}" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{
              "default_pools": [
                {"id": "${{ secrets.CANARY_POOL_ID }}", "weight": '$PERCENTAGE'},
                {"id": "${{ secrets.STABLE_POOL_ID }}", "weight": '$STABLE'}
              ]
            }'

      - name: Monitor Canary
        run: |
          echo "Monitoring canary deployment at ${{ github.event.inputs.percentage }}%"
          echo "Check metrics: https://dash.cloudflare.com/analytics"
```

## Rolling Deployment

Deploy to workers one at a time (useful for multi-region setups).

**Strategy**:
1. Deploy to first worker
2. Verify health
3. Deploy to next worker
4. Repeat until all updated

**Implementation**:
```yaml
name: Rolling Deployment

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      max-parallel: 1 # Deploy one at a time
      matrix:
        worker: [worker-1, worker-2, worker-3]
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

      - name: Health Check
        run: |
          sleep 5
          curl -f https://${{ matrix.worker }}.workers.dev/health || exit 1

      - name: Wait Before Next
        run: sleep 30
```

## Feature Flag Deployment

Deploy new code behind feature flags, enable gradually.

**Implementation**:

**Worker Code**:
```typescript
export default {
  async fetch(request: Request, env: Env) {
    // Check feature flag in KV
    const newFeatureEnabled = await env.KV.get('feature:new-feature');

    if (newFeatureEnabled === 'true') {
      return handleNewFeature(request);
    }

    return handleOldFeature(request);
  }
}
```

**Enable Feature**:
```yaml
name: Enable Feature

on:
  workflow_dispatch:
    inputs:
      feature:
        description: 'Feature flag name'
        required: true
      enabled:
        description: 'Enable (true/false)'
        required: true

jobs:
  toggle-feature:
    runs-on: ubuntu-latest
    steps:
      - name: Set Feature Flag
        run: |
          bunx wrangler kv:key put \
            --namespace-id=${{ secrets.KV_NAMESPACE_ID }} \
            "feature:${{ github.event.inputs.feature }}" \
            "${{ github.event.inputs.enabled }}"
```

## Rollback Strategies

### Instant Rollback

Keep previous version deployed, switch back immediately:

```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment:
      name: production-rollback
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - uses: oven-sh/setup-bun@v2
      - run: bun install

      - name: Deploy Previous Version
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env production

      - name: Verify Rollback
        run: curl -f https://my-worker.workers.dev/health || exit 1
```

### Automated Rollback on Failure

```yaml
- name: Deploy
  id: deploy
  uses: cloudflare/wrangler-action@v4
  with:
    api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: deploy

- name: Verify Deployment
  id: verify
  run: |
    sleep 5
    curl -f https://my-worker.workers.dev/health || exit 1

- name: Rollback on Failure
  if: failure() && steps.deploy.outcome == 'success'
  uses: cloudflare/wrangler-action@v4
  with:
    api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: rollback
```

## Deployment Verification

### Health Checks

```bash
#!/bin/bash
# health-check.sh

WORKER_URL="https://my-worker.workers.dev"
MAX_RETRIES=5
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
  echo "Health check attempt $i/$MAX_RETRIES..."

  if curl -f "$WORKER_URL/health"; then
    echo "✅ Health check passed"
    exit 0
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    echo "❌ Health check failed, retrying in ${RETRY_DELAY}s..."
    sleep $RETRY_DELAY
  fi
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
```

### Smoke Tests

```typescript
// smoke-test.ts
import { expect } from 'vitest';

const WORKER_URL = process.env.WORKER_URL || 'https://my-worker.workers.dev';

async function smokeTest() {
  // Test main endpoint
  const response = await fetch(WORKER_URL);
  expect(response.status).toBe(200);

  // Test API endpoint
  const apiResponse = await fetch(`${WORKER_URL}/api/health`);
  expect(apiResponse.status).toBe(200);

  // Test authentication
  const authResponse = await fetch(`${WORKER_URL}/api/protected`, {
    headers: { Authorization: 'Bearer test-token' }
  });
  expect(authResponse.status).toBe(401); // Should reject invalid token

  console.log('✅ All smoke tests passed');
}

smokeTest().catch(err => {
  console.error('❌ Smoke tests failed:', err);
  process.exit(1);
});
```

## Best Practices

1. **Always test before switching traffic**
2. **Keep rollback option ready** (blue-green, previous version)
3. **Monitor metrics during rollout** (error rate, latency)
4. **Use gradual rollout** for risky changes (canary, feature flags)
5. **Automate health checks** after deployment
6. **Document rollback procedure** for on-call engineers

## Resources

- Cloudflare Load Balancer: https://developers.cloudflare.com/load-balancing/
- Workers Versioning: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/

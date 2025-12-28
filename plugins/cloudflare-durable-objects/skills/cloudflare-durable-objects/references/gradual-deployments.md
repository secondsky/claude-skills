# Gradual Deployments for Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: [Gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)

## Overview

Gradual Deployments allow you to **incrementally deploy new versions of Workers by splitting traffic across versions**. This enables phased rollouts, A/B testing, and safer deployments by reducing the risk of immediate full transitions.

**Key Benefits**:
- Reduce deployment risk with incremental rollouts
- Monitor error rates across versions before full deployment
- Rollback quickly if issues arise
- Test production versions with real traffic before 100% rollout

**Requirements**:
- Wrangler 3.40.0+
- Workers Paid plan

---

## Core Concepts

### Traffic Splitting

Split traffic between Worker versions based on percentage:

```
Version 1 (stable): 90% of traffic
Version 2 (canary): 10% of traffic
```

### Version Affinity

Requests from the same user/session consistently hit the same version to prevent version skew:

```
User A → Always Version 1
User B → Always Version 2
User C → Always Version 1
```

### Version Overrides

Force specific requests to a particular version for testing:

```
curl -H 'Cloudflare-Workers-Version-Overrides: my-worker="VERSION_ID"'
```

---

## How Gradual Deployments Work

### 1. Version Assignment

- **Per-Request (Default)**: Each request is randomly routed based on percentage
- **With Affinity**: Requests with same `Cloudflare-Workers-Version-Key` header hit same version

### 2. Durable Objects Behavior

**CRITICAL**: Durable Objects have special behavior during gradual deployments:

- **Only one version of each DO runs at a time**
- Each DO instance receives a fixed version when first accessed
- Version assignment persists until next deployment
- DO version is assigned based on configured percentages
- Migrations CANNOT be uploaded as versions (must be deployed directly)

### 3. Deployment Flow

```
1. Upload new version (npx wrangler versions upload)
2. Deploy with traffic split (npx wrangler versions deploy)
3. Monitor metrics and errors
4. Gradually increase percentage to new version
5. Deploy at 100% when stable
```

---

## Wrangler CLI Implementation

### Step 1: Create Initial Worker

```bash
npm create cloudflare@latest my-worker
cd my-worker
npm install
npx wrangler deploy
```

### Step 2: Make Changes and Upload Version

```bash
# Edit src/index.ts
npx wrangler versions upload
```

**Output**:
```
Uploading Worker Version...
Worker Version ID: 8b0f8228-bb42-4cf2-9e35-a90386a8e9e3
```

### Step 3: Deploy with Traffic Split

```bash
npx wrangler versions deploy
```

**Interactive Prompts**:
```
? Select a version to deploy:
  ❯ 8b0f8228-bb42-4cf2-9e35-a90386a8e9e3 (New)
    7f9a6bc1-aa31-4b0e-be73-5a77da8920c1 (Current 100%)

? What percentage of traffic should the new version receive?
  ❯ 10%

? What percentage should the current version receive?
  ❯ 90%
```

**Result**:
```
Deployment successful!
New version: 10% traffic
Current version: 90% traffic
```

### Step 4: Monitor Metrics

```bash
# View analytics
npx wrangler tail

# Check specific version metrics in dashboard
```

### Step 5: Increase Traffic or Rollback

```bash
# Increase to 50%
npx wrangler versions deploy

# Or rollback to 100% on stable version
npx wrangler versions deploy --percentage 100 --version-id 7f9a6bc1-aa31-4b0e-be73-5a77da8920c1
```

---

## Dashboard Implementation

### Step 1: Deploy Initial Worker

1. Navigate to Workers & Pages → Create
2. Select "Hello World" template
3. Deploy

### Step 2: Create New Version

1. Click "Edit Code"
2. Make changes
3. Click "Save" (NOT "Save and Deploy")
   - This creates a new version without deploying

### Step 3: Configure Gradual Deployment

1. Navigate to "Deployments" tab
2. Click "Deploy Version"
3. Select new version from dropdown
4. Configure traffic split:
   ```
   New version: 10%
   Current version: 90%
   ```
5. Click "Deploy"

### Step 4: Monitor in Dashboard

1. Navigate to "Analytics" → "Workers"
2. Filter by version using "ScriptVersion" dimension
3. Compare error rates, latency, throughput across versions

### Step 5: Adjust Traffic or Rollback

1. Navigate to "Deployments"
2. Click "Deploy Version"
3. Adjust percentages or select different version
4. Deploy

---

## Version Affinity Implementation

### Setting Version Key

Add header to ensure requests from same user/session hit same version:

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Example 1: User-based affinity
    const userId = request.headers.get("X-User-ID");
    if (userId) {
      request.headers.set("Cloudflare-Workers-Version-Key", userId);
    }

    // Example 2: Session-based affinity
    const sessionId = url.searchParams.get("session");
    if (sessionId) {
      request.headers.set("Cloudflare-Workers-Version-Key", sessionId);
    }

    // Process request
    return new Response("Hello!");
  }
};
```

### Why Version Affinity Matters

**Without Affinity** (Problem):
```
Request 1 (User A) → Version 1 (loads asset v1)
Request 2 (User A) → Version 2 (404 - asset v1 doesn't exist)
```

**With Affinity** (Solution):
```
Request 1 (User A, Key: user-123) → Version 1
Request 2 (User A, Key: user-123) → Version 1 (consistent)
```

**Use Cases**:
- Static assets (prevent 404s)
- Session state (prevent version skew)
- WebSocket connections (maintain connection to same version)
- Multi-request workflows (checkout, auth flows)

---

## Version Overrides for Testing

### Testing Specific Version

Override version for testing before broader rollout:

```bash
# Test new version
curl -s https://my-worker.workers.dev \
  -H 'Cloudflare-Workers-Version-Overrides: my-worker="8b0f8228-bb42-4cf2-9e35-a90386a8e9e3"'

# Test old version
curl -s https://my-worker.workers.dev \
  -H 'Cloudflare-Workers-Version-Overrides: my-worker="7f9a6bc1-aa31-4b0e-be73-5a77da8920c1"'
```

### Multiple Workers Override

```bash
curl -s https://my-app.com \
  -H 'Cloudflare-Workers-Version-Overrides: worker1="VERSION_1", worker2="VERSION_2"'
```

### Use Cases

- QA testing specific version in production
- Reproduce customer issues on specific version
- Validate fixes before increasing traffic
- Test version combinations (when multiple Workers involved)

---

## Durable Objects Special Considerations

### DO Version Assignment

```typescript
// Each DO instance gets assigned a version when first accessed
const id = env.MY_DO.idFromName("user-123");
const stub = env.MY_DO.get(id);

// This DO will run on Version 1 or Version 2 based on percentage
// Assignment happens ONCE and persists until next deployment
await stub.someMethod();
```

### Migration Constraints

**CRITICAL**: Migrations CANNOT be uploaded as versions

```bash
# ❌ WRONG: Upload migration as version
npx wrangler versions upload
# Error: Cannot upload migrations as versions

# ✅ CORRECT: Deploy migrations directly
npx wrangler versions deploy --percentage 100
```

**Why**: Migrations must be atomic across all DOs. Gradual rollouts would create inconsistent state.

### Example: DO with Gradual Deployment

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.ts"

[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"
script_name = "my-worker"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["Counter"]
```

**Deployment Process**:

```bash
# 1. Deploy initial version with migration
npx wrangler deploy

# 2. Make code changes (NOT migration changes)
# Edit src/index.ts

# 3. Upload new version
npx wrangler versions upload

# 4. Deploy with gradual rollout
npx wrangler versions deploy
# New version: 10% traffic
# Old version: 90% traffic

# 5. If you need a NEW migration, deploy at 100%
# Edit migrations in wrangler.toml
npx wrangler versions deploy --percentage 100
```

### DO Version Persistence

```
Deployment 1: 10% v2, 90% v1
  DO "user-123" → Assigned to v2 (based on 10% probability)
  DO "user-456" → Assigned to v1 (based on 90% probability)

Deployment 2: 50% v2, 50% v1
  DO "user-123" → STILL v2 (doesn't change)
  DO "user-456" → STILL v1 (doesn't change)
  DO "user-789" → NEW, assigned to v2 or v1 (50/50)

Deployment 3: 100% v2
  DO "user-123" → v2 (already on v2)
  DO "user-456" → v2 (migrated from v1)
  DO "user-789" → v2 (all on v2 now)
```

---

## Monitoring & Observability

### Logpush API

Enable `ScriptVersion` in Logpush requests to identify which version handled invocations:

```json
{
  "timestamp": "2025-12-27T10:00:00Z",
  "ScriptVersion": "8b0f8228-bb42-4cf2-9e35-a90386a8e9e3",
  "status": 200,
  "duration": 45
}
```

### Version Metadata Binding

Access version ID inside Worker:

```typescript
interface Env {
  VERSION_METADATA: {
    id: string;
    tag: string;
    timestamp: string;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log(`Running on version: ${env.VERSION_METADATA.id}`);

    return new Response(
      JSON.stringify({
        version: env.VERSION_METADATA.id,
        tag: env.VERSION_METADATA.tag,
      })
    );
  }
};
```

### Dashboard Analytics

1. Navigate to Workers → Analytics
2. Filter by version:
   ```
   Dimension: ScriptVersion
   Values: [8b0f8228-bb42-4cf2-9e35-a90386a8e9e3, 7f9a6bc1-aa31-4b0e-be73-5a77da8920c1]
   ```
3. Compare metrics:
   - Error rate
   - P50/P95/P99 latency
   - Request volume
   - CPU time

---

## Best Practices

### 1. Start with Small Percentages

```bash
# Day 1: 5% canary
npx wrangler versions deploy --percentage 5

# Day 2: 10% if stable
npx wrangler versions deploy --percentage 10

# Day 3: 25% if stable
npx wrangler versions deploy --percentage 25

# Day 4: 50% if stable
npx wrangler versions deploy --percentage 50

# Day 5: 100% if stable
npx wrangler versions deploy --percentage 100
```

### 2. Monitor Before Increasing

**Key Metrics to Watch**:
- Error rate (should not increase)
- P95 latency (should not increase)
- Request volume (should match expected split)
- DO alarm failures (for DO-heavy workloads)

**Example Check**:
```
Version 1 (90%): 0.1% error rate, 50ms P95
Version 2 (10%): 0.1% error rate, 52ms P95
✅ Safe to increase Version 2 to 25%

Version 2 (10%): 1.5% error rate, 150ms P95
❌ ROLLBACK - Version 2 has issues
```

### 3. Use Version Affinity for Stateful Workloads

```typescript
// For apps with static assets
request.headers.set("Cloudflare-Workers-Version-Key", userId);

// For WebSocket apps
request.headers.set("Cloudflare-Workers-Version-Key", connectionId);

// For multi-step workflows
request.headers.set("Cloudflare-Workers-Version-Key", sessionId);
```

### 4. Test with Version Overrides First

```bash
# Test new version with override BEFORE gradual deployment
curl -H 'Cloudflare-Workers-Version-Overrides: my-worker="NEW_VERSION"' \
  https://my-worker.workers.dev

# Run integration tests against new version
npm run test:integration -- --version="NEW_VERSION"

# Only deploy if tests pass
npx wrangler versions deploy --percentage 10
```

### 5. Have Rollback Plan Ready

```bash
# Save current stable version ID
STABLE_VERSION="7f9a6bc1-aa31-4b0e-be73-5a77da8920c1"

# Deploy canary
npx wrangler versions deploy --percentage 10

# If issues, rollback immediately
npx wrangler versions deploy --percentage 100 --version-id $STABLE_VERSION
```

### 6. Deploy Migrations Separately

```bash
# ✅ GOOD: Separate migration deployments from gradual rollouts
# Step 1: Deploy migration at 100%
npx wrangler versions deploy --percentage 100  # Migration v2

# Step 2: Wait for migration to complete
# Step 3: Make code changes
# Step 4: Upload version
npx wrangler versions upload

# Step 5: Gradual rollout of code changes
npx wrangler versions deploy --percentage 10

# ❌ BAD: Trying to gradual rollout a migration
# This will fail!
```

---

## Rollback Procedures

### Immediate Rollback

```bash
# Get list of versions
npx wrangler versions list

# Rollback to stable version
npx wrangler versions deploy \
  --percentage 100 \
  --version-id 7f9a6bc1-aa31-4b0e-be73-5a77da8920c1
```

### Gradual Rollback

```bash
# Reduce new version gradually
npx wrangler versions deploy --percentage 5  # Down from 10%
npx wrangler versions deploy --percentage 0  # Remove entirely

# Or directly to 100% stable
npx wrangler versions deploy --percentage 100 --version-id STABLE_VERSION
```

### Emergency Rollback

```bash
# Skip prompts for emergency
npx wrangler versions deploy \
  --percentage 100 \
  --version-id STABLE_VERSION \
  --yes
```

---

## Static Assets Considerations

**Problem**: HTML from Version 1 references assets that only exist in Version 1

```
Request 1: GET / → Version 1 → Returns HTML with <script src="/bundle-v1.js">
Request 2: GET /bundle-v1.js → Version 2 → 404 (asset doesn't exist in v2)
```

**Solution 1**: Use Version Affinity

```typescript
// Set version key based on session
const sessionId = request.headers.get("Cookie")?.match(/session=([^;]+)/)?.[1];
if (sessionId) {
  request.headers.set("Cloudflare-Workers-Version-Key", sessionId);
}
```

**Solution 2**: Version Assets with Hashes

```typescript
// Version 1: <script src="/bundle.abc123.js">
// Version 2: <script src="/bundle.def456.js">
// Both assets exist in both versions
```

**Solution 3**: Serve Assets from External CDN

```
HTML: Worker Version 1/2
Assets: cdn.example.com (static, versioned independently)
```

---

## Sources

- [Gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)
- [Versions & Deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)
- [Gradual rollouts (static assets)](https://developers.cloudflare.com/workers/static-assets/routing/advanced/gradual-rollouts/)
- [Worker version rollback limit increased from 10 to 100](https://developers.cloudflare.com/changelog/2025-09-11-increased-version-rollback-limit/)
- [Revamped Workers Metrics](https://developers.cloudflare.com/changelog/2025-02-03-workers-metrics-revamp/)

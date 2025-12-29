---
name: cloudflare-workers:migrate
description: Platform migration assistant for moving applications from AWS Lambda, Vercel, Netlify, or Cloudflare Pages to Cloudflare Workers.
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
  - Grep
  - Glob
  - Bash
argument-hint: "--from <lambda|vercel|netlify|pages> (source platform)"
---

# Workers Migrate Command

Guided migration assistant for moving applications to Cloudflare Workers from other platforms.

## Execution Workflow

### Phase 1: Source Platform Detection

**If --from argument provided**:
- Use specified platform (lambda, vercel, netlify, pages)
- Skip detection step

**If no --from argument**:
Use AskUserQuestion:

**Question**: "Which platform are you migrating from?"
- Options:
  - AWS Lambda (serverless functions)
  - Vercel (Edge Functions, Serverless Functions)
  - Netlify (Functions, Edge Functions)
  - Cloudflare Pages (Functions)
  - Other (custom platform)

### Phase 2: Project Analysis

Scan the project to understand its structure:

**For AWS Lambda**:
1. Look for `serverless.yml` or `template.yaml` (SAM)
2. Find Lambda handler files (usually `index.js` or `handler.js`)
3. Check for AWS SDK usage:
   ```bash
   grep -r "aws-sdk" .
   grep -r "@aws-sdk" .
   ```
4. Identify runtime (Node.js, Python, etc.)
5. Check for environment variables in config
6. Identify triggers (API Gateway, S3, etc.)

**For Vercel**:
1. Look for `vercel.json` configuration
2. Find Edge Functions (`middleware.ts`) and Serverless Functions (`api/`)
3. Check framework (Next.js, SvelteKit, etc.)
4. Identify environment variables in `.env` or dashboard
5. Check for Vercel-specific features (ISR, Edge Config)

**For Netlify**:
1. Look for `netlify.toml`
2. Find Functions in `netlify/functions/` or `functions/`
3. Check for Edge Functions in `netlify/edge-functions/`
4. Identify redirects and rewrites
5. Check for Netlify-specific features (Forms, Identity)

**For Cloudflare Pages**:
1. Look for `_worker.js` or `functions/` directory
2. Check `wrangler.toml` for Pages configuration
3. Identify framework (if any)
4. Note bindings already configured

### Phase 3: Compatibility Analysis

Analyze what can be migrated automatically vs. manually:

**Compatible Features** (auto-migrate):
- HTTP request/response handling
- Environment variables → Workers env
- Basic routing
- JSON APIs
- Static file serving → Workers Static Assets

**Requires Adaptation**:
- AWS SDK → Cloudflare equivalents (S3→R2, DynamoDB→D1/KV)
- File system access → R2 or KV
- Long-running tasks (>30s) → Workflows or Queues
- WebSockets → Durable Objects with hibernation
- Cron jobs → Cron Triggers

**Incompatible** (needs redesign):
- Lambda Layers → Use npm packages
- VPC access → Use public APIs or Cloudflare Tunnels
- Container images → Bundle dependencies normally
- >10MB bundle size → Optimize or split into multiple Workers

Generate compatibility report:

```markdown
## Migration Compatibility Report

**Source Platform**: [Platform]
**Project Type**: [Type]
**Runtime**: [Runtime]

### ✅ Compatible (Auto-Migrate)
- HTTP handlers: X files found
- Environment variables: X found
- Static assets: X files

### ⚠️ Requires Adaptation
- AWS S3 usage → Migrate to R2
- DynamoDB → Migrate to D1 or KV
- File uploads → Use R2 with multipart
- Scheduled tasks → Convert to Cron Triggers

### ❌ Incompatible (Manual Redesign)
- Lambda Layers → Install as npm packages
- VPC endpoints → Use Hyperdrive for database access

### Estimated Effort
- Auto-migration: ~30 minutes
- Manual adaptation: ~2-4 hours
- Testing & validation: ~1 hour
```

### Phase 4: Migration Strategy

Ask user about migration approach:

**Question**: "How do you want to migrate?"
- Options:
  - Full automatic migration (Recommended for simple projects)
  - Generate migration template (I'll customize manually)
  - Guided step-by-step migration
  - Compatibility analysis only (no code changes)

### Phase 5: Code Transformation

Based on selected strategy, transform code:

#### AWS Lambda → Workers

**Handler transformation**:

**Lambda format**:
```javascript
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello' })
  };
};
```

**Workers format**:
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response(JSON.stringify({ message: 'Hello' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**AWS SDK replacements**:
- `S3.getObject()` → `env.BUCKET.get()`
- `DynamoDB.putItem()` → `env.DB.prepare().run()`
- `SNS.publish()` → `env.QUEUE.send()`
- `Lambda.invoke()` → Service binding or fetch()

#### Vercel → Workers

**Edge Function transformation**:

**Vercel format**:
```typescript
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  return new Response('Hello');
}
```

**Workers format**:
```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response('Hello');
  }
};
```

**Vercel-specific features**:
- `edge-config` → KV
- `@vercel/kv` → Workers KV
- `@vercel/postgres` → D1 or Hyperdrive

#### Netlify → Workers

**Function transformation**:

**Netlify format**:
```javascript
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Hello' })
  };
};
```

**Workers format**: (Same as Lambda transformation)

**Netlify-specific**:
- Redirects → Workers Routes or `_redirects` file
- Environment variables → wrangler.jsonc vars/secrets
- Build plugins → Use Workers build process

### Phase 6: Configuration Generation

Create wrangler.jsonc configuration:

```jsonc
{
  "name": "[project-name]",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-27",

  // Environment variables (add secrets with: wrangler secret put)
  "vars": {
    "ENVIRONMENT": "production"
  },

  // Bindings (configure as needed)
  {{BINDINGS}}

  // Routes (if using custom domain)
  "routes": [
    { "pattern": "example.com/*", "zone_name": "example.com" }
  ]
}
```

**Bindings template** based on detected services:

**If using S3**:
```jsonc
"r2_buckets": [
  { "binding": "BUCKET", "bucket_name": "my-bucket" }
]
```

**If using DynamoDB/database**:
```jsonc
"d1_databases": [
  { "binding": "DB", "database_name": "my-db", "database_id": "xxx" }
]
```

**If using scheduled tasks**:
```jsonc
"triggers": {
  "crons": ["0 0 * * *"]
}
```

### Phase 7: Dependency Migration

Transform dependencies:

1. **Remove platform-specific packages**:
   ```bash
   npm uninstall aws-sdk @vercel/edge-config netlify-cli
   ```

2. **Install Workers packages**:
   ```bash
   npm install --save-dev wrangler @cloudflare/workers-types
   ```

3. **Update package.json scripts**:
   ```json
   {
     "scripts": {
       "dev": "wrangler dev",
       "deploy": "wrangler deploy",
       "test": "vitest run"
     }
   }
   ```

4. **Create .env.example** with required variables

### Phase 8: Data Migration (If Applicable)

Guide data migration for databases/storage:

**S3 → R2**:
```bash
# Using rclone or AWS CLI
aws s3 sync s3://old-bucket r2://new-bucket --endpoint-url https://xxx.r2.cloudflarestorage.com
```

**DynamoDB → D1**:
```bash
# Export DynamoDB data
aws dynamodb scan --table-name MyTable > data.json

# Create D1 database
wrangler d1 create my-db

# Create schema
wrangler d1 execute my-db --file=schema.sql

# Import data (provide script template)
node import-to-d1.js
```

**Environment Variables**:
```bash
# Set secrets in Workers
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

### Phase 9: Testing Setup

Create migration validation tests:

**Test checklist template**:
```markdown
## Migration Testing Checklist

### Functional Tests
- [ ] All routes respond correctly
- [ ] Authentication works
- [ ] Database reads work
- [ ] Database writes work
- [ ] File uploads work
- [ ] Scheduled tasks trigger
- [ ] Environment variables accessible

### Performance Tests
- [ ] Response times acceptable (<500ms)
- [ ] Bundle size under limits
- [ ] No timeout errors
- [ ] Caching works as expected

### Integration Tests
- [ ] External API calls work
- [ ] Third-party services connect
- [ ] Webhooks receive correctly
- [ ] CORS configured properly
```

Create automated test using Vitest:

```typescript
import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('Migration Tests', () => {
  it('should handle migrated route', async () => {
    const response = await SELF.fetch('https://example.com/api/test');
    expect(response.status).toBe(200);
  });

  // Add more tests based on original functionality
});
```

### Phase 10: Deployment Guide

Provide step-by-step deployment instructions:

```markdown
## Deployment Steps

### 1. Authenticate Wrangler
```bash
wrangler login
```

### 2. Create Required Resources

**If using D1**:
```bash
wrangler d1 create my-database
# Update wrangler.jsonc with database_id
wrangler d1 execute my-database --file=schema.sql
```

**If using R2**:
```bash
wrangler r2 bucket create my-bucket
```

**If using KV**:
```bash
wrangler kv:namespace create MY_KV
```

### 3. Set Secrets
```bash
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

### 4. Deploy to Staging (Recommended)
```bash
wrangler deploy --env staging
# Test thoroughly
```

### 5. Deploy to Production
```bash
wrangler deploy --env production
```

### 6. Configure Custom Domain (Optional)
1. Add route in wrangler.jsonc
2. Verify DNS points to Cloudflare
3. Deploy again

### 7. Monitor Deployment
```bash
wrangler tail --env production
# Watch for errors or unexpected behavior
```

### 8. Update DNS/Traffic
- Gradually shift traffic to Workers
- Use Cloudflare Load Balancer for gradual rollout
- Keep old platform running until validated
```

### Phase 11: Rollback Plan

Provide rollback strategy:

```markdown
## Rollback Plan

### Quick Rollback (DNS)
1. Update DNS to point back to old platform
2. Wait for TTL (usually 5 minutes)
3. Verify traffic routing correctly

### Wrangler Rollback
```bash
wrangler rollback --env production
```

### Data Rollback
- Keep old database running for 24-48h
- Sync data changes back if needed
- Validate data integrity
```

### Phase 12: Migration Summary

Generate comprehensive summary:

```markdown
# Migration Complete! 🎉

**From**: [Source Platform]
**To**: Cloudflare Workers
**Migration Date**: [Date]

## What Was Migrated

**Code**:
- X handler functions → Workers fetch handlers
- X routes configured
- X environment variables set
- X dependencies updated

**Data** (if applicable):
- X database records migrated
- X files transferred to R2
- X KV entries created

**Configuration**:
- wrangler.jsonc created
- Bindings configured: [list]
- Secrets set: [count]

## Performance Improvements

**Expected Benefits**:
- Global edge deployment (0ms cold start)
- Lower latency (edge routing)
- Reduced costs (no idle charges)
- Better DX (local dev with wrangler)

## Post-Migration Tasks

**Immediate**:
1. Monitor error rates for 24-48h
2. Compare performance metrics
3. Validate all functionality works

**Week 1**:
1. Optimize based on metrics
2. Add workers-testing for CI/CD
3. Set up monitoring/alerting

**Month 1**:
1. Decommission old platform
2. Remove legacy code/configs
3. Document Workers-specific patterns

## Resources

- Workers Docs: https://developers.cloudflare.com/workers/
- Load workers-testing skill for testing setup
- Load workers-observability for monitoring
- Load workers-performance for optimization

## Need Help?

- Debugging: /workers-debug
- Optimization: /workers-optimize
- Testing: /workers-test-setup

## Next Steps

1. **Monitor**: Watch logs with `wrangler tail`
2. **Optimize**: Run `/workers-optimize` after 24h
3. **Test**: Set up `/workers-test-setup` for CI/CD
4. **Learn**: Explore Workers-specific features (DO, Queues, Workflows)
```

## Platform-Specific Migration Notes

### AWS Lambda Specific

**Event transformations**:
- API Gateway event → Request object
- S3 event → R2 notifications
- SQS event → Queue consumer
- EventBridge → Cron Triggers

**Common issues**:
- Binary responses → Use Response.body with proper headers
- Timeout handling → Workers have 30s limit (use Workflows for longer)
- Memory limits → 128MB default (optimize bundle)

### Vercel Specific

**Framework support**:
- Next.js → Full support with @cloudflare/next-on-pages
- SvelteKit → Official Cloudflare adapter
- Nuxt → @nuxthq/cloudflare

**Edge Config migration**:
```typescript
// Before (Vercel)
import { get } from '@vercel/edge-config';
const value = await get('key');

// After (Workers)
const value = await env.CONFIG.get('key');
```

### Netlify Specific

**Redirects migration**:
```
# netlify.toml redirects → Workers routing
/old-path /new-path 301

# Becomes Workers code:
if (url.pathname === '/old-path') {
  return Response.redirect('/new-path', 301);
}
```

**Forms → Workers + D1/KV**:
- Replace Netlify Forms with custom form handler
- Store submissions in D1 or KV
- Add spam protection with Turnstile

## Error Handling

**If migration fails**:
1. Keep original platform running
2. Identify specific failure point
3. Fix issue incrementally
4. Re-run migration steps

**If compatibility issues**:
1. Consult workers-migration skill for detailed guides
2. Check Cloudflare community for similar migrations
3. Consider phased migration (migrate piece by piece)

## Success Criteria

Migration is successful when:
- ✅ All code transformed to Workers format
- ✅ Dependencies updated
- ✅ Configuration created
- ✅ Data migrated (if applicable)
- ✅ Tests passing
- ✅ Deployed successfully
- ✅ Original functionality verified
- ✅ Rollback plan documented

## Tips for Claude

1. **Analyze thoroughly**: Understand all platform-specific features being used
2. **Warn about incompatibilities**: Be upfront about what won't work
3. **Provide alternatives**: Suggest Workers equivalents for each feature
4. **Test carefully**: Ensure nothing breaks during transformation
5. **Document everything**: Migration is complex, provide detailed docs
6. **Phased approach**: Suggest gradual migration for complex apps
7. **Reference skills**: Point to detailed migration guides in workers-migration skill

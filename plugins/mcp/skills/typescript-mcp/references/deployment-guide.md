# Deployment Guide for TypeScript MCP Servers

Complete guide to deploying MCP servers on Cloudflare Workers.

---

## Quick Deployment

```bash
# Build
npm run build

# Deploy
wrangler deploy
```

---

## Environment Setup

### Development (.dev.vars)

Create `.dev.vars` for local secrets:
```bash
WEATHER_API_KEY=abc123
DATABASE_URL=http://localhost:3306
```

**Never commit `.dev.vars` to git!**

### Production Secrets

```bash
# Set secrets
wrangler secret put WEATHER_API_KEY
wrangler secret put DATABASE_URL

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete OLD_KEY
```

---

## Multiple Environments

**wrangler.jsonc:**
```jsonc
{
  "name": "mcp-server",
  "main": "src/index.ts",

  "env": {
    "staging": {
      "name": "mcp-server-staging",
      "vars": {
        "ENVIRONMENT": "staging"
      },
      "d1_databases": [
        { "binding": "DB", "database_id": "staging-db-id" }
      ]
    },
    "production": {
      "name": "mcp-server-production",
      "vars": {
        "ENVIRONMENT": "production"
      },
      "d1_databases": [
        { "binding": "DB", "database_id": "prod-db-id" }
      ]
    }
  }
}
```

**Deploy to specific environment:**
```bash
wrangler deploy --env staging
wrangler deploy --env production
```

---

## Custom Domains

### Setup

1. **Add domain in Cloudflare dashboard:**
   - Workers & Pages → your worker → Settings → Domains & Routes
   - Add custom domain: `mcp.example.com`

2. **Or via wrangler.jsonc:**
```jsonc
{
  "routes": [
    {
      "pattern": "mcp.example.com/*",
      "custom_domain": true
    }
  ]
}
```

### SSL/TLS

Cloudflare provides automatic SSL certificates for custom domains.

---

## CI/CD with GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy MCP Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

### Setup Secrets

1. **Get Cloudflare API token:**
   - Dashboard → My Profile → API Tokens
   - Create token with "Edit Cloudflare Workers" permissions

2. **Add to GitHub:**
   - Repository → Settings → Secrets → Actions
   - Add `CLOUDFLARE_API_TOKEN`
   - Add `CLOUDFLARE_ACCOUNT_ID`

---

## Database Migrations

### D1 Migrations

**Create migration:**
```bash
wrangler d1 migrations create my-db add-users-table
```

**migrations/0001_add_users_table.sql:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Apply migrations:**
```bash
# Local
wrangler d1 migrations apply my-db --local

# Production
wrangler d1 migrations apply my-db --remote
```

**In CI/CD:**
```yaml
- name: Run D1 migrations
  run: wrangler d1 migrations apply my-db --remote
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## Monitoring & Logs

### Real-time Logs

```bash
# Tail logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST
```

### Workers Analytics

View in dashboard:
- Requests per second
- Error rate
- CPU time
- Bandwidth

### Custom Logging

```typescript
app.post('/mcp', async (c) => {
  console.log('MCP request:', {
    method: c.req.method,
    path: c.req.path,
    timestamp: new Date().toISOString()
  });

  // ... handle request

  console.log('MCP response:', { status: 200, duration: '15ms' });
});
```

---

## Rollback Strategy

### Quick Rollback

```bash
# List deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback --deployment-id abc123
```

### Git-based Rollback

```bash
# Revert to previous commit
git revert HEAD
git push

# CI/CD will auto-deploy reverted version
```

---

## Performance Optimization

### 1. Enable Compression

Cloudflare automatically compresses responses. No configuration needed.

### 2. Caching

```typescript
app.get('/mcp-schema', async (c) => {
  const schema = { ... };

  return c.json(schema, 200, {
    'Cache-Control': 'public, max-age=3600',
    'CDN-Cache-Control': 'max-age=86400'
  });
});
```

### 3. Edge Caching with KV

```typescript
async function getCachedOrFetch(key: string, fetcher: () => Promise<string>, env: Env) {
  const cached = await env.CACHE.get(key);
  if (cached) return cached;

  const fresh = await fetcher();
  await env.CACHE.put(key, fresh, { expirationTtl: 3600 });
  return fresh;
}
```

---

## Health Checks

```typescript
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

**Monitor with UptimeRobot, Pingdom, etc.**

---

## Cost Optimization

### Workers Pricing

- Free: 100,000 requests/day
- Paid: $5/month + $0.50/million requests

### Tips

1. **Use KV for caching** (reduces computation)
2. **Optimize D1 queries** (use indexes)
3. **Batch operations** where possible
4. **Set reasonable rate limits**
5. **Monitor usage** in dashboard

---

## Security Checklist

Before production:

- [ ] Authentication implemented
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Secrets in Wrangler secrets (not code)
- [ ] Error messages don't leak data
- [ ] HTTPS only (enforced by CF)
- [ ] Input validation on all tools
- [ ] SQL injection protection
- [ ] API keys rotated regularly

---

## Troubleshooting Deployments

### Deployment Fails

```bash
# Check syntax
npm run build

# Validate wrangler.jsonc
wrangler deploy --dry-run

# View detailed logs
wrangler deploy --verbose
```

### Worker Not Responding

```bash
# Check logs
wrangler tail

# Test locally first
wrangler dev

# Verify bindings
wrangler d1 list
wrangler kv namespace list
```

### Performance Issues

```bash
# Check CPU time
wrangler tail --status ok | grep "CPU time"

# Profile with Analytics
# Dashboard → Workers → Analytics
```

---

**Last Updated:** 2025-10-28

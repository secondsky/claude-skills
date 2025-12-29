---
name: bun:deploy
description: Deploy Bun applications to various platforms
arguments:
  - name: platform
    description: Target platform (docker, cloudflare, vercel, fly, railway)
    required: false
---

# Bun Deployment

Deploy Bun applications to production environments.

## Supported Platforms

### Docker

Create optimized Dockerfile:

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
USER bun
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
```

Commands:
```bash
docker build -t myapp .
docker run -p 3000:3000 myapp
```

### Cloudflare Workers

Update wrangler.toml:
```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"
```

Deploy:
```bash
bun run build
bunx wrangler deploy
```

### Vercel

Add vercel.json:
```json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "framework": null
}
```

Deploy:
```bash
bunx vercel
```

### Fly.io

Create fly.toml:
```toml
app = "my-app"
primary_region = "ord"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true

[[services.ports]]
  handlers = ["http"]
  port = 80

[[services.ports]]
  handlers = ["tls", "http"]
  port = 443
```

Deploy:
```bash
fly deploy
```

### Railway

Railway auto-detects Bun projects. Add:

```json
{
  "scripts": {
    "start": "bun run src/index.ts"
  }
}
```

Deploy via Railway CLI or GitHub integration.

## Pre-Deployment Checklist

1. [ ] **Build passes** - `bun run build`
2. [ ] **Tests pass** - `bun test`
3. [ ] **Environment variables** - All secrets configured
4. [ ] **Health check** - `/health` endpoint exists
5. [ ] **Logging** - Structured logging configured
6. [ ] **Error handling** - Global error handlers
7. [ ] **Security headers** - CORS, CSP configured
8. [ ] **Database migrations** - Applied if needed

## Environment Configuration

```bash
# Generate .env.example from .env
grep -v '^#' .env | sed 's/=.*/=/' > .env.example

# Required variables
DATABASE_URL=
API_SECRET=
NODE_ENV=production
```

## Health Check Endpoint

```typescript
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || "unknown",
  });
});
```

## Logging Setup

```typescript
function log(level: string, message: string, data?: object) {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}
```

## Monitoring

Add basic metrics:
```typescript
let requestCount = 0;
let errorCount = 0;

app.use("*", async (c, next) => {
  requestCount++;
  try {
    await next();
  } catch (err) {
    errorCount++;
    throw err;
  }
});

app.get("/metrics", (c) => {
  return c.json({
    requests: requestCount,
    errors: errorCount,
    uptime: process.uptime(),
  });
});
```

## Questions to Ask

If platform not specified:
- "Where do you want to deploy? (Docker, Cloudflare, Vercel, Fly.io, Railway)"

Additional questions:
- "Do you need a database?"
- "What region should it deploy to?"
- "Do you have a domain name?"

## Deployment Steps

1. Verify platform requirements
2. Create necessary config files
3. Set environment variables
4. Run deployment command
5. Verify health check
6. Test production endpoints

## Output

After deployment:
1. Deployment URL
2. Environment details
3. Monitoring commands
4. Rollback instructions

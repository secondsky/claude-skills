# Local Development for Cloudflare Workers

Complete guide for local development with Wrangler and Miniflare.

## Getting Started

### Project Setup

```bash
# Create new project (recommended)
bunx create-cloudflare@latest my-worker
cd my-worker

# Manual setup
mkdir my-worker && cd my-worker
bun init -y
bun add -d wrangler @cloudflare/workers-types typescript
```

### Project Structure

```
my-worker/
├── src/
│   ├── index.ts          # Main entry point
│   ├── routes/           # Route handlers
│   └── lib/              # Shared utilities
├── test/
│   └── index.test.ts     # Tests
├── wrangler.jsonc        # Wrangler configuration
├── tsconfig.json         # TypeScript configuration
├── package.json
└── .dev.vars             # Local secrets (gitignored)
```

## Wrangler Dev Server

### Basic Usage

```bash
# Start local dev server
bunx wrangler dev

# Output:
# ⛅️ wrangler 3.x.x
# Your worker has access to the following bindings:
# - KV Namespaces:
#   - KV: abc123
# ⎔ Starting local server...
# Ready on http://localhost:8787
```

### Command Options

```bash
# With live reload (automatic browser refresh)
bunx wrangler dev --live-reload

# Remote mode (use real Cloudflare services)
bunx wrangler dev --remote

# Specify environment
bunx wrangler dev --env staging

# Custom port
bunx wrangler dev --port 3000

# Custom host
bunx wrangler dev --ip 0.0.0.0

# Enable inspector for debugging
bunx wrangler dev --inspector-port 9229

# Persist local state between restarts
bunx wrangler dev --persist

# Specify config file
bunx wrangler dev --config wrangler.dev.jsonc
```

### Local vs Remote Mode

| Feature | Local (default) | Remote (`--remote`) |
|---------|-----------------|---------------------|
| Speed | Faster | Slower |
| KV | Simulated | Real Cloudflare KV |
| D1 | Local SQLite | Real D1 database |
| R2 | Local filesystem | Real R2 bucket |
| Durable Objects | Simulated | Real DOs |
| Network | localhost | Cloudflare edge |

## Local Secrets

Create `.dev.vars` for local secrets (automatically loaded):

```bash
# .dev.vars (gitignored)
API_KEY=dev-api-key-123
DATABASE_URL=postgres://localhost:5432/dev
STRIPE_SECRET_KEY=sk_test_xxx
```

Access in code:

```typescript
interface Env {
  API_KEY: string;
  DATABASE_URL: string;
  STRIPE_SECRET_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // env.API_KEY is available
    return new Response('OK');
  }
};
```

## Binding Simulation

### KV Namespace

```jsonc
// wrangler.jsonc
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "production-id",
      "preview_id": "preview-id"  // Used in dev
    }
  ]
}
```

Local KV data persists in `.wrangler/state/`.

### D1 Database

```jsonc
// wrangler.jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "production-db-id",
      "database_name": "my-database"
    }
  ]
}
```

```bash
# Apply migrations locally
bunx wrangler d1 migrations apply DB --local

# Execute SQL locally
bunx wrangler d1 execute DB --local --command "SELECT * FROM users"

# Open D1 console
bunx wrangler d1 execute DB --local --command ".tables"
```

### R2 Bucket

```jsonc
// wrangler.jsonc
{
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-bucket",
      "preview_bucket_name": "my-bucket-preview"
    }
  ]
}
```

Local R2 data persists in `.wrangler/state/`.

### Durable Objects

```jsonc
// wrangler.jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "ROOMS",
        "class_name": "ChatRoom"
      }
    ]
  }
}
```

## Hot Module Replacement

Wrangler automatically rebuilds and restarts on file changes:

```bash
# Watch mode is default
bunx wrangler dev

# Enable browser live reload
bunx wrangler dev --live-reload
```

### Troubleshooting HMR

1. **Changes not reflecting**:
   - Check for port conflicts
   - Ensure file is being watched (check `src/` path)
   - Try `--live-reload` flag

2. **Slow rebuilds**:
   - Minimize dependencies
   - Use `--persist` to avoid re-initializing state

3. **Build errors**:
   - Check console for TypeScript errors
   - Verify imports are correct

## Development Workflow

### Recommended workflow:

```bash
# Terminal 1: Dev server
bunx wrangler dev

# Terminal 2: Type checking (watch)
bunx tsc --watch --noEmit

# Terminal 3: Tests (watch)
bunx vitest --watch
```

### package.json scripts:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "dev:remote": "wrangler dev --remote",
    "dev:persist": "wrangler dev --persist",
    "check": "tsc --noEmit",
    "check:watch": "tsc --noEmit --watch"
  }
}
```

## Environment Configuration

### Multiple Environments

```jsonc
// wrangler.jsonc
{
  "name": "my-worker",

  // Base configuration
  "vars": {
    "ENVIRONMENT": "development"
  },

  // Environment-specific
  "env": {
    "staging": {
      "name": "my-worker-staging",
      "vars": {
        "ENVIRONMENT": "staging"
      }
    },
    "production": {
      "name": "my-worker-production",
      "vars": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

```bash
# Development (default)
bunx wrangler dev

# Staging
bunx wrangler dev --env staging

# Production (careful!)
bunx wrangler dev --env production --remote
```

## Persistence

By default, local state is ephemeral. Use `--persist` to keep state:

```bash
bunx wrangler dev --persist

# State stored in .wrangler/state/
# - v3/kv/
# - v3/d1/
# - v3/r2/
```

## Accessing from Other Devices

```bash
# Bind to all interfaces
bunx wrangler dev --ip 0.0.0.0

# Access from other devices on network
# http://192.168.1.x:8787
```

## Common Issues

### Port Already in Use

```bash
# Use different port
bunx wrangler dev --port 3001

# Or kill existing process
lsof -i :8787  # Find PID
kill -9 <PID>
```

### Binding Not Available

Ensure binding has `preview_id` or local configuration:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "prod-id",
      "preview_id": "preview-id"  // Required for local dev
    }
  ]
}
```

### D1 Migrations Not Applied

```bash
# Apply migrations to local database
bunx wrangler d1 migrations apply DB --local
```

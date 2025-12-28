# Wrangler Configuration Reference

Complete guide to wrangler.jsonc configuration options.

## Basic Configuration

```jsonc
{
  // JSON Schema for IDE support
  "$schema": "node_modules/wrangler/config-schema.json",

  // Worker name (used in deployment)
  "name": "my-worker",

  // Entry point
  "main": "src/index.ts",

  // Compatibility date (controls runtime behavior)
  "compatibility_date": "2024-12-01",

  // Optional: Compatibility flags
  "compatibility_flags": ["nodejs_compat"]
}
```

## Development Settings

```jsonc
{
  "dev": {
    // Local dev server port
    "port": 8787,

    // Local protocol (http or https)
    "local_protocol": "http",

    // Bind to IP (default: localhost)
    "ip": "127.0.0.1"
  }
}
```

## Environment Variables

### Non-Secret Variables

```jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info",
    "API_VERSION": "v1"
  }
}
```

### Secrets (via CLI)

```bash
# Set secret
bunx wrangler secret put API_KEY
# Enter value when prompted

# List secrets
bunx wrangler secret list

# Delete secret
bunx wrangler secret delete API_KEY
```

### Local Secrets (.dev.vars)

```bash
# .dev.vars (gitignored)
API_KEY=dev-key-123
DATABASE_URL=postgres://localhost/dev
```

## Bindings

### KV Namespace

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "production-namespace-id",
      "preview_id": "preview-namespace-id"
    }
  ]
}
```

### D1 Database

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "database-uuid",
      "database_name": "my-database",
      "migrations_dir": "migrations"  // Optional, default: "migrations"
    }
  ]
}
```

### R2 Bucket

```jsonc
{
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-bucket",
      "preview_bucket_name": "my-bucket-preview",
      "jurisdiction": "eu"  // Optional: data location
    }
  ]
}
```

### Durable Objects

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "ROOMS",
        "class_name": "ChatRoom",
        "script_name": "chat-worker"  // Optional: external worker
      }
    ]
  },

  // Required for new DO classes
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["ChatRoom"]
    }
  ]
}
```

### Queues

```jsonc
{
  "queues": {
    "producers": [
      {
        "binding": "MY_QUEUE",
        "queue": "my-queue-name"
      }
    ],
    "consumers": [
      {
        "queue": "my-queue-name",
        "max_batch_size": 10,
        "max_batch_timeout": 5,
        "max_retries": 3,
        "dead_letter_queue": "my-dlq"
      }
    ]
  }
}
```

### Analytics Engine

```jsonc
{
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS",
      "dataset": "my_worker_metrics"
    }
  ]
}
```

### Service Bindings

```jsonc
{
  "services": [
    {
      "binding": "AUTH_SERVICE",
      "service": "auth-worker",
      "environment": "production"
    }
  ]
}
```

### Workers AI

```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

### Vectorize

```jsonc
{
  "vectorize": [
    {
      "binding": "VECTORIZE",
      "index_name": "my-index"
    }
  ]
}
```

### Hyperdrive

```jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "hyperdrive-config-id"
    }
  ]
}
```

## Routes and Triggers

### HTTP Routes

```jsonc
{
  "routes": [
    {
      "pattern": "example.com/*",
      "zone_name": "example.com"
    },
    {
      "pattern": "api.example.com/v1/*",
      "zone_id": "zone-id-here"
    }
  ]
}
```

### Custom Domains

```jsonc
{
  "routes": [
    {
      "pattern": "api.example.com",
      "custom_domain": true
    }
  ]
}
```

### Cron Triggers

```jsonc
{
  "triggers": {
    "crons": [
      "0 * * * *",     // Every hour
      "0 0 * * *",     // Daily at midnight
      "*/5 * * * *"    // Every 5 minutes
    ]
  }
}
```

## Build Configuration

```jsonc
{
  // Custom build command
  "build": {
    "command": "bun run build",
    "cwd": ".",
    "watch_dir": "src"
  },

  // Rules for module types
  "rules": [
    {
      "type": "Text",
      "globs": ["**/*.txt", "**/*.html"]
    },
    {
      "type": "Data",
      "globs": ["**/*.bin"]
    }
  ]
}
```

## Observability

```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1  // 0-1, 1 = 100%
  },

  "tail_consumers": [
    {
      "service": "log-aggregator",
      "environment": "production"
    }
  ]
}
```

## Asset Handling

### Static Assets

```jsonc
{
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  }
}
```

### Site (Legacy)

```jsonc
{
  "site": {
    "bucket": "./public",
    "entry-point": "workers-site"
  }
}
```

## Environment Overrides

```jsonc
{
  "name": "my-worker",
  "vars": {
    "ENVIRONMENT": "development"
  },

  "env": {
    "staging": {
      "name": "my-worker-staging",
      "vars": {
        "ENVIRONMENT": "staging"
      },
      "kv_namespaces": [
        {
          "binding": "KV",
          "id": "staging-kv-id"
        }
      ]
    },
    "production": {
      "name": "my-worker-production",
      "vars": {
        "ENVIRONMENT": "production"
      },
      "kv_namespaces": [
        {
          "binding": "KV",
          "id": "production-kv-id"
        }
      ]
    }
  }
}
```

## Limits Configuration

```jsonc
{
  "limits": {
    "cpu_ms": 50  // Max CPU time per request
  }
}
```

## Complete Example

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],

  "dev": {
    "port": 8787,
    "local_protocol": "http"
  },

  "vars": {
    "ENVIRONMENT": "development",
    "LOG_LEVEL": "debug"
  },

  "kv_namespaces": [
    { "binding": "CACHE", "id": "cache-prod-id", "preview_id": "cache-dev-id" }
  ],

  "d1_databases": [
    { "binding": "DB", "database_id": "db-uuid", "database_name": "mydb" }
  ],

  "r2_buckets": [
    { "binding": "UPLOADS", "bucket_name": "uploads" }
  ],

  "ai": { "binding": "AI" },

  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },

  "triggers": {
    "crons": ["0 * * * *"]
  },

  "env": {
    "production": {
      "name": "my-api-production",
      "vars": {
        "ENVIRONMENT": "production",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

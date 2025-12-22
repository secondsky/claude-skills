# Wrangler Configuration - Cloudflare Cron Triggers

Complete configuration guide for adding cron triggers to Cloudflare Workers using wrangler.jsonc.

**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Basic Configuration](#basic-configuration) - Single cron trigger setup
2. [Multiple Cron Triggers](#multiple-cron-triggers) - Multiple schedules in one Worker
3. [Environment-Specific Crons](#environment-specific-crons) - Different schedules per environment
4. [Removing Cron Triggers](#removing-all-cron-triggers) - How to disable crons

---

## Basic Configuration

Add cron triggers to `wrangler.jsonc` in the `triggers.crons` array:

```jsonc
{
  "name": "my-scheduled-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-12-06",
  "triggers": {
    "crons": ["0 * * * *"]
  }
}
```

**Key Fields:**
- `name` - Worker name (must be unique in your account)
- `main` - Entry point file
- `compatibility_date` - API version lock (use current date)
- `triggers.crons` - Array of cron expressions

**After configuration:**

```bash
bunx wrangler deploy
```

Your Worker will now execute on the specified schedule.

---

## Multiple Cron Triggers

Add multiple cron expressions to run different schedules:

```jsonc
{
  "triggers": {
    "crons": [
      "*/5 * * * *",     // Every 5 minutes
      "0 */6 * * *",     // Every 6 hours
      "0 2 * * *",       // Daily at 2am UTC
      "0 0 * * 1"        // Weekly on Monday at midnight UTC
    ]
  }
}
```

**Plan Limits:**
- **Free**: 5 cron triggers per account
- **Paid**: Higher limits (check current limits at https://developers.cloudflare.com/workers/platform/limits/)

**Handling Multiple Triggers:**

In your Worker code, use `controller.cron` to route execution:

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    switch (controller.cron) {
      case '*/5 * * * *':
        await checkHealth(env);
        break;
      case '0 */6 * * *':
        await syncData(env);
        break;
      case '0 2 * * *':
        await generateReports(env);
        break;
      case '0 0 * * 1':
        await weeklyCleanup(env);
        break;
    }
  },
};
```

**CRITICAL:**
- Cron expression matching is whitespace-sensitive
- Use exact string match (don't modify expressions)
- Each cron triggers independently

---

## Environment-Specific Crons

Configure different cron schedules for dev, staging, and production:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "env": {
    "dev": {
      "triggers": {
        "crons": ["*/5 * * * *"]  // Dev: every 5 minutes for testing
      }
    },
    "staging": {
      "triggers": {
        "crons": ["*/30 * * * *"]  // Staging: every 30 minutes
      }
    },
    "production": {
      "triggers": {
        "crons": ["0 * * * *"]  // Production: hourly
      }
    }
  }
}
```

**Deploy to specific environment:**

```bash
# Deploy to dev
bunx wrangler deploy --env dev

# Deploy to staging
bunx wrangler deploy --env staging

# Deploy to production
bunx wrangler deploy --env production
```

**Environment Best Practices:**

1. **Development** - Frequent triggers (every 5-10 minutes) for rapid testing
2. **Staging** - Moderate frequency (every 30 minutes) to validate before production
3. **Production** - Actual schedule needed (hourly, daily, etc.)

**Viewing deployed environments:**

```bash
# List all deployments
bunx wrangler deployments list

# Check specific environment
bunx wrangler deployments list --env production
```

---

## Removing All Cron Triggers

To completely remove cron triggers from a Worker:

```jsonc
{
  "triggers": {
    "crons": []  // Empty array removes all crons
  }
}
```

**Deploy changes:**

```bash
bunx wrangler deploy
```

After deployment, the Worker will no longer execute on any schedule.

**Verify removal:**

```bash
# Check Worker configuration in dashboard
open https://dash.cloudflare.com/

# Or view deployed config
bunx wrangler tail --format json
```

---

## Advanced Configuration Options

### Combining with Other Triggers

Cron triggers can coexist with other Worker capabilities:

```jsonc
{
  "name": "full-featured-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-23",

  // Cron triggers
  "triggers": {
    "crons": ["0 * * * *"]
  },

  // Custom domains
  "routes": [
    { "pattern": "example.com/*", "zone_name": "example.com" }
  ],

  // Bindings
  "d1_databases": [
    { "binding": "DB", "database_name": "my-database", "database_id": "xxx" }
  ],
  "kv_namespaces": [
    { "binding": "KV", "id": "xxx" }
  ],
  "r2_buckets": [
    { "binding": "BUCKET", "bucket_name": "my-bucket" }
  ]
}
```

### Timezone Considerations

All cron expressions are evaluated in **UTC timezone**.

To run tasks in a specific timezone, adjust the cron expression:

```jsonc
{
  "triggers": {
    "crons": [
      // Run at 2am Pacific Time (PST = UTC-8, PDT = UTC-7)
      "0 10 * * *"  // 10am UTC = 2am PST or 3am PDT
    ]
  }
}
```

**Better approach:** Use UTC in cron, convert timezone in code:

```typescript
import { DateTime } from 'luxon';

export default {
  async scheduled(controller: ScheduledController): Promise<void> {
    // Get current time in specific timezone
    const pacific = DateTime.now().setZone('America/Los_Angeles');

    if (pacific.hour === 2) {
      // Run task only at 2am Pacific
      await performTask();
    }
  },
};
```

### Validation

Validate cron expressions before deploying:

```bash
# Dry-run deployment
bunx wrangler deploy --dry-run

# Check for syntax errors
bunx wrangler validate
```

---

## Troubleshooting Configuration

### Cron Not Appearing in Dashboard

**Problem:** Deployed Worker but cron doesn't show in Cloudflare dashboard.

**Solutions:**
1. Check `wrangler.jsonc` syntax (missing commas, brackets)
2. Ensure `triggers.crons` is an array: `["0 * * * *"]` not `"0 * * * *"`
3. Validate cron expression syntax: https://crontab.guru
4. Re-deploy: `bunx wrangler deploy --force`

### Multiple Environments Conflicting

**Problem:** Wrong cron schedule triggering after deployment.

**Solutions:**
1. Check which environment was deployed: `bunx wrangler deployments list`
2. Ensure `--env` flag used: `bunx wrangler deploy --env production`
3. View current config: `bunx wrangler show`

### Cron Limit Exceeded

**Problem:** "Maximum cron triggers exceeded" error.

**Solutions:**
1. Check current limit: https://dash.cloudflare.com → Workers → Limits
2. Remove unused crons or consolidate into fewer expressions
3. Upgrade plan for higher limits

---

## Configuration Examples

### Example 1: Simple Daily Task

```jsonc
{
  "name": "daily-cleanup",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-23",
  "triggers": {
    "crons": ["0 0 * * *"]  // Midnight UTC daily
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "main", "database_id": "xxx" }
  ]
}
```

### Example 2: Multi-Schedule Monitoring

```jsonc
{
  "name": "system-monitor",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-23",
  "triggers": {
    "crons": [
      "*/5 * * * *",    // Health checks every 5 min
      "0 * * * *",      // Metrics collection hourly
      "0 0 * * *"       // Daily reports at midnight
    ]
  },
  "kv_namespaces": [
    { "binding": "METRICS", "id": "xxx" }
  ]
}
```

### Example 3: Multi-Environment with Bindings

```jsonc
{
  "name": "data-sync",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-23",
  "env": {
    "dev": {
      "triggers": {
        "crons": ["*/10 * * * *"]  // Every 10 min in dev
      },
      "vars": {
        "ENVIRONMENT": "development"
      }
    },
    "production": {
      "triggers": {
        "crons": ["0 */6 * * *"]  // Every 6 hours in prod
      },
      "vars": {
        "ENVIRONMENT": "production"
      }
    }
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "sync-db", "database_id": "xxx" }
  ]
}
```

---

**Last Updated**: 2025-11-25
**Official Docs**: https://developers.cloudflare.com/workers/configuration/cron-triggers/
**Cron Expression Validator**: https://crontab.guru

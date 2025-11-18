## Configuration Deep Dive

### Complete wrangler.jsonc Example

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-agent",
  "main": "src/index.ts",
  "account_id": "YOUR_ACCOUNT_ID",
  "compatibility_date": "2025-10-21",
  "compatibility_flags": ["nodejs_compat"],

  // Durable Objects configuration (REQUIRED)
  "durable_objects": {
    "bindings": [
      {
        "name": "MyAgent",
        "class_name": "MyAgent"
      }
    ]
  },

  // Migrations (REQUIRED)
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyAgent"]  // Enables state persistence
    }
  ],

  // Optional: Workers AI binding (for AI model calls)
  "ai": {
    "binding": "AI"
  },

  // Optional: Vectorize binding (for RAG)
  "vectorize": {
    "bindings": [
      {
        "binding": "VECTORIZE",
        "index_name": "my-agent-vectors"
      }
    ]
  },

  // Optional: Browser Rendering binding (for web browsing)
  "browser": {
    "binding": "BROWSER"
  },

  // Optional: Workflows binding (for async workflows)
  "workflows": [
    {
      "name": "MY_WORKFLOW",
      "class_name": "MyWorkflow",
      "script_name": "my-workflow-script"  // If in different project
    }
  ],

  // Optional: D1 binding (for additional persistent data)
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-agent-db",
      "database_id": "your-database-id"
    }
  ],

  // Optional: R2 binding (for file storage)
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-agent-files"
    }
  ],

  // Optional: Environment variables
  "vars": {
    "ENVIRONMENT": "production"
  },

  // Optional: Secrets (set with: wrangler secret put KEY)
  // OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.

  // Observability
  "observability": {
    "enabled": true
  }
}
```

### Migrations Best Practices

**Atomic Deployments**: Migrations are **atomic operations** - they cannot be gradually deployed.

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MyAgent"]  // Initial: enable SQLite
    },
    {
      "tag": "v2",
      "renamed_classes": [
        {"from": "MyAgent", "to": "MyRenamedAgent"}
      ]
    },
    {
      "tag": "v3",
      "deleted_classes": ["OldAgent"]
    },
    {
      "tag": "v4",
      "transferred_classes": [
        {
          "from": "AgentInOldScript",
          "from_script": "old-worker",
          "to": "AgentInNewScript"
        }
      ]
    }
  ]
}
```

**Migration Rules:**
- ✅ Each migration needs a unique `tag`
- ✅ Cannot enable SQLite on existing deployed class (must be in first migration)
- ✅ Migrations apply in order during deployment
- ✅ Cannot edit or remove previous migration tags
- ❌ Never deploy new migrations gradually (atomic only)

### Environment-Specific Migrations

```jsonc
{
  "migrations": [{"tag": "v1", "new_sqlite_classes": ["MyAgent"]}],
  "env": {
    "staging": {
      "migrations": [
        {"tag": "v1", "new_sqlite_classes": ["MyAgent"]},
        {"tag": "v2-staging", "renamed_classes": [{"from": "MyAgent", "to": "StagingAgent"}]}
      ]
    }
  }
}
```

---


# Durable Objects Migration Cheatsheet

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27

Quick reference guide for Durable Objects migrations.

---

## Migration Types

### New Class (SQL Backend)

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter"]
    }
  ]
}
```

### New Class (KV Backend - Legacy)

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter"]
    }
  ]
}
```

### Rename Class

```jsonc
{
  "migrations": [
    {
      "tag": "v2",
      "renamed_classes": [
        { "from": "Counter", "to": "GlobalCounter" }
      ]
    }
  ]
}
```

### Delete Class

```jsonc
{
  "migrations": [
    {
      "tag": "v3",
      "deleted_classes": ["OldCounter"]
    }
  ]
}
```

### Transfer Class

```jsonc
{
  "migrations": [
    {
      "tag": "v4",
      "transferred_classes": [
        {
          "from": "Counter",
          "from_script": "old-worker",
          "to": "Counter",
          "to_script": "new-worker"
        }
      ]
    }
  ]
}
```

---

## Common Migration Patterns

### Adding New DO to Existing Project

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter"]
    },
    {
      "tag": "v2",  // New migration
      "new_sqlite_classes": ["ChatRoom"]
    }
  ]
}
```

### Switching from KV to SQL

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter"]  // Started with KV
    },
    {
      "tag": "v2",
      "deleted_classes": ["Counter"]  // Delete KV version
    },
    {
      "tag": "v3",
      "new_sqlite_classes": ["Counter"]  // Create SQL version
    }
  ]
}
```

**Note**: Data is NOT automatically migrated. Implement custom migration logic if needed.

---

## Migration Validation

### Before Deployment

```bash
# Validate wrangler.jsonc
./scripts/validate-do-config.sh

# Check for common mistakes
jq '.migrations' wrangler.jsonc

# Verify class exports
grep -r "export.*Counter" src/
```

### Deployment

```bash
# Deploy atomically
wrangler deploy

# Check status
wrangler tail
```

### Rollback

```bash
# Restore backup
cp wrangler.jsonc.backup wrangler.jsonc

# Redeploy
wrangler deploy
```

---

## Common Mistakes

### ❌ Missing Migration for New Class

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "COUNTER", "class_name": "Counter" }]
  }
  // ❌ No migrations array
}
```

### ❌ Wrong Migration Type (KV vs SQL)

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["Counter"]  // ❌ Should be new_sqlite_classes
    }
  ]
}
```

### ❌ Non-Atomic Migration Tags

```jsonc
{
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["Counter"]
    },
    {
      "tag": "v1",  // ❌ Duplicate tag
      "new_sqlite_classes": ["ChatRoom"]
    }
  ]
}
```

---

## Migration Timeline

```
v1 → v2 → v3 → v4
```

**Rules**:
- Tags must be unique
- Migrations are applied in order
- Cannot skip versions
- Cannot modify past migrations

---

## Quick Commands

```bash
# Generate migration
./scripts/migration-generator.sh

# Validate config
./scripts/validate-do-config.sh

# Deploy
wrangler deploy

# Monitor
wrangler tail
```

---

**Last Updated**: 2025-12-27

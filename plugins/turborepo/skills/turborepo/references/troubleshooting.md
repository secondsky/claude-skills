# Turborepo Troubleshooting Guide

Complete guide to diagnosing and fixing common Turborepo issues.

**Reference**: <https://turborepo.com/llms.txt>

---

## Cache Issues

### Problem: Task not using cache when it should

**Symptoms**:
- Tasks rebuild even when nothing changed
- Cache hits showing as misses
- Unexpected rebuilds in CI

**Diagnosis**:
```bash
# Check what's causing cache miss
turbo run build --dry-run=json

# Output shows cache hash and what changed
```

**Solutions**:

1. **Force rebuild to test**:
```bash
turbo run build --force
```

2. **Clear local cache**:
```bash
rm -rf ./node_modules/.cache/turbo
```

3. **Check global dependencies**:
```json
{
  "globalDependencies": ["**/.env.*local", "tsconfig.json"]
}
```
Ensure all files that affect builds are listed.

4. **Verify environment variables**:
```json
{
  "pipeline": {
    "build": {
      "env": ["NODE_ENV", "API_URL"]
    }
  }
}
```
Missing env vars cause cache misses.

5. **Check outputs configuration**:
```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    }
  }
}
```
Ensure all generated files are in outputs.

---

### Problem: Cache too large

**Symptoms**:
- Disk space filling up
- Slow cache operations
- Large `.turbo` directory

**Solutions**:

1. **Limit cache size in turbo.json**:
```json
{
  "cacheDir": ".turbo",
  "cacheSize": "50gb"
}
```

2. **Clean old cache entries**:
```bash
# Manual cleanup
rm -rf ./node_modules/.cache/turbo

# Or use turbo command
turbo run build --force # Skip cache for this run
```

3. **Exclude unnecessary files from outputs**:
```json
{
  "pipeline": {
    "build": {
      "outputs": [
        ".next/**",
        "!.next/cache/**",  // Exclude large cache dirs
        "!.next/trace"      // Exclude trace files
      ]
    }
  }
}
```

---

## Dependency Issues

### Problem: Internal package not found

**Symptoms**:
- `Cannot find module '@myorg/ui'`
- Build fails with missing dependencies
- TypeScript errors about missing packages

**Diagnosis**:
```bash
# Check package is linked
npm ls @myorg/ui

# Verify workspace structure
npm ls
```

**Solutions**:

1. **Reinstall dependencies**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

2. **Check package names match**:
```json
// packages/ui/package.json
{
  "name": "@myorg/ui"  // Must match import
}

// apps/web/package.json
{
  "dependencies": {
    "@myorg/ui": "*"  // Must match package name
  }
}
```

3. **Rebuild dependencies**:
```bash
# Build all dependencies of web
turbo run build --filter='...web'
```

4. **Verify workspace configuration**:
```json
// Root package.json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

---

### Problem: Version mismatches

**Symptoms**:
- Different package versions across workspace
- Dependency conflicts
- Build errors from incompatible versions

**Solutions**:

1. **Use workspace protocol (pnpm/yarn)**:
```json
{
  "dependencies": {
    "@myorg/ui": "workspace:*"  // Always uses workspace version
  }
}
```

2. **Deduplicate dependencies**:
```bash
# npm
npm dedupe

# pnpm
pnpm dedupe

# yarn
yarn dedupe
```

3. **Check for hoisting issues**:
```json
// .npmrc
hoist=true
hoist-pattern[]=*
```

---

## Task Execution Issues

### Problem: Tasks running in wrong order

**Symptoms**:
- Tests run before build completes
- Dependencies not built first
- Race conditions in task execution

**Solutions**:

1. **Check `dependsOn` configuration**:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]  // Run dependencies' build first
    },
    "test": {
      "dependsOn": ["build"]   // Run own build first
    }
  }
}
```

2. **Use `^task` for dependency tasks**:
```json
{
  "build": {
    "dependsOn": ["^build"]  // ^ means run in dependencies first
  }
}
```

3. **Verify task names match package.json scripts**:
```json
// package.json
{
  "scripts": {
    "build": "tsc",    // Must match turbo.json task name
    "test": "jest"
  }
}
```

4. **Check for circular dependencies**:
```bash
turbo run build --dry-run
# Shows task execution order
```

---

### Problem: Dev server not starting

**Symptoms**:
- `turbo run dev` exits immediately
- Dev servers don't stay running
- Concurrent dev servers interfere

**Solutions**:

1. **Add `persistent` flag**:
```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true  // Keeps task running
    }
  }
}
```

2. **Disable cache for dev**:
```json
{
  "pipeline": {
    "dev": {
      "cache": false  // Dev servers shouldn't cache
    }
  }
}
```

3. **Use correct output mode**:
```json
{
  "pipeline": {
    "dev": {
      "outputMode": "full"  // See all dev server output
    }
  }
}
```

---

### Problem: Tasks skip unexpectedly

**Symptoms**:
- Tasks show as "cached" but shouldn't
- Builds not running when expected
- Changes not triggering rebuilds

**Solutions**:

1. **Check inputs configuration**:
```json
{
  "pipeline": {
    "build": {
      "inputs": ["src/**/*.ts", "!src/**/*.test.ts"]
    }
  }
}
```

2. **Force execution**:
```bash
turbo run build --force
```

3. **Clear cache**:
```bash
rm -rf ./node_modules/.cache/turbo
```

---

## Performance Issues

### Problem: Builds taking too long

**Symptoms**:
- Slow builds in CI
- Sequential execution instead of parallel
- All packages building unnecessarily

**Solutions**:

1. **Run with concurrency limit**:
```bash
# Limit to 2 concurrent tasks
turbo run build --concurrency=2

# Use percentage of CPU cores
turbo run build --concurrency=50%
```

2. **Use filters to build less**:
```bash
# Only build changed packages
turbo run build --filter='...[origin/main]'

# Only build specific app
turbo run build --filter=web
```

3. **Check for unnecessary dependencies**:
```bash
# Dry run shows what will execute
turbo run build --dry-run

# JSON output for analysis
turbo run build --dry-run=json
```

4. **Optimize task pipeline**:
```json
{
  "pipeline": {
    "lint": {
      // Don't depend on build if not needed
      "outputs": []
    }
  }
}
```

5. **Enable remote caching**:
```bash
turbo login
turbo link
```
Remote cache dramatically speeds up CI.

---

### Problem: Remote cache not working

**Symptoms**:
- No cache hits in CI
- "Cache miss" on every run
- Slow CI despite remote cache

**Solutions**:

1. **Verify authentication**:
```bash
turbo link
# Should show linked team/project
```

2. **Check environment variables**:
```bash
echo $TURBO_TOKEN
echo $TURBO_TEAM

# In CI, set these secrets
```

3. **Test connection**:
```bash
turbo run build --output-logs=hash-only
# Should show cache hash
```

4. **Verify cache configuration**:
```json
// .turbo/config.json
{
  "teamid": "team_123",
  "apiurl": "https://vercel.com/api",
  "token": "your-token"
}
```

5. **Check CI setup**:
```yaml
# GitHub Actions
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

---

## CI/CD Issues

### Problem: Cache not persisting in CI

**Solutions**:

1. **Cache node_modules**:
```yaml
# GitHub Actions
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

2. **Use remote cache**:
```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

3. **Cache .turbo directory**:
```yaml
- uses: actions/cache@v3
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-
```

---

### Problem: Out of memory in CI

**Solutions**:

1. **Limit concurrency**:
```bash
turbo run build --concurrency=1
```

2. **Increase Node.js memory**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" turbo run build
```

3. **Use filters to reduce scope**:
```bash
turbo run build --filter='...[origin/main]'
```

---

## Docker Issues

### Problem: Docker builds failing

**Solutions**:

1. **Use turbo prune**:
```dockerfile
FROM node:18-alpine AS builder
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker
```

2. **Copy pruned output**:
```dockerfile
FROM node:18-alpine AS installer
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./
RUN npm install
```

3. **Use multi-stage builds**:
See `templates/Dockerfile` for complete example.

---

## Environment Variable Issues

### Problem: Builds not invalidating on env changes

**Solutions**:

1. **Declare environment variables**:
```json
{
  "pipeline": {
    "build": {
      "env": ["NEXT_PUBLIC_API_URL", "DATABASE_URL"]
    }
  }
}
```

2. **Use globalEnv for all tasks**:
```json
{
  "globalEnv": ["NODE_ENV", "CI"]
}
```

3. **Use passThroughEnv for debugging**:
```json
{
  "pipeline": {
    "build": {
      "passThroughEnv": ["DEBUG"]  // Don't affect cache
    }
  }
}
```

---

## Common Error Messages

### "Could not find turbo.json"

**Solution**: Create turbo.json in repository root.

### "No tasks were executed"

**Solution**: Check that task names in turbo.json match package.json scripts.

### "Workspace not found"

**Solution**: Verify workspaces configuration in root package.json.

### "Cannot find package"

**Solution**: Run `npm install` to link workspace packages.

---

## Debugging Commands

```bash
# See what will execute
turbo run build --dry-run

# JSON output for analysis
turbo run build --dry-run=json

# Force execution (skip cache)
turbo run build --force

# Verbose output
turbo run build --output-logs=full

# See cache hash
turbo run build --output-logs=hash-only

# Check Turborepo version
turbo --version

# List all packages
turbo ls

# Verify workspace structure
npm ls
```

---

**Last Updated**: 2025-11-19
**Source**: <https://turborepo.com/llms.txt>

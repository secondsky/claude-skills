# Turborepo Migration Guide

Complete guide to migrating from other monorepo tools to Turborepo.

**Reference**: <https://turborepo.com/llms.txt>

---

## Overview

Turborepo is designed to be a drop-in replacement for existing monorepo tools with minimal configuration changes. This guide covers:

- Migrating from Lerna
- Migrating from Nx
- Migrating from custom scripts
- Coexistence strategies
- Common pitfalls

---

## Migrating from Lerna

### Why Migrate?

**Turborepo advantages over Lerna**:
- **Faster**: Rust-based with intelligent caching
- **Simpler**: Less configuration needed
- **Remote caching**: Built-in team cache sharing
- **Better DX**: Clearer task dependencies
- **Active development**: Modern tooling and features

### Migration Steps

#### 1. Install Turborepo

```bash
# Remove Lerna
npm uninstall lerna

# Install Turborepo
npm install turbo --save-dev
```

#### 2. Convert Configuration

**Lerna (lerna.json)**:
```json
{
  "version": "independent",
  "npmClient": "npm",
  "packages": ["packages/*"],
  "command": {
    "run": {
      "npmClient": "npm"
    },
    "bootstrap": {
      "hoist": true
    }
  }
}
```

**Turborepo (turbo.json)**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

#### 3. Update Scripts

**Before (with Lerna)**:
```json
{
  "scripts": {
    "build": "lerna run build",
    "test": "lerna run test",
    "publish": "lerna publish"
  }
}
```

**After (with Turborepo)**:
```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "publish": "lerna publish"  // Keep Lerna for publishing
  }
}
```

**Note**: You can keep Lerna for publishing while using Turborepo for builds:

```bash
npm install lerna --save-dev
```

#### 4. Update Workspace Configuration

**Keep your workspace config** (Lerna uses npm/yarn/pnpm workspaces):

```json
// package.json
{
  "workspaces": ["packages/*", "apps/*"]
}
```

#### 5. Update CI/CD

**Before (Lerna)**:
```yaml
- run: npx lerna bootstrap
- run: npx lerna run build
- run: npx lerna run test
```

**After (Turborepo)**:
```yaml
- run: npm ci
- run: npx turbo run build test
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

#### 6. Migration Checklist

- [ ] Install turbo, remove lerna (or keep for publishing)
- [ ] Create turbo.json with pipeline configuration
- [ ] Update package.json scripts
- [ ] Test builds locally
- [ ] Update CI/CD workflows
- [ ] Enable remote caching
- [ ] Test full pipeline
- [ ] Deploy to production

### Lerna → Turborepo Mapping

| Lerna Command | Turborepo Equivalent |
|--------------|---------------------|
| `lerna run build` | `turbo run build` |
| `lerna run test --scope=package` | `turbo run test --filter=package` |
| `lerna run build --since main` | `turbo run build --filter='...[main]'` |
| `lerna bootstrap` | `npm install` (use workspace manager) |
| `lerna changed` | `turbo run build --filter='...[HEAD]' --dry-run` |
| `lerna publish` | Keep using `lerna publish` or use changesets |

### Coexistence Strategy

You can use both Lerna and Turborepo:

```json
{
  "scripts": {
    "build": "turbo run build",      // Use Turbo for tasks
    "test": "turbo run test",
    "publish": "lerna publish"        // Use Lerna for publishing
  },
  "devDependencies": {
    "lerna": "^8.0.0",
    "turbo": "^2.0.0"
  }
}
```

---

## Migrating from Nx

### Why Migrate?

**Consider Turborepo if**:
- You want simpler configuration
- You prefer convention over configuration
- You need faster builds (Rust-based)
- You want built-in remote caching

**Keep Nx if**:
- You need advanced features (affected tests, generators, etc.)
- You have complex workspace dependencies
- You rely on Nx plugins heavily

### Migration Steps

#### 1. Install Turborepo

```bash
npm install turbo --save-dev
```

#### 2. Convert Configuration

**Nx (nx.json)**:
```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Turborepo (turbo.json)**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```

#### 3. Update Scripts

**Before (Nx)**:
```json
{
  "scripts": {
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all",
    "affected:build": "nx affected --target=build"
  }
}
```

**After (Turborepo)**:
```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "affected:build": "turbo run build --filter='...[origin/main]'"
  }
}
```

#### 4. Convert Dependencies

**Nx (project.json)**:
```json
{
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Turborepo (turbo.json)**:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

#### 5. Migration Checklist

- [ ] Install turbo
- [ ] Create turbo.json from nx.json
- [ ] Convert targetDefaults to pipeline
- [ ] Update scripts in package.json
- [ ] Test builds locally
- [ ] Convert affected commands to filters
- [ ] Update CI/CD
- [ ] Enable remote caching
- [ ] Remove Nx (optional - can coexist)

### Nx → Turborepo Mapping

| Nx Command | Turborepo Equivalent |
|-----------|---------------------|
| `nx run-many --target=build --all` | `turbo run build` |
| `nx run app:build` | `turbo run build --filter=app` |
| `nx affected --target=build` | `turbo run build --filter='...[origin/main]'` |
| `nx affected --target=test --base=main` | `turbo run test --filter='...[main]'` |
| `nx dep-graph` | `turbo run build --graph` |
| `nx reset` | `rm -rf .turbo` |

### Coexistence Strategy

You can use both Nx and Turborepo:

```json
{
  "scripts": {
    "build": "turbo run build",           // Use Turbo for builds
    "test": "turbo run test",
    "generate": "nx generate @nx/react"   // Keep Nx for generators
  }
}
```

---

## Migrating from Custom Scripts

### Common Patterns

#### Pattern 1: Sequential Builds

**Before (custom script)**:
```bash
#!/bin/bash
cd packages/ui && npm run build
cd ../utils && npm run build
cd ../../apps/web && npm run build
```

**After (Turborepo)**:
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

```bash
turbo run build  # Automatically handles order
```

#### Pattern 2: Parallel Builds

**Before (custom script)**:
```bash
#!/bin/bash
npm run build:ui &
npm run build:utils &
npm run build:api &
wait
```

**After (Turborepo)**:
```bash
turbo run build  # Automatically parallelizes
```

#### Pattern 3: Conditional Builds

**Before (custom script)**:
```bash
#!/bin/bash
if git diff --name-only HEAD~1 | grep -q "packages/ui"; then
  cd packages/ui && npm run build
fi
```

**After (Turborepo)**:
```bash
turbo run build --filter='...[HEAD~1]'
```

---

## Common Migration Pitfalls

### 1. Task Naming Mismatch

**Problem**: turbo.json tasks don't match package.json scripts

**Solution**: Ensure task names align:

```json
// package.json
{
  "scripts": {
    "build": "tsc"  // Must match turbo.json
  }
}

// turbo.json
{
  "pipeline": {
    "build": {  // Must match package.json script
      "outputs": ["dist/**"]
    }
  }
}
```

### 2. Missing Outputs

**Problem**: Builds run every time, cache never hits

**Solution**: Declare all outputs:

```json
{
  "pipeline": {
    "build": {
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**",
        "*.tsbuildinfo"
      ]
    }
  }
}
```

### 3. Incorrect Dependencies

**Problem**: Tasks run in wrong order

**Solution**: Use `^` for dependency tasks:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]  // ^ means dependencies first
    },
    "test": {
      "dependsOn": ["build"]   // No ^ means own task first
    }
  }
}
```

### 4. Environment Variables

**Problem**: Builds not invalidating when env changes

**Solution**: Declare environment variables:

```json
{
  "globalEnv": ["NODE_ENV", "CI"],
  "pipeline": {
    "build": {
      "env": ["API_URL", "DATABASE_URL"]
    }
  }
}
```

### 5. Dev Servers Exiting

**Problem**: Dev servers don't stay running

**Solution**: Mark as persistent:

```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Post-Migration Optimization

### 1. Enable Remote Caching

```bash
turbo login
turbo link
```

### 2. Optimize Task Dependencies

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]
    },
    "lint": {},  // Can run in parallel with build
    "test": {
      "dependsOn": ["build"]  // Needs build first
    }
  }
}
```

### 3. Use Filters in CI

```yaml
# Only build changed packages
- run: turbo run build --filter='...[origin/main]'
```

### 4. Configure Output Modes

```json
{
  "pipeline": {
    "build": {
      "outputMode": "errors-only"
    }
  }
}
```

---

## Rollback Strategy

If migration issues arise:

### Keep Old Tool Temporarily

```json
{
  "scripts": {
    "build": "turbo run build",
    "build:old": "lerna run build"  // Fallback
  }
}
```

### Gradual Migration

```json
{
  "scripts": {
    "build:new": "turbo run build --filter=ui",  // Migrate one package
    "build:old": "lerna run build --scope=!ui"   // Keep others
  }
}
```

---

## Success Metrics

Track these metrics post-migration:

- **Build time**: Should improve 50-90%
- **Cache hit rate**: Aim for >70% in CI
- **Developer satisfaction**: Faster local builds
- **CI costs**: Reduced compute time

---

## Getting Help

### Common Issues

- Task execution order problems → Check `dependsOn`
- Cache not working → Verify `outputs` configuration
- Slow builds → Enable remote caching
- Tasks skipping → Check task names match

### Resources

- **Troubleshooting**: See `references/troubleshooting.md`
- **Official Docs**: <https://turbo.build/repo/docs>
- **Discord**: <https://turbo.build/discord>
- **LLM Docs**: <https://turborepo.com/llms.txt>

---

**Last Updated**: 2025-11-19
**Source**: <https://turborepo.com/llms.txt>

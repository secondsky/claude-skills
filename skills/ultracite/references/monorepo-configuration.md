# Ultracite Monorepo Configuration

Complete guide for configuring Ultracite in monorepos with Turborepo, Nx, and pnpm workspaces.

**Last Updated**: 2025-11-22

---

## Overview

Ultracite supports monorepos with:
- **Shared configurations** across packages
- **Package-specific overrides** for custom rules
- **Performance optimizations** for large codebases
- **Workspace-aware linting** (Turborepo, Nx, pnpm)

**Benefits**:
- Single source of truth for linting rules
- Per-package customization when needed
- Faster linting with caching (Turborepo)
- Consistent code quality across all packages

---

## Configuration Strategies

### Strategy 1: Single Root Config (Simplest)

**Best for**: Small monorepos (< 10 packages) with similar requirements

**Structure**:
```
monorepo/
├── biome.json              # ← Single config for entire repo
├── apps/
│   ├── web/
│   └── mobile/
└── packages/
    ├── ui/
    └── utils/
```

**Root `biome.json`**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core", "ultracite/react"],

  "files": {
    "ignore": [
      "**/dist",
      "**/build",
      "**/.next",
      "**/node_modules"
    ]
  }
}
```

**Usage**:
```bash
# Lint entire monorepo
ultracite check

# Lint specific package
ultracite check apps/web
```

---

### Strategy 2: Shared Config + Overrides (Recommended)

**Best for**: Medium monorepos (10-50 packages) with some variation

**Structure**:
```
monorepo/
├── biome.json              # ← Shared base config
├── apps/
│   ├── web/
│   │   └── biome.json      # ← Next.js-specific overrides
│   └── mobile/
│       └── biome.json      # ← React Native overrides
└── packages/
    ├── ui/
    │   └── biome.json      # ← React component overrides
    └── utils/
        └── biome.json      # ← Utility library overrides
```

**Root `biome.json`** (shared):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],

  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "error",
        "noDebugger": "error"
      }
    }
  }
}
```

**`apps/web/biome.json`** (Next.js):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["../../biome.json", "ultracite/nextjs"],

  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"  // Allow console.log in Next.js app
      }
    }
  }
}
```

**`packages/ui/biome.json`** (React library):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["../../biome.json", "ultracite/react"],

  "linter": {
    "rules": {
      "a11y": {
        "all": "error"  // Strict accessibility for UI library
      }
    }
  }
}
```

---

### Strategy 3: Per-Package Configs (Flexible)

**Best for**: Large monorepos (50+ packages) with diverse requirements

**Structure**:
```
monorepo/
├── .ultracite/
│   ├── base.json           # ← Shared base
│   ├── react.json          # ← React apps/packages
│   └── node.json           # ← Node.js packages
├── apps/
│   └── web/
│       └── biome.json      # extends .ultracite/react.json
└── packages/
    └── api/
        └── biome.json      # extends .ultracite/node.json
```

**`.ultracite/base.json`**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["ultracite/core"],

  "formatter": {
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

**`.ultracite/react.json`**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["./base.json", "ultracite/react"]
}
```

**`apps/web/biome.json`**:
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["../../.ultracite/react.json", "ultracite/nextjs"]
}
```

---

## Turborepo Integration

### Setup

**Install**:
```bash
bun add -D ultracite
```

**`turbo.json`**:
```json
{
  "tasks": {
    "lint": {
      "cache": true,
      "inputs": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
        "biome.json"
      ],
      "outputs": []
    },
    "lint:fix": {
      "cache": false,
      "dependsOn": ["^lint:fix"]
    }
  }
}
```

---

### Package Scripts

**Root `package.json`**:
```json
{
  "scripts": {
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix"
  }
}
```

**`apps/web/package.json`**:
```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:fix": "ultracite check --write"
  }
}
```

**`packages/ui/package.json`**:
```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:fix": "ultracite check --write"
  }
}
```

---

### Running Lints

```bash
# Lint all packages (parallel, cached)
turbo run lint

# Lint all packages and fix
turbo run lint:fix

# Lint specific package
turbo run lint --filter=web

# Lint changed packages only
turbo run lint --filter=[HEAD^1]
```

---

### Cache Benefits

**First run** (no cache):
```
Tasks:    5 successful, 5 total
Cached:   0 cached, 5 total
Time:     12.3s
```

**Second run** (with cache):
```
Tasks:    5 successful, 5 total
Cached:   5 cached, 5 total
Time:     0.1s  ← 99% faster!
```

---

## Nx Integration

### Setup

**Install**:
```bash
bun add -D ultracite
```

**`nx.json`**:
```json
{
  "targetDefaults": {
    "lint": {
      "cache": true,
      "inputs": [
        "{projectRoot}/**/*.ts",
        "{projectRoot}/**/*.tsx",
        "{projectRoot}/biome.json",
        "{workspaceRoot}/biome.json"
      ]
    }
  }
}
```

---

### Project Configuration

**`apps/web/project.json`**:
```json
{
  "name": "web",
  "targets": {
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "ultracite check",
        "cwd": "apps/web"
      }
    },
    "lint:fix": {
      "executor": "nx:run-commands",
      "options": {
        "command": "ultracite check --write",
        "cwd": "apps/web"
      }
    }
  }
}
```

---

### Running Lints

```bash
# Lint all projects
nx run-many --target=lint --all

# Lint specific project
nx run web:lint

# Lint affected projects only
nx affected --target=lint

# Lint and fix
nx run web:lint:fix
```

---

## pnpm Workspaces

### Setup

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root `package.json`**:
```json
{
  "scripts": {
    "lint": "pnpm --recursive --parallel run lint",
    "lint:fix": "pnpm --recursive run lint:fix"
  },
  "devDependencies": {
    "ultracite": "^0.9.0"
  }
}
```

---

### Package Scripts

**`apps/web/package.json`**:
```json
{
  "scripts": {
    "lint": "ultracite check",
    "lint:fix": "ultracite check --write"
  }
}
```

---

### Running Lints

```bash
# Lint all packages (parallel)
pnpm lint

# Lint specific package
pnpm --filter web lint

# Lint and fix all packages
pnpm lint:fix

# Lint changed packages only
pnpm --filter "...[HEAD^1]" lint
```

---

## Package-Specific Overrides

### Example: Strict Library, Relaxed App

**`packages/ui/biome.json`** (strict):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["../../biome.json", "ultracite/react"],

  "linter": {
    "rules": {
      "a11y": {
        "all": "error"           // Strict accessibility
      },
      "suspicious": {
        "noConsoleLog": "error",  // No console.log
        "noDebugger": "error"     // No debugger
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "error",
          "options": { "maxComplexity": 10 }  // Lower complexity limit
        }
      }
    }
  }
}
```

**`apps/web/biome.json`** (relaxed):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "extends": ["../../biome.json", "ultracite/nextjs"],

  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"     // Allow console.log in app
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": "off"  // No complexity limit
      }
    }
  }
}
```

---

## Performance Optimizations

### 1. Use Workspace-Aware Commands

**Turborepo**:
```bash
# ✓ Only lints changed packages
turbo run lint --filter=[HEAD^1]

# ✗ Lints all packages
turbo run lint
```

**Nx**:
```bash
# ✓ Only lints affected projects
nx affected --target=lint

# ✗ Lints all projects
nx run-many --target=lint --all
```

---

### 2. Leverage Caching

**Turborepo** (automatic):
```json
{
  "tasks": {
    "lint": {
      "cache": true  // ← Enables caching
    }
  }
}
```

**Nx** (automatic):
```json
{
  "targetDefaults": {
    "lint": {
      "cache": true  // ← Enables caching
    }
  }
}
```

---

### 3. Parallel Execution

**Turborepo** (default):
```bash
turbo run lint  # Runs in parallel automatically
```

**pnpm**:
```bash
pnpm --recursive --parallel run lint
```

**Nx** (configurable):
```bash
nx run-many --target=lint --all --parallel=3
```

---

### 4. Incremental Linting

**Git hook integration** (only lint staged files):

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Only lint staged files
ultracite check --staged --write
```

---

## Troubleshooting

### Config Not Found

**Error**:
```
Configuration file not found
```

**Fix**: Ensure `biome.json` exists in package root or parent directory:

```bash
# Check config path
ultracite check --verbose

# Specify config explicitly
ultracite check --config-path=../../biome.json
```

---

### Rules Overridden Unexpectedly

**Issue**: Child config doesn't override parent rules

**Fix**: Use explicit rule values:

```jsonc
{
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"  // ← Must be explicit, not inherited
      }
    }
  }
}
```

---

### Slow Linting in Large Monorepo

**Solutions**:

1. **Enable caching** (Turborepo/Nx)
2. **Lint changed packages only**:
   ```bash
   turbo run lint --filter=[HEAD^1]
   ```
3. **Use parallel execution**:
   ```bash
   pnpm --recursive --parallel run lint
   ```
4. **Exclude unnecessary files**:
   ```jsonc
   {
     "files": {
       "ignore": [
         "**/dist",
         "**/.next",
         "**/coverage",
         "**/*.generated.ts"
       ]
     }
   }
   ```

---

## Best Practices

1. **Use root config for shared rules** (DRY principle)
2. **Override only when necessary** (avoid config duplication)
3. **Leverage workspace caching** (Turborepo/Nx)
4. **Lint changed packages only** in CI
5. **Run lints in parallel** for speed
6. **Use `--filter` flags** to target specific packages
7. **Document config strategy** in root README
8. **Keep configs close to code** (per-package `biome.json`)

---

**See also:**
- `configuration-guide.md` for Ultracite configuration details
- `git-hooks-setup.md` for pre-commit integration
- `troubleshooting.md` for common issues

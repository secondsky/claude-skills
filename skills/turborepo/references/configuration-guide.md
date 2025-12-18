# Turborepo Configuration Guide

Complete guide to configuring Turborepo with detailed examples, command options, and framework-specific setups.

**Reference**: <https://turborepo.com/llms.txt>

---

## Table of Contents

1. [turbo.json Configuration](#turbojson-configuration)
2. [Task Pipeline Configuration](#task-pipeline-configuration)
3. [Command Reference](#command-reference)
4. [Framework-Specific Configurations](#framework-specific-configurations)

---

## turbo.json Configuration

### Basic Structure

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.json"],
  "globalEnv": ["NODE_ENV"],
  "pipeline": {
    // Task definitions
  }
}
```

### Complete Example

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    ".env.local",
    "tsconfig.json",
    "package.json"
  ],
  "globalEnv": [
    "NODE_ENV",
    "CI",
    "VERCEL"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["API_URL", "DATABASE_URL"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint"],
      "cache": false
    }
  }
}
```

---

## Task Pipeline Configuration

### Task Properties

| Property | Type | Description |
|----------|------|-------------|
| `dependsOn` | string[] | Tasks to run first |
| `outputs` | string[] | Files/directories to cache |
| `inputs` | string[] | Override input detection |
| `cache` | boolean | Enable/disable caching (default: true) |
| `env` | string[] | Environment variables affecting output |
| `passThroughEnv` | string[] | Env vars that don't affect cache |
| `persistent` | boolean | Keep task running (for dev servers) |
| `outputMode` | string | Control output display |

### Dependency Patterns

**Topological Dependencies (`^`)**:
```json
{
  "build": {
    "dependsOn": ["^build"]  // Run dependencies' build first
  }
}
```

**Regular Dependencies**:
```json
{
  "deploy": {
    "dependsOn": ["build", "test"]  // Run own build and test first
  }
}
```

**Combined Dependencies**:
```json
{
  "test": {
    "dependsOn": ["^build", "lint"]  // Deps' build, then own lint
  }
}
```

### Output Patterns

**Including outputs**:
```json
{
  "build": {
    "outputs": [
      "dist/**",           // All files in dist/
      ".next/**",          // All files in .next/
      "!.next/cache/**",   // Exclude .next/cache/
      "storybook-static/**",
      "*.tsbuildinfo"      // TypeScript build info
    ]
  }
}
```

### Environment Variables

**Task-specific environment variables**:
```json
{
  "build": {
    "env": ["NEXT_PUBLIC_API_URL", "DATABASE_URL"]  // Affects cache
  }
}
```

**Global environment variables**:
```json
{
  "globalEnv": ["NODE_ENV", "CI"]  // Affects all tasks
}
```

**Pass-through environment variables**:
```json
{
  "build": {
    "passThroughEnv": ["DEBUG"]  // Don't affect cache
  }
}
```

### Cache Configuration

**Disable cache for specific tasks**:
```json
{
  "dev": {
    "cache": false  // Dev servers shouldn't cache
  }
}
```

**Configure cache directory**:
```json
{
  "cacheDir": ".turbo",
  "cacheSize": "50gb"
}
```

### Input Configuration

**Override input detection**:
```json
{
  "build": {
    "inputs": ["src/**/*.ts", "!src/**/*.test.ts"]
  }
}
```

### Output Modes

```json
{
  "pipeline": {
    "build": {
      "outputMode": "errors-only"  // Only show errors
    }
  }
}
```

Options:
- `full` - Show all output (default)
- `errors-only` - Only show errors
- `new-only` - Only show new output
- `hash-only` - Only show hash
- `none` - No output

---

## Command Reference

### turbo run

Run tasks across packages with various options.

**Basic usage**:
```bash
# Run single task
turbo run build

# Run multiple tasks
turbo run build test lint

# Run in specific packages
turbo run build --filter=web
turbo run build --filter=@myorg/ui

# Run with pattern
turbo run build --filter='./apps/*'
```

**Filter options**:
```bash
# Git-based filters
--filter='[origin/main]'           # Changed since main
--filter='[HEAD~1]'                # Changed in last commit
--filter='...[HEAD]'               # Uncommitted changes

# Dependency filters
--filter='...web'                  # Package + dependencies
--filter='web...'                  # Package + dependents
--filter='...web...'               # Package + deps + dependents
--filter='...^web'                 # Dependencies only (exclude package)
--filter='^web...'                 # Dependents only (exclude package)

# Exclude filters
--filter='!web'                    # Exclude specific package
--filter='!*-test'                 # Exclude pattern
```

**Execution options**:
```bash
# Force execution (skip cache)
--force

# Parallel execution control
--concurrency=3                    # Limit to 3 concurrent tasks
--concurrency=50%                  # Use 50% of CPU cores

# Continue on error
--continue

# Dry run
--dry-run
--dry-run=json                     # JSON output
```

**Output control**:
```bash
# Output modes
--output-logs=full                 # Show all output (default)
--output-logs=errors-only          # Only show errors
--output-logs=new-only             # Only show new output
--output-logs=hash-only            # Only show hash
--output-logs=none                 # No output

# Prefix output
--prefix                           # Prefix with package name
```

**Graph visualization**:
```bash
# View task graph
--graph
--graph=task-graph.html            # Save to file
```

### turbo prune

Create a subset of the monorepo for deployment.

**Basic usage**:
```bash
# Prune for specific app
turbo prune --scope=web

# Prune with Docker output
turbo prune --scope=api --docker

# Custom output directory
turbo prune --scope=web --out-dir=./deploy
```

**Docker output structure**:
```
out/
├── json/              # package.json files only
├── full/              # Complete pruned monorepo
└── package-lock.json  # Lockfile
```

**Use in Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

FROM node:18-alpine AS installer
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./
RUN npm install

COPY --from=builder /app/out/full/ .
RUN npx turbo run build --filter=web
```

### turbo gen

Generate code in your monorepo.

**Basic usage**:
```bash
# Generate new workspace
turbo gen workspace

# Generate from custom generator
turbo gen my-generator

# List available generators
turbo gen --list
```

**Create custom generator**:
```json
// turbo/generators/config.ts
import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description: "Generate a new package",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Package name?"
      }
    ],
    actions: [
      {
        type: "add",
        path: "packages/{{name}}/package.json",
        templateFile: "templates/package.json.hbs"
      }
    ]
  });
}
```

### turbo link

Link local repository to remote cache.

**Basic usage**:
```bash
# Link to Vercel (interactive)
turbo link

# Unlink
turbo unlink

# Check link status
turbo link --check
```

**What it does**:
- Authenticates with Vercel
- Links repository to team
- Enables remote caching
- Creates `.turbo/config.json`

### turbo login

Authenticate with Vercel for remote caching.

**Basic usage**:
```bash
# Login (opens browser)
turbo login

# Check login status
turbo whoami
```

### turbo ls

List packages in monorepo.

**Basic usage**:
```bash
# List all packages
turbo ls

# JSON output
turbo ls --json

# Filter packages
turbo ls --filter='./apps/*'
```

---

## Framework-Specific Configurations

### Next.js

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".next/**",
        "!.next/cache/**"
      ],
      "env": [
        "NEXT_PUBLIC_*"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "start": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Full Next.js Monorepo Setup**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    "tsconfig.json"
  ],
  "globalEnv": [
    "NODE_ENV"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".next/**",
        "!.next/cache/**"
      ],
      "env": [
        "NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_GA_ID"
      ]
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Vite

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**"
      ],
      "env": [
        "VITE_*"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "preview": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Nuxt

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".output/**",
        ".nuxt/**"
      ],
      "env": [
        "NUXT_*"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "generate": {
      "dependsOn": ["^build"],
      "outputs": [
        ".output/**"
      ]
    }
  }
}
```

### Remix

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "build/**",
        "public/build/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Astro

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "preview": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### SvelteKit

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        ".svelte-kit/**",
        "build/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "preview": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

**Last Updated**: 2025-12-17
**Source**: <https://turborepo.com/llms.txt>

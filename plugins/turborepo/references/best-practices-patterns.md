# Turborepo Best Practices & Common Patterns

Complete guide to monorepo best practices, optimization strategies, and common architectural patterns.

**Reference**: <https://turborepo.com/llms.txt>

---

## Table of Contents

1. [Monorepo Structure Best Practices](#monorepo-structure-best-practices)
2. [Task Pipeline Best Practices](#task-pipeline-best-practices)
3. [Caching Optimization](#caching-optimization)
4. [Environment Variables](#environment-variables)
5. [Remote Caching Strategy](#remote-caching-strategy)
6. [Filtering Strategies](#filtering-strategies)
7. [Script Organization](#script-organization)
8. [Persistent Tasks](#persistent-tasks)
9. [Common Architectural Patterns](#common-architectural-patterns)

---

## Monorepo Structure Best Practices

### Recommended Directory Structure

```
my-monorepo/
├── apps/                    # Applications
│   ├── web/                # Frontend app
│   ├── api/                # Backend API
│   ├── docs/               # Documentation site
│   └── mobile/             # Mobile app
│
├── packages/               # Shared packages
│   ├── ui/                 # UI components
│   ├── config/             # Shared configs
│   ├── utils/              # Utilities
│   ├── database/           # Database client/migrations
│   ├── types/              # Shared TypeScript types
│   └── tsconfig/           # TS configuration packages
│
├── tooling/                # Development tools
│   ├── eslint-config/      # ESLint configurations
│   ├── prettier-config/    # Prettier configurations
│   └── typescript-config/  # TypeScript base configs
│
├── turbo.json              # Turborepo configuration
├── package.json            # Root package.json
└── pnpm-workspace.yaml     # Workspace configuration
```

### Why This Structure?

**apps/**: Applications are consumers of packages
- Each app is independently deployable
- Apps depend on packages but not on other apps
- Clear separation of concerns

**packages/**: Reusable shared code
- Can be used by multiple apps
- Independently versioned (optional)
- Clear dependency boundaries

**tooling/**: Development tooling
- Shared configurations
- Build tools
- Code generation

### Package Naming Conventions

```json
// Use scoped packages for internal packages
{
  "name": "@myorg/ui",           // Shared UI components
  "name": "@myorg/database",     // Database client
  "name": "@myorg/config"        // Shared config
}

// Use descriptive names for apps
{
  "name": "@myorg/web",          // Web application
  "name": "@myorg/api",          // API server
  "name": "@myorg/docs"          // Documentation
}
```

---

## Task Pipeline Best Practices

### Define Clear Task Dependencies

**Good**: Explicit dependencies
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"]          // Dependencies build first
    },
    "test": {
      "dependsOn": ["build"]           // Own build, then test
    },
    "lint": {
      "dependsOn": ["^build"]          // Dependencies build first
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint"]  // All checks pass
    }
  }
}
```

**Why**:
- Ensures correct execution order
- Prevents race conditions
- Clear task relationships

### Task Dependency Patterns

**Pattern 1: Topological Build**
```json
{
  "build": {
    "dependsOn": ["^build"]  // Build dependencies first
  }
}
```
Use when: Packages depend on each other's build outputs

**Pattern 2: Local First**
```json
{
  "test": {
    "dependsOn": ["build"]  // Build own package first
  }
}
```
Use when: Task needs own package's build output

**Pattern 3: Combined**
```json
{
  "e2e": {
    "dependsOn": ["^build", "build", "db:seed"]
  }
}
```
Use when: Complex task needs multiple prerequisites

---

## Caching Optimization

### 1. Cache Build Outputs, Not Source Files

**Good**:
```json
{
  "build": {
    "outputs": [
      "dist/**",              // Build output
      ".next/**",             // Next.js output
      "!.next/cache/**"       // Exclude Next.js cache
    ]
  }
}
```

**Bad**:
```json
{
  "build": {
    "outputs": ["src/**"]   // Don't cache source files
  }
}
```

### 2. Include All Generated Files

```json
{
  "build": {
    "outputs": [
      "dist/**",              // Main output
      ".next/**",
      "!.next/cache/**",
      "storybook-static/**",  // Storybook build
      "*.tsbuildinfo"         // TypeScript incremental info
    ]
  }
}
```

### 3. Exclude Cache Directories

```json
{
  "build": {
    "outputs": [
      ".next/**",
      "!.next/cache/**",      // Exclude cache
      "!.next/trace"          // Exclude trace files
    ]
  }
}
```

**Why**: Cache directories can be massive and change frequently

### 4. Disable Cache for Dev Servers

```json
{
  "dev": {
    "cache": false,           // Don't cache dev servers
    "persistent": true        // Keep running
  }
}
```

**Why**: Dev servers should always run fresh

### 5. Configure Global Dependencies

```json
{
  "globalDependencies": [
    ".env",
    ".env.local",
    "tsconfig.json",
    "package.json"
  ]
}
```

**Why**: Changes to these files should invalidate all caches

---

## Environment Variables

### Declare All Environment Variables

```json
{
  "globalEnv": [
    "NODE_ENV",              // Global env for all tasks
    "CI"
  ],
  "pipeline": {
    "build": {
      "env": [
        "NEXT_PUBLIC_API_URL",   // Task-specific env
        "DATABASE_URL"
      ],
      "passThroughEnv": [
        "DEBUG"              // Don't affect cache
      ]
    }
  }
}
```

### Three Types of Environment Variables

**1. globalEnv**: Affects all tasks
```json
{
  "globalEnv": ["NODE_ENV", "CI"]
}
```

**2. env**: Affects specific task cache
```json
{
  "build": {
    "env": ["API_URL"]  // Changes invalidate cache
  }
}
```

**3. passThroughEnv**: Don't affect cache
```json
{
  "build": {
    "passThroughEnv": ["DEBUG"]  // For debugging only
  }
}
```

### Framework-Specific Patterns

**Next.js**:
```json
{
  "build": {
    "env": ["NEXT_PUBLIC_*"]  // All public env vars
  }
}
```

**Vite**:
```json
{
  "build": {
    "env": ["VITE_*"]  // All Vite env vars
  }
}
```

---

## Remote Caching Strategy

### Enable for All Team Members

```bash
# Every developer should run
turbo login
turbo link
```

**Benefits**:
- Share builds across team
- Faster local development
- Consistent builds
- Reduced duplication

### Configure in CI/CD

**GitHub Actions**:
```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

**GitLab CI**:
```yaml
variables:
  TURBO_TOKEN: $TURBO_TOKEN
  TURBO_TEAM: $TURBO_TEAM
```

### Expected Performance Gains

| Scenario | Without Remote Cache | With Remote Cache | Improvement |
|----------|---------------------|-------------------|-------------|
| Local dev (cache miss) | 5 min | 5 min | 0% |
| Local dev (cache hit) | 5 min | 10 sec | 95% |
| CI fresh build | 10 min | 10 min | 0% |
| CI cached build | 10 min | 1 min | 90% |
| Team member pull | 5 min | 30 sec | 90% |

---

## Filtering Strategies

### Use Git-Based Filters in CI

```bash
# Build only changed packages
turbo run build --filter='...[origin/main]'

# Test only affected packages
turbo run test --filter='...[origin/main]...'
```

**Benefits**:
- Faster CI builds (50-90% reduction)
- Only test what changed
- Reduced compute costs

### Build Specific Apps with Dependencies

```bash
# Build web app and all its dependencies
turbo run build --filter='...web'

# Build all apps
turbo run build --filter='./apps/*'
```

### Test Only Affected Code

```bash
# Test changed packages and their dependents
turbo run test --filter='...[HEAD^1]...'
```

**Why**: Changes to a package might break dependents

---

## Script Organization

### Root package.json Scripts

**Good**: Consistent, predictable scripts
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "turbo run format"
  }
}
```

**Why**:
- Consistent commands across projects
- Easy onboarding
- CI/CD friendly

### Package-Level Scripts

**Good**: Standard names
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src",
    "test": "jest",
    "clean": "rm -rf dist"
  }
}
```

**Why**: Turborepo looks for these script names

---

## Persistent Tasks

### Configure Dev Servers Correctly

```json
{
  "pipeline": {
    "dev": {
      "cache": false,        // Dev servers shouldn't cache
      "persistent": true     // Keep running
    }
  }
}
```

**Why**:
- `cache: false`: Dev servers should always run fresh
- `persistent: true`: Prevents Turborepo from exiting

### Multiple Dev Servers

```bash
# Run all dev servers in parallel
turbo run dev

# Run specific apps
turbo run dev --filter=web --filter=api
```

**Result**: All dev servers run concurrently

---

## Common Architectural Patterns

### Pattern 1: Full-Stack Application

**Structure**:
```
my-monorepo/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Express backend
│   └── mobile/       # React Native app
│
└── packages/
    ├── ui/           # Shared UI components
    ├── database/     # Database client/migrations
    ├── types/        # Shared TypeScript types
    ├── utils/        # Shared utilities
    └── config/       # Shared configs
```

**Dependencies**:
```json
// apps/web/package.json
{
  "dependencies": {
    "@myorg/ui": "*",
    "@myorg/types": "*",
    "@myorg/utils": "*"
  }
}

// apps/api/package.json
{
  "dependencies": {
    "@myorg/database": "*",
    "@myorg/types": "*",
    "@myorg/utils": "*"
  }
}

// apps/mobile/package.json
{
  "dependencies": {
    "@myorg/ui": "*",
    "@myorg/types": "*"
  }
}
```

**Task Pipeline**:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false,
      "dependsOn": ["db:migrate"]
    }
  }
}
```

---

### Pattern 2: Shared Component Library

**Structure**:
```
my-monorepo/
├── packages/
│   ├── ui/                    # Component library
│   │   ├── src/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui-docs/              # Storybook documentation
│       ├── .storybook/
│       ├── stories/
│       └── package.json
│
└── apps/
    ├── web/                  # Consumer app 1
    └── admin/                # Consumer app 2
```

**Component Library package.json**:
```json
{
  "name": "@myorg/ui",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src"
  }
}
```

**Task Pipeline**:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "storybook": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "build-storybook": {
      "dependsOn": ["^build"],
      "outputs": ["storybook-static/**"]
    }
  }
}
```

---

### Pattern 3: Microfrontends

**Structure**:
```
my-monorepo/
├── apps/
│   ├── shell/        # Container/host app
│   ├── dashboard/    # Dashboard MFE
│   ├── settings/     # Settings MFE
│   └── analytics/    # Analytics MFE
│
└── packages/
    ├── shared-ui/    # Shared components
    ├── router/       # Routing logic
    ├── state/        # Global state
    └── types/        # Shared types
```

**Module Federation Setup**:
```json
// apps/shell/package.json
{
  "name": "@myorg/shell",
  "dependencies": {
    "@myorg/shared-ui": "*",
    "@myorg/router": "*"
  }
}

// apps/dashboard/package.json
{
  "name": "@myorg/dashboard",
  "dependencies": {
    "@myorg/shared-ui": "*",
    "@myorg/state": "*"
  }
}
```

**Task Pipeline**:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
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

**Build Strategy**:
```bash
# Build all MFEs
turbo run build --filter='./apps/*'

# Build only changed MFEs
turbo run build --filter='./apps/*...[origin/main]'

# Run all MFEs in dev
turbo run dev --filter='./apps/*'
```

---

### Pattern 4: Multi-Platform (Web + Mobile)

**Structure**:
```
my-monorepo/
├── apps/
│   ├── web/          # Next.js web app
│   ├── mobile/       # React Native app
│   └── api/          # Shared backend
│
└── packages/
    ├── ui/           # Platform-agnostic components
    ├── mobile-ui/    # React Native specific
    ├── web-ui/       # Web specific (using ui)
    ├── api-client/   # API client
    └── types/        # Shared types
```

**Platform-Specific Dependencies**:
```json
// packages/mobile-ui/package.json
{
  "name": "@myorg/mobile-ui",
  "dependencies": {
    "react-native": "*",
    "@myorg/ui": "*"
  }
}

// packages/web-ui/package.json
{
  "name": "@myorg/web-ui",
  "dependencies": {
    "react": "*",
    "react-dom": "*",
    "@myorg/ui": "*"
  }
}
```

**Task Pipeline**:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "ios": {
      "cache": false,
      "persistent": true
    },
    "android": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Summary of Best Practices

### Do:
- ✅ Structure monorepo logically (apps/, packages/, tooling/)
- ✅ Use scoped package names (@myorg/package-name)
- ✅ Define clear task dependencies
- ✅ Cache build outputs, not source files
- ✅ Exclude cache directories from outputs
- ✅ Disable cache for dev servers
- ✅ Declare all environment variables
- ✅ Enable remote caching for team
- ✅ Use git-based filters in CI
- ✅ Organize scripts consistently

### Don't:
- ❌ Cache source files
- ❌ Cache dev server outputs
- ❌ Forget to declare env vars
- ❌ Skip remote caching setup
- ❌ Use vague package names
- ❌ Create circular dependencies
- ❌ Include cache directories in outputs
- ❌ Hardcode environment-specific values

---

**Last Updated**: 2025-12-17
**Source**: <https://turborepo.com/llms.txt>

---
name: nuxt-v4:setup
description: Interactive wizard to set up a new Nuxt 4 project with database integration, UI framework, authentication, and deployment configuration. Use when user wants to create a new Nuxt project or scaffold a full-stack application.
---

# Nuxt Setup Wizard

## Overview

Interactive wizard for complete Nuxt 4 setup: create project, configure modules, add database integration, set up authentication, and configure deployment.

## Prerequisites

Check before starting:
- Node.js 20+ or Bun installed
- Package manager available (bun, npm, or pnpm)
- Write access to target directory

## Steps

### Step 1: Gather Requirements

Use AskUserQuestion to collect setup preferences.

**Question 1: Project Type**
```
header: "Project Type"
question: "What type of application are you building?"
options:
  - label: "Full-Stack Web App (Recommended)"
    description: "SSR, API routes, database, authentication"
  - label: "Marketing Site"
    description: "Static pages, SEO optimized, fast loading"
  - label: "API Backend"
    description: "Server routes only, no frontend"
  - label: "SPA Dashboard"
    description: "Client-side only, no SSR"
```
**Store as**: `projectType`

**Question 2: UI Framework**
```
header: "UI Framework"
question: "Which UI framework would you like to use?"
options:
  - label: "Nuxt UI v4 (Recommended)"
    description: "100+ accessible components, Tailwind v4, Reka UI"
  - label: "Tailwind CSS only"
    description: "Utility-first CSS, no component library"
  - label: "shadcn-vue"
    description: "Copy-paste components with Radix Vue"
  - label: "None"
    description: "No UI framework, custom styling"
```
**Store as**: `uiFramework`

**Question 3: Features** (multiSelect: true)
```
header: "Features"
question: "Which features do you need?"
multiSelect: true
options:
  - label: "Authentication"
    description: "User login, sessions, protected routes"
  - label: "Database"
    description: "D1/PostgreSQL with Drizzle ORM"
  - label: "Content/Blog"
    description: "Nuxt Content for markdown-based content"
  - label: "Testing"
    description: "Vitest for unit and component tests"
```
**Store as**: `features` (array)

**Question 4: Database** (if "Database" selected)
```
header: "Database"
question: "Which database would you like to use?"
options:
  - label: "Cloudflare D1 (Recommended)"
    description: "SQLite at the edge, great for Cloudflare deployment"
  - label: "NuxtHub"
    description: "All-in-one Cloudflare integration (D1, KV, R2)"
  - label: "PostgreSQL"
    description: "Traditional SQL database"
  - label: "None"
    description: "No database, will configure manually"
```
**Store as**: `database`

**Question 5: Deployment Target**
```
header: "Deployment"
question: "Where will you deploy?"
options:
  - label: "Cloudflare Pages (Recommended)"
    description: "Global edge, automatic builds, great free tier"
  - label: "Cloudflare Workers"
    description: "Edge functions with more control"
  - label: "Vercel"
    description: "Great DX, serverless functions"
  - label: "Netlify"
    description: "Simple hosting, good for static sites"
  - label: "Node Server"
    description: "Traditional Node.js server"
```
**Store as**: `deployment`

**Question 6: Package Manager**
```
header: "Package Manager"
question: "Which package manager do you prefer?"
options:
  - label: "bun (Recommended)"
    description: "Fast, all-in-one runtime and package manager"
  - label: "pnpm"
    description: "Efficient disk space, fast installs"
  - label: "npm"
    description: "Standard Node.js package manager"
```
**Store as**: `packageManager`

---

### Step 2: Create Project

**Ask for project name**:
```
header: "Project Name"
question: "What should your project be called?"
```
**Validation**: Lowercase alphanumeric + hyphens only
**Store as**: `projectName`

**Execute**:
```bash
# Create Nuxt 4 project
bunx nuxi@latest init <projectName> --package-manager <packageManager>

# Navigate to project
cd <projectName>
```

**Verify**:
```bash
ls -la
# Should see: nuxt.config.ts, package.json, app/, etc.
```

**Error Handling**:
- If directory exists → Ask user if they want to overwrite or choose different name
- If nuxi fails → Check Node.js version, suggest updates

---

### Step 3: Configure nuxt.config.ts

Build configuration based on user selections:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Enable Nuxt 4 features
  future: {
    compatibilityVersion: 4
  },

  // Development tools
  devtools: { enabled: true },

  // Modules (based on selections)
  modules: [
    // If uiFramework == "Nuxt UI v4"
    '@nuxt/ui',
    // If uiFramework == "Tailwind CSS only"
    '@nuxtjs/tailwindcss',
    // If features includes "Content/Blog"
    '@nuxt/content',
    // If features includes "Database" && database == "NuxtHub"
    '@nuxthub/core',
    // If features includes "Testing"
    '@nuxt/test-utils/module',
  ],

  // Nitro preset (based on deployment)
  nitro: {
    // If deployment == "Cloudflare Pages"
    preset: 'cloudflare-pages',
    // If deployment == "Cloudflare Workers"
    preset: 'cloudflare-module',
    // If deployment == "Vercel"
    preset: 'vercel',
    // If deployment == "Netlify"
    preset: 'netlify',
  },

  // NuxtHub config (if selected)
  // If database == "NuxtHub"
  hub: {
    database: true,
    kv: true,
    blob: true,
    cache: true
  },

  // Runtime config
  runtimeConfig: {
    // Server-only secrets
    apiSecret: process.env.API_SECRET,
    // Public config
    public: {
      appName: '<projectName>'
    }
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Route rules (based on projectType)
  routeRules: {
    // If projectType == "Marketing Site"
    '/': { prerender: true },
    '/about': { prerender: true },
    // If projectType == "SPA Dashboard"
    '/dashboard/**': { ssr: false },
  }
})
```

**Use Edit tool** to update nuxt.config.ts with generated configuration.

---

### Step 4: Install Dependencies

**Base dependencies**:
```bash
<pm> install
```

**UI Framework dependencies**:
```bash
# If uiFramework == "Nuxt UI v4"
<pm> add @nuxt/ui

# If uiFramework == "Tailwind CSS only"
<pm> add -d @nuxtjs/tailwindcss

# If uiFramework == "shadcn-vue"
<pm> add -d shadcn-vue tailwindcss @tailwindcss/vite reka-ui
```

**Feature dependencies**:
```bash
# If features includes "Database"
<pm> add drizzle-orm
<pm> add -d drizzle-kit

# If features includes "Content/Blog"
<pm> add @nuxt/content

# If features includes "Testing"
<pm> add -d @nuxt/test-utils vitest @vue/test-utils happy-dom

# If database == "NuxtHub"
<pm> add @nuxthub/core
```

**Authentication dependencies**:
```bash
# If features includes "Authentication"
<pm> add better-auth
```

---

### Step 5: Create Directory Structure

**Create standard directories**:
```bash
mkdir -p app/components
mkdir -p app/composables
mkdir -p app/layouts
mkdir -p app/pages
mkdir -p app/middleware
mkdir -p app/plugins
mkdir -p app/utils
mkdir -p server/api
mkdir -p server/middleware
mkdir -p server/utils
mkdir -p public
```

**If features includes "Database"**:
```bash
mkdir -p server/database
```

**If features includes "Testing"**:
```bash
mkdir -p tests/unit
mkdir -p tests/components
```

---

### Step 6: Generate Starter Files

**app/app.vue**:
```vue
<script setup lang="ts">
useHead({
  titleTemplate: '%s | <projectName>',
  meta: [
    { name: 'description', content: 'Built with Nuxt 4' }
  ]
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

**app/pages/index.vue**:
```vue
<script setup lang="ts">
useSeoMeta({
  title: 'Home',
  description: 'Welcome to <projectName>'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">Welcome to <projectName></h1>
      <p class="text-gray-600">Your Nuxt 4 application is ready!</p>
    </div>
  </div>
</template>
```

**app/layouts/default.vue**:
```vue
<template>
  <div>
    <slot />
  </div>
</template>
```

**app/error.vue**:
```vue
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-red-500">{{ error.statusCode }}</h1>
      <p class="text-xl mt-4">{{ error.message }}</p>
      <button
        class="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        @click="handleError"
      >
        Go Home
      </button>
    </div>
  </div>
</template>
```

**If features includes "Database"** - server/database/schema.ts:
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
})
```

**If features includes "Database"** - server/utils/db.ts:
```typescript
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '~/server/database/schema'

export function useDB(event: H3Event) {
  const { DB } = event.context.cloudflare.env
  return drizzle(DB, { schema })
}
```

**If features includes "Authentication"** - app/middleware/auth.ts:
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
```

**If features includes "Authentication"** - app/composables/useAuth.ts:
```typescript
export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const isAuthenticated = computed(() => !!user.value)

  const login = async (email: string, password: string) => {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = data.user
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/login')
  }

  return { user, isAuthenticated, login, logout }
}
```

**If features includes "Testing"** - vitest.config.ts:
```typescript
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom'
      }
    }
  }
})
```

---

### Step 7: Configure Deployment

**If deployment == "Cloudflare Pages"**:

Create wrangler.toml:
```toml
name = "<projectName>"
# Use current date for latest Cloudflare runtime features
# Update periodically: https://developers.cloudflare.com/workers/configuration/compatibility-dates/
compatibility_date = "2025-12-29"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".output/public"
```

If database == "D1":
```toml
[[d1_databases]]
binding = "DB"
database_name = "<projectName>-db"
database_id = "<TO_BE_CREATED>"
```

**If deployment == "Vercel"**:

Create vercel.json:
```json
{
  "buildCommand": "bun run build",
  "outputDirectory": ".output/public",
  "framework": "nuxtjs"
}
```

**If deployment == "Netlify"**:

Create netlify.toml:
```toml
[build]
  command = "bun run build"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Step 8: Provide Next Steps

**Success Message**:
```
✅ Nuxt 4 Project Setup Complete!

Project: <projectName>
Directory: ./<projectName>

Configuration Summary:
- Project Type: <projectType>
- UI Framework: <uiFramework>
- Features: <features.join(', ')>
- Database: <database>
- Deployment: <deployment>
- Package Manager: <packageManager>

Created Files:
- nuxt.config.ts (configured)
- app/app.vue
- app/pages/index.vue
- app/layouts/default.vue
- app/error.vue
- server/ directory structure
[If database] - server/database/schema.ts
[If database] - server/utils/db.ts
[If auth] - app/middleware/auth.ts
[If auth] - app/composables/useAuth.ts
[If testing] - vitest.config.ts
[If cloudflare] - wrangler.toml

Next Steps:

1. Start development server:
   cd <projectName>
   <pm> run dev

2. Open in browser:
   http://localhost:3000

[If database == "D1"]
3. Create D1 database:
   wrangler d1 create <projectName>-db
   # Update database_id in wrangler.toml

4. Create first migration:
   mkdir -p migrations
   wrangler d1 migrations create <projectName>-db initial_schema

[If deployment == "Cloudflare Pages"]
5. Deploy to Cloudflare:
   <pm> run build
   wrangler pages deploy .output/public

[If deployment == "Vercel"]
5. Deploy to Vercel:
   vercel

[If deployment == "Netlify"]
5. Deploy to Netlify:
   netlify deploy --prod

Helpful Commands:
- Build for production: <pm> run build
- Preview production: <pm> run preview
- Type check: <pm> run typecheck
[If testing] - Run tests: <pm> run test

📚 Related Skills:
- nuxt-core: Configuration, routing, SEO
- nuxt-data: Data fetching, state management
- nuxt-server: API routes, database patterns
- nuxt-production: Performance, testing, deployment

💡 Tips:
- Use useSeoMeta() for SEO tags
- Use useState() for shared state (not ref())
- Wrap browser APIs in onMounted() or ClientOnly
- Use route rules for caching and prerendering
```

---

## Error Handling

### Node.js Version Too Old
```
❌ Error: Node.js 18+ required

Solution:
1. Update Node.js: nvm install 20
2. Or use Bun: brew install bun
3. Re-run setup command
```

### Directory Already Exists
```
❌ Error: Directory '<projectName>' already exists

Solutions:
1. Choose a different name
2. Delete existing directory: rm -rf <projectName>
3. Use existing directory (may overwrite files)
```

### Package Installation Failed
```
❌ Error: Package installation failed

Solutions:
1. Clear cache: <pm> cache clean
2. Delete node_modules: rm -rf node_modules
3. Reinstall: <pm> install
4. Check network connection
```

### Wrangler Not Authenticated
```
❌ Error: Not authenticated with Cloudflare

Solution:
1. Run: wrangler login
2. Follow authentication flow
3. Re-run deployment command
```

---

## Example Full Workflow

**User Selections**:
- Project Type: Full-Stack Web App
- UI Framework: Nuxt UI v4
- Features: Authentication, Database, Testing
- Database: Cloudflare D1
- Deployment: Cloudflare Pages
- Package Manager: bun
- Project Name: my-awesome-app

**Executed Commands**:
```bash
# 1. Create project
bunx nuxi@latest init my-awesome-app --package-manager bun
cd my-awesome-app

# 2. Install dependencies
bun add @nuxt/ui better-auth drizzle-orm
bun add -d drizzle-kit @nuxt/test-utils vitest @vue/test-utils happy-dom

# 3. Create directory structure
mkdir -p app/components app/composables app/layouts app/pages app/middleware
mkdir -p server/api server/middleware server/utils server/database
mkdir -p tests/unit tests/components

# 4. Generate files (Write tool for each)
# - nuxt.config.ts
# - app/app.vue
# - app/pages/index.vue
# - app/layouts/default.vue
# - app/error.vue
# - server/database/schema.ts
# - server/utils/db.ts
# - app/middleware/auth.ts
# - app/composables/useAuth.ts
# - vitest.config.ts
# - wrangler.toml

# 5. Verify
bun run dev
```

**Result**:
```
✅ Setup complete!
- Project: my-awesome-app
- Ready for development at http://localhost:3000
- Configured for Cloudflare Pages deployment
```

---

## Summary

This command provides **interactive Nuxt 4 setup** through 8 guided steps:
1. Gather requirements (via AskUserQuestion)
2. Create project (nuxi init)
3. Configure nuxt.config.ts
4. Install dependencies
5. Create directory structure
6. Generate starter files
7. Configure deployment
8. Provide next steps and examples

**Output**: Fully configured Nuxt 4 project ready for development, with helpful next steps and code examples.

**When to Use**: Creating new Nuxt 4 projects, scaffolding full-stack applications, or setting up project templates.

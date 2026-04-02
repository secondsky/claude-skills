---
name: nuxt-v5:setup
description: Interactive wizard to set up a new Nuxt 5 project with database integration, UI framework, authentication, and deployment configuration. Use when user wants to create a new Nuxt project or scaffold a full-stack application.
---

# Nuxt 5 Setup Wizard

## Overview

Interactive wizard for complete Nuxt 5 setup: create project, configure modules, add database integration, set up authentication, and configure deployment.

## Prerequisites

Check before starting:
- Node.js 20+ or Bun installed
- Package manager available (bun, npm, or pnpm)
- Write access to target directory

## Steps

### Step 1: Gather Requirements

Use AskUserQuestion to collect setup preferences.

**Question 1: Project Type**
```yaml
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
```yaml
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
```yaml
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
```yaml
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
```yaml
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
```yaml
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
```yaml
header: "Project Name"
question: "What should your project be called?"
```
**Validation**: Lowercase alphanumeric + hyphens only
**Store as**: `projectName`

**Execute**:
```bash
<packageManager> exec nuxi@latest init <projectName> --package-manager <packageManager>
cd <projectName>
```

---

### Step 3: Configure nuxt.config.ts

Build configuration based on user selections:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 5
  },

  devtools: { enabled: true },

  modules: [
    // If uiFramework == "Nuxt UI v4"
    '@nuxt/ui',
    // If features includes "Content/Blog"
    '@nuxt/content',
    // If database == "NuxtHub"
    '@nuxthub/core',
    // If features includes "Testing"
    '@nuxt/test-utils/module',
  ],

  nitro: {
    // Choose ONE preset based on deployment:
    // - Cloudflare Pages: 'cloudflare-pages'
    // - Cloudflare Workers: 'cloudflare-module'
    // - Vercel: 'vercel'
    // - Netlify: 'netlify'
    preset: 'cloudflare-pages',
  },

  // If database == "NuxtHub"
  hub: {
    database: true,
    kv: true,
    blob: true,
    cache: true
  },

  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    public: {
      appName: '<projectName>'
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
  },

  vite: {
    build: {
      rolldownOptions: {
        output: {
          advancedChunks: {
            groups: [{ name: 'vendor', test: /\/(vue|vue-router)/ }]
          }
        }
      }
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/dashboard/**': { ssr: false },
  }
})
```

---

### Step 4: Install Dependencies

```bash
<pm> install
```

**UI Framework**:
```bash
# If uiFramework == "Nuxt UI v4"
<pm> add @nuxt/ui

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

---

### Step 5: Create Directory Structure

```bash
mkdir -p app/components app/composables app/layouts app/pages app/middleware app/plugins app/utils
mkdir -p server/api server/middleware server/utils public
```

---

### Step 6: Generate Starter Files

**app/app.vue**:
```vue
<script setup lang="ts">
useHead({
  titleTemplate: '%s | <projectName>',
  meta: [
    { name: 'description', content: 'Built with Nuxt 5' }
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
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
      <p class="text-gray-600">Your Nuxt 5 application is ready!</p>
    </div>
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
      <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" @click="handleError">
        Go Home
      </button>
    </div>
  </div>
</template>
```

**If features includes "Database"** - server/utils/db.ts:

**If database == "Cloudflare D1" OR database == "NuxtHub"**:
```typescript
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '~/server/database/schema'

export function useDB(event: H3Event) {
  const { DB } = event.context.cloudflare.env
  return drizzle(DB, { schema })
}
```

**If database == "PostgreSQL"**:
```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '~/server/database/schema'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!)
export const useDB = () => drizzle(client, { schema })
```

If database == "PostgreSQL", also install the driver:
```bash
<pm> add postgres
```

And create the schema directory:
```bash
mkdir -p server/database
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
interface User {
  id: string
  email: string
  name?: string
}

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

**If features includes "Authentication"** - server/api/auth/login.post.ts:
```typescript
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }

  // TODO: Replace with real credential validation (database lookup, bcrypt, etc.)
  const user = { id: '1', email, name: email.split('@')[0] }

  setCookie(event, 'auth-session', JSON.stringify(user), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })

  return { user }
})
```

**If features includes "Authentication"** - server/api/auth/logout.post.ts:
```typescript
export default defineEventHandler((event) => {
  deleteCookie(event, 'auth-session')
  return { success: true }
})
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
compatibility_date = "2026-03-30"
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

---

### Step 8: Provide Next Steps

```text
Nuxt 5 Project Setup Complete!

Project: <projectName>
Directory: ./<projectName>

Configuration Summary:
- Project Type: <projectType>
- UI Framework: <uiFramework>
- Features: <features.join(', ')>
- Database: <database>
- Deployment: <deployment>
- Package Manager: <packageManager>

Next Steps:

1. Start development server:
   cd <projectName>
   <pm> run dev

2. Open in browser:
   http://localhost:3000

3. Build for production:
   <pm> run build

4. Type check:
    <packageManager> run typecheck

Helpful Commands:
- Preview production: <pm> run preview
[If testing] - Run tests: <pm> run test
```

---

## Error Handling

### Node.js Version Too Old
```text
Solution:
1. Update Node.js: nvm install 20
2. Or use Bun: brew install bun
3. Re-run setup command
```

### Directory Already Exists
```text
Solutions:
1. Choose a different name
2. Delete existing directory: rm -rf <projectName>
```

### Package Installation Failed
```text
Solutions:
1. Clear cache: <pm> cache clean
2. Delete node_modules: rm -rf node_modules
3. Reinstall: <pm> install
```

---

## Summary

This command provides **interactive Nuxt 5 setup** through 8 guided steps:
1. Gather requirements (via AskUserQuestion)
2. Create project (nuxi init)
3. Configure nuxt.config.ts (with compatibilityVersion: 5, rolldownOptions)
4. Install dependencies
5. Create directory structure
6. Generate starter files
7. Configure deployment
8. Provide next steps

**When to Use**: Creating new Nuxt 5 projects, scaffolding full-stack applications, or setting up project templates.

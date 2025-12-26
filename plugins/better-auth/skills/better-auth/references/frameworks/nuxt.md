# better-auth with Nuxt 3

Complete guide for integrating better-auth with Nuxt 3 and H3.

---

## Installation

```bash
bun add better-auth drizzle-orm postgres
# or with Prisma:
bun add better-auth @prisma/client
```

---

## Server Setup

### 1. Create Auth Configuration

**`server/utils/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "~/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NUXT_PUBLIC_APP_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

### 2. Create API Route Handler

**`server/api/auth/[...all].ts`**:
```typescript
import { auth } from "~/server/utils/auth";
import { toH3Handler } from "better-auth/h3";

export default toH3Handler(auth);
```

---

## Client Setup

### 1. Create Auth Client Plugin

**`plugins/auth-client.ts`**:
```typescript
import { createAuthClient } from "better-auth/vue";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const authClient = createAuthClient({
    baseURL: config.public.appUrl,
  });

  return {
    provide: {
      auth: authClient,
    },
  };
});
```

### 2. Create Composable

**`composables/useAuth.ts`**:
```typescript
export function useAuth() {
  const { $auth } = useNuxtApp();
  return $auth;
}

export function useSession() {
  const auth = useAuth();
  return auth.useSession();
}
```

---

## Middleware

### Auth Middleware

**`middleware/auth.ts`**:
```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = useSession();

  // Protect dashboard routes
  if (to.path.startsWith("/dashboard") && !session.value) {
    return navigateTo("/login");
  }

  // Redirect authenticated users from auth pages
  if ((to.path === "/login" || to.path === "/register") && session.value) {
    return navigateTo("/dashboard");
  }
});
```

### Server Middleware for SSR

**`server/middleware/auth.ts`**:
```typescript
import { auth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  // Attach session to event context for SSR
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  event.context.session = session;
});
```

---

## Pages

### Login Page

**`pages/login.vue`**:
```vue
<script setup lang="ts">
const auth = useAuth();
const router = useRouter();
const error = ref("");
const loading = ref(false);

const form = reactive({
  email: "",
  password: "",
});

async function handleSubmit() {
  loading.value = true;
  error.value = "";

  const { error: authError } = await auth.signIn.email({
    email: form.email,
    password: form.password,
  });

  if (authError) {
    error.value = authError.message;
  } else {
    router.push("/dashboard");
  }

  loading.value = false;
}

async function signInWithGoogle() {
  await auth.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" type="email" placeholder="Email" required />
    <input v-model="form.password" type="password" placeholder="Password" required />
    <p v-if="error" class="error">{{ error }}</p>
    <button type="submit" :disabled="loading">
      {{ loading ? "Signing in..." : "Sign In" }}
    </button>
    <button type="button" @click="signInWithGoogle">
      Sign in with Google
    </button>
  </form>
</template>
```

### Dashboard Page

**`pages/dashboard.vue`**:
```vue
<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { data: session } = useSession();
const auth = useAuth();
const router = useRouter();

async function handleSignOut() {
  await auth.signOut();
  router.push("/login");
}
</script>

<template>
  <div v-if="session">
    <h1>Welcome, {{ session.user.name }}</h1>
    <p>Email: {{ session.user.email }}</p>
    <button @click="handleSignOut">Sign Out</button>
  </div>
</template>
```

---

## Server-Side Session Access

### In API Routes

**`server/api/protected.ts`**:
```typescript
import { auth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  return {
    message: `Hello, ${session.user.name}`,
  };
});
```

### In Server Middleware

Access `event.context.session` if using the auth middleware above.

---

## Configuration

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
  },
});
```

### Environment Variables

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-here
NUXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Common Issues

### useFetch with Credentials

Always include credentials for authenticated requests:

```typescript
const { data } = await useFetch("/api/protected", {
  credentials: "include",
});
```

### Hydration with Session

Use `isPending` to handle loading state:

```typescript
const { data: session, isPending } = useSession();

// In template:
<template>
  <div v-if="isPending">Loading...</div>
  <div v-else-if="session">{{ session.user.email }}</div>
</template>
```

---

## Official Resources

- Nuxt Integration: https://better-auth.com/docs/integrations/nuxt
- H3 Handler: https://better-auth.com/docs/integrations/h3

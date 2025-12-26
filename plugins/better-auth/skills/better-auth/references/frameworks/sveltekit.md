# better-auth with SvelteKit

Complete guide for integrating better-auth with SvelteKit.

---

## Installation

```bash
bun add better-auth drizzle-orm postgres
```

---

## Server Setup

### 1. Create Auth Configuration

**`src/lib/server/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "$lib/db/schema";
import { env } from "$env/dynamic/private";

const client = postgres(env.DATABASE_URL);
const db = drizzle(client, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.PUBLIC_APP_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
```

### 2. Create API Route Handler

**`src/routes/api/auth/[...all]/+server.ts`**:
```typescript
import { auth } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
  return auth.handler(request);
};

export const POST: RequestHandler = async ({ request }) => {
  return auth.handler(request);
};
```

---

## Client Setup

**`src/lib/auth-client.ts`**:
```typescript
import { createAuthClient } from "better-auth/svelte";
import { env } from "$env/dynamic/public";

export const authClient = createAuthClient({
  baseURL: env.PUBLIC_APP_URL,
});
```

---

## Hooks

### Server Hook for Session

**`src/hooks.server.ts`**:
```typescript
import { auth } from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  event.locals.session = session;

  return resolve(event);
};
```

### Type Definitions

**`src/app.d.ts`**:
```typescript
import type { Session } from "$lib/server/auth";

declare global {
  namespace App {
    interface Locals {
      session: Session | null;
    }
  }
}

export {};
```

---

## Load Functions

### Protected Route

**`src/routes/dashboard/+page.server.ts`**:
```typescript
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, "/login");
  }

  return {
    user: locals.session.user,
  };
};
```

**`src/routes/dashboard/+page.svelte`**:
```svelte
<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<h1>Welcome, {data.user.name}</h1>
<p>Email: {data.user.email}</p>
```

### Layout with Session

**`src/routes/+layout.server.ts`**:
```typescript
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    session: locals.session,
  };
};
```

---

## Components

### Login Form

**`src/routes/login/+page.svelte`**:
```svelte
<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  async function handleSubmit() {
    loading = true;
    error = "";

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    if (authError) {
      error = authError.message;
    } else {
      goto("/dashboard");
    }

    loading = false;
  }

  async function signInWithGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={email} type="email" placeholder="Email" required />
  <input bind:value={password} type="password" placeholder="Password" required />

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <button type="submit" disabled={loading}>
    {loading ? "Signing in..." : "Sign In"}
  </button>

  <button type="button" on:click={signInWithGoogle}>
    Sign in with Google
  </button>
</form>
```

### User Menu Store

**`src/lib/stores/session.ts`**:
```typescript
import { authClient } from "$lib/auth-client";
import { writable, derived } from "svelte/store";

// Create a store from the auth client session
export const session = authClient.useSession();

// Derived store for user
export const user = derived(session, ($session) => $session.data?.user ?? null);

// Derived store for loading state
export const isLoading = derived(session, ($session) => $session.isPending);
```

### User Menu Component

**`src/lib/components/UserMenu.svelte`**:
```svelte
<script lang="ts">
  import { session, user, isLoading } from "$lib/stores/session";
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  async function signOut() {
    await authClient.signOut();
    goto("/login");
  }
</script>

{#if $isLoading}
  <span>Loading...</span>
{:else if $user}
  <span>{$user.email}</span>
  <button on:click={signOut}>Sign Out</button>
{:else}
  <a href="/login">Sign In</a>
{/if}
```

---

## Form Actions

### Server-Side Sign In

**`src/routes/login/+page.server.ts`**:
```typescript
import { auth } from "$lib/server/auth";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session) {
    throw redirect(303, "/dashboard");
  }
};

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await auth.api.signInEmail({
        body: { email, password },
      });

      // Return with Set-Cookie header
      throw redirect(303, "/dashboard");
    } catch (error) {
      return fail(401, { error: "Invalid credentials" });
    }
  },
};
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-here
PUBLIC_APP_URL=http://localhost:5173

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Official Resources

- SvelteKit Integration: https://better-auth.com/docs/integrations/sveltekit

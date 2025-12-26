# better-auth with Remix

Complete guide for integrating better-auth with Remix.

---

## Installation

```bash
bun add better-auth drizzle-orm postgres
```

---

## Server Setup

### 1. Create Auth Configuration

**`app/lib/auth.server.ts`**:
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
  baseURL: process.env.APP_URL,
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

**`app/routes/api.auth.$.tsx`**:
```typescript
import { auth } from "~/lib/auth.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  return auth.handler(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request);
}
```

---

## Client Setup

**`app/lib/auth.client.ts`**:
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: window.ENV?.APP_URL || "",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

---

## Loaders and Actions

### Protected Loader

**`app/routes/dashboard.tsx`**:
```typescript
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  return json({ user: session.user });
}

export default function Dashboard() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

### Login Action

**`app/routes/login.tsx`**:
```typescript
import { auth } from "~/lib/auth.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session) {
    throw redirect("/dashboard");
  }

  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
    });

    // Forward the set-cookie header
    return redirect("/dashboard", {
      headers: response.headers,
    });
  } catch (error) {
    return json({ error: "Invalid credentials" }, { status: 401 });
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post">
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      {actionData?.error && <p className="error">{actionData.error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>
    </Form>
  );
}
```

---

## Session Context

### Root Loader with Session

**`app/root.tsx`**:
```typescript
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Outlet } from "@remix-run/react";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  return json({
    session,
    ENV: {
      APP_URL: process.env.APP_URL,
    },
  });
}

export default function App() {
  const { session, ENV } = useLoaderData<typeof loader>();

  return (
    <html>
      <head>{/* ... */}</head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Outlet context={{ session }} />
      </body>
    </html>
  );
}
```

### Access Session in Routes

```typescript
import { useOutletContext } from "@remix-run/react";
import type { Session } from "~/lib/auth.server";

export default function SomeRoute() {
  const { session } = useOutletContext<{ session: Session | null }>();

  return session ? <AuthenticatedView /> : <PublicView />;
}
```

---

## Social Auth

### OAuth Redirect

```typescript
import { signIn } from "~/lib/auth.client";

function GoogleButton() {
  return (
    <button
      onClick={() =>
        signIn.social({
          provider: "google",
          callbackURL: "/dashboard",
        })
      }
    >
      Sign in with Google
    </button>
  );
}
```

---

## Environment Variables

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-here
APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Common Issues

### Cookie Not Set

Ensure you forward headers from auth response:

```typescript
return redirect("/dashboard", {
  headers: response.headers,
});
```

### Session Not Persisted

Check that cookies are being sent with requests. In fetch calls:

```typescript
fetch("/api/protected", { credentials: "include" });
```

---

## Official Resources

- Remix Integration: https://better-auth.com/docs/integrations/remix

# better-auth with Next.js

Complete guide for integrating better-auth with Next.js 14+ (App Router and Pages Router).

---

## App Router Setup

### 1. Install Dependencies

```bash
bun add better-auth drizzle-orm @neondatabase/serverless
# or for Prisma:
bun add better-auth @prisma/client
```

### 2. Create Auth Configuration

**`lib/auth.ts`**:
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
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

### 3. Create API Route Handler

**`app/api/auth/[...all]/route.ts`**:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 4. Create Auth Client

**`lib/auth-client.ts`**:
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 5. Middleware for Protected Routes

**`middleware.ts`**:
```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect authenticated users from auth pages
  if (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/register")) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
```

### 6. Server Components with Auth

**`app/dashboard/page.tsx`**:
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### 7. Client Components with useSession

**`components/user-menu.tsx`**:
```typescript
"use client";

import { useSession, signOut } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <a href="/login">Sign In</a>;

  return (
    <div>
      <span>{session.user.email}</span>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

---

## Pages Router Setup

### API Route Handler

**`pages/api/auth/[...all].ts`**:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export default toNextJsHandler(auth);
```

### getServerSideProps with Auth

**`pages/dashboard.tsx`**:
```typescript
import { auth } from "@/lib/auth";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth.api.getSession({
    headers: new Headers(context.req.headers as any),
  });

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { user: session.user } };
};

export default function Dashboard({ user }: { user: any }) {
  return <h1>Welcome, {user.name}</h1>;
}
```

---

## Common Errors

### Hydration Mismatch

**Problem**: Session state differs between server and client.

**Solution**: Use `isPending` to avoid rendering session data before hydration:

```typescript
const { data: session, isPending } = useSession();

if (isPending) return null; // or loading skeleton
```

### Headers in Server Components

**Problem**: `headers()` is async in Next.js 15+.

**Solution**: Always await headers:

```typescript
// Next.js 15+
const session = await auth.api.getSession({
  headers: await headers(),
});
```

### OAuth Callback Issues

**Problem**: Redirect URI mismatch.

**Solution**: Ensure exact match in Google Console:
```
http://localhost:3000/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google
```

---

## Environment Variables

```env
# .env.local
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Official Resources

- Next.js Integration: https://better-auth.com/docs/integrations/next-js
- Examples: https://github.com/better-auth/better-auth/tree/main/examples/nextjs

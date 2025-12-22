# Next.js - Complete Error Catalog

This document contains all 18 documented errors and their solutions for Next.js 16 App Router.

**Last Updated**: 2025-10-24
**Next.js Version**: 16.0.0
**Source**: Production deployments, Next.js documentation

---

## Error 1: `params` is a Promise

**Error**:
```
Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'
```

**Cause**: Next.js 16 changed `params` to async.

**Solution**: Await `params`:
```typescript
// ❌ Before
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id
}

// ✅ After
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

**Source**: Next.js 16 breaking changes

---

## Error 2: `searchParams` is a Promise

**Error**:
```
Property 'query' does not exist on type 'Promise<{ query: string }>'
```

**Cause**: `searchParams` is now async in Next.js 16.

**Solution**:
```typescript
// ❌ Before
export default function Page({ searchParams }: { searchParams: { query: string } }) {
  const query = searchParams.query
}

// ✅ After
export default async function Page({ searchParams }: { searchParams: Promise<{ query: string }> }) {
  const { query } = await searchParams
}
```

**Source**: Next.js 16 breaking changes

---

## Error 3: `cookies()` requires await

**Error**:
```
'cookies' implicitly has return type 'any'
```

**Cause**: `cookies()` is now async in Next.js 16.

**Solution**:
```typescript
// ❌ Before
import { cookies } from 'next/headers'

export function MyComponent() {
  const cookieStore = cookies()
}

// ✅ After
import { cookies } from 'next/headers'

export async function MyComponent() {
  const cookieStore = await cookies()
}
```

**Source**: Next.js 16 breaking changes

---

## Error 4: Parallel route missing `default.js`

**Error**:
```
Error: Parallel route @modal/login was matched but no default.js was found
```

**Cause**: Next.js 16 requires `default.js` for all parallel routes.

**Solution**: Add `default.tsx` files:
```typescript
// app/@modal/default.tsx
export default function ModalDefault() {
  return null
}
```

**Source**: Parallel Routes breaking change in Next.js 16

---

## Error 5: `revalidateTag()` requires 2 arguments

**Error**:
```
Expected 2 arguments, but got 1
```

**Cause**: `revalidateTag()` now requires a `cacheLife` argument in Next.js 16.

**Solution**:
```typescript
// ❌ Before
revalidateTag('posts')

// ✅ After
revalidateTag('posts', 'max')
```

**Source**: Cache API updates in Next.js 16

---

## Error 6: Cannot use React hooks in Server Component

**Error**:
```
You're importing a component that needs useState. It only works in a Client Component
```

**Cause**: Using React hooks in Server Component.

**Solution**: Add `'use client'` directive:
```typescript
// ✅ Add 'use client' at the top
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**Source**: Server/Client Component boundary errors

---

## Error 7: `middleware.ts` is deprecated

**Warning**:
```
Warning: middleware.ts is deprecated. Use proxy.ts instead.
```

**Solution**: Migrate to `proxy.ts`:
```typescript
// Rename: middleware.ts → proxy.ts
// Rename function: middleware → proxy

export function proxy(request: NextRequest) {
  // Same logic
}
```

**Source**: Next.js 16 proxy migration

---

## Error 8: Turbopack build failure

**Error**:
```
Error: Failed to compile with Turbopack
```

**Cause**: Turbopack is now default in Next.js 16.

**Solution**: Opt out of Turbopack if incompatible:
```bash
npm run build -- --webpack
```

**Source**: Turbopack as default bundler in Next.js 16

---

## Error 9: Invalid `next/image` src

**Error**:
```
Invalid src prop (https://example.com/image.jpg) on `next/image`. Hostname "example.com" is not configured under images in your `next.config.js`
```

**Solution**: Add remote patterns in `next.config.ts`:
```typescript
const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
}
```

**Source**: Image optimization configuration

---

## Error 10: Cannot import Server Component into Client Component

**Error**:
```
You're importing a Server Component into a Client Component
```

**Solution**: Pass Server Component as children:
```typescript
// ❌ Wrong
'use client'
import { ServerComponent } from './server-component' // Error

export function ClientComponent() {
  return <ServerComponent />
}

// ✅ Correct
'use client'

export function ClientComponent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

// Usage
<ClientComponent>
  <ServerComponent /> {/* Pass as children */}
</ClientComponent>
```

**Source**: Server/Client Component composition patterns

---

## Error 11: `generateStaticParams` not working

**Cause**: `generateStaticParams` only works with static generation (`export const dynamic = 'force-static'`).

**Solution**:
```typescript
export const dynamic = 'force-static'

export async function generateStaticParams() {
  const posts = await fetch('/api/posts').then(r => r.json())
  return posts.map((post: { id: string }) => ({ id: post.id }))
}
```

**Source**: Static generation configuration

---

## Error 12: `fetch()` not caching

**Cause**: Next.js 16 uses opt-in caching with `"use cache"` directive.

**Solution**: Add `"use cache"` to component or function:
```typescript
'use cache'

export async function getPosts() {
  const response = await fetch('/api/posts')
  return response.json()
}
```

**Source**: Cache Components in Next.js 16

---

## Error 13: Route collision with Route Groups

**Error**:
```
Error: Conflicting routes: /about and /(marketing)/about
```

**Cause**: Route groups create same URL path.

**Solution**: Ensure route groups don't conflict:
```
app/
├── (marketing)/about/page.tsx  → /about
└── (shop)/about/page.tsx       → ERROR: Duplicate /about

# Fix: Use different routes
app/
├── (marketing)/about/page.tsx     → /about
└── (shop)/store-info/page.tsx     → /store-info
```

**Source**: Route Groups configuration

---

## Error 14: Metadata not updating

**Cause**: Using dynamic metadata without `generateMetadata()`.

**Solution**: Use `generateMetadata()` for dynamic pages:
```typescript
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await fetch(`/api/posts/${id}`).then(r => r.json())

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

**Source**: Metadata API

---

## Error 15: `next/font` font not loading

**Cause**: Font variable not applied to HTML element.

**Solution**: Apply font variable to `<html>` or `<body>`:
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.variable}> {/* ✅ Apply variable */}
      <body>{children}</body>
    </html>
  )
}
```

**Source**: Font optimization

---

## Error 16: Environment variables not available in browser

**Cause**: Server-only env vars are not exposed to browser.

**Solution**: Prefix with `NEXT_PUBLIC_` for client-side access:
```bash
# .env
SECRET_KEY=abc123                  # Server-only
NEXT_PUBLIC_API_URL=https://api    # Available in browser
```

```typescript
// Server Component (both work)
const secret = process.env.SECRET_KEY
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// Client Component (only public vars work)
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

**Source**: Environment variable configuration

---

## Error 17: Server Action not found

**Error**:
```
Error: Could not find Server Action
```

**Cause**: Missing `'use server'` directive.

**Solution**: Add `'use server'`:
```typescript
// ❌ Before
export async function createPost(formData: FormData) {
  await db.posts.create({ ... })
}

// ✅ After
'use server'

export async function createPost(formData: FormData) {
  await db.posts.create({ ... })
}
```

**Source**: Server Actions configuration

---

## Error 18: TypeScript path alias not working

**Cause**: Incorrect `baseUrl` or `paths` in `tsconfig.json`.

**Solution**: Configure correctly:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./app/components/*"]
    }
  }
}
```

**Source**: TypeScript configuration

---

## Summary

**Total Errors Documented**: 18
**Categories**:
- Next.js 16 Breaking Changes: 7 errors (#1, #2, #3, #4, #5, #7, #12)
- Server/Client Components: 3 errors (#6, #10, #17)
- Configuration: 5 errors (#8, #9, #13, #16, #18)
- Optimization: 3 errors (#11, #14, #15)

**Prevention**: Always use the Next.js 16 codemod (`npx @next/codemod@canary upgrade latest`) when migrating.

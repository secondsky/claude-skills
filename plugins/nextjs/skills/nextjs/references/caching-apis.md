# Caching APIs - Complete Reference

This reference covers all caching APIs in Next.js 16. For basic usage, see the main SKILL.md.

---

## "use cache" Directive

### Component-Level Caching

```typescript
'use cache'

export async function BlogPosts() {
  const posts = await db.posts.findMany()

  return posts.map(post => (
    <article key={post.id}>
      <h2>{post.title}</h2>
    </article>
  ))
}
```

### Function-Level Caching

```typescript
export async function Page() {
  const data = await getData() // Uses cache below
  return <div>{data.title}</div>
}

async function getData() {
  'use cache' // Cache only this function
  return await fetch('/api/data').then(r => r.json())
}
```

### Caching with Tags

```typescript
'use cache'

import { cacheTag } from 'next/cache'

export async function UserProfile({ userId }: { userId: string }) {
  cacheTag(`user-${userId}`) // Tag for targeted invalidation

  const user = await db.users.findUnique({ where: { id: userId } })
  return <div>{user.name}</div>
}
```

---

## revalidateTag() - Updated API

### Basic Usage (Next.js 16)

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export async function updatePost(id: string, data: PostData) {
  await db.posts.update({ where: { id }, data })

  // Revalidate with cacheLife (REQUIRED in Next.js 16)
  revalidateTag('posts', 'max')
}
```

### Cache Life Options

```typescript
// Maximum cache duration
revalidateTag('posts', 'max')

// Default cache duration
revalidateTag('posts', 'default')

// Custom duration in seconds
revalidateTag('posts', 'seconds:3600')    // 1 hour
revalidateTag('posts', 'seconds:86400')   // 24 hours
revalidateTag('posts', 'seconds:604800')  // 1 week
```

### Multiple Tags

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export async function updateUser(userId: string, data: UserData) {
  await db.users.update({ where: { id: userId }, data })

  // Revalidate multiple tags
  revalidateTag('users', 'default')
  revalidateTag(`user-${userId}`, 'default')
  revalidateTag('dashboard', 'seconds:60')
}
```

---

## revalidatePath()

### Basic Usage

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  await db.posts.create({ data: { title: formData.get('title') } })

  // Revalidate the posts list page
  revalidatePath('/posts')
}
```

### Revalidate Layout

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function updateSidebar() {
  // Revalidate layout (affects all child pages)
  revalidatePath('/dashboard', 'layout')
}
```

### Revalidate Dynamic Routes

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function updatePost(id: string, data: PostData) {
  await db.posts.update({ where: { id }, data })

  // Revalidate specific dynamic route
  revalidatePath(`/posts/${id}`)

  // Revalidate all dynamic routes with this pattern
  revalidatePath('/posts/[id]', 'page')
}
```

---

## updateTag() - NEW in Next.js 16

Update cached data without triggering a full revalidation. **Server Actions only.**

### Basic Usage

```typescript
'use server'

import { updateTag } from 'next/cache'

export async function incrementViews(postId: string) {
  const post = await db.posts.update({
    where: { id: postId },
    data: { views: { increment: 1 } }
  })

  // Update cache without full revalidation
  updateTag(`post-${postId}`, post)
}
```

### Partial Updates

```typescript
'use server'

import { updateTag } from 'next/cache'

export async function updatePostTitle(postId: string, title: string) {
  await db.posts.update({
    where: { id: postId },
    data: { title }
  })

  // Update only the title in cache
  updateTag(`post-${postId}`, (currentData) => ({
    ...currentData,
    title,
    updatedAt: new Date().toISOString()
  }))
}
```

---

## refresh() - NEW in Next.js 16

Refresh current page data. **Server Actions only.**

### Basic Usage

```typescript
'use server'

import { refresh } from 'next/cache'

export async function refreshData() {
  // Fetch fresh data
  const data = await fetch('/api/data').then(r => r.json())

  // Refresh current page
  refresh()
}
```

### Use Case: Manual Refresh Button

```typescript
// actions.ts
'use server'

import { refresh } from 'next/cache'

export async function manualRefresh() {
  refresh()
}

// Component
'use client'

import { manualRefresh } from './actions'

export function RefreshButton() {
  return (
    <button onClick={() => manualRefresh()}>
      Refresh Data
    </button>
  )
}
```

---

## Partial Prerendering (PPR)

### Enable PPR

```typescript
// next.config.ts
const config = {
  experimental: {
    ppr: true,
  },
}

export default config
```

### Page-Level PPR

```typescript
// app/dashboard/page.tsx
export const experimental_ppr = true

export default async function DashboardPage() {
  return (
    <>
      {/* Static shell - prerendered */}
      <header>
        <h1>Dashboard</h1>
        <nav>...</nav>
      </header>

      {/* Dynamic content - streams in */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </>
  )
}
```

### PPR with "use cache"

```typescript
export const experimental_ppr = true

export default async function Page() {
  return (
    <>
      <StaticHeader />

      <Suspense fallback={<Skeleton />}>
        <CachedContent />
      </Suspense>
    </>
  )
}

// This component's output is cached
async function CachedContent() {
  'use cache'
  const data = await fetchExpensiveData()
  return <div>{data}</div>
}
```

---

## ISR (Incremental Static Regeneration)

### Time-Based Revalidation

```typescript
// app/posts/[id]/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default async function PostPage({ params }) {
  const { id } = await params
  const post = await db.posts.findUnique({ where: { id } })

  return <article>{post.content}</article>
}
```

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  const { secret, path, tag } = await request.json()

  // Verify secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 })
  }

  // Revalidate by path or tag
  if (path) {
    revalidatePath(path)
  }
  if (tag) {
    revalidateTag(tag, 'default')
  }

  return Response.json({ revalidated: true })
}
```

---

## fetch() Caching

### With "use cache" (Next.js 16 Pattern)

```typescript
'use cache'

async function getPosts() {
  // Cached because of "use cache" directive
  const response = await fetch('https://api.example.com/posts')
  return response.json()
}
```

### With Request Options

```typescript
async function getData() {
  // Force no cache
  const fresh = await fetch('/api/data', { cache: 'no-store' })

  // Force cache
  const cached = await fetch('/api/data', { cache: 'force-cache' })

  // Revalidate after time
  const timed = await fetch('/api/data', {
    next: { revalidate: 3600 } // 1 hour
  })

  // With tags for targeted invalidation
  const tagged = await fetch('/api/data', {
    next: { tags: ['posts', 'homepage'] }
  })
}
```

---

## Cache Boundaries

### Separating Static and Dynamic

```typescript
// Static parent
export default function Layout({ children }) {
  return (
    <div>
      <StaticHeader />    {/* Never re-renders */}
      <StaticSidebar />   {/* Never re-renders */}
      {children}          {/* Dynamic, can change */}
    </div>
  )
}

// Dynamic page within static layout
export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await getRealtimeData()
  return <div>{data}</div>
}
```

---

## Migration from Next.js 15

### Before (Automatic Caching)

```typescript
// Next.js 15 - fetch cached by default
async function getPosts() {
  const res = await fetch('/api/posts') // Automatically cached
  return res.json()
}
```

### After (Opt-in Caching)

```typescript
// Next.js 16 - opt-in with "use cache"
'use cache'

async function getPosts() {
  const res = await fetch('/api/posts') // Cached with directive
  return res.json()
}
```

---

## See Also

- Main SKILL.md for "use cache" basics
- `templates/cache-component-use-cache.tsx` for component caching template
- `references/next-16-migration-guide.md` for migration details

# Common "Race Conditions" in Full-Stack React + Cloudflare Workers Apps

**Last Updated**: 2025-10-23
**Status**: Production Tested

Most "race conditions" in React + Clerk + Workers apps are actually **auth loading state issues**, not true race conditions. This guide shows you how to fix them.

---

## The #1 Problem: API Calls Before Auth is Ready

### Symptom

```
❌ 401 Unauthorized
❌ Invalid or missing token
❌ Failed to fetch
```

Component mounts, makes an API call, but gets 401 because the Clerk auth token isn't ready yet.

### Why It Happens

```typescript
// ❌ BAD: useEffect runs immediately on mount
useEffect(() => {
  fetch('/api/data') // Token not ready yet!
    .then(res => res.json())
    .then(setData)
}, []) // Runs once on mount
```

Clerk's `useSession()` hook needs time to initialize and load the session token. If you call your API before that's done, there's no token to attach to the request.

### The Fix: Wait for `isLoaded`

```typescript
import { useSession } from '@clerk/clerk-react'

function Dashboard() {
  const { isLoaded, isSignedIn, session } = useSession()
  const [data, setData] = useState(null)

  useEffect(() => {
    // ✅ GOOD: Check if auth is loaded first
    if (!isLoaded || !isSignedIn) {
      return // Wait for auth to be ready
    }

    // Now it's safe - token is available
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [isLoaded, isSignedIn]) // Re-run when auth state changes

  if (!isLoaded) return <div>Loading...</div>
  if (!isSignedIn) return <div>Please sign in</div>

  return <div>{/* Render data */}</div>
}
```

**Key Points**:
1. Check `isLoaded` - `true` when Clerk has finished initializing
2. Check `isSignedIn` - `true` when user is authenticated
3. Only make API calls when BOTH are true
4. Add both to useEffect dependencies

---

## Problem #2: Component Renders Before Data is Ready

### Symptom

```
❌ Cannot read property 'name' of undefined
❌ Map is not a function
❌ Blank screen, no errors
```

Your component tries to render data that hasn't loaded yet.

### Why It Happens

```typescript
// ❌ BAD: No loading state
function UserProfile() {
  const [user, setUser] = useState()

  useEffect(() => {
    fetchUser().then(setUser)
  }, [])

  // This crashes if user is undefined!
  return <div>{user.name}</div>
}
```

### The Fix: Loading States

```typescript
// ✅ GOOD: Proper loading state
function UserProfile() {
  const { isLoaded, isSignedIn } = useSession()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    setLoading(true)
    fetchUser()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn])

  // Show auth loading
  if (!isLoaded) return <div>Loading auth...</div>

  // Show sign in prompt
  if (!isSignedIn) return <div>Please sign in</div>

  // Show data loading
  if (loading) return <div>Loading profile...</div>

  // Show "no data" state
  if (!user) return <div>User not found</div>

  // NOW it's safe to render
  return <div>{user.name}</div>
}
```

---

## Problem #3: Making API Calls in the Wrong Place

### Symptom

- API called multiple times unnecessarily
- API called before user is signed in
- Infinite loops

### Why It Happens

```typescript
// ❌ BAD: Called on every render
function Dashboard() {
  const data = fetchDashboardData() // Called EVERY render!
  return <div>{data}</div>
}

// ❌ BAD: Missing dependencies
useEffect(() => {
  fetchData(userId) // userId changes but not in dependencies!
}, []) // Should include userId

// ❌ BAD: Updates state in render
function Component() {
  const [data, setData] = useState(null)
  fetchData().then(setData) // Causes infinite loop!
  return <div>{data}</div>
}
```

### The Fix: Use useEffect Correctly

```typescript
// ✅ GOOD: API call in useEffect with proper dependencies
function Dashboard() {
  const { isLoaded, isSignedIn } = useSession()
  const [data, setData] = useState(null)
  const [userId, setUserId] = useState('123')

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    fetchDashboardData(userId).then(setData)
  }, [isLoaded, isSignedIn, userId]) // Include all dependencies

  // ... rendering
}
```

---

## Problem #4: CORS Errors That Look Like Race Conditions

### Symptom

```
❌ CORS policy: No 'Access-Control-Allow-Origin' header
❌ First request works, second fails
❌ OPTIONS request fails
```

This ISN'T a race condition, but it feels like one because requests randomly fail.

### Why It Happens

CORS middleware not applied, or applied in the wrong order.

### The Fix: Apply CORS Before Routes

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// ✅ CORRECT ORDER: CORS first
app.use('/api/*', cors())
app.post('/api/data', handler)

// ❌ WRONG ORDER: Routes first
app.post('/api/data', handler)
app.use('/api/*', cors())
```

---

## Problem #5: Token Expired Mid-Session

### Symptom

```
❌ Works for a while, then suddenly 401 errors
❌ "Token expired" errors
```

### Why It Happens

Clerk tokens have an expiration time (usually 1 hour). After they expire, API calls will fail unless the token is refreshed.

### The Fix: Clerk Handles This Automatically

Clerk automatically refreshes tokens in the background. You don't need to do anything special.

However, you CAN handle expired tokens explicitly:

```typescript
async function fetchWithRetry(url: string) {
  const { session } = useSession()

  try {
    const token = await session.getToken()
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.status === 401) {
      // Token might be expired - try refreshing
      const newToken = await session.getToken({ skipCache: true })
      const retryRes = await fetch(url, {
        headers: { Authorization: `Bearer ${newToken}` }
      })
      return retryRes.json()
    }

    return res.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw error
  }
}
```

---

## Best Practices Summary

### ✅ DO:
1. Check `isLoaded` and `isSignedIn` before API calls
2. Use loading states for every async operation
3. Include all dependencies in useEffect
4. Apply CORS middleware before routes
5. Use the `apiClient` helper (auto-handles tokens)
6. Use `<ProtectedRoute>` component for auth gates

### ❌ DON'T:
1. Make API calls directly in render function
2. Forget to check if auth is loaded
3. Skip loading states
4. Apply CORS after routes
5. Manually manage token refresh (Clerk does it)
6. Use setTimeout to "fix" race conditions (masks the real issue)

---

## Quick Checklist: Debugging Auth Issues

If you're getting 401 errors or auth problems:

1. **Frontend - Check auth is loaded**:
   ```typescript
   const { isLoaded, isSignedIn } = useSession()
   console.log({ isLoaded, isSignedIn }) // Both should be true
   ```

2. **Frontend - Check token is being sent**:
   ```typescript
   const token = await session.getToken()
   console.log('Token:', token) // Should be a long JWT string
   ```

3. **Backend - Check CORS is applied**:
   ```typescript
   // Should be BEFORE routes
   app.use('/api/*', cors())
   ```

4. **Backend - Check auth middleware**:
   ```typescript
   // Should be on protected routes
   app.use('/api/protected/*', jwtAuthMiddleware(env.CLERK_SECRET_KEY))
   ```

5. **Backend - Check secret key**:
   ```bash
   # Should start with sk_test_ (dev) or sk_live_ (prod)
   echo $CLERK_SECRET_KEY
   ```

6. **Both - Check environment**:
   - Dev: Use pk_test_* and sk_test_*
   - Prod: Use pk_live_* and sk_live_*
   - Don't mix them!

---

## Real Example: Complete Working Pattern

```typescript
import { useSession } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

function DashboardPage() {
  // 1. Get auth state
  const { isLoaded, isSignedIn } = useSession()

  // 2. Local state
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 3. Fetch data when auth is ready
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return // Wait for auth
    }

    setLoading(true)
    setError(null)

    apiClient
      .get('/api/protected/dashboard')
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn])

  // 4. Handle all states
  if (!isLoaded) {
    return <div>Loading authentication...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in to view dashboard</div>
  }

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  if (error) {
    return <div>Error loading dashboard: {error.message}</div>
  }

  if (!data) {
    return <div>No data available</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
```

This handles ALL the common issues:
- ✅ Waits for auth to load
- ✅ Shows loading states
- ✅ Handles errors
- ✅ Only fetches when authenticated
- ✅ Uses proper dependencies

---

**Remember**: Most "race conditions" are just missing `isLoaded` checks!

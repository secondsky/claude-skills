# Architecture Patterns

Critical architectural patterns and configurations for the Cloudflare full-stack scaffold.

**Last Updated**: 2025-12-09

---

## Table of Contents

1. [Frontend-Backend Connection](#frontend-backend-connection)
2. [Environment Variables](#environment-variables)
3. [CORS Configuration](#cors-configuration)
4. [Auth Pattern (When Enabled)](#auth-pattern-when-enabled)

---

## Frontend-Backend Connection

### Key Insight: Same Port Architecture

The `@cloudflare/vite-plugin` runs your Worker on the **SAME port** as Vite. This eliminates the need for proxy configuration.

**✅ CORRECT**: Use relative URLs
```typescript
// Frontend code
fetch('/api/data')
fetch('/api/users')
fetch('/api/posts/123')
```

**❌ WRONG**: Don't use absolute URLs
```typescript
// Frontend code - DON'T DO THIS!
fetch('http://localhost:8787/api/data')  // Will fail!
fetch('http://localhost:5173/api/data')  // Wrong port!
```

### Why This Works

The Vite plugin:
1. Starts Vite dev server on port 5173
2. Runs your Worker in the same process
3. Routes API requests to Worker automatically
4. Serves frontend from same origin

**No proxy configuration needed!**

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│   http://localhost:5173                 │
├─────────────────────────────────────────┤
│                                         │
│  Vite Dev Server + Cloudflare Worker   │
│  (Same Port, Same Process)              │
│                                         │
│  ┌───────────┐      ┌──────────────┐  │
│  │ Frontend  │ ───> │ API Routes   │  │
│  │ (React)   │ /api │ (Hono)       │  │
│  └───────────┘      └──────────────┘  │
│       Same Origin - No CORS Issues     │
└─────────────────────────────────────────┘
```

### Debugging Connection Issues

If API calls aren't reaching your Worker:

1. **Check route prefix**: Routes should start with `/api/` prefix
   ```typescript
   // backend/src/index.ts
   app.route('/api', apiRoutes) // ← Must match frontend calls
   ```

2. **Verify Vite plugin**: Check `vite.config.ts` has cloudflare plugin configured
   ```typescript
   import cloudflare from '@cloudflare/vite-plugin'

   export default defineConfig({
     plugins: [cloudflare()], // ← Plugin must be registered
   })
   ```

3. **Check bindings**: Verify `wrangler.jsonc` has correct bindings
   ```jsonc
   {
     "d1_databases": [
       { "binding": "DB", "database_id": "..." }
     ]
   }
   ```

4. **Look for CORS errors**: Check browser console for CORS errors (see CORS section)

---

## Environment Variables

### Two Separate Files

**Frontend** (`.env`):
```bash
# Prefix with VITE_
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_API_BASE_URL=http://localhost:5173
```

- Prefix with `VITE_` (required for Vite)
- Bundled into frontend code
- Visible in browser DevTools
- Use for public values only (publishable keys, API URLs)

**Backend** (`.dev.vars`):
```bash
# No prefix needed
CLERK_SECRET_KEY=sk_test_xxx
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_API_KEY=xxx
```

- No prefix needed
- Available in Worker environment
- Never exposed to browser
- Use for secrets and API keys

### Accessing Environment Variables

**Frontend**:
```typescript
// src/lib/config.ts
const apiKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

// TypeScript types (optional but recommended)
// src/vite-env.d.ts
interface ImportMetaEnv {
  VITE_CLERK_PUBLISHABLE_KEY: string
  VITE_API_BASE_URL: string
}
```

**Backend**:
```typescript
// backend/src/index.ts
import { Hono } from 'hono'

const app = new Hono<{
  Bindings: {
    CLERK_SECRET_KEY: string
    OPENAI_API_KEY: string
  }
}>()

app.get('/api/data', async (c) => {
  const apiKey = c.env.OPENAI_API_KEY // ← Type-safe access
  // ...
})
```

### Production Environment Variables

For production, use Wrangler secrets (encrypted, never visible in wrangler.jsonc):

```bash
# Set secrets for production
bunx wrangler secret put CLERK_SECRET_KEY
# Prompts for value, stores encrypted

bunx wrangler secret put OPENAI_API_KEY
bunx wrangler secret put ANTHROPIC_API_KEY

# List secrets (values are hidden)
bunx wrangler secret list
```

### Never Commit Secrets!

❌ **Don't commit**:
- `.dev.vars` (contains local secrets)
- `.env` (may contain sensitive values)

✅ **Do commit**:
- `.dev.vars.example` (template with placeholder values)
- `.env.example` (template with placeholder values)

**Add to `.gitignore`**:
```gitignore
.dev.vars
.env
.env.local
```

---

## CORS Configuration

### Critical Order: Middleware BEFORE Routes

CORS middleware must be applied **BEFORE** routes are registered. This is the #1 most common mistake.

**✅ CORRECT ORDER**:
```typescript
// backend/src/index.ts
import { corsMiddleware } from './middleware/cors'

// 1. Apply CORS middleware first
app.use('/api/*', corsMiddleware)

// 2. Register routes after
app.post('/api/data', handler)
app.get('/api/users', handler)
app.route('/api', apiRoutes)
```

**❌ WRONG - Will cause CORS errors**:
```typescript
// backend/src/index.ts

// Routes registered first - CORS won't work!
app.post('/api/data', handler)
app.get('/api/users', handler)

// CORS middleware applied after - too late!
app.use('/api/*', corsMiddleware)
```

### CORS Middleware Pattern

```typescript
// middleware/cors.ts
import { Hono } from 'hono'

export const corsMiddleware = async (c, next) => {
  // Execute route handler first
  await next()

  // Then add CORS headers to response
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }
}
```

### Common CORS Errors

**Error**: "No 'Access-Control-Allow-Origin' header is present"

**Solution**: Check middleware is applied BEFORE routes
```typescript
// Must be in this order:
app.use('/api/*', corsMiddleware) // ← First
app.post('/api/data', handler)     // ← Second
```

**Error**: "CORS preflight request failed"

**Solution**: Handle OPTIONS method in middleware
```typescript
if (c.req.method === 'OPTIONS') {
  return new Response(null, { status: 204 })
}
```

**Error**: "Access-Control-Allow-Headers does not allow 'Authorization'"

**Solution**: Add header to allowed list
```typescript
c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//                                                        ↑ Add this
```

### Development vs Production CORS

**Development** (allow all):
```typescript
c.header('Access-Control-Allow-Origin', '*')
```

**Production** (restrict to your domain):
```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
]

const origin = c.req.header('Origin')
if (origin && allowedOrigins.includes(origin)) {
  c.header('Access-Control-Allow-Origin', origin)
}
```

---

## Auth Pattern (When Enabled)

### Frontend: Check isLoaded Before API Calls

**Critical**: Wait for Clerk to load before making authenticated requests.

**✅ CORRECT**:
```typescript
import { useSession } from '@clerk/clerk-react'
import { useEffect } from 'react'

function MyComponent() {
  const { isLoaded, isSignedIn } = useSession()

  useEffect(() => {
    if (!isLoaded) return  // Wait for auth to load

    // Now safe to make API calls
    fetch('/api/protected', {
      headers: {
        Authorization: `Bearer ${session.getToken()}`,
      },
    }).then(/* ... */)
  }, [isLoaded])

  if (!isLoaded) return <div>Loading...</div>

  return (
    <div>
      {isSignedIn ? <Dashboard /> : <SignIn />}
    </div>
  )
}
```

**❌ WRONG - Race condition**:
```typescript
function MyComponent() {
  // ❌ Auth might not be loaded yet!
  // This will fail or use stale data
  fetch('/api/protected').then(/* ... */)

  return <div>...</div>
}
```

### Why isLoaded Check is Required

Clerk initializes asynchronously:
1. User loads page
2. Clerk SDK starts loading (takes 100-500ms)
3. During loading: `isLoaded = false`, `isSignedIn = undefined`
4. After loading: `isLoaded = true`, `isSignedIn = true/false`

If you make API calls before `isLoaded = true`:
- Token might be missing or stale
- `isSignedIn` might be incorrect
- Race condition can cause auth to fail intermittently

### Backend: JWT Verification Middleware

```typescript
// middleware/auth.ts
import { verifyToken } from '@clerk/backend'

export const jwtAuthMiddleware = async (c, next) => {
  // Extract token from Authorization header
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Verify JWT with Clerk
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    })

    // Store userId in context for route handlers
    c.set('userId', payload.sub)
    c.set('sessionClaims', payload)

    await next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    return c.json({ error: 'Unauthorized: Invalid token' }, 401)
  }
}
```

### Usage in Routes

```typescript
// backend/src/index.ts
import { jwtAuthMiddleware } from './middleware/auth'

// Apply to specific routes
app.use('/api/protected/*', jwtAuthMiddleware)

// Protected route - userId is available
app.get('/api/protected/profile', (c) => {
  const userId = c.get('userId') // ← From middleware
  return c.json({ userId })
})

// Public route - no auth required
app.get('/api/public/status', (c) => {
  return c.json({ status: 'ok' })
})
```

### Protected Routes Pattern

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  // Show loading while auth initializes
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // User is authenticated, render protected content
  return <>{children}</>
}

// Usage in routing
import { ProtectedRoute } from './components/ProtectedRoute'

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Common Auth Errors

**Error**: "Unauthorized: Invalid token" (Backend)

**Causes**:
1. Frontend not sending token
2. Token expired (Clerk tokens expire after 1 hour by default)
3. Wrong secret key in backend

**Solution**:
```typescript
// Frontend: Send token with every request
const token = await session.getToken()
fetch('/api/protected', {
  headers: { Authorization: `Bearer ${token}` }
})

// Backend: Verify secret key matches Clerk dashboard
const payload = await verifyToken(token, {
  secretKey: c.env.CLERK_SECRET_KEY, // ← Must match Clerk dashboard
})
```

**Error**: Race condition (sometimes works, sometimes fails)

**Cause**: Making API call before Clerk loads

**Solution**: Always check `isLoaded` before API calls
```typescript
useEffect(() => {
  if (!isLoaded) return // ← Add this check
  // ... make API call
}, [isLoaded])
```

---

## See Also

- **`enabling-auth.md`**: Complete Clerk setup walkthrough with JWT template configuration
- **`customization-guide.md`**: Removing auth if not needed
- **`project-overview.md`**: Complete scaffold structure

---

**Last Updated**: 2025-12-09
**Scaffold Version**: 1.0.0
**Maintained By**: cloudflare-full-stack-scaffold skill

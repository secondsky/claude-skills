/**
 * Example API Routes for Cloudflare Workers + Hono
 *
 * This demonstrates how to:
 * 1. Apply CORS middleware
 * 2. Apply auth middleware to protected routes
 * 3. Access D1 database
 * 4. Handle errors properly
 * 5. Return typed responses
 *
 * Copy this pattern for your own API routes.
 */

import { Hono } from 'hono'
import type { JwtVariables } from 'hono/jwt'
import { corsMiddleware } from '../middleware/cors'
import { jwtAuthMiddleware } from '../middleware/auth'

/**
 * Environment bindings interface
 *
 * Defines what's available in env object from wrangler.jsonc
 */
interface Env {
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  CLERK_SECRET_KEY: string
  ENVIRONMENT: string
}

/**
 * Context variables (set by middleware)
 */
type Variables = JwtVariables

/**
 * Create typed Hono app
 */
const app = new Hono<{ Bindings: Env; Variables: Variables }>()

/**
 * STEP 1: Apply CORS middleware FIRST
 *
 * This MUST come before route handlers to prevent CORS errors
 */
app.use('/api/*', (c, next) => corsMiddleware(c.env)(c, next))

/**
 * PUBLIC ROUTES (No auth required)
 */
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/public/hello', (c) => {
  return c.json({ message: 'Hello from public API!' })
})

/**
 * STEP 2: Apply auth middleware to protected routes
 *
 * Everything under /api/protected/* requires authentication
 */
app.use('/api/protected/*', jwtAuthMiddleware(c.env.CLERK_SECRET_KEY))

/**
 * PROTECTED ROUTES (Auth required)
 */
app.get('/api/protected/profile', async (c) => {
  // Extract user ID from JWT payload (set by auth middleware)
  const payload = c.get('jwtPayload')
  const userId = payload.sub

  try {
    // Query D1 database for user profile
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    )
      .bind(userId)
      .run()

    if (!results || results.length === 0) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      user: results[0],
      auth: {
        userId,
        authenticated: true,
      },
    })
  } catch (error) {
    console.error('Database error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * POST example with request body validation
 */
app.post('/api/protected/data', async (c) => {
  const payload = c.get('jwtPayload')
  const userId = payload.sub

  try {
    // Parse and validate request body
    const body = await c.req.json()

    if (!body.name || typeof body.name !== 'string') {
      return c.json({ error: 'Invalid request: name is required' }, 400)
    }

    // Insert into database
    const result = await c.env.DB.prepare(
      'INSERT INTO data (user_id, name, created_at) VALUES (?, ?, ?)'
    )
      .bind(userId, body.name, new Date().toISOString())
      .run()

    return c.json({
      success: true,
      id: result.meta.last_row_id,
    })
  } catch (error) {
    console.error('Error creating data:', error)
    return c.json({ error: 'Failed to create data' }, 500)
  }
})

/**
 * Example: Using KV for caching
 */
app.get('/api/protected/cached-data', async (c) => {
  const cacheKey = 'expensive-computation-result'

  try {
    // Try to get from cache first
    const cached = await c.env.KV.get(cacheKey, 'json')
    if (cached) {
      return c.json({
        data: cached,
        cached: true,
      })
    }

    // Cache miss - compute the result
    const result = await performExpensiveComputation()

    // Store in cache for 1 hour
    await c.env.KV.put(cacheKey, JSON.stringify(result), {
      expirationTtl: 3600,
    })

    return c.json({
      data: result,
      cached: false,
    })
  } catch (error) {
    console.error('Cache error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Example: File upload to R2
 */
app.post('/api/protected/upload', async (c) => {
  const payload = c.get('jwtPayload')
  const userId = payload.sub

  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Generate unique filename
    const filename = `${userId}/${Date.now()}-${file.name}`

    // Upload to R2
    await c.env.BUCKET.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    return c.json({
      success: true,
      filename,
      url: `https://your-bucket.r2.cloudflarestorage.com/${filename}`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Upload failed' }, 500)
  }
})

/**
 * Example: Optional auth route
 *
 * Works for both authenticated and unauthenticated users
 */
app.get('/api/mixed/data', async (c) => {
  const payload = c.get('jwtPayload')
  const userId = payload?.sub

  if (userId) {
    // User is authenticated - return personalized data
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM data WHERE user_id = ?'
    )
      .bind(userId)
      .run()

    return c.json({
      data: results,
      personalized: true,
    })
  } else {
    // User is not authenticated - return public data
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM data WHERE is_public = 1 LIMIT 10'
    ).run()

    return c.json({
      data: results,
      personalized: false,
    })
  }
})

/**
 * Export the app
 */
export default app

/**
 * Helper function example
 */
async function performExpensiveComputation() {
  // Simulate expensive operation
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return { result: 'expensive data', computedAt: new Date().toISOString() }
}

/**
 * TypeScript types for request/response
 *
 * Define these for better type safety
 */
interface CreateDataRequest {
  name: string
  description?: string
}

interface CreateDataResponse {
  success: boolean
  id: number
}

interface ErrorResponse {
  error: string
}

/**
 * Auth Middleware for Cloudflare Workers + Hono + Clerk
 *
 * Verifies Clerk JWT tokens on protected routes and extracts user information.
 *
 * Prevents common errors:
 * - 401 Unauthorized errors from invalid/missing tokens
 * - Security vulnerabilities from unprotected routes
 * - Inconsistent auth checking across endpoints
 *
 * @package hono version 4.10.2+
 * @package @clerk/backend version 2.19.0+
 */

import { createMiddleware } from 'hono/factory'
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'
import { HTTPException } from 'hono/http-exception'

/**
 * Extend Hono context to include authenticated user info
 */
type Variables = JwtVariables & {
  userId: string
  sessionClaims: any
}

/**
 * Simple JWT Middleware using Hono's built-in jwt()
 *
 * This is the SIMPLEST approach. Use Clerk's signing secret directly.
 *
 * Usage:
 *   app.use('/api/protected/*', jwtAuthMiddleware(env.CLERK_SECRET_KEY))
 *   app.get('/api/protected/data', (c) => {
 *     const payload = c.get('jwtPayload')
 *     const userId = payload.sub // User ID from Clerk
 *     return c.json({ userId })
 *   })
 */
export function jwtAuthMiddleware(secret: string) {
  return jwt({
    secret,
    // Token can be in Authorization header or cookie
    cookie: 'clerk-session', // Optional: if using cookies
  })
}

/**
 * Advanced Auth Middleware with @clerk/backend
 *
 * This provides more features like:
 * - Session verification
 * - User metadata access
 * - Organization data
 *
 * Requires: npm install @clerk/backend
 *
 * Usage:
 *   import { createClerkClient } from '@clerk/backend'
 *
 *   const clerkClient = createClerkClient({
 *     secretKey: env.CLERK_SECRET_KEY
 *   })
 *
 *   app.use('/api/protected/*', clerkAuthMiddleware(clerkClient))
 */
export function clerkAuthMiddleware(clerkClient: any) {
  return createMiddleware(async (c, next) => {
    // Extract token from Authorization header
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, {
        message: 'Missing or invalid Authorization header',
      })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      // Verify the token with Clerk
      const session = await clerkClient.sessions.verifySession(token)

      // Store user ID in context for use in route handlers
      c.set('userId', session.userId)
      c.set('sessionClaims', session)

      await next()
    } catch (error) {
      console.error('Auth verification failed:', error)
      throw new HTTPException(401, { message: 'Invalid or expired token' })
    }
  })
}

/**
 * Manual JWT Verification (Recommended by Clerk)
 *
 * This is the official recommended approach from Clerk docs.
 * It manually verifies the JWT using Clerk's JWKS.
 *
 * Requires: npm install @clerk/backend
 */
export function manualJwtAuthMiddleware(env: {
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
}) {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, {
        message: 'Missing or invalid Authorization header',
      })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      // Import here to avoid bundling issues
      const { createClerkClient } = await import('@clerk/backend')

      const clerkClient = createClerkClient({
        secretKey: env.CLERK_SECRET_KEY,
      })

      // Verify token and get session claims
      const { sessionClaims } = await clerkClient.authenticateRequest(
        c.req.raw,
        {
          publishableKey: env.CLERK_PUBLISHABLE_KEY,
        }
      )

      if (!sessionClaims) {
        throw new Error('No session claims in token')
      }

      // Store claims in context
      c.set('userId', sessionClaims.sub as string)
      c.set('sessionClaims', sessionClaims)

      await next()
    } catch (error) {
      console.error('JWT verification failed:', error)
      throw new HTTPException(401, { message: 'Invalid or expired token' })
    }
  })
}

/**
 * Optional Auth Middleware
 *
 * Allows both authenticated and unauthenticated requests.
 * Use this for routes that have optional authentication.
 *
 * If authenticated: c.get('userId') will be set
 * If not authenticated: c.get('userId') will be undefined
 */
export function optionalAuthMiddleware(secret: string) {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization')

    // No auth header - continue without setting user
    if (!authHeader?.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      // Try to verify - don't throw if it fails
      const { jwt: jwtMiddleware } = await import('hono/jwt')
      const verify = jwtMiddleware({ secret })

      await verify(c, next)
      // If successful, jwtPayload will be set
    } catch (error) {
      // Invalid token - continue anyway
      console.warn('Optional auth failed:', error)
    }

    await next()
  })
}

/**
 * Example: Complete auth setup in your Hono app
 */
/*
import { Hono } from 'hono'
import { jwtAuthMiddleware } from './middleware/auth'
import type { JwtVariables } from 'hono/jwt'

// Define environment types
interface Env {
  CLERK_SECRET_KEY: string
  DB: D1Database
}

// Extend context with auth variables
type Variables = JwtVariables

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Public routes (no auth required)
app.get('/api/public/hello', (c) => {
  return c.json({ message: 'Hello, public!' })
})

// Protected routes (auth required)
app.use('/api/protected/*', jwtAuthMiddleware(c.env.CLERK_SECRET_KEY))

app.get('/api/protected/profile', (c) => {
  const payload = c.get('jwtPayload')
  const userId = payload.sub

  return c.json({
    userId,
    message: 'This is a protected route',
  })
})

export default app
*/

/**
 * Common Auth Errors and Fixes
 *
 * ❌ Error: "Missing or invalid Authorization header"
 * Fix: Make sure frontend sends: Authorization: Bearer <token>
 *
 * ❌ Error: "Invalid signature"
 * Fix: Check that CLERK_SECRET_KEY is correct (starts with sk_test_ or sk_live_)
 *
 * ❌ Error: "Token expired"
 * Fix: Frontend needs to refresh the token (Clerk handles this automatically)
 *
 * ❌ Error: Works in development but not production
 * Fix: Make sure you're using production Clerk keys (sk_live_) in production
 *
 * ❌ Error: 401 on first request after sign in
 * Fix: Frontend race condition - check isLoaded before making API calls
 */

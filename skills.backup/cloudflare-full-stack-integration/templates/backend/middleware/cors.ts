/**
 * CORS Middleware for Cloudflare Workers + Hono
 *
 * Prevents the common error:
 *   "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
 *
 * CRITICAL: This middleware MUST be applied BEFORE route handlers
 *
 * ❌ WRONG:
 *   app.post('/api/data', handler)
 *   app.use('/api/*', cors())
 *
 * ✅ CORRECT:
 *   app.use('/api/*', cors())
 *   app.post('/api/data', handler)
 *
 * @package hono version 4.10.2+
 */

import { cors } from 'hono/cors'
import type { MiddlewareHandler } from 'hono'

/**
 * Development CORS - Allows all origins
 *
 * Use this for local development. It allows requests from any origin,
 * which is fine for dev but NOT for production.
 */
export const corsDevMiddleware: MiddlewareHandler = cors({
  origin: '*', // Allow all origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 600, // Cache preflight for 10 minutes
})

/**
 * Production CORS - Restricted to your domain(s)
 *
 * Replace 'https://example.com' with your actual production domain.
 * You can also use an array: ['https://example.com', 'https://app.example.com']
 */
export const corsProdMiddleware: MiddlewareHandler = cors({
  origin: 'https://example.com', // ← REPLACE with your domain
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
})

/**
 * Dynamic CORS - Choose based on environment
 *
 * Automatically uses dev CORS for local and prod CORS for production.
 */
export function corsMiddleware(env: any): MiddlewareHandler {
  // Check if running in production
  const isProduction = env.ENVIRONMENT === 'production'

  return isProduction ? corsProdMiddleware : corsDevMiddleware
}

/**
 * Custom CORS - For more complex requirements
 *
 * Use this if you need:
 * - Multiple allowed origins
 * - Dynamic origin based on request
 * - Custom headers per route
 */
export function customCorsMiddleware(options: {
  allowedOrigins: string[]
  allowCredentials?: boolean
}): MiddlewareHandler {
  return cors({
    origin: (origin) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) return '*'

      // Check if origin is in allowed list
      if (options.allowedOrigins.includes(origin)) {
        return origin
      }

      // Deny other origins
      return ''
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: options.allowCredentials ?? true,
    maxAge: 86400,
  })
}

/**
 * Example: How to use in your Hono app
 */
/*
import { Hono } from 'hono'
import { corsMiddleware } from './middleware/cors'

const app = new Hono()

// Apply CORS BEFORE routes (CRITICAL!)
app.use('/api/*', corsMiddleware(env))

// Now define your routes
app.get('/api/hello', (c) => c.json({ message: 'Hello' }))
app.post('/api/data', (c) => c.json({ success: true }))

export default app
*/

/**
 * Common CORS Errors and Fixes
 *
 * ❌ Error: "No 'Access-Control-Allow-Origin' header is present"
 * Fix: Make sure CORS middleware is applied and returns the correct origin
 *
 * ❌ Error: "Response to preflight request doesn't pass access control check"
 * Fix: Make sure CORS middleware handles OPTIONS requests (it does by default)
 *
 * ❌ Error: "The value of the 'Access-Control-Allow-Credentials' header...is not true"
 * Fix: Set credentials: true in CORS config
 *
 * ❌ Error: First POST works, second fails
 * Fix: Increase maxAge to cache preflight longer
 *
 * ❌ Error: CORS works in development but not production
 * Fix: Update corsProdMiddleware with your actual production domain
 */

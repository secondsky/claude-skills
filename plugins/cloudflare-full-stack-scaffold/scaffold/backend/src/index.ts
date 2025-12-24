/**
 * Cloudflare Worker Entry Point
 *
 * This worker serves:
 * 1. API routes (via Hono)
 * 2. Frontend static assets (via @cloudflare/vite-plugin)
 *
 * All routes are prefixed with /api
 * CORS is enabled for development
 */

import { Hono } from 'hono'

// Middleware
import { corsDevMiddleware } from './middleware/cors'
/* CLERK AUTH START
import { authMiddleware } from './middleware/auth'
CLERK AUTH END */

// Routes
import apiRoutes from './routes/api'
import d1Routes from './routes/d1'
import kvRoutes from './routes/kv'
import r2Routes from './routes/r2'
import aiRoutes from './routes/ai'
import aiSdkRoutes from './routes/ai-sdk'
/* VECTORIZE START
import vectorizeRoutes from './routes/vectorize'
VECTORIZE END */
/* QUEUES START
import queueRoutes from './routes/queues'
QUEUES END */
import formRoutes from './routes/forms'

type Bindings = {
  AI: Ai
  DB: D1Database
  MY_KV: KVNamespace
  MY_BUCKET: R2Bucket
  /* VECTORIZE START
  MY_VECTORIZE: VectorizeIndex
  VECTORIZE END */
  /* QUEUES START
  MY_QUEUE: Queue
  QUEUES END */
  /* CLERK AUTH START
  CLERK_SECRET_KEY: string
  CLERK AUTH END */
  /* OPENAI START
  OPENAI_API_KEY: string
  OPENAI END */
  /* ANTHROPIC START
  ANTHROPIC_API_KEY: string
  ANTHROPIC END */
}

const app = new Hono<{ Bindings: Bindings }>()

// ============================================
// CRITICAL: Apply CORS BEFORE routes
// ============================================
app.use('/api/*', corsDevMiddleware)

// ============================================
// Optional: Auth middleware for protected routes
// ============================================
/* CLERK AUTH START
// Apply to specific routes that need auth
app.use('/api/protected/*', authMiddleware)
CLERK AUTH END */

// ============================================
// Mount API Routes
// ============================================
app.route('/api', apiRoutes)
app.route('/api/d1', d1Routes)
app.route('/api/kv', kvRoutes)
app.route('/api/r2', r2Routes)
app.route('/api/ai', aiRoutes)
app.route('/api/ai-sdk', aiSdkRoutes)
/* VECTORIZE START
app.route('/api/vectorize', vectorizeRoutes)
VECTORIZE END */
/* QUEUES START
app.route('/api/queues', queueRoutes)
QUEUES END */
app.route('/api/forms', formRoutes)

// ============================================
// Health Check
// ============================================
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
    services: {
      d1: !!c.env.DB,
      kv: !!c.env.MY_KV,
      r2: !!c.env.MY_BUCKET,
      ai: !!c.env.AI,
      /* VECTORIZE START
      vectorize: !!c.env.MY_VECTORIZE,
      VECTORIZE END */
      /* QUEUES START
      queue: !!c.env.MY_QUEUE,
      QUEUES END */
    },
  })
})

export default app

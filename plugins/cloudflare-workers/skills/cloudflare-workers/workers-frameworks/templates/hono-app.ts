/**
 * Hono App Template for Cloudflare Workers
 *
 * Production-ready template with:
 * - Type-safe bindings
 * - Middleware (CORS, logging, security)
 * - Route organization
 * - Error handling
 * - Input validation with Zod
 *
 * Usage:
 * 1. Copy to src/index.ts
 * 2. Install: bun add hono @hono/zod-validator zod
 * 3. Configure wrangler.jsonc with bindings
 * 4. Run: bunx wrangler dev
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { timing, startTime, endTime } from 'hono/timing';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// ============================================
// TYPES
// ============================================

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS?: string;
}

interface Variables {
  requestId: string;
  startTime: number;
}

// ============================================
// SCHEMAS
// ============================================

const UserCreateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const UserUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
});

// ============================================
// APP SETUP
// ============================================

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================
// MIDDLEWARE
// ============================================

// Request ID
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.set('startTime', Date.now());
  c.header('X-Request-ID', requestId);
  await next();
});

// Logging
app.use('*', logger());

// Timing
app.use('*', timing());

// Security headers
app.use('*', secureHeaders());

// CORS
app.use('/api/*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      if (c.env.ENVIRONMENT === 'development') {
        return origin;
      }
      const allowed = c.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  return corsMiddleware(c, next);
});

// ============================================
// ROUTES - HEALTH
// ============================================

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// ============================================
// ROUTES - USERS
// ============================================

// List users
app.get('/api/users', zValidator('query', PaginationSchema), async (c) => {
  startTime(c, 'db');

  const { page, limit } = c.req.valid('query');
  const offset = (page - 1) * limit;

  const [users, countResult] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM users LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
  ]);

  endTime(c, 'db');

  return c.json({
    data: users.results,
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      pages: Math.ceil((countResult?.count || 0) / limit),
    },
  });
});

// Get user by ID
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

// Create user
app.post('/api/users', zValidator('json', UserCreateSchema), async (c) => {
  const { name, email } = c.req.valid('json');

  // Check if email exists
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (existing) {
    return c.json({ error: 'Email already exists' }, 409);
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *'
  )
    .bind(name, email)
    .first();

  return c.json(result, 201);
});

// Update user
app.put('/api/users/:id', zValidator('json', UserUpdateSchema), async (c) => {
  const id = c.req.param('id');
  const updates = c.req.valid('json');

  // Check if user exists
  const existing = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Build update query
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  if (fields.length === 0) {
    return c.json(existing);
  }

  values.push(id);

  const result = await c.env.DB.prepare(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ? RETURNING *`
  )
    .bind(...values)
    .first();

  return c.json(result);
});

// Delete user
app.delete('/api/users/:id', async (c) => {
  const id = c.req.param('id');

  const result = await c.env.DB.prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.body(null, 204);
});

// ============================================
// ERROR HANDLING
// ============================================

app.onError((err, c) => {
  const requestId = c.get('requestId');
  const duration = Date.now() - c.get('startTime');

  console.error(`[${requestId}] Error after ${duration}ms:`, {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  // Don't expose internal errors in production
  const message = c.env.ENVIRONMENT === 'development'
    ? err.message
    : 'Internal Server Error';

  return c.json(
    {
      error: message,
      requestId,
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// ============================================
// EXPORT
// ============================================

export default app;

// ============================================
// WRANGLER CONFIG EXAMPLE
// ============================================

/*
// wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "hono-app",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-db",
      "database_id": "xxx"
    }
  ],

  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "xxx"
    }
  ],

  "vars": {
    "ENVIRONMENT": "development"
  },

  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production",
        "ALLOWED_ORIGINS": "https://app.example.com"
      }
    }
  }
}
*/

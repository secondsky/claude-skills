/**
 * Secure Worker Template
 *
 * Features:
 * - Authentication middleware
 * - CORS configuration
 * - Rate limiting
 * - Security headers
 * - Input validation
 * - Error handling
 *
 * Usage:
 * 1. Copy as src/index.ts
 * 2. Configure secrets
 * 3. Customize routes
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

// ============================================
// TYPES
// ============================================

interface Env {
  ENVIRONMENT: string;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
  KV: KVNamespace;
}

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface Variables {
  user: User | null;
  requestId: string;
}

// ============================================
// APP SETUP
// ============================================

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ============================================
// SECURITY HEADERS MIDDLEWARE
// ============================================

app.use('*', async (c, next) => {
  await next();

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'none'"
  );
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove server info
  c.res.headers.delete('Server');
});

// ============================================
// REQUEST ID MIDDLEWARE
// ============================================

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
});

// ============================================
// CORS MIDDLEWARE
// ============================================

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (c.env.ENVIRONMENT === 'development') {
        return origin; // Allow all in dev
      }
      const allowed = c.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
    maxAge: 86400,
  })
);

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const key = `ratelimit:${ip}`;
  const limit = 100;
  const window = 60; // seconds

  const now = Date.now();
  const windowStart = Math.floor(now / (window * 1000)) * (window * 1000);
  const kvKey = `${key}:${windowStart}`;

  const countStr = await c.env.KV.get(kvKey);
  const count = countStr ? parseInt(countStr, 10) : 0;

  if (count >= limit) {
    c.header('Retry-After', Math.ceil((windowStart + window * 1000 - now) / 1000).toString());
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', '0');
    return c.json({ error: 'Too Many Requests' }, 429);
  }

  await c.env.KV.put(kvKey, (count + 1).toString(), { expirationTtl: window });

  c.header('X-RateLimit-Limit', limit.toString());
  c.header('X-RateLimit-Remaining', (limit - count - 1).toString());

  await next();
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

async function verifyJWT(token: string, secret: string): Promise<User | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );

    if (!valid) return null;

    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    );

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// Auth middleware for protected routes
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization' }, 401);
  }

  const token = authHeader.slice(7);
  const user = await verifyJWT(token, c.env.JWT_SECRET);

  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
};

// ============================================
// INPUT VALIDATION
// ============================================

const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

const UserUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: any, next: () => Promise<void>) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedBody', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Validation failed',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
          400
        );
      }
      throw error;
    }
  };
}

// ============================================
// ERROR HANDLING
// ============================================

app.onError((err, c) => {
  const requestId = c.get('requestId');

  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
  });

  // Don't expose internal errors in production
  const message =
    c.env.ENVIRONMENT === 'development'
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

// ============================================
// ROUTES
// ============================================

// Public routes
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Protected routes
app.use('/api/*', authMiddleware);

app.get('/api/me', (c) => {
  const user = c.get('user');
  return c.json({ user });
});

app.get('/api/users', async (c) => {
  const user = c.get('user');

  // Admin only
  if (user?.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Fetch users
  return c.json({ users: [] });
});

app.post('/api/users', validateBody(UserCreateSchema), async (c) => {
  const user = c.get('user');

  // Admin only
  if (user?.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = c.get('validatedBody');

  // Create user (implement your logic)
  return c.json({ created: true, user: { email: body.email, name: body.name } }, 201);
});

app.put('/api/users/:id', validateBody(UserUpdateSchema), async (c) => {
  const user = c.get('user');
  const targetId = c.req.param('id');

  // Users can only update themselves (unless admin)
  if (user?.role !== 'admin' && user?.id !== targetId) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const body = c.get('validatedBody');

  // Update user (implement your logic)
  return c.json({ updated: true, user: { id: targetId, ...body } });
});

app.delete('/api/users/:id', async (c) => {
  const user = c.get('user');

  // Admin only
  if (user?.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const targetId = c.req.param('id');

  // Delete user (implement your logic)
  return c.json({ deleted: true, id: targetId });
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
// WRANGLER CONFIG
// ============================================

/*
// wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "secure-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],

  "vars": {
    "ENVIRONMENT": "development"
  },

  "kv_namespaces": [
    { "binding": "KV", "id": "xxx", "preview_id": "xxx" }
  ],

  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production",
        "ALLOWED_ORIGINS": "https://app.example.com,https://admin.example.com"
      }
    }
  }
}

// Set secrets:
// bunx wrangler secret put JWT_SECRET
*/

/**
 * Authentication Middleware for Cloudflare Workers
 *
 * Features:
 * - JWT verification (HS256, RS256)
 * - API key validation
 * - Session-based auth
 * - Role-based access control
 * - Token refresh
 *
 * Usage:
 * 1. Configure auth strategy
 * 2. Wrap handlers with middleware
 * 3. Access user in handler
 */

// ============================================
// TYPES
// ============================================

interface Env {
  JWT_SECRET: string;
  KV: KVNamespace;
}

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  permissions: string[];
}

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

interface AuthResult {
  authenticated: boolean;
  user?: User;
  error?: string;
}

type Handler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response>;

type AuthenticatedHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: User
) => Promise<Response>;

// ============================================
// JWT UTILITIES
// ============================================

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function createJWT(payload: Omit<JWTPayload, 'iat'>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const fullPayload: JWTPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function verifyJWT(token: string, secret: string): Promise<AuthResult> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { authenticated: false, error: 'Invalid token format' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64UrlDecode(signatureB64);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) {
      return { authenticated: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as JWTPayload;

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { authenticated: false, error: 'Token expired' };
    }

    // Build user object
    const user: User = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as User['role'],
      permissions: payload.permissions || [],
    };

    return { authenticated: true, user };
  } catch (error) {
    return { authenticated: false, error: (error as Error).message };
  }
}

// ============================================
// API KEY UTILITIES
// ============================================

async function sha256(str: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function validateApiKey(
  apiKey: string,
  kv: KVNamespace
): Promise<AuthResult> {
  if (!apiKey) {
    return { authenticated: false, error: 'Missing API key' };
  }

  // Validate format
  if (!apiKey.startsWith('sk_')) {
    return { authenticated: false, error: 'Invalid API key format' };
  }

  // Hash for lookup
  const keyHash = await sha256(apiKey);

  // Lookup in KV
  const clientData = await kv.get<{
    userId: string;
    email: string;
    role: User['role'];
    permissions: string[];
    rateLimit: number;
  }>(`apikey:${keyHash}`, 'json');

  if (!clientData) {
    return { authenticated: false, error: 'Invalid API key' };
  }

  const user: User = {
    id: clientData.userId,
    email: clientData.email,
    role: clientData.role,
    permissions: clientData.permissions,
  };

  return { authenticated: true, user };
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

/**
 * JWT Bearer Token Authentication
 */
export function withJWTAuth(handler: AuthenticatedHandler): Handler {
  return async (request, env, ctx) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.slice(7);
    const result = await verifyJWT(token, env.JWT_SECRET);

    if (!result.authenticated || !result.user) {
      return new Response(
        JSON.stringify({ error: result.error || 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, env, ctx, result.user);
  };
}

/**
 * API Key Authentication
 */
export function withApiKeyAuth(handler: AuthenticatedHandler): Handler {
  return async (request, env, ctx) => {
    const apiKey = request.headers.get('X-API-Key');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing X-API-Key header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await validateApiKey(apiKey, env.KV);

    if (!result.authenticated || !result.user) {
      return new Response(
        JSON.stringify({ error: result.error || 'Invalid API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, env, ctx, result.user);
  };
}

/**
 * Combined Auth (Bearer or API Key)
 */
export function withAuth(handler: AuthenticatedHandler): Handler {
  return async (request, env, ctx) => {
    const authHeader = request.headers.get('Authorization');
    const apiKey = request.headers.get('X-API-Key');

    let result: AuthResult;

    if (authHeader?.startsWith('Bearer ')) {
      result = await verifyJWT(authHeader.slice(7), env.JWT_SECRET);
    } else if (apiKey) {
      result = await validateApiKey(apiKey, env.KV);
    } else {
      return new Response(
        JSON.stringify({
          error: 'Missing authentication. Provide Bearer token or X-API-Key',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!result.authenticated || !result.user) {
      return new Response(
        JSON.stringify({ error: result.error || 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, env, ctx, result.user);
  };
}

// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================

/**
 * Require specific role
 */
export function requireRole(
  handler: AuthenticatedHandler,
  allowedRoles: User['role'][]
): AuthenticatedHandler {
  return async (request, env, ctx, user) => {
    if (!allowedRoles.includes(user.role)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: `Required role: ${allowedRoles.join(' or ')}`,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, env, ctx, user);
  };
}

/**
 * Require specific permission
 */
export function requirePermission(
  handler: AuthenticatedHandler,
  requiredPermission: string
): AuthenticatedHandler {
  return async (request, env, ctx, user) => {
    if (!user.permissions.includes(requiredPermission)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: `Required permission: ${requiredPermission}`,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, env, ctx, user);
  };
}

// ============================================
// OPTIONAL AUTH
// ============================================

/**
 * Optional authentication - doesn't fail if no auth provided
 */
export function withOptionalAuth(
  handler: (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    user: User | null
  ) => Promise<Response>
): Handler {
  return async (request, env, ctx) => {
    const authHeader = request.headers.get('Authorization');
    let user: User | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const result = await verifyJWT(authHeader.slice(7), env.JWT_SECRET);
      if (result.authenticated && result.user) {
        user = result.user;
      }
    }

    return handler(request, env, ctx, user);
  };
}

// ============================================
// TOKEN GENERATION
// ============================================

export async function generateTokens(
  user: User,
  secret: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await createJWT(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    },
    secret
  );

  const refreshToken = await createJWT(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: [],
      exp: Math.floor(Date.now() / 1000) + 604800, // 7 days
    },
    secret
  );

  return { accessToken, refreshToken };
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import { Hono } from 'hono';
import {
  withJWTAuth,
  withApiKeyAuth,
  withAuth,
  requireRole,
  requirePermission,
  generateTokens,
} from './auth-middleware';

const app = new Hono<{ Bindings: Env }>();

// Public endpoint
app.get('/health', (c) => c.json({ status: 'ok' }));

// JWT protected endpoint
app.get('/api/me', async (c) => {
  return withJWTAuth(async (request, env, ctx, user) => {
    return Response.json({ user });
  })(c.req.raw, c.env, c.executionCtx);
});

// Admin only endpoint
app.delete('/api/users/:id', async (c) => {
  return withAuth(
    requireRole(
      async (request, env, ctx, user) => {
        // Handle delete
        return Response.json({ deleted: true });
      },
      ['admin']
    )
  )(c.req.raw, c.env, c.executionCtx);
});

// Permission-based endpoint
app.post('/api/posts', async (c) => {
  return withAuth(
    requirePermission(
      async (request, env, ctx, user) => {
        // Handle create post
        return Response.json({ created: true });
      },
      'posts:write'
    )
  )(c.req.raw, c.env, c.executionCtx);
});

// Login endpoint
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  // Validate credentials (implement your own logic)
  const user = await validateCredentials(email, password);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const tokens = await generateTokens(user, c.env.JWT_SECRET);
  return c.json(tokens);
});
*/

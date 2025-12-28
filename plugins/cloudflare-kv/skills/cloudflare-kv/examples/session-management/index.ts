/**
 * Cloudflare Workers KV - Session Management Example
 *
 * Production-ready session store using KV with:
 * - Secure session creation
 * - TTL-based expiration
 * - Metadata tracking (IP, user agent, last activity)
 * - Session validation
 * - Activity tracking
 *
 * Production-ready Worker with Hono framework
 */

import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

type Bindings = {
  SESSIONS: KVNamespace;
};

interface Session {
  userId: string;
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  data?: Record<string, any>;
}

const app = new Hono<{ Bindings: Bindings }>();

// Session configuration
const SESSION_TTL = 86400; // 24 hours
const SESSION_COOKIE_NAME = 'session_id';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate secure random session ID
 */
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get session from KV
 */
async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<Session | null> {
  const sessionData = await kv.get(`session:${sessionId}`, 'json');
  return sessionData as Session | null;
}

/**
 * Save session to KV
 */
async function saveSession(
  kv: KVNamespace,
  sessionId: string,
  session: Session
): Promise<void> {
  await kv.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
    metadata: {
      userId: session.userId,
      ipAddress: session.ipAddress,
      lastActivity: session.lastActivity
    }
  });
}

/**
 * Delete session from KV
 */
async function deleteSession(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(`session:${sessionId}`);
}

// ============================================================================
// Session Middleware
// ============================================================================

/**
 * Middleware to load and validate session
 */
app.use('*', async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);

  if (sessionId) {
    const session = await getSession(c.env.SESSIONS, sessionId);

    if (session) {
      // Update last activity
      session.lastActivity = Date.now();
      await saveSession(c.env.SESSIONS, sessionId, session);

      // Attach session to context
      c.set('session', session);
      c.set('sessionId', sessionId);
    }
  }

  await next();
});

// ============================================================================
// Authentication Endpoints
// ============================================================================

/**
 * Login endpoint - creates new session
 */
app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json();

  // In production, validate credentials against database
  // This is a simplified example
  if (!username || !password) {
    return c.json({ error: 'Missing credentials' }, 400);
  }

  // Simulate authentication (replace with real auth)
  if (password !== 'demo123') {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Create session
  const sessionId = generateSessionId();
  const session: Session = {
    userId: username,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ipAddress: c.req.header('cf-connecting-ip') || 'unknown',
    userAgent: c.req.header('user-agent') || 'unknown',
    data: {
      loginTimestamp: Date.now(),
      role: 'user'
    }
  };

  // Save to KV
  await saveSession(c.env.SESSIONS, sessionId, session);

  // Set cookie
  setCookie(c, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: SESSION_TTL,
    path: '/'
  });

  return c.json({
    success: true,
    session: {
      userId: session.userId,
      expiresAt: Date.now() + SESSION_TTL * 1000
    }
  });
});

/**
 * Logout endpoint - destroys session
 */
app.post('/auth/logout', async (c) => {
  const sessionId = c.get('sessionId');

  if (sessionId) {
    await deleteSession(c.env.SESSIONS, sessionId);
    deleteCookie(c, SESSION_COOKIE_NAME);
  }

  return c.json({ success: true, message: 'Logged out successfully' });
});

/**
 * Session status endpoint
 */
app.get('/auth/status', async (c) => {
  const session = c.get('session');
  const sessionId = c.get('sessionId');

  if (!session || !sessionId) {
    return c.json({ authenticated: false });
  }

  return c.json({
    authenticated: true,
    session: {
      userId: session.userId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      timeRemaining: SESSION_TTL - (Date.now() - session.createdAt) / 1000
    }
  });
});

// ============================================================================
// Protected Routes
// ============================================================================

/**
 * Middleware to require authentication
 */
const requireAuth = async (c: any, next: any) => {
  const session = c.get('session');

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
};

/**
 * Protected dashboard endpoint
 */
app.get('/dashboard', requireAuth, async (c) => {
  const session = c.get('session');

  return c.json({
    message: 'Welcome to your dashboard',
    user: {
      userId: session.userId,
      sessionAge: Math.floor((Date.now() - session.createdAt) / 1000),
      data: session.data
    }
  });
});

/**
 * Update session data
 */
app.post('/dashboard/update', requireAuth, async (c) => {
  const sessionId = c.get('sessionId');
  const session = c.get('session');
  const updates = await c.req.json();

  // Merge updates into session data
  session.data = { ...session.data, ...updates };

  // Save updated session
  await saveSession(c.env.SESSIONS, sessionId, session);

  return c.json({ success: true, data: session.data });
});

// ============================================================================
// Admin Endpoints
// ============================================================================

/**
 * List all active sessions (for admin)
 */
app.get('/admin/sessions', async (c) => {
  const { keys } = await c.env.SESSIONS.list({
    prefix: 'session:',
    limit: 100
  });

  const sessions = await Promise.all(
    keys.map(async ({ name, metadata }) => {
      const sessionId = name.replace('session:', '');
      const session = await getSession(c.env.SESSIONS, sessionId);

      return {
        sessionId,
        userId: metadata?.userId,
        ipAddress: metadata?.ipAddress,
        lastActivity: metadata?.lastActivity,
        isActive: session !== null
      };
    })
  );

  return c.json({
    total: sessions.length,
    sessions: sessions.filter(s => s.isActive)
  });
});

/**
 * Revoke specific session (admin)
 */
app.delete('/admin/sessions/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  await deleteSession(c.env.SESSIONS, sessionId);

  return c.json({ success: true, message: `Session ${sessionId} revoked` });
});

/**
 * Revoke all sessions for user (admin)
 */
app.delete('/admin/users/:userId/sessions', async (c) => {
  const userId = c.req.param('userId');

  // List all sessions
  const { keys } = await c.env.SESSIONS.list({
    prefix: 'session:',
    limit: 1000
  });

  // Delete sessions for this user
  let deleted = 0;
  for (const { name, metadata } of keys) {
    if (metadata?.userId === userId) {
      const sessionId = name.replace('session:', '');
      await deleteSession(c.env.SESSIONS, sessionId);
      deleted++;
    }
  }

  return c.json({
    success: true,
    message: `Revoked ${deleted} sessions for user ${userId}`
  });
});

// ============================================================================
// Session Analytics
// ============================================================================

/**
 * Track user activity
 */
app.post('/analytics/event', requireAuth, async (c) => {
  const session = c.get('session');
  const { eventType, eventData } = await c.req.json();

  const analyticsKey = `analytics:${session.userId}:${eventType}:${Date.now()}`;

  await c.env.SESSIONS.put(
    analyticsKey,
    JSON.stringify({ eventData, sessionId: c.get('sessionId') }),
    {
      expirationTtl: 86400 * 30, // Keep for 30 days
      metadata: {
        userId: session.userId,
        eventType,
        timestamp: Date.now()
      }
    }
  );

  return c.json({ success: true });
});

/**
 * Get user activity
 */
app.get('/analytics/user/:userId', async (c) => {
  const userId = c.req.param('userId');

  const { keys } = await c.env.SESSIONS.list({
    prefix: `analytics:${userId}:`,
    limit: 100
  });

  const events = keys.map(({ name, metadata }) => ({
    eventType: metadata?.eventType,
    timestamp: metadata?.timestamp
  }));

  return c.json({ userId, events });
});

// ============================================================================
// Root & 404
// ============================================================================

app.get('/', (c) => {
  return c.html(`
    <h1>Cloudflare Workers KV - Session Management Example</h1>
    <p>Try these endpoints:</p>
    <h2>Authentication</h2>
    <ul>
      <li>POST /auth/login - Create session (body: {"username": "test", "password": "demo123"})</li>
      <li>POST /auth/logout - Destroy session</li>
      <li>GET /auth/status - Check session status</li>
    </ul>
    <h2>Protected Routes</h2>
    <ul>
      <li>GET /dashboard - Access protected dashboard</li>
      <li>POST /dashboard/update - Update session data</li>
    </ul>
    <h2>Admin</h2>
    <ul>
      <li>GET /admin/sessions - List all active sessions</li>
      <li>DELETE /admin/sessions/:sessionId - Revoke specific session</li>
      <li>DELETE /admin/users/:userId/sessions - Revoke all user sessions</li>
    </ul>
    <h2>Analytics</h2>
    <ul>
      <li>POST /analytics/event - Track user event</li>
      <li>GET /analytics/user/:userId - Get user activity</li>
    </ul>
  `);
});

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;

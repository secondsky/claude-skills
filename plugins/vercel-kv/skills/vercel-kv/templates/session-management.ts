// Complete Session Management with Vercel KV
// Secure session handling for Next.js applications

import { kv } from '@vercel/kv';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

// Session data interface
interface SessionData {
  userId: string;
  email: string;
  role?: string;
  createdAt: number;
  lastActivityAt: number;
  ipAddress?: string;
  userAgent?: string;
}

// Session configuration
const SESSION_CONFIG = {
  cookieName: 'session',
  ttl: 7 * 24 * 3600, // 7 days in seconds
  renewalWindow: 24 * 3600, // Renew if less than 1 day remaining
  absoluteTimeout: 30 * 24 * 3600, // 30 days maximum
};

// ============================================================================
// CREATE SESSION
// ============================================================================

export async function createSession(
  userId: string,
  email: string,
  options?: {
    role?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<string> {
  // Generate secure session ID
  const sessionId = randomBytes(32).toString('base64url');

  // Create session data
  const sessionData: SessionData = {
    userId,
    email,
    role: options?.role,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  };

  // Store in KV with TTL
  await kv.setex(
    `session:${sessionId}`,
    SESSION_CONFIG.ttl,
    JSON.stringify(sessionData)
  );

  // Set HTTP-only cookie
  cookies().set(SESSION_CONFIG.cookieName, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_CONFIG.ttl,
    path: '/',
  });

  return sessionId;
}

// ============================================================================
// GET SESSION
// ============================================================================

export async function getSession(): Promise<SessionData | null> {
  const sessionId = cookies().get(SESSION_CONFIG.cookieName)?.value;

  if (!sessionId) {
    return null;
  }

  // Get session from KV
  const sessionJson = await kv.get<string>(`session:${sessionId}`);

  if (!sessionJson) {
    // Session expired or doesn't exist
    await destroySession();
    return null;
  }

  const sessionData: SessionData = JSON.parse(sessionJson);

  // Check absolute timeout (prevent indefinite renewal)
  const sessionAge = Date.now() - sessionData.createdAt;
  if (sessionAge > SESSION_CONFIG.absoluteTimeout * 1000) {
    await destroySession();
    return null;
  }

  // Auto-renew if close to expiration
  const timeSinceLastActivity = Date.now() - sessionData.lastActivityAt;
  if (timeSinceLastActivity > SESSION_CONFIG.renewalWindow * 1000) {
    await refreshSession(sessionId, sessionData);
  }

  return sessionData;
}

// ============================================================================
// REFRESH SESSION
// ============================================================================

async function refreshSession(sessionId: string, sessionData: SessionData): Promise<void> {
  // Update last activity
  sessionData.lastActivityAt = Date.now();

  // Extend TTL
  await kv.setex(
    `session:${sessionId}`,
    SESSION_CONFIG.ttl,
    JSON.stringify(sessionData)
  );

  // Extend cookie
  cookies().set(SESSION_CONFIG.cookieName, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_CONFIG.ttl,
    path: '/',
  });
}

// ============================================================================
// UPDATE SESSION DATA
// ============================================================================

export async function updateSession(updates: Partial<Omit<SessionData, 'userId' | 'createdAt'>>): Promise<boolean> {
  const sessionId = cookies().get(SESSION_CONFIG.cookieName)?.value;

  if (!sessionId) {
    return false;
  }

  const sessionJson = await kv.get<string>(`session:${sessionId}`);

  if (!sessionJson) {
    return false;
  }

  const sessionData: SessionData = JSON.parse(sessionJson);

  // Merge updates
  Object.assign(sessionData, updates);
  sessionData.lastActivityAt = Date.now();

  // Save updated session
  await kv.setex(
    `session:${sessionId}`,
    SESSION_CONFIG.ttl,
    JSON.stringify(sessionData)
  );

  return true;
}

// ============================================================================
// DESTROY SESSION
// ============================================================================

export async function destroySession(): Promise<void> {
  const sessionId = cookies().get(SESSION_CONFIG.cookieName)?.value;

  if (sessionId) {
    // Delete from KV
    await kv.del(`session:${sessionId}`);
  }

  // Clear cookie
  cookies().delete(SESSION_CONFIG.cookieName);
}

// ============================================================================
// GET ALL USER SESSIONS (for multi-device support)
// ============================================================================

export async function getUserSessions(userId: string): Promise<Array<{
  sessionId: string;
  data: SessionData;
}>> {
  // Note: This requires maintaining a user -> sessions index
  // Store session IDs in a set for each user
  const sessionIds = await kv.smembers(`user:${userId}:sessions`);

  const sessions = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const sessionJson = await kv.get<string>(`session:${sessionId}`);
      if (!sessionJson) return null;

      return {
        sessionId: sessionId as string,
        data: JSON.parse(sessionJson) as SessionData,
      };
    })
  );

  return sessions.filter((s) => s !== null) as Array<{
    sessionId: string;
    data: SessionData;
  }>;
}

// ============================================================================
// DESTROY ALL USER SESSIONS (for logout from all devices)
// ============================================================================

export async function destroyAllUserSessions(userId: string): Promise<void> {
  const sessionIds = await kv.smembers(`user:${userId}:sessions`);

  // Delete all session keys
  if (sessionIds.length > 0) {
    await kv.del(...sessionIds.map(id => `session:${id}`));
  }

  // Clear sessions set
  await kv.del(`user:${userId}:sessions`);

  // Clear current session cookie
  cookies().delete(SESSION_CONFIG.cookieName);
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example: Login Server Action
/*
'use server';

import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate credentials (example - use proper auth)
  const user = await validateCredentials(email, password);

  if (!user) {
    return { error: 'Invalid credentials' };
  }

  // Create session
  await createSession(user.id, user.email, {
    role: user.role,
    ipAddress: headers().get('x-forwarded-for') || undefined,
    userAgent: headers().get('user-agent') || undefined,
  });

  redirect('/dashboard');
}
*/

// Example: Logout Server Action
/*
'use server';

import { redirect } from 'next/navigation';

export async function logout() {
  await destroySession();
  redirect('/login');
}
*/

// Example: Protected API Route
/*
import { getSession } from './session-management';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated
  return NextResponse.json({ userId: session.userId, email: session.email });
}
*/

// Example: Middleware for Protected Routes
/*
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';

export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('session')?.value;

  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const sessionJson = await kv.get<string>(`session:${sessionId}`);

  if (!sessionJson) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
*/

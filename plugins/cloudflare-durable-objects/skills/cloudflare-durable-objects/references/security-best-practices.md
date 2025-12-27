# Security Best Practices for Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/durable-objects/

Complete guide to securing Durable Objects applications against common vulnerabilities and attacks.

---

## Overview

Key security principles for Durable Objects:
- Input validation and sanitization
- SQL injection prevention
- Access control and authentication
- Rate limiting and DDoS protection
- Data privacy and encryption
- Secure WebSocket handling
- Audit logging

---

## Input Validation

Always validate and sanitize user input before processing.

### ❌ Unsafe Pattern
```typescript
async updateProfile(request: Request) {
  const data = await request.json();

  // ❌ No validation
  await this.ctx.storage.sql.exec(
    'UPDATE profiles SET bio = ? WHERE user_id = ?',
    data.bio, // Could be malicious
    data.userId
  );
}
```

### ✅ Secure Pattern
```typescript
import { z } from 'zod';

// Define schema
const ProfileSchema = z.object({
  bio: z.string().max(500).trim(),
  userId: z.string().uuid()
});

async updateProfile(request: Request) {
  const data = await request.json();

  // ✅ Validate input
  const validated = ProfileSchema.parse(data);

  await this.ctx.storage.sql.exec(
    'UPDATE profiles SET bio = ? WHERE user_id = ?',
    validated.bio,
    validated.userId
  );
}
```

### Input Sanitization

```typescript
// HTML sanitization for user-generated content
function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// URL validation
function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

---

## SQL Injection Prevention

Always use parameterized queries, never string concatenation.

### ❌ Vulnerable to SQL Injection
```typescript
// ❌ NEVER DO THIS
async searchUsers(username: string) {
  const result = await this.ctx.storage.sql.exec(
    `SELECT * FROM users WHERE username = '${username}'`
  );
  // Attacker can inject: "'; DROP TABLE users; --"
}
```

### ✅ SQL Injection Safe
```typescript
// ✅ Use parameterized queries
async searchUsers(username: string) {
  const result = await this.ctx.storage.sql.exec(
    'SELECT * FROM users WHERE username = ?',
    username
  );
}

// ✅ Dynamic column names (whitelist approach)
const ALLOWED_SORT_COLUMNS = ['created_at', 'username', 'score'] as const;

async getUsers(sortBy: string) {
  if (!ALLOWED_SORT_COLUMNS.includes(sortBy as any)) {
    throw new Error('Invalid sort column');
  }

  const result = await this.ctx.storage.sql.exec(
    `SELECT * FROM users ORDER BY ${sortBy} DESC`
  );
}
```

---

## Access Control

Implement proper authentication and authorization.

### Authentication Pattern

```typescript
import { verify } from '@tsndr/cloudflare-worker-jwt';

async authenticate(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const isValid = await verify(token, env.JWT_SECRET);
    if (!isValid) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub; // User ID
  } catch {
    return null;
  }
}

// Usage in DO
async fetch(request: Request): Promise<Response> {
  const userId = await this.authenticate(request, this.env);

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process authenticated request
  return this.handleRequest(request, userId);
}
```

### Resource-Level Authorization

```typescript
async updateMessage(messageId: number, userId: string, newContent: string) {
  // Check ownership
  const message = await this.ctx.storage.sql.exec(
    'SELECT user_id FROM messages WHERE id = ?',
    messageId
  );

  if (message.rows.length === 0) {
    throw new Error('Message not found');
  }

  if (message.rows[0].user_id !== userId) {
    throw new Error('Forbidden: Not your message');
  }

  // User owns the message, proceed with update
  await this.ctx.storage.sql.exec(
    'UPDATE messages SET content = ?, updated_at = ? WHERE id = ?',
    newContent, Date.now(), messageId
  );
}
```

### Role-Based Access Control (RBAC)

```typescript
enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user'
}

const PERMISSIONS = {
  [Role.ADMIN]: ['*'],
  [Role.MODERATOR]: ['delete_message', 'ban_user', 'edit_any_message'],
  [Role.USER]: ['create_message', 'edit_own_message', 'delete_own_message']
};

function hasPermission(role: Role, permission: string): boolean {
  const rolePerms = PERMISSIONS[role];
  return rolePerms.includes('*') || rolePerms.includes(permission);
}

async deleteMessage(messageId: number, userId: string, userRole: Role) {
  const message = await this.ctx.storage.sql.exec(
    'SELECT user_id FROM messages WHERE id = ?',
    messageId
  );

  const isOwner = message.rows[0]?.user_id === userId;
  const canDeleteOwn = hasPermission(userRole, 'delete_own_message');
  const canDeleteAny = hasPermission(userRole, 'delete_message');

  if (!(isOwner && canDeleteOwn) && !canDeleteAny) {
    throw new Error('Forbidden');
  }

  await this.ctx.storage.sql.exec('DELETE FROM messages WHERE id = ?', messageId);
}
```

---

## Rate Limiting

Protect against abuse and DDoS attacks.

### Per-IP Rate Limiting

```typescript
export class RateLimitedDO extends DurableObject {
  async checkRateLimit(clientId: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Count recent requests
    const result = await this.ctx.storage.sql.exec(
      'SELECT COUNT(*) as count FROM requests WHERE client_id = ? AND timestamp > ?',
      clientId, windowStart
    );

    const count = result.rows[0].count as number;

    if (count >= limit) {
      return false; // Rate limit exceeded
    }

    // Record request
    await this.ctx.storage.sql.exec(
      'INSERT INTO requests (client_id, timestamp) VALUES (?, ?)',
      clientId, now
    );

    return true;
  }
}

// Usage in Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const id = env.RATE_LIMITER.idFromName(clientIp);
    const stub = env.RATE_LIMITER.get(id);

    const allowed = await stub.checkRateLimit(clientIp, 100, 60000); // 100/min

    if (!allowed) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    // Process request
    return new Response('OK');
  }
};
```

### Token Bucket Algorithm

```typescript
export class TokenBucket extends DurableObject {
  private tokens: number = 100;
  private lastRefill: number = Date.now();
  private readonly maxTokens = 100;
  private readonly refillRate = 10; // tokens per second

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = Math.floor(elapsed * this.refillRate);

    if (newTokens > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }

  async consume(cost: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }

    return false;
  }
}
```

---

## Data Privacy

Protect sensitive user data.

### Encryption at Rest

```typescript
// Encrypt sensitive data before storage
async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Usage
async storeSecureData(userId: string, sensitiveData: string) {
  const key = await this.getEncryptionKey();
  const encrypted = await encrypt(sensitiveData, key);

  await this.ctx.storage.sql.exec(
    'INSERT INTO secure_data (user_id, encrypted_value) VALUES (?, ?)',
    userId, encrypted
  );
}
```

### PII Handling

```typescript
// Hash PII for comparison without storing plaintext
async hashPII(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Example: Email verification
async isEmailRegistered(email: string): Promise<boolean> {
  const emailHash = await this.hashPII(email.toLowerCase());

  const result = await this.ctx.storage.sql.exec(
    'SELECT 1 FROM users WHERE email_hash = ?',
    emailHash
  );

  return result.rows.length > 0;
}
```

### Data Minimization

```typescript
// Only store necessary data
interface UserProfile {
  id: string;
  username: string;
  createdAt: number;
  // ❌ Don't store: email, phone, full name (if not needed)
}

// Implement data retention
async cleanupOldData() {
  const cutoff = Date.now() - (90 * 86400_000); // 90 days

  await this.ctx.storage.sql.exec(
    'DELETE FROM activity_logs WHERE created_at < ?',
    cutoff
  );
}
```

---

## WebSocket Security

Secure WebSocket connections and messages.

### Authentication on WebSocket Upgrade

```typescript
async fetch(request: Request): Promise<Response> {
  if (request.headers.get('Upgrade') === 'websocket') {
    // Authenticate before upgrade
    const userId = await this.authenticate(request);

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [userId]); // Store userId in tags

    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  return new Response('Expected WebSocket', { status: 400 });
}
```

### Message Validation

```typescript
async webSocketMessage(ws: WebSocket, message: string) {
  let data: any;

  try {
    data = JSON.parse(message);
  } catch {
    ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  // Validate message schema
  const MessageSchema = z.object({
    type: z.enum(['chat', 'typing', 'reaction']),
    content: z.string().max(1000),
    metadata: z.record(z.any()).optional()
  });

  try {
    const validated = MessageSchema.parse(data);
    await this.processMessage(ws, validated);
  } catch (error) {
    ws.send(JSON.stringify({ error: 'Invalid message format' }));
  }
}
```

### WebSocket Rate Limiting

```typescript
export class SecureChatRoom extends DurableObject {
  private messageCounts: Map<WebSocket, number[]> = new Map();

  async webSocketMessage(ws: WebSocket, message: string) {
    // Rate limit: 10 messages per 10 seconds
    const now = Date.now();
    const counts = this.messageCounts.get(ws) || [];

    // Remove timestamps older than 10 seconds
    const recent = counts.filter(t => now - t < 10000);

    if (recent.length >= 10) {
      ws.send(JSON.stringify({ error: 'Rate limit exceeded' }));
      return;
    }

    recent.push(now);
    this.messageCounts.set(ws, recent);

    // Process message
    await this.handleMessage(ws, message);
  }
}
```

---

## Audit Logging

Track security-relevant events.

### Structured Audit Logs

```typescript
interface AuditLog {
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  ip?: string;
  metadata?: Record<string, any>;
}

async logAudit(log: AuditLog) {
  await this.ctx.storage.sql.exec(`
    INSERT INTO audit_logs (
      timestamp, user_id, action, resource, result, ip, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    log.timestamp,
    log.userId,
    log.action,
    log.resource,
    log.result,
    log.ip || null,
    JSON.stringify(log.metadata || {})
  );

  // Also log to console for real-time monitoring
  console.log(JSON.stringify({
    type: 'audit',
    ...log
  }));
}

// Usage
async deleteMessage(messageId: number, userId: string, ip: string) {
  try {
    await this.ctx.storage.sql.exec('DELETE FROM messages WHERE id = ?', messageId);

    await this.logAudit({
      timestamp: Date.now(),
      userId,
      action: 'delete_message',
      resource: `message:${messageId}`,
      result: 'success',
      ip
    });
  } catch (error) {
    await this.logAudit({
      timestamp: Date.now(),
      userId,
      action: 'delete_message',
      resource: `message:${messageId}`,
      result: 'failure',
      ip,
      metadata: { error: (error as Error).message }
    });

    throw error;
  }
}
```

---

## CORS Security

Properly configure CORS for API access.

### Secure CORS Configuration

```typescript
const ALLOWED_ORIGINS = [
  'https://myapp.com',
  'https://www.myapp.com'
];

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {};

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

async fetch(request: Request): Promise<Response> {
  const origin = request.headers.get('Origin');

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  // Process request
  const response = await this.handleRequest(request);

  // Add CORS headers to response
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
```

---

## Content Security

Prevent XSS and injection attacks.

### Content Security Policy

```typescript
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': CSP_HEADER,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}
```

---

## Security Checklist

- [ ] Input validation on all user data
- [ ] Parameterized SQL queries (no string concatenation)
- [ ] Authentication on all protected endpoints
- [ ] Authorization checks for resource access
- [ ] Rate limiting on public endpoints
- [ ] Encryption for sensitive data
- [ ] Audit logging for security events
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] WebSocket authentication
- [ ] Regular security audits
- [ ] Data retention policies
- [ ] Error messages don't leak sensitive info

---

## Sources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)
- [SQLite Security](https://www.sqlite.org/security.html)

---

**Last Updated**: 2025-12-27
**Maintainer**: Claude Skills Team

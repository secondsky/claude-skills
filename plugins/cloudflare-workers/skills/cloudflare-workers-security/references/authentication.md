# Authentication for Cloudflare Workers

Comprehensive guide to implementing authentication in Workers.

## Authentication Methods

| Method | Use Case | Pros | Cons |
|--------|----------|------|------|
| JWT | Stateless APIs | Scalable, no DB lookup | Token size, revocation |
| API Keys | Service-to-service | Simple, long-lived | Less secure for users |
| Session cookies | Web apps | Secure, revocable | Requires state |
| OAuth 2.0 | Third-party auth | Standard, delegated | Complex setup |
| mTLS | High security | Very secure | Complex certificates |

## JWT Authentication

### Create JWT

```typescript
interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

async function createJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

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

  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

### Verify JWT

```typescript
interface VerifyResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

async function verifyJWT(token: string, secret: string): Promise<VerifyResult> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
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
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode and validate payload
    const payload = JSON.parse(atob(base64UrlUnescape(payloadB64))) as JWTPayload;

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }

    // Check not-before
    if (payload.nbf && Date.now() / 1000 < payload.nbf) {
      return { valid: false, error: 'Token not yet valid' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = base64UrlUnescape(str);
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function base64UrlUnescape(str: string): string {
  return str.replace(/-/g, '+').replace(/_/g, '/');
}
```

### JWT with RS256 (Asymmetric)

```typescript
async function verifyRS256JWT(token: string, publicKeyPEM: string): Promise<VerifyResult> {
  const [headerB64, payloadB64, signatureB64] = token.split('.');

  // Import public key
  const keyData = pemToArrayBuffer(publicKeyPEM);
  const key = await crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Verify
  const signature = base64UrlDecode(signatureB64);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data);

  if (!valid) {
    return { valid: false, error: 'Invalid signature' };
  }

  const payload = JSON.parse(atob(base64UrlUnescape(payloadB64)));
  return { valid: true, payload };
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}
```

## API Key Authentication

### Secure API Key Generation

```typescript
async function generateApiKey(): Promise<{ key: string; hash: string }> {
  // Generate random key
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const key = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

  // Hash for storage
  const hash = await sha256(key);

  return {
    key: `sk_live_${key}`, // Prefix helps identify key type
    hash,
  };
}

async function sha256(str: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
```

### API Key Validation

```typescript
interface ApiKeyData {
  clientId: string;
  name: string;
  permissions: string[];
  createdAt: number;
}

async function validateApiKey(
  apiKey: string,
  kv: KVNamespace
): Promise<{ valid: boolean; client?: ApiKeyData }> {
  if (!apiKey || !apiKey.startsWith('sk_')) {
    return { valid: false };
  }

  // Hash the key for lookup
  const keyHash = await sha256(apiKey);

  // Lookup
  const client = await kv.get<ApiKeyData>(`apikey:${keyHash}`, 'json');
  if (!client) {
    return { valid: false };
  }

  return { valid: true, client };
}
```

### API Key Rate Limiting

```typescript
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

async function checkApiKeyRateLimit(
  clientId: string,
  kv: KVNamespace,
  limit = 1000,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  const key = `ratelimit:${clientId}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Get current count
  const data = await kv.get<{ count: number; resetAt: number }>(key, 'json');

  if (!data || data.resetAt < now) {
    // New window
    await kv.put(
      key,
      JSON.stringify({ count: 1, resetAt: now + windowSeconds * 1000 }),
      { expirationTtl: windowSeconds }
    );
    return { allowed: true, remaining: limit - 1, resetAt: now + windowSeconds * 1000 };
  }

  if (data.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: data.resetAt };
  }

  // Increment
  await kv.put(
    key,
    JSON.stringify({ count: data.count + 1, resetAt: data.resetAt }),
    { expirationTtl: windowSeconds }
  );

  return { allowed: true, remaining: limit - data.count - 1, resetAt: data.resetAt };
}
```

## Session Authentication

### Cookie-Based Sessions

```typescript
interface Session {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

async function createSession(
  userId: string,
  kv: KVNamespace,
  ttlSeconds = 86400
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const session: Session = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000,
  };

  await kv.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: ttlSeconds,
  });

  return sessionId;
}

function setSessionCookie(response: Response, sessionId: string): Response {
  const cookie = [
    `session=${sessionId}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=86400',
  ].join('; ');

  const newResponse = new Response(response.body, response);
  newResponse.headers.append('Set-Cookie', cookie);
  return newResponse;
}

async function getSession(
  request: Request,
  kv: KVNamespace
): Promise<Session | null> {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(/session=([^;]+)/);
  if (!match) return null;

  const sessionId = match[1];
  return kv.get<Session>(`session:${sessionId}`, 'json');
}

async function destroySession(sessionId: string, kv: KVNamespace): Promise<void> {
  await kv.delete(`session:${sessionId}`);
}
```

### CSRF Protection

```typescript
async function generateCSRFToken(sessionId: string, secret: string): Promise<string> {
  const data = `${sessionId}:${Date.now()}`;
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
    new TextEncoder().encode(data)
  );

  const sigHex = [...new Uint8Array(signature)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${btoa(data)}.${sigHex}`;
}

async function validateCSRFToken(
  token: string,
  sessionId: string,
  secret: string
): Promise<boolean> {
  try {
    const [dataB64, sigHex] = token.split('.');
    const data = atob(dataB64);
    const [tokenSessionId, timestamp] = data.split(':');

    // Verify session matches
    if (tokenSessionId !== sessionId) return false;

    // Check age (max 1 hour)
    if (Date.now() - parseInt(timestamp) > 3600000) return false;

    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(
      sigHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );

    return crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(data)
    );
  } catch {
    return false;
  }
}
```

## OAuth 2.0 / OIDC

### OAuth Authorization Flow

```typescript
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
}

function generateAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  return `${config.authorizationUrl}?${params}`;
}

async function exchangeCode(
  code: string,
  config: OAuthConfig
): Promise<{ accessToken: string; refreshToken?: string }> {
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error('Token exchange failed');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
```

### JWT ID Token Verification

```typescript
async function verifyIdToken(
  idToken: string,
  jwksUrl: string,
  expectedAudience: string
): Promise<{ valid: boolean; claims?: Record<string, unknown> }> {
  const [headerB64, payloadB64] = idToken.split('.');

  const header = JSON.parse(atob(base64UrlUnescape(headerB64)));
  const payload = JSON.parse(atob(base64UrlUnescape(payloadB64)));

  // Fetch JWKS
  const jwksResponse = await fetch(jwksUrl);
  const jwks = await jwksResponse.json();

  // Find key
  const key = jwks.keys.find((k: { kid: string }) => k.kid === header.kid);
  if (!key) {
    return { valid: false };
  }

  // Import key
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Verify signature
  const signature = base64UrlDecode(idToken.split('.')[2]);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signature,
    data
  );

  if (!valid) return { valid: false };

  // Verify claims
  if (payload.aud !== expectedAudience) return { valid: false };
  if (payload.exp && Date.now() / 1000 > payload.exp) return { valid: false };

  return { valid: true, claims: payload };
}
```

## Auth Middleware

```typescript
type AuthenticatedHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  user: User
) => Promise<Response>;

function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.slice(7);
    const result = await verifyJWT(token, env.JWT_SECRET);

    if (!result.valid) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = result.payload as User;
    return handler(request, env, ctx, user);
  };
}
```

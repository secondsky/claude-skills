# CORS Security for Cloudflare Workers

Complete guide to properly configuring Cross-Origin Resource Sharing.

## CORS Overview

CORS (Cross-Origin Resource Sharing) controls which websites can access your API from browsers.

### Same-Origin Policy

Without CORS, browsers block requests from different origins:
- `https://app.com` → `https://api.com` (blocked without CORS)
- `https://app.com` → `https://app.com/api` (allowed, same origin)

## Basic CORS Configuration

### Simple CORS Handler

```typescript
const ALLOWED_ORIGINS = [
  'https://app.example.com',
  'https://admin.example.com',
];

function handleCORS(request: Request): Response | null {
  const origin = request.headers.get('Origin');

  // Preflight request
  if (request.method === 'OPTIONS') {
    return handlePreflight(request, origin);
  }

  return null; // Continue to main handler
}

function handlePreflight(request: Request, origin: string | null): Response {
  const headers: Record<string, string> = {
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = request.headers.get('Access-Control-Request-Headers') || '';
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new Response(null, { status: 204, headers });
}

function addCORSHeaders(response: Response, origin: string | null): Response {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return response;
  }

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', origin);
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  newResponse.headers.set('Vary', 'Origin');

  return newResponse;
}
```

### Full CORS Middleware

```typescript
interface CORSOptions {
  origins: string[] | '*';
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
  exposeHeaders?: string[];
}

function createCORSMiddleware(options: CORSOptions) {
  const {
    origins,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
    credentials = false,
    maxAge = 86400,
    exposeHeaders = [],
  } = options;

  function isOriginAllowed(origin: string): boolean {
    if (origins === '*') return true;
    return origins.includes(origin);
  }

  return async function corsMiddleware(
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> {
    const origin = request.headers.get('Origin');

    // No origin = not a CORS request
    if (!origin) {
      return handler();
    }

    // Check origin
    if (!isOriginAllowed(origin)) {
      return new Response('Origin not allowed', { status: 403 });
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origins === '*' ? '*' : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
          'Access-Control-Max-Age': maxAge.toString(),
          ...(credentials && { 'Access-Control-Allow-Credentials': 'true' }),
        },
      });
    }

    // Handle actual request
    const response = await handler();
    const newResponse = new Response(response.body, response);

    newResponse.headers.set(
      'Access-Control-Allow-Origin',
      origins === '*' ? '*' : origin
    );

    if (credentials) {
      newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (exposeHeaders.length > 0) {
      newResponse.headers.set(
        'Access-Control-Expose-Headers',
        exposeHeaders.join(', ')
      );
    }

    // Important: Vary header for caching
    newResponse.headers.append('Vary', 'Origin');

    return newResponse;
  };
}
```

## Security Best Practices

### Never Use `*` with Credentials

```typescript
// ❌ WRONG: Will be blocked by browsers
headers.set('Access-Control-Allow-Origin', '*');
headers.set('Access-Control-Allow-Credentials', 'true');

// ✅ CORRECT: Specific origin with credentials
headers.set('Access-Control-Allow-Origin', 'https://app.example.com');
headers.set('Access-Control-Allow-Credentials', 'true');
```

### Validate Origin Against Allowlist

```typescript
// ❌ WRONG: Reflects any origin
const origin = request.headers.get('Origin');
headers.set('Access-Control-Allow-Origin', origin);

// ✅ CORRECT: Validate against allowlist
const ALLOWED = new Set(['https://app.example.com', 'https://admin.example.com']);
const origin = request.headers.get('Origin');
if (origin && ALLOWED.has(origin)) {
  headers.set('Access-Control-Allow-Origin', origin);
}
```

### Don't Trust Origin for Authentication

```typescript
// ❌ WRONG: Using origin for access control
if (request.headers.get('Origin') === 'https://admin.example.com') {
  // Allow admin access - INSECURE!
}

// ✅ CORRECT: Use proper authentication
const token = request.headers.get('Authorization');
const user = await verifyToken(token);
if (user.role === 'admin') {
  // Allow admin access
}
```

## Dynamic Origin Validation

### Subdomain Matching

```typescript
function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);

    // Allow exact matches
    const exactMatches = ['https://app.example.com', 'https://api.example.com'];
    if (exactMatches.includes(origin)) return true;

    // Allow subdomains of example.com
    if (url.hostname.endsWith('.example.com') && url.protocol === 'https:') {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
```

### Environment-Based Origins

```typescript
interface Env {
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string; // Comma-separated
}

function getAllowedOrigins(env: Env): string[] {
  // Development allows localhost
  if (env.ENVIRONMENT === 'development') {
    return [
      'http://localhost:3000',
      'http://localhost:8787',
      'http://127.0.0.1:3000',
    ];
  }

  // Production uses configured origins
  return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
}
```

## Preflight Caching

### Optimize Preflight Requests

```typescript
function handlePreflight(request: Request, origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      // Cache preflight for 24 hours
      'Access-Control-Max-Age': '86400',
      // Tell browsers this response varies by Origin
      'Vary': 'Origin, Access-Control-Request-Headers',
    },
  });
}
```

## Common CORS Issues

### Issue: Preflight Fails

**Symptom**: OPTIONS request returns error

**Solution**: Handle OPTIONS separately

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Always handle OPTIONS first
    if (request.method === 'OPTIONS') {
      return handlePreflight(request);
    }

    // Then handle actual request
    const response = await handleRequest(request, env);
    return addCORSHeaders(response, request.headers.get('Origin'));
  }
};
```

### Issue: Credentials Not Sent

**Symptom**: Cookies/auth headers not included

**Solution**: Set credentials on both client and server

```typescript
// Client
fetch('https://api.example.com/data', {
  credentials: 'include', // Required for cookies
});

// Server
headers.set('Access-Control-Allow-Credentials', 'true');
headers.set('Access-Control-Allow-Origin', 'https://app.example.com'); // Not *
```

### Issue: Custom Headers Blocked

**Symptom**: Custom headers not accessible in response

**Solution**: Expose headers explicitly

```typescript
headers.set('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Remaining');
```

### Issue: Cache Varies by Origin

**Symptom**: Wrong CORS headers served from cache

**Solution**: Include Vary header

```typescript
response.headers.set('Vary', 'Origin');
```

## CORS with Hono

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Global CORS
app.use('*', cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// Or dynamic origin
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null;
    if (origin.endsWith('.example.com')) return origin;
    return null;
  },
}));
```

## Testing CORS

### Manual Testing

```bash
# Test preflight
curl -X OPTIONS \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v https://api.example.com/endpoint

# Test actual request
curl -X POST \
  -H "Origin: https://app.example.com" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -v https://api.example.com/endpoint
```

### Automated Testing

```typescript
describe('CORS', () => {
  it('allows configured origins', async () => {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://app.example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(response.headers.get('Access-Control-Allow-Origin'))
      .toBe('https://app.example.com');
  });

  it('rejects unknown origins', async () => {
    const response = await fetch(url, {
      headers: { 'Origin': 'https://evil.com' },
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
```

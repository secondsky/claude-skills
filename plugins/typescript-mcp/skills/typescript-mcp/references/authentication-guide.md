# Authentication Guide for MCP Servers

Complete guide to implementing authentication in TypeScript MCP servers on Cloudflare Workers.

---

## Why Authentication Matters

**Without authentication:**
- ❌ Anyone can access your tools
- ❌ API abuse and DDoS attacks
- ❌ Data leaks and security breaches
- ❌ Unexpected Cloudflare costs

**With authentication:**
- ✅ Controlled access
- ✅ Usage tracking
- ✅ Rate limiting per user
- ✅ Audit trails

---

## Method 1: API Key Authentication (Recommended)

Best for: Most use cases, simple setup, good security.

### Setup

**1. Create KV namespace:**
```bash
wrangler kv namespace create MCP_API_KEYS
```

**2. Add to wrangler.jsonc:**
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "MCP_API_KEYS",
      "id": "YOUR_NAMESPACE_ID"
    }
  ]
}
```

**3. Generate API keys:**
```bash
# Generate secure key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to KV
wrangler kv key put --binding=MCP_API_KEYS "key:abc123xyz..." "true"
```

### Implementation

```typescript
import { Hono } from 'hono';

type Env = {
  MCP_API_KEYS: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

// Authentication middleware
app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const apiKey = authHeader.replace('Bearer ', '');
  const isValid = await c.env.MCP_API_KEYS.get(`key:${apiKey}`);

  if (!isValid) {
    return c.json({ error: 'Invalid API key' }, 403);
  }

  // Optional: Track usage
  const usageKey = `usage:${apiKey}:${new Date().toISOString().split('T')[0]}`;
  const count = await c.env.MCP_API_KEYS.get(usageKey);
  await c.env.MCP_API_KEYS.put(
    usageKey,
    String(parseInt(count || '0') + 1),
    { expirationTtl: 86400 * 7 }
  );

  await next();
});

app.post('/mcp', async (c) => {
  // MCP handler (user is authenticated)
});

export default app;
```

### Key Management

```bash
# List all keys
wrangler kv key list --binding=MCP_API_KEYS --prefix="key:"

# Add new key
wrangler kv key put --binding=MCP_API_KEYS "key:newkey123" "true"

# Revoke key
wrangler kv key delete --binding=MCP_API_KEYS "key:oldkey456"

# Check usage
wrangler kv key get --binding=MCP_API_KEYS "usage:abc123:2025-10-28"
```

### Client Usage

```bash
curl -X POST https://mcp.example.com/mcp \
  -H "Authorization: Bearer abc123xyz..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

---

## Method 2: Cloudflare Zero Trust Access

Best for: Enterprise deployments, SSO integration, team access.

### Setup

**1. Configure Cloudflare Access:**
- Go to Zero Trust dashboard
- Create Access Application
- Set application domain (e.g., `mcp.example.com`)
- Configure identity providers (Google, GitHub, SAML)
- Set access policies (email domains, groups)

**2. Install JWT verification:**
```bash
npm install @tsndr/cloudflare-worker-jwt
```

**3. Implementation:**
```typescript
import { verify } from '@tsndr/cloudflare-worker-jwt';

type Env = {
  CF_ACCESS_TEAM_DOMAIN: string; // e.g., "yourteam.cloudflareaccess.com"
};

app.use('/mcp', async (c, next) => {
  const jwt = c.req.header('Cf-Access-Jwt-Assertion');

  if (!jwt) {
    return c.json({ error: 'Access denied' }, 403);
  }

  try {
    // Verify JWT
    const isValid = await verify(
      jwt,
      `https://${c.env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`
    );

    if (!isValid) {
      return c.json({ error: 'Invalid token' }, 403);
    }

    // Decode to get user info
    const payload = JSON.parse(atob(jwt.split('.')[1]));

    // Optional: Add user to request context
    c.set('user', payload);

    await next();
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 403);
  }
});
```

### Benefits

- ✅ SSO with Google, GitHub, Okta, etc.
- ✅ Team-based access control
- ✅ Automatic user management
- ✅ Audit logs in Zero Trust dashboard

---

## Method 3: OAuth 2.0

Best for: Public APIs, third-party integrations, user consent flows.

### Setup

**1. Choose OAuth provider:**
- Auth0
- Clerk
- Supabase
- Custom OAuth server

**2. Install dependencies:**
```bash
npm install oauth4webapi
```

**3. Implementation:**
```typescript
import * as oauth from 'oauth4webapi';

type Env = {
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  OAUTH_ISSUER: string; // e.g., "https://yourdomain.auth0.com"
};

app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const accessToken = authHeader.replace('Bearer ', '');

  try {
    // Validate token with OAuth provider
    const issuer = new URL(c.env.OAUTH_ISSUER);
    const client = {
      client_id: c.env.OAUTH_CLIENT_ID,
      client_secret: c.env.OAUTH_CLIENT_SECRET
    };

    const response = await oauth.introspectionRequest(
      issuer,
      client,
      accessToken
    );

    const result = await oauth.processIntrospectionResponse(issuer, client, response);

    if (!result.active) {
      return c.json({ error: 'Invalid token' }, 403);
    }

    // Token is valid, user info in result
    c.set('user', result);

    await next();
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 403);
  }
});
```

---

## Method 4: JWT (Custom)

Best for: Microservices, existing JWT infrastructure.

### Implementation

```typescript
import { verify, sign } from '@tsndr/cloudflare-worker-jwt';

type Env = {
  JWT_SECRET: string;
};

app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const isValid = await verify(token, c.env.JWT_SECRET);

    if (!isValid) {
      return c.json({ error: 'Invalid token' }, 403);
    }

    // Decode payload
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return c.json({ error: 'Token expired' }, 403);
    }

    c.set('user', payload);

    await next();
  } catch (error) {
    return c.json({ error: 'Authentication failed' }, 403);
  }
});

// Generate JWT endpoint (for testing)
app.post('/auth/token', async (c) => {
  const { username, password } = await c.req.json();

  // Validate credentials (implement your logic)
  if (username === 'admin' && password === 'secret') {
    const token = await sign({
      sub: username,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    }, c.env.JWT_SECRET);

    return c.json({ token });
  }

  return c.json({ error: 'Invalid credentials' }, 401);
});
```

---

## Method 5: mTLS (Mutual TLS)

Best for: High-security environments, machine-to-machine communication.

**Note:** Cloudflare Workers support mTLS for enterprise customers.

### Setup

**1. Enable mTLS in Cloudflare dashboard:**
- Go to SSL/TLS → Client Certificates
- Create client certificate
- Download certificate and private key
- Configure API Shield mTLS

**2. Implementation:**
```typescript
app.use('/mcp', async (c, next) => {
  const clientCert = c.req.header('Cf-Client-Cert-Der-Base64');

  if (!clientCert) {
    return c.json({ error: 'Client certificate required' }, 401);
  }

  // Cloudflare validates certificate automatically
  // You can add additional validation here

  await next();
});
```

---

## Combined Authentication

Use multiple methods for flexibility:

```typescript
app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Try API Key
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');

    // Check if it's an API key
    const isApiKey = await c.env.MCP_API_KEYS.get(`key:${token}`);
    if (isApiKey) {
      return next();
    }

    // Check if it's a JWT
    try {
      const isValid = await verify(token, c.env.JWT_SECRET);
      if (isValid) {
        return next();
      }
    } catch {}
  }

  return c.json({ error: 'Invalid credentials' }, 403);
});
```

---

## Security Best Practices

### Do's ✅

- ✅ Use HTTPS only (enforced by Cloudflare)
- ✅ Generate strong API keys (32+ bytes)
- ✅ Implement rate limiting per key
- ✅ Track usage per key
- ✅ Rotate keys regularly
- ✅ Store secrets in Wrangler secrets
- ✅ Log authentication failures
- ✅ Set token expiration
- ✅ Validate all inputs
- ✅ Use environment-specific keys

### Don'ts ❌

- ❌ Never hardcode API keys
- ❌ Don't log auth tokens
- ❌ Avoid weak tokens (< 16 bytes)
- ❌ Don't expose auth endpoints publicly
- ❌ Never return detailed auth errors to clients
- ❌ Don't skip CORS validation
- ❌ Avoid storing tokens in localStorage (use httpOnly cookies)

---

## Testing Authentication

### Local Testing

```bash
# Start dev server
wrangler dev

# Test with curl
curl -X POST http://localhost:8787/mcp \
  -H "Authorization: Bearer YOUR_TEST_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Production Testing

```bash
# Test authentication failure
curl -X POST https://mcp.example.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
# Expected: 401 Unauthorized

# Test with valid key
curl -X POST https://mcp.example.com/mcp \
  -H "Authorization: Bearer VALID_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
# Expected: 200 OK + tool list
```

---

## Migration Guide

### Moving from No Auth → API Key Auth

**1. Deploy with optional auth:**
```typescript
app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader) {
    // Validate if provided
    const apiKey = authHeader.replace('Bearer ', '');
    const isValid = await c.env.MCP_API_KEYS.get(`key:${apiKey}`);

    if (!isValid) {
      return c.json({ error: 'Invalid API key' }, 403);
    }
  }
  // Continue even without auth (for migration period)
  await next();
});
```

**2. Notify clients to add auth**

**3. Make auth required after transition:**
```typescript
app.use('/mcp', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // ... validate
});
```

---

**Last Updated:** 2025-10-28
**Verified With:** Cloudflare Workers, @modelcontextprotocol/sdk@1.20.2

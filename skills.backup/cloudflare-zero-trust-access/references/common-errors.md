# Common Errors with Cloudflare Zero Trust Access

This document catalogs the 8 most common errors when integrating Cloudflare Access with Workers applications, their causes, solutions, and prevention strategies.

---

## Error #1: Missing JWT Header

### Symptom
Worker receives request without `CF-Access-JWT-Assertion` header, causing authentication to fail.

### Error Message
```
Missing JWT
CF-Access-JWT-Assertion header not found
```

### Cause
Request is not going through Cloudflare Access. This happens when:
- Accessing Worker directly via `*.workers.dev` URL
- DNS not configured to route through Access
- Access policy not applied to the domain
- Local development without proper setup

### Solution

**For Production**:
1. Ensure requests go through your Access-protected domain, NOT directly to `*.workers.dev`
2. Configure Access policy for your custom domain
3. Verify DNS points to your Worker with Access enabled

**For Local Development**:
```typescript
// Mock JWT for local development
if (env.ENVIRONMENT === 'development') {
  const mockJWT = 'eyJ...' // Base64 encoded mock JWT
  request.headers.set('CF-Access-JWT-Assertion', mockJWT)
}
```

### Prevention
- Always test with Access URL: `https://your-team.cloudflareaccess.com/...`
- Use environment variables to differentiate dev/prod
- Add helpful error messages that explain the issue:

```typescript
if (!jwtToken) {
  return c.json({
    error: 'Missing JWT',
    message: 'This endpoint must be accessed through Cloudflare Access.',
    hint: 'Use https://your-team.cloudflareaccess.com/... instead of direct URL'
  }, 401)
}
```

### Source
- Cloudflare Access documentation
- Common developer mistake

### Time Saved
~30 minutes

---

## Error #2: Invalid Team Name

### Symptom
JWT validation fails with "Invalid issuer" error.

### Error Message
```
Invalid issuer. Expected https://correct-team.cloudflareaccess.com, got https://wrong-team.cloudflareaccess.com
```

### Cause
Hardcoded or incorrect team name in code. Common scenarios:
- Copy-pasted example code with placeholder team name
- Team name changed in dashboard but not updated in code
- Wrong team name for dev/staging/production environment

### Solution

**Always use environment variables**:

```typescript
// ❌ Wrong - hardcoded
cloudflareAccess({ domain: 'my-team.cloudflareaccess.com' })

// ✅ Correct - from environment
cloudflareAccess({ domain: (c) => c.env.ACCESS_TEAM_DOMAIN })
```

**wrangler.jsonc**:
```json
{
  "vars": {
    "ACCESS_TEAM_DOMAIN": "your-actual-team.cloudflareaccess.com"
  },
  "env": {
    "dev": {
      "vars": {
        "ACCESS_TEAM_DOMAIN": "dev-team.cloudflareaccess.com"
      }
    },
    "production": {
      "vars": {
        "ACCESS_TEAM_DOMAIN": "prod-team.cloudflareaccess.com"
      }
    }
  }
}
```

### Finding Your Team Name
1. Go to https://one.dash.cloudflare.com/
2. Navigate to Zero Trust > Settings > Custom Pages
3. Your team domain is shown at the top (e.g., "your-team.cloudflareaccess.com")

### Prevention
- Never hardcode team names
- Use environment variables for all configuration
- Separate configs for dev/staging/production
- Add validation in code:

```typescript
if (!env.ACCESS_TEAM_DOMAIN) {
  throw new Error('ACCESS_TEAM_DOMAIN environment variable not set')
}
```

### Source
- @hono/cloudflare-access GitHub issues
- Common configuration error

### Time Saved
~15 minutes

---

## Error #3: Token Expiration Handling

### Symptom
Authenticated users suddenly receive 401 errors after being logged in for a period of time.

### Error Message
```
JWT expired
Token is no longer valid
```

### Cause
JWT expired (default expiration is 1 hour). The token has a timestamp-based expiration (`exp` claim) that is validated on every request.

### Solution

**Backend - Proper Error Response**:
```typescript
try {
  const payload = await validateAccessJWT(token, env)
} catch (error) {
  if (error.message.includes('expired')) {
    return c.json({
      error: 'Session expired',
      message: 'Please re-authenticate',
      code: 'TOKEN_EXPIRED'
    }, 401)
  }
}
```

**Frontend - Handle Expiration**:
```javascript
async function callAPI() {
  const response = await fetch('/api/data', {
    credentials: 'include'
  })

  if (response.status === 401) {
    const error = await response.json()
    if (error.code === 'TOKEN_EXPIRED') {
      // Redirect to Access login
      window.location.href = 'https://your-team.cloudflareaccess.com/...'
    }
  }
}
```

### Checking Token Expiration
```typescript
function isJWTExpired(payload: AccessJWTPayload): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return payload.exp < nowSeconds
}
```

### Prevention
- Always validate `exp` claim
- Return clear error messages with expiration info
- Frontend should handle 401 with re-authentication flow
- Consider showing "session expires in X minutes" warning

### Source
- Cloudflare JWT documentation
- Standard JWT best practice

### Time Saved
~10 minutes

---

## Error #4: Key Cache Race Condition

### Symptom
First request to a newly deployed Worker fails JWT validation. Subsequent requests work fine.

### Error Message
```
Public key not found for kid: abc123
Failed to verify JWT signature
```

### Cause
Public keys not cached on first request. When Worker boots, it needs to fetch public keys from Access, which takes time. The first request may fail if it arrives before keys are fetched.

### Solution

**Using @hono/cloudflare-access** (handles automatically):
The middleware caches keys with 1-hour TTL automatically. No action needed.

**Manual Implementation** (if not using middleware):
```typescript
const keyCache = new Map<string, CryptoKey>()
let lastKeyFetch = 0
const KEY_CACHE_TTL = 3600000 // 1 hour

async function getPublicKey(kid: string, env: Env): Promise<CryptoKey> {
  const now = Date.now()

  // Check cache
  let key = keyCache.get(kid)
  if (key && (now - lastKeyFetch < KEY_CACHE_TTL)) {
    return key
  }

  // Refresh cache
  const certs = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`)
  const { keys } = await certs.json()

  // Cache all keys
  for (const jwk of keys) {
    const cryptoKey = await importPublicKey(jwk)
    keyCache.set(jwk.kid, cryptoKey)
  }

  lastKeyFetch = now

  key = keyCache.get(kid)
  if (!key) {
    throw new Error(`Public key not found for kid: ${kid}`)
  }

  return key
}
```

### Prevention
- Use @hono/cloudflare-access middleware (handles caching)
- If manual implementation, cache keys with proper TTL
- For Durable Objects: Store keys in durable storage
- For high-traffic: Pre-warm cache on Worker startup

### Source
- GitHub issues on manual JWT validation
- Performance optimization pattern

### Time Saved
~20 minutes

---

## Error #5: CORS Preflight Issues

### Symptom
- Browser shows CORS error in console
- OPTIONS preflight requests fail with 401
- Actual requests never sent

### Error Message
```
Access to fetch at 'https://api.example.com/api/data' from origin 'https://app.example.com'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
It does not have HTTP ok status.
```

### Cause
**CRITICAL**: Access middleware runs BEFORE CORS middleware, blocking OPTIONS preflight requests.

OPTIONS requests don't include authentication headers (by design), so Access rejects them.

### Solution

**ALWAYS put CORS middleware FIRST**:

```typescript
// ✅ CORRECT ORDER
app.use('*', cors({
  origin: 'https://app.example.com',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use('/api/*', cloudflareAccess({
  domain: (c) => c.env.ACCESS_TEAM_DOMAIN
}))

// ❌ WRONG ORDER - WILL FAIL!
app.use('/api/*', cloudflareAccess({
  domain: (c) => c.env.ACCESS_TEAM_DOMAIN
}))
app.use('*', cors()) // Too late! Access already blocked OPTIONS
```

### Testing CORS
```bash
# Test OPTIONS preflight
curl -X OPTIONS \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  https://api.example.com/api/data

# Should return 200, NOT 401
```

### Frontend Configuration
```javascript
// ALWAYS include credentials for Access cookies
fetch('https://api.example.com/api/data', {
  credentials: 'include', // ← Critical!
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### Prevention
- **Rule #1**: CORS middleware MUST come before Access middleware
- Document middleware ordering in code comments
- Test OPTIONS requests in your test suite
- Use `credentials: true` in CORS config when using Access

### Source
- Hono + Access integration issues
- CORS specification

### Time Saved
~45 minutes (very common gotcha!)

---

## Error #6: Service Token Not Working

### Symptom
Requests using service token credentials return 401 Unauthorized.

### Error Message
```
Authentication failed
Invalid credentials
```

### Cause

**Common mistakes**:
1. **Wrong header names**:
   - Using `Authorization` instead of `CF-Access-Client-Id`
   - Typo in header names

2. **Service token not added to Access policy**:
   - Token created but not included in application policy

3. **Token expired or revoked**:
   - Token was deleted or expired

### Solution

**Correct Headers**:
```bash
# ✅ Correct
curl -H "CF-Access-Client-Id: abc123.access" \
     -H "CF-Access-Client-Secret: secret-value" \
     https://api.example.com/api/data

# ❌ Wrong
curl -H "Authorization: Bearer abc123.access" \  # Wrong header
     https://api.example.com/api/data
```

**Code Example**:
```typescript
const response = await fetch('https://api.example.com/api/data', {
  headers: {
    'CF-Access-Client-Id': env.SERVICE_TOKEN_ID,
    'CF-Access-Client-Secret': env.SERVICE_TOKEN_SECRET,
  }
})
```

**Adding Service Token to Policy**:
1. Go to Zero Trust Dashboard
2. Navigate to Access > Applications
3. Click on your application
4. Edit policy
5. Under "Include" rules, add "Service Auth"
6. Select your service token from the list
7. Save

### Debugging
```typescript
// Log headers (remove in production!)
console.log('Headers:', {
  clientId: request.headers.get('CF-Access-Client-Id'),
  clientSecret: request.headers.get('CF-Access-Client-Secret') ? '***' : 'missing'
})
```

### Prevention
- Use template with correct header names
- Document service token setup in README
- Verify token is added to Access policy
- Store tokens securely (Wrangler secrets, not git)
- Test service token requests separately

### Source
- Cloudflare service token documentation
- Support forums

### Time Saved
~10 minutes

---

## Error #7: Multiple Policies Conflict

### Symptom
- Unexpected authentication behavior
- Users can't access routes they should have access to
- Some routes work, others don't (inconsistent)

### Error Message
```
Access denied
User does not meet policy requirements
```

### Cause
Multiple Access applications covering the same domain path, creating conflicts.

**Example Conflict**:
- Policy A: `*.example.com` requires email ending in `@company.com`
- Policy B: `api.example.com` requires group `developers`
- **Result**: Which policy applies to `api.example.com`?

### Solution

**Option 1: Use Most Specific Path**
Access applies the most specific path first:
- `api.example.com/admin` (most specific)
- `api.example.com/*` (mid-level)
- `*.example.com` (least specific)

**Option 2: Single Policy with Multiple Rules**
Instead of multiple applications, use one application with multiple rules:

```
Application: api.example.com
Rules:
  - Include: Emails ending in @company.com
  - Require: Group 'developers' (for /admin routes only)
```

**Option 3: Separate Domains**
- Admin: `admin.example.com`
- API: `api.example.com`
- Public: `www.example.com`

### Debugging Conflicts
1. List all Access applications
2. Check for overlapping paths
3. Review policy order and specificity
4. Test each route individually

### Prevention
- Plan Access application hierarchy before implementing
- Avoid overlapping applications
- Document which policies apply to which routes
- Use path-specific rules within single application when possible

### Source
- Cloudflare Access best practices
- Policy configuration guide

### Time Saved
~30 minutes

---

## Error #8: Dev/Prod Team Mismatch

### Symptom
- Code works in development but fails in production (or vice versa)
- JWT validation fails after deployment
- "Invalid issuer" errors in one environment but not another

### Error Message
```
Invalid issuer. Expected https://prod-team.cloudflareaccess.com, got https://dev-team.cloudflareaccess.com
```

### Cause
Hardcoded team name instead of environment variable. Developer uses their dev team name in code, which fails when deployed to production with different team.

### Solution

**Environment-Specific Configuration**:

**wrangler.jsonc**:
```jsonc
{
  "name": "my-worker",
  "vars": {
    // Default (development)
    "ACCESS_TEAM_DOMAIN": "dev-team.cloudflareaccess.com",
    "ACCESS_AUD": "dev-aud-tag"
  },
  "env": {
    "staging": {
      "vars": {
        "ACCESS_TEAM_DOMAIN": "staging-team.cloudflareaccess.com",
        "ACCESS_AUD": "staging-aud-tag"
      }
    },
    "production": {
      "vars": {
        "ACCESS_TEAM_DOMAIN": "prod-team.cloudflareaccess.com",
        "ACCESS_AUD": "prod-aud-tag"
      }
    }
  }
}
```

**Code** (always use env vars):
```typescript
// ❌ Wrong - hardcoded
const teamDomain = 'dev-team.cloudflareaccess.com'

// ✅ Correct - from environment
const teamDomain = env.ACCESS_TEAM_DOMAIN
```

**Deployment**:
```bash
# Deploy to dev (uses default vars)
npx wrangler deploy

# Deploy to staging
npx wrangler deploy --env staging

# Deploy to production
npx wrangler deploy --env production
```

### Prevention
- Never hardcode team names or AUD tags
- Use Wrangler environments for dev/staging/prod
- Add validation to ensure env vars are set
- Document environment setup in README

```typescript
// Validate environment on startup
if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
  throw new Error('ACCESS_TEAM_DOMAIN and ACCESS_AUD must be set')
}
```

### Source
- General best practice
- Environment configuration pattern

### Time Saved
~15 minutes

---

## Quick Reference Summary

| Error | Time Saved | Prevention |
|-------|-----------|------------|
| #1: Missing JWT Header | 30 min | Test with Access URL, add helpful errors |
| #2: Invalid Team Name | 15 min | Use environment variables |
| #3: Token Expiration | 10 min | Validate exp claim, handle gracefully |
| #4: Key Cache Race | 20 min | Use @hono/cloudflare-access or cache properly |
| #5: CORS Preflight | 45 min | **CORS before Access** in middleware order |
| #6: Service Token Issues | 10 min | Correct header names, add to policy |
| #7: Multiple Policies | 30 min | Plan hierarchy, avoid overlaps |
| #8: Dev/Prod Mismatch | 15 min | Environment-specific configs |

**Total Time Saved**: ~2.5 hours per implementation

---

## Additional Resources

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/)
- [JWT Validation Guide](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)
- [Service Tokens](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)
- [@hono/cloudflare-access](https://github.com/honojs/middleware/tree/main/packages/cloudflare-access)

---

**Last Updated**: 2025-10-28
**Errors Documented**: 8
**Sources Verified**: ✅

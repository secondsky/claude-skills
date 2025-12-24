# Cloudflare Zero Trust Access - Use Cases

Detailed implementation guides for common Access authentication scenarios.

---

## Use Case 1: Admin Dashboard Protection

**Requirements**: Protect admin routes with email authentication

**Template**: `templates/hono-basic-setup.ts`

**Access Policy**: Emails ending in `@company.com`

**Implementation**:
```typescript
import { Hono } from 'hono'
import { cloudflareAccess } from '@hono/cloudflare-access'

const app = new Hono<{ Bindings: Env }>()

// Public routes
app.get('/', (c) => c.text('Welcome'))

// Protected admin routes
app.use('/admin/*', cloudflareAccess({
  domain: (c) => c.env.ACCESS_TEAM_DOMAIN
}))

app.get('/admin/dashboard', (c) => {
  const { email, groups } = c.get('accessPayload')
  return c.json({ email, groups })
})

export default app
```

---

## Use Case 2: API Authentication

**Requirements**: Protect API endpoints, allow public pages

**Template**: `templates/hono-basic-setup.ts` + separate routes

**Access Policy**: Service tokens + employee emails

**Implementation**:
```typescript
// Public routes - no auth
app.get('/health', (c) => c.json({ status: 'ok' }))
app.get('/docs', (c) => c.redirect('/api/docs'))

// Protected API routes
app.use('/api/*', cloudflareAccess({
  domain: (c) => c.env.ACCESS_TEAM_DOMAIN
}))

// Both users and service tokens can access
app.get('/api/data', async (c) => {
  const payload = c.get('accessPayload')
  const isServiceToken = !payload.email && payload.common_name

  // Log access
  console.log(`API accessed by: ${payload.email || payload.common_name}`)

  return c.json({ data: await fetchData(c.env.DB) })
})
```

---

## Use Case 3: SPA + Protected API

**Requirements**: React/Vue/Angular app calling authenticated API

**Template**: `templates/cors-access.ts`

**Critical**: CORS middleware MUST come BEFORE Access middleware!

**Backend (Worker)**:
```typescript
import { cors } from 'hono/cors'
import { cloudflareAccess } from '@hono/cloudflare-access'

const app = new Hono<{ Bindings: Env }>()

// ✅ CORS first - handles OPTIONS preflight
app.use('*', cors({
  origin: 'https://app.example.com',
  credentials: true, // Required for cookies
}))

// Access second - validates JWT from cookie
app.use('/api/*', cloudflareAccess({
  domain: (c) => c.env.ACCESS_TEAM_DOMAIN
}))

app.post('/api/data', async (c) => {
  const payload = c.get('accessPayload')
  const body = await c.req.json()
  return c.json({ received: body, user: payload.email })
})
```

**Frontend (React example)**:
```typescript
// Using fetch
const response = await fetch('https://api.example.com/api/data', {
  method: 'POST',
  credentials: 'include', // ← CRITICAL for cookies!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'save' }),
})

// Using axios
import axios from 'axios'
const api = axios.create({
  baseURL: 'https://api.example.com',
  withCredentials: true, // ← CRITICAL for cookies!
})
const { data } = await api.post('/api/data', { action: 'save' })
```

**Troubleshooting**:
- 401 on OPTIONS → CORS middleware not before Access
- 403 on request → Missing `credentials: 'include'`
- CORS error → Check `origin` matches frontend exactly

---

## Use Case 4: CI/CD Pipeline Integration

**Requirements**: GitHub Actions calling Worker API

**Template**: `templates/service-token-auth.ts`

**Setup**:
1. Create Service Token in Zero Trust Dashboard
2. Add to Access Policy for your application
3. Store in GitHub Secrets

**GitHub Actions Workflow**:
```yaml
name: Deploy and Verify
on: push

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Worker
        run: npx wrangler deploy

      - name: Verify API
        run: |
          curl -X POST https://api.example.com/api/verify \
            -H "CF-Access-Client-Id: ${{ secrets.CF_ACCESS_CLIENT_ID }}" \
            -H "CF-Access-Client-Secret: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"check": "deployment"}'
```

**Worker Side**:
```typescript
app.post('/api/verify', async (c) => {
  const payload = c.get('accessPayload')

  // Verify it's a service token (not user)
  if (payload.email) {
    return c.json({ error: 'User tokens not allowed here' }, 403)
  }

  // Service token identified by common_name
  console.log(`Verification by: ${payload.common_name}`)

  return c.json({ verified: true, timestamp: Date.now() })
})
```

---

## Use Case 5: Multi-Tenant SaaS

**Requirements**: Different Access configurations per organization

**Template**: `templates/multi-tenant.ts`

**Architecture**:
- Tenant config in D1 database
- Dynamic middleware per request
- Tenant ID from subdomain, path, or header

**Database Schema (D1)**:
```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  access_team_domain TEXT NOT NULL,
  access_aud TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
```

**Implementation**:
```typescript
interface TenantConfig {
  id: string
  name: string
  access_team_domain: string
  access_aud: string
}

// Extract tenant from subdomain (tenant1.app.example.com)
function getTenantId(url: string): string | null {
  const hostname = new URL(url).hostname
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0] // tenant1
  }
  return null
}

// Fetch tenant config from D1
async function getTenantConfig(
  tenantId: string,
  db: D1Database
): Promise<TenantConfig | null> {
  const result = await db
    .prepare('SELECT * FROM tenants WHERE id = ?')
    .bind(tenantId)
    .first<TenantConfig>()
  return result
}

// Dynamic middleware
app.use('/app/*', async (c, next) => {
  const tenantId = getTenantId(c.req.url)

  if (!tenantId) {
    return c.json({ error: 'Invalid tenant' }, 400)
  }

  const tenant = await getTenantConfig(tenantId, c.env.DB)

  if (!tenant) {
    return c.json({ error: 'Tenant not found' }, 404)
  }

  // Store tenant in context for later use
  c.set('tenant', tenant)

  // Apply tenant-specific Access validation
  return cloudflareAccess({
    domain: tenant.access_team_domain
  })(c, next)
})

// Use tenant in routes
app.get('/app/dashboard', (c) => {
  const tenant = c.get('tenant')
  const user = c.get('accessPayload')

  return c.json({
    tenant: tenant.name,
    user: user.email,
    message: `Welcome to ${tenant.name}!`
  })
})
```

**Alternative: Path-based Tenancy**:
```typescript
// tenant1.example.com/app → subdomain
// example.com/t/tenant1/app → path

app.use('/t/:tenantId/*', async (c, next) => {
  const tenantId = c.req.param('tenantId')
  // ... same logic
})
```

---

## Use Case 6: Geographic Restrictions

**Requirements**: Restrict access by country/region

**Access Policy Configuration**:
1. Go to Zero Trust → Access → Applications
2. Edit application → Add policy rule
3. Add "Country" selector with allowed countries

**Worker Validation** (optional additional check):
```typescript
app.get('/api/data', (c) => {
  const payload = c.get('accessPayload')
  const country = c.req.header('CF-IPCountry')

  // Log access location
  console.log(`Access from ${country} by ${payload.email}`)

  // Optional: Additional country validation
  const allowedCountries = ['US', 'CA', 'GB', 'DE']
  if (!allowedCountries.includes(country || '')) {
    return c.json({ error: 'Region not allowed' }, 403)
  }

  return c.json({ data: 'sensitive' })
})
```

---

## Use Case Summary Table

| Use Case | Template | Key Configuration |
|----------|----------|-------------------|
| Admin Dashboard | `hono-basic-setup.ts` | Email domain policy |
| API Auth | `hono-basic-setup.ts` | Mixed user/service policy |
| SPA + API | `cors-access.ts` | CORS before Access! |
| CI/CD | `service-token-auth.ts` | Service token in secrets |
| Multi-Tenant | `multi-tenant.ts` | D1 tenant config |
| Geo Restrict | Policy config | Country selector in policy |

---

## References

- [Access Application Setup](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Access Policies](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Service Tokens](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)

/**
 * Cloudflare Zero Trust Access - Multi-Tenant Pattern
 *
 * This template shows how to implement multi-tenant authentication where
 * different organizations/tenants have different Access configurations.
 *
 * Use cases:
 * - SaaS application with organization-level authentication
 * - Multiple customers with separate Access policies
 * - White-label applications with customer-specific auth
 *
 * Architecture:
 * - Each tenant has their own Access team/domain
 * - Tenant configuration stored in D1 or KV
 * - Dynamic middleware based on tenant ID
 *
 * Prerequisites:
 * - Multiple Access teams configured (one per tenant)
 * - Tenant configuration storage (D1, KV, or R2)
 * - Tenant identification strategy (subdomain, path, header)
 *
 * Install:
 * npm install hono @hono/cloudflare-access
 */

import { Hono } from 'hono'
import { cloudflareAccess } from '@hono/cloudflare-access'

type Env = {
	// Database binding for tenant configuration
	DB: D1Database
	// Fallback Access domain
	DEFAULT_ACCESS_TEAM_DOMAIN: string
}

interface TenantConfig {
	tenant_id: string
	tenant_name: string
	access_team_domain: string // e.g., "tenant1.cloudflareaccess.com"
	access_aud: string // Application Audience tag
	created_at: string
	is_active: boolean
}

const app = new Hono<{ Bindings: Env }>()

// ============================================================================
// TENANT IDENTIFICATION STRATEGIES
// ============================================================================

/**
 * Strategy 1: Subdomain-based
 * Examples:
 * - tenant1.example.com
 * - tenant2.example.com
 */
function getTenantFromSubdomain(hostname: string): string | null {
	const parts = hostname.split('.')
	if (parts.length >= 3) {
		return parts[0] // First part is tenant ID
	}
	return null
}

/**
 * Strategy 2: Path-based
 * Examples:
 * - /app/tenant1/...
 * - /app/tenant2/...
 */
function getTenantFromPath(pathname: string): string | null {
	const match = pathname.match(/^\/app\/([^\/]+)/)
	return match ? match[1] : null
}

/**
 * Strategy 3: Header-based
 * Examples:
 * - X-Tenant-ID: tenant1
 * - X-Organization-ID: org-123
 */
function getTenantFromHeader(headers: Headers): string | null {
	return headers.get('X-Tenant-ID') || headers.get('X-Organization-ID')
}

// ============================================================================
// TENANT CONFIGURATION RETRIEVAL
// ============================================================================

/**
 * Fetch tenant configuration from D1 database
 */
async function getTenantConfig(
	tenantId: string,
	db: D1Database
): Promise<TenantConfig | null> {
	const result = await db
		.prepare('SELECT * FROM tenants WHERE tenant_id = ? AND is_active = 1')
		.bind(tenantId)
		.first<TenantConfig>()

	return result
}

/**
 * Alternative: Fetch from KV (uncomment if using KV)
 */
/*
async function getTenantConfigFromKV(
	tenantId: string,
	kv: KVNamespace
): Promise<TenantConfig | null> {
	const config = await kv.get(`tenant:${tenantId}`, 'json')
	return config as TenantConfig | null
}
*/

// ============================================================================
// DYNAMIC ACCESS MIDDLEWARE
// ============================================================================

/**
 * Middleware factory that creates Access middleware for specific tenant
 */
function tenantAccessMiddleware(tenantId: string) {
	return async (c: any, next: any) => {
		// Get tenant configuration
		const tenant = await getTenantConfig(tenantId, c.env.DB)

		if (!tenant) {
			return c.json(
				{
					error: 'Tenant not found',
					tenantId,
				},
				404
			)
		}

		if (!tenant.is_active) {
			return c.json(
				{
					error: 'Tenant account is inactive',
					tenantId,
				},
				403
			)
		}

		// Store tenant config in context for use in handlers
		c.set('tenant', tenant)

		// Apply Access middleware with tenant's domain
		const accessMiddleware = cloudflareAccess({
			domain: tenant.access_team_domain,
		})

		return accessMiddleware(c, next)
	}
}

// ============================================================================
// ROUTES - SUBDOMAIN PATTERN
// ============================================================================

/**
 * Pattern 1: Subdomain-based routing
 */

// Extract tenant from subdomain
app.use('*', async (c, next) => {
	const url = new URL(c.req.url)
	const tenantId = getTenantFromSubdomain(url.hostname)

	if (tenantId) {
		c.set('tenantId', tenantId)
	}

	await next()
})

// Public route (no auth)
app.get('/', (c) => {
	const tenantId = c.get('tenantId')
	return c.json({
		message: 'Welcome',
		tenant: tenantId || 'default',
	})
})

// Protected route with tenant-specific Access
app.use('/app/*', async (c, next) => {
	const tenantId = c.get('tenantId')

	if (!tenantId) {
		return c.json({ error: 'Tenant ID required' }, 400)
	}

	return tenantAccessMiddleware(tenantId)(c, next)
})

app.get('/app/dashboard', (c) => {
	const accessPayload = c.get('accessPayload')
	const tenant = c.get('tenant') as TenantConfig

	return c.json({
		message: 'Tenant Dashboard',
		tenant: {
			id: tenant.tenant_id,
			name: tenant.tenant_name,
		},
		user: {
			email: accessPayload.email,
			groups: accessPayload.groups || [],
		},
	})
})

// ============================================================================
// ROUTES - PATH-BASED PATTERN (Alternative)
// ============================================================================

/**
 * Pattern 2: Path-based routing
 * Uncomment to use path-based tenant identification
 */

/*
app.get('/app/:tenantId/dashboard', async (c) => {
	const tenantId = c.req.param('tenantId')

	// Apply tenant-specific Access middleware
	await tenantAccessMiddleware(tenantId)(c, async () => {})

	const accessPayload = c.get('accessPayload')
	const tenant = c.get('tenant') as TenantConfig

	return c.json({
		message: 'Tenant Dashboard',
		tenant: {
			id: tenant.tenant_id,
			name: tenant.tenant_name,
		},
		user: {
			email: accessPayload.email,
			groups: accessPayload.groups || [],
		},
	})
})
*/

// ============================================================================
// TENANT MANAGEMENT API
// ============================================================================

/**
 * Admin API for managing tenants (should be separately protected!)
 */

app.post('/admin/tenants', async (c) => {
	// TODO: Add admin authentication here
	const body = await c.req.json<{
		tenant_id: string
		tenant_name: string
		access_team_domain: string
		access_aud: string
	}>()

	try {
		await c.env.DB.prepare(
			`INSERT INTO tenants (tenant_id, tenant_name, access_team_domain, access_aud, is_active)
       VALUES (?, ?, ?, ?, 1)`
		)
			.bind(
				body.tenant_id,
				body.tenant_name,
				body.access_team_domain,
				body.access_aud
			)
			.run()

		return c.json({
			message: 'Tenant created successfully',
			tenant_id: body.tenant_id,
		})
	} catch (error) {
		console.error('Failed to create tenant:', error)
		return c.json(
			{
				error: 'Failed to create tenant',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		)
	}
})

app.get('/admin/tenants/:tenantId', async (c) => {
	const tenantId = c.req.param('tenantId')
	const tenant = await getTenantConfig(tenantId, c.env.DB)

	if (!tenant) {
		return c.json({ error: 'Tenant not found' }, 404)
	}

	return c.json(tenant)
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
	console.error('Error:', err)
	return c.json(
		{
			error: 'Internal server error',
			message: err.message,
		},
		500
	)
})

export default app

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

/*
-- D1 Database Schema for Multi-Tenant Access

CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT UNIQUE NOT NULL,
  tenant_name TEXT NOT NULL,
  access_team_domain TEXT NOT NULL,  -- e.g., "tenant1.cloudflareaccess.com"
  access_aud TEXT NOT NULL,           -- Application Audience tag from Access policy
  is_active INTEGER DEFAULT 1,        -- 0 = inactive, 1 = active
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_id ON tenants(tenant_id);
CREATE INDEX idx_is_active ON tenants(is_active);

-- Example data
INSERT INTO tenants (tenant_id, tenant_name, access_team_domain, access_aud)
VALUES
  ('acme', 'Acme Corporation', 'acme.cloudflareaccess.com', 'abc123...'),
  ('globex', 'Globex Corporation', 'globex.cloudflareaccess.com', 'def456...'),
  ('initech', 'Initech', 'initech.cloudflareaccess.com', 'ghi789...');
*/

// ============================================================================
// SETUP INSTRUCTIONS
// ============================================================================

/*
Step 1: Create D1 Database

npx wrangler d1 create multi-tenant-db
npx wrangler d1 execute multi-tenant-db --file=schema.sql

Step 2: Update wrangler.jsonc

{
  "name": "multi-tenant-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "multi-tenant-db",
      "database_id": "your-database-id"
    }
  ],
  "vars": {
    "DEFAULT_ACCESS_TEAM_DOMAIN": "your-team.cloudflareaccess.com"
  }
}

Step 3: Set Up Access for Each Tenant

For each tenant:
1. Create separate Access team (or use same team with different applications)
2. Create Access Application
   - Application Domain: tenant1.example.com (or path-based)
   - Policy: Configure authentication rules for that tenant
3. Note the Application Audience (AUD) tag
4. Add tenant to database with Access team domain and AUD

Step 4: Configure DNS

For subdomain pattern:
- *.example.com -> Your Worker
- Each tenant gets their own subdomain

For path pattern:
- example.com -> Your Worker
- Tenants share same domain

Step 5: Test

# Tenant 1
curl -H "CF-Access-JWT-Assertion: ..." \
  https://acme.example.com/app/dashboard

# Tenant 2
curl -H "CF-Access-JWT-Assertion: ..." \
  https://globex.example.com/app/dashboard

Each should authenticate through their respective Access team!
*/

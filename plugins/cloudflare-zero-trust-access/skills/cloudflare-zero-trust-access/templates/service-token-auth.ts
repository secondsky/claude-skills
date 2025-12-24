/**
 * Cloudflare Zero Trust Access - Service Token Authentication
 *
 * This template shows how to use Access Service Tokens for machine-to-machine
 * authentication. Service tokens allow backend services to authenticate without
 * interactive login.
 *
 * Use cases:
 * - Backend service calling your Worker API
 * - Automated scripts/cron jobs
 * - CI/CD pipelines
 * - Microservice communication
 *
 * Prerequisites:
 * 1. Create service token in Cloudflare Zero Trust dashboard:
 *    Dashboard > Access > Service Auth > Create Service Token
 * 2. Add service token to your Access policy:
 *    Edit Access Application > Add Rule > Service Auth > Select your token
 * 3. Store token credentials securely (environment variables, secrets manager)
 *
 * Install:
 * npm install hono @hono/cloudflare-access
 */

import { Hono } from 'hono'
import { cloudflareAccess } from '@hono/cloudflare-access'

type Env = {
	ACCESS_TEAM_DOMAIN: string
	// Service token credentials (for making requests to other services)
	SERVICE_TOKEN_ID?: string
	SERVICE_TOKEN_SECRET?: string
}

const app = new Hono<{ Bindings: Env }>()

// ============================================================================
// RECEIVING SERVICE TOKEN REQUESTS
// ============================================================================

/**
 * Pattern 1: Validate service tokens the same way as user JWTs
 *
 * Access automatically validates service tokens and issues a JWT.
 * Your Worker just validates the JWT using the standard middleware.
 */

app.use(
	'/api/*',
	cloudflareAccess({
		domain: (c) => c.env.ACCESS_TEAM_DOMAIN,
	})
)

app.get('/api/data', (c) => {
	const accessPayload = c.get('accessPayload')

	// For service tokens, the payload structure is different:
	// - No 'email' field
	// - Has 'common_name' instead (the service token name)
	// - 'sub' field is empty

	const isServiceToken = !accessPayload.email && accessPayload.common_name

	return c.json({
		message: 'Data from API',
		authenticatedBy: isServiceToken ? 'service-token' : 'user',
		identifier: accessPayload.email || accessPayload.common_name,
		data: {
			// Your business logic here
			timestamp: new Date().toISOString(),
		},
	})
})

// ============================================================================
// MAKING SERVICE TOKEN REQUESTS (Client Side)
// ============================================================================

/**
 * Pattern 2: Call another Access-protected service using service tokens
 */

app.get('/call-external-service', async (c) => {
	// This endpoint calls ANOTHER Access-protected service
	// using service token credentials

	if (!c.env.SERVICE_TOKEN_ID || !c.env.SERVICE_TOKEN_SECRET) {
		return c.json(
			{
				error: 'Service token credentials not configured',
			},
			500
		)
	}

	try {
		const response = await fetch('https://other-service.example.com/api/data', {
			headers: {
				// Service token authentication headers
				'CF-Access-Client-Id': c.env.SERVICE_TOKEN_ID,
				'CF-Access-Client-Secret': c.env.SERVICE_TOKEN_SECRET,
			},
		})

		if (!response.ok) {
			throw new Error(`Service request failed: ${response.statusText}`)
		}

		const data = await response.json()

		return c.json({
			message: 'Successfully called external service',
			data,
		})
	} catch (error) {
		console.error('Service token request failed:', error)
		return c.json(
			{
				error: 'Failed to call external service',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		)
	}
})

// ============================================================================
// DIFFERENTIATE USER VS SERVICE TOKEN
// ============================================================================

/**
 * Pattern 3: Different logic for users vs service tokens
 */

app.get('/api/analytics', (c) => {
	const accessPayload = c.get('accessPayload')

	// Check if this is a service token or user authentication
	const authType = accessPayload.email ? 'user' : 'service'

	if (authType === 'user') {
		// User-specific logic
		return c.json({
			message: 'User analytics',
			user: accessPayload.email,
			groups: accessPayload.groups || [],
			// Return user-scoped data
		})
	} else {
		// Service token logic
		return c.json({
			message: 'Service analytics',
			service: accessPayload.common_name,
			// Return service-scoped data (might have broader access)
		})
	}
})

// ============================================================================
// HELPER FUNCTION: CREATE AUTHENTICATED REQUEST
// ============================================================================

/**
 * Reusable function to make service token authenticated requests
 */
async function callServiceWithToken(
	url: string,
	env: Env,
	options: RequestInit = {}
): Promise<Response> {
	if (!env.SERVICE_TOKEN_ID || !env.SERVICE_TOKEN_SECRET) {
		throw new Error('Service token credentials not configured')
	}

	return fetch(url, {
		...options,
		headers: {
			...options.headers,
			'CF-Access-Client-Id': env.SERVICE_TOKEN_ID,
			'CF-Access-Client-Secret': env.SERVICE_TOKEN_SECRET,
		},
	})
}

// Example usage of helper
app.post('/sync-data', async (c) => {
	try {
		const response = await callServiceWithToken(
			'https://backend.example.com/api/sync',
			c.env,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ timestamp: Date.now() }),
			}
		)

		const result = await response.json()
		return c.json(result)
	} catch (error) {
		return c.json(
			{
				error: 'Sync failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		)
	}
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
// USAGE NOTES
// ============================================================================

/*
Creating a Service Token:

1. Go to Cloudflare Zero Trust Dashboard
2. Navigate to Access > Service Auth
3. Click "Create Service Token"
4. Name: "my-backend-service"
5. Copy the Client ID and Client Secret (only shown once!)
6. Store securely:
   - In Wrangler: npx wrangler secret put SERVICE_TOKEN_ID
   - In .env.local: SERVICE_TOKEN_ID=xxx (for local dev)

Adding Service Token to Access Policy:

1. Edit your Access Application
2. Add a new rule or edit existing
3. Under "Include", add "Service Auth"
4. Select your service token from the list
5. Save the policy

Testing with curl:

curl -H "CF-Access-Client-Id: $SERVICE_TOKEN_ID" \
     -H "CF-Access-Client-Secret: $SERVICE_TOKEN_SECRET" \
     https://your-worker.example.com/api/data

Service Token JWT Payload Structure:

{
  "aud": ["..."],                    // Application Audience
  "email": "",                       // Empty for service tokens
  "exp": 1234567890,                 // Expiration
  "iat": 1234567890,                 // Issued at
  "iss": "https://team.cloudflareaccess.com",
  "common_name": "my-backend-service", // Service token name
  "sub": ""                           // Empty for service tokens
}

Security Best Practices:

1. Rotate service tokens regularly (quarterly recommended)
2. Use separate tokens for different services
3. Never commit tokens to git
4. Use Wrangler secrets for production
5. Limit token access via Access policies
6. Monitor token usage in Access logs
*/

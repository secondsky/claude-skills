/**
 * Cloudflare Zero Trust Access - Basic Hono Setup
 *
 * This template shows the recommended pattern for integrating Cloudflare Access
 * with a Hono Worker application.
 *
 * Prerequisites:
 * - Cloudflare Access application configured for your Worker domain
 * - Access policy created with authentication rules
 * - Environment variable ACCESS_TEAM_DOMAIN set (e.g., "your-team.cloudflareaccess.com")
 *
 * Install:
 * npm install hono @hono/cloudflare-access
 */

import { Hono } from 'hono'
import { cloudflareAccess } from '@hono/cloudflare-access'

type Env = {
	ACCESS_TEAM_DOMAIN: string
	// Add other bindings as needed (D1, KV, R2, etc.)
}

const app = new Hono<{ Bindings: Env }>()

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

app.get('/', (c) => {
	return c.html(`
		<!DOCTYPE html>
		<html>
			<head><title>Public Page</title></head>
			<body>
				<h1>Welcome to the Public Page</h1>
				<p>This page is accessible to everyone.</p>
				<a href="/admin">Go to Admin Dashboard</a>
			</body>
		</html>
	`)
})

app.get('/public-api', (c) => {
	return c.json({
		message: 'This is a public API endpoint',
		authenticated: false,
	})
})

// ============================================================================
// PROTECTED ROUTES (Access authentication required)
// ============================================================================

// Apply Access middleware to all /admin routes
app.use(
	'/admin/*',
	cloudflareAccess({
		domain: (c) => c.env.ACCESS_TEAM_DOMAIN,
	})
)

app.get('/admin', (c) => {
	// Access payload is available in context after authentication
	const accessPayload = c.get('accessPayload')

	return c.html(`
		<!DOCTYPE html>
		<html>
			<head><title>Admin Dashboard</title></head>
			<body>
				<h1>Admin Dashboard</h1>
				<p>Welcome, ${accessPayload.email}!</p>
				<h2>Your Details:</h2>
				<ul>
					<li>Email: ${accessPayload.email}</li>
					<li>Groups: ${accessPayload.groups?.join(', ') || 'None'}</li>
					<li>Country: ${accessPayload.country || 'Unknown'}</li>
				</ul>
				<a href="/">Back to Public Page</a>
			</body>
		</html>
	`)
})

app.get('/admin/api/profile', (c) => {
	const accessPayload = c.get('accessPayload')

	return c.json({
		email: accessPayload.email,
		groups: accessPayload.groups || [],
		country: accessPayload.country,
		authenticated: true,
	})
})

// ============================================================================
// PROTECTED API ROUTES (Alternative pattern - protect all /api routes)
// ============================================================================

// You can also protect API routes separately
// Uncomment this block if you want all API routes protected:

/*
app.use(
	'/api/*',
	cloudflareAccess({
		domain: (c) => c.env.ACCESS_TEAM_DOMAIN,
	})
)

app.get('/api/data', (c) => {
	const accessPayload = c.get('accessPayload')

	return c.json({
		data: 'sensitive information',
		user: accessPayload.email,
	})
})
*/

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
	console.error('Error:', err)

	// Handle Access-specific errors
	if (err.message.includes('Access')) {
		return c.json(
			{
				error: 'Authentication failed',
				message: 'Please ensure you are accessing this page through Cloudflare Access',
			},
			401
		)
	}

	return c.json(
		{
			error: 'Internal server error',
			message: err.message,
		},
		500
	)
})

// ============================================================================
// 404 NOT FOUND
// ============================================================================

app.notFound((c) => {
	return c.json({ error: 'Not found' }, 404)
})

export default app

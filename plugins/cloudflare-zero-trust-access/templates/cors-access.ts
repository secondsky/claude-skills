/**
 * Cloudflare Zero Trust Access - CORS Integration
 *
 * This template shows the correct way to handle CORS with Access authentication.
 * CRITICAL: CORS middleware MUST come BEFORE Access middleware to prevent
 * OPTIONS preflight requests from being blocked.
 *
 * Use case:
 * - Single Page Application (SPA) calling Access-protected API
 * - Cross-origin requests from authenticated frontend
 * - React/Vue/Angular apps with protected backend
 *
 * Prerequisites:
 * - Cloudflare Access configured for API domain
 * - Frontend domain allowed in CORS configuration
 * - Access session cookie accessible to frontend
 *
 * Install:
 * npm install hono @hono/cloudflare-access
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { cloudflareAccess } from '@hono/cloudflare-access'

type Env = {
	ACCESS_TEAM_DOMAIN: string
	FRONTEND_URL?: string // Optional: for production CORS config
}

const app = new Hono<{ Bindings: Env }>()

// ============================================================================
// CORS CONFIGURATION (MUST COME FIRST!)
// ============================================================================

/**
 * CRITICAL ORDERING:
 * 1. CORS middleware FIRST
 * 2. Access middleware SECOND
 *
 * Why? OPTIONS preflight requests don't include authentication headers.
 * If Access runs first, OPTIONS requests will be blocked with 401.
 */

// Development CORS (allow all origins)
// ⚠️ Only use this in development!
app.use(
	'*',
	cors({
		origin: '*',
		credentials: true, // Allow cookies (Access session)
		allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowHeaders: [
			'Content-Type',
			'Authorization',
			'CF-Access-JWT-Assertion', // Allow Access JWT header
		],
		exposeHeaders: ['CF-Access-JWT-Assertion'],
	})
)

// Production CORS (specific origin)
// Uncomment for production use:
/*
app.use(
	'*',
	cors({
		origin: (origin, c) => {
			// Allow your frontend domain
			const allowedOrigins = [
				c.env.FRONTEND_URL || 'https://app.example.com',
				'https://www.example.com',
			]
			return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
		},
		credentials: true,
		allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization', 'CF-Access-JWT-Assertion'],
		exposeHeaders: ['CF-Access-JWT-Assertion'],
		maxAge: 86400, // 24 hours
	})
)
*/

// ============================================================================
// PUBLIC ROUTES (No authentication)
// ============================================================================

app.get('/', (c) => {
	return c.json({
		message: 'Public API endpoint',
		authenticated: false,
	})
})

app.get('/health', (c) => {
	return c.json({ status: 'healthy' })
})

// ============================================================================
// PROTECTED API ROUTES (Access authentication required)
// ============================================================================

// Apply Access middleware AFTER CORS
app.use(
	'/api/*',
	cloudflareAccess({
		domain: (c) => c.env.ACCESS_TEAM_DOMAIN,
	})
)

app.get('/api/user', (c) => {
	const accessPayload = c.get('accessPayload')

	return c.json({
		email: accessPayload.email,
		groups: accessPayload.groups || [],
		country: accessPayload.country,
	})
})

app.post('/api/data', async (c) => {
	const accessPayload = c.get('accessPayload')
	const body = await c.req.json()

	return c.json({
		message: 'Data received',
		user: accessPayload.email,
		data: body,
	})
})

app.put('/api/update/:id', async (c) => {
	const accessPayload = c.get('accessPayload')
	const id = c.req.param('id')
	const body = await c.req.json()

	return c.json({
		message: 'Data updated',
		id,
		user: accessPayload.email,
		data: body,
	})
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
	console.error('Error:', err)

	// CORS headers are already set by middleware
	// Just return the error response
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
// FRONTEND INTEGRATION EXAMPLES
// ============================================================================

/*
Example 1: Fetch API (JavaScript)

// User must be authenticated through Access first
// Access sets session cookie automatically

async function callProtectedAPI() {
  try {
    const response = await fetch('https://api.example.com/api/user', {
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to Access login
        window.location.href = 'https://team.cloudflareaccess.com/...'
        return
      }
      throw new Error('API call failed')
    }

    const data = await response.json()
    console.log('User data:', data)
  } catch (error) {
    console.error('Error:', error)
  }
}

Example 2: Axios (React)

import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.example.com',
  withCredentials: true, // Include cookies
})

// Add error interceptor for auth failures
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to Access login
      window.location.href = 'https://team.cloudflareaccess.com/...'
    }
    return Promise.reject(error)
  }
)

// Use in components
const UserProfile = () => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/api/user')
      .then(res => setUser(res.data))
      .catch(err => console.error(err))
  }, [])

  return <div>{user?.email}</div>
}

Example 3: Handling CORS Errors

// If you see CORS errors:
// 1. Check browser console for exact error
// 2. Verify CORS middleware is BEFORE Access middleware
// 3. Ensure credentials: true / withCredentials: true
// 4. Check Access policy allows your frontend domain

Common CORS Error: "Access to fetch has been blocked by CORS policy"

Solutions:
✅ Move CORS middleware before Access middleware
✅ Add credentials: true to fetch options
✅ Verify origin is allowed in CORS config
✅ Check Access policy doesn't block preflight requests

Example 4: Testing CORS with curl

# Test OPTIONS preflight
curl -X OPTIONS \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://api.example.com/api/data

# Should return 200 with Access-Control-* headers
# Should NOT return 401

# Test actual request (after authenticating through Access)
curl -X GET \
  -H "Origin: https://app.example.com" \
  -H "Cookie: CF_Authorization=..." \
  https://api.example.com/api/user

*/

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
Problem: OPTIONS requests return 401

Solution: Ensure CORS middleware comes BEFORE Access middleware

❌ Wrong order:
app.use('/api/*', cloudflareAccess({ domain: '...' }))
app.use('*', cors())

✅ Correct order:
app.use('*', cors())
app.use('/api/*', cloudflareAccess({ domain: '...' }))

---

Problem: "Credentials mode is 'include' but the Access-Control-Allow-Origin is '*'"

Solution: Use specific origin instead of wildcard when credentials: true

❌ Wrong:
cors({ origin: '*', credentials: true })

✅ Correct:
cors({ origin: 'https://app.example.com', credentials: true })

---

Problem: Authenticated in browser but API returns 401

Solution: Ensure credentials/cookies are included in request

❌ Wrong:
fetch('https://api.example.com/api/user')

✅ Correct:
fetch('https://api.example.com/api/user', { credentials: 'include' })

---

Problem: Works in same domain, fails cross-origin

Solution: Configure Access to allow cross-origin requests

1. Check Access policy allows the API domain
2. Ensure CORS headers include Access JWT header
3. Verify frontend domain is allowed origin

*/

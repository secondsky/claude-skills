/**
 * Cloudflare Zero Trust Access - Manual JWT Validation
 *
 * This template shows how to manually validate Access JWTs using the Web Crypto API.
 * Use this pattern when:
 * - You need custom validation logic
 * - You're not using the Hono framework
 * - You want full control over the verification process
 *
 * Note: For most use cases, @hono/cloudflare-access middleware is recommended.
 * This template is for advanced use cases or non-Hono frameworks.
 *
 * Prerequisites:
 * - Cloudflare Access application configured for your Worker domain
 * - Environment variable ACCESS_TEAM_DOMAIN set
 * - Environment variable ACCESS_AUD set (Application Audience tag from Access policy)
 */

type Env = {
	ACCESS_TEAM_DOMAIN: string
	ACCESS_AUD: string // Your Access policy's Application Audience (AUD)
}

interface AccessJWTPayload {
	email: string
	groups?: string[]
	country?: string
	aud: string[]
	exp: number
	iat: number
	iss: string
	sub: string
	// Service token fields (when using service tokens)
	common_name?: string
}

interface CertsResponse {
	keys: Array<{
		kid: string
		kty: string
		alg: string
		use: string
		e: string
		n: string
	}>
	public_cert?: {
		kid: string
		cert: string
	}
	public_certs?: Array<{
		kid: string
		cert: string
	}>
}

// Cache for public keys (in production, use KV or Durable Objects for better caching)
const keyCache = new Map<string, CryptoKey>()
const KEY_CACHE_TTL = 3600000 // 1 hour in milliseconds
let lastKeyFetch = 0

/**
 * Fetch and cache Access public keys
 */
async function getAccessPublicKeys(teamDomain: string): Promise<CertsResponse> {
	const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`

	const response = await fetch(certsUrl)
	if (!response.ok) {
		throw new Error(`Failed to fetch Access certs: ${response.statusText}`)
	}

	return response.json()
}

/**
 * Decode JWT header to get key ID (kid)
 */
function decodeJWTHeader(token: string): { kid: string; alg: string } {
	const [headerB64] = token.split('.')
	const headerJson = atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'))
	return JSON.parse(headerJson)
}

/**
 * Convert base64url to ArrayBuffer
 */
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
	const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
	const binary = atob(base64)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes.buffer
}

/**
 * Import RSA public key from JWK
 */
async function importPublicKey(jwk: {
	kty: string
	n: string
	e: string
	alg: string
	kid: string
}): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'jwk',
		{
			kty: jwk.kty,
			n: jwk.n,
			e: jwk.e,
			alg: jwk.alg,
			ext: true,
		},
		{
			name: 'RSASSA-PKCS1-v1_5',
			hash: 'SHA-256',
		},
		false,
		['verify']
	)
}

/**
 * Verify JWT signature using Web Crypto API
 */
async function verifyJWTSignature(
	token: string,
	publicKey: CryptoKey
): Promise<boolean> {
	const [headerB64, payloadB64, signatureB64] = token.split('.')
	const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
	const signature = base64urlToArrayBuffer(signatureB64)

	return crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, data)
}

/**
 * Decode JWT payload
 */
function decodeJWTPayload(token: string): AccessJWTPayload {
	const [, payloadB64] = token.split('.')
	const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
	return JSON.parse(payloadJson)
}

/**
 * Main JWT validation function
 */
export async function validateAccessJWT(
	token: string,
	env: Env
): Promise<AccessJWTPayload> {
	// 1. Decode header to get kid
	const header = decodeJWTHeader(token)

	// 2. Fetch public keys (with caching)
	const now = Date.now()
	if (now - lastKeyFetch > KEY_CACHE_TTL) {
		keyCache.clear()
		lastKeyFetch = now
	}

	let publicKey = keyCache.get(header.kid)
	if (!publicKey) {
		const certs = await getAccessPublicKeys(env.ACCESS_TEAM_DOMAIN)
		const jwk = certs.keys.find((k) => k.kid === header.kid)

		if (!jwk) {
			throw new Error(`Public key not found for kid: ${header.kid}`)
		}

		publicKey = await importPublicKey(jwk)
		keyCache.set(header.kid, publicKey)
	}

	// 3. Verify signature
	const isValid = await verifyJWTSignature(token, publicKey)
	if (!isValid) {
		throw new Error('Invalid JWT signature')
	}

	// 4. Decode and validate payload
	const payload = decodeJWTPayload(token)

	// Validate audience (AUD)
	if (!payload.aud.includes(env.ACCESS_AUD)) {
		throw new Error(
			`Invalid audience. Expected ${env.ACCESS_AUD}, got ${payload.aud.join(', ')}`
		)
	}

	// Validate expiration
	const nowSeconds = Math.floor(Date.now() / 1000)
	if (payload.exp < nowSeconds) {
		throw new Error('JWT expired')
	}

	// Validate issuer
	const expectedIssuer = `https://${env.ACCESS_TEAM_DOMAIN}`
	if (payload.iss !== expectedIssuer) {
		throw new Error(`Invalid issuer. Expected ${expectedIssuer}, got ${payload.iss}`)
	}

	return payload
}

/**
 * Example Worker using manual JWT validation
 */
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)

		// Public routes
		if (url.pathname === '/' || url.pathname === '/public') {
			return new Response('Public page', { status: 200 })
		}

		// Protected routes - validate JWT
		if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
			try {
				// Extract JWT from header
				const jwtToken = request.headers.get('CF-Access-JWT-Assertion')
				if (!jwtToken) {
					return new Response(
						JSON.stringify({
							error: 'Missing JWT',
							message:
								'CF-Access-JWT-Assertion header not found. Ensure request goes through Cloudflare Access.',
						}),
						{
							status: 401,
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}

				// Validate JWT
				const payload = await validateAccessJWT(jwtToken, env)

				// Use payload in your business logic
				if (url.pathname === '/admin/profile') {
					return new Response(
						JSON.stringify({
							email: payload.email,
							groups: payload.groups || [],
							country: payload.country,
						}),
						{
							headers: { 'Content-Type': 'application/json' },
						}
					)
				}

				return new Response('Authenticated successfully', { status: 200 })
			} catch (error) {
				console.error('JWT validation error:', error)
				return new Response(
					JSON.stringify({
						error: 'Authentication failed',
						message: error instanceof Error ? error.message : 'Unknown error',
					}),
					{
						status: 401,
						headers: { 'Content-Type': 'application/json' },
					}
				)
			}
		}

		return new Response('Not found', { status: 404 })
	},
}

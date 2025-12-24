/**
 * Cloudflare Zero Trust Access - TypeScript Type Definitions
 *
 * This file provides comprehensive type definitions for Access JWT payloads,
 * service tokens, and Access-related API responses.
 *
 * Usage:
 * import { AccessJWTPayload, ServiceTokenJWTPayload, AccessCertsResponse } from './types'
 */

// ============================================================================
// USER JWT PAYLOAD (Interactive Login)
// ============================================================================

/**
 * Access JWT payload structure for user authentication
 *
 * This is the payload you receive after a user successfully authenticates
 * through Cloudflare Access interactive login.
 */
export interface AccessJWTPayload {
	/**
	 * User's email address
	 * Example: "user@example.com"
	 */
	email: string

	/**
	 * User's country code (ISO 3166-1 alpha-2)
	 * Example: "US", "GB", "AU"
	 * Note: May be undefined if geo-location is disabled
	 */
	country?: string

	/**
	 * Groups the user belongs to (from identity provider)
	 * Example: ["admin", "developers", "sales"]
	 * Note: Only populated if using an IdP that provides groups
	 */
	groups?: string[]

	/**
	 * User type (usually "app" for application access)
	 */
	type?: string

	/**
	 * Application Audience - identifies which Access application issued this token
	 * Example: ["abc123def456..."]
	 * IMPORTANT: Validate this matches your application's AUD tag
	 */
	aud: string[]

	/**
	 * Expiration time (Unix timestamp in seconds)
	 * Example: 1234567890
	 * Note: Tokens typically expire after 1 hour
	 */
	exp: number

	/**
	 * Issued at time (Unix timestamp in seconds)
	 */
	iat: number

	/**
	 * Issuer - the Access team domain that issued this token
	 * Example: "https://your-team.cloudflareaccess.com"
	 */
	iss: string

	/**
	 * Subject - user identifier
	 * Example: "user-id-from-idp"
	 */
	sub: string

	/**
	 * Custom claims (if configured in Access)
	 * Access allows adding custom JWT claims via identity provider
	 */
	[key: string]: any
}

// ============================================================================
// SERVICE TOKEN JWT PAYLOAD (Machine-to-Machine)
// ============================================================================

/**
 * Access JWT payload structure for service token authentication
 *
 * Service tokens have a different structure than user JWTs.
 * Key differences:
 * - No 'email' field
 * - Has 'common_name' instead (the service token name)
 * - 'sub' field is empty
 */
export interface ServiceTokenJWTPayload {
	/**
	 * Service token name (as configured in Access dashboard)
	 * Example: "my-backend-service"
	 */
	common_name: string

	/**
	 * Application Audience
	 */
	aud: string[]

	/**
	 * Expiration time (Unix timestamp)
	 */
	exp: number

	/**
	 * Issued at time (Unix timestamp)
	 */
	iat: number

	/**
	 * Issuer
	 */
	iss: string

	/**
	 * Subject - empty for service tokens
	 */
	sub: string

	/**
	 * Custom claims
	 */
	[key: string]: any
}

// ============================================================================
// COMBINED JWT PAYLOAD TYPE
// ============================================================================

/**
 * Union type that can be either user or service token payload
 *
 * Use this when your Worker accepts both user and service token authentication.
 */
export type AnyAccessJWTPayload = AccessJWTPayload | ServiceTokenJWTPayload

/**
 * Type guard to check if payload is from a user (not service token)
 */
export function isUserJWT(payload: AnyAccessJWTPayload): payload is AccessJWTPayload {
	return 'email' in payload && !!payload.email
}

/**
 * Type guard to check if payload is from a service token
 */
export function isServiceTokenJWT(
	payload: AnyAccessJWTPayload
): payload is ServiceTokenJWTPayload {
	return 'common_name' in payload && !!payload.common_name
}

// ============================================================================
// ACCESS PUBLIC KEYS API RESPONSE
// ============================================================================

/**
 * Response from Access public keys endpoint
 *
 * Endpoint: https://<team>.cloudflareaccess.com/cdn-cgi/access/certs
 */
export interface AccessCertsResponse {
	/**
	 * Array of public keys in JWK format
	 */
	keys: AccessPublicKey[]

	/**
	 * Legacy public cert (deprecated, use 'keys' instead)
	 */
	public_cert?: {
		kid: string
		cert: string
	}

	/**
	 * Legacy public certs array (deprecated)
	 */
	public_certs?: Array<{
		kid: string
		cert: string
	}>
}

/**
 * Access public key in JWK (JSON Web Key) format
 */
export interface AccessPublicKey {
	/**
	 * Key ID - use this to match with JWT header 'kid'
	 */
	kid: string

	/**
	 * Key type (always "RSA" for Access)
	 */
	kty: string

	/**
	 * Algorithm (always "RS256" for Access)
	 */
	alg: string

	/**
	 * Public key use (always "sig" for signature verification)
	 */
	use: string

	/**
	 * RSA public exponent (base64url encoded)
	 */
	e: string

	/**
	 * RSA modulus (base64url encoded)
	 */
	n: string
}

// ============================================================================
// JWT HEADER
// ============================================================================

/**
 * JWT header structure
 */
export interface JWTHeader {
	/**
	 * Algorithm used to sign the JWT (always "RS256" for Access)
	 */
	alg: string

	/**
	 * Key ID - identifies which public key to use for verification
	 */
	kid: string

	/**
	 * Type (always "JWT")
	 */
	typ?: string
}

// ============================================================================
// HONO CONTEXT EXTENSIONS
// ============================================================================

/**
 * Type extensions for Hono context when using @hono/cloudflare-access
 *
 * After successful authentication, the middleware adds these to the context.
 */
declare module 'hono' {
	interface ContextVariableMap {
		/**
		 * Access JWT payload (available after authentication)
		 */
		accessPayload: AccessJWTPayload | ServiceTokenJWTPayload

		/**
		 * Tenant configuration (if using multi-tenant pattern)
		 */
		tenant?: TenantConfig

		/**
		 * Tenant ID (if using multi-tenant pattern)
		 */
		tenantId?: string
	}
}

// ============================================================================
// MULTI-TENANT TYPES
// ============================================================================

/**
 * Tenant configuration structure
 *
 * Use this for multi-tenant applications with per-tenant Access configuration.
 */
export interface TenantConfig {
	/**
	 * Unique tenant identifier
	 */
	tenant_id: string

	/**
	 * Human-readable tenant name
	 */
	tenant_name: string

	/**
	 * Access team domain for this tenant
	 * Example: "tenant1.cloudflareaccess.com"
	 */
	access_team_domain: string

	/**
	 * Application Audience tag for this tenant
	 */
	access_aud: string

	/**
	 * When the tenant was created
	 */
	created_at: string

	/**
	 * Whether the tenant account is active
	 */
	is_active: boolean

	/**
	 * Custom metadata
	 */
	metadata?: Record<string, any>
}

// ============================================================================
// ENVIRONMENT BINDINGS
// ============================================================================

/**
 * Cloudflare Workers environment bindings for Access-protected apps
 *
 * Extend this interface with your own bindings (D1, KV, R2, etc.)
 */
export interface AccessEnv {
	/**
	 * Access team domain (without https://)
	 */
	ACCESS_TEAM_DOMAIN: string

	/**
	 * Application Audience tag
	 */
	ACCESS_AUD: string

	/**
	 * Service token credentials (optional)
	 */
	SERVICE_TOKEN_ID?: string
	SERVICE_TOKEN_SECRET?: string

	/**
	 * Frontend URL for CORS (optional)
	 */
	FRONTEND_URL?: string

	/**
	 * Add your own bindings here:
	 */
	// DB?: D1Database
	// KV?: KVNamespace
	// BUCKET?: R2Bucket
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract user identifier from any JWT payload
 */
export function getUserIdentifier(payload: AnyAccessJWTPayload): string {
	if (isUserJWT(payload)) {
		return payload.email
	}
	return payload.common_name
}

/**
 * Check if JWT is expired
 */
export function isJWTExpired(payload: AccessJWTPayload | ServiceTokenJWTPayload): boolean {
	const nowSeconds = Math.floor(Date.now() / 1000)
	return payload.exp < nowSeconds
}

/**
 * Get JWT time to live (TTL) in seconds
 */
export function getJWTTTL(payload: AccessJWTPayload | ServiceTokenJWTPayload): number {
	const nowSeconds = Math.floor(Date.now() / 1000)
	return Math.max(0, payload.exp - nowSeconds)
}

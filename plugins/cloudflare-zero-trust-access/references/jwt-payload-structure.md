# Cloudflare Access JWT Payload Structure

This document provides detailed information about the structure of JWT tokens issued by Cloudflare Access, including differences between user authentication and service tokens.

---

## Overview

Cloudflare Access issues JWT (JSON Web Token) tokens after successful authentication. These tokens are included in the `CF-Access-JWT-Assertion` header on all requests that pass through Access.

**Token Lifetime**: Default 1 hour (configurable in Access policy)

**Token Format**: Standard JWT with header, payload, and signature
```
header.payload.signature
```

---

## User Authentication JWT

### Complete Example

```json
{
  "email": "user@example.com",
  "country": "US",
  "groups": ["developers", "admin"],
  "type": "app",
  "aud": [
    "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  ],
  "exp": 1730995200,
  "iat": 1730991600,
  "iss": "https://your-team.cloudflareaccess.com",
  "sub": "user-id-from-identity-provider",
  "nonce": "random-nonce-value"
}
```

### Field Descriptions

#### `email` (string, required)
The authenticated user's email address.

**Example**: `"user@example.com"`

**Use Cases**:
- Display username in UI
- Check email domain for authorization
- Log user activity
- Personalize content

**Code Example**:
```typescript
const accessPayload = c.get('accessPayload')
const userEmail = accessPayload.email

// Check email domain
if (!userEmail.endsWith('@company.com')) {
  return c.json({ error: 'Only company emails allowed' }, 403)
}
```

---

#### `country` (string, optional)
User's country code in ISO 3166-1 alpha-2 format.

**Example**: `"US"`, `"GB"`, `"AU"`, `"CA"`

**Note**: Only populated if geo-location is enabled in Access policy.

**Use Cases**:
- Geographic restrictions
- Compliance requirements (GDPR, data residency)
- Analytics and logging
- Content localization

**Code Example**:
```typescript
// Restrict access to specific countries
const allowedCountries = ['US', 'CA', 'GB', 'AU']
if (accessPayload.country && !allowedCountries.includes(accessPayload.country)) {
  return c.json({ error: 'Access restricted in your region' }, 403)
}
```

---

#### `groups` (string[], optional)
Array of group names the user belongs to, provided by the identity provider.

**Example**: `["developers", "admin", "sales"]`

**Note**: Only populated when using identity providers that support groups (Azure AD, Okta, Google Workspace, etc.)

**Use Cases**:
- Role-based access control (RBAC)
- Feature flags
- Team-specific functionality
- Admin panels

**Code Example**:
```typescript
// Check if user is admin
const isAdmin = accessPayload.groups?.includes('admin') ?? false

if (isAdmin) {
  // Show admin features
} else {
  // Regular user view
}
```

---

#### `type` (string, optional)
Type of authentication.

**Values**:
- `"app"` - Application access (most common)

**Example**: `"app"`

---

#### `aud` (string[], required)
Application Audience - identifies which Access application issued this token.

**Example**: `["abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"]`

**CRITICAL**: Always validate this matches your application's expected AUD tag.

**Finding Your AUD**:
1. Go to Zero Trust Dashboard
2. Access > Applications
3. Click on your application
4. Copy the "Application Audience" value

**Code Example**:
```typescript
// Validate audience
if (!payload.aud.includes(env.ACCESS_AUD)) {
  throw new Error(`Invalid audience. Expected ${env.ACCESS_AUD}`)
}
```

**Security Note**: Validating `aud` prevents token reuse across different applications.

---

#### `exp` (number, required)
Expiration time as Unix timestamp (seconds since epoch).

**Example**: `1730995200` (2025-10-28 12:00:00 UTC)

**Default Lifespan**: 1 hour from `iat`

**Use Cases**:
- Validate token hasn't expired
- Calculate remaining session time
- Trigger re-authentication

**Code Example**:
```typescript
function isTokenExpired(payload: AccessJWTPayload): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return payload.exp < nowSeconds
}

function getTimeToExpiration(payload: AccessJWTPayload): number {
  const nowSeconds = Math.floor(Date.now() / 1000)
  return Math.max(0, payload.exp - nowSeconds)
}

// Usage
if (isTokenExpired(accessPayload)) {
  return c.json({ error: 'Session expired' }, 401)
}

const ttl = getTimeToExpiration(accessPayload)
console.log(`Session expires in ${ttl} seconds`)
```

---

#### `iat` (number, required)
Issued At time as Unix timestamp (seconds since epoch).

**Example**: `1730991600` (2025-10-28 11:00:00 UTC)

**Use Cases**:
- Calculate token age
- Logging and auditing
- Reject tokens issued before a certain time (e.g., after password reset)

**Code Example**:
```typescript
const tokenAge = Math.floor(Date.now() / 1000) - payload.iat
console.log(`Token issued ${tokenAge} seconds ago`)
```

---

#### `iss` (string, required)
Issuer - the Access team domain that issued this token.

**Example**: `"https://your-team.cloudflareaccess.com"`

**Format**: Always includes `https://` prefix

**Validation**:
```typescript
const expectedIssuer = `https://${env.ACCESS_TEAM_DOMAIN}`
if (payload.iss !== expectedIssuer) {
  throw new Error(`Invalid issuer. Expected ${expectedIssuer}, got ${payload.iss}`)
}
```

**Security Note**: Validating `iss` prevents tokens from other Access teams being used.

---

#### `sub` (string, required)
Subject - unique user identifier from the identity provider.

**Example**: `"user-id-from-identity-provider"`

**Format**: Varies by identity provider
- Azure AD: GUID
- Google: Numeric ID
- Okta: User ID

**Use Cases**:
- Unique user identification (more stable than email)
- Link user data across systems
- Audit logs

**Code Example**:
```typescript
// Use sub as unique identifier instead of email
// (email can change, sub typically doesn't)
const userId = accessPayload.sub

await db.prepare('SELECT * FROM users WHERE idp_sub = ?')
  .bind(userId)
  .first()
```

---

#### `nonce` (string, optional)
Random nonce value for OIDC flow.

**Example**: `"random-nonce-value"`

**Use Case**: Typically used internally by Access, not needed for application logic.

---

## Service Token JWT

Service tokens have a **different structure** than user JWTs.

### Complete Example

```json
{
  "common_name": "my-backend-service",
  "aud": [
    "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  ],
  "exp": 1730995200,
  "iat": 1730991600,
  "iss": "https://your-team.cloudflareaccess.com",
  "sub": "",
  "type": "app"
}
```

### Key Differences from User JWT

| Field | User JWT | Service Token JWT |
|-------|----------|-------------------|
| `email` | ✅ Present | ❌ Not present |
| `common_name` | ❌ Not present | ✅ Present (token name) |
| `sub` | Populated with user ID | Empty string `""` |
| `groups` | May be present | Never present |
| `country` | May be present | Never present |

### Field Descriptions

#### `common_name` (string, required for service tokens)
The name of the service token as configured in the Access dashboard.

**Example**: `"my-backend-service"`

**Use Cases**:
- Identify which service made the request
- Service-specific logic
- Logging and monitoring

**Code Example**:
```typescript
// Detect service token vs user authentication
function isServiceToken(payload: any): boolean {
  return !!payload.common_name && !payload.email
}

// Handle differently based on auth type
if (isServiceToken(accessPayload)) {
  console.log(`Service request from: ${accessPayload.common_name}`)
} else {
  console.log(`User request from: ${accessPayload.email}`)
}
```

---

#### `sub` (string, empty for service tokens)
Always an empty string for service tokens.

**Example**: `""`

**Note**: This is a reliable way to differentiate service tokens from user JWTs.

---

## TypeScript Type Definitions

### User JWT Type

```typescript
interface AccessJWTPayload {
  email: string
  country?: string
  groups?: string[]
  type?: string
  aud: string[]
  exp: number
  iat: number
  iss: string
  sub: string
  nonce?: string
  [key: string]: any // Custom claims
}
```

### Service Token JWT Type

```typescript
interface ServiceTokenJWTPayload {
  common_name: string
  aud: string[]
  exp: number
  iat: number
  iss: string
  sub: string // Always empty ""
  type?: string
  [key: string]: any
}
```

### Type Guards

```typescript
// Check if user (not service token)
function isUserJWT(payload: any): payload is AccessJWTPayload {
  return 'email' in payload && !!payload.email
}

// Check if service token
function isServiceTokenJWT(payload: any): payload is ServiceTokenJWTPayload {
  return 'common_name' in payload && !!payload.common_name
}

// Usage
if (isUserJWT(accessPayload)) {
  console.log(`User: ${accessPayload.email}`)
} else if (isServiceTokenJWT(accessPayload)) {
  console.log(`Service: ${accessPayload.common_name}`)
}
```

---

## JWT Header Structure

The JWT header contains metadata about the token.

### Example

```json
{
  "alg": "RS256",
  "kid": "abc123",
  "typ": "JWT"
}
```

### Fields

#### `alg` (string)
Algorithm used to sign the token.

**Value**: Always `"RS256"` (RSA with SHA-256)

#### `kid` (string)
Key ID - identifies which public key to use for signature verification.

**Example**: `"abc123"`

**Use**: Match this with the `kid` in the public keys response from:
```
https://<team>.cloudflareaccess.com/cdn-cgi/access/certs
```

#### `typ` (string)
Token type.

**Value**: `"JWT"`

---

## Custom Claims

Access allows adding custom claims through your identity provider configuration.

### Example with Custom Claims

```json
{
  "email": "user@example.com",
  "groups": ["admin"],
  "aud": ["..."],
  "exp": 1730995200,
  "iat": 1730991600,
  "iss": "https://your-team.cloudflareaccess.com",
  "sub": "user-123",

  // Custom claims
  "department": "Engineering",
  "employee_id": "EMP-456",
  "role": "Senior Developer",
  "clearance_level": 3
}
```

### Accessing Custom Claims

```typescript
interface CustomAccessPayload extends AccessJWTPayload {
  department?: string
  employee_id?: string
  role?: string
  clearance_level?: number
}

const payload = c.get('accessPayload') as CustomAccessPayload

if (payload.clearance_level && payload.clearance_level >= 3) {
  // Grant access to sensitive resources
}
```

---

## Common Patterns

### Pattern 1: Extract User Identifier

```typescript
function getUserIdentifier(payload: any): string {
  // For user JWT: use email
  if (payload.email) {
    return payload.email
  }
  // For service token: use common_name
  if (payload.common_name) {
    return payload.common_name
  }
  // Fallback: use sub
  return payload.sub || 'unknown'
}
```

### Pattern 2: Role-Based Access Control

```typescript
function hasRole(payload: AccessJWTPayload, requiredRole: string): boolean {
  return payload.groups?.includes(requiredRole) ?? false
}

// Usage
if (!hasRole(accessPayload, 'admin')) {
  return c.json({ error: 'Admin access required' }, 403)
}
```

### Pattern 3: Geographic Restrictions

```typescript
const RESTRICTED_COUNTRIES = ['CN', 'RU', 'KP']

function isCountryAllowed(payload: AccessJWTPayload): boolean {
  if (!payload.country) {
    return true // Allow if country not provided
  }
  return !RESTRICTED_COUNTRIES.includes(payload.country)
}
```

### Pattern 4: Token Validation

```typescript
function validateAccessToken(
  payload: AccessJWTPayload,
  env: Env
): { valid: boolean; error?: string } {
  // Check expiration
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (payload.exp < nowSeconds) {
    return { valid: false, error: 'Token expired' }
  }

  // Check audience
  if (!payload.aud.includes(env.ACCESS_AUD)) {
    return { valid: false, error: 'Invalid audience' }
  }

  // Check issuer
  const expectedIssuer = `https://${env.ACCESS_TEAM_DOMAIN}`
  if (payload.iss !== expectedIssuer) {
    return { valid: false, error: 'Invalid issuer' }
  }

  return { valid: true }
}
```

---

## Debugging Tips

### Decode JWT in Browser Console

```javascript
// Paste JWT token
const token = 'eyJhbGciOiJS...'

// Decode payload
const [header, payload, signature] = token.split('.')
const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
console.log(decodedPayload)
```

### Log JWT in Worker (Development Only!)

```typescript
// ⚠️ DEVELOPMENT ONLY - DO NOT LOG IN PRODUCTION
if (env.ENVIRONMENT === 'development') {
  const jwtToken = c.req.header('CF-Access-JWT-Assertion')
  console.log('JWT Token:', jwtToken)

  const [, payloadB64] = jwtToken.split('.')
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
  console.log('Decoded Payload:', payload)
}
```

---

## Resources

- [JWT Specification (RFC 7519)](https://datatracker.ietf.org/doc/html/rfc7519)
- [Cloudflare Access JWT Validation](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)
- [JWT.io Debugger](https://jwt.io/) - Decode and validate JWTs

---

**Last Updated**: 2025-10-28
**JWT Format**: RS256
**Cloudflare Docs**: ✅ Verified

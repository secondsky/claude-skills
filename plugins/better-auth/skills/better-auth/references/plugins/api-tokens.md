# better-auth API Token Plugins

Complete guide for API authentication: API Keys, Bearer Tokens, JWT, and OIDC Provider.

---

## API Key Plugin

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { apiKey } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    apiKey({
      // API key prefix (optional)
      prefix: "sk_",
      // Key length in bytes
      keyLength: 32,
      // Hash algorithm for storing keys
      hashAlgorithm: "sha256",
      // Rate limiting per key
      rateLimit: {
        window: 60 * 1000,  // 1 minute
        max: 100,           // 100 requests per window
      },
    }),
  ],
});
```

### Client Configuration

```typescript
import { apiKeyClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [apiKeyClient()],
});
```

### Create API Key

```typescript
// Create key with optional metadata
const { data: key } = await authClient.apiKey.create({
  name: "Production API Key",
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),  // 1 year
  metadata: {
    environment: "production",
    permissions: ["read", "write"],
  },
});

// IMPORTANT: key.key is only shown once!
console.log(key.key);  // sk_abc123...
```

### List API Keys

```typescript
const { data: keys } = await authClient.apiKey.list();
// Returns key metadata (NOT the actual keys)
```

### Revoke API Key

```typescript
await authClient.apiKey.revoke({
  keyId: "key-id",
});
```

### Use API Key in Requests

```typescript
// Client-side
const response = await fetch("/api/data", {
  headers: {
    "Authorization": `Bearer sk_abc123...`,
  },
});

// Server-side validation
const session = await auth.api.getSession({
  headers: req.headers,
});

if (session?.apiKey) {
  // Request authenticated via API key
  console.log(session.apiKey.name);
  console.log(session.apiKey.metadata);
}
```

---

## Bearer Token Plugin

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    bearer({
      // Token expiration
      expiresIn: 60 * 60 * 24 * 7,  // 7 days
      // Refresh token settings
      refreshToken: {
        enabled: true,
        expiresIn: 60 * 60 * 24 * 30,  // 30 days
      },
    }),
  ],
});
```

### Client Configuration

```typescript
import { bearerClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [bearerClient()],
});
```

### Get Access Token

```typescript
// After sign-in, get bearer token
const { data } = await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// Access token available
const accessToken = data.accessToken;
const refreshToken = data.refreshToken;
```

### Use Bearer Token

```typescript
// API request with bearer token
const response = await fetch("/api/protected", {
  headers: {
    "Authorization": `Bearer ${accessToken}`,
  },
});
```

### Refresh Token

```typescript
// Refresh when access token expires
const { data } = await authClient.token.refresh({
  refreshToken: refreshToken,
});

const newAccessToken = data.accessToken;
```

---

## JWT Plugin

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      // Signing algorithm
      algorithm: "RS256",  // or HS256, ES256
      // Token expiration
      expiresIn: "1h",
      // Custom claims
      customClaims: async ({ user, session }) => ({
        role: user.role,
        organizationId: session.activeOrganizationId,
      }),
    }),
  ],
});
```

### v1.4.2+ Custom JWKS Endpoint

```typescript
jwt({
  // Custom JWKS endpoint for key rotation
  jwksEndpoint: "/api/auth/.well-known/jwks.json",
  // Key rotation
  keyRotation: {
    enabled: true,
    interval: 60 * 60 * 24 * 7,  // 7 days
  },
}),
```

### Client Configuration

```typescript
import { jwtClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [jwtClient()],
});
```

### Get JWT

```typescript
// Get JWT for current session
const { data } = await authClient.jwt.getToken();
const jwt = data.token;
```

### Verify JWT (Server-Side)

```typescript
import { jwtVerify } from "jose";

// Get public key from JWKS endpoint
const response = await fetch("https://your-app.com/api/auth/.well-known/jwks.json");
const jwks = await response.json();

// Verify token
const { payload } = await jwtVerify(token, createRemoteJWKSet(
  new URL("https://your-app.com/api/auth/.well-known/jwks.json")
));

console.log(payload.sub);  // User ID
console.log(payload.role);  // Custom claim
```

### JWT for External Services

```typescript
// Generate JWT for third-party API
const { data } = await authClient.jwt.getToken({
  audience: "https://external-api.com",
  scope: "read:data write:data",
});
```

---

## OIDC Provider

Make your app an OpenID Connect provider for other applications.

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { oidcProvider } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    oidcProvider({
      // OIDC issuer URL
      issuer: "https://your-app.com",
      // Registered clients
      clients: [
        {
          clientId: "client-app-1",
          clientSecret: "secret",
          redirectUris: ["https://client-app.com/callback"],
          scopes: ["openid", "profile", "email"],
        },
      ],
      // Supported scopes
      scopes: ["openid", "profile", "email", "offline_access"],
      // Token settings
      accessTokenTTL: 60 * 60,  // 1 hour
      refreshTokenTTL: 60 * 60 * 24 * 30,  // 30 days
    }),
  ],
});
```

### v1.4.8+ OAuth 2.1 Compliance

```typescript
import { oauth21 } from "better-auth/plugins";

oidcProvider({
  // Enable OAuth 2.1 compliant mode
  oauth21: true,
  // Require PKCE for all clients
  requirePKCE: true,
}),
```

### OIDC Endpoints

Automatically created endpoints:

| Endpoint | Description |
|----------|-------------|
| `/.well-known/openid-configuration` | Discovery document |
| `/api/auth/oauth/authorize` | Authorization endpoint |
| `/api/auth/oauth/token` | Token endpoint |
| `/api/auth/oauth/userinfo` | UserInfo endpoint |
| `/api/auth/oauth/jwks` | JWKS endpoint |
| `/api/auth/oauth/revoke` | Token revocation |

### Client App Integration

```typescript
// In client application
const authUrl = new URL("https://your-app.com/api/auth/oauth/authorize");
authUrl.searchParams.set("client_id", "client-app-1");
authUrl.searchParams.set("redirect_uri", "https://client-app.com/callback");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", "openid profile email");
authUrl.searchParams.set("state", generateState());
authUrl.searchParams.set("code_challenge", codeChallenge);  // PKCE
authUrl.searchParams.set("code_challenge_method", "S256");

// Redirect user to authUrl
```

### Consent Screen Customization

```typescript
oidcProvider({
  // Custom consent page
  consentPage: "/oauth/consent",
  // Skip consent for first-party apps
  skipConsentForFirstParty: true,
}),
```

---

## Combining Token Plugins

```typescript
import { betterAuth } from "better-auth";
import { apiKey, bearer, jwt, oidcProvider } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    // API keys for server-to-server
    apiKey({
      prefix: "sk_",
      rateLimit: { window: 60000, max: 100 },
    }),
    // Bearer tokens for mobile apps
    bearer({
      expiresIn: 60 * 60 * 24 * 7,
      refreshToken: { enabled: true },
    }),
    // JWT for microservices
    jwt({
      algorithm: "RS256",
      expiresIn: "1h",
    }),
    // OIDC for third-party apps
    oidcProvider({
      issuer: "https://your-app.com",
      clients: [/* ... */],
    }),
  ],
});
```

---

## Common Issues

### API Key: "Invalid API key"
- Keys are hashed - original key only shown once on creation
- Check prefix matches configured prefix
- Verify key hasn't been revoked

### Bearer: "Token expired"
- Implement token refresh flow
- Check client timezone vs server timezone

### JWT: "Invalid signature"
- Verify JWKS endpoint is accessible
- Check algorithm matches (RS256 vs HS256)
- Key rotation may have occurred - refetch JWKS

### OIDC: "Invalid redirect_uri"
- Exact match required (including trailing slash)
- Register all redirect URIs in client config

### OIDC: "PKCE required"
- OAuth 2.1 mode requires PKCE
- Generate code_verifier and code_challenge on client

---

## Official Resources

- API Key: https://better-auth.com/docs/plugins/api-key
- Bearer Token: https://better-auth.com/docs/plugins/bearer
- JWT: https://better-auth.com/docs/plugins/jwt
- OIDC Provider: https://better-auth.com/docs/plugins/oidc-provider

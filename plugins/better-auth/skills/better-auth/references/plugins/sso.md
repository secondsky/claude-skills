# better-auth SSO Plugin (`@better-auth/sso`)

Single Sign-On with OIDC, OAuth2, and SAML 2.0 support. Production-ready with comprehensive security features.

---

## Installation

```bash
npm install @better-auth/sso
```

### Server Setup

```typescript
import { sso } from "@better-auth/sso";

export const auth = betterAuth({
    plugins: [sso()],
});
```

### Client Setup

```typescript
import { ssoClient } from "@better-auth/sso/client";

const authClient = createAuthClient({
    plugins: [ssoClient()],
});
```

Run `npx auth migrate` after setup.

---

## OIDC Provider Registration

```typescript
await authClient.sso.register({
    providerId: "okta",
    issuer: "https://your-org.okta.com",
    domain: "yourcompany.com",
    oidcConfig: {
        clientId: "your-client-id",
        clientSecret: "your-client-secret",
    },
});
```

### OIDC Discovery

Better Auth automatically fetches the discovery document from `{issuer}/.well-known/openid-configuration`. Most endpoint fields become optional — only `clientId` and `clientSecret` are required.

Auto-discovered fields: `authorizationEndpoint`, `tokenEndpoint`, `jwksEndpoint`, `userInfoEndpoint`, `discoveryEndpoint`, `tokenEndpointAuthentication`.

### Discovery Errors

| Code | Meaning |
|------|---------|
| `issuer_mismatch` | IdP reports different issuer |
| `discovery_incomplete` | Required fields missing |
| `discovery_not_found` | Discovery endpoint returned 404 |
| `discovery_timeout` | IdP did not respond (default: 10s) |
| `discovery_invalid_url` | Malformed URL |
| `discovery_untrusted_origin` | URL not in `trustedOrigins` |
| `discovery_invalid_json` | Empty or invalid JSON response |
| `unsupported_token_auth_method` | Only unsupported auth methods advertised |

### Trusted Origins

Discovery URLs must be in `trustedOrigins`:

```typescript
export const auth = betterAuth({
    trustedOrigins: [
        "https://your-org.okta.com",
        "https://accounts.google.com",
    ],
});

// Or dynamically
trustedOrigins: async (request) => {
    if (!request) return ["https://my-frontend.com"];
    if (request.url.endsWith("/sso/register")) {
        return await fetchOriginList();
    }
    return [];
},
```

---

## SAML Provider Registration

```typescript
await authClient.sso.register({
    providerId: "saml-provider",
    issuer: "https://idp.example.com",
    domain: "example.com",
    samlConfig: {
        entryPoint: "https://idp.example.com/sso",
        cert: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
        callbackUrl: "https://yourapp.com/api/auth/sso/saml2/callback/saml-provider",
        audience: "https://yourapp.com",
        wantAssertionsSigned: true,
        signatureAlgorithm: "sha256",
        digestAlgorithm: "sha256",
        mapping: {
            id: "nameID",
            email: "email",
            name: "displayName",
            firstName: "givenName",
            lastName: "surname",
        },
    },
});
```

### Get SP Metadata

```typescript
const response = await auth.api.spMetadata({
    query: {
        providerId: "saml-provider",
        format: "xml", // or "json"
    },
});
```

### Signed AuthnRequests

```typescript
samlConfig: {
    authnRequestsSigned: true,
    spMetadata: {
        privateKey: "-----BEGIN RSA PRIVATE KEY-----\n...",
    },
},
```

---

## Sign In with SSO

```typescript
// By email domain
await authClient.signIn.sso({
    email: "user@example.com",
    callbackURL: "/dashboard",
});

// By domain
await authClient.signIn.sso({
    domain: "example.com",
    callbackURL: "/dashboard",
});

// By organization slug
await authClient.signIn.sso({
    organizationSlug: "example-org",
    callbackURL: "/dashboard",
});

// By provider ID
await authClient.signIn.sso({
    providerId: "example-provider-id",
    callbackURL: "/dashboard",
});

// With login hint
await authClient.signIn.sso({
    providerId: "example-provider-id",
    loginHint: "user@example.com",
    callbackURL: "/dashboard",
});
```

---

## User Provisioning

Run custom logic when users sign in through SSO.

```typescript
sso({
    provisionUser: async ({ user, userInfo, token, provider }) => {
        await updateUserProfile(user.id, {
            department: userInfo.attributes?.department,
        });
    },
    provisionUserOnEveryLogin: true,
});
```

`provisionUser` receives: `user`, `userInfo`, `token` (OIDC only), `provider`.

---

## Organization Provisioning

Automatically manage org memberships when SSO providers are linked to organizations.

```typescript
sso({
    organizationProvisioning: {
        disabled: false,
        defaultRole: "member",
        getRole: async ({ user, userInfo, provider }) => {
            if (userInfo.attributes?.jobTitle?.toLowerCase().includes("manager")) {
                return "admin";
            }
            return "member";
        },
    },
});
```

Link provider to organization during registration:

```typescript
await auth.api.registerSSOProvider({
    body: {
        providerId: "acme-corp-saml",
        issuer: "https://acme.okta.com",
        domain: "acmecorp.com",
        organizationId: "org_acme_id",
        samlConfig: { /* ... */ },
    },
    headers: await headers(),
});
```

---

## SAML Single Logout (SLO)

```typescript
sso({
    saml: {
        enableSingleLogout: true,
        wantLogoutRequestSigned: true,
        wantLogoutResponseSigned: true,
    },
});
```

Supports both SP-initiated and IdP-initiated SLO.

---

## SAML Security

### InResponseTo Validation

Enabled by default in v1.6.0+. Prevents replay attacks on SP-initiated flows.

```typescript
sso({
    saml: {
        enableInResponseToValidation: true,  // default in v1.6+
        allowIdpInitiated: false,            // reject IdP-initiated
        requestTTL: 10 * 60 * 1000,          // 10 minutes
    },
});
```

Error redirects:
- `?error=invalid_saml_response` — Unknown or expired request ID
- `?error=invalid_saml_response` — Provider mismatch
- `?error=unsolicited_response` — IdP-initiated not allowed

### Assertion Replay Protection

Always enabled. Each Assertion ID is tracked and rejected if reused. Uses database verification table (works in multi-instance deployments).

Error: `?error=replay_detected`

### Timestamp Validation

```typescript
sso({
    saml: {
        clockSkew: 5 * 60 * 1000,     // 5 minutes tolerance (default)
        requireTimestamps: true,       // Reject without timestamps (SAML2Int)
    },
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `clockSkew` | `300000` (5 min) | Clock skew tolerance in ms |
| `requireTimestamps` | `false` | Reject assertions without timestamps |

### Algorithm Validation

```typescript
sso({
    saml: {
        algorithms: {
            onDeprecated: "warn", // "warn" | "reject" | "allow"
        },
    },
});
```

Deprecated algorithms: RSA-SHA1, SHA1, RSA 1.5, 3DES.

Supported: RSA-SHA256/384/512, ECDSA-SHA256/384/512, SHA256/384/512.

### Size Limits

```typescript
sso({
    saml: {
        maxResponseSize: 512 * 1024, // 512KB (default: 256KB)
        maxMetadataSize: 100 * 1024, // 100KB
    },
});
```

---

## Domain Verification

Automatically trust SSO providers by validating domain ownership via DNS.

```typescript
// Server
sso({ domainVerification: { enabled: true } });

// Client
ssoClient({ domainVerification: { enabled: true } });
```

Run `npx auth migrate` after enabling.

### Verification Steps

1. Register provider → receive verification token
2. Create DNS TXT record: `_better-auth-token-{providerId}` → token value
3. Submit verification:

```typescript
await authClient.sso.verifyDomain({ providerId: "acme-corp" });
```

Tokens expire after 1 week. Request new token:

```typescript
await authClient.sso.requestDomainVerification({ providerId: "acme-corp" });
```

Verified domains are trusted for automatic account linking.

---

## Shared Redirect URI

All OIDC providers share a single callback URL:

```typescript
sso({ redirectURI: "/sso/callback" });
```

Per-provider endpoints still work for backward compatibility.

---

## SAML Endpoints

- **SP Metadata**: `/api/auth/sso/saml2/sp/metadata?providerId={providerId}`
- **SAML Callback**: `/api/auth/sso/saml2/callback/{providerId}` (GET + POST)

### IdP-Initiated SSO (Next.js)

Create a route handler to prevent 404:

```typescript
// app/api/auth/sso/saml2/callback/[providerId]/route.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    return auth.handler(req);
}

export async function GET(req: Request) {
    return NextResponse.redirect(new URL("/", req.url));
}
```

---

## Default SSO Provider

Configure provider at auth setup time (no database registration needed):

```typescript
sso({
    defaultSSO: [{
        providerId: "default-saml",
        domain: "http://your-app.com",
        samlConfig: {
            issuer: "https://your-app.com",
            entryPoint: "https://idp.example.com/sso",
            cert: "-----BEGIN CERTIFICATE-----\n...",
            callbackUrl: "http://localhost:3000/api/auth/sso/saml2/sp/acs",
        },
    }],
});
```

Used when no matching provider is found in the database.

---

## SAML Attribute Mapping

```typescript
mapping: {
    id: "nameID",           // default: "nameID"
    email: "email",         // default: "email" or "nameID"
    name: "displayName",    // default: "displayName"
    firstName: "givenName", // default: "givenName"
    lastName: "surname",    // default: "surname"
    extraFields: {
        department: "department",
        role: "jobTitle",
    },
},
```

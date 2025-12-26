# better-auth Enterprise Plugins

Complete guide for enterprise features: Organizations, SSO/SAML, SCIM, and Admin Dashboard.

---

## Organizations (Multi-Tenancy)

### Installation

```bash
bun add better-auth
```

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    organization({
      // Allow users to create organizations
      allowUserToCreateOrganization: true,
      // Organization creation requires email verification
      requireEmailVerification: false,
      // Maximum organizations per user
      maximumOrganizationsPerUser: 5,
      // Custom roles
      roles: {
        owner: ["*"],  // All permissions
        admin: ["invite", "remove", "update"],
        member: ["read"],
      },
    }),
  ],
});
```

### Client Configuration

```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
```

### Create Organization

```typescript
const { data: org } = await authClient.organization.create({
  name: "Acme Corp",
  slug: "acme-corp",  // Unique identifier
});
```

### Invite Members

```typescript
// Invite by email
await authClient.organization.inviteMember({
  organizationId: org.id,
  email: "new@member.com",
  role: "member",  // owner, admin, member
});

// Invited user receives email and can accept
await authClient.organization.acceptInvitation({
  invitationId: "invitation-id",
});
```

### Manage Members

```typescript
// List members
const { data: members } = await authClient.organization.listMembers({
  organizationId: org.id,
});

// Update role
await authClient.organization.updateMemberRole({
  organizationId: org.id,
  memberId: "member-id",
  role: "admin",
});

// Remove member
await authClient.organization.removeMember({
  organizationId: org.id,
  memberId: "member-id",
});
```

### Active Organization

```typescript
// Set active organization (stored in session)
await authClient.organization.setActive({
  organizationId: org.id,
});

// Get active organization
const { data: session } = useSession();
const activeOrg = session?.activeOrganization;
```

### Check Permissions

```typescript
// Server-side
const session = await auth.api.getSession({ headers: req.headers });
const hasPermission = session?.activeOrganization?.role === "admin";

// Custom permission check
const canInvite = auth.api.hasPermission({
  userId: session.user.id,
  organizationId: org.id,
  permission: "invite",
});
```

---

## SSO / SAML

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { sso } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    sso({
      // Enable SAML
      saml: {
        // Your app as Service Provider (SP)
        issuer: "https://your-app.com",
        // Callback URL
        callbackURL: "/api/auth/sso/callback",
        // SAML response handling
        signatureAlgorithm: "sha256",
      },
    }),
  ],
});
```

### Configure Identity Provider

```typescript
// Add a SAML IdP (Okta, Azure AD, etc.)
await auth.api.sso.addProvider({
  provider: "saml",
  name: "Okta SSO",
  issuer: "https://your-okta-domain.okta.com",
  ssoUrl: "https://your-okta-domain.okta.com/app/.../sso/saml",
  certificate: `-----BEGIN CERTIFICATE-----
MIIDpDCCAoygAwIBAgIGAX...
-----END CERTIFICATE-----`,
  // Map SAML attributes to user fields
  attributeMapping: {
    email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  },
});
```

### v1.4.7+ SAML Features

```typescript
sso({
  saml: {
    // Clock skew tolerance for timestamp validation
    clockSkewTolerance: 60,  // seconds (default: 0)
    // Validate InResponseTo attribute
    validateInResponseTo: true,
    // OIDC discovery for automatic configuration
    oidcDiscovery: true,
  },
}),
```

### Initiate SSO Login

```typescript
// Redirect to IdP
await authClient.signIn.sso({
  provider: "saml",
  organizationSlug: "acme-corp",  // If organization-specific
});
```

---

## SCIM (User Provisioning)

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { scim } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    scim({
      // SCIM endpoint base path
      path: "/api/scim",
      // Bearer token for SCIM client
      bearerToken: process.env.SCIM_BEARER_TOKEN!,
    }),
  ],
});
```

### SCIM Endpoints

SCIM 2.0 endpoints are automatically created:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scim/Users` | GET | List users |
| `/api/scim/Users` | POST | Create user |
| `/api/scim/Users/:id` | GET | Get user |
| `/api/scim/Users/:id` | PUT | Replace user |
| `/api/scim/Users/:id` | PATCH | Update user |
| `/api/scim/Users/:id` | DELETE | Delete user |
| `/api/scim/Groups` | GET | List groups |
| `/api/scim/Groups` | POST | Create group |

### v1.4.4+ SCIM Features

```typescript
scim({
  // Support SCIM+json media type
  supportScimMediaType: true,  // v1.4.4+
}),
```

### Configure IdP for SCIM

Example Okta configuration:

1. Go to Okta Admin → Applications → Your App → Provisioning
2. Enable SCIM
3. SCIM Base URL: `https://your-app.com/api/scim`
4. Authentication: Bearer Token
5. Enter your SCIM_BEARER_TOKEN

---

## Admin Dashboard

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    admin({
      // Users with these emails are admins
      adminUsers: ["admin@your-company.com"],
      // Or use roles
      adminRoles: ["admin", "super-admin"],
    }),
  ],
});
```

### v1.4.7+ Admin Features

```typescript
admin({
  // Admin role with granular permissions for user updates
  permissions: {
    updateUser: ["email", "name", "image"],  // Fields admin can update
  },
}),
```

### Client Configuration

```typescript
import { adminClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [adminClient()],
});
```

### Admin Operations

```typescript
// List all users (paginated)
const { data: users } = await authClient.admin.listUsers({
  limit: 50,
  offset: 0,
});

// Get user details
const { data: user } = await authClient.admin.getUser({
  userId: "user-id",
});

// Update user
await authClient.admin.updateUser({
  userId: "user-id",
  data: {
    name: "New Name",
    email: "new@email.com",
  },
});

// Ban user
await authClient.admin.banUser({
  userId: "user-id",
  reason: "Violation of ToS",
});

// Unban user
await authClient.admin.unbanUser({
  userId: "user-id",
});

// Delete user
await authClient.admin.deleteUser({
  userId: "user-id",
});
```

### List Sessions

```typescript
// List all sessions for a user
const { data: sessions } = await authClient.admin.listSessions({
  userId: "user-id",
});

// Revoke a session
await authClient.admin.revokeSession({
  sessionId: "session-id",
});

// Revoke all sessions for a user
await authClient.admin.revokeAllSessions({
  userId: "user-id",
});
```

---

## Combining Enterprise Plugins

```typescript
import { betterAuth } from "better-auth";
import { organization, sso, scim, admin } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    organization({
      allowUserToCreateOrganization: false,  // Admin-only
      roles: {
        owner: ["*"],
        admin: ["invite", "remove", "update", "manage-sso"],
        member: ["read"],
      },
    }),
    sso({
      saml: {
        issuer: "https://your-app.com",
        callbackURL: "/api/auth/sso/callback",
        clockSkewTolerance: 60,
      },
    }),
    scim({
      path: "/api/scim",
      bearerToken: process.env.SCIM_BEARER_TOKEN!,
    }),
    admin({
      adminUsers: ["admin@your-company.com"],
    }),
  ],
});
```

---

## Common Issues

### Organizations: "User already in organization"
- Check if user is already a member with a different role
- Use `updateMemberRole` instead of re-inviting

### SSO: "SAML signature validation failed"
- Ensure certificate is correct and not expired
- Check signature algorithm matches IdP configuration

### SSO: "Clock skew error" (v1.4.7+)
- Use `clockSkewTolerance` option to allow for time drift
- Ensure server time is synced (NTP)

### SCIM: "401 Unauthorized"
- Verify bearer token matches
- Check token is sent in `Authorization: Bearer <token>` header

### Admin: "Not authorized"
- Ensure user email is in `adminUsers` array
- Or user has role listed in `adminRoles`

---

## Official Resources

- Organizations: https://better-auth.com/docs/plugins/organization
- SSO/SAML: https://better-auth.com/docs/plugins/sso
- SCIM: https://better-auth.com/docs/plugins/scim
- Admin: https://better-auth.com/docs/plugins/admin

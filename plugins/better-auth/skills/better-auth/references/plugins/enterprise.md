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

SSO is now a separate package (`@better-auth/sso`) with production-ready security hardening.

> **Load `references/plugins/sso.md`** for the complete SSO guide including OIDC discovery, SAML SLO, domain verification, organization provisioning, and security configuration.

### Server Configuration

```typescript
import { betterAuth } from "better-auth";
import { sso } from "@better-auth/sso";

export const auth = betterAuth({
  plugins: [
    sso({
      saml: {
        enableSingleLogout: true,
        enableInResponseToValidation: true,  // default ON in v1.6+
        clockSkew: 60 * 1000,
      },
    }),
  ],
});
```

### Client Configuration

```typescript
import { ssoClient } from "@better-auth/sso/client";

const authClient = createAuthClient({
  plugins: [ssoClient()],
});
```

### Register Provider

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

### Sign In with SSO

```typescript
await authClient.signIn.sso({
  email: "user@example.com",
  callbackURL: "/dashboard",
});
```

### Key SSO Features (v1.5+)

- **SAML Single Logout** (SP-initiated and IdP-initiated)
- **Signed AuthnRequests** with configurable algorithms
- **OIDC Discovery** — auto-fetch endpoints from `/.well-known/openid-configuration`
- **Domain Verification** — DNS-based automatic trust
- **Organization Provisioning** — auto-membership with role assignment
- **Provider CRUD** — list, get, update, delete via API
- **InResponseTo validation** — replay attack prevention (default ON in v1.6+)
- **Algorithm validation** — warn/reject deprecated crypto
- **Size limits** — configurable max SAML response/metadata size

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
import { organization, scim, admin } from "better-auth/plugins";
import { sso } from "@better-auth/sso";

export const auth = betterAuth({
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
      roles: {
        owner: ["*"],
        admin: ["invite", "remove", "update", "manage-sso"],
        member: ["read"],
      },
    }),
    sso({
      saml: {
        enableSingleLogout: true,
        enableInResponseToValidation: true,
        clockSkew: 60 * 1000,
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
- Use `clockSkew` option to allow for time drift (measured in milliseconds)
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

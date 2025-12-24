# Cloudflare Access Policy Setup Guide

Complete guide to configuring Cloudflare Zero Trust Access policies for protecting Worker applications.

---

## Overview

Cloudflare Access protects your applications by requiring authentication before users can access them. This guide walks through creating and configuring Access policies from scratch.

**What You'll Learn**:
- Creating Access applications
- Configuring authentication policies
- Setting up identity providers
- Testing and troubleshooting

---

## Prerequisites

1. **Cloudflare Account** with Zero Trust enabled
2. **Custom Domain** pointed to your Worker
3. **Worker Application** deployed
4. **Identity Provider** (optional but recommended)

---

## Step 1: Enable Zero Trust

### First-Time Setup

1. Go to https://one.dash.cloudflare.com/
2. Select your account
3. Navigate to **Zero Trust** (left sidebar)
4. If first time, click **"Get Started"**
5. Choose a **team name** (e.g., "acme-corp")
   - This becomes your Access domain: `acme-corp.cloudflareaccess.com`
   - **IMPORTANT**: Cannot be changed later!

### Team Name Best Practices

- Use company/organization name
- Lowercase, no spaces
- Hyphen-separated words
- Short and memorable
- Examples: `acme`, `acme-corp`, `acme-prod`

---

## Step 2: Configure Identity Provider (Optional)

Identity providers add organization-specific authentication. Without one, Access uses one-time PIN codes via email.

### Supported Providers

- **Azure AD / Entra ID** (Microsoft 365)
- **Google Workspace**
- **Okta**
- **GitHub**
- **Generic OIDC**
- **Generic SAML**

### Adding Azure AD (Example)

1. **In Azure**:
   - Azure Portal > Azure Active Directory > App Registrations
   - New Registration
   - Name: "Cloudflare Access"
   - Redirect URI: `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`
   - Copy **Application (client) ID**
   - Create **Client Secret**, copy value

2. **In Cloudflare**:
   - Zero Trust > Settings > Authentication
   - Login Methods > Add new
   - Select **Azure AD**
   - Enter:
     - Name: "Azure AD"
     - Application ID: (from Azure)
     - Client Secret: (from Azure)
     - Directory (tenant) ID: (from Azure)
   - Save

3. **Test**:
   - Click **"Test"** button
   - Should redirect to Microsoft login
   - Success message after authentication

### Adding Google Workspace (Example)

1. **In Google Cloud Console**:
   - Create new OAuth 2.0 Client ID
   - Type: Web application
   - Authorized redirect URI: `https://<team>.cloudflareaccess.com/cdn-cgi/access/callback`
   - Copy **Client ID** and **Client Secret**

2. **In Cloudflare**:
   - Zero Trust > Settings > Authentication
   - Add new > Google Workspace
   - Enter Client ID and Secret
   - (Optional) Restrict to specific domain

3. **Test**:
   - Test button should open Google login

---

## Step 3: Create Access Application

### Basic Setup

1. **Navigate to Applications**:
   - Zero Trust > Access > Applications
   - Click **"Add an application"**

2. **Choose Application Type**:
   - Select **"Self-hosted"**
   - (Not SaaS or Warp)

3. **Configure Application**:

   **Application Name**: Descriptive name
   ```
   Example: "API Dashboard"
   ```

   **Session Duration**: How long users stay logged in
   ```
   Options: 1 hour, 12 hours, 24 hours, 30 days
   Recommended: 24 hours for user apps, 1 hour for admin panels
   ```

   **Application Domain**: Your Worker's domain
   ```
   Examples:
   - api.example.com
   - dashboard.example.com
   - *.example.com (wildcard)
   ```

   **Path** (optional): Specific URL path
   ```
   Examples:
   - /admin (protect only admin routes)
   - /api (protect only API routes)
   - / (protect entire domain)
   ```

4. **Copy Application Audience (AUD)**:
   - After creating, copy the **Application Audience** tag
   - Example: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`
   - You'll need this for your Worker configuration

---

## Step 4: Create Access Policy

Policies define **who** can access your application.

### Policy Structure

```
┌─────────────┐
│   Include   │ ← Who gets access (required)
├─────────────┤
│   Require   │ ← Additional requirements (optional)
├─────────────┤
│   Exclude   │ ← Who is explicitly denied (optional)
└─────────────┘
```

**Logic**: `(Include AND Require) AND NOT Exclude`

### Creating a Policy

1. **Add Policy**:
   - In your application, click **"Add a policy"**

2. **Policy Name**: Descriptive name
   ```
   Examples:
   - "Employees Only"
   - "Admin Access"
   - "API Access - All Users"
   ```

3. **Decision**: Allow or Block
   ```
   - Allow: Grant access if rules match
   - Block: Deny access (for deny-lists)
   ```

### Example Policies

#### Example 1: Email Domain

**Use Case**: Only company employees

**Policy**:
```
Include:
  Emails ending in: @company.com
```

**Result**: Only users with `@company.com` emails can access.

---

#### Example 2: Specific Emails

**Use Case**: Small team, specific users

**Policy**:
```
Include:
  Emails:
    - alice@example.com
    - bob@example.com
    - charlie@example.com
```

---

#### Example 3: Group Membership

**Use Case**: Only developers (requires IdP with groups)

**Policy**:
```
Include:
  Emails ending in: @company.com

Require:
  Groups: developers
```

**Result**: Must be company employee AND in "developers" group.

---

#### Example 4: Multiple Groups (OR logic)

**Use Case**: Developers or Admins

**Policy 1**:
```
Name: Developers
Include:
  Emails ending in: @company.com
  Groups: developers
```

**Policy 2**:
```
Name: Admins
Include:
  Emails ending in: @company.com
  Groups: admin
```

**Result**: Multiple policies create OR logic (either developers OR admins).

---

#### Example 5: Service Tokens

**Use Case**: Backend service + users

**Policy**:
```
Include:
  Emails ending in: @company.com
  Service Auth: backend-service-token
```

**Result**: Both company employees AND the service token can access.

---

#### Example 6: Country Restriction

**Use Case**: Geo-fencing

**Policy**:
```
Include:
  Emails ending in: @company.com

Require:
  Country: United States, Canada, United Kingdom
```

**Result**: Company employees only from specified countries.

---

#### Example 7: IP Whitelist

**Use Case**: VPN or office network required

**Policy**:
```
Include:
  Emails ending in: @company.com

Require:
  IP ranges:
    - 203.0.113.0/24
    - 198.51.100.0/24
```

**Result**: Must be company employee AND on specified IP ranges.

---

### Policy Selector Options

**Include/Require/Exclude Options**:

- **Emails** - Specific email addresses
- **Emails ending in** - Domain-based (e.g., `@company.com`)
- **Email domains** - Multiple domains
- **Everyone** - Allow all (not recommended for production!)
- **IP ranges** - CIDR notation
- **Country** - ISO country codes
- **Valid certificate** - mTLS authentication
- **Common Name** - Certificate CN field
- **Service Auth** - Service tokens
- **Groups** - IdP groups (requires IdP)
- **GitHub Organization** - GitHub org membership
- **Azure Groups** - Azure AD groups
- **Okta Groups** - Okta groups
- **SAML Groups** - Generic SAML groups

---

## Step 5: Configure Worker Domain

### DNS Setup

Your custom domain must point to your Worker for Access to work.

**Option 1: Workers Custom Domain**:

1. In Cloudflare Dashboard (not Zero Trust):
   - Workers & Pages > Your Worker
   - Settings > Triggers > Custom Domains
   - Add Custom Domain: `api.example.com`
   - Cloudflare handles DNS automatically

**Option 2: Manual DNS + Route**:

1. Add DNS record:
   ```
   Type: AAAA
   Name: api
   Content: 100:: (IPv6 placeholder)
   Proxy: Enabled (orange cloud)
   ```

2. Add Worker route:
   ```
   Route: api.example.com/*
   Worker: your-worker-name
   ```

---

## Step 6: Configure Worker Code

### Environment Variables

**wrangler.jsonc**:
```jsonc
{
  "name": "my-worker",
  "vars": {
    "ACCESS_TEAM_DOMAIN": "acme-corp.cloudflareaccess.com",
    "ACCESS_AUD": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
  }
}
```

### Worker Code (Hono)

```typescript
import { Hono } from 'hono'
import { cloudflareAccess } from '@hono/cloudflare-access'

type Env = {
  ACCESS_TEAM_DOMAIN: string
  ACCESS_AUD: string
}

const app = new Hono<{ Bindings: Env }>()

// Public routes
app.get('/', (c) => c.text('Public page'))

// Protected routes
app.use(
  '/admin/*',
  cloudflareAccess({
    domain: (c) => c.env.ACCESS_TEAM_DOMAIN,
  })
)

app.get('/admin/dashboard', (c) => {
  const { email } = c.get('accessPayload')
  return c.text(`Welcome, ${email}!`)
})

export default app
```

### Deploy

```bash
npx wrangler deploy
```

---

## Step 7: Test Access

### Manual Testing

1. **Open Protected URL**:
   ```
   https://api.example.com/admin/dashboard
   ```

2. **Expect Redirect**:
   - Redirected to `https://acme-corp.cloudflareaccess.com/...`
   - Shows login page or IdP login

3. **Authenticate**:
   - Enter email (or login via IdP)
   - Receive verification code (if using email)
   - Or complete IdP authentication

4. **Access Granted**:
   - Redirected back to `https://api.example.com/admin/dashboard`
   - Session cookie set (`CF_Authorization`)
   - Page loads successfully

### Testing with curl

```bash
# Get Access login page
curl -I https://api.example.com/admin/dashboard
# Should return 302 redirect to cloudflareaccess.com

# Test with service token
curl -H "CF-Access-Client-Id: abc123.access" \
     -H "CF-Access-Client-Secret: your-secret" \
     https://api.example.com/admin/dashboard
# Should return 200 with content
```

---

## Step 8: Monitor Access Logs

### Viewing Logs

1. **Navigate to Logs**:
   - Zero Trust > Logs > Access

2. **Log Details**:
   - Timestamp
   - User email
   - Application name
   - Action (login, allowed, blocked)
   - Country, IP address
   - User agent

3. **Filter Logs**:
   - By application
   - By user
   - By action (allowed/blocked)
   - By date range

### Audit Trail

Access logs provide:
- Who accessed what, when
- Failed authentication attempts
- Service token usage
- Policy changes

**Retention**: 180 days (6 months)

---

## Common Configurations

### Configuration 1: Public Frontend + Protected API

**Setup**:
- Frontend: `www.example.com` (public, no Access)
- API: `api.example.com` (protected with Access)

**Access Application**:
```
Application Domain: api.example.com
Path: /
Policy: Emails ending in @company.com
```

**Worker**: CORS configured to allow `www.example.com`

---

### Configuration 2: Admin Panel Only

**Setup**:
- Public site: `example.com/*` (no Access)
- Admin panel: `example.com/admin/*` (protected)

**Access Application**:
```
Application Domain: example.com
Path: /admin
Policy:
  Include: Emails ending in @company.com
  Require: Groups - admin
```

---

### Configuration 3: Multi-Environment

**Development**:
```
Application: dev-api.example.com
Policy: Everyone (or specific test emails)
Session Duration: 30 days (convenience)
```

**Staging**:
```
Application: staging-api.example.com
Policy: Emails ending in @company.com
Session Duration: 24 hours
```

**Production**:
```
Application: api.example.com
Policy:
  Include: Emails ending in @company.com
  Require: Groups - production-access
Session Duration: 12 hours
```

---

## Troubleshooting

### Problem: Infinite Redirect Loop

**Symptoms**:
- Browser keeps redirecting between app and Access
- Never able to login

**Causes**:
- Worker not validating JWT properly
- CORS issues blocking cookies
- Incorrect Access domain configuration

**Solutions**:
1. Check Worker validates `CF-Access-JWT-Assertion` header
2. Ensure CORS allows credentials
3. Verify `ACCESS_TEAM_DOMAIN` matches Access configuration

---

### Problem: "Access Denied"

**Symptoms**:
- User can login but gets "Access Denied" message

**Causes**:
- User doesn't meet policy requirements
- Policy misconfigured
- IdP groups not syncing

**Solutions**:
1. Check Access logs to see why denied
2. Verify user meets all policy criteria
3. Test policy with "Test policy" feature
4. Check IdP group membership

---

### Problem: Service Token Not Working

**Symptoms**:
- Service token returns 401

**Causes**:
- Service token not added to policy
- Wrong header names
- Token expired

**Solutions**:
1. Verify token is in policy's "Service Auth" section
2. Use correct headers: `CF-Access-Client-Id`, `CF-Access-Client-Secret`
3. Check token hasn't expired in dashboard

---

## Best Practices

### Security

1. **Use Identity Provider** - Better security than email OTP
2. **Require MFA** - Enable in IdP settings
3. **Short Session Duration** - 12-24 hours for sensitive apps
4. **Group-Based Access** - Use IdP groups, not individual emails
5. **Regular Audits** - Review Access logs monthly

### Performance

1. **Minimize Policies** - Fewer policies = faster evaluation
2. **Use Wildcards** - `*.example.com` instead of multiple apps
3. **Cache Friendly** - Access adds session cookies that cache well

### Maintenance

1. **Document Policies** - Note why each policy exists
2. **Review Access** - Quarterly review who has access
3. **Rotate Service Tokens** - Every 3-6 months
4. **Test After Changes** - Always test policy changes
5. **Separate Environments** - Different Access apps for dev/staging/prod

---

## Resources

- [Cloudflare Access Policies](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Access Applications](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Identity Providers](https://developers.cloudflare.com/cloudflare-one/identity/)
- [Access Logs](https://developers.cloudflare.com/cloudflare-one/insights/logs/)

---

**Last Updated**: 2025-10-28
**Cloudflare Docs**: ✅ Verified

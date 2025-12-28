# Cloudflare Access Integration with R2

**Last Updated**: 2025-12-27

Restrict R2 bucket access using Cloudflare Access for identity-based authentication. Implement Zero Trust security with user, group, and application-level policies.

---

## Overview

Cloudflare Access provides identity-based access control for R2 buckets, allowing you to restrict access to specific users, groups, or applications within your organization. This enables Zero Trust security for internal tools, employee-only content, and sensitive data.

**Key Benefits**:
- **Zero Trust Security** - Verify identity before granting access
- **SSO Integration** - SAML, OAuth, OIDC providers (Google, Okta, Azure AD)
- **Granular Policies** - User, group, IP, device, and location-based rules
- **Audit Logging** - Track all access attempts
- **No VPN Required** - Secure access from anywhere
- **Multi-factor Authentication** - Enforce MFA for sensitive data

**Use Cases**:
- Internal file storage (HR documents, financials)
- Employee-only resources (training videos, company files)
- Partner/vendor access (restricted file sharing)
- Development/staging environments
- Compliance-required access controls

---

## Architecture Overview

```
┌─────────────────┐
│ User Browser    │
│ (Employee)      │
└────────┬────────┘
         │ 1. Request r2.example.com/file.pdf
         ↓
┌─────────────────┐
│ Cloudflare      │
│ Access          │◄──── 2. Check policy
│                 │
└────────┬────────┘
         │ 3. Redirect to IdP if not authenticated
         ↓
┌─────────────────┐
│ Identity        │
│ Provider        │ (Google, Okta, Azure AD)
│ (SSO)           │
└────────┬────────┘
         │ 4. User authenticates
         ↓
┌─────────────────┐
│ Cloudflare      │
│ Access          │◄──── 5. Validate identity
└────────┬────────┘
         │ 6. Issue JWT token
         ↓
┌─────────────────┐
│ R2 Bucket       │
│ (Protected)     │◄──── 7. Access granted
└─────────────────┘
```

---

## Setup Cloudflare Access for R2

### Step 1: Enable Cloudflare Access

**Dashboard Steps**:
1. Navigate to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application**
3. Select **Self-hosted**
4. Configure application details:
   - **Application name**: "Employee File Storage"
   - **Session duration**: 24 hours
   - **Application domain**: `files.example.com` (custom domain for R2)

### Step 2: Configure Identity Provider

**Add SSO Provider**:
1. Go to **Zero Trust** → **Settings** → **Authentication**
2. Click **Add new** under Login methods
3. Select provider (Google, Okta, Azure AD, etc.)
4. Configure OAuth/SAML settings
5. Test authentication

**Supported Providers**:
- Google Workspace
- Okta
- Azure AD (Microsoft Entra)
- OneLogin
- GitHub
- Generic SAML/OIDC

### Step 3: Create Access Policies

**Policy Types**:
- **Allow**: Grant access to matching users
- **Block**: Deny access to matching users
- **Bypass**: Skip Access for specific scenarios
- **Service Auth**: API tokens for service-to-service

**Example Policy: Allow Employees**

```
Policy Name: Employee Access
Action: Allow

Include:
- Emails ending in @company.com

Exclude:
- Email: contractor@company.com

Require:
- Multi-factor authentication
```

**Dashboard Configuration**:
1. In application settings, click **Add a policy**
2. Configure include rules (who should have access)
3. Configure exclude rules (who should be denied)
4. Add require rules (additional requirements like MFA)

### Step 4: Configure R2 Custom Domain

**Map Custom Domain to R2 Bucket**:

```bash
# Create custom domain for R2 bucket
bunx wrangler r2 bucket domain add my-bucket files.example.com
```

**Dashboard Steps**:
1. R2 → Select bucket → **Settings**
2. Scroll to **Custom Domains**
3. Add domain: `files.example.com`
4. Configure DNS (CNAME to `<bucket>.r2.cloudflarestorage.com`)

### Step 5: Apply Access Policy to R2 Domain

**Dashboard Steps**:
1. **Zero Trust** → **Access** → **Applications** → Your application
2. Verify **Application domain** matches R2 custom domain
3. Policies will automatically protect all requests to domain

---

## Access Policies Examples

### Policy 1: Employees Only

```
Action: Allow

Include:
- Emails ending in @company.com

Require:
- Country: United States
- Multi-factor authentication
```

**Use Case**: Restrict access to US-based employees with MFA

### Policy 2: Specific Groups

```
Action: Allow

Include:
- Group: Finance Team
- Group: Executives

Require:
- Device Posture: Corporate managed
```

**Use Case**: Only finance team and executives on corporate devices

### Policy 3: IP Allowlist

```
Action: Allow

Include:
- IP range: 203.0.113.0/24 (Office IP)
- Email: remote-worker@company.com

Require:
- Multi-factor authentication (for remote workers)
```

**Use Case**: Office network or specific remote workers with MFA

### Policy 4: Partner Access

```
Action: Allow

Include:
- Email: partner1@vendor.com
- Email: partner2@vendor.com

Require:
- Valid client certificate
- Session duration: 1 hour
```

**Use Case**: Temporary partner access with certificate authentication

### Policy 5: Service Tokens (API Access)

```
Action: Service Auth

Service Tokens:
- Name: Backup Service
- Name: Analytics Pipeline
```

**Use Case**: Automated systems accessing R2 with service tokens

---

## Workers Integration with Access

### Validate Access JWT in Workers

```typescript
import { Hono } from 'hono';

type Bindings = {
  MY_BUCKET: R2Bucket;
  ACCESS_AUD: string;  // Cloudflare Access audience tag
};

const app = new Hono<{ Bindings: Bindings }>();

// Validate Cloudflare Access JWT
async function validateAccessToken(
  request: Request,
  env: Bindings
): Promise<{ valid: boolean; email?: string; groups?: string[] }> {
  const cookieHeader = request.headers.get('Cookie');

  if (!cookieHeader) {
    return { valid: false };
  }

  // Extract Access JWT from cookie
  const cfAccessToken = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('CF_Authorization='))
    ?.split('=')[1];

  if (!cfAccessToken) {
    return { valid: false };
  }

  // Verify JWT with Cloudflare's public keys
  const certsUrl = 'https://example.cloudflareaccess.com/cdn-cgi/access/certs';
  const certsResponse = await fetch(certsUrl);
  const certs = await certsResponse.json();

  // Decode and verify JWT (use jose library)
  try {
    const { payload } = await verifyJWT(cfAccessToken, certs, env.ACCESS_AUD);

    return {
      valid: true,
      email: payload.email,
      groups: payload.groups || [],
    };
  } catch (error) {
    console.error('JWT validation failed:', error);
    return { valid: false };
  }
}

// Protected endpoint
app.get('/files/:filename', async (c) => {
  // Validate Access token
  const auth = await validateAccessToken(c.req.raw, c.env);

  if (!auth.valid) {
    return c.json({ error: 'Unauthorized - Cloudflare Access required' }, 401);
  }

  // Check group-based permissions
  const filename = c.req.param('filename');

  if (filename.startsWith('finance/') && !auth.groups?.includes('Finance Team')) {
    return c.json({ error: 'Forbidden - Finance Team access required' }, 403);
  }

  // Fetch file from R2
  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  // Log access for audit trail
  console.log(`File accessed: ${filename} by ${auth.email}`);

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    },
  });
});

export default app;
```

### Service Token Authentication

```typescript
// Service-to-service access with service tokens
app.get('/api/files/:filename', async (c) => {
  const serviceToken = c.req.header('CF-Access-Client-Id');
  const serviceSecret = c.req.header('CF-Access-Client-Secret');

  if (!serviceToken || !serviceSecret) {
    return c.json({ error: 'Service token required' }, 401);
  }

  // Validate service token with Access
  const validation = await fetch(
    'https://example.cloudflareaccess.com/cdn-cgi/access/token',
    {
      headers: {
        'CF-Access-Client-Id': serviceToken,
        'CF-Access-Client-Secret': serviceSecret,
      },
    }
  );

  if (!validation.ok) {
    return c.json({ error: 'Invalid service token' }, 401);
  }

  // Proceed with file access
  const filename = c.req.param('filename');
  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(object.body);
});
```

---

## Audit Logging

### Enable Access Logs

**Dashboard Steps**:
1. **Zero Trust** → **Logs** → **Access**
2. Enable **Access audit logs**
3. Configure log destination:
   - R2 bucket (store logs long-term)
   - Third-party SIEM (Splunk, DataDog)
   - Cloudflare Logpush

### Query Access Logs

```sql
-- R2 SQL query on Access logs
SELECT
  timestamp,
  user_email,
  action,
  resource,
  country,
  device_posture_check_passed
FROM r2('access-logs-bucket/access/*.json')
WHERE action = 'login'
  AND timestamp >= '2025-01-15'
ORDER BY timestamp DESC;

-- Failed access attempts
SELECT
  user_email,
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_attempt
FROM r2('access-logs-bucket/access/*.json')
WHERE action = 'login'
  AND success = false
  AND timestamp >= CURRENT_DATE - INTERVAL '7' DAYS
GROUP BY user_email
HAVING failed_attempts > 5
ORDER BY failed_attempts DESC;
```

---

## Advanced Patterns

### Pattern 1: Per-User File Access

```typescript
// Ensure users can only access their own files
app.get('/user-files/:filename', async (c) => {
  const auth = await validateAccessToken(c.req.raw, c.env);

  if (!auth.valid) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const filename = c.req.param('filename');
  const userId = auth.email?.split('@')[0]; // Extract user ID from email

  // Ensure file belongs to user
  if (!filename.startsWith(`users/${userId}/`)) {
    return c.json({ error: 'Access denied - not your file' }, 403);
  }

  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(object.body);
});
```

### Pattern 2: Time-Based Access

```typescript
// Restrict access to business hours
app.get('/restricted/:filename', async (c) => {
  const auth = await validateAccessToken(c.req.raw, c.env);

  if (!auth.valid) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check business hours (9 AM - 5 PM EST)
  const now = new Date();
  const hour = now.getUTCHours() - 5; // EST offset

  if (hour < 9 || hour >= 17) {
    return c.json({
      error: 'Access restricted to business hours (9 AM - 5 PM EST)',
    }, 403);
  }

  const filename = c.req.param('filename');
  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(object.body);
});
```

### Pattern 3: Download Limits

```typescript
// Track and limit file downloads per user
app.get('/limited/:filename', async (c) => {
  const auth = await validateAccessToken(c.req.raw, c.env);

  if (!auth.valid) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const filename = c.req.param('filename');
  const downloadKey = `downloads:${auth.email}:${filename}`;

  // Check download count (stored in KV)
  const downloads = parseInt(await c.env.DOWNLOAD_LIMITS.get(downloadKey) || '0');

  if (downloads >= 3) {
    return c.json({
      error: 'Download limit exceeded (max 3 per file)',
    }, 429);
  }

  // Increment download count
  await c.env.DOWNLOAD_LIMITS.put(downloadKey, String(downloads + 1), {
    expirationTtl: 86400, // Reset after 24 hours
  });

  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(object.body);
});
```

---

## Security Best Practices

1. **Always enforce MFA** for sensitive data access
2. **Use device posture checks** to ensure corporate-managed devices
3. **Implement IP allowlists** for office networks when possible
4. **Rotate service tokens** regularly (every 90 days)
5. **Monitor audit logs** for suspicious activity
6. **Use short session durations** (4-8 hours) for sensitive apps
7. **Implement least privilege** - grant minimum necessary access
8. **Review policies quarterly** - remove stale access
9. **Use groups** for access management (easier than individual emails)
10. **Test policies** before deploying to production

---

## Troubleshooting

### Access Denied Errors

**Error**: "Forbidden - Access policy does not allow"

**Solutions**:
- Check policy includes user's email or group
- Verify user authenticated with correct IdP
- Check exclude rules aren't blocking user
- Ensure MFA is enabled if required

### JWT Validation Failures

**Error**: "Invalid JWT signature"

**Solutions**:
- Verify Access audience tag matches (env.ACCESS_AUD)
- Check JWT expiration (max session duration)
- Ensure using latest public keys from `/certs` endpoint
- Validate cookie is being sent with request

### Service Token Issues

**Error**: "Service token authentication failed"

**Solutions**:
- Verify service token is still valid (not expired or revoked)
- Check client ID and secret are correct
- Ensure service token is in correct application policy
- Regenerate token if compromised

### Custom Domain Not Protected

**Problem**: Access policies not applied to R2 custom domain

**Solutions**:
- Verify custom domain configured in Access application
- Check DNS records point to correct R2 endpoint
- Wait for DNS propagation (up to 24 hours)
- Test with incognito/private browsing to clear cache

---

## Official Documentation

- **Cloudflare Access**: https://developers.cloudflare.com/cloudflare-one/policies/access/
- **Identity Providers**: https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/
- **Service Tokens**: https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/
- **JWT Validation**: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
- **Audit Logs**: https://developers.cloudflare.com/cloudflare-one/insights/logs/

---

**Secure R2 access with Zero Trust and identity-based policies!**

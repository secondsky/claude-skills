# Cloudflare Access Service Tokens Guide

Complete guide to using Service Tokens for machine-to-machine authentication with Cloudflare Access.

---

## Overview

**Service Tokens** enable machine-to-machine authentication without requiring interactive login. They're perfect for:
- Backend services calling your Worker API
- CI/CD pipelines
- Automated scripts and cron jobs
- Microservice communication
- Server-to-server requests

**Key Difference from User Auth**:
- No browser redirect or login page
- Credentials sent via HTTP headers
- Non-interactive authentication

---

## How Service Tokens Work

### Authentication Flow

```
┌─────────────┐                                    ┌──────────────┐
│   Service   │                                    │   Worker     │
│  (Client)   │                                    │  (Your API)  │
└─────────────┘                                    └──────────────┘
      │                                                     │
      │  1. Request with Service Token headers             │
      │  CF-Access-Client-Id: abc123.access                │
      │  CF-Access-Client-Secret: secret-value             │
      │────────────────────────────────────────────────────>│
      │                                                     │
      │                    ┌───────────────┐               │
      │  2. Validate       │   Cloudflare  │               │
      │     credentials    │    Access     │               │
      │<───────────────────┤               ├───────────────>│
      │                    └───────────────┘               │
      │                                                     │
      │  3. JWT issued (CF-Access-JWT-Assertion header)    │
      │<────────────────────────────────────────────────────│
      │                                                     │
      │  4. Worker validates JWT (same as user auth)       │
      │                                                     │
      │  5. Response with data                             │
      │<────────────────────────────────────────────────────│
```

### Key Points

1. **Client sends headers**: `CF-Access-Client-Id` and `CF-Access-Client-Secret`
2. **Access validates**: Cloudflare Access validates the service token
3. **JWT issued**: Access issues a JWT (same format as user auth, but with `common_name` instead of `email`)
4. **Worker validates JWT**: Your Worker validates the JWT normally
5. **Response sent**: Worker processes request and responds

---

## Creating Service Tokens

### Step-by-Step in Dashboard

1. **Navigate to Service Auth**:
   - Go to https://one.dash.cloudflare.com/
   - Select your account
   - Navigate to **Zero Trust** > **Access** > **Service Auth**

2. **Create New Token**:
   - Click **"Create Service Token"**
   - Enter a descriptive name (e.g., "backend-api-service", "github-actions")

3. **Copy Credentials**:
   - **IMPORTANT**: Credentials are shown only ONCE!
   - Copy the **Client ID** (format: `abc123.access`)
   - Copy the **Client Secret** (long random string)
   - Store securely (password manager, secrets manager)

4. **Set Expiration** (Optional):
   - Service tokens can be set to expire
   - Options: Never, 1 year, custom date
   - Recommended: Set expiration and rotate regularly

### Screenshot Locations

**Token List**:
```
Zero Trust > Access > Service Auth

Shows:
- Token name
- Client ID
- Created date
- Expiration date
- Actions (Renew, Delete)
```

**Create Token Dialog**:
```
┌────────────────────────────────────┐
│ Create Service Token               │
├────────────────────────────────────┤
│ Name: backend-api-service          │
│                                    │
│ Duration: Never expires ▾          │
│                                    │
│ [Cancel]  [Create]                 │
└────────────────────────────────────┘
```

**Credentials Display** (only shown once!):
```
┌────────────────────────────────────┐
│ Service Token Created              │
├────────────────────────────────────┤
│ Client ID                          │
│ abc123.access                      │
│ [Copy]                             │
│                                    │
│ Client Secret                      │
│ very-long-secret-string-here       │
│ [Copy]                             │
│                                    │
│ ⚠️ Save these credentials now!     │
│ They will not be shown again.      │
│                                    │
│ [Done]                             │
└────────────────────────────────────┘
```

---

## Adding Service Tokens to Access Policies

Creating a service token is not enough - you must add it to an Access policy.

### Step-by-Step

1. **Navigate to Your Application**:
   - Zero Trust > Access > Applications
   - Click on your application (or create new one)

2. **Edit Policy**:
   - Click on the policy you want to add the service token to
   - Or create a new policy

3. **Add Service Auth Rule**:
   - Under **"Include"** section, click **"Add include"**
   - Select **"Service Auth"**
   - Choose your service token from the dropdown
   - Click **"Save"**

### Policy Example

**Application**: `api.example.com`

**Policy Name**: API Access

**Rules**:
```
Include:
  - Emails ending in: @company.com
  - Service Auth: backend-api-service

Require:
  - (none)

Exclude:
  - (none)
```

**Result**: Both employees (@company.com) AND the backend service can access the API.

---

## Using Service Tokens

### Option 1: HTTP Headers (Recommended)

```bash
curl -H "CF-Access-Client-Id: abc123.access" \
     -H "CF-Access-Client-Secret: your-secret-here" \
     https://api.example.com/data
```

### Option 2: JavaScript/TypeScript

```typescript
const response = await fetch('https://api.example.com/data', {
  headers: {
    'CF-Access-Client-Id': 'abc123.access',
    'CF-Access-Client-Secret': 'your-secret-here',
  },
})
```

### Option 3: Python

```python
import requests

headers = {
    'CF-Access-Client-Id': 'abc123.access',
    'CF-Access-Client-Secret': 'your-secret-here',
}

response = requests.get('https://api.example.com/data', headers=headers)
```

### Option 4: With Worker (Client Side)

```typescript
// Client Worker calling another Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await fetch('https://api.example.com/data', {
      headers: {
        'CF-Access-Client-Id': env.SERVICE_TOKEN_ID,
        'CF-Access-Client-Secret': env.SERVICE_TOKEN_SECRET,
      },
    })

    return response
  },
}
```

---

## Storing Service Token Credentials

### ⚠️ Security Best Practices

**DO**:
- ✅ Store in Wrangler secrets (production)
- ✅ Store in environment variables (local dev)
- ✅ Store in secrets manager (AWS Secrets Manager, Vault, etc.)
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Rotate regularly (quarterly recommended)

**DON'T**:
- ❌ Commit to git
- ❌ Hardcode in source code
- ❌ Share via email or messaging
- ❌ Store in public repositories
- ❌ Log in production

### Wrangler Secrets (Production)

```bash
# Set secrets
npx wrangler secret put SERVICE_TOKEN_ID
# Enter: abc123.access

npx wrangler secret put SERVICE_TOKEN_SECRET
# Enter: your-secret-here

# List secrets (doesn't show values)
npx wrangler secret list
```

### Environment Variables (Local Dev)

**.env.local**:
```bash
SERVICE_TOKEN_ID=abc123.access
SERVICE_TOKEN_SECRET=your-secret-here
```

**.gitignore**:
```
.env.local
.env
```

### wrangler.jsonc

```jsonc
{
  "name": "my-worker",
  // DO NOT put secrets here!
  // Use Wrangler secrets instead

  // Environment-specific (non-secret) config is fine
  "vars": {
    "API_URL": "https://api.example.com"
  }
}
```

---

## Validating Service Tokens in Workers

### Using @hono/cloudflare-access

Service tokens work **exactly the same** as user JWTs with the middleware:

```typescript
import { Hono } from 'hono'
import { cloudflareAccess } from '@hono/cloudflare-access'

const app = new Hono<{ Bindings: Env }>()

// Middleware validates both user JWTs AND service tokens
app.use(
  '/api/*',
  cloudflareAccess({
    domain: (c) => c.env.ACCESS_TEAM_DOMAIN,
  })
)

app.get('/api/data', (c) => {
  const accessPayload = c.get('accessPayload')

  // Check if service token or user
  const isService = !accessPayload.email && accessPayload.common_name

  return c.json({
    data: 'sensitive information',
    authenticated_by: isService ? 'service-token' : 'user',
    identifier: accessPayload.email || accessPayload.common_name,
  })
})
```

### Detecting Service Tokens vs Users

```typescript
// Type guard
function isServiceToken(payload: any): boolean {
  return !!payload.common_name && !payload.email
}

// Usage
if (isServiceToken(accessPayload)) {
  console.log(`Service request from: ${accessPayload.common_name}`)
  // Service-specific logic
} else {
  console.log(`User request from: ${accessPayload.email}`)
  // User-specific logic
}
```

---

## Service Token JWT Payload

Service tokens produce JWTs with a different structure:

```json
{
  "common_name": "backend-api-service",
  "aud": ["abc123..."],
  "exp": 1730995200,
  "iat": 1730991600,
  "iss": "https://your-team.cloudflareaccess.com",
  "sub": "",
  "type": "app"
}
```

**Key differences**:
- ❌ No `email` field
- ✅ Has `common_name` (service token name)
- ⚠️ `sub` is empty string `""`

---

## Use Cases

### Use Case 1: CI/CD Pipeline

**Scenario**: GitHub Actions workflow needs to deploy to your Worker and trigger a data sync.

**Setup**:
1. Create service token named "github-actions"
2. Add to Access policy for `api.example.com`
3. Add credentials to GitHub Secrets:
   - `CF_ACCESS_CLIENT_ID`
   - `CF_ACCESS_CLIENT_SECRET`

**Workflow**:
```yaml
name: Deploy and Sync

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy Worker
        run: npx wrangler deploy

      - name: Trigger Sync
        env:
          CF_ACCESS_CLIENT_ID: ${{ secrets.CF_ACCESS_CLIENT_ID }}
          CF_ACCESS_CLIENT_SECRET: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
        run: |
          curl -X POST \
            -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
            -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
            https://api.example.com/admin/sync
```

---

### Use Case 2: Microservice Communication

**Scenario**: Backend service needs to fetch data from your Worker API.

**Setup**:
```typescript
// Backend service (Node.js, Python, etc.)
class APIClient {
  private clientId: string
  private clientSecret: string

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async getData() {
    const response = await fetch('https://api.example.com/data', {
      headers: {
        'CF-Access-Client-Id': this.clientId,
        'CF-Access-Client-Secret': this.clientSecret,
      },
    })

    return response.json()
  }
}

// Usage
const client = new APIClient(
  process.env.SERVICE_TOKEN_ID,
  process.env.SERVICE_TOKEN_SECRET
)

const data = await client.getData()
```

---

### Use Case 3: Cron Job / Scheduled Task

**Scenario**: Automated nightly data export.

**Setup**:
```bash
#!/bin/bash
# export-data.sh

# Load credentials from environment
CLIENT_ID="${CF_ACCESS_CLIENT_ID}"
CLIENT_SECRET="${CF_ACCESS_CLIENT_SECRET}"

# Trigger export
curl -X POST \
  -H "CF-Access-Client-Id: ${CLIENT_ID}" \
  -H "CF-Access-Client-Secret: ${CLIENT_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv"}' \
  https://api.example.com/admin/export

# Crontab entry:
# 0 2 * * * /path/to/export-data.sh
```

---

## Rotating Service Tokens

### When to Rotate

- **Scheduled**: Every 3-6 months (recommended)
- **Compromised**: Immediately if credentials leaked
- **Employee Departure**: When someone with access leaves
- **Service Decommission**: When service no longer needed

### Rotation Process

1. **Create New Token**:
   - Zero Trust > Access > Service Auth > Create Service Token
   - Name: `backend-api-service-v2`

2. **Add to Policy**:
   - Add new token to Access policy
   - Keep old token in policy temporarily

3. **Update Services**:
   - Update all services to use new credentials
   - Verify new token works

4. **Remove Old Token**:
   - After all services updated, remove old token from policy
   - Delete old token from dashboard

### Zero-Downtime Rotation

```typescript
// Support multiple service tokens during rotation
const validTokens = [
  {
    id: env.SERVICE_TOKEN_ID_V1,
    name: 'old-token',
  },
  {
    id: env.SERVICE_TOKEN_ID_V2,
    name: 'new-token',
  },
]

// Both tokens work during transition period
```

---

## Troubleshooting

### Problem: 401 Unauthorized

**Check**:
1. Service token added to Access policy? ✓
2. Correct header names? (`CF-Access-Client-Id`, NOT `Authorization`)
3. Token expired? (check dashboard)
4. Typo in Client ID or Secret?

**Debug**:
```bash
# Test with curl
curl -v \
  -H "CF-Access-Client-Id: abc123.access" \
  -H "CF-Access-Client-Secret: your-secret" \
  https://api.example.com/data
```

---

### Problem: Service Token Not in Policy Dropdown

**Solution**:
1. Refresh the Access policy page
2. Verify token exists in Service Auth page
3. Token not deleted or expired
4. Try creating policy in different browser

---

### Problem: Token Works Locally, Not in Production

**Check**:
1. Secrets set in Wrangler? (`npx wrangler secret list`)
2. Environment-specific config? (dev vs prod)
3. Different Access teams for dev/prod?

---

## Best Practices Summary

1. **Create Descriptive Names**: `github-actions-deploy`, not `token-1`
2. **One Token Per Service**: Don't share tokens across services
3. **Set Expiration**: Rotate regularly (quarterly)
4. **Monitor Usage**: Check Access logs for token activity
5. **Revoke Unused**: Delete tokens no longer needed
6. **Secure Storage**: Never commit, always use secrets
7. **Document Ownership**: Know which team owns which token

---

## Additional Resources

- [Cloudflare Service Tokens Docs](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/)
- [Access Policies Guide](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Wrangler Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret)

---

**Last Updated**: 2025-10-28
**Cloudflare Docs**: ✅ Verified

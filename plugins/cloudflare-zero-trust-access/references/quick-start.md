# Quick Start Guide: Cloudflare Zero Trust Access

**Purpose**: Step-by-step setup for new users integrating Access authentication with Hono middleware

**Use When**: Setting up Zero Trust Access for the first time, configuring Access for a new Worker, or verifying basic authentication flow

**Time to Complete**: 15-20 minutes

---

## Quick Start

### 1. Install Package

```bash
bun add hono @hono/cloudflare-access
```

### 2. Configure Access

**Dashboard**:
1. Go to Zero Trust > Access > Applications
2. Create application for your Worker domain
3. Create policy (e.g., "Emails ending in @company.com")
4. Copy Application Audience (AUD) tag

**wrangler.jsonc**:
```jsonc
{
  "vars": {
    "ACCESS_TEAM_DOMAIN": "your-team.cloudflareaccess.com",
    "ACCESS_AUD": "your-aud-tag"
  }
}
```

### 3. Add to Worker

Use `templates/hono-basic-setup.ts` as starting point:

```typescript
import { Hono } from 'hono'
import { cloudflareAccess } from '@hono/cloudflare-access'

const app = new Hono<{ Bindings: Env }>()

app.use('/admin/*', cloudflareAccess({
  domain: (c) => c.env.ACCESS_TEAM_DOMAIN
}))

app.get('/admin/dashboard', (c) => {
  const { email } = c.get('accessPayload')
  return c.json({ email })
})

export default app
```

### 4. Deploy and Test

```bash
bunx wrangler deploy
```

Access: `https://your-worker.example.com/admin/dashboard`

Expected: Redirect to Access login, then back to dashboard after auth.

---

**Next Steps**:
- Load `references/common-errors.md` for error prevention
- Load `references/jwt-payload-structure.md` for accessing user claims
- Load `references/access-policy-setup.md` for advanced policy configuration

**Related References**:
- `references/service-tokens-guide.md` - Machine-to-machine authentication
- `references/use-cases.md` - Detailed implementation examples

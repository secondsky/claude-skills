---
name: cloudflare-turnstile:setup
description: Interactive wizard for setting up Cloudflare Turnstile. Generates templates, configuration, and provides step-by-step guidance based on framework and environment.
---

# Turnstile Setup Wizard

This interactive command guides you through complete Cloudflare Turnstile setup, from widget configuration to server-side validation.

## Usage

```bash
/turnstile-setup
```

---

## Step 1: Widget Mode Selection

**Question**: "What widget mode do you need?"

**Options**:

1. **Managed (Recommended)** - Shows checkbox only when bot suspected
   - Best balance of security and UX
   - Use for: Login pages, contact forms, user-facing challenges
   - Solve rate: ~95% pass without interaction

2. **Invisible** - No visible widget, challenge runs in background
   - Best for: API protection, seamless UX, checkout flows
   - No user interaction required
   - Execute programmatically via `turnstile.execute()`

3. **Non-Interactive** - Widget visible but no interaction needed
   - Similar to invisible but shows "Verifying..." state
   - Use for: Status transparency, compliance requirements

**Output**: Store selection as `WIDGET_MODE`

---

## Step 2: Framework Selection

**Question**: "What framework are you using?"

**Options**:

1. **Cloudflare Workers (Hono)**
   - Template: `templates/turnstile-hono-route.ts`
   - Config: `templates/wrangler-turnstile-config.jsonc`
   - Server validation with Hono middleware

2. **React / Next.js**
   - Template: `templates/turnstile-react-component.tsx`
   - Package: `@marsidev/react-turnstile@1.3.1`
   - Client + server validation

3. **Vanilla HTML/JavaScript**
   - Template: `templates/turnstile-widget-implicit.html` (implicit rendering)
   - Template: `templates/turnstile-widget-explicit.ts` (explicit rendering)
   - Framework-agnostic setup

4. **Mobile (iOS/Android/React Native/Flutter)**
   - Reference: `references/mobile-implementation.md`
   - WebView integration required
   - Platform-specific configuration

**Output**: Store selection as `FRAMEWORK`

---

## Step 3: Environment Selection

**Question**: "What environment is this for?"

**Options**:

1. **Development (localhost)**
   - Use dummy test sitekey: `1x00000000000000000000AA`
   - Use dummy test secret: `1x0000000000000000000000000000000AA`
   - Always passes validation (for testing)
   - No domain configuration needed

2. **Staging**
   - Create staging-specific widget in Cloudflare Dashboard
   - Configure staging domain in allowed domains
   - Use separate sitekey/secret from production

3. **Production**
   - Create production widget in Cloudflare Dashboard
   - Configure production domain(s) in allowed domains
   - Rotate secret keys periodically
   - Monitor analytics dashboard

**Output**: Store selection as `ENVIRONMENT`

---

## Step 4: Generate Configuration

Based on selections (`WIDGET_MODE`, `FRAMEWORK`, `ENVIRONMENT`), generate appropriate files:

### For Cloudflare Workers (Hono)

**Generate `wrangler.jsonc`**:
```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-15",
  "vars": {
    "TURNSTILE_SITE_KEY": "${ENVIRONMENT === 'development' ? '1x00000000000000000000AA' : 'YOUR_SITE_KEY'}"
  },
  "env": {
    "production": {
      "vars": {
        "TURNSTILE_SITE_KEY": "YOUR_PRODUCTION_SITE_KEY"
      }
    }
  }
}
```

**Generate Hono route** (from `templates/turnstile-hono-route.ts`):
```typescript
import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

app.post('/api/verify', async (c) => {
  const { token } = await c.req.json()

  // Validate token with Turnstile Siteverify API
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: c.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  })

  const outcome = await result.json()

  if (!outcome.success) {
    return c.json({ error: 'Validation failed' }, 401)
  }

  return c.json({ success: true })
})
```

### For React / Next.js

**Generate React component** (from `templates/turnstile-react-component.tsx`):
```tsx
'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'

export function TurnstileWidget() {
  const [token, setToken] = useState('')

  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={setToken}
      options={{
        theme: 'auto',
        size: 'normal',
        execution: '${WIDGET_MODE === 'Invisible' ? 'execute' : 'render'}',
      }}
    />
  )
}
```

**Add package.json dependency**:
```bash
npm install @marsidev/react-turnstile@1.3.1
```

### For Vanilla HTML/JavaScript

**Generate HTML** (from `templates/turnstile-widget-implicit.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <form id="myForm" method="POST" action="/submit">
    <!-- Turnstile widget (implicit rendering) -->
    <div class="cf-turnstile"
         data-sitekey="${ENVIRONMENT === 'development' ? '1x00000000000000000000AA' : 'YOUR_SITE_KEY'}"
         data-callback="onTurnstileSuccess"
         data-theme="auto"
         data-size="normal">
    </div>

    <button type="submit">Submit</button>
  </form>

  <script>
    function onTurnstileSuccess(token) {
      console.log('Turnstile token:', token)
      // Form will auto-submit with cf-turnstile-response hidden input
    }
  </script>
</body>
</html>
```

---

## Step 5: Cloudflare Dashboard Setup

**Provide instructions for dashboard configuration**:

### 5.1: Create Widget

1. Go to https://dash.cloudflare.com/?to=/:account/turnstile
2. Click "Add Site" or "Add Widget"
3. Configure widget:
   - **Site Name**: `${PROJECT_NAME}-${ENVIRONMENT}`
   - **Domain**: Add your domain (e.g., `example.com`, `localhost` for dev)
   - **Widget Mode**: `${WIDGET_MODE}`
   - **Pre-Clearance**: Off (unless using SPA pre-clearance pattern)

4. Click "Create"
5. Copy **Site Key** and **Secret Key**

### 5.2: Configure Environment Variables

**For Cloudflare Workers**:
```bash
# Development
wrangler secret put TURNSTILE_SECRET_KEY
# Paste: 1x0000000000000000000000000000000AA (dummy secret)

# Production
wrangler secret put TURNSTILE_SECRET_KEY --env production
# Paste: [your production secret from dashboard]
```

**For Next.js** (`.env.local`):
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=YOUR_SITE_KEY
TURNSTILE_SECRET_KEY=YOUR_SECRET_KEY
```

**For Vanilla HTML**:
- Replace `YOUR_SITE_KEY` in HTML with actual sitekey
- Store secret key in backend environment variables

### 5.3: Add Domain to Allowed Domains

In Cloudflare Dashboard → Turnstile → Widget Settings:
- Click "Domains"
- Add: `example.com`, `www.example.com`, `localhost` (for dev)
- Click "Save"

**⚠️ Important**: Must add exact domain. Missing domain causes Error 110200.

---

## Step 6: Server-Side Validation Setup

**Generate validation code** (from `templates/turnstile-server-validation.ts`):

```typescript
interface TurnstileOutcome {
  success: boolean
  'error-codes': string[]
  challenge_ts: string
  hostname: string
  action?: string
  cdata?: string
}

async function validateTurnstileToken(
  token: string,
  secretKey: string
): Promise<TurnstileOutcome> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    }
  )

  return await response.json()
}

// Usage
const outcome = await validateTurnstileToken(token, env.TURNSTILE_SECRET_KEY)

if (!outcome.success) {
  console.error('Validation failed:', outcome['error-codes'])
  return new Response('Unauthorized', { status: 401 })
}

// Validation succeeded - proceed with request
```

**Critical**: Server-side validation is mandatory. Never trust client-side only.

---

## Step 7: CSP Configuration

**If using Content Security Policy**, add required directives:

```http
Content-Security-Policy:
  script-src 'self' https://challenges.cloudflare.com;
  frame-src https://challenges.cloudflare.com;
  connect-src 'self' https://challenges.cloudflare.com;
  style-src 'unsafe-inline';
```

**Verify CSP**:
```bash
./scripts/check-csp.sh https://your-domain.com
```

**If CSP errors**, use `/turnstile-csp-debug` command or load `agents/csp-debugger.md`.

---

## Step 8: Testing

### Test Client-Side Widget

1. Open browser to your application
2. Open DevTools Console
3. Verify:
   - [ ] Widget loads and renders
   - [ ] No console errors
   - [ ] Challenge completes (if interactive)
   - [ ] Token generated (visible in Network tab)

### Test Server-Side Validation

1. Submit form with Turnstile token
2. Check server logs:
   - [ ] Siteverify API called
   - [ ] Response `success: true`
   - [ ] No error codes returned

### Test With Dummy Keys (Development)

**Always-Pass Test**:
- Sitekey: `1x00000000000000000000AA`
- Secret: `1x0000000000000000000000000000000AA`
- Expected: Validation always succeeds

**Always-Fail Test**:
- Sitekey: `2x00000000000000000000AB`
- Secret: `2x0000000000000000000000000000000AA`
- Expected: Validation always fails

**Force Interactive**:
- Sitekey: `3x00000000000000000000FF`
- Expected: Always shows interactive challenge

---

## Step 9: Production Checklist

Before deploying to production, verify:

**Load `references/setup-checklist.md` for complete 14-point verification**

Quick checklist:
- [ ] Production sitekey/secret configured
- [ ] Domain added to allowed domains
- [ ] Server-side validation implemented
- [ ] Error callbacks implemented
- [ ] Token expiration handled (5-minute TTL)
- [ ] CSP configured correctly
- [ ] HTTPS enabled (required)
- [ ] Timeouts set (30s recommended)
- [ ] Monitoring/analytics enabled
- [ ] Test in production environment

---

## Step 10: Next Steps

### If Errors Occur

**Use troubleshooting resources**:
- `/turnstile-troubleshoot` - Interactive error diagnosis
- `references/error-codes.md` - Complete error catalog (100*, 200*, 300*, 400*, 600*)
- `references/browser-support.md` - Safari 18, Brave compatibility issues

### For Advanced Features

**Load references**:
- `references/advanced-topics.md` - Pre-clearance, custom actions/cdata, multi-widget
- `references/react-integration.md` - React hooks, SSR, Jest testing
- `references/mobile-implementation.md` - iOS, Android, React Native, Flutter

### For Migration

**If migrating from reCAPTCHA or hCaptcha**:
- Load `references/migration-guide.md` for step-by-step migration
- Use `?compat=recaptcha` parameter for drop-in reCAPTCHA replacement

---

## Generated Files Summary

**After wizard completion, you'll have**:

- ✅ Widget configuration code (HTML/React/Hono)
- ✅ Server-side validation implementation
- ✅ Environment configuration (wrangler.jsonc/.env)
- ✅ CSP directives (if applicable)
- ✅ Testing instructions with dummy keys
- ✅ Production deployment checklist

**Dashboard configuration needed**:
- ⚠️ Create widget in Cloudflare Dashboard
- ⚠️ Add domain to allowed domains
- ⚠️ Copy sitekey and secret to environment variables

---

## Example: Complete Setup Flow

**User selections**:
- Widget mode: Managed
- Framework: Cloudflare Workers (Hono)
- Environment: Development

**Generated files**:

1. **wrangler.jsonc** (with dummy sitekey)
2. **src/index.ts** (Hono route with validation)
3. **public/index.html** (widget implementation)

**Instructions provided**:
1. Dashboard setup (create widget, copy keys)
2. Environment variable configuration
3. CSP verification
4. Testing with dummy keys
5. Production deployment checklist

**Estimated setup time**: 10-15 minutes

---

## Troubleshooting Setup Issues

**Widget not loading**:
- Check CSP headers: `./scripts/check-csp.sh`
- Verify sitekey matches environment
- Check browser console for errors

**Validation failing**:
- Verify secret key correct
- Check token hasn't expired (5 min TTL)
- Ensure Siteverify uses POST (not GET)

**Domain errors (110200)**:
- Add domain to allowed domains in dashboard
- Use dummy sitekey for localhost

For complete troubleshooting, use `/turnstile-troubleshoot` or load `agents/troubleshooting-agent.md`.

---

**Wizard Duration**: ~10 minutes
**Files Generated**: 2-4 (depending on framework)
**Dashboard Setup**: ~5 minutes
**Total Setup Time**: ~15-20 minutes

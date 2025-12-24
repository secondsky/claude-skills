# Cloudflare Turnstile - Advanced Topics

**Last Updated**: 2025-11-26

This reference covers advanced Turnstile features and patterns for specific use cases beyond basic bot protection.

---

## Pre-Clearance for SPAs

**When to use**: Single-page applications requiring persistent challenge validation across route changes

### What is Pre-Clearance?

Pre-clearance allows Turnstile to issue a cookie that persists across page navigations, reducing the number of challenges users see in SPAs. Once a user solves a challenge, the pre-clearance cookie validates them for subsequent requests.

### Implementation

```typescript
turnstile.render('#container', {
  sitekey: SITE_KEY,
  callback: async (token) => {
    // Request pre-clearance cookie from server
    await fetch('/api/pre-clearance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  },
})
```

### Server-Side Pre-Clearance Handler

```typescript
// Cloudflare Workers example
app.post('/api/pre-clearance', async (c) => {
  const { token } = await c.req.json()

  // Validate token
  const result = await validateTurnstile(token, c.env.TURNSTILE_SECRET_KEY)

  if (result.success) {
    // Set pre-clearance cookie (httpOnly, secure)
    c.header('Set-Cookie', `cf_clearance=validated; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
    return c.json({ success: true })
  }

  return c.json({ success: false }, 401)
})
```

### Benefits
- Reduced user friction in SPAs
- One challenge per session instead of per page
- Better UX for multi-page workflows
- Cookie-based validation (no token re-verification)

### Considerations
- Cookie expiration (typically 1-24 hours)
- Users blocking cookies won't get pre-clearance
- Still validate tokens on sensitive operations
- Pre-clearance supplements, doesn't replace, token validation

---

## Custom Actions and cData

**When to use**: Tracking different challenge types or passing contextual data through verification

### Custom Actions

Actions allow you to track different challenge contexts in Turnstile analytics:

```typescript
turnstile.render('#container', {
  sitekey: SITE_KEY,
  action: 'login', // Track action in analytics
  callback: (token) => {
    // Token includes action for server validation
  },
})
```

**Common action values**:
- `'login'` - Login forms
- `'signup'` - Registration forms
- `'checkout'` - E-commerce checkout
- `'comment'` - User-generated content
- `'contact'` - Contact forms

### Server-Side Action Verification

```typescript
const result = await validateTurnstile(token, secretKey)

if (result.action !== 'login') {
  return new Response('Invalid action', { status: 400 })
}

// Proceed with login
```

### Custom Data (cData)

Pass contextual data through the challenge flow:

```typescript
turnstile.render('#container', {
  sitekey: SITE_KEY,
  cdata: JSON.stringify({ userId: '123', orderId: 'abc-456' }), // Max 255 chars
  callback: (token) => {
    // Token includes cdata for server validation
  },
})
```

### Server-Side cData Verification

```typescript
const result = await validateTurnstile(token, secretKey)

const customData = JSON.parse(result.cdata || '{}')
console.log('User ID:', customData.userId)
console.log('Order ID:', customData.orderId)

// Use custom data for additional validation or logging
```

### Use Cases
- Multi-step forms (track current step in cdata)
- A/B testing (pass variant in cdata)
- User context (pass user ID for rate limiting)
- Transaction tracking (pass order ID for audit logs)

### Important Constraints
- **cdata max length**: 255 characters
- **Must be JSON-serializable**
- **Not encrypted** (don't pass sensitive data)
- Use for tracking, not security (tokens can be forged client-side)

---

## Retry and Error Handling Strategies

**When to use**: Production applications requiring robust error handling and automatic recovery

### Automatic Retry Configuration

```typescript
class TurnstileWithRetry {
  private retryCount = 0
  private maxRetries = 3
  private widgetId: string | null = null

  render(containerId: string) {
    this.widgetId = turnstile.render(containerId, {
      sitekey: SITE_KEY,
      retry: 'auto', // or 'never' for manual control
      'retry-interval': 8000, // ms between retries (default: 8000)
      'error-callback': (error) => {
        this.handleError(error)
      },
    })
  }

  private handleError(error: string) {
    // Error codes that should NOT retry (permanent failures)
    const noRetry = [
      '110100', // Invalid sitekey
      '110200', // Unknown domain
      '110500', // Internal error (Cloudflare-side)
    ]

    if (noRetry.some(code => error.includes(code))) {
      this.showFallback()
      return
    }

    // Retry on transient errors with exponential backoff
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      const backoffMs = 2 ** this.retryCount * 1000 // exponential backoff (1s, 2s, 4s...)

      setTimeout(() => {
        if (this.widgetId !== null) {
          turnstile.reset(this.widgetId)
        }
      }, backoffMs)
    } else {
      this.showFallback()
    }
  }

  private showFallback() {
    // Show alternative verification method
    console.error('Turnstile failed after retries - showing fallback')
    // Example: Show email verification, manual review, etc.
  }
}
```

### Error Code Categories

**Permanent Failures (Do NOT Retry)**:
- `110100` - Invalid sitekey (configuration error)
- `110200` - Domain not allowed (configuration error)
- `110500` - Internal error (Cloudflare-side issue)

**Transient Failures (SAFE to Retry)**:
- `300010` - Generic client error (network, browser state)
- `300030` - Widget crash (Cloudflare-side issue, known bug 2025)
- `600010` - Configuration error (may resolve on retry)

### Best Practices

**1. Exponential Backoff**:
```typescript
const backoffMs = Math.min(2 ** retryCount * 1000, 30000) // Max 30s
```

**2. Limited Retries**:
```typescript
const maxRetries = 3 // Prevent infinite retry loops
```

**3. Fallback Mechanisms**:
- Email verification
- Manual review queue
- Alternative CAPTCHA provider
- Temporary bypass with higher scrutiny

**4. User Communication**:
```typescript
if (retryCount > 0) {
  showMessage(`Verifying... (attempt ${retryCount}/${maxRetries})`)
}
```

---

## Multi-Widget Pages

**When to use**: Pages with multiple forms requiring independent Turnstile challenges

### Implementation

```typescript
const widgets = {
  login: null as string | null,
  signup: null as string | null,
  contact: null as string | null,
}

// Render multiple widgets on same page
widgets.login = turnstile.render('#login-widget', {
  sitekey: SITE_KEY,
  action: 'login',
  callback: (token) => handleLoginToken(token),
})

widgets.signup = turnstile.render('#signup-widget', {
  sitekey: SITE_KEY,
  action: 'signup',
  callback: (token) => handleSignupToken(token),
})

widgets.contact = turnstile.render('#contact-widget', {
  sitekey: SITE_KEY,
  action: 'contact',
  callback: (token) => handleContactToken(token),
})

// Reset specific widget
function resetLogin() {
  if (widgets.login !== null) {
    turnstile.reset(widgets.login)
  }
}

// Get token from specific widget
function getLoginToken(): string | undefined {
  if (widgets.login === null) return undefined
  return turnstile.getResponse(widgets.login)
}

// Remove widget on form hide
function hideLoginForm() {
  if (widgets.login !== null) {
    turnstile.remove(widgets.login)
    widgets.login = null
  }
}
```

### Best Practices

**1. Use Different Actions**:
```typescript
// Track which form user is interacting with
action: 'login' | 'signup' | 'contact'
```

**2. Independent Callbacks**:
```typescript
// Each widget has its own token handler
callback: (token) => handleSpecificFormToken(token)
```

**3. Widget Lifecycle Management**:
```typescript
// Track widget IDs for reset/remove operations
const widgetIds = new Map<string, string>()
```

**4. Conditional Rendering**:
```typescript
// Only render widget when form is visible
if (formVisible && !widgetIds.has('login')) {
  widgetIds.set('login', turnstile.render('#login-widget', config))
}
```

### Common Patterns

**Tabbed Forms**:
```typescript
function switchTab(tabName: string) {
  // Remove previous widget
  if (currentWidget) {
    turnstile.remove(currentWidget)
  }

  // Render new widget for active tab
  currentWidget = turnstile.render(`#${tabName}-widget`, {
    sitekey: SITE_KEY,
    action: tabName,
  })
}
```

**Modal Dialogs**:
```typescript
function openLoginModal() {
  showModal()
  widgets.login = turnstile.render('#login-modal-widget', config)
}

function closeLoginModal() {
  if (widgets.login) {
    turnstile.remove(widgets.login)
    widgets.login = null
  }
  hideModal()
}
```

---

## Related Resources

**For basic patterns**: See `references/common-patterns.md`
**For configuration**: See `references/widget-configs.md`
**For error handling**: See `references/error-codes.md`
**For testing**: See `references/testing-guide.md`

**Official Documentation**:
- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- https://developers.cloudflare.com/turnstile/reference/widget-configurations/

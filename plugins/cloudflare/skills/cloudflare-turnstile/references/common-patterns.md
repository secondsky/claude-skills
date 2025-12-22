# Cloudflare Turnstile - Common Implementation Patterns

**Last Updated**: 2025-11-26

This reference provides complete code examples for the most common Turnstile integration patterns across different frameworks and use cases.

---

## Pattern 1: Hono + Cloudflare Workers

**When to use**: Server-side validation in Cloudflare Workers with Hono framework

**Use cases**:
- API routes requiring bot protection
- Form submission endpoints
- Login/authentication endpoints
- Any Workers-based API with user input

**Complete Implementation**:

```typescript
import { Hono } from 'hono'

type Bindings = {
  TURNSTILE_SECRET_KEY: string
  TURNSTILE_SITE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.post('/api/login', async (c) => {
  const body = await c.req.formData()
  const token = body.get('cf-turnstile-response')

  if (!token) {
    return c.text('Missing Turnstile token', 400)
  }

  // Validate token
  const verifyFormData = new FormData()
  verifyFormData.append('secret', c.env.TURNSTILE_SECRET_KEY)
  verifyFormData.append('response', token.toString())
  verifyFormData.append('remoteip', c.req.header('CF-Connecting-IP') || '')

  const verifyResult = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: verifyFormData,
    }
  )

  const outcome = await verifyResult.json<{ success: boolean }>()

  if (!outcome.success) {
    return c.text('Invalid Turnstile token', 401)
  }

  // Process login
  return c.json({ message: 'Login successful' })
})

export default app
```

**Key Points**:
- Always validate token server-side (never trust client-side only)
- Use `CF-Connecting-IP` header for remoteip verification
- Return appropriate HTTP status codes (400 for missing token, 401 for invalid)
- Secret key must be stored in environment bindings, never hardcoded

**Template File**: See `templates/turnstile-hono-route.ts` for complete Hono route handler

---

## Pattern 2: React + Next.js App Router

**When to use**: Client-side forms in Next.js with React hooks and @marsidev/react-turnstile

**Use cases**:
- Contact forms
- Newsletter signups
- User registration forms
- Any Next.js client component with user input

**Complete Implementation**:

```tsx
'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { useState } from 'react'

export function ContactForm() {
  const [token, setToken] = useState<string>()
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!token) {
      setError('Please complete the challenge')
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.append('cf-turnstile-response', token)

    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      setError('Submission failed')
      return
    }

    // Success
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <textarea name="message" required />

      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={setToken}
        onError={() => setError('Challenge failed')}
        onExpire={() => setToken(undefined)}
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={!token}>
        Submit
      </button>
    </form>
  )
}
```

**Key Points**:
- Use `'use client'` directive for Next.js client components
- Disable submit button until token is available
- Handle all three callbacks: onSuccess, onError, onExpire
- Clear token on expiration (tokens expire after 5 minutes)
- Use environment variable for sitekey (NEXT_PUBLIC_ prefix makes it accessible client-side)
- Server-side validation must still be implemented (see Pattern 1)

**Template File**: See `templates/turnstile-react-component.tsx` for complete React component

---

## Pattern 3: E2E Testing with Dummy Keys

**When to use**: Automated testing with Playwright, Cypress, or Jest

**Use cases**:
- End-to-end tests
- Integration tests
- Local development testing
- CI/CD pipelines

**Complete Implementation**:

```typescript
// test/helpers/turnstile.ts
export const TEST_TURNSTILE = {
  sitekey: {
    alwaysPass: 'TEST_SITEKEY_PASS', // Test token
    alwaysBlock: 'TEST_SITEKEY_BLOCK', // Test token
    invisible: 'TEST_SITEKEY_INVISIBLE', // Test token
    interactive: 'TEST_SITEKEY_INTERACTIVE', // Test token
  },
  secretKey: {
    alwaysPass: 'TEST_SECRET_PASS', // Test secret
    alwaysFail: 'TEST_SECRET_FAIL', // Test secret
    tokenSpent: 'TEST_SECRET_SPENT', // Test secret
  },
  dummyToken: 'DUMMY_TOKEN_PLACEHOLDER', // Dummy token for testing
}

// Playwright test example
test('form submission with Turnstile', async ({ page }) => {
  // Set test environment
  await page.goto('/contact?test=true')

  // Widget uses test sitekey in test mode
  await page.fill('input[name="email"]', 'test@example.com')

  // Turnstile auto-solves with dummy token
  await page.click('button[type="submit"]')

  await expect(page.locator('.success')).toBeVisible()
})
```

**Key Points**:
- **Always Pass** sitekey (1x00000000000000000000AA): Auto-solves every challenge
- **Always Block** sitekey (2x00000000000000000000AB): Fails every challenge
- **Invisible** sitekey (1x00000000000000000000BB): No visual challenge
- **Interactive** sitekey (3x00000000000000000000FF): Always shows interactive challenge
- Never use production keys in tests (rate limits + analytics pollution)
- Test both success and failure scenarios
- Dummy keys work in all environments (dev, staging, CI)

**Template File**: See `templates/turnstile-test-config.ts` for complete testing configuration

---

## Pattern 4: Widget Lifecycle Management

**When to use**: SPAs requiring programmatic widget control (Vue, React without @marsidev, vanilla JS)

**Use cases**:
- Single-page applications
- Dynamic forms (show/hide)
- Multi-step wizards
- Any scenario requiring explicit widget control

**Complete Implementation**:

```typescript
class TurnstileManager {
  private widgetId: string | null = null
  private sitekey: string

  constructor(sitekey: string) {
    this.sitekey = sitekey
  }

  render(containerId: string, callbacks: {
    onSuccess: (token: string) => void
    onError: (error: string) => void
  }) {
    if (this.widgetId !== null) {
      this.reset() // Reset if already rendered
    }

    this.widgetId = turnstile.render(containerId, {
      sitekey: this.sitekey,
      callback: callbacks.onSuccess,
      'error-callback': callbacks.onError,
      'expired-callback': () => this.reset(),
    })

    return this.widgetId
  }

  reset() {
    if (this.widgetId !== null) {
      turnstile.reset(this.widgetId)
    }
  }

  remove() {
    if (this.widgetId !== null) {
      turnstile.remove(this.widgetId)
      this.widgetId = null
    }
  }

  getToken(): string | undefined {
    if (this.widgetId === null) return undefined
    return turnstile.getResponse(this.widgetId)
  }
}

// Usage
const manager = new TurnstileManager(SITE_KEY)
manager.render('#container', {
  onSuccess: (token) => console.log('Token:', token),
  onError: (error) => console.error('Error:', error),
})
```

**Key Points**:
- Use `turnstile.render()` for explicit rendering (not implicit div attribute)
- Store widgetId for lifecycle control (reset, remove, getToken)
- Call `reset()` to clear widget and request new challenge
- Call `remove()` to completely destroy widget (e.g., component unmount)
- Use `getToken()` to retrieve current token without callback
- Expired callback should automatically reset widget

**Template File**: See `templates/turnstile-widget-explicit.ts` for complete explicit rendering API

---

## Additional Resources

**For more patterns**:
- `references/react-integration.md` - React-specific patterns and hooks
- `references/testing-guide.md` - Complete testing strategies
- `references/widget-configs.md` - All widget configuration options
- `references/advanced-topics.md` - Pre-clearance, retry logic, multi-widget

**Official Documentation**:
- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

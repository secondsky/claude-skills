# Cloudflare Turnstile - Complete Setup Checklist

**Last Updated**: 2025-11-26

Use this comprehensive checklist to verify your Turnstile setup before deploying to production. Each item includes verification steps and links to relevant documentation.

---

## Pre-Deployment Checklist

### 1. Widget Configuration ✓

- [ ] **Created Turnstile widget in Cloudflare Dashboard**
  - Verify: Dashboard → Turnstile → Widget visible with sitekey/secret
  - Link: https://dash.cloudflare.com/?to=/:account/turnstile

- [ ] **Added allowed domains** (including localhost for dev)
  - Verify: Widget settings → Domains list includes all environments
  - Dev: `localhost`, `127.0.0.1`
  - Staging: `staging.example.com`
  - Production: `example.com`, `www.example.com`

### 2. Frontend Integration ✓

- [ ] **Frontend widget loads from Cloudflare CDN**
  - Verify: `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js">`
  - **NEVER** proxy or cache this script
  - Must load directly from Cloudflare for security updates

- [ ] **Widget renders with correct sitekey**
  - Verify: Widget appears on page, no console errors
  - Check: `data-sitekey="YOUR_SITE_KEY"` or `sitekey: "YOUR_SITE_KEY"` in code
  - Test: Widget shows challenge when interacted with

- [ ] **Error callback implemented and tested**
  - Verify: `error-callback` handler logs/displays errors
  - Test: Use invalid sitekey to trigger error callback
  - User-friendly error message displayed (not just console.error)

### 3. Server-Side Validation ✓

- [ ] **Server-side Siteverify validation implemented**
  - Verify: Backend calls `https://challenges.cloudflare.com/turnstile/v0/siteverify`
  - **CRITICAL**: Never skip server validation (client-side only = security vulnerability)
  - See: `references/common-patterns.md` Pattern 1 for implementation

- [ ] **Secret key stored in environment variable** (not hardcoded)
  - Verify: `env.TURNSTILE_SECRET_KEY` used in validation
  - Check: No hardcoded secrets in source code
  - Review: `.env` in `.gitignore`

- [ ] **Token validation includes remoteip check**
  - Verify: `remoteip` parameter sent to Siteverify API
  - Cloudflare Workers: Use `request.headers.get('CF-Connecting-IP')`
  - Other platforms: Use request IP address

### 4. Security & CSP ✓

- [ ] **CSP allows challenges.cloudflare.com** (if using CSP)
  - Verify: No CSP-related errors in browser console
  - Required directives:
    ```
    script-src https://challenges.cloudflare.com
    frame-src https://challenges.cloudflare.com
    connect-src https://challenges.cloudflare.com
    ```
  - Tool: Run `scripts/check-csp.sh https://yoursite.com`

### 5. Testing ✓

- [ ] **Testing uses dummy sitekeys**
  - Verify: Test environment uses `1x00000000000000000000AA` (always pass)
  - **NEVER** use production keys in tests (pollutes analytics + rate limits)
  - See: `references/testing-guide.md` for all dummy keys

- [ ] **Token expiration handling implemented** (5 min TTL)
  - Verify: `expired-callback` resets widget or requests new token
  - Test: Wait 6 minutes after widget render, submit should fail gracefully
  - User sees clear message about expired challenge

### 6. Accessibility ✓

- [ ] **Widget accessibility tested**
  - Keyboard navigation: Tab to widget, Enter to activate
  - Screen readers: Widget announces state changes
  - WCAG 2.1 AA compliance verified
  - Alternative text provided for challenge images (if interactive)

- [ ] **Error states display user-friendly messages**
  - Verify: Error messages explain what went wrong
  - Examples:
    - "Please complete the security challenge"
    - "Challenge expired, please try again"
    - "Security verification failed, please refresh the page"
  - **AVOID** technical error codes in user-facing messages

### 7. Environment Separation ✓

- [ ] **Production deployment uses separate widget from dev/staging**
  - Verify: Different sitekeys for each environment
  - Dev: Use dummy test keys (`1x00000000000000000000AA`)
  - Staging: Dedicated staging widget
  - Production: Dedicated production widget
  - Why: Separate analytics, rate limits, and security posture per environment

---

## Post-Deployment Verification

### 1. Functional Testing

- [ ] Submit form with valid challenge → Success
- [ ] Submit form without challenge → Rejection
- [ ] Submit form with expired token (> 5 min) → Rejection
- [ ] Trigger error callback → User sees friendly message
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)

### 2. Analytics Verification

- [ ] Log into Cloudflare Dashboard → Turnstile → Analytics
- [ ] Verify challenge requests are being recorded
- [ ] Check solve rate (should be >95% for legitimate traffic)
- [ ] Monitor error rates (<5% expected)
- [ ] Review action breakdown (if using custom actions)

### 3. Performance Testing

- [ ] Widget loads quickly (<1s)
- [ ] No impact on page load time
- [ ] Challenge solves quickly (<2s for invisible/managed)
- [ ] No JavaScript errors in console
- [ ] No CSP violations

### 4. Security Verification

- [ ] Attempt to submit form without token → Rejected
- [ ] Attempt to reuse token → Rejected ("token already spent")
- [ ] Attempt to use token from different domain → Rejected
- [ ] Secret key not visible in client-side code
- [ ] remoteip validation working (test with VPN switch)

---

## Common Issues Checklist

If experiencing issues, verify:

- [ ] Error 110200? → Add domain to widget allowlist
- [ ] Error 300030? → Implement error callback with retry logic
- [ ] Tokens failing validation? → Check token hasn't expired (5 min TTL)
- [ ] CSP blocking iframe? → Add frame-src directive
- [ ] Safari 18 errors? → Document "Hide IP" setting requirement
- [ ] Jest tests failing? → Mock @marsidev/react-turnstile component

**Troubleshooting Guide**: See `references/error-codes.md` for complete error reference

---

## Deployment Workflow

### 1. Pre-Deployment

```bash
# 1. Run tests with dummy keys
npm test

# 2. Verify CSP configuration
./scripts/check-csp.sh https://staging.example.com

# 3. Test staging environment with real widget
# (Use staging sitekey, not production)
```

### 2. Deployment

```bash
# 1. Deploy code
npm run deploy

# 2. Verify environment variables
# - TURNSTILE_SECRET_KEY set correctly
# - TURNSTILE_SITE_KEY (if stored server-side)

# 3. Smoke test production endpoint
curl -X POST https://api.example.com/contact \
  -H "Content-Type: application/json" \
  -d '{"cf-turnstile-response": "test-token"}'
# Should return 401 (token invalid but validation working)
```

### 3. Post-Deployment

```bash
# 1. Monitor logs for Turnstile errors
tail -f /var/log/app.log | grep turnstile

# 2. Check Cloudflare Dashboard analytics
# Verify requests are being recorded

# 3. Test with real user flow
# Submit actual form and verify success
```

---

## Quick Reference

**Dashboard**: https://dash.cloudflare.com/?to=/:account/turnstile
**Siteverify API**: https://challenges.cloudflare.com/turnstile/v0/siteverify
**Test Sitekey (Always Pass)**: `1x00000000000000000000AA`
**Test Secret Key (Always Pass)**: `1x0000000000000000000000000000000AA`

**Related Documentation**:
- Setup: See SKILL.md "Quick Start (10 Minutes)"
- Patterns: See `references/common-patterns.md`
- Testing: See `references/testing-guide.md`
- Errors: See `references/error-codes.md`

---

**Remember**: The most common issue is missing server-side validation. Always validate tokens server-side with the Siteverify API!

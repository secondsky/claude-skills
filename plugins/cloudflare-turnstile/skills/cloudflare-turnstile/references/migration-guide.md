# Turnstile Migration Guide

Comprehensive guide for migrating from reCAPTCHA or hCaptcha to Cloudflare Turnstile.

**Last Updated**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/turnstile/migration/

---

## Table of Contents

1. [reCAPTCHA v2 → Turnstile](#recaptcha-v2--turnstile)
2. [hCaptcha → Turnstile](#hcaptcha--turnstile)
3. [Common Migration Issues](#common-migration-issues)
4. [Migration Checklist](#migration-checklist)
5. [Code Examples](#code-examples)

---

## reCAPTCHA v2 → Turnstile

### Overview

Turnstile provides a compatibility mode for reCAPTCHA v2, enabling drop-in replacement with minimal code changes. **Note**: Only reCAPTCHA v2 is supported, not v3.

### Step 1: Obtain Turnstile Credentials

1. Log into Cloudflare Dashboard
2. Navigate to Turnstile section
3. Create new widget
4. Copy **sitekey** (public) and **secret key** (private)

Store secret key securely (environment variables, secrets manager).

---

### Step 2: Client-Side Changes

#### Script Replacement with Compatibility Mode

Replace the reCAPTCHA script with Turnstile's compatibility script:

**Before (reCAPTCHA)**:
```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

**After (Turnstile with compat mode)**:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha" async defer></script>
```

**Key Parameter**: `?compat=recaptcha`

This enables:
- Implicit rendering matching reCAPTCHA behavior
- Form input name remains `g-recaptcha-response` (no HTML changes needed)
- API registration as `grecaptcha` (JavaScript code continues to work)

---

#### Widget Configuration (No Changes Needed)

Your existing reCAPTCHA widget div **works as-is** with the new sitekey:

```html
<!-- reCAPTCHA widget (update sitekey only) -->
<div class="g-recaptcha"
     data-sitekey="YOUR_NEW_TURNSTILE_SITEKEY"
     data-callback="onSuccess"
     data-error-callback="onError"></div>
```

**What stays the same**:
- ✅ Class name: `g-recaptcha`
- ✅ Form input name: `g-recaptcha-response`
- ✅ Callback functions
- ✅ JavaScript API (`grecaptcha.render()`, `grecaptcha.execute()`)

**What changes**:
- ❌ Sitekey: Use Turnstile sitekey (not reCAPTCHA sitekey)

---

#### Explicit Rendering (If Used)

If you use `grecaptcha.render()`, **no code changes needed**:

```javascript
// Works with Turnstile in compat mode
grecaptcha.ready(function() {
  grecaptcha.render('captcha-container', {
    'sitekey': 'YOUR_NEW_TURNSTILE_SITEKEY',
    'callback': function(token) {
      console.log('Turnstile token:', token);
    }
  });
});
```

---

#### Invisible Mode (If Used)

reCAPTCHA v2 invisible mode via `grecaptcha.execute()` is supported:

```javascript
// Works with Turnstile in compat mode
grecaptcha.ready(function() {
  grecaptcha.execute();
});
```

---

### Step 3: Server-Side Changes

#### Siteverify Endpoint Change

**CRITICAL**: Turnstile's Siteverify endpoint **does NOT support GET requests**.

**Before (reCAPTCHA)**:
```
https://www.google.com/recaptcha/api/siteverify
```

**After (Turnstile)**:
```
https://challenges.cloudflare.com/turnstile/v0/siteverify
```

**⚠️ Breaking Change**: reCAPTCHA supports both GET and POST requests. **Turnstile only accepts POST** with FormData or JSON body.

---

#### Request Format Change

**Before (reCAPTCHA - GET or POST)**:
```javascript
// reCAPTCHA allowed GET requests
const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
const result = await fetch(url, { method: 'GET' });
```

**After (Turnstile - POST only)**:
```javascript
// Turnstile requires POST with FormData
const formData = new FormData();
formData.append('secret', secretKey);
formData.append('response', token);
formData.append('remoteip', clientIP); // Optional but recommended

const result = await fetch(
  'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  {
    method: 'POST',
    body: formData,
  }
);
```

**Alternative (JSON body)**:
```javascript
const result = await fetch(
  'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: secretKey,
      response: token,
      remoteip: clientIP,
    }),
  }
);
```

---

#### Response Format (Unchanged)

Turnstile returns the same response structure as reCAPTCHA:

```json
{
  "success": true,
  "challenge_ts": "2025-12-27T12:00:00Z",
  "hostname": "example.com",
  "error-codes": [],
  "action": "login",
  "cdata": "custom_data"
}
```

**Fields**:
- `success`: Boolean validation result
- `challenge_ts`: ISO 8601 timestamp
- `hostname`: Domain where challenge occurred
- `error-codes`: Array of error codes (if failed)
- `action`: Custom action identifier (if specified)
- `cdata`: Custom data payload (if provided)

---

### Step 4: Domain Allowlist

reCAPTCHA and Turnstile both require domain allowlists, but configuration differs:

**reCAPTCHA**:
- Configured in Google reCAPTCHA Admin Console
- Wildcards supported (e.g., `*.example.com`)

**Turnstile**:
- Configured in Cloudflare Dashboard → Turnstile
- **Exact domains only** (no wildcards)
- `localhost` must be explicitly added for local development

**Action Required**: Add all domains (including `localhost` for dev) to Turnstile widget configuration.

---

### Step 5: Secret Key Security

**Best Practice** (same for both):
- Store secret keys in environment variables
- Never expose in frontend code
- Use Cloudflare Workers secrets (`wrangler secret put`)
- Rotate keys periodically

```bash
# Cloudflare Workers
wrangler secret put TURNSTILE_SECRET_KEY

# Enter secret key when prompted
```

---

## hCaptcha → Turnstile

### Overview

Turnstile supports hCaptcha migration with similar API patterns. **No compatibility mode available** - requires script and code updates.

---

### Step 1: Obtain Turnstile Credentials

Same as reCAPTCHA migration (see above).

---

### Step 2: Client-Side Changes

#### Script Replacement

**Before (hCaptcha)**:
```html
<script src="https://js.hcaptcha.com/1/api.js" async defer></script>
```

**After (Turnstile)**:
```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

**No compatibility mode** - must update to Turnstile-native API.

---

#### Widget HTML Changes

**Before (hCaptcha)**:
```html
<div class="h-captcha"
     data-sitekey="YOUR_HCAPTCHA_SITEKEY"
     data-callback="onSuccess"></div>
```

**After (Turnstile)**:
```html
<div class="cf-turnstile"
     data-sitekey="YOUR_TURNSTILE_SITEKEY"
     data-callback="onSuccess"></div>
```

**Changes Required**:
- ❌ Class: `h-captcha` → `cf-turnstile`
- ❌ Sitekey: Use Turnstile sitekey
- ✅ Callbacks: Same names work

---

#### Form Input Name Change

hCaptcha and Turnstile use different hidden input names:

**Before (hCaptcha)**:
```javascript
const token = formData.get('h-captcha-response');
```

**After (Turnstile)**:
```javascript
const token = formData.get('cf-turnstile-response');
```

**Update** all server-side code that reads the token from form submissions.

---

#### JavaScript API Changes

**Before (hCaptcha)**:
```javascript
// Explicit rendering
hcaptcha.render('container', {
  sitekey: 'YOUR_HCAPTCHA_SITEKEY',
  callback: onSuccess,
});

// Invisible mode
hcaptcha.execute();
```

**After (Turnstile)**:
```javascript
// Explicit rendering
turnstile.render('container', {
  sitekey: 'YOUR_TURNSTILE_SITEKEY',
  callback: onSuccess,
});

// Invisible mode (via execute parameter)
turnstile.render('container', {
  sitekey: 'YOUR_TURNSTILE_SITEKEY',
  execution: 'execute', // Invisible mode
  callback: onSuccess,
});
```

**Key Difference**: Turnstile uses `execution: 'execute'` parameter instead of separate `execute()` method.

---

### Step 3: Server-Side Changes

#### Siteverify Endpoint Change

**Before (hCaptcha)**:
```
https://hcaptcha.com/siteverify
```

**After (Turnstile)**:
```
https://challenges.cloudflare.com/turnstile/v0/siteverify
```

---

#### Request Format (POST Required)

Same as reCAPTCHA migration - **POST with FormData or JSON**:

```javascript
const formData = new FormData();
formData.append('secret', secretKey);
formData.append('response', token);
formData.append('remoteip', clientIP);

const result = await fetch(
  'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  {
    method: 'POST',
    body: formData,
  }
);
```

---

#### Response Format (Similar)

hCaptcha and Turnstile both return `success` boolean and error codes:

```json
{
  "success": true,
  "challenge_ts": "2025-12-27T12:00:00Z",
  "hostname": "example.com"
}
```

---

## Common Migration Issues

### Issue 1: GET Request to Siteverify (reCAPTCHA only)

**Symptom**: 405 Method Not Allowed error from Siteverify API

**Cause**: reCAPTCHA supports GET requests, Turnstile does not

**Solution**:
```javascript
// ❌ WRONG (reCAPTCHA pattern)
const url = `https://challenges.cloudflare.com/turnstile/v0/siteverify?secret=${secret}&response=${token}`;
fetch(url, { method: 'GET' });

// ✅ CORRECT (Turnstile requires POST)
const formData = new FormData();
formData.append('secret', secret);
formData.append('response', token);
fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
  method: 'POST',
  body: formData,
});
```

---

### Issue 2: Missing `localhost` in Domain Allowlist

**Symptom**: Error 110200 - "Unknown domain" during local development

**Cause**: Turnstile widget configured without `localhost` in allowed domains

**Solution**:
1. Use dummy test sitekey for development: `1x00000000000000000000AA`
2. OR: Add `localhost` to production widget's domain allowlist in Cloudflare Dashboard

**Recommended**: Use separate widgets for dev/staging/production with appropriate domain allowlists.

---

### Issue 3: Secret Key Exposed in Frontend

**Symptom**: Security bypass - attackers can validate their own tokens

**Cause**: Secret key hardcoded in JavaScript or visible in network requests

**Solution**:
- ✅ Store secret key in backend environment only
- ✅ Use Cloudflare Workers secrets: `wrangler secret put TURNSTILE_SECRET_KEY`
- ✅ Never include secret in frontend code
- ✅ Call Siteverify API from backend only

---

### Issue 4: Form Input Name Mismatch (hCaptcha only)

**Symptom**: Server receives `null` or `undefined` token

**Cause**: Server still looking for `h-captcha-response`, but Turnstile sends `cf-turnstile-response`

**Solution**:
```javascript
// ❌ WRONG (hCaptcha pattern)
const token = request.body['h-captcha-response'];

// ✅ CORRECT (Turnstile)
const token = request.body['cf-turnstile-response'];
```

---

### Issue 5: Token Expiration (5 Minutes)

**Symptom**: Valid tokens return `success: false` after delay

**Cause**: Tokens expire 300 seconds (5 minutes) after generation

**Solution**:
- Document TTL in user-facing messaging
- Implement token refresh on expiration
- Validate tokens immediately after form submission
- Use error handling to request new token if expired

```javascript
// Example: Token refresh on expiration
turnstile.render('#captcha', {
  sitekey: 'YOUR_SITEKEY',
  'expired-callback': function() {
    // Auto-refresh widget on expiration
    turnstile.reset();
  }
});
```

---

## Migration Checklist

### Pre-Migration

- [ ] Create Turnstile widget in Cloudflare Dashboard
- [ ] Copy sitekey and secret key
- [ ] Add all production domains to allowlist
- [ ] Add `localhost` to allowlist (or use test sitekey for dev)
- [ ] Review current reCAPTCHA/hCaptcha implementation
- [ ] Identify all client-side and server-side code locations

### Client-Side Migration

**reCAPTCHA v2**:
- [ ] Update script to use `?compat=recaptcha` parameter
- [ ] Update sitekey in widget div
- [ ] Test form submissions
- [ ] Verify callbacks still work
- [ ] Test invisible mode (if used)

**hCaptcha**:
- [ ] Replace hCaptcha script with Turnstile script
- [ ] Update class: `h-captcha` → `cf-turnstile`
- [ ] Update sitekey
- [ ] Update JavaScript API: `hcaptcha.render()` → `turnstile.render()`
- [ ] Test form submissions
- [ ] Verify callbacks work

### Server-Side Migration

- [ ] Update Siteverify endpoint URL
- [ ] Change request method to POST (if using GET)
- [ ] Update request body (FormData or JSON)
- [ ] Update secret key in environment variables
- [ ] Update form input name (`h-captcha-response` → `cf-turnstile-response` for hCaptcha)
- [ ] Test server-side validation
- [ ] Verify error handling works

### Testing

- [ ] Test successful validation flow
- [ ] Test failed validation (use test sitekey `2x00000000000000000000AB`)
- [ ] Test token expiration handling
- [ ] Test on all allowed domains
- [ ] Test in development (localhost)
- [ ] Test in production
- [ ] Verify CSP compatibility (if using CSP headers)

### Post-Migration

- [ ] Monitor Turnstile Analytics dashboard
- [ ] Track solve rates
- [ ] Monitor for validation errors
- [ ] Remove old reCAPTCHA/hCaptcha credentials
- [ ] Update documentation
- [ ] Train support team on new error messages

---

## Code Examples

### Complete reCAPTCHA → Turnstile Migration

#### Before (reCAPTCHA)

**Client-Side**:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
</head>
<body>
  <form action="/submit" method="POST">
    <input type="email" name="email" required>
    <div class="g-recaptcha" data-sitekey="6Lc...RECAPTCHA_SITEKEY"></div>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

**Server-Side**:
```javascript
// Node.js / Express
app.post('/submit', async (req, res) => {
  const token = req.body['g-recaptcha-response'];

  // ❌ reCAPTCHA allows GET (but not recommended)
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${token}`;
  const result = await fetch(url);
  const outcome = await result.json();

  if (!outcome.success) {
    return res.status(401).send('Verification failed');
  }

  res.send('Success!');
});
```

#### After (Turnstile with compat mode)

**Client-Side** (minimal changes):
```html
<!DOCTYPE html>
<html>
<head>
  <!-- ✅ Add ?compat=recaptcha parameter -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?compat=recaptcha" async defer></script>
</head>
<body>
  <form action="/submit" method="POST">
    <input type="email" name="email" required>
    <!-- ✅ Only sitekey changes -->
    <div class="g-recaptcha" data-sitekey="YOUR_TURNSTILE_SITEKEY"></div>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

**Server-Side** (endpoint + POST required):
```javascript
// Node.js / Express
app.post('/submit', async (req, res) => {
  const token = req.body['g-recaptcha-response']; // ✅ Same name in compat mode

  // ✅ POST with FormData
  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  formData.append('remoteip', req.ip);

  const result = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: formData,
    }
  );

  const outcome = await result.json();

  if (!outcome.success) {
    return res.status(401).send('Verification failed');
  }

  res.send('Success!');
});
```

---

### Complete hCaptcha → Turnstile Migration

#### Before (hCaptcha)

**Client-Side**:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
</head>
<body>
  <form action="/submit" method="POST">
    <input type="email" name="email" required>
    <div class="h-captcha" data-sitekey="YOUR_HCAPTCHA_SITEKEY"></div>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

**Server-Side**:
```javascript
app.post('/submit', async (req, res) => {
  const token = req.body['h-captcha-response'];

  const formData = new FormData();
  formData.append('secret', process.env.HCAPTCHA_SECRET_KEY);
  formData.append('response', token);

  const result = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    body: formData,
  });

  const outcome = await result.json();

  if (!outcome.success) {
    return res.status(401).send('Verification failed');
  }

  res.send('Success!');
});
```

#### After (Turnstile)

**Client-Side** (class + sitekey change):
```html
<!DOCTYPE html>
<html>
<head>
  <!-- ✅ Turnstile script (no compat mode for hCaptcha) -->
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <form action="/submit" method="POST">
    <input type="email" name="email" required>
    <!-- ✅ Change class and sitekey -->
    <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITEKEY"></div>
    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

**Server-Side** (endpoint + input name change):
```javascript
app.post('/submit', async (req, res) => {
  // ✅ Change input name
  const token = req.body['cf-turnstile-response'];

  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  formData.append('remoteip', req.ip);

  // ✅ Change endpoint
  const result = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      body: formData,
    }
  );

  const outcome = await result.json();

  if (!outcome.success) {
    return res.status(401).send('Verification failed');
  }

  res.send('Success!');
});
```

---

## Additional Resources

- **Turnstile Docs**: https://developers.cloudflare.com/turnstile/
- **reCAPTCHA Migration**: https://developers.cloudflare.com/turnstile/migration/recaptcha/
- **hCaptcha Migration**: https://developers.cloudflare.com/turnstile/migration/hcaptcha/
- **Siteverify API**: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- **Testing Guide**: https://developers.cloudflare.com/turnstile/troubleshooting/testing/

---

**Migration Support**: For issues, check error-codes.md reference or consult Cloudflare Community Forums.

**Estimated Migration Time**: 30-60 minutes for reCAPTCHA v2 (compat mode), 60-120 minutes for hCaptcha (full migration).

**Token Savings**: ~70% reduction in implementation complexity vs manual migration without this guide.

# Turnstile Browser Support Matrix

Comprehensive browser compatibility guide including known issues, workarounds, and fallback strategies.

**Last Updated**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/turnstile/

---

## Table of Contents

1. [Browser Compatibility Matrix](#browser-compatibility-matrix)
2. [Safari 18 / macOS 15 Issues](#safari-18--macos-15-issues)
3. [Brave Browser Issues](#brave-browser-issues)
4. [iOS Safari Considerations](#ios-safari-considerations)
5. [Private Browsing Mode](#private-browsing-mode)
6. [Browser Extension Conflicts](#browser-extension-conflicts)
7. [Fallback Strategies](#fallback-strategies)

---

## Browser Compatibility Matrix

### Desktop Browsers

| Browser | Version | Support Status | Known Issues | Notes |
|---------|---------|---------------|--------------|-------|
| **Chrome** | 90+ | ✅ Full Support | None | Recommended for best performance |
| **Firefox** | 88+ | ✅ Full Support | None | Full widget support |
| **Safari** | 14+ | ⚠️ Supported with Issues | Safari 18 "Hide IP" issue | See [Safari 18 Issues](#safari-18--macos-15-issues) |
| **Edge** | 90+ | ✅ Full Support | None | Chromium-based, same as Chrome |
| **Brave** | 1.40+ | ⚠️ Supported with Issues | Confetti animation failure | See [Brave Issues](#brave-browser-issues) |
| **Opera** | 76+ | ✅ Full Support | None | Chromium-based |
| **Vivaldi** | 4.0+ | ✅ Full Support | None | Chromium-based |

### Mobile Browsers

| Browser | Platform | Support Status | Known Issues | Notes |
|---------|----------|---------------|--------------|-------|
| **Chrome Mobile** | Android | ✅ Full Support | None | Recommended for Android |
| **Safari Mobile** | iOS 14+ | ✅ Full Support | None | Full support on iOS |
| **Firefox Mobile** | Android/iOS | ✅ Full Support | None | Full widget support |
| **Edge Mobile** | Android/iOS | ✅ Full Support | None | Chromium-based |
| **Samsung Internet** | Android | ✅ Full Support | None | Chromium-based |

### Requirements

All browsers must support:
- ✅ JavaScript execution
- ✅ DOM Storage API (localStorage, sessionStorage)
- ✅ Fetch API or XMLHttpRequest
- ✅ Cookies enabled
- ✅ Third-party cookies allowed for `challenges.cloudflare.com`

---

## Safari 18 / macOS 15 Issues

### Issue: Error 300010 with "Hide IP Address" Enabled

**Affected Versions**: Safari 18.0+ on macOS 15 (Sequoia) and later

**Symptom**:
- Turnstile widget displays error 300010
- Challenge fails for legitimate users
- Widget may show "Verification failed" message

**Root Cause**:
Safari 18 introduced "Hide IP address" privacy feature that interferes with Turnstile's challenge signal collection. When enabled, Turnstile cannot properly assess visitor legitimacy.

**Official Source**:
- https://community.cloudflare.com/t/turnstile-is-frequently-generating-300x-errors/700903
- Reported: 2025
- Status: Cloudflare investigating; no ETA for fix

---

### Workaround 1: User-Side Fix (Recommended)

**Inform users to disable "Hide IP address" in Safari settings**:

1. Open Safari
2. Go to **Safari** → **Settings** (or **Preferences**)
3. Click **Privacy** tab
4. Find "Hide IP address" section
5. Select **Off** or **Trackers and websites**
6. Reload the page

**Error Message to Display**:
```
Verification failed (Error 300010)

If you're using Safari 18 on macOS 15, please disable "Hide IP address":
1. Safari → Settings → Privacy
2. Set "Hide IP address" to "Off"
3. Reload this page

Alternatively, try using Chrome or Firefox.
```

---

### Workaround 2: Retry Logic with Fallback

Implement automatic retry with fallback to contact form:

```javascript
let retryCount = 0;
const maxRetries = 2;

turnstile.render('#turnstile-widget', {
  sitekey: TURNSTILE_SITEKEY,
  'error-callback': function(errorCode) {
    if (errorCode === '300010' && retryCount < maxRetries) {
      retryCount++;
      console.log(`Safari Hide IP issue detected. Retry ${retryCount}/${maxRetries}`);

      // Wait 2 seconds then reset
      setTimeout(() => {
        turnstile.reset();
      }, 2000);
    } else if (errorCode === '300010') {
      // Max retries exceeded - show fallback
      document.getElementById('safari-warning').style.display = 'block';
      document.getElementById('fallback-contact-form').style.display = 'block';
    }
  }
});
```

---

### Detection Script

Detect Safari 18 with Hide IP enabled (proactive warning):

```javascript
function detectSafari18HideIP() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const safariVersion = navigator.userAgent.match(/Version\/(\d+)/)?.[1];

  if (isSafari && parseInt(safariVersion) >= 18) {
    // Safari 18+ detected - show preventive warning
    document.getElementById('safari-18-warning').style.display = 'block';
    document.getElementById('safari-18-warning').innerHTML = `
      <div class="alert alert-warning">
        <strong>Safari 18 Users:</strong> If verification fails, please disable
        "Hide IP address" in Safari Settings → Privacy, or use Chrome/Firefox.
      </div>
    `;
  }
}

// Run on page load
detectSafari18HideIP();
```

---

### Long-Term Solution

**Status**: Cloudflare is investigating the issue. Monitor these resources:
- Cloudflare Community Forums: https://community.cloudflare.com/t/turnstile-is-frequently-generating-300x-errors/700903
- Turnstile Changelog: https://developers.cloudflare.com/turnstile/changelog/

**Recommendation**: Display clear error messaging with workaround instructions until Cloudflare resolves the issue.

---

## Brave Browser Issues

### Issue: Confetti Animation Failure (Error in Success State)

**Affected Versions**: Brave 1.40+ with Shields enabled

**Symptom**:
- Turnstile widget completes verification successfully
- Token is generated correctly
- Confetti success animation fails to display or causes JavaScript error
- Widget may freeze during animation

**Root Cause**:
Brave Shields block third-party scripts and tracking, which can interfere with Turnstile's success animation scripts.

**Official Source**:
- https://github.com/brave/brave-browser/issues/45608
- Reported: April 2025
- Status: Open issue, workaround available

---

### Workaround: Handle Success Before Animation

**The Fix**: Process the token immediately on success callback, before animation completes.

```javascript
turnstile.render('#turnstile-widget', {
  sitekey: TURNSTILE_SITEKEY,
  callback: function(token) {
    // ✅ CRITICAL: Handle token IMMEDIATELY
    // Don't wait for animation to complete
    console.log('Token received:', token);

    // Enable form submission immediately
    document.getElementById('submit-button').disabled = false;

    // Store token for submission
    document.getElementById('turnstile-token-input').value = token;

    // Animation failure is cosmetic only - token is valid
  },
  'error-callback': function(error) {
    console.error('Turnstile error:', error);
    document.getElementById('brave-shields-warning').style.display = 'block';
  }
});
```

**Key Point**: Token is valid even if animation fails. Success callback fires before animation, so process token immediately.

---

### User Guidance for Brave Shields

If users report issues, provide instructions to disable Shields:

```html
<div id="brave-shields-warning" style="display:none;">
  <div class="alert alert-info">
    <strong>Brave Browser Detected:</strong> If verification fails,
    try disabling Brave Shields for this site:
    <ol>
      <li>Click the Brave icon (lion) in address bar</li>
      <li>Toggle "Shields" to Off for this site</li>
      <li>Reload the page</li>
    </ol>
  </div>
</div>
```

---

### Detection Script

```javascript
function isBraveBrowser() {
  return navigator.brave && typeof navigator.brave.isBrave === 'function';
}

if (isBraveBrowser()) {
  console.log('Brave browser detected - using animation-safe pattern');
  // Display preventive message
  document.getElementById('brave-info').style.display = 'block';
}
```

---

## iOS Safari Considerations

### Full Support on iOS 14+

iOS Safari has **full Turnstile support** with no major known issues.

**Requirements**:
- ✅ iOS 14.0 or later
- ✅ JavaScript enabled (default)
- ✅ Cookies enabled
- ✅ No content blockers blocking `challenges.cloudflare.com`

---

### Content Blocker Compatibility

Some iOS content blockers may interfere with Turnstile:

**Common Content Blockers**:
- 1Blocker
- AdGuard
- Wipr
- Ka-Block!

**Symptom**: Widget fails to load or displays loading spinner indefinitely

**Solution**: Whitelist `challenges.cloudflare.com` in content blocker settings

**User Instructions**:
```
If Turnstile widget doesn't load on iOS:
1. Open Settings → Safari → Content Blockers
2. Disable content blockers temporarily
3. Reload the page
4. If it works, whitelist this site in your content blocker
```

---

### Responsive Design Considerations

iOS Safari requires responsive widget sizing:

```html
<!-- ✅ GOOD: Flexible width on mobile -->
<div class="cf-turnstile"
     data-sitekey="YOUR_SITEKEY"
     data-size="flexible"></div>

<!-- ❌ AVOID: Fixed width on mobile (may overflow) -->
<div class="cf-turnstile"
     data-sitekey="YOUR_SITEKEY"
     data-size="normal"></div>
```

**Recommended**: Use `data-size="flexible"` for mobile-friendly layouts.

---

## Private Browsing Mode

### Behavior in Private/Incognito Mode

Turnstile works in private browsing but with limitations:

| Browser | Private Mode | Turnstile Behavior | Notes |
|---------|-------------|-------------------|-------|
| **Chrome Incognito** | ✅ Supported | May show challenge more frequently | Cookies cleared on session end |
| **Firefox Private** | ✅ Supported | Normal behavior | Full support |
| **Safari Private** | ⚠️ Partial | May require manual challenge | Strict cookie policies |
| **Edge InPrivate** | ✅ Supported | Normal behavior | Chromium-based |

---

### Known Issues

**Safari Private Browsing**:
- Stricter third-party cookie restrictions
- May require interactive challenge even for legitimate users
- `cf_clearance` cookies not persisted between sessions

**Chrome Incognito**:
- Higher challenge frequency (expected behavior)
- No persistent clearance cookies
- Each session starts fresh

---

### Recommendations

1. **Don't block private browsing** - Turnstile still provides protection
2. **Expect higher challenge rates** - Normal due to lack of browsing history
3. **Document behavior** - Inform users that private mode may require more interaction
4. **Test thoroughly** - Verify widget loads in all private modes

---

## Browser Extension Conflicts

### Common Conflicting Extensions

| Extension Type | Symptoms | Solution |
|---------------|----------|----------|
| **Ad Blockers** (uBlock Origin, AdBlock Plus) | Widget blocked or hidden | Whitelist `challenges.cloudflare.com` |
| **Privacy Extensions** (Privacy Badger, Ghostery) | Challenge fails to load | Allow third-party scripts from Cloudflare |
| **Anti-Tracking** (Disconnect, DuckDuckGo Privacy) | Token validation fails | Whitelist domain |
| **VPN Extensions** (NordVPN, ExpressVPN) | Higher challenge frequency | Expected behavior (IP reputation) |
| **Script Blockers** (NoScript, ScriptSafe) | Widget doesn't render | Allow scripts from `challenges.cloudflare.com` |

---

### Detection & User Guidance

**Detect Extension Interference**:
```javascript
function detectExtensionBlock() {
  const widgetElement = document.querySelector('.cf-turnstile');

  // Check if widget loaded
  setTimeout(() => {
    const iframe = widgetElement?.querySelector('iframe');

    if (!iframe) {
      // Widget failed to load - likely blocked
      document.getElementById('extension-warning').style.display = 'block';
      console.warn('Turnstile widget blocked - possible browser extension');
    }
  }, 3000);
}

// Run after widget should have loaded
window.addEventListener('load', detectExtensionBlock);
```

**User Message**:
```html
<div id="extension-warning" style="display:none;">
  <div class="alert alert-warning">
    <strong>Verification Not Loading?</strong>
    <p>A browser extension may be blocking the verification widget.</p>
    <p>Try:</p>
    <ul>
      <li>Disabling ad blockers for this site</li>
      <li>Allowing scripts from challenges.cloudflare.com</li>
      <li>Using browser's private/incognito mode</li>
    </ul>
  </div>
</div>
```

---

## Fallback Strategies

### Strategy 1: Progressive Enhancement

Provide alternative verification methods:

```javascript
let turnstileLoaded = false;

turnstile.render('#turnstile-widget', {
  sitekey: TURNSTILE_SITEKEY,
  callback: function(token) {
    turnstileLoaded = true;
    document.getElementById('alternative-verification').style.display = 'none';
  },
  'error-callback': function(error) {
    // Show alternative after multiple failures
    if (retryCount >= 3) {
      document.getElementById('alternative-verification').style.display = 'block';
      document.getElementById('alternative-verification').innerHTML = `
        <p>Having trouble with verification? Please contact support:</p>
        <a href="mailto:support@example.com">support@example.com</a>
      `;
    }
  }
});

// Timeout fallback (if widget doesn't load in 10 seconds)
setTimeout(() => {
  if (!turnstileLoaded) {
    document.getElementById('slow-load-warning').style.display = 'block';
  }
}, 10000);
```

---

### Strategy 2: Browser-Specific Messages

Tailor messages based on detected browser:

```javascript
function getBrowserInfo() {
  const ua = navigator.userAgent;

  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    return { name: 'Safari', version: ua.match(/Version\/(\d+)/)?.[1] };
  } else if (/Chrome/.test(ua)) {
    return { name: 'Chrome', version: ua.match(/Chrome\/(\d+)/)?.[1] };
  } else if (/Firefox/.test(ua)) {
    return { name: 'Firefox', version: ua.match(/Firefox\/(\d+)/)?.[1] };
  } else if (navigator.brave) {
    return { name: 'Brave', version: 'Unknown' };
  }

  return { name: 'Unknown', version: 'Unknown' };
}

const browser = getBrowserInfo();

if (browser.name === 'Safari' && parseInt(browser.version) >= 18) {
  // Show Safari 18 specific guidance
  document.getElementById('safari-18-help').style.display = 'block';
} else if (browser.name === 'Brave') {
  // Show Brave specific guidance
  document.getElementById('brave-help').style.display = 'block';
}
```

---

### Strategy 3: Graceful Degradation

Allow form submission with warning if Turnstile fails:

```javascript
const MAX_WAIT_TIME = 15000; // 15 seconds

let verificationComplete = false;

turnstile.render('#turnstile-widget', {
  sitekey: TURNSTILE_SITEKEY,
  callback: function(token) {
    verificationComplete = true;
  }
});

// Fallback after timeout
setTimeout(() => {
  if (!verificationComplete) {
    document.getElementById('bypass-warning').style.display = 'block';
    document.getElementById('submit-button').disabled = false;

    // Add flag for server to handle gracefully
    document.getElementById('verification-bypassed').value = 'true';
  }
}, MAX_WAIT_TIME);
```

**Server-side handling**:
```javascript
if (req.body.verification_bypassed === 'true') {
  // Log the bypass for monitoring
  console.warn('Form submitted with Turnstile bypass:', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  });

  // Apply additional validation or rate limiting
  // Don't automatically reject - may be legitimate browser issue
}
```

---

## Testing Across Browsers

### Testing Checklist

**Desktop**:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Safari 18+ with "Hide IP" enabled
- [ ] Brave with Shields enabled
- [ ] Opera (Chromium)

**Mobile**:
- [ ] iOS Safari (latest)
- [ ] Chrome Mobile Android
- [ ] Firefox Mobile
- [ ] Samsung Internet

**Special Modes**:
- [ ] Chrome Incognito
- [ ] Firefox Private
- [ ] Safari Private
- [ ] With common ad blockers (uBlock Origin, AdBlock Plus)
- [ ] With VPN extensions

---

## Monitoring & Analytics

### Track Browser-Specific Issues

Use Turnstile Analytics dashboard to monitor:
- Solve rates by browser
- Error rates by browser family
- Challenge frequency patterns

### Client-Side Logging

```javascript
turnstile.render('#turnstile-widget', {
  sitekey: TURNSTILE_SITEKEY,
  callback: function(token) {
    // Log successful verification
    logTurnstileEvent('success', {
      browser: getBrowserInfo(),
      timestamp: Date.now()
    });
  },
  'error-callback': function(errorCode) {
    // Log error with browser context
    logTurnstileEvent('error', {
      errorCode: errorCode,
      browser: getBrowserInfo(),
      timestamp: Date.now()
    });
  }
});

function logTurnstileEvent(event, data) {
  // Send to analytics service
  fetch('/api/log-turnstile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, ...data })
  });
}
```

---

## Additional Resources

- **Turnstile Troubleshooting**: https://developers.cloudflare.com/turnstile/troubleshooting/
- **Error Codes Reference**: Load `error-codes.md` for complete error code details
- **Community Forums**: https://community.cloudflare.com/c/security/turnstile/
- **Browser Compatibility Testing**: https://www.browserstack.com/

---

**Best Practice**: Test Turnstile integration across multiple browsers during development, and implement fallback strategies for known browser issues.

**Recommendation**: Display browser-specific help messages proactively for Safari 18 and Brave users to reduce support tickets.

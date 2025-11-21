---
name: xss-prevention
description: Prevents Cross-Site Scripting attacks through input sanitization, output encoding, and Content Security Policy. Use when handling user-generated content, implementing rich text editors, or securing web applications.
---

# XSS Prevention

Defend against Cross-Site Scripting attacks with proper sanitization and encoding.

## XSS Attack Types

| Type | Vector | Defense |
|------|--------|---------|
| Reflected | URL parameters | Output encoding |
| Stored | Database content | Input sanitization |
| DOM-based | Client-side JS | Safe DOM APIs |
| Mutation | HTML parser quirks | Strict sanitization |

## Output Encoding (Node.js)

```javascript
function encodeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function encodeForAttribute(str) {
  return str.replace(/[^\w.-]/g, char =>
    `&#x${char.charCodeAt(0).toString(16)};`
  );
}

// Usage in templates
app.get('/profile', (req, res) => {
  const username = encodeHTML(req.query.name);
  res.send(`<h1>Welcome, ${username}</h1>`);
});
```

## DOMPurify Sanitization

```javascript
import DOMPurify from 'dompurify';

const config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOW_DATA_ATTR: false
};

function sanitizeHTML(dirty) {
  return DOMPurify.sanitize(dirty, config);
}

// React component
function RichContent({ html }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }} />
  );
}
```

## Content Security Policy

```javascript
// Express middleware
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.example.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  next();
});
```

## Safe DOM APIs

```javascript
// DANGEROUS - avoid these
element.innerHTML = userInput;        // XSS risk
element.outerHTML = userInput;        // XSS risk
document.write(userInput);            // XSS risk
eval(userInput);                      // Code injection

// SAFE - use these instead
element.textContent = userInput;      // Escaped automatically
element.setAttribute('data-id', id);  // Safe for attributes
document.createTextNode(userInput);   // Creates safe text node
```

## URL Validation

```javascript
function isSafeURL(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Usage
const href = isSafeURL(userURL) ? userURL : '#';
```

## Additional Implementations

See [references/python-sanitization.md](references/python-sanitization.md) for:
- Python bleach library usage
- Flask/Django template escaping
- Server-side validation patterns

## Security Checklist

- [ ] Encode all output by context (HTML, attribute, JS)
- [ ] Sanitize HTML with allowlist (not blocklist)
- [ ] Implement strict CSP headers
- [ ] Use HTTPOnly cookies for sessions
- [ ] Validate and sanitize URLs
- [ ] Avoid innerHTML with user content
- [ ] Regular security testing

## Never Do

- Trust user input without validation
- Use innerHTML with unsanitized content
- Disable CSP for convenience
- Use eval() or Function() with user data
- Rely on client-side validation alone

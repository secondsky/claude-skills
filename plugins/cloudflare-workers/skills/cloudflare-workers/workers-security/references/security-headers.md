# Security Headers for Cloudflare Workers

Comprehensive guide to HTTP security headers for protecting web applications.

## Essential Security Headers

| Header | Purpose | Recommended Value |
|--------|---------|-------------------|
| Content-Security-Policy | XSS prevention | Restrictive policy |
| X-Content-Type-Options | MIME sniffing prevention | `nosniff` |
| X-Frame-Options | Clickjacking prevention | `DENY` or `SAMEORIGIN` |
| X-XSS-Protection | Legacy XSS filter | `1; mode=block` |
| Strict-Transport-Security | HTTPS enforcement | `max-age=31536000` |
| Referrer-Policy | Referrer leakage | `strict-origin-when-cross-origin` |
| Permissions-Policy | Feature restrictions | As needed |

## Complete Security Headers

```typescript
function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Legacy XSS protection (for older browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Force HTTPS for 1 year, including subdomains
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Control referrer information
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  headers.set('Content-Security-Policy', buildCSP());

  // Restrict browser features
  headers.set('Permissions-Policy', buildPermissionsPolicy());

  // Prevent information leakage
  headers.delete('Server');
  headers.delete('X-Powered-By');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
```

## Content Security Policy (CSP)

### Building CSP

```typescript
interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'object-src'?: string[];
  'media-src'?: string[];
  'worker-src'?: string[];
  'frame-ancestors'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

function buildCSP(directives?: CSPDirectives): string {
  const defaults: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': true,
  };

  const merged = { ...defaults, ...directives };
  const parts: string[] = [];

  for (const [directive, value] of Object.entries(merged)) {
    if (value === true) {
      parts.push(directive);
    } else if (Array.isArray(value) && value.length > 0) {
      parts.push(`${directive} ${value.join(' ')}`);
    }
  }

  return parts.join('; ');
}
```

### CSP for APIs

```typescript
// Strict CSP for API responses
function buildApiCSP(): string {
  return buildCSP({
    'default-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'none'"],
  });
}
```

### CSP for Web Apps

```typescript
// CSP for web applications with CDN assets
function buildWebAppCSP(): string {
  return buildCSP({
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://cdn.example.com'],
    'style-src': ["'self'", 'https://cdn.example.com', "'unsafe-inline'"], // unsafe-inline for styled-components
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://api.example.com', 'wss://ws.example.com'],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': true,
  });
}
```

### CSP with Nonces

```typescript
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function buildCSPWithNonce(nonce: string): string {
  return buildCSP({
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", `'nonce-${nonce}'`],
  });
}

// Usage in HTML response
function createHTMLResponse(body: string): Response {
  const nonce = generateNonce();
  const csp = buildCSPWithNonce(nonce);

  // Inject nonce into script tags
  const html = body.replace(/<script/g, `<script nonce="${nonce}"`);

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Security-Policy': csp,
    },
  });
}
```

### CSP Reporting

```typescript
function buildCSPWithReporting(reportUri: string): string {
  const policy = buildCSP();
  return `${policy}; report-uri ${reportUri}`;
}

// Report-only mode for testing
function buildReportOnlyCSP(reportUri: string): Headers {
  const headers = new Headers();
  const policy = buildCSP() + `; report-uri ${reportUri}`;
  headers.set('Content-Security-Policy-Report-Only', policy);
  return headers;
}

// CSP violation handler
app.post('/csp-report', async (c) => {
  const report = await c.req.json();

  console.log('CSP Violation:', {
    blockedUri: report['csp-report']?.['blocked-uri'],
    violatedDirective: report['csp-report']?.['violated-directive'],
    documentUri: report['csp-report']?.['document-uri'],
  });

  return c.text('OK');
});
```

## Permissions-Policy

### Building Permissions Policy

```typescript
interface PermissionsPolicyDirectives {
  accelerometer?: string[];
  camera?: string[];
  geolocation?: string[];
  gyroscope?: string[];
  magnetometer?: string[];
  microphone?: string[];
  payment?: string[];
  usb?: string[];
  fullscreen?: string[];
  'picture-in-picture'?: string[];
}

function buildPermissionsPolicy(directives?: PermissionsPolicyDirectives): string {
  const defaults: PermissionsPolicyDirectives = {
    accelerometer: [],
    camera: [],
    geolocation: [],
    gyroscope: [],
    magnetometer: [],
    microphone: [],
    payment: [],
    usb: [],
  };

  const merged = { ...defaults, ...directives };
  const parts: string[] = [];

  for (const [feature, origins] of Object.entries(merged)) {
    if (origins.length === 0) {
      parts.push(`${feature}=()`); // Disable feature
    } else if (origins.includes('*')) {
      parts.push(`${feature}=*`); // Allow all
    } else {
      parts.push(`${feature}=(${origins.join(' ')})`);
    }
  }

  return parts.join(', ');
}

// Allow camera only for specific domain
const policy = buildPermissionsPolicy({
  camera: ['self', 'https://video.example.com'],
  geolocation: ['self'],
});
```

## Strict-Transport-Security (HSTS)

```typescript
interface HSTSOptions {
  maxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
}

function buildHSTS(options: HSTSOptions = {}): string {
  const { maxAge = 31536000, includeSubDomains = true, preload = false } = options;

  let value = `max-age=${maxAge}`;

  if (includeSubDomains) {
    value += '; includeSubDomains';
  }

  if (preload) {
    value += '; preload';
  }

  return value;
}
```

## Security Headers Middleware

```typescript
interface SecurityHeadersOptions {
  csp?: CSPDirectives;
  hsts?: HSTSOptions;
  permissionsPolicy?: PermissionsPolicyDirectives;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  referrerPolicy?: string;
}

function securityHeaders(options: SecurityHeadersOptions = {}) {
  return async (c: Context, next: Next) => {
    await next();

    const response = c.res;
    const headers = new Headers(response.headers);

    // X-Content-Type-Options
    headers.set('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    headers.set('X-Frame-Options', options.xFrameOptions || 'DENY');

    // X-XSS-Protection
    headers.set('X-XSS-Protection', '1; mode=block');

    // HSTS
    headers.set('Strict-Transport-Security', buildHSTS(options.hsts));

    // Referrer-Policy
    headers.set(
      'Referrer-Policy',
      options.referrerPolicy || 'strict-origin-when-cross-origin'
    );

    // CSP
    if (options.csp) {
      headers.set('Content-Security-Policy', buildCSP(options.csp));
    }

    // Permissions-Policy
    if (options.permissionsPolicy) {
      headers.set('Permissions-Policy', buildPermissionsPolicy(options.permissionsPolicy));
    }

    // Remove server information
    headers.delete('Server');
    headers.delete('X-Powered-By');

    c.res = new Response(response.body, {
      status: response.status,
      headers,
    });
  };
}

// Usage
const app = new Hono();

app.use('*', securityHeaders({
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://cdn.example.com'],
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  permissionsPolicy: {
    camera: [],
    microphone: [],
  },
}));
```

## Environment-Specific Headers

```typescript
function getSecurityHeaders(env: Env): SecurityHeadersOptions {
  const baseOptions: SecurityHeadersOptions = {
    hsts: { maxAge: 31536000, includeSubDomains: true },
    xFrameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin',
  };

  if (env.ENVIRONMENT === 'development') {
    return {
      ...baseOptions,
      csp: {
        'default-src': ["'self'", 'http://localhost:*'],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // For HMR
        'connect-src': ["'self'", 'ws://localhost:*'], // For HMR websocket
      },
    };
  }

  return {
    ...baseOptions,
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'https:', 'data:'],
      'connect-src': ["'self'", 'https://api.example.com'],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': true,
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  };
}
```

## Testing Security Headers

```bash
# Check headers with curl
curl -I https://example.com

# Test with securityheaders.com
# https://securityheaders.com/?q=example.com

# Test CSP with browser DevTools
# Open Network tab, look for CSP violations in Console
```

```typescript
// Automated testing
describe('Security Headers', () => {
  it('sets required security headers', async () => {
    const response = await fetch(url);

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=');
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
  });

  it('removes server information headers', async () => {
    const response = await fetch(url);

    expect(response.headers.get('Server')).toBeNull();
    expect(response.headers.get('X-Powered-By')).toBeNull();
  });
});
```

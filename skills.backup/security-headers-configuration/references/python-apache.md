# Python Flask and Apache Security Headers

## Python Flask Implementation

```python
from flask import Flask, make_response, g
from functools import wraps
import secrets

app = Flask(__name__)

# Generate CSP nonce for each request
@app.before_request
def generate_csp_nonce():
    """Generate a cryptographically random nonce for CSP"""
    g.csp_nonce = secrets.token_urlsafe(16)

# Security headers middleware
@app.after_request
def add_security_headers(response):
    # HSTS - Force HTTPS for 1 year
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'

    # Prevent MIME sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # XSS Protection (legacy browsers)
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Referrer Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Permissions Policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

    # Content Security Policy with nonce-based style-src (no 'unsafe-inline')
    # Use {{ csp_nonce }} in templates: <style nonce="{{ csp_nonce }}">...</style>
    nonce = getattr(g, 'csp_nonce', '')
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self'; "
        f"style-src 'self' 'nonce-{nonce}'; "
        "img-src 'self' data: https:; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' https://api.example.com; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )

    return response

# CSP violation reporting endpoint
@app.route('/csp-report', methods=['POST'])
def csp_report():
    report = request.get_json(force=True)
    app.logger.warning(f'CSP Violation: {report}')
    return '', 204
```

## Flask-Talisman (Recommended Library)

```python
from flask import Flask
from flask_talisman import Talisman

app = Flask(__name__)

# CSP with nonce-based style-src (Flask-Talisman auto-generates nonces)
# IMPORTANT: Do NOT use 'unsafe-inline' - use nonce-based approach instead
csp = {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': ["'self'"],  # Flask-Talisman will automatically add 'nonce-{nonce}' when content_security_policy_nonce_in is set
    'img-src': ["'self'", "data:", "https:"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
}

# Flask-Talisman will inject nonces automatically for inline styles and scripts
# Use {{ csp_nonce() }} in templates to access the nonce:
# Example: <style nonce="{{ csp_nonce() }}">body { background: #fff; }</style>
Talisman(
    app,
    force_https=True,
    strict_transport_security=True,
    strict_transport_security_max_age=31536000,
    strict_transport_security_include_subdomains=True,
    strict_transport_security_preload=True,
    content_security_policy=csp,
    content_security_policy_nonce_in=['script-src', 'style-src'],  # Enable nonce injection
    content_security_policy_report_only=False,
    content_security_policy_report_uri='/csp-report',
    frame_options='DENY',
    x_content_type_options=True,
    x_xss_protection=True,
    referrer_policy='strict-origin-when-cross-origin',
    permissions_policy={
        'geolocation': '()',
        'microphone': '()',
        'camera': '()',
    }
)
```

## Apache .htaccess Configuration

```apache
# Enable headers module
<IfModule mod_headers.c>
    # HSTS - Force HTTPS
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

    # Prevent clickjacking
    Header always set X-Frame-Options "DENY"

    # Prevent MIME sniffing
    Header always set X-Content-Type-Options "nosniff"

    # XSS Protection
    Header always set X-XSS-Protection "1; mode=block"

    # Referrer Policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Permissions Policy
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"

    # Content Security Policy
    # IMPORTANT: Do NOT use 'unsafe-inline' - weakens XSS protection
    # For inline styles, use external stylesheets OR implement nonce-based approach:
    # 1. Generate nonce per-request (e.g., via PHP: $nonce = base64_encode(random_bytes(16)))
    # 2. Include in CSP header: "style-src 'self' 'nonce-{$nonce}'"
    # 3. Add nonce to inline styles: <style nonce="{$nonce}">...</style>
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; frame-ancestors 'none'"
</IfModule>

# Force HTTPS redirect
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Disable directory listing
Options -Indexes

# Hide server signature
ServerSignature Off
```

## Header Testing Script

```python
import requests

def test_security_headers(url):
    response = requests.get(url)
    headers = response.headers

    required = {
        'Strict-Transport-Security': 'max-age=31536000',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin',
        'Permissions-Policy': 'geolocation=()',
    }

    results = {}
    for header, expected in required.items():
        actual = headers.get(header, 'MISSING')
        results[header] = {
            'present': header in headers,
            'value': actual,
            'valid': expected in actual if actual != 'MISSING' else False
        }

    return results

# Usage
results = test_security_headers('https://example.com')
for header, status in results.items():
    icon = '✅' if status['valid'] else '❌'
    print(f"{icon} {header}: {status['value']}")
```

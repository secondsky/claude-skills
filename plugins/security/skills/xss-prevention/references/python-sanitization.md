# Python XSS Prevention

## Bleach Library

```python
import bleach

# Basic sanitization
def sanitize_html(dirty_html):
    allowed_tags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li']
    allowed_attrs = {'a': ['href', 'title']}

    return bleach.clean(
        dirty_html,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True
    )

# Link sanitization
def sanitize_url(url):
    return bleach.clean(url, tags=[], strip=True)

# Usage
user_content = '<script>alert("xss")</script><p>Hello <b>World</b></p>'
safe_content = sanitize_html(user_content)
# Result: '<p>Hello <b>World</b></p>'
```

## Flask Template Escaping

```python
from flask import Flask, render_template, Markup
from markupsafe import escape

app = Flask(__name__)

@app.route('/profile/<username>')
def profile(username):
    # Automatically escaped in templates
    return render_template('profile.html', username=username)

@app.route('/comment', methods=['POST'])
def add_comment():
    comment = request.form['comment']
    # Manual escaping when needed
    safe_comment = escape(comment)

    # If you need to render trusted HTML
    trusted_html = Markup('<b>Bold text</b>')  # Only for trusted content!

    return render_template('comment.html',
                         comment=safe_comment,
                         trusted=trusted_html)
```

```html
<!-- profile.html - Auto-escaped by Jinja2 -->
<h1>Welcome, {{ username }}</h1>

<!-- Explicitly mark as safe (DANGEROUS - only for sanitized content) -->
{{ sanitized_html | safe }}
```

## Django Template Security

```python
from django.utils.html import escape, format_html
from django.utils.safestring import mark_safe
import bleach

def clean_user_html(html_content):
    """Sanitize user HTML before storing"""
    allowed_tags = ['p', 'br', 'b', 'i', 'em', 'strong', 'a']
    allowed_attrs = {'a': ['href']}

    return bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True
    )

# In views
def comment_view(request):
    if request.method == 'POST':
        raw_content = request.POST['content']
        safe_content = clean_user_html(raw_content)
        Comment.objects.create(content=safe_content)
```

```html
<!-- Django template - auto-escaped by default -->
<p>{{ user_input }}</p>

<!-- For pre-sanitized content (like Comment.content), use |safe filter -->
<!-- Since clean_user_html() already sanitized it, safe to render -->
{% for comment in comments %}
    <div class="comment">
        {{ comment.content|safe }}
    </div>
{% endfor %}

<!-- Alternative: use autoescape off for blocks of sanitized content -->
{% autoescape off %}
    {{ already_sanitized_html }}
{% endautoescape %}
```

## Input Validation

```python
import re
from urllib.parse import urlparse

def validate_url(url):
    """Validate URL is safe to use. Returns url if valid, None otherwise."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return None
        if not parsed.netloc:
            return None
        return url
    except Exception:
        return None

def validate_username(username):
    """Validate alphanumeric username (3-30 chars). Returns username if valid, None otherwise."""
    if not isinstance(username, str):
        return None
    if re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        return username
    return None

def sanitize_filename(filename):
    """Remove path traversal and unsafe characters. Returns sanitized filename or None if empty."""
    if not isinstance(filename, str):
        return None
    sanitized = re.sub(r'[^\w\-.]', '', filename)
    # Return None if sanitization resulted in empty string
    return sanitized if sanitized else None

# Usage example
url = validate_url(user_input)
if url:
    # Safe to use
    redirect(url)
else:
    # Invalid URL
    return error("Invalid URL")

username = validate_username(user_input)
if username:
    # Valid username
    save_user(username)
else:
    # Invalid username
    return error("Invalid username format")
```

## CSP with Flask

```python
from flask import Flask, make_response
import secrets

app = Flask(__name__)

@app.after_request
def add_security_headers(response):
    nonce = secrets.token_urlsafe(16)

    csp = "; ".join([
        "default-src 'self'",
        f"script-src 'self' 'nonce-{nonce}'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "frame-ancestors 'none'",
        "base-uri 'self'"
    ])

    response.headers['Content-Security-Policy'] = csp
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'

    return response
```

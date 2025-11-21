# Advanced Node.js XSS Prevention

## Complete XSSPrevention Class

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const he = require('he');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

class XSSPrevention {
  /**
   * HTML Entity Encoding - Safest for text content
   */
  static encodeHTML(str) {
    return he.encode(str, {
      useNamedReferences: true,
      encodeEverything: false
    });
  }

  /**
   * Sanitize HTML - For rich content
   */
  static sanitizeHTML(dirty) {
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class'
      ],
      ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    };

    return DOMPurify.sanitize(dirty, config);
  }

  /**
   * Strict sanitization - For untrusted HTML
   */
  static sanitizeStrict(dirty) {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * JavaScript context encoding
   */
  static encodeForJS(str) {
    return str.replace(/[<>"'&]/g, (char) => {
      const escape = {
        '<': '\\x3C',
        '>': '\\x3E',
        '"': '\\x22',
        "'": '\\x27',
        '&': '\\x26'
      };
      return escape[char];
    });
  }

  /**
   * URL parameter encoding
   */
  static encodeURL(str) {
    return encodeURIComponent(str);
  }

  /**
   * Attribute context encoding
   */
  static encodeAttribute(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize URLs
   */
  static sanitizeURL(url) {
    try {
      const parsed = new URL(url);

      // Only allow safe protocols
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        return '';
      }

      return parsed.href;
    } catch {
      return '';
    }
  }

  /**
   * Strip all HTML tags
   */
  static stripHTML(str) {
    return str.replace(/<[^>]*>/g, '');
  }

  /**
   * React-style JSX escaping
   */
  static escapeForReact(str) {
    return {
      __html: DOMPurify.sanitize(str)
    };
  }
}

module.exports = XSSPrevention;
```

## Express Middleware

```javascript
// Express middleware
function xssProtection(req, res, next) {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

function sanitizeObject(obj) {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = XSSPrevention.stripHTML(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Express example
const express = require('express');
const app = express();

app.use(express.json());
app.use(xssProtection);

app.post('/api/comments', (req, res) => {
  const { comment } = req.body;

  // Additional sanitization for rich content
  const safeComment = XSSPrevention.sanitizeHTML(comment);

  // Store in database
  // db.comments.insert({ content: safeComment });

  res.json({ comment: safeComment });
});
```

## React Components

```javascript
// React XSS-safe components
import React from 'react';
import DOMPurify from 'dompurify';

// Safe text rendering (React automatically escapes)
function SafeText({ text }) {
  return <div>{text}</div>;
}

// Sanitized HTML rendering
function SafeHTML({ html }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href']
  });

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitized }} />
  );
}

// Safe URL attribute
function SafeLink({ href, children }) {
  const safeHref = sanitizeURL(href);

  return (
    <a
      href={safeHref}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function sanitizeURL(url) {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.href;
  } catch {
    return '';
  }
}

// Input sanitization hook
function useSanitizedInput(initialValue = '') {
  const [value, setValue] = React.useState(initialValue);

  const handleChange = (e) => {
    const sanitized = DOMPurify.sanitize(e.target.value, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true
    });

    setValue(sanitized);
  };

  return [value, handleChange];
}

// Usage
function CommentForm() {
  const [comment, handleCommentChange] = useSanitizedInput();

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={comment}
        onChange={handleCommentChange}
        placeholder="Enter comment"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export { SafeText, SafeHTML, SafeLink, useSanitizedInput };
```

## Helmet CSP Configuration

```javascript
const helmet = require('helmet');
const crypto = require('crypto');

function setupCSP(app) {
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],

      // Only allow scripts from trusted sources
      scriptSrc: [
        "'self'",
        "'nonce-RANDOM_NONCE'", // Use dynamic nonces
        "https://cdn.example.com"
      ],

      // Styles
      styleSrc: [
        "'self'",
        "'nonce-RANDOM_NONCE'",
        "https://fonts.googleapis.com"
      ],

      // No inline styles/scripts
      objectSrc: ["'none'"],
      baseUri: ["'self'"],

      // Report violations
      reportUri: ['/api/csp-violations']
    }
  }));

  // CSP violation reporter
  app.post('/api/csp-violations', (req, res) => {
    console.error('CSP Violation:', req.body);
    res.status(204).end();
  });
}

// Generate nonce for inline scripts
function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

// Express middleware to add nonce
app.use((req, res, next) => {
  res.locals.nonce = generateNonce();
  next();
});

// In templates: <script nonce="<%= nonce %>">
```

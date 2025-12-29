# Fetch API in Cloudflare Workers

Complete guide to making HTTP requests from Workers.

## Basic Fetch

```typescript
// GET request
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// POST request
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
});
```

## Request Options

```typescript
interface FetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers: HeadersInit;
  body: BodyInit | null;
  redirect: 'follow' | 'manual' | 'error';
  signal: AbortSignal;
  cf: RequestInitCfProperties; // Cloudflare-specific
}
```

### Cloudflare-Specific Options

```typescript
const response = await fetch(url, {
  cf: {
    // Cache settings
    cacheTtl: 300,
    cacheEverything: true,
    cacheKey: 'custom-key',

    // Polish (image optimization)
    polish: 'lossy',
    minify: { javascript: true, css: true, html: true },

    // Mirage (image lazy loading)
    mirage: true,

    // Resolve override
    resolveOverride: 'example.com',

    // Scrape shield
    scrapeShield: false,

    // Apps
    apps: false,
  },
});
```

## Timeout with AbortController

```typescript
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage
try {
  const response = await fetchWithTimeout('https://slow-api.com', {}, 3000);
} catch (error) {
  console.error('Fetch failed:', error.message);
}
```

## Retry with Exponential Backoff

```typescript
interface RetryOptions {
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryOn?: (response: Response) => boolean;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryOn = (r) => r.status >= 500,
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok || !retryOn(response)) {
        return response;
      }

      // Should retry
      if (attempt < retries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        return response; // Return last response if all retries exhausted
      }
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
```

## Response Handling

### Reading Response Body

```typescript
// JSON
const json = await response.json();

// Text
const text = await response.text();

// ArrayBuffer
const buffer = await response.arrayBuffer();

// Blob
const blob = await response.blob();

// FormData
const formData = await response.formData();

// Stream
const stream = response.body; // ReadableStream
```

### Response Cloning

```typescript
// Body can only be read once - clone if needed multiple times
const response = await fetch(url);
const clone = response.clone();

const json = await response.json();
const text = await clone.text(); // Can read clone separately
```

### Checking Response

```typescript
const response = await fetch(url);

// Status checks
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

// Headers
const contentType = response.headers.get('Content-Type');
const cacheControl = response.headers.get('Cache-Control');

// Redirected?
if (response.redirected) {
  console.log('Redirected to:', response.url);
}
```

## Proxy Pattern

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Rewrite to backend
    url.hostname = 'api.backend.com';
    url.port = '';
    url.protocol = 'https:';

    // Forward request
    const backendRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'manual',
    });

    // Remove headers that shouldn't be forwarded
    backendRequest.headers.delete('cf-connecting-ip');
    backendRequest.headers.set('X-Forwarded-For', request.headers.get('cf-connecting-ip') || '');

    const response = await fetch(backendRequest);

    // Modify response if needed
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('X-Proxy', 'cloudflare-worker');

    return modifiedResponse;
  },
};
```

## Parallel Requests

```typescript
// Promise.all for independent requests
const [users, posts, comments] = await Promise.all([
  fetch('https://api.example.com/users').then((r) => r.json()),
  fetch('https://api.example.com/posts').then((r) => r.json()),
  fetch('https://api.example.com/comments').then((r) => r.json()),
]);

// Promise.allSettled for fault-tolerant parallel
const results = await Promise.allSettled([
  fetch('https://api1.example.com/data'),
  fetch('https://api2.example.com/data'),
  fetch('https://api3.example.com/data'),
]);

const successfulResponses = results
  .filter((r) => r.status === 'fulfilled')
  .map((r) => r.value);
```

## Streaming Request Body

```typescript
// Stream large file upload
async function uploadLargeFile(url: string, file: ReadableStream): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: file,
    // @ts-ignore - duplex required for streaming body
    duplex: 'half',
  });
}
```

## Error Handling

```typescript
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorBody = await response.text();
        errorMessage += `: ${errorBody.substring(0, 200)}`;
      } catch {
        errorMessage += `: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request was aborted');
    }
    if (error.name === 'TypeError') {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}
```

## CORS Handling

```typescript
// Add CORS headers to response
function addCorsHeaders(response: Response, origin: string = '*'): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', origin);
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  newResponse.headers.set('Access-Control-Max-Age', '86400');
  return newResponse;
}

// Handle preflight
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handleRequest(request);
    return addCorsHeaders(response);
  },
};
```

## Best Practices

1. **Always handle errors** - Network can fail anytime
2. **Set timeouts** - Don't let requests hang indefinitely
3. **Use retry for transient failures** - 5xx errors often recover
4. **Clone before reading body** - Body stream can only be consumed once
5. **Stream large responses** - Don't buffer entire response in memory
6. **Cache where appropriate** - Reduce latency and external API load
7. **Add request IDs** - For debugging and tracing

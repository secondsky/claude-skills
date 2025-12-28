# R2 Performance Optimization

**Last Updated**: 2025-12-27

Optimize R2 performance with caching strategies, compression, range requests, ETags, and monitoring best practices.

---

## Overview

R2 provides excellent baseline performance, but following optimization patterns can significantly improve response times, reduce bandwidth costs, and enhance user experience.

**Key Optimization Areas**:
- Caching (browser, CDN, Workers)
- Compression and content encoding
- Range requests for large files
- ETags and conditional requests
- Connection pooling and reuse
- Bandwidth optimization
- Monitoring and metrics

---

## Caching Strategies

### Browser Caching

Set appropriate `Cache-Control` headers for client-side caching:

```typescript
// Immutable assets (hashed filenames)
await env.MY_BUCKET.put('assets/app-abc123.js', data, {
  httpMetadata: {
    contentType: 'application/javascript',
    cacheControl: 'public, max-age=31536000, immutable',  // 1 year
  },
});

// Frequently changing content
await env.MY_BUCKET.put('api/data.json', data, {
  httpMetadata: {
    contentType: 'application/json',
    cacheControl: 'public, max-age=300, must-revalidate',  // 5 minutes
  },
});

// Private user data
await env.MY_BUCKET.put('user/profile.jpg', data, {
  httpMetadata: {
    contentType: 'image/jpeg',
    cacheControl: 'private, max-age=3600',  // 1 hour, browser only
  },
});

// No caching (sensitive or dynamic)
await env.MY_BUCKET.put('sensitive/document.pdf', data, {
  httpMetadata: {
    contentType: 'application/pdf',
    cacheControl: 'no-store, no-cache, must-revalidate',
  },
});
```

**Cache-Control Directives**:
- `public` - Can be cached by browsers and CDNs
- `private` - Only browser caching (not CDNs)
- `max-age=N` - Cache for N seconds
- `immutable` - Content never changes (perfect for hashed files)
- `must-revalidate` - Check with server before using stale cache
- `no-store` - Never cache
- `no-cache` - Cache but always validate

### Cloudflare CDN Caching

R2 integrates seamlessly with Cloudflare's CDN:

```typescript
import { Hono } from 'hono';

type Bindings = {
  ASSETS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Serve assets with CDN caching
app.get('/assets/*', async (c) => {
  const key = c.req.param('*');
  const object = await c.env.ASSETS.get(key);

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);

  // Override cache headers for CDN
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('CDN-Cache-Control', 'public, max-age=86400');  // CDN caches for 24 hours

  return new Response(object.body, { headers });
});

export default app;
```

**CDN-Cache-Control Header**:
```typescript
// Different caching for browser vs CDN
headers.set('Cache-Control', 'public, max-age=3600');          // Browser: 1 hour
headers.set('CDN-Cache-Control', 'public, max-age=86400');    // CDN: 24 hours
```

### Workers KV Caching Layer

Use KV as a caching layer for frequently accessed small objects:

```typescript
type Bindings = {
  MY_BUCKET: R2Bucket;
  CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/cached/:filename', async (c) => {
  const filename = c.req.param('filename');
  const cacheKey = `r2:${filename}`;

  // Check KV cache first
  const cached = await c.env.CACHE.get(cacheKey, { type: 'arrayBuffer' });

  if (cached) {
    console.log('Cache HIT:', filename);
    return new Response(cached, {
      headers: {
        'X-Cache': 'HIT',
        'Content-Type': 'application/octet-stream',
      },
    });
  }

  console.log('Cache MISS:', filename);

  // Fetch from R2
  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const data = await object.arrayBuffer();

  // Store in KV cache (if < 25MB)
  if (data.byteLength < 25 * 1024 * 1024) {
    await c.env.CACHE.put(cacheKey, data, {
      expirationTtl: 3600,  // Cache for 1 hour
    });
  }

  return new Response(data, {
    headers: {
      'X-Cache': 'MISS',
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    },
  });
});
```

---

## Compression and Content Encoding

### Gzip/Brotli Compression

Compress files before uploading to R2:

```typescript
import { gzip, brotli } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotli);

// Upload with gzip compression
async function uploadCompressed(key: string, data: Buffer, env: Bindings) {
  const compressed = await gzipAsync(data);

  await env.MY_BUCKET.put(key, compressed, {
    httpMetadata: {
      contentType: 'application/javascript',
      contentEncoding: 'gzip',
    },
  });

  console.log(
    `Compression ratio: ${((compressed.length / data.length) * 100).toFixed(1)}%`
  );
}

// Upload with Brotli (better compression)
async function uploadBrotliCompressed(key: string, data: Buffer, env: Bindings) {
  const compressed = await brotliAsync(data);

  await env.MY_BUCKET.put(key, compressed, {
    httpMetadata: {
      contentType: 'text/html',
      contentEncoding: 'br',  // Brotli
    },
  });

  console.log(
    `Brotli compression: ${data.length} → ${compressed.length} bytes`
  );
}
```

**Compression Tips**:
- Gzip: Good for most text files (HTML, CSS, JS, JSON)
- Brotli: Better compression but slower (use for static assets)
- Don't compress images/videos (already compressed)
- Pre-compress at build time, not on upload

### Automatic Compression in Workers

```typescript
app.get('/assets/:filename', async (c) => {
  const filename = c.req.param('filename');
  const acceptEncoding = c.req.header('Accept-Encoding') || '';

  // Determine best compression
  const supportsBrotli = acceptEncoding.includes('br');
  const supportsGzip = acceptEncoding.includes('gzip');

  let key = filename;
  let contentEncoding = '';

  if (supportsBrotli) {
    key = `${filename}.br`;
    contentEncoding = 'br';
  } else if (supportsGzip) {
    key = `${filename}.gz`;
    contentEncoding = 'gzip';
  }

  // Try compressed version first
  let object = await c.env.ASSETS.get(key);

  if (!object) {
    // Fallback to uncompressed
    object = await c.env.ASSETS.get(filename);
    contentEncoding = '';
  }

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'text/plain',
      'Content-Encoding': contentEncoding,
      'Vary': 'Accept-Encoding',
    },
  });
});
```

---

## Range Requests

Support partial content delivery for large files (videos, downloads):

```typescript
app.get('/video/:filename', async (c) => {
  const filename = c.req.param('filename');
  const rangeHeader = c.req.header('Range');

  const object = await c.env.VIDEOS.get(filename);

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  // No range request - return entire file
  if (!rangeHeader) {
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'video/mp4',
        'Content-Length': object.size.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  // Parse range header: "bytes=0-1023"
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);

  if (!match) {
    return c.json({ error: 'Invalid range header' }, 400);
  }

  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : object.size - 1;

  // Validate range
  if (start >= object.size || end >= object.size || start > end) {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${object.size}`,
      },
    });
  }

  // Fetch range from R2
  const rangeObject = await c.env.VIDEOS.get(filename, {
    range: { offset: start, length: end - start + 1 },
  });

  if (!rangeObject) {
    return c.json({ error: 'Range not satisfiable' }, 416);
  }

  return new Response(rangeObject.body, {
    status: 206,
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'video/mp4',
      'Content-Length': (end - start + 1).toString(),
      'Content-Range': `bytes ${start}-${end}/${object.size}`,
      'Accept-Ranges': 'bytes',
    },
  });
});
```

**Benefits of Range Requests**:
- Video streaming (start playback before full download)
- Resume interrupted downloads
- Parallel chunk downloads
- Reduce bandwidth for partial reads

---

## ETags and Conditional Requests

Use ETags to avoid transferring unchanged data:

```typescript
app.get('/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  const ifNoneMatch = c.req.header('If-None-Match');

  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  // Check if client's cached version matches
  if (ifNoneMatch === object.httpEtag) {
    return new Response(null, {
      status: 304,  // Not Modified
      headers: {
        'ETag': object.httpEtag,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'ETag': object.httpEtag,
      'Cache-Control': 'public, max-age=3600',
    },
  });
});
```

**Conditional Uploads** (prevent race conditions):

```typescript
// Update only if ETag matches (optimistic locking)
app.put('/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  const ifMatch = c.req.header('If-Match');

  const data = await c.req.arrayBuffer();

  // Use conditional put to prevent overwrites
  try {
    await c.env.MY_BUCKET.put(filename, data, {
      httpMetadata: {
        contentType: c.req.header('content-type') || 'application/octet-stream',
      },
      onlyIf: {
        etagMatches: ifMatch,  // Only write if ETag matches
      },
    });

    return c.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('precondition')) {
      return c.json({
        error: 'File was modified by another process',
      }, 412);
    }
    throw error;
  }
});
```

---

## Bandwidth Optimization

### Lazy Loading and Pagination

```typescript
// List objects with pagination
app.get('/files', async (c) => {
  const cursor = c.req.query('cursor');
  const limit = parseInt(c.req.query('limit') || '100');

  const listed = await c.env.MY_BUCKET.list({
    limit: Math.min(limit, 1000),  // Cap at 1000
    cursor: cursor || undefined,
  });

  return c.json({
    files: listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    })),
    hasMore: listed.truncated,
    cursor: listed.cursor,
  });
});
```

### Head Requests for Metadata

Use `head()` to check existence without downloading:

```typescript
// Check if file exists before download
app.get('/check/:filename', async (c) => {
  const filename = c.req.param('filename');

  const object = await c.env.MY_BUCKET.head(filename);

  if (!object) {
    return c.json({ exists: false }, 404);
  }

  return c.json({
    exists: true,
    size: object.size,
    contentType: object.httpMetadata?.contentType,
    etag: object.httpEtag,
    uploaded: object.uploaded,
  });
});
```

---

## Monitoring and Metrics

### Performance Logging

```typescript
app.get('/download/:filename', async (c) => {
  const startTime = Date.now();
  const filename = c.req.param('filename');

  try {
    const object = await c.env.MY_BUCKET.get(filename);

    if (!object) {
      return c.json({ error: 'Not found' }, 404);
    }

    const downloadTime = Date.now() - startTime;

    // Log performance metrics
    console.log(JSON.stringify({
      event: 'r2_download',
      filename,
      size: object.size,
      duration_ms: downloadTime,
      throughput_mbps: (object.size / downloadTime / 1000 * 8).toFixed(2),
    }));

    return new Response(object.body, {
      headers: {
        'X-Response-Time': `${downloadTime}ms`,
      },
    });
  } catch (error) {
    const errorTime = Date.now() - startTime;

    console.error(JSON.stringify({
      event: 'r2_download_error',
      filename,
      duration_ms: errorTime,
      error: error.message,
    }));

    throw error;
  }
});
```

### Analytics with Workers Analytics Engine

```typescript
type Bindings = {
  MY_BUCKET: R2Bucket;
  ANALYTICS: AnalyticsEngineDataset;
};

app.get('/files/:filename', async (c) => {
  const startTime = Date.now();
  const filename = c.req.param('filename');

  const object = await c.env.MY_BUCKET.get(filename);

  if (!object) {
    return c.json({ error: 'Not found' }, 404);
  }

  const duration = Date.now() - startTime;

  // Write to Analytics Engine
  c.env.ANALYTICS.writeDataPoint({
    blobs: [filename],
    doubles: [object.size, duration],
    indexes: ['r2_access'],
  });

  return new Response(object.body);
});
```

---

## Performance Best Practices

### 1. Use Correct Content-Type

```typescript
// Always set correct content-type
await env.BUCKET.put(key, data, {
  httpMetadata: {
    contentType: 'image/jpeg',  // Not 'application/octet-stream'
  },
});
```

### 2. Compress Text Files

```typescript
// Compress JS/CSS/HTML at build time
const compressed = await gzipAsync(data);
await env.BUCKET.put('app.js', compressed, {
  httpMetadata: {
    contentType: 'application/javascript',
    contentEncoding: 'gzip',
  },
});
```

### 3. Set Aggressive Caching for Static Assets

```typescript
// Hash-based filenames enable long caching
await env.BUCKET.put('app-abc123.js', data, {
  httpMetadata: {
    cacheControl: 'public, max-age=31536000, immutable',
  },
});
```

### 4. Use CDN for Global Distribution

```typescript
// Cloudflare CDN automatically caches R2 objects
// Set appropriate Cache-Control headers
```

### 5. Batch Operations

```typescript
// Good: Batch delete
await env.BUCKET.delete(['file1.txt', 'file2.txt', 'file3.txt']);

// Bad: Loop delete
for (const file of files) {
  await env.BUCKET.delete(file);  // Slow!
}
```

### 6. Use Metadata for Filtering

```typescript
// Store metadata for efficient filtering
await env.BUCKET.put(key, data, {
  customMetadata: {
    category: 'images',
    public: 'true',
  },
});

// Filter in application
const listed = await env.BUCKET.list({ prefix: 'images/' });
const publicImages = listed.objects.filter(
  obj => obj.customMetadata?.public === 'true'
);
```

### 7. Monitor and Alert

```typescript
// Set up alerts for slow requests
if (duration > 1000) {
  console.error(`Slow R2 request: ${filename} took ${duration}ms`);
  // Send alert to monitoring system
}
```

---

## Troubleshooting Performance Issues

### Slow Downloads

**Problem**: Downloads taking longer than expected

**Solutions**:
- Check object size - large files naturally take longer
- Verify compression is enabled for text files
- Ensure CDN caching is configured
- Check network latency to Cloudflare edge
- Use range requests for large files

### High Bandwidth Costs

**Problem**: Unexpectedly high bandwidth usage

**Solutions**:
- Enable compression (can reduce by 70%+)
- Set aggressive caching headers
- Use CDN to reduce origin requests
- Implement head() checks before downloads
- Lazy load images and files

### Cache Misses

**Problem**: Low cache hit ratio

**Solutions**:
- Increase cache TTL (max-age)
- Use consistent URLs (avoid query parameters)
- Set `Vary` header correctly
- Check CDN purge frequency
- Monitor cache hit ratio with analytics

---

## Official Documentation

- **R2 Performance**: https://developers.cloudflare.com/r2/performance/
- **Caching**: https://developers.cloudflare.com/cache/
- **Range Requests**: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#ranged-reads
- **ETags**: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/#conditional-operations
- **Analytics Engine**: https://developers.cloudflare.com/analytics/analytics-engine/

---

**Optimize R2 performance for faster, cheaper, better user experience!**

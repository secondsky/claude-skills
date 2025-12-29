# Node.js API Compatibility in Workers

Comprehensive reference for Node.js API compatibility and polyfills in Cloudflare Workers.

## Compatibility Flags

Enable Node.js compatibility in `wrangler.jsonc`:

```jsonc
{
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat_v2"]
}
```

**Note:** `nodejs_compat_v2` supersedes `nodejs_compat` with better support.

## Supported APIs

### Buffer

```typescript
// Import explicitly
import { Buffer } from 'node:buffer';

// Usage
const buf = Buffer.from('Hello');
const base64 = buf.toString('base64');
const hex = buf.toString('hex');
const utf8 = buf.toString('utf-8');

// ArrayBuffer interop
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const newBuf = Buffer.from(arrayBuffer);
```

### Crypto

```typescript
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';

// Hashing
const hash = createHash('sha256').update('data').digest('hex');

// HMAC
const hmac = createHmac('sha256', 'secret').update('data').digest('base64');

// Random bytes
const bytes = randomBytes(32);

// UUID
const uuid = randomUUID();

// Note: Some methods not supported (scrypt, etc.)
// Use Web Crypto API instead:
const webHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('data'));
```

### Stream

```typescript
import { Readable, Writable, Transform, pipeline } from 'node:stream';
import { promisify } from 'node:util';

const pipelineAsync = promisify(pipeline);

// Create readable stream
const readable = Readable.from(['Hello', ' ', 'World']);

// Transform stream
const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
});

// Use with fetch Response
const response = new Response(Readable.toWeb(readable));

// Web Stream to Node Stream
const webStream = response.body;
const nodeStream = Readable.fromWeb(webStream);
```

### Events

```typescript
import { EventEmitter } from 'node:events';

class MyEmitter extends EventEmitter {}

const emitter = new MyEmitter();

emitter.on('event', (data) => {
  console.log('Received:', data);
});

emitter.emit('event', { message: 'Hello' });
```

### Path

```typescript
import path from 'node:path';

// All methods supported
const joined = path.join('dir', 'subdir', 'file.txt');
const parsed = path.parse('/home/user/file.txt');
const basename = path.basename('/home/user/file.txt');
const dirname = path.dirname('/home/user/file.txt');
const extname = path.extname('/home/user/file.txt');
const normalized = path.normalize('/home//user/../user/file.txt');
```

### Util

```typescript
import { promisify, inspect, types } from 'node:util';

// Promisify
const wait = promisify(setTimeout);
await wait(1000);

// Inspect
const str = inspect({ nested: { object: true } });

// Type checking
types.isDate(new Date()); // true
types.isPromise(Promise.resolve()); // true
types.isArrayBuffer(new ArrayBuffer(8)); // true
```

### Assert

```typescript
import assert from 'node:assert';

assert.ok(true);
assert.strictEqual(1 + 1, 2);
assert.deepStrictEqual({ a: 1 }, { a: 1 });
assert.throws(() => { throw new Error('test'); });
await assert.rejects(Promise.reject(new Error('test')));
```

### String Decoder

```typescript
import { StringDecoder } from 'node:string_decoder';

const decoder = new StringDecoder('utf8');
const result = decoder.write(Buffer.from('Hello'));
```

### URL

```typescript
import { URL, URLSearchParams } from 'node:url';

// Standard Web APIs (always available)
const url = new URL('https://example.com/path?query=value');
const params = new URLSearchParams({ a: '1', b: '2' });
```

### Querystring

```typescript
import querystring from 'node:querystring';

const parsed = querystring.parse('foo=bar&baz=qux');
const stringified = querystring.stringify({ foo: 'bar', baz: 'qux' });
```

## Unsupported APIs

### File System (fs)

```typescript
// NOT SUPPORTED
import fs from 'node:fs'; // ❌

// ALTERNATIVES
// Use R2 for file storage
const file = await env.BUCKET.get('path/to/file');
const content = await file?.text();

// Use KV for small files
const data = await env.KV.get('file-content');

// Read static assets (bundled at build)
import content from './data.txt';
```

### Child Process

```typescript
// NOT SUPPORTED
import { spawn, exec } from 'node:child_process'; // ❌

// No direct alternative - Workers can't spawn processes
// Consider:
// 1. Move computation to build time
// 2. Use external API for processing
// 3. Use WebAssembly for CPU-intensive tasks
```

### Net/TLS

```typescript
// NOT SUPPORTED
import net from 'node:net'; // ❌
import tls from 'node:tls'; // ❌

// ALTERNATIVES
// Use fetch for HTTP
const response = await fetch('https://api.example.com');

// Use WebSocket for persistent connections
const ws = new WebSocket('wss://api.example.com');

// TCP connections via Cloudflare Hyperdrive
const socket = env.HYPERDRIVE.connect();
```

### Cluster/Worker Threads

```typescript
// NOT SUPPORTED
import cluster from 'node:cluster'; // ❌
import { Worker } from 'node:worker_threads'; // ❌

// Workers automatically scale globally
// Use Durable Objects for coordination
```

### OS/Process

```typescript
// PARTIALLY SUPPORTED
// process.env - use env parameter instead
const apiKey = env.API_KEY;

// process.version, process.platform - limited support
// os module - not supported

// ALTERNATIVE
const runtime = {
  platform: 'cloudflare-workers',
  version: '1.0.0',
};
```

## Polyfill Patterns

### fs.readFile → KV/R2

```typescript
// Original Node.js
import fs from 'node:fs/promises';
const content = await fs.readFile('config.json', 'utf-8');
const config = JSON.parse(content);

// Workers with KV
interface Env {
  CONFIG: KVNamespace;
}

async function getConfig(env: Env) {
  const content = await env.CONFIG.get('config.json');
  return content ? JSON.parse(content) : null;
}

// Workers with bundled file
import config from './config.json';
```

### setTimeout/setInterval → Scheduled Tasks

```typescript
// Original Node.js
setInterval(() => {
  cleanupOldData();
}, 60000);

// Workers with Cron Triggers
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    await cleanupOldData(env);
  },
};

// wrangler.jsonc
{
  "triggers": {
    "crons": ["*/1 * * * *"] // Every minute
  }
}
```

### setTimeout → waitUntil

```typescript
// Original Node.js (delay response)
setTimeout(() => {
  cleanup();
}, 0);
res.send('OK');

// Workers (background processing)
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Return immediately
    const response = new Response('OK');

    // Run cleanup in background
    ctx.waitUntil(cleanup(env));

    return response;
  },
};
```

### http.request → fetch

```typescript
// Original Node.js
import http from 'node:http';

const req = http.request({
  hostname: 'api.example.com',
  port: 443,
  path: '/data',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(JSON.parse(data)); });
});

req.write(JSON.stringify({ key: 'value' }));
req.end();

// Workers with fetch
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' }),
});
const data = await response.json();
```

### DNS → fetch with DNS over HTTPS

```typescript
// Original Node.js
import dns from 'node:dns/promises';
const addresses = await dns.resolve('example.com', 'A');

// Workers (limited support)
// Use fetch - DNS is handled by platform

// For explicit DNS lookups, use DNS over HTTPS
async function resolveDNS(domain: string): Promise<string[]> {
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
    { headers: { Accept: 'application/dns-json' } }
  );
  const data = await response.json();
  return data.Answer?.map((a: any) => a.data) || [];
}
```

## Common Migration Patterns

### Environment Variables

```typescript
// Node.js
const config = {
  apiKey: process.env.API_KEY,
  dbUrl: process.env.DATABASE_URL,
  debug: process.env.DEBUG === 'true',
};

// Workers
interface Env {
  API_KEY: string;
  DATABASE_URL: string;
  DEBUG: string;
}

function getConfig(env: Env) {
  return {
    apiKey: env.API_KEY,
    dbUrl: env.DATABASE_URL,
    debug: env.DEBUG === 'true',
  };
}
```

### Global Variables

```typescript
// Node.js
global.cache = new Map();

// Workers (use KV or Durable Objects for persistence)
// In-memory cache (per-isolate, not shared)
const cache = new Map();

// Or with caches API
const cache = await caches.open('my-cache');
await cache.put(request, response);
const cached = await cache.match(request);

// Or with KV
await env.CACHE.put('key', 'value');
const value = await env.CACHE.get('key');
```

### Async Local Storage

```typescript
// Node.js
import { AsyncLocalStorage } from 'node:async_hooks';

const requestContext = new AsyncLocalStorage<{ requestId: string }>();

// Works in Workers with nodejs_compat_v2
export default {
  async fetch(request: Request): Promise<Response> {
    const requestId = crypto.randomUUID();

    return requestContext.run({ requestId }, async () => {
      // Access context anywhere
      const ctx = requestContext.getStore();
      console.log('Request ID:', ctx?.requestId);

      return handleRequest(request);
    });
  },
};
```

## Dependency Compatibility

Common npm packages and their Workers compatibility:

| Package | Status | Alternative |
|---------|--------|-------------|
| `axios` | ⚠️ Partial | Use `fetch` |
| `lodash` | ✅ Works | - |
| `moment` | ✅ Works | Use `date-fns` (smaller) |
| `uuid` | ✅ Works | Use `crypto.randomUUID()` |
| `bcrypt` | ❌ Native | Use `bcryptjs` |
| `sharp` | ❌ Native | Use Cloudflare Images |
| `puppeteer` | ❌ Native | Use Browser Rendering API |
| `pg` | ⚠️ Needs adapter | Use Hyperdrive |
| `mysql2` | ⚠️ Needs adapter | Use Hyperdrive |
| `mongoose` | ❌ MongoDB | Use D1/Workers KV |
| `prisma` | ⚠️ Needs D1 adapter | Use Drizzle |
| `zod` | ✅ Works | - |
| `joi` | ✅ Works | - |
| `jsonwebtoken` | ⚠️ Partial | Use `jose` |
| `express` | ❌ Not compatible | Use Hono |

## Testing Compatibility

Check if a package works in Workers:

```typescript
// Test in wrangler dev
export default {
  async fetch(): Promise<Response> {
    try {
      // Import and test package
      const _ = await import('lodash');
      const result = _.chunk([1, 2, 3, 4], 2);

      return Response.json({ works: true, result });
    } catch (error) {
      return Response.json({
        works: false,
        error: error.message,
      });
    }
  },
};
```

## Migration Checklist

1. [ ] Enable `nodejs_compat_v2` flag
2. [ ] Replace `require()` with ESM `import`
3. [ ] Add `node:` prefix to Node.js imports
4. [ ] Replace `fs` with KV/R2
5. [ ] Replace `http/https` with `fetch`
6. [ ] Replace `process.env` with `env` parameter
7. [ ] Check npm dependencies for compatibility
8. [ ] Replace native modules with pure JS alternatives
9. [ ] Test with `wrangler dev`
10. [ ] Profile for CPU limit compliance

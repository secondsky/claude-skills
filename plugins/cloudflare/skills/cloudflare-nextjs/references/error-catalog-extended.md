# Cloudflare Next.js - Extended Error Catalog

**Complete Error Reference** - Load this file when encountering ANY error during Next.js on Cloudflare Workers setup, build, or deployment.

This comprehensive catalog documents 11+ known errors with root causes, solutions, and official sources.

---

## 1. Worker Size Limit Exceeded (3 MiB - Free Plan)

**Error**: `"Your Worker exceeded the size limit of 3 MiB"`

**Cause**: Workers Free plan limits Worker size to 3 MiB (gzip-compressed)

**Solutions**:
- Upgrade to Workers Paid plan (10 MiB limit)
- Analyze bundle size and remove unused dependencies
- Use dynamic imports to code-split large dependencies

**Bundle analysis**:
```bash
bunx opennextjs-cloudflare build
cd .open-next/server-functions/default
# Analyze handler.mjs.meta.json with ESBuild Bundle Analyzer
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#worker-size-limits

---

## 2. Worker Size Limit Exceeded (10 MiB - Paid Plan)

**Error**: `"Your Worker exceeded the size limit of 10 MiB"`

**Cause**: Unnecessary code bundled into Worker

**Debug workflow**:
1. Run `bunx opennextjs-cloudflare build`
2. Navigate to `.open-next/server-functions/default`
3. Analyze `handler.mjs.meta.json` using ESBuild Bundle Analyzer
4. Identify and remove/externalize large dependencies

**Source**: https://opennext.js.org/cloudflare/troubleshooting#worker-size-limits

---

## 3. FinalizationRegistry Not Defined

**Error**: `"ReferenceError: FinalizationRegistry is not defined"`

**Cause**: `compatibility_date` in wrangler.jsonc is too old

**Solution**: Update `compatibility_date` to `2025-05-05` or later:

```jsonc
{
  "compatibility_date": "2025-05-05"  // Minimum for FinalizationRegistry
}
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#finalizationregistry-is-not-defined

---

## 4. Cannot Perform I/O on Behalf of Different Request

**Error**: `"Cannot perform I/O on behalf of a different request"`

**Cause**: Database client created globally and reused across requests

**Problem code**:
```typescript
// ❌ WRONG: Global DB client
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  // This will fail - pool created in different request context
  const result = await pool.query('SELECT * FROM users');
  return Response.json(result);
}
```

**Solution**: Create database clients inside request handlers:

```typescript
// ✅ CORRECT: Request-scoped DB client
import { Pool } from 'pg';

export async function GET() {
  // Create client within request context
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT * FROM users');
  await pool.end();
  return Response.json(result);
}
```

**Alternative**: Use Cloudflare D1 (designed for Workers) instead of external databases:

```typescript
// ✅ BEST: Use D1 (no connection pooling needed)
export async function GET(request: NextRequest) {
  const env = process.env as any;
  const result = await env.DB.prepare('SELECT * FROM users').all();
  return Response.json(result);
}
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#cannot-perform-io-on-behalf-of-a-different-request

---

## 5. NPM Package Import Failures

**Error**: `"Could not resolve '<package>'"`

**Cause**: Missing `nodejs_compat` flag or package export conditions

**Solution 1**: Enable `nodejs_compat` flag:

```jsonc
{
  "compatibility_flags": ["nodejs_compat"]
}
```

**Solution 2**: For packages with multiple exports, create `.env`:

```env
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#npm-packages-fail-to-import

---

## 6. Failed to Load Chunk (Turbopack)

**Error**: `"Failed to load chunk server/chunks/ssr/"`

**Cause**: Next.js built with Turbopack (`next build --turbo`)

**Solution**: Use standard build (Turbopack not supported by adapter):

```json
{
  "scripts": {
    "build": "next build"  // ✅ Correct
    // "build": "next build --turbo"  // ❌ Don't use Turbopack
  }
}
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting#failed-to-load-chunk

---

## 7. SSRF Vulnerability (CVE-2025-6087)

**Vulnerability**: Server-Side Request Forgery via `/_next/image` endpoint

**Affected versions**: `@opennextjs/cloudflare` < 1.3.0

**Solution**: Upgrade to version 1.3.0 or later:

```bash
bun add -d @opennextjs/cloudflare@^1.3.0
```

**Impact**: Allows unauthenticated users to proxy arbitrary remote content

**Source**: https://github.com/advisories/GHSA-rvpw-p7vw-wj3m

---

## 8. Durable Objects Binding Warnings

**Warning**: `"You have defined bindings to the following internal Durable Objects... will not work in local development, but they should work in production"`

**Cause**: OpenNext uses Durable Objects for caching (`DOQueueHandler`, `DOShardedTagCache`)

**Solution**: **Safe to ignore** - warning is expected behavior

**Alternative** (to suppress warning): Define Durable Objects in separate Worker with own config

**Source**: https://opennext.js.org/cloudflare/known-issues#caching-durable-objects

---

## 9. Prisma + D1 Middleware Conflicts

**Error**: Build errors when using `@prisma/client` + `@prisma/adapter-d1` in Next.js middleware

**Cause**: Database initialization in middleware context

**Workaround**: Initialize Prisma client in route handlers, not middleware

**Source**: https://github.com/opennextjs/opennextjs-cloudflare/issues/471

---

## 10. cross-fetch Library Errors

**Error**: Errors when using libraries that depend on `cross-fetch`

**Cause**: OpenNext patches deployment package causing `cross-fetch` to try using Node.js libraries when native fetch is available

**Solution**: Use native `fetch` API directly instead of `cross-fetch`:

```typescript
// ✅ Use native fetch
const response = await fetch('https://api.example.com/data');

// ❌ Avoid cross-fetch
// import fetch from 'cross-fetch';
```

**Source**: https://opennext.js.org/cloudflare/troubleshooting

---

## 11. Windows Development Issues

**Issue**: Full Windows support not guaranteed

**Cause**: Underlying Next.js tooling issues on Windows

**Solutions**:
- Use WSL (Windows Subsystem for Linux)
- Use virtual machine with Linux
- Use Linux-based CI/CD for deployments

**Source**: https://opennext.js.org/cloudflare#windows-support

---

## Additional Troubleshooting Resources

- **Official Troubleshooting Guide**: https://opennext.js.org/cloudflare/troubleshooting
- **Known Issues**: https://opennext.js.org/cloudflare/known-issues
- **GitHub Issues**: https://github.com/opennextjs/opennextjs-cloudflare/issues
- **Cloudflare Community**: https://community.cloudflare.com/

---

**Last Updated**: 2025-12-04
**Total Errors Documented**: 11
**Sources**: All error solutions verified against official documentation

# Cloudflare Workers KV Complete Setup

Quick setup for global key-value storage on Cloudflare edge.

---

## Step 1: Create KV Namespace

```bash
# Production namespace
npx wrangler kv namespace create MY_NAMESPACE

# Preview namespace (for dev)
npx wrangler kv namespace create MY_NAMESPACE --preview
```

Save the `id` and `preview_id`!

---

## Step 2: Configure Binding

Add to `wrangler.jsonc`:

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-11",
  "kv_namespaces": [
    {
      "binding": "MY_NAMESPACE",      // env.MY_NAMESPACE
      "id": "<PRODUCTION_ID>",
      "preview_id": "<PREVIEW_ID>"
    }
  ]
}
```

---

## Step 3: Use in Worker

```typescript
export default {
  async fetch(request, env, ctx) {
    // Write
    await env.MY_NAMESPACE.put('key', 'value');

    // Read
    const value = await env.MY_NAMESPACE.get('key');

    // Delete
    await env.MY_NAMESPACE.delete('key');

    return new Response(value);
  }
};
```

---

## Common Patterns

### With TTL

```typescript
await env.MY_NAMESPACE.put('key', 'value', {
  expirationTtl: 3600  // 1 hour
});
```

### With Metadata

```typescript
await env.MY_NAMESPACE.put('user:123', JSON.stringify({ name: 'Alice' }), {
  metadata: { role: 'admin', created: Date.now() }
});

const { value, metadata } = await env.MY_NAMESPACE.getWithMetadata('user:123');
```

### List Keys

```typescript
const { keys } = await env.MY_NAMESPACE.list({
  prefix: 'user:',
  limit: 100
});
```

---

## Official Documentation

- **KV Overview**: https://developers.cloudflare.com/kv/
- **KV API**: https://developers.cloudflare.com/kv/api/

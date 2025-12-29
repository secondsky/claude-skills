---
name: cloudflare-r2:setup
description: Quickly create R2 bucket and configure binding in wrangler.jsonc
---

# R2 Quick Setup

Create an R2 bucket and configure Worker binding for instant file storage.

## Required Information

1. **Bucket name** (3-63 chars, lowercase, numbers, hyphens only): `{{bucket_name}}`
2. **Binding name** (uppercase, used in code like `env.MY_BUCKET`): `{{binding_name}}`
3. **Preview bucket** (optional, for dev environment): `{{preview_bucket_name}}`

## What This Command Does

1. **Creates R2 bucket** via `wrangler r2 bucket create`
2. **Adds binding to wrangler.jsonc** in r2_buckets array
3. **Generates TypeScript types** in env.d.ts
4. **Shows example usage code** for uploads/downloads

## Example Execution

```bash
# Create bucket
bunx wrangler r2 bucket create my-uploads

# Configure wrangler.jsonc
{
  "r2_buckets": [
    {
      "binding": "MY_UPLOADS",
      "bucket_name": "my-uploads",
      "preview_bucket_name": "my-uploads-preview"
    }
  ]
}

# Add TypeScript types
type Bindings = {
  MY_UPLOADS: R2Bucket;
};

# Example upload/download code
app.put('/upload/:filename', async (c) => {
  const data = await c.req.arrayBuffer();
  await c.env.MY_UPLOADS.put(c.req.param('filename'), data, {
    httpMetadata: {
      contentType: c.req.header('content-type') || 'application/octet-stream',
    },
  });
  return c.json({ success: true });
});

app.get('/download/:filename', async (c) => {
  const object = await c.env.MY_UPLOADS.get(c.req.param('filename'));
  if (!object) return c.json({ error: 'Not found' }, 404);
  return new Response(object.body);
});
```

## Next Steps

1. Test with `bunx wrangler dev`
2. Upload a test file
3. Verify download works
4. Deploy with `bunx wrangler deploy`

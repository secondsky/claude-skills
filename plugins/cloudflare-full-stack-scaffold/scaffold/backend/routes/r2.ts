/**
 * R2 Object Storage Routes
 *
 * Upload, download, and manage files.
 * S3-compatible object storage.
 */

import { Hono } from 'hono'

type Bindings = {
  MY_BUCKET: R2Bucket
}

const r2 = new Hono<{ Bindings: Bindings }>()

// Upload file
r2.put('/files/:filename', async (c) => {
  const filename = c.req.param('filename')
  const body = await c.req.arrayBuffer()
  const contentType = c.req.header('content-type') || 'application/octet-stream'

  const object = await c.env.MY_BUCKET.put(filename, body, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  })

  return c.json({
    success: true,
    key: object.key,
    size: object.size,
    uploaded: object.uploaded,
  })
})

// Download file
r2.get('/files/:filename', async (c) => {
  const filename = c.req.param('filename')

  const object = await c.env.MY_BUCKET.get(filename)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
})

// Get file metadata (HEAD request)
r2.head('/files/:filename', async (c) => {
  const filename = c.req.param('filename')

  const object = await c.env.MY_BUCKET.head(filename)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  return c.json({
    key: object.key,
    size: object.size,
    uploaded: object.uploaded,
    contentType: object.httpMetadata?.contentType,
    customMetadata: object.customMetadata,
  })
})

// List files
r2.get('/files', async (c) => {
  const prefix = c.req.query('prefix') || ''
  const cursor = c.req.query('cursor')
  const limit = parseInt(c.req.query('limit') || '10')

  const listed = await c.env.MY_BUCKET.list({
    limit,
    cursor: cursor || undefined,
    prefix: prefix || undefined,
  })

  return c.json({
    files: listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    })),
    hasMore: listed.truncated,
    cursor: listed.cursor,
  })
})

// Delete file
r2.delete('/files/:filename', async (c) => {
  const filename = c.req.param('filename')

  await c.env.MY_BUCKET.delete(filename)

  return c.json({ success: true })
})

export default r2

/**
 * KV Storage Routes
 *
 * Key-value storage with TTL support.
 * Great for caching, sessions, and temporary data.
 */

import { Hono } from 'hono'

type Bindings = {
  MY_KV: KVNamespace
}

const kv = new Hono<{ Bindings: Bindings }>()

// Get value by key
kv.get('/:key', async (c) => {
  const key = c.req.param('key')

  const value = await c.env.MY_KV.get(key)

  if (value === null) {
    return c.json({ error: 'Key not found' }, 404)
  }

  return c.json({ key, value })
})

// Get JSON value by key
kv.get('/json/:key', async (c) => {
  const key = c.req.param('key')

  const value = await c.env.MY_KV.get(key, { type: 'json' })

  if (value === null) {
    return c.json({ error: 'Key not found' }, 404)
  }

  return c.json({ key, value })
})

// Set value with optional TTL
kv.post('/', async (c) => {
  const body = await c.req.json()

  if (!body.key || !body.value) {
    return c.json({ error: 'key and value are required' }, 400)
  }

  const options: any = {}

  // Optional TTL in seconds (minimum 60)
  if (body.ttl) {
    const ttl = parseInt(body.ttl)
    if (ttl < 60) {
      return c.json({ error: 'TTL must be at least 60 seconds' }, 400)
    }
    options.expirationTtl = ttl
  }

  // Optional metadata
  if (body.metadata) {
    options.metadata = body.metadata
  }

  const value =
    typeof body.value === 'string' ? body.value : JSON.stringify(body.value)

  await c.env.MY_KV.put(body.key, value, options)

  return c.json({
    success: true,
    key: body.key,
    ttl: body.ttl || null,
    expiresAt: body.ttl
      ? new Date(Date.now() + body.ttl * 1000).toISOString()
      : null,
  })
})

// List keys with optional prefix
kv.get('/list/keys', async (c) => {
  const prefix = c.req.query('prefix') || ''
  const cursor = c.req.query('cursor')
  const limit = parseInt(c.req.query('limit') || '10')

  const result = await c.env.MY_KV.list({
    prefix,
    limit,
    cursor: cursor || undefined,
  })

  return c.json({
    keys: result.keys,
    hasMore: !result.list_complete,
    cursor: result.cursor,
  })
})

// Delete key
kv.delete('/:key', async (c) => {
  const key = c.req.param('key')

  await c.env.MY_KV.delete(key)

  return c.json({ success: true })
})

export default kv

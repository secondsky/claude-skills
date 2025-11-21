---
name: idempotency-handling
description: Implements idempotent API operations using idempotency keys, Redis caching, and database constraints to prevent duplicate processing. Use when building payment systems, handling webhook retries, or ensuring safe operation retries.
---

# Idempotency Handling

Ensure operations produce identical results regardless of execution count.

## Idempotency Key Pattern

```javascript
const redis = require('redis');
const client = redis.createClient();

async function idempotencyMiddleware(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  const cached = await client.get(`idempotency:${key}`);
  if (cached) {
    const { status, body } = JSON.parse(cached);
    return res.status(status).json(body);
  }

  // Store original send
  const originalSend = res.json.bind(res);
  res.json = async (body) => {
    await client.setEx(
      `idempotency:${key}`,
      86400, // 24 hours
      JSON.stringify({ status: res.statusCode, body })
    );
    return originalSend(body);
  };

  next();
}
```

## Database-Backed Idempotency

```sql
CREATE TABLE idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  request_hash VARCHAR(64) NOT NULL,
  response JSONB,
  status VARCHAR(20) DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
```

```javascript
async function processPayment(idempotencyKey, payload) {
  const requestHash = crypto.createHash('sha256')
    .update(JSON.stringify(payload)).digest('hex');

  // Check existing
  const existing = await db.query(
    'SELECT * FROM idempotency_keys WHERE key = $1',
    [idempotencyKey]
  );

  if (existing.rows[0]) {
    if (existing.rows[0].request_hash !== requestHash) {
      throw new Error('Idempotency key reused with different request');
    }
    if (existing.rows[0].status === 'completed') {
      return existing.rows[0].response;
    }
  }

  // Process and store
  await db.query(
    'INSERT INTO idempotency_keys (key, request_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [idempotencyKey, requestHash]
  );

  const result = await executePayment(payload);

  await db.query(
    'UPDATE idempotency_keys SET status = $1, response = $2 WHERE key = $3',
    ['completed', result, idempotencyKey]
  );

  return result;
}
```

## When to Apply

- Payment processing
- Order creation
- Webhook handling
- Email sending
- Any operation where duplicates cause issues

## Best Practices

- Require idempotency keys for mutations
- Validate request body matches stored request
- Set appropriate TTL (24 hours typical)
- Use atomic database operations

# Cloudflare Services Integration

Guide to integrating Cloudflare services (D1, KV, R2, Vectorize, Workers AI) with MCP servers.

---

## D1 (SQL Database)

### Setup

```bash
# Create database
wrangler d1 create my-database

# Add to wrangler.jsonc
```

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "YOUR_DATABASE_ID"
    }
  ]
}
```

### MCP Tool Example

```typescript
server.registerTool(
  'query-users',
  {
    description: 'Queries users from D1 database',
    inputSchema: z.object({
      email: z.string().optional(),
      limit: z.number().default(10)
    })
  },
  async ({ email, limit }, env) => {
    const query = email
      ? 'SELECT * FROM users WHERE email = ? LIMIT ?'
      : 'SELECT * FROM users LIMIT ?';

    const params = email ? [email, limit] : [limit];

    const result = await env.DB.prepare(query).bind(...params).all();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result.results, null, 2)
      }]
    };
  }
);
```

### Best Practices

- Use parameterized queries (never string interpolation)
- Add indexes for common queries
- Limit result set size
- Use transactions for multi-step operations

---

## KV (Key-Value Store)

### Setup

```bash
# Create namespace
wrangler kv namespace create CACHE

# Add to wrangler.jsonc
```

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "YOUR_NAMESPACE_ID"
    }
  ]
}
```

### MCP Tool Example

```typescript
server.registerTool(
  'cache-get',
  {
    description: 'Gets value from KV cache',
    inputSchema: z.object({ key: z.string() })
  },
  async ({ key }, env) => {
    const value = await env.CACHE.get(key);
    return {
      content: [{
        type: 'text',
        text: value || `Key "${key}" not found`
      }]
    };
  }
);

server.registerTool(
  'cache-set',
  {
    description: 'Sets value in KV cache',
    inputSchema: z.object({
      key: z.string(),
      value: z.string(),
      ttl: z.number().optional()
    })
  },
  async ({ key, value, ttl }, env) => {
    await env.CACHE.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
    return {
      content: [{ type: 'text', text: `Cached "${key}"` }]
    };
  }
);
```

---

## R2 (Object Storage)

### Setup

```bash
# Create bucket
wrangler r2 bucket create my-bucket

# Add to wrangler.jsonc
```

```jsonc
{
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "my-bucket"
    }
  ]
}
```

### MCP Tool Example

```typescript
server.registerTool(
  'r2-upload',
  {
    description: 'Uploads file to R2',
    inputSchema: z.object({
      key: z.string(),
      content: z.string(),
      contentType: z.string().optional()
    })
  },
  async ({ key, content, contentType }, env) => {
    await env.BUCKET.put(key, content, {
      httpMetadata: {
        contentType: contentType || 'text/plain'
      }
    });

    return {
      content: [{ type: 'text', text: `Uploaded to ${key}` }]
    };
  }
);

server.registerTool(
  'r2-download',
  {
    description: 'Downloads file from R2',
    inputSchema: z.object({ key: z.string() })
  },
  async ({ key }, env) => {
    const object = await env.BUCKET.get(key);

    if (!object) {
      return {
        content: [{ type: 'text', text: `File "${key}" not found` }],
        isError: true
      };
    }

    const text = await object.text();
    return {
      content: [{
        type: 'text',
        text: `File: ${key}\nSize: ${object.size} bytes\n\n${text}`
      }]
    };
  }
);
```

---

## Vectorize (Vector Database)

### Setup

```bash
# Create index
wrangler vectorize create my-index --dimensions=768 --metric=cosine

# Add to wrangler.jsonc
```

```jsonc
{
  "vectorize": [
    {
      "binding": "VECTORIZE",
      "index_name": "my-index"
    }
  ]
}
```

### MCP Tool Example

```typescript
server.registerTool(
  'semantic-search',
  {
    description: 'Searches documents semantically',
    inputSchema: z.object({
      query: z.string(),
      topK: z.number().default(5)
    })
  },
  async ({ query, topK }, env) => {
    // Generate embedding (using Workers AI)
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query
    });

    // Search vector index
    const results = await env.VECTORIZE.query(embedding.data[0], {
      topK,
      returnMetadata: true
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results.matches, null, 2)
      }]
    };
  }
);

server.registerTool(
  'index-document',
  {
    description: 'Indexes document for semantic search',
    inputSchema: z.object({
      id: z.string(),
      text: z.string(),
      metadata: z.record(z.any()).optional()
    })
  },
  async ({ id, text, metadata }, env) => {
    // Generate embedding
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text
    });

    // Insert into index
    await env.VECTORIZE.insert([{
      id,
      values: embedding.data[0],
      metadata: metadata || {}
    }]);

    return {
      content: [{ type: 'text', text: `Indexed document "${id}"` }]
    };
  }
);
```

---

## Workers AI

### Setup

```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

### MCP Tool Example

```typescript
server.registerTool(
  'generate-text',
  {
    description: 'Generates text using LLM',
    inputSchema: z.object({
      prompt: z.string(),
      model: z.string().default('@cf/meta/llama-3-8b-instruct')
    })
  },
  async ({ prompt, model }, env) => {
    const response = await env.AI.run(model, {
      prompt
    });

    return {
      content: [{ type: 'text', text: response.response }]
    };
  }
);

server.registerTool(
  'generate-image',
  {
    description: 'Generates image from text',
    inputSchema: z.object({
      prompt: z.string()
    })
  },
  async ({ prompt }, env) => {
    const response = await env.AI.run(
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      { prompt }
    );

    // Save to R2
    const imageKey = `generated/${Date.now()}.png`;
    await env.BUCKET.put(imageKey, response);

    return {
      content: [{
        type: 'text',
        text: `Image generated: ${imageKey}`
      }]
    };
  }
);
```

---

## Queues

### Setup

```bash
# Create queue
wrangler queues create my-queue

# Add to wrangler.jsonc
```

```jsonc
{
  "queues": {
    "producers": [
      {
        "binding": "MY_QUEUE",
        "queue": "my-queue"
      }
    ],
    "consumers": [
      {
        "queue": "my-queue",
        "max_batch_size": 10,
        "max_batch_timeout": 30
      }
    ]
  }
}
```

### MCP Tool Example

```typescript
server.registerTool(
  'enqueue-task',
  {
    description: 'Enqueues background task',
    inputSchema: z.object({
      task: z.string(),
      data: z.record(z.any())
    })
  },
  async ({ task, data }, env) => {
    await env.MY_QUEUE.send({
      task,
      data,
      timestamp: Date.now()
    });

    return {
      content: [{ type: 'text', text: `Task "${task}" enqueued` }]
    };
  }
);
```

**Consumer handler:**
```typescript
export default {
  async fetch(request, env) {
    return app.fetch(request, env);
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log('Processing:', message.body);
      // Process task...
    }
  }
};
```

---

## Analytics Engine

### Setup

```jsonc
{
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS"
    }
  ]
}
```

### MCP Tool Example

```typescript
server.registerTool(
  'log-event',
  {
    description: 'Logs analytics event',
    inputSchema: z.object({
      event: z.string(),
      metadata: z.record(z.any()).optional()
    })
  },
  async ({ event, metadata }, env) => {
    env.ANALYTICS.writeDataPoint({
      blobs: [event],
      doubles: [Date.now()],
      indexes: [event]
    });

    return {
      content: [{ type: 'text', text: `Event "${event}" logged` }]
    };
  }
);
```

---

## Combining Services

### Example: RAG System

```typescript
server.registerTool(
  'ask-question',
  {
    description: 'Answers question using RAG',
    inputSchema: z.object({ question: z.string() })
  },
  async ({ question }, env) => {
    // 1. Generate embedding
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: question
    });

    // 2. Search vector index
    const results = await env.VECTORIZE.query(embedding.data[0], {
      topK: 3,
      returnMetadata: true
    });

    // 3. Get context from D1
    const context = await env.DB
      .prepare('SELECT content FROM documents WHERE id IN (?, ?, ?)')
      .bind(...results.matches.map(m => m.id))
      .all();

    // 4. Generate answer with LLM
    const prompt = `Context: ${JSON.stringify(context.results)}\n\nQuestion: ${question}`;
    const answer = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt
    });

    // 5. Cache result
    await env.CACHE.put(`answer:${question}`, answer.response, {
      expirationTtl: 3600
    });

    return {
      content: [{ type: 'text', text: answer.response }]
    };
  }
);
```

---

**Last Updated:** 2025-10-28

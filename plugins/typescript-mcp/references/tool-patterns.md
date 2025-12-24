# Common Tool Implementation Patterns

Production-tested patterns for implementing MCP tools in TypeScript.

---

## Pattern 1: External API Wrapper

Wrap external REST APIs as MCP tools.

```typescript
server.registerTool(
  'fetch-weather',
  {
    description: 'Fetches weather data from OpenWeatherMap API',
    inputSchema: z.object({
      city: z.string().describe('City name'),
      units: z.enum(['metric', 'imperial']).default('metric')
    })
  },
  async ({ city, units }, env) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${env.WEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);
```

**Best Practices:**
- Always validate API keys exist before calling
- Use proper URL encoding for parameters
- Handle HTTP errors gracefully
- Return structured error messages
- Consider caching responses in KV

---

## Pattern 2: Database Query Tool

Execute SQL queries on D1 database.

```typescript
server.registerTool(
  'search-users',
  {
    description: 'Searches users in database',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
      limit: z.number().default(10).max(100)
    })
  },
  async ({ query, limit }, env) => {
    if (!env.DB) {
      return {
        content: [{ type: 'text', text: 'Database not configured' }],
        isError: true
      };
    }

    try {
      const result = await env.DB
        .prepare('SELECT id, name, email FROM users WHERE name LIKE ? LIMIT ?')
        .bind(`%${query}%`, limit)
        .all();

      return {
        content: [{
          type: 'text',
          text: `Found ${result.results.length} users:\n${JSON.stringify(result.results, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Database error: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);
```

**Security:**
- ⚠️ Never allow raw SQL injection
- Use parameterized queries only
- Limit result set size
- Don't expose sensitive fields (passwords, tokens)

---

## Pattern 3: File Operations (R2)

Read/write files from R2 object storage.

```typescript
server.registerTool(
  'get-file',
  {
    description: 'Retrieves file from R2 storage',
    inputSchema: z.object({
      key: z.string().describe('File key/path')
    })
  },
  async ({ key }, env) => {
    if (!env.BUCKET) {
      return {
        content: [{ type: 'text', text: 'R2 not configured' }],
        isError: true
      };
    }

    try {
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
    } catch (error) {
      return {
        content: [{ type: 'text', text: `R2 error: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);
```

---

## Pattern 4: Validation & Transformation

Transform and validate data.

```typescript
server.registerTool(
  'validate-email',
  {
    description: 'Validates and normalizes email addresses',
    inputSchema: z.object({
      email: z.string().describe('Email to validate')
    })
  },
  async ({ email }) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const isValid = emailRegex.test(email);
    const normalized = email.toLowerCase().trim();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: isValid,
          original: email,
          normalized,
          domain: isValid ? normalized.split('@')[1] : null
        }, null, 2)
      }]
    };
  }
);
```

---

## Pattern 5: Multi-Step Operations

Chain multiple operations together.

```typescript
server.registerTool(
  'analyze-and-store',
  {
    description: 'Analyzes text and stores result',
    inputSchema: z.object({
      text: z.string(),
      key: z.string()
    })
  },
  async ({ text, key }, env) => {
    try {
      // Step 1: Analyze
      const wordCount = text.split(/\s+/).length;
      const charCount = text.length;

      const analysis = {
        wordCount,
        charCount,
        avgWordLength: (charCount / wordCount).toFixed(2),
        timestamp: new Date().toISOString()
      };

      // Step 2: Store in KV
      await env.CACHE.put(key, JSON.stringify(analysis));

      return {
        content: [{
          type: 'text',
          text: `Analysis complete and stored at "${key}":\n${JSON.stringify(analysis, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);
```

---

## Pattern 6: Streaming Responses

Handle large responses efficiently.

```typescript
server.registerTool(
  'fetch-large-file',
  {
    description: 'Fetches and summarizes large file',
    inputSchema: z.object({
      url: z.string().url()
    })
  },
  async ({ url }) => {
    const MAX_SIZE = 100000; // 100KB

    try {
      const response = await fetch(url);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No response body');
      }

      let text = '';
      let totalSize = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done || totalSize >= MAX_SIZE) break;

        text += new TextDecoder().decode(value);
        totalSize += value.length;
      }

      return {
        content: [{
          type: 'text',
          text: totalSize >= MAX_SIZE
            ? `File too large. First 100KB:\n${text}`
            : text
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);
```

---

## Pattern 7: Caching Tool Responses

Cache expensive operations.

```typescript
server.registerTool(
  'get-exchange-rate',
  {
    description: 'Gets currency exchange rate (cached)',
    inputSchema: z.object({
      from: z.string().length(3),
      to: z.string().length(3)
    })
  },
  async ({ from, to }, env) => {
    const cacheKey = `exchange:${from}:${to}`;

    // Check cache first
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: `${from}→${to}: ${cached} (cached)`
        }]
      };
    }

    // Fetch fresh data
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      const data = await response.json();
      const rate = data.rates[to];

      // Cache for 1 hour
      await env.CACHE.put(cacheKey, String(rate), { expirationTtl: 3600 });

      return {
        content: [{
          type: 'text',
          text: `${from}→${to}: ${rate} (fresh)`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
        isError: true
      };
    }
  }
);
```

---

## Error Handling Best Practices

```typescript
server.registerTool('example', { ... }, async (args, env) => {
  try {
    // Operation
  } catch (error) {
    // Safe error handling
    const message = error instanceof Error
      ? error.message
      : 'Unknown error';

    // Don't leak sensitive data
    const safeMessage = message.replace(/api[_-]?key[s]?[:\s]+[^\s]+/gi, '[REDACTED]');

    return {
      content: [{ type: 'text', text: `Error: ${safeMessage}` }],
      isError: true
    };
  }
});
```

---

## Tool Response Formats

### Text Response
```typescript
return {
  content: [{ type: 'text', text: 'Result text' }]
};
```

### Multiple Content Blocks
```typescript
return {
  content: [
    { type: 'text', text: 'Summary' },
    { type: 'text', text: 'Details: ...' }
  ]
};
```

### Error Response
```typescript
return {
  content: [{ type: 'text', text: 'Error message' }],
  isError: true
};
```

---

**Last Updated:** 2025-10-28

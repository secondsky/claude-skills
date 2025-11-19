## Stateful MCP Servers with Durable Objects

Use **Durable Objects** when your MCP server needs:
- Per-session persistent state
- Conversation history
- Game state (chess, tic-tac-toe)
- Cached API responses
- User preferences

### Storage API Pattern

**Template**: `templates/mcp-stateful-do.ts`

**Store values**:
```typescript
await this.state.storage.put("key", "value");
await this.state.storage.put("user_prefs", { theme: "dark" });
```

**Retrieve values**:
```typescript
const value = await this.state.storage.get<string>("key");
const prefs = await this.state.storage.get<object>("user_prefs");
```

**List keys**:
```typescript
const allKeys = await this.state.storage.list();
```

**Delete keys**:
```typescript
await this.state.storage.delete("key");
```

### Configuration

**wrangler.jsonc**:
```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "MY_MCP",
        "class_name": "MyMCP",
        "script_name": "my-mcp-server"
      }
    ]
  },

  "migrations": [
    { "tag": "v1", "new_classes": ["MyMCP"] }
  ]
}
```

**IMPORTANT**: Migrations are required on first deployment!

---

## WebSocket Hibernation for Cost Optimization

**Problem**: Long-lived WebSocket connections cost CPU time

**Solution**: WebSocket Hibernation API suspends connections when idle

### Pattern

**Serialize metadata** (preserves data during hibernation):
```typescript
webSocket.serializeAttachment({
  userId: "123",
  sessionId: "abc",
  connectedAt: Date.now()
});
```

**Retrieve on wake**:
```typescript
const metadata = webSocket.deserializeAttachment();
console.log(metadata.userId); // "123"
```

**Storage for persistent state**:
```typescript
// ❌ DON'T: In-memory state lost on hibernation
this.userId = "123";

// ✅ DO: Use storage API
await this.state.storage.put("userId", "123");
```

### Cost Savings

Without hibernation:
- 1000 concurrent WebSockets × 10ms CPU/sec = 10 CPU-sec/sec
- **Cost: ~$0.50/day**

With hibernation:
- CPU only on messages (99% idle time suspended)
- **Cost: ~$0.01/day** (50x reduction!)

---

## Common Patterns

### API Proxy MCP Server

**Use case**: Wrap external API with MCP tools

**Pattern**:
```typescript
this.server.tool(
  "search_wikipedia",
  "Search Wikipedia for a topic",
  { query: z.string() },
  async ({ query }) => {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    const data = await response.json();

    return {
      content: [{
        type: "text",
        text: data.extract
      }]
    };
  }
);
```

### Database-Backed Tools

**Use case**: Query D1, KV, or external databases

**Pattern**:
```typescript
this.server.tool(
  "get_user",
  "Get user details from database",
  { userId: z.string() },
  async ({ userId }) => {
    // Query Durable Objects storage
    const user = await this.state.storage.get<User>(`user:${userId}`);

    // Or query D1 database
    const result = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(userId).first();

    return {
      content: [{
        type: "text",
        text: JSON.stringify(user || result, null, 2)
      }]
    };
  }
);
```

### Multi-Tool Coordination

**Use case**: Tools that call other tools

**Pattern**:
```typescript
// Store result from first tool
await this.state.storage.put("last_search", result);

// Second tool reads it
const lastSearch = await this.state.storage.get("last_search");
```

### Caching Strategy

**Use case**: Cache expensive API calls

**Pattern**:
```typescript
this.server.tool(
  "get_weather",
  "Get weather (cached 5 minutes)",
  { city: z.string() },
  async ({ city }) => {
    const cacheKey = `weather:${city}`;
    const cached = await this.state.storage.get<CachedWeather>(cacheKey);

    // Check cache freshness
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return {
        content: [{ type: "text", text: cached.data }]
      };
    }

    // Fetch fresh data
    const weather = await fetchWeatherAPI(city);

    // Cache it
    await this.state.storage.put(cacheKey, {
      data: weather,
      timestamp: Date.now()
    });

    return {
      content: [{ type: "text", text: weather }]
    };
  }
);
```

### Rate Limiting with Durable Objects

**Use case**: Prevent abuse, respect upstream rate limits

**Pattern**:
```typescript
async rateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const requests = await this.state.storage.get<number[]>(`ratelimit:${key}`) || [];

  // Remove old requests outside window
  const recentRequests = requests.filter(ts => now - ts < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limited
  }

  // Add this request
  recentRequests.push(now);
  await this.state.storage.put(`ratelimit:${key}`, recentRequests);

  return true; // Allowed
}

// Use in tool
if (!await this.rateLimit(userId, 10, 60 * 1000)) {
  return {
    content: [{ type: "text", text: "Rate limit exceeded (10 requests/minute)" }],
    isError: true
  };
}
```

---


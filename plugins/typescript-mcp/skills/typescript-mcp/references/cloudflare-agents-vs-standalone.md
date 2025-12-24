# Cloudflare Agents SDK vs Standalone TypeScript MCP

Decision guide for choosing between Cloudflare Agents SDK and standalone TypeScript MCP servers.

---

## Quick Decision Matrix

| Need | Cloudflare Agents | Standalone MCP |
|------|-------------------|----------------|
| Stateless tools | ⚠️ Overkill | ✅ Perfect |
| Stateful agents | ✅ Perfect | ❌ Not ideal |
| WebSockets | ✅ Built-in | ❌ Not supported |
| Persistent storage | ✅ SQLite (1GB) | ⚠️ Use D1/KV |
| Cost (low traffic) | ⚠️ Higher | ✅ Lower |
| Setup complexity | ⚠️ Medium | ✅ Simple |
| Portability | ❌ Cloudflare only | ✅ Any platform |

---

## Cloudflare Agents SDK

**Best for:**
- Chatbots with conversation history
- Long-running agent sessions
- WebSocket-based applications
- Agents that need memory
- Scheduled agent tasks

**Architecture:**
```
Client → Workers → Durable Objects (with SQLite) → AI Models
         ↓
    MCP Tools
```

**Example use cases:**
- AI chatbot with memory
- Customer support agent
- Multi-turn conversations
- Scheduled agent workflows

**Pricing:**
- Durable Objects: $0.15/million requests
- Storage: $0.20/GB-month
- WebSocket connections: $0.01/million messages

---

## Standalone TypeScript MCP

**Best for:**
- Stateless tool exposure
- API integrations
- Database queries
- Edge-deployed functions
- Simple MCP servers

**Architecture:**
```
Client → Workers → MCP Server → External APIs/D1/KV/R2
```

**Example use cases:**
- Weather API tool
- Database query tool
- File storage tool
- Calculator/utility tools

**Pricing:**
- Workers: $0.50/million requests (10ms CPU)
- No Durable Objects overhead

---

## Detailed Comparison

### State Management

**Cloudflare Agents:**
```typescript
import { Agent } from '@cloudflare/agents';

export class ChatAgent extends Agent {
  async handleMessage(message: string) {
    // Access SQLite storage
    const history = await this.state.sql.exec(
      'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10'
    );

    // State persists across requests
    return `Based on our history: ${history}...`;
  }
}
```

**Standalone MCP:**
```typescript
// Stateless - no built-in state
server.registerTool('query', { ... }, async (args, env) => {
  // Must use external storage (D1, KV, etc.)
  const data = await env.DB.prepare('SELECT ...').all();
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
});
```

### WebSocket Support

**Cloudflare Agents:**
```typescript
// Built-in WebSocket support
export class RealtimeAgent extends Agent {
  async webSocketMessage(ws: WebSocket, message: string) {
    // Handle real-time messages
    ws.send(`Received: ${message}`);
  }
}
```

**Standalone MCP:**
```typescript
// No WebSocket support
// Use HTTP/SSE only
app.post('/mcp', async (c) => {
  // Request-response only
});
```

### Deployment

**Cloudflare Agents:**
```bash
# Requires Durable Objects migration
wrangler deploy
# Need to configure DO bindings
```

**Standalone MCP:**
```bash
# Simple deployment
wrangler deploy
# Works immediately
```

---

## Cost Analysis

### Low Traffic (1,000 requests/day)

**Cloudflare Agents:**
- Durable Objects: ~$0.0045/day
- Storage: ~$0.007/day
- **Total: ~$4/month**

**Standalone MCP:**
- Workers: ~$0.0015/day
- **Total: ~$0.50/month**

### High Traffic (1,000,000 requests/day)

**Cloudflare Agents:**
- Durable Objects: ~$150/day
- Storage: ~$6/day
- **Total: ~$4,680/month**

**Standalone MCP:**
- Workers: ~$15/day
- **Total: ~$450/month**

**Winner for cost:** Standalone MCP (10x cheaper at scale)

---

## Feature Comparison

| Feature | Agents SDK | Standalone |
|---------|------------|------------|
| **Tools** | ✅ | ✅ |
| **Resources** | ✅ | ✅ |
| **Prompts** | ✅ | ✅ |
| **Persistent State** | ✅ SQLite | ⚠️ D1/KV |
| **WebSockets** | ✅ | ❌ |
| **Scheduled Tasks** | ✅ Alarms | ⚠️ Cron Triggers |
| **Global Replication** | ✅ Automatic | ⚠️ Manual |
| **Cold Start** | ⚠️ Slower | ✅ Faster |
| **Portability** | ❌ CF only | ✅ Any platform |

---

## Migration Path

### From Standalone → Agents SDK

**When to migrate:**
- Need conversation history
- Want WebSocket support
- Require stateful agents

**Migration steps:**
1. Create Durable Object class extending `Agent`
2. Move tools to agent methods
3. Add state management (SQLite)
4. Update wrangler.jsonc with DO bindings
5. Deploy with migration

### From Agents SDK → Standalone

**When to migrate:**
- Don't need state persistence
- Want lower costs
- Need platform portability

**Migration steps:**
1. Extract tools to standalone MCP server
2. Move state to D1/KV if needed
3. Remove DO bindings
4. Simplify deployment

---

## Hybrid Approach

Use both for different use cases:

```
Cloudflare Workers
├── /agents (Agents SDK)
│   └── Chatbot with memory
└── /mcp (Standalone MCP)
    ├── Weather tool (stateless)
    ├── Database tool (stateless)
    └── Calculator tool (stateless)
```

**Benefits:**
- Optimize cost per use case
- Use best tool for each job
- Maintain flexibility

---

## Recommendations

### Use Cloudflare Agents SDK when:
- ✅ Building conversational AI with memory
- ✅ Need real-time WebSocket connections
- ✅ Agents require persistent state
- ✅ Multi-turn interactions
- ✅ Budget allows higher costs

### Use Standalone TypeScript MCP when:
- ✅ Exposing stateless tools/APIs
- ✅ Cost optimization is priority
- ✅ Need platform portability
- ✅ Simple request-response pattern
- ✅ Edge deployment for low latency

---

**Last Updated:** 2025-10-28
**Verified:** Cloudflare Agents SDK + @modelcontextprotocol/sdk@1.20.2

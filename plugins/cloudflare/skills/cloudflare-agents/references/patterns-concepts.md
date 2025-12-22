# Patterns, Concepts & Best Practices

This guide covers the fundamental concepts, common patterns, critical rules, and known issues for building Cloudflare Agents.

---

## What is Cloudflare Agents?

The Cloudflare Agents SDK enables building AI-powered autonomous agents that run on Cloudflare Workers + Durable Objects. Agents can:

- **Communicate in real-time** via WebSockets and Server-Sent Events
- **Persist state** with built-in SQLite database (up to 1GB per agent)
- **Schedule tasks** using delays, specific dates, or cron expressions
- **Run workflows** by triggering asynchronous Cloudflare Workflows
- **Browse the web** using Browser Rendering API + Puppeteer
- **Implement RAG** with Vectorize vector database + Workers AI embeddings
- **Build MCP servers** implementing the Model Context Protocol
- **Support human-in-the-loop** patterns for review and approval
- **Scale to millions** of independent agent instances globally

Each agent instance is a **globally unique, stateful micro-server** that can run for seconds, minutes, or hours.

---


---

## Patterns & Concepts

### Chat Agents (AIChatAgent)

```typescript
import { AIChatAgent } from "agents/ai-chat-agent";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export class MyChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: this.messages,
      onFinish
    });

    return result.toTextStreamResponse();
  }

  // Optional: Customize message persistence
  async onStateUpdate(state, source) {
    console.log('Chat state updated:', this.messages.length, 'messages');
  }
}
```

### Human-in-the-Loop (HITL)

```typescript
export class ApprovalAgent extends Agent {
  async processRequest(data: any) {
    // Process automatically
    const processed = await this.autoProcess(data);

    // If confidence low, request human review
    if (processed.confidence < 0.8) {
      this.setState({
        ...this.state,
        pendingReview: {
          data: processed,
          requestedAt: Date.now(),
          status: 'pending'
        }
      });

      // Send notification to human
      await this.notifyHuman(processed);

      return { status: 'pending_review', id: processed.id };
    }

    // High confidence, proceed automatically
    return this.complete(processed);
  }

  async approveReview(id: string, approved: boolean) {
    const pending = this.state.pendingReview;

    if (approved) {
      await this.complete(pending.data);
    } else {
      await this.reject(pending.data);
    }

    this.setState({
      ...this.state,
      pendingReview: null
    });
  }
}
```

### Tools Concept

Tools enable agents to interact with external services:

```typescript
export class ToolAgent extends Agent {
  // Tool: Search flights
  async searchFlights(from: string, to: string, date: string) {
    const response = await fetch(`https://api.flights.com/search`, {
      method: 'POST',
      body: JSON.stringify({ from, to, date })
    });
    return response.json();
  }

  // Tool: Book flight
  async bookFlight(flightId: string, passengers: any[]) {
    const response = await fetch(`https://api.flights.com/book`, {
      method: 'POST',
      body: JSON.stringify({ flightId, passengers })
    });
    return response.json();
  }

  // Tool: Send confirmation email
  async sendEmail(to: string, subject: string, body: string) {
    // Use email service
    return { sent: true };
  }

  // Orchestrate tools
  async bookTrip(params: any) {
    const flights = await this.searchFlights(params.from, params.to, params.date);
    const booking = await this.bookFlight(flights[0].id, params.passengers);
    await this.sendEmail(params.email, "Booking Confirmed", `Booking ID: ${booking.id}`);

    return booking;
  }
}
```

### Multi-Agent Orchestration

```typescript
interface Env {
  ResearchAgent: AgentNamespace<ResearchAgent>;
  WriterAgent: AgentNamespace<WriterAgent>;
  EditorAgent: AgentNamespace<EditorAgent>;
}

export class OrchestratorAgent extends Agent<Env> {
  async createArticle(topic: string) {
    // 1. Research agent gathers information
    const researcher = getAgentByName<Env, ResearchAgent>(
      this.env.ResearchAgent,
      `research-${topic}`
    );
    const research = await (await researcher).research(topic);

    // 2. Writer agent creates draft
    const writer = getAgentByName<Env, WriterAgent>(
      this.env.WriterAgent,
      `writer-${topic}`
    );
    const draft = await (await writer).write(research);

    // 3. Editor agent reviews
    const editor = getAgentByName<Env, EditorAgent>(
      this.env.EditorAgent,
      `editor-${topic}`
    );
    const final = await (await editor).edit(draft);

    return final;
  }
}
```

---


---

## Critical Rules

### Always Do ✅

1. **Export Agent class** - Must be exported for binding to work
2. **Include new_sqlite_classes in v1 migration** - Cannot add SQLite later
3. **Match binding name to class name** - Prevents "binding not found" errors
4. **Authenticate in Worker, not Agent** - Security best practice
5. **Use tagged template literals for SQL** - Prevents SQL injection
6. **Handle WebSocket disconnections** - State persists, connections don't
7. **Verify scheduled task callback exists** - Throws error if method missing
8. **Use global unique instance names** - Same name = same agent globally
9. **Check state size limits** - Max 1GB total per agent
10. **Monitor task payload size** - Max 2MB per scheduled task
11. **Use workflow bindings correctly** - Must be configured in wrangler.jsonc
12. **Create Vectorize indexes before inserting** - Required for metadata filtering
13. **Close browser instances** - Prevent resource leaks
14. **Use setState() for persistence** - Don't just modify this.state
15. **Test migrations locally first** - Migrations are atomic, can't rollback

### Never Do ❌

1. **Don't add SQLite to existing deployed class** - Must be in first migration
2. **Don't gradually deploy migrations** - Atomic only
3. **Don't skip authentication in Worker** - Always auth before agent access
4. **Don't construct SQL strings manually** - Use tagged templates
5. **Don't exceed 1GB state per agent** - Hard limit
6. **Don't schedule tasks with non-existent callbacks** - Runtime error
7. **Don't assume same name = different agent** - Global uniqueness
8. **Don't use SSE for MCP** - Deprecated, use /mcp transport
9. **Don't forget browser binding** - Required for web browsing
10. **Don't modify this.state directly** - Use setState() instead

---


---

## Known Issues Prevention

This skill prevents **15+** documented issues:

### Issue 1: Migrations Not Atomic
**Error**: "Cannot gradually deploy migration"
**Source**: https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/
**Why**: Migrations apply to all instances simultaneously
**Prevention**: Deploy migrations independently of code changes, use `npx wrangler versions deploy`

### Issue 2: Missing new_sqlite_classes
**Error**: "Cannot enable SQLite on existing class"
**Source**: https://developers.cloudflare.com/agents/api-reference/configuration/
**Why**: SQLite must be enabled in first migration
**Prevention**: Include `new_sqlite_classes` in tag "v1" migration

### Issue 3: Agent Class Not Exported
**Error**: "Binding not found" or "Cannot access undefined"
**Source**: https://developers.cloudflare.com/agents/api-reference/agents-api/
**Why**: Durable Objects require exported class
**Prevention**: `export class MyAgent extends Agent` (with export keyword)

### Issue 4: Binding Name Mismatch
**Error**: "Binding 'X' not found"
**Source**: https://developers.cloudflare.com/agents/api-reference/configuration/
**Why**: Binding name must match class name exactly
**Prevention**: Ensure `name` and `class_name` are identical in wrangler.jsonc

### Issue 5: Global Uniqueness Not Understood
**Error**: Unexpected behavior with agent instances
**Source**: https://developers.cloudflare.com/agents/api-reference/agents-api/
**Why**: Same name always returns same agent instance globally
**Prevention**: Use unique identifiers (userId, sessionId) for instance names

### Issue 6: WebSocket State Not Persisted
**Error**: Connection state lost after disconnect
**Source**: https://developers.cloudflare.com/agents/api-reference/websockets/
**Why**: WebSocket connections don't persist, but agent state does
**Prevention**: Store important data in agent state via setState(), not connection state

### Issue 7: Scheduled Task Callback Doesn't Exist
**Error**: "Method X does not exist on Agent"
**Source**: https://developers.cloudflare.com/agents/api-reference/schedule-tasks/
**Why**: this.schedule() calls method that isn't defined
**Prevention**: Ensure callback method exists before scheduling

### Issue 8: State Size Limit Exceeded
**Error**: "Maximum database size exceeded"
**Source**: https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/
**Why**: Agent state + scheduled tasks exceed 1GB
**Prevention**: Monitor state size, use external storage (D1, R2) for large data

### Issue 9: Scheduled Task Too Large
**Error**: "Task payload exceeds 2MB"
**Source**: https://developers.cloudflare.com/agents/api-reference/schedule-tasks/
**Why**: Each task maps to database row with 2MB limit
**Prevention**: Keep task payloads minimal, store large data in agent state/SQL

### Issue 10: Workflow Binding Missing
**Error**: "Cannot read property 'create' of undefined"
**Source**: https://developers.cloudflare.com/agents/api-reference/run-workflows/
**Why**: Workflow binding not configured in wrangler.jsonc
**Prevention**: Add workflow binding before using this.env.WORKFLOW

### Issue 11: Browser Binding Required
**Error**: "BROWSER binding undefined"
**Source**: https://developers.cloudflare.com/agents/api-reference/browse-the-web/
**Why**: Browser Rendering requires explicit binding
**Prevention**: Add `"browser": { "binding": "BROWSER" }` to wrangler.jsonc

### Issue 12: Vectorize Index Not Found
**Error**: "Index does not exist"
**Source**: https://developers.cloudflare.com/agents/api-reference/rag/
**Why**: Vectorize index must be created before use
**Prevention**: Run `wrangler vectorize create` before deploying agent

### Issue 13: MCP Transport Confusion
**Error**: "SSE transport deprecated"
**Source**: https://developers.cloudflare.com/agents/model-context-protocol/transport/
**Why**: SSE transport is legacy, streamable HTTP is recommended
**Prevention**: Use `/mcp` endpoint with `MyMCP.serve('/mcp')`, not `/sse`

### Issue 14: Authentication Bypass
**Error**: Security vulnerability
**Source**: https://developers.cloudflare.com/agents/api-reference/calling-agents/
**Why**: Authentication done in Agent instead of Worker
**Prevention**: Always authenticate in Worker before calling getAgentByName()

### Issue 15: Instance Naming Errors
**Error**: Cross-user data leakage
**Source**: https://developers.cloudflare.com/agents/api-reference/calling-agents/
**Why**: Poor instance naming allows access to wrong agent
**Prevention**: Use namespaced names like `user-${userId}`, validate ownership

---


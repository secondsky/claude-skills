# Advanced Features

This guide covers advanced capabilities including browser automation, RAG, AI model integration, calling agents, and client APIs.

---

## Browse the Web

Agents can browse the web using [Browser Rendering](https://developers.cloudflare.com/browser-rendering/).

### Browser Rendering Binding

`wrangler.jsonc`:

```jsonc
{
  "browser": {
    "binding": "BROWSER"
  }
}
```

### Installation

```bash
npm install @cloudflare/puppeteer
```

### Web Scraping Example

```typescript
import { Agent } from "agents";
import puppeteer from "@cloudflare/puppeteer";

interface Env {
  BROWSER: Fetcher;
  OPENAI_API_KEY: string;
}

export class BrowserAgent extends Agent<Env> {
  async browse(urls: string[]) {
    const responses = [];

    for (const url of urls) {
      const browser = await puppeteer.launch(this.env.BROWSER);
      const page = await browser.newPage();

      await page.goto(url);
      await page.waitForSelector("body");

      const bodyContent = await page.$eval("body", el => el.innerHTML);

      // Extract data with AI
      const data = await this.extractData(bodyContent);
      responses.push({ url, data });

      await browser.close();
    }

    return responses;
  }

  async extractData(html: string): Promise<any> {
    // Use OpenAI or Workers AI to extract structured data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract product info from HTML: ${html.slice(0, 4000)}`
        }],
        response_format: { type: "json_object" }
      })
    });

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  }

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response("Missing url parameter", { status: 400 });
    }

    const results = await this.browse([url]);
    return Response.json(results);
  }
}
```

### Screenshot Capture

```typescript
export class ScreenshotAgent extends Agent<Env> {
  async captureScreenshot(url: string): Promise<Buffer> {
    const browser = await puppeteer.launch(this.env.BROWSER);
    const page = await browser.newPage();

    await page.goto(url);
    const screenshot = await page.screenshot({ fullPage: true });

    await browser.close();

    return screenshot;
  }
}
```

---


---

## Retrieval Augmented Generation (RAG)

Implement RAG using Vectorize + Workers AI embeddings.

### Vectorize Binding

`wrangler.jsonc`:

```jsonc
{
  "ai": {
    "binding": "AI"
  },
  "vectorize": {
    "bindings": [
      {
        "binding": "VECTORIZE",
        "index_name": "my-agent-vectors"
      }
    ]
  }
}
```

### Create Index

```bash
npx wrangler vectorize create my-agent-vectors \
  --dimensions=768 \
  --metric=cosine
```

### Complete RAG Implementation

```typescript
import { Agent } from "agents";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface Env {
  AI: Ai;
  VECTORIZE: Vectorize;
  OPENAI_API_KEY: string;
}

export class RAGAgent extends Agent<Env> {
  // Ingest documents
  async ingestDocuments(documents: Array<{ id: string; text: string; metadata: any }>) {
    const vectors = [];

    for (const doc of documents) {
      // Generate embedding with Workers AI
      const { data } = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [doc.text]
      });

      vectors.push({
        id: doc.id,
        values: data[0],
        metadata: { ...doc.metadata, text: doc.text }
      });
    }

    // Insert into Vectorize
    await this.env.VECTORIZE.upsert(vectors);

    return { ingested: vectors.length };
  }

  // Query knowledge base
  async queryKnowledge(userQuery: string, topK: number = 5) {
    // Generate query embedding
    const { data } = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [userQuery]
    });

    // Search Vectorize
    const results = await this.env.VECTORIZE.query(data[0], { topK });

    // Extract relevant documents
    const context = results.matches.map(match => match.metadata.text).join('\n\n');

    return context;
  }

  // RAG Chat
  async chat(userMessage: string) {
    // Retrieve relevant context
    const context = await this.queryKnowledge(userMessage);

    // Generate response with context
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Use the following context to answer questions:\n\n${context}`
        },
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    return { response: text, context };
  }

  async onRequest(request: Request): Promise<Response> {
    const { message } = await request.json();
    const result = await this.chat(message);
    return Response.json(result);
  }
}
```

### Metadata Filtering

```typescript
// Create metadata indexes BEFORE inserting vectors
await this.env.VECTORIZE.createMetadataIndex("category");
await this.env.VECTORIZE.createMetadataIndex("language");

// Query with filters
const results = await this.env.VECTORIZE.query(queryVector, {
  topK: 10,
  filter: {
    category: { $eq: "documentation" },
    language: { $eq: "en" }
  }
});
```

**See**: [cloudflare-vectorize skill](../cloudflare-vectorize/) for complete Vectorize guide.

---


---

## Using AI Models

### AI SDK (Vercel)

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

```typescript
import { Agent } from "agents";
import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

export class AIAgent extends Agent {
  // Simple text generation
  async generateResponse(prompt: string) {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt
    });

    return text;
  }

  // Streaming response
  async streamResponse(prompt: string): Promise<Response> {
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      prompt
    });

    return result.toTextStreamResponse();
  }

  // Structured output
  async extractData(text: string) {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.number().optional()
      }),
      prompt: `Extract user info from: ${text}`
    });

    return object;
  }
}
```

### Workers AI

```typescript
interface Env {
  AI: Ai;
}

export class WorkersAIAgent extends Agent<Env> {
  async generateText(prompt: string) {
    const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: prompt }]
    });

    return response;
  }

  async generateImage(prompt: string) {
    const response = await this.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt
    });

    return response;
  }
}
```

**See**: [cloudflare-workers-ai skill](../cloudflare-workers-ai/) for complete Workers AI guide.

---


---

## Calling Agents

### Using routeAgentRequest

Automatically route requests to agents based on URL pattern `/agents/:agent/:name`:

```typescript
import { Agent, AgentNamespace, routeAgentRequest } from 'agents';

interface Env {
  MyAgent: AgentNamespace<MyAgent>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Routes to: /agents/my-agent/user-123
    const response = await routeAgentRequest(request, env);

    if (response) {
      return response;
    }

    return new Response("Not Found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;

export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    return Response.json({ agent: this.name });
  }
}
```

**URL Pattern**: `/agents/my-agent/user-123`
- `my-agent` = class name in kebab-case
- `user-123` = agent instance name

### Using getAgentByName

For custom routing or calling agents from Workers:

```typescript
import { Agent, AgentNamespace, getAgentByName } from 'agents';

interface Env {
  MyAgent: AgentNamespace<MyAgent>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const userId = new URL(request.url).searchParams.get('userId') || 'anonymous';

    // Get or create agent instance
    const agent = getAgentByName<Env, MyAgent>(env.MyAgent, `user-${userId}`);

    // Pass request to agent
    return (await agent).fetch(request);
  }
} satisfies ExportedHandler<Env>;

export class MyAgent extends Agent<Env> {
  // Agent implementation
}
```

### Calling Agent Methods Directly

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agent = getAgentByName<Env, MyAgent>(env.MyAgent, 'user-123');

    // Call custom methods on agent using RPC
    const result = await (await agent).customMethod({ data: "example" });

    return Response.json({ result });
  }
}

export class MyAgent extends Agent<Env> {
  async customMethod(params: { data: string }): Promise<any> {
    return { processed: params.data };
  }
}
```

### Multi-Agent Communication

```typescript
interface Env {
  AgentA: AgentNamespace<AgentA>;
  AgentB: AgentNamespace<AgentB>;
}

export class AgentA extends Agent<Env> {
  async processData(data: any) {
    // Call another agent
    const agentB = getAgentByName<Env, AgentB>(this.env.AgentB, 'processor-1');
    const result = await (await agentB).analyze(data);

    return result;
  }
}

export class AgentB extends Agent<Env> {
  async analyze(data: any) {
    return { analyzed: true, data };
  }
}
```

### Authentication Patterns

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Authenticate BEFORE invoking agent
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = await verifyToken(authHeader);
    if (!userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // Only create/access agent for authenticated users
    const agent = getAgentByName<Env, MyAgent>(env.MyAgent, `user-${userId}`);
    return (await agent).fetch(request);
  }
}
```

**CRITICAL**: Always authenticate in Worker, **NOT** in Agent. Agents should assume the caller is authorized.

---


---

## Client APIs

### AgentClient (Browser)

```typescript
import { AgentClient } from "agents/client";

// Connect to agent instance
const client = new AgentClient({
  agent: "chat-agent",        // Class name in kebab-case
  name: "room-123",           // Instance name
  host: window.location.host
});

client.onopen = () => {
  console.log("Connected");
  client.send(JSON.stringify({ type: "join", user: "alice" }));
};

client.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

client.onclose = () => {
  console.log("Disconnected");
};
```

### agentFetch (HTTP Requests)

```typescript
import { agentFetch } from "agents/client";

async function getData() {
  const response = await agentFetch(
    { agent: "my-agent", name: "user-123" },
    {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    }
  );

  const data = await response.json();
  return data;
}
```

### useAgent Hook (React)

```typescript
import { useAgent } from "agents/react";
import { useState } from "react";

function ChatUI() {
  const [messages, setMessages] = useState([]);

  const connection = useAgent({
    agent: "chat-agent",
    name: "room-123",
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      }
    },
    onOpen: () => console.log("Connected"),
    onClose: () => console.log("Disconnected")
  });

  const sendMessage = (text: string) => {
    connection.send(JSON.stringify({ type: 'chat', text }));
  };

  return (
    <div>
      {messages.map((msg, i) => <div key={i}>{msg.text}</div>)}
      <button onClick={() => sendMessage("Hello")}>Send</button>
    </div>
  );
}
```

### State Synchronization

```typescript
import { useAgent } from "agents/react";
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const agent = useAgent({
    agent: "counter-agent",
    name: "my-counter",
    onStateUpdate: (newState) => {
      setCount(newState.counter);
    }
  });

  const increment = () => {
    agent.setState({ counter: count + 1 });
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### useAgentChat Hook

```typescript
import { useAgentChat } from "agents/ai-react";

function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useAgentChat({
    agent: "ai-chat-agent",
    name: "chat-session-123"
  });

  return (
    <div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}
```

---


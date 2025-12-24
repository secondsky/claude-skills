## HTTP & Server-Sent Events

### HTTP Request Handling

```typescript
export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "POST" && url.pathname === "/increment") {
      const counter = (this.state.counter || 0) + 1;
      this.setState({ ...this.state, counter });
      return Response.json({ counter });
    }

    if (method === "GET" && url.pathname === "/status") {
      return Response.json({ state: this.state, name: this.name });
    }

    return new Response("Not Found", { status: 404 });
  }
}
```

### Server-Sent Events (SSE) Streaming

```typescript
export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send events to client
        controller.enqueue(encoder.encode('data: {"message": "Starting"}\n\n'));

        await new Promise(resolve => setTimeout(resolve, 1000));

        controller.enqueue(encoder.encode('data: {"message": "Processing"}\n\n'));

        await new Promise(resolve => setTimeout(resolve, 1000));

        controller.enqueue(encoder.encode('data: {"message": "Complete"}\n\n'));

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }
}
```

**SSE vs WebSockets:**

| Feature | SSE | WebSockets |
|---------|-----|------------|
| Direction | Server → Client only | Bi-directional |
| Protocol | HTTP | ws:// or wss:// |
| Reconnection | Automatic | Manual |
| Binary Data | Limited | Full support |
| Use Case | Streaming responses, notifications | Chat, real-time collaboration |

**Recommendation**: Use WebSockets for most agent applications (full duplex, better for long sessions).

---


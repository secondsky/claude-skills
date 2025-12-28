# WebSockets in Cloudflare Workers

Real-time bidirectional communication with WebSockets.

## WebSocket Architecture

Workers support WebSockets in two modes:
1. **Proxy Mode** - Forward WebSocket connections to origin
2. **Durable Objects** - Handle WebSocket connections directly with hibernation

## Proxy Mode

### Simple WebSocket Proxy

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    // Proxy to backend WebSocket server
    const backendUrl = new URL(request.url);
    backendUrl.hostname = 'ws-backend.example.com';

    return fetch(backendUrl.toString(), {
      headers: request.headers,
    });
  },
};
```

## Durable Objects WebSockets

### Basic WebSocket Handler

```typescript
// wrangler.jsonc
// {
//   "durable_objects": {
//     "bindings": [{ "name": "ROOMS", "class_name": "ChatRoom" }]
//   }
// }

export class ChatRoom {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept WebSocket with hibernation
    this.state.acceptWebSocket(server);

    // Return client end to caller
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Called when WebSocket message received
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const data = typeof message === 'string' ? message : new TextDecoder().decode(message);

    // Broadcast to all connected clients
    const sockets = this.state.getWebSockets();
    for (const socket of sockets) {
      socket.send(data);
    }
  }

  // Called when WebSocket closes
  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    ws.close(code, reason);
  }

  // Called on WebSocket error
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    ws.close(1011, 'Internal error');
  }
}
```

### Worker Entry Point

```typescript
interface Env {
  ROOMS: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomName = url.pathname.slice(1) || 'default';

    // Get or create room
    const roomId = env.ROOMS.idFromName(roomName);
    const room = env.ROOMS.get(roomId);

    return room.fetch(request);
  },
};

export { ChatRoom };
```

## WebSocket with Tags

```typescript
export class TaggedChatRoom {
  state: DurableObjectState;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept with tags for filtering
    this.state.acceptWebSocket(server, [userId, 'all']);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const data = JSON.parse(message as string);

    if (data.type === 'broadcast') {
      // Send to all
      const sockets = this.state.getWebSockets('all');
      for (const socket of sockets) {
        socket.send(JSON.stringify(data));
      }
    } else if (data.type === 'direct' && data.targetUserId) {
      // Send to specific user
      const sockets = this.state.getWebSockets(data.targetUserId);
      for (const socket of sockets) {
        socket.send(JSON.stringify(data));
      }
    }
  }
}
```

## WebSocket Hibernation

Hibernation allows WebSocket connections to persist without keeping the Durable Object in memory.

```typescript
export class HibernatingRoom {
  state: DurableObjectState;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Hibernation-aware accept
    this.state.acceptWebSocket(server);

    // Persist user info
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (userId) {
      // Attach metadata to WebSocket (survives hibernation)
      server.serializeAttachment({ userId, joinedAt: Date.now() });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Get metadata
    const attachment = ws.deserializeAttachment() as { userId: string; joinedAt: number };
    const userId = attachment?.userId || 'anonymous';

    const data = {
      from: userId,
      message: typeof message === 'string' ? message : new TextDecoder().decode(message),
      timestamp: Date.now(),
    };

    // Store message
    await this.storage.put(`message:${Date.now()}`, data);

    // Broadcast
    for (const socket of this.state.getWebSockets()) {
      socket.send(JSON.stringify(data));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const attachment = ws.deserializeAttachment() as { userId: string };

    // Notify others
    for (const socket of this.state.getWebSockets()) {
      if (socket !== ws) {
        socket.send(JSON.stringify({
          type: 'user_left',
          userId: attachment?.userId,
        }));
      }
    }

    ws.close(code, reason);
  }
}
```

## Client-Side Connection

```typescript
// Browser client
function connectWebSocket(roomName: string, userId: string): WebSocket {
  const ws = new WebSocket(
    `wss://my-worker.example.com/${roomName}?userId=${userId}`
  );

  ws.onopen = () => {
    console.log('Connected');
    ws.send(JSON.stringify({ type: 'join', userId }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
  };

  ws.onclose = (event) => {
    console.log('Disconnected:', event.code, event.reason);
    // Implement reconnection logic
    setTimeout(() => connectWebSocket(roomName, userId), 1000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}
```

## Message Protocol Design

```typescript
// Define message types
type ServerMessage =
  | { type: 'chat'; from: string; message: string; timestamp: number }
  | { type: 'user_joined'; userId: string }
  | { type: 'user_left'; userId: string }
  | { type: 'error'; message: string };

type ClientMessage =
  | { type: 'chat'; message: string }
  | { type: 'typing' }
  | { type: 'ping' };

async function handleMessage(
  ws: WebSocket,
  message: ClientMessage,
  userId: string
): Promise<void> {
  switch (message.type) {
    case 'chat':
      broadcast({ type: 'chat', from: userId, message: message.message, timestamp: Date.now() });
      break;
    case 'typing':
      broadcastExcept(ws, { type: 'typing', userId });
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
  }
}
```

## Connection Management

```typescript
export class ManagedRoom {
  state: DurableObjectState;
  connections: Map<WebSocket, { userId: string; lastSeen: number }> = new Map();

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Update last seen
    const conn = this.connections.get(ws);
    if (conn) {
      conn.lastSeen = Date.now();
    }

    // Handle message...
  }

  // Clean up stale connections (call via alarm)
  async cleanup(): Promise<void> {
    const now = Date.now();
    const timeout = 60000; // 1 minute

    for (const socket of this.state.getWebSockets()) {
      const attachment = socket.deserializeAttachment() as { lastSeen?: number };
      if (attachment?.lastSeen && now - attachment.lastSeen > timeout) {
        socket.close(1000, 'Idle timeout');
      }
    }
  }
}
```

## Best Practices

1. **Use hibernation** - Reduces costs for idle connections
2. **Implement heartbeat/ping** - Detect dead connections
3. **Handle reconnection** - Client should auto-reconnect
4. **Validate messages** - Don't trust client input
5. **Use tags for targeting** - Efficient broadcast to subsets
6. **Store minimal state** - Durable Object storage for persistence
7. **Rate limit messages** - Prevent abuse

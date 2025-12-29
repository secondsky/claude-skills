/**
 * WebSocket Handler with Durable Objects
 *
 * Features:
 * - WebSocket connections with hibernation
 * - Room-based messaging
 * - User presence tracking
 * - Message persistence
 * - Rate limiting
 *
 * Usage:
 * 1. Copy to src/room.ts (Durable Object)
 * 2. Configure wrangler.jsonc durable_objects binding
 * 3. Create entry worker that routes to rooms
 */

// ============================================
// TYPES
// ============================================

interface UserInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

interface ChatMessage {
  type: 'chat';
  from: UserInfo;
  content: string;
  timestamp: number;
}

interface SystemMessage {
  type: 'system';
  event: 'user_joined' | 'user_left' | 'error';
  user?: UserInfo;
  message?: string;
  timestamp: number;
}

interface PresenceMessage {
  type: 'presence';
  users: UserInfo[];
  timestamp: number;
}

type ServerMessage = ChatMessage | SystemMessage | PresenceMessage;

interface ClientMessage {
  type: 'chat' | 'typing' | 'ping';
  content?: string;
}

interface Env {
  ROOMS: DurableObjectNamespace;
}

// ============================================
// DURABLE OBJECT: CHAT ROOM
// ============================================

export class ChatRoom {
  private state: DurableObjectState;
  private storage: DurableObjectStorage;
  private messageHistory: ChatMessage[] = [];
  private rateLimits: Map<string, number[]> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
    this.storage = state.storage;

    // Load message history on wake
    state.blockConcurrencyWhile(async () => {
      const stored = await this.storage.get<ChatMessage[]>('messages');
      if (stored) {
        this.messageHistory = stored.slice(-100); // Keep last 100
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');

    // Handle non-WebSocket requests
    if (upgradeHeader !== 'websocket') {
      // API endpoints
      if (url.pathname === '/history') {
        return Response.json(this.messageHistory);
      }
      if (url.pathname === '/users') {
        return Response.json(this.getUsers());
      }
      return new Response('Expected websocket upgrade', { status: 426 });
    }

    // Get user info from query params
    const userId = url.searchParams.get('userId') || crypto.randomUUID();
    const userName = url.searchParams.get('name') || 'Anonymous';

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Attach user info
    const userInfo: UserInfo = {
      id: userId,
      name: userName,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    // Accept with hibernation
    this.state.acceptWebSocket(server, [userId]);
    server.serializeAttachment(userInfo);

    // Send welcome message with history
    server.send(
      JSON.stringify({
        type: 'welcome',
        userId,
        history: this.messageHistory.slice(-50),
        users: this.getUsers(),
      })
    );

    // Notify others
    this.broadcast({
      type: 'system',
      event: 'user_joined',
      user: userInfo,
      timestamp: Date.now(),
    }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const userInfo = ws.deserializeAttachment() as UserInfo;
    userInfo.lastSeen = Date.now();
    ws.serializeAttachment(userInfo);

    // Rate limiting
    if (!this.checkRateLimit(userInfo.id)) {
      ws.send(JSON.stringify({
        type: 'system',
        event: 'error',
        message: 'Rate limit exceeded. Please slow down.',
        timestamp: Date.now(),
      }));
      return;
    }

    try {
      const data = JSON.parse(
        typeof message === 'string' ? message : new TextDecoder().decode(message)
      ) as ClientMessage;

      switch (data.type) {
        case 'chat':
          await this.handleChat(ws, userInfo, data.content || '');
          break;
        case 'typing':
          this.handleTyping(ws, userInfo);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
      }
    } catch {
      ws.send(JSON.stringify({
        type: 'system',
        event: 'error',
        message: 'Invalid message format',
        timestamp: Date.now(),
      }));
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    const userInfo = ws.deserializeAttachment() as UserInfo;

    // Notify others
    this.broadcast({
      type: 'system',
      event: 'user_left',
      user: userInfo,
      timestamp: Date.now(),
    });

    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    ws.close(1011, 'Internal error');
  }

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  private async handleChat(
    ws: WebSocket,
    user: UserInfo,
    content: string
  ): Promise<void> {
    // Validate
    const sanitized = content.trim().slice(0, 1000);
    if (!sanitized) return;

    const message: ChatMessage = {
      type: 'chat',
      from: user,
      content: sanitized,
      timestamp: Date.now(),
    };

    // Store
    this.messageHistory.push(message);
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(-100);
    }
    await this.storage.put('messages', this.messageHistory);

    // Broadcast to all including sender
    this.broadcast(message);
  }

  private handleTyping(ws: WebSocket, user: UserInfo): void {
    // Broadcast typing indicator to others
    this.broadcast(
      {
        type: 'typing',
        userId: user.id,
        userName: user.name,
        timestamp: Date.now(),
      } as unknown as ServerMessage,
      ws
    );
  }

  // ============================================
  // UTILITIES
  // ============================================

  private broadcast(message: ServerMessage, exclude?: WebSocket): void {
    const json = JSON.stringify(message);
    for (const socket of this.state.getWebSockets()) {
      if (socket !== exclude) {
        socket.send(json);
      }
    }
  }

  private getUsers(): UserInfo[] {
    return this.state.getWebSockets().map((ws) => {
      return ws.deserializeAttachment() as UserInfo;
    });
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const window = 10000; // 10 seconds
    const maxMessages = 20; // 20 messages per window

    let timestamps = this.rateLimits.get(userId) || [];
    timestamps = timestamps.filter((t) => now - t < window);

    if (timestamps.length >= maxMessages) {
      return false;
    }

    timestamps.push(now);
    this.rateLimits.set(userId, timestamps);
    return true;
  }
}

// ============================================
// WORKER ENTRY POINT
// ============================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Parse room name from path: /room/<name>
    const match = url.pathname.match(/^\/room\/([^/]+)/);
    if (!match) {
      return new Response('Room not found. Use /room/<name>', { status: 404 });
    }

    const roomName = match[1];

    // Get or create room
    const roomId = env.ROOMS.idFromName(roomName);
    const room = env.ROOMS.get(roomId);

    // Forward request to room
    return room.fetch(request);
  },
};

// ============================================
// WRANGLER CONFIGURATION
// ============================================

/*
// wrangler.jsonc
{
  "name": "chat-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "durable_objects": {
    "bindings": [
      {
        "name": "ROOMS",
        "class_name": "ChatRoom"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["ChatRoom"]
    }
  ]
}
*/

// ============================================
// CLIENT USAGE
// ============================================

/*
// Browser client
const ws = new WebSocket(
  'wss://my-chat.workers.dev/room/general?userId=123&name=John'
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onopen = () => {
  // Send a chat message
  ws.send(JSON.stringify({ type: 'chat', content: 'Hello everyone!' }));
};

ws.onclose = () => {
  // Reconnect logic
  setTimeout(() => reconnect(), 1000);
};
*/

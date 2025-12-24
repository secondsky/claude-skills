## WebSockets

### Complete WebSocket Example

```typescript
import { Agent, Connection, ConnectionContext, WSMessage } from "agents";

interface ChatState {
  messages: Array<{ id: string; text: string; sender: string; timestamp: number }>;
  participants: string[];
}

export class ChatAgent extends Agent<Env, ChatState> {
  initialState: ChatState = {
    messages: [],
    participants: []
  };

  async onConnect(connection: Connection, ctx: ConnectionContext) {
    // Access original HTTP request for auth
    const authHeader = ctx.request.headers.get('Authorization');
    const userId = ctx.request.headers.get('X-User-ID') || 'anonymous';

    // Connections are automatically accepted
    // Optionally close connection if unauthorized:
    // if (!authHeader) {
    //   connection.close(401, "Unauthorized");
    //   return;
    // }

    // Add to participants
    this.setState({
      ...this.state,
      participants: [...this.state.participants, userId]
    });

    // Send welcome message
    connection.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to chat',
      participants: this.state.participants
    }));
  }

  async onMessage(connection: Connection, message: WSMessage) {
    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message);

        if (data.type === 'chat') {
          // Add message to state
          const newMessage = {
            id: crypto.randomUUID(),
            text: data.text,
            sender: data.sender || 'anonymous',
            timestamp: Date.now()
          };

          this.setState({
            ...this.state,
            messages: [...this.state.messages, newMessage]
          });

          // Broadcast to this connection (state sync will broadcast to all)
          connection.send(JSON.stringify({
            type: 'message_added',
            message: newMessage
          }));
        }
      } catch (e) {
        connection.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    }
  }

  async onError(connection: Connection, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    // Optionally log to external monitoring
  }

  async onClose(connection: Connection, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log(`Connection ${connection.id} closed:`, code, reason, wasClean);
    // Clean up connection-specific state if needed
  }
}
```

### Connection Management

```typescript
export class MyAgent extends Agent {
  async onMessage(connection: Connection, message: WSMessage) {
    // Connection properties
    const connId = connection.id;  // Unique connection ID
    const connState = connection.state;  // Connection-specific state

    // Update connection state (not agent state)
    connection.setState({ ...connection.state, lastActive: Date.now() });

    // Send to this connection only
    connection.send("Message to this client");

    // Close connection programmatically
    connection.close(1000, "Goodbye");
  }
}
```

---


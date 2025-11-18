## Agent Class API

The `Agent` class is the foundation of the Agents SDK. Extend it to create your agent.

### Basic Agent Structure

```typescript
import { Agent } from "agents";

interface Env {
  // Environment variables and bindings
  OPENAI_API_KEY: string;
  AI: Ai;
  VECTORIZE: Vectorize;
  DB: D1Database;
}

interface State {
  // Your agent's persistent state
  counter: number;
  messages: string[];
  lastUpdated: Date | null;
}

export class MyAgent extends Agent<Env, State> {
  // Optional: Set initial state (first time agent is created)
  initialState: State = {
    counter: 0,
    messages: [],
    lastUpdated: null
  };

  // Optional: Called when agent instance starts or wakes from hibernation
  async onStart() {
    console.log('Agent started:', this.name, 'State:', this.state);
  }

  // Handle HTTP requests
  async onRequest(request: Request): Promise<Response> {
    return Response.json({ message: "Hello from Agent", state: this.state });
  }

  // Handle WebSocket connections (optional)
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    console.log('Client connected:', connection.id);
    // Connections are automatically accepted
  }

  // Handle WebSocket messages (optional)
  async onMessage(connection: Connection, message: WSMessage) {
    if (typeof message === 'string') {
      connection.send(`Echo: ${message}`);
    }
  }

  // Handle WebSocket errors (optional)
  async onError(connection: Connection, error: unknown): Promise<void> {
    console.error('Connection error:', error);
  }

  // Handle WebSocket close (optional)
  async onClose(connection: Connection, code: number, reason: string, wasClean: boolean): Promise<void> {
    console.log('Connection closed:', code, reason);
  }

  // Called when state is updated from any source (optional)
  onStateUpdate(state: State, source: "server" | Connection) {
    console.log('State updated:', state, 'Source:', source);
  }

  // Custom methods (call from any handler)
  async customMethod(data: any) {
    this.setState({
      ...this.state,
      counter: this.state.counter + 1,
      lastUpdated: new Date()
    });
  }
}
```

### Accessing Agent Properties

Within any Agent method:

```typescript
export class MyAgent extends Agent<Env, State> {
  async someMethod() {
    // Access environment variables and bindings
    const apiKey = this.env.OPENAI_API_KEY;
    const ai = this.env.AI;

    // Access current state (read-only)
    const counter = this.state.counter;

    // Update state (persisted automatically)
    this.setState({ ...this.state, counter: counter + 1 });

    // Access SQL database
    const results = await this.sql`SELECT * FROM users`;

    // Get agent instance name
    const instanceName = this.name;  // e.g., "user-123"

    // Schedule tasks
    await this.schedule(60, "runLater", { data: "example" });

    // Call other methods
    await this.customMethod({ foo: "bar" });
  }
}
```

---


# State Management, Scheduling & Workflows

This guide covers state management, scheduled tasks, and workflow integration for Cloudflare Agents.

---

## State Management

### Using setState()

```typescript
interface UserState {
  name: string;
  email: string;
  preferences: { theme: string; notifications: boolean };
  loginCount: number;
  lastLogin: Date | null;
}

export class UserAgent extends Agent<Env, UserState> {
  initialState: UserState = {
    name: "",
    email: "",
    preferences: { theme: "dark", notifications: true },
    loginCount: 0,
    lastLogin: null
  };

  async onRequest(request: Request): Promise<Response> {
    if (request.method === "POST" && new URL(request.url).pathname === "/login") {
      // Update state
      this.setState({
        ...this.state,
        loginCount: this.state.loginCount + 1,
        lastLogin: new Date()
      });

      // State is automatically persisted and synced to connected clients
      return Response.json({ success: true, state: this.state });
    }

    return Response.json({ state: this.state });
  }

  onStateUpdate(state: UserState, source: "server" | Connection) {
    console.log('State updated:', state);
    console.log('Source:', source);  // "server" or Connection object

    // React to state changes
    if (state.loginCount > 10) {
      console.log('Frequent user!');
    }
  }
}
```

**State Rules:**
- ✅ State is JSON-serializable (objects, arrays, strings, numbers, booleans, null)
- ✅ State persists across agent restarts
- ✅ State is immediately consistent within the agent
- ✅ State automatically syncs to connected WebSocket clients
- ❌ State cannot contain functions or circular references
- ❌ Total state size limited by database size (1GB max per agent)

### Using SQL Database

Each agent has a built-in SQLite database accessible via `this.sql`:

```typescript
export class MyAgent extends Agent {
  async onStart() {
    // Create tables on first start
    await this.sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_email ON users(email)
    `;
  }

  async addUser(name: string, email: string) {
    // Insert with prepared statement (prevents SQL injection)
    const result = await this.sql`
      INSERT INTO users (name, email)
      VALUES (${name}, ${email})
    `;

    return result;
  }

  async getUser(email: string) {
    // Query returns array of results
    const users = await this.sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    return users[0] || null;
  }

  async getAllUsers() {
    const users = await this.sql`
      SELECT * FROM users ORDER BY created_at DESC
    `;

    return users;
  }

  async updateUser(id: number, name: string) {
    await this.sql`
      UPDATE users SET name = ${name} WHERE id = ${id}
    `;
  }

  async deleteUser(id: number) {
    await this.sql`
      DELETE FROM users WHERE id = ${id}
    `;
  }
}
```

**SQL Best Practices:**
- ✅ Use tagged template literals (prevents SQL injection)
- ✅ Create indexes for frequently queried columns
- ✅ Use transactions for multiple related operations
- ✅ Query results are always arrays (even for single row)
- ❌ Don't construct SQL strings manually
- ❌ Be mindful of 1GB database size limit

---


---

## Schedule Tasks

Agents can schedule tasks to run in the future using `this.schedule()`.

### Delay (Seconds)

```typescript
export class MyAgent extends Agent {
  async onRequest(request: Request): Promise<Response> {
    // Schedule task to run in 60 seconds
    const { id } = await this.schedule(60, "checkStatus", { requestId: "123" });

    return Response.json({ scheduledTaskId: id });
  }

  // This method will be called in 60 seconds
  async checkStatus(data: { requestId: string }) {
    console.log('Checking status for request:', data.requestId);
    // Perform check, update state, send notification, etc.
  }
}
```

### Specific Date

```typescript
export class MyAgent extends Agent {
  async scheduleReminder(reminderDate: string) {
    const date = new Date(reminderDate);

    const { id } = await this.schedule(date, "sendReminder", {
      message: "Time for your appointment!"
    });

    return id;
  }

  async sendReminder(data: { message: string }) {
    console.log('Sending reminder:', data.message);
    // Send email, push notification, etc.
  }
}
```

### Cron Expressions

```typescript
export class MyAgent extends Agent {
  async setupRecurringTasks() {
    // Every 10 minutes
    await this.schedule("*/10 * * * *", "checkUpdates", {});

    // Every day at 8 AM
    await this.schedule("0 8 * * *", "dailyReport", {});

    // Every Monday at 9 AM
    await this.schedule("0 9 * * 1", "weeklyReport", {});

    // Every hour on the hour
    await this.schedule("0 * * * *", "hourlyCheck", {});
  }

  async checkUpdates(data: any) {
    console.log('Checking for updates...');
  }

  async dailyReport(data: any) {
    console.log('Generating daily report...');
  }

  async weeklyReport(data: any) {
    console.log('Generating weekly report...');
  }

  async hourlyCheck(data: any) {
    console.log('Running hourly check...');
  }
}
```

### Managing Scheduled Tasks

```typescript
export class MyAgent extends Agent {
  async manageSchedules() {
    // Get all scheduled tasks
    const allTasks = this.getSchedules();
    console.log('Total tasks:', allTasks.length);

    // Get specific task by ID
    const taskId = "some-task-id";
    const task = await this.getSchedule(taskId);

    if (task) {
      console.log('Task:', task.callback, 'at', new Date(task.time));
      console.log('Payload:', task.payload);
      console.log('Type:', task.type);  // "scheduled" | "delayed" | "cron"

      // Cancel the task
      const cancelled = await this.cancelSchedule(taskId);
      console.log('Cancelled:', cancelled);
    }

    // Get tasks in time range
    const upcomingTasks = this.getSchedules({
      timeRange: {
        start: new Date(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000)  // Next 24 hours
      }
    });

    console.log('Upcoming tasks:', upcomingTasks.length);

    // Filter by type
    const cronTasks = this.getSchedules({ type: "cron" });
    const delayedTasks = this.getSchedules({ type: "delayed" });
  }
}
```

**Scheduling Constraints:**
- Each task maps to a SQL database row (max 2 MB per task)
- Total tasks limited by: `(task_size * count) + other_state < 1GB`
- Cron tasks continue running until explicitly cancelled
- Callback method MUST exist on Agent class (throws error if missing)

**CRITICAL ERROR**: If callback method doesn't exist:
```typescript
// ❌ BAD: Method doesn't exist
await this.schedule(60, "nonExistentMethod", {});

// ✅ GOOD: Method exists
await this.schedule(60, "existingMethod", {});

async existingMethod(data: any) {
  // Implementation
}
```

---


---

## Run Workflows

Agents can trigger asynchronous [Cloudflare Workflows](https://developers.cloudflare.com/workflows/).

### Workflow Binding Configuration

`wrangler.jsonc`:

```jsonc
{
  "workflows": [
    {
      "name": "MY_WORKFLOW",
      "class_name": "MyWorkflow"
    }
  ]
}
```

If Workflow is in a different script:

```jsonc
{
  "workflows": [
    {
      "name": "EMAIL_WORKFLOW",
      "class_name": "EmailWorkflow",
      "script_name": "email-workflows"  // Different project
    }
  ]
}
```

### Triggering a Workflow

```typescript
import { Agent } from "agents";
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

interface Env {
  MY_WORKFLOW: Workflow;
  MyAgent: AgentNamespace<MyAgent>;
}

export class MyAgent extends Agent<Env> {
  async onRequest(request: Request): Promise<Response> {
    const userId = new URL(request.url).searchParams.get('userId');

    // Trigger a workflow immediately
    const instance = await this.env.MY_WORKFLOW.create({
      id: `user-${userId}`,
      params: { userId, action: "process" }
    });

    // Or schedule a delayed workflow trigger
    await this.schedule(300, "runWorkflow", { userId });

    return Response.json({ workflowId: instance.id });
  }

  async runWorkflow(data: { userId: string }) {
    const instance = await this.env.MY_WORKFLOW.create({
      id: `delayed-${data.userId}`,
      params: data
    });

    // Monitor workflow status periodically
    await this.schedule("*/5 * * * *", "checkWorkflowStatus", { id: instance.id });
  }

  async checkWorkflowStatus(data: { id: string }) {
    // Check workflow status (see Workflows docs for details)
    console.log('Checking workflow:', data.id);
  }
}

// Workflow definition (can be in same or different file/project)
export class MyWorkflow extends WorkflowEntrypoint<Env> {
  async run(event: WorkflowEvent<{ userId: string }>, step: WorkflowStep) {
    // Workflow implementation
    const result = await step.do('process-data', async () => {
      return { processed: true };
    });

    return result;
  }
}
```

### Agents vs Workflows

| Feature | Agents | Workflows |
|---------|--------|-----------|
| **Purpose** | Interactive, user-facing | Background processing |
| **Duration** | Seconds to hours | Minutes to hours |
| **State** | SQLite database | Step-based checkpoints |
| **Interaction** | WebSockets, HTTP | No direct interaction |
| **Retry** | Manual | Automatic per step |
| **Use Case** | Chat, real-time UI | ETL, batch processing |

**Best Practice**: Use Agents to **coordinate** multiple Workflows. Agents can trigger, monitor, and respond to Workflow results while maintaining user interaction.

---


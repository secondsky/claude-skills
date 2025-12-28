# Monitoring & Debugging Durable Objects

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: https://developers.cloudflare.com/durable-objects/

## Overview

Comprehensive guide to monitoring, debugging, and troubleshooting Durable Objects in production environments.

**Key Topics**:
- Logging best practices
- Tracing execution paths
- Debugging WebSocket connections
- Debugging alarms
- State inspection techniques
- Performance monitoring
- Error tracking and alerting

---

## Logging Best Practices

### Structured Logging Pattern

```typescript
export class ChatRoom extends DurableObject {
  private log(level: string, message: string, metadata: any = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      do_class: "ChatRoom",
      do_id: this.ctx.id.toString(),
      message,
      ...metadata,
    }));
  }

  async handleMessage(userId: string, text: string): Promise<void> {
    this.log("info", "Processing message", {
      userId,
      messageLength: text.length,
    });

    try {
      await this.ctx.storage.sql.exec(
        "INSERT INTO messages (user_id, text, timestamp) VALUES (?, ?, ?)",
        userId,
        text,
        Date.now()
      );

      this.log("info", "Message stored successfully", { userId });
    } catch (error) {
      this.log("error", "Failed to store message", {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

### Correlation IDs for Request Tracing

```typescript
export class Counter extends DurableObject {
  async increment(requestId?: string): Promise<number> {
    const correlationId = requestId ?? crypto.randomUUID();

    console.log(JSON.stringify({
      correlationId,
      event: "increment_start",
      do_id: this.ctx.id.toString(),
    }));

    const value = await this.ctx.storage.get<number>("value") ?? 0;
    const newValue = value + 1;
    await this.ctx.storage.put("value", newValue);

    console.log(JSON.stringify({
      correlationId,
      event: "increment_complete",
      do_id: this.ctx.id.toString(),
      value: newValue,
    }));

    return newValue;
  }
}

// Worker passes correlation ID
const response = await stub.increment(request.headers.get("X-Request-ID"));
```

### Performance Logging

```typescript
export class DataProcessor extends DurableObject {
  async processData(data: any): Promise<void> {
    const startTime = Date.now();
    const methodName = "processData";

    try {
      // Process data
      await this.heavyComputation(data);

      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        event: "performance",
        method: methodName,
        duration_ms: duration,
        do_id: this.ctx.id.toString(),
        data_size: JSON.stringify(data).length,
      }));

      if (duration > 1000) {
        console.warn(`Slow operation: ${methodName} took ${duration}ms`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(JSON.stringify({
        event: "error",
        method: methodName,
        duration_ms: duration,
        error: error.message,
      }));
      throw error;
    }
  }
}
```

---

## Using wrangler tail for Real-Time Logs

### Basic Tail

```bash
# Tail all logs
npx wrangler tail

# Tail specific Worker
npx wrangler tail my-worker

# Filter by status
npx wrangler tail --status error
npx wrangler tail --status ok

# Filter by sampling rate
npx wrangler tail --sampling-rate 0.1  # 10% of logs
```

### Filter by DO

```bash
# Tail and grep for specific DO ID
npx wrangler tail | grep "do_id.*abc123"

# Filter in code
npx wrangler tail --format json | jq 'select(.logs[] | contains("ChatRoom"))'
```

### Tail with Correlation IDs

```bash
# Follow a specific request through multiple DOs
npx wrangler tail | grep "correlationId.*request-123"
```

---

## Tracing Execution Paths

### Constructor Tracing

```typescript
export class Counter extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    console.log(JSON.stringify({
      event: "constructor_start",
      do_id: ctx.id.toString(),
      timestamp: Date.now(),
    }));

    ctx.blockConcurrencyWhile(async () => {
      const loadStart = Date.now();

      const value = await ctx.storage.get<number>("value");

      console.log(JSON.stringify({
        event: "constructor_loaded",
        do_id: ctx.id.toString(),
        duration_ms: Date.now() - loadStart,
        had_state: value !== undefined,
      }));
    });

    console.log(JSON.stringify({
      event: "constructor_complete",
      do_id: ctx.id.toString(),
    }));
  }
}
```

### Method Call Tracing

```typescript
export class ChatRoom extends DurableObject {
  private traceMethod<T>(
    methodName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();

    console.log(JSON.stringify({
      traceId,
      event: `${methodName}_start`,
      do_id: this.ctx.id.toString(),
    }));

    return fn()
      .then((result) => {
        console.log(JSON.stringify({
          traceId,
          event: `${methodName}_success`,
          duration_ms: Date.now() - startTime,
        }));
        return result;
      })
      .catch((error) => {
        console.error(JSON.stringify({
          traceId,
          event: `${methodName}_error`,
          duration_ms: Date.now() - startTime,
          error: error.message,
        }));
        throw error;
      });
  }

  async addMessage(userId: string, text: string): Promise<void> {
    return this.traceMethod("addMessage", async () => {
      await this.ctx.storage.sql.exec(
        "INSERT INTO messages (user_id, text) VALUES (?, ?)",
        userId,
        text
      );
    });
  }
}
```

---

## Debugging WebSocket Connections

### Connection Tracking

```typescript
export class ChatRoom extends DurableObject {
  private connections: Map<string, {
    socket: WebSocket;
    userId: string;
    connectedAt: number;
  }> = new Map();

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    const connectionInfo = this.connections.get(ws as any);

    console.log(JSON.stringify({
      event: "websocket_message",
      userId: connectionInfo?.userId,
      messageSize: typeof message === "string" ? message.length : message.byteLength,
      connectionAge: connectionInfo ? Date.now() - connectionInfo.connectedAt : 0,
    }));

    // Process message
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    const connectionInfo = this.connections.get(ws as any);

    console.log(JSON.stringify({
      event: "websocket_close",
      userId: connectionInfo?.userId,
      code,
      reason,
      connectionDuration: connectionInfo ? Date.now() - connectionInfo.connectedAt : 0,
    }));

    this.connections.delete(ws as any);
  }

  async webSocketError(ws: WebSocket, error: Error) {
    const connectionInfo = this.connections.get(ws as any);

    console.error(JSON.stringify({
      event: "websocket_error",
      userId: connectionInfo?.userId,
      error: error.message,
      stack: error.stack,
    }));
  }
}
```

### Hibernation Debugging

```typescript
export class ChatRoom extends DurableObject {
  async webSocketMessage(ws: WebSocket, message: string) {
    console.log(JSON.stringify({
      event: "pre_hibernation_check",
      activeConnections: (await this.ctx.getWebSockets()).length,
      messageReceived: true,
    }));

    // Process message
  }

  async alarm() {
    const sockets = await this.ctx.getWebSockets();

    console.log(JSON.stringify({
      event: "alarm_wake",
      reason: "scheduled_task",
      activeConnections: sockets.length,
      timestamp: Date.now(),
    }));

    // Check for hibernation issues
    for (const socket of sockets) {
      try {
        const attachment = await socket.deserializeAttachment();
        console.log(JSON.stringify({
          event: "socket_deserialized",
          attachmentValid: !!attachment,
        }));
      } catch (error) {
        console.error(JSON.stringify({
          event: "deserialization_error",
          error: error.message,
        }));
      }
    }
  }
}
```

---

## Debugging Alarms

### Alarm Execution Tracking

```typescript
export class Cleanup extends DurableObject {
  async alarm() {
    const alarmStart = Date.now();

    console.log(JSON.stringify({
      event: "alarm_start",
      do_id: this.ctx.id.toString(),
      scheduledFor: await this.ctx.storage.getAlarm(),
    }));

    try {
      // Perform cleanup
      const deleted = await this.ctx.storage.sql.exec(
        "DELETE FROM data WHERE expires_at < ?",
        Date.now()
      );

      console.log(JSON.stringify({
        event: "alarm_complete",
        duration_ms: Date.now() - alarmStart,
        deleted_rows: deleted.changes,
      }));

      // Schedule next alarm
      await this.ctx.storage.setAlarm(Date.now() + 3600_000);
    } catch (error) {
      console.error(JSON.stringify({
        event: "alarm_error",
        duration_ms: Date.now() - alarmStart,
        error: error.message,
        stack: error.stack,
      }));

      // Retry alarm
      await this.ctx.storage.setAlarm(Date.now() + 60_000);
    }
  }
}
```

### Alarm Retry Debugging

```typescript
export class RetryableDO extends DurableObject {
  private alarmRetries: number = 0;
  private readonly MAX_RETRIES = 3;

  async alarm() {
    console.log(JSON.stringify({
      event: "alarm_attempt",
      retries: this.alarmRetries,
      maxRetries: this.MAX_RETRIES,
    }));

    try {
      await this.processTask();
      this.alarmRetries = 0; // Reset on success
    } catch (error) {
      this.alarmRetries++;

      console.error(JSON.stringify({
        event: "alarm_retry",
        retries: this.alarmRetries,
        error: error.message,
      }));

      if (this.alarmRetries < this.MAX_RETRIES) {
        // Exponential backoff
        const delay = Math.pow(2, this.alarmRetries) * 60_000;
        await this.ctx.storage.setAlarm(Date.now() + delay);

        console.log(JSON.stringify({
          event: "alarm_rescheduled",
          retries: this.alarmRetries,
          delay_ms: delay,
        }));
      } else {
        console.error(JSON.stringify({
          event: "alarm_failed_permanently",
          retries: this.alarmRetries,
        }));
      }
    }
  }
}
```

---

## State Inspection Techniques

### SQL Storage Debugging

```typescript
export class Counter extends DurableObject {
  async debugState(): Promise<any> {
    // Get table info
    const tables = this.ctx.storage.sql
      .exec("SELECT name FROM sqlite_master WHERE type='table'")
      .toArray();

    console.log(JSON.stringify({
      event: "debug_state",
      tables: tables.map((t: any) => t.name),
    }));

    // Get row counts
    const diagnostics: any = {};
    for (const table of tables) {
      const count = this.ctx.storage.sql
        .exec(`SELECT COUNT(*) as count FROM ${(table as any).name}`)
        .one();
      diagnostics[(table as any).name] = count;
    }

    return diagnostics;
  }

  async checkStorageSize(): Promise<number> {
    const result = this.ctx.storage.sql
      .exec("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
      .one();

    const sizeBytes = (result as any).size;
    const sizeMB = sizeBytes / (1024 * 1024);

    console.log(JSON.stringify({
      event: "storage_size_check",
      size_bytes: sizeBytes,
      size_mb: sizeMB.toFixed(2),
      percent_of_limit: ((sizeMB / 1024) * 100).toFixed(2),
    }));

    return sizeBytes;
  }
}
```

### KV Storage Debugging

```typescript
export class Session extends DurableObject {
  async debugKVState(): Promise<any> {
    const allKeys = await this.ctx.storage.list();

    console.log(JSON.stringify({
      event: "debug_kv_state",
      key_count: allKeys.size,
      keys: Array.from(allKeys.keys()),
    }));

    // Check for large values
    const largeValues: string[] = [];
    for (const [key, value] of allKeys) {
      const size = JSON.stringify(value).length;
      if (size > 10_000) {
        largeValues.push(`${key}: ${(size / 1024).toFixed(2)}KB`);
      }
    }

    if (largeValues.length > 0) {
      console.warn(JSON.stringify({
        event: "large_kv_values",
        values: largeValues,
      }));
    }

    return {
      keyCount: allKeys.size,
      largeValues,
    };
  }
}
```

---

## Performance Monitoring

### Constructor Performance

```typescript
export class HeavyDO extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    const constructorStart = Date.now();

    ctx.blockConcurrencyWhile(async () => {
      const blockStart = Date.now();

      // Load data
      const data = await ctx.storage.sql
        .exec("SELECT * FROM large_table")
        .toArray();

      const blockDuration = Date.now() - blockStart;

      console.log(JSON.stringify({
        event: "constructor_block",
        duration_ms: blockDuration,
        rows_loaded: data.length,
      }));

      if (blockDuration > 1000) {
        console.warn(`Slow constructor: blockConcurrencyWhile took ${blockDuration}ms`);
      }
    });

    const totalDuration = Date.now() - constructorStart;

    console.log(JSON.stringify({
      event: "constructor_total",
      duration_ms: totalDuration,
    }));
  }
}
```

### Query Performance Tracking

```typescript
export class DataDO extends DurableObject {
  private async trackQuery<T>(
    sql: string,
    params: any[],
    executor: () => T
  ): Promise<T> {
    const start = Date.now();

    const result = executor();

    const duration = Date.now() - start;

    console.log(JSON.stringify({
      event: "sql_query",
      sql: sql.substring(0, 100), // Truncate long queries
      duration_ms: duration,
      params_count: params.length,
    }));

    if (duration > 100) {
      console.warn(JSON.stringify({
        event: "slow_query",
        sql,
        duration_ms: duration,
      }));
    }

    return result;
  }

  async getMessages(limit: number): Promise<any[]> {
    const sql = "SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?";

    return this.trackQuery(sql, [limit], () => {
      return this.ctx.storage.sql.exec(sql, limit).toArray();
    });
  }
}
```

### Hibernation Wake Time

```typescript
export class ChatRoom extends DurableObject {
  private lastActivity: number = Date.now();

  async webSocketMessage(ws: WebSocket, message: string) {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;

    if (timeSinceLastActivity > 10_000) {
      // Likely woke from hibernation
      console.log(JSON.stringify({
        event: "hibernation_wake",
        idle_duration_ms: timeSinceLastActivity,
      }));
    }

    this.lastActivity = now;

    // Process message
  }
}
```

---

## Error Tracking and Alerting

### Error Categorization

```typescript
export class ResilientDO extends DurableObject {
  private logError(error: Error, context: any) {
    const errorInfo = {
      event: "error",
      timestamp: new Date().toISOString(),
      do_id: this.ctx.id.toString(),
      error_type: error.name,
      error_message: error.message,
      error_stack: error.stack,
      context,
    };

    // Categorize errors
    if (error.message.includes("UNIQUE constraint")) {
      errorInfo.event = "error_duplicate_key";
    } else if (error.message.includes("NOT NULL constraint")) {
      errorInfo.event = "error_missing_data";
    } else if (error.message.includes("cannot start a transaction")) {
      errorInfo.event = "error_transaction_conflict";
    }

    console.error(JSON.stringify(errorInfo));

    // Send to external monitoring (if available)
    this.ctx.waitUntil(
      this.reportToMonitoring(errorInfo)
    );
  }

  private async reportToMonitoring(errorInfo: any): Promise<void> {
    try {
      // Send to monitoring service
      // await fetch("https://monitoring.example.com/errors", {
      //   method: "POST",
      //   body: JSON.stringify(errorInfo),
      // });
    } catch (e) {
      // Don't let monitoring errors crash the DO
      console.error("Failed to report to monitoring:", e);
    }
  }
}
```

### Critical Error Alerts

```typescript
export class ProductionDO extends DurableObject {
  async processPayment(amount: number): Promise<void> {
    try {
      await this.chargeCustomer(amount);
    } catch (error) {
      // Critical error - alert immediately
      console.error(JSON.stringify({
        event: "CRITICAL_ERROR",
        severity: "high",
        service: "payment",
        error: error.message,
        amount,
        do_id: this.ctx.id.toString(),
        timestamp: Date.now(),
      }));

      // Trigger alert via webhook
      this.ctx.waitUntil(
        fetch("https://alerts.example.com/critical", {
          method: "POST",
          body: JSON.stringify({
            title: "Payment Processing Failed",
            message: error.message,
            severity: "critical",
          }),
        })
      );

      throw error;
    }
  }
}
```

---

## Production Debugging Checklist

### Before Deployment

- [ ] Add structured logging to all methods
- [ ] Include correlation IDs for request tracing
- [ ] Add performance logging for slow operations
- [ ] Implement error categorization
- [ ] Set up monitoring dashboards
- [ ] Configure alerting for critical errors
- [ ] Test alarm execution and retries
- [ ] Verify WebSocket connection tracking

### During Issues

- [ ] Use `npx wrangler tail` for real-time logs
- [ ] Filter logs by DO ID or correlation ID
- [ ] Check constructor timing
- [ ] Inspect state with `debugState()` methods
- [ ] Monitor storage size and growth
- [ ] Check alarm scheduling and execution
- [ ] Verify WebSocket connection states
- [ ] Review error rates and types

### Post-Incident

- [ ] Analyze logs for root cause
- [ ] Measure performance degradation
- [ ] Review state corruption or inconsistency
- [ ] Document lessons learned
- [ ] Update monitoring and alerts
- [ ] Add preventive checks

---

## Sources

- [Debugging Workers](https://developers.cloudflare.com/workers/observability/debugging/)
- [Logpush](https://developers.cloudflare.com/logs/about/)
- [Workers Metrics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)
- [Tail Workers](https://developers.cloudflare.com/workers/observability/tail-workers/)

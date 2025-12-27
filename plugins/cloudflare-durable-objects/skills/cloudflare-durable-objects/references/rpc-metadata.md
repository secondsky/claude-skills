# RpcTarget Class for Durable Objects Metadata

**Status**: Production Ready ✅
**Last Verified**: 2025-12-27
**Official Docs**: [Use RpcTarget class to handle Durable Object metadata](https://developers.cloudflare.com/durable-objects/examples/reference-do-name-using-init/)

## Overview

**Problem**: When you create a Durable Object ID using `idFromName("some-name")`, you cannot directly access that name inside the DO via `this.ctx.id.name` (it returns `undefined` for names created via `idFromName()`).

**Solution**: Use the RpcTarget pattern to pass metadata (like DO names) through method calls, enabling you to reference the identifier inside your Durable Object.

**RpcTarget**: A Cloudflare Workers class that creates a communication layer to pass metadata alongside method invocations.

---

## Core Concepts

### Why RpcTarget?

1. **Metadata Access**: Access the DO name/identifier used during creation
2. **Clean Separation**: Keep metadata passing logic separate from business logic
3. **Type Safety**: Maintain TypeScript types across RPC boundaries
4. **Flexibility**: Choose between memory-based (temporary) or storage-based (persistent) metadata

### When to Use

- ✅ When you need to reference the DO name inside the DO class
- ✅ When passing configuration/metadata during DO creation
- ✅ When implementing control plane / data plane patterns
- ✅ When you need initialization metadata that isn't in storage

### When NOT to Use

- ❌ If you're using `newUniqueId()` and don't need the name
- ❌ If metadata is simple enough to store in first method call
- ❌ If every method needs different metadata (defeats the purpose)

---

## Basic Implementation Pattern

### 1. Create RpcTarget Wrapper Class

```typescript
import { RpcTarget, DurableObject } from 'cloudflare:workers';

// RpcTarget wrapper that carries metadata
export class RpcDO extends RpcTarget {
  constructor(
    private mainDo: MyDurableObject,
    private doIdentifier: string
  ) {
    super();
  }

  // Wrap DO methods, passing metadata as parameter
  async computeMessage(userName: string): Promise<string> {
    return this.mainDo.computeMessage(userName, this.doIdentifier);
  }

  async getData(): Promise<any> {
    return this.mainDo.getData(this.doIdentifier);
  }
}
```

### 2. Main Durable Object Class

```typescript
export class MyDurableObject extends DurableObject {
  // Method signatures include metadata parameter
  async computeMessage(userName: string, doIdentifier: string): Promise<string> {
    // Now you can use the DO identifier
    return `Hello ${userName}, you're in DO: ${doIdentifier}`;
  }

  async getData(doIdentifier: string): Promise<any> {
    // Use identifier for logging, metrics, etc.
    console.log(`Fetching data for DO: ${doIdentifier}`);
    return await this.ctx.storage.sql
      .exec("SELECT * FROM data WHERE do_name = ?", doIdentifier)
      .toArray();
  }

  // Create RpcTarget instance with metadata
  setMetaData(doIdentifier: string): RpcDO {
    return new RpcDO(this, doIdentifier);
  }
}

export default MyDurableObject;
```

### 3. Worker Usage

```typescript
interface Env {
  MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Create DO with name
    const id = env.MY_DURABLE_OBJECT.idFromName(pathname);
    const stub = env.MY_DURABLE_OBJECT.get(id);

    // Create RpcTarget with metadata
    const rpcTarget = stub.setMetaData(id.name ?? pathname);

    // Call methods through RpcTarget
    const message = await rpcTarget.computeMessage("Alice");

    // Clean up (optional with using keyword)
    rpcTarget[Symbol.dispose]?.();

    return new Response(message);
  }
};
```

---

## Storage Strategies

### Option 1: Memory-Based (Temporary Metadata)

**Pros**:
- No storage overhead
- Simpler implementation
- No persistence needed

**Cons**:
- Metadata must be passed with every call
- Lost if DO is evicted and recreated
- More parameters in method signatures

**Implementation**:

```typescript
export class RpcDO extends RpcTarget {
  constructor(
    private mainDo: MyDurableObject,
    private metadata: {
      doName: string;
      region?: string;
      tenantId?: string;
    }
  ) {
    super();
  }

  async processRequest(data: any): Promise<any> {
    // Pass metadata every time
    return this.mainDo.processRequest(data, this.metadata);
  }
}

// Durable Object
export class MyDurableObject extends DurableObject {
  async processRequest(data: any, metadata: any): Promise<any> {
    console.log(`Processing in DO: ${metadata.doName}`);
    console.log(`Tenant: ${metadata.tenantId}`);
    // Use metadata for this request only
    return { status: "processed", do: metadata.doName };
  }
}
```

### Option 2: Storage-Based (Persistent Metadata)

**Pros**:
- Metadata persists across evictions
- Cleaner method signatures
- One-time initialization

**Cons**:
- Storage overhead
- Initialization complexity
- Must handle missing metadata

**Implementation**:

```typescript
export class MyDurableObject extends DurableObject {
  private metadata?: {
    doName: string;
    tenantId: string;
  };

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Load metadata from storage on construction
    ctx.blockConcurrencyWhile(async () => {
      this.metadata = await ctx.storage.get("metadata");
    });
  }

  // Initialize metadata (called once)
  async init(doName: string, tenantId: string): Promise<void> {
    const metadata = { doName, tenantId };
    await this.ctx.storage.put("metadata", metadata);
    this.metadata = metadata;
  }

  // Methods can access metadata directly
  async processRequest(data: any): Promise<any> {
    if (!this.metadata) {
      throw new Error("DO not initialized");
    }

    console.log(`Processing in DO: ${this.metadata.doName}`);
    console.log(`Tenant: ${this.metadata.tenantId}`);

    return { status: "processed", do: this.metadata.doName };
  }

  setMetaData(doName: string): RpcDO {
    return new RpcDO(this, doName);
  }
}

// RpcTarget for initialization
export class RpcDO extends RpcTarget {
  constructor(
    private mainDo: MyDurableObject,
    private doName: string
  ) {
    super();
  }

  async init(tenantId: string): Promise<void> {
    return this.mainDo.init(this.doName, tenantId);
  }

  async processRequest(data: any): Promise<any> {
    return this.mainDo.processRequest(data);
  }
}
```

**Worker Usage**:

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const doName = url.searchParams.get("room") ?? "default";

    const id = env.MY_DURABLE_OBJECT.idFromName(doName);
    const stub = env.MY_DURABLE_OBJECT.get(id);
    const rpcTarget = stub.setMetaData(doName);

    // Initialize on first request
    if (request.headers.get("X-First-Request") === "true") {
      await rpcTarget.init("tenant-123");
    }

    // Subsequent requests don't need metadata
    const result = await rpcTarget.processRequest({ action: "test" });

    return Response.json(result);
  }
};
```

---

## Advanced Patterns

### Control Plane / Data Plane Pattern

Use RpcTarget to implement initialization logic:

```typescript
// Control plane: initialization and configuration
export class ControlPlaneRpc extends RpcTarget {
  constructor(
    private dataPlaneDO: DataPlane,
    private doName: string
  ) {
    super();
  }

  async initialize(config: any): Promise<void> {
    return this.dataPlaneDO.initialize(this.doName, config);
  }

  async configure(settings: any): Promise<void> {
    return this.dataPlaneDO.configure(this.doName, settings);
  }
}

// Data plane: request processing
export class DataPlaneRpc extends RpcTarget {
  constructor(
    private dataPlaneDO: DataPlane,
    private doName: string
  ) {
    super();
  }

  async handleRequest(data: any): Promise<any> {
    return this.dataPlaneDO.handleRequest(data);
  }
}

// Main DO with both control and data plane
export class DataPlane extends DurableObject {
  private config?: any;

  async initialize(doName: string, config: any): Promise<void> {
    console.log(`Initializing ${doName} with config`);
    this.config = config;
    await this.ctx.storage.put("config", config);
    await this.ctx.storage.put("doName", doName);
  }

  async configure(doName: string, settings: any): Promise<void> {
    console.log(`Configuring ${doName}`);
    await this.ctx.storage.put("settings", settings);
  }

  async handleRequest(data: any): Promise<any> {
    const doName = await this.ctx.storage.get("doName");
    return {
      status: "processed",
      do: doName,
      data: data,
      config: this.config,
    };
  }

  getControlPlane(doName: string): ControlPlaneRpc {
    return new ControlPlaneRpc(this, doName);
  }

  getDataPlane(doName: string): DataPlaneRpc {
    return new DataPlaneRpc(this, doName);
  }
}
```

**Usage**:

```typescript
// Initialize (control plane)
const id = env.DATA_PLANE.idFromName("user-123");
const stub = env.DATA_PLANE.get(id);
const controlPlane = stub.getControlPlane(id.name!);

await controlPlane.initialize({ region: "us-east", tier: "premium" });
await controlPlane.configure({ maxConnections: 100 });

// Process requests (data plane)
const dataPlane = stub.getDataPlane(id.name!);
const result = await dataPlane.handleRequest({ action: "query" });
```

### Multiple Metadata Parameters

```typescript
export class RpcDO extends RpcTarget {
  constructor(
    private mainDo: MyDurableObject,
    private metadata: {
      doName: string;
      userId: string;
      sessionId: string;
      region: string;
    }
  ) {
    super();
  }

  async trackEvent(eventType: string, data: any): Promise<void> {
    return this.mainDo.trackEvent(
      eventType,
      data,
      this.metadata.doName,
      this.metadata.userId,
      this.metadata.sessionId,
      this.metadata.region
    );
  }
}

// Durable Object
export class MyDurableObject extends DurableObject {
  async trackEvent(
    eventType: string,
    data: any,
    doName: string,
    userId: string,
    sessionId: string,
    region: string
  ): Promise<void> {
    await this.ctx.storage.sql.exec(
      "INSERT INTO events (type, data, do_name, user_id, session_id, region, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      eventType,
      JSON.stringify(data),
      doName,
      userId,
      sessionId,
      region,
      Date.now()
    );
  }

  setMetaData(
    doName: string,
    userId: string,
    sessionId: string,
    region: string
  ): RpcDO {
    return new RpcDO(this, { doName, userId, sessionId, region });
  }
}
```

---

## Type Generation for RPC

Generate TypeScript types for RpcTarget methods:

```typescript
// Define interfaces for type safety
interface EventData {
  action: string;
  payload: any;
}

interface EventResult {
  success: boolean;
  eventId: string;
}

// RpcTarget with typed methods
export class RpcDO extends RpcTarget {
  constructor(
    private mainDo: MyDurableObject,
    private doName: string
  ) {
    super();
  }

  async trackEvent(data: EventData): Promise<EventResult> {
    return this.mainDo.trackEvent(data, this.doName);
  }
}

// DO with typed methods
export class MyDurableObject extends DurableObject {
  async trackEvent(data: EventData, doName: string): Promise<EventResult> {
    const eventId = crypto.randomUUID();
    await this.ctx.storage.sql.exec(
      "INSERT INTO events (id, action, payload, do_name) VALUES (?, ?, ?, ?)",
      eventId,
      data.action,
      JSON.stringify(data.payload),
      doName
    );
    return { success: true, eventId };
  }

  setMetaData(doName: string): RpcDO {
    return new RpcDO(this, doName);
  }
}
```

---

## Best Practices

### 1. Selective Method Wrapping

Not every DO method needs to be in RpcTarget—only those requiring metadata:

```typescript
export class RpcDO extends RpcTarget {
  constructor(
    private mainDo: MyDurableObject,
    private doName: string
  ) {
    super();
  }

  // ✅ Wrap methods that need metadata
  async processWithMetadata(data: any): Promise<any> {
    return this.mainDo.processWithMetadata(data, this.doName);
  }

  // ❌ Don't wrap methods that don't need metadata
  // This method calls the DO directly (not through RpcTarget)
  // async simpleMethod(): Promise<any> {
  //   return this.mainDo.simpleMethod();
  // }
}

// DO can have both wrapped and unwrapped methods
export class MyDurableObject extends DurableObject {
  // Needs metadata - wrapped by RpcTarget
  async processWithMetadata(data: any, doName: string): Promise<any> {
    console.log(`Processing in ${doName}`);
    return { result: data, do: doName };
  }

  // Doesn't need metadata - called directly
  async simpleMethod(): Promise<any> {
    return { result: "simple" };
  }

  setMetaData(doName: string): RpcDO {
    return new RpcDO(this, doName);
  }
}

// Usage
const stub = env.MY_DO.get(id);

// Use RpcTarget for methods needing metadata
const rpcTarget = stub.setMetaData(id.name!);
await rpcTarget.processWithMetadata({ action: "test" });

// Call directly for methods not needing metadata
await stub.simpleMethod();
```

### 2. Resource Cleanup

Always dispose of RpcTarget resources:

```typescript
// Option 1: Manual disposal
const rpcTarget = stub.setMetaData(id.name!);
try {
  const result = await rpcTarget.processRequest(data);
  return Response.json(result);
} finally {
  rpcTarget[Symbol.dispose]?.();
}

// Option 2: Using statement (when available)
{
  using rpcTarget = stub.setMetaData(id.name!);
  const result = await rpcTarget.processRequest(data);
  return Response.json(result);
} // Automatically disposed
```

### 3. Choose Storage Strategy Based on Use Case

| Use Case | Strategy | Reason |
|----------|----------|--------|
| One-time configuration | Persistent | Save on repeated initialization |
| Per-request context | Temporary | No need to persist |
| User session data | Persistent | Survives DO evictions |
| Request tracing | Temporary | Different per request |
| Multi-tenant isolation | Persistent | Critical for security |

### 4. Keep Method Signatures Clean

Hide metadata complexity inside RpcTarget:

```typescript
// ✅ GOOD: Clean public API
export class RpcDO extends RpcTarget {
  constructor(private mainDo: MyDO, private metadata: Metadata) {
    super();
  }

  async doSomething(input: string): Promise<string> {
    // Metadata passed internally
    return this.mainDo.doSomething(input, this.metadata);
  }
}

// ❌ BAD: Exposing metadata in public API
export class RpcDO extends RpcTarget {
  async doSomething(input: string, metadata: Metadata): Promise<string> {
    // Defeats the purpose of RpcTarget!
    return this.mainDo.doSomething(input, metadata);
  }
}
```

---

## Common Patterns

### Pattern 1: Logging and Metrics

```typescript
export class MetricsRpc extends RpcTarget {
  constructor(
    private mainDo: MetricsDO,
    private doName: string,
    private tenantId: string
  ) {
    super();
  }

  async recordMetric(metric: string, value: number): Promise<void> {
    return this.mainDo.recordMetric(metric, value, this.doName, this.tenantId);
  }
}

export class MetricsDO extends DurableObject {
  async recordMetric(
    metric: string,
    value: number,
    doName: string,
    tenantId: string
  ): Promise<void> {
    await this.ctx.storage.sql.exec(
      "INSERT INTO metrics (metric, value, do_name, tenant_id, timestamp) VALUES (?, ?, ?, ?, ?)",
      metric,
      value,
      doName,
      tenantId,
      Date.now()
    );

    console.log(`[${tenantId}/${doName}] ${metric}: ${value}`);
  }

  createRpcTarget(doName: string, tenantId: string): MetricsRpc {
    return new MetricsRpc(this, doName, tenantId);
  }
}
```

### Pattern 2: Geographic Routing

```typescript
export class GeoRpc extends RpcTarget {
  constructor(
    private mainDo: GeoDO,
    private doName: string,
    private region: string
  ) {
    super();
  }

  async processRequest(data: any): Promise<any> {
    return this.mainDo.processRequest(data, this.doName, this.region);
  }
}

export class GeoDO extends DurableObject {
  async processRequest(data: any, doName: string, region: string): Promise<any> {
    console.log(`Processing request in ${region} for DO ${doName}`);

    // Use region for compliance, latency optimization, etc.
    await this.ctx.storage.sql.exec(
      "INSERT INTO requests (do_name, region, data) VALUES (?, ?, ?)",
      doName,
      region,
      JSON.stringify(data)
    );

    return { processed: true, region, do: doName };
  }

  createRpcTarget(doName: string, region: string): GeoRpc {
    return new GeoRpc(this, doName, region);
  }
}
```

---

## Sources

- [Use RpcTarget class to handle Durable Object metadata](https://developers.cloudflare.com/durable-objects/examples/reference-do-name-using-init/)
- [Invoke methods](https://developers.cloudflare.com/durable-objects/best-practices/create-durable-object-stubs-and-send-requests/)
- [Control and data plane architectural pattern](https://developers.cloudflare.com/reference-architecture/diagrams/storage/durable-object-control-data-plane-pattern/)

# Memory Optimization for Cloudflare Workers

Techniques for efficient memory usage within Worker limits.

## Memory Limits

| Plan | Memory Limit |
|------|--------------|
| Free | 128 MB |
| Paid | 128 MB |

The 128 MB limit is per-isolate, shared across all requests in that isolate.

## Memory Profiling

### Estimate Object Size

```typescript
function estimateSize(obj: unknown, seen = new WeakSet()): number {
  if (obj === null || obj === undefined) return 0;

  const type = typeof obj;

  if (type === 'boolean') return 4;
  if (type === 'number') return 8;
  if (type === 'string') return (obj as string).length * 2;

  if (type !== 'object') return 0;

  // Avoid circular references
  if (seen.has(obj as object)) return 0;
  seen.add(obj as object);

  if (obj instanceof ArrayBuffer) {
    return obj.byteLength;
  }

  if (ArrayBuffer.isView(obj)) {
    return obj.byteLength;
  }

  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + estimateSize(item, seen), 0);
  }

  // Regular object
  return Object.entries(obj).reduce(
    (sum, [key, value]) => sum + key.length * 2 + estimateSize(value, seen),
    0
  );
}

// Usage
const data = await response.json();
const sizeKB = estimateSize(data) / 1024;
console.log(`Response size: ${sizeKB.toFixed(2)} KB`);

if (sizeKB > 1000) {
  console.warn('Large response detected, consider streaming');
}
```

### Track Memory Usage

```typescript
interface MemoryTracker {
  allocations: Map<string, number>;
  track(label: string, size: number): void;
  release(label: string): void;
  getSummary(): { total: number; breakdown: Record<string, number> };
}

function createMemoryTracker(): MemoryTracker {
  const allocations = new Map<string, number>();

  return {
    allocations,

    track(label: string, size: number): void {
      const current = allocations.get(label) || 0;
      allocations.set(label, current + size);
    },

    release(label: string): void {
      allocations.delete(label);
    },

    getSummary(): { total: number; breakdown: Record<string, number> } {
      const breakdown: Record<string, number> = {};
      let total = 0;

      for (const [label, size] of allocations) {
        breakdown[label] = size;
        total += size;
      }

      return { total, breakdown };
    },
  };
}
```

## Streaming Large Data

### Stream Response Bodies

```typescript
// ❌ Bad: Buffer entire response
async function transformResponse(response: Response): Promise<Response> {
  const text = await response.text(); // Buffers all data
  const transformed = transform(text);
  return new Response(transformed);
}

// ✅ Good: Stream transformation
function streamTransform(response: Response): Response {
  const reader = response.body?.getReader();
  if (!reader) return response;

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      // Transform chunk
      const transformed = processChunk(value);
      controller.enqueue(transformed);
    },

    cancel() {
      reader.cancel();
    },
  });

  return new Response(stream, {
    headers: response.headers,
  });
}
```

### Stream JSON Processing

```typescript
// For large JSON arrays, process items one at a time
async function* streamJSONArray<T>(
  response: Response
): AsyncGenerator<T, void, unknown> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let inArray = false;
  let depth = 0;
  let itemStart = -1;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    for (let i = 0; i < buffer.length; i++) {
      const char = buffer[i];

      if (char === '[' && !inArray) {
        inArray = true;
        itemStart = i + 1;
      } else if (char === '{') {
        if (depth === 0) itemStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && inArray) {
          const item = buffer.slice(itemStart, i + 1);
          yield JSON.parse(item) as T;
          itemStart = i + 2; // Skip comma
        }
      }
    }

    // Keep only unprocessed data
    if (itemStart > 0) {
      buffer = buffer.slice(itemStart);
      itemStart = 0;
    }
  }
}

// Usage
for await (const item of streamJSONArray<User>(response)) {
  await processUser(item);
  // Each item is processed and can be GC'd
}
```

## Avoiding Memory Leaks

### Clean Up Event Listeners

```typescript
// ❌ Bad: Listeners accumulate
class DataProcessor {
  private emitter = new EventTarget();

  process(data: unknown): void {
    this.emitter.addEventListener('complete', () => {
      // This listener stays forever
      console.log('Complete');
    });
  }
}

// ✅ Good: Use AbortController for cleanup
class DataProcessor {
  process(data: unknown, signal?: AbortSignal): void {
    const controller = new AbortController();

    this.emitter.addEventListener(
      'complete',
      () => console.log('Complete'),
      { signal: controller.signal }
    );

    // Auto-cleanup when done
    signal?.addEventListener('abort', () => controller.abort());
  }
}
```

### Clear Caches

```typescript
// Request-scoped cache with size limit
class BoundedCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### Avoid Closures Capturing Large Data

```typescript
// ❌ Bad: Closure captures largeData
function createHandler(largeData: unknown[]) {
  return async (request: Request) => {
    // largeData stays in memory
    return Response.json(largeData);
  };
}

// ✅ Good: Access data through reference
const dataStore = new Map<string, unknown[]>();

function createHandler(dataKey: string) {
  return async (request: Request) => {
    const data = dataStore.get(dataKey);
    return Response.json(data);
  };
}
```

## Efficient Data Structures

### Use TypedArrays for Binary Data

```typescript
// ❌ Bad: Regular array for bytes
const bytes: number[] = [];
for (let i = 0; i < 10000; i++) {
  bytes.push(i % 256);
}

// ✅ Good: Uint8Array
const bytes = new Uint8Array(10000);
for (let i = 0; i < 10000; i++) {
  bytes[i] = i % 256;
}
```

### Use Map/Set Over Objects for Dynamic Keys

```typescript
// For frequent additions/deletions
// ❌ Less efficient with many keys
const cache: Record<string, unknown> = {};
cache[key] = value;
delete cache[key];

// ✅ More efficient for dynamic keys
const cache = new Map<string, unknown>();
cache.set(key, value);
cache.delete(key);
```

### Reuse Buffers

```typescript
// ❌ Bad: Create new buffer each time
function processChunks(chunks: Uint8Array[]): Uint8Array {
  const results: Uint8Array[] = [];

  for (const chunk of chunks) {
    const result = new Uint8Array(chunk.length);
    // Process...
    results.push(result);
  }

  return concatenate(results);
}

// ✅ Good: Reuse single buffer
function processChunks(chunks: Uint8Array[], bufferSize = 65536): Uint8Array {
  const buffer = new Uint8Array(bufferSize);
  const results: Uint8Array[] = [];
  let offset = 0;

  for (const chunk of chunks) {
    // Write to buffer
    buffer.set(chunk, offset);
    offset += chunk.length;

    // Flush when full
    if (offset >= bufferSize - 1024) {
      results.push(buffer.slice(0, offset));
      offset = 0;
    }
  }

  if (offset > 0) {
    results.push(buffer.slice(0, offset));
  }

  return concatenate(results);
}
```

## Garbage Collection Hints

### Null Out References

```typescript
async function processLargeData(data: LargeObject): Promise<Result> {
  const intermediate = transform(data);

  // Release original data for GC
  data = null as unknown as LargeObject;

  const result = finalize(intermediate);

  // Release intermediate
  intermediate = null as unknown as typeof intermediate;

  return result;
}
```

### Process in Chunks with GC Opportunities

```typescript
async function processInChunks<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  chunkSize = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);

    // Yield to event loop, allowing GC
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
```

## Memory-Efficient Patterns

### Pagination for Large Results

```typescript
interface PaginatedQuery {
  getData(offset: number, limit: number): Promise<unknown[]>;
}

async function* paginate<T>(
  query: PaginatedQuery,
  pageSize = 100
): AsyncGenerator<T[], void, unknown> {
  let offset = 0;

  while (true) {
    const page = await query.getData(offset, pageSize) as T[];

    if (page.length === 0) break;

    yield page;

    if (page.length < pageSize) break;

    offset += pageSize;
  }
}

// Usage
for await (const page of paginate<User>(userQuery)) {
  await processUsers(page);
  // Previous page can be GC'd
}
```

### Flyweight Pattern for Repeated Objects

```typescript
// Share common data between many objects
class UserFactory {
  private roleCache = new Map<string, Role>();

  createUser(data: UserData): User {
    // Reuse role object instead of creating new one
    let role = this.roleCache.get(data.roleId);
    if (!role) {
      role = new Role(data.roleId);
      this.roleCache.set(data.roleId, role);
    }

    return new User(data.id, data.name, role);
  }
}
```

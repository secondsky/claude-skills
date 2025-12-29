# Streams API in Cloudflare Workers

Process data efficiently with Web Streams API.

## Stream Types

| Type | Purpose | Example |
|------|---------|---------|
| `ReadableStream` | Read data | Response body, file upload |
| `WritableStream` | Write data | Response construction |
| `TransformStream` | Transform data | Compression, encryption |

## ReadableStream

### Creating a ReadableStream

```typescript
// From string
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode('Hello, '));
    controller.enqueue(new TextEncoder().encode('World!'));
    controller.close();
  },
});

// From array
function arrayToStream(items: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < items.length) {
        controller.enqueue(encoder.encode(items[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}
```

### Reading a Stream

```typescript
// Read all at once (buffering)
async function readStreamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

// Read chunk by chunk
async function processStreamChunks(stream: ReadableStream<Uint8Array>): Promise<void> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Process chunk
      console.log('Received chunk:', value.length, 'bytes');
    }
  } finally {
    reader.releaseLock();
  }
}
```

## TransformStream

### Basic Transform

```typescript
// Uppercase transform
function createUppercaseTransform(): TransformStream<string, string> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk.toUpperCase());
    },
  });
}

// Line counter transform
function createLineCounter(): TransformStream<string, string> {
  let lineNumber = 0;

  return new TransformStream({
    transform(chunk, controller) {
      const lines = chunk.split('\n');
      const numbered = lines
        .map((line) => {
          lineNumber++;
          return `${lineNumber}: ${line}`;
        })
        .join('\n');
      controller.enqueue(numbered);
    },
  });
}
```

### JSON Line Transform

```typescript
// Transform stream of JSON lines
function createJsonLineTransform<T>(): TransformStream<string, T> {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            controller.enqueue(JSON.parse(line));
          } catch {
            // Skip invalid JSON
          }
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        try {
          controller.enqueue(JSON.parse(buffer));
        } catch {
          // Ignore
        }
      }
    },
  });
}
```

### Compression Transform

```typescript
// Gzip compression
function compressStream(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  return stream.pipeThrough(new CompressionStream('gzip'));
}

// Gzip decompression
function decompressStream(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  return stream.pipeThrough(new DecompressionStream('gzip'));
}
```

## Piping Streams

```typescript
// Chain transformations
const response = await fetch('https://example.com/large-file.txt');

const processedStream = response.body!
  .pipeThrough(new DecompressionStream('gzip'))
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(createUppercaseTransform())
  .pipeThrough(new TextEncoderStream())
  .pipeThrough(new CompressionStream('gzip'));

return new Response(processedStream, {
  headers: {
    'Content-Encoding': 'gzip',
    'Content-Type': 'text/plain',
  },
});
```

## Stream Utilities

### Tee (Split) a Stream

```typescript
// Split stream for multiple consumers
const response = await fetch(url);
const [stream1, stream2] = response.body!.tee();

// Use stream1 for one purpose
const hash = await hashStream(stream1);

// Use stream2 for another
return new Response(stream2);
```

### Merge Streams

```typescript
function mergeStreams(
  streams: ReadableStream<Uint8Array>[]
): ReadableStream<Uint8Array> {
  const readers = streams.map((s) => s.getReader());
  let currentIndex = 0;

  return new ReadableStream({
    async pull(controller) {
      while (currentIndex < readers.length) {
        const { done, value } = await readers[currentIndex].read();

        if (done) {
          currentIndex++;
          continue;
        }

        controller.enqueue(value);
        return;
      }

      controller.close();
    },
  });
}
```

### Stream to Response

```typescript
// Stream response directly (no buffering)
export default {
  async fetch(request: Request): Promise<Response> {
    const backendResponse = await fetch('https://api.example.com/large-data');

    // Pass through stream without buffering
    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: backendResponse.headers,
    });
  },
};
```

## Streaming Patterns

### Server-Sent Events (SSE)

```typescript
function createSSEStream(
  generator: AsyncGenerator<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await generator.next();

      if (done) {
        controller.close();
        return;
      }

      // SSE format: data: <message>\n\n
      const message = `data: ${value}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
  });
}

// Usage
export default {
  async fetch(request: Request): Promise<Response> {
    async function* eventGenerator() {
      for (let i = 0; i < 10; i++) {
        yield JSON.stringify({ count: i, time: Date.now() });
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return new Response(createSSEStream(eventGenerator()), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  },
};
```

### Chunked Processing

```typescript
async function processInChunks<T>(
  stream: ReadableStream<Uint8Array>,
  chunkSize: number,
  processor: (chunk: Uint8Array) => Promise<T>
): Promise<T[]> {
  const reader = stream.getReader();
  const results: T[] = [];
  let buffer = new Uint8Array(0);

  while (true) {
    const { done, value } = await reader.read();

    if (value) {
      // Append to buffer
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;
    }

    // Process complete chunks
    while (buffer.length >= chunkSize) {
      const chunk = buffer.slice(0, chunkSize);
      buffer = buffer.slice(chunkSize);
      results.push(await processor(chunk));
    }

    if (done) {
      // Process remaining data
      if (buffer.length > 0) {
        results.push(await processor(buffer));
      }
      break;
    }
  }

  return results;
}
```

### Stream with Progress

```typescript
function createProgressStream(
  stream: ReadableStream<Uint8Array>,
  totalSize: number,
  onProgress: (progress: number) => void
): ReadableStream<Uint8Array> {
  let bytesRead = 0;

  return stream.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        bytesRead += chunk.length;
        onProgress(bytesRead / totalSize);
        controller.enqueue(chunk);
      },
    })
  );
}
```

## Error Handling

```typescript
async function safeStreamRead(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Concatenate chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } catch (error) {
    reader.releaseLock();
    throw error;
  }
}
```

## Best Practices

1. **Always release reader locks** - Use finally blocks or proper cleanup
2. **Don't buffer large streams** - Process chunks incrementally
3. **Use tee() for multiple consumers** - Don't read stream twice
4. **Handle backpressure** - TransformStream handles this automatically
5. **Close streams properly** - Call controller.close() when done
6. **Error propagation** - Errors in transforms propagate through pipe chain

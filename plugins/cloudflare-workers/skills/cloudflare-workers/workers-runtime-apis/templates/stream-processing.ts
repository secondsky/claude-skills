/**
 * Stream Processing Utilities for Cloudflare Workers
 *
 * Features:
 * - ReadableStream creation and consumption
 * - TransformStream patterns
 * - Stream utilities (tee, merge, concat)
 * - SSE streaming
 *
 * Usage: Copy needed functions to src/lib/streams.ts
 */

// ============================================
// STREAM CREATION
// ============================================

/**
 * Create a ReadableStream from an array of items
 */
export function arrayToStream<T>(items: T[]): ReadableStream<T> {
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < items.length) {
        controller.enqueue(items[index++]);
      } else {
        controller.close();
      }
    },
  });
}

/**
 * Create a ReadableStream from an async generator
 */
export function generatorToStream<T>(
  generator: AsyncGenerator<T>
): ReadableStream<T> {
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await generator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

/**
 * Create a text stream from a string
 */
export function stringToStream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

// ============================================
// STREAM CONSUMPTION
// ============================================

/**
 * Read entire stream to string
 */
export async function streamToString(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result + decoder.decode();
}

/**
 * Read entire stream to ArrayBuffer
 */
export async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<ArrayBuffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Collect stream to array
 */
export async function streamToArray<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const items: T[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    items.push(value);
  }

  return items;
}

// ============================================
// TRANSFORM STREAMS
// ============================================

/**
 * Create a mapping transform stream
 */
export function mapStream<T, U>(fn: (item: T) => U): TransformStream<T, U> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(fn(chunk));
    },
  });
}

/**
 * Create a filtering transform stream
 */
export function filterStream<T>(
  predicate: (item: T) => boolean
): TransformStream<T, T> {
  return new TransformStream({
    transform(chunk, controller) {
      if (predicate(chunk)) {
        controller.enqueue(chunk);
      }
    },
  });
}

/**
 * JSON Lines parser transform
 */
export function jsonLinesTransform<T>(): TransformStream<string, T> {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

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

/**
 * Chunking transform - split stream into fixed-size chunks
 */
export function chunkTransform(
  chunkSize: number
): TransformStream<Uint8Array, Uint8Array> {
  let buffer = new Uint8Array(0);

  return new TransformStream({
    transform(chunk, controller) {
      // Combine with buffer
      const combined = new Uint8Array(buffer.length + chunk.length);
      combined.set(buffer);
      combined.set(chunk, buffer.length);
      buffer = combined;

      // Emit complete chunks
      while (buffer.length >= chunkSize) {
        controller.enqueue(buffer.slice(0, chunkSize));
        buffer = buffer.slice(chunkSize);
      }
    },
    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue(buffer);
      }
    },
  });
}

/**
 * Rate limiting transform
 */
export function rateLimitTransform<T>(
  itemsPerSecond: number
): TransformStream<T, T> {
  const delayMs = 1000 / itemsPerSecond;

  return new TransformStream({
    async transform(chunk, controller) {
      controller.enqueue(chunk);
      await new Promise((r) => setTimeout(r, delayMs));
    },
  });
}

// ============================================
// STREAM UTILITIES
// ============================================

/**
 * Merge multiple streams into one
 */
export function mergeStreams<T>(
  streams: ReadableStream<T>[]
): ReadableStream<T> {
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

/**
 * Interleave multiple streams (round-robin)
 */
export function interleaveStreams<T>(
  streams: ReadableStream<T>[]
): ReadableStream<T> {
  const readers = streams.map((s) => s.getReader());
  const done = new Set<number>();
  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      while (done.size < readers.length) {
        if (!done.has(index)) {
          const { done: isDone, value } = await readers[index].read();

          if (isDone) {
            done.add(index);
          } else {
            controller.enqueue(value);
            index = (index + 1) % readers.length;
            return;
          }
        }

        index = (index + 1) % readers.length;
      }

      controller.close();
    },
  });
}

// ============================================
// SSE (SERVER-SENT EVENTS)
// ============================================

export interface SSEEvent {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * Format SSE event
 */
export function formatSSE(event: SSEEvent): string {
  let result = '';
  if (event.event) result += `event: ${event.event}\n`;
  if (event.id) result += `id: ${event.id}\n`;
  if (event.retry) result += `retry: ${event.retry}\n`;
  result += `data: ${event.data}\n\n`;
  return result;
}

/**
 * Create SSE stream from async generator
 */
export function createSSEStream(
  generator: AsyncGenerator<SSEEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await generator.next();

      if (done) {
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode(formatSSE(value)));
    },
  });
}

/**
 * Create SSE Response
 */
export function createSSEResponse(
  stream: ReadableStream<Uint8Array>
): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import {
  streamToString,
  jsonLinesTransform,
  createSSEStream,
  createSSEResponse,
} from './lib/streams';

// Process JSON lines stream
const response = await fetch('https://api.example.com/stream');
const jsonStream = response.body!
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(jsonLinesTransform<MyType>());

const items = await streamToArray(jsonStream);

// SSE streaming
export default {
  async fetch(request: Request): Promise<Response> {
    async function* generateEvents(): AsyncGenerator<SSEEvent> {
      for (let i = 0; i < 10; i++) {
        yield {
          event: 'message',
          data: JSON.stringify({ count: i, time: Date.now() }),
          id: String(i),
        };
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return createSSEResponse(createSSEStream(generateEvents()));
  },
};
*/

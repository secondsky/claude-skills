/**
 * Streaming Utilities for TheSys C1
 *
 * Helper functions for handling streaming responses from
 * OpenAI SDK, TheSys API, and transforming streams for C1.
 *
 * Works with any framework (Vite, Next.js, Cloudflare Workers).
 */

/**
 * Convert a ReadableStream to a string
 */
export async function streamToString(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // value might be string or Uint8Array
      if (typeof value === "string") {
        result += value;
      } else {
        result += decoder.decode(value, { stream: true });
      }
    }

    // Final decode with stream: false
    result += decoder.decode();

    return result;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Convert a ReadableStream to an array of chunks
 */
export async function streamToArray<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const chunks: T[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return chunks;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Create a pass-through stream that allows reading while data flows
 */
export function createPassThroughStream<T>(): {
  readable: ReadableStream<T>;
  writable: WritableStream<T>;
} {
  const { readable, writable } = new TransformStream<T, T>();
  return { readable, writable };
}

/**
 * Transform a stream with a callback function
 * Similar to @crayonai/stream's transformStream
 */
export function transformStream<TInput, TOutput>(
  source: ReadableStream<TInput>,
  transformer: (chunk: TInput) => TOutput | null,
  options?: {
    onStart?: () => void;
    onEnd?: (data: { accumulated: TOutput[] }) => void;
    onError?: (error: Error) => void;
  }
): ReadableStream<TOutput> {
  const accumulated: TOutput[] = [];

  return new ReadableStream<TOutput>({
    async start(controller) {
      options?.onStart?.();

      const reader = source.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            options?.onEnd?.({ accumulated });
            controller.close();
            break;
          }

          const transformed = transformer(value);

          if (transformed !== null) {
            accumulated.push(transformed);
            controller.enqueue(transformed);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options?.onError?.(err);
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

/**
 * Merge multiple streams into one
 */
export function mergeStreams<T>(...streams: ReadableStream<T>[]): ReadableStream<T> {
  return new ReadableStream<T>({
    async start(controller) {
      try {
        await Promise.all(
          streams.map(async (stream) => {
            const reader = stream.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
            } finally {
              reader.releaseLock();
            }
          })
        );
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Split a stream into multiple streams
 */
export function splitStream<T>(
  source: ReadableStream<T>,
  count: number
): ReadableStream<T>[] {
  if (count < 2) throw new Error("Count must be at least 2");

  const readers: ReadableStreamDefaultController<T>[] = [];
  const streams = Array.from({ length: count }, () => {
    return new ReadableStream<T>({
      start(controller) {
        readers.push(controller);
      },
    });
  });

  (async () => {
    const reader = source.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          readers.forEach((r) => r.close());
          break;
        }

        readers.forEach((r) => r.enqueue(value));
      }
    } catch (error) {
      readers.forEach((r) => r.error(error));
    } finally {
      reader.releaseLock();
    }
  })();

  return streams;
}

/**
 * Buffer chunks until a condition is met, then flush
 */
export function bufferStream<T>(
  source: ReadableStream<T>,
  shouldFlush: (buffer: T[]) => boolean
): ReadableStream<T[]> {
  return new ReadableStream<T[]>({
    async start(controller) {
      const reader = source.getReader();
      let buffer: T[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.length > 0) {
              controller.enqueue([...buffer]);
            }
            controller.close();
            break;
          }

          buffer.push(value);

          if (shouldFlush(buffer)) {
            controller.enqueue([...buffer]);
            buffer = [];
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

/**
 * Rate limit a stream (delay between chunks)
 */
export function rateLimit<T>(
  source: ReadableStream<T>,
  delayMs: number
): ReadableStream<T> {
  return new ReadableStream<T>({
    async start(controller) {
      const reader = source.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            break;
          }

          controller.enqueue(value);

          // Wait before next chunk
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

/**
 * Retry a stream creation if it fails
 */
export async function retryStream<T>(
  createStream: () => Promise<ReadableStream<T>>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<ReadableStream<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await createStream();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Stream creation attempt ${attempt + 1} failed:`, lastError);

      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const waitTime = delayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Failed to create stream");
}

/**
 * Parse Server-Sent Events (SSE) stream
 */
export function parseSSE(
  source: ReadableStream<Uint8Array>
): ReadableStream<{ event?: string; data: string }> {
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = source.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let event = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              event = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            } else if (line === "") {
              // Empty line signals end of message
              if (data) {
                controller.enqueue({ event: event || undefined, data });
                event = "";
                data = "";
              }
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

/**
 * Handle backpressure in streams
 */
export function handleBackpressure<T>(
  source: ReadableStream<T>,
  highWaterMark: number = 10
): ReadableStream<T> {
  return new ReadableStream<T>(
    {
      async start(controller) {
        const reader = source.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            controller.enqueue(value);

            // Check if we need to apply backpressure
            if (controller.desiredSize !== null && controller.desiredSize <= 0) {
              // Wait a bit before continuing
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    },
    { highWaterMark }
  );
}

/**
 * Log stream chunks for debugging
 */
export function debugStream<T>(
  source: ReadableStream<T>,
  label: string = "Stream"
): ReadableStream<T> {
  let count = 0;

  return transformStream(
    source,
    (chunk) => {
      console.log(`[${label}] Chunk ${++count}:`, chunk);
      return chunk;
    },
    {
      onStart: () => console.log(`[${label}] Stream started`),
      onEnd: ({ accumulated }) =>
        console.log(`[${label}] Stream ended. Total chunks: ${accumulated.length}`),
      onError: (error) => console.error(`[${label}] Stream error:`, error),
    }
  );
}

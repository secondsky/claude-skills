// Cloudflare Workers with workers-ai-provider
// AI SDK Core - Cloudflare Workers AI integration

import { Hono } from 'hono';
import { generateText, streamText } from 'ai';
import { createWorkersAI } from 'workers-ai-provider';
import { z } from 'zod';

// Environment interface for Workers AI binding
interface Env {
  AI: Ai;
}

// Request validation schemas
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

const ExtractRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

const app = new Hono<{ Bindings: Env }>();

// Example 1: Basic text generation
app.post('/chat', async (c) => {
  try {
    // IMPORTANT: Create provider inside handler to avoid startup overhead
    const workersai = createWorkersAI({ binding: c.env.AI });

    const body = await c.req.json();
    const { message } = ChatRequestSchema.parse(body);

    const result = await generateText({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
    prompt: message,
      maxOutputTokens: 500,
    });

    return c.json({ response: result.text });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request', details: error.errors }, 400);
    }
    throw error;
  }
});

// Example 2: Streaming response
app.post('/chat/stream', async (c) => {
  try {
    const workersai = createWorkersAI({ binding: c.env.AI });

    const body = await c.req.json();
    const { message } = ChatRequestSchema.parse(body);

    const stream = streamText({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
      prompt: message,
    });

    // Return stream to client
    return stream.toDataStreamResponse();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request', details: error.errors }, 400);
    }
    throw error;
  }
});

// Example 3: Structured output
app.post('/extract', async (c) => {
  try {
    const workersai = createWorkersAI({ binding: c.env.AI });

    const { generateObject } = await import('ai');

    const body = await c.req.json();
    const { text } = ExtractRequestSchema.parse(body);

    const result = await generateObject({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
    schema: z.object({
      summary: z.string(),
      keyPoints: z.array(z.string()),
    }),
      prompt: `Extract key information from: ${text}`,
    });

    return c.json(result.object);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid request', details: error.errors }, 400);
    }
    throw error;
  }
});

// Example 4: Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', ai: 'ready' });
});

export default app;

/*
 * wrangler.jsonc configuration:
 *
 * {
 *   "name": "ai-sdk-worker",
 *   "compatibility_date": "2025-10-21",
 *   "main": "src/index.ts",
 *   "ai": {
 *     "binding": "AI"
 *   }
 * }
 */

/*
 * IMPORTANT NOTES:
 *
 * 1. Startup Optimization:
 *    - Move `createWorkersAI` inside handlers (not top-level)
 *    - Avoid importing complex Zod schemas at top level
 *    - Monitor startup time (must be <400ms)
 *
 * 2. Available Models:
 *    - @cf/meta/llama-3.1-8b-instruct (recommended)
 *    - @cf/meta/llama-3.1-70b-instruct
 *    - @cf/mistral/mistral-7b-instruct-v0.1
 *    - See: https://developers.cloudflare.com/workers-ai/models/
 *
 * 3. When to use workers-ai-provider:
 *    - Multi-provider scenarios (OpenAI + Workers AI)
 *    - Using AI SDK UI hooks
 *    - Need consistent API across providers
 *
 * 4. When to use native binding:
 *    - Cloudflare-only deployment
 *    - Maximum performance
 *    - See: cloudflare-workers-ai skill
 *
 * 5. Testing:
 *    # Bun (recommended)
 *    bun wrangler dev
 *
 *    # Or with npx
 *    npx wrangler dev
 *
 *    # Test endpoint
 *    curl -X POST http://localhost:8787/chat \
 *      -H "Content-Type: application/json" \
 *      -d '{"message": "Hello!"}'
 *
 * 6. Deployment:
 *    # Bun (recommended)
 *    bun wrangler deploy
 *
 *    # Or with npx
 *    npx wrangler deploy
 */

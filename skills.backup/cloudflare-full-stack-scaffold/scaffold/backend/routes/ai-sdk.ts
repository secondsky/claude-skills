/**
 * AI SDK Routes
 *
 * AI SDK with multiple provider support.
 * Workers AI is default (free). OpenAI and Anthropic are optional.
 *
 * To enable OpenAI/Anthropic:
 * 1. Uncomment provider imports and creation
 * 2. Add API keys to .dev.vars
 * 3. Change model in routes
 */

import { Hono } from 'hono'
import { streamText, generateText, generateObject, convertToModelMessages, type UIMessage } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { z } from 'zod'

/* OPENAI START
import { openai } from '@ai-sdk/openai'
OPENAI END */

/* ANTHROPIC START
import { anthropic } from '@ai-sdk/anthropic'
ANTHROPIC END */

type Bindings = {
  AI: Ai
  /* OPENAI START
  OPENAI_API_KEY: string
  OPENAI END */
  /* ANTHROPIC START
  ANTHROPIC_API_KEY: string
  ANTHROPIC END */
}

const aiSdk = new Hono<{ Bindings: Bindings }>()

// Chat with streaming (recommended for production)
// Handles AI SDK v5 UIMessage format
aiSdk.post('/chat', async (c) => {
  const { messages } = await c.req.json<{
    messages: UIMessage[]
  }>()

  if (!messages || messages.length === 0) {
    return c.json({ error: 'Messages array is required' }, 400)
  }

  // Convert UIMessages to model-compatible format
  const coreMessages = convertToModelMessages(messages)

  // Default: Workers AI (free, runs on Cloudflare)
  const workersai = createWorkersAI({ binding: c.env.AI })
  const model = workersai('@cf/meta/llama-3.1-8b-instruct')

  /* OPENAI START
  // OpenAI (requires OPENAI_API_KEY in .dev.vars)
  const model = openai('gpt-4o', {
    apiKey: c.env.OPENAI_API_KEY,
  })
  OPENAI END */

  /* ANTHROPIC START
  // Anthropic (requires ANTHROPIC_API_KEY in .dev.vars)
  const model = anthropic('claude-sonnet-4-5', {
    apiKey: c.env.ANTHROPIC_API_KEY,
  })
  ANTHROPIC END */

  const result = streamText({
    model,
    messages: coreMessages,
  })

  return result.toUIMessageStreamResponse()
})

// Simple text generation (non-streaming)
aiSdk.post('/generate', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const workersai = createWorkersAI({ binding: c.env.AI })

  const { text } = await generateText({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
    prompt,
  })

  return c.json({ text })
})

// Structured output (typed objects)
aiSdk.post('/structured', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const workersai = createWorkersAI({ binding: c.env.AI })

  const schema = z.object({
    summary: z.string().describe('Brief summary'),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    topics: z.array(z.string()).describe('Main topics discussed'),
  })

  const { object } = await generateObject({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
    schema,
    prompt: `Analyze this text: ${prompt}`,
  })

  return c.json({ object })
})

export default aiSdk

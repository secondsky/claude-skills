/**
 * Workers AI Routes
 *
 * Direct Workers AI binding examples.
 * Text generation, embeddings, and image generation.
 */

import { Hono } from 'hono'

type Bindings = {
  AI: Ai
}

const ai = new Hono<{ Bindings: Bindings }>()

// Text generation (streaming recommended)
ai.post('/chat', async (c) => {
  const { messages } = await c.req.json<{
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  }>()

  if (!messages || messages.length === 0) {
    return c.json({ error: 'Messages array is required' }, 400)
  }

  const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages,
    stream: true,
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
    },
  })
})

// Simple text generation
ai.post('/generate', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: prompt }],
  })

  return c.json({
    response: response.response,
  })
})

// Generate embeddings
ai.post('/embeddings', async (c) => {
  const { text } = await c.req.json<{ text: string | string[] }>()

  const embeddings = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: Array.isArray(text) ? text : [text],
  })

  return c.json({
    shape: embeddings.shape,
    data: embeddings.data,
  })
})

// Image generation
ai.post('/image', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const response = await c.env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
    prompt,
  })

  return new Response(response, {
    headers: {
      'content-type': 'image/png',
    },
  })
})

export default ai

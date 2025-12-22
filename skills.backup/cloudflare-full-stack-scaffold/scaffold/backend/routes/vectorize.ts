/**
 * Vectorize Routes
 *
 * Vector database for semantic search and RAG.
 * Use with Workers AI embeddings for best results.
 */

import { Hono } from 'hono'

type Bindings = {
  MY_VECTORIZE: VectorizeIndex
  AI: Ai
}

const vectorize = new Hono<{ Bindings: Bindings }>()

// Insert document with embedding
vectorize.post('/documents', async (c) => {
  const { id, content, metadata } = await c.req.json<{
    id: string
    content: string
    metadata?: Record<string, any>
  }>()

  if (!id || !content) {
    return c.json({ error: 'id and content are required' }, 400)
  }

  // Generate embedding using Workers AI
  const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: content,
  })

  // Insert into Vectorize
  await c.env.MY_VECTORIZE.upsert([
    {
      id,
      values: embedding.data[0],
      metadata: {
        ...metadata,
        content,
        indexed_at: Date.now(),
      },
    },
  ])

  return c.json({
    success: true,
    id,
  })
})

// Semantic search
vectorize.post('/search', async (c) => {
  const { query, topK = 5 } = await c.req.json<{
    query: string
    topK?: number
  }>()

  if (!query) {
    return c.json({ error: 'query is required' }, 400)
  }

  // Generate query embedding
  const queryEmbedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: query,
  })

  // Search Vectorize
  const results = await c.env.MY_VECTORIZE.query(queryEmbedding.data[0], {
    topK,
    returnMetadata: 'all',
  })

  return c.json({
    query,
    results: results.matches.map((match) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
    })),
  })
})

// RAG: Search + Generate
vectorize.post('/rag', async (c) => {
  const { question, topK = 3 } = await c.req.json<{
    question: string
    topK?: number
  }>()

  if (!question) {
    return c.json({ error: 'question is required' }, 400)
  }

  // 1. Generate query embedding
  const queryEmbedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: question,
  })

  // 2. Search for relevant documents
  const results = await c.env.MY_VECTORIZE.query(queryEmbedding.data[0], {
    topK,
    returnMetadata: 'all',
  })

  // 3. Build context from results
  const context = results.matches
    .map((match) => match.metadata?.content || '')
    .join('\n\n')

  // 4. Generate answer using context
  const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content:
          'Answer the question based on the provided context. If the context does not contain the answer, say so.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  })

  return c.json({
    question,
    answer: response.response,
    sources: results.matches.map((match) => ({
      id: match.id,
      score: match.score,
    })),
  })
})

export default vectorize

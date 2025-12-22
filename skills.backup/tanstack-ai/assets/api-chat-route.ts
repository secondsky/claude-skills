// Copy into Next.js `app/api/chat/route.ts` or TanStack Start `src/routes/api/chat.ts`
import { chat, toStreamResponse, maxIterations } from '@tanstack/ai'
import { openai } from '@tanstack/ai-openai'
import { tools } from '@/tools/definitions'

export const runtime = 'edge' // remove if not using Next.js edge runtime

export async function POST(request: Request) {
  const { messages, conversationId } = await request.json()

  if (!process.env.OPENAI_API_KEY) {
    return new Response('Missing OPENAI_API_KEY', { status: 400 })
  }

  const stream = chat({
    adapter: openai(),
    model: 'gpt-4o',
    messages,
    conversationId,
    tools,
    agentLoopStrategy: maxIterations(8),
  })

  return toStreamResponse(stream)
}

// If you need SSE-only responses, replace the return with:
// return toServerSentEventsStream(stream) from '@tanstack/ai'

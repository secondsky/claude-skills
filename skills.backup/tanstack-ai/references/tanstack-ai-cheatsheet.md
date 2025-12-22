# TanStack AI Quick Reference

## Minimal Server (streaming)

```ts
import { chat, toStreamResponse } from '@tanstack/ai'
import { openai } from '@tanstack/ai-openai'
import { tools } from '@/tools/definitions'

export const POST = async (req: Request) => {
  const { messages, conversationId } = await req.json()
  return toStreamResponse(
    chat({
      adapter: openai(),
      model: 'gpt-4o',
      messages,
      tools,
      agentLoopStrategy: maxIterations(8),
    })
  )
}
```

## Client (React)

```tsx
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
import { clientTools } from '@tanstack/ai-client'
import { showToastDef } from '@/tools/definitions'

const showToast = showToastDef.client(({ message }) => ({ ok: true }))

const { messages, sendMessage, approval } = useChat({
  connection: fetchServerSentEvents('/api/chat'),
  tools: clientTools(showToast),
})
```

## Tool Definition Pattern

```ts
import { z, toolDefinition } from '@tanstack/ai'

export const showToastDef = toolDefinition({
  name: 'showToast',
  description: 'Notify the user in the UI',
  inputSchema: z.object({ message: z.string().min(3) }),
  needsApproval: false,
})
```

Keep names identical across server/client implementations. Definitions go to the server `tools` list; implementations stay where they run.

## Connection Adapters Cheat Sheet

| Server emit | Client adapter | Use when |
|-------------|----------------|----------|
| `toStreamResponse()` (HTTP chunked) | `fetchServerSentEvents()` | Next.js / TanStack Start API routes |
| `toServerSentEventsStream()` | `fetchServerSentEvents()` | SSE-only proxies or long-lived streams |
| Custom websocket stream | Custom client adapter | Realtime bidirectional control |

## Streaming Checklist
- Response headers allow chunking/SSE (`Transfer-Encoding: chunked`).
- Client adapter matches server emitter.
- Proxy (Vercel/Netlify) streaming enabled; disable body buffering if needed.

## Approval & Safety
- Mark destructive tools with `needsApproval: true`.
- Surface `approval.pending` in the UI with Approve / Reject buttons.
- Add timeouts around external calls inside tools to avoid stuck agent loops.

## Troubleshooting
- **No tool output:** definitions missing from `chat({ tools })`.
- **Stream stops after first chunk:** proxy buffering or adapter mismatch.
- **Model option errors:** wrong adapter/model combo—check per-model typings. 

# TanStack Start vs Next.js Routing (Streaming Chat)

## TanStack Start
```
src/routes/api/chat.ts
```
```ts
import { chat, toStreamResponse } from '@tanstack/ai'
import { openai } from '@tanstack/ai-openai'
import { tools } from '@/tools/definitions'

export async function POST({ request }: { request: Request }) {
  const { messages } = await request.json()
  const stream = chat({ adapter: openai(), model: 'gpt-4o', messages, tools })
  return toStreamResponse(stream)
}
```
Notes:
- File-based routes; exports align with HTTP verbs.
- Runs on the same runtime as Start server functions; streaming works by default.

## Next.js (App Router)
```
app/api/chat/route.ts
```
```ts
import { chat, toStreamResponse } from '@tanstack/ai'
import { openai } from '@tanstack/ai-openai'
import { tools } from '@/tools/definitions'

export const runtime = 'edge' // optional but recommended for streaming

export async function POST(req: Request) {
  const { messages } = await req.json()
  const stream = chat({ adapter: openai(), model: 'gpt-4o', messages, tools })
  return toStreamResponse(stream)
}
```
Notes:
- Use `runtime = 'edge'` for lowest latency; for Node runtime ensure `dynamic = 'force-dynamic'` if needed.
- In dev, Next auto-handles chunked responses; in prod verify proxy allows streaming.

## Client hookup (same for both)
```tsx
const { messages } = useChat({
  connection: fetchServerSentEvents('/api/chat'),
  tools: clientTools(showToast),
})
```

## Path & Import Differences
- Start: `src/routes/...` and absolute imports often use `$lib` aliases.  
- Next: `app/api/...` and `@/` alias maps to `src/`.

## Testing
- Run `pnpm dev` and hit `/api/chat` with `curl -N` to confirm streaming:
  `curl -N -X POST -H "Content-Type: application/json" --data '{"messages":[{"role":"user","content":"ping"}]}' http://localhost:3000/api/chat`

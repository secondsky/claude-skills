# Streaming Troubleshooting (TanStack AI)

## Fast Checklist
- Server uses `toStreamResponse(stream)` (or `toServerSentEventsStream`) and returns immediately.
- Client uses matching adapter (`fetchServerSentEvents` for SSE).
- Reverse proxy allows streaming: disable body buffering; set `Cache-Control: no-transform`.
- Content-Type: `text/event-stream` for SSE; `text/plain` or `application/json` for chunked is fine.
- Keep-alive: ensure server sends heartbeats if long gaps; otherwise some hosts close idle connections.

## Common Symptoms → Fixes
- **Only first chunk shows, then hangs**: proxy buffering (Vercel/Netlify edge off), or client using `fetch` without streaming reader—switch to provided adapter.
- **CORS preflight fails**: allow `Accept: text/event-stream` and `Cache-Control` headers; include `Access-Control-Expose-Headers`.
- **“Unexpected end of JSON input”**: client tries to parse JSON from a chunked stream—consume as stream via the adapter.
- **Slow first token**: cold start or model warmup—add tiny system prompt, or send initial heartbeat chunk.
- **Stream closes mid-way**: proxy timeout—lower `agentLoopStrategy` iterations; add server timeout guards around tools.

## Reference Snippets
Server (Next.js):
```ts
export async function POST(req: Request) {
  const stream = chat({ adapter: openai(), messages, tools })
  return toStreamResponse(stream)
}
```

Client (React):
```tsx
const { messages } = useChat({
  connection: fetchServerSentEvents('/api/chat'),
  tools: clientTools(myTool),
})
```

## Deployment Notes
- Vercel: Edge functions stream well; Node functions require `config.runtime = 'edge'` or `dynamic = 'force-dynamic'`.
- Netlify: Enable `streaming: true` or use edge functions; avoid legacy lambda buffering.
- Fly/Render: Check proxy idle timeout; send heartbeat comments (`data: :heartbeat`).
- Nginx: `proxy_buffering off; proxy_http_version 1.1; chunked_transfer_encoding on;`.

## Debugging Tips
- Log chunk arrival timestamps on client to spot buffering.
- In devtools Network tab, choose “Headers” and confirm `Transfer-Encoding: chunked` or SSE headers.
- Compare payload size: if whole response appears at once, you’re not actually streaming.

# TanStack AI (Provider-Agnostic LLM SDK)

**Status**: Production Ready ✅  
**Last Updated**: 2025-12-09  
**Production Tested**: Streaming chat with OpenAI gpt-4o + tools in Next.js API route (alpha channel)

---

## Auto-Trigger Keywords

### Primary
- tanstack ai
- @tanstack/ai
- @tanstack/ai-react
- ChatClient / useChat
- toStreamResponse

### Secondary
- toolDefinition
- client tools / server tools
- fetchServerSentEvents
- agent loop / maxIterations
- tool approval / needsApproval

### Error-Based
- "tool not found"
- "stream stalls after first chunk"
- "missing OPENAI_API_KEY"
- "tool approval pending"

---

## What This Skill Does

Gives a copy/paste blueprint for TanStack AI’s alpha SDK: install the right adapter, expose a streaming chat route, define isomorphic tools with approval gates, and wire React clients with SSE adapters. It highlights per-model type safety, agent loop caps, and observability hooks to keep tool calls safe and debuggable.

### Core Capabilities

✅ Streaming chat API template (Next.js / TanStack Start)  
✅ Isomorphic tool definitions with approval + Zod validation  
✅ Client wiring with `useChat`, `fetchServerSentEvents`, and tool registration  
✅ Agent loop safeguards and per-model option typing

---

## Known Issues This Skill Prevents

| Issue | Why It Happens | How Skill Fixes It |
|-------|----------------|--------------------|
| Tool not found | Definitions never sent to `chat()` | Keep shared `toolDefinition` exports and pass to server tools list |
| Streaming stalls | Server uses chunked response but client expects SSE | Pair `toStreamResponse` with `fetchServerSentEvents` (or matching adapter) |
| Invalid model options | Vision/audio params sent to unsupported model | Use adapter typings + per-model options to catch at compile time |

---

## When to Use This Skill

### ✅ Use When
- Building chat or agent flows that must call tools across server and client.
- Swapping between OpenAI, Anthropic, Gemini, or Ollama without rewriting UI.
- You need approval UX for side-effectful tool calls.
- Debugging stalled streams or missing tool execution in TanStack AI alpha.

### ❌ Don’t Use When
- You need a non-streaming, legacy REST completion flow (use plain OpenAI API skill).
- You are locked to a single provider and don’t need tool orchestration.

---

## Quick Usage Example

```bash
# 1) Install core + adapter
pnpm add @tanstack/ai @tanstack/ai-react @tanstack/ai-openai zod

# 2) Copy route + tools
cp assets/api-chat-route.ts app/api/chat/route.ts       # Next.js
cp assets/tool-definitions.ts src/tools/definitions.ts  # adjust path

# 3) Validate env and run dev
./scripts/check-ai-env.sh
pnpm dev
```

**Result**: A streaming chat endpoint with tool approval and SSE client wiring.  
**Full instructions**: See `SKILL.md`

---

## Package Versions (Verified 2025-12-09)

| Package | Version | Status |
|---------|---------|--------|
| @tanstack/ai | latest (alpha) | ✅ |
| @tanstack/ai-react | latest | ✅ |
| @tanstack/ai-client | latest | ✅ |
| @tanstack/ai-openai | latest | ✅ |
| zod | latest | ✅ |

---

## Dependencies

**Prerequisites**: None  
**Integrates With**:
- tanstack-query (for data caching inside tools)
- openai-agents / claude-agent-sdk (for provider-specific flows)

---

## File Structure

```
tanstack-ai/
├── SKILL.md              # Full instructions + references
├── README.md             # Quick reference (this file)
├── scripts/
│   └── check-ai-env.sh   # Verifies provider API keys
├── references/
│   └── tanstack-ai-cheatsheet.md  # Condensed patterns + troubleshooting
└── assets/
    ├── api-chat-route.ts  # Streaming chat route template
    └── tool-definitions.ts # toolDefinition examples with approval
```

---

## Official Documentation

- TanStack AI Overview: https://tanstack.com/ai/latest/docs/getting-started/overview  
- Quick Start: https://tanstack.com/ai/latest/docs/getting-started/quick-start  
- Tool Architecture & Approval: https://tanstack.com/ai/latest/docs/guides/tool-architecture  
- Client Tools: https://tanstack.com/ai/latest/docs/guides/client-tools  
- Streaming & Connection Adapters: https://tanstack.com/ai/latest/docs/guides/streaming

---

## Related Skills

- **tanstack-query** — server state management patterns  
- **openai-agents** — OpenAI-specific assistants/agents setups  
- **claude-agent-sdk** — Anthropic-flavored agent orchestration

---

## Contributing

Found an issue or suggestion? Open an issue on the repo and reference `tanstack-ai`. See `SKILL.md` for full details.

---

**Ready to use.** Copy the assets, verify env keys, and ship a streaming tool-enabled chat.

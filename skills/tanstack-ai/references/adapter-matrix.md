# TanStack AI Adapter Matrix (OpenAI | Anthropic | Gemini | Ollama)

## Env Keys
- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Gemini: `GEMINI_API_KEY`
- Ollama: `OLLAMA_HOST` (defaults to `http://localhost:11434`)

## Supported Models & Notes (alpha SDK)
| Provider | Text models | Multimodal | Streaming | Notes |
|----------|-------------|------------|-----------|-------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-3.5-turbo, etc. | Vision in 4o/4o-mini | Yes (SSE/chunk) | Use `model: 'gpt-4o'` for tools + vision |
| Anthropic | claude-3-5-sonnet, claude-3-opus, claude-3-haiku | Vision in 3.x | Yes | Tool calling supported; respect `max_output_tokens` |
| Gemini | gemini-1.5-pro/flash | Vision/audio | Yes | Requires `project` in key scope; observe safety settings |
| Ollama | local model names (e.g., llama3, mistral) | Model-dependent | Yes | Ensure `keep_alive` small for dev to free RAM |

## Per-Model Option Gotchas
- OpenAI: `response_format` only on some models; vision requires image parts.  
- Anthropic: `max_output_tokens` required; `temperature` + `top_p` interplay—set one.  
- Gemini: Enable `generationConfig` for safety; set `tools` under `systemInstruction` semantics when needed.  
- Ollama: Options vary by model; avoid sending provider-specific fields from other adapters.

## Adapter Usage Snippets
```ts
import { openai } from '@tanstack/ai-openai'
import { anthropic } from '@tanstack/ai-anthropic'
import { gemini } from '@tanstack/ai-gemini'
import { ollama } from '@tanstack/ai-ollama'

const provider = openai({ apiKey: process.env.OPENAI_API_KEY })
// swap anthropic(), gemini(), or ollama({ baseUrl: process.env.OLLAMA_HOST })
```

## Capability Checklist
- Tools: OpenAI ✅ | Anthropic ✅ | Gemini ✅ | Ollama ⚠️ (model-dependent)
- Multimodal: OpenAI vision ✅ | Anthropic vision ✅ | Gemini ✅ | Ollama ⚠️
- Streaming: All four via adapter helpers
- Native JSON mode: OpenAI & Gemini support; Anthropic via tool outputs; Ollama depends on model

## Switching Providers Safely
1. Keep tool definitions provider-agnostic; avoid provider-specific enum values.  
2. Gate model-specific options with TypeScript narrowing (e.g., helper `isOpenAIAdapter`).  
3. Verify env key exists before instantiating adapter; fail fast with HTTP 400.  
4. Run smoke test per provider: send `messages: [{ role: 'user', content: 'ping' }]` and ensure stream arrives.

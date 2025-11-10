# AI SDK Core

Backend AI with Vercel AI SDK v5 - text generation, structured output, tools, and agents.

## Auto-Trigger Keywords

This skill should be discovered when working with:

### Primary Keywords (High Priority)
- ai sdk core, vercel ai sdk, ai sdk v5
- generateText, streamText, generate text ai
- generateObject, streamObject, structured ai output
- ai sdk node, ai sdk server, ai sdk backend
- zod ai schema, zod ai validation
- ai tools calling, ai agent class, agent with tools
- openai sdk, anthropic sdk, google gemini sdk
- multi-provider ai, ai provider switching

### Secondary Keywords (Medium Priority)
- ai streaming backend, stream ai responses
- ai server actions, nextjs ai server
- cloudflare workers ai sdk, workers-ai-provider
- ai sdk migration, v4 to v5 migration
- ai chat completion, llm text generation
- ai sdk typescript, typed ai responses
- stopWhen ai sdk, multi-step ai execution
- dynamic tools ai, runtime tools ai

### Error Keywords (Discovery on Errors)
- AI_APICallError, ai api call error
- AI_NoObjectGeneratedError, no object generated
- AI_LoadAPIKeyError, ai api key error
- AI_InvalidArgumentError, invalid argument ai
- AI_TypeValidationError, zod validation failed
- AI_RetryError, ai retry failed
- streamText fails silently, stream error swallowed
- worker startup limit ai sdk, 270ms startup
- ai rate limit, rate limiting ai
- maxTokens maxOutputTokens, v5 breaking changes
- providerMetadata providerOptions, tool inputSchema
- ToolExecutionError removed, tool-error parts

### Framework Keywords
- nextjs ai sdk, next.js server actions ai
- cloudflare workers ai integration
- node.js ai sdk, nodejs llm
- vercel ai deployment, serverless ai

### Provider Keywords
- openai integration, gpt-4 api, chatgpt api
- anthropic claude, claude api integration
- google gemini api, gemini integration
- cloudflare llama, workers ai llm

## What This Skill Provides

- **4 Core Functions**: generateText, streamText, generateObject, streamObject
- **Top 4 Providers**: OpenAI, Anthropic, Google, Cloudflare Workers AI
- **Tool Calling & Agents**: Multi-step execution with tools
- **v4→v5 Migration**: Complete breaking changes guide
- **Top 12 Errors**: Common issues with solutions
- **13 Templates**: Copy-paste examples
- **5 Reference Docs**: Detailed guides
- **Production Patterns**: Best practices for deployment

## Quick Links

- **Official Docs**: https://ai-sdk.dev/docs
- **Migration Guide**: https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0
- **Error Reference**: https://ai-sdk.dev/docs/reference/ai-sdk-errors
- **GitHub**: https://github.com/vercel/ai

## Installation

```bash
bun add ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google zod  # preferred
# or: npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google zod
```

## Usage

See `SKILL.md` for comprehensive documentation and examples.

## Version

- **Skill Version**: 1.1.0
- **AI SDK Version**: 5.0.81+
- **Last Updated**: 2025-10-29

## Recent Updates (v1.1.0)

- **Updated Model Names**: Claude 4.x (Sonnet 4.5, Opus 4), GPT-5, Gemini 2.5 models now GA
- **Updated Package Versions**: AI SDK 5.0.81, @ai-sdk/anthropic 2.0.38, @ai-sdk/openai 2.0.56, @ai-sdk/google 2.0.24
- **Zod 4 Support Documented**: AI SDK 5 supports both Zod 3.x and 4.x (4.1.12 latest)
- **Issue #4726 Resolved**: streamText now has onError callback (fixed in v4.1.22)
- **Deprecated Claude 3.x**: Anthropic deprecated Claude 3.x models in favor of Claude 4.x family

## License

MIT

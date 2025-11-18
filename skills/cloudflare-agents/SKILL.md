---
name: cloudflare-agents
description: Build AI agents on Cloudflare Workers with MCP integration, tool use, and LLM providers.
license: MIT
---

# Cloudflare Agents

**Last Updated**: 2025-11-10

## Quick Start

```typescript
export default {
  async fetch(request, env, ctx) {
    const agent = {
      tools: [
        { name: 'getTodo', handler: async ({id}) => ({id, title: 'Task'}) }
      ],
      async run(input) {
        return await processWithLLM(input, this.tools);
      }
    };
    
    return Response.json(await agent.run(await request.text()));
  }
};
```

## Core Features

- **Tool Integration**: Register and execute tools
- **LLM Providers**: OpenAI, Anthropic, Google Gemini
- **MCP Protocol**: Model Context Protocol support
- **Cloudflare Bindings**: D1, KV, R2, Durable Objects

## Agent Pattern

```typescript
const agent = {
  tools: [...],
  systemPrompt: 'You are a helpful assistant',
  model: 'gpt-4o',
  async run(input) {
    // Process with LLM
  }
};
```

## Resources

- `templates/basic-agent.ts` - Agent setup example
- `references/error-catalog.md` - Common errors

**Docs**: https://developers.cloudflare.com

# AI SDK Provider Setup & Configuration

Complete setup instructions for all major AI providers.

**Last Updated**: 2025-11-21

---

## OpenAI

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// API key from environment (recommended)
// OPENAI_API_KEY=sk-...
const model = openai('gpt-4-turbo');

// Or explicit API key
const model = openai('gpt-4', {
  apiKey: process.env.OPENAI_API_KEY,
});

// Available models
const gpt5 = openai('gpt-5');           // Latest (released August 2025)
const gpt4 = openai('gpt-4-turbo');
const gpt35 = openai('gpt-3.5-turbo');

const result = await generateText({
  model: gpt4,
  prompt: 'Hello',
});
```

**Common Errors:**
- `AI_LoadAPIKeyError`: Check `OPENAI_API_KEY` environment variable
- `429 Rate Limit`: Implement exponential backoff, upgrade tier
- `401 Unauthorized`: Invalid API key format

**Rate Limiting:**
OpenAI enforces RPM (requests per minute) and TPM (tokens per minute) limits. Implement retry logic:

```typescript
const result = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hello',
  maxRetries: 3,  // Built-in retry
});
```

---

## Anthropic

```typescript
import { anthropic } from '@ai-sdk/anthropic';

// ANTHROPIC_API_KEY=sk-ant-...
const claude = anthropic('claude-sonnet-4-5-20250929');

// Available models (Claude 4.x family, released 2025)
const sonnet45 = anthropic('claude-sonnet-4-5-20250929');  // Latest, recommended
const sonnet4 = anthropic('claude-sonnet-4-20250522');     // Released May 2025
const opus4 = anthropic('claude-opus-4-20250522');         // Highest quality

// Legacy models (Claude 3.x, deprecated)
// const sonnet35 = anthropic('claude-3-5-sonnet-20241022');  // Use Claude 4.x instead
// const opus3 = anthropic('claude-3-opus-20240229');
// const haiku3 = anthropic('claude-3-haiku-20240307');

const result = await generateText({
  model: sonnet45,
  prompt: 'Explain quantum entanglement',
});
```

**Common Errors:**
- `AI_LoadAPIKeyError`: Check `ANTHROPIC_API_KEY` environment variable
- `overloaded_error`: Retry with exponential backoff
- `rate_limit_error`: Wait and retry

**Best Practices:**
- Claude excels at long-context tasks (200K+ tokens)
- **Claude 4.x recommended**: Anthropic deprecated Claude 3.x in 2025
- Use Sonnet 4.5 for balance of speed/quality (latest model)
- Use Sonnet 4 for production stability (if avoiding latest)
- Use Opus 4 for highest quality reasoning and complex tasks

---

## Google

```typescript
import { google } from '@ai-sdk/google';

// GOOGLE_GENERATIVE_AI_API_KEY=...
const gemini = google('gemini-2.5-pro');

// Available models (all GA since June-July 2025)
const pro = google('gemini-2.5-pro');
const flash = google('gemini-2.5-flash');
const lite = google('gemini-2.5-flash-lite');

const result = await generateText({
  model: pro,
  prompt: 'Analyze this data',
});
```

**Common Errors:**
- `AI_LoadAPIKeyError`: Check `GOOGLE_GENERATIVE_AI_API_KEY`
- `SAFETY`: Content filtered by safety settings
- `QUOTA_EXCEEDED`: Rate limit hit

**Best Practices:**
- Gemini Pro: Best for reasoning and analysis
- Gemini Flash: Fast, cost-effective for most tasks
- Free tier has generous limits
- Good for multimodal tasks (combine with image inputs)

---

## Cloudflare Workers AI

```typescript
import { Hono } from 'hono';
import { generateText } from 'ai';
import { createWorkersAI } from 'workers-ai-provider';

interface Env {
  AI: Ai;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/chat', async (c) => {
  // Create provider inside handler (avoid startup overhead)
  const workersai = createWorkersAI({ binding: c.env.AI });

  const result = await generateText({
    model: workersai('@cf/meta/llama-3.1-8b-instruct'),
    prompt: 'What is Cloudflare?',
  });

  return c.json({ response: result.text });
});

export default app;
```

**wrangler.jsonc:**

```jsonc
{
  "name": "ai-sdk-worker",
  "compatibility_date": "2025-10-21",
  "ai": {
    "binding": "AI"
  }
}
```

**Important Notes:**

**Startup Optimization:**
AI SDK v5 + Zod can cause >270ms startup time in Workers. Solutions:

1. **Move imports inside handler:**
```typescript
// BAD (startup overhead)
import { createWorkersAI } from 'workers-ai-provider';
const workersai = createWorkersAI({ binding: env.AI });

// GOOD (lazy init)
app.post('/chat', async (c) => {
  const { createWorkersAI } = await import('workers-ai-provider');
  const workersai = createWorkersAI({ binding: c.env.AI });
  // ...
});
```

2. **Minimize top-level Zod schemas:**
```typescript
// Move complex schemas into route handlers
```

**When to Use workers-ai-provider:**
- Multi-provider scenarios (OpenAI + Workers AI)
- Using AI SDK UI hooks with Workers AI
- Need consistent API across providers

**When to Use Native Binding:**
For Cloudflare-only deployments without multi-provider support, use the `cloudflare-workers-ai` skill instead for maximum performance.

---

**Questions?** Check `error-catalog.md` for provider-specific troubleshooting.

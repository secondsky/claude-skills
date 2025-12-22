# AI Provider Setup Guide

Step-by-step setup for each AI provider with TheSys C1, including current model IDs, pricing, and specifications.

---

## OpenAI

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});
```

### Available Models

**Stable (Production)**:
- `c1/openai/gpt-5/v-20250930` - GPT 5
  - Input: $2.50/M | Output: $12.50/M
  - Context: 380K | Max Output: 128K

**Experimental**:
- `c1-exp/openai/gpt-4.1/v-20250617` - GPT 4.1
  - Input: $4.00/M | Output: $10.00/M
  - Context: 1M | Max Output: 32K

### Example Usage

```typescript
const response = await client.chat.completions.create({
  model: "c1/openai/gpt-5/v-20250930",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Create a product comparison table." }
  ],
  stream: true,
  temperature: 0.7,
  max_tokens: 2000
});
```

---

## Anthropic (Claude)

```typescript
// Same OpenAI client! TheSys handles the conversion
const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});
```

### Available Models

**Stable (Production)**:
- `c1/anthropic/claude-sonnet-4/v-20250930` - Claude Sonnet 4
  - Input: $6.00/M | Output: $18.00/M
  - Context: 180K | Max Output: 64K

**Experimental**:
- `c1-exp/anthropic/claude-3.5-haiku/v-20250709` - Claude 3.5 Haiku
  - Input: $1.60/M | Output: $5.00/M
  - Context: 180K | Max Output: 8K

**Deprecated** (not recommended):
- `c1/anthropic/claude-sonnet-3-5`
- `c1/anthropic/claude-3.7-sonnet`

### Example Usage

```typescript
const response = await client.chat.completions.create({
  model: "c1/anthropic/claude-sonnet-4/v-20250930",
  messages: [
    { role: "system", content: "You are Claude, an AI assistant." },
    { role: "user", content: "Generate a data visualization chart." }
  ],
  stream: true,
  temperature: 0.8,
  max_tokens: 4096
});
```

---

## Cloudflare Workers AI

### Option 1: Workers AI Only (No C1)

Use Workers AI directly for cost optimization on simple use cases.

```typescript
const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" }
  ]
});
```

### Option 2: Hybrid Approach (Workers AI + C1)

Use Workers AI for processing, then TheSys C1 for UI generation.

```typescript
// Step 1: Process with Workers AI (cheap)
const analysis = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
  messages: [{ role: "user", content: "Analyze this data..." }]
});

// Step 2: Generate UI with C1 (interactive components)
const c1Response = await fetch("https://api.thesys.dev/v1/embed/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${env.THESYS_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "c1/openai/gpt-5/v-20250930",
    messages: [
      {
        role: "system",
        content: "Create a chart visualization for this data."
      },
      {
        role: "user",
        content: analysis.response
      }
    ]
  })
});
```

**Cost Benefits**:
- Workers AI: Very low cost for text generation
- C1 API: Only used for final UI generation
- Combined: Best of both worlds

---

## Python Backend (FastAPI/Flask)

```python
import openai
import os

client = openai.OpenAI(
    base_url="https://api.thesys.dev/v1/embed",
    api_key=os.getenv("THESYS_API_KEY")
)
```

### Example with TheSys SDK

```python
from thesys_genui_sdk import with_c1_response, write_content

@app.post("/api/chat")
@with_c1_response
async def chat(request: dict):
    stream = client.chat.completions.create(
        model="c1/anthropic/claude-sonnet-4/v-20250930",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": request["prompt"]}
        ],
        stream=True
    )

    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield write_content(content)
```

See `templates/python-backend/` for complete examples.

---

## Model Selection Guide

### When to Use Each Provider

**GPT 5** (`c1/openai/gpt-5/v-20250930`):
- Best for: General-purpose applications
- Pros: Large context window (380K), lower cost
- Cons: Less nuanced than Claude for some tasks

**Claude Sonnet 4** (`c1/anthropic/claude-sonnet-4/v-20250930`):
- Best for: Complex reasoning, code generation
- Pros: Superior code understanding, detailed responses
- Cons: Higher cost, smaller context window

**Experimental Models** (`c1-exp/...`):
- Best for: Testing new features, non-production use
- Pros: Access to cutting-edge capabilities
- Cons: May have unexpected behavior, pricing subject to change

---

## Environment Variables

```bash
# Required
THESYS_API_KEY=sk-th-your-api-key-here

# Optional (for CORS configuration)
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

Get your API key: https://console.thesys.dev/keys

---

## Version Notes

Model version identifiers (e.g., `v-20250930`) may change as new versions are released. Always check the [TheSys Playground](https://console.thesys.dev/playground) for the latest available versions.

---

For complete integration examples and advanced patterns, see the main SKILL.md documentation.

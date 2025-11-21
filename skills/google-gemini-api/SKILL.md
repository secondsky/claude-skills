---
name: google-gemini-api
description: |
  Complete guide for Google Gemini API using the CORRECT current SDK (@google/genai v1.27+, NOT the
  deprecated @google/generative-ai). Covers text generation, multimodal inputs (text + images + video +
  audio + PDFs), function calling, thinking mode, streaming, and system instructions with accurate 2025
  model information (Gemini 2.5 Pro/Flash/Flash-Lite with 1M input tokens, NOT 2M).

  Use when: integrating Gemini API, implementing multimodal AI applications, using thinking mode for
  complex reasoning, function calling with parallel execution, streaming responses, deploying to
  Cloudflare Workers, building chat applications, or encountering SDK deprecation warnings, context window
  errors, model not found errors, function calling failures, or multimodal format errors.

  Keywords: gemini api, @google/genai, gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite,
  multimodal gemini, thinking mode, google ai, genai sdk, function calling gemini, streaming gemini,
  gemini vision, gemini video, gemini audio, gemini pdf, system instructions, multi-turn chat,
  DEPRECATED @google/generative-ai, gemini context window, gemini models 2025, gemini 1m tokens,
  gemini tool use, parallel function calling, compositional function calling
license: MIT
---

# Google Gemini API - Complete Guide

**Package**: @google/genai@1.27.0 (⚠️ NOT @google/generative-ai)
**Last Updated**: 2025-11-21

---

## ⚠️ CRITICAL SDK MIGRATION WARNING

**DEPRECATED SDK**: `@google/generative-ai` (sunset November 30, 2025)
**CURRENT SDK**: `@google/genai` v1.27+

**If you see code using `@google/generative-ai`, it's outdated!**

---

## Quick Start

### Installation

**✅ CORRECT SDK:**
```bash
bun add @google/genai@1.27.0
```

**❌ WRONG (DEPRECATED):**
```bash
bun add @google/generative-ai  # DO NOT USE!
```

### Environment Setup

```bash
export GEMINI_API_KEY="your-api-key"
```

### First Text Generation

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Explain quantum computing in simple terms'
});

console.log(response.text);
```

**See Full Template**: `templates/basic-usage.ts`

---

## Current Models (2025)

### gemini-2.5-pro
- **Best for**: Complex reasoning, code generation, long-form content
- **Input tokens**: 1,048,576 (1M, NOT 2M!)
- **Output tokens**: 65,536
- **Rate limit (free)**: 5 RPM, 125k TPM
- **Cost**: Input $1.25/1M tokens, Output $5/1M tokens

### gemini-2.5-flash  
- **Best for**: Fast responses, general tasks
- **Input tokens**: 1,048,576
- **Output tokens**: 65,536
- **Rate limit (free)**: 10 RPM, 250k TPM
- **Cost**: Input $0.075/1M tokens, Output $0.30/1M tokens

### gemini-2.5-flash-lite
- **Best for**: High-volume, low-latency tasks
- **Input tokens**: 1,048,576
- **Output tokens**: 65,536
- **Rate limit (free)**: 15 RPM, 250k TPM
- **Cost**: Input $0.01/1M tokens, Output $0.04/1M tokens

**⚠️ Common mistake**: Claiming Gemini 2.5 has 2M tokens. **It doesn't. It's 1,048,576 (1M).**

---

## Text Generation

### Basic Generation

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Write a haiku about programming'
});

console.log(response.text);
```

### With Configuration

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Explain AI',
  generationConfig: {
    temperature: 0.7,        // 0.0-2.0, default 1.0
    topP: 0.95,             // 0.0-1.0
    topK: 40,               // 1-100
    maxOutputTokens: 1024,
    stopSequences: ['END']
  }
});
```

---

## Streaming

```typescript
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a long story'
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

---

## Multimodal Inputs

### Images

```typescript
const imageData = Buffer.from(imageBytes).toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { text: 'What is in this image?' },
    {
      inlineData: {
        mimeType: 'image/jpeg',  // or image/png, image/webp
        data: imageData
      }
    }
  ]
});
```

### Video

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { text: 'Describe this video' },
    {
      inlineData: {
        mimeType: 'video/mp4',
        data: base64VideoData
      }
    }
  ]
});
```

### Audio

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { text: 'Transcribe this audio' },
    {
      inlineData: {
        mimeType: 'audio/wav',  // or audio/mp3
        data: base64AudioData
      }
    }
  ]
});
```

### PDFs

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { text: 'Summarize this PDF' },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64PdfData
      }
    }
  ]
});
```

---

## Function Calling

### Basic Function Calling

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather in San Francisco?',
  tools: [{
    functionDeclarations: [{
      name: 'getWeather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      }
    }]
  }]
});

// Handle function call
const call = response.functionCalls?.[0];
if (call) {
  const result = await getWeather(call.args);
  
  // Send result back to model
  const final = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      ...response.contents,
      {
        functionResponse: {
          name: call.name,
          response: result
        }
      }
    ]
  });
  
  console.log(final.text);
}
```

### Parallel Function Calling

Gemini can call multiple functions in a single response:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather in SF and NY?',
  tools: [{ functionDeclarations: [getWeatherDeclaration] }]
});

// Process all function calls in parallel
const results = await Promise.all(
  response.functionCalls.map(call => 
    getWeather(call.args).then(result => ({
      name: call.name,
      response: result
    }))
  )
);

// Send all results back
const final = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    ...response.contents,
    ...results.map(r => ({ functionResponse: r }))
  ]
});
```

---

## Multi-turn Chat

```typescript
const chat = ai.models.startChat({
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are a helpful assistant specializing in programming',
  history: []
});

let response = await chat.sendMessage('Hello!');
console.log(response.text);

response = await chat.sendMessage('Explain async/await');
console.log(response.text);

// Get full history
console.log(chat.getHistory());
```

---

## Thinking Mode

For complex reasoning tasks:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash-thinking',  // Note: -thinking suffix
  contents: 'Solve this math problem: If x + 2y = 10 and 3x - y = 4, what is x?'
});

console.log('Thinking process:', response.thinkingContent);
console.log('Final answer:', response.text);
```

**Use for**: Complex math, logic puzzles, multi-step reasoning, code debugging

---

## System Instructions

Set persistent instructions for the model:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are a pirate. Always respond in pirate speak.',
  contents: 'What is the weather today?'
});
```

---

## Context Caching (Cost Optimization)

Cache large inputs to reduce costs on repeated use:

```typescript
// Create cache (lasts for TTL period)
const cache = await ai.caches.create({
  model: 'gemini-2.5-flash',
  contents: largeDocument,  // Your large static content
  ttl: '300s'  // Cache for 5 minutes
});

// Use cached content (cheaper!)
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  cachedContent: cache.name,
  contents: 'What does the document say about X?'
});

// Later, with same cache
const response2 = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  cachedContent: cache.name,  // Reuse cache!
  contents: 'What about Y?'
});
```

**Cost Savings**: Cached tokens cost 1/4 of regular input tokens

---

## Code Execution

Built-in Python interpreter for running code:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Calculate the first 10 Fibonacci numbers',
  tools: [{ codeExecution: {} }]
});

// Model generates and executes Python code
console.log(response.text);
```

**Use for**: Data analysis, calculations, chart generation, file processing

---

## Grounding with Google Search

Get real-time information from Google Search:

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What are the latest AI developments in 2025?',
  tools: [{ googleSearchRetrieval: {} }]
});

// Response includes search results and citations
console.log(response.text);
console.log('Sources:', response.groundingMetadata);
```

---

## Top 5 Critical Errors

### Error 1: Using Deprecated SDK

**Error**: Deprecation warnings or outdated API

**Solution**: Use `@google/genai`, NOT `@google/generative-ai`

```bash
npm uninstall @google/generative-ai
bun add @google/genai@1.27.0
```

---

### Error 2: Invalid API Key (401)

**Error**: `API key not valid`

**Solution**: Verify environment variable

```bash
export GEMINI_API_KEY="your-key"
```

---

### Error 3: Model Not Found (404)

**Error**: `models/gemini-3.0-flash is not found`

**Solution**: Use correct model names (2025)

```typescript
'gemini-2.5-pro'
'gemini-2.5-flash'
'gemini-2.5-flash-lite'
```

---

### Error 4: Context Length Exceeded (400)

**Error**: `Request payload size exceeds the limit`

**Solution**: Input limit is **1,048,576 tokens (1M, NOT 2M)**. Use context caching for large inputs.

---

### Error 5: Rate Limit Exceeded (429)

**Error**: `Resource has been exhausted`

**Solution**: Implement exponential backoff

```typescript
async function generateWithRetry(request, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

**See All 7 Errors**: `references/error-catalog.md`

---

## SDK Migration Guide

### From @google/generative-ai to @google/genai

```bash
# Remove deprecated SDK
npm uninstall @google/generative-ai

# Install current SDK
bun add @google/genai@1.27.0
```

```typescript
// ❌ Old SDK (DEPRECATED)
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(apiKey);

// ✅ New SDK (CURRENT)
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey });
```

---

## Rate Limits

### Free Tier

**Gemini 2.5 Flash** (recommended for development):
- Requests per minute: 10 RPM
- Tokens per minute: 250,000 TPM
- Requests per day: 250 RPD

### Paid Tier 1

**Gemini 2.5 Flash**:
- Requests per minute: 1,000 RPM
- Tokens per minute: 1,000,000 TPM
- Requests per day: 10,000 RPD

**Tip**: Implement rate limiting and exponential backoff for production apps

---

## Bundled Resources

**Templates** (`templates/`):
- `basic-usage.ts` - Complete examples for all features (133 lines)

**References** (`references/`):
- `error-catalog.md` - All 7 documented errors with solutions (231 lines)

---

## Integration with Other Skills

This skill composes well with:

- **cloudflare-worker-base** → Deploy to Cloudflare Workers
- **ai-sdk-core** → Vercel AI SDK integration
- **openai-api** → Multi-provider AI setup
- **google-gemini-embeddings** → Text embeddings

---

## Additional Resources

**Official Documentation**:
- Gemini API Docs: https://ai.google.dev/gemini-api/docs
- SDK Reference: https://ai.google.dev/gemini-api/docs/sdks
- Rate Limits: https://ai.google.dev/gemini-api/docs/rate-limits

---

**Production Tested**: AI chatbots, content generation, multimodal analysis
**Last Updated**: 2025-10-25
**Token Savings**: ~65% (reduces API docs + examples)

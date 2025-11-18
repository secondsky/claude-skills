---
name: openai-api
description: Complete guide for OpenAI APIs: Chat Completions (GPT-5, GPT-4o), Embeddings, Images (DALL-E 3), Audio (Whisper + TTS), Moderation. Includes Node.js SDK and fetch approaches.
license: MIT
---

# OpenAI API

**Package**: openai@6.7.0 | **Last Updated**: 2025-10-25

## Quick Start

```bash
npm install openai
export OPENAI_API_KEY="sk-..."
```

```typescript
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Current Models (2025)

- **gpt-5**: Most capable (128k context)
- **gpt-4o**: Fast multimodal (128k context)
- **gpt-4o-mini**: Cost-effective (128k context)  
- **o1-preview**: Advanced reasoning (128k context)
- **o1-mini**: Fast reasoning (128k context)

## Chat Completions

```typescript
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Explain AI' }
  ],
  temperature: 0.7,
  max_tokens: 1000
});
```

## Streaming

```typescript
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Tell a story' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

## Function Calling

```typescript
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is the weather?' }],
  tools: [{
    type: 'function',
    function: {
      name: 'getWeather',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location']
      }
    }
  }]
});
```

## Embeddings

```typescript
const response = await client.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Your text here'
});

const embedding = response.data[0].embedding; // 1536 dimensions
```

## Images (DALL-E 3)

```typescript
const image = await client.images.generate({
  model: 'dall-e-3',
  prompt: 'A serene landscape',
  size: '1024x1024',
  quality: 'standard'  // or 'hd'
});
```

## Audio

**Transcription (Whisper)**:
```typescript
const transcription = await client.audio.transcriptions.create({
  file: fs.createReadStream('audio.mp3'),
  model: 'whisper-1'
});
```

**Text-to-Speech**:
```typescript
const speech = await client.audio.speech.create({
  model: 'tts-1',
  voice: 'alloy',
  input: 'Hello world'
});
```

## Top Errors

1. **Invalid API Key (401)**: Verify OPENAI_API_KEY
2. **Rate Limit (429)**: Implement exponential backoff
3. **Model Not Found (404)**: Use correct model names
4. **Context Length (400)**: Reduce input size
5. **Invalid JSON**: Fix function calling schemas

**See**: `references/error-catalog.md`

## Resources

- `templates/basic-usage.ts` - Complete examples
- `references/error-catalog.md` - All errors + solutions

**Docs**: https://platform.openai.com/docs

# Google Gemini API - Complete Error Catalog

All documented errors and solutions for Google Gemini API with @google/genai SDK.

**Last Updated**: 2025-10-25
**SDK Version**: @google/genai@1.27.0
**Source**: Production deployments, Google AI documentation

---

## Error 1: Invalid API Key (401)

**Error**:
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "UNAUTHENTICATED"
  }
}
```

**Cause**: Missing or incorrect API key

**Solution**: Verify `GEMINI_API_KEY` environment variable is set correctly

```bash
export GEMINI_API_KEY="your-api-key-here"
```

---

## Error 2: Rate Limit Exceeded (429)

**Error**:
```json
{
  "error": {
    "code": 429,
    "message": "Resource has been exhausted (e.g. check quota).",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

**Cause**: Exceeded rate limits for your tier

**Solution**: Implement exponential backoff retry strategy

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

## Error 3: Model Not Found (404)

**Error**:
```json
{
  "error": {
    "code": 404,
    "message": "models/gemini-3.0-flash is not found",
    "status": "NOT_FOUND"
  }
}
```

**Cause**: Using incorrect model name or non-existent model

**Solution**: Use correct model names

```typescript
// ✅ Correct model names (2025)
'gemini-2.5-pro'
'gemini-2.5-flash'
'gemini-2.5-flash-lite'

// ❌ Wrong
'gemini-3.0-flash'  // Doesn't exist
'gemini-1.5-pro'    // Outdated
```

---

## Error 4: Context Length Exceeded (400)

**Error**:
```json
{
  "error": {
    "code": 400,
    "message": "Request payload size exceeds the limit",
    "status": "INVALID_ARGUMENT"
  }
}
```

**Cause**: Input exceeds maximum context window

**Solution**: Reduce input size. Gemini 2.5 models support **1,048,576 input tokens max** (NOT 2M)

```typescript
// Use context caching for large inputs
const cache = await ai.caches.create({
  model: 'gemini-2.5-flash',
  contents: largeDocument,  // Cache the large part
  ttl: '300s'
});

// Then use cached content in requests
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  cachedContent: cache.name,
  contents: 'What does this document say about X?'
});
```

---

## Error 5: Deprecated SDK Warning

**Warning**: `@google/generative-ai` is deprecated and will sunset November 30, 2025

**Solution**: Migrate to `@google/genai`

```bash
# Remove deprecated SDK
npm uninstall @google/generative-ai

# Install current SDK
npm install @google/genai@1.27.0
```

```typescript
// ❌ Old SDK (DEPRECATED)
import { GoogleGenerativeAI } from '@google/generative-ai';

// ✅ New SDK (CURRENT)
import { GoogleGenAI } from '@google/genai';
```

---

## Error 6: Function Calling Schema Mismatch

**Error**: Function called with incorrect parameters or returns invalid format

**Cause**: Function declaration schema doesn't match actual function implementation

**Solution**: Ensure strict schema matching

```typescript
// Function declaration
{
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
}

// Function implementation must match
async function getWeather({ location, unit = 'celsius' }) {
  // Return object matching schema
  return { temperature: 72, unit, location };
}
```

---

## Error 7: Multimodal Format Error

**Error**: Image/video/audio not formatted correctly

**Cause**: Incorrect MIME type or data encoding

**Solution**: Use correct format

```typescript
// ✅ Correct image format
{
  inlineData: {
    mimeType: 'image/jpeg',  // or image/png, image/webp
    data: base64ImageData    // Base64 encoded
  }
}

// ✅ Correct video format
{
  inlineData: {
    mimeType: 'video/mp4',
    data: base64VideoData
  }
}
```

---

## Summary

**Total Errors Documented**: 7
**Categories**:
- Authentication: 1 error (#1)
- Rate Limiting: 1 error (#2)
- Model Selection: 1 error (#3)
- Context Limits: 1 error (#4)
- SDK Migration: 1 error (#5)
- Function Calling: 1 error (#6)
- Multimodal: 1 error (#7)

**Prevention**: Always use `@google/genai` SDK and verify model names and context limits.

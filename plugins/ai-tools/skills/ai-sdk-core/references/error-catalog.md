# AI SDK Error Catalog

Complete troubleshooting guide for all 12 common AI SDK errors.

**Last Updated**: 2025-11-21

---

## Error #1: AI_APICallError

**Cause:** API request failed (network, auth, rate limit).

**Solution:**
```typescript
import { AI_APICallError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_APICallError) {
    console.error('API call failed:', error.message);
    console.error('Status code:', error.statusCode);
    console.error('Response:', error.responseBody);

    // Check common causes
    if (error.statusCode === 401) {
      // Invalid API key
    } else if (error.statusCode === 429) {
      // Rate limit - implement backoff
    } else if (error.statusCode >= 500) {
      // Provider issue - retry
    }
  }
}
```

**Prevention:**
- Validate API keys at startup
- Implement retry logic with exponential backoff
- Monitor rate limits
- Handle network errors gracefully

---

## Error #2: AI_NoObjectGeneratedError

**Cause:** Model didn't generate valid object matching schema.

**Solution:**
```typescript
import { AI_NoObjectGeneratedError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({ /* complex schema */ }),
    prompt: 'Generate data',
  });
} catch (error) {
  if (error instanceof AI_NoObjectGeneratedError) {
    console.error('No valid object generated');

    // Solutions:
    // 1. Simplify schema
    // 2. Add more context to prompt
    // 3. Provide examples in prompt
    // 4. Try different model (gpt-4 better than gpt-3.5 for complex objects)
  }
}
```

**Prevention:**
- Start with simple schemas, add complexity incrementally
- Include examples in prompt: "Generate a person like: { name: 'Alice', age: 30 }"
- Use GPT-4 for complex structured output
- Test schemas with sample data first

---

## Error #3: Worker Startup Limit (270ms+)

**Cause:** AI SDK v5 + Zod initialization overhead in Cloudflare Workers exceeds startup limits.

**Solution:**
```typescript
// BAD: Top-level imports cause startup overhead
import { createWorkersAI } from 'workers-ai-provider';
import { complexSchema } from './schemas';

const workersai = createWorkersAI({ binding: env.AI });

// GOOD: Lazy initialization inside handler
export default {
  async fetch(request, env) {
    const { createWorkersAI } = await import('workers-ai-provider');
    const workersai = createWorkersAI({ binding: env.AI });

    // Use workersai here
  }
}
```

**Prevention:**
- Move AI SDK imports inside route handlers
- Minimize top-level Zod schemas
- Monitor Worker startup time (must be <400ms)
- Use Wrangler's startup time reporting

**GitHub Issue:** Search for "Workers startup limit" in Vercel AI SDK issues

---

## Error #4: streamText Fails Silently

**Cause:** Stream errors can be swallowed by `createDataStreamResponse`.

**Status:** ✅ **RESOLVED** - Fixed in ai@4.1.22 (February 2025)

**Solution (Recommended):**
```typescript
// Use the onError callback (added in v4.1.22)
const stream = streamText({
  model: openai('gpt-4'),
  prompt: 'Hello',
  onError({ error }) {
    console.error('Stream error:', error);
    // Custom error logging and handling
  },
});

// Stream safely
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

**Alternative (Manual try-catch):**
```typescript
// Fallback if not using onError callback
try {
  const stream = streamText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  });

  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }
} catch (error) {
  console.error('Stream error:', error);
}
```

**Prevention:**
- **Use `onError` callback** for proper error capture (recommended)
- Implement server-side error monitoring
- Test stream error handling explicitly
- Always log on server side in production

**GitHub Issue:** #4726 (RESOLVED)

---

## Error #5: AI_LoadAPIKeyError

**Cause:** Missing or invalid API key.

**Solution:**
```typescript
import { AI_LoadAPIKeyError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_LoadAPIKeyError) {
    console.error('API key error:', error.message);

    // Check:
    // 1. .env file exists and loaded
    // 2. Correct env variable name (OPENAI_API_KEY)
    // 3. Key format is valid (starts with sk-)
  }
}
```

**Prevention:**
- Validate API keys at application startup
- Use environment variable validation (e.g., zod)
- Provide clear error messages in development
- Document required environment variables

---

## Error #6: AI_InvalidArgumentError

**Cause:** Invalid parameters passed to function.

**Solution:**
```typescript
import { AI_InvalidArgumentError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    maxOutputTokens: -1,  // Invalid!
    prompt: 'Hello',
  });
} catch (error) {
  if (error instanceof AI_InvalidArgumentError) {
    console.error('Invalid argument:', error.message);
    // Check parameter types and values
  }
}
```

**Prevention:**
- Use TypeScript for type checking
- Validate inputs before calling AI SDK functions
- Read function signatures carefully
- Check official docs for parameter constraints

---

## Error #7: AI_NoContentGeneratedError

**Cause:** Model generated no content (safety filters, etc.).

**Solution:**
```typescript
import { AI_NoContentGeneratedError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Some prompt',
  });
} catch (error) {
  if (error instanceof AI_NoContentGeneratedError) {
    console.error('No content generated');

    // Possible causes:
    // 1. Safety filters blocked output
    // 2. Prompt triggered content policy
    // 3. Model configuration issue

    // Handle gracefully:
    return { text: 'Unable to generate response. Please try different input.' };
  }
}
```

**Prevention:**
- Sanitize user inputs
- Avoid prompts that may trigger safety filters
- Have fallback messaging
- Log occurrences for analysis

---

## Error #8: AI_TypeValidationError

**Cause:** Zod schema validation failed on generated output.

**Solution:**
```typescript
import { AI_TypeValidationError } from 'ai';

try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: z.object({
      age: z.number().min(0).max(120),  // Strict validation
    }),
    prompt: 'Generate person',
  });
} catch (error) {
  if (error instanceof AI_TypeValidationError) {
    console.error('Validation failed:', error.message);

    // Solutions:
    // 1. Relax schema constraints
    // 2. Add more guidance in prompt
    // 3. Use .optional() for unreliable fields
  }
}
```

**Prevention:**
- Start with lenient schemas, tighten gradually
- Use `.optional()` for fields that may not always be present
- Add validation hints in field descriptions
- Test with various prompts

---

## Error #9: AI_RetryError

**Cause:** All retry attempts failed.

**Solution:**
```typescript
import { AI_RetryError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4'),
    prompt: 'Hello',
    maxRetries: 3,  // Default is 2
  });
} catch (error) {
  if (error instanceof AI_RetryError) {
    console.error('All retries failed');
    console.error('Last error:', error.lastError);

    // Check root cause:
    // - Persistent network issue
    // - Provider outage
    // - Invalid configuration
  }
}
```

**Prevention:**
- Investigate root cause of failures
- Adjust retry configuration if needed
- Implement circuit breaker pattern for provider outages
- Have fallback providers

---

## Error #10: Rate Limiting Errors

**Cause:** Exceeded provider rate limits (RPM/TPM).

**Solution:**
```typescript
// Implement exponential backoff
async function generateWithBackoff(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateText({
        model: openai('gpt-4'),
        prompt,
      });
    } catch (error) {
      if (error instanceof AI_APICallError && error.statusCode === 429) {
        const delay = Math.pow(2, i) * 1000;  // Exponential backoff
        console.log(`Rate limited, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Rate limit retries exhausted');
}
```

**Prevention:**
- Monitor rate limit headers
- Queue requests to stay under limits
- Upgrade provider tier if needed
- Implement request throttling

---

## Error #11: TypeScript Performance with Zod

**Cause:** Complex Zod schemas slow down TypeScript type checking.

**Solution:**
```typescript
// Instead of deeply nested schemas at top level:
// const complexSchema = z.object({ /* 100+ fields */ });

// Define inside functions or use type assertions:
function generateData() {
  const schema = z.object({ /* complex schema */ });
  return generateObject({ model: openai('gpt-4'), schema, prompt: '...' });
}

// Or use z.lazy() for recursive schemas:
type Category = { name: string; subcategories?: Category[] };
const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(CategorySchema).optional(),
  })
);
```

**Prevention:**
- Avoid top-level complex schemas
- Use `z.lazy()` for recursive types
- Split large schemas into smaller ones
- Use type assertions where appropriate

**Official Docs:**
https://ai-sdk.dev/docs/troubleshooting/common-issues/slow-type-checking

---

## Error #12: Invalid JSON Response (Provider-Specific)

**Cause:** Some models occasionally return invalid JSON.

**Solution:**
```typescript
// Use built-in retry and mode selection
const result = await generateObject({
  model: openai('gpt-4'),
  schema: mySchema,
  prompt: 'Generate data',
  mode: 'json',  // Force JSON mode (supported by GPT-4)
  maxRetries: 3,  // Retry on invalid JSON
});

// Or catch and retry manually:
try {
  const result = await generateObject({
    model: openai('gpt-4'),
    schema: mySchema,
    prompt: 'Generate data',
  });
} catch (error) {
  // Retry with different model
  const result = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: mySchema,
    prompt: 'Generate data',
  });
}
```

**Prevention:**
- Use `mode: 'json'` when available
- Prefer GPT-4 for structured output
- Implement retry logic
- Validate responses

**GitHub Issue:** #4302 (Imagen 3.0 Invalid JSON)

---

**For More Errors:**
See complete error reference at https://ai-sdk.dev/docs/reference/ai-sdk-errors

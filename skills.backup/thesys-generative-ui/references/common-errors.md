# Common Errors & Solutions

Complete troubleshooting guide for TheSys C1 Generative UI integration.

---

## 1. Empty Agent Responses

**Symptom**: AI returns empty responses, UI shows nothing or blank content.

**Causes**:
- Incorrect streaming transformation
- Response not properly extracted from API
- Empty content in stream chunks

**Solutions**:

```typescript
// ✅ Correct - use transformStream with fallback
import { transformStream } from "@crayonai/stream";

const c1Stream = transformStream(llmStream, (chunk) => {
  return chunk.choices[0]?.delta?.content || ""; // Empty string fallback
});

// ❌ Wrong - no fallback
const c1Stream = transformStream(llmStream, (chunk) => {
  return chunk.choices[0].delta.content; // May be undefined
});
```

**Verification**:
```bash
# Check API response format
curl -X POST https://api.thesys.dev/v1/embed/chat/completions \
  -H "Authorization: Bearer $THESYS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"c1/openai/gpt-5/v-20250930","messages":[{"role":"user","content":"test"}]}'
```

---

## 2. Model Not Following System Prompt

**Symptom**: AI ignores instructions, doesn't follow guidelines in system prompt.

**Cause**: System prompt is not first in messages array or formatted incorrectly.

**Solution**:

```typescript
// ✅ Correct - system prompt FIRST
const messages = [
  { role: "system", content: "You are a helpful assistant." }, // MUST BE FIRST
  ...conversationHistory,
  { role: "user", content: userPrompt },
];

// ❌ Wrong - system prompt after user messages
const messages = [
  { role: "user", content: "Hello" },
  { role: "system", content: "..." }, // TOO LATE
];

// ❌ Wrong - no system prompt at all
const messages = [
  { role: "user", content: userPrompt },
];
```

---

## 3. Version Compatibility Errors

**Symptom**: `TypeError: Cannot read property 'X' of undefined`, component crashes.

**Cause**: Mismatched package versions between SDK and API.

**Compatibility Matrix**:

| C1 API Version | @thesysai/genui-sdk | @crayonai/react-ui | @crayonai/react-core |
|----------------|--------------------|--------------------|---------------------|
| v-20250930     | ~0.6.40            | ~0.8.42            | ~0.7.6              |

**Solution**:

```bash
# Check current versions
npm list @thesysai/genui-sdk @crayonai/react-ui @crayonai/react-core

# Update to compatible versions (October 2025)
npm install @thesysai/genui-sdk@0.6.40 @crayonai/react-ui@0.8.42 @crayonai/react-core@0.7.6
```

---

## 4. Theme Not Applying

**Symptom**: UI components don't match custom theme, default styles persist.

**Cause**: Missing `ThemeProvider` wrapper.

**Solution**:

```typescript
// ❌ Wrong - no ThemeProvider
<C1Component c1Response={response} />

// ✅ Correct - wrapped with ThemeProvider
<ThemeProvider theme={customTheme}>
  <C1Component c1Response={response} />
</ThemeProvider>

// ✅ Also correct - for C1Chat
<C1Chat apiUrl="/api/chat" theme={customTheme} />
```

---

## 5. Streaming Not Working

**Symptom**: UI doesn't update in real-time, waits for full response.

**Causes**:
- `stream: false` in API call
- Missing proper headers
- Not passing `isStreaming` prop

**Solutions**:

```typescript
// 1. Enable streaming in API call
const stream = await client.chat.completions.create({
  model: "c1/openai/gpt-5/v-20250930",
  messages: [...],
  stream: true, // ✅ IMPORTANT
});

// 2. Set proper response headers (Next.js)
return new NextResponse(responseStream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  },
});

// 3. Pass isStreaming prop
<C1Component
  c1Response={response}
  isStreaming={true} // ✅ Shows loading indicator
  updateMessage={(msg) => setResponse(msg)}
/>
```

---

## 6. Tool Calling Failures

**Symptom**: Tools not executing, validation errors, or crashes.

**Causes**:
- Invalid Zod schema
- Missing descriptions
- Incorrect tool format
- Arguments not parsed correctly

**Solutions**:

```typescript
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

// ✅ Proper schema with descriptions
const toolSchema = z.object({
  query: z.string().describe("Search query"), // DESCRIBE all fields!
  limit: z.number().int().min(1).max(100).describe("Max results"),
});

// ✅ Convert to OpenAI format
const tool = {
  type: "function" as const,
  function: {
    name: "search_web",
    description: "Search the web for information", // Clear description
    parameters: zodToJsonSchema(toolSchema), // Convert schema
  },
};

// ✅ Validate incoming tool calls
try {
  const args = toolSchema.parse(JSON.parse(toolCall.function.arguments));
  const result = await executeTool(args);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation failed:", error.errors);
  }
}
```

---

## 7. Thread State Not Persisting

**Symptom**: Threads disappear on page refresh, conversation history lost.

**Cause**: Using in-memory storage instead of database.

**Solution**:

```typescript
// ❌ Wrong - loses data on restart
const messageStore = new Map<string, Message[]>();

// ✅ Correct - use database (D1 example)
import { db } from "./database";

export async function saveMessage(threadId: string, message: Message) {
  await db.insert(messages).values({
    threadId,
    role: message.role,
    content: message.content,
    createdAt: new Date(),
  });
}

export async function getThreadMessages(threadId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.createdAt);
}
```

---

## 8. CSS Conflicts

**Symptom**: Styles from C1 components clash with app styles, layout breaks.

**Cause**: CSS import order or global styles overriding.

**Solution**:

```typescript
// ✅ Correct import order
import "@crayonai/react-ui/styles/index.css"; // C1 styles FIRST
import "./your-app.css"; // Your styles SECOND

// In your CSS, use specificity if needed
.your-custom-class .c1-message {
  /* Override specific styles */
  background-color: var(--custom-bg);
}

// Avoid global overrides
/* ❌ Wrong - too broad */
* {
  margin: 0;
  padding: 0;
}

/* ✅ Better - scoped */
.app-container * {
  margin: 0;
  padding: 0;
}
```

---

## 9. TypeScript Type Errors

**Symptom**: TypeScript complains about missing types or incompatible types.

**Solutions**:

```bash
# 1. Update packages
npm install @thesysai/genui-sdk@latest @crayonai/react-ui@latest

# 2. Check tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // or "node16"
    "skipLibCheck": true, // Skip type checking for node_modules
    "types": ["vite/client", "node"]
  }
}

# 3. If still errors, regenerate types
rm -rf node_modules package-lock.json
npm install
```

---

## 10. CORS Errors

**Symptom**: `Access-Control-Allow-Origin` errors when calling API.

**Solutions**:

```typescript
// Next.js API Route
export async function POST(req: NextRequest) {
  const response = new NextResponse(stream, {
    headers: {
      "Access-Control-Allow-Origin": "*", // Or specific domain
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
  return response;
}

// Express
import cors from "cors";
app.use(cors({
  origin: "http://localhost:5173", // Your frontend URL
  methods: ["POST", "OPTIONS"],
}));

// Cloudflare Workers (Hono)
import { cors } from "hono/cors";
app.use("/*", cors({
  origin: "*",
  allowMethods: ["POST", "OPTIONS"],
}));
```

---

## 11. Rate Limiting Issues

**Symptom**: API calls fail with 429 errors, no retry mechanism.

**Solution**:

```typescript
async function callApiWithRetry(
  apiCall: () => Promise<any>,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
}

// Usage
const response = await callApiWithRetry(() =>
  client.chat.completions.create({...})
);
```

---

## 12. Authentication Token Errors

**Symptom**: `401 Unauthorized` even with API key set.

**Solutions**:

```bash
# 1. Verify environment variable is set
echo $THESYS_API_KEY  # Should show your key

# 2. Check .env file location and format
# .env (in project root)
THESYS_API_KEY=your_api_key_here

# 3. For Vite, use VITE_ prefix for client-side
VITE_THESYS_API_KEY=your_key # Client-side
THESYS_API_KEY=your_key      # Server-side

# 4. For Cloudflare Workers, use secrets
npx wrangler secret put THESYS_API_KEY

# 5. Verify in code
if (!process.env.THESYS_API_KEY) {
  throw new Error("THESYS_API_KEY is not set");
}
```

---

## 13. Invalid Model ID Error

**Symptom**: API returns 400 error: "Model not found" or "Invalid model ID".

**Causes**:
- Using outdated model version identifier
- Typo in model name
- Using deprecated model
- Wrong prefix (`c1/` vs `c1-exp/`)

**Solutions**:

```typescript
// ❌ Wrong - old version
model: "c1/anthropic/claude-sonnet-4/v-20250617"

// ✅ Correct - current stable version (as of Oct 2025)
model: "c1/anthropic/claude-sonnet-4/v-20250930"

// ❌ Wrong - non-existent models
model: "c1/openai/gpt-5-mini"  // Doesn't exist
model: "c1/openai/gpt-4o"      // Not available via C1

// ✅ Correct - actual models
model: "c1/openai/gpt-5/v-20250930"  // GPT 5 stable
model: "c1-exp/openai/gpt-4.1/v-20250617"  // GPT 4.1 experimental

// ❌ Wrong - deprecated
model: "c1/anthropic/claude-sonnet-3-5"
model: "c1/anthropic/claude-3.7-sonnet"

// ✅ Correct - current stable
model: "c1/anthropic/claude-sonnet-4/v-20250930"
```

**Current Stable Models** (October 2025):

| Provider | Model ID | Status |
|----------|----------|--------|
| Anthropic | `c1/anthropic/claude-sonnet-4/v-20250930` | ✅ Stable |
| OpenAI | `c1/openai/gpt-5/v-20250930` | ✅ Stable |
| OpenAI | `c1-exp/openai/gpt-4.1/v-20250617` | ⚠️ Experimental |
| Anthropic | `c1-exp/anthropic/claude-3.5-haiku/v-20250709` | ⚠️ Experimental |

**How to Find Latest Models**:
1. Visit [TheSys Playground](https://console.thesys.dev/playground)
2. Check the model dropdown for current versions
3. Look for `v-YYYYMMDD` format in the model ID
4. Prefer stable (`c1/`) over experimental (`c1-exp/`) for production

**Verification**:
```bash
# Test if model ID works
curl -X POST https://api.thesys.dev/v1/embed/chat/completions \
  -H "Authorization: Bearer $THESYS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "c1/anthropic/claude-sonnet-4/v-20250930",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## Debugging Checklist

When encountering issues:

- [ ] Check package versions match compatibility matrix
- [ ] Verify API key is set and correct
- [ ] Inspect network tab for actual API responses
- [ ] Check console for errors and warnings
- [ ] Verify streaming is enabled (`stream: true`)
- [ ] Confirm ThemeProvider is wrapping components
- [ ] Check message array format (system first)
- [ ] Validate Zod schemas have descriptions
- [ ] Test with minimal example first
- [ ] Check official TheSys docs for updates

---

## Getting Help

1. **Official Docs**: https://docs.thesys.dev
2. **Playground**: https://console.thesys.dev/playground
3. **GitHub Issues**: Search for similar errors
4. **Context7**: Use `/websites/thesys_dev` for latest docs

---

**Last Updated**: 2025-10-26

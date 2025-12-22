# Type Safety Cheatsheet (TanStack AI)

## Per-model options
Use adapter typings to guard options:
```ts
const ai = openai()
chat({
  adapter: ai,
  model: 'gpt-4o',           // type-checked
  maxTokens: 200,            // allowed
  // temperature: 'high',    // ❌ would fail TS
})
```

## Zod for tools
```ts
const def = toolDefinition({
  name: 'createNote',
  inputSchema: z.object({
    title: z.string().min(3),
    content: z.string().max(2000),
  }),
})
```
Benefits: consistent validation across providers; clear error messages back to the model.

## Output shapes
Return objects with discriminated unions:
```ts
return { ok: true, noteId }
// or
return { ok: false, reason: 'NotFound' as const }
```
Helps the model branch correctly and avoids exceptions mid-stream.

## Multimodal payloads
- OpenAI/Anthropic: send `parts` array with `type: 'image' | 'text'`.  
- Gemini: ensure correct MIME (`image/png`, `audio/wav`).  
- Validate file size client-side before sending to avoid provider limits.

## Narrowing helpers
When sharing code across adapters, add small type guards:
```ts
function isOpenAI(adapter: Adapter): adapter is ReturnType<typeof openai> {
  return 'apiKey' in adapter
}
```
Gate provider-specific options inside these branches.

## Agent loop guards
Type the strategy:
```ts
agentLoopStrategy: maxIterations(8)
```
Prevents accidental infinite loops at runtime.

## Linting tips
- Enable `no-floating-promises` for tool implementations.
- Use `@typescript-eslint/consistent-type-imports`.
- Strict mode on (`"strict": true` in tsconfig).

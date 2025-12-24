# useObject Hook - Complete Reference

**Purpose**: Stream structured JSON data with Zod schema validation. Generate forms, structured outputs, or typed data with live updates as the AI streams.

**Use When**: Building UIs that need to display structured data as it's being generated (recipes, forms, product specs, etc.) with TypeScript type safety.

---

## useObject Hook - Complete Reference

### Basic Usage

Stream structured data (e.g., forms, JSON objects) with live updates:

```tsx
'use client';
import { useObject } from 'ai/react';
import { z } from 'zod';

const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
  }),
});

export default function RecipeGenerator() {
  const { object, submit, isLoading, error } = useObject({
    api: '/api/recipe',
    schema: recipeSchema,
  });

  return (
    <div>
      <button onClick={() => submit({ prompt: 'pasta carbonara' })} disabled={isLoading}>
        Generate Recipe
      </button>

      {isLoading && <div>Generating recipe...</div>}

      {object?.recipe && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold">{object.recipe.name}</h2>

          <h3 className="text-xl mt-4">Ingredients:</h3>
          <ul>
            {object.recipe.ingredients?.map((ingredient, idx) => (
              <li key={idx}>{ingredient}</li>
            ))}
          </ul>

          <h3 className="text-xl mt-4">Instructions:</h3>
          <ol>
            {object.recipe.instructions?.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
```

### Full API Reference

```typescript
const {
  object,             // Partial<T> - Partial object (updates as stream progresses)
  submit,             // (input: object) => void - Trigger generation
  isLoading,          // boolean - Is generating?
  error,              // Error | undefined - Error if any
  stop,               // () => void - Stop generation
} = useObject({
  api: '/api/object',
  schema: zodSchema,  // Zod schema

  // Callbacks
  onFinish: (object) => {},
  onError: (error) => {},
});
```

### API Route for useObject

```typescript
// app/api/recipe/route.ts
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: openai('gpt-4'),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        instructions: z.array(z.string()),
      }),
    }),
    prompt: `Generate a recipe for ${prompt}`,
  });

  return result.toTextStreamResponse();
}
```

---

**Related References**:
- `references/hooks-api-full.md` - Comparison with useChat and useCompletion
- `references/streaming-apis.md` - Server-side streamObject implementation
- `references/best-practices.md` - Schema design and validation patterns
- `references/error-handling.md` - Schema validation error handling

# Customization Guide

How to customize this scaffold for your needs.

---

## 1. Project Name

Update in:
- `package.json` → `name`
- `wrangler.jsonc` → `name`
- `SCRATCHPAD.md` → Project name
- `CLAUDE.md` → Project name

Or use: `./scripts/setup-project.sh <name>` (does this automatically)

---

## 2. Remove Unused Services

Example: Don't need Vectorize?

1. Delete from `wrangler.jsonc`:
```jsonc
// Remove this section
"vectorize": [
  {
    "binding": "VECTORIZE",
    "index_name": "my-app-index"
  }
]
```

2. Delete from `vite.config.ts`:
```typescript
// Remove this binding
VECTORIZE: {
  type: 'vectorize',
  indexName: 'my-app-index',
},
```

3. Update type definition in `backend/src/index.ts`:
```typescript
type Bindings = {
  // Remove VECTORIZE: VectorizeIndex
}
```

---

## 3. Customize Theme

Edit `src/index.css`:

```css
:root {
  --primary: hsl(220 90% 56%);  /* Change your primary color */
  --background: hsl(0 0% 100%); /* Change background */
}
```

---

## 4. Add UI Components

Ask Claude Code:
```
Use the tailwind-v4-shadcn skill to add Button, Card, Dialog, and Input components
```

---

## 5. Add API Routes

Ask Claude Code:
```
Use the cloudflare-full-stack-integration skill to create:
- D1 CRUD routes for users
- KV caching routes
- R2 file upload routes
```

---

## 6. Customize Database Schema

Edit `schema.sql` and `migrations/0001_initial.sql` for your tables.

Then apply:
```bash
npm run d1:local
```

---

## 7. Add New Pages

1. Create in `src/pages/`
2. Add route in `src/App.tsx`
3. Document in `docs/UI_COMPONENTS.md`

---

## 8. Enable Optional Features

**Authentication**:
```bash
npm run enable-auth
```

**AI Chat**:
```bash
npm run enable-ai-chat
```

**Queues (Async Processing)**:
```bash
npm run enable-queues
```

**Vectorize (Vector Search & RAG)**:
```bash
npm run enable-vectorize
```

---

## Advanced Customization Patterns

Detailed examples for common customizations beyond the basics.

---

### Complete Service Removal

**Example: Removing Vectorize entirely**

When you don't need a service, clean removal prevents unused bindings:

1. Delete backend route file: `backend/routes/vectorize.ts`
2. Remove binding from `wrangler.jsonc`:
```jsonc
// Delete this entire section
"vectorize": [
  {
    "binding": "VECTORIZE",
    "index_name": "my-app-index"
  }
]
```
3. Remove from `vite.config.ts` cloudflare plugin configuration
4. Remove route registration in `backend/src/index.ts`:
```typescript
// Delete this line
app.route('/api/vectorize', vectorizeRoutes)
```

**Repeat for any service**: KV, R2, Queues, Workers AI, etc.

---

### Creating Custom API Routes

Complete working example with Hono:

```typescript
// backend/routes/my-feature.ts
import { Hono } from 'hono'

export const myFeatureRoutes = new Hono()

myFeatureRoutes.get('/hello', (c) => {
  return c.json({ message: 'Hello from my feature!' })
})

myFeatureRoutes.post('/data', async (c) => {
  const body = await c.req.json()
  // Your logic here
  return c.json({ success: true, data: body })
})

// backend/src/index.ts
import { myFeatureRoutes } from './routes/my-feature'
app.route('/api/my-feature', myFeatureRoutes)
```

**Test your route**: `http://localhost:5173/api/my-feature/hello`

---

### Switching AI Providers

The AI SDK v5 makes provider switching effortless - **one line change**:

```typescript
// backend/routes/ai.ts

// OpenAI (default)
model: openai('gpt-4o'),

// Anthropic Claude
model: anthropic('claude-sonnet-4-5'),

// Google Gemini
model: google('gemini-2.5-flash'),

// Cloudflare Workers AI (no API key needed!)
const workersai = createWorkersAI({ binding: c.env.AI })
model: workersai('@cf/meta/llama-3-8b-instruct'),
```

All providers use the same AI SDK interface - change one line, everything else stays the same!

---

### Advanced Theme System

Complete CSS variable system in `src/index.css`:

```css
:root {
  /* Semantic color system */
  --background: hsl(0 0% 100%);    /* Page background */
  --foreground: hsl(0 0% 3.9%);    /* Text color */
  --primary: hsl(220 90% 56%);     /* ← Your brand color */
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(220 14.3% 95.9%);
  --secondary-foreground: hsl(220.9 39.3% 11%);
  --muted: hsl(220 14.3% 95.9%);
  --muted-foreground: hsl(220 8.9% 46.1%);
  --accent: hsl(220 14.3% 95.9%);
  --accent-foreground: hsl(220.9 39.3% 11%);
  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(0 0% 98%);
  --border: hsl(220 13% 91%);
  --input: hsl(220 13% 91%);
  --ring: hsl(220 90% 56%);
  --radius: 0.5rem;  /* Border radius for all components */
}

/* Dark mode (optional) */
.dark {
  --background: hsl(220 10% 3.9%);
  --foreground: hsl(0 0% 98%);
  --primary: hsl(220 90% 56%);
  /* ... other dark mode overrides */
}
```

**Pro tip**: Change `--primary` to your brand color - all components update automatically!

---

### Adding New Frontend Pages

Step-by-step process:

**1. Create page component** in `src/pages/`:
```typescript
// src/pages/MyNewPage.tsx
export function MyNewPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">My New Page</h1>
      {/* Your content here */}
    </div>
  )
}
```

**2. Add route** in `src/App.tsx`:
```typescript
import { MyNewPage } from './pages/MyNewPage'

// In your Routes:
<Route path="/my-page" element={<MyNewPage />} />
```

**3. Add navigation** (optional) in your navigation component

**4. Document** in `docs/UI_COMPONENTS.md` for team reference

---

## See Also

- **`architecture-patterns.md`**: Critical patterns for frontend-backend connection, CORS, auth
- **`full-stack-patterns.md`**: Industry-standard patterns for forms, validation, data fetching
- **`enabling-auth.md`**: Complete Clerk authentication setup
- **`service-configuration.md`**: Detailed service binding configuration

---

**Last Updated**: 2025-12-09
**Scaffold Version**: 1.0.0
**Maintained By**: cloudflare-full-stack-scaffold skill

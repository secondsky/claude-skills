# Quick Start Guide

Get your Cloudflare full-stack app running in 5 minutes.

---

## 1. Copy Scaffold

```bash
cp -r /path/to/scaffold/ my-new-app/
cd my-new-app/
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Initialize Core Services

```bash
npx wrangler d1 create my-app-db
npx wrangler kv:namespace create my-app-kv
npx wrangler r2 bucket create my-app-bucket
```

Update `wrangler.jsonc` with the IDs.

**Note**: Queues and Vectorize are optional. Enable them later with `npm run enable-queues` or `npm run enable-vectorize`.

## 4. Create Database Tables

```bash
npm run d1:local
```

## 5. Start Development

```bash
npm run dev
```

Visit: http://localhost:5173

---

## Next Steps

### Add UI Components

Ask Claude Code:
```
Use the tailwind-v4-shadcn skill to add Button, Card, and Dialog components
```

### Add API Routes

Ask Claude Code:
```
Use the cloudflare-full-stack-integration skill to create D1 CRUD routes
```

### Enable Optional Features

**Authentication**:
```bash
npm run enable-auth
```

**AI Chat Interface**:
```bash
npm run enable-ai-chat
```

**Queues (Async Processing)**:
```bash
npm run enable-queues
# Then create queue: npx wrangler queues create my-app-queue
```

**Vectorize (Vector Search)**:
```bash
npm run enable-vectorize
# Then create index: npx wrangler vectorize create my-app-index --dimensions=768
```

---

## Deployment

```bash
npm run build
npx wrangler deploy
npm run d1:remote  # Apply schema to production
npx wrangler secret put CLERK_SECRET_KEY
```

---

See `INSTALL.md` for detailed setup instructions.

## 6. Working with Forms & Data

### Creating a Form with Validation

**1. Define Shared Schema** (`shared/schemas/mySchema.ts`):
```typescript
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ContactForm = z.infer<typeof contactSchema>
```

**2. Create Form Component**:
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { contactSchema } from '@/shared/schemas/mySchema'

function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
  })

  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/forms/contact', data),
    onSuccess: () => alert('Submitted!'),
  })

  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <textarea {...register('message')} />
      {errors.message && <span>{errors.message.message}</span>}

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
```

**3. Add Backend Route** (`backend/routes/forms.ts`):
```typescript
import { contactSchema } from '../../shared/schemas/mySchema'

app.post('/contact', async (c) => {
  const body = await c.req.json()
  const validated = contactSchema.parse(body) // Same schema!
  // Process form...
  return c.json({ success: true })
})
```

### Fetching Data with TanStack Query

**Simple Query**:
```tsx
import { useQuery } from '@tanstack/react-query'

function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/api/users'),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{data.map(user => <div key={user.id}>{user.name}</div>)}</div>
}
```

**See Complete Examples**:
- Profile page with form: Visit `/profile` in running app
- Dashboard with queries: Visit `/dashboard`
- Full guide: `references/supporting-libraries-guide.md`


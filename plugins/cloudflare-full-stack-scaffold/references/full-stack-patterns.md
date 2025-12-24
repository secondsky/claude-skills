# Full-Stack Development Patterns

Industry-standard patterns for forms, data fetching, validation, and AI chat interfaces used in the cloudflare-full-stack-scaffold.

**Last Updated**: 2025-12-09

---

## Table of Contents

1. [Overview](#overview)
2. [React Hook Form Patterns](#react-hook-form-patterns)
3. [Zod v4 Validation Patterns](#zod-v4-validation-patterns)
4. [TanStack Query v5 Patterns](#tanstack-query-v5-patterns)
5. [Full-Stack Validation Pattern](#full-stack-validation-pattern)
6. [AI Chat Interface Pattern (AI SDK v5)](#ai-chat-interface-pattern-ai-sdk-v5)
7. [Complete Working Examples](#complete-working-examples)

---

## Overview

This scaffold uses **industry-standard libraries** for production applications:

- **React Hook Form** - Performant form state management with minimal re-renders
- **Zod v4** - TypeScript-first schema validation (shared frontend + backend)
- **TanStack Query v5** - Smart data fetching, caching, and state management
- **AI SDK v5** - Modern AI chat interfaces with streaming support

These libraries work together to create a **full-stack validation pattern** where you define schemas once and use them everywhere.

---

## React Hook Form Patterns

### Why React Hook Form?

React Hook Form provides:
- **Performance**: Minimal re-renders (uncontrolled components)
- **DX**: Simple API with excellent TypeScript support
- **Validation**: Integrates with Zod via resolver
- **Bundle Size**: Tiny footprint (~9KB)

### Basic Pattern

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Define schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().int().positive().optional(),
})

type User = z.infer<typeof userSchema>

function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<User>({
    resolver: zodResolver(userSchema), // ← Zod integration
  })

  const onSubmit = (data: User) => {
    console.log('Validated data:', data)
    // Data is guaranteed to match schema
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span className="error">{errors.name.message}</span>}

      <input type="email" {...register('email')} />
      {errors.email && <span className="error">{errors.email.message}</span>}

      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <span className="error">{errors.age.message}</span>}

      <button type="submit">Submit</button>
    </form>
  )
}
```

### Key Features

**Instant Validation**:
```tsx
const form = useForm({
  mode: 'onChange', // Validate on every change
  resolver: zodResolver(userSchema),
})
```

**Default Values**:
```tsx
const form = useForm({
  defaultValues: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  resolver: zodResolver(userSchema),
})
```

**Watch Field Changes**:
```tsx
const { watch } = useForm()
const nameValue = watch('name') // ← Reactive to changes
```

---

## Zod v4 Validation Patterns

### Schema Definition

**Basic Types**:
```typescript
import { z } from 'zod'

const userSchema = z.object({
  // Strings
  name: z.string().min(2).max(100),
  email: z.string().email(),
  username: z.string().regex(/^[a-z0-9_]+$/),

  // Numbers
  age: z.number().int().positive().optional(),
  score: z.number().min(0).max(100),

  // Booleans
  isActive: z.boolean(),

  // Dates
  createdAt: z.date(),
  birthDate: z.string().datetime(),

  // Enums
  role: z.enum(['admin', 'user', 'guest']),

  // Arrays
  tags: z.array(z.string()),

  // Nested objects
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string().length(5),
  }),

  // Optional fields
  bio: z.string().optional(),

  // Nullable fields
  deletedAt: z.date().nullable(),
})
```

**Custom Validation**:
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // Error attached to confirmPassword field
})
```

### Type Inference

**Infer TypeScript Types from Schemas**:
```typescript
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
})

// Automatically inferred:
type User = z.infer<typeof userSchema>
// ↓
// type User = {
//   name: string
//   email: string
//   age?: number
// }
```

### Frontend Usage

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const form = useForm({
  resolver: zodResolver(userSchema), // ← Instant validation
})
```

### Backend Usage

```typescript
import { Hono } from 'hono'
import { userSchema } from '../../shared/schemas/userSchema'

const app = new Hono()

app.post('/api/users', async (c) => {
  const body = await c.req.json()

  try {
    const validated = userSchema.parse(body) // ← Throws if invalid
    // validated is typed as User

    // Safe to use validated data
    await db.insert(users).values(validated)
    return c.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ errors: error.errors }, 400)
    }
    throw error
  }
})
```

---

## TanStack Query v5 Patterns

### Data Fetching

**Basic Query**:
```typescript
import { useQuery } from '@tanstack/react-query'

function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'], // ← Cache key
    queryFn: async () => {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

**With Parameters**:
```typescript
const { data } = useQuery({
  queryKey: ['user', userId], // ← Include params in cache key
  queryFn: async () => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  },
})
```

### Mutations

**Basic Mutation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateUser() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (newUser) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return (
    <button onClick={() => mutation.mutate({ name: 'John', email: 'john@example.com' })}>
      Create User
    </button>
  )
}
```

**Optimistic Updates**:
```typescript
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (updatedUser) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users'] })

    // Snapshot previous value
    const previousUsers = queryClient.getQueryData(['users'])

    // Optimistically update
    queryClient.setQueryData(['users'], (old) =>
      old.map(user => user.id === updatedUser.id ? updatedUser : user)
    )

    return { previousUsers }
  },
  onError: (err, updatedUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['users'], context.previousUsers)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

### Query Keys Best Practices

```typescript
// ✅ GOOD: Hierarchical keys
['users'] // All users
['users', 'list'] // User list
['users', 'list', { status: 'active' }] // Filtered list
['users', 'detail', userId] // Single user
['users', 'detail', userId, 'posts'] // User's posts

// ❌ BAD: Flat keys
['allUsers']
['activeUsers']
['userById123']
```

---

## Full-Stack Validation Pattern

### Single Source of Truth

The key pattern: **Define schema once, use everywhere**.

**Step 1: Define Schema in Shared Location**

```typescript
// shared/schemas/userSchema.ts
import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().int().positive().optional(),
})

export type User = z.infer<typeof userSchema>
```

**Step 2: Use in Frontend (React Hook Form)**

```tsx
// src/components/UserForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, type User } from '@/shared/schemas/userSchema'

function UserForm() {
  const form = useForm<User>({
    resolver: zodResolver(userSchema), // ✅ Instant validation
  })

  const onSubmit = (data: User) => {
    // data is validated and typed
    fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  )
}
```

**Step 3: Use in Backend (Hono)**

```typescript
// backend/routes/users.ts
import { Hono } from 'hono'
import { userSchema } from '../../shared/schemas/userSchema'

const app = new Hono()

app.post('/api/users', async (c) => {
  const body = await c.req.json()
  const validated = userSchema.parse(body) // ✅ Security validation

  // validated is typed as User, guaranteed to match schema
  await db.insert(users).values(validated)
  return c.json({ success: true })
})

export default app
```

### Benefits

✅ **Update validation once, applies everywhere**
- Change `min(2)` to `min(3)` in schema → frontend and backend both enforce it

✅ **TypeScript types inferred automatically**
- No need to manually maintain type definitions

✅ **Frontend validates instantly**
- Better UX: users see errors immediately

✅ **Backend validates securely**
- Security: clients can't bypass validation

✅ **Prevents data inconsistency**
- Frontend and backend always agree on valid data shape

### Directory Structure

```
my-app/
├── shared/
│   └── schemas/
│       ├── userSchema.ts      # Shared across frontend + backend
│       ├── postSchema.ts
│       └── index.ts           # Export all schemas
├── src/                       # Frontend
│   └── components/
│       └── UserForm.tsx       # Uses userSchema
└── backend/                   # Backend
    └── routes/
        └── users.ts           # Uses userSchema (same file!)
```

---

## AI Chat Interface Pattern (AI SDK v5)

### Modern Chat with useChat Hook

**AI SDK v5 introduces a new UI layer** with React hooks for chat interfaces.

**Key Differences from v4**:
- Uses `message.parts[]` instead of `message.content` (multi-part messages)
- `DefaultChatTransport` for backend communication
- `status` instead of `isLoading` (more granular states)
- Better TypeScript support

### Complete Chat Interface Example

```tsx
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

function ChatInterface() {
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai-sdk/chat', // ← Backend endpoint
    }),
  })

  // Send message on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && status === 'ready' && input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="chat-container">
      {/* Message List */}
      <div className="messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            {/* Render message parts (v5 format) */}
            {message.parts.map((part, idx) => {
              if (part.type === 'text') {
                return <div key={idx}>{part.text}</div>
              }
              // Handle other part types (images, tool calls, etc.)
              return null
            })}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={status !== 'ready'}
          placeholder={status === 'ready' ? 'Type a message...' : 'Sending...'}
        />
        <button
          onClick={() => {
            if (status === 'ready' && input.trim()) {
              sendMessage({ text: input })
              setInput('')
            }
          }}
          disabled={status !== 'ready'}
        >
          {status === 'streaming' ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
```

### Backend Chat Endpoint

```typescript
// backend/routes/ai-sdk.ts
import { Hono } from 'hono'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

const app = new Hono()

app.post('/api/ai-sdk/chat', async (c) => {
  const { messages } = await c.req.json()

  const result = streamText({
    model: openai('gpt-4o'), // ← Switch providers in 1 line
    messages,
  })

  return result.toDataStreamResponse()
})

export default app
```

### Status States

```typescript
const { status } = useChat()

// status can be:
// - 'ready': Ready to send messages
// - 'streaming': Receiving response from AI
// - 'error': Error occurred
```

### Message Parts (v5 Format)

```typescript
// v5 uses message.parts[] for multi-part messages
message.parts.forEach(part => {
  if (part.type === 'text') {
    // Text content
    console.log(part.text)
  } else if (part.type === 'tool-call') {
    // Tool/function call
    console.log(part.toolName, part.args)
  } else if (part.type === 'tool-result') {
    // Tool result
    console.log(part.result)
  }
})
```

### Provider Switching

**One-line change** to switch AI providers:

```typescript
// Option 1: Workers AI (no API key, runs on Cloudflare)
import { createWorkersAI } from 'workers-ai-provider'
const workersai = createWorkersAI({ binding: c.env.AI })
model: workersai('@cf/meta/llama-3-8b-instruct')

// Option 2: OpenAI
import { openai } from '@ai-sdk/openai'
model: openai('gpt-4o')

// Option 3: Anthropic
import { anthropic } from '@ai-sdk/anthropic'
model: anthropic('claude-sonnet-4-5')

// Option 4: Google Gemini
import { google } from '@ai-sdk/google'
model: google('gemini-2.5-flash')
```

---

## Complete Working Examples

### Form Component

**File**: `/Users/eddie/github-repos/claude-skills/skills/cloudflare-full-stack-scaffold/scaffold/src/components/UserProfileForm.tsx`

**Contains**:
- React Hook Form with Zod validation
- TanStack Query mutation for submitting
- Error handling and loading states
- Optimistic updates

### Form Page

**File**: `/Users/eddie/github-repos/claude-skills/skills/cloudflare-full-stack-scaffold/scaffold/src/pages/Profile.tsx`

**Contains**:
- Complete form integration
- Data fetching with `useQuery`
- Mutation with `useMutation`
- Success and error toasts

### Dashboard with Queries

**File**: `/Users/eddie/github-repos/claude-skills/skills/cloudflare-full-stack-scaffold/scaffold/src/pages/Dashboard.tsx`

**Contains**:
- Multiple queries running in parallel
- Dependent queries (fetch B after A completes)
- Loading and error states
- Query key patterns

### Backend Validation

**File**: `/Users/eddie/github-repos/claude-skills/skills/cloudflare-full-stack-scaffold/scaffold/backend/routes/forms.ts`

**Contains**:
- Zod validation on backend
- Error response handling (400 with Zod errors)
- Type-safe request/response
- D1 database integration

### Shared Schemas

**File**: `/Users/eddie/github-repos/claude-skills/skills/cloudflare-full-stack-scaffold/scaffold/shared/schemas/userSchema.ts`

**Contains**:
- Shared validation schemas
- TypeScript type inference
- Reusable across frontend and backend
- Custom validation rules

### Chat Interface

**File**: `/Users/eddie/github-repos/claude-skills/skills/cloudflare-full-stack-scaffold/scaffold/src/components/ChatInterface.tsx`

**Contains**:
- AI SDK v5 `useChat` hook
- Message rendering with `parts[]`
- Streaming support
- Input handling and status management

---

## See Also

- **`supporting-libraries-guide.md`**: Complete documentation for React Hook Form, Zod, TanStack Query with troubleshooting
- **`ai-sdk-guide.md`**: AI SDK Core patterns, provider comparison, streaming, tool calling, RAG
- **`project-overview.md`**: Complete scaffold structure and helper scripts

---

**Last Updated**: 2025-12-09
**Scaffold Version**: 1.0.0
**AI SDK Version**: v5.0.98
**Maintained By**: cloudflare-full-stack-scaffold skill

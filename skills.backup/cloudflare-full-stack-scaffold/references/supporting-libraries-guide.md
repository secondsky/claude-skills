# Supporting Libraries Guide

This scaffold uses **industry-standard libraries** for forms, validation, and data fetching:

- **Zod v4** - TypeScript-first schema validation
- **React Hook Form** - Performant form state management
- **TanStack Query v5** - Powerful data fetching and caching

---

## Why These Libraries?

### Zod v4
- ✅ **Type-safe**: Infer TypeScript types from schemas
- ✅ **Shareable**: Same schema for frontend + backend validation
- ✅ **Performant**: 14.7x faster string parsing vs v3
- ✅ **Composable**: Build complex schemas from simple ones

### React Hook Form
- ✅ **Fast**: Minimal re-renders, uncontrolled inputs
- ✅ **Small**: ~9KB gzipped
- ✅ **DX**: Intuitive API, great TypeScript support
- ✅ **Flexible**: Works with any UI library

### TanStack Query
- ✅ **Caching**: Smart automatic caching
- ✅ **Background updates**: Keeps data fresh
- ✅ **Optimistic updates**: Better UX
- ✅ **DevTools**: Excellent debugging

---

## Table of Contents

1. [Zod v4 Schemas](#zod-v4-schemas)
2. [React Hook Form](#react-hook-form)
3. [TanStack Query](#tanstack-query)
4. [Full-Stack Validation Pattern](#full-stack-validation-pattern)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)

---

## Zod v4 Schemas

### Basic Schema Definition

```typescript
import { z } from 'zod'

// Define schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().int().positive().min(13).max(120).optional(),
  role: z.enum(['user', 'admin', 'moderator']),
  notifications: z.boolean().default(true),
})

// Infer TypeScript type
type User = z.infer<typeof userSchema>
```

### Zod v4 Breaking Changes

**String Methods → Top-Level Functions** (Not used in this scaffold):
```typescript
// ❌ Old (v3)
z.string().email()
z.string().url()
z.string().uuid()

// ✅ New (v4)
z.email()
z.url()
z.uuid()
```

**Error Customization**:
```typescript
// ❌ Old (v3)
z.string({ message: "Must be a string" })

// ✅ New (v4)
z.string({ error: "Must be a string" })
```

### Validation Methods

```typescript
const schema = z.object({
  // String constraints
  username: z.string().min(3).max(20),

  // Number constraints
  age: z.number().int().positive().min(13).max(120),

  // Email (still uses .email() method)
  email: z.string().email(),

  // Enums
  role: z.enum(['user', 'admin']),

  // Optional fields
  bio: z.string().max(500).optional(),

  // Default values
  notifications: z.boolean().default(true),

  // Arrays
  tags: z.array(z.string()).min(1).max(10),

  // Nested objects
  address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string().length(5),
  }).optional(),
})
```

### Custom Refinements

```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (val) => /[A-Z]/.test(val),
    'Password must contain an uppercase letter'
  )
  .refine(
    (val) => /[0-9]/.test(val),
    'Password must contain a number'
  )
```

---

## React Hook Form

### Basic Setup

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  const onSubmit = async (data) => {
    // Data is validated and typed!
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  )
}
```

### Field Types

```typescript
// Text input
<input {...register('name')} />

// Number input (convert string to number)
<input {...register('age', { valueAsNumber: true })} type="number" />

// Checkbox
<input {...register('notifications')} type="checkbox" />

// Select
<select {...register('role')}>
  <option value="user">User</option>
  <option value="admin">Admin</option>
</select>

// Textarea
<textarea {...register('bio')} />
```

### Form State

```typescript
const {
  formState: {
    errors,        // Validation errors
    isSubmitting,  // Submission in progress
    isDirty,       // Form has changes
    isValid,       // No validation errors
    touchedFields, // Fields user interacted with
  },
} = useForm()
```

---

## TanStack Query

### Setup (Already Done in `main.tsx`)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### useQuery - Fetching Data

```typescript
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/api/users')
      return response.users
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data.map(user => <div key={user.id}>{user.name}</div>)}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  )
}
```

### useMutation - Updating Data

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (newUser) => {
      return await apiClient.post('/api/users', newUser)
    },
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      alert('Error: ' + error.message)
    },
  })

  return (
    <button
      onClick={() => mutation.mutate({ name: 'John' })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Creating...' : 'Create User'}
    </button>
  )
}
```

### Query Keys

Query keys uniquely identify queries for caching:

```typescript
// Static key
queryKey: ['users']

// Dynamic key (with parameter)
queryKey: ['user', userId]

// Complex key (multiple parameters)
queryKey: ['users', { status: 'active', page: 1 }]
```

---

## Full-Stack Validation Pattern

This scaffold uses **shared Zod schemas** for both frontend and backend validation.

### 1. Define Shared Schema

```typescript
// shared/schemas/userSchema.ts
export const userProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export type UserProfile = z.infer<typeof userProfileSchema>
```

### 2. Frontend Validation

```typescript
// components/UserForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userProfileSchema } from '@/shared/schemas'

function UserForm() {
  const form = useForm({
    resolver: zodResolver(userProfileSchema), // ✅ Frontend validation
  })

  // Form validates instantly as user types
}
```

### 3. Backend Validation

```typescript
// backend/routes/forms.ts
import { userProfileSchema } from '../../shared/schemas'

app.post('/api/profile', async (c) => {
  const body = await c.req.json()

  try {
    // ✅ Backend validation (security)
    const validatedData = userProfileSchema.parse(body)

    // Save to database...
    return c.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ errors: error.errors }, 400)
    }
    return c.json({ error: 'Server error' }, 500)
  }
})
```

### Benefits

✅ **Single source of truth**: Update validation in one place
✅ **Type safety**: TypeScript types inferred from schema
✅ **Security**: Backend always validates (can't bypass)
✅ **UX**: Frontend validates instantly (no round trip)

---

## Common Patterns

### Form with Mutation

```typescript
function ProfileForm() {
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(profileSchema),
  })

  const mutation = useMutation({
    mutationFn: (data) => apiClient.put('/api/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      alert('Profile updated!')
    },
  })

  return (
    <form onSubmit={form.handleSubmit(data => mutation.mutate(data))}>
      {/* Form fields */}
    </form>
  )
}
```

### Loading Initial Data

```typescript
function EditProfile() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/api/profile'),
  })

  return <ProfileForm initialData={profile} />
}
```

---

## Troubleshooting

### Form Not Validating

**Problem**: Validation errors not showing
**Solution**: Make sure `zodResolver` is passed to `useForm`

```typescript
useForm({
  resolver: zodResolver(schema), // ✅ Must include this
})
```

### Query Not Refetching

**Problem**: Data doesn't update after mutation
**Solution**: Invalidate queries after successful mutation

```typescript
useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

### TypeScript Errors

**Problem**: Type mismatch in form
**Solution**: Use `z.infer` to get correct types

```typescript
const schema = z.object({ name: z.string() })
type FormData = z.infer<typeof schema> // ✅ Correct type
```

---

## Examples in This Scaffold

**Complete Working Examples**:
- **Form Component**: `src/components/UserProfileForm.tsx`
- **Form Page**: `src/pages/Profile.tsx`
- **Query Examples**: `src/pages/Dashboard.tsx`
- **Backend Validation**: `backend/routes/forms.ts`
- **Shared Schemas**: `shared/schemas/userSchema.ts`

---

## Official Documentation

- **Zod v4**: https://zod.dev/v4
- **React Hook Form**: https://react-hook-form.com
- **TanStack Query v5**: https://tanstack.com/query/v5

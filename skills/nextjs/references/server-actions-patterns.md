# Server Actions - Detailed Patterns

This reference covers advanced Server Action patterns for Next.js 16. For basic usage, see the main SKILL.md.

---

## Form Handling Patterns

### Client Component Form with Loading State

```typescript
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createPost } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  )
}

export default function NewPostPage() {
  const [state, formAction] = useFormState(createPost, null)

  return (
    <form action={formAction}>
      {state?.error && <div className="error">{state.error}</div>}
      <input type="text" name="title" required />
      <textarea name="content" required />
      <SubmitButton />
    </form>
  )
}
```

---

## Error Handling Patterns

### Structured Error Returns

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const PostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(10, 'Content must be at least 10 characters'),
})

export type ActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createPost(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const rawData = {
      title: formData.get('title'),
      content: formData.get('content'),
    }

    // Validate with Zod
    const result = PostSchema.safeParse(rawData)
    if (!result.success) {
      return {
        fieldErrors: result.error.flatten().fieldErrors,
      }
    }

    // Create post
    await db.posts.create({ data: result.data })

    revalidatePath('/posts')
    return { success: true }

  } catch (error) {
    console.error('Failed to create post:', error)
    return { error: 'Failed to create post. Please try again.' }
  }
}
```

---

## Optimistic Updates Pattern

### Full Implementation

```typescript
'use client'

import { useOptimistic, useTransition } from 'react'
import { addComment, deleteComment } from './actions'

interface Comment {
  id: string
  text: string
  pending?: boolean
  deleting?: boolean
}

export function Comments({ initialComments }: { initialComments: Comment[] }) {
  const [isPending, startTransition] = useTransition()

  const [optimisticComments, updateOptimistic] = useOptimistic(
    initialComments,
    (state: Comment[], action: { type: 'add' | 'delete'; comment?: Comment; id?: string }) => {
      switch (action.type) {
        case 'add':
          return [...state, { ...action.comment!, pending: true }]
        case 'delete':
          return state.map(c =>
            c.id === action.id ? { ...c, deleting: true } : c
          )
        default:
          return state
      }
    }
  )

  async function handleAdd(formData: FormData) {
    const text = formData.get('comment') as string
    const tempId = `temp-${Date.now()}`

    startTransition(() => {
      updateOptimistic({
        type: 'add',
        comment: { id: tempId, text }
      })
    })

    await addComment(formData)
  }

  async function handleDelete(id: string) {
    startTransition(() => {
      updateOptimistic({ type: 'delete', id })
    })

    await deleteComment(id)
  }

  return (
    <div>
      <ul>
        {optimisticComments.map(comment => (
          <li
            key={comment.id}
            className={comment.pending ? 'opacity-50' : comment.deleting ? 'opacity-25' : ''}
          >
            {comment.text}
            <button
              onClick={() => handleDelete(comment.id)}
              disabled={comment.pending || comment.deleting}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form action={handleAdd}>
        <input name="comment" required />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add Comment'}
        </button>
      </form>
    </div>
  )
}
```

---

## Revalidation Patterns

### Path-Based Revalidation

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function updatePost(id: string, formData: FormData) {
  await db.posts.update({
    where: { id },
    data: { title: formData.get('title') as string }
  })

  // Revalidate specific paths
  revalidatePath('/posts')           // List page
  revalidatePath(`/posts/${id}`)     // Detail page
  revalidatePath('/dashboard')        // Dashboard
}
```

### Tag-Based Revalidation (Next.js 16)

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export async function updatePost(id: string, formData: FormData) {
  await db.posts.update({
    where: { id },
    data: { title: formData.get('title') as string }
  })

  // Revalidate by tag with cacheLife (NEW in Next.js 16)
  revalidateTag('posts', 'max')        // Long-lived cache
  revalidateTag('dashboard', 'default') // Default cache
  revalidateTag(`post-${id}`, 'seconds:60') // 60 second cache
}
```

---

## File Upload Pattern

### Server Action for File Upload

```typescript
'use server'

import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File

  if (!file || file.size === 0) {
    return { error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type. Use JPEG, PNG, or WebP.' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large. Maximum size is 5MB.' }
  }

  try {
    // Upload to blob storage
    const blob = await put(file.name, file, {
      access: 'public',
    })

    // Save URL to database
    await db.uploads.create({
      data: { url: blob.url, filename: file.name }
    })

    revalidatePath('/uploads')
    return { success: true, url: blob.url }

  } catch (error) {
    console.error('Upload failed:', error)
    return { error: 'Upload failed. Please try again.' }
  }
}
```

### Client Component for File Upload

```typescript
'use client'

import { useFormState } from 'react-dom'
import { uploadFile } from './actions'

export function FileUpload() {
  const [state, formAction] = useFormState(uploadFile, null)

  return (
    <form action={formAction}>
      <input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp"
        required
      />
      {state?.error && <p className="text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-green-500">
          Uploaded! <a href={state.url}>View file</a>
        </p>
      )}
      <button type="submit">Upload</button>
    </form>
  )
}
```

---

## Redirect After Action

### Using redirect()

```typescript
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const post = await db.posts.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    }
  })

  revalidatePath('/posts')

  // Redirect to the new post
  redirect(`/posts/${post.id}`)
  // Note: redirect() throws internally, so code after it won't run
}
```

---

## Progressive Enhancement

### Form That Works Without JavaScript

```typescript
// Server Component (works without JS)
import { createPost } from './actions'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

The form submits natively without JavaScript. When JS loads, React hydrates and adds client-side features like pending states.

---

## Parallel Server Actions

### Running Multiple Actions

```typescript
'use client'

import { updateProfile, updateSettings } from './actions'

export function SaveAll() {
  async function handleSaveAll(formData: FormData) {
    // Run actions in parallel
    await Promise.all([
      updateProfile(formData),
      updateSettings(formData),
    ])
  }

  return (
    <form action={handleSaveAll}>
      {/* Profile fields */}
      <input name="name" />
      <input name="email" />

      {/* Settings fields */}
      <input name="theme" />
      <input name="language" />

      <button type="submit">Save All</button>
    </form>
  )
}
```

---

## See Also

- Main SKILL.md for basic Server Actions patterns
- `templates/server-action-form.tsx` for complete form template
- `templates/server-actions-form.tsx` for additional patterns

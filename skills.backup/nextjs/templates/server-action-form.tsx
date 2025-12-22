/**
 * Next.js 16 - Server Action with Form Handling Template
 * 
 * This template demonstrates how to handle forms using Server Actions in Next.js 16.
 * Copy this pattern for form submissions, mutations, and data revalidation.
 */

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Server Action - Create Post
 * 
 * Server Actions are async functions that run on the server.
 * They can be called from Client Components via forms or event handlers.
 */
export async function createPost(formData: FormData) {
  // 1. Extract form data
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  
  // 2. Validate (use Zod in production)
  if (!title || !content) {
    return {
      error: 'Title and content are required'
    }
  }
  
  try {
    // 3. Perform database operation
    const post = await db.posts.create({
      data: { title, content }
    })
    
    // 4. Revalidate cached data
    // Option A: Revalidate by path
    revalidatePath('/posts')
    
    // Option B: Revalidate by tag (Next.js 16 requires cacheLife)
    revalidateTag('posts', 'max')
    
    // 5. Redirect to new post (optional)
    redirect(`/posts/${post.id}`)
    
  } catch (error) {
    // 6. Handle errors gracefully
    console.error('Failed to create post:', error)
    return {
      error: 'Failed to create post. Please try again.'
    }
  }
}

/**
 * Server Action - Update Post
 */
export async function updatePost(postId: string, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  
  try {
    await db.posts.update({
      where: { id: postId },
      data: { title, content }
    })
    
    // Revalidate specific post page
    revalidatePath(`/posts/${postId}`)
    
    return { success: true }
  } catch (error) {
    return { error: 'Failed to update post' }
  }
}

/**
 * Server Action - Delete Post
 */
export async function deletePost(postId: string) {
  try {
    await db.posts.delete({
      where: { id: postId }
    })
    
    revalidatePath('/posts')
    redirect('/posts')
    
  } catch (error) {
    return { error: 'Failed to delete post' }
  }
}

/**
 * Client Component - Form Example
 * 
 * File: app/posts/new/page.tsx
 */
/*
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
      {state?.error && (
        <div className="error">{state.error}</div>
      )}
      
      <input
        type="text"
        name="title"
        placeholder="Post title"
        required
      />
      
      <textarea
        name="content"
        placeholder="Post content"
        required
      />
      
      <SubmitButton />
    </form>
  )
}
*/

/**
 * Server Component - Form Example (simpler, no loading state)
 * 
 * File: app/posts/new/page.tsx
 */
/*
import { createPost } from './actions'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input
        type="text"
        name="title"
        placeholder="Post title"
        required
      />
      
      <textarea
        name="content"
        placeholder="Post content"
        required
      />
      
      <button type="submit">Create Post</button>
    </form>
  )
}
*/

/**
 * Best Practices:
 * 
 * 1. Always use 'use server' directive at the top of the file
 * 2. Validate all inputs (use Zod for type-safe validation)
 * 3. Handle errors gracefully and return error messages
 * 4. Revalidate cached data after mutations
 * 5. Use revalidatePath() for specific pages
 * 6. Use revalidateTag() for tagged caches (requires cacheLife in Next.js 16)
 * 7. Use redirect() for navigation after successful operations
 * 8. Return serializable data only (no functions, classes, etc.)
 */

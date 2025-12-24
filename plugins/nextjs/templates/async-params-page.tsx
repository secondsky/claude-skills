/**
 * Next.js 16 - Async Params Page Template
 * 
 * BREAKING CHANGE: In Next.js 16, params and searchParams are now async.
 * This template shows the correct pattern for Next.js 16+.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'

/**
 * Page Component with Async Params
 * 
 * IMPORTANT: 
 * - params is now Promise<{ id: string }>
 * - searchParams is now Promise<{ query: string }>
 * - Component must be async
 */
export default async function PostPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ query?: string }>
}) {
  // 1. Await params (REQUIRED in Next.js 16)
  const { id } = await params
  
  // 2. Await searchParams (REQUIRED in Next.js 16)
  const { query } = await searchParams
  
  // 3. Fetch data (runs on server)
  const post = await fetch(`https://api.example.com/posts/${id}`)
    .then(r => r.json())
    .catch(() => null)
  
  // 4. Handle not found
  if (!post) {
    notFound()
  }
  
  // 5. Render
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      {query && <p>Search query: {query}</p>}
    </article>
  )
}

/**
 * Generate Metadata (also async in Next.js 16)
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  // Await params
  const { id } = await params
  
  // Fetch data
  const post = await fetch(`https://api.example.com/posts/${id}`)
    .then(r => r.json())
    .catch(() => null)
  
  if (!post) {
    return {
      title: 'Post Not Found'
    }
  }
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage]
    }
  }
}

/**
 * Generate Static Params (for static generation)
 */
export async function generateStaticParams() {
  // Fetch all post IDs
  const posts = await fetch('https://api.example.com/posts')
    .then(r => r.json())
  
  // Return array of params
  return posts.map((post: { id: string }) => ({
    id: post.id
  }))
}

/**
 * Configure dynamic behavior
 */
export const dynamic = 'force-static' // or 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

/**
 * Layout Component with Async Params
 * 
 * File: app/posts/[id]/layout.tsx
 */
/*
export default async function PostLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  return (
    <div>
      <header>Post {id}</header>
      {children}
    </div>
  )
}
*/

/**
 * Nested Dynamic Routes
 * 
 * File: app/posts/[id]/comments/[commentId]/page.tsx
 */
/*
export default async function CommentPage({
  params
}: {
  params: Promise<{ id: string; commentId: string }>
}) {
  const { id, commentId } = await params
  
  return (
    <div>
      <p>Post ID: {id}</p>
      <p>Comment ID: {commentId}</p>
    </div>
  )
}
*/

/**
 * Migration Notes:
 * 
 * Next.js 15 (OLD):
 * - params: { id: string }
 * - searchParams: { query: string }
 * - cookies() - synchronous
 * - headers() - synchronous
 * 
 * Next.js 16 (NEW):
 * - params: Promise<{ id: string }>
 * - searchParams: Promise<{ query: string }>
 * - await cookies() - async
 * - await headers() - async
 * 
 * Codemod:
 * npx @next/codemod@canary upgrade latest
 */

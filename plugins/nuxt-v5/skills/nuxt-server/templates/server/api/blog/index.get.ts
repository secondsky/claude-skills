import { defineEventHandler, getQuery } from 'h3'
import { useDB } from '~/server/db'
import { posts } from '~/server/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

// GET /api/blog - List all blog posts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Validate and sanitize query parameters
  const pageNum = Number(query.page)
  const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1

  const limitNum = Number(query.limit)
  const limit = Number.isInteger(limitNum) && limitNum >= 1 && limitNum <= 100 ? limitNum : 10

  // Sanitize category - allow only alphanumeric, hyphens, and underscores
  let category: string | undefined
  if (query.category && typeof query.category === 'string') {
    const sanitized = query.category.trim().replace(/[^a-zA-Z0-9-_]/g, '')
    category = sanitized.length > 0 && sanitized.length <= 50 ? sanitized : undefined
  }

  const db = useDB(event)

  // Build query
  let dbQuery = db.select().from(posts)

  // Filter by category
  if (category) {
    dbQuery = dbQuery.where(eq(posts.category, category))
  }

  // Pagination
  const allPosts = await dbQuery
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  // Get total count
  const [{ count }] = await db
    .select({ count: sql`count(*)` })
    .from(posts)
    .where(category ? eq(posts.category, category) : undefined)

  return {
    data: allPosts,
    meta: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit)
    }
  }
})

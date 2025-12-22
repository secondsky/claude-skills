// GET /api/blog - List all blog posts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const category = query.category as string | undefined

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

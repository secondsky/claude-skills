# Server-Side Table Patterns

Complete guide to implementing server-side pagination, filtering, and sorting with TanStack Table.

## Why Server-Side?

**Use server-side when:**
- Dataset has 1000+ rows
- Data changes frequently
- Want to reduce client memory usage
- Need real-time filtering/sorting from database

**Use client-side when:**
- Dataset <1000 rows
- Data rarely changes
- No backend API available
- Need instant interactions (no network delay)

---

## Pattern 1: Server-Side Pagination

### Backend (Cloudflare Workers API)

```typescript
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 0
  const pageSize = Number(url.searchParams.get('pageSize')) || 20
  const offset = page * pageSize

  const { results } = await env.DB.prepare(`
    SELECT * FROM users
    LIMIT ? OFFSET ?
  `).bind(pageSize, offset).all()

  const { total } = await env.DB.prepare(`
    SELECT COUNT(*) as total FROM users
  `).first<{ total: number }>()

  return Response.json({
    data: results,
    pagination: {
      page,
      pageSize,
      total: total ?? 0,
      pageCount: Math.ceil((total ?? 0) / pageSize),
    },
  })
}
```

### Frontend

```typescript
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 20,
})

const { data } = useQuery({
  queryKey: ['users', pagination.pageIndex, pagination.pageSize],
  queryFn: async () => {
    const response = await fetch(
      `/api/users?page=${pagination.pageIndex}&pageSize=${pagination.pageSize}`
    )
    return response.json()
  },
})

const table = useReactTable({
  data: data?.data ?? [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true, // CRITICAL
  pageCount: data?.pagination.pageCount ?? 0,
  state: { pagination },
  onPaginationChange: setPagination,
})
```

---

## Pattern 2: Server-Side Filtering

### Backend

```typescript
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''

  let query = 'SELECT * FROM users'
  const params = []

  if (search) {
    query += ' WHERE name LIKE ? OR email LIKE ?'
    params.push(`%${search}%`, `%${search}%`)
  }

  const { results } = await env.DB.prepare(query).bind(...params).all()

  return Response.json({ data: results })
}
```

### Frontend

```typescript
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
const search = columnFilters.find(f => f.id === 'search')?.value as string || ''

const { data } = useQuery({
  queryKey: ['users', search], // Include filter in query key
  queryFn: async () => {
    const response = await fetch(`/api/users?search=${search}`)
    return response.json()
  },
})

const table = useReactTable({
  data: data?.data ?? [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualFiltering: true, // CRITICAL
  state: { columnFilters },
  onColumnFiltersChange: setColumnFilters,
})
```

---

## Pattern 3: Server-Side Sorting

### Backend

```typescript
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const sortBy = url.searchParams.get('sortBy') || 'created_at'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'

  // SECURITY: Validate sort column to prevent SQL injection
  const allowedColumns = ['id', 'name', 'email', 'created_at']
  const allowedOrders = ['asc', 'desc']

  if (!allowedColumns.includes(sortBy) || !allowedOrders.includes(sortOrder)) {
    return Response.json({ error: 'Invalid sort parameters' }, { status: 400 })
  }

  const { results } = await env.DB.prepare(`
    SELECT * FROM users
    ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
  `).all()

  return Response.json({ data: results })
}
```

### Frontend

```typescript
const [sorting, setSorting] = useState<SortingState>([])

const { data } = useQuery({
  queryKey: ['users', sorting], // Include sorting in query key
  queryFn: async () => {
    const params = new URLSearchParams()
    if (sorting.length > 0) {
      params.append('sortBy', sorting[0].id)
      params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc')
    }
    const response = await fetch(`/api/users?${params}`)
    return response.json()
  },
})

const table = useReactTable({
  data: data?.data ?? [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true, // CRITICAL
  state: { sorting },
  onSortingChange: setSorting,
})
```

---

## Pattern 4: Combined (Pagination + Filtering + Sorting)

### Backend

```typescript
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)

  // Parse all parameters
  const page = Number(url.searchParams.get('page')) || 0
  const pageSize = Number(url.searchParams.get('pageSize')) || 20
  const search = url.searchParams.get('search') || ''
  const sortBy = url.searchParams.get('sortBy') || 'created_at'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'

  const offset = page * pageSize

  // Build dynamic query
  let query = 'SELECT * FROM users'
  let countQuery = 'SELECT COUNT(*) as total FROM users'
  const params: (string | number)[] = []
  const countParams: string[] = []

  // Add WHERE clause
  if (search) {
    const whereClause = ' WHERE name LIKE ? OR email LIKE ?'
    query += whereClause
    countQuery += whereClause
    params.push(`%${search}%`, `%${search}%`)
    countParams.push(`%${search}%`, `%${search}%`)
  }

  // Add ORDER BY (validate first!)
  const allowedColumns = ['id', 'name', 'email', 'created_at']
  if (allowedColumns.includes(sortBy)) {
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`
  }

  // Add LIMIT/OFFSET
  query += ' LIMIT ? OFFSET ?'
  params.push(pageSize, offset)

  // Execute queries
  const { results } = await env.DB.prepare(query).bind(...params).all()
  const { total } = await env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()

  return Response.json({
    data: results,
    pagination: {
      page,
      pageSize,
      total: total ?? 0,
      pageCount: Math.ceil((total ?? 0) / pageSize),
    },
  })
}
```

### Frontend

```typescript
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
const [sorting, setSorting] = useState<SortingState>([])
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

const search = columnFilters.find(f => f.id === 'search')?.value as string || ''

const { data } = useQuery({
  queryKey: ['users', pagination, sorting, search], // Include ALL state
  queryFn: async () => {
    const params = new URLSearchParams({
      page: pagination.pageIndex.toString(),
      pageSize: pagination.pageSize.toString(),
    })

    if (sorting.length > 0) {
      params.append('sortBy', sorting[0].id)
      params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc')
    }

    if (search) {
      params.append('search', search)
    }

    const response = await fetch(`/api/users?${params}`)
    return response.json()
  },
  placeholderData: (previousData) => previousData, // Keep old data while fetching
})

const table = useReactTable({
  data: data?.data ?? [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  // Enable all server-side features
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  pageCount: data?.pagination.pageCount ?? 0,
  state: {
    pagination,
    sorting,
    columnFilters,
  },
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
})
```

---

## Common Mistakes

### ❌ Mistake 1: Forgetting `manual*` flags

```typescript
// BAD: Table thinks pagination is client-side
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // Missing manualPagination: true
})
```

### ❌ Mistake 2: Query key doesn't match state

```typescript
// BAD: Changing page doesn't refetch
queryKey: ['users'], // Static key!
// Changing pagination.pageIndex won't trigger refetch
```

### ❌ Mistake 3: SQL injection vulnerability

```typescript
// DANGEROUS: User input directly in SQL
const query = `SELECT * FROM users ORDER BY ${sortBy} ${sortOrder}`
// Attacker could set sortBy to "id; DROP TABLE users--"
```

### ✅ Solution: Whitelist allowed values

```typescript
const allowedColumns = ['id', 'name', 'email']
if (!allowedColumns.includes(sortBy)) {
  return Response.json({ error: 'Invalid sort column' }, { status: 400 })
}
```

---

## Performance Tips

1. **Add database indexes** for sorted/filtered columns
2. **Use `placeholderData`** in TanStack Query to show old data while fetching
3. **Debounce search inputs** to reduce API calls
4. **Cache API responses** with TanStack Query's `staleTime`
5. **Use cursor-based pagination** for very large datasets (>100k rows)

---

## Further Reading

- [TanStack Table Pagination Docs](https://tanstack.com/table/latest/docs/guide/pagination)
- [TanStack Query Guide](~/.claude/skills/tanstack-query/SKILL.md)
- [Cloudflare D1 Guide](~/.claude/skills/cloudflare-d1/SKILL.md)

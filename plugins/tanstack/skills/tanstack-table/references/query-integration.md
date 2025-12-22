# TanStack Query + Table Integration

How to properly coordinate TanStack Query (data fetching) with TanStack Table (display).

## The Pattern

```
TanStack Query (manages data fetching, caching, loading states)
        ↓
TanStack Table (manages display, pagination, sorting, filtering UI)
```

## Basic Integration

```typescript
import { useQuery } from '@tanstack/react-query'
import { useReactTable } from '@tanstack/react-table'

function MyTable() {
  // Query fetches data
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  // Table displays data
  const table = useReactTable({
    data: data?.users ?? [], // Provide empty array as fallback
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <div>Loading...</div>

  return <DataTable table={table} />
}
```

## Critical Rule: Query Key Must Match Table State

**❌ BAD:**
```typescript
// Query key doesn't include pagination state
const { data } = useQuery({
  queryKey: ['users'], // Static!
})

const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
// Changing page won't refetch data!
```

**✅ GOOD:**
```typescript
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

// Query key includes ALL table state that affects data
const { data } = useQuery({
  queryKey: ['users', pagination.pageIndex, pagination.pageSize],
  queryFn: () => fetchUsers(pagination),
})
```

## Server-Side with All Features

```typescript
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
const [sorting, setSorting] = useState<SortingState>([])
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

// Extract search from filters
const search = columnFilters.find(f => f.id === 'search')?.value as string || ''

// CRITICAL: Include ALL state in query key
const { data, isLoading, isPlaceholderData } = useQuery({
  queryKey: ['users', pagination, sorting, search],
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

    return fetch(`/api/users?${params}`).then(r => r.json())
  },
  placeholderData: (prev) => prev, // Show old data while fetching new
})

const table = useReactTable({
  data: data?.data ?? [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  pageCount: data?.pagination.pageCount ?? 0,
  state: { pagination, sorting, columnFilters },
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
})
```

## Handling Loading States

```typescript
// Show skeleton while loading initial data
if (isLoading) {
  return <TableSkeleton />
}

// Show error state
if (isError) {
  return <ErrorMessage error={error} />
}

// Optional: Show indicator when fetching next page
{isPlaceholderData && (
  <div className="absolute top-0 right-0 p-2">
    <Spinner />
  </div>
)}
```

## Optimistic Updates (for Edit/Delete)

```typescript
const queryClient = useQueryClient()

const deleteMutation = useMutation({
  mutationFn: (id: string) => fetch(`/api/users/${id}`, { method: 'DELETE' }),
  onMutate: async (id) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users'] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['users', pagination, sorting, search])

    // Optimistically update
    queryClient.setQueryData(['users', pagination, sorting, search], (old: any) => ({
      ...old,
      data: old.data.filter((user: User) => user.id !== id),
    }))

    return { previous }
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData(['users', pagination, sorting, search], context?.previous)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

## Advanced: Prefetching Next Page

```typescript
const { data } = useQuery({
  queryKey: ['users', pagination.pageIndex],
  queryFn: () => fetchUsers(pagination.pageIndex),
})

// Prefetch next page
useEffect(() => {
  if (pagination.pageIndex < (data?.pageCount ?? 0) - 1) {
    queryClient.prefetchQuery({
      queryKey: ['users', pagination.pageIndex + 1],
      queryFn: () => fetchUsers(pagination.pageIndex + 1),
    })
  }
}, [pagination.pageIndex, data?.pageCount, queryClient])
```

## Common Mistakes

1. **Not including table state in query key**
2. **Not handling loading/error states**
3. **Not providing fallback empty array for data**
4. **Not using `placeholderData` for smooth page transitions**
5. **Not invalidating queries after mutations**

## Further Reading

- [TanStack Query Docs](~/.claude/skills/tanstack-query/SKILL.md)
- [TanStack Table Pagination Guide](https://tanstack.com/table/latest/docs/guide/pagination)

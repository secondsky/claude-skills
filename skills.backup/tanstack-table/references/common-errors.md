# Common Errors & Solutions

All 6+ documented TanStack Table errors with solutions and sources.

## Error 1: Infinite Re-Renders

**Symptom:** Browser freezes, "Maximum update depth exceeded" error.

**Cause:** Unstable `data` or `columns` references change every render.

**Solution:**
```typescript
// ❌ BAD
const data = [{ id: 1 }] // New array every render!

// ✅ GOOD
const data = useMemo(() => [{ id: 1 }], [])
// OR define outside component
```

**Source:** Official FAQ, Stack Overflow (high frequency)

---

## Error 2: TanStack Query + Table State Mismatch

**Symptom:** Changing page doesn't fetch new data, or shows stale data.

**Cause:** Query key doesn't include table state.

**Solution:**
```typescript
// ❌ BAD
queryKey: ['users'] // Static!

// ✅ GOOD
queryKey: ['users', pagination, sorting, filters] // Include ALL state
```

**Source:** TanStack Query docs, GitHub discussions

---

## Error 3: Server-Side Features Not Working

**Symptom:** Pagination/filtering/sorting happens client-side instead of server-side.

**Cause:** Missing `manual*` flags.

**Solution:**
```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // CRITICAL: Tell table these are server-side
  manualPagination: true,
  manualFiltering: true,
  manualSorting: true,
  pageCount: serverPageCount, // Required for manualPagination
})
```

**Source:** Official docs, common mistake

---

## Error 4: TypeScript "Cannot Find Module" for Column Helper

**Symptom:** Import error for `createColumnHelper`.

**Solution:**
```typescript
// ❌ BAD
import { createColumnHelper } from '@tanstack/table-core'

// ✅ GOOD
import { createColumnHelper } from '@tanstack/react-table'
```

**Source:** TypeScript import paths

---

## Error 5: Sorting Not Updating with Server-Side

**Symptom:** Clicking sort headers doesn't update data.

**Cause:** Sorting state not included in query key.

**Solution:**
```typescript
const [sorting, setSorting] = useState<SortingState>([])

const { data } = useQuery({
  queryKey: ['users', pagination, sorting], // Include sorting!
  queryFn: () => {
    const sortBy = sorting[0]?.id || 'created_at'
    const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'
    return fetch(`/api/users?sortBy=${sortBy}&sortOrder=${sortOrder}`).then(r => r.json())
  }
})

const table = useReactTable({
  data: data?.data ?? [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true,
  state: { sorting },
  onSortingChange: setSorting,
})
```

**Source:** Common pattern mistake

---

## Error 6: Poor Performance with Large Datasets

**Symptom:** Table slow/janky with 1000+ rows.

**Solution:** Use virtualization or server-side pagination.

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => containerRef.current,
  estimateSize: () => 50,
})
```

**Source:** Performance best practices

---

## Additional Issues

### Column Filtering Not Working

```typescript
// Enable filtering on columns
const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableColumnFilter: true, // Enable filtering
  },
]

// Add filter UI
<input
  value={table.getColumn('name')?.getFilterValue() as string}
  onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
/>
```

### Row Selection Not Working

```typescript
const [rowSelection, setRowSelection] = useState({})

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
})

// In column definition
{
  id: 'select',
  header: ({ table }) => (
    <input
      type="checkbox"
      checked={table.getIsAllRowsSelected()}
      onChange={table.getToggleAllRowsSelectedHandler()}
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={row.getToggleSelectedHandler()}
    />
  ),
}
```

---

## Debugging Tips

1. **Check React DevTools** - Look for unnecessary re-renders
2. **Console.log query keys** - Ensure they update when state changes
3. **Use React Profiler** - Measure render performance
4. **Check Network tab** - Verify API calls match expectations
5. **Add console.logs** - In `onPaginationChange`, `onSortingChange`, etc.

---

## Further Reading

- [TanStack Table Troubleshooting](https://tanstack.com/table/latest/docs/guide/troubleshooting)
- [TanStack Query Debugging](~/.claude/skills/tanstack-query/SKILL.md)

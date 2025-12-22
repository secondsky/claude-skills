# Performance & Virtualization

Guide to optimizing TanStack Table for large datasets using TanStack Virtual.

## When to Virtualize

- **Client-side tables with 1000+ rows**
- **Scrolling feels slow or janky**
- **Browser runs out of memory**
- **Need to render 10k+ rows efficiently**

## TanStack Virtual Basics

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

function VirtualizedTable() {
  const containerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length, // Total number of rows
    getScrollElement: () => containerRef.current, // Scroll container
    estimateSize: () => 50, // Estimated row height
    overscan: 10, // Extra rows to render (smooth scrolling)
  })

  return (
    <div ref={containerRef} style={{ height: '600px', overflow: 'auto' }}>
      {/* Only render visible rows */}
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const row = rows[virtualRow.index]
        return <tr key={row.id}>{/* ... */}</tr>
      })}
    </div>
  )
}
```

## Complete Example

See `templates/virtualized-large-dataset.tsx`

## Performance Tips

### 1. Memoize Data and Columns

```typescript
// BAD: New array every render
const data = [...]

// GOOD: Stable reference
const data = useMemo(() => [...], [])
```

### 2. Use Column Sizes

```typescript
const columns = [
  { accessorKey: 'id', header: 'ID', size: 80 }, // Fixed width
  { accessorKey: 'name', header: 'Name' }, // Flexible
]
```

### 3. Avoid Heavy Cell Renderers

```typescript
// BAD: Complex logic in every cell
cell: info => <ExpensiveComponent data={info.getValue()} />

// GOOD: Memoized component
const MemoizedCell = React.memo(ExpensiveComponent)
cell: info => <MemoizedCell data={info.getValue()} />
```

### 4. Enable Row Selection Carefully

```typescript
// Only if needed - adds overhead
enableRowSelection: true,
```

### 5. Use Server-Side for Very Large Data

If dataset >10k rows, consider server-side pagination instead of virtualization.

## Measuring Performance

```typescript
import { Profiler } from 'react'

<Profiler id="Table" onRender={(id, phase, actualDuration) => {
  console.log(`${id} ${phase} took ${actualDuration}ms`)
}}>
  <MyTable />
</Profiler>
```

## Further Reading

- [TanStack Virtual Docs](https://tanstack.com/virtual/latest)
- [Complete Example](../templates/virtualized-large-dataset.tsx)

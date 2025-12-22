/**
 * Virtualized Table for Large Datasets
 *
 * Uses TanStack Virtual to efficiently render 10,000+ rows.
 * Only visible rows are rendered, dramatically improving performance.
 */

import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'

interface DataRow {
  id: number
  name: string
  value: number
  category: string
}

// Generate large dataset (10k rows)
function generateLargeDataset(count: number): DataRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.floor(Math.random() * 1000),
    category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
  }))
}

const columns: ColumnDef<DataRow>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'value',
    header: 'Value',
    cell: info => info.getValue().toLocaleString(),
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
]

export function VirtualizedTable() {
  // Ref for scroll container
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Generate large dataset once
  const data = useMemo(() => generateLargeDataset(10000), [])

  // TanStack Table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  // TanStack Virtual: Virtualize rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport for smooth scrolling
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  // Calculate padding for virtualization
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Virtualized Table</h2>
        <p className="text-gray-600">
          Rendering {rows.length.toLocaleString()} rows efficiently
        </p>
      </div>

      <div
        ref={tableContainerRef}
        className="border border-gray-300 overflow-auto"
        style={{ height: '600px' }}
      >
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="border-b border-gray-300 px-4 py-2 text-left font-semibold"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map(virtualRow => {
              const row = rows[virtualRow.index]
              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="border-b border-gray-200 px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        Scroll performance: Only {virtualRows.length} rows rendered of{' '}
        {rows.length.toLocaleString()} total
      </div>
    </div>
  )
}

// ============================================
// Performance Tips
// ============================================

/**
 * 1. Adjust `estimateSize` based on your actual row height
 * 2. Increase `overscan` for smoother scrolling (but more rendering)
 * 3. Use `sticky` positioning for headers
 * 4. Add padding rows to maintain scroll position
 * 5. Use `useMemo` for data to prevent re-generation
 */

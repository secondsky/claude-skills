/**
 * Controlled Table State (column visibility, pinning, ordering, filters, sorting, selection)
 *
 * Demonstrates best-practice controlled state for TanStack Table v8:
 * - Column visibility + pinning + ordering
 * - Global fuzzy search + column filters
 * - Sorting + pagination + row selection
 * - Faceted filter hooks pre-wired (getFacetedRowModel/UniqueValues)
 *
 * Use when you need: toolbar controls, URL/localStorage persistence, or to sync state with TanStack Query.
 */

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  RowSelectionState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  useReactTable,
  FilterFn,
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import { useMemo, useState } from 'react'

type Status = 'active' | 'pending' | 'blocked'

interface User {
  id: string
  name: string
  email: string
  team: string
  status: Status
  createdAt: string
}

const columns: ColumnDef<User>[] = [
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
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    size: 48,
    enableSorting: false,
    enablePinning: true,
  },
  { accessorKey: 'name', header: 'Name', enableSorting: true, enablePinning: true },
  { accessorKey: 'email', header: 'Email', enableSorting: false },
  { accessorKey: 'team', header: 'Team', enableSorting: true, enableColumnFilter: true },
  { accessorKey: 'status', header: 'Status', enableSorting: true, enableColumnFilter: true },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    enableSorting: true,
    cell: info => new Date(info.getValue<string>()).toLocaleDateString(),
  },
]

// Fuzzy filter helper (global search)
const fuzzyFilter: FilterFn<User> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta?.({ itemRank })
  return itemRank.passed
}

export function ControlledTableState() {
  // Stable data + state
  const data = useMemo<User[]>(
    () => [
      { id: '1', name: 'Alice Smith', email: 'alice@acme.com', team: 'Design', status: 'active', createdAt: '2024-02-10' },
      { id: '2', name: 'Bob Lee', email: 'bob@acme.com', team: 'Engineering', status: 'pending', createdAt: '2024-03-22' },
      { id: '3', name: 'Carla Diaz', email: 'carla@acme.com', team: 'Data', status: 'blocked', createdAt: '2024-01-18' },
      { id: '4', name: 'Dane Fox', email: 'dane@acme.com', team: 'Design', status: 'active', createdAt: '2024-04-04' },
    ],
    []
  )

  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: ['select'], right: [] })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      columnVisibility,
      columnOrder,
      columnPinning,
      rowSelection,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: 'fuzzy',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Global search (fuzzy)"
          className="border px-3 py-2 rounded"
        />

        {/* Column visibility toggles */}
        <div className="flex items-center gap-2 text-sm">
          {table.getAllLeafColumns().map(column => (
            column.getCanHide() ? (
              <label key={column.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {column.id}
              </label>
            ) : null
          ))}
        </div>

        {/* Pin/unpin first two columns */}
        <button
          className="border px-2 py-1 rounded"
          onClick={() => table.getColumn('name')?.pin('left')}
        >
          Pin Name Left
        </button>
        <button
          className="border px-2 py-1 rounded"
          onClick={() => table.getColumn('name')?.pin(false)}
        >
          Unpin Name
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="border px-3 py-2 text-left align-middle">
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="text-xs text-gray-500"
                          >
                            {header.column.getIsSorted() === 'asc' ? '▲' : header.column.getIsSorted() === 'desc' ? '▼' : '⇅'}
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="border px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="border px-2 py-1 rounded disabled:opacity-50">Prev</button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="border px-2 py-1 rounded disabled:opacity-50">Next</button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {[10, 20, 50].map(size => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">
            Selected: {Object.keys(table.getState().rowSelection).length}
          </span>
          <button
            onClick={() => setRowSelection({})}
            className="border px-2 py-1 rounded"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Tips
 * - Persist state (e.g., to URL or localStorage) by watching the controlled state objects.
 * - If you don't need a piece of state (e.g., columnOrder), remove it from `state` to reduce renders.
 * - For server-side data, set manual flags (manualSorting/manualPagination) and include state in your fetch key.
 */

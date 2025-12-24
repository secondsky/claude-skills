/**
 * Basic Client-Side Table
 *
 * Simple TanStack Table example with local data.
 * Use for: Small datasets (<1000 rows), all data available client-side
 */

import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from '@tanstack/react-table'
import { useMemo } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

// Define columns outside component OR use useMemo to prevent infinite re-renders
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
]

export function BasicClientTable() {
  // CRITICAL: Memoize data to prevent infinite re-renders
  const data = useMemo<User[]>(
    () => [
      { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'Admin' },
      { id: '2', name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
      { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' },
      { id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Editor' },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(), // Required: Core functionality
  })

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Users</h2>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="bg-gray-100">
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="border border-gray-300 px-4 py-2 text-left"
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
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  className="border border-gray-300 px-4 py-2"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} rows
      </div>
    </div>
  )
}

/**
 * shadcn/ui Styled Table
 *
 * Integrates TanStack Table with shadcn/ui components for beautiful styling.
 * Requires: Tailwind v4 + shadcn/ui Table components
 */

import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMemo } from 'react'

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
}

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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === 'active'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : status === 'inactive'
              ? 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}
        >
          {status}
        </span>
      )
    },
  },
]

export function ShadcnStyledTable() {
  const data = useMemo<User[]>(
    () => [
      { id: '1', name: 'Alice Smith', email: 'alice@example.com', status: 'active' },
      { id: '2', name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive' },
      { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', status: 'pending' },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>A list of your recent users.</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

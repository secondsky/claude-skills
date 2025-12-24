/**
 * Type-Safe Column Configuration Patterns
 *
 * Shows best practices for defining columns with TypeScript.
 * Use createColumnHelper for full type safety.
 */

import { createColumnHelper, ColumnDef } from '@tanstack/react-table'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  age: number
  status: 'active' | 'inactive'
  createdAt: Date
}

// ============================================
// Method 1: Column Helper (RECOMMENDED for TypeScript)
// ============================================

const columnHelper = createColumnHelper<User>()

export const columnsWithHelper = [
  columnHelper.accessor('id', {
    header: 'ID',
    size: 80,
  }),
  columnHelper.accessor('firstName', {
    header: 'First Name',
    cell: info => info.getValue(), // Fully typed!
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
  }),
  // Computed column (combines multiple fields)
  columnHelper.accessor(
    row => `${row.firstName} ${row.lastName}`,
    {
      id: 'fullName',
      header: 'Full Name',
      cell: info => <strong>{info.getValue()}</strong>,
    }
  ),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: info => (
      <a href={`mailto:${info.getValue()}`} className="text-blue-600 underline">
        {info.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    size: 80,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => (
      <span
        className={`px-2 py-1 rounded text-xs ${
          info.getValue() === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: info => info.getValue().toLocaleDateString(),
    enableSorting: true,
  }),
]

// ============================================
// Method 2: Manual ColumnDef (TypeScript)
// ============================================

export const columnsManual: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
]

// ============================================
// Advanced: Column with Custom Cell Rendering
// ============================================

export const advancedColumns = [
  columnHelper.accessor('id', {
    header: 'ID',
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: props => (
      <div className="flex gap-2">
        <button
          onClick={() => console.log('Edit', props.row.original.id)}
          className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Edit
        </button>
        <button
          onClick={() => console.log('Delete', props.row.original.id)}
          className="px-2 py-1 bg-red-500 text-white rounded text-sm"
        >
          Delete
        </button>
      </div>
    ),
  }),
]

// ============================================
// Advanced: Column with Sorting/Filtering
// ============================================

export const sortableFilterableColumns = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    enableSorting: true,
    enableColumnFilter: true,
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'inNumberRange', // Built-in filter function
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    enableColumnFilter: true,
    filterFn: 'equals', // Exact match
  }),
]

// ============================================
// Advanced: Column with Meta Data
// ============================================

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    className?: string
    headerClassName?: string
  }
}

export const columnsWithMeta = [
  columnHelper.accessor('id', {
    header: 'ID',
    meta: {
      className: 'text-gray-600',
      headerClassName: 'bg-gray-50',
    },
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    meta: {
      className: 'font-mono text-sm',
    },
  }),
]

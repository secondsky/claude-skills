# Table State & Feature Controls (Column Visibility, Pinning, Ordering, Filtering, Selection)

Practical recipes for managing controlled state in TanStack Table v8 without hurting performance. Use these snippets when you need persistent UI (URL/state sync), custom toolbars, or advanced UX like pinned columns and fuzzy search.

## Minimal Controlled State
- Control only the state you actually need; letting the table manage the rest avoids unnecessary renders.
- Safe set to control together: `sorting`, `pagination`, `columnFilters`, `globalFilter`, `columnVisibility`, `columnOrder`, `columnPinning`, `rowSelection`.
- Avoid controlling `columnSizingInfo` unless you are persisting drag state—docs note it triggers frequent updates.

```ts
const table = useReactTable({
  data,
  columns,
  state: {
    sorting,
    pagination,
    columnFilters,
    globalFilter,
    columnVisibility,
    columnOrder,
    columnPinning,
    rowSelection,
  },
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  onColumnVisibilityChange: setColumnVisibility,
  onColumnOrderChange: setColumnOrder,
  onColumnPinningChange: setColumnPinning,
  onRowSelectionChange: setRowSelection,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFacetedRowModel: getFacetedRowModel(),          // needed for faceting UIs
  getFacetedUniqueValues: getFacetedUniqueValues(),  // needed for faceted filters
})
```

## Column Visibility
- Default: all columns visible. Hide by toggling `columnVisibility` state keyed by column id.
- Provide a simple UI toggle list: `table.getAllLeafColumns().map(column => column.getCanHide() && ...)`.
- Persist visibility in URL/localStorage for user preference-heavy tables.

## Column Pinning (Freeze Columns)
- State shape: `{ left: string[]; right: string[] }`.
- Order precedence: pinning → manual column order → grouping. Changing `columnOrder` only affects center (unpinned) columns.
- Pin defaults via `initialState.columnPinning`, or control via `onColumnPinningChange`.
- Use `column.getCanPin()`, `column.pin('left' | 'right' | false)`, and `row.getLeft/Center/RightVisibleCells()` when rendering split tables.

## Column Ordering
- Control with `columnOrder: string[]`. For one-off defaults, set `initialState.columnOrder`; if you also supply `state.columnOrder`, only the controlled state is used.
- For drag-and-drop, prefer `@dnd-kit/core` over `react-dnd` (better React 18/19 compatibility).

## Filtering: Column, Global, Fuzzy, Faceted
- Enable filtering with `getFilteredRowModel: getFilteredRowModel()`.
- Fuzzy global search: set `filterFns: { fuzzy: fuzzyFilter }` and `globalFilterFn: 'fuzzy'`, where `fuzzyFilter` uses `rankItem` from `@tanstack/match-sorter-utils`.
- Faceted filters (chips/dropdowns) need `getFacetedRowModel` plus `getFacetedUniqueValues`/`getFacetedMinMaxValues`.
- Debounce text inputs (~150–300ms) to avoid chatty re-renders on every keystroke.

## Sorting
- Controlled sorting needs `state.sorting`, `onSortingChange`, and `getSortedRowModel()`.
- For server-side sorting: set `manualSorting: true` and include sorting state in your fetch key/params.

## Pagination
- Client-side: add `getPaginationRowModel()`; default page size is 10. Set `initialState.pagination` to customize.
- Server-side: set `manualPagination: true`, supply `pageCount`, and include pagination state in your fetch.

## Row Selection & Pinning
- Enable with `enableRowSelection: true`; control via `rowSelection` state and `onRowSelectionChange`.
- Pinned rows use state `{ top: string[]; bottom: string[] }`; enable with `enableRowPinning` and render pinned rows separately or with sticky CSS.

## Column Sizing
- For resizable columns: set `columnResizeMode: 'onChange' | 'onEnd'` and add `getHeaderGroups` resize handles.
- Persist widths via `columnSizing` state; avoid controlling `columnSizingInfo` unless you must capture drag-in-progress.

## Performance Guardrails
- Memoize `data` and `columns`; avoid recreating `filterFns`.
- Keep render paths light when controlling many states; prefer derived UI components (toolbars) over inline heavy logic.
- Virtualize (`@tanstack/react-virtual`) when rendering 1k+ client-side rows even with pagination to smooth scroll.

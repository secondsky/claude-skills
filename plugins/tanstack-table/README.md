# TanStack Table Skill

Build production-ready, headless data tables with TanStack Table v8, optimized for server-side patterns and Cloudflare Workers integration.

## Auto-Trigger Keywords

This skill automatically activates when you mention:
- "data table", "datagrid", "table component"
- "server-side pagination", "server-side filtering", "server-side sorting"
- "TanStack Table", "React Table", "React Table v8"
- "table with large dataset", "large list performance"
- "paginate API", "filter API", "sort API"
- "Cloudflare D1 table", "D1 database table"
- "virtualize table", "virtualized list"
- "table state management", "table URL sync"

## What This Skill Provides

### 🎯 Core Features
- **Server-side patterns** - Pagination, filtering, sorting with API backends
- **Cloudflare D1 integration** - Complete Workers + D1 + Table examples
- **TanStack Query coordination** - Proper query key patterns, state sync
- **Virtualization** - TanStack Virtual for large datasets (10k+ rows)
- **Type safety** - TypeScript patterns, column helper usage
- **Feature controls** - Column visibility, pinning, ordering, fuzzy/global filtering, selection
- **Error prevention** - 6+ documented issues with solutions

### 📦 Templates (7 Production-Ready)
1. **Basic client-side table** - Simple table with local data
2. **Server-paginated table** - API-driven pagination with TanStack Query
3. **D1 database integration** - Cloudflare D1 + Workers API + Table
4. **Column configuration** - Type-safe column definitions
5. **Controlled table state** - Column visibility, pinning, ordering, fuzzy search, selection
6. **Virtualized large dataset** - Performance optimization with TanStack Virtual
7. **shadcn/ui styled table** - Tailwind v4 + shadcn integration

### 📚 Reference Docs (6)
1. **Server-side patterns** - Complete guide to API-driven tables
2. **Query integration** - TanStack Query + Table coordination
3. **Cloudflare D1 examples** - Workers + D1 complete patterns
4. **Performance & virtualization** - TanStack Virtual guide
5. **Common errors** - 6+ issues with solutions
6. **Table state & feature controls** - Visibility, pinning, ordering, fuzzy/global filtering, selection

## Quick Example

### Server-Side Paginated Table

```typescript
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

function UsersTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  // TanStack Query fetches data
  const { data } = useQuery({
    queryKey: ['users', pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetch(`/api/users?page=${pagination.pageIndex}&pageSize=${pagination.pageSize}`)
      .then(r => r.json())
  })

  // TanStack Table manages display
  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Server handles pagination
    pageCount: data?.pagination.pageCount ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
  })

  return <div>{/* render table */}</div>
}
```

### Cloudflare D1 Backend

```typescript
// Cloudflare Workers API
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 0
  const pageSize = 20
  const offset = page * pageSize

  const { results } = await env.DB.prepare(`
    SELECT * FROM users
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(pageSize, offset).all()

  const { total } = await env.DB.prepare(`
    SELECT COUNT(*) as total FROM users
  `).first()

  return Response.json({
    data: results,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
    },
  })
}
```

## 6 Common Errors Prevented

1. **Infinite re-renders** - Unstable data/columns references
2. **Query + table state mismatch** - Query key coordination
3. **Server-side features not working** - Missing `manual*` flags
4. **TypeScript import errors** - Wrong column helper path
5. **Sorting not updating** - Missing sorting in query key
6. **Poor large dataset performance** - Need virtualization

## Integration with Other Skills

### Works Great With
- **tanstack-query** - Data fetching and caching (recommended pattern)
- **cloudflare-d1** - Database backend for table data
- **cloudflare-worker-base** - API endpoints for server-side features
- **tailwind-v4-shadcn** - UI styling and components
- **typescript** - Type-safe column definitions

### Typical Stack
```
React 19.2 + Vite 6.0
  ↓
TanStack Query (data fetching) ← tanstack-query skill
  ↓
TanStack Table (display)       ← THIS SKILL
  ↓
Cloudflare Workers API         ← cloudflare-worker-base skill
  ↓
Cloudflare D1 Database         ← cloudflare-d1 skill
```

## When to Use

### ✅ Use TanStack Table When:
- Building data-heavy applications
- Need server-side pagination/filtering/sorting
- Working with 100+ rows (client) or 1000+ rows (server)
- Want headless table logic (bring your own UI)
- Integrating with TanStack Query
- TypeScript type safety is important

### ❌ Consider Alternatives When:
- Simple list (<20 items) - Use basic `map()`
- Need opinionated UI - Consider AG Grid (commercial)
- Building spreadsheet/Excel clone - Consider Handsontable

## Installation

```bash
bun add @tanstack/react-table@latest  # preferred
# or: npm install @tanstack/react-table@latest

# For virtualization (optional):
bun add @tanstack/react-virtual@latest
# or: npm install @tanstack/react-virtual@latest
```

**Latest Versions (stable as of 2025-12-09):**
- `@tanstack/react-table`: v8.21.3
- `@tanstack/react-virtual`: v3.13.12
- `@tanstack/match-sorter-utils`: v8.21.3 (for fuzzy filtering)

**React support:** Works with React 16.8+ through React 19; React Compiler not supported.

## File Structure

```
~/.claude/skills/tanstack-table/
├── SKILL.md                           # Complete documentation
├── README.md                          # This file
├── templates/
│   ├── package.json                   # Dependencies
│   ├── basic-client-table.tsx         # Simple example
│   ├── server-paginated-table.tsx     # Server-side pagination
│   ├── d1-database-example.tsx        # Cloudflare D1 integration
│   ├── column-configuration.tsx       # Type-safe columns
│   ├── controlled-table-state.tsx     # Controlled state + fuzzy search + pinning
│   ├── virtualized-large-dataset.tsx  # Performance optimization
│   └── shadcn-styled-table.tsx        # Tailwind + shadcn
└── references/
    ├── server-side-patterns.md        # API-driven tables guide
    ├── query-integration.md           # TanStack Query patterns
    ├── cloudflare-d1-examples.md      # Workers + D1 examples
    ├── performance-virtualization.md  # TanStack Virtual guide
    ├── common-errors.md               # 6+ issues + solutions
    └── feature-controls.md            # State, visibility, pinning, ordering, fuzzy/global filtering
```

## Stack Compatibility

**Tested with:**
- ✅ React 19.2+
- ✅ Vite 6.0+
- ✅ TypeScript 5.8+
- ✅ Cloudflare Workers (Wrangler 4.0)
- ✅ TanStack Query v5.90.7
- ✅ Tailwind v4 + shadcn/ui

**Cloudflare Integration:**
- ✅ Workers Static Assets
- ✅ D1 database
- ✅ Workers API endpoints
- ✅ Server-side rendering (SSR) compatible

## Further Reading

- **Skill Docs:** `~/.claude/skills/tanstack-table/SKILL.md`
- **Official Docs:** https://tanstack.com/table/latest
- **GitHub:** https://github.com/TanStack/table (24k+ stars)
- **TanStack Virtual:** https://tanstack.com/virtual/latest

---

**Version:** 1.1.0
**Last Updated:** 2025-12-09
**Author:** Claude Skills Maintainers
**License:** MIT

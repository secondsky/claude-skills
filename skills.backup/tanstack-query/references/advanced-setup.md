# Advanced TanStack Query Setup

**Complete guide for advanced features: custom hooks, mutations, DevTools, and error boundaries**

Load this reference when: Setting up complex query patterns, implementing mutations with optimistic updates, configuring DevTools, or setting up error boundaries.

---

## Table of Contents

1. [Custom Query Hooks](#custom-query-hooks)
2. [Mutations with Optimistic Updates](#mutations-with-optimistic-updates)
3. [DevTools Advanced Configuration](#devtools-advanced-configuration)
4. [Error Boundaries](#error-boundaries)

---

## Custom Query Hooks

### Pattern: Reusable Query Hooks

**Best practice**: Create custom hooks that encapsulate API calls and use the `queryOptions` factory for reusability.

```tsx
// src/api/todos.ts - API functions
export type Todo = {
  id: number
  title: string
  completed: boolean
}

export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos')
  if (!response.ok) {
    throw new Error(`Failed to fetch todos: ${response.statusText}`)
  }
  return response.json()
}

export async function fetchTodoById(id: number): Promise<Todo> {
  const response = await fetch(`/api/todos/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch todo ${id}: ${response.statusText}`)
  }
  return response.json()
}

// src/hooks/useTodos.ts - Query hooks
import { useQuery, queryOptions } from '@tanstack/react-query'
import { fetchTodos, fetchTodoById } from '../api/todos'

// Query options factory (v5 pattern for reusability)
export const todosQueryOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 1000 * 60, // 1 minute
})

export function useTodos() {
  return useQuery(todosQueryOptions)
}

export function useTodo(id: number) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => fetchTodoById(id),
    enabled: !!id, // Only fetch if id is truthy
  })
}
```

### Why use queryOptions factory:

✅ **Perfect type inference** - TypeScript infers data and error types automatically
✅ **Reusable** - Use same options with `useQuery`, `useSuspenseQuery`, `prefetchQuery`
✅ **Consistent** - QueryKey and queryFn always match
✅ **Testable** - Easy to mock and test
✅ **Maintainable** - Update in one place, affects all usages

### Query Key Structure Best Practices

Follow hierarchical structure for efficient cache invalidation:

```tsx
// List queries
['todos']                                    // All todos
['todos', 'filters', { status: 'completed' }] // Filtered todos
['todos', 'search', 'query']                  // Search results

// Detail queries (more specific = subset of list)
['todos', id]                                 // Single todo
['todos', id, 'comments']                     // Todo's comments

// Invalidation behavior:
queryClient.invalidateQueries({ queryKey: ['todos'] })
// ↑ Invalidates ALL todo queries (list, filters, details, comments)

queryClient.invalidateQueries({ queryKey: ['todos', id] })
// ↑ Invalidates only this todo and its comments
```

**Rule**: More specific keys are subsets. Invalidating parent key invalidates all children.

---

## Mutations with Optimistic Updates

### Basic Mutation Pattern

```tsx
// src/hooks/useTodoMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo } from '../api/todos'

type AddTodoInput = {
  title: string
}

export function useAddTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTodo: AddTodoInput) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      })
      if (!response.ok) throw new Error('Failed to add todo')
      return response.json()
    },

    // Simple invalidation after success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
```

### Optimistic Update Pattern

For instant UI feedback before server confirms:

```tsx
export function useAddTodoOptimistic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTodo: AddTodoInput) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      })
      if (!response.ok) throw new Error('Failed to add todo')
      return response.json()
    },

    // 1. Before mutation runs: Update cache optimistically
    onMutate: async (newTodo) => {
      // Cancel any outgoing refetches (don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value for rollback
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      // Optimistically update to the new value
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) => [
        ...old,
        { id: Date.now(), ...newTodo, completed: false },
      ])

      // Return context object with snapshot
      return { previousTodos }
    },

    // 2. If mutation fails: Rollback to snapshot
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
    },

    // 3. Always refetch after mutation (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
```

### Update and Delete Mutations

```tsx
type UpdateTodoInput = {
  id: number
  completed: boolean
}

export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completed }: UpdateTodoInput) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      if (!response.ok) throw new Error('Failed to update todo')
      return response.json()
    },

    onSuccess: (updatedTodo) => {
      // Update specific todo in cache
      queryClient.setQueryData<Todo>(['todos', updatedTodo.id], updatedTodo)

      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete todo')
    },

    onSuccess: (_, deletedId) => {
      // Remove from cache immediately
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
        old.filter(todo => todo.id !== deletedId)
      )
    },
  })
}
```

### Optimistic Updates: When to Use

✅ **Use optimistic updates for:**
- Toggle operations (like/unlike, complete/incomplete)
- Low-risk mutations (UI state changes)
- Immediate feedback is critical (better UX)
- Rollback is acceptable (can show error and revert)

❌ **Avoid optimistic updates for:**
- Payment processing
- Account deletion
- Data exports
- Critical business logic
- Anything where rollback is unacceptable

---

## DevTools Advanced Configuration

### Basic Setup (Recommended)

Already covered in main setup, but here's the quick version:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Advanced Options

```tsx
<ReactQueryDevtools
  initialIsOpen={false}
  buttonPosition="bottom-right"  // or "top-left", "top-right", "bottom-left"
  position="bottom"               // Panel position: "bottom", "top", "left", "right"

  // Custom toggle button styles
  toggleButtonProps={{
    style: {
      marginBottom: '4rem',
      backgroundColor: '#ff6347',
    },
  }}

  // Custom panel styles
  panelProps={{
    style: {
      height: '400px',
      fontSize: '14px',
    },
  }}

  // Conditional rendering (explicit check, though tree-shaken in production)
  // {import.meta.env.DEV && <ReactQueryDevtools />}
/>
```

### DevTools Features

1. **Query Explorer**
   - View all active queries
   - See query states (pending, success, error, stale)
   - Inspect query data
   - View refetch timestamps

2. **Manual Controls**
   - Manually trigger refetch
   - Invalidate queries
   - Reset query state
   - Prefetch queries

3. **Mutations View**
   - See all mutations in flight
   - View mutation state
   - Inspect mutation variables

4. **Cache Inspector**
   - Browse query cache contents
   - See cache entry metadata
   - Inspect garbage collection status

5. **Time Travel**
   - Export cache state
   - Import previous cache state
   - Debug cache inconsistencies

### Production Considerations

**Tree-shaking**: DevTools are automatically removed in production builds when using:
- Vite
- Webpack 5+
- Rollup

**Bundle size**: DevTools add ~50KB to development bundle but 0KB to production.

**No configuration needed**: Just import and use. Build tools handle the rest.

---

## Error Boundaries

### Basic Error Boundary

React Error Boundary with TanStack Query integration:

```tsx
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'

type Props = { children: ReactNode }
type State = { hasError: boolean }

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Wrapper with TanStack Query error reset
export function ErrorBoundary({ children }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundaryClass onReset={reset}>
          {children}
        </ErrorBoundaryClass>
      )}
    </QueryErrorResetBoundary>
  )
}
```

### Using throwOnError

Tell queries to throw errors to error boundary:

```tsx
// Always throw errors
function useTodosWithErrorBoundary() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    throwOnError: true, // Errors thrown to nearest error boundary
  })
}

// Conditional error throwing
function useTodosConditionalError() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    throwOnError: (error, query) => {
      // Only throw server errors (5xx)
      // Handle network errors locally
      return error instanceof Response && error.status >= 500
    },
  })
}
```

### Error Handling Strategies

#### 1. Local Error Handling (Default)

```tsx
function TodoList() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error: {error.message}</div>

  return <ul>{/* render todos */}</ul>
}
```

**Pros**: Fine-grained control, component-specific error UI
**Cons**: Repetitive error handling code

#### 2. Global Error Boundary

```tsx
function TodoList() {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    throwOnError: true, // Throw to error boundary
  })

  // No error handling needed - error boundary handles it
  return <ul>{/* render todos */}</ul>
}

// App.tsx
<ErrorBoundary>
  <TodoList />
</ErrorBoundary>
```

**Pros**: Centralized error handling, less boilerplate
**Cons**: Less control over error UI per component

#### 3. Mixed Strategy (Recommended)

```tsx
function TodoList() {
  const { data, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    throwOnError: (error) => {
      // Throw critical errors to error boundary
      if (error instanceof Response && error.status >= 500) {
        return true
      }
      // Handle non-critical errors locally
      return false
    },
  })

  if (isError) {
    // Handle 4xx errors locally
    return <div>Please check your input</div>
  }

  return <ul>{/* render todos */}</ul>
}
```

**Pros**: Best of both worlds - critical errors centralized, minor errors local
**Cons**: Slightly more complex logic

#### 4. QueryCache Global Handlers

For logging or analytics:

```tsx
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Log all query errors
      console.error(`Query error: ${query.queryKey}`, error)

      // Send to error tracking service
      // Sentry.captureException(error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Log all mutation errors
      console.error('Mutation error:', error)
    },
  }),
})
```

---

## Complete Example: Todo App

Putting it all together:

```tsx
// src/hooks/useTodos.ts
import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query'

export const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})

export function useTodos() {
  return useQuery(todosOptions)
}

export function useAddTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

// src/components/TodoApp.tsx
function TodoApp() {
  const { data: todos, isPending } = useTodos()
  const { mutate: addTodo, isPending: isAdding } = useAddTodo()

  if (isPending) return <div>Loading...</div>

  return (
    <div>
      <form onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const title = new FormData(form).get('title') as string
        addTodo({ title })
        form.reset()
      }}>
        <input name="title" required />
        <button disabled={isAdding}>
          {isAdding ? 'Adding...' : 'Add Todo'}
        </button>
      </form>

      <ul>
        {todos?.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

**Last Updated**: 2025-11-21
**Verified With**: @tanstack/react-query@5.90.10

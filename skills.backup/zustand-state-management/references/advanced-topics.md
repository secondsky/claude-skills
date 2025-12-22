# Advanced Zustand Topics

This reference covers advanced Zustand patterns for complex use cases.

---

## Vanilla Store (Without React)

Use Zustand outside React for Node.js, tests, or framework-agnostic code.

```typescript
import { createStore } from 'zustand/vanilla'

interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
}

const store = createStore<CounterStore>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))

// Subscribe to changes
const unsubscribe = store.subscribe((state, prevState) => {
  console.log('Count changed:', prevState.count, '->', state.count)
})

// Get current state
console.log(store.getState().count) // 0

// Update state
store.getState().increment()
console.log(store.getState().count) // 1

// Direct set
store.setState({ count: 10 })

// Cleanup
unsubscribe()
```

### Using Vanilla Store in React

```typescript
import { createStore, useStore } from 'zustand'

// Create vanilla store
const counterStore = createStore<CounterStore>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Create React hook
function useCounterStore<T>(selector: (state: CounterStore) => T): T {
  return useStore(counterStore, selector)
}

// Use in component
function Counter() {
  const count = useCounterStore((state) => state.count)
  return <div>{count}</div>
}
```

---

## Custom Middleware

Create reusable middleware for cross-cutting concerns.

### Logger Middleware

```typescript
import { StateCreator, StoreMutatorIdentifier } from 'zustand'

type Logger = <T>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>

const logger: Logger = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    const before = get()
    set(...(a as Parameters<typeof set>))
    const after = get()
    console.log(`[${name ?? 'store'}]`, { before, after })
  }
  return f(loggedSet, get, store)
}

// Use custom middleware
const useStore = create<MyStore>()(
  logger((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }), 'CounterStore'),
)
```

### Timestamp Middleware

```typescript
type WithTimestamp<T> = T & { _lastUpdated: number }

const timestamp = <T>(f: StateCreator<T, [], []>): StateCreator<WithTimestamp<T>, [], []> =>
  (set, get, store) => ({
    ...f(
      (partial, replace) => {
        set(
          (state) => ({
            ...(typeof partial === 'function' ? partial(state as T) : partial),
            _lastUpdated: Date.now(),
          }) as WithTimestamp<T>,
          replace,
        )
      },
      get as () => T,
      store,
    ),
    _lastUpdated: Date.now(),
  })
```

---

## Immer Middleware (Mutable Updates)

Write mutable update syntax that becomes immutable under the hood.

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface TodoStore {
  todos: Array<{ id: string; text: string; done: boolean }>
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
}

const useStore = create<TodoStore>()(
  immer((set) => ({
    todos: [],
    addTodo: (text) =>
      set((state) => {
        // Mutate directly with Immer
        state.todos.push({ id: Date.now().toString(), text, done: false })
      }),
    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id)
        if (todo) todo.done = !todo.done
      }),
    removeTodo: (id) =>
      set((state) => {
        const index = state.todos.findIndex((t) => t.id === id)
        if (index !== -1) state.todos.splice(index, 1)
      }),
  })),
)
```

**When to use Immer**:
- Deeply nested state updates
- Complex array manipulations
- Team familiarity with mutable patterns

**When NOT to use Immer**:
- Simple state
- Performance-critical apps (Immer adds overhead)
- Small bundle size requirements

---

## Subscriptions and Side Effects

React to state changes outside components.

```typescript
// Subscribe to specific state changes
const unsubscribe = useStore.subscribe(
  (state) => state.count,
  (count, prevCount) => {
    console.log('Count changed from', prevCount, 'to', count)

    // Trigger side effect
    if (count > 10) {
      analytics.track('count_exceeded_10')
    }
  },
)

// Subscribe with selector and equality function
import { shallow } from 'zustand/shallow'

useStore.subscribe(
  (state) => ({ count: state.count, name: state.name }),
  (selection, prevSelection) => {
    console.log('Selection changed:', selection)
  },
  { equalityFn: shallow },
)
```

### Transient Updates (No Re-render)

Update state without triggering re-renders.

```typescript
const useStore = create<{
  x: number
  y: number
  setPosition: (x: number, y: number) => void
}>()((set) => ({
  x: 0,
  y: 0,
  setPosition: (x, y) => set({ x, y }, true), // Replace, don't merge
}))

// Subscribe to track position without React re-renders
const unsubscribe = useStore.subscribe(console.log)
```

---

## Testing Zustand Stores

### Unit Testing Stores

```typescript
import { act, renderHook } from '@testing-library/react'
import { useCounterStore } from './counterStore'

describe('counterStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useCounterStore.setState({ count: 0 })
  })

  it('should increment count', () => {
    const { result } = renderHook(() => useCounterStore())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it('should decrement count', () => {
    useCounterStore.setState({ count: 5 })
    const { result } = renderHook(() => useCounterStore())

    act(() => {
      result.current.decrement()
    })

    expect(result.current.count).toBe(4)
  })
})
```

### Testing with Persist Middleware

```typescript
import { usePersistedStore } from './persistedStore'

describe('persistedStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    // Reset store
    usePersistedStore.setState({ value: '' })
  })

  it('should persist to localStorage', async () => {
    const { result } = renderHook(() => usePersistedStore())

    act(() => {
      result.current.setValue('test')
    })

    // Wait for persist
    await new Promise((r) => setTimeout(r, 0))

    expect(localStorage.getItem('persisted-store')).toContain('test')
  })
})
```

---

## Performance Optimization

### Fine-Grained Selectors

```typescript
// ❌ Subscribes to entire store
const { count, name, items } = useStore()

// ✅ Subscribes only to what's needed
const count = useStore((state) => state.count)
const name = useStore((state) => state.name)
```

### Memoized Selectors

```typescript
import { useMemo } from 'react'

function ExpensiveList() {
  const items = useStore((state) => state.items)

  // Memoize expensive computation
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  )

  return <ul>{sortedItems.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
}
```

### Batched Updates

```typescript
const useStore = create<MyStore>()((set) => ({
  count: 0,
  name: '',
  // Batch multiple updates
  updateBoth: (count: number, name: string) =>
    set({ count, name }), // Single update, single re-render
}))
```

---

## Summary

| Topic | Use Case | Key API |
|-------|----------|---------|
| Vanilla store | Non-React, testing | `createStore()` |
| Custom middleware | Logging, timestamps | `StateCreator` wrapping |
| Immer | Complex nested updates | `immer()` middleware |
| Subscriptions | Side effects | `store.subscribe()` |
| Testing | Unit tests | `setState()`, `renderHook()` |
| Performance | Optimization | Fine-grained selectors |

---

## See Also

- `middleware-guide.md` - Built-in middleware details
- `typescript-patterns.md` - TypeScript-specific patterns
- Official docs: https://zustand.docs.pmnd.rs/

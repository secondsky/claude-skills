# Common Zustand Patterns - Detailed Examples

This reference provides complete implementations for common Zustand patterns.

---

## Pattern: Computed/Derived Values

Compute values in selectors, not in the store itself.

```typescript
interface StoreWithComputed {
  items: string[]
  addItem: (item: string) => void
  // Computed in selector, not stored
}

const useStore = create<StoreWithComputed>()((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}))

// Use in component
function ItemCount() {
  const count = useStore((state) => state.items.length)
  return <div>{count} items</div>
}

// More complex computed values
function ExpensiveItems() {
  const expensive = useStore((state) =>
    state.items.filter((item) => item.startsWith('expensive'))
  )
  return <div>{expensive.length} expensive items</div>
}
```

**Key Points**:
- Compute in selector, not store
- Memoize expensive computations with `useMemo` if needed
- Selectors run on every render - keep them fast

---

## Pattern: Async Actions

Handle asynchronous operations with loading and error states.

```typescript
interface AsyncStore {
  data: string | null
  isLoading: boolean
  error: string | null
  fetchData: () => Promise<void>
}

const useAsyncStore = create<AsyncStore>()((set) => ({
  data: null,
  isLoading: false,
  error: null,
  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/data')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.text()
      set({ data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
}))

// Use in component
function DataDisplay() {
  const { data, isLoading, error, fetchData } = useAsyncStore()

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{data}</div>
}
```

**Best Practice**: For complex server state, consider TanStack Query instead.

---

## Pattern: Resetting Store

Reset store to initial values (useful for logout, form reset, etc.).

```typescript
interface ResettableStore {
  count: number
  name: string
  increment: () => void
  setName: (name: string) => void
  reset: () => void
}

const initialState = {
  count: 0,
  name: '',
}

const useStore = create<ResettableStore>()((set) => ({
  ...initialState,
  increment: () => set((state) => ({ count: state.count + 1 })),
  setName: (name) => set({ name }),
  reset: () => set(initialState),
}))

// Use in component
function LogoutButton() {
  const reset = useStore((state) => state.reset)

  const handleLogout = () => {
    // Clear user session
    reset() // Reset store to initial state
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

---

## Pattern: Selector with Params

Create parameterized selectors for dynamic data access.

```typescript
interface TodoStore {
  todos: Array<{ id: string; text: string; done: boolean }>
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
}

const useStore = create<TodoStore>()((set) => ({
  todos: [],
  addTodo: (text) =>
    set((state) => ({
      todos: [...state.todos, { id: Date.now().toString(), text, done: false }],
    })),
  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      ),
    })),
}))

// Use with parameter
function Todo({ id }: { id: string }) {
  const todo = useStore((state) => state.todos.find((t) => t.id === id))
  const toggleTodo = useStore((state) => state.toggleTodo)

  if (!todo) return null

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => toggleTodo(id)}
      />
      {todo.text}
    </div>
  )
}

// Filtered todos
function CompletedTodos() {
  const completedTodos = useStore((state) =>
    state.todos.filter((t) => t.done)
  )
  return <div>{completedTodos.length} completed</div>
}
```

---

## Pattern: Multiple Stores

Separate concerns with multiple independent stores.

```typescript
// userStore.ts
interface UserStore {
  user: { id: string; name: string } | null
  setUser: (user: UserStore['user']) => void
  logout: () => void
}

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

// cartStore.ts
interface CartStore {
  items: Array<{ id: string; quantity: number }>
  addItem: (id: string) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()((set) => ({
  items: [],
  addItem: (id) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { items: [...state.items, { id, quantity: 1 }] }
    }),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
  clearCart: () => set({ items: [] }),
}))

// Use in components
function Header() {
  const user = useUserStore((state) => state.user)
  const itemCount = useCartStore((state) => state.items.length)

  return (
    <header>
      <span>{user?.name ?? 'Guest'}</span>
      <span>Cart: {itemCount}</span>
    </header>
  )
}
```

---

## Pattern: Cross-Store Actions

Access one store from another for complex workflows.

```typescript
// Use getState() to access store outside React
const useAuthStore = create<AuthStore>()((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => {
    set({ isAuthenticated: false })
    // Clear cart when logging out
    useCartStore.getState().clearCart()
  },
}))
```

---

## Summary Table

| Pattern | Use Case | Key Function |
|---------|----------|--------------|
| Computed values | Derived data | Selector functions |
| Async actions | API calls | `set` with loading/error states |
| Reset store | Logout, form clear | `set(initialState)` |
| Selector with params | Dynamic access | `state.items.find(id)` |
| Multiple stores | Separation of concerns | Create separate stores |
| Cross-store actions | Complex workflows | `otherStore.getState()` |

---

## See Also

- Main SKILL.md for basic patterns
- `templates/` for copy-paste implementations
- `typescript-patterns.md` for advanced typing

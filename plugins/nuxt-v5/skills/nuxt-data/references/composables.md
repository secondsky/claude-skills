# Composables - Advanced Patterns

Comprehensive guide to creating and using composables in Nuxt 4.

## Table of Contents

- [Naming Conventions](#naming-conventions)
- [useState vs ref](#usestate-vs-ref)
- [SSR-Safe Patterns](#ssr-safe-patterns)
- [Error Handling](#error-handling)
- [TypeScript Patterns](#typescript-patterns)
- [Testing Composables](#testing-composables)
- [Advanced Patterns](#advanced-patterns)

## Naming Conventions

### Always Use `use` Prefix

```typescript
// ✅ Good
export const useAuth = () => { /* ... */ }
export const useCart = () => { /* ... */ }
export const useProductFilters = () => { /* ... */ }

// ❌ Bad
export const auth = () => { /* ... */ }
export const getCart = () => { /* ... */ }
export const productFilters = () => { /* ... */ }
```

**Why?** The `use` prefix is a universal convention that immediately identifies a function as a composable.

### Be Specific and Descriptive

```typescript
// ✅ Good
export const useUserProfile = () => { /* ... */ }
export const useShoppingCart = () => { /* ... */ }
export const useProductSearch = () => { /* ... */ }

// ❌ Bad (too vague)
export const useProfile = () => { /* ... */ }
export const useCart = () => { /* ... */ }
export const useSearch = () => { /* ... */ }
```

### Namespace for Large Apps

```typescript
// For large apps, namespace your composables
export const useAuthUser = () => { /* ... */ }
export const useAuthSession = () => { /* ... */ }
export const useAuthPermissions = () => { /* ... */ }

export const useCartItems = () => { /* ... */ }
export const useCartTotal = () => { /* ... */ }
export const useCartCheckout = () => { /* ... */ }
```

## useState vs ref

### The Golden Rule

**Use `useState` for shared state that survives component unmount.**
**Use `ref` for local component state.**

### useState: Shared Global State

```typescript
// composables/useCounter.ts
export const useCounter = () => {
  // Survives component unmount, shared across all components
  const count = useState('counter', () => 0)

  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = 0

  return {
    count: readonly(count),  // Expose as readonly
    increment,
    decrement,
    reset
  }
}

// Component A
const { count, increment } = useCounter()
increment()  // count = 1

// Component B (different component, same state!)
const { count } = useCounter()
console.log(count.value)  // 1 (shared state!)
```

### ref: Local Component State

```typescript
// composables/useLocalCounter.ts
export const useLocalCounter = () => {
  // New instance for each component
  const count = ref(0)

  const increment = () => count.value++

  return { count, increment }
}

// Component A
const { count, increment } = useLocalCounter()
increment()  // count = 1

// Component B (different instance!)
const { count } = useLocalCounter()
console.log(count.value)  // 0 (new instance!)
```

### When to Use Each

| Use Case | useState | ref |
|----------|----------|-----|
| User authentication state | ✅ | ❌ |
| Shopping cart | ✅ | ❌ |
| UI theme (dark/light) | ✅ | ❌ |
| Global notifications | ✅ | ❌ |
| Form input value | ❌ | ✅ |
| Component open/closed state | ❌ | ✅ |
| Local loading state | ❌ | ✅ |
| Temporary UI state | ❌ | ✅ |

## SSR-Safe Patterns

### Browser API Guards

```typescript
// ✅ Pattern 1: Check environment in useState initializer
export const useWindowSize = () => {
  const width = useState('window-width', () => {
    if (import.meta.client) {
      return window.innerWidth
    }
    return 0
  })

  const height = useState('window-height', () => {
    if (import.meta.client) {
      return window.innerHeight
    }
    return 0
  })

  return { width, height }
}

// ✅ Pattern 2: Use onMounted
export const useWindowSize = () => {
  const width = ref(0)
  const height = ref(0)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { width, height }
}
```

### LocalStorage/SessionStorage

```typescript
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const value = useState<T>(key, () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    }
    return defaultValue
  })

  const setValue = (newValue: T) => {
    value.value = newValue

    if (import.meta.client) {
      localStorage.setItem(key, JSON.stringify(newValue))
    }
  }

  const removeValue = () => {
    value.value = defaultValue

    if (import.meta.client) {
      localStorage.removeItem(key)
    }
  }

  return {
    value: readonly(value),
    setValue,
    removeValue
  }
}

// Usage
const { value: theme, setValue: setTheme } = useLocalStorage('theme', 'light')
```

### Document/Window Events

```typescript
export const useKeyPress = (targetKey: string) => {
  const isPressed = ref(false)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === targetKey) {
      isPressed.value = true
    }
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === targetKey) {
      isPressed.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  return isPressed
}

// Usage
const escapePressed = useKeyPress('Escape')
```

## Error Handling

### Expose Error State

```typescript
export const useApi = <T>(url: string) => {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  const execute = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<T>(url)
      data.value = response
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      throw err  // Re-throw for caller to handle
    } finally {
      isLoading.value = false
    }
  }

  return {
    data: readonly(data),
    error: readonly(error),
    isLoading: readonly(isLoading),
    execute
  }
}

// Usage
const api = useApi<User[]>('/api/users')

try {
  await api.execute()
} catch (err) {
  // Handle error
  showToast({ type: 'error', message: api.error.value?.message })
}
```

### Try-Catch Patterns

```typescript
export const useAuth = () => {
  const state = useState('auth', () => ({
    user: null as User | null,
    error: null as string | null,
    isLoading: false
  }))

  const login = async (email: string, password: string) => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (error.value) {
        throw new Error(error.value.message)
      }

      state.value.user = data.value.user
      await navigateTo('/dashboard')

    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'Login failed'
      throw err

    } finally {
      state.value.isLoading = false
    }
  }

  return {
    user: computed(() => state.value.user),
    error: computed(() => state.value.error),
    isLoading: computed(() => state.value.isLoading),
    login
  }
}
```

## TypeScript Patterns

### Full Type Safety

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  const state = useState<AuthState>('auth', () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }))

  const login = async (email: string, password: string): Promise<void> => {
    // Implementation
  }

  const logout = async (): Promise<void> => {
    // Implementation
  }

  return {
    // Computed for type safety
    user: computed(() => state.value.user),
    isAuthenticated: computed(() => state.value.isAuthenticated),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),

    // Methods
    login,
    logout
  }
}

// Usage is fully typed!
const { user, login } = useAuth()
user.value?.email  // ✅ TypeScript knows this might be null
```

### Generic Composables

```typescript
export const useResource = <T>(resourceName: string) => {
  const items = useState<T[]>(`${resourceName}-items`, () => [])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const fetchAll = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await useFetch<T[]>(`/api/${resourceName}`)
      items.value = data.value || []
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
    } finally {
      isLoading.value = false
    }
  }

  const create = async (item: Partial<T>) => {
    const { data } = await useFetch<T>(`/api/${resourceName}`, {
      method: 'POST',
      body: item
    })

    if (data.value) {
      items.value.push(data.value)
    }

    return data.value
  }

  return {
    items: readonly(items),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAll,
    create
  }
}

// Usage
interface Product {
  id: string
  name: string
  price: number
}

const products = useResource<Product>('products')
await products.fetchAll()
```

## Testing Composables

### Basic Test

```typescript
// composables/useCounter.test.ts
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('starts at 0', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })

  it('increments', () => {
    const { count, increment } = useCounter()

    increment()
    expect(count.value).toBe(1)

    increment()
    expect(count.value).toBe(2)
  })

  it('decrements', () => {
    const { count, increment, decrement } = useCounter()

    increment()
    increment()
    increment()
    expect(count.value).toBe(3)

    decrement()
    expect(count.value).toBe(2)
  })

  it('resets', () => {
    const { count, increment, reset } = useCounter()

    increment()
    increment()
    increment()
    reset()

    expect(count.value).toBe(0)
  })
})
```

### Testing with Async Operations

```typescript
// composables/useApi.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useApi } from './useApi'

describe('useApi', () => {
  it('fetches data successfully', async () => {
    // Mock $fetch
    global.$fetch = vi.fn().mockResolvedValue([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ])

    const api = useApi('/api/users')
    await api.execute()

    expect(api.data.value).toHaveLength(2)
    expect(api.error.value).toBeNull()
    expect(api.isLoading.value).toBe(false)
  })

  it('handles errors', async () => {
    global.$fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const api = useApi('/api/users')

    try {
      await api.execute()
    } catch (err) {
      expect(api.error.value?.message).toBe('Network error')
      expect(api.data.value).toBeNull()
    }
  })
})
```

## Advanced Patterns

### Polling

```typescript
export const usePolling = <T>(
  fetcher: () => Promise<T>,
  interval: number = 5000
) => {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isPolling = ref(false)

  let intervalId: NodeJS.Timeout | null = null

  const poll = async () => {
    try {
      data.value = await fetcher()
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
    }
  }

  const startPolling = async () => {
    if (isPolling.value) return

    isPolling.value = true

    // Initial fetch
    await poll()

    // Start interval
    intervalId = setInterval(poll, interval)
  }

  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    isPolling.value = false
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopPolling()
  })

  return {
    data: readonly(data),
    error: readonly(error),
    isPolling: readonly(isPolling),
    startPolling,
    stopPolling
  }
}

// Usage
const { data, startPolling, stopPolling } = usePolling(
  () => $fetch('/api/stats'),
  10000  // Poll every 10 seconds
)

onMounted(() => startPolling())
```

### Debouncing

```typescript
export const useDebounce = <T>(value: Ref<T>, delay: number = 500) => {
  const debouncedValue = ref<T>(value.value)

  let timeoutId: NodeJS.Timeout | null = null

  watch(value, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return debouncedValue
}

// Usage
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 300)

// Fetch only after user stops typing for 300ms
const { data: results } = await useFetch('/api/search', {
  query: { q: debouncedQuery }
})
```

### Throttling

```typescript
export const useThrottle = <T>(value: Ref<T>, limit: number = 1000) => {
  const throttledValue = ref<T>(value.value)
  const lastRun = ref(0)

  watch(value, (newValue) => {
    const now = Date.now()

    if (now - lastRun.value >= limit) {
      throttledValue.value = newValue
      lastRun.value = now
    }
  })

  return throttledValue
}

// Usage
const scrollPosition = ref(0)
const throttledScroll = useThrottle(scrollPosition, 200)

onMounted(() => {
  window.addEventListener('scroll', () => {
    scrollPosition.value = window.scrollY
  })
})
```

### Async State Management

```typescript
export const useAsyncState = <T>(
  promise: Promise<T>,
  defaultValue: T
) => {
  const state = ref<T>(defaultValue)
  const isReady = ref(false)
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  promise
    .then((data) => {
      state.value = data
      isReady.value = true
    })
    .catch((err) => {
      error.value = err instanceof Error ? err : new Error(String(err))
    })
    .finally(() => {
      isLoading.value = false
    })

  return {
    state: readonly(state),
    isReady: readonly(isReady),
    isLoading: readonly(isLoading),
    error: readonly(error)
  }
}

// Usage
const { state: user, isLoading } = useAsyncState(
  $fetch('/api/user'),
  null
)
```

### Composable Composition

```typescript
// Combine multiple composables
export const useUserProfile = () => {
  const { user } = useAuth()  // Get auth user
  const { data: profile, refresh } = useFetch(() =>
    user.value ? `/api/users/${user.value.id}/profile` : null
  )

  const { value: theme, setValue: setTheme } = useLocalStorage('theme', 'light')

  const updateProfile = async (updates: Partial<Profile>) => {
    await $fetch(`/api/users/${user.value.id}/profile`, {
      method: 'PATCH',
      body: updates
    })

    await refresh()
  }

  return {
    user: readonly(user),
    profile: readonly(profile),
    theme,
    setTheme,
    updateProfile
  }
}
```

## Best Practices Summary

1. **Always use `use` prefix** for composable names
2. **Use `useState` for shared state**, `ref` for local state
3. **Guard browser APIs** with `import.meta.client` or `onMounted`
4. **Expose error state** explicitly
5. **Use TypeScript** for type safety
6. **Return readonly refs** to prevent external mutations
7. **Clean up side effects** in `onUnmounted`
8. **Test composables** in isolation
9. **Keep composables focused** - one responsibility
10. **Document complex composables** with JSDoc

## Common Pitfalls

❌ **Using ref for shared state**
❌ **Missing SSR guards**
❌ **Not cleaning up event listeners**
❌ **Mutating readonly refs**
❌ **Missing error handling**
❌ **Not using TypeScript**
❌ **Forgetting to test**
❌ **Making composables too complex**

---

**Last Updated**: 2025-11-09

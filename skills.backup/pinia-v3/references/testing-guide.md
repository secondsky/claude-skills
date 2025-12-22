# Pinia Testing Guide

Complete guide for testing Pinia stores and components that use stores.

**Last Updated**: 2025-11-21

---

## Unit Testing Stores

### Basic Store Testing

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'
import { describe, it, expect, beforeEach } from 'vitest'

describe('Counter Store', () => {
  beforeEach(() => {
    // Fresh Pinia for each test
    setActivePinia(createPinia())
  })

  it('increments', () => {
    const counter = useCounterStore()
    expect(counter.count).toBe(0)
    counter.increment()
    expect(counter.count).toBe(1)
  })

  it('doubles count', () => {
    const counter = useCounterStore()
    counter.count = 5
    expect(counter.doubleCount).toBe(10)
  })
})
```

**CRITICAL:** Always use `beforeEach(() => setActivePinia(createPinia()))` to create fresh Pinia instances between tests.

---

## Testing with Plugins

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { somePlugin } from './plugins'

describe('Store with Plugin', () => {
  let app

  beforeEach(() => {
    app = createApp({})
    const pinia = createPinia().use(somePlugin)
    app.use(pinia)
    setActivePinia(pinia)
  })
})
```

---

## Component Testing

### Installation

```bash
bun add -d @pinia/testing
```

### Basic Component Test

```typescript
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import Counter from './Counter.vue'

describe('Counter Component', () => {
  it('displays count', () => {
    const wrapper = mount(Counter, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    expect(wrapper.text()).toContain('Count: 0')
  })
})
```

---

## Setting Initial State

```typescript
const wrapper = mount(Counter, {
  global: {
    plugins: [
      createTestingPinia({
        initialState: {
          counter: { count: 20 }
        }
      })
    ]
  }
})
```

---

## Stubbing Actions

### Default: All Actions Stubbed

```typescript
createTestingPinia() // Actions don't execute
```

### Execute All Actions

```typescript
createTestingPinia({ stubActions: false })
```

### Selective Stubbing

```typescript
createTestingPinia({
  stubActions: ['increment', 'reset'] // Only these are stubbed
})
```

### Custom Stubbing Logic

```typescript
createTestingPinia({
  stubActions: (actionName, store) => {
    return actionName.startsWith('set') // Stub setters only
  }
})
```

---

## Mocking Getters

```typescript
const store = useCounterStore()

// Override getter
store.doubleCount = 999

// Reset to default
store.doubleCount = undefined
```

---

## Vitest Spy Setup

```typescript
import { vi } from 'vitest'

createTestingPinia({
  createSpy: vi.fn,
  stubActions: false
})

// Then mock specific actions
const store = useCounterStore()
vi.spyOn(store, 'fetchData').mockResolvedValue({ data: [] })
```

---

## Testing Async Actions

```typescript
import { flushPromises } from '@vue/test-utils'

it('fetches users', async () => {
  const store = useUserStore()

  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve([{ id: 1, name: 'Alice' }])
  })

  await store.fetchUsers()
  await flushPromises()

  expect(store.users).toHaveLength(1)
  expect(store.users[0].name).toBe('Alice')
})
```

---

## Testing Store Subscriptions

```typescript
it('calls subscription on state change', () => {
  const store = useCounterStore()
  const callback = vi.fn()

  store.$subscribe(callback)

  store.count = 5

  expect(callback).toHaveBeenCalledWith(
    expect.objectContaining({
      storeId: 'counter'
    }),
    expect.objectContaining({
      count: 5
    })
  )
})
```

---

## Testing Action Subscriptions

```typescript
it('calls action subscription', async () => {
  const store = useCounterStore()
  const afterCallback = vi.fn()

  store.$onAction(({ after }) => {
    after(afterCallback)
  })

  await store.increment()

  expect(afterCallback).toHaveBeenCalled()
})
```

---

## Testing Store Composition

```typescript
it('uses other stores', () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  authStore.isAuthenticated = true

  userStore.loadUserData()

  // Verify interaction
  expect(userStore.data).toBeDefined()
})
```

---

## Testing with Router

```typescript
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: Home }]
})

const wrapper = mount(App, {
  global: {
    plugins: [createTestingPinia(), router]
  }
})

// Test navigation
await router.push('/')
await router.isReady()
```

---

## Testing SSR Stores

### Server-Side Test

```typescript
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from '@vue/server-renderer'

describe('SSR', () => {
  it('renders store state', async () => {
    const pinia = createPinia()
    const app = createSSRApp({
      setup() {
        const store = useStore()
        store.count = 5
        return () => h('div', store.count)
      }
    })
    app.use(pinia)

    const html = await renderToString(app)
    expect(html).toContain('5')
  })
})
```

### Hydration Test

```typescript
it('hydrates state correctly', () => {
  const pinia = createPinia()

  // Simulate server state
  pinia.state.value = {
    counter: { count: 10 }
  }

  setActivePinia(pinia)

  const store = useCounterStore()
  expect(store.count).toBe(10)
})
```

---

## Testing Error Handling

```typescript
it('handles fetch errors', async () => {
  const store = useUserStore()

  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

  await store.fetchUsers()

  expect(store.error).toBe('Network error')
  expect(store.loading).toBe(false)
})
```

---

## Snapshot Testing

```typescript
it('matches snapshot', () => {
  const store = useCounterStore()

  expect({
    count: store.count,
    doubleCount: store.doubleCount
  }).toMatchSnapshot()
})
```

---

## Testing TypeScript Types

```typescript
import { expectType } from 'tsd'

it('has correct types', () => {
  const store = useCounterStore()

  expectType<number>(store.count)
  expectType<number>(store.doubleCount)
  expectType<() => void>(store.increment)
})
```

---

## Common Testing Patterns

### Pattern 1: Authentication Store Test

```typescript
describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('logs in user', async () => {
    const store = useAuthStore()

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'abc123', user: { name: 'Alice' } })
    })

    await store.login('alice@example.com', 'password')

    expect(store.token).toBe('abc123')
    expect(store.user.name).toBe('Alice')
    expect(store.isAuthenticated).toBe(true)
  })

  it('handles login failure', async () => {
    const store = useAuthStore()

    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    })

    await expect(store.login('invalid', 'wrong')).rejects.toThrow()

    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('logs out user', () => {
    const store = useAuthStore()

    store.token = 'abc123'
    store.user = { name: 'Alice' }

    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
```

### Pattern 2: Data Loading Store Test

```typescript
describe('Products Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetches products successfully', async () => {
    const store = useProductsStore()

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' }
      ])
    })

    await store.fetchProducts()

    expect(store.products).toHaveLength(2)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('handles fetch error', async () => {
    const store = useProductsStore()

    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))

    await store.fetchProducts()

    expect(store.products).toHaveLength(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('API Error')
  })

  it('finds product by id', () => {
    const store = useProductsStore()

    store.products = [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' }
    ]

    const product = store.getProductById(2)

    expect(product).toEqual({ id: 2, name: 'Product 2' })
  })
})
```

---

## Testing Best Practices

### DO:
- ✅ Create fresh Pinia in `beforeEach()`
- ✅ Test one behavior per test
- ✅ Mock external dependencies (fetch, localStorage)
- ✅ Test both success and error cases
- ✅ Use `createTestingPinia()` for component tests
- ✅ Verify side effects (subscriptions, plugins)

### DON'T:
- ❌ Share Pinia instances between tests
- ❌ Test implementation details
- ❌ Forget to flush promises for async actions
- ❌ Rely on test execution order
- ❌ Skip error case testing
- ❌ Test framework code (Vue reactivity, etc.)

---

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts']
  }
})
```

```typescript
// test-setup.ts
import { beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

beforeEach(() => {
  // Global Pinia setup for all tests
  setActivePinia(createPinia())
})
```

---

**See also:**
- `state-getters-actions.md` for API details to test
- `ssr-and-nuxt.md` for SSR testing patterns

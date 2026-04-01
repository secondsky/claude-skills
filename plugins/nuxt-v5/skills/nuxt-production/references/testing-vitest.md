# Testing with Vitest

Comprehensive guide to testing Nuxt 4 applications with Vitest and @nuxt/test-utils.

## Table of Contents

- [Setup](#setup)
- [Component Testing](#component-testing)
- [Composable Testing](#composable-testing)
- [Server Route Testing](#server-route-testing)
- [Mocking](#mocking)
- [Coverage](#coverage)
- [E2E Testing](#e2e-testing)
- [Best Practices](#best-practices)
- [Test Organization](#test-organization)
- [Common Patterns](#common-patterns)
- [Debugging Tests](#debugging-tests)
- [Common Pitfalls](#common-pitfalls)
- [Checklist](#checklist)

## Setup

### Installation

```bash
npm install -D @nuxt/test-utils vitest @vue/test-utils happy-dom
```

### Configuration

```typescript
// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom'  // or 'jsdom'
      }
    }
  }
})
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Component Testing

### Basic Component Test

```typescript
// components/Button.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Button from './Button.vue'

describe('Button', () => {
  it('renders correctly', async () => {
    const wrapper = await mountSuspended(Button, {
      props: {
        label: 'Click me'
      }
    })

    expect(wrapper.text()).toContain('Click me')
  })

  it('emits click event', async () => {
    const wrapper = await mountSuspended(Button)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('applies variant classes', async () => {
    const wrapper = await mountSuspended(Button, {
      props: {
        variant: 'primary'
      }
    })

    expect(wrapper.find('button').classes()).toContain('btn-primary')
  })

  it('is disabled when prop is set', async () => {
    const wrapper = await mountSuspended(Button, {
      props: {
        disabled: true
      }
    })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })
})
```

### Component with Slots

```typescript
// components/Card.test.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Card from './Card.vue'

describe('Card', () => {
  it('renders slot content', async () => {
    const wrapper = await mountSuspended(Card, {
      slots: {
        default: '<p>Slot content</p>',
        header: '<h1>Header</h1>',
        footer: '<button>Action</button>'
      }
    })

    expect(wrapper.html()).toContain('Slot content')
    expect(wrapper.html()).toContain('Header')
    expect(wrapper.html()).toContain('Action')
  })
})
```

### Component with Composables

```typescript
// components/UserProfile.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import UserProfile from './UserProfile.vue'

// Mock composable
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { value: { name: 'John Doe', email: 'john@example.com' } },
    isAuthenticated: { value: true },
    logout: vi.fn()
  }))
}))

describe('UserProfile', () => {
  it('displays user information', async () => {
    const wrapper = await mountSuspended(UserProfile)

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
  })

  it('calls logout when button clicked', async () => {
    const { useAuth } = await import('~/composables/useAuth')
    const wrapper = await mountSuspended(UserProfile)

    await wrapper.find('button').trigger('click')

    expect(useAuth().logout).toHaveBeenCalled()
  })
})
```

## Composable Testing

### Basic Composable Test

```typescript
// composables/useCounter.test.ts
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('starts at 0', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })

  it('increments count', () => {
    const { count, increment } = useCounter()

    increment()
    expect(count.value).toBe(1)

    increment()
    expect(count.value).toBe(2)
  })

  it('decrements count', () => {
    const { count, increment, decrement } = useCounter()

    increment()
    increment()
    increment()
    expect(count.value).toBe(3)

    decrement()
    expect(count.value).toBe(2)
  })

  it('resets to 0', () => {
    const { count, increment, reset } = useCounter()

    increment()
    increment()
    expect(count.value).toBe(2)

    reset()
    expect(count.value).toBe(0)
  })
})
```

### Async Composable Test

```typescript
// composables/useApi.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useApi } from './useApi'

// Mock $fetch
global.$fetch = vi.fn()

describe('useApi', () => {
  it('fetches data successfully', async () => {
    const mockData = [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ]

    global.$fetch.mockResolvedValue(mockData)

    const api = useApi('/api/users')
    await api.execute()

    expect(api.data.value).toEqual(mockData)
    expect(api.error.value).toBeNull()
    expect(api.isLoading.value).toBe(false)
  })

  it('handles errors', async () => {
    global.$fetch.mockRejectedValue(new Error('Network error'))

    const api = useApi('/api/users')

    try {
      await api.execute()
    } catch (err) {
      expect(api.error.value?.message).toBe('Network error')
      expect(api.data.value).toBeNull()
    }
  })

  it('sets loading state', async () => {
    global.$fetch.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([]), 100)
      })
    })

    const api = useApi('/api/users')

    const promise = api.execute()

    expect(api.isLoading.value).toBe(true)

    await promise

    expect(api.isLoading.value).toBe(false)
  })
})
```

## Server Route Testing

### API Route Test

```typescript
// server/api/users.get.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/runtime'

describe('/api/users', async () => {
  await setup({
    server: true
  })

  it('returns users list', async () => {
    const users = await $fetch('/api/users')

    expect(users).toBeInstanceOf(Array)
    expect(users.length).toBeGreaterThan(0)
    expect(users[0]).toHaveProperty('id')
    expect(users[0]).toHaveProperty('name')
  })

  it('filters by query param', async () => {
    const users = await $fetch('/api/users', {
      query: { role: 'admin' }
    })

    expect(users.every(u => u.role === 'admin')).toBe(true)
  })

  it('returns 404 for non-existent user', async () => {
    try {
      await $fetch('/api/users/non-existent')
    } catch (error) {
      expect(error.response?.status).toBe(404)
    }
  })
})
```

### POST Request Test

```typescript
// server/api/users.post.test.ts
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/runtime'

describe('POST /api/users', async () => {
  await setup({
    server: true
  })

  it('creates new user', async () => {
    const newUser = {
      name: 'Test User',
      email: 'test@example.com'
    }

    const created = await $fetch('/api/users', {
      method: 'POST',
      body: newUser
    })

    expect(created).toHaveProperty('id')
    expect(created.name).toBe(newUser.name)
    expect(created.email).toBe(newUser.email)
  })

  it('validates required fields', async () => {
    try {
      await $fetch('/api/users', {
        method: 'POST',
        body: { name: 'Test' }  // Missing email
      })
    } catch (error) {
      expect(error.response?.status).toBe(400)
      expect(error.data).toHaveProperty('message')
    }
  })
})
```

## Mocking

### Mock useFetch

```typescript
import { vi } from 'vitest'

vi.mock('#app', () => ({
  useFetch: vi.fn((url) => ({
    data: ref([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ]),
    error: ref(null),
    pending: ref(false),
    refresh: vi.fn()
  }))
}))
```

### Mock useState

```typescript
vi.mock('#app', () => ({
  useState: vi.fn((key, init) => {
    const state = ref(init())
    return state
  })
}))
```

### Mock useRoute

```typescript
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { id: '123' },
    query: { page: '1' },
    path: '/users/123'
  }))
}))
```

### Mock Composables

```typescript
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: ref({ id: '1', name: 'John Doe' }),
    isAuthenticated: ref(true),
    login: vi.fn(),
    logout: vi.fn()
  }))
}))
```

## Coverage

### Setup Coverage

```bash
npm install -D @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.nuxt/**',
        '.output/**',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  }
})
```

### Run Coverage

```bash
npm run test:coverage
```

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineVitestConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
})
```

## E2E Testing

### With Playwright

```bash
npm install -D @playwright/test
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000'
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true
  }
})
```

```typescript
// tests/e2e/login.test.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use meaningful test descriptions**
3. **Group related tests** with `describe`
4. **Keep tests isolated** (no shared state)
5. **Mock external dependencies**
6. **Test edge cases** and error scenarios
7. **Use TypeScript** for type safety
8. **Maintain high coverage** (>80%)
9. **Run tests in CI/CD**
10. **Keep tests fast** (<100ms per test)

## Test Organization

```
tests/
├── components/
│   ├── Button.test.ts
│   ├── Card.test.ts
│   └── Modal.test.ts
├── composables/
│   ├── useAuth.test.ts
│   ├── useCart.test.ts
│   └── useCounter.test.ts
├── server/
│   ├── api/
│   │   ├── users.get.test.ts
│   │   └── users.post.test.ts
│   └── utils/
│       └── validation.test.ts
└── e2e/
    ├── login.test.ts
    ├── checkout.test.ts
    └── navigation.test.ts
```

## Common Patterns

### Test Setup

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('MyComponent', () => {
  beforeEach(() => {
    // Run before each test
  })

  afterEach(() => {
    // Run after each test
  })

  it('test 1', () => {})
  it('test 2', () => {})
})
```

### Async Tests

```typescript
it('fetches data', async () => {
  const data = await fetchData()
  expect(data).toBeDefined()
})
```

### Testing Reactivity

```typescript
it('updates reactively', async () => {
  const { count, increment } = useCounter()

  expect(count.value).toBe(0)

  increment()
  await nextTick()  // Wait for reactivity

  expect(count.value).toBe(1)
})
```

### Snapshot Testing

```typescript
it('matches snapshot', async () => {
  const wrapper = await mountSuspended(Button)
  expect(wrapper.html()).toMatchSnapshot()
})
```

## Debugging Tests

### Run Single Test

```bash
npm run test -- Button.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

### UI Mode

```bash
npm run test:ui
```

### Debug in VS Code

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Common Pitfalls

❌ **Testing implementation details**
❌ **Shared state between tests**
❌ **Not mocking external dependencies**
❌ **Missing async/await**
❌ **Not testing error cases**
❌ **Slow tests**
❌ **Low coverage**
❌ **Not running tests in CI**

## Checklist

- [ ] All components have tests
- [ ] All composables have tests
- [ ] All API routes have tests
- [ ] Coverage > 80%
- [ ] Tests pass in CI
- [ ] E2E tests for critical flows
- [ ] Mocks are properly set up
- [ ] Tests are fast (<100ms each)
- [ ] Edge cases are covered
- [ ] Error scenarios are tested

---

**Last Updated**: 2025-12-28

---
name: playwright-testing
description: End-to-end testing with Playwright. Cross-browser testing, visual regression, API testing, and component testing. Use for E2E tests in TypeScript/JavaScript and Python projects.
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, TodoWrite
---

# Playwright Testing

Expert knowledge for end-to-end testing with Playwright - a modern cross-browser testing framework.

## Quick Start

### Installation

```bash
# Using Bun
bun add -d @playwright/test
bunx playwright install

# Using npm
npm init playwright@latest
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
  },
})
```

## Running Tests

```bash
# Run all tests
bunx playwright test

# Headed mode (see browser)
bunx playwright test --headed

# Specific file
bunx playwright test tests/login.spec.ts

# Debug mode
bunx playwright test --debug

# UI mode (interactive)
bunx playwright test --ui

# Specific browser
bunx playwright test --project=chromium

# Generate report
bunx playwright show-report
```

## Writing Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('successful login', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Login' }).click()
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Invalid credentials')).toBeVisible()
  })
})
```

## Selectors (Best Practices)

```typescript
// ✅ Role-based (recommended)
await page.getByRole('button', { name: 'Submit' })
await page.getByRole('link', { name: 'Home' })

// ✅ Text/Label
await page.getByText('Hello World')
await page.getByLabel('Email')

// ✅ Test ID (fallback)
await page.getByTestId('submit-button')

// ❌ Avoid CSS selectors (brittle)
await page.locator('.btn-primary')
```

## Assertions

```typescript
// Visibility
await expect(page.getByText('Success')).toBeVisible()
await expect(page.getByRole('button')).toBeEnabled()

// Text
await expect(page.getByRole('heading')).toHaveText('Welcome')
await expect(page.getByRole('alert')).toContainText('error')

// Attributes
await expect(page.getByRole('link')).toHaveAttribute('href', '/home')

// URL/Title
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveTitle('Dashboard')

// Count
await expect(page.getByRole('listitem')).toHaveCount(5)
```

## Actions

```typescript
// Clicking
await page.getByRole('button').click()
await page.getByText('File').dblclick()

// Typing
await page.getByLabel('Email').fill('user@example.com')
await page.getByLabel('Search').press('Enter')

// Selecting
await page.getByLabel('Country').selectOption('us')

// File Upload
await page.getByLabel('Upload').setInputFiles('path/to/file.pdf')
```

## Network Mocking

```typescript
test('mocks API response', async ({ page }) => {
  await page.route('**/api/users', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Test User' }]),
    })
  })

  await page.goto('/users')
  await expect(page.getByText('Test User')).toBeVisible()
})
```

## Visual Testing

```typescript
test('captures screenshot', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: 'screenshot.png', fullPage: true })
  await expect(page).toHaveScreenshot('homepage.png')
})
```

## Authentication State

```typescript
// Save state after login
setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('user@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.context().storageState({ path: 'auth.json' })
})

// Reuse in config
use: { storageState: 'auth.json' }
```

## Page Object Model

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.emailInput = page.getByLabel('Email')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign in' })
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

// Usage
const loginPage = new LoginPage(page)
await loginPage.login('user@example.com', 'password123')
```

## Best Practices

- Prefer role-based selectors
- Trust auto-waiting (no manual sleeps)
- Each test gets fresh browser context
- Use debug mode for troubleshooting
- Run tests in parallel (default)
- Mock external dependencies
- Use trace viewer for time-travel debugging

## See Also

- `vitest-testing` - Unit and integration testing
- `api-testing` - HTTP API testing
- `test-quality-analysis` - Test quality patterns

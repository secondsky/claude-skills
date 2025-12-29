# Playwright - Browser Automation & E2E Testing

Complete browser automation and end-to-end testing skill with Playwright. Auto-detects dev servers, writes clean test scripts, and provides comprehensive automation capabilities.

## Overview

Expert knowledge for browser automation and E2E testing with Playwright - combining testing best practices with powerful automation features including dev server auto-detection, helper utilities, and universal code execution.

## Key Features

### E2E Testing
- Cross-browser (Chromium, Firefox, WebKit)
- Auto-wait (no flaky tests)
- Powerful semantic selectors
- Network interception and mocking
- Visual testing (screenshots, videos)
- Trace viewer for debugging
- TypeScript-first API

### Browser Automation
- **Auto-detects dev servers** - Automatically finds running localhost servers
- **Universal executor** (`run.js`) - Execute inline code, files, or stdin
- **Helper library** - 15+ utility functions for common tasks
- **Custom HTTP headers** - Environment-based header injection
- **Progressive disclosure** - Lean skill + comprehensive API reference
- **Temp file management** - Writes to `/tmp/` to avoid clutter
- **Visible browser by default** - See automation in real-time

## What's New in 4.0

- ✅ Dev server auto-detection
- ✅ Universal executor for flexible code execution
- ✅ Helper library with retry logic, safe actions, cookie banner handling
- ✅ Custom HTTP headers via environment variables
- ✅ Path resolution for multiple installation locations
- ✅ Comprehensive API reference (progressive disclosure)
- ✅ Working example templates
- ✅ Bun-first package management

## When to Use

### E2E Testing
- End-to-end testing
- Cross-browser testing
- Visual regression testing
- API testing
- Authentication flow testing
- User journey testing

### Browser Automation
- Test any webpage or application
- Fill forms and automate workflows
- Take screenshots across viewports
- Check responsive design
- Validate UX and accessibility
- Test login flows
- Check for broken links
- Automate repetitive browser tasks

## Installation

### First-Time Setup

```bash
# Navigate to skill directory
cd ~/.claude/skills/playwright  # Or your installation path

# Install using bun (preferred)
bun run setup

# Or using npm
npm run setup:npm
```

This installs Playwright and Chromium browser. Only needed once.

### For E2E Testing Projects

```bash
# Using Bun (preferred)
bun add -d @playwright/test
bunx playwright install

# Using npm
npm init playwright@latest
```

## Quick Start

### Browser Automation

```javascript
// /tmp/playwright-test-page.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(TARGET_URL);
  console.log('Page loaded:', await page.title());

  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/screenshot.png');

  await browser.close();
})();
```

Execute: `cd $SKILL_DIR && node run.js /tmp/playwright-test-page.js`

### E2E Testing

```typescript
import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Login' }).click()
  await page.getByLabel('Email').fill('user@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

Run tests: `bunx playwright test`

## Helper Library

The skill includes a comprehensive helper library with utilities for common tasks:

```javascript
const helpers = require('./lib/helpers');

// Detect running dev servers
const servers = await helpers.detectDevServers();

// Safe click with retry logic
await helpers.safeClick(page, 'button.submit', { retries: 3 });

// Safe type with clear
await helpers.safeType(page, '#username', 'testuser');

// Take timestamped screenshot
await helpers.takeScreenshot(page, 'test-result');

// Handle cookie banners
await helpers.handleCookieBanner(page);

// Extract table data
const data = await helpers.extractTableData(page, 'table.results');

// Create context with custom headers
const context = await helpers.createContext(browser);
```

## Examples

The skill includes working example templates in `examples/`:

- `responsive-test.js` - Test across desktop, tablet, and mobile viewports
- `form-test.js` - Fill and submit forms
- `link-checker.js` - Check for broken links

## Workflow

The skill follows a systematic workflow for browser automation:

1. **Auto-detect dev servers** - Finds running localhost servers
2. **Write scripts to /tmp** - Keeps workspace clean
3. **Use visible browser** - Default `headless: false` for visibility
4. **Parameterize URLs** - Makes scripts reusable
5. **Execute via run.js** - Universal executor with proper module resolution

## Auto-Trigger Keywords

- playwright
- browser automation
- E2E testing
- end to end testing
- cross-browser testing
- visual regression
- page object model
- web testing
- test automation
- automated testing
- playwright testing

## Structure

```
playwright/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── skills/
│   └── playwright/
│       ├── SKILL.md          # Main skill content
│       ├── run.js            # Universal executor
│       ├── package.json      # Dependencies & scripts
│       ├── lib/
│       │   └── helpers.js    # Utility library
│       ├── references/
│       │   └── API_REFERENCE.md  # Comprehensive API docs
│       └── examples/
│           ├── responsive-test.js
│           ├── form-test.js
│           └── link-checker.js
└── README.md                 # This file
```

## Resources

- [SKILL.md](skills/playwright/SKILL.md) - Main skill documentation
- [API Reference](skills/playwright/references/API_REFERENCE.md) - Comprehensive API documentation
- [Playwright Docs](https://playwright.dev/docs/intro) - Official documentation
- [Examples](skills/playwright/examples/) - Working code examples

## License

MIT

## Credits

- Enhanced from [lackeyjb/playwright-skill](https://github.com/lackeyjb/playwright-skill)
- Original testing patterns from Claude Skills repository
- Maintained by Claude Skills Maintainers

# Testing Guide for TypeScript MCP Servers

Comprehensive testing strategies for MCP servers.

---

## Testing Levels

1. **Unit Tests** - Test tool logic in isolation
2. **Integration Tests** - Test with MCP Inspector
3. **E2E Tests** - Test with real MCP clients

---

## 1. Unit Testing with Vitest

### Setup

```bash
npm install -D vitest @cloudflare/vitest-pool-workers
```

**vitest.config.ts:**
```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' }
      }
    }
  }
});
```

### Test Example

**src/tools/calculator.test.ts:**
```typescript
import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

describe('Calculator Tool', () => {
  it('should add two numbers', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    server.registerTool(
      'add',
      {
        description: 'Adds numbers',
        inputSchema: z.object({
          a: z.number(),
          b: z.number()
        })
      },
      async ({ a, b }) => ({
        content: [{ type: 'text', text: String(a + b) }]
      })
    );

    const result = await server.callTool('add', { a: 5, b: 3 });
    expect(result.content[0].text).toBe('8');
  });

  it('should handle errors', async () => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });

    server.registerTool(
      'divide',
      {
        description: 'Divides numbers',
        inputSchema: z.object({ a: z.number(), b: z.number() })
      },
      async ({ a, b }) => {
        if (b === 0) {
          return {
            content: [{ type: 'text', text: 'Division by zero' }],
            isError: true
          };
        }
        return { content: [{ type: 'text', text: String(a / b) }] };
      }
    );

    const result = await server.callTool('divide', { a: 10, b: 0 });
    expect(result.isError).toBe(true);
  });
});
```

**Run tests:**
```bash
npx vitest
```

---

## 2. Integration Testing with MCP Inspector

### Setup

```bash
# Terminal 1: Start dev server
wrangler dev

# Terminal 2: Launch inspector
npx @modelcontextprotocol/inspector
```

### Inspector UI

1. Connect to: `http://localhost:8787/mcp`
2. View available tools/resources
3. Test tool execution
4. Inspect request/response

### Automated Testing

```typescript
import { test, expect } from '@playwright/test';

test('MCP server lists tools', async ({ page }) => {
  await page.goto('http://localhost:8787');

  const response = await page.request.post('http://localhost:8787/mcp', {
    data: {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    }
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.result.tools).toBeDefined();
  expect(data.result.tools.length).toBeGreaterThan(0);
});
```

---

## 3. E2E Testing

### With curl

```bash
# List tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'

# Call tool
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "add",
      "arguments": { "a": 5, "b": 3 }
    },
    "id": 2
  }'
```

### With TypeScript

```typescript
import { test, expect } from 'vitest';

test('Full MCP flow', async () => {
  const baseUrl = 'http://localhost:8787/mcp';

  // List tools
  const listResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    })
  });

  const listData = await listResponse.json();
  expect(listData.result.tools).toBeDefined();

  // Call tool
  const callResponse = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'add',
        arguments: { a: 5, b: 3 }
      },
      id: 2
    })
  });

  const callData = await callResponse.json();
  expect(callData.result.content[0].text).toBe('8');
});
```

---

## 4. Testing Authentication

```typescript
test('rejects without auth', async () => {
  const response = await fetch('http://localhost:8787/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    })
  });

  expect(response.status).toBe(401);
});

test('accepts with valid API key', async () => {
  const response = await fetch('http://localhost:8787/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-key-123'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    })
  });

  expect(response.status).toBe(200);
});
```

---

## 5. Load Testing

### With Artillery

```bash
npm install -D artillery
```

**artillery.yml:**
```yaml
config:
  target: 'http://localhost:8787'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'List tools'
    flow:
      - post:
          url: '/mcp'
          json:
            jsonrpc: '2.0'
            method: 'tools/list'
            id: 1
```

```bash
npx artillery run artillery.yml
```

---

## 6. Mocking External APIs

```typescript
import { vi } from 'vitest';

test('weather tool with mocked API', async () => {
  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      main: { temp: 20 },
      weather: [{ description: 'sunny' }]
    })
  });

  const server = new McpServer({ name: 'test', version: '1.0.0' });
  // Register weather tool...

  const result = await server.callTool('get-weather', { city: 'London' });
  expect(result.content[0].text).toContain('20');
});
```

---

## CI/CD Testing

**GitHub Actions:**
```yaml
name: Test MCP Server
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm test
      - run: npm run build

      # Integration test
      - run: |
          npm run dev &
          sleep 5
          curl -f http://localhost:8787/mcp \
            -X POST \
            -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

---

**Last Updated:** 2025-10-28

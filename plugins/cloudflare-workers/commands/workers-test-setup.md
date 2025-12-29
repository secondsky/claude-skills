---
name: cloudflare-workers:test-setup
description: Interactive Vitest setup wizard for Cloudflare Workers testing. Configures @cloudflare/vitest-pool-workers, mocks bindings, and creates example tests.
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
  - Grep
  - Glob
---

# Workers Test Setup Command

Set up comprehensive testing for Cloudflare Workers using Vitest and @cloudflare/vitest-pool-workers.

## Execution Workflow

### Phase 1: Detection - Analyze Current Setup

Read the project to understand its current state:

1. Check if `package.json` exists
2. Check if `vitest.config.ts` or `vitest.config.js` exists
3. Check if `wrangler.jsonc` or `wrangler.toml` exists
4. Detect bindings used in the Worker (D1, KV, R2, DO, Queues, AI)
5. Check if any tests already exist (`**/*.test.ts`, `**/*.spec.ts`)

Store findings for later phases.

### Phase 2: User Preferences - Ask Questions

Use AskUserQuestion to gather preferences:

**Question 1**: "What type of tests do you want to set up?"
- Options:
  - Unit tests only (fast, isolated function testing)
  - Integration tests only (full request/response testing)
  - Both unit and integration tests (Recommended)

**Question 2**: "Which bindings do you need to mock?"
- MultiSelect: true
- Options (based on detection):
  - D1 (SQLite database)
  - KV (key-value storage)
  - R2 (object storage)
  - Durable Objects (stateful coordination)
  - Queues (message queues)
  - Workers AI (AI inference)
  - Vectorize (vector database)
  - None (no bindings used)

**Question 3**: "Do you want code coverage reporting?"
- Options:
  - Yes, with coverage thresholds (Recommended)
  - Yes, without thresholds
  - No

### Phase 3: Validation - Check Prerequisites

Before proceeding, validate:

1. **Node.js/Bun installed**: Run `node --version` or `bun --version`
   - If neither exists, abort with error: "Node.js or Bun required. Install from https://nodejs.org/ or https://bun.sh/"

2. **package.json exists**:
   - If not, abort with error: "No package.json found. Run `npm init` or `bun init` first."

3. **Wrangler configured**:
   - If no wrangler.jsonc/toml, warn: "No wrangler config found. Tests may need manual binding configuration."

4. **No existing vitest.config**:
   - If exists, ask: "vitest.config already exists. Overwrite?"
   - If user says no, abort gracefully

**Error Handling**: Abort on first validation failure. Do not proceed if prerequisites aren't met.

### Phase 4: Installation - Install Dependencies

Determine package manager (prefer bun, then npm):

```bash
# Check which package manager to use
if command -v bun &> /dev/null; then
  PM="bun"
elif command -v npm &> /dev/null; then
  PM="npm"
else
  echo "Error: No package manager found"
  exit 1
fi
```

Install required packages:

**Core testing dependencies**:
```bash
$PM add -D vitest@latest
$PM add -D @cloudflare/vitest-pool-workers@latest
$PM add -D @cloudflare/workers-types@latest
```

**If coverage enabled**:
```bash
$PM add -D @vitest/coverage-v8@latest
```

**Binding-specific mocks** (based on user selection):
- D1: Already included in @cloudflare/vitest-pool-workers
- KV: Already included
- R2: Already included
- DO: Already included
- Other bindings: Include appropriate mock utilities

### Phase 5: Configuration - Generate vitest.config.ts

Create `vitest.config.ts` with appropriate configuration:

```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
    {{COVERAGE_CONFIG}}
  },
});
```

**If coverage enabled with thresholds**:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

**If coverage enabled without thresholds**:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
},
```

### Phase 6: Example Test - Create Sample Test File

Based on user's test type preference, create example test(s):

**If unit tests or both**:
Create `test/unit/example.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Env } from '../src/index';

describe('Example Unit Test', () => {
  it('should pass basic assertion', () => {
    expect(true).toBe(true);
  });

  it('should test Worker logic', () => {
    // Example: Test a pure function from your Worker
    const result = someFunction('input');
    expect(result).toBe('expected output');
  });
});
```

**If integration tests or both**:
Create `test/integration/worker.test.ts`:

```typescript
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../../src/index';

describe('Worker Integration Test', () => {
  it('should respond to HTTP requests', async () => {
    const request = new Request('http://example.com/');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBeDefined();
  });

  {{BINDING_TESTS}}
});
```

**Binding-specific test examples** (based on selections):

**D1**:
```typescript
it('should query D1 database', async () => {
  const result = await env.DB.prepare('SELECT 1 as value').first();
  expect(result).toEqual({ value: 1 });
});
```

**KV**:
```typescript
it('should read/write to KV', async () => {
  await env.KV.put('test-key', 'test-value');
  const value = await env.KV.get('test-key');
  expect(value).toBe('test-value');
});
```

**R2**:
```typescript
it('should upload to R2', async () => {
  await env.BUCKET.put('test.txt', 'Hello World');
  const object = await env.BUCKET.get('test.txt');
  expect(await object?.text()).toBe('Hello World');
});
```

### Phase 7: Package Scripts - Update package.json

Add test scripts to package.json:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Use the Edit tool to add these scripts if they don't exist.

### Phase 8: Validation Run - Execute Tests

Run the tests to ensure setup works:

```bash
$PM run test
```

**Expected output**:
- Tests should run successfully
- Example tests should pass
- No configuration errors

**If tests fail**:
- Check error messages
- Verify wrangler.jsonc paths
- Verify binding names match
- Provide troubleshooting guidance

### Phase 9: Summary - Provide Next Steps

Generate a summary report:

```markdown
✅ Vitest Setup Complete!

**Installed Packages**:
- vitest
- @cloudflare/vitest-pool-workers
- @cloudflare/workers-types
{{COVERAGE_PACKAGES}}

**Configuration Created**:
- vitest.config.ts

**Example Tests Created**:
{{TEST_FILES_LIST}}

**Package Scripts Added**:
- npm run test (or bun test)
- npm run test:watch
- npm run test:coverage

**Next Steps**:
1. Run `npm test` to execute tests
2. Write tests for your Worker functions
3. Add tests to CI/CD pipeline
4. Aim for 80%+ code coverage

**Resources**:
- Vitest Docs: https://vitest.dev/
- Workers Testing: https://developers.cloudflare.com/workers/testing/vitest-integration/
- Mocking Bindings: Load workers-testing skill for detailed examples

**Need Help?**
- Ask: "How do I mock D1 in tests?"
- Ask: "Show me integration test examples"
- Run: /workers-debug for troubleshooting
```

## Error Handling

**Abort immediately if**:
- No package manager available
- No package.json exists
- User chooses not to overwrite existing config
- Installation fails
- Test validation run fails

**Provide clear error messages**:
- Include exact error from command output
- Suggest fix for common errors
- Link to relevant documentation

## Success Criteria

Setup is successful when:
- ✅ All dependencies installed
- ✅ vitest.config.ts created
- ✅ Example tests created
- ✅ package.json scripts updated
- ✅ Test run executes without errors
- ✅ User receives clear next steps

## Tips for Claude

1. **Be conversational**: Use friendly language in AskUserQuestion
2. **Explain choices**: Briefly explain why each option exists
3. **Detect intelligently**: Parse wrangler.jsonc to find bindings automatically
4. **Provide examples**: Include realistic test examples for user's bindings
5. **Handle edge cases**: Check for pnpm, yarn, bun in addition to npm
6. **Reference skills**: Point to workers-testing skill for advanced topics

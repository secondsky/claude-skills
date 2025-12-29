---
name: cloudflare-workflows:setup
description: Interactive wizard for complete Cloudflare Workflows setup from scratch. Use when user wants to create first workflow, setup workflow infrastructure, or add workflows to existing Worker project.
---

# Workflow Setup Wizard

## Overview

Complete interactive setup wizard for Cloudflare Workflows: project initialization, configuration, class scaffolding, and deployment preparation.

## Prerequisites

Check before starting:
- Cloudflare account with wrangler authenticated (`wrangler whoami`)
- Node.js/Bun installed
- Existing Worker project OR willingness to create one
- Write access to wrangler.jsonc

## Steps

### Step 1: Project Detection

Check if this is a new or existing project:

```bash
# Check for wrangler.jsonc
if [ -f "wrangler.jsonc" ]; then
  EXISTING_PROJECT=true
else
  EXISTING_PROJECT=false
fi

# Check for package.json
if [ -f "package.json" ]; then
  HAS_PACKAGE_JSON=true
else
  HAS_PACKAGE_JSON=false
fi
```

**If new project** (`$EXISTING_PROJECT == false`):

Use AskUserQuestion:
- **Question**: "No Worker project detected. Create new project?"
- **Options**:
  - "Yes - Create new Worker project" → Run `npm create cloudflare@latest`
  - "No - I'll set up manually" → Exit with setup instructions

**If existing project**: Continue to Step 2

---

### Step 2: Gather Workflow Requirements

Use AskUserQuestion to collect setup preferences.

**Question 1: Workflow Name**
- **Header**: "Workflow Name"
- **Question**: "What should your workflow be named?"
- **multiSelect**: false
- **Options**:
  - **label**: "Custom name (I'll type it)"
  - **description**: "Enter a unique workflow name (e.g., order-processing, user-onboarding)"

**Capture input**: Ask user to provide workflow name
- **Validation**: Must be lowercase, alphanumeric + hyphens only (`^[a-z0-9-]+$`)
- **Store as**: `workflowName`
- **Generate**: `className` = PascalCase version (e.g., "order-processing" → "OrderProcessing")

---

**Question 2: Workflow Purpose**
- **Header**: "Workflow Type"
- **Question**: "What type of workflow are you building?"
- **multiSelect**: false
- **Options**:
  - **label**: "Sequential Processing"
  - **description**: "Multi-step data processing with automatic retries"

  - **label**: "Scheduled Tasks"
  - **description**: "Workflows with delays and scheduled execution"

  - **label**: "Event-Driven"
  - **description**: "Wait for external events or approvals"

  - **label**: "Approval Flow"
  - **description**: "Human-in-the-loop approval with escalation"

  - **label**: "Data Pipeline"
  - **description**: "Process large datasets in batches over time"

**Store as**: `workflowType`

---

**Question 3: Expected Duration**
- **Header**: "Duration"
- **Question**: "How long will your workflow typically run?"
- **multiSelect**: false
- **Options**:
  - **label**: "Minutes (< 1 hour)"
  - **description**: "Short-running workflows with quick execution"

  - **label**: "Hours (1-24 hours)"
  - **description**: "Medium-duration workflows with scheduling"

  - **label**: "Days (> 24 hours)"
  - **description**: "Long-running workflows with extensive delays"

**Store as**: `expectedDuration`

---

**Question 4: External Integrations**
- **Header**: "Integrations"
- **Question**: "Will your workflow integrate with external services?"
- **multiSelect**: true (user can select multiple)
- **Options**:
  - **label**: "HTTP APIs"
  - **description**: "Call external REST/GraphQL APIs"

  - **label**: "D1 Database"
  - **description**: "Query and update D1 database"

  - **label**: "KV Storage"
  - **description**: "Read/write to KV namespace"

  - **label**: "R2 Storage"
  - **description**: "Store/retrieve files from R2"

  - **label**: "Queues"
  - **description**: "Send/receive messages via Queues"

**Store as**: `integrations` (array)

---

**Question 5: Error Handling Strategy**
- **Header**: "Error Handling"
- **Question**: "How should failures be handled?"
- **multiSelect**: false
- **Options**:
  - **label**: "Automatic Retry (Recommended)"
  - **description**: "Retry failed steps with exponential backoff"

  - **label**: "Fail Fast"
  - **description**: "Stop workflow immediately on any error"

  - **label**: "Custom Retry Logic"
  - **description**: "I'll implement specific retry strategies per step"

**Store as**: `errorStrategy`

---

### Step 3: Create Workflow Class

Generate WorkflowEntrypoint class based on user inputs.

**File Location**: `src/workflows/${workflowName}.ts`

**Template Selection**:
- If `workflowType == "Sequential Processing"` → Use basic sequential template
- If `workflowType == "Scheduled Tasks"` → Use scheduled workflow template
- If `workflowType == "Event-Driven"` → Use event-driven template
- If `workflowType == "Approval Flow"` → Use approval flow template
- If `workflowType == "Data Pipeline"` → Use batch processing template

**Generate Class**:

```typescript
/**
 * ${className} Workflow
 * Type: ${workflowType}
 * Expected Duration: ${expectedDuration}
 * Generated: ${currentDate}
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

// Define environment bindings
type Env = {
  ${workflowName.toUpperCase()}_WORKFLOW: Workflow;
  ${generateEnvBindings(integrations)}
};

// Define workflow parameters
type Params = {
  id: string;
  // Add your parameters here
};

/**
 * ${className} Workflow
 *
 * ${generateWorkflowDescription(workflowType)}
 */
export class ${className} extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { id } = event.payload;

    console.log('Workflow started:', {
      instanceId: event.instanceId,
      params: event.payload
    });

    ${generateStepScaffolding(workflowType, errorStrategy)}

    return {
      status: 'complete',
      id,
      completedAt: new Date().toISOString()
    };
  }
}
```

**Helper Function Logic**:

`generateEnvBindings(integrations)`:
- If `integrations` contains "D1 Database" → Add `DB: D1Database;`
- If `integrations` contains "KV Storage" → Add `MY_KV: KVNamespace;`
- If `integrations` contains "R2 Storage" → Add `MY_BUCKET: R2Bucket;`
- If `integrations` contains "Queues" → Add `MY_QUEUE: Queue;`

`generateStepScaffolding(workflowType, errorStrategy)`:
- Based on `workflowType`, generate appropriate step structure
- Include error handling based on `errorStrategy`

**Use Write tool to create file**

---

### Step 4: Configure Wrangler

Update or create wrangler.jsonc with workflow configuration.

**Check if wrangler.jsonc exists**:
```bash
if [ -f "wrangler.jsonc" ]; then
  CONFIG_EXISTS=true
else
  CONFIG_EXISTS=false
fi
```

**If config doesn't exist**, create new wrangler.jsonc:

```jsonc
{
  "name": "${projectName}",
  "main": "src/index.ts",
  "compatibility_date": "${currentDate}",
  "workflows": [
    {
      "binding": "${workflowName.toUpperCase()}_WORKFLOW",
      "name": "${workflowName}",
      "class_name": "${className}"
    }
  ]
}
```

**If config exists**, add to workflows array:

Use Edit tool to add workflow configuration:

```jsonc
"workflows": [
  {
    "binding": "${workflowName.toUpperCase()}_WORKFLOW",
    "name": "${workflowName}",
    "class_name": "${className}"
  }
]
```

**If integrations specified**, add bindings:

For each integration in `integrations`:
- D1 → Add `d1_databases` array
- KV → Add `kv_namespaces` array
- R2 → Add `r2_buckets` array
- Queues → Add `queues` array

**Example** (if D1 selected):
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "${workflowName}-db",
    "database_id": "local" // User must replace with actual ID
  }
]
```

**Verify**:
```bash
# Validate configuration
./scripts/validate-workflow-config.sh wrangler.jsonc
```

---

### Step 5: Setup TypeScript Types

Create or update TypeScript type definitions.

**Check for existing types file**:
```bash
if [ -f "src/types.ts" ]; then
  UPDATE_TYPES=true
else
  CREATE_TYPES=true
fi
```

**If creating new types file**:

```typescript
// src/types.ts
import { WorkflowEntrypoint } from 'cloudflare:workers';
import { ${className} } from './workflows/${workflowName}';

export interface Env {
  ${workflowName.toUpperCase()}_WORKFLOW: Workflow;
  ${generateEnvBindings(integrations)}
}
```

**If updating existing types**: Use Edit tool to add workflow binding

**Check package.json dependencies**:

```bash
# Check if workers-types is installed
if ! grep -q "@cloudflare/workers-types" package.json; then
  echo "Installing @cloudflare/workers-types..."
  npm install -D @cloudflare/workers-types@latest
fi

# Check wrangler version
if ! grep -q "wrangler" package.json; then
  echo "Installing wrangler..."
  npm install -D wrangler@latest
fi
```

---

### Step 6: Create Worker Trigger

Generate Worker code to trigger workflow.

**File**: `src/index.ts` (or update existing)

**If file doesn't exist**, create complete Worker:

```typescript
import { ${className} } from './workflows/${workflowName}';
import { Env } from './types';

// Export workflow class
export { ${className} };

// Worker to trigger workflow
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Handle favicon
    if (url.pathname.startsWith('/favicon')) {
      return Response.json({}, { status: 404 });
    }

    // Get instance ID from query param
    const instanceId = url.searchParams.get('instanceId');

    // Get existing instance status
    if (instanceId) {
      try {
        const instance = await env.${workflowName.toUpperCase()}_WORKFLOW.get(instanceId);
        const status = await instance.status();

        return Response.json({
          id: instanceId,
          status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return Response.json({
          error: 'Instance not found'
        }, { status: 404 });
      }
    }

    // Create new workflow instance
    try {
      const instance = await env.${workflowName.toUpperCase()}_WORKFLOW.create({
        params: {
          id: crypto.randomUUID()
          // Add your parameters
        }
      });

      return Response.json({
        id: instance.id,
        status: await instance.status(),
        statusUrl: \`\${url.origin}?instanceId=\${instance.id}\`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return Response.json({
        error: 'Failed to create workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
};
```

**If file exists**, use Edit tool to:
1. Add export for workflow class
2. Add workflow creation logic to existing fetch handler

---

### Step 7: Generate Tests (Optional)

**Ask User**:
- **Question**: "Generate test file for workflow?"
- **Options**:
  - "Yes - Create test file"
  - "No - Skip tests"

**If yes**, create test file:

**File**: `test/${workflowName}.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev, UnstableDevWorker } from 'wrangler';

describe('${className} Workflow', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true }
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should create workflow instance', async () => {
    const response = await worker.fetch('/');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status');
  });

  it('should get workflow instance status', async () => {
    // Create instance
    const createResponse = await worker.fetch('/');
    const createData = await createResponse.json();
    const instanceId = createData.id;

    // Get status
    const statusResponse = await worker.fetch(\`/?instanceId=\${instanceId}\`);
    expect(statusResponse.status).toBe(200);

    const statusData = await statusResponse.json();
    expect(statusData.id).toBe(instanceId);
  });
});
```

---

### Step 8: Validation & Next Steps

**Run Validation**:

```bash
# Validate workflow configuration
./scripts/validate-workflow-config.sh wrangler.jsonc

# Check for limit issues
./scripts/check-workflow-limits.sh src/workflows/${workflowName}.ts

# Run TypeScript compiler
npx tsc --noEmit
```

**If validation passes**:

```
✅ Workflow Setup Complete!

Workflow Configuration:
- Name: ${workflowName}
- Class: ${className}
- Type: ${workflowType}
- Binding: ${workflowName.toUpperCase()}_WORKFLOW
- Integrations: ${integrations.join(', ')}

Files Created:
- src/workflows/${workflowName}.ts (Workflow class)
- wrangler.jsonc (Configuration)
- src/types.ts (TypeScript types)
- src/index.ts (Worker trigger)
${testsCreated ? '- test/${workflowName}.test.ts (Tests)' : ''}

Next Steps:

1. Review and customize workflow logic:
   Open: src/workflows/${workflowName}.ts

2. Test locally:
   wrangler dev

   Then visit: http://localhost:8787

3. Deploy to Cloudflare:
   wrangler deploy

4. Monitor workflow instances:
   wrangler workflows instances list ${workflowName}

5. Debug if needed:
   Use /workflow-debug command for interactive debugging

📚 Helpful Resources:
- Workflow patterns: Load \`references/workflow-patterns.md\`
- Common issues: Load \`references/common-issues.md\`
- Production checklist: Load \`references/production-checklist.md\`
- Wrangler commands: Load \`references/wrangler-commands.md\`

💡 Tips:
- Always perform I/O inside step.do() callbacks
- Use NonRetryableError for permanent failures
- Return only JSON-serializable data from steps
- Configure appropriate retry strategies for each step
- Monitor workflow costs with \`./scripts/benchmark-workflow.sh\`
```

**If validation fails**:

```
❌ Validation Failed

Issues found:
${validationErrors}

Recommendations:
1. Review error messages above
2. Check wrangler.jsonc syntax
3. Ensure workflow class is properly exported
4. Run validation again: ./scripts/validate-workflow-config.sh

Need help? Use /workflow-debug command for assistance.
```

---

## Error Handling

### Wrangler Not Authenticated
```
❌ Error: Not authenticated with Cloudflare

Solution:
1. Run: wrangler login
2. Follow authentication flow
3. Re-run: /workflow-setup
```

### Invalid Workflow Name
```
❌ Error: Workflow name must be lowercase with hyphens only

Valid examples:
- order-processing
- user-onboarding
- data-pipeline

Invalid examples:
- OrderProcessing (no uppercase)
- order_processing (no underscores)
- order processing (no spaces)
```

### File Already Exists
```
⚠️  Warning: File already exists: src/workflows/${workflowName}.ts

Options:
1. Choose different workflow name
2. Overwrite existing file (will create backup)
3. Manually merge changes

Continue? (y/N):
```

### Missing Dependencies
```
❌ Error: Required packages not installed

Installing dependencies:
- @cloudflare/workers-types@latest
- wrangler@latest
- typescript@latest

Run: npm install
```

---

## Example Full Workflow

**User Input**:
- Workflow name: "order-processing"
- Type: Sequential Processing
- Duration: Hours (1-24)
- Integrations: HTTP APIs, D1 Database
- Error handling: Automatic Retry

**Executed Steps**:
1. Created `src/workflows/order-processing.ts` with OrderProcessing class
2. Updated `wrangler.jsonc` with workflow configuration
3. Added D1 binding to configuration
4. Created `src/types.ts` with Env interface
5. Updated `src/index.ts` with Worker trigger code
6. Ran validation (passed)
7. Provided next steps

**Result**:
```
✅ Setup complete!
- Workflow: order-processing
- Class: OrderProcessing
- Files: 4 created/updated
- Ready to customize and deploy!
```

---

## Summary

This command provides **interactive workflow setup** through 8 guided steps:
1. Project detection (new vs existing)
2. Gather requirements (name, type, duration, integrations, error handling)
3. Create workflow class (generated from template)
4. Configure wrangler.jsonc (add workflows array + bindings)
5. Setup TypeScript types (Env interface + dependencies)
6. Create Worker trigger (HTTP endpoint for workflow management)
7. Generate tests (optional vitest tests)
8. Validation & next steps (validate, provide guidance)

**Output**: Fully configured Cloudflare Workflow ready to customize and deploy.

**When to Use**: First-time workflow setup, adding workflows to existing Worker, or scaffolding new workflow infrastructure.

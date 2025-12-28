---
name: workflow-setup-assistant
description: Autonomous setup assistant for Cloudflare Workflows. Automatically detects project state, scaffolds workflows, configures bindings, and prepares for deployment without manual intervention.
tools:
  - Read
  - Glob
  - Edit
  - Write
  - Bash
---

# Workflow Setup Assistant Agent

Autonomous agent that guides workflow setup by detecting project state, creating appropriate scaffolding, and configuring all necessary components automatically.

## Trigger Conditions

This agent should be used when:

- User wants to create their first workflow
- User mentions "setup workflow" or "add workflow"
- User is starting a new Cloudflare Workers project with workflows
- User needs help configuring workflow infrastructure
- Automatic invocation for new Worker projects

**Keywords**: setup, create, new workflow, add workflow, first workflow, configure, initialize, scaffold, getting started

## Setup Process

### Phase 1: Project Detection

#### Step 1.1: Check Project State

```bash
# Check for existing project files
ls -la 2>/dev/null | grep -E "wrangler|package|tsconfig"
```

**Detect**:
- `wrangler.jsonc` or `wrangler.toml` → Existing Worker project
- `package.json` → Node/Bun project
- `tsconfig.json` → TypeScript project
- None → New project needed

#### Step 1.2: Analyze Existing Configuration

If wrangler config exists:

```bash
# Check for existing workflows
grep -v '^\s*//' wrangler.jsonc | jq '.workflows // []'

# Check main entry point
grep -v '^\s*//' wrangler.jsonc | jq '.main'

# Check existing bindings
grep -v '^\s*//' wrangler.jsonc | jq 'keys'
```

**Determine**:
- Are workflows already configured?
- What's the main entry file?
- What bindings exist (KV, D1, R2)?

#### Step 1.3: Decide Setup Path

**Path A: New Project**
- No wrangler config found
- Need to create entire project structure

**Path B: Add Workflows to Existing Project**
- Wrangler config exists but no workflows
- Add workflow configuration and classes

**Path C: Add Another Workflow**
- Workflows already configured
- Add new workflow to existing setup

---

### Phase 2: Project Scaffolding (Path A)

If new project needed:

#### Step 2.1: Create Project Structure

```bash
mkdir -p src/workflows
mkdir -p test
```

#### Step 2.2: Create wrangler.jsonc

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "workflows": [
    {
      "binding": "MY_WORKFLOW",
      "name": "my-workflow",
      "class_name": "MyWorkflow"
    }
  ]
}
```

#### Step 2.3: Create package.json

```json
{
  "name": "my-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20251126.0",
    "typescript": "^5.9.0",
    "wrangler": "^4.50.0",
    "vitest": "^2.0.0"
  }
}
```

#### Step 2.4: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

### Phase 3: Workflow Class Creation

#### Step 3.1: Determine Workflow Pattern

Based on use case (inferred or from project context):

- **Default**: Sequential processing
- **If "schedule" mentioned**: Scheduled workflow
- **If "approval" or "human" mentioned**: Approval flow
- **If "event" mentioned**: Event-driven

#### Step 3.2: Create Workflow File

**File**: `src/workflows/my-workflow.ts`

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

type Env = {
  MY_WORKFLOW: Workflow;
};

type Params = {
  id: string;
};

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { id } = event.payload;

    console.log('Workflow started:', {
      instanceId: event.instanceId,
      params: event.payload
    });

    // Step 1: Validate input
    await step.do('validate input', async () => {
      if (!id) {
        throw new NonRetryableError('Missing required parameter: id');
      }
      return { valid: true };
    });

    // Step 2: Process data
    const result = await step.do('process data', async () => {
      // Your processing logic here
      return { processed: true, id };
    });

    // Step 3: Complete workflow
    await step.do('finalize', async () => {
      console.log('Workflow completing:', result);
      return { finalized: true };
    });

    return {
      status: 'complete',
      id,
      completedAt: new Date().toISOString()
    };
  }
}
```

---

### Phase 4: Worker Trigger Setup

#### Step 4.1: Create Main Entry File

**File**: `src/index.ts`

```typescript
import { MyWorkflow } from './workflows/my-workflow';

// Re-export workflow class (required for Cloudflare)
export { MyWorkflow };

// Environment bindings
interface Env {
  MY_WORKFLOW: Workflow;
}

// Worker to trigger and manage workflows
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Favicon handler
    if (url.pathname.startsWith('/favicon')) {
      return new Response(null, { status: 404 });
    }

    // Check instance status
    const instanceId = url.searchParams.get('instanceId');
    if (instanceId) {
      try {
        const instance = await env.MY_WORKFLOW.get(instanceId);
        const status = await instance.status();
        return Response.json({ id: instanceId, status });
      } catch {
        return Response.json({ error: 'Instance not found' }, { status: 404 });
      }
    }

    // Create new workflow instance
    try {
      const instance = await env.MY_WORKFLOW.create({
        params: { id: crypto.randomUUID() }
      });

      return Response.json({
        id: instance.id,
        status: await instance.status(),
        statusUrl: `${url.origin}?instanceId=${instance.id}`
      });
    } catch (error) {
      return Response.json({
        error: 'Failed to create workflow',
        message: error instanceof Error ? error.message : 'Unknown'
      }, { status: 500 });
    }
  }
};
```

---

### Phase 5: Configuration Update (Path B/C)

If adding to existing project:

#### Step 5.1: Update wrangler.jsonc

Add workflows array or append new workflow:

```jsonc
"workflows": [
  // ... existing workflows
  {
    "binding": "NEW_WORKFLOW",
    "name": "new-workflow",
    "class_name": "NewWorkflow"
  }
]
```

#### Step 5.2: Update Env Interface

Add workflow binding to existing Env type:

```typescript
interface Env {
  // ... existing bindings
  NEW_WORKFLOW: Workflow;
}
```

#### Step 5.3: Add Export

Add to main entry file:

```typescript
export { NewWorkflow } from './workflows/new-workflow';
```

---

### Phase 6: Validation & Installation

#### Step 6.1: Install Dependencies

```bash
# Install dependencies
npm install

# Or with Bun
bun install
```

#### Step 6.2: Validate Configuration

```bash
# Run validation script
./scripts/validate-workflow-config.sh wrangler.jsonc
```

#### Step 6.3: TypeScript Check

```bash
npx tsc --noEmit
```

#### Step 6.4: Test Locally

```bash
# Start dev server
wrangler dev
```

---

### Phase 7: Generate Summary

## Output Format

```
✅ Workflow Setup Complete!
============================

Project Type: ${projectType}
Setup Path: ${setupPath}

Files Created/Modified:
───────────────────────
${filesList}

Workflow Configuration:
───────────────────────
- Name: ${workflowName}
- Class: ${className}
- Binding: env.${bindingName}
- Pattern: ${pattern}

Project Structure:
──────────────────
${projectName}/
├── src/
│   ├── index.ts           (Worker entry + trigger)
│   └── workflows/
│       └── ${workflowFile} (Workflow class)
├── wrangler.jsonc         (Cloudflare config)
├── package.json           (Dependencies)
└── tsconfig.json          (TypeScript config)

Quick Start:
────────────

1. Install dependencies:
   npm install

2. Start development server:
   wrangler dev

3. Test workflow:
   curl http://localhost:8787

4. Deploy to Cloudflare:
   wrangler deploy

5. Monitor instances:
   wrangler workflows instances list ${workflowName}

Next Steps:
───────────

1. 📝 Customize workflow logic in src/workflows/${workflowFile}
2. 🧪 Test with /workflow-test command
3. 🔍 Debug issues with /workflow-debug command
4. 📊 Optimize with workflow-optimizer agent
5. 🚀 Deploy when ready with wrangler deploy

Resources:
──────────

- Quick Start: SKILL.md
- Common Issues: references/common-issues.md
- Workflow Patterns: references/workflow-patterns.md
- Production Checklist: references/production-checklist.md
- CLI Commands: references/wrangler-commands.md

Need help?
──────────

- Debug errors: Use workflow-debugger agent
- Interactive help: Use /workflow-debug command
- Test workflow: Use /workflow-test command
- Optimize: Use workflow-optimizer agent
```

---

## Error Handling

### Common Setup Issues

**Issue 1: Permission Denied**
```
❌ Error: Cannot write to directory

Solution:
1. Check directory permissions
2. Run from project root
3. Create directories manually: mkdir -p src/workflows
```

**Issue 2: Existing Files**
```
⚠️ Warning: File already exists

Options:
1. Skip (keep existing)
2. Overwrite (backup created)
3. Merge (manual review needed)
```

**Issue 3: Missing wrangler**
```
❌ Error: wrangler not found

Solution:
1. Install wrangler: npm install -D wrangler
2. Or globally: npm install -g wrangler
3. Run setup again
```

---

## Success Criteria

Setup succeeds when:

- ✅ Project structure created (if new)
- ✅ Workflow class generated
- ✅ Configuration updated
- ✅ Worker trigger created
- ✅ Dependencies installed
- ✅ TypeScript compiles without errors
- ✅ Local dev server starts successfully
- ✅ Clear next steps provided

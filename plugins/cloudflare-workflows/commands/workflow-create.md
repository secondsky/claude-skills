---
name: cloudflare-workflows:create
description: Quick scaffold for new workflow class in existing project. Use when user wants to add another workflow to existing project without full setup wizard.
---

# Workflow Create

## Overview

Quick scaffolding for new workflow classes in existing Cloudflare Workflows projects.

## Prerequisites

- Existing Worker project with wrangler.jsonc
- Workflows already configured in project
- Write access to src/ directory

## Steps

### Step 1: Gather Workflow Details

Use AskUserQuestion:

**Question 1: Class Name**
- **Header**: "Class Name"
- **Question**: "What is your workflow class name? (PascalCase)"
- **multiSelect**: false
- **Options**:
  - **label**: "Custom name"
  - **description**: "Enter class name (e.g., OrderProcessing, UserOnboarding)"

**Store as**: `className`
**Generate**: `workflowName` = kebab-case version

---

**Question 2: Pattern Type**
- **Header**: "Pattern"
- **Question**: "Which workflow pattern?"
- **multiSelect**: false
- **Options**:
  - **label**: "Sequential"
  - **description**: "Basic step-by-step workflow"

  - **label**: "Event-Driven"
  - **description**: "Wait for external events"

  - **label**: "Scheduled"
  - **description**: "Workflows with sleep/delays"

  - **label**: "Parallel"
  - **description**: "Run steps in parallel"

**Store as**: `pattern`

---

**Question 3: Number of Steps**
- **Header**: "Steps"
- **Question**: "How many main steps will your workflow have?"
- **multiSelect**: false
- **Options**:
  - **label**: "2-3 steps"
  - **label**: "4-6 steps"
  - **label**: "7-10 steps"
  - **label**: "10+ steps"

**Store as**: `stepCount`

---

### Step 2: Generate Workflow File

**File**: `src/workflows/${workflowName}.ts`

**Template** (based on pattern):

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

type Env = {
  // Add your bindings
};

type Params = {
  id: string;
};

export class ${className} extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { id } = event.payload;

    ${generateSteps(pattern, stepCount)}

    return { status: 'complete', id };
  }
}
```

**generateSteps logic**:
- Sequential: Basic step.do() scaffolding
- Event-Driven: Add step.waitForEvent() example
- Scheduled: Add step.sleep() between steps
- Parallel: Add Promise.all() within step.do()

---

### Step 3: Update Configuration

**Update wrangler.jsonc**:

Use Edit tool to add to workflows array:

```jsonc
{
  "binding": "${className.toUpperCase()}_WORKFLOW",
  "name": "${workflowName}",
  "class_name": "${className}"
}
```

**Update Env interface**:

If `src/types.ts` exists:
```typescript
${className.toUpperCase()}_WORKFLOW: Workflow;
```

---

### Step 4: Update Exports

**File**: `src/index.ts`

Add export:
```typescript
export { ${className} } from './workflows/${workflowName}';
```

---

### Step 5: Validation

```bash
# Validate configuration
./scripts/validate-workflow-config.sh wrangler.jsonc

# Check limits
./scripts/check-workflow-limits.sh src/workflows/${workflowName}.ts
```

---

### Step 6: Next Steps

```
✅ Workflow Created!

Files:
- src/workflows/${workflowName}.ts (${className})
- wrangler.jsonc (updated)
- src/index.ts (export added)

Next Steps:
1. Implement workflow logic in src/workflows/${workflowName}.ts
2. Test: wrangler dev
3. Deploy: wrangler deploy

Binding: env.${className.toUpperCase()}_WORKFLOW
```

---

## Error Handling

**Duplicate Class**: Workflow class already exists → Suggest different name
**Invalid Name**: Must be PascalCase → Show examples
**No Project**: No wrangler.jsonc found → Run /workflow-setup first

---

## Summary

Quick workflow scaffolding in 6 steps:
1. Gather details (class name, pattern, step count)
2. Generate workflow file from template
3. Update wrangler.jsonc configuration
4. Update Env interface types
5. Export workflow class
6. Validate and provide next steps

**When to Use**: Adding workflow to existing project (faster than /workflow-setup).

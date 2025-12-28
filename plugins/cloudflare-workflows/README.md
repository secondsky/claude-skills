# Cloudflare Workflows Skill

**Status**: Production Ready ✅
**Version**: 3.0.0
**Last Updated**: 2025-12-27
**Production Tested**: Yes

---

## Auto-Trigger Keywords

**Primary Keywords:**
- Cloudflare Workflows
- workflows
- durable execution
- WorkflowEntrypoint
- workflow step
- long-running tasks
- multi-step applications

**Secondary Keywords:**
- step.do
- step.sleep
- step.sleepUntil
- step.waitForEvent
- workflow retries
- workflow state
- NonRetryableError
- workflow events
- workflow bindings
- wrangler workflows

**Error-Based Keywords:**
- NonRetryableError
- I/O context error
- workflow execution failed
- serialization error
- WorkflowEvent not found
- Cannot perform I/O on behalf of a different request
- workflow stuck running
- payload too large

**Framework Keywords:**
- Cloudflare Workers
- wrangler
- @cloudflare/workers-types
- cloudflare:workers
- cloudflare:workflows

---

## What This Skill Does

This skill provides complete, production-ready knowledge for Cloudflare Workflows - a durable execution framework for building multi-step applications on Workers that:

- **Automatically retry** failed steps with configurable backoff
- **Persist state** between steps so workflows survive failures
- **Run for hours or days** with built-in sleep and scheduling
- **Wait for external events** to enable human-in-the-loop patterns
- **Coordinate between APIs** with reliable execution guarantees

**Use this skill when:**
- Building long-running processes (hours/days)
- Implementing retry logic for reliability
- Creating event-driven workflows
- Scheduling multi-step tasks
- Coordinating between third-party APIs
- Building approval/review workflows
- Processing data pipelines
- Handling webhook orchestration

---

## Known Issues Prevented

This skill prevents **5 documented errors** with sources:

| Error | Issue | Prevention | Source |
|-------|-------|------------|--------|
| **I/O Context** | Cannot perform I/O on behalf of different request | All I/O inside `step.do()` callbacks | Platform limitation |
| **NonRetryableError Dev/Prod** | Different behavior in dev vs production | Always provide error message | [workers-sdk#10113](https://github.com/cloudflare/workers-sdk/issues/10113) |
| **WorkflowEvent Import** | Export not found from cloudflare:workers | Use latest @cloudflare/workers-types | Package versioning |
| **Serialization** | Non-serializable return values fail | Only return JSON-compatible types | Workflows docs |
| **CI Testing** | Tests fail in CI but pass locally | Increase timeouts, add retries | [workers-sdk#10600](https://github.com/cloudflare/workers-sdk/issues/10600) |

**Error Prevention**: 5/5 = **100%**

---

## What's Included

### SKILL.md (Comprehensive Guide)
- Quick Start (10 minutes to first workflow)
- Complete `WorkflowEntrypoint` API
- All step methods: `do`, `sleep`, `sleepUntil`, `waitForEvent`
- Retry configuration (limits, backoff, timeouts)
- Error handling (NonRetryableError, try-catch)
- Triggering workflows (from Workers, HTTP, scheduled)
- State persistence rules
- Wrangler commands
- Production checklist

### Commands (4 Interactive Commands)
1. **workflow-setup** - Complete wizard for new workflow projects
2. **workflow-create** - Quick scaffolding for workflow classes
3. **workflow-debug** - Interactive debugging with error patterns
4. **workflow-test** - Test workflows locally and remotely

### Agents (3 Autonomous Agents)
1. **workflow-debugger** - Auto-detects and fixes configuration/runtime errors
2. **workflow-optimizer** - Analyzes performance, cost, and reliability
3. **workflow-setup-assistant** - Autonomous project scaffolding

### Scripts (5 Automation Scripts)
1. **validate-workflow-config.sh** - Validate wrangler.jsonc configuration
2. **test-workflow.sh** - Create and test workflow instances
3. **benchmark-workflow.sh** - Measure performance and cost
4. **generate-workflow.sh** - Scaffold new workflows from templates
5. **check-workflow-limits.sh** - Validate against Cloudflare limits

### Templates (8 Files)
1. **basic-workflow.ts** - Simple 3-step workflow with retries
2. **workflow-with-retries.ts** - Advanced retry config with exponential/linear/constant backoff
3. **scheduled-workflow.ts** - Daily/weekly/monthly scheduled workflows
4. **workflow-with-events.ts** - Event-driven approval flow with timeout
5. **worker-trigger.ts** - Worker that creates, queries, and manages workflows
6. **wrangler-workflows-config.jsonc** - Complete configuration example
7. **parallel-execution-workflow.ts** - Batched parallel processing with concurrency control
8. **circuit-breaker-workflow.ts** - Resilient external service calls with circuit breaker pattern

### References (8 Files)
1. **common-issues.md** - 5 documented errors with sources and solutions
2. **workflow-patterns.md** - Production patterns (idempotency, error handling, long-running, human-in-loop, chaining, testing, monitoring)
3. **wrangler-commands.md** - Complete CLI reference for workflow management
4. **production-checklist.md** - Pre-deployment verification checklist
5. **limits-quotas.md** - Complete limits reference with workarounds
6. **2025-features.md** - Recent features and updates
7. **metrics-analytics.md** - Monitoring and analytics guide
8. **troubleshooting.md** - Advanced debugging techniques

---

## Quick Example

**Create a workflow:**

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Step 1: Do work (auto-retries on failure)
    const data = await step.do('fetch data', async () => {
      const response = await fetch('https://api.example.com/data');
      return await response.json();
    });

    // Step 2: Wait before next action
    await step.sleep('wait 1 hour', '1 hour');

    // Step 3: Continue workflow
    await step.do('process data', async () => {
      // Process data
      return { processed: true };
    });

    return { status: 'complete' };
  }
}
```

**Trigger from Worker:**

```typescript
const instance = await env.MY_WORKFLOW.create({
  params: { userId: '123' }
});

const status = await instance.status();
```

---

## When to Use This Skill

✅ **Use Workflows when:**
- Process takes longer than 30 seconds (Workers timeout)
- Need automatic retries with backoff
- Need to sleep/schedule between steps
- Coordinating multiple async operations
- Waiting for external events (webhooks, approvals)
- Building reliable data pipelines
- Orchestrating microservices
- Processing batch jobs over time

❌ **Don't use Workflows when:**
- Need real-time responses (<100ms)
- Handling simple HTTP requests
- No retry logic needed
- All work completes in <10 seconds
- Need WebSocket connections (use Durable Objects)

---

## Latest Versions (Verified 2025-12-27)

```json
{
  "devDependencies": {
    "wrangler": "^4.50.0",
    "@cloudflare/workers-types": "^4.20251126.0",
    "typescript": "^5.9.0"
  }
}
```

---

## Official Documentation

- **Workflows Docs**: https://developers.cloudflare.com/workflows/
- **Get Started**: https://developers.cloudflare.com/workflows/get-started/guide/
- **Workers API**: https://developers.cloudflare.com/workflows/build/workers-api/
- **Sleeping & Retrying**: https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/
- **Events & Parameters**: https://developers.cloudflare.com/workflows/build/events-and-parameters/
- **Limits**: https://developers.cloudflare.com/workflows/reference/limits/
- **Pricing**: https://developers.cloudflare.com/workflows/platform/pricing/

---

## Related Skills

- **cloudflare-worker-base** - Hono + Vite + Static Assets foundation
- **cloudflare-queues** - Message queues for async processing
- **cloudflare-d1** - D1 serverless SQL database
- **cloudflare-kv** - KV key-value storage

---

**Questions? Issues?**

1. Use `/workflow-debug` command for interactive troubleshooting
2. Check `references/common-issues.md` for known errors
3. Use `references/troubleshooting.md` for systematic diagnosis
4. Review `references/workflow-patterns.md` for production patterns
5. Use templates in `templates/` directory
6. Run `./scripts/validate-workflow-config.sh` to check configuration
7. Consult official docs: https://developers.cloudflare.com/workflows/

---

**Maintainer**: Claude Skills Maintainers | maintainers@example.com

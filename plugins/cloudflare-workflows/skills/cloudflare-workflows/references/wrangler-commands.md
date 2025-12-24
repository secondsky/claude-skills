# Wrangler Commands for Cloudflare Workflows

Complete reference for managing Cloudflare Workflows via the `wrangler` CLI.

**Last Updated**: 2025-11-26
**Wrangler Version**: 4.50.0+

---

## Workflow Management

### Create Workflow

```bash
wrangler workflows create <WORKFLOW_NAME>
```

Creates a new workflow definition in your account.

**Example:**
```bash
wrangler workflows create order-processing
```

---

## Instance Management

### List Workflow Instances

```bash
wrangler workflows instances list --workflow-name <NAME> [OPTIONS]
```

**Options:**
- `--workflow-name <NAME>` - Required: Name of the workflow
- `--status <STATUS>` - Filter by status: `running`, `complete`, `failed`, `terminated`
- `--limit <NUMBER>` - Number of instances to return (default: 10)

**Examples:**
```bash
# List all instances
wrangler workflows instances list --workflow-name order-processing

# List only running instances
wrangler workflows instances list --workflow-name order-processing --status running

# List last 50 instances
wrangler workflows instances list --workflow-name order-processing --limit 50
```

---

### Get Instance Details

```bash
wrangler workflows instances describe <INSTANCE_ID> --workflow-name <NAME>
```

Returns detailed information about a specific workflow instance including:
- Instance ID
- Status (running, complete, failed, terminated)
- Start time
- End time (if completed)
- Current step
- Error details (if failed)

**Example:**
```bash
wrangler workflows instances describe 550e8400-e29b-41d4-a716-446655440000 --workflow-name order-processing
```

---

### Terminate Instance

```bash
wrangler workflows instances terminate <INSTANCE_ID> --workflow-name <NAME>
```

Stops a running workflow instance immediately. The instance will be marked as `terminated`.

**Example:**
```bash
wrangler workflows instances terminate 550e8400-e29b-41d4-a716-446655440000 --workflow-name order-processing
```

**Use cases:**
- Canceling long-running workflows
- Stopping stuck workflows
- Manual intervention in error scenarios

---

### Trigger Workflow (via HTTP)

While not a direct wrangler command, workflows are typically triggered via HTTP:

```bash
# Trigger workflow via Worker API
curl -X POST https://my-worker.example.com/workflow \
  -H "Content-Type: application/json" \
  -d '{"orderId": "123", "userId": "user-456"}'
```

The Worker then creates the workflow instance:
```typescript
const instance = await env.MY_WORKFLOW.create({
  params: { orderId: "123", userId: "user-456" }
});
```

---

## Deployment Commands

### Deploy Workflow

```bash
wrangler deploy
```

Deploys your workflow to Cloudflare Workers. Must be run from the project directory containing `wrangler.jsonc`.

**Pre-deployment checklist:**
- [ ] `wrangler.jsonc` configured with workflow bindings
- [ ] All workflow code in `src/` directory
- [ ] Dependencies installed (`npm install`)
- [ ] TypeScript compiled (if using TS)

**Example deployment flow:**
```bash
# Install dependencies
npm install

# Build TypeScript (if applicable)
npm run build

# Deploy
wrangler deploy

# Verify deployment
wrangler workflows instances list --workflow-name my-workflow
```

---

### Dev Mode (Local Testing)

```bash
wrangler dev
```

Runs your Worker (including workflows) locally for testing.

**Limitations in dev mode:**
- Workflow persistence may behave differently
- Some timing features may not work exactly as in production
- Always test in production before full rollout

---

## Monitoring & Debugging

### Check Workflow Status

```bash
# Get specific instance status
wrangler workflows instances describe <INSTANCE_ID> --workflow-name <NAME>

# List recent failures
wrangler workflows instances list --workflow-name <NAME> --status failed --limit 20
```

---

### Debug Stuck Workflows

**Step 1: Find stuck instances**
```bash
wrangler workflows instances list --workflow-name my-workflow --status running
```

**Step 2: Get instance details**
```bash
wrangler workflows instances describe <INSTANCE_ID> --workflow-name my-workflow
```

**Step 3: Check logs**
```bash
wrangler tail my-worker
```

**Step 4: Terminate if needed**
```bash
wrangler workflows instances terminate <INSTANCE_ID> --workflow-name my-workflow
```

---

### Monitor Logs

```bash
wrangler tail <WORKER_NAME>
```

Streams real-time logs from your Worker, including workflow execution logs.

**Filter logs:**
```bash
# Filter by status
wrangler tail my-worker --status error

# Filter by search term
wrangler tail my-worker --search "workflow"
```

---

## Production Workflow

### Complete Workflow Lifecycle

```bash
# 1. Deploy workflow
wrangler deploy

# 2. Trigger workflow (via HTTP or scheduled)
# (Happens automatically based on triggers)

# 3. Monitor instances
wrangler workflows instances list --workflow-name my-workflow --status running

# 4. Check for failures
wrangler workflows instances list --workflow-name my-workflow --status failed

# 5. Investigate failures
wrangler workflows instances describe <FAILED_INSTANCE_ID> --workflow-name my-workflow

# 6. Terminate if stuck
wrangler workflows instances terminate <STUCK_INSTANCE_ID> --workflow-name my-workflow
```

---

## Troubleshooting

### Workflow Not Starting

```bash
# Check if workflow is deployed
wrangler deploy

# Verify bindings in wrangler.jsonc
cat wrangler.jsonc | grep -A 5 "workflows"

# Check Worker logs for trigger errors
wrangler tail my-worker --status error
```

---

### Instance Stuck in "Running" State

```bash
# Get instance details
wrangler workflows instances describe <INSTANCE_ID> --workflow-name my-workflow

# Check which step it's stuck on
# Look for "current_step" in output

# Terminate if necessary
wrangler workflows instances terminate <INSTANCE_ID> --workflow-name my-workflow
```

---

### High Failure Rate

```bash
# List recent failures
wrangler workflows instances list --workflow-name my-workflow --status failed --limit 50

# Investigate first failure
wrangler workflows instances describe <FIRST_FAILED_ID> --workflow-name my-workflow

# Check for common error patterns
wrangler tail my-worker --search "NonRetryableError"
```

---

## Configuration Reference

### wrangler.jsonc Setup

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "workflows": [
    {
      "name": "my-workflow",
      "class_name": "MyWorkflow",
      "binding": "MY_WORKFLOW"
    }
  ]
}
```

---

## Official Documentation

- **Wrangler Commands**: https://developers.cloudflare.com/workers/wrangler/commands/#workflows
- **Workflows CLI Reference**: https://developers.cloudflare.com/workflows/reference/wrangler-commands/
- **Debugging Workflows**: https://developers.cloudflare.com/workflows/observability/

---

**Note**: All commands require authentication. Run `wrangler login` if not already authenticated.

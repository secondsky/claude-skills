# Wrangler Commands for Cloudflare Queues

Complete reference for managing Cloudflare Queues via the `wrangler` CLI.

---

## Queue Management

### Create Queue

```bash
npx wrangler queues create <NAME> [OPTIONS]
```

**Options:**
- `--delivery-delay-secs <SECONDS>` - Default delay for all messages (0-43200)
- `--message-retention-period-secs <SECONDS>` - How long messages persist (60-1209600, default: 345600 / 4 days)

**Examples:**

```bash
# Create basic queue
npx wrangler queues create my-queue

# Create with custom retention (7 days)
npx wrangler queues create my-queue --message-retention-period-secs 604800

# Create with default delivery delay (5 minutes)
npx wrangler queues create delayed-queue --delivery-delay-secs 300
```

---

### List Queues

```bash
npx wrangler queues list
```

**Output:**
```
┌──────────────────┬─────────────┬──────────┐
│ Name             │ Consumers   │ Messages │
├──────────────────┼─────────────┼──────────┤
│ my-queue         │ 1           │ 0        │
│ high-priority    │ 2           │ 142      │
│ my-dlq           │ 1           │ 5        │
└──────────────────┴─────────────┴──────────┘
```

---

### Get Queue Info

```bash
npx wrangler queues info <NAME>
```

**Example:**

```bash
npx wrangler queues info my-queue

# Output:
# Queue: my-queue
# Message Retention: 345600 seconds (4 days)
# Delivery Delay: 0 seconds
# Consumers: 1
#   - my-consumer (batch_size: 10, batch_timeout: 5s, max_retries: 3)
# Backlog: 0 messages
```

---

### Update Queue

```bash
npx wrangler queues update <NAME> [OPTIONS]
```

**Options:**
- `--delivery-delay-secs <SECONDS>` - Update default delay
- `--message-retention-period-secs <SECONDS>` - Update retention period

**Examples:**

```bash
# Update retention to 14 days (max)
npx wrangler queues update my-queue --message-retention-period-secs 1209600

# Update delivery delay to 10 minutes
npx wrangler queues update my-queue --delivery-delay-secs 600
```

---

### Delete Queue

```bash
npx wrangler queues delete <NAME>
```

**⚠️ WARNING:**
- Deletes ALL messages in the queue
- Cannot be undone
- Use with extreme caution in production

**Example:**

```bash
npx wrangler queues delete old-queue
```

---

## Consumer Management

### Add Consumer

```bash
npx wrangler queues consumer add <QUEUE-NAME> <WORKER-SCRIPT-NAME> [OPTIONS]
```

**Options:**
- `--batch-size <NUMBER>` - Max messages per batch (1-100, default: 10)
- `--batch-timeout <SECONDS>` - Max wait time (0-60, default: 5)
- `--message-retries <NUMBER>` - Max retry attempts (0-100, default: 3)
- `--max-concurrency <NUMBER>` - Limit concurrent consumers (default: auto-scale to 250)
- `--retry-delay-secs <SECONDS>` - Default retry delay
- `--dead-letter-queue <QUEUE-NAME>` - DLQ for failed messages

**Examples:**

```bash
# Basic consumer
npx wrangler queues consumer add my-queue my-consumer

# Optimized for high throughput
npx wrangler queues consumer add my-queue my-consumer \
  --batch-size 100 \
  --batch-timeout 1

# With DLQ and retry settings
npx wrangler queues consumer add my-queue my-consumer \
  --batch-size 50 \
  --message-retries 5 \
  --retry-delay-secs 300 \
  --dead-letter-queue my-dlq

# Limit concurrency for rate-limited APIs
npx wrangler queues consumer add api-queue api-consumer \
  --max-concurrency 10
```

---

### Remove Consumer

```bash
npx wrangler queues consumer remove <QUEUE-NAME> <WORKER-SCRIPT-NAME>
```

**Example:**

```bash
npx wrangler queues consumer remove my-queue my-consumer
```

---

## Queue Operations

### Purge Queue

```bash
npx wrangler queues purge <QUEUE-NAME>
```

**⚠️ WARNING:**
- Permanently deletes ALL messages
- Cannot be undone
- Use for clearing test data or stuck queues

**Example:**

```bash
npx wrangler queues purge test-queue
```

---

### Pause Delivery

```bash
npx wrangler queues pause-delivery <QUEUE-NAME>
```

**Use cases:**
- Maintenance on consumer Workers
- Debugging consumer issues
- Temporarily stop processing without deleting messages

**Example:**

```bash
npx wrangler queues pause-delivery my-queue
```

---

### Resume Delivery

```bash
npx wrangler queues resume-delivery <QUEUE-NAME>
```

**Example:**

```bash
npx wrangler queues resume-delivery my-queue
```

---

## Event Subscriptions

Event subscriptions automatically send messages to a queue when events occur in other Cloudflare services.

### Create Subscription

```bash
npx wrangler queues subscription create <QUEUE-NAME> [OPTIONS]
```

**Options:**
- `--source <TYPE>` - Event source (kv, r2, superSlurper, vectorize, workersAi.model, workersBuilds.worker, workflows.workflow)
- `--events <EVENTS>` - Comma-separated list of event types
- `--name <NAME>` - Subscription name (auto-generated if omitted)
- `--enabled` - Whether subscription is active (default: true)

**Examples:**

```bash
# Subscribe to R2 bucket events
npx wrangler queues subscription create my-queue \
  --source r2 \
  --events object-create,object-delete \
  --bucket-name my-bucket

# Subscribe to KV namespace events
npx wrangler queues subscription create my-queue \
  --source kv \
  --events key-write,key-delete \
  --namespace-id abc123

# Subscribe to Worker build events
npx wrangler queues subscription create build-queue \
  --source workersBuilds.worker \
  --events build-complete,build-failed \
  --worker-name my-worker
```

---

### List Subscriptions

```bash
npx wrangler queues subscription list <QUEUE-NAME> [OPTIONS]
```

**Options:**
- `--page <NUMBER>` - Page number
- `--per-page <NUMBER>` - Results per page
- `--json` - Output as JSON

**Example:**

```bash
npx wrangler queues subscription list my-queue --json
```

---

### Get Subscription

```bash
npx wrangler queues subscription get <QUEUE-NAME> --id <SUBSCRIPTION-ID> [--json]
```

**Example:**

```bash
npx wrangler queues subscription get my-queue --id sub_123 --json
```

---

### Delete Subscription

```bash
npx wrangler queues subscription delete <QUEUE-NAME> --id <SUBSCRIPTION-ID>
```

**Example:**

```bash
npx wrangler queues subscription delete my-queue --id sub_123
```

---

## Global Flags

These flags work on all commands:

- `--help` - Show help
- `--config <PATH>` - Path to wrangler.toml or wrangler.jsonc
- `--cwd <PATH>` - Run as if started in specified directory

---

## Complete Workflow Example

```bash
# 1. Create queues
npx wrangler queues create my-queue
npx wrangler queues create my-dlq

# 2. Create and deploy producer Worker
cd my-producer
npm create cloudflare@latest -- --type hello-world --ts
# Add producer binding to wrangler.jsonc
npm run deploy

# 3. Create and deploy consumer Worker
cd ../my-consumer
npm create cloudflare@latest -- --type hello-world --ts
# Add consumer handler
npm run deploy

# 4. Add consumer to queue
npx wrangler queues consumer add my-queue my-consumer \
  --batch-size 50 \
  --message-retries 5 \
  --dead-letter-queue my-dlq

# 5. Monitor queue
npx wrangler queues info my-queue

# 6. Watch consumer logs
npx wrangler tail my-consumer

# 7. If needed, pause delivery
npx wrangler queues pause-delivery my-queue

# 8. Resume delivery
npx wrangler queues resume-delivery my-queue
```

---

## Troubleshooting

### Check queue backlog

```bash
npx wrangler queues info my-queue | grep "Backlog"
```

### Clear stuck queue

```bash
npx wrangler queues purge my-queue
```

### Verify consumer is attached

```bash
npx wrangler queues info my-queue | grep "Consumers"
```

### Check for delivery paused

```bash
npx wrangler queues info my-queue
# Look for "Delivery: paused"
```

---

## Monitoring & Debugging Commands

### Real-Time Monitoring

#### Check Queue Status

```bash
# Get comprehensive queue information
bunx wrangler queues info my-queue

# Output includes:
# - Message count (current backlog)
# - Consumers attached
# - Delivery status (active/paused)
# - DLQ configuration
```

#### Monitor Consumer Logs (Real-Time)

```bash
# Tail logs from consumer Worker
bunx wrangler tail my-consumer

# Filter by status
bunx wrangler tail my-consumer --status error    # Only errors
bunx wrangler tail my-consumer --status ok        # Only successful

# Filter by search term
bunx wrangler tail my-consumer --search "payment"
```

#### Check Dead Letter Queue

```bash
# Monitor DLQ for failed messages
bunx wrangler queues info my-queue-dlq

# Tail DLQ consumer logs
bunx wrangler tail my-dlq-consumer
```

### Delivery Control

#### Pause Message Delivery

```bash
# Pause delivery to investigate issues
bunx wrangler queues pause-delivery my-queue

# Verify paused
bunx wrangler queues info my-queue | grep "Delivery"
# Output: "Delivery: paused"
```

**Use when**:
- Investigating consumer errors
- Deploying new consumer version
- Performing database maintenance
- Testing recovery procedures

#### Resume Message Delivery

```bash
# Resume delivery after fixes
bunx wrangler queues resume-delivery my-queue

# Verify active
bunx wrangler queues info my-queue | grep "Delivery"
# Output: "Delivery: active"
```

### Performance Analysis

#### Message Throughput

```bash
# Check message count before and after 1 minute
bunx wrangler queues info my-queue

# Wait 60 seconds

bunx wrangler queues info my-queue

# Calculate: (count_before - count_after) = messages processed per minute
```

#### Consumer Processing Time

```bash
# Use tail to measure time between logs
bunx wrangler tail my-consumer --format pretty

# Look for:
# - Time between "Processing batch" and "Batch complete" logs
# - Time per message (batch time / batch size)
```

### Debugging Workflow

#### Step 1: Check Queue Health

```bash
# Get queue overview
bunx wrangler queues info my-queue

# Questions to answer:
# - Is delivery active or paused?
# - Are consumers attached?
# - Is message count growing (backlog)?
# - Is DLQ configured?
```

#### Step 2: Review Consumer Logs

```bash
# Check recent errors
bunx wrangler tail my-consumer --status error --format pretty

# Look for:
# - Error messages and stack traces
# - Failed message IDs
# - Retry patterns
```

#### Step 3: Inspect DLQ

```bash
# Check if messages are reaching DLQ
bunx wrangler queues info my-queue-dlq

# If DLQ has messages:
# 1. Review DLQ consumer logs for patterns
# 2. Fix root cause in main consumer
# 3. Reprocess DLQ messages manually or via DLQ consumer
```

#### Step 4: Test with Low Volume

```bash
# Pause delivery
bunx wrangler queues pause-delivery my-queue

# Deploy fix

# Resume with monitoring
bunx wrangler queues resume-delivery my-queue
bunx wrangler tail my-consumer --format pretty
```

### Advanced Monitoring

#### Concurrent Consumer Instances

```bash
# Check how many instances are running
# (Not directly available via CLI, but visible in logs)
bunx wrangler tail my-consumer

# Look for different instance IDs in logs
# Multiple IDs = concurrent processing active
```

#### Message Latency Tracking

```bash
# Add timestamps to your consumer logs
# Then monitor with tail

bunx wrangler tail my-consumer | grep "latency"

# Example log output:
# "Message processed: id=abc123, latency=234ms"
```

#### Cost Monitoring

```bash
# Check CPU usage (from dashboard or metrics)
# Not directly via wrangler, but can tail for duration logs

bunx wrangler tail my-consumer | grep "duration"

# High durations indicate need for CPU limit increase
```

---

**Last Updated**: 2025-11-26
**Wrangler Version**: 4.50.0+

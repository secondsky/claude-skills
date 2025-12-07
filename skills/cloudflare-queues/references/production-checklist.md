# Cloudflare Queues Production Deployment Checklist

**Last Updated**: 2025-11-26

Complete this checklist before deploying queue consumers to production to ensure reliability, scalability, and proper error handling.

---

## Pre-Deployment Checklist

### 1. Dead Letter Queue Configuration

- [ ] **DLQ Created**: Separate queue created for failed messages
- [ ] **DLQ Consumer Deployed**: Worker deployed to monitor and process DLQ messages
- [ ] **DLQ Monitoring**: Alerts configured for DLQ message count thresholds
- [ ] **DLQ Retention**: Appropriate retention policy set (default: 4 days)

**Why**: Messages that fail after max retries need a recovery mechanism. Without a DLQ, failed messages are permanently lost.

**Configuration Example**:
```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "my-queue",
        "dead_letter_queue": "my-queue-dlq",
        "max_retries": 3
      }
    ]
  }
}
```

---

### 2. Message Acknowledgment Strategy

- [ ] **Explicit ack() for Non-Idempotent Operations**: Database writes, API calls, payments use explicit `message.ack()`
- [ ] **Implicit ack for Idempotent Operations**: Read-only operations can rely on automatic ack
- [ ] **Ack Timing Verified**: `ack()` called AFTER successful processing, not before

**Why**: Incorrect ack patterns cause duplicate processing or message loss.

**Decision Tree**:
- Database write/update? → Explicit `ack()`
- External API call? → Explicit `ack()`
- Read-only/idempotent? → Implicit ack (no call needed)

---

### 3. Message Size Validation

- [ ] **Size Check Implemented**: Validate messages <128 KB before sending
- [ ] **Fallback Strategy**: Large payloads stored in R2/KV with reference in queue
- [ ] **Error Handling**: Clear error messages when size limit exceeded

**Why**: Messages >128 KB are rejected, causing silent failures.

**Validation Pattern**:
```typescript
const messageSize = JSON.stringify(payload).length;
if (messageSize > 128 * 1024) {
  // Store in R2, send reference
  const key = `large-messages/${crypto.randomUUID()}`;
  await env.R2_BUCKET.put(key, JSON.stringify(payload));
  await env.MY_QUEUE.send({ type: 'large', key });
} else {
  await env.MY_QUEUE.send(payload);
}
```

---

### 4. Batch Size Optimization

- [ ] **Batch Size Tested**: Optimal batch size determined through load testing
- [ ] **Processing Time Measured**: Average time per message calculated
- [ ] **Timeout Risk Assessed**: Total batch processing time <30 seconds (CPU limit)

**Why**: Too small = inefficient. Too large = timeout risk.

**Guidelines**:
- Fast operations (<100ms): Batch 100 messages
- Medium operations (100ms-1s): Batch 10-50 messages
- Slow operations (>1s): Batch 1-10 messages or increase CPU limit

---

### 5. Concurrency Configuration

- [ ] **max_concurrency NOT Set** (unless specific reason): Let Workers auto-scale
- [ ] **Auto-Scaling Verified**: Queue automatically creates concurrent invocations under load
- [ ] **Concurrency Override Justified**: If set to 1, document why

**Why**: Setting `max_concurrency: 1` disables auto-scaling, creating bottlenecks.

**When to Set max_concurrency**:
- ✅ Ordering guarantee required (set to 1)
- ✅ Rate limiting external API (set to match API limits)
- ❌ "Just to be safe" (this hurts performance)

---

### 6. CPU Limit for Long-Running Tasks

- [ ] **CPU Limit Increased**: If processing takes >30 seconds, increase `cpu_ms`
- [ ] **Processing Time Measured**: Actual processing time documented
- [ ] **Cost Impact Calculated**: Higher CPU limits = higher cost

**Configuration**:
```jsonc
{
  "queues": {
    "consumers": [
      {
        "queue": "long-running-tasks",
        "max_batch_timeout": 60,  // seconds
        "max_batch_size": 10,
        "max_retries": 2,
        "cpu_ms": 180000  // 3 minutes (default: 30s)
      }
    ]
  }
}
```

**Guidelines**:
- Default: 30,000 ms (30 seconds)
- Video processing: 180,000 ms (3 minutes)
- Image processing: 60,000 ms (1 minute)

---

### 7. Error Handling & Retry Logic

- [ ] **Try-Catch Implemented**: All message processing wrapped in error handling
- [ ] **Retry Strategy Defined**: Exponential backoff or fixed delay configured
- [ ] **Max Attempts Respected**: Consumer checks `message.attempts` before retry
- [ ] **Unrecoverable Errors Identified**: Validation failures ack immediately (no retry)

**Retry Pattern**:
```typescript
for (const message of batch.messages) {
  try {
    await processMessage(message.body);
    message.ack();
  } catch (error) {
    console.error(`Failed (attempt ${message.attempts}):`, error);

    // Exponential backoff: 1min, 2min, 4min, 8min, 16min
    const delay = Math.min(Math.pow(2, message.attempts) * 60, 3600);

    if (message.attempts >= 5) {
      // After 5 attempts, let it go to DLQ
      message.ack();
    } else {
      message.retry({ delaySeconds: delay });
    }
  }
}
```

---

### 8. Monitoring & Alerting

- [ ] **CloudWatch Metrics Configured**: Message counts, processing time, error rates
- [ ] **Alerts Set Up**: Notifications for DLQ threshold, high error rate, consumer failures
- [ ] **Dashboard Created**: Real-time visibility into queue health
- [ ] **Log Aggregation**: Consumer logs centralized (e.g., Logpush)

**Key Metrics to Monitor**:
- **Messages Published**: Rate of incoming messages
- **Messages Processed**: Rate of successful processing
- **DLQ Message Count**: Should stay near zero
- **Consumer Errors**: Error rate percentage
- **Processing Latency**: Average time per message

---

### 9. Rate Limiting for External APIs

- [ ] **Rate Limits Identified**: External API limits documented (req/sec, req/day)
- [ ] **Throttling Implemented**: Queue consumer respects API limits
- [ ] **Backpressure Handled**: Retry with appropriate delay when rate limited

**Pattern**:
```typescript
let requestCount = 0;
const MAX_REQUESTS_PER_SECOND = 100;

for (const message of batch.messages) {
  if (requestCount >= MAX_REQUESTS_PER_SECOND) {
    // Rate limit reached, retry remaining messages with delay
    message.retry({ delaySeconds: 60 });
    continue;
  }

  await callExternalAPI(message.body);
  requestCount++;
  message.ack();
}
```

---

### 10. Idempotency Where Possible

- [ ] **Idempotent Operations Identified**: Operations that can be safely repeated
- [ ] **Deduplication Keys Used**: For critical operations (payments, orders)
- [ ] **Idempotency Tokens**: Passed to external APIs

**Why**: Network failures or retry logic can cause duplicate processing. Idempotency prevents double-charging, duplicate records, etc.

**Pattern**:
```typescript
// Use message ID as idempotency key
const idempotencyKey = message.id;

// Check if already processed
const existing = await env.DB.prepare(
  'SELECT * FROM processed_messages WHERE message_id = ?'
).bind(idempotencyKey).first();

if (existing) {
  message.ack(); // Already processed, skip
  continue;
}

// Process and record
await processPayment(message.body, idempotencyKey);
await env.DB.prepare(
  'INSERT INTO processed_messages (message_id, processed_at) VALUES (?, ?)'
).bind(idempotencyKey, new Date().toISOString()).run();

message.ack();
```

---

### 11. Load Testing

- [ ] **Load Test Completed**: Queue tested at expected production volume
- [ ] **Peak Load Tested**: 2-3x expected volume tested
- [ ] **Failure Scenarios Tested**: Network failures, timeouts, API errors
- [ ] **Recovery Tested**: Queue recovery after consumer deployment/restart

**Load Test Checklist**:
1. Send 1000 messages in 1 minute
2. Send 10,000 messages in 10 minutes
3. Introduce 50% error rate, verify retries
4. Pause consumer mid-batch, verify recovery
5. Deploy new consumer version, verify no message loss

---

### 12. Security Review

- [ ] **Authentication Required**: Producer endpoints require authentication
- [ ] **Input Validation**: All message bodies validated before processing
- [ ] **Secret Management**: API keys stored in environment variables (not in code)
- [ ] **CORS Configured**: If producer is browser-based

---

## Deployment Workflow

### Pre-Deployment
1. ✅ Complete all checklist items above
2. ✅ Review code changes in PR
3. ✅ Run integration tests
4. ✅ Document any configuration changes

### Deployment
1. **Deploy DLQ Consumer First** (if new)
2. **Deploy Producer** (if changed)
3. **Deploy Main Consumer** (always last)
4. **Verify Monitoring**: Check dashboards/logs immediately

### Post-Deployment
1. **Monitor for 1 hour**: Watch for errors, DLQ messages
2. **Verify Message Flow**: Send test messages, confirm processing
3. **Check Latency**: Ensure processing time within expected range
4. **Document Issues**: Any unexpected behavior noted for next deployment

---

## Common Production Pitfalls

### ❌ Don't:
- Set `max_concurrency: 1` without justification
- Use implicit ack for database writes
- Send messages >128 KB without validation
- Deploy without DLQ configured
- Ignore retry logic and exponential backoff

### ✅ Do:
- Let concurrency auto-scale (omit `max_concurrency`)
- Use explicit `ack()` for non-idempotent operations
- Validate message size before sending
- Always configure DLQ + monitoring
- Implement exponential backoff for retries

---

## Post-Production Monitoring

### Daily Checks
- DLQ message count (should be near zero)
- Error rate (should be <1%)
- Processing latency (should be consistent)

### Weekly Reviews
- Capacity planning (message volume trends)
- Cost analysis (CPU usage vs throughput)
- Error pattern analysis (common failure causes)

### Monthly Audits
- Load test with production volume
- Review retry patterns and adjust if needed
- Update documentation with lessons learned

---

## Additional Resources

- **Best Practices Guide**: `references/best-practices.md`
- **Error Catalog**: `references/error-catalog.md` (all 10 errors with solutions)
- **Wrangler Commands**: `references/wrangler-commands.md` (CLI reference)
- **Official Docs**: https://developers.cloudflare.com/queues/

---

**Remember**: A well-configured queue is reliable, scalable, and predictable. Take time to complete this checklist—it prevents costly production issues!

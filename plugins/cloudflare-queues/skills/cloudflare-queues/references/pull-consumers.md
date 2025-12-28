# Pull-Based Consumers

**Official Feature**: Enable applications to retrieve messages on-demand from Cloudflare Queues rather than through push mechanisms.

**When to Use**: Load this reference when the user asks to "pull messages from queue", "retrieve messages on-demand", "consume from non-Workers environment", or needs to integrate queues with external systems that can't use Workers consumers.

---

## Overview

Pull-based consumers allow applications outside of Cloudflare Workers to retrieve messages from queues via HTTP. This enables queue integration with:
- Traditional backend services (Node.js, Python, Go servers)
- Containerized applications
- Existing microservices architectures
- Systems that can't deploy as Workers consumers

**Key Difference from Push Consumers**:
- **Push**: Worker consumer automatically receives batches (default Cloudflare Queues pattern)
- **Pull**: Application makes HTTP requests to retrieve message batches when ready

---

## Use Cases

### 1. Legacy System Integration
Integrate queues with existing backend services without rewriting as Workers:
```python
# Python service pulls messages
import requests

def process_queue_messages():
    response = requests.post(
        'https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_name}/messages/pull',
        headers={
            'Authorization': 'Bearer {api_token}',
            'Content-Type': 'application/json'
        },
        json={
            'batch_size': 10,
            'visibility_timeout': 30
        }
    )

    messages = response.json()['result']['messages']
    for msg in messages:
        process_message(msg['body'])
        # Acknowledge after processing
        ack_message(msg['id'])
```

### 2. Containerized Applications
Pull messages from Docker containers or Kubernetes pods:
```javascript
// Node.js container service
const fetch = require('node-fetch');

async function pollQueue() {
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/queues/${QUEUE_NAME}/messages/pull`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                batch_size: 25,
                visibility_timeout: 60
            })
        }
    );

    const { messages } = await response.json().result;
    return messages;
}

// Poll every 5 seconds
setInterval(async () => {
    const messages = await pollQueue();
    await processMessages(messages);
}, 5000);
```

### 3. On-Demand Processing
Trigger message retrieval based on external events or schedules:
```go
// Go service - pull on webhook trigger
package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func pullMessages(batchSize int) ([]Message, error) {
    payload := map[string]int{
        "batch_size": batchSize,
        "visibility_timeout": 45,
    }

    body, _ := json.Marshal(payload)

    req, _ := http.NewRequest(
        "POST",
        fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/queues/%s/messages/pull", accountID, queueName),
        bytes.NewBuffer(body),
    )

    req.Header.Set("Authorization", "Bearer " + apiToken)
    req.Header.Set("Content-Type", "application/json")

    resp, err := client.Do(req)
    // Handle response...
}
```

---

## HTTP Pull API Reference

### Endpoint
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_name}/messages/pull
```

### Authentication
Requires Cloudflare API Token with `Queue: Read` and `Queue: Edit` permissions.

### Request Headers
```http
Authorization: Bearer {api_token}
Content-Type: application/json
```

### Request Body
```json
{
  "batch_size": 10,           // Number of messages to retrieve (1-100)
  "visibility_timeout": 30    // Seconds messages hidden from other consumers (1-43200)
}
```

**Parameters**:
- `batch_size` (required): 1-100 messages per pull request
- `visibility_timeout` (required): 1-43,200 seconds (12 hours max)
  - Messages become invisible to other consumers for this duration
  - Must ack/nack within timeout or messages return to queue

### Response Format
```json
{
  "success": true,
  "result": {
    "messages": [
      {
        "id": "msg_abc123",
        "body": {
          "type": "order-processed",
          "orderId": "12345",
          "userId": "user_789"
        },
        "timestamp": "2025-12-27T10:30:00Z",
        "attempts": 1,
        "lease_id": "lease_xyz"
      }
    ],
    "queue_name": "my-queue"
  }
}
```

**Response Fields**:
- `id`: Unique message identifier (for ack/nack)
- `body`: Message payload (JSON object)
- `timestamp`: When message was enqueued
- `attempts`: Number of delivery attempts
- `lease_id`: Required for acknowledging message

---

## Message Acknowledgment

### Explicit Ack (Success)
After successfully processing, acknowledge the message:

```http
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_name}/messages/ack

{
  "acks": [
    {
      "message_id": "msg_abc123",
      "lease_id": "lease_xyz"
    }
  ]
}
```

**Batch Acks** (up to 100 messages):
```json
{
  "acks": [
    {"message_id": "msg_1", "lease_id": "lease_1"},
    {"message_id": "msg_2", "lease_id": "lease_2"},
    {"message_id": "msg_3", "lease_id": "lease_3"}
  ]
}
```

### Negative Ack (Failure)
Return message to queue for retry:

```http
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_name}/messages/nack

{
  "nacks": [
    {
      "message_id": "msg_abc123",
      "lease_id": "lease_xyz",
      "retry_delay": 10  // Optional: seconds before retry (default: 0)
    }
  ]
}
```

### Visibility Timeout Expiry
If neither ack nor nack within `visibility_timeout`:
- Message automatically returns to queue
- Increments `attempts` counter
- Subject to `max_retries` limit

---

## Polling Strategies

### 1. Short Polling (Recommended for Low Latency)
```javascript
// Poll every 2 seconds
async function shortPoll() {
    while (true) {
        const messages = await pullMessages(10);
        if (messages.length > 0) {
            await processMessages(messages);
        }
        await sleep(2000);
    }
}
```

**Pros**: Low latency, simple implementation
**Cons**: Higher API call volume (consider rate limits)

### 2. Long Polling (Reduce API Calls)
```javascript
// Poll every 30 seconds, larger batches
async function longPoll() {
    while (true) {
        const messages = await pullMessages(100);
        await processMessages(messages);
        await sleep(30000);
    }
}
```

**Pros**: Fewer API calls, reduced costs
**Cons**: Higher latency for message processing

### 3. Adaptive Polling (Best of Both)
```javascript
// Adjust interval based on queue activity
let pollInterval = 5000; // Start at 5 seconds

async function adaptivePoll() {
    while (true) {
        const messages = await pullMessages(25);

        if (messages.length === 0) {
            // No messages - slow down polling
            pollInterval = Math.min(pollInterval * 1.5, 60000); // Max 60s
        } else {
            // Messages found - speed up polling
            pollInterval = Math.max(pollInterval * 0.7, 1000); // Min 1s
            await processMessages(messages);
        }

        await sleep(pollInterval);
    }
}
```

**Pros**: Balances latency and API efficiency
**Cons**: More complex logic

---

## Error Handling

### Handle Empty Queue
```javascript
const response = await pullMessages(10);
if (response.messages.length === 0) {
    console.log('Queue empty, waiting...');
    // Implement backoff strategy
}
```

### Handle Rate Limiting
```javascript
try {
    const messages = await pullMessages(10);
} catch (error) {
    if (error.status === 429) {
        console.log('Rate limited, backing off...');
        await sleep(60000); // Wait 1 minute
    }
}
```

### Visibility Timeout Management
```javascript
const VISIBILITY_TIMEOUT = 60; // 60 seconds

async function processWithTimeout(message) {
    const startTime = Date.now();

    try {
        await processMessage(message.body);

        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed < VISIBILITY_TIMEOUT - 5) {
            // Ack before timeout
            await ackMessage(message.id, message.lease_id);
        } else {
            console.error('Processing took too long, message may retry');
        }
    } catch (error) {
        // Nack to return to queue
        await nackMessage(message.id, message.lease_id, 30);
    }
}
```

---

## Comparison: Pull vs Push Consumers

| Feature | Pull Consumer | Push Consumer (Worker) |
|---------|---------------|------------------------|
| **Environment** | Any HTTP client | Cloudflare Workers only |
| **Trigger** | Application polls | Automatic on message arrival |
| **Latency** | Depends on poll interval | Near-instant |
| **Control** | Full control over timing | Workers runtime manages |
| **Scaling** | Manual (run more pollers) | Automatic Workers scaling |
| **Cost** | API calls + compute | Workers invocations |
| **Use Case** | Legacy systems, containers | New Workers-native apps |

**When to Use Pull**:
- Existing backend services (non-Workers)
- Containerized/VM deployments
- Need explicit control over polling
- Integration with existing infrastructure

**When to Use Push**:
- New Workers-native applications
- Need lowest latency
- Want automatic scaling
- Prefer managed infrastructure

---

## Best Practices

### 1. Set Appropriate Visibility Timeout
- **Too short**: Messages re-delivered while still processing
- **Too long**: Delays retries on genuine failures
- **Recommendation**: 2-3x average processing time

```javascript
// If processing takes ~10s on average
const VISIBILITY_TIMEOUT = 30; // 3x average
```

### 2. Batch Processing
Pull multiple messages per request to reduce API overhead:

```javascript
// Good: Pull 25-100 messages per request
const messages = await pullMessages(50);
await Promise.all(messages.map(processMessage));
```

### 3. Graceful Shutdown
Ensure in-flight messages are ack'd or nack'd before shutdown:

```javascript
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');

    // Stop polling
    stopPolling();

    // Finish in-flight messages
    await Promise.all(inFlightMessages.map(async (msg) => {
        try {
            await finishProcessing(msg);
            await ackMessage(msg.id, msg.lease_id);
        } catch (error) {
            await nackMessage(msg.id, msg.lease_id);
        }
    }));

    process.exit(0);
});
```

### 4. Monitor Queue Depth
Track backlog to adjust polling behavior:

```javascript
// Check queue info periodically
const queueInfo = await getQueueInfo();
if (queueInfo.backlog > 1000) {
    // Increase polling frequency or add more workers
    console.log('High backlog detected, scaling up...');
}
```

### 5. Implement Retry Logic
Handle transient failures with exponential backoff:

```javascript
async function processWithRetry(message, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            await processMessage(message.body);
            await ackMessage(message.id, message.lease_id);
            return;
        } catch (error) {
            if (attempt === maxRetries - 1) {
                // Final failure - nack to DLQ
                await nackMessage(message.id, message.lease_id);
            } else {
                // Retry with backoff
                await sleep(Math.pow(2, attempt) * 1000);
            }
        }
    }
}
```

---

## Security Considerations

### 1. Protect API Tokens
Never hardcode tokens in source code:

```javascript
// ❌ Bad: Hardcoded token
const API_TOKEN = 'abc123...';

// ✅ Good: Environment variable
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
```

### 2. Least Privilege
Create dedicated API token with minimal permissions:
- Permission: `Queue: Read`, `Queue: Edit`
- Scope: Specific queue only (not account-wide)

### 3. Secure Message Storage
If messages contain sensitive data, ensure secure processing:

```javascript
async function processMessage(message) {
    // Decrypt sensitive fields
    const decrypted = await decrypt(message.body.sensitive_data);

    // Process...

    // Don't log sensitive data
    console.log('Processed order', message.body.orderId); // Safe
    // console.log(decrypted); // ❌ Never log sensitive data
}
```

---

## Rate Limits

Pull-based consumers are subject to Cloudflare API rate limits:

- **Free Plan**: 1,200 requests/5 minutes (4 req/s)
- **Paid Plans**: Higher limits (check dashboard)

**Recommendation**: Use adaptive polling to stay within limits while maintaining responsiveness.

---

## Migration from Push to Pull

If migrating existing Worker consumer to pull-based:

**Before (Worker Consumer)**:
```typescript
// Worker with queue consumer
export default {
    async queue(batch: MessageBatch<any>, env: Env) {
        for (const message of batch.messages) {
            await processMessage(message.body);
        }
    }
}
```

**After (Pull Consumer)**:
```typescript
// Standalone service pulling messages
async function main() {
    while (true) {
        const response = await fetch(pullEndpoint, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ batch_size: 10, visibility_timeout: 30 })
        });

        const { messages } = await response.json().result;

        for (const msg of messages) {
            await processMessage(msg.body);
            await ackMessage(msg.id, msg.lease_id);
        }

        await sleep(5000);
    }
}
```

---

## Troubleshooting

**Problem**: Messages not appearing in pull requests
- **Check**: Verify queue has messages (`wrangler queues info`)
- **Check**: Ensure visibility timeout hasn't hidden messages
- **Solution**: Wait for visibility timeout to expire or increase batch_size

**Problem**: Messages being processed multiple times
- **Check**: Verify ack is being called successfully
- **Check**: Processing time vs visibility timeout
- **Solution**: Increase visibility_timeout or optimize processing speed

**Problem**: Rate limit errors (429)
- **Check**: Polling frequency too high
- **Solution**: Increase poll interval or implement adaptive polling

**Problem**: Lease ID invalid when acking
- **Check**: Visibility timeout expired before ack
- **Solution**: Reduce processing time or increase visibility_timeout

---

## Additional Resources

- **Official Docs**: https://developers.cloudflare.com/queues/configuration/pull-consumers/
- **API Reference**: https://developers.cloudflare.com/api/operations/queue-messages-pull
- **Rate Limits**: https://developers.cloudflare.com/fundamentals/api/reference/limits/

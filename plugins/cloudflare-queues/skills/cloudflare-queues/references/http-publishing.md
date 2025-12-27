# HTTP Publishing to Cloudflare Queues

**Official Feature**: Direct HTTP endpoints allow external systems to publish messages to queues without Workers.

**When to Use**: Load this reference when the user asks to "publish from external service", "send messages via HTTP", "integrate third-party system with queue", or needs to publish from non-Workers environments.

---

## Overview

HTTP Publishing enables any system with HTTP capabilities to send messages directly to Cloudflare Queues using REST API endpoints. This allows queue integration from:
- External APIs and webhooks
- CI/CD pipelines
- Monitoring/alerting systems
- Legacy applications
- Third-party services

**Key Benefits**:
- No Workers deployment required for publishing
- Standard HTTP POST requests
- Works from any environment
- Simple authentication via API tokens

---

## Use Cases

### 1. Webhook Integration
Receive webhooks from external services and queue for processing:

```bash
# Stripe webhook → Queue
curl -X POST \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_name}/messages \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "body": {
        "type": "payment.succeeded",
        "stripe_event_id": "evt_123",
        "amount": 4999,
        "customer_id": "cus_xyz"
      }
    }]
  }'
```

### 2. CI/CD Pipeline Events
Queue deployment notifications from GitHub Actions, GitLab CI:

```yaml
# .github/workflows/deploy.yml
- name: Notify Queue on Deploy
  run: |
    curl -X POST \
      https://api.cloudflare.com/client/v4/accounts/${{ secrets.CF_ACCOUNT_ID }}/queues/deployment-events/messages \
      -H "Authorization: Bearer ${{ secrets.CF_API_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{
        "messages": [{
          "body": {
            "event": "deployment.completed",
            "repo": "${{ github.repository }}",
            "commit": "${{ github.sha }}",
            "environment": "production"
          }
        }]
      }'
```

### 3. Monitoring Alerts
Send alerts from monitoring systems (Datadog, New Relic, Prometheus):

```python
# Datadog webhook handler
import requests

def send_alert_to_queue(alert_data):
    response = requests.post(
        f'https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/monitoring-alerts/messages',
        headers={
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        },
        json={
            'messages': [{
                'body': {
                    'alert_id': alert_data['id'],
                    'severity': alert_data['severity'],
                    'service': alert_data['service'],
                    'message': alert_data['message'],
                    'timestamp': alert_data['timestamp']
                }
            }]
        }
    )
    return response.status_code == 200
```

### 4. Legacy System Integration
Queue messages from systems that can't run Workers:

```java
// Java application
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

public void publishToQueue(OrderEvent event) {
    String endpoint = String.format(
        "https://api.cloudflare.com/client/v4/accounts/%s/queues/%s/messages",
        accountId, queueName
    );

    HttpPost request = new HttpPost(endpoint);
    request.setHeader("Authorization", "Bearer " + apiToken);
    request.setHeader("Content-Type", "application/json");

    String json = String.format(
        "{\"messages\": [{\"body\": {\"orderId\": \"%s\", \"userId\": \"%s\"}}]}",
        event.getOrderId(), event.getUserId()
    );

    request.setEntity(new StringEntity(json));

    try (CloseableHttpClient client = HttpClients.createDefault()) {
        client.execute(request);
    }
}
```

---

## HTTP Publish API Reference

### Endpoint
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/queues/{queue_name}/messages
```

### Authentication
Requires Cloudflare API Token with `Queue: Edit` permission.

### Request Headers
```http
Authorization: Bearer {api_token}
Content-Type: application/json
```

### Request Body Format

**Single Message**:
```json
{
  "messages": [
    {
      "body": {
        "type": "order-created",
        "orderId": "12345",
        "userId": "user_789",
        "amount": 99.99
      }
    }
  ]
}
```

**Batch Messages** (up to 100 per request):
```json
{
  "messages": [
    {
      "body": {
        "type": "order-created",
        "orderId": "12345"
      }
    },
    {
      "body": {
        "type": "order-created",
        "orderId": "12346"
      }
    },
    {
      "body": {
        "type": "order-created",
        "orderId": "12347"
      }
    }
  ]
}
```

**Message with Delay**:
```json
{
  "messages": [
    {
      "body": {
        "type": "send-reminder",
        "userId": "user_123"
      },
      "delay_seconds": 3600
    }
  ]
}
```

**Parameters**:
- `body` (required): Message payload as JSON object (max 128 KB)
- `delay_seconds` (optional): Delay delivery by 0-43,200 seconds (12 hours)

### Response Format

**Success (200 OK)**:
```json
{
  "success": true,
  "result": {
    "success_count": 3,
    "messages": [
      {
        "id": "msg_abc123",
        "timestamp": "2025-12-27T10:30:00Z"
      },
      {
        "id": "msg_def456",
        "timestamp": "2025-12-27T10:30:00Z"
      },
      {
        "id": "msg_ghi789",
        "timestamp": "2025-12-27T10:30:00Z"
      }
    ]
  }
}
```

**Error (400 Bad Request)**:
```json
{
  "success": false,
  "errors": [
    {
      "code": 10004,
      "message": "Message body exceeds 128 KB limit"
    }
  ]
}
```

---

## Code Examples by Language

### cURL
```bash
# Single message
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/abc123/queues/my-queue/messages" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "body": {
        "event": "user.signup",
        "userId": "user_123",
        "timestamp": 1703692800
      }
    }]
  }'

# Batch publish
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/abc123/queues/my-queue/messages" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"body": {"orderId": "1"}},
      {"body": {"orderId": "2"}},
      {"body": {"orderId": "3"}}
    ]
  }'

# Delayed message
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/abc123/queues/my-queue/messages" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "body": {"task": "send-reminder"},
      "delay_seconds": 3600
    }]
  }'
```

### Python
```python
import requests
import json

class CloudflareQueuePublisher:
    def __init__(self, account_id: str, api_token: str):
        self.account_id = account_id
        self.api_token = api_token
        self.base_url = f'https://api.cloudflare.com/client/v4/accounts/{account_id}/queues'

    def publish(self, queue_name: str, messages: list, delay_seconds: int = 0):
        """
        Publish messages to queue

        Args:
            queue_name: Name of the queue
            messages: List of message bodies (dicts)
            delay_seconds: Optional delay (0-43200 seconds)

        Returns:
            Response dict with success status and message IDs
        """
        url = f'{self.base_url}/{queue_name}/messages'

        payload = {
            'messages': [
                {
                    'body': msg,
                    **({"delay_seconds": delay_seconds} if delay_seconds > 0 else {})
                }
                for msg in messages
            ]
        }

        response = requests.post(
            url,
            headers={
                'Authorization': f'Bearer {self.api_token}',
                'Content-Type': 'application/json'
            },
            json=payload
        )

        response.raise_for_status()
        return response.json()

# Usage
publisher = CloudflareQueuePublisher(
    account_id='abc123',
    api_token='your_api_token'
)

# Single message
result = publisher.publish('my-queue', [
    {'type': 'order-created', 'orderId': '12345'}
])

# Batch publish
result = publisher.publish('my-queue', [
    {'type': 'email', 'to': 'user1@example.com'},
    {'type': 'email', 'to': 'user2@example.com'},
    {'type': 'email', 'to': 'user3@example.com'}
])

# Delayed message
result = publisher.publish(
    'my-queue',
    [{'task': 'send-reminder', 'userId': 'user_123'}],
    delay_seconds=3600
)

print(f"Published {result['result']['success_count']} messages")
```

### Node.js
```javascript
// Node.js with fetch
class CloudflareQueuePublisher {
    constructor(accountId, apiToken) {
        this.accountId = accountId;
        this.apiToken = apiToken;
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/queues`;
    }

    async publish(queueName, messages, delaySeconds = 0) {
        const url = `${this.baseUrl}/${queueName}/messages`;

        const payload = {
            messages: messages.map(body => ({
                body,
                ...(delaySeconds > 0 && { delay_seconds: delaySeconds })
            }))
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return response.json();
    }
}

// Usage
const publisher = new CloudflareQueuePublisher(
    process.env.CF_ACCOUNT_ID,
    process.env.CF_API_TOKEN
);

// Publish single message
await publisher.publish('my-queue', [
    { type: 'user.signup', userId: 'user_123' }
]);

// Batch publish
await publisher.publish('my-queue', [
    { orderId: '1' },
    { orderId: '2' },
    { orderId: '3' }
]);

// Delayed publish
await publisher.publish(
    'notifications',
    [{ type: 'reminder', userId: 'user_123' }],
    3600
);
```

### Go
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type QueuePublisher struct {
    AccountID string
    APIToken  string
    Client    *http.Client
}

type Message struct {
    Body         interface{} `json:"body"`
    DelaySeconds int         `json:"delay_seconds,omitempty"`
}

type PublishRequest struct {
    Messages []Message `json:"messages"`
}

func (p *QueuePublisher) Publish(queueName string, bodies []interface{}, delaySeconds int) error {
    url := fmt.Sprintf(
        "https://api.cloudflare.com/client/v4/accounts/%s/queues/%s/messages",
        p.AccountID, queueName,
    )

    messages := make([]Message, len(bodies))
    for i, body := range bodies {
        messages[i] = Message{
            Body:         body,
            DelaySeconds: delaySeconds,
        }
    }

    payload := PublishRequest{Messages: messages}
    jsonData, err := json.Marshal(payload)
    if err != nil {
        return err
    }

    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }

    req.Header.Set("Authorization", "Bearer "+p.APIToken)
    req.Header.Set("Content-Type", "application/json")

    resp, err := p.Client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
    }

    return nil
}

// Usage
func main() {
    publisher := &QueuePublisher{
        AccountID: "abc123",
        APIToken:  "your_api_token",
        Client:    &http.Client{},
    }

    // Single message
    err := publisher.Publish("my-queue", []interface{}{
        map[string]interface{}{
            "type":    "order-created",
            "orderId": "12345",
        },
    }, 0)

    // Batch publish
    err = publisher.Publish("my-queue", []interface{}{
        map[string]interface{}{"orderId": "1"},
        map[string]interface{}{"orderId": "2"},
        map[string]interface{}{"orderId": "3"},
    }, 0)
}
```

---

## Batch Publishing Best Practices

### 1. Batch Size Optimization
Minimize API calls by batching messages:

```python
# ❌ Bad: 100 API calls for 100 messages
for message in messages:
    publish_single(queue, message)

# ✅ Good: 1 API call for 100 messages (max batch size)
publish_batch(queue, messages[:100])
```

### 2. Handle Large Message Sets
Split large sets into batches of 100:

```python
def publish_large_batch(queue_name: str, messages: list):
    """Publish unlimited messages in batches of 100"""
    BATCH_SIZE = 100
    results = []

    for i in range(0, len(messages), BATCH_SIZE):
        batch = messages[i:i + BATCH_SIZE]
        result = publisher.publish(queue_name, batch)
        results.append(result)

    return results

# Publish 1000 messages (10 API calls)
publish_large_batch('my-queue', all_messages)
```

### 3. Retry Failed Batches
Implement exponential backoff for transient failures:

```python
import time

def publish_with_retry(queue_name: str, messages: list, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return publisher.publish(queue_name, messages)
        except requests.HTTPError as e:
            if e.response.status_code == 429:  # Rate limit
                wait = (2 ** attempt) * 1000  # Exponential backoff
                print(f"Rate limited, waiting {wait}ms...")
                time.sleep(wait / 1000)
            elif e.response.status_code >= 500:  # Server error
                time.sleep(2 ** attempt)
            else:
                raise  # Don't retry client errors (400-499)

    raise Exception(f"Failed after {max_retries} retries")
```

---

## Message Size Limits

**Maximum message size**: 128 KB per message

### Validate Message Size
```python
import json

def validate_message_size(message: dict) -> bool:
    """Check if message is under 128 KB"""
    message_bytes = json.dumps(message).encode('utf-8')
    size_kb = len(message_bytes) / 1024

    if size_kb > 128:
        print(f"Message too large: {size_kb:.2f} KB (max 128 KB)")
        return False

    return True

# Check before publishing
if validate_message_size(large_message):
    publisher.publish('my-queue', [large_message])
else:
    # Store large payload in R2, send reference
    url = upload_to_r2(large_message)
    publisher.publish('my-queue', [{'type': 'large-data', 'url': url}])
```

### Handle Large Payloads
For messages >128 KB, store in R2 and send reference:

```python
def publish_large_payload(queue_name: str, payload: dict):
    """Publish large payload via R2 storage"""
    size = len(json.dumps(payload).encode('utf-8')) / 1024

    if size <= 128:
        # Small enough - publish directly
        publisher.publish(queue_name, [payload])
    else:
        # Too large - store in R2
        object_key = f'payloads/{uuid.uuid4()}.json'
        r2_url = upload_to_r2(object_key, payload)

        # Publish reference
        publisher.publish(queue_name, [{
            'type': 'large-payload',
            'r2_key': object_key,
            'r2_url': r2_url,
            'size_kb': size
        }])

# Consumer retrieves from R2
async def process_message(message):
    if message.body.type == 'large-payload':
        payload = await fetch_from_r2(message.body.r2_key)
        await process_payload(payload)
    else:
        await process_payload(message.body)
```

---

## Error Handling

### Common Error Codes

| Status | Code | Error | Solution |
|--------|------|-------|----------|
| 400 | 10004 | Message too large (>128 KB) | Split message or use R2 storage |
| 400 | 10005 | Invalid message format | Check JSON structure |
| 400 | 10006 | Batch size exceeds 100 | Split into smaller batches |
| 401 | 10000 | Authentication failed | Check API token |
| 403 | 10001 | Insufficient permissions | Add `Queue: Edit` permission |
| 404 | 10002 | Queue not found | Verify queue name |
| 429 | 10003 | Rate limit exceeded | Implement backoff, reduce frequency |

### Error Response Example
```json
{
  "success": false,
  "errors": [
    {
      "code": 10004,
      "message": "Message body exceeds 128 KB limit",
      "details": {
        "message_index": 0,
        "size_kb": 156.8
      }
    }
  ]
}
```

### Comprehensive Error Handler
```python
def publish_with_error_handling(queue_name: str, messages: list):
    try:
        result = publisher.publish(queue_name, messages)
        print(f"Published {result['result']['success_count']} messages")
        return result
    except requests.HTTPError as e:
        if e.response.status_code == 400:
            # Client error - fix before retrying
            error_data = e.response.json()
            print(f"Bad request: {error_data['errors']}")
            # Handle specific errors
            for error in error_data['errors']:
                if error['code'] == 10004:
                    print("Message too large - consider R2 storage")
                elif error['code'] == 10006:
                    print("Batch too large - split into smaller batches")
        elif e.response.status_code == 429:
            # Rate limited - backoff and retry
            print("Rate limited - backing off...")
            time.sleep(60)
            return publish_with_error_handling(queue_name, messages)
        elif e.response.status_code >= 500:
            # Server error - retry
            print("Server error - retrying...")
            time.sleep(5)
            return publish_with_error_handling(queue_name, messages)
        raise
```

---

## Security Best Practices

### 1. Protect API Tokens
Never expose tokens in client-side code or version control:

```python
# ❌ Bad: Hardcoded token
api_token = "abc123_hardcoded_token"

# ✅ Good: Environment variable
api_token = os.environ['CLOUDFLARE_API_TOKEN']

# ✅ Good: Secrets manager
api_token = get_secret('cloudflare/api_token')
```

### 2. Least Privilege Tokens
Create dedicated tokens with minimal permissions:
- Permission: `Queue: Edit` only
- Scope: Specific queue (not account-wide)
- IP restrictions: Limit to known IPs if possible

### 3. Validate Input
Sanitize message payloads before publishing:

```python
def sanitize_and_publish(queue_name: str, user_input: dict):
    """Validate user input before publishing"""
    # Whitelist allowed fields
    allowed_fields = {'orderId', 'userId', 'amount'}
    sanitized = {
        k: v for k, v in user_input.items()
        if k in allowed_fields
    }

    # Validate data types
    if 'amount' in sanitized:
        sanitized['amount'] = float(sanitized['amount'])

    publisher.publish(queue_name, [sanitized])
```

### 4. Rate Limiting
Implement client-side rate limiting to avoid 429 errors:

```python
from time import time

class RateLimitedPublisher:
    def __init__(self, publisher, max_requests_per_minute=60):
        self.publisher = publisher
        self.max_requests = max_requests_per_minute
        self.requests = []

    def publish(self, queue_name, messages):
        now = time()

        # Remove requests older than 1 minute
        self.requests = [t for t in self.requests if now - t < 60]

        if len(self.requests) >= self.max_requests:
            wait = 60 - (now - self.requests[0])
            print(f"Rate limit approaching, waiting {wait:.1f}s...")
            time.sleep(wait)
            self.requests = []

        self.requests.append(now)
        return self.publisher.publish(queue_name, messages)
```

---

## Monitoring & Observability

### Track Publish Success Rate
```python
from prometheus_client import Counter

publish_success = Counter('queue_publish_success', 'Successful publishes')
publish_failure = Counter('queue_publish_failure', 'Failed publishes')

def publish_with_metrics(queue_name, messages):
    try:
        result = publisher.publish(queue_name, messages)
        publish_success.inc(result['result']['success_count'])
        return result
    except Exception as e:
        publish_failure.inc(len(messages))
        raise
```

### Log Message Metadata
```python
import logging

def publish_with_logging(queue_name, messages):
    logger.info(
        f"Publishing {len(messages)} messages to {queue_name}",
        extra={
            'queue': queue_name,
            'message_count': len(messages),
            'total_size_kb': sum(
                len(json.dumps(m).encode('utf-8')) for m in messages
            ) / 1024
        }
    )

    result = publisher.publish(queue_name, messages)

    logger.info(
        f"Published {result['result']['success_count']} messages",
        extra={
            'queue': queue_name,
            'message_ids': [m['id'] for m in result['result']['messages']]
        }
    )

    return result
```

---

## Migration from Worker Producers

**Before (Worker Producer)**:
```typescript
// Worker publishing to queue
export default {
    async fetch(request: Request, env: Env) {
        await env.MY_QUEUE.send({
            type: 'order-created',
            orderId: '12345'
        });

        return new Response('Queued');
    }
}
```

**After (HTTP Publishing)**:
```bash
# External service publishing via HTTP
curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/abc123/queues/my-queue/messages" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "body": {
        "type": "order-created",
        "orderId": "12345"
      }
    }]
  }'
```

**When to Migrate**:
- Publishing from non-Workers environments
- Need HTTP API integration
- External systems can't deploy Workers
- Want unified publishing interface

**When to Keep Workers**:
- Already using Workers for other logic
- Need lowest latency publishing
- Workers billing model is favorable

---

## Additional Resources

- **Official Docs**: https://developers.cloudflare.com/queues/configuration/http-publishing/
- **API Reference**: https://developers.cloudflare.com/api/operations/queue-messages-publish
- **Rate Limits**: https://developers.cloudflare.com/fundamentals/api/reference/limits/
- **Message Size**: https://developers.cloudflare.com/queues/platform/limits/

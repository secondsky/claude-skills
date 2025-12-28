# AWS Lambda to Cloudflare Workers Migration

Comprehensive guide for migrating AWS Lambda functions to Cloudflare Workers.

## Key Differences

| Aspect | AWS Lambda | Cloudflare Workers |
|--------|------------|-------------------|
| **Handler Signature** | `(event, context)` | `fetch(request, env, ctx)` |
| **Response Format** | `{ statusCode, body }` | `Response` object |
| **Triggers** | API Gateway, S3, etc. | HTTP, Cron, Queues |
| **Cold Starts** | 100-500ms | ~0ms |
| **Execution Time** | 15 minutes | 50ms CPU |
| **Memory** | Up to 10GB | 128MB |
| **Environment** | `process.env` | `env` parameter |

## Handler Migration

### Basic Lambda Handler

```typescript
// AWS Lambda
import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const body = JSON.parse(event.body || '{}');
  const userId = event.pathParameters?.id;
  const query = event.queryStringParameters?.search;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Success', userId, query }),
  };
};

// Cloudflare Workers
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const body = await request.json();
    const userId = url.pathname.split('/')[2]; // Extract from path
    const query = url.searchParams.get('search');

    return Response.json({ message: 'Success', userId, query });
  },
};
```

### Lambda Adapter Pattern

Create a compatibility layer for minimal code changes:

```typescript
// lambda-adapter.ts
interface LambdaEvent {
  body: string | null;
  headers: Record<string, string>;
  httpMethod: string;
  path: string;
  pathParameters: Record<string, string> | null;
  queryStringParameters: Record<string, string> | null;
  requestContext: {
    requestId: string;
  };
}

interface LambdaContext {
  awsRequestId: string;
  getRemainingTimeInMillis: () => number;
}

interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

type LambdaHandler = (event: LambdaEvent, context: LambdaContext) => Promise<LambdaResponse>;

export function adaptLambdaHandler(handler: LambdaHandler) {
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      // Convert Request to Lambda Event
      const url = new URL(request.url);

      const event: LambdaEvent = {
        body: request.method !== 'GET' ? await request.text() : null,
        headers: Object.fromEntries(request.headers),
        httpMethod: request.method,
        path: url.pathname,
        pathParameters: extractPathParams(url.pathname),
        queryStringParameters: Object.fromEntries(url.searchParams),
        requestContext: {
          requestId: crypto.randomUUID(),
        },
      };

      const context: LambdaContext = {
        awsRequestId: crypto.randomUUID(),
        getRemainingTimeInMillis: () => 50, // Workers limit
      };

      // Call Lambda handler
      const result = await handler(event, context);

      // Convert Lambda Response to Response
      const headers = new Headers(result.headers || {});

      if (result.isBase64Encoded) {
        const body = Uint8Array.from(atob(result.body), (c) => c.charCodeAt(0));
        return new Response(body, {
          status: result.statusCode,
          headers,
        });
      }

      return new Response(result.body, {
        status: result.statusCode,
        headers,
      });
    },
  };
}

function extractPathParams(path: string): Record<string, string> | null {
  // Implement based on your routing pattern
  const match = path.match(/\/api\/users\/(\w+)/);
  if (match) {
    return { id: match[1] };
  }
  return null;
}
```

### Using the Adapter

```typescript
// Existing Lambda handler (minimal changes)
const handler = async (event, context) => {
  const userId = event.pathParameters?.id;

  return {
    statusCode: 200,
    body: JSON.stringify({ userId }),
  };
};

// Export for Workers
import { adaptLambdaHandler } from './lambda-adapter';
export default adaptLambdaHandler(handler);
```

## Common Patterns

### API Gateway Authorizer → Workers Middleware

```typescript
// Lambda Authorizer
export const authorizer = async (event) => {
  const token = event.headers.Authorization;
  // Validate token...
  return {
    principalId: 'user123',
    policyDocument: {
      Statement: [{ Effect: 'Allow', Action: 'execute-api:Invoke', Resource: '*' }],
    },
  };
};

// Workers Middleware
async function authMiddleware(request: Request, env: Env): Promise<Response | null> {
  const token = request.headers.get('Authorization');

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token, env);
    // Attach to request context
    request.headers.set('X-User-Id', payload.userId);
    return null; // Continue to handler
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Run middleware
    const authResponse = await authMiddleware(request, env);
    if (authResponse) return authResponse;

    // Continue with handler
    return handleRequest(request, env);
  },
};
```

### S3 Trigger → R2 Event Notification

```typescript
// Lambda S3 Trigger
export const handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    await processFile(bucket, key);
  }
};

// Workers Queue Consumer (R2 events via Queues)
export default {
  async queue(batch: MessageBatch<R2EventMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { bucket, key, action } = message.body;

      if (action === 'PutObject') {
        await processFile(env.R2_BUCKET, key);
      }

      message.ack();
    }
  },
};

interface R2EventMessage {
  bucket: string;
  key: string;
  action: 'PutObject' | 'DeleteObject';
}
```

### DynamoDB → D1

```typescript
// Lambda with DynamoDB
import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();

export const handler = async (event) => {
  const result = await dynamo
    .get({
      TableName: 'users',
      Key: { id: event.pathParameters.id },
    })
    .promise();

  return { statusCode: 200, body: JSON.stringify(result.Item) };
};

// Workers with D1
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();

    if (!user) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json(user);
  },
};
```

### SQS → Cloudflare Queues

```typescript
// Lambda SQS Consumer
export const handler = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    await processMessage(message);
  }
};

// Workers Queue Consumer
export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processMessage(message.body);
        message.ack();
      } catch (error) {
        message.retry();
      }
    }
  },
};
```

## AWS SDK Migration

### Secrets Manager → Workers Secrets

```typescript
// Lambda with Secrets Manager
import { SecretsManager } from 'aws-sdk';

const sm = new SecretsManager();

export const handler = async () => {
  const secret = await sm
    .getSecretValue({ SecretId: 'my-api-key' })
    .promise();

  const apiKey = secret.SecretString;
  // Use apiKey...
};

// Workers with Secrets
interface Env {
  API_KEY: string; // Configured via wrangler secret
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const apiKey = env.API_KEY;
    // Use apiKey...
  },
};
```

### S3 → R2

```typescript
// Lambda with S3
import { S3 } from 'aws-sdk';

const s3 = new S3();

export const handler = async (event) => {
  const { key } = event.pathParameters;

  const object = await s3
    .getObject({
      Bucket: 'my-bucket',
      Key: key,
    })
    .promise();

  return {
    statusCode: 200,
    headers: { 'Content-Type': object.ContentType },
    body: object.Body.toString('base64'),
    isBase64Encoded: true,
  };
};

// Workers with R2
interface Env {
  BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    const object = await env.BUCKET.get(key);

    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');

    return new Response(object.body, { headers });
  },
};
```

## Execution Model Differences

### Background Processing

```typescript
// Lambda (15 min execution)
export const handler = async (event) => {
  // Long running task
  for (const item of event.items) {
    await processItem(item); // Can take minutes
  }
  return { statusCode: 200 };
};

// Workers (background with waitUntil)
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const body = await request.json();

    // Return immediately
    const response = Response.json({ status: 'processing' }, { status: 202 });

    // Continue processing after response
    ctx.waitUntil(
      (async () => {
        for (const item of body.items) {
          await processItem(item);
        }
      })()
    );

    return response;
  },
};
```

### Long-Running Tasks → Durable Objects

```typescript
// Lambda Step Functions → Durable Objects Workflow
export class ProcessingWorkflow implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const { items } = await request.json();

    // Store items for processing
    await this.state.storage.put('items', items);
    await this.state.storage.put('processed', 0);

    // Start processing
    await this.processNext();

    return Response.json({ status: 'started' });
  }

  async processNext(): Promise<void> {
    const items = await this.state.storage.get<any[]>('items');
    const processed = await this.state.storage.get<number>('processed') || 0;

    if (processed >= items!.length) {
      return; // Done
    }

    // Process one item
    await processItem(items![processed]);

    // Update progress
    await this.state.storage.put('processed', processed + 1);

    // Schedule next (use alarm for reliability)
    await this.state.storage.setAlarm(Date.now() + 100);
  }

  async alarm(): Promise<void> {
    await this.processNext();
  }
}
```

## Migration Checklist

1. [ ] Replace `event`/`context` with `request`/`env`/`ctx`
2. [ ] Convert response format to `Response` object
3. [ ] Replace `process.env` with `env` parameter
4. [ ] Replace AWS SDK calls with Workers equivalents
5. [ ] Replace DynamoDB with D1 or KV
6. [ ] Replace S3 with R2
7. [ ] Replace SQS with Queues
8. [ ] Convert long-running tasks to waitUntil or DO
9. [ ] Update tests for Workers environment
10. [ ] Configure wrangler.jsonc with bindings

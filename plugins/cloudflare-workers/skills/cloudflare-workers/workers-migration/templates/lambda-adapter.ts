/**
 * AWS Lambda to Cloudflare Workers Adapter
 *
 * Enables minimal code changes when migrating Lambda handlers.
 * Converts Lambda event/context to Workers Request/env.
 *
 * Usage:
 * 1. Keep existing Lambda handler code
 * 2. Import and wrap with adaptLambdaHandler
 * 3. Export as Workers default
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface LambdaEvent {
  body: string | null;
  headers: Record<string, string | undefined>;
  httpMethod: string;
  path: string;
  pathParameters: Record<string, string> | null;
  queryStringParameters: Record<string, string> | null;
  requestContext: {
    requestId: string;
    stage: string;
    identity: {
      sourceIp: string;
      userAgent: string | null;
    };
  };
  isBase64Encoded: boolean;
}

export interface LambdaContext {
  awsRequestId: string;
  functionName: string;
  memoryLimitInMB: string;
  getRemainingTimeInMillis: () => number;
  callbackWaitsForEmptyEventLoop: boolean;
}

export interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  multiValueHeaders?: Record<string, string[]>;
  body?: string;
  isBase64Encoded?: boolean;
}

export type LambdaHandler<TEnv = unknown> = (
  event: LambdaEvent,
  context: LambdaContext,
  env?: TEnv
) => Promise<LambdaResponse>;

// ============================================
// PATH PARAMETER EXTRACTION
// ============================================

interface RoutePattern {
  pattern: RegExp;
  paramNames: string[];
}

const routePatterns: RoutePattern[] = [];

/**
 * Register a route pattern for path parameter extraction
 * @example registerRoute('/users/:id')
 * @example registerRoute('/posts/:postId/comments/:commentId')
 */
export function registerRoute(pattern: string): void {
  const paramNames: string[] = [];
  const regexPattern = pattern.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  routePatterns.push({
    pattern: new RegExp(`^${regexPattern}$`),
    paramNames,
  });
}

function extractPathParams(path: string): Record<string, string> | null {
  for (const { pattern, paramNames } of routePatterns) {
    const match = path.match(pattern);
    if (match) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return params;
    }
  }
  return null;
}

// ============================================
// REQUEST CONVERSION
// ============================================

async function requestToLambdaEvent(request: Request): Promise<LambdaEvent> {
  const url = new URL(request.url);

  // Parse body
  let body: string | null = null;
  let isBase64Encoded = false;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';

    if (
      contentType.includes('application/json') ||
      contentType.includes('text/') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      body = await request.text();
    } else {
      // Binary data - base64 encode
      const buffer = await request.arrayBuffer();
      body = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      isBase64Encoded = true;
    }
  }

  // Convert headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  // Parse query string
  const queryStringParameters: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryStringParameters[key] = value;
  });

  // Extract path parameters
  const pathParameters = extractPathParams(url.pathname);

  return {
    body,
    headers,
    httpMethod: request.method,
    path: url.pathname,
    pathParameters,
    queryStringParameters:
      Object.keys(queryStringParameters).length > 0 ? queryStringParameters : null,
    requestContext: {
      requestId: crypto.randomUUID(),
      stage: 'prod',
      identity: {
        sourceIp: request.headers.get('cf-connecting-ip') || '0.0.0.0',
        userAgent: request.headers.get('user-agent'),
      },
    },
    isBase64Encoded,
  };
}

function createLambdaContext(): LambdaContext {
  const startTime = Date.now();
  const timeout = 50; // Workers limit in ms

  return {
    awsRequestId: crypto.randomUUID(),
    functionName: 'cloudflare-worker',
    memoryLimitInMB: '128',
    getRemainingTimeInMillis: () => Math.max(0, timeout - (Date.now() - startTime)),
    callbackWaitsForEmptyEventLoop: true,
  };
}

// ============================================
// RESPONSE CONVERSION
// ============================================

function lambdaResponseToResponse(result: LambdaResponse): Response {
  const headers = new Headers();

  // Add regular headers
  if (result.headers) {
    Object.entries(result.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  // Add multi-value headers
  if (result.multiValueHeaders) {
    Object.entries(result.multiValueHeaders).forEach(([key, values]) => {
      values.forEach((value) => {
        headers.append(key, value);
      });
    });
  }

  // Handle body
  let body: BodyInit | null = null;

  if (result.body) {
    if (result.isBase64Encoded) {
      // Decode base64 to binary
      const binaryString = atob(result.body);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      body = bytes;
    } else {
      body = result.body;
    }
  }

  return new Response(body, {
    status: result.statusCode,
    headers,
  });
}

// ============================================
// MAIN ADAPTER
// ============================================

/**
 * Adapt a Lambda handler to work in Cloudflare Workers
 *
 * @example
 * // Existing Lambda handler
 * const handler = async (event, context) => {
 *   return { statusCode: 200, body: JSON.stringify({ hello: 'world' }) };
 * };
 *
 * // Export for Workers
 * export default adaptLambdaHandler(handler);
 */
export function adaptLambdaHandler<TEnv = unknown>(
  handler: LambdaHandler<TEnv>,
  options?: {
    routes?: string[];
  }
) {
  // Register routes for path parameter extraction
  if (options?.routes) {
    options.routes.forEach(registerRoute);
  }

  return {
    async fetch(request: Request, env: TEnv): Promise<Response> {
      try {
        // Convert Request to Lambda Event
        const event = await requestToLambdaEvent(request);
        const context = createLambdaContext();

        // Call Lambda handler
        const result = await handler(event, context, env);

        // Convert Lambda Response to Response
        return lambdaResponseToResponse(result);
      } catch (error) {
        console.error('Lambda adapter error:', error);

        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    },
  };
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// existing-lambda.ts (minimal changes)
import { LambdaEvent, LambdaContext } from './lambda-adapter';

export const handler = async (event: LambdaEvent, context: LambdaContext) => {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'User ID required' }),
    };
  }

  // Existing logic...
  const user = await getUser(userId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  };
};

// index.ts (Workers entry point)
import { adaptLambdaHandler } from './lambda-adapter';
import { handler } from './existing-lambda';

export default adaptLambdaHandler(handler, {
  routes: [
    '/users/:id',
    '/posts/:postId/comments/:commentId',
  ],
});
*/

// ============================================
// DynamoDB COMPATIBILITY LAYER
// ============================================

export interface D1LikeDynamoDB {
  get(params: { TableName: string; Key: Record<string, any> }): Promise<{ Item?: any }>;
  put(params: { TableName: string; Item: Record<string, any> }): Promise<void>;
  query(params: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, any>;
  }): Promise<{ Items: any[] }>;
  delete(params: { TableName: string; Key: Record<string, any> }): Promise<void>;
}

/**
 * Create a DynamoDB-like interface backed by D1
 *
 * Note: This is a simplified adapter. Production use may need
 * more sophisticated mapping depending on your DynamoDB usage.
 */
export function createDynamoDBAdapter(db: D1Database): D1LikeDynamoDB {
  return {
    async get({ TableName, Key }) {
      const keyName = Object.keys(Key)[0];
      const keyValue = Key[keyName];

      const result = await db
        .prepare(`SELECT * FROM ${TableName} WHERE ${keyName} = ?`)
        .bind(keyValue)
        .first();

      return { Item: result || undefined };
    },

    async put({ TableName, Item }) {
      const columns = Object.keys(Item);
      const values = Object.values(Item);
      const placeholders = columns.map(() => '?').join(', ');

      await db
        .prepare(
          `INSERT OR REPLACE INTO ${TableName} (${columns.join(', ')}) VALUES (${placeholders})`
        )
        .bind(...values)
        .run();
    },

    async query({ TableName, KeyConditionExpression, ExpressionAttributeValues }) {
      // Simplified: assumes format "pk = :pk"
      const match = KeyConditionExpression.match(/(\w+)\s*=\s*:(\w+)/);
      if (!match) {
        throw new Error('Unsupported KeyConditionExpression');
      }

      const [, column, placeholder] = match;
      const value = ExpressionAttributeValues[`:${placeholder}`];

      const { results } = await db
        .prepare(`SELECT * FROM ${TableName} WHERE ${column} = ?`)
        .bind(value)
        .all();

      return { Items: results };
    },

    async delete({ TableName, Key }) {
      const keyName = Object.keys(Key)[0];
      const keyValue = Key[keyName];

      await db
        .prepare(`DELETE FROM ${TableName} WHERE ${keyName} = ?`)
        .bind(keyValue)
        .run();
    },
  };
}

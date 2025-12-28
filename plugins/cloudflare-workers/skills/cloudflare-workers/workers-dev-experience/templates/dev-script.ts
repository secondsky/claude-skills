/**
 * Development Utilities for Cloudflare Workers
 *
 * Features:
 * - Request/response inspection
 * - Development-only middleware
 * - Mock data generation
 * - Performance measurement
 * - Error simulation
 *
 * Usage:
 * 1. Import needed utilities in development
 * 2. Wrap handlers with dev middleware
 * 3. Use inspectors for debugging
 */

// ============================================
// TYPES
// ============================================

interface Env {
  ENVIRONMENT: string;
  DEBUG?: string;
  [key: string]: unknown;
}

interface TimingEntry {
  name: string;
  duration: number;
  timestamp: number;
}

interface RequestLog {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  cf?: IncomingRequestCfProperties;
  timestamp: number;
}

interface ResponseLog {
  id: string;
  status: number;
  headers: Record<string, string>;
  duration: number;
  timestamp: number;
}

// ============================================
// ENVIRONMENT DETECTION
// ============================================

export function isDevelopment(env: Env): boolean {
  return (
    env.ENVIRONMENT === 'development' ||
    env.DEBUG === 'true' ||
    env.ENVIRONMENT === 'local'
  );
}

export function isProduction(env: Env): boolean {
  return env.ENVIRONMENT === 'production';
}

// ============================================
// REQUEST/RESPONSE INSPECTION
// ============================================

export function inspectRequest(request: Request): RequestLog {
  return {
    id: crypto.randomUUID(),
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    cf: request.cf,
    timestamp: Date.now(),
  };
}

export function inspectResponse(
  response: Response,
  requestId: string,
  startTime: number
): ResponseLog {
  return {
    id: requestId,
    status: response.status,
    headers: Object.fromEntries(response.headers),
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

// ============================================
// DEVELOPMENT LOGGER
// ============================================

export class DevLogger {
  private enabled: boolean;
  private prefix: string;

  constructor(env: Env, prefix = '[DEV]') {
    this.enabled = isDevelopment(env);
    this.prefix = prefix;
  }

  log(...args: unknown[]): void {
    if (this.enabled) {
      console.log(this.prefix, ...args);
    }
  }

  debug(...args: unknown[]): void {
    if (this.enabled) {
      console.log(`${this.prefix} [DEBUG]`, ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.enabled) {
      console.log(`${this.prefix} [INFO]`, ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.enabled) {
      console.warn(`${this.prefix} [WARN]`, ...args);
    }
  }

  error(...args: unknown[]): void {
    // Always log errors
    console.error(`${this.prefix} [ERROR]`, ...args);
  }

  request(req: Request): void {
    if (this.enabled) {
      const info = inspectRequest(req);
      console.log(`${this.prefix} Request:`, JSON.stringify(info, null, 2));
    }
  }

  response(res: Response, requestId: string, startTime: number): void {
    if (this.enabled) {
      const info = inspectResponse(res, requestId, startTime);
      console.log(`${this.prefix} Response:`, JSON.stringify(info, null, 2));
    }
  }
}

// ============================================
// PERFORMANCE TIMING
// ============================================

export class PerformanceTimer {
  private entries: TimingEntry[] = [];
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      throw new Error(`Mark "${startMark}" not found`);
    }

    const duration = Date.now() - start;
    this.entries.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    return duration;
  }

  async time<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.entries.push({
        name,
        duration: Date.now() - start,
        timestamp: Date.now(),
      });
    }
  }

  getEntries(): TimingEntry[] {
    return [...this.entries];
  }

  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const entry of this.entries) {
      summary[entry.name] = entry.duration;
    }
    return summary;
  }

  toHeader(): string {
    return this.entries
      .map((e) => `${e.name};dur=${e.duration}`)
      .join(', ');
  }

  clear(): void {
    this.entries = [];
    this.marks.clear();
  }
}

// ============================================
// DEVELOPMENT MIDDLEWARE
// ============================================

type Handler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

export function withDevMiddleware(handler: Handler): Handler {
  return async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    if (!isDevelopment(env)) {
      return handler(request, env, ctx);
    }

    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const timer = new PerformanceTimer();
    const logger = new DevLogger(env);

    timer.mark('start');
    logger.request(request);

    try {
      const response = await timer.time('handler', () =>
        handler(request, env, ctx)
      );

      // Add debug headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Request-Id', requestId);
      newResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      newResponse.headers.set('Server-Timing', timer.toHeader());

      logger.response(newResponse, requestId, startTime);
      return newResponse;
    } catch (error) {
      logger.error('Handler error:', error);
      throw error;
    }
  };
}

// ============================================
// CORS MIDDLEWARE (Development)
// ============================================

export function withDevCors(handler: Handler): Handler {
  return async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(request, env, ctx);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    return newResponse;
  };
}

// ============================================
// MOCK DATA GENERATION
// ============================================

export const MockData = {
  user(): { id: string; name: string; email: string; createdAt: string } {
    const id = crypto.randomUUID();
    return {
      id,
      name: `User ${id.slice(0, 4)}`,
      email: `user-${id.slice(0, 8)}@example.com`,
      createdAt: new Date().toISOString(),
    };
  },

  users(count: number): Array<ReturnType<typeof MockData.user>> {
    return Array.from({ length: count }, () => this.user());
  },

  post(): { id: string; title: string; content: string; authorId: string } {
    const id = crypto.randomUUID();
    return {
      id,
      title: `Post ${id.slice(0, 4)}`,
      content: `This is the content of post ${id.slice(0, 8)}`,
      authorId: crypto.randomUUID(),
    };
  },

  randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  },

  randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomBoolean(): boolean {
    return Math.random() > 0.5;
  },

  randomDate(start: Date, end: Date): Date {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  },
};

// ============================================
// ERROR SIMULATION (Testing)
// ============================================

export function withErrorSimulation(handler: Handler, errorRate = 0.1): Handler {
  return async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    if (!isDevelopment(env)) {
      return handler(request, env, ctx);
    }

    // Simulate random errors
    if (Math.random() < errorRate) {
      const errors = [
        { status: 500, message: 'Simulated server error' },
        { status: 503, message: 'Simulated service unavailable' },
        { status: 429, message: 'Simulated rate limit' },
        { status: 408, message: 'Simulated timeout' },
      ];
      const error = errors[Math.floor(Math.random() * errors.length)];
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(request, env, ctx);
  };
}

// ============================================
// LATENCY SIMULATION (Testing)
// ============================================

export function withLatencySimulation(
  handler: Handler,
  minMs = 100,
  maxMs = 500
): Handler {
  return async (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    if (!isDevelopment(env)) {
      return handler(request, env, ctx);
    }

    const delay = MockData.randomNumber(minMs, maxMs);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return handler(request, env, ctx);
  };
}

// ============================================
// REQUEST BODY INSPECTION
// ============================================

export async function inspectBody(request: Request): Promise<{
  text?: string;
  json?: unknown;
  formData?: Record<string, string>;
  size: number;
}> {
  const clone = request.clone();
  const contentType = request.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    try {
      const text = await clone.text();
      return {
        text,
        json: JSON.parse(text),
        size: text.length,
      };
    } catch {
      return { size: 0 };
    }
  }

  if (contentType.includes('form')) {
    try {
      const formData = await clone.formData();
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
      return { formData: data, size: JSON.stringify(data).length };
    } catch {
      return { size: 0 };
    }
  }

  const text = await clone.text();
  return { text, size: text.length };
}

// ============================================
// DEBUG ENDPOINTS
// ============================================

export function createDebugEndpoints(env: Env): Record<string, () => Response> {
  if (!isDevelopment(env)) {
    return {};
  }

  return {
    '/__debug/env': () =>
      Response.json({
        environment: env.ENVIRONMENT,
        debug: env.DEBUG,
        bindings: Object.keys(env).filter(
          (k) => !['ENVIRONMENT', 'DEBUG'].includes(k)
        ),
      }),

    '/__debug/headers': () =>
      Response.json({
        note: 'Send a request to see headers',
        example: 'curl -H "X-Test: value" /__debug/echo',
      }),

    '/__debug/time': () =>
      Response.json({
        timestamp: Date.now(),
        iso: new Date().toISOString(),
        timezone: 'UTC',
      }),

    '/__debug/random': () =>
      Response.json({
        uuid: crypto.randomUUID(),
        string: MockData.randomString(32),
        number: MockData.randomNumber(1, 1000),
        boolean: MockData.randomBoolean(),
      }),
  };
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import {
  withDevMiddleware,
  withDevCors,
  DevLogger,
  PerformanceTimer,
  MockData,
  createDebugEndpoints,
} from './dev-script';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Debug endpoints (development only)
    const debugEndpoints = createDebugEndpoints(env);
    const url = new URL(request.url);
    const debugHandler = debugEndpoints[url.pathname];
    if (debugHandler) {
      return debugHandler();
    }

    // Your main handler
    return handleRequest(request, env, ctx);
  },
};

// Wrap with middleware
const handler = withDevCors(withDevMiddleware(handleRequest));
*/

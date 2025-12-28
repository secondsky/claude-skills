/**
 * Performance Monitoring Middleware for Cloudflare Workers
 *
 * Features:
 * - Request timing and profiling
 * - Server-Timing headers
 * - Cold start detection
 * - Slow request logging
 * - Memory monitoring
 * - Performance analytics
 *
 * Usage:
 * 1. Import middleware functions
 * 2. Wrap handlers with performance tracking
 * 3. Monitor via headers or analytics
 */

// ============================================
// TYPES
// ============================================

interface Env {
  ENVIRONMENT: string;
  ANALYTICS?: AnalyticsEngineDataset;
}

interface TimingEntry {
  name: string;
  duration: number;
  description?: string;
}

interface PerformanceContext {
  requestId: string;
  startTime: number;
  timings: TimingEntry[];
  isCold: boolean;
  marks: Map<string, number>;
}

interface PerformanceMetrics {
  requestId: string;
  totalDuration: number;
  isCold: boolean;
  timings: Record<string, number>;
  url: string;
  method: string;
  status: number;
  colo?: string;
}

type Handler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response>;

// ============================================
// COLD START DETECTION
// ============================================

let isWarm = false;
let isolateStartTime: number | undefined;

function detectColdStart(): boolean {
  if (!isWarm) {
    isWarm = true;
    isolateStartTime = Date.now();
    return true;
  }
  return false;
}

// ============================================
// PERFORMANCE CONTEXT
// ============================================

function createPerformanceContext(): PerformanceContext {
  return {
    requestId: crypto.randomUUID(),
    startTime: performance.now(),
    timings: [],
    isCold: detectColdStart(),
    marks: new Map(),
  };
}

// ============================================
// TIMING HELPERS
// ============================================

function mark(ctx: PerformanceContext, name: string): void {
  ctx.marks.set(name, performance.now());
}

function measure(
  ctx: PerformanceContext,
  name: string,
  startMark: string,
  description?: string
): number {
  const start = ctx.marks.get(startMark);
  if (!start) {
    console.warn(`Mark "${startMark}" not found`);
    return 0;
  }

  const duration = performance.now() - start;
  ctx.timings.push({ name, duration, description });
  return duration;
}

async function timeAsync<T>(
  ctx: PerformanceContext,
  name: string,
  fn: () => Promise<T>,
  description?: string
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    ctx.timings.push({ name, duration, description });
  }
}

function timeSync<T>(
  ctx: PerformanceContext,
  name: string,
  fn: () => T,
  description?: string
): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    ctx.timings.push({ name, duration, description });
  }
}

// ============================================
// SERVER-TIMING HEADER
// ============================================

function buildServerTimingHeader(ctx: PerformanceContext): string {
  const entries: string[] = [];

  // Add total time
  entries.push(`total;dur=${(performance.now() - ctx.startTime).toFixed(2)}`);

  // Add cold start indicator
  if (ctx.isCold) {
    entries.push('cold;desc="Cold Start"');
  }

  // Add individual timings
  for (const timing of ctx.timings) {
    let entry = `${timing.name};dur=${timing.duration.toFixed(2)}`;
    if (timing.description) {
      entry += `;desc="${timing.description}"`;
    }
    entries.push(entry);
  }

  return entries.join(', ');
}

// ============================================
// PERFORMANCE MIDDLEWARE
// ============================================

export function withPerformanceTracking(handler: Handler): Handler {
  return async (request, env, ctx) => {
    const perfCtx = createPerformanceContext();

    mark(perfCtx, 'start');

    try {
      const response = await timeAsync(
        perfCtx,
        'handler',
        () => handler(request, env, ctx),
        'Request handler'
      );

      // Add performance headers
      const newResponse = new Response(response.body, response);

      newResponse.headers.set('X-Request-Id', perfCtx.requestId);
      newResponse.headers.set(
        'X-Response-Time',
        `${(performance.now() - perfCtx.startTime).toFixed(2)}ms`
      );
      newResponse.headers.set('Server-Timing', buildServerTimingHeader(perfCtx));

      if (perfCtx.isCold) {
        newResponse.headers.set('X-Cold-Start', 'true');
      }

      // Log metrics
      logMetrics(perfCtx, request, newResponse, env);

      return newResponse;
    } catch (error) {
      // Log error with timing
      console.error('Request failed:', {
        requestId: perfCtx.requestId,
        duration: performance.now() - perfCtx.startTime,
        error: (error as Error).message,
      });
      throw error;
    }
  };
}

// ============================================
// SLOW REQUEST DETECTION
// ============================================

const SLOW_THRESHOLD_MS = 100;

export function withSlowRequestLogging(
  handler: Handler,
  threshold = SLOW_THRESHOLD_MS
): Handler {
  return async (request, env, ctx) => {
    const start = performance.now();

    try {
      return await handler(request, env, ctx);
    } finally {
      const duration = performance.now() - start;

      if (duration > threshold) {
        console.warn('Slow request detected:', {
          url: request.url,
          method: request.method,
          duration: `${duration.toFixed(2)}ms`,
          threshold: `${threshold}ms`,
          cf: request.cf,
        });
      }
    }
  };
}

// ============================================
// METRICS LOGGING
// ============================================

function logMetrics(
  ctx: PerformanceContext,
  request: Request,
  response: Response,
  env: Env
): void {
  const metrics: PerformanceMetrics = {
    requestId: ctx.requestId,
    totalDuration: performance.now() - ctx.startTime,
    isCold: ctx.isCold,
    timings: Object.fromEntries(ctx.timings.map((t) => [t.name, t.duration])),
    url: new URL(request.url).pathname,
    method: request.method,
    status: response.status,
    colo: (request.cf as { colo?: string })?.colo,
  };

  // Console logging (appears in wrangler tail)
  if (env.ENVIRONMENT === 'development' || ctx.isCold || metrics.totalDuration > 50) {
    console.log('Performance metrics:', JSON.stringify(metrics));
  }

  // Analytics Engine (if available)
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: [
        metrics.url,
        metrics.method,
        ctx.isCold ? 'cold' : 'warm',
        metrics.colo || 'unknown',
      ],
      doubles: [metrics.totalDuration, metrics.status],
      indexes: [metrics.requestId],
    });
  }
}

// ============================================
// PROFILER CLASS
// ============================================

export class RequestProfiler {
  private ctx: PerformanceContext;

  constructor() {
    this.ctx = createPerformanceContext();
  }

  mark(name: string): void {
    mark(this.ctx, name);
  }

  measure(name: string, startMark: string, description?: string): number {
    return measure(this.ctx, name, startMark, description);
  }

  async time<T>(name: string, fn: () => Promise<T>, description?: string): Promise<T> {
    return timeAsync(this.ctx, name, fn, description);
  }

  timeSync<T>(name: string, fn: () => T, description?: string): T {
    return timeSync(this.ctx, name, fn, description);
  }

  getTimings(): TimingEntry[] {
    return [...this.ctx.timings];
  }

  getTotalDuration(): number {
    return performance.now() - this.ctx.startTime;
  }

  isColdStart(): boolean {
    return this.ctx.isCold;
  }

  getRequestId(): string {
    return this.ctx.requestId;
  }

  getServerTimingHeader(): string {
    return buildServerTimingHeader(this.ctx);
  }

  getSummary(): Record<string, unknown> {
    return {
      requestId: this.ctx.requestId,
      totalDuration: this.getTotalDuration(),
      isCold: this.ctx.isCold,
      timings: Object.fromEntries(this.ctx.timings.map((t) => [t.name, t.duration])),
    };
  }
}

// ============================================
// CPU GUARD
// ============================================

const CPU_LIMIT_MS = 30; // Paid plan limit

export function withCPUGuard(handler: Handler, limit = CPU_LIMIT_MS): Handler {
  return async (request, env, ctx) => {
    const start = performance.now();
    let checkCount = 0;

    // Periodic CPU check
    const checkCPU = () => {
      checkCount++;
      const elapsed = performance.now() - start;
      if (elapsed > limit * 0.8) {
        console.warn('Approaching CPU limit:', {
          elapsed: `${elapsed.toFixed(2)}ms`,
          limit: `${limit}ms`,
          checks: checkCount,
        });
      }
    };

    // Check every 100 iterations or time-based
    const interval = setInterval(checkCPU, 10);

    try {
      return await handler(request, env, ctx);
    } finally {
      clearInterval(interval);
      const total = performance.now() - start;
      if (total > limit) {
        console.error('CPU limit exceeded:', {
          duration: `${total.toFixed(2)}ms`,
          limit: `${limit}ms`,
        });
      }
    }
  };
}

// ============================================
// COMBINED MIDDLEWARE
// ============================================

export function withFullPerformanceMonitoring(handler: Handler): Handler {
  // Stack middlewares
  return withCPUGuard(withSlowRequestLogging(withPerformanceTracking(handler)));
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import {
  withFullPerformanceMonitoring,
  RequestProfiler,
} from './performance-middleware';

// Option 1: Use middleware wrapper
export default {
  fetch: withFullPerformanceMonitoring(async (request, env, ctx) => {
    // Your handler code
    return new Response('OK');
  }),
};

// Option 2: Use profiler for granular timing
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const profiler = new RequestProfiler();

    profiler.mark('start');

    const user = await profiler.time('fetchUser', async () => {
      return await db.getUser(userId);
    });

    profiler.mark('postFetch');

    const data = profiler.timeSync('transform', () => {
      return transformData(user);
    });

    profiler.measure('afterTransform', 'postFetch');

    const response = Response.json(data);
    response.headers.set('Server-Timing', profiler.getServerTimingHeader());

    return response;
  },
};
*/

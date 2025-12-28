/**
 * Analytics Engine Integration for Cloudflare Workers
 *
 * Features:
 * - Request metrics tracking
 * - Business metrics collection
 * - Performance timing breakdown
 * - Error rate monitoring
 *
 * Usage:
 * 1. Add analytics_engine_datasets to wrangler.jsonc
 * 2. Copy this file to src/lib/analytics.ts
 * 3. Use MetricsCollector in your handlers
 */

// Env type - extend with your own bindings
interface AnalyticsEnv {
  ANALYTICS: AnalyticsEngineDataset;
}

/**
 * Data point schema documentation
 *
 * blobs (strings, up to 20):
 *   [0] method      - HTTP method
 *   [1] path        - URL pathname
 *   [2] status      - Response status code as string
 *   [3] country     - Request country
 *   [4] colo        - Cloudflare colo
 *   [5] error       - Error message if any
 *   [6] cacheStatus - HIT/MISS/BYPASS
 *   [7] custom1     - Custom string field
 *   [8] custom2     - Custom string field
 *   [9] custom3     - Custom string field
 *
 * doubles (numbers, up to 20):
 *   [0] duration    - Total request duration (ms)
 *   [1] dbTime      - Database query time (ms)
 *   [2] apiTime     - External API time (ms)
 *   [3] count       - Always 1, for counting
 *   [4] errorCount  - 1 if error, 0 otherwise
 *   [5] responseSize- Response body size (bytes)
 *   [6] custom1     - Custom numeric field
 *   [7] custom2     - Custom numeric field
 *   [8] custom3     - Custom numeric field
 *
 * indexes (up to 1):
 *   [0] primary index - Most common query dimension (e.g., endpoint category)
 */

export interface MetricTags {
  method?: string;
  path?: string;
  status?: string;
  country?: string;
  colo?: string;
  error?: string;
  cacheStatus?: string;
  custom1?: string;
  custom2?: string;
  custom3?: string;
}

export interface MetricValues {
  duration?: number;
  dbTime?: number;
  apiTime?: number;
  count?: number;
  errorCount?: number;
  responseSize?: number;
  custom1?: number;
  custom2?: number;
  custom3?: number;
}

/**
 * Metrics collector for tracking request and business metrics
 */
export class MetricsCollector {
  private startTime: number;
  private tags: MetricTags = {};
  private values: MetricValues = { count: 1 };
  private timers: Map<string, number> = new Map();

  constructor(private env: AnalyticsEnv) {
    this.startTime = Date.now();
  }

  /**
   * Set string tags (categorical data)
   */
  setTags(tags: Partial<MetricTags>): void {
    this.tags = { ...this.tags, ...tags };
  }

  /**
   * Set numeric values
   */
  setValues(values: Partial<MetricValues>): void {
    this.values = { ...this.values, ...values };
  }

  /**
   * Start a named timer
   */
  startTimer(name: 'db' | 'api' | 'custom'): void {
    this.timers.set(name, Date.now());
  }

  /**
   * Stop a named timer and record the duration
   */
  stopTimer(name: 'db' | 'api' | 'custom'): number {
    const start = this.timers.get(name);
    if (!start) return 0;

    const duration = Date.now() - start;
    this.timers.delete(name);

    switch (name) {
      case 'db':
        this.values.dbTime = (this.values.dbTime || 0) + duration;
        break;
      case 'api':
        this.values.apiTime = (this.values.apiTime || 0) + duration;
        break;
    }

    return duration;
  }

  /**
   * Record from request object
   */
  recordRequest(request: Request): void {
    const url = new URL(request.url);
    const cf = request.cf as { country?: string; colo?: string } | undefined;

    this.setTags({
      method: request.method,
      path: url.pathname,
      country: cf?.country || 'unknown',
      colo: cf?.colo || 'unknown',
    });
  }

  /**
   * Record from response object
   */
  recordResponse(response: Response, body?: ArrayBuffer | string): void {
    this.setTags({
      status: String(response.status),
    });

    if (response.status >= 400) {
      this.values.errorCount = 1;
    }

    if (body) {
      const size = typeof body === 'string' ? body.length : body.byteLength;
      this.values.responseSize = size;
    }
  }

  /**
   * Record an error
   */
  recordError(error: Error): void {
    this.setTags({
      status: '500',
      error: error.name,
    });
    this.values.errorCount = 1;
  }

  /**
   * Flush metrics to Analytics Engine
   * Call this in ctx.waitUntil() to not block the response
   */
  flush(): void {
    // Calculate total duration
    this.values.duration = Date.now() - this.startTime;

    // Build data point
    const blobs = [
      this.tags.method || '',
      this.tags.path || '',
      this.tags.status || '',
      this.tags.country || '',
      this.tags.colo || '',
      this.tags.error || '',
      this.tags.cacheStatus || '',
      this.tags.custom1 || '',
      this.tags.custom2 || '',
      this.tags.custom3 || '',
    ];

    const doubles = [
      this.values.duration || 0,
      this.values.dbTime || 0,
      this.values.apiTime || 0,
      this.values.count || 1,
      this.values.errorCount || 0,
      this.values.responseSize || 0,
      this.values.custom1 || 0,
      this.values.custom2 || 0,
      this.values.custom3 || 0,
    ];

    // Primary index: endpoint category or error status
    const index = this.values.errorCount ? 'error' : this.tags.path?.split('/')[1] || 'root';

    this.env.ANALYTICS.writeDataPoint({
      blobs,
      doubles,
      indexes: [index],
    });
  }
}

/**
 * Business metrics writer for specific events
 */
export class BusinessMetrics {
  constructor(private env: AnalyticsEnv) {}

  /**
   * Track a user action
   */
  trackAction(action: string, userId: string, data?: Record<string, string | number>): void {
    this.env.ANALYTICS.writeDataPoint({
      blobs: [
        action,
        userId,
        data?.category?.toString() || '',
        data?.label?.toString() || '',
      ],
      doubles: [data?.value as number || 1, 1], // value, count
      indexes: ['action'],
    });
  }

  /**
   * Track a purchase/transaction
   */
  trackPurchase(
    orderId: string,
    total: number,
    currency: string,
    items: number,
    userId?: string
  ): void {
    this.env.ANALYTICS.writeDataPoint({
      blobs: ['purchase', orderId, currency, userId || 'anonymous'],
      doubles: [total, items, 1], // total, items, count
      indexes: ['purchase'],
    });
  }

  /**
   * Track API usage for billing/quotas
   */
  trackApiUsage(
    userId: string,
    endpoint: string,
    units: number = 1,
    tier?: string
  ): void {
    this.env.ANALYTICS.writeDataPoint({
      blobs: ['api_usage', userId, endpoint, tier || 'default'],
      doubles: [units, 1], // units consumed, call count
      indexes: ['api_usage'],
    });
  }

  /**
   * Track feature flag usage
   */
  trackFeatureFlag(flag: string, variant: string, userId?: string): void {
    this.env.ANALYTICS.writeDataPoint({
      blobs: ['feature_flag', flag, variant, userId || 'anonymous'],
      doubles: [1], // count
      indexes: ['feature_flag'],
    });
  }
}

/**
 * Middleware wrapper for automatic metrics collection
 */
export function withMetrics<Env extends AnalyticsEnv>(
  handler: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>
): (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response> {
  return async (request, env, ctx) => {
    const metrics = new MetricsCollector(env);
    metrics.recordRequest(request);

    try {
      const response = await handler(request, env, ctx);
      const cloned = response.clone();
      const body = await cloned.arrayBuffer();

      metrics.recordResponse(response, body);
      ctx.waitUntil(Promise.resolve(metrics.flush()));

      return response;
    } catch (error) {
      metrics.recordError(error as Error);
      ctx.waitUntil(Promise.resolve(metrics.flush()));
      throw error;
    }
  };
}

// Example usage:
/*
import { withMetrics, MetricsCollector, BusinessMetrics } from './lib/analytics';

interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

export default {
  fetch: withMetrics<Env>(async (request, env, ctx) => {
    const metrics = new MetricsCollector(env);
    const business = new BusinessMetrics(env);

    // Time database operation
    metrics.startTimer('db');
    const data = await queryDatabase(env);
    metrics.stopTimer('db');

    // Track business event
    if (request.method === 'POST' && new URL(request.url).pathname === '/orders') {
      const order = await request.json();
      business.trackPurchase(order.id, order.total, 'USD', order.items.length);
    }

    return Response.json(data);
  })
};
*/

/**
 * Production Logging Setup for Cloudflare Workers
 *
 * Features:
 * - Structured JSON logging
 * - Request context tracking
 * - Sensitive data redaction
 * - Log sampling for high-traffic
 * - Error stack capture
 *
 * Usage:
 * 1. Copy to src/lib/logger.ts
 * 2. Import and use in your worker
 */

// Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId: string;
  timestamp: string;
  service: string;
  environment: string;
  elapsed?: number;
  [key: string]: unknown;
}

export interface LoggerOptions {
  service: string;
  environment: string;
  sampleRate?: number; // 0-1, percentage of info/debug logs to keep
  redactPatterns?: RegExp[];
  includeDebug?: boolean;
}

// Default patterns for sensitive data
const DEFAULT_REDACT_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /credit[_-]?card/i,
  /cvv/i,
  /ssn/i,
  /social[_-]?security/i,
];

/**
 * Production-ready logger for Cloudflare Workers
 */
export class Logger {
  private requestId: string;
  private startTime: number;
  private options: Required<LoggerOptions>;
  private context: Record<string, unknown> = {};

  constructor(requestId: string, options: LoggerOptions) {
    this.requestId = requestId;
    this.startTime = Date.now();
    this.options = {
      sampleRate: 1,
      redactPatterns: DEFAULT_REDACT_PATTERNS,
      includeDebug: false,
      ...options,
    };
  }

  /**
   * Add persistent context to all log entries
   */
  setContext(ctx: Record<string, unknown>): void {
    this.context = { ...this.context, ...ctx };
  }

  /**
   * Debug log - only in development or when includeDebug is true
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.options.includeDebug || this.options.environment === 'development') {
      this.log('debug', message, data);
    }
  }

  /**
   * Info log - subject to sampling in production
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldSample('info')) {
      this.log('info', message, data);
    }
  }

  /**
   * Warning log - always logged
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  /**
   * Error log - always logged
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, {
      ...data,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  /**
   * Log request start - call at beginning of handler
   */
  requestStart(request: Request): void {
    const url = new URL(request.url);

    this.setContext({
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
    });

    this.info('request_start', {
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      country: (request.cf as { country?: string })?.country,
      colo: (request.cf as { colo?: string })?.colo,
    });
  }

  /**
   * Log request completion - call at end of handler
   */
  requestComplete(response: Response, data?: Record<string, unknown>): void {
    this.info('request_complete', {
      ...data,
      status: response.status,
      contentType: response.headers.get('content-type'),
      duration: Date.now() - this.startTime,
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    const child = new Logger(this.requestId, this.options);
    child.startTime = this.startTime;
    child.context = { ...this.context, ...context };
    return child;
  }

  /**
   * Create a timer for measuring operations
   */
  startTimer(name: string): () => number {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`timer_${name}`, { duration });
      return duration;
    };
  }

  // Private methods

  private shouldSample(level: LogLevel): boolean {
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') {
      return true;
    }

    // Sample other levels based on rate
    return Math.random() < this.options.sampleRate;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      service: this.options.service,
      environment: this.options.environment,
      elapsed: Date.now() - this.startTime,
      ...this.context,
      ...this.redact(data || {}),
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  private redact(data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.options.redactPatterns.some((p) => p.test(key))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.redact(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

/**
 * Create a logger from a request
 */
export function createLogger(request: Request, options: LoggerOptions): Logger {
  const requestId =
    request.headers.get('cf-ray') ||
    request.headers.get('x-request-id') ||
    crypto.randomUUID();

  return new Logger(requestId, options);
}

/**
 * Middleware wrapper for automatic request logging
 */
export function withLogging<Env>(
  options: LoggerOptions,
  handler: (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    logger: Logger
  ) => Promise<Response>
): (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response> {
  return async (request, env, ctx) => {
    const logger = createLogger(request, {
      ...options,
      environment: (env as { ENVIRONMENT?: string }).ENVIRONMENT || options.environment,
    });

    logger.requestStart(request);

    try {
      const response = await handler(request, env, ctx, logger);
      logger.requestComplete(response);
      return response;
    } catch (error) {
      logger.error('request_failed', error as Error);
      throw error;
    }
  };
}

// Example usage in a Worker:
/*
import { withLogging, Logger } from './lib/logger';

interface Env {
  ENVIRONMENT: string;
}

export default {
  fetch: withLogging<Env>(
    { service: 'my-worker', environment: 'production' },
    async (request, env, ctx, logger) => {
      // Use logger throughout your handler
      logger.info('processing_request', { customField: 'value' });

      const stopTimer = logger.startTimer('database');
      const data = await queryDatabase();
      stopTimer();

      return Response.json(data);
    }
  )
};
*/

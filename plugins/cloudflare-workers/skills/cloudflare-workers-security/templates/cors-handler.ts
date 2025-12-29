/**
 * CORS Handler for Cloudflare Workers
 *
 * Features:
 * - Origin validation
 * - Preflight handling
 * - Credentials support
 * - Dynamic origins
 * - Environment-based config
 *
 * Usage:
 * 1. Configure allowed origins
 * 2. Use middleware or handler
 * 3. Apply to routes
 */

// ============================================
// TYPES
// ============================================

interface Env {
  ENVIRONMENT: string;
  ALLOWED_ORIGINS?: string; // Comma-separated
}

interface CORSConfig {
  /**
   * Allowed origins. Can be:
   * - Array of specific origins
   * - '*' for all origins (not recommended with credentials)
   * - Function for dynamic validation
   */
  origins: string[] | '*' | ((origin: string) => boolean);

  /** Allowed HTTP methods */
  methods?: string[];

  /** Allowed request headers */
  allowedHeaders?: string[];

  /** Headers to expose to client */
  exposedHeaders?: string[];

  /** Allow credentials (cookies, auth headers) */
  credentials?: boolean;

  /** Preflight cache duration in seconds */
  maxAge?: number;
}

type Handler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: Required<CORSConfig> = {
  origins: [],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  credentials: false,
  maxAge: 86400, // 24 hours
};

// ============================================
// CORS UTILITIES
// ============================================

function isOriginAllowed(
  origin: string,
  config: CORSConfig['origins']
): boolean {
  if (config === '*') return true;
  if (typeof config === 'function') return config(origin);
  if (Array.isArray(config)) return config.includes(origin);
  return false;
}

function getOriginHeader(
  origin: string | null,
  config: CORSConfig
): string | null {
  if (!origin) return null;
  if (config.origins === '*') return '*';
  if (isOriginAllowed(origin, config.origins)) return origin;
  return null;
}

// ============================================
// PREFLIGHT HANDLER
// ============================================

function handlePreflight(
  request: Request,
  config: Required<CORSConfig>
): Response {
  const origin = request.headers.get('Origin');
  const requestMethod = request.headers.get('Access-Control-Request-Method');
  const requestHeaders = request.headers.get('Access-Control-Request-Headers');

  const headers: Record<string, string> = {};

  // Set origin header
  const allowedOrigin = getOriginHeader(origin, config);
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  // Set allowed methods
  if (requestMethod && config.methods.includes(requestMethod.toUpperCase())) {
    headers['Access-Control-Allow-Methods'] = config.methods.join(', ');
  }

  // Set allowed headers
  if (requestHeaders) {
    // Allow requested headers if they're in our allowlist
    const requested = requestHeaders.split(',').map((h) => h.trim().toLowerCase());
    const allowed = config.allowedHeaders.map((h) => h.toLowerCase());
    const matching = requested.filter((h) => allowed.includes(h));

    if (matching.length > 0) {
      headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
    }
  }

  // Set credentials
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Set max age
  headers['Access-Control-Max-Age'] = config.maxAge.toString();

  // Vary header for caching
  headers['Vary'] = 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers';

  return new Response(null, { status: 204, headers });
}

// ============================================
// ADD CORS HEADERS
// ============================================

function addCORSHeaders(
  response: Response,
  origin: string | null,
  config: Required<CORSConfig>
): Response {
  const newResponse = new Response(response.body, response);
  const headers = newResponse.headers;

  // Set origin
  const allowedOrigin = getOriginHeader(origin, config);
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }

  // Set credentials
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Set exposed headers
  if (config.exposedHeaders.length > 0) {
    headers.set('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
  }

  // Vary header for proper caching
  headers.append('Vary', 'Origin');

  return newResponse;
}

// ============================================
// CORS MIDDLEWARE
// ============================================

/**
 * Create CORS middleware with config
 */
export function createCORSMiddleware(config: Partial<CORSConfig> = {}) {
  const mergedConfig: Required<CORSConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return function corsMiddleware(handler: Handler): Handler {
    return async (request, env, ctx) => {
      const origin = request.headers.get('Origin');

      // Handle preflight
      if (request.method === 'OPTIONS') {
        return handlePreflight(request, mergedConfig);
      }

      // Get response from handler
      const response = await handler(request, env, ctx);

      // Add CORS headers
      return addCORSHeaders(response, origin, mergedConfig);
    };
  };
}

/**
 * Simple CORS wrapper for handlers
 */
export function withCORS(handler: Handler, config: Partial<CORSConfig> = {}): Handler {
  return createCORSMiddleware(config)(handler);
}

// ============================================
// ENVIRONMENT-BASED CONFIG
// ============================================

/**
 * Get CORS config based on environment
 */
export function getCORSConfig(env: Env): CORSConfig {
  // Development: Allow localhost
  if (env.ENVIRONMENT === 'development') {
    return {
      origins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8787',
        'http://127.0.0.1:3000',
      ],
      methods: DEFAULT_CONFIG.methods,
      allowedHeaders: [...DEFAULT_CONFIG.allowedHeaders, 'X-Debug'],
      credentials: true,
      maxAge: 600, // 10 minutes for dev
    };
  }

  // Production: Use configured origins
  if (env.ALLOWED_ORIGINS) {
    return {
      origins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      methods: DEFAULT_CONFIG.methods,
      allowedHeaders: DEFAULT_CONFIG.allowedHeaders,
      credentials: true,
      maxAge: 86400,
    };
  }

  // Default: Restrictive
  return {
    origins: [],
    credentials: false,
  };
}

// ============================================
// DYNAMIC ORIGIN VALIDATION
// ============================================

/**
 * Validate subdomain origins
 */
export function subdomainOriginValidator(baseDomain: string) {
  return (origin: string): boolean => {
    try {
      const url = new URL(origin);
      return (
        url.protocol === 'https:' &&
        (url.hostname === baseDomain || url.hostname.endsWith(`.${baseDomain}`))
      );
    } catch {
      return false;
    }
  };
}

/**
 * Validate regex pattern origins
 */
export function regexOriginValidator(pattern: RegExp) {
  return (origin: string): boolean => pattern.test(origin);
}

// ============================================
// HONO MIDDLEWARE
// ============================================

/**
 * Hono-compatible CORS middleware
 */
export function honoCORS(config: Partial<CORSConfig> = {}) {
  const mergedConfig: Required<CORSConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return async (c: { req: { raw: Request; method: string }; res: Response; header: (name: string, value: string) => void }, next: () => Promise<void>) => {
    const origin = c.req.raw.headers.get('Origin');

    // Handle preflight
    if (c.req.method === 'OPTIONS') {
      const response = handlePreflight(c.req.raw, mergedConfig);
      return response;
    }

    // Continue with handler
    await next();

    // Add CORS headers to response
    const allowedOrigin = getOriginHeader(origin, mergedConfig);
    if (allowedOrigin) {
      c.header('Access-Control-Allow-Origin', allowedOrigin);
    }

    if (mergedConfig.credentials) {
      c.header('Access-Control-Allow-Credentials', 'true');
    }

    if (mergedConfig.exposedHeaders.length > 0) {
      c.header('Access-Control-Expose-Headers', mergedConfig.exposedHeaders.join(', '));
    }

    c.header('Vary', 'Origin');
  };
}

// ============================================
// STANDALONE CORS HANDLER
// ============================================

/**
 * Standalone CORS request handler
 */
export class CORSHandler {
  private config: Required<CORSConfig>;

  constructor(config: Partial<CORSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if request is a preflight
   */
  isPreflight(request: Request): boolean {
    return (
      request.method === 'OPTIONS' &&
      request.headers.has('Access-Control-Request-Method')
    );
  }

  /**
   * Handle preflight request
   */
  preflight(request: Request): Response {
    return handlePreflight(request, this.config);
  }

  /**
   * Add CORS headers to response
   */
  addHeaders(response: Response, request: Request): Response {
    const origin = request.headers.get('Origin');
    return addCORSHeaders(response, origin, this.config);
  }

  /**
   * Check if origin is allowed
   */
  isAllowed(origin: string): boolean {
    return isOriginAllowed(origin, this.config.origins);
  }
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import { Hono } from 'hono';
import {
  createCORSMiddleware,
  withCORS,
  getCORSConfig,
  honoCORS,
  subdomainOriginValidator,
} from './cors-handler';

const app = new Hono<{ Bindings: Env }>();

// Option 1: Hono middleware
app.use('*', honoCORS({
  origins: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
}));

// Option 2: Dynamic config from env
app.use('*', async (c, next) => {
  const config = getCORSConfig(c.env);
  return honoCORS(config)(c, next);
});

// Option 3: Subdomain validation
app.use('*', honoCORS({
  origins: subdomainOriginValidator('example.com'),
  credentials: true,
}));

// Option 4: Wrap individual handlers
app.get('/api/public', async (c) => {
  return withCORS(async () => {
    return Response.json({ data: 'public' });
  }, { origins: '*' })(c.req.raw, c.env, c.executionCtx);
});

// Option 5: Standalone handler
const corsHandler = new CORSHandler({
  origins: ['https://app.example.com'],
  credentials: true,
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle preflight
    if (corsHandler.isPreflight(request)) {
      return corsHandler.preflight(request);
    }

    // Check origin
    const origin = request.headers.get('Origin');
    if (origin && !corsHandler.isAllowed(origin)) {
      return new Response('Origin not allowed', { status: 403 });
    }

    // Handle request
    const response = await handleRequest(request, env);

    // Add CORS headers
    return corsHandler.addHeaders(response, request);
  },
};
*/

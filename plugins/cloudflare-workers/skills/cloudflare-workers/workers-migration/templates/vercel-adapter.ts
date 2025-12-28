/**
 * Vercel API Routes to Cloudflare Workers Adapter
 *
 * Enables migration of Vercel API routes with minimal changes.
 * Converts NextApiRequest/NextApiResponse to Web APIs.
 *
 * Usage:
 * 1. Keep existing Vercel API handler logic
 * 2. Import and wrap with adaptVercelHandler
 * 3. Export as Workers default or use with Hono
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface NextApiRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[]>;
  body: any;
  cookies: Record<string, string>;
  env: Record<string, string>;
}

export interface NextApiResponse<T = any> {
  status(code: number): NextApiResponse<T>;
  setHeader(name: string, value: string | string[]): NextApiResponse<T>;
  setPreviewData(data: object): NextApiResponse<T>;
  clearPreviewData(): NextApiResponse<T>;
  json(body: T): void;
  send(body: string): void;
  redirect(url: string): NextApiResponse<T>;
  redirect(status: number, url: string): NextApiResponse<T>;
  revalidate(path: string): Promise<void>;
  end(): void;
}

export type NextApiHandler<T = any> = (
  req: NextApiRequest,
  res: NextApiResponse<T>
) => void | Promise<void>;

// ============================================
// REQUEST IMPLEMENTATION
// ============================================

class WorkersNextApiRequest implements NextApiRequest {
  method: string;
  url: string;
  headers: Record<string, string | undefined>;
  query: Record<string, string | string[]>;
  body: any;
  cookies: Record<string, string>;
  env: Record<string, string>;

  constructor(request: Request, body: any, workerEnv: Record<string, any>) {
    const url = new URL(request.url);

    this.method = request.method;
    this.url = request.url;
    this.body = body;

    // Convert headers
    this.headers = {};
    request.headers.forEach((value, key) => {
      this.headers[key.toLowerCase()] = value;
    });

    // Parse query string
    this.query = {};
    url.searchParams.forEach((value, key) => {
      const existing = this.query[key];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          this.query[key] = [existing, value];
        }
      } else {
        this.query[key] = value;
      }
    });

    // Parse cookies
    this.cookies = {};
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
          this.cookies[name] = rest.join('=');
        }
      });
    }

    // Convert env (strings only)
    this.env = {};
    Object.entries(workerEnv).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.env[key] = value;
      }
    });
  }
}

// ============================================
// RESPONSE IMPLEMENTATION
// ============================================

class WorkersNextApiResponse<T = any> implements NextApiResponse<T> {
  private _statusCode = 200;
  private _headers = new Headers();
  private _body: any = null;
  private _ended = false;
  private _revalidations: string[] = [];

  status(code: number): NextApiResponse<T> {
    this._statusCode = code;
    return this;
  }

  setHeader(name: string, value: string | string[]): NextApiResponse<T> {
    if (Array.isArray(value)) {
      value.forEach((v) => this._headers.append(name, v));
    } else {
      this._headers.set(name, value);
    }
    return this;
  }

  setPreviewData(data: object): NextApiResponse<T> {
    // Preview mode not directly supported in Workers
    // Could implement with KV storage if needed
    console.warn('setPreviewData not fully supported in Workers');
    return this;
  }

  clearPreviewData(): NextApiResponse<T> {
    console.warn('clearPreviewData not fully supported in Workers');
    return this;
  }

  json(body: T): void {
    this._headers.set('Content-Type', 'application/json');
    this._body = JSON.stringify(body);
    this._ended = true;
  }

  send(body: string): void {
    this._body = body;
    this._ended = true;
  }

  redirect(statusOrUrl: number | string, url?: string): NextApiResponse<T> {
    if (typeof statusOrUrl === 'number') {
      this._statusCode = statusOrUrl;
      this._headers.set('Location', url!);
    } else {
      this._statusCode = 307;
      this._headers.set('Location', statusOrUrl);
    }
    this._ended = true;
    return this;
  }

  async revalidate(path: string): Promise<void> {
    this._revalidations.push(path);
    // Implement actual revalidation via cache purge
  }

  end(): void {
    this._ended = true;
  }

  toResponse(): Response {
    return new Response(this._body, {
      status: this._statusCode,
      headers: this._headers,
    });
  }

  getRevalidations(): string[] {
    return this._revalidations;
  }
}

// ============================================
// ADAPTER
// ============================================

interface AdapterOptions {
  /**
   * Environment bindings to pass to handler
   */
  env?: Record<string, any>;

  /**
   * Custom body parser (default: auto-detect JSON)
   */
  parseBody?: (request: Request) => Promise<any>;

  /**
   * Cache revalidation callback
   */
  onRevalidate?: (paths: string[], env: any) => Promise<void>;
}

/**
 * Adapt a Vercel API handler for Cloudflare Workers
 *
 * @example
 * // Existing Vercel handler
 * export default async function handler(req, res) {
 *   res.status(200).json({ hello: 'world' });
 * }
 *
 * // Workers entry point
 * import { adaptVercelHandler } from './vercel-adapter';
 * import handler from './api/hello';
 *
 * export default adaptVercelHandler(handler);
 */
export function adaptVercelHandler<T = any>(
  handler: NextApiHandler<T>,
  options: AdapterOptions = {}
) {
  return {
    async fetch(request: Request, env: Record<string, any>): Promise<Response> {
      try {
        // Parse body
        let body: any = null;

        if (request.method !== 'GET' && request.method !== 'HEAD') {
          if (options.parseBody) {
            body = await options.parseBody(request);
          } else {
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              body = await request.json();
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
              const text = await request.text();
              body = Object.fromEntries(new URLSearchParams(text));
            } else {
              body = await request.text();
            }
          }
        }

        // Create request/response objects
        const req = new WorkersNextApiRequest(
          request,
          body,
          options.env || env
        );
        const res = new WorkersNextApiResponse<T>();

        // Call handler
        await handler(req, res);

        // Handle revalidations
        const revalidations = res.getRevalidations();
        if (revalidations.length > 0 && options.onRevalidate) {
          await options.onRevalidate(revalidations, env);
        }

        return res.toResponse();
      } catch (error) {
        console.error('Vercel adapter error:', error);

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
// HONO INTEGRATION
// ============================================

import { Context, Hono } from 'hono';

/**
 * Adapt Vercel handler for use with Hono
 */
export function adaptVercelHandlerForHono<T = any>(
  handler: NextApiHandler<T>,
  options: AdapterOptions = {}
) {
  return async (c: Context): Promise<Response> => {
    const worker = adaptVercelHandler(handler, options);
    return worker.fetch(c.req.raw, c.env);
  };
}

// ============================================
// EDGE MIDDLEWARE ADAPTER
// ============================================

export interface NextRequest {
  url: string;
  method: string;
  headers: Headers;
  cookies: {
    get(name: string): { value: string } | undefined;
    getAll(): Array<{ name: string; value: string }>;
  };
  nextUrl: URL;
  ip?: string;
  geo?: {
    city?: string;
    country?: string;
    region?: string;
  };
}

export interface NextResponse {
  next(): Response;
  redirect(url: URL | string, status?: number): Response;
  rewrite(url: URL | string): Response;
  json(body: any, init?: ResponseInit): Response;
}

type MiddlewareHandler = (request: NextRequest) => Response | Promise<Response>;

/**
 * Adapt Vercel Edge Middleware for Workers
 */
export function adaptVercelMiddleware(handler: MiddlewareHandler) {
  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);

      // Parse cookies
      const cookieHeader = request.headers.get('cookie') || '';
      const cookies = new Map<string, string>();
      cookieHeader.split(';').forEach((cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name) cookies.set(name, value || '');
      });

      const nextRequest: NextRequest = {
        url: request.url,
        method: request.method,
        headers: request.headers,
        cookies: {
          get(name: string) {
            const value = cookies.get(name);
            return value !== undefined ? { value } : undefined;
          },
          getAll() {
            return Array.from(cookies.entries()).map(([name, value]) => ({
              name,
              value,
            }));
          },
        },
        nextUrl: url,
        ip: request.headers.get('cf-connecting-ip') || undefined,
        geo: {
          city: request.headers.get('cf-ipcity') || undefined,
          country: request.headers.get('cf-ipcountry') || undefined,
          region: request.headers.get('cf-region') || undefined,
        },
      };

      return handler(nextRequest);
    },
  };
}

// ============================================
// NEXT RESPONSE HELPERS
// ============================================

export const NextResponse = {
  next(): Response {
    return new Response(null, { status: 200 });
  },

  redirect(url: URL | string, status = 307): Response {
    const location = typeof url === 'string' ? url : url.toString();
    return new Response(null, {
      status,
      headers: { Location: location },
    });
  },

  rewrite(url: URL | string): Response {
    // Implement via fetch to the new URL
    const destination = typeof url === 'string' ? url : url.toString();
    return fetch(destination);
  },

  json(body: any, init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify(body), {
      ...init,
      headers,
    });
  },
};

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// Existing Vercel API route: pages/api/users/[id].ts
export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const user = await db.users.findById(id);
    return res.status(200).json(user);
  }

  if (req.method === 'PUT') {
    const updated = await db.users.update(id, req.body);
    return res.status(200).json(updated);
  }

  res.status(405).end();
}

// Workers entry point
import { Hono } from 'hono';
import { adaptVercelHandlerForHono } from './vercel-adapter';
import usersHandler from './pages/api/users/[id]';

const app = new Hono();

app.all('/api/users/:id', adaptVercelHandlerForHono(usersHandler));

export default app;

// Or direct export
import { adaptVercelHandler } from './vercel-adapter';
import handler from './pages/api/hello';

export default adaptVercelHandler(handler);
*/

/*
// Existing Vercel middleware: middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Workers migration
import { adaptVercelMiddleware, NextResponse } from './vercel-adapter';

const middleware = (request) => {
  const token = request.cookies.get('token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
};

export default adaptVercelMiddleware(middleware);
*/

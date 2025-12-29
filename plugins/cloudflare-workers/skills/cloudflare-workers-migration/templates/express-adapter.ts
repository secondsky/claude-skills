/**
 * Express to Cloudflare Workers Adapter
 *
 * Enables gradual migration of Express handlers to Workers.
 * Provides Express-like req/res interface on top of Web APIs.
 *
 * Usage:
 * 1. Keep existing Express handler logic
 * 2. Import and wrap with adaptExpressHandler
 * 3. Use with Hono or raw Workers
 */

import { Context, Hono } from 'hono';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ExpressRequest {
  // Properties
  method: string;
  url: string;
  path: string;
  hostname: string;
  protocol: string;
  secure: boolean;
  ip: string;
  ips: string[];
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: any;
  cookies: Record<string, string>;

  // Methods
  get(name: string): string | undefined;
  header(name: string): string | undefined;
  is(type: string): string | false;
  accepts(...types: string[]): string | false;
}

export interface ExpressResponse {
  // Status
  status(code: number): ExpressResponse;
  sendStatus(code: number): ExpressResponse;

  // Headers
  set(field: string, value: string): ExpressResponse;
  set(headers: Record<string, string>): ExpressResponse;
  header(field: string, value: string): ExpressResponse;
  type(type: string): ExpressResponse;
  contentType(type: string): ExpressResponse;
  append(field: string, value: string | string[]): ExpressResponse;

  // Cookies
  cookie(name: string, value: string, options?: CookieOptions): ExpressResponse;
  clearCookie(name: string, options?: CookieOptions): ExpressResponse;

  // Sending
  send(body: string | object | Buffer): ExpressResponse;
  json(body: any): ExpressResponse;
  text(body: string): ExpressResponse;
  html(body: string): ExpressResponse;
  redirect(url: string): ExpressResponse;
  redirect(status: number, url: string): ExpressResponse;
  end(): ExpressResponse;

  // State
  headersSent: boolean;
  statusCode: number;
}

export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

export type NextFunction = () => Promise<void> | void;

export type ExpressHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
  next?: NextFunction
) => void | Promise<void>;

export type ExpressMiddleware = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => void | Promise<void>;

// ============================================
// REQUEST IMPLEMENTATION
// ============================================

class WorkersExpressRequest implements ExpressRequest {
  method: string;
  url: string;
  path: string;
  hostname: string;
  protocol: string;
  secure: boolean;
  ip: string;
  ips: string[];
  headers: Record<string, string | undefined>;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: any;
  cookies: Record<string, string>;

  constructor(request: Request, params: Record<string, string>, body: any) {
    const url = new URL(request.url);

    this.method = request.method;
    this.url = request.url;
    this.path = url.pathname;
    this.hostname = url.hostname;
    this.protocol = url.protocol.replace(':', '');
    this.secure = url.protocol === 'https:';
    this.ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
    this.ips = (request.headers.get('x-forwarded-for') || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);
    this.params = params;
    this.body = body;

    // Parse headers
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
  }

  get(name: string): string | undefined {
    return this.headers[name.toLowerCase()] as string | undefined;
  }

  header(name: string): string | undefined {
    return this.get(name);
  }

  is(type: string): string | false {
    const contentType = this.get('content-type') || '';
    if (contentType.includes(type)) {
      return type;
    }
    return false;
  }

  accepts(...types: string[]): string | false {
    const accept = this.get('accept') || '';
    for (const type of types) {
      if (accept.includes(type) || accept.includes('*/*')) {
        return type;
      }
    }
    return false;
  }
}

// ============================================
// RESPONSE IMPLEMENTATION
// ============================================

class WorkersExpressResponse implements ExpressResponse {
  private _statusCode = 200;
  private _headers = new Headers();
  private _body: any = null;
  private _sent = false;
  private _cookies: string[] = [];

  get statusCode(): number {
    return this._statusCode;
  }

  get headersSent(): boolean {
    return this._sent;
  }

  status(code: number): ExpressResponse {
    this._statusCode = code;
    return this;
  }

  sendStatus(code: number): ExpressResponse {
    this._statusCode = code;
    this._body = String(code);
    this._sent = true;
    return this;
  }

  set(field: string | Record<string, string>, value?: string): ExpressResponse {
    if (typeof field === 'object') {
      Object.entries(field).forEach(([k, v]) => {
        this._headers.set(k, v);
      });
    } else if (value !== undefined) {
      this._headers.set(field, value);
    }
    return this;
  }

  header(field: string, value: string): ExpressResponse {
    this._headers.set(field, value);
    return this;
  }

  type(type: string): ExpressResponse {
    const mimeTypes: Record<string, string> = {
      html: 'text/html',
      json: 'application/json',
      text: 'text/plain',
      xml: 'application/xml',
    };
    this._headers.set('Content-Type', mimeTypes[type] || type);
    return this;
  }

  contentType(type: string): ExpressResponse {
    return this.type(type);
  }

  append(field: string, value: string | string[]): ExpressResponse {
    const values = Array.isArray(value) ? value : [value];
    values.forEach((v) => {
      this._headers.append(field, v);
    });
    return this;
  }

  cookie(name: string, value: string, options: CookieOptions = {}): ExpressResponse {
    const parts = [`${name}=${value}`];

    if (options.domain) parts.push(`Domain=${options.domain}`);
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

    this._cookies.push(parts.join('; '));
    return this;
  }

  clearCookie(name: string, options: CookieOptions = {}): ExpressResponse {
    return this.cookie(name, '', { ...options, expires: new Date(0) });
  }

  send(body: string | object | Buffer): ExpressResponse {
    if (typeof body === 'object' && !(body instanceof ArrayBuffer)) {
      return this.json(body);
    }
    this._body = body;
    this._sent = true;
    return this;
  }

  json(body: any): ExpressResponse {
    this._headers.set('Content-Type', 'application/json');
    this._body = JSON.stringify(body);
    this._sent = true;
    return this;
  }

  text(body: string): ExpressResponse {
    this._headers.set('Content-Type', 'text/plain');
    this._body = body;
    this._sent = true;
    return this;
  }

  html(body: string): ExpressResponse {
    this._headers.set('Content-Type', 'text/html');
    this._body = body;
    this._sent = true;
    return this;
  }

  redirect(statusOrUrl: number | string, url?: string): ExpressResponse {
    if (typeof statusOrUrl === 'number') {
      this._statusCode = statusOrUrl;
      this._headers.set('Location', url!);
    } else {
      this._statusCode = 302;
      this._headers.set('Location', statusOrUrl);
    }
    this._sent = true;
    return this;
  }

  end(): ExpressResponse {
    this._sent = true;
    return this;
  }

  toResponse(): Response {
    // Add cookies
    this._cookies.forEach((cookie) => {
      this._headers.append('Set-Cookie', cookie);
    });

    return new Response(this._body, {
      status: this._statusCode,
      headers: this._headers,
    });
  }
}

// ============================================
// ADAPTERS
// ============================================

/**
 * Adapt a single Express handler for use with Hono
 */
export function adaptExpressHandler(handler: ExpressHandler) {
  return async (c: Context): Promise<Response> => {
    // Parse body
    let body: any = {};
    const contentType = c.req.header('content-type') || '';

    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      try {
        if (contentType.includes('application/json')) {
          body = await c.req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const formData = await c.req.formData();
          formData.forEach((value, key) => {
            body[key] = value;
          });
        } else {
          body = await c.req.text();
        }
      } catch {
        // Body parsing failed, continue with empty body
      }
    }

    const req = new WorkersExpressRequest(
      c.req.raw,
      c.req.param() as Record<string, string>,
      body
    );
    const res = new WorkersExpressResponse();

    await handler(req, res);

    return res.toResponse();
  };
}

/**
 * Adapt Express middleware for use with Hono
 */
export function adaptExpressMiddleware(middleware: ExpressMiddleware) {
  return async (c: Context, next: () => Promise<void>): Promise<void | Response> => {
    let body: any = {};
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      try {
        body = await c.req.json();
      } catch {
        // Continue without body
      }
    }

    const req = new WorkersExpressRequest(
      c.req.raw,
      c.req.param() as Record<string, string>,
      body
    );
    const res = new WorkersExpressResponse();
    let nextCalled = false;

    const nextFn: NextFunction = async () => {
      nextCalled = true;
    };

    await middleware(req, res, nextFn);

    if (nextCalled) {
      await next();
    } else if (res.headersSent) {
      return res.toResponse();
    }
  };
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// existing-express-handler.ts
export const getUserHandler = async (req, res) => {
  const userId = req.params.id;
  const user = await db.users.findById(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
};

export const authMiddleware = (req, res, next) => {
  const token = req.get('authorization');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = decodeToken(token);
  next();
};

// index.ts (Workers entry point)
import { Hono } from 'hono';
import { adaptExpressHandler, adaptExpressMiddleware } from './express-adapter';
import { getUserHandler, authMiddleware } from './existing-express-handler';

const app = new Hono();

// Adapt middleware
app.use('/api/*', adaptExpressMiddleware(authMiddleware));

// Adapt handlers
app.get('/api/users/:id', adaptExpressHandler(getUserHandler));

export default app;
*/

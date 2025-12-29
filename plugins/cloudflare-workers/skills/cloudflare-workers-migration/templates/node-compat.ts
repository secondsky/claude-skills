/**
 * Node.js Compatibility Layer for Cloudflare Workers
 *
 * Provides polyfills and adapters for common Node.js patterns
 * that need manual migration in Workers.
 *
 * Usage:
 * 1. Import needed utilities
 * 2. Replace Node.js-specific code with these adapters
 */

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

/**
 * Process.env adapter
 * Creates a proxy that reads from Workers env bindings
 */
export function createProcessEnv<TEnv extends Record<string, any>>(
  env: TEnv
): NodeJS.ProcessEnv {
  return new Proxy({} as NodeJS.ProcessEnv, {
    get(_, key: string) {
      const value = env[key];
      return typeof value === 'string' ? value : undefined;
    },
    has(_, key: string) {
      return key in env && typeof env[key] === 'string';
    },
  });
}

// ============================================
// FILE SYSTEM (fs) → KV/R2
// ============================================

interface FileSystemAdapter {
  readFile(path: string): Promise<string>;
  readFileSync(path: string): never;
  writeFile(path: string, data: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readdir(path: string): Promise<string[]>;
  unlink(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  stat(path: string): Promise<{ isFile: () => boolean; isDirectory: () => boolean }>;
}

/**
 * Create fs-like adapter backed by KV
 */
export function createFsAdapterKV(kv: KVNamespace): FileSystemAdapter {
  return {
    async readFile(path: string): Promise<string> {
      const content = await kv.get(path);
      if (content === null) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return content;
    },

    readFileSync(): never {
      throw new Error('Synchronous file operations not supported in Workers');
    },

    async writeFile(path: string, data: string): Promise<void> {
      await kv.put(path, data);
    },

    async exists(path: string): Promise<boolean> {
      const result = await kv.get(path);
      return result !== null;
    },

    async readdir(path: string): Promise<string[]> {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      const list = await kv.list({ prefix });
      return list.keys.map((k) => k.name.replace(prefix, '').split('/')[0]);
    },

    async unlink(path: string): Promise<void> {
      await kv.delete(path);
    },

    async mkdir(): Promise<void> {
      // No-op for KV
    },

    async stat(path: string): Promise<{ isFile: () => boolean; isDirectory: () => boolean }> {
      const exists = await kv.get(path);
      return {
        isFile: () => exists !== null,
        isDirectory: () => false,
      };
    },
  };
}

/**
 * Create fs-like adapter backed by R2
 */
export function createFsAdapterR2(bucket: R2Bucket): FileSystemAdapter {
  return {
    async readFile(path: string): Promise<string> {
      const object = await bucket.get(path);
      if (!object) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return object.text();
    },

    readFileSync(): never {
      throw new Error('Synchronous file operations not supported in Workers');
    },

    async writeFile(path: string, data: string): Promise<void> {
      await bucket.put(path, data);
    },

    async exists(path: string): Promise<boolean> {
      const head = await bucket.head(path);
      return head !== null;
    },

    async readdir(path: string): Promise<string[]> {
      const prefix = path.endsWith('/') ? path : `${path}/`;
      const list = await bucket.list({ prefix, delimiter: '/' });

      const files = list.objects.map((o) => o.key.replace(prefix, ''));
      const dirs = (list.delimitedPrefixes || []).map((p) =>
        p.replace(prefix, '').replace('/', '')
      );

      return [...files, ...dirs];
    },

    async unlink(path: string): Promise<void> {
      await bucket.delete(path);
    },

    async mkdir(): Promise<void> {
      // No-op for R2
    },

    async stat(path: string): Promise<{ isFile: () => boolean; isDirectory: () => boolean }> {
      const head = await bucket.head(path);
      return {
        isFile: () => head !== null,
        isDirectory: () => false,
      };
    },
  };
}

// ============================================
// HTTP CLIENT (http/https → fetch)
// ============================================

interface HttpRequestOptions {
  hostname?: string;
  host?: string;
  port?: number;
  path?: string;
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Simple http.request replacement using fetch
 */
export async function httpRequest(
  options: HttpRequestOptions | string,
  body?: string | object
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  let url: string;
  let method = 'GET';
  let headers: Record<string, string> = {};
  let timeout: number | undefined;

  if (typeof options === 'string') {
    url = options;
  } else {
    const protocol = options.port === 443 ? 'https' : 'http';
    const host = options.hostname || options.host || 'localhost';
    const port = options.port ? `:${options.port}` : '';
    const path = options.path || '/';
    url = `${protocol}://${host}${port}${path}`;
    method = options.method || 'GET';
    headers = options.headers || {};
    timeout = options.timeout;
  }

  const controller = new AbortController();
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: await response.text(),
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// ============================================
// CRYPTO POLYFILLS
// ============================================

/**
 * crypto.randomBytes replacement
 */
export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * crypto.randomUUID replacement (already in Web Crypto)
 */
export function randomUUID(): string {
  return crypto.randomUUID();
}

/**
 * Simple hash function using Web Crypto
 */
export async function createHash(
  algorithm: 'sha256' | 'sha384' | 'sha512',
  data: string | Uint8Array
): Promise<string> {
  const algMap = {
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
  };

  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest(algMap[algorithm], input);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * HMAC using Web Crypto
 */
export async function createHmac(
  algorithm: 'sha256' | 'sha384' | 'sha512',
  key: string,
  data: string
): Promise<string> {
  const algMap = {
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
  };

  const keyData = new TextEncoder().encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algMap[algorithm] },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(data)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================
// TIMERS
// ============================================

/**
 * setTimeout that returns a Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * setImmediate replacement using microtask
 */
export function setImmediate(callback: () => void): void {
  queueMicrotask(callback);
}

// ============================================
// BUFFER UTILITIES
// ============================================

/**
 * Buffer.from replacement for common cases
 */
export function bufferFrom(
  input: string | ArrayBuffer | Uint8Array,
  encoding?: 'utf-8' | 'base64' | 'hex'
): Uint8Array {
  if (input instanceof Uint8Array) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  if (encoding === 'base64') {
    const binary = atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  if (encoding === 'hex') {
    const bytes = new Uint8Array(input.length / 2);
    for (let i = 0; i < input.length; i += 2) {
      bytes[i / 2] = parseInt(input.slice(i, i + 2), 16);
    }
    return bytes;
  }

  // Default: UTF-8
  return new TextEncoder().encode(input);
}

/**
 * Buffer.toString replacement
 */
export function bufferToString(
  buffer: Uint8Array,
  encoding?: 'utf-8' | 'base64' | 'hex'
): string {
  if (encoding === 'base64') {
    return btoa(String.fromCharCode(...buffer));
  }

  if (encoding === 'hex') {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Default: UTF-8
  return new TextDecoder().decode(buffer);
}

// ============================================
// PATH UTILITIES (already supported, but included for reference)
// ============================================

export const path = {
  join(...paths: string[]): string {
    return paths
      .join('/')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '');
  },

  basename(path: string, ext?: string): string {
    const base = path.split('/').pop() || '';
    if (ext && base.endsWith(ext)) {
      return base.slice(0, -ext.length);
    }
    return base;
  },

  dirname(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '.';
  },

  extname(path: string): string {
    const base = path.split('/').pop() || '';
    const dotIndex = base.lastIndexOf('.');
    return dotIndex > 0 ? base.slice(dotIndex) : '';
  },

  normalize(path: string): string {
    const parts = path.split('/');
    const result: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        result.pop();
      } else if (part !== '.' && part !== '') {
        result.push(part);
      }
    }

    return (path.startsWith('/') ? '/' : '') + result.join('/');
  },
};

// ============================================
// EVENT EMITTER (simple implementation)
// ============================================

type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events = new Map<string, EventListener[]>();

  on(event: string, listener: EventListener): this {
    const listeners = this.events.get(event) || [];
    listeners.push(listener);
    this.events.set(event, listeners);
    return this;
  }

  once(event: string, listener: EventListener): this {
    const onceListener: EventListener = (...args) => {
      this.off(event, onceListener);
      listener(...args);
    };
    return this.on(event, onceListener);
  }

  off(event: string, listener: EventListener): this {
    const listeners = this.events.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event) || [];
    listeners.forEach((listener) => listener(...args));
    return listeners.length > 0;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// Before (Node.js)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const config = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8');
const hash = crypto.createHash('sha256').update('data').digest('hex');
const apiKey = process.env.API_KEY;

// After (Workers)
import {
  createFsAdapterKV,
  createHash,
  createProcessEnv,
  path
} from './node-compat';

interface Env {
  CONFIG: KVNamespace;
  API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const fs = createFsAdapterKV(env.CONFIG);
    const processEnv = createProcessEnv(env);

    const config = await fs.readFile('config.json');
    const hash = await createHash('sha256', 'data');
    const apiKey = processEnv.API_KEY;

    return Response.json({ config, hash });
  },
};
*/

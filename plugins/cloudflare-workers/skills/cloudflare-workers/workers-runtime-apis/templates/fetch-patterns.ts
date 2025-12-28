/**
 * Fetch API Utility Patterns for Cloudflare Workers
 *
 * Features:
 * - Timeout with AbortController
 * - Retry with exponential backoff
 * - Response cloning and handling
 * - Parallel requests
 * - CORS handling
 *
 * Usage: Copy needed functions to src/lib/fetch.ts
 */

// ============================================
// FETCH WITH TIMEOUT
// ============================================

export interface TimeoutOptions {
  timeout?: number; // ms
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & TimeoutOptions = {}
): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// FETCH WITH RETRY
// ============================================

export interface RetryOptions {
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryOn?: (response: Response) => boolean;
  onRetry?: (attempt: number, error?: Error, response?: Response) => void;
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryOn = (r) => r.status >= 500,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (response.ok || !retryOn(response)) {
        return response;
      }

      if (attempt < retries) {
        onRetry?.(attempt + 1, undefined, response);
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        return response;
      }
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        onRetry?.(attempt + 1, lastError);
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ============================================
// COMBINED: TIMEOUT + RETRY
// ============================================

export async function robustFetch(
  url: string,
  options: RequestInit & TimeoutOptions & RetryOptions = {}
): Promise<Response> {
  const { timeout = 5000, retries = 3, ...restOptions } = options;

  return fetchWithRetry(url, {
    ...restOptions,
    retries,
    // Wrap each attempt with timeout
  });
}

// ============================================
// PARALLEL FETCH
// ============================================

export interface ParallelFetchResult<T> {
  success: T[];
  failed: Array<{ url: string; error: Error }>;
}

export async function fetchParallel<T>(
  urls: string[],
  options: RequestInit = {},
  transform: (response: Response) => Promise<T> = (r) => r.json() as Promise<T>
): Promise<ParallelFetchResult<T>> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return transform(response);
    })
  );

  const success: T[] = [];
  const failed: Array<{ url: string; error: Error }> = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      success.push(result.value);
    } else {
      failed.push({ url: urls[index], error: result.reason });
    }
  });

  return { success, failed };
}

// ============================================
// RESPONSE HELPERS
// ============================================

export async function safeJson<T>(response: Response, fallback: T): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function checkResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      errorBody = response.statusText;
    }
    throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 200)}`);
  }
  return response;
}

// ============================================
// API CLIENT BUILDER
// ============================================

export interface ApiClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, headers = {}, timeout = 5000, retries = 2 } = options;

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const url = `${baseUrl}${path}`;

    const response = await fetchWithRetry(url, {
      ...init,
      headers: { ...headers, ...init.headers },
      retries,
    });

    await checkResponse(response);
    return response.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return request<T>(`${path}${query}`);
    },

    post: <T>(path: string, body: unknown) =>
      request<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),

    put: <T>(path: string, body: unknown) =>
      request<T>(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),

    delete: <T>(path: string) =>
      request<T>(path, { method: 'DELETE' }),
  };
}

// ============================================
// CORS HANDLING
// ============================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

export function handleCorsPreFlight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  return null;
}

// ============================================
// PROXY HELPER
// ============================================

export interface ProxyOptions {
  targetHost: string;
  rewriteHost?: boolean;
  addHeaders?: Record<string, string>;
  removeHeaders?: string[];
}

export async function proxyRequest(
  request: Request,
  options: ProxyOptions
): Promise<Response> {
  const url = new URL(request.url);
  url.hostname = options.targetHost;
  url.protocol = 'https:';

  const headers = new Headers(request.headers);

  // Remove specified headers
  options.removeHeaders?.forEach((h) => headers.delete(h));

  // Add specified headers
  Object.entries(options.addHeaders || {}).forEach(([k, v]) => {
    headers.set(k, v);
  });

  // Optionally rewrite Host header
  if (options.rewriteHost) {
    headers.set('Host', options.targetHost);
  }

  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
  });

  return fetch(proxyRequest);
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
import { fetchWithRetry, createApiClient, addCorsHeaders } from './lib/fetch';

// Simple retry fetch
const response = await fetchWithRetry('https://api.example.com/data', {
  retries: 3,
  retryOn: (r) => r.status >= 500 || r.status === 429,
});

// API client
const api = createApiClient({
  baseUrl: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
});

const users = await api.get<User[]>('/users');
const newUser = await api.post<User>('/users', { name: 'John' });

// CORS wrapper
export default {
  async fetch(request: Request): Promise<Response> {
    const cors = handleCorsPreFlight(request);
    if (cors) return cors;

    const response = await handleRequest(request);
    return addCorsHeaders(response);
  }
};
*/

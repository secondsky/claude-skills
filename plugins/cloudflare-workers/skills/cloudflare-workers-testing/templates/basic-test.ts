/**
 * Basic Test Template for Cloudflare Workers
 *
 * This template demonstrates:
 * - Importing worker and test utilities
 * - Testing GET/POST requests
 * - Using execution context
 * - Testing error cases
 * - Setup/teardown with beforeEach/afterEach
 *
 * Usage:
 * 1. Copy to test/ directory
 * 2. Rename to match file being tested (e.g., index.test.ts)
 * 3. Update worker import path
 * 4. Add your test cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index'; // Update path to your worker

describe('Worker', () => {
  // Setup runs before each test
  beforeEach(async () => {
    // Seed test data if needed
    // await env.DB.exec('CREATE TABLE IF NOT EXISTS users ...');
    // await env.KV.put('test-key', 'test-value');
  });

  // Cleanup runs after each test (usually not needed due to automatic isolation)
  afterEach(async () => {
    // Manual cleanup if needed (bindings auto-reset between tests)
  });

  describe('GET requests', () => {
    it('responds to GET /', async () => {
      const request = new Request('http://example.com/');
      const ctx = createExecutionContext();

      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Hello'); // Update expected content
    });

    it('handles query parameters', async () => {
      const request = new Request('http://example.com/search?q=test&limit=10');
      const ctx = createExecutionContext();

      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.query).toBe('test');
      expect(data.limit).toBe(10);
    });
  });

  describe('POST requests', () => {
    it('creates resource via POST', async () => {
      const request = new Request('http://example.com/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Alice',
          email: 'alice@example.com'
        })
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(201);
      const user = await response.json();
      expect(user).toHaveProperty('id');
      expect(user.name).toBe('Alice');
    });

    it('validates required fields', async () => {
      const request = new Request('http://example.com/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required fields
        })
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error).toHaveProperty('errors');
    });
  });

  describe('Error handling', () => {
    it('returns 404 for unknown routes', async () => {
      const request = new Request('http://example.com/nonexistent');
      const ctx = createExecutionContext();

      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });

    it('handles invalid JSON', async () => {
      const request = new Request('http://example.com/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
    });

    it('returns proper CORS headers', async () => {
      const request = new Request('http://example.com/api/data', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST'
        }
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });
  });

  describe('Headers and metadata', () => {
    it('sets correct Content-Type', async () => {
      const request = new Request('http://example.com/api/data');
      const ctx = createExecutionContext();

      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('includes cache headers', async () => {
      const request = new Request('http://example.com/static/file.txt');
      const ctx = createExecutionContext();

      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.headers.get('Cache-Control')).toBeDefined();
    });
  });
});

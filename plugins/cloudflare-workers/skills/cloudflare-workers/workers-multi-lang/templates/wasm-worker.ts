/**
 * WASM Integration Template for Cloudflare Workers
 *
 * Production-ready patterns for:
 * - Loading and caching WASM modules
 * - Efficient data transfer (strings, arrays, objects)
 * - Memory management
 * - Error handling
 *
 * Usage:
 * 1. Build WASM module (Rust, AssemblyScript, etc.)
 * 2. Copy this file to src/index.ts
 * 3. Configure wrangler.jsonc
 * 4. Run: bun run dev
 */

// ============================================
// WRANGLER.JSONC
// ============================================

/*
{
  "name": "wasm-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "rules": [
    {
      "type": "CompiledWasm",
      "globs": ["**/*.wasm"],
      "fallthrough": true
    }
  ]
}
*/

// ============================================
// TYPE DEFINITIONS
// ============================================

// Import WASM module
import wasmModule from './lib.wasm';

// WASM exports interface
interface WasmExports {
  // Memory
  memory: WebAssembly.Memory;

  // Memory management
  alloc: (size: number) => number;
  dealloc: (ptr: number, size: number) => void;

  // Numeric operations
  add: (a: number, b: number) => number;
  multiply: (a: number, b: number) => number;
  sqrt: (n: number) => number;

  // Array operations
  sum_array: (ptr: number, len: number) => number;
  compute_statistics: (inputPtr: number, len: number, outputPtr: number) => void;
  normalize_array: (inputPtr: number, outputPtr: number, len: number) => void;

  // String operations
  process_string: (ptr: number, len: number) => number;
  get_result_len: () => number;

  // Complex operations
  compute_hash: (ptr: number, len: number) => number;
  process_json: (ptr: number, len: number) => number;
}

// Cloudflare environment
interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

// Statistics result
interface Statistics {
  count: number;
  sum: number;
  mean: number;
  std: number;
  min: number;
  max: number;
}

// ============================================
// WASM MANAGER
// ============================================

class WasmManager {
  private instance: WebAssembly.Instance | null = null;
  private exports: WasmExports | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async initialize(): Promise<void> {
    if (this.instance) return;

    const response = new Response(wasmModule, {
      headers: { 'Content-Type': 'application/wasm' },
    });

    const { instance } = await WebAssembly.instantiateStreaming(response, {
      env: {
        // Import functions WASM can call
        abort: (msg: number, file: number, line: number, col: number) => {
          console.error(`WASM abort at ${file}:${line}:${col}`);
          throw new Error('WASM abort');
        },
        log_str: (ptr: number, len: number) => {
          console.log(this.readString(ptr, len));
        },
        log_num: (n: number) => {
          console.log('WASM log:', n);
        },
      },
    });

    this.instance = instance;
    this.exports = instance.exports as WasmExports;
  }

  get wasm(): WasmExports {
    if (!this.exports) {
      throw new Error('WASM not initialized');
    }
    return this.exports;
  }

  // ==========================================
  // MEMORY HELPERS
  // ==========================================

  readString(ptr: number, len: number): string {
    const view = new Uint8Array(this.wasm.memory.buffer, ptr, len);
    return this.decoder.decode(view);
  }

  writeString(str: string): { ptr: number; len: number } {
    const bytes = this.encoder.encode(str);
    const ptr = this.wasm.alloc(bytes.length);
    const view = new Uint8Array(this.wasm.memory.buffer, ptr, bytes.length);
    view.set(bytes);
    return { ptr, len: bytes.length };
  }

  freeString(ptr: number, len: number): void {
    this.wasm.dealloc(ptr, len);
  }

  readFloat64Array(ptr: number, len: number): Float64Array {
    return new Float64Array(this.wasm.memory.buffer, ptr, len);
  }

  writeFloat64Array(arr: Float64Array): { ptr: number; len: number } {
    const byteLength = arr.byteLength;
    const ptr = this.wasm.alloc(byteLength);
    const view = new Float64Array(this.wasm.memory.buffer, ptr, arr.length);
    view.set(arr);
    return { ptr, len: arr.length };
  }

  freeFloat64Array(ptr: number, len: number): void {
    this.wasm.dealloc(ptr, len * 8);
  }

  // ==========================================
  // NUMERIC OPERATIONS
  // ==========================================

  add(a: number, b: number): number {
    return this.wasm.add(a, b);
  }

  multiply(a: number, b: number): number {
    return this.wasm.multiply(a, b);
  }

  sqrt(n: number): number {
    return this.wasm.sqrt(n);
  }

  // ==========================================
  // ARRAY OPERATIONS
  // ==========================================

  sumArray(data: number[]): number {
    const arr = new Float64Array(data);
    const { ptr, len } = this.writeFloat64Array(arr);

    const result = this.wasm.sum_array(ptr, len);

    this.freeFloat64Array(ptr, len);

    return result;
  }

  computeStatistics(data: number[]): Statistics {
    const input = new Float64Array(data);
    const { ptr: inputPtr, len } = this.writeFloat64Array(input);

    // Allocate output buffer (6 values: count, sum, mean, std, min, max)
    const outputLen = 6;
    const outputPtr = this.wasm.alloc(outputLen * 8);

    this.wasm.compute_statistics(inputPtr, len, outputPtr);

    const output = this.readFloat64Array(outputPtr, outputLen);

    // Free memory
    this.freeFloat64Array(inputPtr, len);
    this.wasm.dealloc(outputPtr, outputLen * 8);

    return {
      count: output[0],
      sum: output[1],
      mean: output[2],
      std: output[3],
      min: output[4],
      max: output[5],
    };
  }

  normalizeArray(data: number[]): number[] {
    const input = new Float64Array(data);
    const { ptr: inputPtr, len } = this.writeFloat64Array(input);
    const outputPtr = this.wasm.alloc(len * 8);

    this.wasm.normalize_array(inputPtr, outputPtr, len);

    const output = Array.from(this.readFloat64Array(outputPtr, len));

    // Free memory
    this.freeFloat64Array(inputPtr, len);
    this.wasm.dealloc(outputPtr, len * 8);

    return output;
  }

  // ==========================================
  // STRING OPERATIONS
  // ==========================================

  processString(input: string): string {
    const { ptr: inputPtr, len: inputLen } = this.writeString(input);

    const resultPtr = this.wasm.process_string(inputPtr, inputLen);
    const resultLen = this.wasm.get_result_len();

    const result = this.readString(resultPtr, resultLen);

    // Free memory
    this.freeString(inputPtr, inputLen);
    this.freeString(resultPtr, resultLen);

    return result;
  }

  // ==========================================
  // COMPLEX OPERATIONS
  // ==========================================

  computeHash(data: Uint8Array): string {
    const ptr = this.wasm.alloc(data.length);
    const view = new Uint8Array(this.wasm.memory.buffer, ptr, data.length);
    view.set(data);

    const resultPtr = this.wasm.compute_hash(ptr, data.length);
    const resultLen = 64; // SHA-256 hex string

    const hash = this.readString(resultPtr, resultLen);

    this.wasm.dealloc(ptr, data.length);
    this.freeString(resultPtr, resultLen);

    return hash;
  }

  processJson<T>(input: unknown): T {
    const jsonStr = JSON.stringify(input);
    const { ptr: inputPtr, len: inputLen } = this.writeString(jsonStr);

    const resultPtr = this.wasm.process_json(inputPtr, inputLen);
    const resultLen = this.wasm.get_result_len();

    const resultStr = this.readString(resultPtr, resultLen);

    this.freeString(inputPtr, inputLen);
    this.freeString(resultPtr, resultLen);

    return JSON.parse(resultStr);
  }
}

// Global WASM manager
const wasmManager = new WasmManager();

// ============================================
// WORKER HANDLERS
// ============================================

async function handleNumeric(request: Request): Promise<Response> {
  const { operation, a, b } = await request.json<{
    operation: 'add' | 'multiply' | 'sqrt';
    a: number;
    b?: number;
  }>();

  let result: number;

  switch (operation) {
    case 'add':
      result = wasmManager.add(a, b!);
      break;
    case 'multiply':
      result = wasmManager.multiply(a, b!);
      break;
    case 'sqrt':
      result = wasmManager.sqrt(a);
      break;
    default:
      return Response.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
  }

  return Response.json({ result, operation });
}

async function handleStatistics(request: Request): Promise<Response> {
  const { data } = await request.json<{ data: number[] }>();

  if (!data || !Array.isArray(data) || data.length === 0) {
    return Response.json({ error: 'Data array is required' }, { status: 400 });
  }

  const statistics = wasmManager.computeStatistics(data);

  return Response.json(statistics);
}

async function handleNormalize(request: Request): Promise<Response> {
  const { data } = await request.json<{ data: number[] }>();

  if (!data || !Array.isArray(data) || data.length === 0) {
    return Response.json({ error: 'Data array is required' }, { status: 400 });
  }

  const normalized = wasmManager.normalizeArray(data);

  return Response.json({ normalized });
}

async function handleHash(request: Request): Promise<Response> {
  const body = await request.text();
  const data = new TextEncoder().encode(body);

  const hash = wasmManager.computeHash(data);

  return Response.json({ hash });
}

async function handleProcess(request: Request): Promise<Response> {
  const { input } = await request.json<{ input: string }>();

  if (!input) {
    return Response.json({ error: 'Input string is required' }, { status: 400 });
  }

  const result = wasmManager.processString(input);

  return Response.json({ result });
}

// ============================================
// BATCH PROCESSOR (Efficient for large datasets)
// ============================================

class BatchProcessor {
  private inputBuffer: number;
  private outputBuffer: number;
  private bufferSize: number;

  constructor(maxSize: number = 10000) {
    const wasm = wasmManager.wasm;
    this.bufferSize = maxSize;
    this.inputBuffer = wasm.alloc(maxSize * 8);
    this.outputBuffer = wasm.alloc(maxSize * 8);
  }

  process(data: Float64Array): Float64Array {
    if (data.length > this.bufferSize) {
      throw new Error(`Data exceeds buffer size: ${data.length} > ${this.bufferSize}`);
    }

    const wasm = wasmManager.wasm;

    // Copy to pre-allocated buffer
    const input = new Float64Array(wasm.memory.buffer, this.inputBuffer, data.length);
    input.set(data);

    // Process (normalize in this example)
    wasm.normalize_array(this.inputBuffer, this.outputBuffer, data.length);

    // Return view (zero-copy read)
    return new Float64Array(wasm.memory.buffer, this.outputBuffer, data.length);
  }

  dispose(): void {
    const wasm = wasmManager.wasm;
    wasm.dealloc(this.inputBuffer, this.bufferSize * 8);
    wasm.dealloc(this.outputBuffer, this.bufferSize * 8);
  }
}

// ============================================
// MAIN EXPORT
// ============================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Initialize WASM on first request
    await wasmManager.initialize();

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Route handlers
      if (method === 'GET' && path === '/') {
        return new Response('WASM Worker API v1.0');
      }

      if (method === 'GET' && path === '/health') {
        return Response.json({
          status: 'healthy',
          wasm: 'initialized',
        });
      }

      if (method === 'POST' && path === '/api/compute/numeric') {
        return handleNumeric(request);
      }

      if (method === 'POST' && path === '/api/compute/statistics') {
        return handleStatistics(request);
      }

      if (method === 'POST' && path === '/api/compute/normalize') {
        return handleNormalize(request);
      }

      if (method === 'POST' && path === '/api/compute/hash') {
        return handleHash(request);
      }

      if (method === 'POST' && path === '/api/process') {
        return handleProcess(request);
      }

      // Batch processing endpoint
      if (method === 'POST' && path === '/api/batch/normalize') {
        const { data } = await request.json<{ data: number[] }>();

        if (!data || data.length === 0) {
          return Response.json({ error: 'Data required' }, { status: 400 });
        }

        const processor = new BatchProcessor(data.length);
        try {
          const input = new Float64Array(data);
          const result = processor.process(input);
          return Response.json({ normalized: Array.from(result) });
        } finally {
          processor.dispose();
        }
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (error) {
      console.error('WASM error:', error);

      if (error instanceof WebAssembly.RuntimeError) {
        return Response.json(
          { error: 'WASM runtime error', message: error.message },
          { status: 500 }
        );
      }

      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
};

// ============================================
// EXAMPLE RUST WASM SOURCE
// ============================================

/*
// src/lib.rs - Corresponding Rust code for WASM exports

use wasm_bindgen::prelude::*;
use std::alloc::{alloc, dealloc, Layout};

#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    let layout = Layout::from_size_align(size, 8).unwrap();
    unsafe { alloc(layout) }
}

#[wasm_bindgen]
pub fn dealloc_mem(ptr: *mut u8, size: usize) {
    let layout = Layout::from_size_align(size, 8).unwrap();
    unsafe { dealloc(ptr, layout) }
}

#[wasm_bindgen]
pub fn add(a: f64, b: f64) -> f64 {
    a + b
}

#[wasm_bindgen]
pub fn multiply(a: f64, b: f64) -> f64 {
    a * b
}

#[wasm_bindgen]
pub fn sqrt(n: f64) -> f64 {
    n.sqrt()
}

#[wasm_bindgen]
pub fn sum_array(ptr: *const f64, len: usize) -> f64 {
    let slice = unsafe { std::slice::from_raw_parts(ptr, len) };
    slice.iter().sum()
}

#[wasm_bindgen]
pub fn compute_statistics(input_ptr: *const f64, len: usize, output_ptr: *mut f64) {
    let input = unsafe { std::slice::from_raw_parts(input_ptr, len) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, 6) };

    let sum: f64 = input.iter().sum();
    let mean = sum / len as f64;
    let variance = input.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / len as f64;
    let std = variance.sqrt();
    let min = input.iter().cloned().fold(f64::INFINITY, f64::min);
    let max = input.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

    output[0] = len as f64;
    output[1] = sum;
    output[2] = mean;
    output[3] = std;
    output[4] = min;
    output[5] = max;
}

#[wasm_bindgen]
pub fn normalize_array(input_ptr: *const f64, output_ptr: *mut f64, len: usize) {
    let input = unsafe { std::slice::from_raw_parts(input_ptr, len) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, len) };

    let min = input.iter().cloned().fold(f64::INFINITY, f64::min);
    let max = input.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let range = max - min;

    for (i, &val) in input.iter().enumerate() {
        output[i] = if range == 0.0 { 0.0 } else { (val - min) / range };
    }
}
*/

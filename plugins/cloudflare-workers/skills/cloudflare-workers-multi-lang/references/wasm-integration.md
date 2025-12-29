# WebAssembly Integration in Workers

Integrate high-performance WASM modules into JavaScript/TypeScript Workers.

## Why WASM in Workers?

- **Performance**: Near-native speed for CPU-intensive tasks
- **Language Choice**: Use Rust, C/C++, Go, AssemblyScript
- **Existing Code**: Port libraries from other languages
- **Security**: Sandboxed execution with memory isolation

## Module Types

| Type | Use Case | Size | Startup |
|------|----------|------|---------|
| **Rust** | General-purpose, crypto | Medium | Fast |
| **AssemblyScript** | TypeScript developers | Small | Fastest |
| **C/C++** | Legacy code, codecs | Variable | Fast |
| **Go** | Existing Go code | Large | Slower |

## Basic Integration

### Importing WASM Module

```typescript
// Import WASM module (bundled with Worker)
import wasmModule from './lib.wasm';

// Or import with bindings
import init, { process_data } from './pkg/my_lib.js';

let wasmInitialized = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Initialize WASM once
    if (!wasmInitialized) {
      await init(wasmModule);
      wasmInitialized = true;
    }

    // Use WASM function
    const result = process_data("input");

    return new Response(result);
  },
};
```

### Streaming Instantiation (Large Modules)

```typescript
// For modules >4KB, use streaming instantiation
import wasmModule from './large-lib.wasm';

let wasmInstance: WebAssembly.Instance | null = null;

async function getWasmInstance(): Promise<WebAssembly.Instance> {
  if (!wasmInstance) {
    // Streaming compilation (more efficient)
    const response = new Response(wasmModule, {
      headers: { 'Content-Type': 'application/wasm' },
    });

    const { instance } = await WebAssembly.instantiateStreaming(
      response,
      {
        env: {
          // Import functions the WASM module needs
          abort: () => { throw new Error('WASM abort'); },
          log: (ptr: number, len: number) => {
            // Handle logging from WASM
          },
        },
      }
    );

    wasmInstance = instance;
  }

  return wasmInstance;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const wasm = await getWasmInstance();
    const exports = wasm.exports as WasmExports;

    const result = exports.compute(42);

    return Response.json({ result });
  },
};

interface WasmExports {
  compute: (n: number) => number;
  memory: WebAssembly.Memory;
}
```

## Data Transfer

### Passing Numbers

```typescript
// Numbers transfer directly
const result = wasmExports.add(10, 20); // Returns 30

// Typed numbers
const floatResult = wasmExports.sqrt(16.0); // Returns 4.0
```

### Passing Strings

```typescript
// Strings require memory allocation
function stringToWasm(str: string, memory: WebAssembly.Memory, alloc: (size: number) => number): number {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  // Allocate memory in WASM
  const ptr = alloc(bytes.length + 1);

  // Write bytes to WASM memory
  const view = new Uint8Array(memory.buffer, ptr, bytes.length + 1);
  view.set(bytes);
  view[bytes.length] = 0; // Null terminator

  return ptr;
}

function stringFromWasm(ptr: number, memory: WebAssembly.Memory): string {
  const view = new Uint8Array(memory.buffer);
  let end = ptr;
  while (view[end] !== 0) end++;

  const decoder = new TextDecoder();
  return decoder.decode(view.slice(ptr, end));
}

// Usage
const ptr = stringToWasm("Hello", wasm.memory, wasm.alloc);
const resultPtr = wasm.process_string(ptr);
const result = stringFromWasm(resultPtr, wasm.memory);
wasm.dealloc(ptr); // Free input memory
wasm.dealloc(resultPtr); // Free output memory
```

### Passing Arrays (Typed Arrays)

```typescript
// Efficient array transfer via shared memory
function arrayToWasm(
  arr: Float64Array,
  memory: WebAssembly.Memory,
  alloc: (size: number) => number
): { ptr: number; len: number } {
  const byteLength = arr.byteLength;
  const ptr = alloc(byteLength);

  // Copy array to WASM memory
  const view = new Float64Array(memory.buffer, ptr, arr.length);
  view.set(arr);

  return { ptr, len: arr.length };
}

function arrayFromWasm(
  ptr: number,
  len: number,
  memory: WebAssembly.Memory
): Float64Array {
  // Create view of WASM memory (zero-copy)
  return new Float64Array(memory.buffer, ptr, len);
}

// Usage
const data = new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0]);
const { ptr, len } = arrayToWasm(data, wasm.memory, wasm.alloc);

const resultPtr = wasm.compute_statistics(ptr, len);
const stats = arrayFromWasm(resultPtr, 4, wasm.memory); // [mean, std, min, max]

// Free memory when done
wasm.dealloc(ptr);
wasm.dealloc(resultPtr);
```

### Passing Objects (JSON)

```typescript
// Objects transfer as JSON strings
interface UserData {
  name: string;
  age: number;
  scores: number[];
}

function objectToWasm(obj: UserData, wasm: WasmExports): number {
  const json = JSON.stringify(obj);
  return stringToWasm(json, wasm.memory, wasm.alloc);
}

function objectFromWasm(ptr: number, wasm: WasmExports): UserData {
  const json = stringFromWasm(ptr, wasm.memory);
  return JSON.parse(json);
}

// Usage
const user: UserData = { name: "Alice", age: 30, scores: [95, 87, 92] };
const inputPtr = objectToWasm(user, wasm);
const resultPtr = wasm.process_user(inputPtr);
const result = objectFromWasm(resultPtr, wasm);
```

## wasm-bindgen Integration (Rust)

```typescript
// With wasm-bindgen, data transfer is handled automatically
import init, {
  greet,
  process_array,
  UserProcessor,
} from './pkg/my_rust_lib.js';
import wasmModule from './pkg/my_rust_lib_bg.wasm';

let initialized = false;

export default {
  async fetch(request: Request): Promise<Response> {
    if (!initialized) {
      await init(wasmModule);
      initialized = true;
    }

    // Strings work directly
    const greeting = greet("World"); // "Hello, World!"

    // Arrays work directly (cloned across boundary)
    const numbers = new Float64Array([1, 2, 3, 4, 5]);
    const sum = process_array(numbers);

    // Classes work directly
    const processor = new UserProcessor();
    processor.add_user("Alice", 30);
    processor.add_user("Bob", 25);
    const users = processor.get_users(); // Returns JSON string
    processor.free(); // Clean up Rust memory

    return Response.json({ greeting, sum, users: JSON.parse(users) });
  },
};
```

```rust
// Corresponding Rust code
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[wasm_bindgen]
pub fn process_array(data: &[f64]) -> f64 {
    data.iter().sum()
}

#[wasm_bindgen]
pub struct UserProcessor {
    users: Vec<(String, u32)>,
}

#[wasm_bindgen]
impl UserProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { users: Vec::new() }
    }

    pub fn add_user(&mut self, name: &str, age: u32) {
        self.users.push((name.to_string(), age));
    }

    pub fn get_users(&self) -> String {
        serde_json::to_string(&self.users).unwrap()
    }
}
```

## AssemblyScript Integration

```typescript
// AssemblyScript provides TypeScript-like syntax
// assembly/index.ts
export function add(a: i32, b: i32): i32 {
  return a + b;
}

export function processArray(ptr: usize, len: i32): f64 {
  let sum: f64 = 0;
  for (let i = 0; i < len; i++) {
    sum += load<f64>(ptr + i * 8);
  }
  return sum / len;
}

// Worker code
import * as loader from '@assemblyscript/loader';
import wasmModule from './build/release.wasm';

let wasmExports: typeof loader.ASUtil & {
  add: (a: number, b: number) => number;
  processArray: (ptr: number, len: number) => number;
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (!wasmExports) {
      const instance = await loader.instantiate(wasmModule);
      wasmExports = instance.exports;
    }

    const result = wasmExports.add(10, 20);

    // For arrays, use __newArray helper
    const data = [1.0, 2.0, 3.0, 4.0, 5.0];
    const ptr = wasmExports.__newArray(wasmExports.__getArrayId(), data);
    const avg = wasmExports.processArray(ptr, data.length);

    return Response.json({ result, avg });
  },
};
```

## Performance Optimization

### Minimize Boundary Crossings

```typescript
// BAD: Many small calls
for (const item of items) {
  results.push(wasm.process(item)); // Slow!
}

// GOOD: Batch processing
const inputPtr = arrayToWasm(items, wasm.memory, wasm.alloc);
const outputPtr = wasm.process_batch(inputPtr, items.length);
const results = arrayFromWasm(outputPtr, items.length, wasm.memory);
```

### Reuse Memory Allocations

```typescript
// Allocate once, reuse
class WasmProcessor {
  private inputBuffer: number;
  private outputBuffer: number;
  private bufferSize: number;

  constructor(private wasm: WasmExports, maxSize: number) {
    this.bufferSize = maxSize;
    this.inputBuffer = wasm.alloc(maxSize * 8); // Float64
    this.outputBuffer = wasm.alloc(maxSize * 8);
  }

  process(data: Float64Array): Float64Array {
    if (data.length > this.bufferSize) {
      throw new Error('Data exceeds buffer size');
    }

    // Copy to pre-allocated buffer
    const input = new Float64Array(
      this.wasm.memory.buffer,
      this.inputBuffer,
      data.length
    );
    input.set(data);

    // Process
    this.wasm.process(this.inputBuffer, this.outputBuffer, data.length);

    // Return view (zero-copy)
    return new Float64Array(
      this.wasm.memory.buffer,
      this.outputBuffer,
      data.length
    );
  }

  dispose() {
    this.wasm.dealloc(this.inputBuffer);
    this.wasm.dealloc(this.outputBuffer);
  }
}
```

### Use SharedArrayBuffer (When Available)

```typescript
// Check for SharedArrayBuffer support
const hasSharedMemory = typeof SharedArrayBuffer !== 'undefined';

// With shared memory, workers can share data without copying
if (hasSharedMemory) {
  const sharedMemory = new WebAssembly.Memory({
    initial: 256,
    maximum: 512,
    shared: true,
  });

  // Pass to WASM instantiation
  const { instance } = await WebAssembly.instantiate(wasmModule, {
    env: { memory: sharedMemory },
  });
}
```

## Error Handling

```typescript
// Wrap WASM calls with error handling
function safeWasmCall<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof WebAssembly.RuntimeError) {
      console.error('WASM runtime error:', error.message);
      // Common: unreachable executed, out of bounds memory access
    } else if (error instanceof WebAssembly.CompileError) {
      console.error('WASM compile error:', error.message);
    } else {
      console.error('Unknown WASM error:', error);
    }
    return fallback;
  }
}

// Usage
const result = safeWasmCall(() => wasm.compute(input), 0);
```

### Handling Panics (Rust)

```rust
// In Rust, set up panic hook
use std::panic;

#[wasm_bindgen(start)]
pub fn init() {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}

// Or handle Result types
#[wasm_bindgen]
pub fn safe_compute(input: &str) -> Result<String, JsValue> {
    match process(input) {
        Ok(result) => Ok(result),
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}
```

```typescript
// In TypeScript, catch as exceptions
try {
  const result = wasm.safe_compute(input);
} catch (error) {
  // Error thrown from Rust
  console.error('Rust error:', error);
}
```

## Wrangler Configuration

```jsonc
// wrangler.jsonc
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
```

## Build Scripts

### Rust Build

```bash
#!/bin/bash
# build-rust.sh

# Build with wasm-pack
wasm-pack build --target bundler --release

# Optimize WASM size
wasm-opt -Oz -o pkg/optimized.wasm pkg/my_lib_bg.wasm

# Report size
ls -lh pkg/*.wasm
```

### AssemblyScript Build

```bash
#!/bin/bash
# build-assemblyscript.sh

# Compile AssemblyScript
npx asc assembly/index.ts \
  --target release \
  --optimize \
  --exportRuntime \
  -o build/release.wasm

# Report size
ls -lh build/*.wasm
```

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `unreachable executed` | Panic in Rust | Add console_error_panic_hook |
| `out of bounds memory` | Invalid pointer | Check array bounds |
| `CompileError` | Invalid WASM | Rebuild with correct target |
| `LinkError: import not found` | Missing import | Provide required imports |
| `memory access out of bounds` | Buffer overflow | Increase memory or check sizes |

## Best Practices

1. **Initialize Once**: Cache WASM instance at module level
2. **Batch Operations**: Minimize JS/WASM boundary crossings
3. **Use Typed Arrays**: Most efficient for numeric data
4. **Pre-allocate Buffers**: Reuse memory for repeated operations
5. **Handle Errors**: Wrap WASM calls with try/catch
6. **Optimize Size**: Use wasm-opt, enable LTO
7. **Measure Performance**: Profile to find bottlenecks

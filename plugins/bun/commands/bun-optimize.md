---
name: bun:optimize
description: Optimize Bun application performance and bundle size
arguments:
  - name: target
    description: What to optimize (bundle, runtime, memory, startup)
    required: false
---

# Bun Optimization

Analyze and optimize Bun application performance.

## Optimization Areas

### Bundle Size Optimization

Analyze current bundle:
```typescript
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  minify: true,
  splitting: true,
  sourcemap: "external",
});

for (const output of result.outputs) {
  console.log(`${output.path}: ${output.size} bytes`);
}
```

Techniques:
1. **Enable minification** - Reduces size by 40-60%
2. **Code splitting** - Lazy load non-critical code
3. **Tree shaking** - Remove unused exports
4. **External packages** - Don't bundle large deps
5. **Drop console/debugger** - Remove dev code

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  minify: true,
  splitting: true,
  drop: ["console", "debugger"],
  external: ["react", "react-dom"],
});
```

### Runtime Performance

1. **Use Bun APIs** - Prefer Bun.file() over fs
2. **Stream large files** - Don't load into memory
3. **Prepared statements** - Reuse SQLite statements
4. **Connection pooling** - For databases
5. **Response caching** - Cache expensive operations

```typescript
// Good: Stream large files
const file = Bun.file("large.json");
const stream = file.stream();

// Good: Prepared statements
const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
for (const id of ids) {
  stmt.get(id);
}

// Good: Cache responses
const cache = new Map();
async function getData(key) {
  if (cache.has(key)) return cache.get(key);
  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}
```

### Memory Optimization

1. **Use --smol flag** - Reduces memory footprint
2. **Stream processing** - Avoid loading all data
3. **WeakMap/WeakSet** - For cached objects
4. **ArrayBuffer reuse** - Pool buffers
5. **Avoid closures** - In hot paths

```bash
# Run with reduced memory
bun --smol run src/index.ts
```

```typescript
// Good: Stream processing
for await (const line of file.stream()) {
  processLine(line);
}

// Good: Buffer pooling
const bufferPool = [];
function getBuffer(size) {
  return bufferPool.pop() || new ArrayBuffer(size);
}
function releaseBuffer(buf) {
  bufferPool.push(buf);
}
```

### Startup Optimization

1. **Compile to bytecode** - Faster cold start
2. **Lazy loading** - Defer non-critical imports
3. **Smaller entry point** - Minimal initial code
4. **Preload essentials** - Load critical modules first

```typescript
// Compile to bytecode
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  bytecode: true,
});
```

```typescript
// Lazy loading
const heavyModule = async () => {
  const { default: module } = await import("./heavy-module");
  return module;
};
```

## bunfig.toml Optimizations

```toml
[install]
# Faster installs
auto-install = true

[run]
# Use Bun runtime
bun = true

[test]
# Faster test execution
preload = ["./test/setup.ts"]
```

## Benchmarking

```typescript
// Simple benchmark
const start = Bun.nanoseconds();
// ... operation
const end = Bun.nanoseconds();
console.log(`Took ${(end - start) / 1_000_000}ms`);

// HTTP benchmark
const server = Bun.serve({ port: 3000, fetch: handler });
// Run: wrk -t12 -c400 -d30s http://localhost:3000/
```

## Analysis Commands

```bash
# Bundle analysis
bun build src/index.ts --outdir=dist --analyze

# Runtime profiling
bun --cpu-prof run src/index.ts

# Memory profiling
bun --heap-prof run src/index.ts
```

## Before/After Checklist

Run these checks before and after optimization:

1. [ ] Bundle size (bytes)
2. [ ] Startup time (ms)
3. [ ] Memory usage (MB)
4. [ ] Request latency (ms)
5. [ ] Throughput (req/s)

## Output

After optimization:
1. Metrics before/after
2. Changes applied
3. Further recommendations
4. Commands to verify improvements

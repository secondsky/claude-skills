# Bun.build Complete Options Reference

## All Options

```typescript
interface BuildConfig {
  // Entry points
  entrypoints: string[];

  // Output
  outdir?: string;
  outfile?: string;  // Single file output

  // Target
  target?: "browser" | "bun" | "node";

  // Format
  format?: "esm" | "cjs" | "iife";

  // Minification
  minify?: boolean | {
    whitespace?: boolean;
    identifiers?: boolean;
    syntax?: boolean;
  };

  // Code splitting
  splitting?: boolean;

  // Source maps
  sourcemap?: "none" | "inline" | "external" | "linked";

  // Naming
  naming?: {
    entry?: string;
    chunk?: string;
    asset?: string;
  } | string;

  // Root directory
  root?: string;

  // Public path
  publicPath?: string;

  // Define
  define?: Record<string, string>;

  // External
  external?: string[];

  // Loaders
  loader?: Record<string, Loader>;

  // Plugins
  plugins?: Plugin[];

  // Conditions
  conditions?: string[];

  // Drop
  drop?: string[];

  // Banner/Footer
  banner?: string;
  footer?: string;

  // Throw on error
  throw?: boolean;

  // Packages
  packages?: "bundle" | "external";

  // Bytecode (Bun target only)
  bytecode?: boolean;

  // Environment files
  emitDCEAnnotations?: boolean;
  ignoreDCEAnnotations?: boolean;

  // JSX
  jsx?: "automatic" | "classic" | "preserve";
  jsxFactory?: string;
  jsxFragment?: string;
  jsxImportSource?: string;
  jsxSideEffects?: boolean;
}
```

## Entry Points

```typescript
// Single entry
await Bun.build({
  entrypoints: ["./src/index.ts"],
});

// Multiple entries
await Bun.build({
  entrypoints: [
    "./src/index.ts",
    "./src/worker.ts",
    "./src/admin.ts",
  ],
});

// Glob patterns
await Bun.build({
  entrypoints: ["./src/**/*.entry.ts"],
});
```

## Output

### Directory Output

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
});
```

### Single File Output

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outfile: "./dist/bundle.js",
});
```

### Naming Patterns

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "chunks/[name]-[hash].[ext]",
    asset: "assets/[name]-[hash].[ext]",
  },
});
```

Placeholders:
- `[name]` - Original filename without extension
- `[ext]` - File extension
- `[hash]` - Content hash
- `[dir]` - Relative directory path

## Minification

```typescript
// Full minification
await Bun.build({
  minify: true,
});

// Selective minification
await Bun.build({
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },
});

// Individual flags
await Bun.build({
  minify: {
    whitespace: true,   // Remove whitespace
    identifiers: false, // Keep variable names
    syntax: true,       // Shorten syntax
  },
});
```

## Source Maps

```typescript
// No source map
await Bun.build({
  sourcemap: "none",
});

// Inline (in bundle)
await Bun.build({
  sourcemap: "inline",
});

// External (.map file)
await Bun.build({
  sourcemap: "external",
});

// Linked (reference in bundle, separate file)
await Bun.build({
  sourcemap: "linked",
});
```

## Code Splitting

```typescript
await Bun.build({
  entrypoints: ["./src/a.ts", "./src/b.ts"],
  splitting: true,
  outdir: "./dist",
});
```

Shared modules extracted to chunks automatically.

## Define

Replace identifiers at compile time:

```typescript
await Bun.build({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "DEBUG": "false",
    "VERSION": JSON.stringify("1.0.0"),
  },
});
```

## External

Exclude from bundle:

```typescript
// Specific packages
await Bun.build({
  external: ["react", "react-dom"],
});

// All packages
await Bun.build({
  packages: "external",
});

// Patterns
await Bun.build({
  external: ["@company/*"],
});
```

## Loaders

```typescript
await Bun.build({
  loader: {
    ".png": "file",
    ".svg": "text",
    ".graphql": "text",
    ".woff2": "file",
    ".css": "css",
    ".json": "json",
    ".txt": "text",
    ".bin": "base64",
  },
});
```

### Loader Types

| Loader | Output |
|--------|--------|
| `js` | JavaScript |
| `jsx` | JavaScript (JSX) |
| `ts` | JavaScript (TypeScript) |
| `tsx` | JavaScript (TSX) |
| `json` | JavaScript object |
| `toml` | JavaScript object |
| `text` | String export |
| `file` | URL/path to file |
| `base64` | Base64 string |
| `dataurl` | Data URL |
| `css` | CSS file |
| `napi` | Native addon |
| `wasm` | WebAssembly |

## Conditions

Custom export conditions:

```typescript
await Bun.build({
  conditions: ["react-server", "production"],
});
```

## Drop

Remove specific constructs:

```typescript
await Bun.build({
  drop: ["console", "debugger"],
});
```

## Banner/Footer

Add text to output:

```typescript
await Bun.build({
  banner: "/* Copyright 2024 */",
  footer: "// End of bundle",
});
```

## JSX Configuration

```typescript
await Bun.build({
  jsx: "automatic",           // or "classic" | "preserve"
  jsxFactory: "h",            // For classic
  jsxFragment: "Fragment",    // For classic
  jsxImportSource: "preact",  // For automatic
  jsxSideEffects: false,      // Tree-shake JSX
});
```

## Bytecode (Bun target)

Pre-compile to bytecode:

```typescript
await Bun.build({
  target: "bun",
  bytecode: true,
});
```

Faster startup, obfuscated code.

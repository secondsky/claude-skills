# Bun Module Resolution Reference

How Bun resolves modules and handles imports in JavaScript and TypeScript.

## Import Syntax

### Extension Resolution Order

When importing without extension, Bun checks in order:

```
./hello.tsx
./hello.jsx
./hello.ts
./hello.mjs
./hello.js
./hello.cjs
./hello.json
./hello/index.tsx
./hello/index.jsx
./hello/index.ts
./hello/index.mjs
./hello/index.js
./hello/index.cjs
./hello/index.json
```

### With Extensions

```typescript
import { hello } from "./hello";      // Extensionless
import { hello } from "./hello.ts";   // TypeScript
import { hello } from "./hello.js";   // Also resolves .ts/.tsx
```

Importing from `.js` also checks for matching `.ts` file (TypeScript compatibility).

## Module Systems

Bun supports both ES Modules and CommonJS.

### Module Type Resolution

| Module Type | `require()` Returns | `import * as` Returns |
|-------------|--------------------|-----------------------|
| ES Module | Module Namespace | Module Namespace |
| CommonJS | module.exports | default = module.exports, named = keys |

### Using require()

```typescript
const { foo } = require("./foo");      // No extension
const { bar } = require("./bar.mjs");  // ESM
const { baz } = require("./baz.tsx");  // TSX
```

### Using import

```typescript
import { foo } from "./foo";
import bar from "./bar.ts";
import { stuff } from "./my-commonjs.cjs";
```

### Mixed Usage

```typescript
// Both work in same file
import { stuff } from "./my-commonjs.cjs";
const myStuff = require("./my-commonjs.cjs");
```

### Top-Level Await Restriction

Files with top-level await cannot be `require()`d (synchronous limitation). Use `import` or dynamic `import()` instead.

## Package Resolution

### exports Field Priority

```json
{
  "name": "foo",
  "exports": {
    "bun": "./index.ts",     // Bun-specific (TypeScript!)
    "node": "./index.js",    // Node.js
    "require": "./index.js", // CommonJS
    "import": "./index.mjs", // ESM
    "default": "./index.js"  // Fallback
  }
}
```

First matching condition wins.

### Subpath Exports

```json
{
  "exports": {
    ".": "./index.js",
    "./utils": "./utils.js"
  }
}
```

### Conditional Subpath Exports

```json
{
  "exports": {
    ".": {
      "import": "./index.mjs",
      "require": "./index.js"
    }
  }
}
```

### Fallback Fields

If no `exports`, Bun checks:
1. `module` (ESM imports only)
2. `main`

```json
{
  "name": "foo",
  "module": "./index.mjs",
  "main": "./index.js"
}
```

### Shipping TypeScript

Use `"bun"` export condition for direct TypeScript:

```json
{
  "exports": {
    "bun": "./src/index.ts",
    "default": "./dist/index.js"
  }
}
```

## Custom Conditions

```bash
bun build --conditions="react-server" --target=bun ./app.js
bun --conditions="react-server" ./app.js
```

Programmatic:

```typescript
await Bun.build({
  conditions: ["react-server"],
  target: "bun",
  entryPoints: ["./app.js"],
});
```

## Path Re-mapping

### tsconfig.json paths

```json
{
  "compilerOptions": {
    "paths": {
      "config": ["./config.ts"],
      "components/*": ["components/*"]
    }
  }
}
```

### package.json imports (Node.js style)

```json
{
  "imports": {
    "#config": "./config.ts",
    "#components/*": "./components/*"
  }
}
```

## NODE_PATH

Additional module resolution directories:

```bash
NODE_PATH=./packages bun run src/index.js

# Multiple paths
NODE_PATH=./packages:./lib bun run src/index.js  # Unix
NODE_PATH=./packages;./lib bun run src/index.js  # Windows
```

## import.meta Properties

| Property | Description | Example |
|----------|-------------|---------|
| `import.meta.dir` | Directory path | `/path/to/project` |
| `import.meta.dirname` | Alias for dir | `/path/to/project` |
| `import.meta.file` | Filename | `index.ts` |
| `import.meta.path` | Full path | `/path/to/project/index.ts` |
| `import.meta.filename` | Alias for path | `/path/to/project/index.ts` |
| `import.meta.url` | File URL | `file:///path/to/project/index.ts` |
| `import.meta.main` | Is entry point? | `true` or `false` |
| `import.meta.env` | Alias for process.env | `{ NODE_ENV: "..." }` |
| `import.meta.resolve()` | Resolve specifier | `"file:///path/to/module.js"` |

### Usage Examples

```typescript
// Get current directory (like __dirname)
const dir = import.meta.dir;

// Check if main entry point
if (import.meta.main) {
  console.log("Running directly");
}

// Resolve module path
const zodPath = import.meta.resolve("zod");
// "file:///path/to/node_modules/zod/index.js"
```

## Resolution Order

When running `bun run`:

1. package.json scripts
2. Source files
3. Binaries from project packages
4. System commands (bun run only)

## Common Patterns

### Dynamic Imports

```typescript
const module = await import("./dynamic.ts");
```

### Conditional Imports

```typescript
const db = process.env.USE_SQLITE
  ? await import("./sqlite.ts")
  : await import("./postgres.ts");
```

### JSON Imports

```typescript
import config from "./config.json";
import data from "./data.json" with { type: "json" };
```

### TOML Imports

```typescript
import config from "./config.toml";
```

### Text/File Imports

```typescript
// With custom loader
import sql from "./query.sql" with { type: "text" };
```

## Troubleshooting

### Cannot find module

1. Check file exists at expected path
2. Verify extension resolution order
3. Check package.json exports field
4. Run `bun install`

### Circular Dependencies

Bun handles circular imports, but use caution with:
- Top-level await in circular chains
- CommonJS modules with complex circular refs

### TypeScript Path Aliases Not Working

Ensure tsconfig.json is at project root or specify:

```bash
bun --tsconfig-override ./path/to/tsconfig.json run index.ts
```

# TanStack Query Configuration Files

**Complete configuration templates for TanStack Query v5 projects**

Load this reference when: Setting up project structure, configuring TypeScript, or installing ESLint plugins.

---

## package.json (Full Example)

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-query": "^5.90.12"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.91.1",
    "@tanstack/eslint-plugin-query": "^5.91.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^6.0.1"
  }
}
```

### Why These Versions

**React 18.3.1**
- Required for `useSyncExternalStore` hook used internally by TanStack Query
- Provides concurrent features that Query v5 leverages

**TanStack Query 5.90.12**
- Latest stable version with all v5 fixes
- Includes all breaking change migrations from v4
- Best compatibility with React 18

**DevTools 5.91.1**
- Version-matched to query package
- Tree-shakeable (automatically removed in production builds)
- No manual configuration needed

**TypeScript 5.6.3**
- Best type inference for query hooks
- Improved generic type handling
- Better error messages for query/mutation types

**Vite 6.0.1**
- Fast HMR for development
- Optimized builds with tree-shaking
- Native ES modules support

---

## tsconfig.json (TypeScript Configuration)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* TanStack Query specific */
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

### TanStack Query Specific Settings

**Required Settings:**
- `"strict": true` - Enables proper type inference for query data and errors
- `"esModuleInterop": true` - Allows proper imports from TanStack Query
- `"jsx": "react-jsx"` - Uses new JSX transform (React 17+)

**Recommended Settings:**
- `"resolveJsonModule": true` - If loading query keys from JSON files
- `"noUnusedLocals": true` - Catches unused query variables
- `"skipLibCheck": true` - Speeds up builds (TanStack types are well-tested)

**Module Resolution:**
- `"moduleResolution": "bundler"` - Works with Vite/modern bundlers
- `"isolatedModules": true` - Required for Vite HMR

---

## .eslintrc.cjs (ESLint Configuration)

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@tanstack/eslint-plugin-query/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@tanstack/query'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

### ESLint Plugin Benefits

The `@tanstack/eslint-plugin-query` catches:

1. **Query keys as references instead of inline**
   ```tsx
   // ❌ Bad: Query key as variable reference
   const key = ['todos']
   useQuery({ queryKey: key, queryFn: fetchTodos })

   // ✅ Good: Query key inline
   useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
   ```

2. **Missing queryFn**
   ```tsx
   // ❌ Caught by linter
   useQuery({ queryKey: ['todos'] })

   // ✅ Fixed
   useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
   ```

3. **Using v4 patterns in v5**
   ```tsx
   // ❌ v4 syntax detected
   useQuery(['todos'], fetchTodos)

   // ✅ v5 syntax
   useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
   ```

4. **Incorrect dependencies in useEffect**
   ```tsx
   // ❌ Missing dependency
   const { data } = useQuery(...)
   useEffect(() => {
     console.log(data)
   }, []) // Missing 'data'

   // ✅ Correct dependencies
   useEffect(() => {
     console.log(data)
   }, [data])
   ```

---

## vite.config.ts (Vite Configuration)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@tanstack/react-query'],
  },
})
```

### Vite Optimization

**optimizeDeps.include**:
- Pre-bundles TanStack Query for faster dev server starts
- Reduces HMR update times
- Prevents re-bundling on every change

---

## Alternative: Bun Setup

For projects using Bun instead of npm:

```bash
# Install dependencies
bun add @tanstack/react-query
bun add -d @tanstack/react-query-devtools @tanstack/eslint-plugin-query

# Run dev server
bun run dev

# Build
bun run build
```

**package.json with Bun:**
```json
{
  "scripts": {
    "dev": "bun run vite",
    "build": "bun run tsc && bun run vite build",
    "preview": "bun run vite preview"
  }
}
```

---

## Verification Checklist

After setting up configuration files, verify:

- [ ] `npm install` (or `bun install`) succeeds without peer dependency warnings
- [ ] TypeScript compilation succeeds: `tsc --noEmit`
- [ ] ESLint runs without errors: `npm run lint` (if script exists)
- [ ] Dev server starts: `npm run dev`
- [ ] Production build succeeds: `npm run build`
- [ ] DevTools button appears in dev mode (bottom-right corner)
- [ ] No console warnings about missing peer dependencies

---

**Last Updated**: 2025-12-09
**Verified With**: @tanstack/react-query@5.90.12

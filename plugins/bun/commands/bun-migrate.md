---
name: bun:migrate
description: Migrate existing Node.js/npm projects to Bun
arguments:
  - name: source
    description: Source package manager to migrate from (npm, yarn, pnpm)
    required: false
---

# Migrate to Bun

Migrate an existing Node.js project to use Bun as runtime and package manager.

## Migration Steps

### 1. Analyze Current Project

Check for:
- Current package manager (package-lock.json, yarn.lock, pnpm-lock.yaml)
- Node.js version requirements
- Native dependencies
- Scripts that use Node-specific features
- Test framework (Jest, Mocha, Vitest)

### 2. Package Manager Migration

```bash
# Remove old lockfiles
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# Install with Bun
bun install
```

### 3. Update Scripts

Replace in package.json:

| Before | After |
|--------|-------|
| `node script.js` | `bun script.js` |
| `ts-node script.ts` | `bun script.ts` |
| `npx command` | `bunx command` |
| `npm run` | `bun run` |
| `jest` | `bun test` |
| `vitest` | `bun test` |

### 4. Configuration Files

Create or update:

**bunfig.toml**
```toml
[install]
auto-install = true

[run]
bun = true
```

### 5. Test Migration

For Jest projects:
```bash
# Update imports
# Before: import { describe, it } from '@jest/globals'
# After:  import { describe, test } from 'bun:test'

# Run tests
bun test
```

### 6. TypeScript Configuration

Update tsconfig.json:
```json
{
  "compilerOptions": {
    "types": ["bun-types"]
  }
}
```

Install types:
```bash
bun add -D bun-types
```

## Compatibility Checks

### Node.js APIs

| API | Bun Support |
|-----|-------------|
| fs | ✅ Full |
| path | ✅ Full |
| http/https | ✅ Full |
| crypto | ✅ Full |
| child_process | ✅ Full |
| worker_threads | ✅ Full |
| stream | ✅ Full |

### Potential Issues

1. **Native addons** - May need recompilation
2. **Node.js-specific env vars** - Check for NODE_* variables
3. **Babel/webpack configs** - Usually not needed with Bun
4. **Jest configs** - Convert to bunfig.toml

## Rollback Plan

If migration fails:
```bash
# Restore old lockfile
git checkout package-lock.json

# Remove Bun lockfile
rm bun.lockb

# Reinstall with npm
npm install
```

## Questions to Ask

- "Do you have any native Node.js addons?"
- "Are you using Jest for testing?"
- "Do you need to maintain Node.js compatibility?"

## Output

After migration:
1. List of changes made
2. Any incompatibilities found
3. Recommended next steps
4. Performance comparison (if possible)

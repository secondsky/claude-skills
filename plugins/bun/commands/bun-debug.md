---
name: bun:debug
description: Debug Bun applications and diagnose common issues
arguments:
  - name: issue
    description: Type of issue to debug (runtime, test, build, memory, performance)
    required: false
---

# Bun Debug Helper

Diagnose and resolve common issues in Bun applications.

## Debugging Categories

### Runtime Issues

Check for:
1. **Module resolution** - `bun --print-resolved`
2. **Environment variables** - Missing or incorrect env vars
3. **Type errors** - TypeScript configuration issues
4. **Import errors** - Incorrect import paths or missing exports

Commands:
```bash
# Check module resolution
bun --print-resolved src/index.ts

# Verbose output
bun --verbose run src/index.ts

# Check environment
bun --print env
```

### Test Issues

Common problems:
1. **Tests not found** - Check file naming (*.test.ts)
2. **Mock not working** - Verify mock.module syntax
3. **Timeout** - Increase timeout in bunfig.toml
4. **Coverage not generating** - Add --coverage flag

Diagnostic commands:
```bash
# Run with verbose output
bun test --verbose

# Show test discovery
bun test --list

# Check timeout issues
bun test --timeout 30000
```

### Build Issues

Check for:
1. **Entry point** - Verify entrypoints array
2. **External packages** - Check external configuration
3. **Loaders** - Ensure correct loader for file types
4. **Output format** - Verify target and format settings

Debug build:
```typescript
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
}
```

### Memory Issues

Commands:
```bash
# Run with memory stats
bun --smol run src/index.ts

# Check memory usage
bun --print-memory run src/index.ts
```

Common causes:
- Large file reads without streaming
- Unbounded caches
- Event listener leaks
- Large response bodies

### Performance Issues

Profile with:
```bash
# CPU profile
bun --cpu-prof run src/index.ts

# Heap snapshot
bun --heap-prof run src/index.ts
```

Common causes:
- Synchronous file I/O
- Blocking operations
- Inefficient database queries
- Missing caching

## Quick Diagnostics

Run these commands to gather information:

```bash
# Bun version
bun --version

# System info
bun --print-config

# Check dependencies
bun pm ls

# Verify lockfile
bun pm hash

# Check for outdated packages
bun outdated
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Wrong import path | Check relative paths |
| `SyntaxError` | Invalid syntax | Check TypeScript config |
| `ENOENT` | File not found | Verify file exists |
| `EADDRINUSE` | Port in use | Kill process or change port |
| `Segmentation fault` | Native addon issue | Rebuild native modules |

## Debug Checklist

1. [ ] Check Bun version is latest
2. [ ] Verify bunfig.toml settings
3. [ ] Check package.json scripts
4. [ ] Validate TypeScript configuration
5. [ ] Test with minimal reproduction
6. [ ] Check for known issues on GitHub

## Getting Help

If issue persists:
1. Create minimal reproduction
2. Check Bun GitHub issues
3. Check Bun Discord
4. Include Bun version and OS info

## Output

After diagnosis:
1. Identified issue category
2. Specific problem found
3. Recommended fix
4. Commands to verify fix worked

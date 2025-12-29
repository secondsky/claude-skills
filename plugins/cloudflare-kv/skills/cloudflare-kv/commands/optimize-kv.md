---
name: cloudflare-kv:optimize
description: Analyze KV usage patterns and suggest optimizations - identifies missing TTLs, cacheTtl opportunities, bulk operations, and cost savings
---

# /cloudflare-kv:optimize - Analyze and Optimize KV Usage

This command analyzes Worker code for KV usage patterns and provides actionable optimization recommendations to improve performance and reduce costs.

## What This Command Does

1. **Analyzes Code Patterns**
   - Scans Worker files for KV operations
   - Identifies get(), put(), delete(), list() calls
   - Detects missing optimizations

2. **Checks Best Practices**
   - TTL usage on put() operations
   - cacheTtl usage on get() operations
   - Error handling patterns
   - Bulk operation opportunities
   - waitUntil() for async writes

3. **Generates Report**
   - Critical issues (must fix)
   - Warnings (should fix)
   - Optimizations (nice to have)
   - Code examples for each issue
   - Estimated cost/performance impact

## How to Use

### Analyze Single File

```
/cloudflare-kv:optimize src/index.ts
```

### Analyze Multiple Files

Run multiple times for different files:

```
/cloudflare-kv:optimize src/index.ts
/cloudflare-kv:optimize src/api/routes.ts
/cloudflare-kv:optimize src/lib/kv-utils.ts
```

### Interactive Mode

If no file specified, command will:
1. Search for common Worker files (src/index.ts, index.js, worker.ts)
2. List found files
3. Ask which to analyze

```
/cloudflare-kv:optimize
```

## Implementation

Execute the analysis script from the cloudflare-kv skill:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/analyze-kv-usage.sh <worker-file>
```

The script performs static code analysis to detect:
- Missing TTL/expiration on put()
- Missing cacheTtl on get()
- Lack of error handling
- Sequential operations that could be parallel
- Missing pagination on list()
- Opportunities for waitUntil()
- JSON.stringify usage for objects

## Example Output

```
Cloudflare Workers KV - Usage Analyzer
======================================

Analyzing: src/index.ts

KV Operations Found:
  - get():    15
  - put():    8
  - delete(): 3
  - list():   2

Issue Check 1: Missing TTL on put() operations
----------------------------------------------
⚠ 5 put() operation(s) without TTL/expiration
  Issue: Data will persist indefinitely, increasing storage costs
  Fix: Add expirationTtl or expiration to put() calls

  Example:
    await env.KV.put('key', 'value', { expirationTtl: 3600 });

Issue Check 2: Missing cacheTtl on get() operations
---------------------------------------------------
⚠ 12 get() operation(s) without cacheTtl
  Issue: Missing edge caching optimization
  Fix: Add cacheTtl for frequently-read data (min 60 seconds)

  Example:
    const value = await env.KV.get('key', { cacheTtl: 300 });

Issue Check 3: Missing error handling
-------------------------------------
✗ No try-catch blocks found
  Issue: KV operations can fail (rate limits, network errors)
  Fix: Wrap KV operations in try-catch

  Example:
    try {
      const value = await env.KV.get('key');
    } catch (error) {
      console.error('KV error:', error);
      // Handle gracefully
    }

Issue Check 4: Sequential get() calls (bulk read opportunity)
-------------------------------------------------------------
⚠ Multiple sequential await get() calls detected
  Issue: Each get() counts as separate operation
  Fix: Consider using Promise.all() for parallel reads

  Example:
    const [val1, val2, val3] = await Promise.all([
      env.KV.get('key1'),
      env.KV.get('key2'),
      env.KV.get('key3')
    ]);

========================================
Summary
========================================

Critical Issues:   1
Warnings:          3
Optimizations:     2

⚠ Critical issues found

Please address critical issues before deploying to production.

For more details, see:
  - references/best-practices.md
  - references/performance-tuning.md
```

## Optimization Categories

### Critical Issues (Must Fix)

These can cause runtime errors or data loss:

**❌ No error handling**
- Impact: Worker crashes on KV errors
- Fix: Add try-catch blocks
- Priority: HIGH

### Warnings (Should Fix)

These affect reliability and costs:

**⚠️ Missing TTL on put()**
- Impact: Unnecessary storage costs
- Fix: Add expirationTtl
- Savings: Significant (depends on data volume)

**⚠️ Missing pagination on list()**
- Impact: Could hit 1000 key limit
- Fix: Add limit parameter
- Priority: MEDIUM

### Optimizations (Nice to Have)

These improve performance:

**💡 Missing cacheTtl on get()**
- Impact: Slower reads, higher latency
- Fix: Add cacheTtl parameter
- Improvement: 50-90% faster reads

**💡 Sequential operations**
- Impact: Slower execution
- Fix: Use Promise.all()
- Improvement: 2-5x faster

**💡 No waitUntil() usage**
- Impact: Slower response times
- Fix: Use ctx.waitUntil() for non-critical writes
- Improvement: 10-100ms faster responses

## After Analysis

Based on the report:

### If Critical Issues Found

1. **Fix Immediately**
   - Add error handling
   - Test thoroughly
   - Don't deploy without fixing

2. **Reference Documentation**
   - Load `references/best-practices.md` for error handling patterns
   - Load `references/troubleshooting.md` for error recovery

### If Warnings Found

1. **Prioritize Fixes**
   - Address high-cost warnings first (missing TTL)
   - Plan fixes for next development cycle

2. **Estimate Impact**
   - Calculate storage cost savings
   - Measure performance improvements

### If Only Optimizations

1. **Implement Gradually**
   - Start with highest-impact optimizations
   - Measure before/after performance
   - Document improvements

2. **Benchmark**
   ```bash
   # Before optimization
   wrangler dev
   # Test response times

   # After optimization
   wrangler dev
   # Compare response times
   ```

## Optimization Examples

### Before: Missing TTL

```typescript
// ❌ Data persists forever
await env.KV.put('session', sessionData);
```

### After: With TTL

```typescript
// ✅ Auto-expires after 1 hour
await env.KV.put('session', sessionData, {
  expirationTtl: 3600
});
```

**Impact:** Prevents storage bloat, reduces costs

---

### Before: Sequential Reads

```typescript
// ❌ Each await blocks execution
const user = await env.KV.get('user:123');
const prefs = await env.KV.get('prefs:123');
const stats = await env.KV.get('stats:123');
```

### After: Parallel Reads

```typescript
// ✅ All reads happen simultaneously
const [user, prefs, stats] = await Promise.all([
  env.KV.get('user:123'),
  env.KV.get('prefs:123'),
  env.KV.get('stats:123')
]);
```

**Impact:** 3x faster execution

---

### Before: Blocking Writes

```typescript
// ❌ Response waits for write
await env.KV.put('analytics', data);
return new Response('OK');
```

### After: Non-blocking Writes

```typescript
// ✅ Response returns immediately
ctx.waitUntil(
  env.KV.put('analytics', data)
);
return new Response('OK');
```

**Impact:** 50-100ms faster responses

## Automated Optimization

For complex codebases, consider using the **kv-optimizer agent** for automated refactoring:

```
@kv-optimizer Please optimize my KV usage in src/index.ts
```

The agent will:
- Apply optimizations automatically
- Maintain code functionality
- Add tests for changes
- Provide before/after metrics

## Related Commands

- `/cloudflare-kv:test` - Test KV operations after optimization
- `/cloudflare-kv:setup` - Configure new namespaces

## References

For comprehensive optimization guidance:
- Load `references/best-practices.md` for production patterns
- Load `references/performance-tuning.md` for advanced optimizations
- Check official docs: https://developers.cloudflare.com/kv/best-practices/

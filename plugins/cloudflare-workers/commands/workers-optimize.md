---
name: cloudflare-workers:optimize
description: Analyze and optimize Cloudflare Workers performance. Checks bundle size, caching, memory usage, and provides actionable recommendations.
allowed-tools:
  - Read
  - Grep
  - Bash
  - Glob
argument-hint: "--target <bundle|memory|cache> (optional: focus analysis)"
---

# Workers Optimize Command

Comprehensive performance analysis and optimization for Cloudflare Workers.

## Execution Workflow

### Phase 1: Analysis Scope Determination

**If --target argument provided**:
- Focus analysis on specified area (bundle, memory, or cache)
- Skip other analyses for faster results

**If no --target argument**:
- Run complete performance audit
- Analyze all optimization areas

### Phase 2: Bundle Size Analysis

Analyze Worker bundle size and identify bloat:

1. **Build Worker and check output size**:
```bash
bunx wrangler deploy --dry-run --outdir=.wrangler-output
du -h .wrangler-output/
```

2. **Parse bundle size**:
   - Extract total bundle size in KB
   - Compare against limits:
     - Free tier: 1MB limit
     - Paid tier: 10MB limit
   - Flag if >50% of limit used

3. **Identify large dependencies**:
```bash
# Analyze package.json dependencies
grep -A 100 '"dependencies"' package.json
```

Common bloat sources:
- `moment.js` (large, use `date-fns` instead)
- `lodash` (use `lodash-es` for tree-shaking)
- `axios` (use native `fetch`)
- Large UI libraries in backend code

4. **Check for unnecessary imports**:
   - Grep for wildcard imports: `import * as`
   - Check for unused imports in main worker file
   - Look for dev dependencies in production bundle

**Findings**:
```markdown
### Bundle Size Analysis

**Current Size**: X KB / Y MB limit (Z% used)

**Large Dependencies**:
1. [package-name]: X KB
2. [package-name]: X KB

**Recommendations**:
- Remove [package] (unused in production)
- Replace [package] with [lighter alternative]
- Use dynamic imports for [feature]
```

### Phase 3: Caching Analysis

Analyze Cache API usage and opportunities:

1. **Check for Cache API usage**:
```bash
grep -r "caches.open" src/
grep -r "cache.match" src/
grep -r "cache.put" src/
```

2. **Identify cacheable endpoints**:
   - Look for GET routes
   - Check for static responses
   - Find repeated external API calls

3. **Check cache headers**:
```bash
grep -r "Cache-Control" src/
grep -r "max-age" src/
```

**Findings**:
```markdown
### Caching Analysis

**Cache API Usage**: [Found/Not Found]

**Cacheable Opportunities**:
1. Route: /api/data - No caching detected
2. Route: /static/* - Could cache for 24h
3. External API: api.example.com - Called 100x/min, no caching

**Recommendations**:
- Implement Cache API for /api/data (TTL: 5min)
- Add Cache-Control headers for static assets
- Cache external API responses (TTL: 1h)
```

### Phase 4: Memory Usage Analysis

Analyze memory patterns and identify leaks:

1. **Check for large in-memory objects**:
```bash
grep -r "new Map(" src/
grep -r "new Set(" src/
grep -r "const data = " src/
```

2. **Identify potential memory leaks**:
   - Global variables that accumulate data
   - Event listeners not cleaned up
   - Large arrays/objects not released

3. **Check for streaming opportunities**:
   - Look for large response bodies
   - Check if reading entire request body at once
   - Identify file upload/download endpoints

**Findings**:
```markdown
### Memory Usage Analysis

**Potential Issues**:
1. Global Map at line X - grows unbounded
2. Large array created at line Y - not cleaned up
3. File uploads read entire body - use streaming

**Recommendations**:
- Use WeakMap for caching with automatic cleanup
- Implement streaming for files >1MB
- Clear arrays after processing
```

### Phase 5: Cold Start Analysis

Analyze factors affecting cold start performance:

1. **Check for top-level await**:
```bash
grep -n "await" src/index.ts | grep -v "async"
```
   - Top-level await blocks cold start
   - Move to request handler or lazy load

2. **Check import patterns**:
   - Count total imports
   - Identify heavy initialization code
   - Look for synchronous I/O at module level

3. **Check for large constants/data**:
   - JSON files imported at top level
   - Large configuration objects
   - Embedded data that could be external

**Findings**:
```markdown
### Cold Start Analysis

**Blocking Factors**:
1. Top-level await at line X
2. Heavy computation in module scope
3. 50KB JSON imported at module level

**Recommendations**:
- Move await into request handler
- Lazy load heavy dependencies
- Store large data in KV, load on demand
```

### Phase 6: CPU Time Analysis

Check for CPU-intensive operations:

1. **Identify expensive operations**:
```bash
grep -r "for (" src/
grep -r "while (" src/
grep -r "map(" src/
grep -r "filter(" src/
grep -r "reduce(" src/
```

2. **Check for blocking operations**:
   - Synchronous crypto operations
   - Large JSON parsing
   - Complex regex patterns
   - Heavy string manipulation

**Findings**:
```markdown
### CPU Time Analysis

**Expensive Operations**:
1. Nested loop at line X - O(n²) complexity
2. Large JSON.parse() without streaming
3. Complex regex: /(?:...){1000,}/ - catastrophic backtracking

**Recommendations**:
- Optimize algorithm to O(n)
- Stream large JSON payloads
- Simplify regex or use string methods
```

### Phase 7: External Dependencies Analysis

Analyze external API calls and database queries:

1. **Count external fetch calls**:
```bash
grep -r "fetch(" src/ | wc -l
```

2. **Check for parallel requests**:
```bash
grep -r "Promise.all" src/
grep -r "await.*await" src/
```
   - Sequential awaits slow down responses
   - Opportunities for parallelization

3. **Database query patterns**:
   - Check for N+1 queries
   - Look for missing indexes
   - Identify slow queries

**Findings**:
```markdown
### External Dependencies

**API Calls**: X total found

**Issues**:
1. Sequential calls to 3 APIs - add 300ms latency
2. Database N+1 query pattern
3. No timeout on external fetch

**Recommendations**:
- Use Promise.all for parallel API calls
- Batch database queries
- Add 10s timeout to all fetches
```

### Phase 8: Performance Report Generation

Compile all findings into prioritized report:

```markdown
# Workers Performance Analysis Report

**Worker**: [worker-name]
**Analyzed**: [timestamp]
**Bundle Size**: X KB (Y% of limit)

## Summary

**Performance Grade**: [A/B/C/D/F]
- Bundle: [Excellent/Good/Fair/Poor]
- Caching: [Excellent/Good/Fair/Poor]
- Memory: [Excellent/Good/Fair/Poor]
- Cold Start: [Excellent/Good/Fair/Poor]
- CPU Time: [Excellent/Good/Fair/Poor]

## Critical Issues (Fix Immediately)

1. **[Issue]** - Impact: [High/Medium/Low]
   - Problem: [Description]
   - Fix: [Step-by-step]
   - Estimated Improvement: [X% faster / X KB smaller]

2. **[Issue]** - Impact: [High/Medium/Low]
   - Problem: [Description]
   - Fix: [Step-by-step]
   - Estimated Improvement: [X% faster / X KB smaller]

## Optimization Opportunities (Recommended)

1. **[Opportunity]**
   - Current: [Current state]
   - Recommended: [What to do]
   - Benefit: [Expected improvement]
   - Effort: [Low/Medium/High]

2. **[Opportunity]**
   - Current: [Current state]
   - Recommended: [What to do]
   - Benefit: [Expected improvement]
   - Effort: [Low/Medium/High]

## Quick Wins (Easy Improvements)

1. **[Quick fix]** - 5 minutes, [X%] improvement
2. **[Quick fix]** - 10 minutes, [X%] improvement
3. **[Quick fix]** - 5 minutes, [X KB] reduction

## Long-Term Improvements

1. **[Strategic improvement]**
   - Timeline: [Estimated time]
   - Complexity: [Low/Medium/High]
   - Impact: [Expected improvement]

## Benchmarks

**Current Performance**:
- Bundle Size: X KB
- Avg Response Time: X ms (estimated)
- Cold Start: ~X ms (estimated)

**After Optimizations** (estimated):
- Bundle Size: X KB (-Y%)
- Avg Response Time: X ms (-Y%)
- Cold Start: ~X ms (-Y%)

## Next Steps

1. [Prioritized action 1]
2. [Prioritized action 2]
3. [Prioritized action 3]

## Resources

- Bundle Optimization: Load workers-performance skill
- Caching Guide: https://developers.cloudflare.com/workers/examples/cache-using-fetch/
- Performance Best Practices: Load workers-performance skill references/caching-strategies.md
```

### Phase 9: Interactive Fix Application

For each critical issue, ask:

**Question**: "Apply fix for [issue name]?"
- Options:
  - Yes, apply this fix (Recommended)
  - Skip this fix
  - Show me the changes first
  - Stop asking, I'll fix manually

**If "Yes"**:
- Apply the specific optimization
- Verify change doesn't break functionality
- Move to next issue

**If "Show changes"**:
- Display exact diff
- Ask for confirmation
- Apply if approved

### Phase 10: Validation

After applying fixes:

1. **Rebuild and check size**:
```bash
bunx wrangler deploy --dry-run --outdir=.wrangler-output
du -h .wrangler-output/
```

2. **Compare before/after**:
   - Bundle size reduction
   - Estimated performance improvement

3. **Run tests** (if exist):
```bash
npm test
```
   - Ensure optimizations didn't break functionality

## Optimization Checklist

### Bundle Optimization
- [ ] Remove unused dependencies
- [ ] Replace large libraries with lightweight alternatives
- [ ] Use dynamic imports for code splitting
- [ ] Enable tree-shaking in build config
- [ ] Minify and compress output

### Caching Optimization
- [ ] Implement Cache API for repeated requests
- [ ] Add Cache-Control headers
- [ ] Cache external API responses
- [ ] Use stale-while-revalidate pattern
- [ ] Set appropriate TTLs

### Memory Optimization
- [ ] Use WeakMap for automatic cleanup
- [ ] Stream large request/response bodies
- [ ] Clear large objects after use
- [ ] Avoid global state accumulation
- [ ] Use pagination for large datasets

### Cold Start Optimization
- [ ] Remove top-level await
- [ ] Lazy load heavy dependencies
- [ ] Move initialization to request handler
- [ ] Store large data externally (KV/R2)
- [ ] Minimize module-level computation

### CPU Optimization
- [ ] Optimize algorithm complexity
- [ ] Use async operations
- [ ] Simplify regex patterns
- [ ] Stream large JSON payloads
- [ ] Cache expensive computations

## Error Handling

**If analysis fails**:
- Provide partial results
- Explain what couldn't be analyzed
- Suggest manual investigation

**If fixes break tests**:
- Rollback the specific change
- Explain why it failed
- Suggest alternative approach

## Success Criteria

Optimization is successful when:
- ✅ Performance analysis completed
- ✅ Issues prioritized by impact
- ✅ Recommendations provided with steps
- ✅ Fixes applied (if user requested)
- ✅ Validation shows improvement
- ✅ Tests still passing

## Tips for Claude

1. **Measure first**: Always get baseline before optimizing
2. **Prioritize impact**: Focus on highest-impact fixes first
3. **Be specific**: Provide exact line numbers and code changes
4. **Explain trade-offs**: Some optimizations have downsides
5. **Validate thoroughly**: Ensure optimizations don't break functionality
6. **Reference docs**: Link to relevant performance guides
7. **Be realistic**: Give honest estimates of improvement

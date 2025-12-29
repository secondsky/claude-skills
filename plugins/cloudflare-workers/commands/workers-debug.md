---
name: cloudflare-workers:debug
description: Interactive debugging workflow for Cloudflare Workers. Diagnoses deployment errors, runtime issues, and performance problems with step-by-step fixes.
allowed-tools:
  - Read
  - Grep
  - Bash
  - AskUserQuestion
  - Glob
---

# Workers Debug Command

Interactive debugging assistant for diagnosing and fixing Cloudflare Workers issues.

## Execution Workflow

### Phase 1: Error Category Identification

Use AskUserQuestion to understand the problem type:

**Question**: "What type of issue are you experiencing?"
- Options:
  - Deployment Error (wrangler deploy fails)
  - Runtime Error (worker crashes or returns 500)
  - Performance Issue (slow responses, timeouts)
  - Build Error (bundling or compilation fails)
  - Binding Error (D1, KV, R2, DO not working)
  - Authentication Error (wrangler login issues)

### Phase 2: Specific Error Details

Based on category, ask follow-up questions:

**If Deployment Error**:
- "What error message did you receive?"
- "Does `wrangler whoami` work?"
- "Are you deploying to a zone-scoped worker or workers.dev?"

**If Runtime Error**:
- "What's the exact error message or status code?"
- "Does this happen on all requests or specific routes?"
- "Are you using any bindings (D1, KV, R2, DO)?"

**If Performance Issue**:
- "What's the expected vs. actual response time?"
- "When did the slowness start?"
- "Is this affecting all routes or specific endpoints?"

**If Build Error**:
- "What's the build error message?"
- "What bundler are you using (Vite, Webpack, esbuild)?"
- "Did you recently add dependencies?"

**If Binding Error**:
- "Which binding is failing (D1, KV, R2, DO, Queue)?"
- "What's the error message?"
- "Is the binding configured in wrangler.jsonc?"

**If Authentication Error**:
- "What command are you running?"
- "Have you run `wrangler login` recently?"
- "Are you using API tokens or OAuth?"

### Phase 3: Investigation - Read Relevant Files

Based on error category, read files to diagnose:

**For ALL categories**:
1. Read `wrangler.jsonc` or `wrangler.toml`
2. Check `package.json` for dependencies
3. Look for recent git changes: `git log -5 --oneline`

**For Deployment Errors**:
4. Check `wrangler whoami` output
5. Check routes configuration
6. Look for compatibility flags

**For Runtime Errors**:
4. Read main worker file (`src/index.ts` common location)
5. Check for uncaught exceptions
6. Review error handling patterns

**For Build Errors**:
4. Read `vite.config.ts` or `webpack.config.js`
5. Check `tsconfig.json` for misconfigurations
6. Review recent package.json changes

**For Binding Errors**:
4. Verify binding configuration in wrangler config
5. Check binding usage in worker code
6. Verify binding names match

### Phase 4: Diagnosis - Identify Root Cause

Analyze findings to determine the issue:

**Common Deployment Errors**:

**Error**: "Authentication required"
- **Cause**: Not logged in or token expired
- **Fix**: Run `wrangler login` or refresh API token

**Error**: "Route already exists"
- **Cause**: Conflicting routes in different workers
- **Fix**: Check Cloudflare dashboard for route conflicts

**Error**: "Bundle too large"
- **Cause**: Worker exceeds 1MB limit (free) or 10MB (paid)
- **Fix**: Reduce dependencies, use code splitting

**Common Runtime Errors**:

**Error**: "Uncaught TypeError: Cannot read property"
- **Cause**: Accessing undefined object/variable
- **Fix**: Add null checks, use optional chaining

**Error**: "D1_ERROR: no such table"
- **Cause**: Database table doesn't exist or migration not run
- **Fix**: Run migrations with `wrangler d1 execute`

**Error**: "KV.get is not a function"
- **Cause**: Binding name mismatch or not configured
- **Fix**: Verify binding name in wrangler.jsonc matches code

**Common Performance Issues**:

**Symptom**: Slow response times (>1s)
- **Causes**: Large bundle, no caching, slow external APIs
- **Fixes**: Enable Cache API, reduce bundle, optimize queries

**Symptom**: CPU time exceeded
- **Causes**: Heavy computation, large loops, inefficient algorithms
- **Fixes**: Optimize algorithms, use async operations, cache results

**Common Build Errors**:

**Error**: "Module not found"
- **Cause**: Missing dependency or incorrect import path
- **Fix**: Install dependency or fix import path

**Error**: "TypeScript errors"
- **Cause**: Type mismatches, strict mode violations
- **Fix**: Fix type errors or adjust tsconfig.json

### Phase 5: Fix Recommendation

Provide specific, actionable fix for the identified issue:

**Format**:
```markdown
## Root Cause
[Explanation of what's causing the issue]

## Fix
[Step-by-step instructions]

## Prevention
[How to avoid this in the future]

## Related
[Links to relevant docs or skills]
```

**Example**:
```markdown
## Root Cause
Your Worker is failing because the KV binding name in code (`CACHE`) doesn't match
the binding name in wrangler.jsonc (`MY_KV`).

## Fix
1. Open wrangler.jsonc
2. Change the KV binding name to match your code:
   ```jsonc
   {
     "kv_namespaces": [
       { "binding": "CACHE", "id": "xxx" }
     ]
   }
   ```
3. Redeploy: `bunx wrangler deploy`

Alternatively, update your code to use `MY_KV` instead of `CACHE`.

## Prevention
- Use consistent naming between config and code
- Define binding types in TypeScript for autocomplete
- Add binding name validation in CI/CD

## Related
- workers-testing skill: Mock KV bindings in tests
- Binding Docs: https://developers.cloudflare.com/workers/configuration/bindings/
```

### Phase 6: Apply Fix (Optional)

Ask user if they want help applying the fix:

**Question**: "Would you like me to apply this fix?"
- Options:
  - Yes, apply the fix automatically (Recommended)
  - No, I'll apply it manually
  - Show me the exact changes first

**If "Yes"**:
- Use Edit or Write tools to apply fix
- Run validation command if applicable
- Confirm fix was applied successfully

**If "Show changes first"**:
- Display exact diff of proposed changes
- Ask for confirmation before applying

### Phase 7: Verification

After fix is applied (or user applies manually):

**Guide verification**:

**For Deployment Issues**:
```bash
bunx wrangler deploy
```
- Should deploy successfully
- No authentication or configuration errors

**For Runtime Issues**:
```bash
bunx wrangler dev
```
- Test the route that was failing
- Verify error is resolved

**For Build Issues**:
```bash
npm run build
```
- Build should complete without errors
- Check bundle size is reasonable

**For Performance Issues**:
- Test response time
- Check `wrangler tail` for CPU time warnings
- Verify caching is working

### Phase 8: Summary & Prevention

Provide summary with prevention tips:

```markdown
✅ Issue Resolved!

**Problem**: [Brief description]
**Fix Applied**: [What was changed]
**Verification**: [How we confirmed it works]

**To Prevent This**:
1. [Prevention tip 1]
2. [Prevention tip 2]
3. [Prevention tip 3]

**Monitoring**:
- Watch logs: `wrangler tail`
- Check metrics: Cloudflare Dashboard
- Set up alerts for errors

**Need More Help?**
- Load workers-observability skill for debugging techniques
- Load workers-performance skill for optimization tips
- Ask specific questions about your issue
```

## Debugging Tools Reference

### For Live Debugging

**wrangler tail**: Real-time logs
```bash
bunx wrangler tail --env production
```

**wrangler dev**: Local development with debugging
```bash
bunx wrangler dev --local --show-interactive-dev-session
```

### For Code Analysis

**Grep for errors**: Find error patterns
```bash
grep -r "catch (e)" src/
```

**Check imports**: Find missing dependencies
```bash
grep -r "from '" src/ | sort | uniq
```

### For Performance Analysis

**Bundle size**: Check worker size
```bash
bunx wrangler deploy --dry-run --outdir=dist
du -h dist/
```

**CPU profiling**: Use Chrome DevTools with wrangler dev

## Common Error Patterns

### Error Pattern 1: Binding Not Found

**Symptoms**:
- `ReferenceError: DB is not defined`
- `TypeError: Cannot read property 'prepare' of undefined`

**Diagnosis**:
- Check wrangler.jsonc for binding configuration
- Verify binding name matches code
- Ensure binding exists in Cloudflare account

### Error Pattern 2: Module Resolution

**Symptoms**:
- `Module not found: Can't resolve './utils'`
- `Cannot find module '@/lib/helpers'`

**Diagnosis**:
- Check file exists at import path
- Verify tsconfig.json paths configuration
- Check for case sensitivity (utils vs Utils)

### Error Pattern 3: Runtime Exceptions

**Symptoms**:
- Worker returns 500
- `Uncaught TypeError` in logs
- Request fails silently

**Diagnosis**:
- Check wrangler tail for stack traces
- Add try-catch blocks
- Verify all async operations are awaited

## Error Handling

**If unable to diagnose**:
1. Collect all available information
2. Suggest checking wrangler tail for more details
3. Recommend loading workers-observability skill
4. Provide Cloudflare community links for support

**If fix doesn't work**:
1. Verify fix was applied correctly
2. Check for additional related issues
3. Suggest alternative approaches
4. Escalate to manual investigation

## Success Criteria

Debugging is successful when:
- ✅ Issue root cause identified
- ✅ Fix provided with clear steps
- ✅ Fix applied (if user requested)
- ✅ Issue verified as resolved
- ✅ Prevention tips provided

## Tips for Claude

1. **Be methodical**: Follow diagnostic process step-by-step
2. **Ask clarifying questions**: Don't assume, get specific details
3. **Read before guessing**: Always check actual code/config
4. **Test fixes**: Verify the fix actually resolves the issue
5. **Explain clearly**: Use simple language, avoid jargon
6. **Provide context**: Explain why the error happened
7. **Prevent recurrence**: Give tips to avoid future issues

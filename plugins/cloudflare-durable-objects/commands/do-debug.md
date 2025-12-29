---
name: cloudflare-durable-objects:debug
description: Interactive Durable Objects debugging workflow. Diagnoses common DO errors, configuration issues, and runtime problems with step-by-step troubleshooting.
---

# Durable Objects Debug Command

Interactive command to diagnose and fix common Durable Objects issues. Provides step-by-step troubleshooting for configuration errors, runtime failures, and performance problems.

## Overview

This command helps debug DO issues by:

- Detecting common error patterns from error messages
- Running diagnostic checks on configuration and code
- Providing specific fixes for identified issues
- Testing solutions before deployment
- Monitoring DO behavior with wrangler tail

## Step 1: Gather Error Context

Use AskUserQuestion tool to understand the problem:

### Question 1: Error Category
**Question**: "What type of issue are you experiencing with Durable Objects?"
**Header**: "Issue Type"
**Options**:
- **Deployment Error** - wrangler deploy fails with DO-related error
  - Description: "Migration errors, binding issues, class export problems"
- **Runtime Error** - DO throws error during execution
  - Description: "Constructor failures, storage errors, WebSocket issues"
- **Performance Issue** - DO is slow or timing out
  - Description: "Slow queries, hibernation problems, memory issues"
- **Data Loss** - DO state not persisting correctly
  - Description: "Data disappearing, inconsistent state, sync issues"
- **WebSocket Problem** - WebSocket connections failing or not hibernating
  - Description: "Connection drops, hibernation failures, message loss"
- **Alarm Not Firing** - Scheduled alarms not executing
  - Description: "Alarms not triggering, retry loops, timing issues"
- **Other/Unknown** - Not sure or different issue
  - Description: "General debugging assistance needed"

### Question 2: Error Message (If Applicable)

If user selected error-based category (Deployment, Runtime):

**Prompt**: "Please paste the full error message:"

```
Enter error message (or 'none' if no specific error):
_____________________________________________
_____________________________________________
_____________________________________________
```

Parse error message for known patterns:

**Deployment Error Patterns:**
- `"class_name" not found` → Class export missing
- `migrations required` → Missing migration
- `binding not found` → Binding misconfiguration
- `module not found` → Import path issue

**Runtime Error Patterns:**
- `constructor failed` → Constructor timeout/error
- `SQL error` → Query syntax or schema issue
- `WebSocket` → Hibernation or connection issue
- `alarm` → Alarm handler error
- `storage limit exceeded` → 1GB/128MB limit reached

### Question 3: When Does It Occur?

**Question**: "When does this issue occur?"
**Header**: "Timing"
**Options**:
- **During Deployment** - wrangler deploy fails
  - Description: "Error happens when deploying to Cloudflare"
- **On First Request** - First DO creation/access fails
  - Description: "Error when creating new DO instance"
- **After Some Time** - Works initially, fails later
  - Description: "Issue appears after DO has been running"
- **Intermittently** - Sometimes works, sometimes fails
  - Description: "Inconsistent behavior, hard to reproduce"
- **Under Load** - Only happens with high traffic
  - Description: "Works in testing, fails in production"

### Question 4: Recent Changes

**Question**: "Have you made any recent changes to your Durable Objects configuration or code?"
**Header**: "Recent Changes"
**Options (multiselect)**:
- Added new DO class
- Renamed DO class
- Modified storage queries
- Changed WebSocket handling
- Updated alarms logic
- Changed package versions
- Modified wrangler.jsonc
- No recent changes

## Step 2: Run Diagnostic Checks

Based on error category and context, run relevant diagnostic checks:

### Check 1: Configuration Validation

Run validation script:

```bash
./scripts/validate-do-config.sh
```

Parse output for errors:

**Common Configuration Issues:**

1. **Missing Class Export**
   ```
   Error: Class 'MyDO' not found in src/index.ts
   ```

   **Fix:**
   ```typescript
   // src/index.ts
   export class MyDO extends DurableObject { ... }

   // Or if in separate file:
   export { MyDO } from "./MyDO";
   ```

2. **Missing Migration**
   ```
   Error: No migrations found in configuration
   ```

   **Fix:**
   ```jsonc
   "migrations": [
     {
       "tag": "v1",
       "new_sqlite_classes": ["MyDO"]
     }
   ]
   ```

3. **Binding Name Mismatch**
   ```
   Error: Binding 'MY_DO' references class 'MyDO' but class not in migrations
   ```

   **Fix:** Add class to migrations or update binding to match existing class.

### Check 2: Code Analysis

Read DO class implementation and check for common issues:

#### Constructor Validation

```bash
# Find DO constructor
grep -A 20 "constructor(ctx: DurableObjectState" src/*.ts
```

**Common Constructor Issues:**

1. **Long-Running Constructor**
   ```typescript
   // ❌ BAD: Heavy work in constructor (blocks all requests)
   constructor(ctx: DurableObjectState, env: Env) {
     super(ctx, env);
     await this.heavyInitialization(); // Blocks!
   }
   ```

   **Fix:**
   ```typescript
   // ✅ GOOD: Use blockConcurrencyWhile for critical initialization only
   constructor(ctx: DurableObjectState, env: Env) {
     super(ctx, env);

     this.ctx.blockConcurrencyWhile(async () => {
       // Only critical schema setup here
       await this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS ...`);
     });
   }
   ```

2. **Missing super() Call**
   ```typescript
   // ❌ BAD: Forgot super()
   constructor(ctx: DurableObjectState, env: Env) {
     this.ctx = ctx; // Error!
   }
   ```

   **Fix:**
   ```typescript
   // ✅ GOOD: Always call super() first
   constructor(ctx: DurableObjectState, env: Env) {
     super(ctx, env);
   }
   ```

#### Storage API Validation

```bash
# Find SQL queries
grep -r "storage.sql.exec" src/
```

**Common Storage Issues:**

1. **SQL Syntax Errors**
   ```typescript
   // ❌ BAD: Invalid SQL
   await this.ctx.storage.sql.exec("SELECT * FORM users");
   //                                        ^^^^ typo!
   ```

   **Fix:** Check SQL syntax, use SQLite documentation

2. **Transaction Handling**
   ```typescript
   // ❌ BAD: Nested transactions not supported
   await this.ctx.storage.sql.exec("BEGIN TRANSACTION");
   await this.ctx.storage.sql.exec("BEGIN TRANSACTION"); // Error!
   ```

   **Fix:** Use single transaction, avoid nesting

3. **Storage Limit Exceeded**
   ```typescript
   // ❌ Exceeds 1GB SQL limit or 128MB KV limit
   ```

   **Fix:** Implement archiving pattern (see templates/ttl-cleanup-do.ts)

#### WebSocket Validation

```bash
# Check WebSocket implementation
grep -r "acceptWebSocket\|webSocketMessage\|webSocketClose" src/
```

**Common WebSocket Issues:**

1. **setTimeout/setInterval in DO**
   ```typescript
   // ❌ BAD: Breaks hibernation!
   webSocketMessage(ws: WebSocket, message: string) {
     setTimeout(() => { ... }, 5000); // Never hibernates!
   }
   ```

   **Fix:**
   ```typescript
   // ✅ GOOD: Use alarms for delayed execution
   webSocketMessage(ws: WebSocket, message: string) {
     await this.ctx.storage.setAlarm(Date.now() + 5000);
   }
   ```

2. **Outgoing WebSocket Connections**
   ```typescript
   // ❌ BAD: Outgoing WebSockets don't hibernate
   const ws = new WebSocket("wss://external.com");
   ```

   **Fix:** Only server-side (accepted) WebSockets hibernate

3. **Missing Hibernation Tags**
   ```typescript
   // ⚠️ Without tags, all messages wake DO
   this.ctx.acceptWebSocket(ws); // No tags
   ```

   **Fix:**
   ```typescript
   // ✅ With tags, filter messages efficiently
   this.ctx.acceptWebSocket(ws, ["chat", "presence"]);
   ```

#### Alarm Validation

```bash
# Check alarm implementation
grep -r "async alarm()\|setAlarm\|getAlarm" src/
```

**Common Alarm Issues:**

1. **Alarm Handler Throws Error**
   ```typescript
   async alarm() {
     throw new Error("boom"); // Retries forever!
   }
   ```

   **Fix:**
   ```typescript
   async alarm() {
     try {
       // Do work
     } catch (error) {
       console.error("Alarm failed:", error);
       // Reschedule or give up
       await this.ctx.storage.setAlarm(Date.now() + 60000);
       // Don't throw (or retry will loop forever)
     }
   }
   ```

2. **Not Idempotent**
   ```typescript
   async alarm() {
     await this.ctx.storage.sql.exec(
       "INSERT INTO logs (message) VALUES ('alarm fired')" // Fails on retry!
     );
   }
   ```

   **Fix:**
   ```typescript
   async alarm() {
     // Use UPSERT or check before inserting
     await this.ctx.storage.sql.exec(
       `INSERT INTO logs (id, message) VALUES (1, 'alarm fired')
        ON CONFLICT(id) DO UPDATE SET message = excluded.message`
     );
   }
   ```

### Check 3: Runtime Monitoring

Use wrangler tail to observe DO behavior in real-time:

```bash
wrangler tail
```

**What to Look For:**

1. **Error Logs**
   - Stack traces
   - SQL errors
   - WebSocket failures

2. **Performance Metrics**
   - Request duration
   - Query execution time
   - Memory usage

3. **DO Lifecycle Events**
   - Constructor calls
   - Alarm executions
   - WebSocket connections/disconnections

**Common Patterns:**

- **Constructor called repeatedly**: Likely crashing and restarting
- **Alarm firing every second**: Retry loop detected
- **WebSocket connect/disconnect spam**: Hibernation not working

## Step 3: Identify Root Cause

Based on diagnostic results, categorize the issue:

### Category A: Configuration Error

**Symptoms:**
- Deployment fails
- `wrangler deploy` shows validation errors
- Binding not found

**Root Causes:**
1. Missing or incorrect migration
2. Class not exported
3. Binding name mismatch
4. Invalid wrangler.jsonc syntax

**Solution Path:** Fix configuration → Validate → Deploy

### Category B: Code Error

**Symptoms:**
- Runtime exceptions
- DO crashes on creation
- Methods throw errors

**Root Causes:**
1. Constructor issues (long-running, missing super())
2. SQL syntax errors
3. Logic bugs in DO methods

**Solution Path:** Fix code → Test locally → Deploy

### Category C: Hibernation Failure

**Symptoms:**
- WebSocket never hibernates
- High CPU/memory usage
- Unexpected DO restarts

**Root Causes:**
1. setTimeout/setInterval usage
2. Pending fetch() requests
3. Outgoing WebSocket connections
4. Infinite loops

**Solution Path:** Remove hibernation blockers → Test → Monitor

### Category D: Storage Issues

**Symptoms:**
- Data loss
- Inconsistent state
- Storage limit exceeded

**Root Causes:**
1. Not using storage.put() correctly
2. Forgetting to await storage operations
3. Exceeding 1GB SQL / 128MB KV limits

**Solution Path:** Fix storage logic → Implement TTL/archiving → Test

### Category E: Performance Issues

**Symptoms:**
- Slow response times
- Timeouts
- High latency

**Root Causes:**
1. Slow SQL queries (missing indexes)
2. Large data transfers
3. Blocking operations in constructor

**Solution Path:** Optimize queries → Add indexes → Profile

## Step 4: Provide Specific Fix

Based on identified root cause, provide actionable fix:

### Fix Template

```
🔍 Diagnosis: [ISSUE_NAME]

Root Cause:
  [Explanation of what's causing the issue]

Evidence:
  - [Diagnostic finding 1]
  - [Diagnostic finding 2]

Fix:
  [Step-by-step instructions]

Code Changes Required:
  [Specific code snippets to add/modify]

Testing:
  1. [How to test the fix locally]
  2. [How to verify in production]

Deploy:
  wrangler deploy

Monitor:
  wrangler tail [--filter ...]

Verification:
  [How to confirm the issue is resolved]
```

### Example Fix: Missing Migration

```
🔍 Diagnosis: Missing Durable Objects Migration

Root Cause:
  Your Durable Object class 'MyDO' is defined and exported,
  but not registered in the migrations array. Cloudflare requires
  all DO classes to have a migration entry.

Evidence:
  - Class exported: ✅ export class MyDO extends DurableObject
  - Binding configured: ✅ "MY_DO" → "MyDO"
  - Migration entry: ❌ Not found in migrations array

Fix:

1. Open wrangler.jsonc

2. Add migration to migrations array:

   {
     "migrations": [
       {
         "tag": "v1",
         "new_sqlite_classes": ["MyDO"]
       }
     ]
   }

   Or use the migration generator:
   ./scripts/migration-generator.sh --new MyDO

3. Validate configuration:
   ./scripts/validate-do-config.sh

4. Deploy:
   wrangler deploy

Testing:
  After deployment, test DO creation:
  curl https://your-worker.workers.dev?id=test

Verification:
  - Deployment succeeds without migration error
  - DO instances can be created
  - No "migration required" errors in logs
```

### Example Fix: WebSocket Hibernation Failure

```
🔍 Diagnosis: WebSocket Hibernation Blocked by setTimeout

Root Cause:
  Your DO uses setTimeout() which prevents WebSocket hibernation.
  Durable Objects can only hibernate when NO timers or pending
  I/O operations exist.

Evidence:
  - Found setTimeout() in webSocketMessage handler (line 45)
  - WebSocket connections never show as hibernated in logs
  - High memory usage (DO never releases resources)

Fix:

1. Replace setTimeout with Alarms API

   ❌ BEFORE:
   ```typescript
   webSocketMessage(ws: WebSocket, message: string) {
     setTimeout(async () => {
       ws.send("delayed message");
     }, 5000);
   }
   ```

   ✅ AFTER:
   ```typescript
   webSocketMessage(ws: WebSocket, message: string) {
     // Store message metadata for alarm
     await this.ctx.storage.put("pendingMessage", {
       wsId: ws.serialize(), // Serialize WebSocket state
       message: "delayed message",
       timestamp: Date.now()
     });

     // Schedule alarm
     await this.ctx.storage.setAlarm(Date.now() + 5000);
   }

   async alarm() {
     const pending = await this.ctx.storage.get("pendingMessage");
     if (!pending) return;

     // Get WebSocket from serialized state
     const websockets = this.ctx.getWebSockets();
     const ws = websockets.find(w => w.serializeAttachment() === pending.wsId);

     if (ws) {
       ws.send(pending.message);
     }

     await this.ctx.storage.delete("pendingMessage");
     // Don't reschedule (one-time alarm)
   }
   ```

2. Remove all other setTimeout/setInterval usages

3. Test locally:
   wrangler dev
   # Connect WebSocket, send message, verify alarm fires

4. Deploy:
   wrangler deploy

5. Monitor hibernation:
   wrangler tail
   # Look for hibernation log messages

Verification:
  - No more setTimeout() in code
  - WebSocket shows as hibernated in logs
  - Memory usage drops after inactivity
  - Alarms fire correctly with 5-second delay

Documentation:
  - Load references/websocket-hibernation.md for details
  - Load references/alarms-api.md for alarm patterns
```

## Step 5: Test Fix Locally

Guide user through local testing:

### Start Local Development

```bash
wrangler dev
```

### Test DO Creation

```bash
# Create/access DO instance
curl "http://localhost:8787?id=test-123"
```

### Monitor Logs

Watch console output for:
- Constructor execution
- SQL queries
- WebSocket connections
- Alarm firing
- Any errors

### Verify Fix

Based on issue type:

**For Configuration Issues:**
- Check deployment succeeds
- Verify DO binding accessible

**For Runtime Issues:**
- Trigger the failing code path
- Confirm error no longer occurs

**For Performance Issues:**
- Measure response times
- Check query execution duration

**For WebSocket Issues:**
- Connect WebSocket client
- Send/receive messages
- Verify hibernation occurs (check logs after 30s inactivity)

**For Alarm Issues:**
- Schedule alarm
- Wait for execution
- Verify alarm handler runs

## Step 6: Deploy and Monitor

Guide production deployment:

### Deploy Changes

```bash
wrangler deploy
```

### Monitor Production

```bash
wrangler tail
```

**Filter for specific patterns:**

```bash
# Filter by DO name
wrangler tail --filter "MyDO"

# Filter by error level
wrangler tail --filter "error"

# Filter by WebSocket events
wrangler tail --filter "websocket"
```

### Verify in Production

Create checklist based on issue:

**For All Issues:**
- [ ] Deployment succeeds
- [ ] No errors in wrangler tail
- [ ] DO instances create successfully

**For WebSocket Issues:**
- [ ] WebSocket connections accepted
- [ ] Messages sent/received correctly
- [ ] Hibernation occurs after inactivity
- [ ] Reconnection works after hibernation

**For Alarm Issues:**
- [ ] Alarms schedule successfully
- [ ] Alarm handler executes
- [ ] No infinite retry loops

**For Storage Issues:**
- [ ] Data persists across requests
- [ ] Queries execute successfully
- [ ] No storage limit errors

## Step 7: Provide Additional Help

Offer follow-up assistance based on issue resolution:

### If Issue Resolved

```
✅ Issue Resolved!

Summary:
  - Issue: [ISSUE_NAME]
  - Root Cause: [CAUSE]
  - Fix Applied: [FIX_DESCRIPTION]

Verification Complete:
  ✅ Local testing passed
  ✅ Deployment successful
  ✅ Production monitoring shows no errors

Recommendations:
  - Monitor for [X] hours to ensure stability
  - Add tests to prevent regression (see templates/vitest-do-test.ts)
  - Document the fix for team reference

Related Resources:
  - Load references/best-practices.md for production patterns
  - Load references/monitoring-debugging.md for debugging techniques
```

### If Issue Persists

```
⚠️ Issue Not Fully Resolved

Status:
  - Diagnostic complete
  - Fix attempted
  - Issue still occurring

Next Steps:

1. Gather more information:
   - Enable verbose logging
   - Capture full stack traces
   - Record exact reproduction steps

2. Check advanced scenarios:
   - Load references/top-errors.md for rare issues
   - Load references/performance-optimization.md
   - Review Cloudflare status page

3. Consider alternative solutions:
   - [Alternative approach 1]
   - [Alternative approach 2]

4. Escalate if needed:
   - Cloudflare Community: community.cloudflare.com
   - Cloudflare Discord: discord.gg/cloudflaredev
   - Support ticket: dash.cloudflare.com (for paid plans)

Debug Data to Include:
  - wrangler.jsonc (sanitized)
  - Error messages (full text)
  - Wrangler tail logs
  - Reproduction steps
  - Worker code (relevant sections)
```

## Error Pattern Reference

Quick reference for common error patterns:

### Deployment Errors

| Error Message | Root Cause | Fix |
|---------------|------------|-----|
| `"class_name" not found` | Class not exported | Add `export class ...` |
| `migrations required` | Missing migration | Add to migrations array |
| `binding not found` | Binding misconfigured | Fix binding in wrangler.jsonc |
| `module not found` | Import path wrong | Fix import statement |
| `validation error` | Invalid wrangler.jsonc | Check JSON syntax |

### Runtime Errors

| Error Message | Root Cause | Fix |
|---------------|------------|-----|
| `constructor failed` | Constructor timeout/error | Reduce constructor work |
| `SQL error: syntax` | Invalid SQL query | Fix SQL syntax |
| `storage limit exceeded` | >1GB SQL or >128MB KV | Implement TTL cleanup |
| `WebSocket error` | Hibernation blocked | Remove setTimeout |
| `alarm retry` | Alarm handler throws | Add try/catch |

### Performance Issues

| Symptom | Root Cause | Fix |
|---------|------------|-----|
| Slow queries | Missing indexes | Add SQL indexes |
| High latency | Blocking constructor | Move work to request handler |
| Timeout | Large data transfer | Paginate results |
| Memory growth | No cleanup | Implement TTL pattern |

## Related Commands and Resources

After debugging, recommend:

- **Configuration**: `/do-setup` for starting fresh
- **Migration**: `/do-migrate` for migration issues
- **Testing**: Load `templates/vitest-do-test.ts`
- **Patterns**: Load `references/best-practices.md`
- **Monitoring**: Load `references/monitoring-debugging.md`

## Success Criteria

Debugging is successful when:
- ✅ Root cause identified with evidence
- ✅ Specific fix provided and applied
- ✅ Local testing confirms fix works
- ✅ Production deployment succeeds
- ✅ Monitoring shows no recurrence
- ✅ User understands issue and prevention

---
name: cloudflare-workflows:debug
description: Interactive debugging for failing workflow instances. Use when user reports workflow errors, instances stuck, or deployment failures.
---

# Workflow Debug

## Overview

Interactive debugging assistant for Cloudflare Workflow instances with step-by-step diagnosis.

## Prerequisites

- wrangler CLI authenticated
- Workflow deployed to Cloudflare
- Instance ID or workflow name

## Steps

### Step 1: Identify Instance

Use AskUserQuestion:

**Question**: "Which workflow instance needs debugging?"
- **Header**: "Instance"
- **Question**: "How would you like to identify the instance?"
- **multiSelect**: false
- **Options**:
  - **label**: "I have instance ID"
  - **description**: "Provide specific instance ID to debug"

  - **label**: "Show recent instances"
  - **description**: "List recent instances and select one"

  - **label**: "Show failed instances"
  - **description**: "List only failed instances"

**If "I have instance ID"**:
- Ask for: workflow name + instance ID

**If "Show recent instances"**:
```bash
wrangler workflows instances list ${workflowName} --limit 10
```
Display instances, ask user to select one

**If "Show failed instances"**:
```bash
wrangler workflows instances list ${workflowName} --status errored --limit 10
```

---

### Step 2: Fetch Instance Details

```bash
wrangler workflows instances describe ${workflowName} ${instanceId}
```

**Parse Output**:
- Status (running, complete, errored)
- Error message (if failed)
- Step history (which steps completed)
- Last step executed
- Retry count

**Display**:
```
Instance Details:
- ID: ${instanceId}
- Status: ${status}
- Steps Completed: ${stepsCompleted} / ${totalSteps}
- Last Step: ${lastStep}
- Error: ${errorMessage}
```

---

### Step 3: Diagnose Issue

**Based on status**, provide diagnosis:

#### If Status = "errored":

Check error message patterns:

**Pattern 1**: "Cannot perform I/O on behalf of different request"
- **Diagnosis**: I/O outside step.do()
- **Solution**: Move I/O inside step.do() callbacks
- **Reference**: Load `references/common-issues.md` #1

**Pattern 2**: "NonRetryableError"
- **Diagnosis**: Permanent failure
- **Solution**: Check error message, fix root cause
- **Reference**: Load `references/common-issues.md` #3

**Pattern 3**: "Serialization error"
- **Diagnosis**: Non-JSON-serializable data
- **Solution**: Return only JSON-compatible types
- **Reference**: Load `references/common-issues.md` #4

**Pattern 4**: "Timeout"
- **Diagnosis**: Step exceeded 30s CPU limit
- **Solution**: Break into smaller steps
- **Reference**: Load `references/common-issues.md` #5

**Pattern 5**: "WorkflowEvent not found"
- **Diagnosis**: Event name mismatch
- **Solution**: Match event names exactly
- **Reference**: Load `references/common-issues.md` #4

---

#### If Status = "running" (stuck):

Check step history:

**If stuck on step.sleep()**: Show wake time
**If stuck on step.waitForEvent()**: Check event trigger

Ask user:
- **Question**: "Instance is stuck. What would you like to do?"
- **Options**:
  - "Wait longer" → Show monitoring command
  - "Terminate instance" → Run terminate command
  - "Investigate step" → Analyze step code

---

### Step 4: Suggest Fixes

**Based on diagnosis**, provide specific fixes:

**For I/O Context Error**:
```typescript
// ❌ Wrong
const data = await fetch('...');
await step.do('use data', async () => {
  return data;
});

// ✅ Correct
const data = await step.do('fetch data', async () => {
  const response = await fetch('...');
  return await response.json();
});
```

**For Serialization Error**:
```typescript
// ❌ Wrong
await step.do('bad', async () => {
  return { fn: () => {} }; // Functions not serializable
});

// ✅ Correct
await step.do('good', async () => {
  return { result: 'data' }; // JSON-serializable
});
```

**For Timeout**:
```typescript
// ❌ Wrong
await step.do('process all', async () => {
  for (let i = 0; i < 10000; i++) {
    // Long computation
  }
});

// ✅ Correct
for (let i = 0; i < 100; i++) {
  await step.do(\`batch \${i}\`, async () => {
    // Process batch of 100
  });
}
```

---

### Step 5: Apply Fixes (Optional)

Ask user:
- **Question**: "Would you like to apply fixes now?"
- **Options**:
  - "Yes - Apply recommended fixes"
  - "No - I'll fix manually"

**If yes**:
1. Read workflow file
2. Apply fixes using Edit tool
3. Re-validate
4. Suggest re-deployment

---

### Step 6: Testing & Monitoring

**Provide testing commands**:

```bash
# Test locally first
wrangler dev

# Then deploy
wrangler deploy

# Monitor new instances
wrangler workflows instances list ${workflowName} --status running

# Watch for errors
wrangler tail ${workerName} --status error
```

**Suggest**:
- Use /workflow-test to create test instance
- Monitor with `wrangler workflows instances describe`
- Check logs with `wrangler tail`

---

### Step 7: Summary

```
Debug Summary:
- Instance: ${instanceId}
- Issue: ${issueSummary}
- Fixes Applied: ${fixesApplied}

Next Steps:
1. ${nextStep1}
2. ${nextStep2}
3. ${nextStep3}

Resources:
- Common issues: references/common-issues.md
- Troubleshooting: references/troubleshooting.md
- Production checklist: references/production-checklist.md
```

---

## Error Handling

**Instance Not Found**: Check workflow name and instance ID
**Not Authenticated**: Run `wrangler login`
**No Access**: Check account permissions

---

## Summary

Interactive debugging in 7 steps:
1. Identify instance (ID, recent, or failed)
2. Fetch instance details (status, steps, errors)
3. Diagnose issue (pattern matching error messages)
4. Suggest fixes (code examples for common issues)
5. Apply fixes (optional auto-fix)
6. Testing & monitoring (deployment commands)
7. Summary & next steps

**When to Use**: Workflow errors, stuck instances, deployment failures.

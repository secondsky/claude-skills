---
name: cloudflare-workflows:test
description: Test workflow instances locally and remotely with validation and metrics. Use when user wants to test workflow execution, validate behavior, or measure performance.
---

# Workflow Test

## Overview

Interactive testing for Cloudflare Workflows with execution monitoring and validation.

## Prerequisites

- wrangler CLI authenticated
- Workflow deployed (for remote testing)
- Worker running locally (for local testing)

## Steps

### Step 1: Select Workflow

Use AskUserQuestion:

**Question**: "Which workflow would you like to test?"
- **Header**: "Workflow"
- **Question**: "Select workflow to test"
- **multiSelect**: false
- **Options**:
  - **label**: "List available workflows"
  - **description**: "Show workflows from wrangler.jsonc"

  - **label**: "Enter workflow name"
  - **description**: "Type workflow name manually"

**If "List available workflows"**:
```bash
# Parse wrangler.jsonc
grep -A 3 "workflows" wrangler.jsonc | grep "name"
```
Display list, ask user to select

---

### Step 2: Choose Test Type

Use AskUserQuestion:

**Question**: "How would you like to test?"
- **Header**: "Test Type"
- **Question**: "Choose testing environment"
- **multiSelect**: false
- **Options**:
  - **label**: "Local Testing (Recommended)"
  - **description**: "Test with wrangler dev (fast, safe)"

  - **label**: "Remote Testing"
  - **description**: "Test deployed workflow (production)"

  - **label**: "Both"
  - **description**: "Local first, then remote"

**Store as**: `testType`

---

### Step 3: Configure Test Parameters

Use AskUserQuestion:

**Question**: "Provide test parameters"
- **Header**: "Parameters"
- **Question**: "Enter workflow parameters as JSON"
- **multiSelect**: false
- **Options**:
  - **label**: "Use default test data"
  - **description**: "Simple test with id: 'test-123'"

  - **label**: "Custom JSON"
  - **description**: "I'll provide specific test data"

**If "Custom JSON"**:
- Ask user to input JSON string
- Validate JSON syntax
- **Store as**: `testParams`

**If "Use default"**:
```json
{
  "id": "test-123",
  "timestamp": "${currentTimestamp}"
}
```

---

### Step 4: Run Local Test (if selected)

**Start dev server**:
```bash
# Start wrangler dev in background
wrangler dev &
DEV_PID=$!

# Wait for startup
sleep 3
```

**Create instance**:
```bash
# Trigger workflow via HTTP endpoint
curl -X POST "http://localhost:8787" \
  -H "Content-Type: application/json" \
  -d '${testParams}'
```

**Capture response**:
- Instance ID
- Initial status
- Timestamp

**Monitor execution**:
```bash
# Poll for completion
while true; do
  STATUS=$(curl -s "http://localhost:8787?instanceId=${instanceId}")
  echo "Status: ${STATUS}"

  if [[ "${STATUS}" == *"complete"* ]]; then
    break
  fi

  sleep 2
done
```

**Display results**:
```
Local Test Results:
- Instance ID: ${instanceId}
- Status: ${finalStatus}
- Duration: ${duration}s
- Result: ${result}
```

**Stop dev server**:
```bash
kill $DEV_PID
```

---

### Step 5: Run Remote Test (if selected)

**Create instance via deployed Worker**:
```bash
# Get Worker URL from wrangler
WORKER_URL=$(wrangler deployments list --name ${workerName} | grep "https://" | head -n 1)

# Create instance
curl -X POST "${WORKER_URL}" \
  -H "Content-Type: application/json" \
  -d '${testParams}'
```

**Monitor with wrangler**:
```bash
# Get instance ID from response
INSTANCE_ID=$(echo "${response}" | jq -r '.id')

# Describe instance
wrangler workflows instances describe ${workflowName} ${INSTANCE_ID}
```

**Poll for completion**:
```bash
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS=$(wrangler workflows instances describe ${workflowName} ${INSTANCE_ID} | grep "Status:")

  echo "Attempt $((ATTEMPT+1))/$MAX_ATTEMPTS: ${STATUS}"

  if [[ "${STATUS}" == *"complete"* ]]; then
    break
  fi

  sleep 2
  ((ATTEMPT++))
done
```

**Display results**:
```
Remote Test Results:
- Instance ID: ${INSTANCE_ID}
- Status: ${finalStatus}
- Duration: ${duration}s
- Steps Completed: ${stepsCompleted}
- Result: ${result}
```

---

### Step 6: Validate Results

Check test outcomes:

**Validation Checks**:
- ✅ Instance created successfully
- ✅ All steps completed
- ✅ No errors in execution
- ✅ Expected output received
- ✅ Duration within acceptable range

**If validation fails**:
```
⚠️  Test Validation Issues:

${validationErrors}

Recommendations:
1. Check error logs: wrangler tail ${workerName}
2. Debug instance: /workflow-debug ${workflowName} ${instanceId}
3. Review workflow logic
```

---

### Step 7: Performance Metrics

Calculate and display metrics:

```
Performance Metrics:
- Total Duration: ${totalDuration}s
- Steps Executed: ${stepsExecuted}
- Average Step Time: ${avgStepTime}s
- Retry Count: ${retryCount}
- Estimated Cost: $${estimatedCost}

Cost Breakdown:
- Requests: ${requestCount} × $0.15/million = $${requestCost}
- Duration: ${durationGBS} GB-s × $0.02/million = $${durationCost}
- Total: $${totalCost}
```

**Recommendations** (based on metrics):
- If duration >5 min: Consider breaking into smaller steps
- If retry count >5: Improve error handling
- If cost >$0.001: Optimize with step.sleep() (free)

---

### Step 8: Summary & Next Steps

```
Test Summary:
- Workflow: ${workflowName}
- Test Type: ${testType}
- Status: ${passOrFail}
- Duration: ${totalDuration}s
- Cost: $${totalCost}

${testType == "Both" ? `
Comparison:
- Local: ${localDuration}s
- Remote: ${remoteDuration}s
- Difference: ${Math.abs(localDuration - remoteDuration)}s
` : ''}

Next Steps:
${status == "pass" ? `
✅ Test passed! Ready for deployment.
1. Deploy: wrangler deploy
2. Monitor: wrangler workflows instances list ${workflowName}
3. Set up alerts for production
` : `
❌ Test failed. Debug needed.
1. Review error logs
2. Use /workflow-debug for diagnosis
3. Fix issues and re-test
`}

Commands:
- Re-test: /workflow-test
- Debug: /workflow-debug
- Benchmark: ./scripts/benchmark-workflow.sh ${workflowName} 10
```

---

## Error Handling

**Worker Not Running** (local):
```
❌ Error: wrangler dev not responding

Solution:
1. Check if port 8787 is available
2. Start manually: wrangler dev
3. Wait for "Ready on localhost:8787"
4. Re-run test
```

**Instance Creation Failed** (remote):
```
❌ Error: Failed to create workflow instance

Possible causes:
1. Worker not deployed
2. Workflow binding misconfigured
3. Parameters invalid

Debug:
1. Check deployment: wrangler deployments list
2. Validate config: ./scripts/validate-workflow-config.sh
3. Test Worker endpoint: curl ${WORKER_URL}
```

**Timeout**:
```
⚠️  Warning: Instance did not complete within timeout

Options:
1. Wait longer (workflow may still be running)
2. Check instance: wrangler workflows instances describe
3. Terminate if stuck: /workflow-debug
```

---

## Example Test Session

**Input**:
- Workflow: order-processing
- Test Type: Both (local + remote)
- Parameters: `{"orderId": "TEST-001", "amount": 99.99}`

**Output**:
```
Testing order-processing...

Local Test:
✅ Instance created: abc-123
✅ Step 1/3: validate order (0.5s)
✅ Step 2/3: process payment (1.2s)
✅ Step 3/3: send confirmation (0.3s)
✅ Completed in 2.0s

Remote Test:
✅ Instance created: def-456
✅ Step 1/3: validate order (0.6s)
✅ Step 2/3: process payment (1.3s)
✅ Step 3/3: send confirmation (0.4s)
✅ Completed in 2.3s

Performance:
- Local: 2.0s
- Remote: 2.3s
- Consistency: ✅ Good

Cost Estimate: $0.00045

✅ All tests passed! Ready for production.
```

---

## Summary

Interactive testing in 8 steps:
1. Select workflow (from list or manual entry)
2. Choose test type (local, remote, or both)
3. Configure parameters (default or custom JSON)
4. Run local test (if selected, with dev server)
5. Run remote test (if selected, via deployed Worker)
6. Validate results (check success criteria)
7. Performance metrics (duration, cost, recommendations)
8. Summary & next steps (pass/fail, commands)

**When to Use**: Testing execution, validating behavior, measuring performance before deployment.

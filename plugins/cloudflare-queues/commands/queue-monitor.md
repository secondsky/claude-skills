---
name: cloudflare-queues:monitor
description: Display real-time Cloudflare Queues metrics and status
argument-hint: [queue-name]
---

# Queue Monitor Command

Display real-time metrics and status for Cloudflare Queues.

**Usage**: `/queue-monitor my-queue-name`

## Step 1: Validate Input

If queue name provided as argument ($1), use it.
If not provided, list available queues:

```bash
wrangler queues list
```

Ask user to select from list or enter queue name manually.

## Step 2: Fetch Queue Metrics

Run wrangler command to get current status:

```bash
wrangler queues info $queueName
```

Parse output to extract:
- Queue name
- Current backlog (messages waiting)
- Consumer count (active consumers)
- DLQ status (if configured)
- Last activity timestamp

## Step 3: Display Formatted Metrics

Present metrics in organized, readable format:

```
═══════════════════════════════════════════════════════════
  CLOUDFLARE QUEUES MONITOR
═══════════════════════════════════════════════════════════

Queue: order-processing-queue
Status: ✅ Active
Last Updated: 2025-12-27 10:30:45 UTC

───────────────────────────────────────────────────────────
  QUEUE METRICS
───────────────────────────────────────────────────────────

Backlog:              125 messages
├─ Status:            ⚠️ Moderate (>100)
├─ Trend:             ↗ Growing (was 80, 5 min ago)
└─ Est. Clear Time:   ~12 minutes (at current rate)

Consumer:
├─ Active:            ✅ Yes (1 consumer)
├─ Batch Size:        10 messages
├─ Concurrency:       1
├─ Max Retries:       3
└─ Processing Rate:   ~10 msg/min

Dead Letter Queue:
├─ Configured:        ✅ Yes (order-processing-dlq)
├─ Failed Messages:   5 messages
└─ Status:            ✅ Low (<10)

───────────────────────────────────────────────────────────
  HEALTH INDICATORS
───────────────────────────────────────────────────────────

Overall Health:       ⚠️ MODERATE
├─ Backlog:           ⚠️ Moderate (125 messages)
├─ Consumer:          ✅ Active
├─ DLQ:               ✅ Low failure rate (<5%)
└─ Throughput:        ⚠️ Below capacity (could process faster)

───────────────────────────────────────────────────────────
  RECOMMENDATIONS
───────────────────────────────────────────────────────────

1. Consider increasing batch size to 25 for faster processing
   → Current: 10 | Recommended: 25 | Impact: 2.5x throughput

2. Review DLQ messages to identify failure patterns
   → 5 failures detected | Check: wrangler queues info order-processing-dlq

3. Monitor backlog trend over next 15 minutes
   → If continues growing, increase concurrency to 5

═══════════════════════════════════════════════════════════
```

## Step 4: Health Status Calculation

Calculate overall health based on metrics:

**Health Score Formula**:
```
Health = Average(backlog_score, consumer_score, dlq_score)

backlog_score:
- 0-50 messages: 100 (Excellent)
- 51-200 messages: 75 (Good)
- 201-500 messages: 50 (Moderate)
- 501-1000 messages: 25 (Poor)
- >1000 messages: 0 (Critical)

consumer_score:
- Active + processing: 100 (Excellent)
- Active but slow: 50 (Moderate)
- Not configured: 0 (Critical)

dlq_score:
- 0-10 messages: 100 (Excellent)
- 11-50 messages: 75 (Good)
- 51-100 messages: 50 (Moderate)
- >100 messages: 0 (Critical)
```

**Health Indicators**:
- 80-100: ✅ EXCELLENT (green)
- 60-79: ✅ GOOD (green)
- 40-59: ⚠️ MODERATE (yellow)
- 20-39: ⚠️ POOR (orange)
- 0-19: ❌ CRITICAL (red)

## Step 5: Trend Analysis (Optional)

If possible, compare current metrics with previous check:

**Backlog Trend**:
```
Backlog History (last 30 minutes):
10:00 → 80 messages
10:15 → 95 messages  ↗ (+15, +18.75%)
10:30 → 125 messages ↗ (+30, +31.58%)

Trend: ↗ GROWING
Rate: +1.5 messages/minute
Projection: ~200 messages in 1 hour (if trend continues)

Action: Increase consumer capacity to clear backlog
```

**Processing Rate**:
```
Processing Rate (estimated):
├─ Current: ~10 msg/min
├─ Capacity: ~50 msg/min (batch_size=10, could increase)
├─ Utilization: 20% (underutilized)
└─ Recommendation: Increase batch_size to utilize capacity
```

## Step 6: Provide Real-Time Monitoring

Offer to enable continuous monitoring:

**Option 1: Tail Consumer Logs**
```
Monitor consumer logs in real-time:

  wrangler tail

Output:
  [2025-12-27 10:30:45] Queue message received: order-created
  [2025-12-27 10:30:46] Processing order 12345
  [2025-12-27 10:30:47] Order processed successfully
  [2025-12-27 10:30:48] Queue message received: order-created
  ...

Press Ctrl+C to stop
```

**Option 2: Watch Queue Status**
```
Watch queue status (updates every 10 seconds):

  watch -n 10 "wrangler queues info $queueName"

Or I can fetch updates for you periodically.
```

**Option 3: Set Up Alerts**
```
Recommended alerts to set up:

1. High Backlog (>1000 messages)
   → Notify when backlog exceeds threshold

2. DLQ Growth (>50 messages)
   → Investigate when failures accumulate

3. Consumer Inactive
   → Alert if no processing for 5 minutes

Would you like help setting up monitoring/alerts?
```

## Step 7: Quick Actions

Offer quick actions based on current state:

**If High Backlog**:
```
Quick Actions for High Backlog:

1. Increase batch size:
   → Update wrangler.jsonc: max_batch_size: 10 → 25
   → Deploy: wrangler deploy

2. Increase concurrency:
   → Update wrangler.jsonc: max_concurrency: 1 → 5
   → Deploy: wrangler deploy

3. Launch queue-optimizer:
   → Analyzes configuration
   → Suggests optimal settings

Which action? (1/2/3)
```

**If DLQ Issues**:
```
Quick Actions for DLQ Messages:

1. View DLQ messages:
   → wrangler queues info order-processing-dlq

2. Analyze failure patterns:
   → Launch queue-debugger agent

3. Reprocess DLQ messages:
   → Requires custom script (can generate)

Which action? (1/2/3)
```

**If All Good**:
```
✅ Queue is healthy! No immediate actions needed.

Optional improvements:
1. Configure DLQ (if not already) for production safety
2. Review best practices: Load references/best-practices.md
3. Optimize settings: Launch queue-optimizer for recommendations

Continue monitoring? (y/n)
```

---

## Metrics Glossary

Explain key metrics displayed:

**Backlog**: Number of messages waiting to be processed
- Low (<50): Excellent, processing keeps up with incoming
- Moderate (50-200): Normal during peak times
- High (>200): May indicate consumer is too slow

**Processing Rate**: Messages processed per minute
- Calculate: (batch_size × batches_per_minute)
- Good: Matches or exceeds incoming message rate
- Poor: Lower than incoming rate (backlog grows)

**Consumer Status**:
- Active: Consumer is running and processing messages
- Inactive: Consumer not configured or not deployed
- Slow: Processing but not keeping up with incoming rate

**DLQ Count**: Failed messages after max retries
- Low (<10): Normal occasional failures
- Moderate (10-50): Review error patterns
- High (>50): Critical issue requiring investigation

**Utilization**: How much of consumer capacity is being used
- Low (<30%): Could process faster with larger batch size
- Good (30-70%): Well-balanced configuration
- High (>70%): Near capacity, may need more concurrency

---

## Error Handling

### Queue Not Found
```
❌ Error: Queue 'my-queue' not found

Available queues:
<list from wrangler queues list>

Would you like to monitor one of these? (enter queue name)
```

### No Metrics Available
```
⚠️ Warning: Unable to fetch detailed metrics

Basic status only:
- Queue exists: ✅ Yes
- Detailed metrics: ❌ Unavailable (may require wrangler update)

Fallback: Use wrangler queues info my-queue directly
```

### Permission Denied
```
❌ Error: Permission denied

Check:
1. Wrangler authenticated: wrangler whoami
2. Account access to queue
3. Re-authenticate: wrangler login
```

---

## Summary

This command provides **real-time queue monitoring** through 7 steps:
1. Validate input (queue name)
2. Fetch queue metrics (wrangler queues info)
3. Display formatted metrics (organized output)
4. Calculate health status (score-based indicators)
5. Analyze trends (backlog, processing rate)
6. Offer real-time monitoring (tail, watch)
7. Provide quick actions (based on current state)

**Output**: Formatted dashboard with:
- Current metrics (backlog, consumer status, DLQ)
- Health indicators (overall queue health)
- Recommendations (actionable next steps)
- Quick actions (immediate fixes)

**When to Use**: Regular monitoring, status checks, real-time debugging.

**Complementary Commands**:
- `/queue-troubleshoot` - Quick issue diagnosis
- `/queue-debugger` - Full 9-phase diagnostic (agent)
- `/queue-optimizer` - Performance tuning (agent)

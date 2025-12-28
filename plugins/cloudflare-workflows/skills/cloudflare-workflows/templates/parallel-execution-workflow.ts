/**
 * Parallel Execution Workflow
 *
 * Demonstrates advanced patterns for executing multiple operations concurrently
 * while respecting Cloudflare Workflows' sequential step model.
 *
 * Key Concepts:
 * - Promise.all() for concurrent operations WITHIN a step
 * - Batching for large datasets
 * - Fan-out/fan-in pattern
 * - Aggregation of parallel results
 *
 * Usage:
 * 1. Copy this file to src/workflows/
 * 2. Update Env and Params types for your use case
 * 3. Export from src/index.ts
 * 4. Add to wrangler.jsonc workflows array
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

// Environment bindings
interface Env {
  PARALLEL_WORKFLOW: Workflow;
  KV: KVNamespace;  // For storing intermediate results
}

// Workflow input parameters
interface Params {
  items: string[];     // Items to process in parallel
  batchSize?: number;  // Items per batch (default: 10)
  concurrency?: number; // Parallel requests per batch (default: 5)
}

// Result types
interface ProcessResult {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

interface BatchResult {
  batchIndex: number;
  results: ProcessResult[];
  duration: number;
}

interface FinalResult {
  totalItems: number;
  successful: number;
  failed: number;
  batches: number;
  totalDuration: number;
  results: ProcessResult[];
}

/**
 * Process a single item (simulated API call)
 */
async function processItem(itemId: string): Promise<ProcessResult> {
  try {
    // Simulate API call with random success/failure
    const response = await fetch(`https://api.example.com/process/${itemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, timestamp: Date.now() })
    });

    if (!response.ok) {
      return {
        id: itemId,
        success: false,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      id: itemId,
      success: true,
      data
    };
  } catch (error) {
    return {
      id: itemId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process items with concurrency limit
 */
async function processWithConcurrency(
  items: string[],
  concurrency: number
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processItem(item).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      const completed = executing.findIndex(p =>
        p.then(() => true).catch(() => true)
      );
      if (completed !== -1) {
        executing.splice(completed, 1);
      }
    }
  }

  // Wait for remaining
  await Promise.all(executing);
  return results;
}

/**
 * Chunk array into batches
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export class ParallelExecutionWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<FinalResult> {
    const { items, batchSize = 10, concurrency = 5 } = event.payload;
    const startTime = Date.now();

    console.log('Starting parallel execution workflow', {
      instanceId: event.instanceId,
      totalItems: items.length,
      batchSize,
      concurrency
    });

    // Validate input
    await step.do('validate input', async () => {
      if (!items || !Array.isArray(items)) {
        throw new NonRetryableError('Items must be an array');
      }
      if (items.length === 0) {
        throw new NonRetryableError('Items array cannot be empty');
      }
      if (items.length > 10000) {
        throw new NonRetryableError('Maximum 10000 items allowed');
      }
      return { valid: true, count: items.length };
    });

    // Split into batches
    const batches = chunkArray(items, batchSize);
    const allResults: ProcessResult[] = [];
    const batchResults: BatchResult[] = [];

    console.log(`Processing ${items.length} items in ${batches.length} batches`);

    // Process each batch as a separate step
    // This ensures durability - completed batches won't re-run on retry
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      const batchResult = await step.do(
        `process batch ${i + 1}/${batches.length}`,
        {
          retries: {
            limit: 3,
            delay: '5 seconds',
            backoff: 'exponential'
          }
        },
        async () => {
          const batchStart = Date.now();

          // Process items WITHIN this step in parallel
          const results = await processWithConcurrency(batch, concurrency);

          const duration = Date.now() - batchStart;

          console.log(`Batch ${i + 1} complete`, {
            items: batch.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            duration
          });

          return {
            batchIndex: i,
            results,
            duration
          };
        }
      );

      batchResults.push(batchResult);
      allResults.push(...batchResult.results);

      // Optional: Store intermediate results in KV for very large workflows
      if (items.length > 1000 && (i + 1) % 10 === 0) {
        await step.do(`checkpoint batch ${i + 1}`, async () => {
          await this.env.KV.put(
            `workflow:${event.instanceId}:progress`,
            JSON.stringify({
              completedBatches: i + 1,
              totalBatches: batches.length,
              processedItems: allResults.length
            }),
            { expirationTtl: 86400 }  // 24 hours
          );
          return { checkpointed: true };
        });
      }
    }

    // Aggregate final results
    const finalResult = await step.do('aggregate results', async () => {
      const successful = allResults.filter(r => r.success).length;
      const failed = allResults.filter(r => !r.success).length;

      return {
        totalItems: items.length,
        successful,
        failed,
        batches: batches.length,
        totalDuration: Date.now() - startTime,
        results: allResults
      };
    });

    // Clean up intermediate state
    if (items.length > 1000) {
      await step.do('cleanup', async () => {
        await this.env.KV.delete(`workflow:${event.instanceId}:progress`);
        return { cleaned: true };
      });
    }

    console.log('Parallel execution complete', {
      instanceId: event.instanceId,
      totalItems: finalResult.totalItems,
      successful: finalResult.successful,
      failed: finalResult.failed,
      duration: finalResult.totalDuration
    });

    return finalResult;
  }
}

/**
 * Alternative: Fan-Out/Fan-In Pattern
 *
 * For scenarios where you need to spawn multiple sub-workflows
 * and aggregate their results.
 */
export class FanOutFanInWorkflow extends WorkflowEntrypoint<Env, { taskGroups: string[][] }> {
  async run(
    event: WorkflowEvent<{ taskGroups: string[][] }>,
    step: WorkflowStep
  ) {
    const { taskGroups } = event.payload;

    // Fan-Out: Create sub-workflow for each task group
    const subWorkflowIds = await step.do('fan out', async () => {
      const ids: string[] = [];

      for (let i = 0; i < taskGroups.length; i++) {
        const instance = await this.env.PARALLEL_WORKFLOW.create({
          id: `${event.instanceId}-group-${i}`,
          params: { items: taskGroups[i] }
        });
        ids.push(instance.id);
      }

      return ids;
    });

    // Wait for all sub-workflows (with timeout)
    await step.sleep('wait for sub-workflows', '5 minutes');

    // Fan-In: Collect results from all sub-workflows
    const aggregatedResults = await step.do('fan in', async () => {
      const results: Array<{ groupId: string; status: string }> = [];

      for (const id of subWorkflowIds) {
        try {
          const instance = await this.env.PARALLEL_WORKFLOW.get(id);
          const status = await instance.status();
          results.push({ groupId: id, status: status.status });
        } catch (error) {
          results.push({ groupId: id, status: 'error' });
        }
      }

      return results;
    });

    return {
      subWorkflows: subWorkflowIds.length,
      results: aggregatedResults,
      allComplete: aggregatedResults.every(r => r.status === 'complete')
    };
  }
}

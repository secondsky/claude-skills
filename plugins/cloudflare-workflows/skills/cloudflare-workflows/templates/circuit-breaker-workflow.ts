/**
 * Circuit Breaker Workflow
 *
 * Implements the Circuit Breaker pattern for resilient external service calls.
 * Prevents cascade failures by detecting unhealthy services and failing fast.
 *
 * Key Concepts:
 * - Circuit states: CLOSED (normal), OPEN (failing fast), HALF_OPEN (testing)
 * - Failure threshold before opening circuit
 * - Automatic recovery after timeout
 * - Fallback behavior when circuit is open
 *
 * Usage:
 * 1. Copy this file to src/workflows/
 * 2. Update Env and Params types for your use case
 * 3. Configure circuit breaker settings
 * 4. Export from src/index.ts
 * 5. Add to wrangler.jsonc workflows array
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

// Environment bindings
interface Env {
  CIRCUIT_WORKFLOW: Workflow;
  KV: KVNamespace;  // For storing circuit state across instances
}

// Workflow input parameters
interface Params {
  serviceId: string;   // ID of the service to call
  endpoint: string;    // API endpoint
  payload?: unknown;   // Request payload
  fallbackValue?: unknown;  // Value to return when circuit is open
}

// Circuit breaker configuration
interface CircuitConfig {
  failureThreshold: number;    // Failures before opening (default: 5)
  resetTimeoutMs: number;      // Time before trying again (default: 60000)
  halfOpenSuccesses: number;   // Successes to close circuit (default: 3)
  monitorWindowMs: number;     // Time window for failure counting (default: 60000)
}

// Circuit state stored in KV
interface CircuitState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailure: number;
  lastSuccess: number;
  openedAt?: number;
}

// Default configuration
const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 60000,      // 1 minute
  halfOpenSuccesses: 3,
  monitorWindowMs: 60000      // 1 minute window for counting failures
};

/**
 * Circuit Breaker implementation using KV for distributed state
 */
class CircuitBreaker {
  private env: Env;
  private serviceId: string;
  private config: CircuitConfig;

  constructor(env: Env, serviceId: string, config: Partial<CircuitConfig> = {}) {
    this.env = env;
    this.serviceId = serviceId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getKey(): string {
    return `circuit:${this.serviceId}`;
  }

  async getState(): Promise<CircuitState> {
    const stored = await this.env.KV.get(this.getKey(), 'json');

    if (!stored) {
      return {
        status: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailure: 0,
        lastSuccess: 0
      };
    }

    return stored as CircuitState;
  }

  async setState(state: CircuitState): Promise<void> {
    await this.env.KV.put(
      this.getKey(),
      JSON.stringify(state),
      { expirationTtl: 86400 }  // 24 hour TTL
    );
  }

  async canExecute(): Promise<{ allowed: boolean; state: CircuitState }> {
    const state = await this.getState();
    const now = Date.now();

    switch (state.status) {
      case 'CLOSED':
        // Normal operation - allow execution
        return { allowed: true, state };

      case 'OPEN':
        // Check if reset timeout has elapsed
        if (state.openedAt && now - state.openedAt >= this.config.resetTimeoutMs) {
          // Transition to HALF_OPEN
          const newState: CircuitState = {
            ...state,
            status: 'HALF_OPEN',
            successes: 0
          };
          await this.setState(newState);
          return { allowed: true, state: newState };
        }
        // Still open - fail fast
        return { allowed: false, state };

      case 'HALF_OPEN':
        // Allow limited traffic to test recovery
        return { allowed: true, state };

      default:
        return { allowed: true, state };
    }
  }

  async recordSuccess(): Promise<CircuitState> {
    const state = await this.getState();
    const now = Date.now();

    const newState: CircuitState = {
      ...state,
      lastSuccess: now,
      successes: state.successes + 1
    };

    if (state.status === 'HALF_OPEN') {
      // Check if we've had enough successes to close
      if (newState.successes >= this.config.halfOpenSuccesses) {
        newState.status = 'CLOSED';
        newState.failures = 0;
        newState.openedAt = undefined;
        console.log(`Circuit ${this.serviceId}: HALF_OPEN -> CLOSED (recovered)`);
      }
    } else if (state.status === 'CLOSED') {
      // Reset failure count on success
      newState.failures = 0;
    }

    await this.setState(newState);
    return newState;
  }

  async recordFailure(): Promise<CircuitState> {
    const state = await this.getState();
    const now = Date.now();

    // Only count failures within the monitoring window
    const recentFailures = state.lastFailure > now - this.config.monitorWindowMs
      ? state.failures + 1
      : 1;

    const newState: CircuitState = {
      ...state,
      failures: recentFailures,
      lastFailure: now,
      successes: 0
    };

    if (state.status === 'HALF_OPEN') {
      // Any failure in HALF_OPEN reopens the circuit
      newState.status = 'OPEN';
      newState.openedAt = now;
      console.log(`Circuit ${this.serviceId}: HALF_OPEN -> OPEN (still failing)`);
    } else if (state.status === 'CLOSED') {
      // Check if we've exceeded failure threshold
      if (newState.failures >= this.config.failureThreshold) {
        newState.status = 'OPEN';
        newState.openedAt = now;
        console.log(`Circuit ${this.serviceId}: CLOSED -> OPEN (threshold exceeded)`);
      }
    }

    await this.setState(newState);
    return newState;
  }
}

/**
 * Call external service with timeout
 */
async function callService(
  endpoint: string,
  payload?: unknown,
  timeoutMs = 10000
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: payload ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    clearTimeout(timeout);
  }
}

export class CircuitBreakerWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { serviceId, endpoint, payload, fallbackValue } = event.payload;

    console.log('Starting circuit breaker workflow', {
      instanceId: event.instanceId,
      serviceId,
      endpoint
    });

    // Initialize circuit breaker
    const circuitBreaker = new CircuitBreaker(this.env, serviceId, {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      halfOpenSuccesses: 3
    });

    // Check circuit state
    const circuitCheck = await step.do('check circuit', async () => {
      const { allowed, state } = await circuitBreaker.canExecute();

      console.log(`Circuit ${serviceId} state:`, {
        status: state.status,
        failures: state.failures,
        allowed
      });

      return { allowed, state };
    });

    // If circuit is open, return fallback immediately
    if (!circuitCheck.allowed) {
      console.log(`Circuit ${serviceId} is OPEN - using fallback`);

      if (fallbackValue !== undefined) {
        return {
          status: 'fallback',
          circuitState: circuitCheck.state.status,
          data: fallbackValue
        };
      }

      throw new NonRetryableError(
        `Circuit breaker for ${serviceId} is OPEN. Service unavailable.`
      );
    }

    // Attempt to call the service
    const result = await step.do(
      'call service',
      {
        retries: {
          limit: 2,
          delay: '1 second',
          backoff: 'constant'
        }
      },
      async () => {
        const response = await callService(endpoint, payload);

        if (!response.success) {
          // Record failure and throw to trigger retry
          await circuitBreaker.recordFailure();
          throw new Error(response.error);
        }

        // Record success
        await circuitBreaker.recordSuccess();

        return response.data;
      }
    );

    return {
      status: 'success',
      circuitState: 'CLOSED',
      data: result
    };
  }
}

/**
 * Multi-Service Circuit Breaker Workflow
 *
 * Demonstrates calling multiple services with independent circuit breakers.
 */
interface MultiServiceParams {
  services: Array<{
    id: string;
    endpoint: string;
    required: boolean;  // If true, workflow fails when circuit is open
  }>;
}

export class MultiServiceWorkflow extends WorkflowEntrypoint<Env, MultiServiceParams> {
  async run(event: WorkflowEvent<MultiServiceParams>, step: WorkflowStep) {
    const { services } = event.payload;
    const results: Record<string, { success: boolean; data?: unknown; error?: string }> = {};

    for (const service of services) {
      const circuitBreaker = new CircuitBreaker(this.env, service.id);

      const result = await step.do(`call ${service.id}`, async () => {
        const { allowed, state } = await circuitBreaker.canExecute();

        if (!allowed) {
          if (service.required) {
            throw new NonRetryableError(
              `Required service ${service.id} unavailable (circuit OPEN)`
            );
          }
          return { success: false, error: 'Circuit open', skipped: true };
        }

        const response = await callService(service.endpoint);

        if (response.success) {
          await circuitBreaker.recordSuccess();
        } else {
          await circuitBreaker.recordFailure();
        }

        return response;
      });

      results[service.id] = result;
    }

    const allRequired = services
      .filter(s => s.required)
      .every(s => results[s.id]?.success);

    return {
      allRequiredSucceeded: allRequired,
      results
    };
  }
}

/**
 * Retry with Backoff and Circuit Breaker
 *
 * Combines Cloudflare's built-in retry with circuit breaker pattern.
 */
export class RetryWithCircuitWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { serviceId, endpoint, payload } = event.payload;

    const circuitBreaker = new CircuitBreaker(this.env, serviceId, {
      failureThreshold: 3,
      resetTimeoutMs: 30000  // 30 seconds
    });

    // First check: is circuit already open?
    const preCheck = await step.do('pre-check circuit', async () => {
      const { allowed, state } = await circuitBreaker.canExecute();
      return { allowed, status: state.status };
    });

    if (!preCheck.allowed) {
      // Wait for circuit reset timeout
      await step.sleep('wait for circuit reset', '30 seconds');

      // Re-check after waiting
      const reCheck = await step.do('re-check circuit', async () => {
        const { allowed, state } = await circuitBreaker.canExecute();
        return { allowed, status: state.status };
      });

      if (!reCheck.allowed) {
        throw new NonRetryableError(
          `Service ${serviceId} still unavailable after waiting`
        );
      }
    }

    // Attempt with Cloudflare's retry + manual circuit breaker updates
    const result = await step.do(
      'call with retry',
      {
        retries: {
          limit: 5,
          delay: '2 seconds',
          backoff: 'exponential'  // 2s, 4s, 8s, 16s, 32s
        }
      },
      async () => {
        const response = await callService(endpoint, payload);

        if (!response.success) {
          // Record failure for circuit breaker
          const state = await circuitBreaker.recordFailure();

          // If circuit just opened, throw NonRetryableError to stop retries
          if (state.status === 'OPEN') {
            throw new NonRetryableError(
              `Circuit opened after ${state.failures} failures: ${response.error}`
            );
          }

          // Otherwise throw regular error to continue retrying
          throw new Error(response.error);
        }

        // Success - record it
        await circuitBreaker.recordSuccess();
        return response.data;
      }
    );

    return {
      status: 'success',
      data: result
    };
  }
}

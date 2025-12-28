/**
 * Cloudflare Workers KV - Configuration Management Example
 *
 * Demonstrates config management patterns using KV:
 * - Feature flags
 * - Environment-specific configs
 * - Hot-reload without Worker redeployment
 * - Version tracking
 * - A/B testing configuration
 */

import { Hono } from 'hono';

type Bindings = {
  CONFIG: KVNamespace;
};

interface FeatureFlags {
  darkMode: boolean;
  newUI: boolean;
  betaFeatures: boolean;
  maintenanceMode: boolean;
}

interface AppConfig {
  apiUrl: string;
  maxUploadSize: number;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
  version: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Default configuration (fallback)
const DEFAULT_CONFIG: AppConfig = {
  apiUrl: 'https://api.example.com',
  maxUploadSize: 10485760, // 10MB
  environment: 'production',
  features: {
    darkMode: true,
    newUI: false,
    betaFeatures: false,
    maintenanceMode: false
  },
  version: '1.0.0'
};

// ============================================================================
// Configuration Helpers
// ============================================================================

async function getConfig(kv: KVNamespace): Promise<AppConfig> {
  const config = await kv.get('app:config', {
    type: 'json',
    cacheTtl: 60 // Cache for 1 minute
  });

  return (config as AppConfig) || DEFAULT_CONFIG;
}

async function setConfig(kv: KVNamespace, config: AppConfig): Promise<void> {
  await kv.put('app:config', JSON.stringify(config), {
    metadata: {
      updatedAt: Date.now(),
      version: config.version
    }
  });
}

async function getFeatureFlag(kv: KVNamespace, flag: string): Promise<boolean> {
  const config = await getConfig(kv);
  return config.features[flag as keyof FeatureFlags] || false;
}

// ============================================================================
// Configuration Endpoints
// ============================================================================

/**
 * Get current configuration
 */
app.get('/config', async (c) => {
  const config = await getConfig(c.env.CONFIG);
  return c.json(config);
});

/**
 * Update configuration (admin only)
 */
app.put('/config', async (c) => {
  const updates = await c.req.json();
  const current = await getConfig(c.env.CONFIG);

  // Merge updates
  const newConfig: AppConfig = {
    ...current,
    ...updates,
    version: `${parseInt(current.version) + 1}.0.0`
  };

  await setConfig(c.env.CONFIG, newConfig);

  return c.json({ success: true, config: newConfig });
});

/**
 * Get specific feature flag
 */
app.get('/config/features/:flag', async (c) => {
  const flag = c.req.param('flag');
  const enabled = await getFeatureFlag(c.env.CONFIG, flag);

  return c.json({ flag, enabled });
});

/**
 * Toggle feature flag (admin only)
 */
app.post('/config/features/:flag/toggle', async (c) => {
  const flag = c.req.param('flag');
  const config = await getConfig(c.env.CONFIG);

  if (!(flag in config.features)) {
    return c.json({ error: 'Unknown feature flag' }, 400);
  }

  // Toggle flag
  config.features[flag as keyof FeatureFlags] = !config.features[flag as keyof FeatureFlags];
  config.version = `${parseInt(config.version) + 1}.0.0`;

  await setConfig(c.env.CONFIG, config);

  return c.json({
    success: true,
    flag,
    enabled: config.features[flag as keyof FeatureFlags]
  });
});

// ============================================================================
// A/B Testing Configuration
// ============================================================================

interface ABTest {
  name: string;
  variants: string[];
  distribution: number[]; // Percentages for each variant
  enabled: boolean;
}

/**
 * Get A/B test variant for user
 */
app.get('/ab/:testName', async (c) => {
  const testName = c.req.param('testName');
  const userId = c.req.query('userId') || 'anonymous';

  // Get test configuration
  const testConfig = await c.env.CONFIG.get(`ab:${testName}`, 'json') as ABTest | null;

  if (!testConfig || !testConfig.enabled) {
    return c.json({ variant: 'control' });
  }

  // Deterministic variant assignment based on userId
  const encoder = new TextEncoder();
  const data = encoder.encode(`${testName}:${userId}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hash = hashArray[0]; // Use first byte

  // Map hash to variant
  const percentage = (hash / 255) * 100;
  let cumulative = 0;

  for (let i = 0; i < testConfig.variants.length; i++) {
    cumulative += testConfig.distribution[i];
    if (percentage < cumulative) {
      return c.json({
        test: testName,
        variant: testConfig.variants[i],
        userId
      });
    }
  }

  return c.json({ variant: testConfig.variants[testConfig.variants.length - 1] });
});

/**
 * Create/update A/B test (admin only)
 */
app.put('/ab/:testName', async (c) => {
  const testName = c.req.param('testName');
  const test: ABTest = await c.req.json();

  // Validate distribution sums to 100
  const sum = test.distribution.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) {
    return c.json({ error: 'Distribution must sum to 100%' }, 400);
  }

  await c.env.CONFIG.put(`ab:${testName}`, JSON.stringify(test), {
    metadata: { createdAt: Date.now() }
  });

  return c.json({ success: true, test });
});

// ============================================================================
// Environment-Specific Configuration
// ============================================================================

/**
 * Get environment-specific setting
 */
app.get('/config/env/:key', async (c) => {
  const key = c.req.param('key');
  const config = await getConfig(c.env.CONFIG);

  // Get environment-specific override
  const envKey = `env:${config.environment}:${key}`;
  const envValue = await c.env.CONFIG.get(envKey);

  if (envValue) {
    return c.json({ key, value: envValue, source: 'environment' });
  }

  // Fallback to global config
  const globalValue = (config as any)[key];
  return c.json({ key, value: globalValue, source: 'global' });
});

// ============================================================================
// Configuration History & Rollback
// ============================================================================

/**
 * Save configuration snapshot
 */
app.post('/config/snapshot', async (c) => {
  const config = await getConfig(c.env.CONFIG);
  const timestamp = Date.now();

  await c.env.CONFIG.put(
    `config:snapshot:${timestamp}`,
    JSON.stringify(config),
    {
      metadata: { version: config.version, timestamp },
      expirationTtl: 86400 * 30 // Keep for 30 days
    }
  );

  return c.json({ success: true, timestamp, version: config.version });
});

/**
 * List configuration snapshots
 */
app.get('/config/snapshots', async (c) => {
  const { keys } = await c.env.CONFIG.list({
    prefix: 'config:snapshot:',
    limit: 50
  });

  const snapshots = keys.map(({ name, metadata }) => ({
    timestamp: parseInt(name.replace('config:snapshot:', '')),
    version: metadata?.version,
    date: new Date(metadata?.timestamp as number).toISOString()
  }));

  return c.json({ snapshots });
});

/**
 * Rollback to snapshot
 */
app.post('/config/rollback/:timestamp', async (c) => {
  const timestamp = c.req.param('timestamp');

  const snapshot = await c.env.CONFIG.get(`config:snapshot:${timestamp}`, 'json') as AppConfig;

  if (!snapshot) {
    return c.json({ error: 'Snapshot not found' }, 404);
  }

  await setConfig(c.env.CONFIG, snapshot);

  return c.json({ success: true, rolledBackTo: timestamp });
});

// ============================================================================
// Application Endpoints (Using Configuration)
// ============================================================================

/**
 * Example endpoint that uses feature flags
 */
app.get('/app/dashboard', async (c) => {
  const config = await getConfig(c.env.CONFIG);

  if (config.features.maintenanceMode) {
    return c.json({ error: 'Service under maintenance' }, 503);
  }

  return c.json({
    message: 'Welcome to dashboard',
    ui: config.features.newUI ? 'new' : 'classic',
    darkMode: config.features.darkMode
  });
});

// ============================================================================
// Root & 404
// ============================================================================

app.get('/', (c) => {
  return c.html(`
    <h1>Cloudflare Workers KV - Config Management Example</h1>
    <h2>Configuration</h2>
    <ul>
      <li><a href="/config">GET /config</a> - Get current configuration</li>
      <li>PUT /config - Update configuration</li>
      <li>GET /config/features/:flag - Get feature flag status</li>
      <li>POST /config/features/:flag/toggle - Toggle feature flag</li>
    </ul>
    <h2>A/B Testing</h2>
    <ul>
      <li>GET /ab/:testName?userId=123 - Get A/B test variant</li>
      <li>PUT /ab/:testName - Create/update A/B test</li>
    </ul>
    <h2>History & Rollback</h2>
    <ul>
      <li>POST /config/snapshot - Create configuration snapshot</li>
      <li><a href="/config/snapshots">GET /config/snapshots</a> - List snapshots</li>
      <li>POST /config/rollback/:timestamp - Rollback to snapshot</li>
    </ul>
  `);
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;

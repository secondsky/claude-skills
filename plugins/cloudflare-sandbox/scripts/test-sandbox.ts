/**
 * Cloudflare Sandboxes - Validation Test Script
 *
 * This script tests your Sandbox setup by running a series of validation checks.
 *
 * Usage:
 *   npx tsx scripts/test-sandbox.ts
 *
 * Prerequisites:
 *   - @cloudflare/sandbox installed
 *   - wrangler.jsonc configured
 *   - Docker running (for local dev)
 */

import { getSandbox, type Sandbox } from '@cloudflare/sandbox';

// Mock environment for local testing
type TestEnv = {
  Sandbox: DurableObjectNamespace<Sandbox>;
};

async function runTests() {
  console.log('🧪 Cloudflare Sandboxes Validation Tests');
  console.log('=========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Package import
  console.log('[1/6] Testing package import...');
  try {
    if (typeof getSandbox !== 'function') {
      throw new Error('getSandbox is not a function');
    }
    console.log('✅ Package import successful\n');
    passed++;
  } catch (error) {
    console.log(`❌ Package import failed: ${error.message}\n`);
    failed++;
  }

  // Test 2: Check for Docker (local dev)
  console.log('[2/6] Checking Docker availability...');
  try {
    const { execSync } = await import('child_process');
    execSync('docker ps', { stdio: 'ignore' });
    console.log('✅ Docker is running\n');
    passed++;
  } catch (error) {
    console.log('⚠️  Docker not running (required for local development)\n');
    console.log('   Start Docker Desktop and try again\n');
  }

  // Test 3: Check wrangler.jsonc
  console.log('[3/6] Checking wrangler.jsonc configuration...');
  try {
    const fs = await import('fs');
    const path = await import('path');

    const wranglerPath = path.join(process.cwd(), 'wrangler.jsonc');
    if (!fs.existsSync(wranglerPath)) {
      throw new Error('wrangler.jsonc not found');
    }

    const content = fs.readFileSync(wranglerPath, 'utf-8');

    // Check for required configuration
    const checks = {
      'nodejs_compat': content.includes('nodejs_compat'),
      'containers': content.includes('containers'),
      'cloudflare/sandbox': content.includes('cloudflare/sandbox'),
      'durable_objects': content.includes('durable_objects'),
      'migrations': content.includes('migrations')
    };

    const missing = Object.entries(checks)
      .filter(([_, present]) => !present)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing configuration: ${missing.join(', ')}`);
    }

    console.log('✅ wrangler.jsonc properly configured\n');
    passed++;
  } catch (error) {
    console.log(`❌ wrangler.jsonc check failed: ${error.message}\n`);
    console.log('   Run: ./scripts/setup-sandbox-binding.sh\n');
    failed++;
  }

  // Test 4: Check package.json
  console.log('[4/6] Checking package.json dependencies...');
  try {
    const fs = await import('fs');
    const path = await import('path');

    const pkgPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
      throw new Error('package.json not found');
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

    if (!dependencies['@cloudflare/sandbox']) {
      throw new Error('@cloudflare/sandbox not installed');
    }

    const version = dependencies['@cloudflare/sandbox'];
    console.log(`✅ @cloudflare/sandbox ${version} installed\n`);
    passed++;
  } catch (error) {
    console.log(`❌ Package check failed: ${error.message}\n`);
    console.log('   Run: npm install @cloudflare/sandbox\n');
    failed++;
  }

  // Test 5: Check for Worker export
  console.log('[5/6] Checking Worker code for Sandbox export...');
  try {
    const fs = await import('fs');
    const glob = await import('glob');

    // Find TypeScript/JavaScript files in src/
    const files = glob.sync('src/**/*.{ts,js}');

    let foundExport = false;
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('export { Sandbox }') && content.includes('@cloudflare/sandbox')) {
        foundExport = true;
        console.log(`✅ Found Sandbox export in ${file}\n`);
        break;
      }
    }

    if (!foundExport && files.length > 0) {
      console.log('⚠️  No Sandbox export found in src/ files\n');
      console.log('   Add to your Worker:\n');
      console.log('   export { Sandbox } from \'@cloudflare/sandbox\';\n');
    } else if (files.length === 0) {
      console.log('⚠️  No source files found in src/\n');
    } else {
      passed++;
    }
  } catch (error) {
    console.log(`⚠️  Worker code check skipped: ${error.message}\n`);
  }

  // Test 6: Version compatibility
  console.log('[6/6] Checking version compatibility...');
  try {
    const fs = await import('fs');
    const path = await import('path');

    const pkgPath = path.join(process.cwd(), 'package.json');
    const wranglerPath = path.join(process.cwd(), 'wrangler.jsonc');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const wrangler = fs.readFileSync(wranglerPath, 'utf-8');

    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    const pkgVersion = dependencies['@cloudflare/sandbox']?.replace(/[\^~]/, '');

    const imageMatch = wrangler.match(/cloudflare\/sandbox:([0-9.]+)/);
    const imageVersion = imageMatch ? imageMatch[1] : null;

    if (pkgVersion && imageVersion && pkgVersion !== imageVersion) {
      console.log(`⚠️  Version mismatch detected:\n`);
      console.log(`   Package: ${pkgVersion}`);
      console.log(`   Docker:  ${imageVersion}\n`);
      console.log('   Update wrangler.jsonc image to match package version\n');
    } else if (pkgVersion && imageVersion) {
      console.log(`✅ Versions match: ${pkgVersion}\n`);
      passed++;
    } else {
      console.log('⚠️  Could not verify version compatibility\n');
    }
  } catch (error) {
    console.log(`⚠️  Version check skipped: ${error.message}\n`);
  }

  // Summary
  console.log('=========================================');
  console.log(`Tests Passed: ${passed}`);
  console.log(`Tests Failed: ${failed}`);
  console.log('=========================================\n');

  if (failed === 0) {
    console.log('✅ All tests passed! Your Sandbox setup looks good.\n');
    console.log('Next steps:');
    console.log('  1. Start local dev: npm run dev');
    console.log('  2. Deploy: npm run deploy');
    console.log('  3. Test with a simple exec: sandbox.exec("echo hello")\n');
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.\n');
    console.log('Resources:');
    console.log('  - Docs: https://developers.cloudflare.com/sandbox/');
    console.log('  - Setup: ./scripts/setup-sandbox-binding.sh\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});

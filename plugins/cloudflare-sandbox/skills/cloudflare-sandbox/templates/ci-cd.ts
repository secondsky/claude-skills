/**
 * Cloudflare Sandbox - CI/CD Build Pipeline Pattern
 *
 * Use Case: Build, test, and deploy workflows triggered by git webhooks or API calls
 *
 * Features:
 * - Per-task sandbox (idempotent, traceable)
 * - Git repository cloning and operations
 * - Dependency installation and build execution
 * - Artifact storage to R2
 * - Proper error handling and exit code checking
 *
 * Pattern: Clone → Install → Build → Store Artifacts → (Optional) Cleanup
 */

import { getSandbox, type Sandbox } from '@cloudflare/sandbox';
export { Sandbox } from '@cloudflare/sandbox';

type Env = {
  Sandbox: DurableObjectNamespace<Sandbox>;
  R2: R2Bucket; // For storing build artifacts
  GITHUB_TOKEN?: string; // Optional: For private repos
};

type BuildRequest = {
  repoUrl: string;
  commit?: string; // Optional: specific commit to build
  branch?: string; // Optional: specific branch (default: main)
  buildCommand?: string; // Optional: custom build command (default: npm run build)
  keepSandbox?: boolean; // Optional: keep sandbox for debugging (default: false)
};

type BuildResponse = {
  success: boolean;
  buildTime?: number;
  artifactKey?: string;
  logs?: {
    clone?: string;
    install?: string;
    build?: string;
  };
  error?: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json() as BuildRequest;

      // Validate input
      if (!body.repoUrl) {
        return Response.json({
          success: false,
          error: 'repoUrl is required'
        }, { status: 400 });
      }

      const startTime = Date.now();

      // Create sandbox ID from repo and commit (idempotent + traceable)
      const repoName = body.repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
      const commitOrBranch = body.commit || body.branch || 'main';
      const sandboxId = `build-${repoName}-${commitOrBranch}`;

      const sandbox = getSandbox(env.Sandbox, sandboxId);

      try {
        const logs: BuildResponse['logs'] = {};

        // Step 1: Clone repository
        console.log('Cloning repository:', body.repoUrl);
        await sandbox.gitCheckout(body.repoUrl, '/workspace/repo');
        logs.clone = 'Repository cloned successfully';

        // Step 2: Checkout specific commit or branch
        if (body.commit) {
          const checkoutResult = await sandbox.exec(`git checkout ${body.commit}`, {
            cwd: '/workspace/repo',
            timeout: 30000
          });

          if (!checkoutResult.success) {
            throw new Error(`Failed to checkout commit: ${checkoutResult.stderr}`);
          }
        } else if (body.branch && body.branch !== 'main') {
          const checkoutResult = await sandbox.exec(`git checkout ${body.branch}`, {
            cwd: '/workspace/repo',
            timeout: 30000
          });

          if (!checkoutResult.success) {
            throw new Error(`Failed to checkout branch: ${checkoutResult.stderr}`);
          }
        }

        // Step 3: Install dependencies
        console.log('Installing dependencies...');
        const installResult = await sandbox.exec('npm install', {
          cwd: '/workspace/repo',
          timeout: 180000 // 3 minutes timeout for install
        });

        if (!installResult.success) {
          logs.install = installResult.stderr;
          throw new Error(`npm install failed: ${installResult.stderr}`);
        }

        logs.install = 'Dependencies installed successfully';

        // Step 4: Run build
        console.log('Running build...');
        const buildCommand = body.buildCommand || 'npm run build';
        const buildResult = await sandbox.exec(buildCommand, {
          cwd: '/workspace/repo',
          timeout: 300000 // 5 minutes timeout for build
        });

        if (!buildResult.success) {
          logs.build = buildResult.stderr;
          throw new Error(`Build failed: ${buildResult.stderr}`);
        }

        logs.build = buildResult.stdout;

        // Step 5: Package build artifacts
        console.log('Packaging artifacts...');
        const tarResult = await sandbox.exec('tar -czf dist.tar.gz dist', {
          cwd: '/workspace/repo',
          timeout: 60000
        });

        if (!tarResult.success) {
          throw new Error(`Failed to package artifacts: ${tarResult.stderr}`);
        }

        // Step 6: Upload to R2
        console.log('Uploading artifacts to R2...');
        const artifact = await sandbox.readFile('/workspace/repo/dist.tar.gz');
        const artifactKey = `builds/${repoName}/${commitOrBranch}/${Date.now()}.tar.gz`;

        await env.R2.put(artifactKey, artifact, {
          customMetadata: {
            repo: body.repoUrl,
            commit: body.commit || '',
            branch: body.branch || 'main',
            buildTime: new Date().toISOString()
          }
        });

        const buildTime = Date.now() - startTime;

        // Step 7: Cleanup (optional)
        if (!body.keepSandbox) {
          await sandbox.destroy();
        }

        return Response.json({
          success: true,
          buildTime,
          artifactKey,
          logs
        });

      } catch (error) {
        console.error('Build error:', error);

        // Cleanup on error (unless keepSandbox is true)
        if (!body.keepSandbox) {
          try {
            await sandbox.destroy();
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }

        return Response.json({
          success: false,
          error: error instanceof Error ? error.message : 'Build failed',
          buildTime: Date.now() - startTime,
          logs: (error as any).logs
        }, { status: 500 });
      }

    } catch (error) {
      console.error('Request processing error:', error);
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
};

/**
 * Example Usage:
 *
 * Trigger a build:
 * POST /
 * {
 *   "repoUrl": "https://github.com/user/my-project",
 *   "commit": "abc123",
 *   "buildCommand": "npm run build"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "buildTime": 45678,
 *   "artifactKey": "builds/my-project/abc123/1698765432000.tar.gz",
 *   "logs": {
 *     "clone": "Repository cloned successfully",
 *     "install": "Dependencies installed successfully",
 *     "build": "Build completed\n..."
 *   }
 * }
 *
 * Error Response:
 * {
 *   "success": false,
 *   "error": "Build failed: npm ERR! ...",
 *   "buildTime": 12345,
 *   "logs": {
 *     "clone": "Repository cloned successfully",
 *     "install": "Dependencies installed successfully",
 *     "build": "npm ERR! ..."
 *   }
 * }
 */

/**
 * wrangler.jsonc additions required:
 *
 * {
 *   "r2_buckets": [
 *     {
 *       "binding": "R2",
 *       "bucket_name": "build-artifacts"
 *     }
 *   ],
 *   "vars": {
 *     "GITHUB_TOKEN": "ghp_..." // Optional: For private repos
 *   }
 * }
 */

/**
 * Advanced Pattern: Webhook Integration
 *
 * You can trigger builds automatically from GitHub webhooks:
 *
 * 1. Set up webhook in GitHub repo settings:
 *    - Payload URL: https://your-worker.workers.dev
 *    - Content type: application/json
 *    - Events: Push events
 *
 * 2. Modify the Worker to handle webhook payloads:
 *
 * const webhook = await request.json();
 * const buildRequest: BuildRequest = {
 *   repoUrl: webhook.repository.clone_url,
 *   commit: webhook.after,
 *   branch: webhook.ref.replace('refs/heads/', '')
 * };
 */

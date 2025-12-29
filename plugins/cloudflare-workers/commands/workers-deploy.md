---
name: cloudflare-workers:deploy
description: Guided Cloudflare Workers deployment with environment selection, pre-deploy validation, and safety checks. Supports staging, production, and custom environments.
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
  - Grep
argument-hint: "--env <environment> (optional: prod, staging, dev)"
---

# Workers Deploy Command

Safe, guided deployment workflow for Cloudflare Workers with environment management and pre-deploy validation.

## Execution Workflow

### Phase 1: Environment Detection

Read and analyze the project configuration:

1. **Check for wrangler config**:
   - Look for `wrangler.jsonc` or `wrangler.toml`
   - If neither exists, abort: "No wrangler configuration found. Run `bunx wrangler init` first."

2. **Parse environments**:
   - Extract environment configurations from wrangler config
   - Identify: name, routes, vars, bindings for each environment
   - Common environments: production, staging, dev, preview

3. **Check current git status**:
   ```bash
   git status --porcelain
   ```
   - Warn if uncommitted changes exist
   - Suggest committing before deploy

4. **Check if wrangler is installed**:
   ```bash
   bunx wrangler --version
   ```
   - If fails, install will happen via bunx

### Phase 2: Environment Selection

**If --env argument provided**:
- Use that environment
- Validate it exists in wrangler config
- If not found, abort with available environments list

**If no --env argument**:
Use AskUserQuestion to select environment:

**Question**: "Which environment do you want to deploy to?"
- Options (dynamically generated from config):
  - `production` - Live environment (requires extra confirmation)
  - `staging` - Pre-production testing
  - `dev` - Development environment
  - [Any other envs found in config]

### Phase 3: Pre-Deploy Validation

Ask user about pre-deploy checks:

**Question**: "Run pre-deploy validations?"
- Options:
  - Run all checks (tests + types + build) (Recommended)
  - Run tests only
  - Run types only
  - Skip validations (deploy immediately)

**Based on selection, run**:

**Tests** (if package.json has test script):
```bash
npm run test || bun test
```
- If tests fail, abort: "Tests failed. Fix issues before deploying."
- Allow user to override with confirmation

**Type checking** (if TypeScript project):
```bash
bunx tsc --noEmit
```
- If type errors, abort: "Type errors found. Fix before deploying."
- Allow user to override with confirmation

**Build** (if build script exists):
```bash
npm run build || bun run build
```
- If build fails, abort: "Build failed. Check errors above."

**Error Handling**: Abort on first failure. Provide clear error messages.

### Phase 4: Deployment Confirmation

**For production environment**:
Show detailed confirmation with risk warning:

```
⚠️  PRODUCTION DEPLOYMENT

Target: production
Worker: [worker-name]
Routes: [route1, route2]
Bindings: [D1, KV, R2, etc.]

Changes will be LIVE immediately after deployment.

Pre-deploy checks:
✅ Tests passed
✅ Types valid
✅ Build successful

Continue with production deployment?
```

Ask for explicit confirmation: "Type 'yes' to confirm production deployment"

**For non-production**:
Simpler confirmation:

```
Deploying to: [environment]
Worker: [worker-name]

Continue?
```

### Phase 5: Deployment Execution

Execute wrangler deploy command:

```bash
bunx wrangler deploy --env [environment]
```

**Capture output**:
- Deployment URL
- Success/failure status
- Any warnings or errors

**Monitor deployment**:
- Show real-time output from wrangler
- Don't hide errors or warnings

### Phase 6: Post-Deploy Verification

After successful deployment:

1. **Extract deployment URL** from wrangler output

2. **Verify worker is responding**:
```bash
curl -I [deployment-url]
```
   - Check for 200-class status code
   - If 500/error, warn about deployment issues

3. **Check logs** (optional):
```bash
bunx wrangler tail --env [environment] --once
```
   - Show recent logs to verify worker is running
   - Catch any immediate errors

### Phase 7: Summary Report

Generate deployment summary:

```markdown
✅ Deployment Successful!

**Environment**: [environment]
**Worker**: [worker-name]
**URL**: [deployment-url]
**Version**: [git-commit-hash or timestamp]

**Deployment Details**:
- Routes: [routes]
- Bindings: [bindings]
- Environment Vars: [count] configured

**Verification**:
✅ Worker responding (HTTP 200)
✅ No immediate errors in logs

**Next Steps**:
1. Monitor logs: `wrangler tail --env [environment]`
2. Test functionality: [deployment-url]
3. Check metrics: Cloudflare Dashboard

**Rollback**:
If issues arise, rollback with:
`wrangler rollback --env [environment]`

**Resources**:
- Cloudflare Dashboard: https://dash.cloudflare.com/
- Deployment Docs: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/
```

## Special Cases

### Production Deployment Checklist

Before allowing production deploy, verify:

- [ ] All tests passed
- [ ] No type errors
- [ ] Git working directory clean
- [ ] User explicitly confirmed "yes"
- [ ] Not deploying from feature branch (warn if not main/master)

### Failed Deployment Recovery

If deployment fails:

1. **Capture exact error message**
2. **Check common issues**:
   - Account not authenticated: `wrangler login`
   - Insufficient permissions: Check Cloudflare API tokens
   - Bundle too large: Check bundle size limits
   - Invalid wrangler.jsonc: Syntax errors
3. **Provide fix guidance**
4. **Suggest rollback if partial deploy**

### Environment Variable Secrets

If deployment uses secrets:

**Warn if secrets not set**:
```
⚠️  This worker uses environment secrets.
Ensure secrets are configured:
`wrangler secret put SECRET_NAME --env [environment]`

Known secrets from code:
- API_KEY
- DATABASE_URL
- AUTH_SECRET

Continue anyway?
```

## Error Handling

**Abort deployment if**:
- No wrangler config found
- Environment doesn't exist
- Pre-deploy validation fails (unless user overrides)
- User cancels confirmation
- Wrangler deploy command fails

**Provide recovery steps**:
- Link to relevant documentation
- Suggest common fixes
- Offer to rollback if needed

## Success Criteria

Deployment is successful when:
- ✅ Pre-deploy validations passed
- ✅ Wrangler deploy executed without errors
- ✅ Deployment URL accessible
- ✅ Worker responding to requests
- ✅ No critical errors in logs
- ✅ User receives complete summary

## Tips for Claude

1. **Safety first**: Always validate before deploying to production
2. **Clear confirmations**: Make production deploys require explicit "yes"
3. **Helpful errors**: Explain what went wrong and how to fix it
4. **Monitor closely**: Watch deployment output for warnings
5. **Verify thoroughly**: Test the deployed worker actually works
6. **Document everything**: Provide complete deployment summary
7. **Reference skills**: Point to workers-ci-cd for automated deployments

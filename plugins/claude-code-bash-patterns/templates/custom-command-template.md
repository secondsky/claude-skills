# Custom Command Template

This is a template for creating custom commands in `.claude/commands/`.

## File Location

`.claude/commands/your-command-name.md`

## Usage

```
User: /your-command-name
Claude: [Executes the workflow described in this file]
```

---

## Template Structure

```markdown
[Brief description of what this command does]

[Detailed workflow steps in imperative form:]

1. [First step with specific action]
2. [Second step with verification]
3. [Third step with error handling]
4. [Final step with success criteria]

[Optional: Rollback instructions if something fails]

[Optional: Expected output or success message]
```

---

## Example: Deploy to Staging

**File**: `.claude/commands/deploy-staging.md`

```markdown
Deploy the current branch to staging environment.

1. Verify current branch is not main (exit if main)
2. Run full test suite (npm test)
3. If tests pass, build production bundle (npm run build)
4. Deploy to Cloudflare staging (npx wrangler deploy --env staging)
5. Wait for deployment to complete
6. Run health check on staging URL (curl https://staging.example.com/health)
7. If health check passes, report success with deployment URL
8. If health check fails, rollback deployment (npx wrangler rollback --env staging)
```

---

## Best Practices

### ✅ Do:
- Use imperative language ("Run tests", not "Running tests")
- Include verification steps ("Verify X", "Check Y")
- Add error handling ("If X fails, then Y")
- Specify exact commands when helpful
- Keep focused on one workflow
- Document expected state before execution
- Include rollback steps for deployments

### ❌ Don't:
- Make commands too complex (split into multiple if needed)
- Include interactive prompts (commands should be fully automated)
- Assume state without verification
- Mix multiple unrelated workflows
- Use vague language ("do stuff", "handle errors")

---

## Example Command Library

### Development Workflow

**`.claude/commands/run-tests.md`**
```markdown
Run full test suite with coverage.

1. Check if node_modules exists (run npm install if missing)
2. Run tests with coverage (npm test -- --coverage)
3. Generate coverage report
4. Display coverage summary
5. If coverage below 80%, warn user
```

### Deployment Workflow

**`.claude/commands/deploy-production.md`**
```markdown
Deploy to production with safety checks.

1. CRITICAL: Verify current branch is main (exit if not)
2. Verify no uncommitted changes (git status)
3. Pull latest changes (git pull origin main)
4. Run full test suite (npm test)
5. Build production bundle (npm run build)
6. Deploy to Cloudflare production (npx wrangler deploy --env production)
7. Run smoke tests on production URL
8. If smoke tests fail, IMMEDIATELY rollback
9. If success, create deployment tag (git tag -a deploy-$(date +%Y%m%d-%H%M%S))
10. Push tag to remote (git push --tags)
```

### Code Quality

**`.claude/commands/format-code.md`**
```markdown
Format all code files with prettier and eslint.

1. Run prettier on all files (npx prettier --write .)
2. Run eslint with auto-fix (npx eslint --fix .)
3. Show summary of changes
4. If any unfixable errors, list them
```

### Database Operations

**`.claude/commands/create-migration.md`**
```markdown
Create a new database migration.

1. Ask user for migration name
2. Generate migration file with timestamp (npx wrangler d1 migrations create <name>)
3. Open migration file location
4. Remind user to:
   - Write up migration SQL
   - Write down migration SQL
   - Test locally (npx wrangler d1 migrations apply --local)
   - Then apply to remote (npx wrangler d1 migrations apply --remote)
```

---

## Advanced Patterns

### Conditional Execution

```markdown
Run tests only if code changed.

1. Check for uncommitted changes (git status)
2. If no changes, skip tests and report "No changes detected"
3. If changes exist:
   a. Stage changes (git add .)
   b. Run tests (npm test)
   c. If tests pass, allow commit
   d. If tests fail, report errors and unstage
```

### Multi-Environment Support

```markdown
Deploy to specified environment.

1. Prompt user to select environment (dev/staging/production)
2. Verify correct branch for environment:
   - dev: any branch
   - staging: develop or feature branches
   - production: ONLY main branch
3. Run environment-specific tests
4. Deploy using environment flag (npx wrangler deploy --env {selected})
5. Run environment-specific smoke tests
6. Report deployment URL
```

### Error Recovery

```markdown
Fix common build errors automatically.

1. Try build (npm run build)
2. If build fails:
   a. Check error message for common patterns
   b. If "node_modules" related: delete node_modules and reinstall
   c. If "cache" related: clear build cache
   d. If "type error": run type checking (npm run type-check)
   e. Retry build
3. If build still fails after retry, report full error to user
```

---

## Testing Your Custom Command

1. Create the command file in `.claude/commands/`
2. Test with Claude Code: `/your-command-name`
3. Verify Claude executes all steps correctly
4. Check error handling works
5. Ensure success criteria are clear

---

**Ready to create your custom command!**

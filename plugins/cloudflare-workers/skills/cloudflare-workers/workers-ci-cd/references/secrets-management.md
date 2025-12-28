# Secrets Management for Cloudflare Workers CI/CD

Complete guide for securely managing secrets, API keys, and environment variables in Workers deployments.

## Types of Configuration

### 1. Public Variables (wrangler.jsonc)

Non-sensitive configuration committed to git:

```jsonc
{
  "name": "my-worker",
  "vars": {
    "ENVIRONMENT": "production",
    "LOG_LEVEL": "info",
    "API_VERSION": "v1"
  }
}
```

### 2. Secrets (wrangler secret)

Sensitive data encrypted at rest:

```bash
# Set secret locally
wrangler secret put DATABASE_URL

# Set secret in CI
echo "${{ secrets.DATABASE_URL }}" | bunx wrangler secret put DATABASE_URL --env production
```

### 3. CI/CD Secrets (GitHub/GitLab)

Credentials for deployment:

- `CLOUDFLARE_API_TOKEN` - Deploy access
- `DATABASE_URL` - Database connection
- `STRIPE_SECRET_KEY` - Payment processing

## GitHub Secrets

### Setting Secrets

**Repository Secrets** (all environments):
1. Repository → Settings → Secrets → Actions
2. New repository secret
3. Add: `CLOUDFLARE_API_TOKEN`, `DATABASE_URL`, etc.

**Environment Secrets** (specific environments):
1. Repository → Settings → Environments → production
2. Add environment secret
3. Add: `DATABASE_URL_PRODUCTION`, `STRIPE_KEY_PRODUCTION`

### Using Secrets

```yaml
jobs:
  deploy:
    environment: production # Loads production-specific secrets
    steps:
      - name: Deploy with Secrets
        uses: cloudflare/wrangler-action@v4
        with:
          api-token: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Set Worker Secrets
        run: |
          echo "${{ secrets.DATABASE_URL }}" | \
            bunx wrangler secret put DATABASE_URL --env production

          echo "${{ secrets.STRIPE_SECRET_KEY }}" | \
            bunx wrangler secret put STRIPE_SECRET_KEY --env production
```

### Best Practices

**✅ DO**:
- Use masked secrets for sensitive data
- Scope secrets to environments
- Rotate secrets regularly
- Use descriptive secret names

**❌ DON'T**:
- Echo secrets in logs
- Commit secrets to git
- Share secrets across projects
- Use secrets in pull requests from forks

## GitLab Variables

### Setting Variables

**Project Variables**:
1. Project → Settings → CI/CD → Variables
2. Add variable
3. Options:
   - **Protected**: Only available in protected branches
   - **Masked**: Hidden in job logs
   - **Environment scope**: Limit to specific environment

### Using Variables

```yaml
deploy-production:
  script:
    - echo "$DATABASE_URL" | bunx wrangler secret put DATABASE_URL
  environment:
    name: production
  variables:
    DEPLOY_ENV: "production"
```

## Wrangler Secrets Management

### Setting Secrets

**Interactive (local)**:
```bash
wrangler secret put API_KEY
# Prompts for value
```

**Non-interactive (CI)**:
```bash
echo "secret-value" | wrangler secret put API_KEY
```

**Environment-specific**:
```bash
wrangler secret put API_KEY --env production
wrangler secret put API_KEY --env staging
```

### Listing Secrets

```bash
wrangler secret list
wrangler secret list --env production
```

### Deleting Secrets

```bash
wrangler secret delete API_KEY
wrangler secret delete API_KEY --env production
```

## Environment-Specific Configuration

### Multiple Environments

**wrangler.jsonc**:
```jsonc
{
  "name": "my-worker",

  "env": {
    "production": {
      "name": "my-worker-prod",
      "vars": {
        "ENVIRONMENT": "production",
        "API_URL": "https://api.example.com"
      }
    },
    "staging": {
      "name": "my-worker-staging",
      "vars": {
        "ENVIRONMENT": "staging",
        "API_URL": "https://staging-api.example.com"
      }
    }
  }
}
```

### CI Workflow

```yaml
deploy-production:
  steps:
    - run: |
        # Production secrets
        echo "${{ secrets.DATABASE_URL_PROD }}" | \
          bunx wrangler secret put DATABASE_URL --env production

        bunx wrangler deploy --env production

deploy-staging:
  steps:
    - run: |
        # Staging secrets (different values)
        echo "${{ secrets.DATABASE_URL_STAGING }}" | \
          bunx wrangler secret put DATABASE_URL --env staging

        bunx wrangler deploy --env staging
```

## External Secret Providers

### HashiCorp Vault

```yaml
- name: Import Secrets from Vault
  uses: hashicorp/vault-action@v2
  with:
    url: ${{ secrets.VAULT_ADDR }}
    token: ${{ secrets.VAULT_TOKEN }}
    secrets: |
      secret/data/cloudflare DATABASE_URL | DATABASE_URL

- name: Deploy with Vault Secrets
  run: |
    echo "$DATABASE_URL" | bunx wrangler secret put DATABASE_URL
```

### AWS Secrets Manager

```yaml
- name: Get Secrets from AWS
  uses: aws-actions/aws-secretsmanager-get-secrets@v1
  with:
    secret-ids: |
      CLOUDFLARE_*
    parse-json-secrets: true

- name: Deploy
  run: |
    echo "$CLOUDFLARE_DATABASE_URL" | \
      bunx wrangler secret put DATABASE_URL
```

### 1Password

```yaml
- name: Load 1Password Secrets
  uses: 1password/load-secrets-action@v1
  with:
    export-env: true
  env:
    OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
    DATABASE_URL: op://production/cloudflare/database-url

- name: Deploy
  run: |
    echo "$DATABASE_URL" | bunx wrangler secret put DATABASE_URL
```

## Secret Rotation

### Automated Rotation

```yaml
name: Rotate Secrets

on:
  schedule:
    - cron: '0 0 1 * *' # Monthly

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate New API Key
        id: new-key
        run: |
          NEW_KEY=$(openssl rand -hex 32)
          echo "::add-mask::$NEW_KEY"
          echo "key=$NEW_KEY" >> $GITHUB_OUTPUT

      - name: Update Worker Secret
        run: |
          echo "${{ steps.new-key.outputs.key }}" | \
            bunx wrangler secret put API_KEY --env production

      - name: Update GitHub Secret
        uses: gliech/create-github-secret-action@v1
        with:
          name: API_KEY
          value: ${{ steps.new-key.outputs.key }}
          pa_token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
```

## Security Best Practices

1. **Never log secrets**:
   ```yaml
   # ❌ WRONG
   - run: echo "API key: ${{ secrets.API_KEY }}"

   # ✅ CORRECT
   - run: echo "Deploying with API key" # No secret value
   ```

2. **Use masked secrets**:
   - GitHub: Automatically masked
   - GitLab: Check "Mask variable" option

3. **Scope secrets to environments**:
   - Production secrets only in production
   - Separate staging/dev secrets

4. **Rotate secrets regularly**:
   - API tokens: Every 90 days
   - Database credentials: Every 180 days

5. **Use least-privilege tokens**:
   - Cloudflare API token: Only Workers deploy permission
   - Database: Read/write only, no admin

6. **Audit secret access**:
   - Review who has access to secrets
   - Remove unused secrets
   - Monitor secret usage logs

## Troubleshooting

### Secret Not Found in Worker

**Symptom**: `env.SECRET_KEY` is undefined

**Cause**: Secret not set or wrong environment

**Fix**:
```bash
# List secrets to verify
wrangler secret list --env production

# Set if missing
wrangler secret put SECRET_KEY --env production
```

### Secret Exposed in Logs

**Symptom**: Secret value visible in CI logs

**Cause**: Secret echoed or printed

**Fix**: Remove all `echo` or `console.log` of secret values

### Deployment Fails with "Invalid API token"

**Cause**: Token expired or lacks permissions

**Fix**:
1. Generate new token: https://dash.cloudflare.com/profile/api-tokens
2. Update GitHub/GitLab secret
3. Redeploy

## Resources

- Wrangler Secrets: https://developers.cloudflare.com/workers/wrangler/commands/#secret
- GitHub Secrets: https://docs.github.com/actions/security-guides/encrypted-secrets
- GitLab Variables: https://docs.gitlab.com/ee/ci/variables/

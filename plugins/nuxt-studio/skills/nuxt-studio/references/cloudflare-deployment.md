# Cloudflare Deployment for Nuxt Studio

Complete guide for deploying Nuxt Studio to Cloudflare Pages and Workers with custom subdomain routing.

## Overview

Cloudflare provides two deployment options for Nuxt Studio:

1. **Cloudflare Pages**: Git-integrated automatic deployments (recommended)
2. **Cloudflare Workers**: Direct deployment with wrangler CLI

Both support:
- Custom subdomain routing (`studio.domain.com`)
- Environment variables for OAuth secrets
- Edge deployment for global performance
- Automatic HTTPS/SSL

## Prerequisites

Before deploying to Cloudflare:

- [ ] Cloudflare account created
- [ ] Domain added to Cloudflare (for custom subdomain)
- [ ] Nuxt Studio configured locally
- [ ] OAuth provider credentials ready
- [ ] `wrangler` CLI installed (for Workers deployment)

## Option 1: Cloudflare Pages (Recommended)

### Step 1: Configure Nitro Preset

Update `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/studio'],

  nitro: {
    preset: 'cloudflare-pages'
  }
})
```

### Step 2: Push Code to Git Repository

Studio on Cloudflare Pages requires Git integration:

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Configure Studio for Cloudflare Pages"

# Push to GitHub/GitLab
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

### Step 3: Create Cloudflare Pages Project

1. Go to **Cloudflare Dashboard** → **Workers & Pages**
2. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
3. Authenticate with GitHub or GitLab
4. Select your repository
5. Configure build settings:
   - **Framework preset**: Nuxt.js
   - **Build command**: `npm run build` (or `bun run build`)
   - **Build output directory**: `.output/public`
   - **Root directory**: `/` (or your app directory)
6. Click **"Save and Deploy"**

### Step 4: Configure Environment Variables

During initial setup or after creation:

1. Go to **Workers & Pages** → Select project → **Settings** → **Environment variables**
2. Add OAuth credentials:
   - `NUXT_OAUTH_GITHUB_CLIENT_ID` = `your_client_id`
   - `NUXT_OAUTH_GITHUB_CLIENT_SECRET` = `your_client_secret`
3. For production AND preview environments:
   - Click **"Add variable"** for each
   - Select both **Production** and **Preview** checkboxes
4. Click **"Save"**

### Step 5: Configure Custom Subdomain

#### Add Custom Domain

1. In Pages project, go to **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter subdomain: `studio.yourdomain.com`
4. Click **"Continue"**
5. Cloudflare automatically creates DNS records (if domain is on Cloudflare)

#### Manual DNS Configuration

If domain is not on Cloudflare DNS:

1. Add CNAME record in your DNS provider:
   - **Name**: `studio`
   - **Target**: `your-project.pages.dev`
   - **TTL**: Auto or 3600
2. Wait for DNS propagation (up to 48 hours, usually faster)
3. Verify in Cloudflare dashboard

### Step 6: Update OAuth Callback URLs

Update OAuth app callback URLs to match subdomain:

```
https://studio.yourdomain.com/api/auth/callback/github
```

### Step 7: Deploy and Test

1. Push changes to trigger deployment:
   ```bash
   git add .
   git commit -m "Add custom subdomain config"
   git push
   ```

2. Monitor deployment in Cloudflare dashboard
3. Visit `https://studio.yourdomain.com`
4. Test OAuth authentication
5. Verify content editing works

---

## Option 2: Cloudflare Workers

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
# or
bun add -g wrangler
```

### Step 2: Authenticate Wrangler

```bash
wrangler login
```

This opens browser for Cloudflare authentication.

### Step 3: Configure Nitro Preset

Update `nuxt.config.ts`:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/studio'],

  nitro: {
    preset: 'cloudflare'  // Use 'cloudflare' for Workers
  }
})
```

### Step 4: Create wrangler.toml

Create `wrangler.toml` in project root:

```toml
name = "studio-cms"
main = "./.output/server/index.mjs"
compatibility_date = "2025-12-25"

[site]
bucket = "./.output/public"

# Custom subdomain routing
routes = [
  { pattern = "studio.yourdomain.com/*", zone_name = "yourdomain.com" }
]

# Environment variables (reference only, set via dashboard)
[vars]
# NUXT_OAUTH_GITHUB_CLIENT_ID will be set via dashboard
```

### Step 5: Build for Workers

```bash
npm run build
# or
bun run build
```

This creates `.output/` directory with Worker-compatible build.

### Step 6: Deploy to Workers

```bash
wrangler deploy
```

Or with custom name:

```bash
wrangler deploy --name studio-cms
```

### Step 7: Configure Custom Routes

For subdomain routing:

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Your Worker**
2. Click **Routes** → **Add route**
3. Configure:
   - **Route**: `studio.yourdomain.com/*`
   - **Zone**: `yourdomain.com`
   - **Worker**: `studio-cms`
4. Click **"Save"**

### Step 8: Set Environment Variables

Workers environment variables:

```bash
# Set via wrangler CLI
wrangler secret put NUXT_OAUTH_GITHUB_CLIENT_ID
# Enter value when prompted

wrangler secret put NUXT_OAUTH_GITHUB_CLIENT_SECRET
# Enter secret when prompted
```

Or via dashboard:
1. **Workers & Pages** → Select worker → **Settings** → **Variables**
2. Add secrets as encrypted environment variables

### Step 9: Test Deployment

1. Visit `https://studio.yourdomain.com`
2. Verify routing works correctly
3. Test OAuth authentication
4. Check content editing functionality

---

## Subdomain Routing Configuration

### Cloudflare Pages Subdomain

Pages automatically handles subdomains via custom domains feature:

1. **Custom domains** → **Set up a custom domain**
2. Enter: `studio.yourdomain.com`
3. Cloudflare creates CNAME record automatically

**DNS Record Created**:
```
studio.yourdomain.com CNAME your-project.pages.dev
```

### Cloudflare Workers Subdomain

Workers require route configuration:

**Option A: wrangler.toml routes**:
```toml
routes = [
  { pattern = "studio.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

**Option B: Dashboard route configuration**:
1. **Workers & Pages** → Worker → **Routes** → **Add route**
2. Route: `studio.yourdomain.com/*`
3. Zone: `yourdomain.com`

---

## Environment Variables Best Practices

### Cloudflare Pages Variables

Set variables in dashboard:
1. **Workers & Pages** → Project → **Settings** → **Environment variables**
2. Add for both **Production** and **Preview**

**Production variables**:
```
NUXT_OAUTH_GITHUB_CLIENT_ID = prod_client_id
NUXT_OAUTH_GITHUB_CLIENT_SECRET = prod_secret
```

**Preview variables** (different OAuth app for preview):
```
NUXT_OAUTH_GITHUB_CLIENT_ID = preview_client_id
NUXT_OAUTH_GITHUB_CLIENT_SECRET = preview_secret
```

### Cloudflare Workers Secrets

Use `wrangler secret` for sensitive data:

```bash
wrangler secret put NUXT_OAUTH_GITHUB_CLIENT_SECRET
```

This encrypts the value and stores securely.

For non-sensitive variables, use `wrangler.toml`:

```toml
[vars]
NUXT_PUBLIC_STUDIO_URL = "https://studio.yourdomain.com"
```

---

## Build Configuration

### Cloudflare Pages Build Settings

Optimal build configuration:

- **Build command**: `npm run build` or `bun run build`
- **Build output directory**: `.output/public`
- **Root directory**: `/` (or subdirectory if monorepo)
- **Node version**: 18 or later (set via `NODE_VERSION` environment variable)

**Custom build command**:
```bash
# Use specific package manager
npm ci && npm run build

# Or with bun
bun install && bun run build

# Or with pnpm
pnpm install --frozen-lockfile && pnpm run build
```

### Build Environment Variables

Set build-time variables:

```
NODE_VERSION = 18
NPM_VERSION = 10
```

For Bun:
```
BUN_VERSION = 1.3.5
```

---

## Custom Domain Configuration

### DNS Setup for Subdomain

For `studio.yourdomain.com`:

**If domain on Cloudflare DNS**:
- Automatic when adding custom domain in Pages

**If domain on external DNS**:
1. Add CNAME record:
   - **Name**: `studio`
   - **Target**: `your-project.pages.dev`
   - **Proxy status**: DNS only (gray cloud)
2. Wait for DNS propagation
3. Verify: `dig studio.yourdomain.com`

### SSL/TLS Configuration

Cloudflare provides automatic SSL:

1. **SSL/TLS** → **Overview**
2. Set to **"Full"** or **"Full (strict)"**
3. Universal SSL certificate covers subdomain
4. HTTPS enforced automatically

### Redirect HTTP to HTTPS

Configure page rule:

1. **Rules** → **Page Rules** → **Create Page Rule**
2. URL: `http://studio.yourdomain.com/*`
3. Setting: **Always Use HTTPS**
4. Save and deploy

---

## Deployment Workflows

### Automatic Deployments (Pages)

Cloudflare Pages auto-deploys on git push:

1. Push to `main` branch → Production deployment
2. Push to other branches → Preview deployment
3. Pull requests → Preview deployments

**Deployment URL pattern**:
- Production: `studio.yourdomain.com`
- Preview: `[branch].[project].pages.dev`

### Manual Deployments (Workers)

Deploy manually with wrangler:

```bash
# Build and deploy
npm run build && wrangler deploy

# Deploy to specific environment
wrangler deploy --env production
```

### CI/CD Integration

**GitHub Actions example**:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: your-project
          directory: .output/public
```

---

## Troubleshooting Cloudflare Deployment

### Build Fails on Cloudflare

**Issue**: Build succeeds locally but fails on Cloudflare

**Solutions**:
1. Check Node version matches: Set `NODE_VERSION` env var
2. Verify all dependencies in `package.json`
3. Check build logs for missing dependencies
4. Ensure `nitro.preset` is set to `cloudflare-pages`

### Custom Domain Not Working

**Issue**: Subdomain returns 404 or connection errors

**Solutions**:
1. Verify DNS record exists and points correctly
2. Check SSL/TLS mode is "Full" or "Full (strict)"
3. Wait for DNS propagation (up to 48 hours)
4. Clear browser cache and DNS cache
5. Test with `curl -I https://studio.yourdomain.com`

### OAuth Redirect Fails

**Issue**: Authentication redirects to wrong URL

**Solutions**:
1. Verify `NUXT_PUBLIC_STUDIO_URL` environment variable
2. Check OAuth app callback URL matches deployment URL
3. Ensure environment variables set for correct environment (production/preview)
4. Test callback URL: `https://studio.yourdomain.com/api/auth/callback/github`

### Environment Variables Not Loading

**Issue**: Environment variables undefined at runtime

**Solutions**:
1. Verify variables set in Cloudflare dashboard
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding variables
4. For Workers: Use `wrangler secret` for sensitive data
5. Check if variables need `NUXT_` prefix for Nuxt to recognize

---

## Performance Optimization

### Edge Caching

Configure Cloudflare caching for static assets:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
    cloudflare: {
      pages: {
        routes: {
          include: ['/*'],
          exclude: ['/api/*']  // Don't cache API routes
        }
      }
    }
  }
})
```

### Asset Optimization

Optimize static assets:

1. **Images**: Use Cloudflare Images or R2 for media library
2. **Fonts**: Serve from Cloudflare CDN
3. **Scripts**: Enable minification and compression

### Regional Performance

Cloudflare automatically serves from nearest edge location. Monitor performance:

1. **Analytics** → **Web Analytics**
2. Check response times by region
3. Optimize based on geographic distribution

---

## Cost Considerations

### Cloudflare Pages Pricing

- **Free tier**: 500 builds/month, unlimited requests
- **Paid tier**: $20/month for 5,000 builds/month

Studio typically uses <100 builds/month on free tier.

### Cloudflare Workers Pricing

- **Free tier**: 100,000 requests/day
- **Paid tier**: $5/month for 10M requests/month

Studio typically fits in free tier for small teams.

### Custom Domain

No additional cost for custom subdomain on Cloudflare.

---

## Next Steps

After deploying to Cloudflare:

1. **Test thoroughly**: Authentication, content editing, Git commits
2. **Monitor deployments**: Set up notifications for failed builds
3. **Configure team access**: Add team members to Cloudflare project
4. **Set up backups**: Regular content backups via Git
5. **Document deployment**: Share deployment URL and access instructions with team

---
name: nuxt-studio:deploy-cloudflare
description: Guide for deploying Nuxt Studio to Cloudflare Pages or Workers with custom subdomain routing
argument-hint: No arguments required - interactive deployment guide
allowed-tools: [Read, Write, Edit, Bash, AskUserQuestion]
---

# Deploy Studio to Cloudflare

Comprehensive guide for deploying Nuxt Studio to Cloudflare Pages or Workers with subdomain configuration.

## Execution Steps

### 1. Choose Deployment Method

Ask user:

**Question**: "Which Cloudflare deployment method do you prefer?"
- Header: "Deployment Type"
- Options:
  - **Cloudflare Pages** (Recommended): "Git-integrated automatic deployments, easier setup"
  - **Cloudflare Workers**: "Direct deployment with wrangler, more control"
- Multi-select: false

Store choice for later steps.

### 2. Verify Prerequisites

Check required tools and configuration:

**For Both Methods:**
- Cloudflare account exists
- Domain added to Cloudflare (for custom subdomain)
- OAuth credentials configured
- Nuxt Studio module installed

**For Workers Only:**
- wrangler CLI installed

Check wrangler installation:

```bash
wrangler --version
```

If not installed and Workers chosen:

```
wrangler is not installed. Install it with:

npm install -g wrangler
# or
bun add -g wrangler

Then run: wrangler login
```

Stop and wait for installation.

### 3. Configure Build Settings

Read nuxt.config.ts and verify Cloudflare preset:

Check for:
```typescript
nitro: {
  preset: 'cloudflare-pages'  // or 'cloudflare' for Workers
}
```

If not set, ask user to confirm adding it:

"I need to configure the Nitro preset for Cloudflare. OK to update nuxt.config.ts?"

If approved, add/update:

**For Cloudflare Pages:**
```typescript
nitro: {
  preset: 'cloudflare-pages'
}
```

**For Cloudflare Workers:**
```typescript
nitro: {
  preset: 'cloudflare'
}
```

Use Edit tool to update nuxt.config.ts.

### 4. Build the Application

Run the build command:

```bash
npm run build
```

Monitor the build output for errors.

If build fails:
- Show error to user
- Check common issues:
  - Missing dependencies
  - Incompatible modules
  - Configuration errors
- Suggest fixes based on error
- Offer to check references/troubleshooting.md

If build succeeds:

```
✓ Build completed successfully!

Output directory: .output/
- Public assets: .output/public
- Server code: .output/server
```

### 5A. Cloudflare Pages Deployment (if chosen)

#### Step 1: Git Repository Setup

Check if Git is configured:

```bash
git remote -v
```

If no remote:

```
Studio deployment requires a Git repository.

Initialize Git and push to GitHub/GitLab:

1. git init
2. git add .
3. git commit -m "Configure Studio for Cloudflare"
4. git remote add origin https://github.com/username/repo.git
5. git push -u origin main

Then re-run this command.
```

Stop and wait for Git setup.

If remote exists, continue.

#### Step 2: Create Pages Project

Provide instructions:

```
Create Cloudflare Pages Project:

1. Open Cloudflare Dashboard:
   https://dash.cloudflare.com

2. Navigate to: Workers & Pages → Create application → Pages → Connect to Git

3. Authenticate with GitHub/GitLab

4. Select your repository

5. Configure build settings:
   - Framework preset: Nuxt.js
   - Build command: npm run build
   - Build output directory: .output/public
   - Root directory: / (or your app subdirectory)

6. Click "Save and Deploy"

7. Wait for first deployment to complete
```

#### Step 3: Configure Environment Variables

Provide instructions:

```
Set Environment Variables in Cloudflare:

1. Go to: Workers & Pages → [Your Project] → Settings → Environment variables

2. Add these variables for Production:

   NUXT_OAUTH_[PROVIDER]_CLIENT_ID = [your_client_id]
   NUXT_OAUTH_[PROVIDER]_CLIENT_SECRET = [your_secret]
   NUXT_PUBLIC_STUDIO_URL = https://studio.yourdomain.com

3. For Preview environment (optional):
   - Add same variables with preview values
   - Use different OAuth app for preview

4. Click "Save"

5. Redeploy to apply variables:
   - Go to Deployments tab
   - Click "Retry deployment" on latest

IMPORTANT: Use the production OAuth credentials you configured earlier.
```

Ask user to confirm when done.

#### Step 4: Configure Custom Subdomain

Provide instructions:

```
Set Up Custom Subdomain:

1. In your Pages project, go to: Custom domains

2. Click "Set up a custom domain"

3. Enter your subdomain:
   studio.yourdomain.com
   (or the subdomain you chose during setup)

4. Click "Continue"

5. If domain is on Cloudflare DNS:
   - DNS record created automatically ✓
   - Shows "Active" status when ready

6. If domain on external DNS:
   - Add CNAME record:
     Name: studio
     Target: [project-name].pages.dev
   - Wait for DNS propagation (5-60 minutes)

7. Verify subdomain works:
   Visit: https://studio.yourdomain.com
```

#### Step 5: Update OAuth Callback URLs

Remind user:

```
⚠️ UPDATE OAUTH CALLBACK URLS

Your OAuth app callback URL must match the production URL:

For GitHub:
https://github.com/settings/developers
→ Update "Authorization callback URL" to:
https://studio.yourdomain.com/api/auth/callback/github

For GitLab:
https://gitlab.com/-/profile/applications
→ Update "Redirect URI" to:
https://studio.yourdomain.com/api/auth/callback/gitlab

For Google:
https://console.cloud.google.com/apis/credentials
→ Update "Authorized redirect URIs" to:
https://studio.yourdomain.com/api/auth/callback/google

This is CRITICAL for authentication to work!
```

### 5B. Cloudflare Workers Deployment (if chosen)

#### Step 1: Authenticate Wrangler

```bash
wrangler login
```

This opens browser for authentication.

Confirm user is logged in:

```bash
wrangler whoami
```

#### Step 2: Create/Update wrangler.toml

Check if wrangler.toml exists:

```bash
ls wrangler.toml
```

If not exists, offer to create from template:

"I'll create a wrangler.toml for your deployment. What is your domain name?"

Get domain from user, then create wrangler.toml:

```toml
name = "studio-cms"
main = "./.output/server/index.mjs"
compatibility_date = "2025-12-25"

[assets]
directory = "./.output/public"

routes = [
  { pattern = "studio.yourdomain.com/*", zone_name = "yourdomain.com" }
]

[vars]
NUXT_PUBLIC_STUDIO_URL = "https://studio.yourdomain.com"
```

Replace yourdomain.com with user's domain.

Use Write tool to create file.

#### Step 3: Set Secrets

Run secret commands:

```bash
# Set OAuth secrets
wrangler secret put NUXT_OAUTH_[PROVIDER]_CLIENT_ID
# Paste value when prompted

wrangler secret put NUXT_OAUTH_[PROVIDER]_CLIENT_SECRET
# Paste value when prompted
```

Provide instructions to user:

```
When prompted, paste your OAuth credentials:

For GitHub:
- CLIENT_ID: [paste the Client ID you saved]
- CLIENT_SECRET: [paste the secret you saved]

Secrets are encrypted and stored securely.
```

#### Step 4: Deploy Worker

```bash
wrangler deploy
```

Monitor deployment output.

If successful:

```
✓ Deployed to Cloudflare Workers!

Worker URL: https://studio-cms.[account].workers.dev
Custom domain: https://studio.yourdomain.com
```

If fails:
- Show error
- Check common issues
- Suggest fixes

#### Step 5: Configure Custom Routes

Provide instructions:

```
Configure Custom Domain Routes:

1. Open Cloudflare Dashboard:
   https://dash.cloudflare.com

2. Go to: Workers & Pages → [Your Worker] → Routes

3. Click "Add route"

4. Configure:
   - Route: studio.yourdomain.com/*
   - Zone: yourdomain.com
   - Worker: studio-cms

5. Click "Save"

6. Verify routing works:
   Visit: https://studio.yourdomain.com
```

#### Step 6: Update OAuth Callback URLs

Same as Pages deployment (Step 5 in 5A).

### 6. Verify Deployment

Provide verification checklist:

```
Deployment Verification Checklist:

1. DNS Resolution:
   Run: dig studio.yourdomain.com
   Should show CNAME or A record

2. HTTPS Certificate:
   Visit: https://studio.yourdomain.com
   Should show valid SSL certificate (green lock)

3. Studio UI Loads:
   Visit: https://studio.yourdomain.com/_studio
   Should show Studio interface

4. OAuth Authentication:
   Click "Sign in with [Provider]"
   Should redirect to OAuth provider
   After authorization, should return to Studio

5. Content Editing:
   Try editing a content file
   Make changes
   Commit from Studio UI

6. Git Integration:
   Check GitHub/GitLab for Studio commit
   Should show commit from Studio

If any check fails, see references/troubleshooting.md
```

### 7. Deployment Summary

Provide final summary:

```
🎉 Deployment Complete!

Deployment Type: [Pages/Workers]
Studio URL: https://studio.yourdomain.com
OAuth Provider: [provider]

Quick Access:
- Studio: https://studio.yourdomain.com/_studio
- Main site: https://yourdomain.com
- Cloudflare Dashboard: https://dash.cloudflare.com

Environment Variables Set:
✓ NUXT_OAUTH_[PROVIDER]_CLIENT_ID
✓ NUXT_OAUTH_[PROVIDER]_CLIENT_SECRET
✓ NUXT_PUBLIC_STUDIO_URL

Next Steps:

1. Share Studio URL with team members
2. Configure user permissions (if needed)
3. Set up monitoring/analytics
4. Document deployment process for team

For ongoing management:
- Update content via Studio UI
- Changes auto-deploy (Pages) or redeploy (Workers)
- Monitor deployments in Cloudflare dashboard

Troubleshooting: references/troubleshooting.md
Cloudflare Docs: references/cloudflare-deployment.md
```

### 8. Offer Additional Help

Ask user:

"Would you like help with any of these?"
- Set up additional environments (staging/preview)
- Configure team access
- Set up custom domains for preview branches
- Review security settings

Provide guidance based on choice.

## Important Notes

- Always verify OAuth callback URLs after deployment
- Test authentication immediately after deployment
- Keep OAuth secrets secure (use wrangler secret for Workers)
- Monitor first few deployments for issues
- Document deployment process for team

## Error Handling

Common deployment issues:

1. **Build fails on Cloudflare**:
   - Check Node version (set NODE_VERSION=18 in env vars)
   - Verify all dependencies in package.json
   - Check for incompatible modules

2. **OAuth redirect_uri_mismatch**:
   - Verify OAuth app callback URL matches exactly
   - Check HTTPS vs HTTP
   - Confirm subdomain is correct

3. **404 on custom domain**:
   - DNS not propagated yet (wait 5-60 minutes)
   - CNAME record incorrect
   - Custom domain not added in Cloudflare

4. **Authentication loop**:
   - NUXT_PUBLIC_STUDIO_URL doesn't match actual URL
   - SSL mode set to "Flexible" (should be "Full")
   - Cookies blocked in browser

## Tips

- For Pages: Use Git-based workflow for easy rollbacks
- For Workers: Use wrangler environments for staging
- Always test locally before deploying
- Use preview deployments for testing changes
- Monitor deployment logs for issues

## Reference Files

For detailed deployment guides:
- references/cloudflare-deployment.md (complete guide)
- references/subdomain-setup.md (DNS configuration)
- templates/wrangler.toml (Workers config template)
- references/troubleshooting.md (deployment errors)

---
name: nuxt-studio:env-setup
description: Helper for setting up OAuth environment variables on Cloudflare dashboard and other platforms
argument-hint: No arguments required - interactive environment variable setup guide
allowed-tools: [Read, AskUserQuestion]
---

# Studio Environment Variables Setup

Guide users through setting environment variables for OAuth secrets on deployment platforms, with focus on security best practices.

## Execution Steps

### 1. Detect Current Environment

Check if .env.local exists and read current OAuth configuration:

```bash
# Read .env.local to see what's configured locally
```

Identify configured providers:
- GitHub: NUXT_OAUTH_GITHUB_CLIENT_ID
- GitLab: NUXT_OAUTH_GITLAB_CLIENT_ID
- Google: NUXT_OAUTH_GOOGLE_CLIENT_ID

If no providers configured:

```
⚠️ No OAuth providers configured locally.

Run /nuxt-studio:configure-studio-auth first to set up OAuth.

This command helps you transfer those credentials to your deployment platform securely.
```

Stop and wait for OAuth configuration.

### 2. Choose Deployment Platform

Ask user:

**Question**: "Where are you deploying Studio?"
- Header: "Platform"
- Options:
  - **Cloudflare Pages**: "Environment variables via dashboard"
  - **Cloudflare Workers**: "Secrets via wrangler CLI"
  - **Vercel**: "Environment variables via project settings"
  - **Netlify**: "Environment variables via site settings"
- Multi-select: false

### 3. Platform-Specific Instructions

Based on chosen platform, provide detailed instructions:

#### For Cloudflare Pages:

```
Setting Environment Variables on Cloudflare Pages:

1. Open Cloudflare Dashboard:
   https://dash.cloudflare.com

2. Navigate to:
   Workers & Pages → [Your Project Name] → Settings → Environment variables

3. Click "Add variable" for each of these:

   FOR PRODUCTION ENVIRONMENT:
```

For each configured provider, list the variables:

**If GitHub configured:**
```
   Variable Name: NUXT_OAUTH_GITHUB_CLIENT_ID
   Value: [your GitHub Client ID]
   Environment: ✓ Production

   Variable Name: NUXT_OAUTH_GITHUB_CLIENT_SECRET
   Value: [your GitHub Client Secret]
   Environment: ✓ Production
```

**If GitLab configured:**
```
   Variable Name: NUXT_OAUTH_GITLAB_CLIENT_ID
   Value: [your GitLab Application ID]
   Environment: ✓ Production

   Variable Name: NUXT_OAUTH_GITLAB_CLIENT_SECRET
   Value: [your GitLab Secret]
   Environment: ✓ Production

   (If self-hosted GitLab)
   Variable Name: NUXT_OAUTH_GITLAB_SERVER_URL
   Value: https://gitlab.yourcompany.com
   Environment: ✓ Production
```

**If Google configured:**
```
   Variable Name: NUXT_OAUTH_GOOGLE_CLIENT_ID
   Value: [your Google Client ID]
   Environment: ✓ Production

   Variable Name: NUXT_OAUTH_GOOGLE_CLIENT_SECRET
   Value: [your Google Client Secret]
   Environment: ✓ Production
```

**Always add:**
```
   Variable Name: NUXT_PUBLIC_STUDIO_URL
   Value: https://studio.yourdomain.com
   Environment: ✓ Production
```

Continue instructions:

```
4. Click "Save" after adding all variables

5. FOR PREVIEW ENVIRONMENT (optional but recommended):
   - Repeat steps above
   - Select ✓ Preview environment instead
   - Use different OAuth app credentials for preview
   - Use preview URL for NUXT_PUBLIC_STUDIO_URL

6. Redeploy to apply variables:
   - Go to "Deployments" tab
   - Click "Retry deployment" on latest deployment
   - Wait for deployment to complete

7. Verify variables are loaded:
   - Check deployment logs for any OAuth errors
   - Test authentication after deployment
```

#### For Cloudflare Workers:

```
Setting Secrets on Cloudflare Workers:

Use wrangler CLI to set secrets securely:

1. Ensure you're logged in:
   wrangler whoami

2. Set OAuth secrets (one at a time):
```

For each configured provider, provide wrangler commands:

**If GitHub configured:**
```
   wrangler secret put NUXT_OAUTH_GITHUB_CLIENT_ID
   (Paste your GitHub Client ID when prompted)

   wrangler secret put NUXT_OAUTH_GITHUB_CLIENT_SECRET
   (Paste your GitHub Client Secret when prompted)
```

**If GitLab configured:**
```
   wrangler secret put NUXT_OAUTH_GITLAB_CLIENT_ID
   (Paste your GitLab Application ID when prompted)

   wrangler secret put NUXT_OAUTH_GITLAB_CLIENT_SECRET
   (Paste your GitLab Secret when prompted)

   (If self-hosted GitLab)
   wrangler secret put NUXT_OAUTH_GITLAB_SERVER_URL
   (Paste your GitLab server URL when prompted)
```

**If Google configured:**
```
   wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_ID
   (Paste your Google Client ID when prompted)

   wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_SECRET
   (Paste your Google Client Secret when prompted)
```

Continue instructions:

```
3. Set public variables in wrangler.toml:

   Edit wrangler.toml and add:

   [vars]
   NUXT_PUBLIC_STUDIO_URL = "https://studio.yourdomain.com"

4. Deploy with updated secrets:
   wrangler deploy

5. Verify secrets are set:
   wrangler secret list

IMPORTANT:
- Secrets are encrypted and never shown again
- wrangler.toml can be committed to Git (no secrets there)
- Use wrangler secret for sensitive values only
```

#### For Vercel:

```
Setting Environment Variables on Vercel:

1. Open Vercel Dashboard:
   https://vercel.com/dashboard

2. Navigate to:
   Your Project → Settings → Environment Variables

3. Add these variables:

   FOR PRODUCTION:
```

List variables for each configured provider (similar to Cloudflare Pages format).

```
4. Select environment for each:
   - ✓ Production
   - ✓ Preview (optional)
   - Development (optional, for vercel dev)

5. Click "Save" after adding all variables

6. Redeploy:
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

7. Verify:
   - Check deployment logs
   - Test OAuth authentication
```

#### For Netlify:

```
Setting Environment Variables on Netlify:

1. Open Netlify Dashboard:
   https://app.netlify.com

2. Navigate to:
   Your Site → Site settings → Environment variables

3. Click "Add a variable" for each:
```

List variables for each configured provider.

```
4. Scope options:
   - All (recommended for OAuth)
   - Or select specific contexts

5. Click "Save" after adding all variables

6. Trigger redeploy:
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

7. Verify:
   - Check deploy logs
   - Test authentication
```

### 4. Security Best Practices Reminder

Provide security guidance:

```
🔒 SECURITY BEST PRACTICES

1. NEVER commit secrets to Git
   ✓ .env.local is in .gitignore
   ✓ Use deployment platform for production secrets

2. Use different OAuth apps per environment:
   - Development: localhost callbacks
   - Preview/Staging: preview.domain.com callbacks
   - Production: studio.domain.com callbacks

3. Rotate secrets regularly:
   - Every 3-6 months minimum
   - Immediately if compromised
   - Update on all platforms

4. Limit access:
   - Only give deployment access to necessary team members
   - Use read-only tokens where possible
   - Monitor access logs

5. Verify secrets are loaded:
   - Check deployment logs
   - Test OAuth authentication
   - Never log secrets in application

6. Use secret scanning:
   - Enable GitHub secret scanning (if using GitHub)
   - Use git-secrets or similar tools locally
   - Review commits before pushing
```

### 5. Environment Variables Checklist

Provide checklist for user:

```
Environment Variables Checklist:

✓ All required variables:
```

Generate checklist based on configured providers:

**For GitHub:**
```
  □ NUXT_OAUTH_GITHUB_CLIENT_ID
  □ NUXT_OAUTH_GITHUB_CLIENT_SECRET
```

**For GitLab:**
```
  □ NUXT_OAUTH_GITLAB_CLIENT_ID
  □ NUXT_OAUTH_GITLAB_CLIENT_SECRET
  □ NUXT_OAUTH_GITLAB_SERVER_URL (if self-hosted)
```

**For Google:**
```
  □ NUXT_OAUTH_GOOGLE_CLIENT_ID
  □ NUXT_OAUTH_GOOGLE_CLIENT_SECRET
```

**Always:**
```
  □ NUXT_PUBLIC_STUDIO_URL

✓ Correct environment selected:
  □ Production environment
  □ Preview environment (optional)

✓ Values correct:
  □ No typos in variable names
  □ No extra spaces in values
  □ URLs include https:// (production)

✓ Deployment:
  □ Redeployed after adding variables
  □ Deployment succeeded
  □ No errors in logs

✓ Testing:
  □ Studio loads at subdomain
  □ OAuth authentication works
  □ Can edit content
  □ Git commits work
```

### 6. Verification Steps

Provide testing instructions:

```
Verify Environment Variables Are Working:

1. Check deployment logs:
   - Look for any "undefined" environment variable warnings
   - Check for OAuth configuration errors

2. Test OAuth authentication:
   - Visit: https://studio.yourdomain.com/_studio
   - Click "Sign in with [Provider]"
   - Should redirect to OAuth provider
   - After authorization, should return to Studio

3. Check browser console:
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check network tab for failed API calls

4. Test content editing:
   - Edit a content file
   - Save changes
   - Verify Git commit appears

If any step fails:
- Double-check variable names (case-sensitive!)
- Verify values match OAuth app credentials
- Ensure NUXT_PUBLIC_STUDIO_URL matches deployment URL
- See references/troubleshooting.md for common issues
```

### 7. Troubleshooting Common Issues

Provide quick troubleshooting:

```
Common Environment Variable Issues:

1. Variables not loading:
   - Check variable names match exactly
   - Verify environment is selected correctly
   - Redeploy after adding variables

2. OAuth still using local credentials:
   - Clear .env.local temporarily
   - Redeploy
   - Verify production variables are used

3. Authentication fails after deployment:
   - Check NUXT_PUBLIC_STUDIO_URL matches actual URL
   - Verify OAuth callback URL in OAuth app matches
   - Check secrets are set correctly (no typos)

4. "Invalid client" error:
   - Client ID incorrect
   - Client secret incorrect
   - Regenerate and update if needed

5. Variables showing as undefined:
   - Restart dev server (local)
   - Redeploy (production)
   - Check for typos in environment variable names

For detailed troubleshooting:
Load references/troubleshooting.md
```

### 8. Summary and Next Steps

Provide final guidance:

```
Environment Variables Setup Complete!

Platform: [chosen platform]
Variables configured: [count] OAuth variables + 1 public URL

What's Next:

1. Test authentication thoroughly
2. Document variable names for team
3. Set up monitoring for OAuth errors
4. Schedule regular secret rotation

Maintenance:

- Rotate secrets every 3-6 months
- Update on all platforms when rotating
- Test after any OAuth app changes
- Keep backup of Client IDs (secrets can be regenerated)

For ongoing help:
- OAuth issues: references/oauth-providers.md
- Deployment issues: references/cloudflare-deployment.md
- All errors: references/troubleshooting.md
```

## Important Notes

- Never display actual secret values in output
- Emphasize different OAuth apps for different environments
- Remind about case-sensitivity of variable names
- Always suggest redeployment after adding variables
- Provide platform-specific documentation links

## Error Handling

If user encounters issues:
- Ask which specific error they're seeing
- Provide targeted troubleshooting
- Offer to check configuration files
- Suggest running test scripts

## Tips for Users

- Use descriptive notes in platform dashboards
- Document which OAuth app is for which environment
- Keep OAuth app configuration and environment variables in sync
- Test immediately after setting variables
- Use preview/staging environments before production

## Reference Files

For detailed guides:
- references/oauth-providers.md (OAuth setup details)
- references/cloudflare-deployment.md (Cloudflare-specific)
- references/troubleshooting.md (Error solutions)
- templates/studio-auth-*.ts (OAuth reference)

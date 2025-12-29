---
name: nuxt-studio:configure-auth
description: Step-by-step guide for configuring OAuth authentication (GitHub/GitLab/Google) for Nuxt Studio
argument-hint: No arguments required - interactive OAuth setup guide
allowed-tools: [Read, Write, Edit, WebFetch, AskUserQuestion]
---

# Configure Studio OAuth Authentication

Guide the user through OAuth provider setup with detailed instructions and credential management.

## Execution Steps

### 1. Detect Current Configuration

Read .env.local (or .env) to check for existing OAuth configuration:

```bash
# Check for existing OAuth variables
```

Identify which providers (if any) are already configured:
- GitHub: NUXT_OAUTH_GITHUB_CLIENT_ID
- GitLab: NUXT_OAUTH_GITLAB_CLIENT_ID
- Google: NUXT_OAUTH_GOOGLE_CLIENT_ID

### 2. Choose Provider (if not already configured)

If no provider is configured, ask user:

**Question**: "Which OAuth provider would you like to set up?"
- Header: "OAuth Provider"
- Options:
  - **GitHub** (Recommended): "Best for GitHub repositories. Quick setup."
  - **GitLab**: "For GitLab.com or self-hosted instances"
  - **Google**: "Universal option for any team members"
- Multi-select: false

If multiple providers already configured, ask which one to reconfigure.

### 3. Determine Deployment URL

Ask user:

**Question**: "What is your Studio deployment URL?"
- Header: "Deployment URL"
- Options:
  - **Local Development**: "http://localhost:3000 (for testing)"
  - **Production**: "Custom production URL (e.g., https://studio.yourdomain.com)"
- Multi-select: false

If "Production" selected, ask for the full URL.

### 4. Provider-Specific Setup Instructions

Based on chosen provider, provide detailed setup instructions:

#### For GitHub OAuth:

**Step 1: Create OAuth App**

Provide instructions:

```
1. Open GitHub OAuth Apps page:
   https://github.com/settings/developers

2. Click "New OAuth App"

3. Fill in the form:
   - Application name: "[Your Site] - Studio CMS"
   - Homepage URL: https://yourdomain.com
   - Authorization callback URL: [DEPLOYMENT_URL]/api/auth/callback/github

   Example callback URL:
   - Local: http://localhost:3000/api/auth/callback/github
   - Production: https://studio.yourdomain.com/api/auth/callback/github

4. Click "Register application"

5. Note your Client ID (shown on the page)

6. Click "Generate a new client secret"

7. Copy the secret IMMEDIATELY (shown only once)
```

Offer to open the URL in browser:
- Use WebFetch to check if URL is accessible
- Tell user: "I can't open browsers, but visit this URL: https://github.com/settings/developers"

**Step 2: Get Credentials**

Ask user for credentials:

"Please paste your GitHub OAuth credentials:"

Use AskUserQuestion or prompt user to provide:
1. Client ID
2. Client Secret

**Step 3: Update Environment Variables**

Update .env.local file:

```bash
# GitHub OAuth
NUXT_OAUTH_GITHUB_CLIENT_ID=[provided_client_id]
NUXT_OAUTH_GITHUB_CLIENT_SECRET=[provided_secret]
```

Use Edit tool to update the file, or Write if it doesn't exist.

#### For GitLab OAuth:

**Step 1: Create OAuth Application**

Provide instructions:

```
1. Open GitLab Applications page:
   - GitLab.com: https://gitlab.com/-/profile/applications
   - Self-hosted: https://your-gitlab.com/-/profile/applications

2. Fill in the form:
   - Name: "[Your Site] - Studio CMS"
   - Redirect URI: [DEPLOYMENT_URL]/api/auth/callback/gitlab

   Example callback URL:
   - Local: http://localhost:3000/api/auth/callback/gitlab
   - Production: https://studio.yourdomain.com/api/auth/callback/gitlab

   - Confidential: ✅ CHECK THIS BOX (required!)
   - Scopes: Select these:
     ✅ read_user
     ✅ read_repository
     ✅ write_repository

3. Click "Save application"

4. Copy the Application ID and Secret
```

**Step 2: Check for Self-Hosted**

Ask user:

"Are you using self-hosted GitLab?"
- If yes, ask for GitLab server URL (e.g., https://gitlab.yourcompany.com)
- If no, use https://gitlab.com

**Step 3: Get Credentials**

Prompt user for:
1. Application ID
2. Secret
3. Server URL (if self-hosted)

**Step 4: Update Environment Variables**

```bash
# GitLab OAuth
NUXT_OAUTH_GITLAB_CLIENT_ID=[application_id]
NUXT_OAUTH_GITLAB_CLIENT_SECRET=[secret]

# For self-hosted only:
NUXT_OAUTH_GITLAB_SERVER_URL=[server_url]
```

#### For Google OAuth:

**Step 1: Create Google Cloud Project**

Provide instructions:

```
1. Open Google Cloud Console:
   https://console.cloud.google.com/apis/credentials

2. Create or select a project

3. Configure OAuth Consent Screen (if first time):
   - Click "OAuth consent screen" in sidebar
   - User Type:
     * Internal (for Google Workspace - recommended)
     * External (for any Google accounts)
   - App name: "[Your Site] Studio CMS"
   - User support email: [your email]
   - Authorized domains: yourdomain.com
   - Scopes: openid, email, profile
   - Save and continue

4. Create OAuth Client ID:
   - Click "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Studio CMS"
   - Authorized JavaScript origins:
     * Local: http://localhost:3000
     * Production: https://studio.yourdomain.com
   - Authorized redirect URIs:
     * Local: http://localhost:3000/api/auth/callback/google
     * Production: https://studio.yourdomain.com/api/auth/callback/google
   - Click "Create"

5. Copy Client ID and Client Secret
```

**Step 2: Get Credentials**

Prompt user for:
1. Client ID (format: *.apps.googleusercontent.com)
2. Client Secret

**Step 3: Update Environment Variables**

```bash
# Google OAuth
NUXT_OAUTH_GOOGLE_CLIENT_ID=[client_id]
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=[secret]
```

### 5. Update nuxt.config.ts

Read nuxt.config.ts and check if runtimeConfig includes OAuth configuration.

If not, add it:

```typescript
runtimeConfig: {
  oauth: {
    [provider]: {
      clientId: process.env.NUXT_OAUTH_[PROVIDER]_CLIENT_ID,
      clientSecret: process.env.NUXT_OAUTH_[PROVIDER]_CLIENT_SECRET
    }
  },
  public: {
    studioUrl: process.env.NUXT_PUBLIC_STUDIO_URL || 'http://localhost:3000'
  }
}
```

Use Edit tool to update configuration.

### 6. Verify Configuration

Run the OAuth test script:

```bash
bash $CLAUDE_PLUGIN_ROOT/skills/nuxt-studio/scripts/test-oauth.sh
```

Check if all required variables are set correctly.

If issues found:
- Report them to user
- Offer to fix them
- Retest after fixes

### 7. Security Reminder

Remind user about security:

```
⚠️ SECURITY REMINDERS:

1. NEVER commit .env.local to Git
   - Already added to .gitignore ✓

2. Use different OAuth apps for different environments:
   - Local: localhost callback
   - Staging: staging.domain.com callback
   - Production: studio.domain.com callback

3. Rotate secrets regularly (every 3-6 months)

4. For production deployment:
   - Set secrets via deployment platform dashboard
   - Don't use .env files in production
   - Use Cloudflare environment variables or similar
```

### 8. Test Authentication

Provide testing instructions:

```
Test OAuth Authentication:

1. Start development server:
   npm run dev

2. Visit Studio:
   http://localhost:3000/_studio

3. Click "Sign in with [Provider]"

4. Authorize the application

5. Should redirect back to Studio

If authentication fails:
- Check browser console for errors
- Verify callback URL matches exactly
- Check environment variables are loaded
- See references/troubleshooting.md
```

### 9. Next Steps

Provide clear next steps:

```
✓ OAuth Configuration Complete!

Provider: [chosen provider]
Callback URL: [deployment_url]/api/auth/callback/[provider]

Next Steps:

1. Test locally (instructions above)

2. For production deployment:
   - Set environment variables on deployment platform
   - Update OAuth app callback URL to production URL
   - Run: /nuxt-studio:deploy-studio-cloudflare

3. Configure additional providers (optional):
   - Run this command again to add more providers

For detailed OAuth guides, load:
- references/oauth-providers.md
```

### 10. Offer Deployment Help

Ask user:

"Would you like help deploying Studio to production now?"

If yes, run `/nuxt-studio:deploy-studio-cloudflare` (or appropriate deployment command)

If no, confirm they can run it later.

## Important Notes

- Never display full secrets in output (mask them)
- Always validate callback URLs match exactly
- Emphasize HTTPS requirement for production
- Remind about .gitignore for secrets
- Provide links to OAuth app creation pages
- Check for common mistakes (typos, wrong URLs, missing scopes)

## Error Handling

Common issues:

1. **User enters invalid Client ID format**:
   - Validate format before saving
   - Ask to re-enter if invalid

2. **Callback URL mismatch**:
   - Show exact URL they should use
   - Explain common mistakes (HTTP vs HTTPS, trailing slashes)

3. **Self-hosted GitLab not accessible**:
   - Verify URL format
   - Check if accessible from deployment location

4. **Google consent screen not configured**:
   - Explain it's required first-time setup
   - Provide link to consent screen docs

## Tips for Users

- For GitHub: Easiest setup, most common choice
- For GitLab: Check "Confidential" box (required!)
- For Google: "Internal" user type for Workspace (no verification needed)
- Always test locally before production deployment
- Keep backup of Client ID (secrets can be regenerated)

## Reference Files

For detailed provider-specific guides:
- references/oauth-providers.md (complete OAuth setup)
- templates/studio-auth-github.ts (GitHub reference)
- templates/studio-auth-gitlab.ts (GitLab reference)
- templates/studio-auth-google.ts (Google reference)
- references/troubleshooting.md (OAuth errors)

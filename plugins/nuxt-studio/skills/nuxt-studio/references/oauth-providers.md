# OAuth Provider Setup for Nuxt Studio

Complete guide for configuring OAuth authentication with GitHub, GitLab, and Google.

## Overview

Nuxt Studio requires OAuth authentication for production deployments. Each provider requires creating an OAuth app and configuring environment variables.

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: `Your Site - Studio CMS`
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://studio.yourdomain.com/api/auth/callback/github`
4. Click **"Register application"**
5. Note the **Client ID**
6. Click **"Generate a new client secret"** and copy the secret immediately

### 2. Configure Environment Variables

Add to your `.env` file (local development):

```bash
NUXT_OAUTH_GITHUB_CLIENT_ID=your_github_client_id
NUXT_OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Set Variables on Cloudflare

For Cloudflare Pages:
1. Go to **Workers & Pages** → Select your project
2. Click **Settings** → **Environment variables**
3. Add variables:
   - **Name**: `NUXT_OAUTH_GITHUB_CLIENT_ID`
   - **Value**: Your GitHub Client ID
   - **Name**: `NUXT_OAUTH_GITHUB_CLIENT_SECRET`
   - **Value**: Your GitHub Client Secret
4. Deploy to production and preview environments

### 4. Verify Configuration

Test authentication:
1. Visit `https://studio.yourdomain.com`
2. Click **"Sign in with GitHub"**
3. Authorize the application
4. Should redirect back to Studio dashboard

**Troubleshooting**:
- If redirect fails, verify callback URL matches exactly
- Check that environment variables are set correctly
- Ensure deployment URL uses HTTPS

---

## GitLab OAuth Setup

### 1. Create GitLab OAuth Application

For GitLab.com:
1. Go to https://gitlab.com/-/profile/applications
2. Fill in application details:
   - **Name**: `Your Site - Studio CMS`
   - **Redirect URI**: `https://studio.yourdomain.com/api/auth/callback/gitlab`
   - **Confidential**: ✅ Check this box
   - **Scopes**: Select `read_user`, `read_repository`, `write_repository`
3. Click **"Save application"**
4. Copy **Application ID** and **Secret**

For Self-Hosted GitLab:
1. Go to `https://your-gitlab.com/-/profile/applications`
2. Follow same steps as GitLab.com
3. Ensure your GitLab instance is accessible from Studio deployment

### 2. Configure Environment Variables

Add to `.env`:

```bash
NUXT_OAUTH_GITLAB_CLIENT_ID=your_gitlab_application_id
NUXT_OAUTH_GITLAB_CLIENT_SECRET=your_gitlab_secret
```

For self-hosted GitLab, also add:

```bash
NUXT_OAUTH_GITLAB_SERVER_URL=https://your-gitlab.com
```

### 3. Set Variables on Cloudflare

Same process as GitHub OAuth:
1. **Workers & Pages** → Project → **Settings** → **Environment variables**
2. Add:
   - `NUXT_OAUTH_GITLAB_CLIENT_ID`
   - `NUXT_OAUTH_GITLAB_CLIENT_SECRET`
   - `NUXT_OAUTH_GITLAB_SERVER_URL` (if self-hosted)

### 4. Verify Configuration

1. Visit `https://studio.yourdomain.com`
2. Click **"Sign in with GitLab"**
3. Authorize the application
4. Verify redirect back to Studio

**Troubleshooting**:
- For self-hosted: Verify `NUXT_OAUTH_GITLAB_SERVER_URL` is correct
- Check OAuth app scopes include repository write access
- Ensure confidential setting is enabled

---

## Google OAuth Setup

### 1. Create Google OAuth Client

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing project
3. Click **"Create Credentials"** → **"OAuth client ID"**
4. Configure OAuth consent screen (if first time):
   - **User Type**: External
   - **App name**: `Your Site Studio`
   - **User support email**: Your email
   - **Authorized domains**: `yourdomain.com`
5. Create OAuth client ID:
   - **Application type**: Web application
   - **Name**: `Studio CMS`
   - **Authorized JavaScript origins**: `https://studio.yourdomain.com`
   - **Authorized redirect URIs**: `https://studio.yourdomain.com/api/auth/callback/google`
6. Click **"Create"**
7. Copy **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add to `.env`:

```bash
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Set Variables on Cloudflare

Same process:
1. **Workers & Pages** → Project → **Settings** → **Environment variables**
2. Add:
   - `NUXT_OAUTH_GOOGLE_CLIENT_ID`
   - `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`

### 4. Verify Configuration

1. Visit `https://studio.yourdomain.com`
2. Click **"Sign in with Google"**
3. Choose Google account
4. Grant permissions
5. Verify redirect to Studio

**Troubleshooting**:
- Ensure authorized redirect URI matches deployment URL exactly
- Check OAuth consent screen is published (not in testing mode for production)
- Verify authorized domains include your domain

---

## Multiple OAuth Providers

You can configure multiple providers simultaneously. Users will see all configured options on the login screen.

**Example with all three**:

```bash
# GitHub
NUXT_OAUTH_GITHUB_CLIENT_ID=github_client_id
NUXT_OAUTH_GITHUB_CLIENT_SECRET=github_secret

# GitLab
NUXT_OAUTH_GITLAB_CLIENT_ID=gitlab_app_id
NUXT_OAUTH_GITLAB_CLIENT_SECRET=gitlab_secret

# Google
NUXT_OAUTH_GOOGLE_CLIENT_ID=google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=google_secret
```

Studio will automatically detect configured providers and show appropriate login buttons.

---

## Security Best Practices

### Never Commit Secrets

❌ **Never do this**:
```bash
# .env committed to Git
NUXT_OAUTH_GITHUB_CLIENT_SECRET=abc123secret
```

✅ **Do this**:
```bash
# .env.example (committed to Git)
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=

# .env (in .gitignore)
NUXT_OAUTH_GITHUB_CLIENT_ID=actual_id
NUXT_OAUTH_GITHUB_CLIENT_SECRET=actual_secret
```

### Use Environment-Specific Secrets

For Cloudflare Pages, use different OAuth apps for:
- **Production**: `studio.yourdomain.com`
- **Preview**: `*.pages.dev`

This isolates environments and improves security.

### Rotate Secrets Regularly

- Regenerate OAuth secrets quarterly
- Update environment variables on all platforms
- Test authentication after rotation

---

## OAuth Callback URL Patterns

### Production

```
https://studio.yourdomain.com/api/auth/callback/[provider]
```

### Preview (Cloudflare Pages)

```
https://[branch].[project].pages.dev/api/auth/callback/[provider]
```

### Local Development

```
http://localhost:3000/api/auth/callback/[provider]
```

Create separate OAuth apps for each environment or add multiple callback URLs to the same app (if provider allows).

---

## Common OAuth Issues

### Issue: "redirect_uri_mismatch"

**Cause**: OAuth app callback URL doesn't match actual URL

**Solution**:
1. Check OAuth app settings
2. Verify callback URL is exact (including HTTPS, subdomain, path)
3. Update OAuth app if deployment URL changed

### Issue: "invalid_client"

**Cause**: Client ID or secret is incorrect

**Solution**:
1. Verify environment variables are set correctly
2. Check for typos in client ID/secret
3. Regenerate secret if needed

### Issue: "access_denied"

**Cause**: User denied authorization or app lacks permissions

**Solution**:
1. Ensure required scopes are configured (read/write repository)
2. Re-authorize the application
3. Check OAuth app is approved for production use

---

## Testing OAuth Locally

Before deploying to production, test OAuth locally:

1. **Set up local environment variables**:
   ```bash
   # .env.local
   NUXT_OAUTH_GITHUB_CLIENT_ID=local_test_id
   NUXT_OAUTH_GITHUB_CLIENT_SECRET=local_test_secret
   ```

2. **Create development OAuth app** with callback:
   ```
   http://localhost:3000/api/auth/callback/github
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Test authentication**:
   - Visit `http://localhost:3000/_studio`
   - Click "Sign in with GitHub"
   - Verify redirect and authentication

5. **Debug with console**:
   - Check browser console for errors
   - Verify network requests to `/api/auth/`
   - Check server logs for OAuth errors

---

## Advanced Configuration

### Custom OAuth Scopes

Configure custom scopes in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  oauth: {
    github: {
      clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET,
      scope: ['read:user', 'repo', 'workflow']  // Custom scopes
    }
  }
})
```

### OAuth Session Configuration

```typescript
export default defineNuxtConfig({
  auth: {
    session: {
      cookie: {
        secure: true,  // HTTPS only
        httpOnly: true,  // No JavaScript access
        sameSite: 'lax'  // CSRF protection
      },
      maxAge: 60 * 60 * 24 * 7  // 7 days
    }
  }
})
```

---

## Provider Comparison

| Feature | GitHub | GitLab | Google |
|---------|--------|--------|--------|
| Self-hosted support | ❌ No | ✅ Yes | ❌ No |
| Private repos | ✅ Yes | ✅ Yes | N/A |
| Team management | ✅ Organizations | ✅ Groups | ❌ Limited |
| Setup complexity | ⭐⭐ Easy | ⭐⭐ Easy | ⭐⭐⭐ Moderate |
| Best for | Public repos, GitHub users | Self-hosted, GitLab users | Universal access |

**Recommendation**: Use GitHub OAuth for most cases. Use GitLab for self-hosted instances. Use Google for universal access without GitHub/GitLab accounts.

---

## Next Steps

After configuring OAuth:
1. Test authentication thoroughly
2. Configure user permissions (if needed)
3. Set up team access (Organizations/Groups)
4. Document authentication flow for team members
5. Monitor OAuth errors in production logs

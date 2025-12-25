---
# Nuxt Studio Plugin Settings
# Copy this file to .claude/nuxt-studio.local.md to customize behavior

# OAuth Provider (github | gitlab | google)
# Default: github
oauth_provider: github

# Subdomain prefix for Studio deployment
# Example: studio.yourdomain.com or cms.yourdomain.com
# Default: studio
subdomain: studio

# Deployment platform
# Options: cloudflare-pages | cloudflare-workers | vercel | netlify
# Default: cloudflare-pages
deployment_platform: cloudflare-pages

# Cloudflare Account ID (optional)
# Find at: Cloudflare Dashboard > Account ID
cloudflare_account_id: ""

# Cloudflare Project Name (optional)
# The name of your Pages project or Workers script
cloudflare_project_name: ""
---

# Nuxt Studio Configuration

## Custom Notes

Add your custom notes, preferences, or deployment-specific configurations here.

## Example OAuth Configurations

### GitHub OAuth
- Client ID stored in: Cloudflare Dashboard > Workers/Pages > Settings > Environment Variables
- Variable name: `NUXT_OAUTH_GITHUB_CLIENT_ID`
- Callback URL: `https://studio.yourdomain.com/api/auth/callback/github`

### GitLab OAuth
- Client ID variable: `NUXT_OAUTH_GITLAB_CLIENT_ID`
- Callback URL: `https://studio.yourdomain.com/api/auth/callback/gitlab`

### Google OAuth
- Client ID variable: `NUXT_OAUTH_GOOGLE_CLIENT_ID`
- Callback URL: `https://studio.yourdomain.com/api/auth/callback/google`

## Subdomain Configuration

Current configuration will deploy Studio to:
```
https://studio.yourdomain.com
```

Change `subdomain` value above to customize (e.g., `cms`, `admin`, `edit`).

# Sveltia CMS Authentication Setup Guide

Complete guide for setting up OAuth authentication with Sveltia CMS.

**Last Updated**: 2025-10-24

---

## Authentication Options

| Method | Best For | Difficulty |
|--------|----------|-----------|
| Cloudflare Workers OAuth | All deployments | Easy |
| Vercel Serverless | Vercel projects | Medium |
| Netlify Functions | Netlify projects | Medium |
| Local Development | Dev only | Easy |

---

## Option 1: Cloudflare Workers OAuth (Recommended) 🔥

**Best For**: Cloudflare Pages, Cloudflare Workers, any deployment

This uses the official `sveltia-cms-auth` Cloudflare Worker for OAuth.

### Steps

1. **Deploy Worker:**
   ```bash
   # Clone the auth worker
   git clone https://github.com/sveltia/sveltia-cms-auth
   cd sveltia-cms-auth

   # Install dependencies
   bun install

   # Deploy to Cloudflare Workers
   bunx wrangler deploy
   ```

   **Or use one-click deploy**:
   - Visit https://github.com/sveltia/sveltia-cms-auth
   - Click "Deploy to Cloudflare Workers" button

2. **Register OAuth App on GitHub:**
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - **Application name**: Your Site Name CMS
   - **Homepage URL**: https://yourdomain.com
   - **Authorization callback URL**: https://your-worker.workers.dev/callback
   - Save Client ID and Client Secret

3. **Configure Worker Environment Variables:**
   ```bash
   # Set GitHub credentials
   bunx wrangler secret put GITHUB_CLIENT_ID
   # Paste your Client ID

   bunx wrangler secret put GITHUB_CLIENT_SECRET
   # Paste your Client Secret

   # Optional: Restrict to specific domains
   bunx wrangler secret put ALLOWED_DOMAINS
   # Example: yourdomain.com,*.yourdomain.com
   ```

4. **Update CMS config:**
   ```yaml
   # admin/config.yml
   backend:
     name: github
     repo: owner/repo
     branch: main
     base_url: https://your-worker.workers.dev  # ← Add this line
   ```

5. **Test authentication:**
   - Open your site's `/admin/`
   - Click "Login with GitHub"
   - Authorize the app
   - You should be redirected back to the CMS

### Cloudflare Workers Benefits

- **Fast**: Edge-deployed globally
- **Free**: 100,000 requests/day on free plan
- **Simple**: No server management
- **Official**: Maintained by Sveltia team

**Template**: See `templates/cloudflare-workers/`

---

## Option 2: Vercel Serverless Functions

**Best For**: Vercel deployments

### Steps

1. **Create API route:**
   ```typescript
   // api/auth.ts
   export default async function handler(req, res) {
     const { code } = req.query;

     // Exchange code for token
     const response = await fetch('https://github.com/login/oauth/access_token', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Accept': 'application/json',
       },
       body: JSON.stringify({
         client_id: process.env.GITHUB_CLIENT_ID,
         client_secret: process.env.GITHUB_CLIENT_SECRET,
         code,
       }),
     });

     const data = await response.json();

     // Return token to CMS
     res.status(200).json(data);
   }
   ```

2. **Set environment variables in Vercel:**
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

3. **Update CMS config:**
   ```yaml
   backend:
     name: github
     repo: owner/repo
     branch: main
     base_url: https://yourdomain.com/api/auth
   ```

**Template**: See `templates/vercel-serverless/`

---

## Option 3: Netlify Functions

**Note**: Sveltia CMS deliberately omits Git Gateway support for performance reasons.

If deploying to Netlify, use either:
- **Cloudflare Workers OAuth** (recommended, faster)
- **Netlify Functions with custom OAuth** (similar to Vercel pattern)

### Netlify Function Example

```javascript
// netlify/functions/auth.js
exports.handler = async (event) => {
  const { code } = event.queryStringParameters;

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

---

## Option 4: Local Development (GitHub/GitLab Direct)

**For local development only** - no authentication proxy needed.

### Requirements

- GitHub/GitLab personal access token
- Browser with File System Access API (Chrome, Edge)

### Setup

1. **Generate personal access token:**
   - GitHub: https://github.com/settings/tokens
   - Scopes: `repo` (full control of private repositories)

2. **Configure local backend:**
   ```yaml
   # admin/config.yml
   backend:
     name: github
     repo: owner/repo
     branch: main

   local_backend: true  # Enable local mode
   ```

3. **Use Sveltia's local repository feature:**
   - Click "Work with Local Repository" in login screen
   - Select your local Git repository folder
   - Changes save directly to local files
   - Commit and push manually via Git

**Note**: This is for development only - production requires OAuth proxy.

---

## Troubleshooting Authentication

### Issue: "Error: Failed to authenticate"

**Causes**:
- Missing `base_url` in backend config
- Incorrect OAuth proxy URL
- Wrong GitHub OAuth callback URL

**Solution**:

1. Verify `config.yml` has `base_url`:
   ```yaml
   backend:
     name: github
     repo: owner/repo
     branch: main
     base_url: https://your-worker.workers.dev  # ← Must be present
   ```

2. Check GitHub OAuth App callback:
   - Should be: `https://your-worker.workers.dev/callback`
   - NOT: `https://yourdomain.com/callback`

3. Verify Worker environment variables:
   ```bash
   bunx wrangler secret list
   # Should show: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
   ```

4. Test Worker directly:
   ```bash
   curl https://your-worker.workers.dev/health
   # Should return: {"status": "ok"}
   ```

### Issue: OAuth Popup Closes Immediately

**Causes**:
- CORS policy blocking authentication
- Strict `Cross-Origin-Opener-Policy` header

**Solution**:

Set COOP header to `same-origin-allow-popups`:

**Cloudflare Pages** (_headers):
```
/*
  Cross-Origin-Opener-Policy: same-origin-allow-popups
```

**Vercel** (vercel.json):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        }
      ]
    }
  ]
}
```

### Issue: CORS Errors in Console

**Solution**:

Add OAuth proxy to CSP:
```html
<meta http-equiv="Content-Security-Policy" content="
  connect-src 'self' https://api.github.com https://your-worker.workers.dev;
">
```

---

## Next Steps

After authentication setup:

1. Configure collections → See `configuration-guide.md`
2. Test authentication flow thoroughly
3. Deploy to production → See `deployment-guide.md`

---

**Questions?** Check `error-catalog.md` for more authentication troubleshooting.

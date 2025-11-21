## Authentication Setup

Choose the authentication method that fits your deployment platform.

### Option 1: Cloudflare Workers OAuth (Recommended) 🔥

**Best For**: Cloudflare Pages, Cloudflare Workers, any deployment

This uses the official `sveltia-cms-auth` Cloudflare Worker for OAuth.

**Steps:**

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

**Complete guide**: See `references/cloudflare-auth-setup.md`

**Template**: See `templates/cloudflare-workers/`

---

### Option 2: Vercel Serverless Functions

**Best For**: Vercel deployments

**Steps:**

1. **Create API route:**
   ```typescript
   // api/auth.ts
   export default async function handler(req, res) {
     // OAuth handling logic
     // See templates/vercel-serverless/api-auth.ts
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

### Option 3: Netlify Functions (Not Recommended)

**Note**: Sveltia CMS deliberately omits Git Gateway support for performance reasons.

If deploying to Netlify, use either:
- **Cloudflare Workers OAuth** (recommended, faster)
- **Netlify Functions with custom OAuth** (similar to Vercel pattern)

---

### Option 4: Local Development (GitHub/GitLab Direct)

**For local development only** - no authentication proxy needed.

**Requirements:**
- GitHub/GitLab personal access token
- Browser with File System Access API (Chrome, Edge)

**Setup:**

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


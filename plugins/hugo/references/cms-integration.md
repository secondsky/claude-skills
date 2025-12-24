# Hugo CMS Integration Guide

Complete guide for integrating headless CMS systems with Hugo (Sveltia CMS recommended, TinaCMS not recommended).

---

## Sveltia CMS Integration (Recommended)

### Why Sveltia CMS for Hugo?

✅ **Hugo is Sveltia's primary use case** - designed specifically for Hugo
✅ **Simple setup** - 2 static files, no build step required
✅ **No npm dependencies** - single CDN script
✅ **Local backend** - test CMS locally without Git
✅ **YAML frontmatter** - fully compatible
✅ **No security vulnerabilities** - lightweight, maintained
✅ **Active development** - focused on static site generators

---

### Setup (5 Minutes)

**1. Create admin interface** - `static/admin/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Content Manager</title>
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
  </body>
</html>
```

**2. Create CMS config** - `static/admin/config.yml`:

```yaml
backend:
  name: git-gateway
  branch: main

local_backend: true  # Enable local testing

media_folder: "static/images/uploads"
public_folder: "/images/uploads"

collections:
  - name: "blog"
    label: "Blog Posts"
    folder: "content/posts"
    create: true
    slug: "{{slug}}"
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Description", name: "description", widget: "string", required: false}
      - {label: "Date", name: "date", widget: "datetime"}
      - {label: "Draft", name: "draft", widget: "boolean", default: false}
      - {label: "Tags", name: "tags", widget: "list", required: false}
      - {label: "Categories", name: "categories", widget: "list", required: false}
      - {label: "Cover Image", name: "cover", widget: "object", required: false, fields: [
          {label: "Image", name: "image", widget: "image", required: false},
          {label: "Alt Text", name: "alt", widget: "string", required: false}
        ]}
      - {label: "Body", name: "body", widget: "markdown"}

  - name: "pages"
    label: "Pages"
    folder: "content"
    create: true
    slug: "{{slug}}"
    filter: {field: "type", value: "page"}
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Date", name: "date", widget: "datetime"}
      - {label: "Type", name: "type", widget: "hidden", default: "page"}
      - {label: "Draft", name: "draft", widget: "boolean", default: false}
      - {label: "Body", name: "body", widget: "markdown"}
```

**3. Rebuild site**:
```bash
hugo
# Admin interface now at: http://localhost:1313/admin
```

---

### Production OAuth Setup

Sveltia CMS needs OAuth for GitHub/GitLab authentication in production. Use Cloudflare Workers for OAuth proxy.

#### Option 1: Cloudflare Workers OAuth Proxy

**Create `oauth-proxy/` directory:**

```bash
mkdir oauth-proxy
cd oauth-proxy
npm init -y
npm install hono
```

**Create `oauth-proxy/src/index.ts`:**

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/auth', (c) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${c.env.GITHUB_CLIENT_ID}&scope=repo,user`;
  return c.redirect(githubAuthUrl);
});

app.get('/callback', async (c) => {
  const code = c.req.query('code');

  if (!code) {
    return c.text('No code provided', 400);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await tokenResponse.json();

  // Send token back to admin window
  return c.html(`
    <script>
      if (window.opener) {
        window.opener.postMessage(
          'authorization:github:success:${JSON.stringify(data)}',
          window.location.origin
        );
        window.close();
      }
    </script>
  `);
});

app.get('/success', (c) => {
  return c.html(`
    <html>
      <body>
        <h1>Success!</h1>
        <p>You can close this window.</p>
        <script>
          if (window.opener) {
            window.close();
          }
        </script>
      </body>
    </html>
  `);
});

export default app;
```

**Create `oauth-proxy/wrangler.jsonc`:**

```jsonc
{
  "name": "hugo-oauth-proxy",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-29"
}
```

**Deploy OAuth proxy:**

```bash
# Set secrets
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET

# Deploy
npx wrangler deploy
```

**Update Sveltia config** (`static/admin/config.yml`):

```yaml
backend:
  name: github
  repo: username/repo
  branch: main
  base_url: https://hugo-oauth-proxy.yourname.workers.dev
  auth_endpoint: /auth
```

#### Option 2: GitHub App (Simpler)

1. Create GitHub App: https://github.com/settings/apps/new
   - Homepage URL: `https://your-site.com`
   - Callback URL: `https://api.netlify.com/auth/done`
   - Webhook: Disabled
   - Permissions: Contents (Read & Write)

2. Update `static/admin/config.yml`:
```yaml
backend:
  name: github
  repo: username/repo
  branch: main
```

3. Use Netlify Identity (free tier) or similar service for OAuth

---

### Key Points

- Admin accessible at `/admin` after build
- `local_backend: true` allows local testing without Git
- YAML frontmatter format required
- Collections map to Hugo content directories
- Media files saved to `static/images/uploads`
- OAuth required for production Git backend
- Sveltia CMS is Git-based (no database needed)

---

### Advanced Configuration

**Multiple content types:**

```yaml
collections:
  - name: "blog"
    label: "Blog Posts"
    folder: "content/posts"
    create: true
    slug: "{{year}}-{{month}}-{{day}}-{{slug}}"
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Date", name: "date", widget: "datetime"}
      - {label: "Body", name: "body", widget: "markdown"}

  - name: "docs"
    label: "Documentation"
    folder: "content/docs"
    create: true
    nested:
      depth: 3  # Allow nested folders
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Weight", name: "weight", widget: "number"}
      - {label: "Body", name: "body", widget: "markdown"}

  - name: "config"
    label: "Site Config"
    files:
      - label: "Site Settings"
        name: "site"
        file: "hugo.yaml"
        fields:
          - {label: "Title", name: "title", widget: "string"}
          - {label: "Base URL", name: "baseURL", widget: "string"}
          - {label: "Language", name: "languageCode", widget: "string"}
```

---

## TinaCMS Integration (Not Recommended)

⚠️ **Use Sveltia CMS instead**. TinaCMS has significant limitations for Hugo.

### Why Not TinaCMS?

❌ **React-only visual editing** - Hugo is Go-templated, visual editing won't work
❌ **Complex setup** - requires Node.js server or Tina Cloud
❌ **692 npm packages** - vs Sveltia's 1 CDN script
❌ **7 security vulnerabilities** - (4 high, 3 critical as of 2025-11-04)
❌ **React/Next.js focused** - Hugo is secondary use case
❌ **YAML only** - same limitation as Sveltia, without benefits

### If You Must Use TinaCMS

Only consider TinaCMS if:
- Already using Tina Cloud
- Have React expertise available
- Need Tina-specific features (team collaboration, approval workflows)

#### Basic TinaCMS Setup (Not Recommended)

**1. Install TinaCMS:**

```bash
npm install tinacms
```

**2. Create `tina/config.ts`:**

```typescript
import { defineConfig } from "tinacms";

export default defineConfig({
  branch: "main",
  clientId: process.env.TINA_CLIENT_ID!,
  token: process.env.TINA_TOKEN!,

  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },

  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "static",
    },
  },

  schema: {
    collections: [
      {
        name: "post",
        label: "Posts",
        path: "content/posts",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
});
```

**3. Add build scripts:**

```json
{
  "scripts": {
    "dev": "tinacms dev -c \"hugo server\"",
    "build": "tinacms build && hugo --minify"
  }
}
```

**4. Create Tina Cloud account and get credentials**

This setup requires:
- Tina Cloud account ($29/month for production)
- Node.js runtime
- Complex build process
- React knowledge for customization

**Again: Use Sveltia CMS instead for Hugo projects.**

---

## Comparison: Sveltia vs TinaCMS

| Feature | Sveltia CMS | TinaCMS |
|---------|-------------|---------|
| **Setup Time** | 5 minutes | 1-2 hours |
| **Dependencies** | 1 CDN script | 692 npm packages |
| **Security Issues** | 0 | 7 (4 high, 3 critical) |
| **Local Testing** | ✅ Built-in | ⚠️ Requires config |
| **Hugo Support** | ✅ Primary use case | ⚠️ Secondary |
| **Visual Editing** | ❌ No | ❌ No (Hugo limitation) |
| **Git Backend** | ✅ Native | ✅ Via Tina Cloud |
| **Cost** | Free | $29/month (production) |
| **Maintenance** | Low | High |

---

## Troubleshooting

### Sveltia CMS Issues

**Problem: CMS not loading at /admin**
- Rebuild site: `hugo`
- Check `/admin` exists in `public/`
- Verify browser console for errors

**Problem: Can't authenticate**
- Check OAuth proxy is deployed and running
- Verify GitHub App credentials
- Check callback URL matches

**Problem: Can't save changes**
- Verify Git backend configuration
- Check repository permissions
- Test local backend first (`local_backend: true`)

**Problem: Media uploads not working**
- Check `media_folder` path exists
- Verify `public_folder` is correct
- Ensure Git LFS is configured (if using large files)

---

## Official Documentation

- **Sveltia CMS**: https://github.com/sveltia/sveltia-cms
- **TinaCMS**: https://tina.io/docs/
- **Hugo Content Management**: https://gohugo.io/content-management/

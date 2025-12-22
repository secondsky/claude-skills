# Cloudflare Workers Deployment Guide

Complete guide to deploying Content Collections sites to Cloudflare Workers Static Assets.

---

## Why Cloudflare Workers?

Content Collections is **perfect** for Cloudflare Workers because:

- ✅ **Build-time only** - No runtime filesystem access needed
- ✅ **Static output** - Generates plain JavaScript modules
- ✅ **No Node.js deps** - Generated code runs anywhere
- ✅ **Edge performance** - Served from 300+ locations
- ✅ **Free tier** - 100k requests/day

---

## Prerequisites

### 1. Install Wrangler CLI

```bash
pnpm add -D wrangler
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

---

## Project Setup

### 1. Create wrangler.toml

```toml
name = "my-content-site"
compatibility_date = "2025-11-07"

# Static Assets configuration
[assets]
directory = "./dist"
binding = "ASSETS"

# Optional: Custom 404 handling
# html_handling = "force-trailing-slashes"
```

### 2. Update package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "wrangler dev",
    "deploy": "pnpm build && wrangler deploy"
  }
}
```

---

## Build Configuration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import contentCollections from "@content-collections/vite";

export default defineConfig({
  plugins: [react(), contentCollections()],

  // Output to dist/ for Cloudflare
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
```

**Note**: Vite plugin automatically runs `content-collections build` before Vite build.

---

## Deployment Workflow

### Local Development

```bash
# Start dev server
pnpm dev

# Preview production build locally
pnpm build
pnpm preview
```

### Deploy to Cloudflare

```bash
# Build and deploy in one command
pnpm deploy
```

**Or manually**:
```bash
# Build
pnpm build

# Deploy
npx wrangler deploy
```

---

## Routing Configuration

### Single Page Application (SPA)

For client-side routing (React Router, etc.):

```toml
[assets]
directory = "./dist"
binding = "ASSETS"

# Serve index.html for all routes
html_handling = "auto-trailing-slash"
```

Create `public/_routes.json`:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```

### Static Site Generation (SSG)

For pre-rendered pages:

```toml
[assets]
directory = "./dist"
```

Build output:
```
dist/
├── index.html
├── posts/
│   ├── first-post/
│   │   └── index.html
│   └── second-post/
│       └── index.html
└── assets/
    ├── index-abc123.js
    └── index-def456.css
```

---

## Environment Variables

### Development (.env)

```env
VITE_SITE_URL=http://localhost:5173
VITE_API_KEY=local-dev-key
```

### Production (Wrangler)

```bash
# Set environment variables
npx wrangler secret put API_KEY

# Or in wrangler.toml
[vars]
SITE_URL = "https://my-site.workers.dev"
```

Access in code:
```typescript
const siteUrl = import.meta.env.VITE_SITE_URL;
```

---

## Custom 404 Page

### Create 404.html

```html
<!-- public/404.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>404 - Page Not Found</title>
  </head>
  <body>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
  </body>
</html>
```

### Configure Wrangler

```toml
[assets]
directory = "./dist"
not_found_handling = "404-page"
```

---

## Headers and Cache

### Custom Headers

Create `public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

---

## Preview Deployments

### Branch Previews

```bash
# Deploy to preview environment
npx wrangler deploy --env preview
```

Add to `wrangler.toml`:
```toml
[env.preview]
name = "my-content-site-preview"
```

### Pull Request Previews

Use Wrangler GitHub Action:

```yaml
# .github/workflows/deploy-preview.yml
name: Deploy Preview
on: [pull_request]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4

      - run: pnpm install
      - run: pnpm build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env preview
```

---

## Production Deployment

### Continuous Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN}}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## Custom Domains

### Add Custom Domain

```bash
# Via CLI
npx wrangler custom-domains add example.com

# Or in Cloudflare Dashboard:
# Workers & Pages → my-content-site → Custom Domains → Add
```

### Update wrangler.toml

```toml
[env.production]
name = "my-content-site"
routes = [
  { pattern = "example.com", custom_domain = true },
  { pattern = "www.example.com", custom_domain = true }
]
```

---

## Performance Optimization

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: "dist",

    // Optimize chunks
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },

    // Minify
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
      },
    },
  },
});
```

### Image Optimization

Use Cloudflare Images:

```typescript
// In transform function
transform: (post) => ({
  ...post,
  coverImage: post.coverImage
    ? `https://imagedelivery.net/your-account/${post.coverImage}/public`
    : null,
})
```

---

## Monitoring

### Analytics

Enable in wrangler.toml:
```toml
[analytics_engine_datasets]
bindings = [
  { name = "ANALYTICS" }
]
```

Access in Cloudflare Dashboard:
- Workers & Pages → my-content-site → Analytics

---

## Troubleshooting

### Problem: Build fails during deployment

**Solution**: Ensure all dependencies are in `dependencies`, not `devDependencies`:

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@content-collections/core": "^0.12.0",
    "@content-collections/vite": "^0.2.7",
    "vite": "^6.0.0"
  }
}
```

---

### Problem: 404 errors for routes

**Solution**: Configure SPA mode:

```toml
[assets]
html_handling = "auto-trailing-slash"
```

And create `public/_routes.json`:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```

---

### Problem: Content not updating

**Solution**: Clear Cloudflare cache:

```bash
# Purge all cache
npx wrangler kv:key delete --all

# Or in Dashboard:
# Caching → Configuration → Purge Everything
```

---

## Complete Example

### Project Structure

```
my-content-site/
├── content/
│   └── posts/
│       ├── first-post.md
│       └── second-post.md
├── public/
│   ├── _routes.json
│   ├── _headers
│   └── favicon.ico
├── src/
│   ├── App.tsx
│   └── main.tsx
├── .env
├── .gitignore
├── content-collections.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```

### Deployment Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Preview locally
pnpm preview

# Deploy to production
pnpm deploy
```

---

## Official Documentation

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Static Assets**: https://developers.cloudflare.com/workers/static-assets/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/
- **Custom Domains**: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- **GitHub Actions**: https://github.com/cloudflare/wrangler-action

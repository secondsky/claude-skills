# Nuxt Studio Setup Checklist

## Prerequisites

- [ ] Nuxt Content v3 installed
- [ ] GitHub account
- [ ] Production domain (for OAuth)

---

## 1. Install Nuxt Studio

```bash
# Bun
bun add nuxt-studio@alpha

# npm
npm install nuxt-studio@alpha

# pnpm
pnpm add nuxt-studio@alpha
```

---

## 2. Configure nuxt.config.ts

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', 'nuxt-studio'],

  studio: {
    route: '/_studio',  // Access route

    repository: {
      provider: 'github',
      owner: 'your-username',
      repo: 'your-repo',
      branch: 'main'
    }
  }
})
```

---

## 3. Create GitHub OAuth App

### Production OAuth App

1. Visit: https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Your App Name
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret**
7. Copy the **Client Secret** (shown only once!)

### Staging OAuth App (Optional)

Create a separate OAuth app for staging:
- **Application name**: Your App Name (Staging)
- **Homepage URL**: `https://staging.yourdomain.com`
- **Callback URL**: `https://staging.yourdomain.com`

---

## 4. Set Environment Variables

### Local Development

```bash
# .env
STUDIO_GITHUB_CLIENT_ID=your_client_id_here
STUDIO_GITHUB_CLIENT_SECRET=your_client_secret_here
```

### Production (Cloudflare)

Add in Cloudflare Dashboard:
- Project → Settings → Environment Variables
- Add `STUDIO_GITHUB_CLIENT_ID`
- Add `STUDIO_GITHUB_CLIENT_SECRET`

### Production (Vercel)

Add in Vercel Dashboard:
- Project → Settings → Environment Variables
- Production scope
- Add both variables

---

## 5. Deployment Configuration

### Required

- ✅ SSR enabled (not static generation)
- ✅ Build command: `nuxt build`
- ✅ Server runtime support

### Hybrid Rendering (Optional)

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { prerender: true },
    '/_studio/**': { ssr: true }  // Studio requires SSR
  }
})
```

---

## 6. Staging/Preview Setup

### Environment-Based Branch

```ts
// nuxt.config.ts
studio: {
  repository: {
    provider: 'github',
    owner: 'your-username',
    repo: 'your-repo',
    branch: process.env.STUDIO_GITHUB_BRANCH_NAME || 'main'
  }
}
```

### Environment Variables

**Staging**:
```
STUDIO_GITHUB_BRANCH_NAME=staging
STUDIO_GITHUB_CLIENT_ID=staging_client_id
STUDIO_GITHUB_CLIENT_SECRET=staging_client_secret
```

**Production**:
```
STUDIO_GITHUB_BRANCH_NAME=main
STUDIO_GITHUB_CLIENT_ID=production_client_id
STUDIO_GITHUB_CLIENT_SECRET=production_client_secret
```

---

## 7. Access Studio

### Web Interface

```
https://yourdomain.com/_studio
```

### Keyboard Shortcut

Press `Ctrl + .` anywhere on the site

### Login Flow

1. Click "Login with GitHub"
2. Authorize OAuth app
3. Start editing!

---

## 8. Development Mode (Optional)

Enable local file writing:

```ts
studio: {
  development: {
    sync: true  // Writes to local content/
  },
  repository: {
    // ... config
  }
}
```

---

## Troubleshooting

### OAuth Fails

- ✅ Callback URL matches exactly (including `https://`)
- ✅ Environment variables set correctly
- ✅ OAuth app not suspended

### Studio Not Accessible

- ✅ SSR is enabled
- ✅ Route is correct (`/_studio`)
- ✅ Module in `modules` array

### Changes Not Saving

- ✅ GitHub token has write permissions
- ✅ Repository configuration correct
- ✅ Check browser console for errors

---

## Complete Checklist

- [ ] Nuxt Studio installed
- [ ] Module added to `nuxt.config.ts`
- [ ] Repository configured
- [ ] GitHub OAuth app created (production)
- [ ] Environment variables set
- [ ] SSR enabled
- [ ] Deployed to hosting platform
- [ ] Studio accessible at `/_studio`
- [ ] Login works
- [ ] Changes commit to GitHub

---

## Advanced: Monorepo Support

```ts
studio: {
  repository: {
    provider: 'github',
    owner: 'your-username',
    repo: 'monorepo-name',
    branch: 'main',
    rootDir: 'apps/website'  // Path to Nuxt app
  }
}
```

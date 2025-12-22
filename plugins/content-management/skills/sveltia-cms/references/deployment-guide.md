# Sveltia CMS Deployment Guide

Complete deployment instructions for major platforms.

**Last Updated**: 2025-10-24

---

## Cloudflare Pages

**Best For**: Static sites with Cloudflare ecosystem

### Steps

1. **Connect Git repository to Cloudflare Pages:**
   - Dashboard > Pages > Create Project
   - Connect GitHub/GitLab
   - Select repository

2. **Configure build settings:**
   ```yaml
   Build command: hugo  # or jekyll build, or npm run build
   Build output directory: public  # or _site, or dist
   Root directory: /
   ```

3. **Deploy OAuth Worker** (see `authentication-guide.md`)

4. **Update config.yml with Worker URL:**
   ```yaml
   backend:
     base_url: https://your-worker.workers.dev
   ```

5. **Deploy:**
   - Push to main branch
   - Cloudflare Pages builds automatically
   - Access admin at: `https://yourdomain.pages.dev/admin/`

---

## Vercel

**Best For**: Next.js, Astro, or any framework with Vercel deployment

### Steps

1. **Connect Git repository:**
   - Dashboard > Add New Project
   - Import repository

2. **Configure build:**
   ```
   Framework Preset: <Auto-detected>
   Build Command: <Default>
   Output Directory: <Default>
   ```

3. **Deploy OAuth serverless function** (see `authentication-guide.md`)

4. **Set environment variables:**
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

5. **Deploy:**
   - Push to main branch
   - Vercel builds automatically

---

## Netlify

**Best For**: JAMstack sites, legacy Netlify CMS migrations

### Steps

1. **Connect Git repository:**
   - Dashboard > Add New Site
   - Import repository

2. **Configure build:**
   ```
   Build command: <your-build-command>
   Publish directory: public  # or _site, or dist
   ```

3. **Use Cloudflare Workers for OAuth** (recommended over Netlify Functions)

4. **Deploy:**
   - Push to main branch
   - Netlify builds automatically

---

## GitHub Pages

**Best For**: Jekyll sites, simple static sites

### Steps

1. **Configure Jekyll (if using):**
   ```yaml
   # _config.yml
   include:
     - admin
   ```

2. **Create GitHub Actions workflow:**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Build
           run: jekyll build  # or your build command
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./_site
   ```

3. **Deploy OAuth Worker** for authentication

4. **Access admin:**
   ```
   https://username.github.io/repo/admin/
   ```

---

## Post-Deployment Checklist

- [ ] Admin page accessible at `/admin/`
- [ ] OAuth authentication working
- [ ] Content listing correctly
- [ ] Can create new entries
- [ ] Can edit existing entries
- [ ] Image uploads functional
- [ ] Changes commit to Git
- [ ] Mobile editing works (if applicable)

---

**Questions?** Check `error-catalog.md` for deployment troubleshooting.

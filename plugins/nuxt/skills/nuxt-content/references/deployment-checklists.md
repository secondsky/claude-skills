# Deployment Checklists

## Cloudflare Pages Checklist

### Prerequisites
- [ ] Cloudflare account
- [ ] Wrangler CLI installed (optional)
- [ ] D1 database created

### Configuration
- [ ] Build preset: `cloudflare_pages` in `nuxt.config.ts`
- [ ] Build command: `npm run build`
- [ ] Build output: `.output/public`

### D1 Database
- [ ] D1 database created (`nuxt-content-db`)
- [ ] D1 binding configured
- [ ] Binding name is exactly `DB` (case-sensitive)

### Environment Variables
- [ ] `STUDIO_GITHUB_CLIENT_ID` (if using Studio)
- [ ] `STUDIO_GITHUB_CLIENT_SECRET` (if using Studio)
- [ ] Custom env vars as needed

### Deployment
- [ ] GitHub repository connected
- [ ] Build successful
- [ ] D1 binding active
- [ ] Custom domain configured (optional)
- [ ] SSL/TLS verified

### Verification
- [ ] Site loads correctly
- [ ] Content queries work
- [ ] Studio accessible (if configured)
- [ ] No console errors

---

## Cloudflare Workers Checklist

### Configuration
- [ ] Build preset: `cloudflare` in `nuxt.config.ts`
- [ ] `wrangler.toml` configured
- [ ] D1 binding in `wrangler.toml`

### wrangler.toml Example
```toml
name = "nuxt-content-worker"
main = ".output/server/index.mjs"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "nuxt-content-db"
database_id = "your-database-id"
```

### Deployment
- [ ] Build: `nuxi build --preset=cloudflare`
- [ ] Deploy: `wrangler deploy`

---

## Vercel Checklist

### Prerequisites
- [ ] Vercel account
- [ ] Vercel CLI installed (optional)

### Configuration
- [ ] Framework: Nuxt (auto-detected)
- [ ] Build command: `npm run build`
- [ ] Output directory: `.output`

### Environment Variables
- [ ] `STUDIO_GITHUB_CLIENT_ID` (if using Studio)
- [ ] `STUDIO_GITHUB_CLIENT_SECRET` (if using Studio)
- [ ] `POSTGRES_URL` (if using Vercel Postgres)
- [ ] Custom env vars as needed

### Database Options
Choose one:
- [ ] SQLite at `/tmp` (default, zero config)
- [ ] Vercel Postgres (create in dashboard)
- [ ] Vercel KV (key-value store)
- [ ] Vercel Blob (file storage)

### Deployment
- [ ] GitHub repository connected
- [ ] Build successful
- [ ] Environment variables added
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

### Route Rules (Optional)
```ts
routeRules: {
  '/': { prerender: true },
  '/blog/**': { swr: 3600 },      // Cache 1 hour
  '/docs/**': { isr: 3600 },      // ISR
  '/_studio/**': { ssr: true }
}
```

### Verification
- [ ] Site loads correctly
- [ ] Content queries work
- [ ] Studio accessible (if configured)
- [ ] Preview deployments work

---

## Netlify Checklist

### Configuration
- [ ] Build command: `npm run build`
- [ ] Publish directory: `.output/public`
- [ ] Functions directory: `.output/server`

### Environment Variables
- [ ] Add Studio credentials (if using)
- [ ] Add custom env vars

### Deployment
- [ ] GitHub connected
- [ ] Build settings configured
- [ ] Deploy successful

---

## General Checklist (All Platforms)

### Pre-Deployment
- [ ] All dependencies installed
- [ ] `content.config.ts` configured
- [ ] Collections defined
- [ ] Content files created
- [ ] Local build successful: `npm run build`
- [ ] Dev server works: `npm run dev`

### Post-Deployment
- [ ] Site accessible
- [ ] Content renders correctly
- [ ] Navigation works
- [ ] Search works (if implemented)
- [ ] Studio works (if configured)
- [ ] No 404 errors
- [ ] No console errors
- [ ] Performance acceptable

### SEO & Meta
- [ ] Meta tags configured
- [ ] OG images working
- [ ] Sitemap generated
- [ ] Robots.txt configured

### Monitoring
- [ ] Error tracking setup
- [ ] Analytics configured
- [ ] Performance monitoring

---

## Hybrid Rendering Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },

  routeRules: {
    // Static at build time
    '/': { prerender: true },
    '/about': { prerender: true },

    // ISR (Incremental Static Regeneration)
    '/blog/**': { isr: 3600 },  // Regenerate every hour

    // SWR (Stale While Revalidate)
    '/docs/**': { swr: 3600 },  // Cache 1 hour

    // Always SSR
    '/_studio/**': { ssr: true },
    '/api/**': { cors: true }
  }
})
```

---

## Troubleshooting

### Build Fails
1. Check build logs
2. Verify all dependencies installed
3. Test locally: `npm run build`
4. Check Node.js version compatibility

### Content Not Loading
1. Verify database configured (D1 or SQLite)
2. Check bindings (Cloudflare)
3. Test queries in development
4. Check console for errors

### Studio Not Working
1. Verify SSR enabled
2. Check OAuth credentials
3. Verify callback URLs
4. Check environment variables
5. Test in development first

### Performance Issues
1. Enable route rules (caching)
2. Prerender static pages
3. Implement pagination
4. Optimize images
5. Use CDN

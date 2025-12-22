# Hugo Blog Template (PaperMod Theme)

**Purpose**: Production-ready blog template with PaperMod theme, Sveltia CMS, and Cloudflare Workers deployment.

**Features**:
- ✅ PaperMod theme (dark/light/auto mode)
- ✅ Search functionality
- ✅ Tags and categories
- ✅ Reading time, share buttons, code copy
- ✅ Sveltia CMS pre-configured
- ✅ Cloudflare Workers Static Assets ready
- ✅ GitHub Actions workflow included

---

## Quick Start

### 1. Copy Template
```bash
cp -r skills/hugo/templates/hugo-blog/ my-blog/
cd my-blog/
```

### 2. Initialize Git and Theme
```bash
git init
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

### 3. Customize Configuration
Edit `hugo.yaml`:
- Change `baseURL` to your domain
- Update `title`, `description`, `author`
- Update social links
- Customize menu items

### 4. Create Content
```bash
# Create blog posts
hugo new content posts/my-first-post.md

# Edit the post, set draft: false
```

### 5. Test Locally
```bash
hugo server
# Visit: http://localhost:1313
```

### 6. Deploy to Cloudflare Workers
```bash
# Build
hugo --minify

# Deploy
npx wrangler deploy
```

---

## What's Included

### Configuration Files
- `hugo.yaml` - Complete PaperMod configuration
- `wrangler.jsonc` - Cloudflare Workers config
- `.gitignore` - Ignores public/, resources/, etc.
- `.gitmodules` - PaperMod theme reference (you'll create this)

### Sveltia CMS
- `static/admin/index.html` - CMS interface
- `static/admin/config.yml` - CMS configuration
- Pre-configured for blog posts and pages
- Local backend enabled for testing

### Sample Content
- `content/posts/first-post.md` - Example blog post
- Ready to customize and expand

### GitHub Actions
- `.github/workflows/deploy.yml` - Auto-deployment on push
- Builds with Hugo Extended
- Deploys to Cloudflare Workers
- Requires: `CLOUDFLARE_API_TOKEN` secret

---

## Customization

### Theme Settings
All theme customization in `hugo.yaml` under `params`:
- Colors, fonts, layout
- Enable/disable features
- Social icons
- Menu configuration

### Adding Pages
```bash
hugo new content about.md
hugo new content contact.md
```

### Adding to Menu
```yaml
# hugo.yaml
menu:
  main:
    - identifier: about
      name: About
      url: /about/
      weight: 60
```

### Sveltia CMS Backend
For production, you'll need OAuth setup:
1. See `references/sveltia-integration-guide.md`
2. Or use Cloudflare Workers OAuth proxy
3. Or use Git Gateway with Netlify Identity

---

## Important Notes

- **Theme Submodule**: Always clone with `git clone --recursive` or run `git submodule update --init --recursive`
- **Hugo Extended**: Required for SCSS support
- **baseURL**: Must match deployment URL for assets to work
- **Draft Posts**: Set `draft: false` to publish
- **Future Dates**: Posts won't appear until date passes (unless `--buildFuture`)

---

## File Structure

```
hugo-blog/
├── hugo.yaml              # Main configuration
├── wrangler.jsonc         # Workers deployment config
├── .gitignore             # Git ignore patterns
├── content/               # All content here
│   └── posts/
│       └── first-post.md
├── static/                # Static assets
│   └── admin/             # Sveltia CMS
│       ├── index.html
│       └── config.yml
├── themes/                # Themes (you'll add PaperMod)
│   └── PaperMod/          # Git submodule
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions
```

---

## Next Steps

1. ✅ Copy template
2. ✅ Initialize Git + add theme submodule
3. ✅ Customize hugo.yaml
4. ✅ Create first post
5. ✅ Test locally with `hugo server`
6. ✅ Build with `hugo --minify`
7. ✅ Deploy with `npx wrangler deploy`
8. ✅ Set up GitHub Actions (add CLOUDFLARE_API_TOKEN secret)
9. ✅ Configure Sveltia CMS OAuth (for production)
10. ✅ Start blogging!

---

**Production Ready**: This template is tested and deployed at https://hugo-blog-test.webfonts.workers.dev

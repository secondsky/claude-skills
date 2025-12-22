# Hugo Complete Setup Guide

Complete 7-step setup process for Hugo projects with all configuration options.

---

## Step 1: Installation and Verification

**Install Hugo Extended** using one of these methods:

**Method 1: Homebrew (macOS/Linux)** ✅ Recommended
```bash
brew install hugo
```

**Method 2: Binary Download (Linux)**
```bash
# Check latest version: https://github.com/gohugoio/hugo/releases
VERSION="0.152.2"
wget https://github.com/gohugoio/hugo/releases/download/v${VERSION}/hugo_extended_${VERSION}_linux-amd64.deb
sudo dpkg -i hugo_extended_${VERSION}_linux-amd64.deb
```

**Method 3: Docker**
```bash
docker run --rm -it -v $(pwd):/src klakegg/hugo:ext-alpine
```

**Method 4: NPM Wrapper** (not recommended, may lag behind)
```bash
npm install -g hugo-bin
```

**Verification:**
```bash
hugo version
# Should output: hugo v0.152.2+extended
#                                ^^^^^^^^ Must show "+extended"
```

**Key Points:**
- Extended edition required for SCSS/Sass
- Version should be v0.149.0+ for best compatibility
- NPM wrapper may be behind official releases
- Pin version in CI/CD (see Step 7)

---

## Step 2: Project Scaffolding

**Create new site with YAML configuration:**

```bash
hugo new site my-site --format yaml
cd my-site
```

**Directory structure created:**
```
my-site/
├── hugo.yaml          # Configuration (YAML format)
├── archetypes/        # Content templates
│   └── default.md
├── content/           # All your content goes here
├── data/              # Data files (JSON/YAML/TOML)
├── layouts/           # Template overrides
├── static/            # Static assets (images, CSS, JS)
├── themes/            # Themes directory
└── public/            # Build output (generated, git ignore)
```

**CRITICAL:**
- Use `--format yaml` for CMS compatibility
- Never commit `public/` directory to Git
- Create `.gitignore` immediately (see below)

**Recommended .gitignore:**
```gitignore
# Hugo
/public/
/resources/_gen/
.hugo_build.lock

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Dependencies (if using npm for tools)
node_modules/
package-lock.json

# Logs
*.log
```

---

## Step 3: Theme Installation

**Recommended Method: Git Submodule** ✅

```bash
# Popular themes:
# - PaperMod (blogs): https://github.com/adityatelange/hugo-PaperMod
# - Book (docs): https://github.com/alex-shpak/hugo-book
# - Academic (research): https://github.com/HugoBlox/theme-academic-cv
# - Ananke (general): https://github.com/theNewDynamic/gohugo-theme-ananke

git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

**Alternative: Hugo Modules** (advanced)
```bash
hugo mod init github.com/username/my-site

# In hugo.yaml:
# module:
#   imports:
#     - path: github.com/adityatelange/hugo-PaperMod
```

**Add theme to hugo.yaml:**
```yaml
theme: "PaperMod"
```

**When cloning project with submodules:**
```bash
git clone --recursive https://github.com/username/my-site.git
# Or if already cloned:
git submodule update --init --recursive
```

**Key Points:**
- Git submodules are recommended over manual downloads
- `--depth=1` saves space (no theme history)
- Always run `git submodule update --init --recursive` after clone
- Hugo Modules are more advanced but don't require Git submodules

---

## Step 4: Configuration

**hugo.yaml - Complete Example (PaperMod blog):**

```yaml
baseURL: "https://example.com/"
title: "My Hugo Blog"
theme: "PaperMod"
languageCode: "en-us"
defaultContentLanguage: "en"
enableRobotsTXT: true
buildDrafts: false
buildFuture: false
buildExpired: false
enableEmoji: true

minify:
  disableXML: true
  minifyOutput: true

params:
  env: production
  title: "My Hugo Blog"
  description: "A blog built with Hugo and PaperMod"
  author: "Your Name"
  ShowReadingTime: true
  ShowShareButtons: true
  ShowPostNavLinks: true
  ShowBreadCrumbs: true
  ShowCodeCopyButtons: true
  defaultTheme: auto  # dark, light, auto

  socialIcons:
    - name: twitter
      url: "https://twitter.com/username"
    - name: github
      url: "https://github.com/username"

menu:
  main:
    - identifier: posts
      name: Posts
      url: /posts/
      weight: 10
    - identifier: about
      name: About
      url: /about/
      weight: 20

outputs:
  home:
    - HTML
    - RSS
    - JSON  # Required for search
```

**Configuration Formats:**
- **YAML** (recommended): `hugo.yaml` - Better CMS compatibility
- **TOML** (legacy): `hugo.toml` - Default but problematic with Sveltia CMS
- **JSON**: `hugo.json` - Rarely used

**Environment-Specific Configs:**
```
config/
├── _default/
│   └── hugo.yaml
├── production/
│   └── hugo.yaml  # Overrides for production
└── development/
    └── hugo.yaml  # Overrides for local dev
```

---

## Step 5: Content Creation

**Create content with Hugo CLI:**
```bash
# Blog post
hugo new content posts/my-first-post.md

# Page
hugo new content about.md

# Nested documentation
hugo new content docs/getting-started/installation.md
```

**Frontmatter Format (YAML recommended):**

```yaml
---
title: "My First Post"
date: 2025-11-04T10:00:00+11:00
draft: false
tags: ["hugo", "blog"]
categories: ["General"]
description: "A brief description for SEO"
cover:
  image: "/images/cover.jpg"
  alt: "Cover image"
---

# Post content starts here

This is my first Hugo blog post!
```

**TOML Frontmatter (for reference only):**
```toml
+++
title = "My First Post"
date = 2025-11-04T10:00:00+11:00
draft = false
tags = ["hugo", "blog"]
+++
```

**Key Points:**
- Use `---` delimiters for YAML frontmatter
- Use `+++` delimiters for TOML frontmatter
- `draft: false` required for post to appear in production
- `date` in future = post won't publish (unless `--buildFuture` flag used)
- Content goes after frontmatter closing delimiter

---

## Step 6: Build and Development

**Development server (with live reload):**
```bash
# Start server
hugo server

# With drafts visible
hugo server --buildDrafts

# With future-dated posts
hugo server --buildFuture

# Bind to specific port
hugo server --port 1314

# Access at: http://localhost:1313
```

**Production build:**
```bash
# Basic build
hugo

# With minification (recommended)
hugo --minify

# With specific baseURL (for deployment)
hugo --minify --baseURL https://example.com

# Or use environment variable
hugo --minify -b $CF_PAGES_URL
```

**Build Output:**
- All generated files go to `public/` directory
- Typical build time: <100ms for small sites, <5s for 1000+ pages
- Hugo is the **fastest** static site generator

**Key Points:**
- Development server has live reload (HMR)
- Production build should use `--minify`
- Never commit `public/` directory
- Build time is extremely fast (Hugo is written in Go)

---

## Step 7: Cloudflare Workers Deployment

**Create wrangler.jsonc:**

```jsonc
{
  "name": "my-hugo-site",
  "compatibility_date": "2025-01-29",
  "assets": {
    "directory": "./public",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

**Manual deployment:**
```bash
# Build site
hugo --minify

# Deploy to Workers
npx wrangler deploy
```

**GitHub Actions (Automated):**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive  # Important for theme submodules!

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.152.2'
          extended: true

      - name: Build
        run: hugo --minify

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**Key Points:**
- `assets.directory` must be `"./public"` (Hugo's output)
- `html_handling: "auto-trailing-slash"` handles Hugo's URL structure
- `not_found_handling: "404-page"` serves Hugo's 404.html
- Always pin Hugo version in CI/CD (prevents version mismatch errors)
- Use `submodules: recursive` for theme submodules

---

## Complete Configuration Reference

### Full hugo.yaml (All Options)

```yaml
baseURL: "https://example.com/"
title: "My Hugo Blog"
theme: "PaperMod"
languageCode: "en-us"
defaultContentLanguage: "en"
enableRobotsTXT: true
buildDrafts: false
buildFuture: false
buildExpired: false
enableEmoji: true
pygmentsUseClasses: true
summaryLength: 30

minify:
  disableXML: true
  minifyOutput: true

params:
  env: production
  title: "My Hugo Blog"
  description: "A blog built with Hugo and PaperMod"
  keywords: [Blog, Hugo, Tech]
  author: "Your Name"
  images: ["/images/og-image.jpg"]
  DateFormat: "January 2, 2006"
  defaultTheme: auto  # dark, light, auto
  disableThemeToggle: false

  ShowReadingTime: true
  ShowShareButtons: true
  ShowPostNavLinks: true
  ShowBreadCrumbs: true
  ShowCodeCopyButtons: true
  ShowWordCount: true
  ShowRssButtonInSectionTermList: true
  UseHugoToc: true
  disableSpecial1stPost: false
  disableScrollToTop: false
  comments: false
  hidemeta: false
  hideSummary: false
  showtoc: true
  tocopen: false

  assets:
    disableHLJS: true
    disableFingerprinting: false

  label:
    text: "My Hugo Blog"
    icon: /favicon.ico
    iconHeight: 35

  homeInfoParams:
    Title: "Hi there 👋"
    Content: Welcome to my blog.

  socialIcons:
    - name: twitter
      url: "https://twitter.com/"
    - name: github
      url: "https://github.com/"
    - name: linkedin
      url: "https://linkedin.com/"
    - name: rss
      url: "/index.xml"

  cover:
    hidden: false
    hiddenInList: false
    hiddenInSingle: false

  editPost:
    URL: "https://github.com/username/repo/tree/main/content"
    Text: "Suggest Changes"
    appendFilePath: true

  fuseOpts:
    isCaseSensitive: false
    shouldSort: true
    location: 0
    distance: 1000
    threshold: 0.4
    minMatchCharLength: 0
    keys: ["title", "permalink", "summary", "content"]

menu:
  main:
    - identifier: search
      name: Search
      url: /search/
      weight: 10
    - identifier: posts
      name: Posts
      url: /posts/
      weight: 20
    - identifier: archives
      name: Archives
      url: /archives/
      weight: 30
    - identifier: tags
      name: Tags
      url: /tags/
      weight: 40
    - identifier: about
      name: About
      url: /about/
      weight: 50

outputs:
  home:
    - HTML
    - RSS
    - JSON  # Required for search functionality
```

**Why these settings:**
- `buildDrafts: false` - prevents drafts in production
- `enableRobotsTXT: true` - SEO best practice
- `minifyOutput: true` - smaller file sizes
- `defaultTheme: auto` - respects user's system preference
- `JSON` output - enables client-side search
- Social icons - improves discoverability

---

## Official Documentation

- **Hugo**: https://gohugo.io/documentation/
- **PaperMod Theme**: https://github.com/adityatelange/hugo-PaperMod/wiki
- **Hugo Themes**: https://themes.gohugo.io/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

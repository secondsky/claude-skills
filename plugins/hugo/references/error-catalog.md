# Hugo Error Catalog

Complete catalog of 15 documented Hugo errors with sources, causes, and solutions.

---

## Error #1: SCSS Support Not Enabled

**Error Message:**
```
Error: SCSS support not enabled
```

**Source:** https://gohugo.io/troubleshooting/faq/#i-get-this-feature-is-not-available-in-your-current-hugo-version

**Why It Happens:**
- Theme requires SCSS/Sass processing
- Hugo Standard edition doesn't include SCSS/Sass support
- Most popular themes (PaperMod, Academic, Docsy) require Extended

**Solution:**
```bash
# Verify current version
hugo version  # Should show "+extended"

# Install Hugo Extended
# macOS
brew install hugo

# Linux
VERSION="0.152.2"
wget https://github.com/gohugoio/hugo/releases/download/v${VERSION}/hugo_extended_${VERSION}_linux-amd64.deb
sudo dpkg -i hugo_extended_${VERSION}_linux-amd64.deb

# Verify
hugo version | grep extended  # Must show "+extended"
```

---

## Error #2: baseURL Configuration Errors

**Error Symptoms:**
- Broken CSS/JS/image links
- 404s on all assets
- Styles not loading on deployed site

**Source:** Hugo docs, Cloudflare Pages guide

**Why It Happens:**
- `baseURL` in config doesn't match deployment URL
- Relative URLs become absolute with wrong baseURL
- Asset paths resolve incorrectly

**Solution:**

**Option 1: Environment-specific configs**
```yaml
# config/production/hugo.yaml
baseURL: "https://example.com/"
```

**Option 2: Build flag**
```bash
hugo -b $CF_PAGES_URL --minify
```

**Option 3: Set correct baseURL**
```yaml
# hugo.yaml
baseURL: "https://example.com/"  # Must match deployment URL
```

---

## Error #3: TOML vs YAML Configuration Issues

**Error Symptoms:**
- Sveltia CMS fails to parse frontmatter
- Config not loading properly
- YAML parsing errors in CMS

**Source:** Sveltia CMS documentation, community reports

**Why It Happens:**
- Mixing TOML and YAML in same project
- Using TOML with Sveltia CMS (which has bugs in beta)
- Wrong delimiters for frontmatter format

**Solution:**

**Standardize on YAML:**
```bash
# Create new site with YAML
hugo new site my-site --format yaml
```

**YAML frontmatter:**
```yaml
---
title: "My Post"
date: 2025-11-04
---
```

**TOML frontmatter (avoid with Sveltia):**
```toml
+++
title = "My Post"
date = 2025-11-04
+++
```

---

## Error #4: Hugo Version Mismatch

**Error Symptoms:**
- Features work locally but fail in CI/CD
- Features work in CI/CD but fail locally
- Build succeeds locally but fails on deployment

**Source:** GitHub Actions hugo-setup, Cloudflare Pages docs

**Why It Happens:**
- Different Hugo versions between local and CI/CD
- Version-specific features or bugs
- Breaking changes between versions

**Solution:**

**Pin version everywhere:**

**In hugo.yaml (documentation):**
```yaml
# hugo.yaml
# Hugo version: 0.152.2+extended
```

**In GitHub Actions:**
```yaml
- name: Setup Hugo
  uses: peaceiris/actions-hugo@v2
  with:
    hugo-version: '0.152.2'
    extended: true
```

**In Cloudflare Pages:**
```
Environment variable: HUGO_VERSION=0.152.2
```

**In package.json (if using npm wrapper):**
```json
{
  "devDependencies": {
    "hugo-bin": "0.152.2"
  }
}
```

---

## Error #5: Content Frontmatter Format Errors

**Error Symptoms:**
- Content files don't render
- Build fails with parse errors
- "failed to unmarshal" errors

**Source:** Hugo content management documentation

**Why It Happens:**
- Wrong delimiters (`---` vs `+++`)
- Invalid YAML/TOML syntax
- Missing closing delimiter
- Incorrect indentation in YAML

**Solution:**

**YAML (recommended):**
```yaml
---
title: "My Post"
date: 2025-11-04
draft: false
tags: ["hugo", "blog"]
---

Content starts here...
```

**TOML:**
```toml
+++
title = "My Post"
date = 2025-11-04T10:00:00+11:00
draft = false
tags = ["hugo", "blog"]
+++

Content starts here...
```

**Validate with:**
- Sveltia CMS (validates frontmatter)
- YAML linter: https://www.yamllint.com/
- TOML linter: https://www.toml-lint.com/

---

## Error #6: Theme Not Found

**Error Message:**
```
Error: module "PaperMod" not found
```

**Error Symptoms:**
- Blank site
- No styling
- Theme layouts not applied

**Source:** Hugo themes documentation

**Why It Happens:**
- Theme not installed
- `theme` not set in hugo.yaml
- Git submodules not initialized
- Theme directory name doesn't match config

**Solution:**

**1. Install theme:**
```bash
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

**2. Set in config:**
```yaml
# hugo.yaml
theme: "PaperMod"  # Must match directory name in themes/
```

**3. Initialize submodules:**
```bash
# When cloning project
git clone --recursive https://github.com/username/my-site.git

# Or if already cloned
git submodule update --init --recursive
```

**4. Verify:**
```bash
ls themes/  # Should show PaperMod directory
```

---

## Error #7: Date Time Warp Issues

**Error Symptoms:**
- Content missing on deployed site but visible locally
- Posts not appearing in production
- Inconsistent content between environments

**Source:** Hugo date handling documentation

**Why It Happens:**
- Future-dated posts published locally (with `--buildFuture`)
- Production build doesn't use `--buildFuture` flag
- Date in future relative to build time
- Timezone differences

**Solution:**

**Option 1: Use current or past dates**
```yaml
---
title: "My Post"
date: 2025-11-04T10:00:00+11:00  # Past or current date
---
```

**Option 2: Add flag to production build**
```bash
# Build with future posts
hugo --buildFuture --minify
```

**Option 3: Check date field**
```bash
# Verify dates in content
grep -r "date:" content/ | grep 2026
```

**Best practice:**
- Use `publishDate` instead of future `date`
- Always use consistent timezone (UTC recommended)

---

## Error #8: Public Folder Conflicts

**Error Symptoms:**
- Stale content on site
- Git conflicts in `public/` directory
- Old files not removed from deployment
- Merge conflicts

**Source:** Hugo project structure best practices

**Why It Happens:**
- Committing `public/` directory to Git
- Public folder contains generated files (should be ignored)
- Conflicting builds from different branches
- Not rebuilding on deployment

**Solution:**

**1. Add to .gitignore:**
```gitignore
# Hugo
/public/
/resources/_gen/
.hugo_build.lock
```

**2. Remove from Git:**
```bash
git rm -r --cached public/
git commit -m "Remove public directory from Git"
```

**3. Rebuild on every deployment:**
```yaml
# .github/workflows/deploy.yml
- name: Build
  run: hugo --minify
```

**4. Clean before build:**
```bash
rm -rf public/
hugo --minify
```

---

## Error #9: Module Cache Corruption

**Error Message:**
```
failed to extract shortcode
```

**Error Symptoms:**
- Corrupted module cache
- Build fails intermittently
- "module not found" errors
- Shortcodes not working

**Source:** Hugo modules documentation, GitHub issues

**Why It Happens:**
- Corrupted Hugo Modules cache (when using modules instead of submodules)
- Network interruption during module download
- Version conflicts
- Stale cache

**Solution:**

**Clear module cache:**
```bash
hugo mod clean
hugo mod tidy
hugo mod get -u
```

**Or use Git submodules (more reliable):**
```bash
# Remove modules
rm -rf _vendor

# Add as submodule instead
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

**Update hugo.yaml:**
```yaml
theme: "PaperMod"  # Use submodule instead of module
```

---

## Error #10: PostCSS Processing Failure

**Error Message:**
```
Error: failed to transform resource: POSTCSS: failed to transform
```

**Why It Happens:**
- PostCSS not installed
- Missing postcss.config.js
- Tailwind CSS not configured
- Node.js not available

**Solution:**

**1. Install dependencies:**
```bash
npm install -D postcss postcss-cli autoprefixer tailwindcss
```

**2. Create postcss.config.js:**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**3. Verify Hugo Pipes:**
```go-html-template
{{ $style := resources.Get "css/main.css" | resources.PostCSS }}
<link rel="stylesheet" href="{{ $style.RelPermalink }}">
```

---

## Error #11: Git Submodule Not Found in CI/CD

**Error Symptoms:**
- Theme works locally but not in CI/CD
- Blank site on deployment
- "theme not found" in Actions

**Why It Happens:**
- Forgot `submodules: recursive` in GitHub Actions
- Submodules not initialized in CI/CD
- .gitmodules file not committed

**Solution:**

**GitHub Actions:**
```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    submodules: recursive  # CRITICAL: Must be present
```

**Verify .gitmodules is committed:**
```bash
git add .gitmodules
git commit -m "Add submodules config"
```

---

## Error #12: Resource Fingerprinting Issues

**Error Symptoms:**
- CSS not loading in production
- Cached old CSS version
- Asset not found errors

**Why It Happens:**
- Using `Permalink` instead of `RelPermalink`
- Fingerprinting enabled but not handled correctly
- Asset path mismatch

**Solution:**

**Use RelPermalink:**
```go-html-template
<!-- Correct -->
{{ $style := resources.Get "css/main.css" | resources.PostCSS | minify | fingerprint }}
<link rel="stylesheet" href="{{ $style.RelPermalink }}">

<!-- Wrong -->
<link rel="stylesheet" href="{{ $style.Permalink }}">
```

---

## Error #13: Memory Exhaustion

**Error Message:**
```
Error: failed to build pages: runtime: out of memory
```

**Why It Happens:**
- Large number of pages
- Image processing on too many images
- Infinite loops in templates
- Resource-intensive operations

**Solution:**

**1. Increase memory:**
```bash
HUGO_MEMORYLIMIT=2048 hugo
```

**2. Optimize image processing:**
```go-html-template
{{ $image := resources.Get "images/photo.jpg" }}
{{ $resized := $image.Resize "800x q75" }}  <!-- Lower quality -->
```

**3. Cache resources:**
```yaml
# hugo.yaml
caches:
  images:
    maxAge: 720h
```

---

## Error #14: Server Not Accessible

**Error Symptoms:**
- `hugo server` starts but can't access site
- Connection refused
- Site not visible on network

**Why It Happens:**
- Binding to localhost only
- Firewall blocking port
- Wrong port number

**Solution:**

**Bind to all interfaces:**
```bash
# Instead of
hugo server

# Use
hugo server --bind 0.0.0.0

# Or specific port
hugo server --bind 0.0.0.0 --port 1313
```

---

## Error #15: Draft Content Not Visible

**Error Symptoms:**
- Content not appearing on site
- Post exists but doesn't show
- Content visible in files but not rendered

**Why It Happens:**
- `draft: true` in frontmatter
- Not using `--buildDrafts` flag
- Forgetting to set `draft: false` before deployment

**Solution:**

**Development (show drafts):**
```bash
hugo server --buildDrafts
```

**Production (ensure draft is false):**
```yaml
---
title: "My Post"
date: 2025-11-04
draft: false  # MUST be false for production
---
```

**Build without drafts (default):**
```bash
hugo --minify
```

---

## Prevention Checklist

Use this checklist to prevent all 15 errors:

- [ ] Hugo Extended v0.149.0+ installed
- [ ] Version matches across local, CI/CD, and deployment
- [ ] YAML configuration format used (`--format yaml`)
- [ ] Theme installed via Git submodule
- [ ] `theme` set correctly in hugo.yaml
- [ ] `baseURL` matches deployment URL
- [ ] `public/` and `resources/_gen/` in .gitignore
- [ ] `draft: false` in all production content
- [ ] Dates are current or past (not future)
- [ ] `submodules: recursive` in GitHub Actions
- [ ] PostCSS configured if using Tailwind
- [ ] `RelPermalink` used for asset URLs
- [ ] Git submodules initialized after clone
- [ ] Hugo version pinned in CI/CD
- [ ] Frontmatter delimiters correct (YAML: `---`, TOML: `+++`)

---

## Official Documentation

- **Hugo Troubleshooting**: https://gohugo.io/troubleshooting/
- **Hugo FAQ**: https://gohugo.io/troubleshooting/faq/
- **Community Forum**: https://discourse.gohugo.io/

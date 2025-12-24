# Hugo Documentation Template

**Purpose**: Production-ready documentation site using Hugo Book theme. Perfect for technical documentation, API docs, or knowledge bases.

**Use When**:
- Building technical documentation
- Creating API documentation
- Setting up knowledge base
- Need search, navigation, and TOC

---

## Quick Start

### 1. Copy Template
```bash
cp -r skills/hugo/templates/hugo-docs/ my-docs-site/
cd my-docs-site/
git init
```

### 2. Initialize Theme
```bash
git submodule add https://github.com/alex-shpak/hugo-book.git themes/hugo-book
```

Or if you copied with the theme already included:
```bash
git submodule update --init --recursive
```

### 3. Run Development Server
```bash
hugo server
# Visit: http://localhost:1313
```

### 4. Build
```bash
hugo --minify
```

---

## What's Included

### Hugo Book Theme
- **Search**: Full-text search across all documentation
- **Navigation**: Auto-generated sidebar from content structure
- **TOC**: Per-page table of contents
- **Responsive**: Mobile-friendly design
- **Dark Mode**: Automatic light/dark theme support

### Configuration
- `hugo.yaml` - Complete Hugo Book configuration
- Search enabled with JSON output
- Git integration for last modified dates
- Syntax highlighting (Monokai theme)
- Custom markdown settings

### Sample Content
- Homepage (`content/_index.md`)
- Getting Started guide
- Configuration documentation
- Advanced topics section
- Nested documentation structure

### Deployment
- `wrangler.jsonc` - Cloudflare Workers config
- `.github/workflows/deploy.yml` - GitHub Actions
- `.gitignore` - Standard Hugo ignores

---

## Content Structure

```
hugo-docs/
├── content/
│   ├── _index.md              # Homepage
│   └── docs/                  # Documentation
│       ├── _index.md          # Docs section landing
│       ├── getting-started.md
│       ├── configuration.md
│       └── advanced/          # Nested section
│           ├── _index.md
│           └── customization.md
```

### Content Organization

Hugo Book auto-generates menu from your content structure:

1. **Files** become menu items
2. **Folders** become sections (collapsible in menu)
3. **`_index.md`** files define section properties

### Adding Pages

```bash
# Add a new page in docs
hugo new content docs/my-page.md

# Add a new section
hugo new content docs/my-section/_index.md
hugo new content docs/my-section/page-1.md
```

---

## Configuration

### Basic Settings

Edit `hugo.yaml`:

```yaml
baseURL: "https://your-domain.com/"
title: "Your Documentation"
languageCode: "en-us"
```

### Search

Search is enabled by default:
- Uses JSON index (`/index.json`)
- Client-side search (no backend required)
- Searches all content

To exclude pages from search:
```yaml
---
title: "Private Page"
bookSearchExclude: true
---
```

### Navigation

Control menu appearance with frontmatter:

```yaml
---
title: "Page Title"
weight: 1                    # Lower = higher in menu
bookCollapseSection: false   # Start section expanded
bookHidden: false            # Hide from menu
bookFlatSection: false       # Don't nest child pages
---
```

### Repository Links

Add "Edit this page" links:

```yaml
params:
  BookRepo: "https://github.com/yourusername/yourrepo"
  BookGitInfo: true
```

---

## Customization

### Logo

Add logo to `static/logo.png`:

```yaml
params:
  BookLogo: "/logo.png"
```

### Custom CSS

Create `assets/custom.css`:

```css
.book-menu {
  background-color: #f8f9fa;
}
```

### Theme Colors

Hugo Book uses CSS variables. Override in `assets/custom.css`:

```css
:root {
  --color-link: #0066cc;
  --color-visited-link: #0066cc;
}
```

### Custom Layouts

Override theme layouts by creating matching files in `layouts/`:

```
layouts/
├── _default/
│   └── single.html      # Single page layout
└── partials/
    └── docs/
        ├── header.html
        └── footer.html
```

---

## Deployment

### Cloudflare Workers (Recommended)

1. Update `wrangler.jsonc`:
```jsonc
{
  "name": "my-docs-site",
  "compatibility_date": "2025-01-29"
}
```

2. Build and deploy:
```bash
hugo --minify
npx wrangler deploy
```

### GitHub Actions (Automatic)

The included workflow deploys on push to `main`:

1. Add secret: `CLOUDFLARE_API_TOKEN`
2. Push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

3. Deployment happens automatically

---

## Hugo Book Features

### Frontmatter Options

```yaml
---
title: "Page Title"
weight: 1                    # Menu order
bookToc: true                # Show TOC for this page
bookHidden: false            # Hide from menu
bookCollapseSection: false   # Start section collapsed
bookFlatSection: false       # Flat menu (no nesting)
bookSearchExclude: false     # Exclude from search
bookComments: false          # Enable comments (if configured)
---
```

### Shortcodes

Hugo Book includes built-in shortcodes:

**Buttons**:
```markdown
{{</* button relref="/" [class="..."] */>}}Get Home{{</* /button */>}}
{{</* button href="https://github.com/..." */>}}Contribute{{</* /button */>}}
```

**Columns**:
```markdown
{{</* columns */>}}
Left column content
<--->
Right column content
{{</* /columns */>}}
```

**Expand** (collapsible):
```markdown
{{</* expand "Click to expand" */>}}
Hidden content here
{{</* /expand */>}}
```

**Hints** (callouts):
```markdown
{{</* hint info */>}}
This is an info callout
{{</* /hint */>}}

{{</* hint warning */>}}
This is a warning
{{</* /hint */>}}

{{</* hint danger */>}}
This is a danger message
{{</* /hint */>}}
```

**Tabs**:
```markdown
{{</* tabs "uniqueid" */>}}
{{</* tab "JavaScript" */>}} JS code {{</* /tab */>}}
{{</* tab "Python" */>}} Python code {{</* /tab */>}}
{{</* /tabs */>}}
```

### Table of Contents

Per-page TOC is automatic. Configure in `hugo.yaml`:

```yaml
markup:
  tableOfContents:
    startLevel: 2    # Start TOC at ## headers
    endLevel: 6      # End at ###### headers
```

Disable for specific page:
```yaml
---
bookToc: false
---
```

---

## Multi-language

Support multiple languages:

```yaml
languages:
  en:
    languageName: "English"
    weight: 1
  de:
    languageName: "Deutsch"
    weight: 2
```

Content structure:
```
content/
├── _index.en.md
├── _index.de.md
└── docs/
    ├── page.en.md
    └── page.de.md
```

---

## File Structure

```
hugo-docs/
├── hugo.yaml              # Site configuration
├── wrangler.jsonc         # Cloudflare Workers config
├── .gitignore             # Git ignores
├── content/               # All content (markdown)
│   ├── _index.md          # Homepage
│   └── docs/              # Documentation pages
│       ├── _index.md
│       ├── getting-started.md
│       ├── configuration.md
│       └── advanced/
│           ├── _index.md
│           └── customization.md
├── static/                # Static assets
│   └── (images, logo, etc.)
├── themes/                # Hugo Book theme
│   └── hugo-book/         # (Git submodule)
├── layouts/               # Custom layouts (optional)
├── assets/                # Custom CSS, JS (optional)
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions workflow
```

---

## Troubleshooting

### Theme Not Found
```bash
# Initialize submodule
git submodule update --init --recursive
```

### Search Not Working
- Ensure `outputs` includes `JSON` in `hugo.yaml`
- Build with `hugo --minify` to generate `index.json`
- Check browser console for errors

### Menu Not Showing
- Add `weight` frontmatter to pages
- Ensure `_index.md` exists in sections
- Check `bookHidden: false` in frontmatter

### Build Warnings
- `no layout file for "json"` is expected (search index)
- Ignore warnings about missing JSON layout

---

## Next Steps

1. ✅ Copy template
2. ✅ Initialize theme submodule
3. ✅ Customize `hugo.yaml` (title, baseURL, repo)
4. ✅ Update sample content in `content/`
5. ✅ Add your logo to `static/logo.png`
6. ✅ Test with `hugo server`
7. ✅ Build with `hugo --minify`
8. ✅ Deploy with `npx wrangler deploy`

---

## Resources

- **Hugo Book Theme**: https://github.com/alex-shpak/hugo-book
- **Hugo Book Demo**: https://hugo-book-demo.netlify.app/
- **Hugo Documentation**: https://gohugo.io/documentation/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

---

**This template provides a complete, production-ready documentation site with search, navigation, and automatic deployment.**

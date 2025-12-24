# Hugo Minimal Starter Template

**Purpose**: Bare-bones Hugo project for complete custom development. No theme, no dependencies, clean slate.

**Use When**:
- Building completely custom site
- Want full control over every aspect
- Learning Hugo from scratch
- Have specific design requirements

---

## Quick Start

### 1. Copy Template
```bash
cp -r skills/hugo/templates/minimal-starter/ my-custom-site/
cd my-custom-site/
git init
```

### 2. Run Development Server
```bash
hugo server
# Visit: http://localhost:1313
# (Will be blank - add layouts and content)
```

### 3. Add Content
```bash
hugo new content _index.md
hugo new content about.md
```

### 4. Create Layouts
Create `layouts/index.html` for homepage:
```html
<!DOCTYPE html>
<html>
<head>
    <title>{{ .Site.Title }}</title>
</head>
<body>
    <h1>{{ .Title }}</h1>
    {{ .Content }}
</body>
</html>
```

### 5. Build
```bash
hugo --minify
```

---

## What's Included

- `hugo.yaml` - Minimal configuration
- `content/` - Empty content directory
- `layouts/` - Empty layouts directory
- `static/` - Empty static assets directory
- `data/` - Empty data directory
- `.gitignore` - Standard Hugo ignores
- `wrangler.jsonc` - Cloudflare Workers config
- `.github/workflows/deploy.yml` - GitHub Actions

**NO Theme**: Intentionally blank for custom development

---

## Adding a Theme

### Option 1: Git Submodule (Recommended)
```bash
git submodule add https://github.com/author/theme.git themes/theme-name
echo 'theme: "theme-name"' >> hugo.yaml
```

### Option 2: Hugo Module
```bash
hugo mod init github.com/username/repo

# Add to hugo.yaml:
# module:
#   imports:
#     - path: github.com/author/theme
```

### Option 3: Manual Copy
```bash
# Download theme and extract to themes/theme-name/
echo 'theme: "theme-name"' >> hugo.yaml
```

---

## Custom Development Guide

### 1. Create Homepage Layout
`layouts/index.html`:
```go-html-template
{{ define "main" }}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ .Site.Title }}</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <h1>{{ .Site.Title }}</h1>
        <nav>
            {{ range .Site.Menus.main }}
            <a href="{{ .URL }}">{{ .Name }}</a>
            {{ end }}
        </nav>
    </header>
    <main>
        {{ .Content }}
    </main>
</body>
</html>
{{ end }}
```

### 2. Create Default Layout
`layouts/_default/single.html`:
```go-html-template
{{ define "main" }}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ .Title }} | {{ .Site.Title }}</title>
</head>
<body>
    <article>
        <h1>{{ .Title }}</h1>
        <time>{{ .Date.Format "January 2, 2006" }}</time>
        {{ .Content }}
    </article>
</body>
</html>
{{ end }}
```

### 3. Add CSS
`static/css/style.css`:
```css
body {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui;
}
```

### 4. Configure Menu
`hugo.yaml`:
```yaml
menu:
  main:
    - name: Home
      url: /
      weight: 1
    - name: About
      url: /about/
      weight: 2
```

---

## Popular Themes to Add

**Blogs**:
- PaperMod: `https://github.com/adityatelange/hugo-PaperMod.git`
- Ananke: `https://github.com/theNewDynamic/gohugo-theme-ananke.git`

**Documentation**:
- Hugo Book: `https://github.com/alex-shpak/hugo-book.git`
- Docsy: `https://github.com/google/docsy.git`

**Academic/Research**:
- Academic CV: `https://github.com/HugoBlox/theme-academic-cv.git`

See more: https://themes.gohugo.io/

---

## File Structure

```
minimal-starter/
├── hugo.yaml              # Minimal configuration
├── wrangler.jsonc         # Workers deployment
├── .gitignore             # Standard ignores
├── content/               # Add your content here
│   └── .gitkeep
├── layouts/               # Add your layouts here
│   └── _default/
│       └── .gitkeep
├── static/                # Add CSS, images, JS here
│   └── .gitkeep
├── data/                  # Add data files here
│   └── .gitkeep
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions
```

---

## Next Steps

1. ✅ Copy template
2. Choose:
   - A. Add a theme (see "Adding a Theme" above)
   - B. Create custom layouts (see "Custom Development Guide")
3. ✅ Add content with `hugo new content`
4. ✅ Customize `hugo.yaml`
5. ✅ Test with `hugo server`
6. ✅ Build with `hugo --minify`
7. ✅ Deploy with `npx wrangler deploy`

---

**This template gives you a blank canvas to build exactly what you want.**

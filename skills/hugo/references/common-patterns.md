# Hugo Common Patterns

Common project patterns and use cases for Hugo static site generator.

---

## Pattern 1: Blog with PaperMod Theme

**When to use:** Personal blogs, company blogs, news sites

### Setup

```bash
# Scaffold
hugo new site my-blog --format yaml
cd my-blog
git init
git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod

# Configure (see configuration below)

# Create posts
hugo new content posts/first-post.md

# Develop
hugo server

# Build
hugo --minify
```

### Configuration (`hugo.yaml`)

```yaml
baseURL: "https://myblog.com/"
title: "My Blog"
theme: "PaperMod"
languageCode: "en-us"
enableRobotsTXT: true

params:
  ShowReadingTime: true
  ShowShareButtons: true
  ShowPostNavLinks: true
  ShowBreadCrumbs: true
  ShowCodeCopyButtons: true
  defaultTheme: auto

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

### Features

- Dark/light mode toggle
- Reading time estimation
- Share buttons (Twitter, LinkedIn, etc.)
- Code copy buttons
- Search functionality
- Tags and categories
- Archives page

---

## Pattern 2: Documentation Site with Hugo Book

**When to use:** Technical documentation, knowledge bases, API docs

### Setup

```bash
# Scaffold
hugo new site docs --format yaml
cd docs
git init
git submodule add https://github.com/alex-shpak/hugo-book.git themes/hugo-book

# Create docs
hugo new content docs/getting-started/installation.md
hugo new content docs/getting-started/configuration.md
hugo new content docs/advanced/deployment.md

# Build
hugo --minify
```

### Configuration (`hugo.yaml`)

```yaml
baseURL: "https://docs.example.com/"
title: "My Documentation"
theme: "hugo-book"
languageCode: "en-us"

params:
  BookTheme: auto
  BookSearch: true
  BookSection: "docs"
  BookMenuBundle: menu
  BookToC: true
  BookComments: false

menu:
  before:
    - name: Home
      url: /
      weight: 1
  after:
    - name: GitHub
      url: https://github.com/username/repo
      weight: 1
```

### Directory Structure

```
content/
├── _index.md          # Home page
└── docs/              # Documentation
    ├── _index.md
    ├── getting-started/
    │   ├── _index.md
    │   ├── installation.md
    │   └── configuration.md
    └── advanced/
        ├── _index.md
        ├── deployment.md
        └── optimization.md
```

### Features

- Nested navigation
- Search functionality
- Table of contents
- Breadcrumbs
- Dark/light mode
- Mobile-friendly
- Multi-language support

---

## Pattern 3: Landing Page

**When to use:** Marketing sites, product pages, portfolios

### Setup

```bash
# Scaffold
hugo new site landing --format yaml

# Use custom layouts (no theme)
# See: bundled template templates/hugo-landing/

# Single-page structure
hugo new content _index.md

# Build
hugo --minify
```

### Directory Structure

```
layouts/
├── index.html         # Home page
└── partials/
    ├── header.html
    ├── hero.html
    ├── features.html
    ├── testimonials.html
    ├── cta.html
    └── footer.html
```

### Home Page (`layouts/index.html`)

```html
{{ define "main" }}
  {{ partial "hero.html" . }}
  {{ partial "features.html" . }}
  {{ partial "testimonials.html" . }}
  {{ partial "cta.html" . }}
{{ end }}
```

### Content (`content/_index.md`)

```yaml
---
title: "My Product"
hero:
  heading: "Build faster with our tool"
  subheading: "The best tool for developers"
  cta: "Get Started"
  cta_url: "/signup"

features:
  - title: "Fast"
    description: "Lightning fast performance"
    icon: "zap"
  - title: "Reliable"
    description: "99.9% uptime guarantee"
    icon: "shield"
  - title: "Scalable"
    description: "Grows with your needs"
    icon: "trending-up"

testimonials:
  - name: "Alice Smith"
    company: "Tech Corp"
    quote: "This tool saved us hundreds of hours"
  - name: "Bob Jones"
    company: "Startup Inc"
    quote: "Game changer for our team"
---
```

### Features

- Hero section
- Features grid
- Testimonials carousel
- Call-to-action sections
- Contact forms
- SEO optimized

---

## Pattern 4: Multilingual Site

**When to use:** International sites, localized content

### Configuration (`hugo.yaml`)

```yaml
baseURL: "https://example.com/"
title: "My Site"
defaultContentLanguage: "en"

languages:
  en:
    languageName: "English"
    weight: 1
    params:
      description: "My site in English"
  es:
    languageName: "Español"
    weight: 2
    params:
      description: "Mi sitio en español"
  fr:
    languageName: "Français"
    weight: 3
    params:
      description: "Mon site en français"
```

### Directory Structure

**Option 1: File suffixes**
```
content/
├── posts/
│   ├── post-1.en.md
│   ├── post-1.es.md
│   ├── post-1.fr.md
│   ├── post-2.en.md
│   └── post-2.es.md
└── about/
    ├── _index.en.md
    ├── _index.es.md
    └── _index.fr.md
```

**Option 2: Language directories**
```
content/
├── en/
│   ├── posts/
│   │   ├── post-1.md
│   │   └── post-2.md
│   └── about.md
├── es/
│   ├── posts/
│   │   ├── post-1.md
│   │   └── post-2.md
│   └── about.md
└── fr/
    ├── posts/
    │   └── post-1.md
    └── about.md
```

### Language Switcher (`layouts/partials/language-switcher.html`)

```html
<nav class="language-switcher">
  {{ range .Site.Languages }}
    {{ if ne .Lang $.Site.Language.Lang }}
      <a href="{{ . | absLangURL }}">{{ .LanguageName }}</a>
    {{ end }}
  {{ end }}
</nav>
```

### Content with Translations

**English (`content/posts/hello.en.md`):**
```yaml
---
title: "Hello World"
date: 2025-11-04
---

Welcome to my blog!
```

**Spanish (`content/posts/hello.es.md`):**
```yaml
---
title: "Hola Mundo"
date: 2025-11-04
---

¡Bienvenido a mi blog!
```

### Features

- Language switcher
- Translated URLs
- Per-language menus
- SEO with hreflang tags
- Right-to-left language support

---

## Pattern 5: Portfolio Site

**When to use:** Personal portfolios, creative showcases

### Directory Structure

```
content/
├── _index.md          # Home
├── about.md           # About page
└── projects/          # Projects
    ├── project-1.md
    ├── project-2.md
    └── project-3.md
```

### Project Frontmatter

```yaml
---
title: "My Awesome Project"
date: 2025-11-04
description: "A brief description"
thumbnail: "/images/project-1-thumb.jpg"
featured_image: "/images/project-1.jpg"
technologies: ["React", "TypeScript", "Tailwind"]
github_url: "https://github.com/username/project"
demo_url: "https://project-demo.com"
---

## About the project

This project solves X problem...

## Features

- Feature 1
- Feature 2

## Screenshots

![Screenshot 1](/images/project-1-screen1.jpg)
![Screenshot 2](/images/project-1-screen2.jpg)
```

### Project List (`layouts/index.html`)

```html
{{ define "main" }}
<div class="projects-grid">
  {{ range where .Site.RegularPages "Type" "projects" }}
  <article class="project-card">
    {{ if .Params.thumbnail }}
    <img src="{{ .Params.thumbnail }}" alt="{{ .Title }}">
    {{ end }}
    <h3><a href="{{ .Permalink }}">{{ .Title }}</a></h3>
    <p>{{ .Description }}</p>
    <div class="technologies">
      {{ range .Params.technologies }}
      <span class="tag">{{ . }}</span>
      {{ end }}
    </div>
  </article>
  {{ end }}
</div>
{{ end }}
```

### Features

- Project grid
- Image galleries
- Technology tags
- External links (GitHub, demo)
- Contact form
- Social media links

---

## Pattern 6: E-commerce (Static)

**When to use:** Small catalogs, JAMstack e-commerce with Stripe/Snipcart

### Directory Structure

```
content/
├── _index.md
└── products/
    ├── product-1.md
    ├── product-2.md
    └── product-3.md
```

### Product Frontmatter

```yaml
---
title: "Product Name"
price: 29.99
currency: "USD"
image: "/images/product-1.jpg"
description: "Product description"
category: "Electronics"
in_stock: true
sku: "PROD-001"
---

## Product Details

Full product description here...
```

### Integration with Snipcart

```html
<!-- layouts/_default/single.html -->
{{ define "main" }}
<article>
  <h1>{{ .Title }}</h1>
  <img src="{{ .Params.image }}" alt="{{ .Title }}">
  <p>{{ .Params.description }}</p>
  <p class="price">${{ .Params.price }}</p>

  <button
    class="snipcart-add-item"
    data-item-id="{{ .Params.sku }}"
    data-item-price="{{ .Params.price }}"
    data-item-url="{{ .Permalink }}"
    data-item-name="{{ .Title }}"
    data-item-image="{{ .Params.image }}">
    Add to Cart
  </button>
</article>
{{ end }}
```

### Features

- Product catalog
- Shopping cart (via Snipcart/Stripe)
- Inventory management
- Search and filtering
- Order processing

---

## Pattern 7: Newsletter/Blog

**When to use:** Content-focused sites with email subscriptions

### Configuration

```yaml
params:
  newsletter:
    enabled: true
    provider: "convertkit"  # or "mailchimp", "buttondown"
    api_key: "your-api-key"
    form_id: "your-form-id"
```

### Newsletter Signup (`layouts/partials/newsletter.html`)

```html
<div class="newsletter">
  <h3>Subscribe to Newsletter</h3>
  <p>Get updates delivered directly to your inbox.</p>
  <form action="https://app.convertkit.com/forms/{{ .Site.Params.newsletter.form_id }}/subscriptions" method="post">
    <input type="email" name="email_address" placeholder="Your email" required>
    <button type="submit">Subscribe</button>
  </form>
</div>
```

### Features

- Email subscription forms
- RSS feeds
- Post categories
- Author profiles
- Comments (Disqus, Utterances)
- Social sharing

---

## Official Documentation

- **Hugo**: https://gohugo.io/documentation/
- **PaperMod**: https://github.com/adityatelange/hugo-PaperMod
- **Hugo Book**: https://github.com/alex-shpak/hugo-book
- **Hugo Themes**: https://themes.gohugo.io/

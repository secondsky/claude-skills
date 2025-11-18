# Hugo Advanced Topics

Advanced Hugo features for experienced users: custom shortcodes, image processing, taxonomies, data files, and more.

---

## Custom Shortcodes

Shortcodes are reusable content components that can be embedded in Markdown.

### Simple Shortcode: YouTube Embed

**Create `layouts/shortcodes/youtube.html`:**

```go-html-template
<div class="youtube-embed">
  <iframe
    src="https://www.youtube.com/embed/{{ .Get 0 }}"
    frameborder="0"
    allowfullscreen>
  </iframe>
</div>
```

**Usage in content:**
```markdown
{{< youtube dQw4w9WgXcQ >}}
```

### Named Parameters: Alert Box

**Create `layouts/shortcodes/alert.html`:**

```go-html-template
<div class="alert alert-{{ .Get "type" | default "info" }}">
  {{ .Inner | markdownify }}
</div>
```

**Usage in content:**
```markdown
{{< alert type="warning" >}}
**Warning:** This is important!
{{< /alert >}}
```

### Complex Shortcode: Code Tabs

**Create `layouts/shortcodes/tabs.html`:**

```go-html-template
<div class="code-tabs">
  <div class="tabs">
    {{ range $index, $tab := split (.Get "tabs") "," }}
    <button class="tab-button{{ if eq $index 0 }} active{{ end }}" data-tab="{{ $index }}">
      {{ $tab }}
    </button>
    {{ end }}
  </div>
  <div class="tab-content">
    {{ .Inner | markdownify }}
  </div>
</div>

<script>
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      // Tab switching logic
    });
  });
</script>
```

**Usage:**
```markdown
{{< tabs tabs="JavaScript,TypeScript,Python" >}}
```js
console.log('Hello');
```

```ts
console.log('Hello' as string);
```

```python
print('Hello')
```
{{< /tabs >}}
```

---

## Image Processing

Hugo has powerful built-in image processing capabilities.

### Basic Resizing

```go-html-template
{{ $image := resources.Get "images/photo.jpg" }}
{{ $resized := $image.Resize "800x" }}
<img src="{{ $resized.RelPermalink }}" alt="Photo">
```

### Responsive Images

```go-html-template
{{ $image := resources.Get "images/photo.jpg" }}
{{ $small := $image.Resize "400x" }}
{{ $medium := $image.Resize "800x" }}
{{ $large := $image.Resize "1200x" }}

<picture>
  <source srcset="{{ $large.RelPermalink }}" media="(min-width: 1024px)">
  <source srcset="{{ $medium.RelPermalink }}" media="(min-width: 640px)">
  <img src="{{ $small.RelPermalink }}" alt="Responsive image">
</picture>
```

### Image Filters

```go-html-template
{{ $image := resources.Get "images/photo.jpg" }}
{{ $processed := $image.Resize "800x" | images.Filter images.Grayscale images.GaussianBlur 8 }}
<img src="{{ $processed.RelPermalink }}" alt="Processed">
```

### WebP Conversion

```go-html-template
{{ $image := resources.Get "images/photo.jpg" }}
{{ $webp := $image.Resize "800x webp" }}
{{ $fallback := $image.Resize "800x" }}

<picture>
  <source srcset="{{ $webp.RelPermalink }}" type="image/webp">
  <img src="{{ $fallback.RelPermalink }}" alt="Photo">
</picture>
```

### Thumbnails with Cropping

```go-html-template
{{ $image := resources.Get "images/photo.jpg" }}
{{ $thumbnail := $image.Fill "300x200 center" }}
<img src="{{ $thumbnail.RelPermalink }}" alt="Thumbnail">
```

---

## Custom Taxonomies

Create custom taxonomies beyond the built-in tags and categories.

### Configuration

```yaml
# hugo.yaml
taxonomies:
  tag: tags
  category: categories
  series: series        # Custom taxonomy
  author: authors       # Custom taxonomy
  difficulty: difficulties  # Custom taxonomy
```

### Using Custom Taxonomies

**In content frontmatter:**
```yaml
---
title: "My Post"
series: ["Getting Started"]
authors: ["Alice", "Bob"]
difficulties: ["Beginner"]
---
```

**List all series:**
```go-html-template
<!-- layouts/_default/series.html -->
{{ range .Site.Taxonomies.series }}
  <a href="{{ .Page.Permalink }}">
    {{ .Page.Title }} ({{ .Count }} posts)
  </a>
{{ end }}
```

**List posts in a series:**
```go-html-template
<!-- layouts/series/list.html -->
{{ define "main" }}
<h1>{{ .Title }}</h1>
<ul>
  {{ range .Pages }}
  <li><a href="{{ .Permalink }}">{{ .Title }}</a></li>
  {{ end }}
</ul>
{{ end }}
```

---

## Data Files

Use external data files (JSON, YAML, TOML) for structured content.

### Data File Example

**Create `data/team.yaml`:**
```yaml
- name: Alice Smith
  role: Developer
  image: /images/alice.jpg
  bio: Full-stack developer with 5 years experience

- name: Bob Jones
  role: Designer
  image: /images/bob.jpg
  bio: UI/UX designer passionate about user experience
```

### Using Data Files

```go-html-template
<!-- layouts/partials/team.html -->
<div class="team-grid">
  {{ range .Site.Data.team }}
  <div class="team-member">
    <img src="{{ .image }}" alt="{{ .name }}">
    <h3>{{ .name }}</h3>
    <p class="role">{{ .role }}</p>
    <p class="bio">{{ .bio }}</p>
  </div>
  {{ end }}
</div>
```

### Remote Data (API)

```go-html-template
{{ $data := getJSON "https://api.example.com/posts" }}
{{ range $data.posts }}
  <article>
    <h2>{{ .title }}</h2>
    <p>{{ .excerpt }}</p>
  </article>
{{ end }}
```

### CSV Data

**Create `data/prices.csv`:**
```csv
Product,Price,Available
Widget A,29.99,true
Widget B,39.99,false
Widget C,49.99,true
```

**Use in template:**
```go-html-template
{{ $prices := .Site.Data.prices }}
{{ range $prices }}
  <div>{{ .Product }}: ${{ .Price }}</div>
{{ end }}
```

---

## Page Bundles

Organize content and resources together.

### Leaf Bundle (Single Page)

```
content/
└── posts/
    └── my-post/
        ├── index.md         # Page content
        ├── image1.jpg       # Page resource
        ├── image2.jpg
        └── document.pdf
```

**Access resources:**
```go-html-template
{{ with .Resources.GetMatch "image1.jpg" }}
  <img src="{{ .RelPermalink }}" alt="Image 1">
{{ end }}

{{ range .Resources.ByType "image" }}
  <img src="{{ .RelPermalink }}" alt="{{ .Name }}">
{{ end }}
```

### Branch Bundle (Section Page)

```
content/
└── blog/
    ├── _index.md          # Section page
    ├── header-image.jpg   # Section resource
    ├── post-1/
    │   └── index.md
    └── post-2/
        └── index.md
```

---

## Template Overrides

Override theme templates without modifying the theme.

### Directory Structure

```
layouts/
├── _default/
│   └── single.html      # Overrides theme's single.html
├── partials/
│   └── header.html      # Overrides theme's header.html
└── posts/
    └── single.html      # Specific to posts section
```

### Partial Templates

**Create custom partial:**
```go-html-template
<!-- layouts/partials/custom-footer.html -->
<footer>
  <p>&copy; {{ now.Year }} {{ .Site.Title }}</p>
  {{ partial "social-icons.html" . }}
</footer>
```

**Use in template:**
```go-html-template
{{ partial "custom-footer.html" . }}
```

---

## Content Types

Define custom content types with specific layouts.

### Configuration

```yaml
# hugo.yaml
taxonomies:
  tag: tags
  category: categories

[...]
```

### Create Archetype

**`archetypes/portfolio.md`:**
```yaml
---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
type: "portfolio"
thumbnail: ""
featured_image: ""
technologies: []
github_url: ""
demo_url: ""
---
```

### Create Content

```bash
hugo new portfolio/project-1.md
```

### Custom Template

**`layouts/portfolio/single.html`:**
```go-html-template
{{ define "main" }}
<article class="portfolio-item">
  <h1>{{ .Title }}</h1>
  <img src="{{ .Params.featured_image }}" alt="{{ .Title }}">

  {{ .Content }}

  <div class="technologies">
    {{ range .Params.technologies }}
    <span class="tech-tag">{{ . }}</span>
    {{ end }}
  </div>

  <div class="links">
    {{ if .Params.github_url }}
    <a href="{{ .Params.github_url }}">GitHub</a>
    {{ end }}
    {{ if .Params.demo_url }}
    <a href="{{ .Params.demo_url }}">Live Demo</a>
    {{ end }}
  </div>
</article>
{{ end }}
```

---

## Hugo Modules

Advanced dependency management (alternative to Git submodules).

### Initialize Module

```bash
hugo mod init github.com/username/my-site
```

### Import Theme as Module

**`hugo.yaml`:**
```yaml
module:
  imports:
    - path: github.com/adityatelange/hugo-PaperMod
```

### Commands

```bash
# Get dependencies
hugo mod get

# Update dependencies
hugo mod get -u

# Tidy dependencies
hugo mod tidy

# Clean module cache
hugo mod clean

# Vendor dependencies
hugo mod vendor
```

---

## Build Performance

### Caching

```yaml
# hugo.yaml
caches:
  assets:
    dir: :resourceDir/_gen
    maxAge: 720h
  getjson:
    dir: :cacheDir/:project
    maxAge: 1h
  getcsv:
    dir: :cacheDir/:project
    maxAge: 1h
  images:
    dir: :resourceDir/_gen
    maxAge: 720h
```

### Parallel Processing

```yaml
# hugo.yaml
build:
  useResourceCacheWhen: fallback
```

### Ignore Content

```yaml
# hugo.yaml
ignoreFiles:
  - \.foo$
  - \.bak$
  - drafts/
```

---

## Custom Output Formats

Create custom output formats beyond HTML.

### Configuration

```yaml
# hugo.yaml
outputs:
  home:
    - HTML
    - RSS
    - JSON
  section:
    - HTML
    - JSON

outputFormats:
  JSON:
    mediaType: application/json
    baseName: index
    isPlainText: true
    notAlternative: true
```

### Template for JSON

**`layouts/_default/list.json.json`:**
```go-html-template
{
  "items": [
    {{ range $index, $page := .Pages }}
    {{ if $index }},{{ end }}
    {
      "title": {{ .Title | jsonify }},
      "url": {{ .Permalink | jsonify }},
      "date": {{ .Date.Format "2006-01-02" | jsonify }},
      "summary": {{ .Summary | jsonify }}
    }
    {{ end }}
  ]
}
```

---

## Multilingual Menus

Define different menus per language.

```yaml
# hugo.yaml
languages:
  en:
    weight: 1
    languageName: "English"
    menu:
      main:
        - name: Home
          url: /
        - name: About
          url: /about
  es:
    weight: 2
    languageName: "Español"
    menu:
      main:
        - name: Inicio
          url: /
        - name: Acerca de
          url: /about
```

---

## Official Documentation

- **Hugo Templates**: https://gohugo.io/templates/
- **Image Processing**: https://gohugo.io/content-management/image-processing/
- **Taxonomies**: https://gohugo.io/content-management/taxonomies/
- **Data Templates**: https://gohugo.io/templates/data-templates/
- **Hugo Modules**: https://gohugo.io/hugo-modules/

# Hugo + Tailwind CSS v4 Integration Guide

Complete guide for integrating Tailwind CSS v4 with Hugo using Hugo Pipes and PostCSS.

---

## Overview

Hugo supports Tailwind CSS v4 through Hugo Pipes and the Tailwind CLI. This approach is fundamentally different from Vite-based React projects.

**CRITICAL:** Do NOT try to use the `tailwind-v4-shadcn` skill patterns with Hugo. That skill is for Vite + React projects and is incompatible with Hugo's asset pipeline.

---

## When to Use Tailwind vs Themes

**Use Tailwind with Hugo when:**
- Building custom designs without relying on themes
- Need utility-first CSS workflow
- Want complete styling control
- Prefer Tailwind over SCSS/Sass

**Use themes (PaperMod, Book, etc.) when:**
- Want proven, production-ready designs
- Need fast setup without custom CSS
- Happy with theme customization options
- Don't need pixel-perfect custom design

---

## Key Differences from Vite + React

| Aspect | Vite + React | Hugo |
|--------|-------------|------|
| **Build System** | JavaScript (Node.js) | Go (Hugo binary) |
| **Tailwind Integration** | `@tailwindcss/vite` plugin | Tailwind CLI + PostCSS |
| **Config File** | `vite.config.ts` | `hugo.yaml` |
| **Content Scanning** | `content: []` globs | `hugo_stats.json` |
| **Dev Server** | Vite (port 5173) | Hugo (port 1313) |
| **Dark Mode** | React ThemeProvider | CSS classes or Alpine.js |

---

## Quick Start (10 Minutes)

### 1. Install Dependencies

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

### 2. Configure Hugo (`hugo.yaml`)

```yaml
build:
  writeStats: true  # Generates hugo_stats.json for Tailwind

module:
  mounts:
    - source: assets
      target: assets
    - source: hugo_stats.json
      target: assets/watching/hugo_stats.json
```

### 3. Configure Tailwind (`tailwind.config.js`)

```javascript
module.exports = {
  content: [
    './hugo_stats.json',
    './layouts/**/*.html',
    './content/**/*.{html,md}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
      },
    },
  },
  plugins: [],
}
```

### 4. Configure PostCSS (`postcss.config.js`)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 5. Create CSS Entry File (`assets/css/main.css`)

```css
@import "tailwindcss";

@layer base {
  body {
    @apply bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100;
  }
}
```

### 6. Process CSS in Template (`layouts/_default/baseof.html`)

```html
<!DOCTYPE html>
<html lang="{{ .Site.Language }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ .Title }}</title>

  {{ $style := resources.Get "css/main.css" | resources.PostCSS }}
  {{ if hugo.IsProduction }}
    {{ $style = $style | minify | fingerprint }}
  {{ end }}
  <link rel="stylesheet" href="{{ $style.RelPermalink }}">
</head>
<body>
  {{ block "main" . }}{{ end }}
</body>
</html>
```

### 7. Start Development

```bash
hugo server
```

Hugo will:
1. Generate `hugo_stats.json` with all CSS classes used
2. Process `assets/css/main.css` through PostCSS
3. Tailwind reads `hugo_stats.json` to determine which classes to include
4. Output final CSS to `public/`

---

## Dark Mode Implementation

### Option 1: CSS-Only (Simplest)

**1. Configure Tailwind (`tailwind.config.js`):**

```javascript
module.exports = {
  darkMode: 'class',  // Use class-based dark mode
  // ... rest of config
}
```

**2. Add dark mode toggle** (`layouts/partials/dark-mode-toggle.html`):

```html
<button id="theme-toggle" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
  <svg class="w-5 h-5 hidden dark:block" fill="currentColor" viewBox="0 0 20 20">
    <!-- Sun icon -->
    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
  </svg>
  <svg class="w-5 h-5 block dark:hidden" fill="currentColor" viewBox="0 0 20 20">
    <!-- Moon icon -->
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
  </svg>
</button>

<script>
  const toggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Check saved preference or system preference
  const theme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  html.classList.toggle('dark', theme === 'dark');

  toggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  });
</script>
```

**3. Include in base template:**

```html
<body>
  <header>
    {{ partial "dark-mode-toggle.html" . }}
  </header>
  {{ block "main" . }}{{ end }}
</body>
```

### Option 2: Alpine.js (More Features)

**1. Add Alpine.js:**

```html
<head>
  <!-- ... existing head content ... -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
</head>
```

**2. Create dark mode component:**

```html
<div x-data="darkMode()" x-cloak>
  <button @click="toggle()" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
    <svg x-show="!isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <!-- Moon icon -->
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
    <svg x-show="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <!-- Sun icon -->
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
    </svg>
  </button>
</div>

<script>
  function darkMode() {
    return {
      isDark: false,

      init() {
        this.isDark = localStorage.getItem('theme') === 'dark' ||
          (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        this.updateTheme();
      },

      toggle() {
        this.isDark = !this.isDark;
        this.updateTheme();
      },

      updateTheme() {
        if (this.isDark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
    }
  }
</script>
```

---

## Typography Plugin

**1. Install plugin:**

```bash
npm install -D @tailwindcss/typography
```

**2. Add to config:**

```javascript
module.exports = {
  // ... existing config
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

**3. Use in templates:**

```html
<article class="prose dark:prose-invert lg:prose-xl">
  {{ .Content }}
</article>
```

---

## Forms Plugin

**1. Install plugin:**

```bash
npm install -D @tailwindcss/forms
```

**2. Add to config:**

```javascript
module.exports = {
  // ... existing config
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

**3. Form elements automatically styled:**

```html
<form>
  <input type="email" class="rounded-md" />
  <select class="rounded-md">
    <option>Option 1</option>
  </select>
  <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md">
    Submit
  </button>
</form>
```

---

## Production Build Optimization

**1. Enable minification in Hugo:**

```yaml
# hugo.yaml
minify:
  minifyOutput: true
```

**2. Build command:**

```bash
hugo --minify
```

Hugo will:
- Minify CSS output
- Add fingerprinting in production
- Purge unused Tailwind classes (via `hugo_stats.json`)

**3. Cloudflare Workers deployment:**

```jsonc
// wrangler.jsonc
{
  "name": "hugo-tailwind-site",
  "compatibility_date": "2025-01-29",
  "assets": {
    "directory": "./public",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

---

## Common Issues and Solutions

### Issue #1: CSS Not Processing

**Error:** CSS file not found or not processing

**Solution:**

1. Verify PostCSS is configured:
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

2. Check Hugo Pipes in template:
```html
{{ $style := resources.Get "css/main.css" | resources.PostCSS }}
<link rel="stylesheet" href="{{ $style.RelPermalink }}">
```

3. Ensure `assets/css/main.css` exists

### Issue #2: Classes Not Purging

**Error:** CSS file too large, unused classes included

**Solution:**

1. Enable `writeStats` in `hugo.yaml`:
```yaml
build:
  writeStats: true
```

2. Update Tailwind config to use `hugo_stats.json`:
```javascript
module.exports = {
  content: [
    './hugo_stats.json',
    './layouts/**/*.html',
    './content/**/*.{html,md}',
  ],
}
```

3. Rebuild: `hugo --minify`

### Issue #3: Dark Mode Not Working

**Error:** Dark mode classes not applying

**Solution:**

1. Use `darkMode: 'class'` in Tailwind config:
```javascript
module.exports = {
  darkMode: 'class',
}
```

2. Add/remove `dark` class on `<html>`:
```javascript
document.documentElement.classList.toggle('dark');
```

3. Check CSS includes dark variants:
```css
@layer base {
  body {
    @apply bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100;
  }
}
```

### Issue #4: Asset Fingerprinting Fails

**Error:** CSS not loading in production

**Solution:**

Use `RelPermalink` not `Permalink`:
```html
<!-- Correct -->
<link rel="stylesheet" href="{{ $style.RelPermalink }}">

<!-- Wrong -->
<link rel="stylesheet" href="{{ $style.Permalink }}">
```

### Issue #5: Hugo Template Syntax in CSS

**Error:** Can't use `{{ }}` in CSS files

**Solution:**

Apply classes in templates, not CSS:
```html
<!-- Correct: Apply class in template -->
<div class="text-{{ .Params.color }}-500">

<!-- Wrong: Can't use Hugo syntax in CSS -->
/* This won't work in main.css:
.custom { color: {{ .Site.Params.primaryColor }}; }
*/
```

### Issue #6: Version Mismatch

**Error:** Tailwind CLI and PostCSS plugin versions differ

**Solution:**

Update all to same version:
```bash
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
```

---

## Complete Example: Blog Post Template

```html
<!-- layouts/_default/single.html -->
{{ define "main" }}
<article class="max-w-4xl mx-auto px-4 py-8">
  <header class="mb-8">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
      {{ .Title }}
    </h1>
    <div class="flex items-center text-gray-600 dark:text-gray-400 text-sm">
      <time datetime="{{ .Date.Format "2006-01-02" }}">
        {{ .Date.Format "January 2, 2006" }}
      </time>
      <span class="mx-2">•</span>
      <span>{{ .ReadingTime }} min read</span>
    </div>
  </header>

  {{ if .Params.cover }}
  <img
    src="{{ .Params.cover.image }}"
    alt="{{ .Params.cover.alt }}"
    class="w-full h-96 object-cover rounded-lg mb-8"
  />
  {{ end }}

  <div class="prose dark:prose-invert lg:prose-xl max-w-none">
    {{ .Content }}
  </div>

  {{ if .Params.tags }}
  <footer class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
    <div class="flex flex-wrap gap-2">
      {{ range .Params.tags }}
      <a
        href="/tags/{{ . | urlize }}"
        class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {{ . }}
      </a>
      {{ end }}
    </div>
  </footer>
  {{ end }}
</article>
{{ end }}
```

---

## Official Documentation

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Hugo Pipes**: https://gohugo.io/hugo-pipes/
- **Hugo Asset Processing**: https://gohugo.io/hugo-pipes/postcss/
- **PostCSS**: https://postcss.org/

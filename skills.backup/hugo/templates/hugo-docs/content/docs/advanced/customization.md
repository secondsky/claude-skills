---
title: "Customization"
weight: 1
---

# Customization

Learn how to customize the appearance and behavior of your documentation site.

## Custom CSS

Add custom styles by creating `assets/custom.css`:

```css
/* Custom styles */
.book-menu {
  background-color: #f8f9fa;
}

.book-brand {
  font-weight: bold;
}
```

Then reference it in your layout or configuration.

## Custom Layouts

Override theme layouts by creating matching files in your `layouts/` directory:

```
layouts/
├── _default/
│   ├── baseof.html      # Base template
│   └── single.html      # Single page template
└── partials/
    ├── docs/            # Documentation partials
    │   ├── header.html
    │   └── footer.html
    └── menu.html        # Sidebar menu
```

## Frontmatter Options

Control page behavior with frontmatter:

```yaml
---
title: "Page Title"
weight: 1                    # Order in menu
bookToc: true                # Show TOC
bookHidden: false            # Hide from menu
bookCollapseSection: false   # Start collapsed
bookFlatSection: false       # Flat menu structure
bookSearchExclude: false     # Exclude from search
---
```

## Adding a Logo

Add a logo to `static/logo.png` and configure:

```yaml
params:
  BookLogo: "/logo.png"
```

## Custom Shortcodes

Create reusable content blocks in `layouts/shortcodes/`:

```go-html-template
<!-- layouts/shortcodes/note.html -->
<div class="note">
  {{ .Inner | markdownify }}
</div>
```

Use in content:

```markdown
{{</* note */>}}
This is a custom note block.
{{</* /note */>}}
```

## Multi-language Support

Configure multiple languages:

```yaml
languages:
  en:
    languageName: "English"
    weight: 1
  de:
    languageName: "Deutsch"
    weight: 2
```

## Search Customization

Customize search behavior:

```yaml
outputs:
  home:
    - HTML
    - RSS
    - JSON

params:
  BookSearch: true
  # Exclude certain sections from search
  BookSearchExclude:
    - "/blog"
```

## Theme Customization

Hugo Book supports these params:

- `BookTheme`: Theme variant (auto/light/dark)
- `BookMenuBundle`: Custom menu structure
- `BookPortableLinks`: Portable markdown links
- `BookServiceWorker`: Enable offline support

See the [Hugo Book documentation](https://github.com/alex-shpak/hugo-book) for more options.

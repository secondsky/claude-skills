# Sveltia CMS Configuration Guide

Complete reference for configuring Sveltia CMS collections, fields, and internationalization.

**Last Updated**: 2025-10-24

---

## Basic Config Structure

```yaml
# admin/config.yml

# Backend (Git provider)
backend:
  name: github  # or gitlab, gitea, forgejo
  repo: owner/repo
  branch: main
  base_url: https://your-auth-worker.workers.dev  # OAuth proxy

# Media storage
media_folder: static/images/uploads  # Where files are saved
public_folder: /images/uploads        # URL path in content

# Optional: Multiple media libraries
media_libraries:
  default:
    config:
      max_file_size: 5242880  # 5 MB in bytes
      slugify_filename: true
      transformations:
        raster_image:
          format: webp
          quality: 85
          width: 2048
          height: 2048
        svg:
          optimize: true

# Optional: Custom branding
logo_url: https://yourdomain.com/logo.svg

# Collections (content types)
collections:
  - name: posts
    label: Blog Posts
    folder: content/posts
    create: true
    fields:
      # Field definitions
```

---

## Collection Patterns

### Blog Post Collection

```yaml
collections:
  - name: posts
    label: Blog Posts
    folder: content/posts
    create: true
    slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
    format: yaml  # or md, toml, json
    fields:
      - label: Title
        name: title
        widget: string

      - label: Date
        name: date
        widget: datetime
        date_format: 'YYYY-MM-DD'
        time_format: false  # Date only

      - label: Draft
        name: draft
        widget: boolean
        default: true

      - label: Featured Image
        name: image
        widget: image
        required: false

      - label: Excerpt
        name: excerpt
        widget: text
        required: false

      - label: Tags
        name: tags
        widget: list
        required: false

      - label: Body
        name: body
        widget: markdown
```

**Template**: See `templates/collections/blog-posts.yml`

---

### Documentation Page Collection

```yaml
collections:
  - name: docs
    label: Documentation
    folder: content/docs
    create: true
    slug: '{{slug}}'
    format: mdx
    fields:
      - label: Title
        name: title
        widget: string

      - label: Description
        name: description
        widget: text

      - label: Order
        name: order
        widget: number
        value_type: int
        hint: Sort order in sidebar

      - label: Category
        name: category
        widget: select
        options:
          - Getting Started
          - API Reference
          - Tutorials
          - Advanced

      - label: Body
        name: body
        widget: markdown
```

**Template**: See `templates/collections/docs-pages.yml`

---

### Landing Page Collection (Structured Content)

```yaml
collections:
  - name: pages
    label: Landing Pages
    folder: content/pages
    create: true
    slug: '{{slug}}'
    format: json
    fields:
      - label: Title
        name: title
        widget: string

      - label: SEO
        name: seo
        widget: object
        fields:
          - { label: Meta Title, name: metaTitle, widget: string }
          - { label: Meta Description, name: metaDescription, widget: text }
          - { label: OG Image, name: ogImage, widget: image }

      - label: Hero Section
        name: hero
        widget: object
        fields:
          - { label: Headline, name: headline, widget: string }
          - { label: Subheadline, name: subheadline, widget: text }
          - { label: Hero Image, name: image, widget: image }
          - label: CTA Button
            name: cta
            widget: object
            fields:
              - { label: Text, name: text, widget: string }
              - { label: URL, name: url, widget: string }

      - label: Features
        name: features
        widget: list
        fields:
          - { label: Title, name: title, widget: string }
          - { label: Description, name: description, widget: text }
          - { label: Icon, name: icon, widget: image }
```

**Template**: See `templates/collections/landing-pages.yml`

---

## Internationalization (i18n) Setup

Sveltia CMS has first-class i18n support with multiple structure options.

### Multiple Files Structure (Recommended)

**Best for**: Hugo, Jekyll with separate locale files

```yaml
i18n:
  structure: multiple_files
  locales: [en, fr, de, ja]
  default_locale: en

collections:
  - name: posts
    label: Blog Posts
    folder: content/posts
    create: true
    i18n: true  # Enable i18n for this collection
    fields:
      - label: Title
        name: title
        widget: string
        i18n: true  # Translatable field

      - label: Date
        name: date
        widget: datetime
        i18n: duplicate  # Same value across locales

      - label: Body
        name: body
        widget: markdown
        i18n: true
```

**Result**: Creates files like:
- `content/posts/hello-world.en.md`
- `content/posts/hello-world.fr.md`
- `content/posts/hello-world.de.md`

---

### Multiple Folders Structure

**Best for**: Next.js, Astro with locale directories

```yaml
i18n:
  structure: multiple_folders
  locales: [en, fr, de]
  default_locale: en

collections:
  - name: blog
    label: Blog Posts
    folder: content/{{locale}}/blog  # {{locale}} placeholder
    create: true
    i18n: true
    fields:
      # Same as above
```

**Result**: Creates files like:
- `content/en/blog/hello-world.md`
- `content/fr/blog/hello-world.md`
- `content/de/blog/hello-world.md`

---

### Single File Structure

**Best for**: i18n libraries that manage translations in one file

```yaml
i18n:
  structure: single_file
  locales: [en, fr, de]
  default_locale: en

collections:
  - name: translations
    label: Translations
    files:
      - name: ui
        label: UI Strings
        file: data/translations.json
        i18n: true
        fields:
          - label: Navigation
            name: nav
            widget: object
            i18n: true
            fields:
              - { label: Home, name: home, widget: string, i18n: true }
              - { label: About, name: about, widget: string, i18n: true }
```

---

## DeepL Translation Integration

Sveltia CMS includes one-click translation using DeepL.

### Setup

1. **Get DeepL API key:**
   - Sign up at https://www.deepl.com/pro-api
   - Free tier: 500,000 characters/month

2. **Add to config:**
   ```yaml
   # admin/config.yml
   backend:
     name: github
     repo: owner/repo

   i18n:
     structure: multiple_files
     locales: [en, fr, de, es, ja]
     default_locale: en

   # DeepL integration
   deepl:
     api_key: your-deepl-api-key
     # Or use environment variable: DEEPL_API_KEY
   ```

3. **Use in editor:**
   - Switch to non-default locale
   - Click "Translate from [Default Locale]" button
   - DeepL translates all translatable fields instantly

**Note**: Translation quality depends on DeepL's AI - always review translations.

---

## Widget Reference

### Common Widgets

| Widget | Purpose | Example |
|--------|---------|---------|
| `string` | Single-line text | Title, name |
| `text` | Multi-line text | Description, excerpt |
| `markdown` | Rich text editor | Blog post body |
| `boolean` | True/false toggle | Draft status, featured |
| `datetime` | Date/time picker | Published date |
| `image` | Image upload | Featured image, hero |
| `file` | File upload | PDF, documents |
| `select` | Dropdown selection | Category, status |
| `list` | Repeatable items | Tags, authors |
| `object` | Nested fields | SEO metadata, hero section |
| `relation` | Reference other entries | Related posts |
| `number` | Numeric input | Order, count |
| `hidden` | Hidden field with default | Layout type |

### Widget Examples

```yaml
# String
- { label: Title, name: title, widget: string }

# Text with hint
- label: Excerpt
  name: excerpt
  widget: text
  hint: Brief summary (150-160 characters)

# Select with options
- label: Category
  name: category
  widget: select
  options: [News, Tutorial, Update]

# List (tags)
- label: Tags
  name: tags
  widget: list

# Object (nested fields)
- label: Author
  name: author
  widget: object
  fields:
    - { label: Name, name: name, widget: string }
    - { label: Email, name: email, widget: string }
    - { label: Avatar, name: avatar, widget: image }

# Relation (reference another collection)
- label: Related Posts
  name: relatedPosts
  widget: relation
  collection: posts
  search_fields: [title]
  value_field: slug
  display_fields: [title]
```

---

## File Collections (Single Files)

For singleton content like site config, about page:

```yaml
collections:
  - name: pages
    label: Pages
    files:
      - name: about
        label: About Page
        file: content/about.md
        fields:
          - { label: Title, name: title, widget: string }
          - { label: Body, name: body, widget: markdown }

      - name: config
        label: Site Config
        file: data/config.json
        fields:
          - { label: Site Name, name: siteName, widget: string }
          - { label: Description, name: description, widget: text }
          - { label: Logo, name: logo, widget: image }
```

---

## Next Steps

After configuration:

1. Test locally with sample content
2. Verify all fields work as expected
3. Set up i18n if needed
4. Deploy → See `deployment-guide.md`

---

**Questions?** Check `error-catalog.md` for configuration troubleshooting.

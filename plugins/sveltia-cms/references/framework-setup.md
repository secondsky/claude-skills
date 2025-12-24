# Sveltia CMS Framework Setup Guide

Complete framework-specific setup instructions for integrating Sveltia CMS into your static site project.

**Last Updated**: 2025-10-24

---

## Overview

Sveltia CMS works with any static site generator. The key difference is where to place the admin directory:

| Framework | Admin Directory | Public Folder |
|-----------|----------------|---------------|
| Hugo | `static/admin/` | `static/` |
| Jekyll | `admin/` | Root |
| 11ty | `admin/` | Root (with passthrough) |
| Astro | `public/admin/` | `public/` |
| Next.js | `public/admin/` | `public/` |
| Gatsby | `static/admin/` | `static/` |
| SvelteKit | `static/admin/` | `static/` |

---

## 1. Hugo Setup (Most Common)

Hugo is the most popular static site generator for Sveltia CMS.

### Steps

1. **Create admin directory:**
   ```bash
   mkdir -p static/admin
   ```

2. **Create admin index page:**
   ```html
   <!-- static/admin/index.html -->
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Content Manager</title>
     </head>
     <body>
       <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
     </body>
   </html>
   ```

3. **Create config file:**
   ```yaml
   # static/admin/config.yml
   backend:
     name: github
     repo: owner/repo
     branch: main

   media_folder: static/images/uploads
   public_folder: /images/uploads

   collections:
     - name: posts
       label: Blog Posts
       folder: content/posts
       create: true
       slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
       fields:
         - { label: 'Title', name: 'title', widget: 'string' }
         - { label: 'Date', name: 'date', widget: 'datetime' }
         - { label: 'Draft', name: 'draft', widget: 'boolean', default: true }
         - { label: 'Tags', name: 'tags', widget: 'list', required: false }
         - { label: 'Body', name: 'body', widget: 'markdown' }
   ```

4. **Start Hugo dev server:**
   ```bash
   hugo server
   ```

5. **Access admin:**
   ```
   http://localhost:1313/admin/
   ```

### Hugo-Specific Notes

- Files in `static/` are automatically copied to output
- Media uploads should go to `static/images/uploads` or similar
- Hugo's content structure typically uses `content/posts/` or `content/blog/`
- Use YAML format (not TOML) for best compatibility

**Template**: See `templates/hugo/`

---

## 2. Jekyll Setup

Jekyll is commonly used with GitHub Pages and Sveltia CMS.

### Steps

1. **Create admin directory:**
   ```bash
   mkdir -p admin
   ```

2. **Create admin index page:**
   ```html
   <!-- admin/index.html -->
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Content Manager</title>
     </head>
     <body>
       <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
     </body>
   </html>
   ```

3. **Create config file:**
   ```yaml
   # admin/config.yml
   backend:
     name: github
     repo: owner/repo
     branch: main

   media_folder: assets/images/uploads
   public_folder: /assets/images/uploads

   collections:
     - name: posts
       label: Blog Posts
       folder: _posts
       create: true
       slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
       fields:
         - { label: 'Layout', name: 'layout', widget: 'hidden', default: 'post' }
         - { label: 'Title', name: 'title', widget: 'string' }
         - { label: 'Date', name: 'date', widget: 'datetime' }
         - { label: 'Categories', name: 'categories', widget: 'list', required: false }
         - { label: 'Body', name: 'body', widget: 'markdown' }
   ```

4. **Add admin directory to Jekyll config:**
   ```yaml
   # _config.yml
   include:
     - admin
   ```

5. **Start Jekyll dev server:**
   ```bash
   bundle exec jekyll serve
   ```

6. **Access admin:**
   ```
   http://localhost:4000/admin/
   ```

### Jekyll-Specific Notes

- Admin directory must be included in `_config.yml`
- Posts go in `_posts/` folder
- Use `layout` field (hidden) to set post layout
- Media typically stored in `assets/images/`

**Template**: See `templates/jekyll/`

---

## 3. 11ty (Eleventy) Setup

11ty works well with Sveltia CMS for flexible static sites.

### Steps

1. **Create admin directory:**
   ```bash
   mkdir -p admin
   ```

2. **Create admin index page:**
   ```html
   <!-- admin/index.html -->
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Content Manager</title>
     </head>
     <body>
       <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
     </body>
   </html>
   ```

3. **Create config file:**
   ```yaml
   # admin/config.yml
   backend:
     name: github
     repo: owner/repo
     branch: main

   media_folder: src/assets/images
   public_folder: /assets/images

   collections:
     - name: blog
       label: Blog Posts
       folder: src/posts
       create: true
       slug: '{{slug}}'
       fields:
         - { label: 'Title', name: 'title', widget: 'string' }
         - { label: 'Description', name: 'description', widget: 'text' }
         - { label: 'Date', name: 'date', widget: 'datetime' }
         - { label: 'Tags', name: 'tags', widget: 'list', required: false }
         - { label: 'Body', name: 'body', widget: 'markdown' }
   ```

4. **Add passthrough copy to `.eleventy.js`:**
   ```javascript
   module.exports = function(eleventyConfig) {
     eleventyConfig.addPassthroughCopy('admin');
     // ... rest of config
   };
   ```

5. **Start 11ty dev server:**
   ```bash
   bunx @11ty/eleventy --serve
   ```

6. **Access admin:**
   ```
   http://localhost:8080/admin/
   ```

### 11ty-Specific Notes

- Must add passthrough copy for admin directory
- Content structure is flexible (typically `src/posts/`)
- Media can be in `src/assets/` or `public/assets/`
- Works well with Nunjucks, Liquid, or other templating engines

**Template**: See `templates/11ty/`

---

## 4. Astro Setup

Astro is a modern framework that works well with Sveltia CMS.

### Steps

1. **Create admin directory:**
   ```bash
   mkdir -p public/admin
   ```

2. **Create admin index page:**
   ```html
   <!-- public/admin/index.html -->
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Content Manager</title>
     </head>
     <body>
       <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
     </body>
   </html>
   ```

3. **Create config file:**
   ```yaml
   # public/admin/config.yml
   backend:
     name: github
     repo: owner/repo
     branch: main

   media_folder: public/images
   public_folder: /images

   collections:
     - name: blog
       label: Blog Posts
       folder: src/content/blog
       create: true
       slug: '{{slug}}'
       format: mdx
       fields:
         - { label: 'Title', name: 'title', widget: 'string' }
         - { label: 'Description', name: 'description', widget: 'text' }
         - { label: 'Published Date', name: 'pubDate', widget: 'datetime' }
         - { label: 'Hero Image', name: 'heroImage', widget: 'image', required: false }
         - { label: 'Body', name: 'body', widget: 'markdown' }
   ```

4. **Start Astro dev server:**
   ```bash
   npm run dev
   ```

5. **Access admin:**
   ```
   http://localhost:4321/admin/
   ```

### Astro-Specific Notes

- Admin goes in `public/` folder (automatically copied)
- Content typically in `src/content/` with Content Collections
- Use MDX format for rich content
- Media stored in `public/images/` or `public/assets/`

**Template**: See `templates/astro/`

---

## 5. Framework-Agnostic Setup

**Applies to**: Gatsby, Next.js (SSG mode), SvelteKit, Remix, or any framework

### Steps

1. **Determine public directory:**
   - Gatsby: `static/`
   - Next.js: `public/`
   - SvelteKit: `static/`
   - Remix: `public/`

2. **Create admin directory in public folder:**
   ```bash
   mkdir -p <public-folder>/admin
   ```

3. **Create admin index page:**
   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Content Manager</title>
     </head>
     <body>
       <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
     </body>
   </html>
   ```

4. **Create config file tailored to your content structure:**
   ```yaml
   backend:
     name: github
     repo: owner/repo
     branch: main

   media_folder: <your-media-path>
   public_folder: <your-public-path>

   collections:
     # Define based on your content structure
   ```

5. **Access admin:**
   ```
   http://localhost:<port>/admin/
   ```

---

## Troubleshooting Framework-Specific Issues

### Issue: 404 on /admin

**Cause**: Admin directory not in correct public folder or not being copied during build.

**Solutions by framework:**

- **Hugo**: Ensure admin is in `static/` (auto-copied)
- **Jekyll**: Add `admin` to `include:` in `_config.yml`
- **11ty**: Add `eleventyConfig.addPassthroughCopy('admin')` to `.eleventy.js`
- **Astro**: Ensure admin is in `public/` (auto-copied)
- **Next.js/SvelteKit**: Ensure admin is in `public/`/`static/` (auto-copied)

### Issue: Media Uploads Not Working

**Cause**: Incorrect `media_folder` or `public_folder` paths.

**Solution**: Match paths to your framework's structure:

```yaml
# Hugo
media_folder: static/images/uploads
public_folder: /images/uploads

# Jekyll
media_folder: assets/images/uploads
public_folder: /assets/images/uploads

# Astro
media_folder: public/images
public_folder: /images
```

### Issue: Content Not Listing

**Cause**: Incorrect `folder` path in collection config.

**Solution**: Verify folder path matches actual content location:

```bash
# Check where your content files actually are
find . -name "*.md" -type f

# Update config.yml to match
collections:
  - name: posts
    folder: content/posts  # Must match actual location
```

---

## Next Steps

After framework setup:

1. Configure authentication → See `authentication-guide.md`
2. Define collections → See `configuration-guide.md`
3. Test locally before deploying
4. Deploy → See `deployment-guide.md`

---

**Questions?** Check `error-catalog.md` for common issues and solutions.

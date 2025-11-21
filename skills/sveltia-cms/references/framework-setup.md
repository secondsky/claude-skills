## Setup Patterns by Framework

Use the appropriate setup pattern based on your framework choice.

### 1. Hugo Setup (Most Common)

Hugo is the most popular static site generator for Sveltia CMS.

**Steps:**

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

**Template**: See `templates/hugo/`

---

### 2. Jekyll Setup

Jekyll is commonly used with GitHub Pages and Sveltia CMS.

**Steps:**

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

4. **Start Jekyll dev server:**
   ```bash
   bundle exec jekyll serve
   ```

5. **Access admin:**
   ```
   http://localhost:4000/admin/
   ```

**Template**: See `templates/jekyll/`

---

### 3. 11ty (Eleventy) Setup

11ty works well with Sveltia CMS for flexible static sites.

**Steps:**

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

**Template**: See `templates/11ty/`

---

### 4. Astro Setup

Astro is a modern framework that works well with Sveltia CMS.

**Steps:**

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

**Template**: See `templates/astro/`

---

### 5. Framework-Agnostic Setup

**Applies to**: Gatsby, Next.js (SSG mode), SvelteKit, Remix, or any framework

**Steps:**

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


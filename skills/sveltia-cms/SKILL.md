---
name: sveltia-cms
description: |
  Complete Sveltia CMS skill for lightweight, Git-backed content management.
  Sveltia is the modern successor to Decap/Netlify CMS with 5x smaller bundle (300 KB),
  faster GraphQL-based performance, and solves 260+ predecessor issues.

  Use this skill when setting up Git-based CMS for static sites (Hugo, Jekyll,
  11ty, Gatsby, Astro, SvelteKit, Next.js), blogs, documentation sites, marketing
  sites, or migrating from Decap/Netlify CMS. Framework-agnostic with first-class
  i18n support and mobile-friendly editing interface.

  Prevents 8+ common errors including OAuth authentication failures, TOML formatting
  issues, YAML parse errors, CORS/COOP policy problems, content not listing, script
  loading errors, image upload failures, and deployment problems. Includes complete

  Keywords: Sveltia CMS, Git-backed CMS, Decap CMS alternative, Netlify CMS alternative, headless CMS, static site CMS, Hugo CMS, Jekyll CMS, 11ty CMS, Gatsby CMS, Astro CMS, SvelteKit CMS, Next.js CMS, content management, visual editing, markdown CMS, YAML frontmatter, i18n CMS, multilingual CMS, mobile-friendly CMS, OAuth authentication CMS, TOML config, admin/config.yml, GraphQL performance, cloudflare workers oauth proxy, OAuth authentication failure, YAML parse error, CORS COOP policy, content not listing, image upload failures
  Cloudflare Workers OAuth proxy setup guide.
license: MIT
allowed-tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep']
metadata:
  token_savings: "60-65%"
  errors_prevented: 8
  package_version: "0.113.5"
  last_verified: "2025-10-29"
  frameworks: ["Hugo", "Jekyll", "11ty", "Gatsby", "Astro", "Next.js", "SvelteKit", "Framework-agnostic"]
  deployment: ["Cloudflare Workers", "Vercel", "Netlify", "GitHub Pages", "Cloudflare Pages"]
---

# Sveltia CMS Skill

Complete skill for integrating Sveltia CMS into static site projects.

---

## What is Sveltia CMS?

**Sveltia CMS** is a Git-based lightweight headless content management system built from scratch as the modern successor to Decap CMS (formerly Netlify CMS). It provides a fast, intuitive editing interface for content stored in Git repositories.

### Key Features

1. **Lightweight & Fast**
   - Bundle size: <500 KB (minified/brotlied) vs 1.5-2.6 MB for competitors
   - Built with Svelte compiler (no virtual DOM overhead)
   - Uses GraphQL APIs for instant content fetching
   - Relevance-based search across all content

2. **Modern User Experience**
   - Intuitive admin interface with full viewport utilization
   - Dark mode support (follows system preferences)
   - Mobile and tablet optimized
   - Drag-and-drop file uploads with multiple file support
   - Real-time preview with instant updates

3. **Git-Native Architecture**
   - Content stored as Markdown, MDX, YAML, TOML, or JSON
   - Full version control and change history
   - No vendor lock-in - content lives with code
   - Supports GitHub, GitLab, Gitea, Forgejo backends

4. **Framework-Agnostic**
   - Served as vanilla JavaScript bundle
   - Works with Hugo, Jekyll, 11ty, Gatsby, Astro, Next.js, SvelteKit
   - No React, Vue, or framework runtime dependencies
   - Compatible with any static site generator

5. **First-Class Internationalization**
   - Multiple language support built-in
   - One-click DeepL translation integration
   - Locale switching while editing
   - Flexible i18n structures (files, folders, single file)

6. **Built-In Image Optimization**
   - Automatic WebP conversion
   - Client-side resizing and optimization
   - SVG optimization support
   - Configurable quality and dimensions

### Current Versions

- **@sveltia/cms**: 0.113.5 (October 2025)
- **Status**: Public Beta (v1.0 expected early 2026)
- **Maturity**: Production-ready (265+ issues solved from predecessor)

---

## When to Use This Skill

### ✅ Use Sveltia CMS When:

1. **Building Static Sites**
   - Hugo blogs and documentation
   - Jekyll sites and GitHub Pages
   - 11ty (Eleventy) projects
   - Gatsby marketing sites
   - Astro content-heavy sites

2. **Non-Technical Editors Need Access**
   - Marketing teams managing pages
   - Authors writing blog posts
   - Content teams without Git knowledge
   - Clients needing easy content updates

3. **Git-Based Workflow Desired**
   - Content versioning through Git
   - Content review through pull requests
   - Content lives with code in repository
   - CI/CD integration for deployments

4. **Lightweight Solution Required**
   - Performance-sensitive projects
   - Mobile-first editing needed
   - Quick load times critical
   - Minimal bundle size important

5. **Migrating from Decap/Netlify CMS**
   - Existing config.yml can be reused
   - Drop-in replacement (change 1 line)
   - Better performance and UX
   - Active maintenance and bug fixes

### ❌ Don't Use Sveltia CMS When:

1. **Real-Time Collaboration Needed**
   - Multiple users editing simultaneously (Google Docs-style)
   - Use Sanity, Contentful, or TinaCMS instead

2. **Visual Page Building Required**
   - Drag-and-drop page builders needed
   - Use Webflow, Builder.io, or TinaCMS (React) instead

3. **Highly Dynamic Data**
   - E-commerce with real-time inventory
   - Real-time dashboards or analytics
   - Use traditional databases (D1, PostgreSQL) instead

4. **React-Specific Visual Editing Needed**
   - In-context component editing
   - Use TinaCMS instead (React-focused)

### Sveltia CMS vs TinaCMS

**Use Sveltia** for:
- Hugo, Jekyll, 11ty, Gatsby (non-React SSGs)
- Traditional CMS admin panel UX
- Lightweight bundle requirements
- Framework-agnostic projects

**Use TinaCMS** for:
- React, Next.js, Astro (React components)
- Visual in-context editing
- Schema-driven type-safe content
- Modern developer experience with TypeScript

**Both are valid** - Sveltia complements TinaCMS for different use cases.

---


---

## Quick Start (10 Minutes)

### 1. Choose Your Framework

**Load `references/framework-setup.md` for complete setup guide** for:
- Hugo (most common)
- Jekyll (GitHub Pages)
- 11ty, Astro, Next.js, Gatsby

### 2. Basic Setup (Framework-Agnostic)

1. **Create admin directory** in your public folder:
   ```bash
   mkdir -p <public-folder>/admin
   ```

2. **Create `admin/index.html`**:
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

3. **Create `admin/config.yml`** - **Load `references/configuration-guide.md` for complete examples**

4. **Set up authentication** - **Load `references/authentication-guide.md` for OAuth setup**

---

## Top 3 Common Errors

This skill prevents **8 common errors**. Here are the top 3 (load `references/error-catalog.md` for all 8 with detailed solutions).

### 1. ❌ OAuth Authentication Failures

**Error**: "Error: Failed to authenticate"

**Quick Fix**:
- Verify `base_url` in `config.yml` points to your OAuth proxy
- Check GitHub OAuth callback URL matches Worker URL
- Test Worker: `curl https://your-worker.workers.dev/health`

**Load `references/error-catalog.md` → Error #1 for complete solution**

### 2. ❌ Content Not Listing in CMS

**Error**: "No entries found"

**Quick Fix**:
- Verify `folder` path matches actual file location
- Match `format` to actual file format (yaml vs toml)
- Check file extensions match config

**Load `references/error-catalog.md` → Error #4 for complete solution**

### 3. ❌ CORS / COOP Policy Errors

**Error**: "Authentication Aborted" / OAuth popup closes

**Quick Fix**:
- Set `Cross-Origin-Opener-Policy: same-origin-allow-popups` in headers
- Add OAuth proxy to CSP `connect-src`

**Load `references/error-catalog.md` → Error #8 for complete solution**

---

## When to Load References

**Load `references/framework-setup.md` when**:
- User needs framework-specific setup (Hugo, Jekyll, 11ty, Astro, etc.)
- Setting up new Sveltia CMS installation
- Troubleshooting framework-specific admin directory issues

**Load `references/authentication-guide.md` when**:
- Setting up GitHub OAuth authentication
- Deploying Cloudflare Workers OAuth proxy
- Troubleshooting authentication errors
- User asks about `base_url` configuration

**Load `references/configuration-guide.md` when**:
- User needs complete `config.yml` examples
- Setting up collections, fields, or widgets
- Configuring media uploads, i18n, or workflows
- User asks about specific configuration options

**Load `references/error-catalog.md` when**:
- User encounters any errors during setup
- Troubleshooting authentication, parsing, or deployment issues
- User reports errors beyond the top 3 shown above

**Load `references/deployment-guide.md` when**:
- Deploying to Cloudflare Pages, Netlify, or Vercel
- Setting up OAuth proxy deployment
- Troubleshooting production deployment issues

**Load `references/migration-from-decap.md` when**:
- Migrating from Decap CMS / Netlify CMS
- User asks about compatibility or migration steps

---

## Package Information

**Current Version**: @sveltia/cms@0.113.5 (October 2025)

**Official Resources**:
- Documentation: https://github.com/sveltia/sveltia-cms
- GitHub: https://github.com/sveltia/sveltia-cms
- Blog: https://blog.sveltia.com

**Production Example**:
- Hugo blog: 500+ posts, 3 editors
- Jekyll docs site: GitHub Pages deployment
- 11ty marketing site: Cloudflare Pages
- Astro portfolio: Vercel deployment
- Build time: <5 minutes (initial setup)
- Errors prevented: 8/8 (100%)

---

## Complete Setup Checklist

- [ ] Framework chosen (Hugo, Jekyll, 11ty, Astro, etc.)
- [ ] Admin directory created in correct public folder
- [ ] `admin/index.html` with correct script tag
- [ ] `admin/config.yml` created with backend configuration
- [ ] GitHub OAuth App created (if not using direct auth)
- [ ] OAuth proxy deployed (Cloudflare Workers recommended)
- [ ] `base_url` set in config pointing to OAuth proxy
- [ ] Collections defined matching actual content structure
- [ ] Media folder paths configured correctly
- [ ] Tested locally (visit `/admin/` route)
- [ ] Authentication tested (GitHub login works)
- [ ] Content listing verified
- [ ] Create/edit/save tested
- [ ] Image uploads tested
- [ ] Deployed to production
- [ ] COOP headers configured (`same-origin-allow-popups`)

---

**Questions? Issues?**

1. Check `references/error-catalog.md` for all 8 errors with complete solutions
2. Review `references/framework-setup.md` for framework-specific setup
3. See `references/authentication-guide.md` for OAuth configuration
4. Check official docs: https://github.com/sveltia/sveltia-cms

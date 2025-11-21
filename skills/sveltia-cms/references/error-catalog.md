# Sveltia CMS Error Catalog

Complete troubleshooting guide for all 8 common Sveltia CMS errors.

**Last Updated**: 2025-10-24

---

## Error #1: OAuth Authentication Failures

**Error Messages:**
- "Error: Failed to authenticate"
- Redirect to `https://api.netlify.com/auth` instead of GitHub login

**Symptoms:**
- Login button does nothing
- Redirects to wrong domain
- Authentication popup closes immediately

**Causes:**
- Missing `base_url` in backend config
- Incorrect OAuth proxy URL
- CORS policy blocking authentication
- Wrong GitHub OAuth callback URL

**Solution:**

### Step 1: Verify config.yml has `base_url`
```yaml
backend:
  name: github
  repo: owner/repo
  branch: main
  base_url: https://your-worker.workers.dev  # ← Must be present
```

### Step 2: Check GitHub OAuth App callback
- Should be: `https://your-worker.workers.dev/callback`
- NOT: `https://yourdomain.com/callback`

### Step 3: Verify Worker environment variables
```bash
bunx wrangler secret list
# Should show: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

### Step 4: Test Worker directly
```bash
curl https://your-worker.workers.dev/health
# Should return: {"status": "ok"}
```

**Prevention:**
- Always include `base_url` when not using GitHub direct auth
- Test OAuth flow in incognito window
- Check browser console for CORS errors

---

## Error #2: TOML Front Matter Errors

**Error Messages:**
- "Parse error: Invalid TOML"
- Files missing `+++` delimiters
- Body content appearing in frontmatter

**Symptoms:**
- New files created by CMS don't parse in Hugo
- Existing TOML files break after editing
- Content appears above body separator

**Causes:**
- Sveltia's TOML generation is buggy in beta
- Incomplete TOML delimiter handling
- Mixed TOML/YAML in same collection

**Solution:**

### Use YAML instead of TOML (recommended)
```yaml
collections:
  - name: posts
    folder: content/posts
    format: yaml  # or md (Markdown with YAML frontmatter)
    # NOT: format: toml
```

### If you must use TOML:
1. Manually fix delimiters after CMS saves
2. Use pre-commit hook to validate TOML
3. Wait for beta fixes (track GitHub issues)

### Migration from TOML to YAML
```bash
# Convert all posts from TOML to YAML
for file in content/posts/*.md; do
  # Use Hugo's built-in converter
  hugo convert toYAML "$file"
done
```

**Prevention:**
- Prefer YAML format for new projects
- If Hugo requires TOML, test CMS thoroughly before production
- Keep watch on Sveltia GitHub releases for TOML fixes

---

## Error #3: YAML Parse Errors

**Error Messages:**
- "YAML parse error: Invalid YAML"
- "Error: Duplicate key 'field_name'"
- "Unexpected character at position X"

**Symptoms:**
- Existing posts won't load in CMS
- Can't save changes to content
- CMS shows empty fields

**Causes:**
- Sveltia is stricter than Hugo/Jekyll about YAML formatting
- Multiple YAML documents in one file (---\n---\n---)
- Incorrect indentation or special characters
- Smart quotes from copy-paste

**Solution:**

### Step 1: Validate YAML
```bash
# Install yamllint
pip install yamllint

# Check all content files
find content -name "*.md" -exec yamllint {} \;
```

### Step 2: Common fixes

**Problem**: Multiple documents in one file
```yaml
---
title: Post 1
---
---  # ← Remove this extra separator
title: Post 2
---
```

**Problem**: Incorrect indentation
```yaml
# ❌ Bad - inconsistent indentation
fields:
  - name: title
     label: Title  # Extra space
  - name: date
    label: Date

# ✅ Good - consistent 2-space indentation
fields:
  - name: title
    label: Title
  - name: date
    label: Date
```

**Problem**: Smart quotes
```yaml
# ❌ Bad - smart quotes from copy-paste
title: "Hello World"  # Curly quotes

# ✅ Good - straight quotes
title: "Hello World"  # Straight quotes
```

### Step 3: Auto-fix with yamlfmt
```bash
# Install
go install github.com/google/yamlfmt/cmd/yamlfmt@latest

# Fix all files
find content -name "*.md" -exec yamlfmt {} \;
```

**Prevention:**
- Use YAML-aware editors (VS Code with YAML extension)
- Enable YAML schema validation
- Run yamllint in pre-commit hooks

---

## Error #4: Content Not Listing in CMS

**Error Messages:**
- "No entries found"
- Empty content list
- "Failed to load entries"

**Symptoms:**
- Admin loads but shows no content
- Collections appear empty
- Files exist in repository but CMS doesn't see them

**Causes:**
- Format mismatch (config expects TOML, files are YAML)
- Incorrect folder path
- File extension doesn't match format
- Git backend not connected

**Solution:**

### Step 1: Verify folder path matches actual files
```yaml
# Config says:
collections:
  - name: posts
    folder: content/posts  # Expects files here

# Check actual location:
ls -la content/posts  # Files must exist here
```

### Step 2: Match format to actual files
```yaml
# If files are: content/posts/hello.md with YAML frontmatter
collections:
  - name: posts
    folder: content/posts
    format: yaml  # or md (same as yaml for .md files)

# If files are: content/posts/hello.toml
collections:
  - name: posts
    folder: content/posts
    format: toml
    extension: toml
```

### Step 3: Check file extensions
```bash
# Config expects .md files
ls content/posts/*.md  # Should show files

# If files have different extension:
# Either rename files OR set extension in config
```

### Step 4: Verify Git backend connection
```yaml
backend:
  name: github
  repo: owner/repo  # Must be correct owner/repo
  branch: main      # Must be correct branch
```

**Prevention:**
- Keep `folder` paths relative to repository root
- Match `format` to actual file format
- Test with one file first before creating collection

---

## Error #5: "SVELTIA is not defined" Error

**Error Messages:**
- Console error: `Uncaught ReferenceError: SVELTIA is not defined`
- Blank admin page
- Admin page stuck loading

**Symptoms:**
- Admin page loads but shows white screen
- Browser console shows JavaScript error
- CMS never initializes

**Causes:**
- Incorrect script tag
- CDN failure or blocked
- Wrong script URL
- Missing `type="module"` attribute

**Solution:**

### Step 1: Use correct script tag
```html
<!-- ✅ Correct -->
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>

<!-- ❌ Wrong - missing type="module" -->
<script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>

<!-- ❌ Wrong - incorrect path -->
<script src="https://unpkg.com/sveltia-cms/dist/sveltia-cms.js" type="module"></script>
```

### Step 2: Verify CDN is accessible
```bash
# Test CDN URL
curl -I https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js
# Should return: 200 OK
```

### Step 3: Use version pinning (optional but recommended)
```html
<!-- Pin to specific version for stability -->
<script src="https://unpkg.com/@sveltia/cms@0.113.3/dist/sveltia-cms.js" type="module"></script>
```

### Step 4: Check for CSP blocking
```html
<!-- If you have Content Security Policy, add: -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://unpkg.com;
  connect-src 'self' https://api.github.com https://your-worker.workers.dev;
">
```

**Prevention:**
- Copy-paste official script tag from Sveltia docs
- Pin to specific version in production
- Test admin page in different browsers

---

## Error #6: 404 on /admin

**Error Messages:**
- "404 Not Found" when visiting `/admin/`
- Admin page doesn't exist

**Symptoms:**
- Site loads but `/admin/` returns 404
- Works locally but not in production
- Files exist but aren't served

**Causes:**
- Admin directory not in public/static folder
- Admin files not deployed
- Incorrect build configuration
- Framework not copying admin files

**Solution:**

### Step 1: Verify admin directory location

| Framework | Correct Location |
|-----------|------------------|
| Hugo | `static/admin/` |
| Jekyll | `admin/` |
| 11ty | `admin/` (with passthrough copy) |
| Astro | `public/admin/` |
| Next.js | `public/admin/` |
| Gatsby | `static/admin/` |

### Step 2: Check files exist
```bash
ls -la static/admin/  # Hugo example
# Should show: index.html, config.yml
```

### Step 3: Framework-specific fixes

**Hugo**: Files in `static/` are automatically copied

**Jekyll**: Add to `_config.yml`:
```yaml
include:
  - admin
```

**11ty**: Add to `.eleventy.js`:
```javascript
module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('admin');
};
```

**Astro**: Files in `public/` are automatically copied

### Step 4: Verify deployment
```bash
# After build, check output directory
ls -la public/admin/  # or _site/admin/ or dist/admin/
```

**Prevention:**
- Test admin page access before deploying
- Add admin directory to version control
- Document admin path in project README

---

## Error #7: Images Not Uploading (HEIC Format)

**Error Messages:**
- "Unsupported file format"
- "Failed to upload image"
- Image appears but doesn't save

**Symptoms:**
- iPhone photos won't upload
- HEIC files rejected
- Only JPEG/PNG work

**Causes:**
- HEIC format not supported by browsers
- Image too large (exceeds `max_file_size`)
- Media folder path incorrect

**Solution:**

### Step 1: Convert HEIC to JPEG

**On Mac:**
```bash
# Convert single file
sips -s format jpeg image.heic --out image.jpg

# Batch convert
for f in *.heic; do sips -s format jpeg "$f" --out "${f%.heic}.jpg"; done
```

**On iPhone:**
- Settings > Camera > Formats > Most Compatible
- This saves photos as JPEG instead of HEIC

**Or use online converter**: https://heic.to/

### Step 2: Enable image optimization to auto-convert
```yaml
# admin/config.yml
media_libraries:
  default:
    config:
      max_file_size: 10485760  # 10 MB
      transformations:
        raster_image:
          format: webp  # Auto-converts to WebP
          quality: 85
          width: 2048
          height: 2048
```

### Step 3: Increase max file size if needed
```yaml
media_libraries:
  default:
    config:
      max_file_size: 10485760  # 10 MB in bytes
      # Default is often 5 MB
```

**Prevention:**
- Document image requirements for content editors
- Enable auto-optimization in config
- Set reasonable max_file_size (5-10 MB)

---

## Error #8: CORS / COOP Policy Errors

**Error Messages:**
- "Authentication Aborted"
- "Cross-Origin-Opener-Policy blocked"
- Authentication popup closes immediately

**Symptoms:**
- OAuth popup opens then closes
- Can't complete GitHub login
- Console shows COOP error

**Causes:**
- Strict `Cross-Origin-Opener-Policy` header
- CORS headers blocking authentication
- CSP blocking script execution

**Solution:**

### Step 1: Adjust COOP header

**Cloudflare Pages** (_headers file):
```
/*
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  # NOT: same-origin (this breaks OAuth)
```

**Netlify** (_headers file):
```
/*
  Cross-Origin-Opener-Policy: same-origin-allow-popups
```

**Vercel** (vercel.json):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        }
      ]
    }
  ]
}
```

### Step 2: Add OAuth proxy to CSP
```html
<meta http-equiv="Content-Security-Policy" content="
  connect-src 'self' https://api.github.com https://your-worker.workers.dev;
">
```

### Step 3: For Cloudflare Pages, allow API access
```yaml
# admin/config.yml (if using Cloudflare Pages webhooks)
# Add to CSP: https://api.cloudflare.com
```

**Prevention:**
- Set COOP header to `same-origin-allow-popups` by default
- Test authentication in different browsers
- Document required headers in project README

---

## Quick Reference

| Error | Priority | Most Common Cause |
|-------|----------|-------------------|
| OAuth Failures | High | Missing `base_url` |
| TOML Errors | Medium | Use YAML instead |
| YAML Parse | Medium | Indentation issues |
| Content Not Listing | High | Wrong folder path |
| SVELTIA Undefined | Low | Missing `type="module"` |
| 404 on /admin | High | Wrong directory location |
| HEIC Upload | Low | Convert to JPEG |
| CORS/COOP | Medium | Wrong COOP header |

---

**Still stuck?** Check official docs: https://github.com/sveltia/sveltia-cms/issues

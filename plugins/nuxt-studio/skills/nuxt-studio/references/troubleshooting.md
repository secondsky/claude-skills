# Troubleshooting Nuxt Studio

Comprehensive error catalog and solutions for common Nuxt Studio issues.

## Table of Contents

1. [Installation Errors](#installation-errors)
2. [OAuth Authentication Errors](#oauth-authentication-errors)
3. [Cloudflare Deployment Errors](#cloudflare-deployment-errors)
4. [Editor Issues](#editor-issues)
5. [Content Editing Issues](#content-editing-issues)
6. [Git Integration Issues](#git-integration-issues)
7. [Performance Issues](#performance-issues)
8. [Configuration Errors](#configuration-errors)

---

## Installation Errors

### Error: Module not found: '@nuxt/studio'

**Symptom**: Build fails with "Cannot find module '@nuxt/studio'"

**Cause**: Studio module not installed or installed incorrectly

**Solution**:
```bash
# Install using nuxi (recommended)
npx nuxi module add nuxt-studio@beta

# Or manually
npm install -D nuxt-studio@beta

# Verify in package.json
grep "nuxt-studio" package.json
```

**Verify** `nuxt.config.ts` includes:
```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/studio']
})
```

---

### Error: '@nuxt/content' is required

**Symptom**: "Nuxt Studio requires @nuxt/content to be installed"

**Cause**: Nuxt Content module missing (required dependency)

**Solution**:
```bash
# Install Nuxt Content first
npx nuxi module add content

# Then install Studio
npx nuxi module add nuxt-studio@beta

# Verify both in nuxt.config.ts
# Order matters: content before studio
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',  // Must be first
    '@nuxt/studio'
  ]
})
```

---

### Error: Nuxt version incompatibility

**Symptom**: "Studio requires Nuxt >=3.0.0"

**Cause**: Using Nuxt 2.x or outdated Nuxt 3

**Solution**:
```bash
# Check current Nuxt version
npm list nuxt

# Upgrade to Nuxt 3.x
npm install nuxt@latest

# Or use Nuxt 4 (recommended)
npm install nuxt@rc
```

**Migration**: If upgrading from Nuxt 2, follow https://nuxt.com/docs/migration/overview

---

## OAuth Authentication Errors

### Error: OAuth redirect_uri_mismatch

**Symptom**: OAuth login redirects to error page: "The redirect_uri in the request does not match the ones authorized for the OAuth client"

**Cause**: OAuth app callback URL doesn't match deployment URL

**Solution**:

1. **Check deployed Studio URL**:
   ```bash
   # Should match OAuth callback URL exactly
   https://studio.yourdomain.com
   ```

2. **Update OAuth app** (example for GitHub):
   - Go to https://github.com/settings/developers
   - Select your OAuth app
   - Update "Authorization callback URL":
     ```
     https://studio.yourdomain.com/api/auth/callback/github
     ```
   - Save changes

3. **Common mistakes**:
   ```
   ❌ http://studio.yourdomain.com/...  (HTTP instead of HTTPS)
   ❌ https://yourdomain.com/api/auth/...  (Wrong subdomain)
   ❌ https://studio.yourdomain.com/api/auth/callback/Github  (Capital G)
   ✅ https://studio.yourdomain.com/api/auth/callback/github
   ```

4. **For multiple environments**, create separate OAuth apps:
   - Production: `https://studio.yourdomain.com/api/auth/callback/github`
   - Preview: `https://preview.yourdomain.com/api/auth/callback/github`
   - Local: `http://localhost:3000/api/auth/callback/github`

---

### Error: Authentication loop (redirect loop)

**Symptom**: After OAuth login, continuously redirects back to login page

**Cause**: Session cookies not persisting

**Solutions**:

1. **Check environment variables**:
   ```bash
   # Must match deployment URL exactly
   NUXT_PUBLIC_STUDIO_URL=https://studio.yourdomain.com
   ```

2. **Verify HTTPS is used** (not HTTP):
   - OAuth cookies require `secure` flag
   - Only works over HTTPS in production

3. **Check browser cookie settings**:
   - Allow cookies for studio.yourdomain.com
   - Allow third-party cookies (for OAuth flow)
   - Try in incognito mode to rule out extensions

4. **Verify Cloudflare SSL mode**:
   ```
   ❌ Flexible (causes loops)
   ✅ Full or Full (strict)
   ```

5. **Clear browser cookies and retry**:
   ```bash
   # Clear cookies for studio.yourdomain.com
   # Then try authentication again
   ```

---

### Error: invalid_client

**Symptom**: OAuth error "invalid_client" or "unauthorized_client"

**Cause**: Client ID or secret incorrect or missing

**Solution**:

1. **Verify environment variables**:
   ```bash
   # Check in Cloudflare dashboard or .env
   NUXT_OAUTH_GITHUB_CLIENT_ID=your_client_id_here
   NUXT_OAUTH_GITHUB_CLIENT_SECRET=your_secret_here
   ```

2. **Regenerate OAuth credentials** if lost:
   - GitHub: Settings → Developer settings → OAuth Apps → Generate new secret
   - Copy new secret immediately (shown only once)
   - Update environment variable

3. **Check for typos**:
   - Client ID should be exactly as shown in OAuth app
   - No extra spaces or characters

4. **Redeploy** after updating variables:
   ```bash
   # Cloudflare Pages: Push to Git to trigger deployment
   git commit --allow-empty -m "Redeploy with updated OAuth credentials"
   git push
   ```

---

### Error: access_denied

**Symptom**: OAuth login fails with "access_denied" error

**Cause**: User denied authorization or app lacks required permissions

**Solutions**:

1. **Check OAuth scopes** (GitHub example):
   ```typescript
   // Ensure app has required scopes
   // For Studio: read_user, repo (or public_repo for public repos only)
   ```

2. **Re-authorize application**:
   - Revoke access in GitHub/GitLab/Google settings
   - Try logging in again
   - Grant all requested permissions

3. **For GitHub**, check app is approved:
   - Go to OAuth app settings
   - Ensure "User authorization callback URL" is set
   - App should not be in "suspended" state

4. **For Google**, verify consent screen:
   - OAuth consent screen must be published (not in testing mode for production)
   - User must be within allowed user group (if restricted)

---

## Cloudflare Deployment Errors

### Error: Build fails on Cloudflare Pages

**Symptom**: Build succeeds locally but fails on Cloudflare

**Causes** and **Solutions**:

1. **Wrong Node version**:
   ```bash
   # Set environment variable in Cloudflare Pages
   NODE_VERSION=18
   ```

2. **Missing dependencies**:
   ```bash
   # Ensure all dependencies in package.json
   npm install
   # Check package.json for missing deps
   ```

3. **Wrong build output directory**:
   ```
   # Should be set to:
   .output/public

   # NOT:
   dist/ or .nuxt/ or build/
   ```

4. **Nitro preset not configured**:
   ```typescript
   // nuxt.config.ts
   export default defineNuxtConfig({
     nitro: {
       preset: 'cloudflare-pages'  // Required!
     }
   })
   ```

5. **Build command incorrect**:
   ```bash
   # Should be:
   npm run build

   # Or if using Bun:
   bun run build
   ```

---

### Error: Incompatible module warnings

**Symptom**: "Module X may not be compatible with Cloudflare runtime"

**Cause**: Module uses Node.js-specific APIs not available in Workers/Pages

**Solutions**:

1. **Check module compatibility** with Cloudflare:
   - Search for "cloudflare" compatibility in module docs
   - Look for "edge runtime" or "edge compatible"

2. **Use edge-compatible alternatives**:
   ```
   ❌ bcrypt → ✅ bcrypt-edge
   ❌ fs module → ✅ R2 or KV storage
   ❌ child_process → ✅ Cloudflare Workers (no subprocess support)
   ```

3. **Exclude incompatible modules** from edge build:
   ```typescript
   export default defineNuxtConfig({
     nitro: {
       externals: {
         inline: ['incompatible-module']
       }
     }
   })
   ```

---

### Error: 404 on custom subdomain

**Symptom**: Main site works but `studio.domain.com` returns 404

**Solutions**:

1. **Verify DNS record**:
   ```bash
   dig studio.yourdomain.com
   # Should show CNAME to *.pages.dev
   ```

2. **Check custom domain added** in Cloudflare Pages:
   - Workers & Pages → Project → Custom domains
   - Should show `studio.yourdomain.com` as "Active"

3. **Wait for DNS propagation**:
   ```bash
   # Check propagation globally
   # https://www.whatsmydns.net
   ```

4. **Verify routing configuration** (for Workers):
   ```toml
   # wrangler.toml
   routes = [
     { pattern = "studio.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```

---

## Editor Issues

### Error: Editor shows blank screen

**Symptom**: Studio loads but editor area is blank/white

**Solutions**:

1. **Check browser console** for errors:
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Common: Module loading failures

2. **Clear browser cache**:
   ```bash
   # Hard refresh:
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (macOS)
   ```

3. **Verify content directory exists**:
   ```bash
   # Should have content/ directory with files
   ls -la content/
   ```

4. **Check Nuxt Content configuration**:
   ```typescript
   export default defineNuxtConfig({
     content: {
       // Should have basic config
     }
   })
   ```

5. **Try different browser**:
   - Test in Chrome, Firefox, Safari
   - Rules out browser-specific issues

---

### Error: Monaco editor not loading

**Symptom**: Monaco editor requested but TipTap loads instead

**Cause**: Monaco configuration issue or user preference

**Solutions**:

1. **Clear user preferences**:
   ```javascript
   // In browser console
   localStorage.clear()
   // Reload page
   ```

2. **Check editor configuration**:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       editor: {
         default: 'monaco',  // Explicitly set
         available: ['monaco', 'tiptap']
       }
     }
   })
   ```

3. **Verify Monaco not disabled**:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       editor: {
         available: ['monaco']  // Ensure Monaco in list
       }
     }
   })
   ```

---

### Error: TipTap toolbar missing

**Symptom**: TipTap editor loads but toolbar is not visible

**Solutions**:

1. **Check toolbar configuration**:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       editor: {
         tiptap: {
           toolbar: {
             enabled: true  // Must be true
           }
         }
       }
     }
   })
   ```

2. **Inspect element**:
   - Open DevTools
   - Check if toolbar exists but hidden (CSS issue)
   - Look for `display: none` or `visibility: hidden`

3. **Clear CSS cache**:
   - Hard refresh browser
   - Check for conflicting CSS from custom styles

---

## Content Editing Issues

### Error: Changes not saving

**Symptom**: Edit content but changes don't persist

**Solutions**:

1. **Check Git integration**:
   - Studio requires Git for persistence
   - Ensure `.git` directory exists

2. **Verify write permissions**:
   - User must have write access to repository
   - Check GitHub/GitLab repository permissions

3. **Check browser console**:
   - Look for save errors
   - Check network tab for failed API calls

4. **Verify OAuth scopes**:
   - GitHub: Must have `repo` scope (or `public_repo` for public repos)
   - GitLab: Must have `write_repository` scope

5. **Test manual Git commit**:
   ```bash
   # Try committing directly
   git add content/
   git commit -m "Test commit"
   git push

   # If fails, check Git configuration
   ```

---

### Error: MDC components not rendering

**Symptom**: MDC syntax shows as plain text instead of components

**Cause**: Client DB or component registration not configured

**Solutions**:

1. **Enable client DB**:
   ```typescript
   export default defineNuxtConfig({
     content: {
       experimental: {
         clientDB: true  // Required for MDC in Studio
       }
     }
   })
   ```

2. **Register MDC components**:
   ```typescript
   export default defineNuxtConfig({
     components: {
       dirs: [
         '~/components/content'  // MDC components directory
       ]
     }
   })
   ```

3. **Verify component exists**:
   ```bash
   # Check component file exists
   ls components/content/Alert.vue
   ```

4. **Check component naming**:
   ```
   ❌ ::alert → Component: alert.vue (lowercase doesn't auto-detect)
   ✅ ::Alert → Component: Alert.vue (PascalCase)
   ✅ ::alert → Component: Alert.vue + explicit registration
   ```

---

## Git Integration Issues

### Error: Unable to commit changes

**Symptom**: "Failed to commit changes" error in Studio

**Solutions**:

1. **Check repository permissions**:
   - User must have write access
   - For GitHub: Check Settings → Collaborators
   - For GitLab: Check Members → Add member with Developer+ role

2. **Verify OAuth token has correct scopes**:
   ```bash
   # GitHub: Must have 'repo' scope
   # GitLab: Must have 'write_repository' scope
   ```

3. **Check Git configuration**:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       git: {
         enabled: true,
         author: {
           name: 'Studio CMS',
           email: 'studio@yourdomain.com'
         }
       }
     }
   })
   ```

4. **Check branch protection rules**:
   - GitHub: Settings → Branches → Branch protection rules
   - May prevent direct commits to main
   - Solution: Allow Studio OAuth app to bypass rules or use different branch

---

### Error: Merge conflicts

**Symptom**: "Merge conflict detected" when trying to save

**Cause**: Content changed externally while editing in Studio

**Solutions**:

1. **Pull latest changes**:
   - Refresh Studio page to get latest content
   - Re-apply your edits

2. **Use different branches** for Studio edits:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       git: {
         branch: 'studio-edits'  // Separate branch
       }
     }
   })
   ```

3. **Implement conflict resolution**:
   - Fetch latest from main
   - Merge or rebase studio branch
   - Resolve conflicts manually in Git

---

## Performance Issues

### Issue: Slow editor loading

**Symptom**: Studio takes >10 seconds to load editor

**Solutions**:

1. **Reduce content size**:
   - Split large markdown files
   - Optimize images (use WebP, compress)
   - Archive old content

2. **Optimize editor config**:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       editor: {
         monaco: {
           minimap: { enabled: false },  // Disable minimap
           folding: false  // Disable code folding
         }
       }
     }
   })
   ```

3. **Enable caching**:
   - Use Cloudflare caching for static assets
   - Enable browser caching

4. **Check network**:
   - Slow connection can delay loading
   - Test on different network

---

### Issue: Laggy typing in editor

**Symptom**: Delay between typing and characters appearing

**Solutions**:

1. **Reduce file size**:
   - Files >5000 lines may cause lag
   - Split into smaller files

2. **Disable syntax highlighting** for very large files:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       editor: {
         monaco: {
           renderWhitespace: 'none',
           folding: false
         }
       }
     }
   })
   ```

3. **Check CPU usage**:
   - Close other browser tabs
   - Check for CPU-intensive browser extensions

---

## Configuration Errors

### Error: Invalid configuration in nuxt.config.ts

**Symptom**: Build fails with "Invalid Studio configuration"

**Solutions**:

1. **Validate configuration structure**:
   ```typescript
   export default defineNuxtConfig({
     modules: ['@nuxt/content', '@nuxt/studio'],

     studio: {
       // Valid options only
       editor: {
         default: 'tiptap'  // Must be 'tiptap' | 'monaco' | 'form'
       }
     }
   })
   ```

2. **Check for typos**:
   ```
   ❌ stuido: { ... }
   ✅ studio: { ... }

   ❌ editr: { ... }
   ✅ editor: { ... }
   ```

3. **Refer to schema**:
   - Check Studio docs for valid options
   - Use TypeScript for autocomplete

---

### Error: Environment variables not loading

**Symptom**: OAuth variables undefined at runtime

**Solutions**:

1. **Check variable names**:
   ```bash
   # Must start with NUXT_
   ✅ NUXT_OAUTH_GITHUB_CLIENT_ID
   ❌ OAUTH_GITHUB_CLIENT_ID
   ```

2. **Verify variables set in correct environment**:
   - Cloudflare Pages: Check Production vs Preview
   - Local: Check `.env` file exists and correct

3. **Restart server** after adding variables:
   ```bash
   # Kill dev server and restart
   npm run dev
   ```

4. **For Cloudflare Pages**, redeploy after adding variables:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

---

## Getting Help

If none of these solutions work:

1. **Check Studio GitHub Issues**:
   - https://github.com/nuxt-content/studio/issues
   - Search for similar problems

2. **Enable debug mode**:
   ```typescript
   export default defineNuxtConfig({
     studio: {
       debug: true
     }
   })
   ```

3. **Collect diagnostics**:
   - Browser console errors
   - Network tab errors
   - Server logs
   - Build logs from Cloudflare

4. **Create minimal reproduction**:
   - Fresh Nuxt project
   - Minimal Studio setup
   - Reproduce the issue

5. **Open GitHub issue** with:
   - Nuxt version
   - Studio version
   - Steps to reproduce
   - Error logs
   - Minimal reproduction repository

---

## Preventive Measures

### Before Deployment

- [ ] Test OAuth authentication locally
- [ ] Verify all environment variables set
- [ ] Test content editing and Git commits
- [ ] Check subdomain DNS configuration
- [ ] Validate SSL certificate
- [ ] Test in multiple browsers

### Regular Maintenance

- [ ] Monitor OAuth token expiration
- [ ] Check for Studio updates monthly
- [ ] Review error logs weekly
- [ ] Test backup and restore procedures
- [ ] Document known issues and workarounds

### Documentation

- [ ] Document deployment process
- [ ] Create troubleshooting guide for team
- [ ] Keep OAuth credentials secure and backed up
- [ ] Maintain list of team members with access
- [ ] Document custom configurations

---

**Note**: This troubleshooting guide covers most common issues. For platform-specific errors or advanced configurations, consult the official Nuxt Studio documentation and Cloudflare Pages documentation.

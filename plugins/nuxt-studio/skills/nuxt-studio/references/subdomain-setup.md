# Subdomain Setup for Nuxt Studio

Complete guide for configuring custom subdomains (studio.domain.com, cms.domain.com) for Nuxt Studio deployments.

## Overview

Deploying Studio to a subdomain provides:
- Clean separation between main site and CMS
- Professional appearance for content editors
- Easy OAuth callback URL configuration
- Better security isolation

Common subdomain patterns:
- `studio.yourdomain.com`
- `cms.yourdomain.com`
- `edit.yourdomain.com`
- `admin.yourdomain.com`

## DNS Configuration

### Option 1: Domain on Cloudflare DNS

If your domain uses Cloudflare nameservers:

1. **Cloudflare Pages automatically creates DNS record**:
   - Go to Pages project → **Custom domains**
   - Click **"Set up a custom domain"**
   - Enter: `studio.yourdomain.com`
   - Cloudflare creates CNAME record automatically

2. **DNS Record Created**:
   ```
   Type: CNAME
   Name: studio
   Target: your-project.pages.dev
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

3. **Verify DNS**:
   ```bash
   dig studio.yourdomain.com
   # or
   nslookup studio.yourdomain.com
   ```

### Option 2: Domain on External DNS Provider

If your domain is managed elsewhere (GoDaddy, Namecheap, etc.):

1. **Add CNAME record** in your DNS provider:
   - **Type**: CNAME
   - **Name**: `studio` (or `@studio` depending on provider)
   - **Target/Value**: `your-project.pages.dev`
   - **TTL**: 3600 (or Auto)

2. **Wait for DNS propagation**:
   - Usually 5-30 minutes
   - Can take up to 48 hours in rare cases

3. **Verify propagation**:
   ```bash
   dig studio.yourdomain.com
   # Should show CNAME pointing to *.pages.dev
   ```

### Option 3: Cloudflare as DNS Proxy (Recommended)

Use Cloudflare for DNS even if not hosting there:

1. **Change nameservers** to Cloudflare:
   - Sign up at cloudflare.com
   - Add domain
   - Update nameservers at your registrar
   - Wait for nameserver propagation (24-48 hours)

2. **Add CNAME record** in Cloudflare DNS:
   - **Type**: CNAME
   - **Name**: studio
   - **Target**: your-project.pages.dev
   - **Proxy status**: Proxied (orange cloud) - enables Cloudflare features
   - **TTL**: Auto

3. **Benefits**:
   - Free SSL/TLS certificates
   - DDoS protection
   - Caching and CDN
   - Analytics

---

## SSL/TLS Configuration

### Cloudflare SSL

Cloudflare provides automatic SSL for subdomains:

1. **SSL/TLS Mode**:
   - Go to **SSL/TLS** → **Overview**
   - Set to **"Full"** or **"Full (strict)"** (recommended)
   - Universal SSL covers subdomain automatically

2. **Force HTTPS**:
   - **SSL/TLS** → **Edge Certificates**
   - Enable **"Always Use HTTPS"**
   - Redirects HTTP to HTTPS automatically

3. **HSTS (Optional but recommended)**:
   - **SSL/TLS** → **Edge Certificates**
   - Enable **"HTTP Strict Transport Security (HSTS)"**
   - Max Age: 12 months (recommended)

### Custom SSL Certificate (Advanced)

For custom SSL certificates:

1. **Upload certificate**:
   - **SSL/TLS** → **Edge Certificates** → **Upload Custom SSL**
   - Provide certificate, private key, and chain

2. **Configure for subdomain**:
   - Ensure certificate includes subdomain in SAN (Subject Alternative Names)
   - Example: `*.yourdomain.com` or `studio.yourdomain.com`

---

## Cloudflare Pages Custom Domain Setup

### Add Custom Domain

1. **Navigate to Pages project**:
   - **Workers & Pages** → Select your Studio project
   - Click **Custom domains** tab

2. **Set up custom domain**:
   - Click **"Set up a custom domain"**
   - Enter subdomain: `studio.yourdomain.com`
   - Click **"Continue"**

3. **DNS Configuration**:
   - If domain on Cloudflare DNS: Automatically configured
   - If external DNS: Follow instructions to add CNAME record

4. **Verify domain**:
   - Status shows **"Active"** when ready
   - Usually takes 5-15 minutes

### Multiple Subdomains

Add multiple subdomains to same project:

```
studio.yourdomain.com  → Production
staging.yourdomain.com → Staging
preview.yourdomain.com → Preview builds
```

Each subdomain can point to different branch or environment.

---

## Cloudflare Workers Custom Routes

For Workers deployment (not Pages), configure routes:

### Via wrangler.toml

```toml
# wrangler.toml
name = "studio-cms"
main = "./.output/server/index.mjs"

routes = [
  { pattern = "studio.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Via Dashboard

1. **Workers & Pages** → Select Worker → **Routes**
2. Click **"Add route"**
3. Configure:
   - **Route**: `studio.yourdomain.com/*`
   - **Zone**: Select `yourdomain.com`
   - **Worker**: Select your Studio worker
4. Click **"Save"**

### Wildcard Routes

For preview branches:

```toml
routes = [
  { pattern = "*.studio.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

This enables `main.studio.yourdomain.com`, `dev.studio.yourdomain.com`, etc.

---

## OAuth Callback URL Configuration

After subdomain is configured, update OAuth apps:

### GitHub OAuth

1. Go to OAuth app settings
2. Update **"Authorization callback URL"**:
   ```
   https://studio.yourdomain.com/api/auth/callback/github
   ```

### GitLab OAuth

1. Go to OAuth application settings
2. Update **"Redirect URI"**:
   ```
   https://studio.yourdomain.com/api/auth/callback/gitlab
   ```

### Google OAuth

1. Go to Google Cloud Console → OAuth client
2. Update **"Authorized redirect URIs"**:
   ```
   https://studio.yourdomain.com/api/auth/callback/google
   ```

### Testing Callbacks

Test OAuth callbacks with:

```bash
curl -I https://studio.yourdomain.com/api/auth/callback/github
# Should return 405 Method Not Allowed (expected - needs POST)
```

If returns 404, check deployment and routing configuration.

---

## Environment Variables for Subdomain

Set Studio URL environment variable:

### Cloudflare Pages

1. **Workers & Pages** → Project → **Settings** → **Environment variables**
2. Add variable:
   - **Name**: `NUXT_PUBLIC_STUDIO_URL`
   - **Value**: `https://studio.yourdomain.com`
   - **Environment**: Production

### Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      studioUrl: process.env.NUXT_PUBLIC_STUDIO_URL || 'http://localhost:3000'
    }
  }
})
```

---

## Subdomain Routing Patterns

### Single Subdomain

Most common: One subdomain for Studio

```
Main site: https://yourdomain.com
Studio CMS: https://studio.yourdomain.com
```

### Multi-Environment Subdomains

Separate subdomains for each environment:

```
Production:  https://studio.yourdomain.com
Staging:     https://studio-staging.yourdomain.com
Development: https://studio-dev.yourdomain.com
```

### Branch-Based Subdomains

Cloudflare Pages automatic preview deployments:

```
Main:        https://studio.yourdomain.com
PR #123:     https://123.studio.yourdomain.com
Branch dev:  https://dev.studio.yourdomain.com
```

---

## Vercel/Netlify Subdomain Setup

If deploying to platforms other than Cloudflare:

### Vercel

1. **Add custom domain** in project settings
2. Enter: `studio.yourdomain.com`
3. Add DNS record:
   - **Type**: CNAME
   - **Name**: studio
   - **Value**: cname.vercel-dns.com
4. Wait for verification

### Netlify

1. **Domain management** → **Add custom domain**
2. Enter: `studio.yourdomain.com`
3. Add DNS record:
   - **Type**: CNAME
   - **Name**: studio
   - **Value**: [your-site].netlify.app
4. Enable HTTPS in Netlify dashboard

---

## Troubleshooting Subdomain Issues

### Subdomain Returns 404

**Causes**:
- DNS not propagated yet
- CNAME record incorrect
- Custom domain not added in deployment platform
- Routing configuration missing

**Solutions**:
```bash
# Check DNS resolution
dig studio.yourdomain.com

# Verify CNAME points correctly
nslookup studio.yourdomain.com

# Clear local DNS cache (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Clear local DNS cache (Windows)
ipconfig /flushdns

# Check from external DNS checker
# https://www.whatsmydns.net/#CNAME/studio.yourdomain.com
```

### SSL Certificate Errors

**Causes**:
- Certificate doesn't cover subdomain
- SSL mode misconfigured
- Certificate not yet issued

**Solutions**:
1. Verify SSL/TLS mode is "Full" or "Full (strict)"
2. Wait 15 minutes for certificate issuance
3. Check universal SSL includes subdomain
4. Force HTTPS redirect enabled

### Redirect Loop

**Causes**:
- SSL/TLS mode set to "Flexible" with HTTPS redirect
- Duplicate redirect rules

**Solutions**:
1. Change SSL/TLS mode to "Full"
2. Remove duplicate redirect rules
3. Check page rules for conflicts

### DNS Propagation Delays

**Causes**:
- TTL too high on old record
- DNS cache at ISP level

**Solutions**:
1. Wait longer (up to 48 hours maximum)
2. Check from multiple locations: https://www.whatsmydns.net
3. Try different DNS servers: `nslookup studio.yourdomain.com 8.8.8.8`
4. Lower TTL before making changes (plan ahead)

---

## Best Practices

### DNS Best Practices

1. **Use CNAME, not A record** for subdomains:
   - CNAME follows if deployment IP changes
   - A record requires manual updates

2. **Enable Cloudflare proxy** (orange cloud):
   - Free SSL/TLS
   - DDoS protection
   - Performance improvements

3. **Set reasonable TTL**:
   - For active development: 300 (5 minutes)
   - For production: 3600 (1 hour)
   - For stable: 86400 (24 hours)

### Security Best Practices

1. **Always use HTTPS**:
   - Force HTTPS redirect
   - Enable HSTS

2. **Separate OAuth apps** per environment:
   - Production: studio.yourdomain.com
   - Staging: studio-staging.yourdomain.com

3. **Restrict access** if needed:
   - Cloudflare Access for IP allowlisting
   - HTTP Basic Auth for staging

### Naming Conventions

Choose clear, professional subdomain names:

**Good**:
- `studio.yourdomain.com` - Clear purpose
- `cms.yourdomain.com` - Industry standard
- `edit.yourdomain.com` - Descriptive

**Avoid**:
- `admin.yourdomain.com` - Too generic, security risk
- `backend.yourdomain.com` - Confusing
- `nuxt.yourdomain.com` - Technology-specific

---

## Verification Checklist

Before going live with subdomain:

- [ ] DNS record created and propagated
- [ ] Subdomain resolves to correct target
- [ ] SSL certificate active and valid
- [ ] HTTPS redirect enabled
- [ ] Custom domain added in deployment platform
- [ ] OAuth callback URLs updated
- [ ] Environment variable set for Studio URL
- [ ] Test OAuth authentication works
- [ ] Test content editing functionality
- [ ] Verify Git commits work
- [ ] Check subdomain accessible from multiple networks

---

## Monitoring and Maintenance

### Monitor Subdomain Health

1. **Set up uptime monitoring**:
   - Use Cloudflare Health Checks
   - Or external service (UptimeRobot, Pingdom)

2. **Monitor SSL certificate expiration**:
   - Cloudflare automatic renewal
   - Set reminder 30 days before manual certificates expire

3. **Check DNS resolution**:
   - Weekly checks for DNS issues
   - Monitor DNS propagation after changes

### Maintenance Tasks

**Monthly**:
- Verify SSL certificate valid
- Check uptime metrics
- Review access logs for issues

**Quarterly**:
- Review subdomain naming relevance
- Check for DNS optimization opportunities
- Update documentation if subdomain changes

**Annually**:
- Audit all subdomains in use
- Remove unused subdomains
- Review security settings

---

## Next Steps

After subdomain is configured and working:

1. **Document subdomain** for team members
2. **Update all references** to Studio URL in documentation
3. **Configure monitoring** for uptime and SSL
4. **Test from multiple locations** to verify global accessibility
5. **Train team** on accessing Studio via subdomain

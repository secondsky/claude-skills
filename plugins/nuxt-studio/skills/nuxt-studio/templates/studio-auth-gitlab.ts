// GitLab OAuth Configuration for Nuxt Studio
// This is a reference template - Studio handles OAuth automatically

/**
 * AUTOMATIC SETUP (Recommended):
 *
 * Studio automatically configures GitLab OAuth when you set environment variables:
 *
 * 1. Create GitLab OAuth Application:
 *    - GitLab.com: https://gitlab.com/-/profile/applications
 *    - Self-hosted: https://your-gitlab.com/-/profile/applications
 *    - Name: "Your Site - Studio CMS"
 *    - Redirect URI: https://studio.yourdomain.com/api/auth/callback/gitlab
 *    - Confidential: ✅ Check this box
 *    - Scopes: read_user, read_repository, write_repository
 *
 * 2. Set environment variables:
 *    NUXT_OAUTH_GITLAB_CLIENT_ID=your_application_id
 *    NUXT_OAUTH_GITLAB_CLIENT_SECRET=your_secret
 *
 * 3. For self-hosted GitLab, also set:
 *    NUXT_OAUTH_GITLAB_SERVER_URL=https://your-gitlab.com
 *
 * 4. Studio automatically handles the rest!
 */

// ============================================
// MANUAL CONFIGURATION (Advanced)
// ============================================

import type { OAuthConfig } from 'nuxt-auth-utils'

export const gitlabOAuthConfig: OAuthConfig = {
  // Provider name
  provider: 'gitlab',

  // OAuth credentials from environment variables
  clientId: process.env.NUXT_OAUTH_GITLAB_CLIENT_ID!,
  clientSecret: process.env.NUXT_OAUTH_GITLAB_CLIENT_SECRET!,

  // GitLab server URL (defaults to GitLab.com)
  serverUrl: process.env.NUXT_OAUTH_GITLAB_SERVER_URL || 'https://gitlab.com',

  // GitLab OAuth endpoints
  authorize: {
    url: `${process.env.NUXT_OAUTH_GITLAB_SERVER_URL || 'https://gitlab.com'}/oauth/authorize`,
    params: {
      scope: 'read_user read_repository write_repository'
    }
  },

  token: {
    url: `${process.env.NUXT_OAUTH_GITLAB_SERVER_URL || 'https://gitlab.com'}/oauth/token`,
    params: {
      grant_type: 'authorization_code'
    }
  },

  // User info endpoint
  userinfo: {
    url: `${process.env.NUXT_OAUTH_GITLAB_SERVER_URL || 'https://gitlab.com'}/api/v4/user`
  },

  // Callback URL
  redirectUri: `${process.env.NUXT_PUBLIC_STUDIO_URL}/api/auth/callback/gitlab`,

  // Response type
  responseType: 'code',

  // Response mode
  responseMode: 'query'
}

// ============================================
// OAUTH SCOPES EXPLAINED
// ============================================

/**
 * Required scopes for Nuxt Studio with GitLab:
 *
 * - read_user
 *   Grants access to user profile information
 *   Used to identify the user in Studio
 *
 * - read_repository
 *   Grants read access to repository content
 *   Required for reading content files
 *
 * - write_repository
 *   Grants write access to repository
 *   Required for committing changes from Studio
 *
 * Optional scopes:
 *
 * - api (full API access - NOT recommended, too broad)
 * - read_api (read-only API access)
 * - write_api (write API access)
 */

// ============================================
// SELF-HOSTED GITLAB SETUP
// ============================================

/**
 * For self-hosted GitLab instances:
 *
 * 1. Ensure your GitLab instance is accessible from Studio deployment
 *    - Public internet access required
 *    - Or Studio must be on same network
 *
 * 2. Configure GitLab application settings:
 *    - Admin Area → Settings → General → Visibility and access controls
 *    - Enable "Allow requests to the local network from webhooks and integrations"
 *
 * 3. Set NUXT_OAUTH_GITLAB_SERVER_URL:
 *    NUXT_OAUTH_GITLAB_SERVER_URL=https://gitlab.yourcompany.com
 *
 * 4. Update OAuth redirect URI to match your GitLab URL:
 *    https://studio.yourdomain.com/api/auth/callback/gitlab
 */

// ============================================
// ENVIRONMENT SETUP
// ============================================

/**
 * Local Development (.env.local):
 *
 * # GitLab.com
 * NUXT_OAUTH_GITLAB_CLIENT_ID=your_dev_app_id
 * NUXT_OAUTH_GITLAB_CLIENT_SECRET=your_dev_secret
 * NUXT_PUBLIC_STUDIO_URL=http://localhost:3000
 *
 * # Self-hosted GitLab
 * NUXT_OAUTH_GITLAB_CLIENT_ID=your_dev_app_id
 * NUXT_OAUTH_GITLAB_CLIENT_SECRET=your_dev_secret
 * NUXT_OAUTH_GITLAB_SERVER_URL=https://gitlab.yourcompany.com
 * NUXT_PUBLIC_STUDIO_URL=http://localhost:3000
 *
 * Important: Create separate OAuth app for development with callback:
 * http://localhost:3000/api/auth/callback/gitlab
 */

/**
 * Cloudflare Pages Production:
 *
 * Set in Workers & Pages → Settings → Environment variables:
 *
 * NUXT_OAUTH_GITLAB_CLIENT_ID=your_prod_app_id
 * NUXT_OAUTH_GITLAB_CLIENT_SECRET=your_prod_secret
 * NUXT_OAUTH_GITLAB_SERVER_URL=https://gitlab.yourcompany.com  (if self-hosted)
 * NUXT_PUBLIC_STUDIO_URL=https://studio.yourdomain.com
 */

/**
 * Cloudflare Workers (via wrangler):
 *
 * Set secrets via CLI:
 * wrangler secret put NUXT_OAUTH_GITLAB_CLIENT_ID
 * wrangler secret put NUXT_OAUTH_GITLAB_CLIENT_SECRET
 *
 * Set public vars in wrangler.toml:
 * [vars]
 * NUXT_OAUTH_GITLAB_SERVER_URL = "https://gitlab.yourcompany.com"
 * NUXT_PUBLIC_STUDIO_URL = "https://studio.yourdomain.com"
 */

// ============================================
// TROUBLESHOOTING
// ============================================

/**
 * Common GitLab OAuth Issues:
 *
 * 1. redirect_uri_mismatch
 *    - Verify redirect URI in OAuth app matches deployment URL
 *    - Check HTTPS vs HTTP
 *    - For self-hosted: Verify server URL is correct
 *
 * 2. invalid_client
 *    - Verify APPLICATION_ID and SECRET are correct
 *    - Check environment variables are set
 *    - Regenerate secret if lost
 *
 * 3. insufficient_scope
 *    - Ensure OAuth app has write_repository scope
 *    - Re-create application if scopes were changed
 *
 * 4. Self-hosted connection issues
 *    - Verify GitLab instance is accessible from Studio
 *    - Check firewall rules allow incoming connections
 *    - Verify SSL certificate is valid (or disable SSL verification for testing)
 *
 * 5. Confidential setting issues
 *    - Ensure "Confidential" checkbox is CHECKED when creating app
 *    - Non-confidential apps won't work with Studio
 */

// ============================================
// GITLAB.COM VS SELF-HOSTED
// ============================================

/**
 * GitLab.com (SaaS):
 * - Easier setup
 * - No infrastructure maintenance
 * - Public internet access always available
 * - Standard OAuth endpoints
 *
 * Self-hosted GitLab:
 * - Full control over instance
 * - Can be on private network (but Studio must access it)
 * - Requires NUXT_OAUTH_GITLAB_SERVER_URL configuration
 * - May need additional firewall/network configuration
 *
 * Choose based on your team's GitLab hosting preference.
 */

// ============================================
// TESTING OAUTH FLOW
// ============================================

/**
 * Test GitLab OAuth locally:
 *
 * 1. Set up local environment variables
 * 2. Create development OAuth application in GitLab
 * 3. Start dev server: npm run dev
 * 4. Visit: http://localhost:3000/_studio
 * 5. Click "Sign in with GitLab"
 * 6. Authorize the application
 * 7. Should redirect back to Studio
 *
 * Check browser console and network tab for errors.
 * For self-hosted: Verify GitLab logs if authentication fails.
 */

// ============================================
// SECURITY BEST PRACTICES
// ============================================

/**
 * 1. NEVER commit CLIENT_SECRET to Git
 *    - Use .env files (add to .gitignore)
 *    - Use environment variables on deployment
 *
 * 2. Always use Confidential applications
 *    - Non-confidential apps are less secure
 *    - Check "Confidential" when creating OAuth app
 *
 * 3. Use different OAuth apps per environment
 *    - Development: localhost callback
 *    - Staging: staging.domain.com callback
 *    - Production: studio.domain.com callback
 *
 * 4. For self-hosted GitLab:
 *    - Use HTTPS with valid SSL certificates
 *    - Restrict network access to trusted sources
 *    - Monitor OAuth application usage in GitLab admin
 *
 * 5. Rotate secrets regularly
 *    - Every 3-6 months minimum
 *    - Immediately if compromised
 */

// ============================================
// REFERENCE
// ============================================

/**
 * GitLab OAuth Documentation:
 * https://docs.gitlab.com/ee/integration/oauth_provider.html
 *
 * GitLab API Documentation:
 * https://docs.gitlab.com/ee/api/
 *
 * Self-hosted GitLab Configuration:
 * https://docs.gitlab.com/ee/administration/
 */

export default gitlabOAuthConfig

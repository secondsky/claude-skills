// GitHub OAuth Configuration for Nuxt Studio
// This is a reference template - Studio handles OAuth automatically
// Use this for understanding the OAuth flow or custom implementations

/**
 * AUTOMATIC SETUP (Recommended):
 *
 * Studio automatically configures GitHub OAuth when you set environment variables:
 *
 * 1. Create GitHub OAuth App:
 *    - Go to: https://github.com/settings/developers
 *    - Click "New OAuth App"
 *    - Application name: "Your Site - Studio CMS"
 *    - Homepage URL: https://yourdomain.com
 *    - Authorization callback URL: https://studio.yourdomain.com/api/auth/callback/github
 *
 * 2. Set environment variables:
 *    NUXT_OAUTH_GITHUB_CLIENT_ID=your_client_id
 *    NUXT_OAUTH_GITHUB_CLIENT_SECRET=your_client_secret
 *
 * 3. Studio automatically handles the rest!
 */

// ============================================
// MANUAL CONFIGURATION (Advanced Use Cases)
// ============================================

import type { OAuthConfig } from 'nuxt-auth-utils'

export const githubOAuthConfig: OAuthConfig = {
  // Provider name
  provider: 'github',

  // OAuth credentials from environment variables
  clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID!,
  clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET!,

  // GitHub OAuth endpoints
  authorize: {
    url: 'https://github.com/login/oauth/authorize',
    params: {
      scope: 'read:user repo'  // Required scopes for Studio
    }
  },

  token: {
    url: 'https://github.com/login/oauth/access_token',
    params: {
      grant_type: 'authorization_code'
    }
  },

  // User info endpoint
  userinfo: {
    url: 'https://api.github.com/user'
  },

  // Callback URL (automatically constructed)
  redirectUri: `${process.env.NUXT_PUBLIC_STUDIO_URL}/api/auth/callback/github`,

  // Response type
  responseType: 'code',

  // Response mode
  responseMode: 'query'
}

// ============================================
// OAUTH SCOPES EXPLAINED
// ============================================

/**
 * Required scopes for Nuxt Studio with GitHub:
 *
 * - read:user
 *   Grants access to user profile information
 *   Used to identify the user in Studio
 *
 * - repo (for private repos) OR public_repo (for public repos only)
 *   Grants access to repository content
 *   Required for reading/writing content files
 *   Required for committing changes from Studio
 *
 * Optional scopes:
 *
 * - workflow (if you need to trigger GitHub Actions)
 *   Allows Studio to trigger workflows on commit
 */

// ============================================
// ENVIRONMENT SETUP
// ============================================

/**
 * Local Development (.env.local):
 *
 * NUXT_OAUTH_GITHUB_CLIENT_ID=your_dev_client_id
 * NUXT_OAUTH_GITHUB_CLIENT_SECRET=your_dev_secret
 * NUXT_PUBLIC_STUDIO_URL=http://localhost:3000
 *
 * Important: Use a separate OAuth app for development with callback:
 * http://localhost:3000/api/auth/callback/github
 */

/**
 * Cloudflare Pages Production:
 *
 * Set in Workers & Pages → Settings → Environment variables:
 *
 * NUXT_OAUTH_GITHUB_CLIENT_ID=your_prod_client_id
 * NUXT_OAUTH_GITHUB_CLIENT_SECRET=your_prod_secret
 * NUXT_PUBLIC_STUDIO_URL=https://studio.yourdomain.com
 *
 * Important: Use production OAuth app with callback:
 * https://studio.yourdomain.com/api/auth/callback/github
 */

/**
 * Cloudflare Workers (via wrangler):
 *
 * Set secrets via CLI:
 * wrangler secret put NUXT_OAUTH_GITHUB_CLIENT_ID
 * wrangler secret put NUXT_OAUTH_GITHUB_CLIENT_SECRET
 *
 * Set public vars in wrangler.toml:
 * [vars]
 * NUXT_PUBLIC_STUDIO_URL = "https://studio.yourdomain.com"
 */

// ============================================
// TROUBLESHOOTING
// ============================================

/**
 * Common GitHub OAuth Issues:
 *
 * 1. redirect_uri_mismatch
 *    - Verify callback URL in OAuth app matches deployment URL exactly
 *    - Check HTTPS vs HTTP
 *    - Check subdomain matches (studio.domain.com vs domain.com)
 *
 * 2. invalid_client
 *    - Verify CLIENT_ID and CLIENT_SECRET are correct
 *    - Check environment variables are set
 *    - Regenerate secret if lost
 *
 * 3. insufficient_scope
 *    - Ensure OAuth app has 'repo' scope (or 'public_repo')
 *    - Re-authorize the application
 *
 * 4. access_denied
 *    - User denied authorization
 *    - Check OAuth app is not suspended
 *    - Verify app has required permissions
 */

// ============================================
// TESTING OAUTH FLOW
// ============================================

/**
 * Test GitHub OAuth locally:
 *
 * 1. Set up local environment variables
 * 2. Start dev server: npm run dev
 * 3. Visit: http://localhost:3000/_studio
 * 4. Click "Sign in with GitHub"
 * 5. Authorize the application
 * 6. Should redirect back to Studio
 *
 * Check browser console and network tab for errors.
 */

// ============================================
// SECURITY BEST PRACTICES
// ============================================

/**
 * 1. NEVER commit CLIENT_SECRET to Git
 *    - Use .env files (add to .gitignore)
 *    - Use environment variables on deployment platforms
 *
 * 2. Use different OAuth apps per environment
 *    - Development: localhost callback
 *    - Staging: staging.domain.com callback
 *    - Production: studio.domain.com callback
 *
 * 3. Rotate secrets regularly
 *    - Every 3-6 months minimum
 *    - Immediately if compromised
 *
 * 4. Limit OAuth app permissions
 *    - Use 'public_repo' instead of 'repo' if possible
 *    - Only request scopes you need
 *
 * 5. Monitor OAuth app usage
 *    - Check GitHub OAuth app settings for unusual activity
 *    - Review authorized users periodically
 */

// ============================================
// REFERENCE
// ============================================

/**
 * GitHub OAuth Documentation:
 * https://docs.github.com/en/developers/apps/building-oauth-apps
 *
 * Nuxt Studio OAuth Guide:
 * https://content.nuxt.com/docs/studio/authentication
 *
 * Available Scopes:
 * https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
 */

export default githubOAuthConfig

// Google OAuth Configuration for Nuxt Studio
// This is a reference template - Studio handles OAuth automatically

/**
 * AUTOMATIC SETUP (Recommended):
 *
 * Studio automatically configures Google OAuth when you set environment variables:
 *
 * 1. Create Google Cloud Project and OAuth Client:
 *    - Go to: https://console.cloud.google.com/apis/credentials
 *    - Create project (or select existing)
 *    - Click "Create Credentials" → "OAuth client ID"
 *    - Configure OAuth consent screen (if first time)
 *    - Application type: "Web application"
 *    - Name: "Your Site - Studio CMS"
 *    - Authorized JavaScript origins: https://studio.yourdomain.com
 *    - Authorized redirect URIs: https://studio.yourdomain.com/api/auth/callback/google
 *
 * 2. Set environment variables:
 *    NUXT_OAUTH_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
 *    NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_client_secret
 *
 * 3. Studio automatically handles the rest!
 */

// ============================================
// MANUAL CONFIGURATION (Advanced)
// ============================================

import type { OAuthConfig } from 'nuxt-auth-utils'

export const googleOAuthConfig: OAuthConfig = {
  // Provider name
  provider: 'google',

  // OAuth credentials from environment variables
  clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID!,
  clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET!,

  // Google OAuth endpoints
  authorize: {
    url: 'https://accounts.google.com/o/oauth2/v2/auth',
    params: {
      scope: 'openid email profile',
      access_type: 'offline',  // For refresh tokens
      prompt: 'consent'  // Force consent screen to get refresh token
    }
  },

  token: {
    url: 'https://oauth2.googleapis.com/token',
    params: {
      grant_type: 'authorization_code'
    }
  },

  // User info endpoint
  userinfo: {
    url: 'https://www.googleapis.com/oauth2/v2/userinfo'
  },

  // Callback URL
  redirectUri: `${process.env.NUXT_PUBLIC_STUDIO_URL}/api/auth/callback/google`,

  // Response type
  responseType: 'code',

  // Response mode
  responseMode: 'query'
}

// ============================================
// OAUTH SCOPES EXPLAINED
// ============================================

/**
 * Required scopes for Nuxt Studio with Google:
 *
 * - openid
 *   OpenID Connect authentication
 *   Required for user identification
 *
 * - email
 *   Access to user's email address
 *   Used to identify the user in Studio
 *
 * - profile
 *   Access to user's basic profile information
 *   Used for display name and avatar in Studio
 *
 * Optional scopes (for advanced integrations):
 *
 * - https://www.googleapis.com/auth/drive.file
 *   Access to Google Drive files (if storing content in Drive)
 *
 * - https://www.googleapis.com/auth/drive.readonly
 *   Read-only access to Google Drive
 *
 * Note: Google OAuth for Studio is typically used just for authentication,
 * not for accessing Google services. Basic scopes are usually sufficient.
 */

// ============================================
// OAUTH CONSENT SCREEN SETUP
// ============================================

/**
 * OAuth Consent Screen Configuration:
 *
 * 1. Go to: https://console.cloud.google.com/apis/credentials/consent
 *
 * 2. User Type:
 *    - Internal: For Google Workspace users only (recommended for teams)
 *    - External: For any Google account users
 *
 * 3. App Information:
 *    - App name: "Your Site Studio CMS"
 *    - User support email: your@email.com
 *    - App logo: (optional, but recommended)
 *
 * 4. Scopes:
 *    - Add: openid, email, profile
 *
 * 5. Test users (for External apps in testing):
 *    - Add email addresses of users who can test
 *    - Remove restriction when ready for production
 *
 * 6. Publishing Status:
 *    - Testing: Limited to test users (max 100)
 *    - In production: Available to all users
 *    - Publish when ready for team-wide use
 */

// ============================================
// ENVIRONMENT SETUP
// ============================================

/**
 * Local Development (.env.local):
 *
 * NUXT_OAUTH_GOOGLE_CLIENT_ID=your_dev_client_id.apps.googleusercontent.com
 * NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_dev_secret
 * NUXT_PUBLIC_STUDIO_URL=http://localhost:3000
 *
 * Important: Create separate OAuth client for development with:
 * Authorized redirect URI: http://localhost:3000/api/auth/callback/google
 */

/**
 * Cloudflare Pages Production:
 *
 * Set in Workers & Pages → Settings → Environment variables:
 *
 * NUXT_OAUTH_GOOGLE_CLIENT_ID=your_prod_client_id.apps.googleusercontent.com
 * NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_prod_secret
 * NUXT_PUBLIC_STUDIO_URL=https://studio.yourdomain.com
 *
 * Important: Use production OAuth client with:
 * Authorized redirect URI: https://studio.yourdomain.com/api/auth/callback/google
 */

/**
 * Cloudflare Workers (via wrangler):
 *
 * Set secrets via CLI:
 * wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_ID
 * wrangler secret put NUXT_OAUTH_GOOGLE_CLIENT_SECRET
 *
 * Set public vars in wrangler.toml:
 * [vars]
 * NUXT_PUBLIC_STUDIO_URL = "https://studio.yourdomain.com"
 */

// ============================================
// TROUBLESHOOTING
// ============================================

/**
 * Common Google OAuth Issues:
 *
 * 1. redirect_uri_mismatch
 *    - Verify redirect URI in OAuth client matches deployment URL exactly
 *    - Check HTTPS vs HTTP
 *    - Ensure subdomain matches (studio.domain.com vs domain.com)
 *    - Check for trailing slashes (should NOT have one)
 *
 * 2. invalid_client
 *    - Verify CLIENT_ID and CLIENT_SECRET are correct
 *    - Check environment variables are set
 *    - Regenerate secret if lost
 *
 * 3. access_denied
 *    - User denied authorization
 *    - App in "Testing" mode and user not in test users list
 *    - Consent screen not approved
 *
 * 4. App in testing mode restrictions
 *    - Max 100 test users in testing mode
 *    - Publish app to remove restriction
 *    - Or add users to test users list
 *
 * 5. Consent screen issues
 *    - Ensure consent screen is configured completely
 *    - Verify scopes are added
 *    - Check app is not suspended
 */

// ============================================
// AUTHORIZED DOMAINS
// ============================================

/**
 * Configure authorized domains in Google Cloud Console:
 *
 * 1. OAuth consent screen → Authorized domains
 * 2. Add your domain: yourdomain.com
 * 3. Save changes
 *
 * This allows OAuth to work on any subdomain of yourdomain.com
 * Example: studio.yourdomain.com, staging.yourdomain.com, etc.
 *
 * Note: Authorized JavaScript origins must still list each subdomain explicitly.
 */

// ============================================
// TESTING OAUTH FLOW
// ============================================

/**
 * Test Google OAuth locally:
 *
 * 1. Set up local environment variables
 * 2. Create development OAuth client in Google Cloud
 * 3. Add test user (if app in testing mode)
 * 4. Start dev server: npm run dev
 * 5. Visit: http://localhost:3000/_studio
 * 6. Click "Sign in with Google"
 * 7. Choose Google account
 * 8. Grant permissions
 * 9. Should redirect back to Studio
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
 * 2. Use different OAuth clients per environment
 *    - Development: localhost redirect
 *    - Staging: staging.domain.com redirect
 *    - Production: studio.domain.com redirect
 *
 * 3. Configure OAuth consent screen properly
 *    - Use Internal type for Google Workspace (more secure)
 *    - Use External type only if needed for non-workspace users
 *    - Publish app when ready for production
 *
 * 4. Rotate secrets regularly
 *    - Every 3-6 months minimum
 *    - Immediately if compromised
 *
 * 5. Monitor OAuth usage
 *    - Check Google Cloud Console for unusual activity
 *    - Review authorized users periodically
 *
 * 6. Restrict scopes
 *    - Only request scopes you need
 *    - Avoid broad scopes like drive.file unless necessary
 *
 * 7. Enable 2-factor authentication
 *    - For Google accounts with OAuth client access
 *    - Protects against account compromise
 */

// ============================================
// GOOGLE WORKSPACE INTEGRATION
// ============================================

/**
 * For Google Workspace organizations:
 *
 * 1. Create OAuth client as "Internal" user type
 *    - Only Workspace users can authenticate
 *    - No need for app verification
 *    - More secure for team use
 *
 * 2. Admin can control app access
 *    - Workspace admin can enable/disable app
 *    - Can restrict to specific organizational units
 *
 * 3. No 100-user limit for testing
 *    - Internal apps don't have testing mode restrictions
 *    - All Workspace users have access immediately
 */

// ============================================
// REFERENCE
// ============================================

/**
 * Google OAuth Documentation:
 * https://developers.google.com/identity/protocols/oauth2
 *
 * OAuth Consent Screen Guide:
 * https://support.google.com/cloud/answer/10311615
 *
 * Google Cloud Console:
 * https://console.cloud.google.com/apis/credentials
 *
 * OAuth Playground (for testing):
 * https://developers.google.com/oauthplayground/
 */

export default googleOAuthConfig

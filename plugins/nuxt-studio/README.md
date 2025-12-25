# Nuxt Studio Plugin

**Visual CMS for Nuxt Content with Cloudflare deployment support**

## Overview

This plugin provides comprehensive guidance for setting up Nuxt Studio - a free, open-source visual content editor for Nuxt Content websites. It covers first-time installation, OAuth authentication (GitHub/GitLab/Google), editor configuration (Monaco/TipTap/Form), and deployment to Cloudflare Pages/Workers with subdomain routing (e.g., studio.domain.com).

## Features

- **First-Time Setup**: Interactive setup wizard for Nuxt Studio integration
- **OAuth Configuration**: GitHub, GitLab, and Google authentication setup
- **Cloudflare Deployment**: Complete guide for Cloudflare Pages/Workers deployment
- **Subdomain Routing**: Configure studio.domain.com or cms.domain.com
- **Editor Types**: Monaco code editor, TipTap visual editor, Form-based editor
- **Troubleshooting**: Common errors and solutions with Cloudflare integration
- **Validation**: Automatic checks for Nuxt Content compatibility and configuration

## Installation

```bash
# Install from claude-skills marketplace
/plugin install nuxt-studio@claude-skills
```

## Prerequisites

- **Nuxt**: ≥3.x
- **@nuxt/content**: ≥2.x (required dependency)
- **Node.js**: ≥18.x
- **Cloudflare Account**: Required for Cloudflare deployment (optional)

## Quick Start

### 1. Interactive Setup

```bash
# Run the interactive setup wizard
/nuxt-studio:setup-studio
```

This command will:
- Check if Nuxt Content is installed
- Help you choose an OAuth provider
- Configure the Studio module
- Set up deployment preferences

### 2. Configure OAuth Authentication

```bash
# Configure OAuth provider credentials
/nuxt-studio:configure-studio-auth
```

Supports:
- **GitHub OAuth**: Best for public repositories
- **GitLab OAuth**: Great for self-hosted GitLab instances
- **Google OAuth**: Universal authentication option

### 3. Deploy to Cloudflare

```bash
# Prepare and deploy to Cloudflare Pages/Workers
/nuxt-studio:deploy-studio-cloudflare
```

This command helps you:
- Configure wrangler.toml for custom domains
- Set up subdomain routing (studio.domain.com)
- Configure environment variables on Cloudflare
- Deploy your Studio instance

### 4. Environment Variables Setup

```bash
# Guide for setting up OAuth secrets on Cloudflare
/nuxt-studio:studio-env-setup
```

## Components

### Skills

- **nuxt-studio**: Core knowledge about Nuxt Studio setup, configuration, OAuth, editors, Cloudflare deployment, and troubleshooting

### Commands

- **setup-studio**: Interactive first-time setup wizard
- **configure-studio-auth**: OAuth provider configuration helper
- **deploy-studio-cloudflare**: Cloudflare-specific deployment guide
- **studio-env-setup**: Environment variables setup helper

### Agents

- **studio-setup-assistant**: Autonomous validation agent that checks:
  - Nuxt Content installation and compatibility
  - Nuxt version requirements
  - Cloudflare configuration (if deploying)
  - OAuth environment variables
  - Studio module configuration

## Configuration

You can customize the plugin behavior with `.claude/nuxt-studio.local.md`:

```yaml
---
oauth_provider: github              # github | gitlab | google
subdomain: studio                   # Subdomain prefix (e.g., studio.domain.com)
deployment_platform: cloudflare-pages  # cloudflare-pages | cloudflare-workers | vercel | netlify
cloudflare_account_id: ""           # Optional: Your Cloudflare account ID
cloudflare_project_name: ""         # Optional: Your Cloudflare project name
---

# Nuxt Studio Configuration

Your custom notes and preferences...
```

## Auto-Triggering

The plugin automatically activates when you ask questions like:

- "Set up Nuxt Studio for my Nuxt Content site"
- "Configure Studio OAuth with GitHub"
- "Deploy Studio to Cloudflare subdomain"
- "Add visual editor to my Nuxt website"
- "Studio authentication not working"
- "Configure studio.domain.com"

## Common Use Cases

### First-Time Studio Setup

```
User: "I want to add visual editing to my Nuxt Content blog"

Claude: [Loads nuxt-studio skill and runs setup-studio command]
- Checks Nuxt Content installation
- Guides through Studio module setup
- Configures OAuth authentication
- Prepares for deployment
```

### Cloudflare Subdomain Deployment

```
User: "Deploy Studio to studio.myblog.com on Cloudflare"

Claude: [Uses deploy-studio-cloudflare command]
- Configures wrangler.toml for custom domain
- Sets up DNS records
- Configures environment variables
- Provides deployment commands
```

### Troubleshooting OAuth Issues

```
User: "OAuth authentication loop after login"

Claude: [Loads nuxt-studio skill troubleshooting section]
- Checks redirect URI configuration
- Validates environment variables
- Verifies OAuth app settings
- Suggests fixes
```

## Integration with Other Skills

This plugin works well with:

- **nuxt-content**: Prerequisites for Studio setup
- **nuxt-v4**: Core Nuxt framework knowledge
- **cloudflare-worker-base**: Cloudflare deployment fundamentals
- **better-auth**: Alternative authentication patterns

## Version Support

- **Nuxt Studio**: Latest stable version (check skill for current version)
- **Nuxt**: ≥3.x
- **@nuxt/content**: ≥2.x

## Troubleshooting

### Studio Module Not Found

```bash
# Install Nuxt Studio module
npm install -D @nuxt/studio
```

### OAuth Redirect Mismatch

Check that your OAuth app redirect URI matches:
```
https://studio.yourdomain.com/api/auth/callback/[provider]
```

### Cloudflare Build Failures

Ensure nitro preset is set:
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages'
  }
})
```

## Resources

- **Nuxt Studio Repo**: https://github.com/nuxt-content/studio
- **Nuxt Content Docs**: https://content.nuxt.com
- **Cloudflare Pages**: https://pages.cloudflare.com

## Contributing

Found an issue or have a suggestion? Open an issue at:
https://github.com/secondsky/claude-skills/issues

## License

MIT License - See LICENSE file for details

---

**Maintained by**: Claude Skills Maintainers
**Repository**: https://github.com/secondsky/claude-skills

---
name: nuxt-studio:setup
description: Interactive first-time setup wizard for Nuxt Studio integration with Nuxt Content sites
argument-hint: No arguments required - interactive wizard
allowed-tools: [Read, Write, Edit, Bash, AskUserQuestion]
---

# Nuxt Studio Setup Wizard

Guide the user through first-time Nuxt Studio setup with an interactive approach.

## Execution Steps

### 1. Prerequisites Validation

Run the prerequisites checker script:

```bash
bash $CLAUDE_PLUGIN_ROOT/skills/nuxt-studio/scripts/check-prerequisites.sh
```

If prerequisites fail:
- Inform user of missing requirements
- Offer to help install missing dependencies
- Stop setup until requirements are met

If prerequisites pass, proceed to step 2.

### 2. Gather User Preferences

Use the AskUserQuestion tool to ask the user:

**Question 1**: "Which OAuth provider do you want to use for Studio authentication?"
- Header: "OAuth Provider"
- Options:
  - **GitHub** (Recommended): "Best for GitHub-hosted repositories. Most common choice."
  - **GitLab**: "For GitLab.com or self-hosted GitLab instances"
  - **Google**: "Universal option for any Google account users"
- Multi-select: false

**Question 2**: "Where will you deploy Studio?"
- Header: "Deployment"
- Options:
  - **Cloudflare Pages** (Recommended): "Git-integrated automatic deployments with custom domains"
  - **Cloudflare Workers**: "Direct deployment with wrangler CLI, more control"
  - **Vercel**: "Alternative platform with excellent DX"
  - **Netlify**: "Another popular deployment option"
- Multi-select: false

**Question 3**: "What subdomain do you want for Studio?"
- Header: "Subdomain"
- Options:
  - **studio**: "studio.yourdomain.com (recommended)"
  - **cms**: "cms.yourdomain.com"
  - **edit**: "edit.yourdomain.com"
  - **admin**: "admin.yourdomain.com"
- Multi-select: false

### 3. Install Studio Module

Check if nuxt-studio is already installed:

```bash
grep "nuxt-studio" package.json
```

If not installed, install it:

```bash
npx nuxi module add nuxt-studio@beta
```

Confirm installation succeeded.

### 4. Configure nuxt.config.ts

Read the current nuxt.config.ts:

```bash
# Read tool
```

Check if Studio module is in modules array. If not, add it.

Ensure modules array has correct order:
```typescript
modules: [
  '@nuxt/content',  // Must be first
  'nuxt-studio'
]
```

Add recommended configuration based on user's deployment choice:

For **Cloudflare Pages/Workers**:
```typescript
nitro: {
  preset: 'cloudflare-pages'  // or 'cloudflare' for Workers
}
```

For **Vercel**:
```typescript
nitro: {
  preset: 'vercel'
}
```

For **Netlify**:
```typescript
nitro: {
  preset: 'netlify'
}
```

Add content configuration:
```typescript
content: {
  experimental: {
    clientDB: true  // For MDC components
  }
}
```

Add runtime config for OAuth (placeholders):
```typescript
runtimeConfig: {
  oauth: {
    github: {  // Or gitlab/google based on choice
      clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET
    }
  },
  public: {
    studioUrl: process.env.NUXT_PUBLIC_STUDIO_URL || 'http://localhost:3000'
  }
}
```

Use Edit tool to update nuxt.config.ts.

### 5. Create .env.local Template

Create .env.local file with placeholders:

```bash
# Nuxt Studio OAuth Configuration
# Replace with your actual credentials

# OAuth Provider: [CHOSEN_PROVIDER]
NUXT_OAUTH_[PROVIDER]_CLIENT_ID=your_client_id_here
NUXT_OAUTH_[PROVIDER]_CLIENT_SECRET=your_client_secret_here

# For self-hosted GitLab only (if GitLab chosen)
# NUXT_OAUTH_GITLAB_SERVER_URL=https://gitlab.yourcompany.com

# Studio URL
NUXT_PUBLIC_STUDIO_URL=http://localhost:3000

# For production, set to:
# NUXT_PUBLIC_STUDIO_URL=https://[subdomain].yourdomain.com
```

Replace [CHOSEN_PROVIDER] and [subdomain] with user's choices.

### 6. Add .env to .gitignore

Check if .gitignore exists and contains .env:

```bash
grep "^\.env" .gitignore
```

If not, add it:

```bash
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 7. Create Content Directory (if needed)

Check if content/ directory exists:

```bash
ls -d content
```

If not, create it with a sample file:

```bash
mkdir -p content
cat > content/index.md << 'EOF'
---
title: Welcome to Studio
description: Your first content file
---

# Welcome to Nuxt Studio!

Edit this file in Studio to get started.

::alert{type="info"}
You can use MDC components in your content.
::
EOF
```

### 8. Summary and Next Steps

Present a summary to the user:

```
✓ Setup Complete!

Configuration Summary:
- OAuth Provider: [chosen provider]
- Deployment: [chosen platform]
- Subdomain: [chosen subdomain].yourdomain.com

Next Steps:

1. Configure OAuth Provider:
   Run: /nuxt-studio:configure-studio-auth
   This will guide you through creating OAuth app and setting credentials.

2. Start Development Server:
   Run: npm run dev
   Visit: http://localhost:3000/_studio

3. Deploy to [Platform]:
   Run: /nuxt-studio:deploy-studio-cloudflare
   (or follow your platform's deployment guide)

Files Modified:
- nuxt.config.ts (Studio configuration added)
- .env.local (OAuth template created)
- .gitignore (environment files added)
- package.json (nuxt-studio@beta installed)

For help: Load references/troubleshooting.md
```

### 9. Offer to Continue

Ask the user:

"Would you like me to help you configure OAuth authentication now?"

If yes, automatically run `/nuxt-studio:configure-studio-auth`

If no, remind them they can run it later.

## Important Notes

- Be interactive and guide user through each step
- Validate each step before proceeding
- Handle errors gracefully
- Provide clear next steps
- Never commit OAuth secrets to Git
- Always create .env.local (not .env)
- Update .gitignore to exclude secrets

## Error Handling

If any step fails:
1. Show clear error message
2. Suggest solution
3. Ask if user wants to retry or skip
4. Don't leave configuration in broken state
5. Provide link to troubleshooting docs

## Tips

- For new users: Recommend GitHub OAuth (most common)
- For teams: Suggest GitLab if using GitLab, or Google for universal access
- For deployment: Recommend Cloudflare Pages for best integration
- For subdomain: "studio" is most conventional

## Reference

For detailed documentation, load:
- references/oauth-providers.md (OAuth setup)
- references/cloudflare-deployment.md (Deployment)
- templates/nuxt.config.ts (Configuration example)

#!/bin/bash
# Nuxt Studio Setup Script
# Configures Nuxt Studio for production content editing

set -e

echo "🎨 Nuxt Studio Setup"
echo "===================="
echo ""

# Check if we're in a Nuxt project
if [ ! -f "nuxt.config.ts" ]; then
  echo "❌ Error: No nuxt.config.ts found. Run setup-nuxt-content.sh first."
  exit 1
fi

# Check if @nuxt/content is installed
if ! grep -q "@nuxt/content" package.json; then
  echo "❌ Error: @nuxt/content not installed. Run setup-nuxt-content.sh first."
  exit 1
fi

# Detect package manager
if [ -f "bun.lockb" ]; then
  INSTALL_CMD="bun add"
elif [ -f "pnpm-lock.yaml" ]; then
  INSTALL_CMD="pnpm add"
elif [ -f "yarn.lock" ]; then
  INSTALL_CMD="yarn add"
else
  INSTALL_CMD="npm install"
fi

# Install Nuxt Studio
echo "📥 Installing nuxt-studio@alpha..."
$INSTALL_CMD nuxt-studio@alpha

echo ""
echo "✅ nuxt-studio installed!"
echo ""

# Prompt for GitHub repository details
echo "📝 GitHub Repository Configuration"
echo ""
read -p "GitHub username/org: " GITHUB_OWNER
read -p "Repository name: " GITHUB_REPO
read -p "Branch (default: main): " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}

echo ""
echo "🔑 GitHub OAuth Setup Required"
echo ""
echo "To use Nuxt Studio, you need to create a GitHub OAuth app:"
echo ""
echo "1. Visit: https://github.com/settings/developers"
echo "2. Click 'New OAuth App'"
echo "3. Settings:"
echo "   - Application name: Your app name"
echo "   - Homepage URL: https://yourdomain.com"
echo "   - Callback URL: https://yourdomain.com"
echo "4. Copy the Client ID and generate a Client Secret"
echo ""
read -p "Press ENTER when you've created the OAuth app..."

# Add to nuxt.config.ts
echo ""
echo "📝 Updating nuxt.config.ts..."

# Create backup
cp nuxt.config.ts nuxt.config.ts.backup

# Add studio configuration (user will need to adjust)
cat >> nuxt.config.ts << EOF

  // Nuxt Studio Configuration
  studio: {
    route: '/_studio',

    repository: {
      provider: 'github',
      owner: '$GITHUB_OWNER',
      repo: '$GITHUB_REPO',
      branch: '$GITHUB_BRANCH'
    }
  }
EOF

echo "✅ Updated nuxt.config.ts (please verify the configuration)"
echo ""

# Create .env.example
echo "📝 Creating .env.example..."
cat > .env.example << 'EOF'
# Nuxt Studio GitHub OAuth Configuration
STUDIO_GITHUB_CLIENT_ID=your_github_oauth_client_id
STUDIO_GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Optional: Branch name for different environments
# STUDIO_GITHUB_BRANCH_NAME=main
EOF

# Create or update .env
if [ ! -f ".env" ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your GitHub OAuth credentials"
else
  echo "⚠️  .env file exists. Please add these variables:"
  cat .env.example
fi

# Add .env to .gitignore if not already there
if [ -f ".gitignore" ]; then
  if ! grep -q "^\.env$" .gitignore; then
    echo ".env" >> .gitignore
    echo "✅ Added .env to .gitignore"
  fi
else
  echo ".env" > .gitignore
  echo "✅ Created .gitignore with .env"
fi

echo ""
echo "🎉 Nuxt Studio setup complete!"
echo ""
echo "⚠️  IMPORTANT: Next Steps"
echo ""
echo "1. Edit .env and add your GitHub OAuth credentials:"
echo "   STUDIO_GITHUB_CLIENT_ID=your_client_id"
echo "   STUDIO_GITHUB_CLIENT_SECRET=your_client_secret"
echo ""
echo "2. Verify nuxt.config.ts has 'nuxt-studio' in modules array"
echo ""
echo "3. For production deployment:"
echo "   - Add environment variables to your hosting platform"
echo "   - Ensure SSR is enabled (not static generation)"
echo "   - Create separate OAuth app for staging if needed"
echo ""
echo "4. Access Studio at: http://localhost:3000/_studio (after running dev server)"
echo "   Or use keyboard shortcut: Ctrl + ."
echo ""
echo "📚 Resources:"
echo "  - Nuxt Studio Docs: https://github.com/nuxt-content/studio"
echo "  - OAuth Setup Guide: skills/nuxt-content/references/studio-setup-guide.md"
echo ""

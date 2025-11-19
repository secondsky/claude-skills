#!/bin/bash

# Turborepo Remote Cache Setup Script
# Links repository to Vercel remote cache

set -e

echo "🔗 Turborepo Remote Cache Setup"
echo "================================="
echo ""

# Check if turbo is installed
if ! command -v turbo &> /dev/null; then
  echo "❌ Turborepo not found. Installing..."
  npm install -g turbo
fi

echo "This script will:"
echo "  1. Login to Vercel"
echo "  2. Link this repository to remote cache"
echo "  3. Display tokens for CI/CD setup"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Login to Vercel
echo ""
echo "📝 Step 1: Login to Vercel"
echo "A browser window will open for authentication..."
echo ""
turbo login

# Link repository
echo ""
echo "🔗 Step 2: Link repository"
echo "Select the team and project to link..."
echo ""
turbo link

# Get config info
echo ""
echo "✅ Remote cache linked successfully!"
echo ""

if [ -f ".turbo/config.json" ]; then
  echo "📄 Configuration saved to .turbo/config.json"
  echo ""

  # Read team ID from config (if using jq)
  if command -v jq &> /dev/null; then
    TEAM_ID=$(jq -r '.teamid' .turbo/config.json 2>/dev/null || echo "")
    if [ -n "$TEAM_ID" ]; then
      echo "Team ID: $TEAM_ID"
    fi
  fi
fi

echo ""
echo "🔐 CI/CD Setup Instructions"
echo "============================="
echo ""
echo "To enable remote caching in CI/CD, add these environment variables:"
echo ""
echo "GitHub Actions:"
echo "  1. Go to repository Settings → Secrets → Actions"
echo "  2. Add secrets:"
echo "     - TURBO_TOKEN: [Get from Vercel dashboard → Settings → Tokens]"
echo "     - TURBO_TEAM: [Your team ID from above]"
echo ""
echo "  3. In your workflow file:"
echo "     env:"
echo "       TURBO_TOKEN: \${{ secrets.TURBO_TOKEN }}"
echo "       TURBO_TEAM: \${{ secrets.TURBO_TEAM }}"
echo ""
echo "GitLab CI:"
echo "  1. Go to Settings → CI/CD → Variables"
echo "  2. Add variables:"
echo "     - TURBO_TOKEN"
echo "     - TURBO_TEAM"
echo ""
echo "  3. In .gitlab-ci.yml:"
echo "     variables:"
echo "       TURBO_TOKEN: \$TURBO_TOKEN"
echo "       TURBO_TEAM: \$TURBO_TEAM"
echo ""
echo "Other CI Platforms:"
echo "  Set environment variables TURBO_TOKEN and TURBO_TEAM"
echo ""
echo "Get your Vercel token:"
echo "  1. Visit: https://vercel.com/account/tokens"
echo "  2. Create new token"
echo "  3. Copy and add to CI secrets"
echo ""
echo "Test remote cache:"
echo "  turbo run build    # First run (cold cache)"
echo "  turbo run build    # Second run (should use cache)"
echo ""
echo "✅ Setup complete!"
echo ""

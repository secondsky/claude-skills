#!/bin/bash
# Cloudflare Pages Deployment Helper
# Assists with deploying Nuxt Content to Cloudflare Pages with D1

set -e

echo "☁️  Cloudflare Pages Deployment"
echo "==============================="
echo ""

# Check if we're in a Nuxt project
if [ ! -f "nuxt.config.ts" ]; then
  echo "❌ Error: No nuxt.config.ts found."
  exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "📦 Wrangler CLI not found. Installing..."
  npm install -g wrangler
fi

echo "✅ Wrangler CLI ready"
echo ""

# Login to Cloudflare
echo "🔐 Logging into Cloudflare..."
wrangler login

echo ""
echo "📝 D1 Database Setup"
echo ""
read -p "D1 Database name (default: nuxt-content-db): " DB_NAME
DB_NAME=${DB_NAME:-nuxt-content-db}

# Check if database exists
echo "Checking if database exists..."
if wrangler d1 list | grep -q "$DB_NAME"; then
  echo "✅ Database '$DB_NAME' already exists"
else
  echo "Creating D1 database..."
  wrangler d1 create "$DB_NAME"
  echo "✅ Database created"
fi

echo ""
echo "⚙️  Configuring nuxt.config.ts for Cloudflare..."

# Check if preset is already set
if ! grep -q "preset.*cloudflare" nuxt.config.ts; then
  # Create backup
  cp nuxt.config.ts nuxt.config.ts.backup

  # Add or update nitro preset
  if grep -q "nitro:" nuxt.config.ts; then
    echo "⚠️  Please manually add preset: 'cloudflare_pages' to nitro config"
  else
    cat >> nuxt.config.ts << 'EOF'

  nitro: {
    preset: 'cloudflare_pages'
  }
EOF
    echo "✅ Added Cloudflare Pages preset to nuxt.config.ts"
  fi
fi

echo ""
echo "🏗️  Building for Cloudflare Pages..."
npm run build -- --preset=cloudflare_pages

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed. Please check errors above."
  exit 1
fi

echo ""
echo "🎉 Ready for deployment!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Go to Cloudflare Dashboard → Workers & Pages"
echo "2. Create new Pages project or select existing"
echo "3. Connect your GitHub repository"
echo "4. Build settings:"
echo "   - Build command: npm run build"
echo "   - Build output directory: .output/public"
echo "5. Add D1 binding:"
echo "   - Settings → Functions → D1 Database Bindings"
echo "   - Variable name: DB (must be exactly 'DB')"
echo "   - D1 Database: $DB_NAME"
echo "6. Environment variables (if using Studio):"
echo "   - STUDIO_GITHUB_CLIENT_ID"
echo "   - STUDIO_GITHUB_CLIENT_SECRET"
echo ""
echo "Or deploy directly with Wrangler:"
echo "  wrangler pages deploy .output/public"
echo ""
echo "📚 Resources:"
echo "  - Cloudflare Pages: https://pages.cloudflare.com/"
echo "  - D1 Docs: https://developers.cloudflare.com/d1/"
echo "  - Deployment Guide: skills/nuxt-content/references/deployment-checklists.md"
echo ""

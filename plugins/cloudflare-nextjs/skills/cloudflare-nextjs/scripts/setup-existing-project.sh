#!/bin/bash
# Add OpenNext Cloudflare adapter to existing Next.js project

set -e

echo "🔧 Adding OpenNext Cloudflare adapter to existing Next.js project"
echo ""

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found. Run this script from your Next.js project root."
    exit 1
fi

if ! grep -q "\"next\":" package.json; then
    echo "⚠️  Warning: Next.js doesn't appear to be installed in package.json"
    echo "Are you sure this is a Next.js project?"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install OpenNext adapter
echo "📦 Installing @opennextjs/cloudflare..."
npm install --save-dev @opennextjs/cloudflare

# NOTE: The three `if [ ! -f ... ]; then cat > ...` blocks below have a
# benign TOCTOU window between the existence check and the write. We
# accept this race: the file content is static, so concurrent runs of
# this script in the same project would simply race to write identical
# bytes, leaving the final file in the correct state regardless of which
# run wins. Using mktemp + mv would add atomicity but no functional
# benefit for static content, so we keep the simpler form.

# Create wrangler.jsonc if it doesn't exist
if [ ! -f "wrangler.jsonc" ]; then
    echo "📝 Creating wrangler.jsonc..."
    cat > wrangler.jsonc << 'EOF'
{
  "name": "my-next-app",
  "compatibility_date": "2025-05-05",
  "compatibility_flags": ["nodejs_compat"]
}
EOF
    echo "✅ Created wrangler.jsonc"
else
    echo "ℹ️  wrangler.jsonc already exists - skipping"
fi

# Create open-next.config.ts if it doesn't exist
if [ ! -f "open-next.config.ts" ]; then
    echo "📝 Creating open-next.config.ts..."
    cat > open-next.config.ts << 'EOF'
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Caching configuration (optional)
  // See: https://opennext.js.org/cloudflare/caching
});
EOF
    echo "✅ Created open-next.config.ts"
else
    echo "ℹ️  open-next.config.ts already exists - skipping"
fi

# Create .env with build configuration
if [ ! -f ".env" ]; then
    echo "📝 Creating .env..."
    cat > .env << 'EOF'
# Cloudflare Workers build configuration
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
EOF
    echo "✅ Created .env"
else
    echo "ℹ️  .env already exists - add these if needed:"
    echo "    WRANGLER_BUILD_CONDITIONS=\"\""
    echo "    WRANGLER_BUILD_PLATFORM=\"node\""
fi

# Update package.json scripts
echo ""
echo "📝 Recommended package.json scripts:"
echo ""
cat << 'EOF'
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
EOF

echo ""
read -p "Add these scripts to package.json? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Use npm pkg to add scripts (npm 7.20.0+)
    npm pkg set scripts.preview="opennextjs-cloudflare build && opennextjs-cloudflare preview"
    npm pkg set scripts.deploy="opennextjs-cloudflare build && opennextjs-cloudflare deploy"
    npm pkg set scripts.cf-typegen="wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
    echo "✅ Scripts added to package.json"
else
    echo "⏭️  Skipped - add scripts manually"
fi

# Check for Edge runtime usage
echo ""
echo "🔍 Checking for Edge runtime usage..."
if grep -r "export const runtime = \"edge\"" app/ pages/ 2>/dev/null; then
    echo "⚠️  WARNING: Found Edge runtime exports!"
    echo "   OpenNext Cloudflare adapter requires Node.js runtime."
    echo "   Remove 'export const runtime = \"edge\"' from your files."
else
    echo "✅ No Edge runtime exports found"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review wrangler.jsonc and update 'name' field"
echo "  2. Test in workerd runtime: npm run preview"
echo "  3. Deploy to Cloudflare: npm run deploy"
echo ""
echo "📖 Documentation:"
echo "  - OpenNext Cloudflare: https://opennext.js.org/cloudflare"
echo "  - Cloudflare Guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/"
echo ""

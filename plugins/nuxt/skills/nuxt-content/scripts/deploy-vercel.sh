#!/bin/bash
# Vercel Deployment Helper
# Assists with deploying Nuxt Content to Vercel

set -e

echo "▲ Vercel Deployment"
echo "==================="
echo ""

# Check if we're in a Nuxt project
if [ ! -f "nuxt.config.ts" ]; then
  echo "❌ Error: No nuxt.config.ts found."
  exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "📦 Vercel CLI not found. Installing..."
  npm install -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

# Login to Vercel
echo "🔐 Logging into Vercel..."
vercel login

echo ""
echo "🏗️  Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed. Please check errors above."
  exit 1
fi

echo ""
echo "Would you like to deploy now?"
select yn in "Yes" "No"; do
    case $yn in
        Yes )
            echo ""
            echo "🚀 Deploying to Vercel..."
            vercel --prod
            break;;
        No )
            echo ""
            echo "⏭️  Skipping deployment"
            break;;
    esac
done

echo ""
echo "📋 Vercel Configuration Checklist:"
echo ""
echo "✓ Build Command: npm run build"
echo "✓ Output Directory: .output"
echo "✓ Framework Preset: Nuxt"
echo ""
echo "If using Nuxt Studio, add environment variables:"
echo "  - STUDIO_GITHUB_CLIENT_ID"
echo "  - STUDIO_GITHUB_CLIENT_SECRET"
echo ""
echo "Database Options:"
echo "  1. Default: SQLite at /tmp (zero config)"
echo "  2. Vercel Postgres (create in dashboard)"
echo "  3. Vercel KV (key-value store)"
echo "  4. Vercel Blob (file storage)"
echo ""
echo "To add environment variables:"
echo "  vercel env pull  # Pull from Vercel"
echo "  # Or add in Vercel Dashboard → Settings → Environment Variables"
echo ""
echo "📚 Resources:"
echo "  - Vercel Docs: https://vercel.com/docs"
echo "  - Nuxt on Vercel: https://nuxt.com/deploy/vercel"
echo "  - Deployment Guide: skills/nuxt-content/references/deployment-checklists.md"
echo ""

#!/bin/bash
# Enable Cloudflare Queues
# This script uncomments all Queues patterns in the scaffold

set -e

echo "📬 Enabling Cloudflare Queues..."
echo ""

# Check if we're in a project directory (has package.json)
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Run this script from your project root directory"
  exit 1
fi

# 1. Uncomment backend/src/index.ts - imports
echo "1. Enabling Queues in backend/src/index.ts..."
if [ -f "backend/src/index.ts" ]; then
  sed -i 's/\/\* QUEUES START//' backend/src/index.ts
  sed -i 's/QUEUES END \*\///' backend/src/index.ts
  echo "   ✓ backend/src/index.ts updated"
else
  echo "   ⚠️  backend/src/index.ts not found"
fi

# 2. Uncomment wrangler.jsonc
echo "2. Enabling Queues in wrangler.jsonc..."
if [ -f "wrangler.jsonc" ]; then
  sed -i 's/\/\* QUEUES START//' wrangler.jsonc
  sed -i 's/QUEUES END \*\///' wrangler.jsonc
  echo "   ✓ wrangler.jsonc updated"
else
  echo "   ⚠️  wrangler.jsonc not found"
fi

# 3. Uncomment vite.config.ts
echo "3. Enabling Queues in vite.config.ts..."
if [ -f "vite.config.ts" ]; then
  sed -i 's/\/\* QUEUES START//' vite.config.ts
  sed -i 's/QUEUES END \*\///' vite.config.ts
  echo "   ✓ vite.config.ts updated"
else
  echo "   ⚠️  vite.config.ts not found"
fi

echo ""
echo "✅ Cloudflare Queues enabled!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create your queue (local development):"
echo "   This happens automatically with 'npm run dev'"
echo ""
echo "2. Create your queue (production):"
echo "   npx wrangler queues create my-app-queue"
echo ""
echo "3. (Optional) Create dead letter queue:"
echo "   npx wrangler queues create my-app-dlq"
echo ""
echo "4. Update queue name in wrangler.jsonc if needed"
echo "   (default: my-app-queue)"
echo ""
echo "5. Restart your dev server:"
echo "   npm run dev"
echo ""
echo "6. Test queues at:"
echo "   POST /api/queues/send"
echo "   POST /api/queues/send-delayed"
echo "   POST /api/queues/send-batch"
echo ""
echo "📖 Documentation:"
echo "   - backend/routes/queues.ts (example routes)"
echo "   - https://developers.cloudflare.com/queues/"
echo ""

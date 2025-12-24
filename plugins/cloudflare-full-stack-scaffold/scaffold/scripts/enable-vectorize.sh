#!/bin/bash
# Enable Cloudflare Vectorize
# This script uncomments all Vectorize patterns in the scaffold

set -e

echo "🔍 Enabling Cloudflare Vectorize..."
echo ""

# Check if we're in a project directory (has package.json)
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Run this script from your project root directory"
  exit 1
fi

# 1. Uncomment backend/src/index.ts - imports
echo "1. Enabling Vectorize in backend/src/index.ts..."
if [ -f "backend/src/index.ts" ]; then
  sed -i 's/\/\* VECTORIZE START//' backend/src/index.ts
  sed -i 's/VECTORIZE END \*\///' backend/src/index.ts
  echo "   ✓ backend/src/index.ts updated"
else
  echo "   ⚠️  backend/src/index.ts not found"
fi

# 2. Uncomment wrangler.jsonc
echo "2. Enabling Vectorize in wrangler.jsonc..."
if [ -f "wrangler.jsonc" ]; then
  sed -i 's/\/\* VECTORIZE START//' wrangler.jsonc
  sed -i 's/VECTORIZE END \*\///' wrangler.jsonc
  echo "   ✓ wrangler.jsonc updated"
else
  echo "   ⚠️  wrangler.jsonc not found"
fi

# 3. Uncomment vite.config.ts
echo "3. Enabling Vectorize in vite.config.ts..."
if [ -f "vite.config.ts" ]; then
  sed -i 's/\/\* VECTORIZE START//' vite.config.ts
  sed -i 's/VECTORIZE END \*\///' vite.config.ts
  echo "   ✓ vite.config.ts updated"
else
  echo "   ⚠️  vite.config.ts not found"
fi

echo ""
echo "✅ Cloudflare Vectorize enabled!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create your vector index (production):"
echo "   npx wrangler vectorize create my-app-index \\"
echo "     --dimensions=768 \\"
echo "     --metric=cosine"
echo ""
echo "2. Update index configuration in wrangler.jsonc:"
echo "   - index_name: my-app-index (must match created index)"
echo "   - dimensions: depends on your embedding model"
echo "     • Workers AI @cf/baai/bge-base-en-v1.5: 768"
echo "     • OpenAI text-embedding-3-small: 1536"
echo "     • OpenAI text-embedding-3-large: 3072"
echo ""
echo "3. (Note) Local development:"
echo "   Vectorize uses production index (no local simulator)"
echo "   Make sure index is created before testing"
echo ""
echo "4. Restart your dev server:"
echo "   npm run dev"
echo ""
echo "5. Test Vectorize at:"
echo "   POST /api/vectorize/insert  (add embeddings)"
echo "   POST /api/vectorize/query   (search similar)"
echo "   GET  /api/vectorize/rag     (RAG example)"
echo ""
echo "📖 Documentation:"
echo "   - backend/routes/vectorize.ts (example routes)"
echo "   - https://developers.cloudflare.com/vectorize/"
echo ""
echo "💡 Common Use Cases:"
echo "   - Semantic search"
echo "   - RAG (Retrieval Augmented Generation)"
echo "   - Recommendation systems"
echo "   - Content similarity matching"
echo ""

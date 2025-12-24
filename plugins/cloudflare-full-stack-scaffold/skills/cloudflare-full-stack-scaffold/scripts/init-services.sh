#!/bin/bash
# Initialize core Cloudflare services

set -e

echo "Initializing core Cloudflare services..."
echo ""

# D1 Database
echo "Creating D1 database..."
npx wrangler d1 create my-app-db
echo "→ Copy the database_id to wrangler.jsonc"
echo ""

# KV Namespace
echo "Creating KV namespace..."
npx wrangler kv:namespace create my-app-kv
echo "→ Copy the id to wrangler.jsonc"
echo ""

# R2 Bucket
echo "Creating R2 bucket..."
npx wrangler r2 bucket create my-app-bucket
echo "✓ R2 bucket created (bucket_name already in wrangler.jsonc)"
echo ""

echo "✓ Core services created!"
echo ""
echo "📝 Optional services (enable if needed):"
echo "  - Queues: npm run enable-queues (then create with wrangler)"
echo "  - Vectorize: npm run enable-vectorize (then create with wrangler)"
echo "  - Clerk Auth: npm run enable-auth"
echo "  - AI Chat: npm run enable-ai-chat"
echo ""
echo "Next steps:"
echo "  1. Update wrangler.jsonc with the database_id and kv id from above"
echo "  2. Run: npm run d1:local (to create database tables)"
echo "  3. Run: npm run dev"

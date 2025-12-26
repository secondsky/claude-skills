#!/bin/bash
# Generate a secure BETTER_AUTH_SECRET
# Usage: ./generate-secret.sh

set -e

# Generate 32-byte random secret
SECRET=$(openssl rand -base64 32)

echo "Generated BETTER_AUTH_SECRET:"
echo ""
echo "  $SECRET"
echo ""
echo "For Cloudflare Workers, run:"
echo "  wrangler secret put BETTER_AUTH_SECRET"
echo ""
echo "For local development, add to .dev.vars:"
echo "  BETTER_AUTH_SECRET=$SECRET"
echo ""
echo "For other environments, add to .env:"
echo "  BETTER_AUTH_SECRET=$SECRET"

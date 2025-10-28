#!/bin/bash

#
# Cloudflare Access Service Token Creation Helper
#
# This script provides guidance for creating and configuring Access service tokens.
# It generates setup instructions and code templates.
#
# Note: This script does NOT create tokens via API (must be done in dashboard).
# It provides step-by-step instructions and code templates.
#
# Usage:
#   ./create-service-token.sh [token-name] [team-domain]
#
# Examples:
#   ./create-service-token.sh
#   ./create-service-token.sh "backend-api-service"
#   ./create-service-token.sh "github-actions" "my-team.cloudflareaccess.com"
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print colored output
print_header() {
  echo -e "${BOLD}${BLUE}=== $1 ===${NC}"
}

print_step() {
  echo -e "${GREEN}$1${NC}"
}

print_info() {
  echo -e "${CYAN}ℹ  $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠  $1${NC}"
}

print_code() {
  echo -e "${BOLD}$1${NC}"
}

# Main function
main() {
  clear
  echo
  print_header "Cloudflare Access Service Token Setup Guide"
  echo

  # Get token name from argument or prompt
  if [ -n "$1" ]; then
    TOKEN_NAME="$1"
  else
    echo -n "Enter service token name (e.g., 'backend-api-service'): "
    read -r TOKEN_NAME
  fi

  # Get team domain from argument or prompt
  if [ -n "$2" ]; then
    TEAM_DOMAIN="$2"
  else
    echo -n "Enter your Access team domain (e.g., 'my-team.cloudflareaccess.com'): "
    read -r TEAM_DOMAIN
  fi

  echo
  print_header "Service Token: $TOKEN_NAME"
  echo

  # Step 1: Create token in dashboard
  print_step "STEP 1: Create Service Token in Cloudflare Dashboard"
  echo
  echo "1. Go to: https://one.dash.cloudflare.com/"
  echo "2. Navigate to: Zero Trust > Access > Service Auth"
  echo "3. Click: 'Create Service Token'"
  echo "4. Name: $TOKEN_NAME"
  echo "5. Duration: Choose expiration (recommended: 1 year)"
  echo "6. Click: 'Create'"
  echo
  print_warning "IMPORTANT: Copy both Client ID and Client Secret - they're shown only once!"
  echo
  echo "Press Enter when you've created the token and copied the credentials..."
  read -r

  # Step 2: Add to Access policy
  echo
  print_step "STEP 2: Add Service Token to Access Policy"
  echo
  echo "1. Go to: Zero Trust > Access > Applications"
  echo "2. Click on your application (or create new one)"
  echo "3. Edit your policy (or create new policy)"
  echo "4. Under 'Include', click 'Add include'"
  echo "5. Select: 'Service Auth'"
  echo "6. Choose: '$TOKEN_NAME' from dropdown"
  echo "7. Click: 'Save'"
  echo
  echo "Press Enter when you've added the token to your policy..."
  read -r

  # Step 3: Store credentials securely
  echo
  print_step "STEP 3: Store Credentials Securely"
  echo
  echo "Choose your environment:"
  echo
  echo "Option 1: Wrangler Secrets (Production - Recommended)"
  print_code "  npx wrangler secret put SERVICE_TOKEN_ID"
  echo "  # Enter: <your-client-id>.access"
  echo
  print_code "  npx wrangler secret put SERVICE_TOKEN_SECRET"
  echo "  # Enter: <your-client-secret>"
  echo
  echo "Option 2: Environment Variables (Local Development)"
  echo "  Add to .env.local:"
  print_code "  SERVICE_TOKEN_ID=<your-client-id>.access"
  print_code "  SERVICE_TOKEN_SECRET=<your-client-secret>"
  echo
  print_warning "Never commit .env.local to git!"
  echo "  echo '.env.local' >> .gitignore"
  echo
  echo "Press Enter to continue..."
  read -r

  # Step 4: Code examples
  echo
  print_step "STEP 4: Use Service Token in Your Code"
  echo

  # Worker code example
  print_header "Worker Code Example (TypeScript)"
  echo
  cat << 'EOF'
// Client Worker calling another Access-protected Worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Call protected API with service token
    const response = await fetch('https://api.example.com/data', {
      headers: {
        'CF-Access-Client-Id': env.SERVICE_TOKEN_ID,
        'CF-Access-Client-Secret': env.SERVICE_TOKEN_SECRET,
      },
    })

    return response
  },
}

// Type definition
interface Env {
  SERVICE_TOKEN_ID: string
  SERVICE_TOKEN_SECRET: string
}
EOF

  echo
  echo "Press Enter to see more examples..."
  read -r

  # curl example
  echo
  print_header "Testing with curl"
  echo
  cat << EOF
curl -H "CF-Access-Client-Id: <your-client-id>.access" \\
     -H "CF-Access-Client-Secret: <your-client-secret>" \\
     https://${TEAM_DOMAIN}/your-protected-path
EOF

  echo
  echo "Press Enter to see Node.js example..."
  read -r

  # Node.js example
  echo
  print_header "Node.js Example"
  echo
  cat << 'EOF'
// Using fetch
async function callProtectedAPI() {
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'CF-Access-Client-Id': process.env.SERVICE_TOKEN_ID,
      'CF-Access-Client-Secret': process.env.SERVICE_TOKEN_SECRET,
    },
  })

  return response.json()
}

// Using axios
const axios = require('axios')

const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'CF-Access-Client-Id': process.env.SERVICE_TOKEN_ID,
    'CF-Access-Client-Secret': process.env.SERVICE_TOKEN_SECRET,
  },
})

const data = await api.get('/data')
EOF

  echo
  echo "Press Enter to see Python example..."
  read -r

  # Python example
  echo
  print_header "Python Example"
  echo
  cat << 'EOF'
import os
import requests

headers = {
    'CF-Access-Client-Id': os.getenv('SERVICE_TOKEN_ID'),
    'CF-Access-Client-Secret': os.getenv('SERVICE_TOKEN_SECRET'),
}

response = requests.get('https://api.example.com/data', headers=headers)
data = response.json()
EOF

  echo
  echo "Press Enter to see GitHub Actions example..."
  read -r

  # GitHub Actions example
  echo
  print_header "GitHub Actions Workflow Example"
  echo
  cat << 'EOF'
name: Deploy and Sync

on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger API Sync
        env:
          SERVICE_TOKEN_ID: ${{ secrets.CF_ACCESS_CLIENT_ID }}
          SERVICE_TOKEN_SECRET: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
        run: |
          curl -X POST \
            -H "CF-Access-Client-Id: $SERVICE_TOKEN_ID" \
            -H "CF-Access-Client-Secret: $SERVICE_TOKEN_SECRET" \
            https://api.example.com/admin/sync

# Add secrets to GitHub repo:
# Settings > Secrets and variables > Actions > New repository secret
# CF_ACCESS_CLIENT_ID: <your-client-id>.access
# CF_ACCESS_CLIENT_SECRET: <your-client-secret>
EOF

  echo
  echo
  print_header "Best Practices"
  echo
  echo "✓ Use descriptive token names (e.g., 'github-actions', 'backend-service')"
  echo "✓ One token per service (don't share across services)"
  echo "✓ Set expiration and rotate regularly (quarterly recommended)"
  echo "✓ Store credentials in secrets manager, not git"
  echo "✓ Monitor token usage in Access logs"
  echo "✓ Revoke unused tokens promptly"
  echo

  print_header "Security Checklist"
  echo
  echo "□ Token created in dashboard"
  echo "□ Token added to Access policy"
  echo "□ Credentials stored securely (Wrangler secrets or env vars)"
  echo "□ .env.local added to .gitignore"
  echo "□ Test token with curl or code example"
  echo "□ Monitor Access logs for token usage"
  echo "□ Set calendar reminder for token rotation (3-6 months)"
  echo

  print_header "Troubleshooting"
  echo
  echo "Problem: 401 Unauthorized"
  echo "  → Check token is added to Access policy"
  echo "  → Verify correct header names (CF-Access-Client-Id, CF-Access-Client-Secret)"
  echo "  → Check token hasn't expired"
  echo "  → Test with curl to isolate issue"
  echo
  echo "Problem: Token not in policy dropdown"
  echo "  → Refresh the page"
  echo "  → Verify token exists in Service Auth page"
  echo "  → Try different browser"
  echo

  print_header "Additional Resources"
  echo
  echo "Cloudflare Docs:"
  echo "  https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/"
  echo
  echo "Dashboard Links:"
  echo "  Service Tokens: https://one.dash.cloudflare.com/ > Zero Trust > Access > Service Auth"
  echo "  Applications: https://one.dash.cloudflare.com/ > Zero Trust > Access > Applications"
  echo "  Logs: https://one.dash.cloudflare.com/ > Zero Trust > Logs > Access"
  echo

  print_info "Setup guide complete! Your service token '$TOKEN_NAME' is ready to use."
  echo
}

# Run main function
main "$@"

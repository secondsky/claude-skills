#!/bin/bash

# Nuxt Studio OAuth Configuration Tester
# Tests OAuth environment variables setup

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ISSUES_FOUND=false

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}Nuxt Studio OAuth Configuration Tester${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    ISSUES_FOUND=true
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check for .env file
ENV_FILE=""
if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -z "$ENV_FILE" ]; then
    warning "No .env or .env.local file found"
    info "For local testing, create .env.local with OAuth credentials"
    echo ""
    info "Testing environment variables from shell..."
    echo ""
else
    success "Found $ENV_FILE"
    echo ""

    # Source the env file with error handling
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE" || {
            error "Failed to source $ENV_FILE"
            exit 1
        }
        set +a
    fi
fi

# Function to test OAuth provider
test_provider() {
    local PROVIDER=$1
    local CLIENT_ID_VAR=$2
    local CLIENT_SECRET_VAR=$3
    local SERVER_URL_VAR=$4

    echo "Testing $PROVIDER OAuth..."

    # Check CLIENT_ID
    if [ ! -z "${!CLIENT_ID_VAR}" ]; then
        # Mask the client ID for security (show first/last 4 chars)
        MASKED_ID="${!CLIENT_ID_VAR:0:4}...${!CLIENT_ID_VAR: -4}"
        success "$CLIENT_ID_VAR is set ($MASKED_ID)"
    else
        warning "$CLIENT_ID_VAR is not set"
        info "Set $CLIENT_ID_VAR in $ENV_FILE or environment"
        return
    fi

    # Check CLIENT_SECRET
    if [ ! -z "${!CLIENT_SECRET_VAR}" ]; then
        success "$CLIENT_SECRET_VAR is set (masked for security)"

        # Basic validation: secret should be reasonably long
        SECRET="${!CLIENT_SECRET_VAR}"
        SECRET_LENGTH=${#SECRET}
        if [ $SECRET_LENGTH -lt 20 ]; then
            warning "$CLIENT_SECRET_VAR seems too short ($SECRET_LENGTH chars)"
            info "OAuth secrets are typically 40+ characters"
        fi
    else
        error "$CLIENT_SECRET_VAR is not set"
        info "Set $CLIENT_SECRET_VAR in $ENV_FILE or environment"
        return
    fi

    # Check server URL (for GitLab)
    if [ ! -z "$SERVER_URL_VAR" ]; then
        if [ ! -z "${!SERVER_URL_VAR}" ]; then
            success "$SERVER_URL_VAR is set (${!SERVER_URL_VAR})"

            # Validate URL format
            if [[ ${!SERVER_URL_VAR} =~ ^https?:// ]]; then
                success "Server URL format is valid"
            else
                error "Server URL should start with http:// or https://"
            fi
        fi
    fi

    echo ""
}

# Test GitHub OAuth
test_provider "GitHub" "NUXT_OAUTH_GITHUB_CLIENT_ID" "NUXT_OAUTH_GITHUB_CLIENT_SECRET"

# Test GitLab OAuth
test_provider "GitLab" "NUXT_OAUTH_GITLAB_CLIENT_ID" "NUXT_OAUTH_GITLAB_CLIENT_SECRET" "NUXT_OAUTH_GITLAB_SERVER_URL"

# Test Google OAuth
test_provider "Google" "NUXT_OAUTH_GOOGLE_CLIENT_ID" "NUXT_OAUTH_GOOGLE_CLIENT_SECRET"

# Check public Studio URL
echo "Checking public Studio URL..."

if [ ! -z "$NUXT_PUBLIC_STUDIO_URL" ]; then
    success "NUXT_PUBLIC_STUDIO_URL is set ($NUXT_PUBLIC_STUDIO_URL)"

    # Validate URL format
    if [[ $NUXT_PUBLIC_STUDIO_URL =~ ^https?:// ]]; then
        success "Studio URL format is valid"

        # Check protocol
        if [[ $NUXT_PUBLIC_STUDIO_URL =~ ^https:// ]]; then
            success "Using HTTPS (recommended for production)"
        else
            warning "Using HTTP (only for local development)"
            info "Use HTTPS for production deployments"
        fi
    else
        error "Studio URL should start with http:// or https://"
    fi

    # Check for localhost
    if [[ $NUXT_PUBLIC_STUDIO_URL =~ localhost ]]; then
        info "Using localhost (development mode)"
    else
        info "Using production URL: $NUXT_PUBLIC_STUDIO_URL"

        # Suggest subdomain check
        if [[ ! $NUXT_PUBLIC_STUDIO_URL =~ studio\. ]] && [[ ! $NUXT_PUBLIC_STUDIO_URL =~ cms\. ]]; then
            warning "URL doesn't use common Studio subdomain (studio. or cms.)"
            info "Consider using studio.yourdomain.com for clarity"
        fi
    fi
else
    warning "NUXT_PUBLIC_STUDIO_URL is not set"
    info "Set to http://localhost:3000 for local development"
    info "Set to https://studio.yourdomain.com for production"
fi

echo ""

# Summary and guidance
echo -e "${BLUE}===================================${NC}"

if [ "$ISSUES_FOUND" = true ]; then
    echo -e "${RED}✗ Issues found with OAuth configuration${NC}"
    echo ""
    echo "Please address the issues above."
    echo ""
    echo "Quick fix:"
    echo "1. Create .env.local file in project root"
    echo "2. Add your OAuth credentials:"
    echo ""
    echo "   NUXT_OAUTH_GITHUB_CLIENT_ID=your_client_id"
    echo "   NUXT_OAUTH_GITHUB_CLIENT_SECRET=your_client_secret"
    echo "   NUXT_PUBLIC_STUDIO_URL=http://localhost:3000"
    echo ""
    echo "3. Restart your dev server"
    echo ""
    echo "For detailed setup, see references/oauth-providers.md"
    exit 1
else
    PROVIDER_COUNT=0

    [ ! -z "$NUXT_OAUTH_GITHUB_CLIENT_ID" ] && PROVIDER_COUNT=$((PROVIDER_COUNT + 1))
    [ ! -z "$NUXT_OAUTH_GITLAB_CLIENT_ID" ] && PROVIDER_COUNT=$((PROVIDER_COUNT + 1))
    [ ! -z "$NUXT_OAUTH_GOOGLE_CLIENT_ID" ] && PROVIDER_COUNT=$((PROVIDER_COUNT + 1))

    if [ $PROVIDER_COUNT -eq 0 ]; then
        echo -e "${YELLOW}⚠ No OAuth providers configured${NC}"
        echo ""
        echo "OAuth is required for production Studio deployment."
        echo ""
        echo "To set up OAuth:"
        echo "1. Choose a provider (GitHub, GitLab, or Google)"
        echo "2. Create an OAuth application"
        echo "3. Set environment variables"
        echo "4. Configure callback URLs"
        echo ""
        echo "See references/oauth-providers.md for detailed setup."
        exit 0
    else
        echo -e "${GREEN}✓ OAuth configuration looks good!${NC}"
        echo ""
        echo "Configured providers: $PROVIDER_COUNT"
        echo ""
        echo "Next steps:"
        echo "1. Verify OAuth callback URLs match deployment URL"
        echo "2. Test authentication:"
        echo "   - Start dev server: npm run dev"
        echo "   - Visit: http://localhost:3000/_studio"
        echo "   - Click 'Sign in with [Provider]'"
        echo "3. Check browser console for errors"
        echo ""
        echo "For production deployment:"
        echo "- Set environment variables on deployment platform"
        echo "- Update OAuth callback URLs to production URL"
        echo "- Test authentication thoroughly"
        exit 0
    fi
fi

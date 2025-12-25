#!/bin/bash

# Nuxt Studio Prerequisites Checker
# Verifies system requirements and dependencies for Nuxt Studio setup

set -u -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
ALL_CHECKS_PASSED=true

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Nuxt Studio Prerequisites Checker${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Function to print success message
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error message
error() {
    echo -e "${RED}✗${NC} $1"
    ALL_CHECKS_PASSED=false
}

# Function to print warning message
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print info message
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check Node.js version
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

    if [ $MAJOR_VERSION -ge 18 ]; then
        success "Node.js v$NODE_VERSION (>= 18.x required)"
    else
        error "Node.js v$NODE_VERSION found, but >= 18.x required"
        info "Install latest Node.js from https://nodejs.org/"
    fi
else
    error "Node.js not found"
    info "Install Node.js from https://nodejs.org/"
fi

echo ""

# Check package manager
echo "Checking package manager..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    success "npm v$NPM_VERSION installed"
elif command -v bun &> /dev/null; then
    BUN_VERSION=$(bun -v)
    success "bun v$BUN_VERSION installed"
elif command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    success "pnpm v$PNPM_VERSION installed"
else
    error "No package manager found (npm, bun, or pnpm)"
fi

echo ""

# Check if in Nuxt project
echo "Checking Nuxt project..."
if [ -f "package.json" ]; then
    success "package.json found"

    # Check for Nuxt dependency
    if grep -q "\"nuxt\"" package.json; then
        NUXT_VERSION=$(grep "\"nuxt\"" package.json | sed 's/.*": "//;s/".*//' | sed 's/[\^~]//g')
        success "Nuxt dependency found (version: $NUXT_VERSION)"

        # Check Nuxt version
        MAJOR=$(echo $NUXT_VERSION | cut -d'.' -f1)
        if [ "$MAJOR" -ge 3 ]; then
            success "Nuxt version is >= 3.x (required for Studio)"
        else
            error "Nuxt version is < 3.x. Nuxt Studio requires Nuxt >= 3.x"
            info "Upgrade Nuxt: npm install nuxt@latest"
        fi
    else
        error "Nuxt dependency not found in package.json"
        info "Install Nuxt: npx nuxi@latest init"
    fi
else
    error "package.json not found. Are you in a Nuxt project directory?"
fi

echo ""

# Check for @nuxt/content
echo "Checking @nuxt/content..."
if [ -f "package.json" ]; then
    if grep -q "\"@nuxt/content\"" package.json; then
        CONTENT_VERSION=$(grep "\"@nuxt/content\"" package.json | sed 's/.*": "//;s/".*//' | sed 's/[\^~]//g')
        success "@nuxt/content found (version: $CONTENT_VERSION)"

        # Check content version
        MAJOR=$(echo $CONTENT_VERSION | cut -d'.' -f1)
        if [ "$MAJOR" -ge 2 ]; then
            success "@nuxt/content version is >= 2.x (required for Studio)"
        else
            error "@nuxt/content version is < 2.x. Studio requires >= 2.x"
            info "Upgrade: npx nuxi@latest module add content"
        fi
    else
        warning "@nuxt/content not found in package.json"
        info "Install @nuxt/content: npx nuxi@latest module add content"
    fi
fi

echo ""

# Check for @nuxt/studio
echo "Checking @nuxt/studio..."
if [ -f "package.json" ]; then
    if grep -q "\"@nuxt/studio\"" package.json; then
        STUDIO_VERSION=$(grep "\"@nuxt/studio\"" package.json | sed 's/.*": "//;s/".*//' | sed 's/[\^~]//g')
        success "@nuxt/studio found (version: $STUDIO_VERSION)"
    else
        warning "@nuxt/studio not found in package.json"
        info "Install @nuxt/studio: npx nuxi@latest module add nuxt-studio@beta"
    fi
fi

echo ""

# Check nuxt.config.ts
echo "Checking nuxt.config.ts..."
if [ -f "nuxt.config.ts" ] || [ -f "nuxt.config.js" ]; then
    CONFIG_FILE="nuxt.config.ts"
    [ -f "nuxt.config.js" ] && CONFIG_FILE="nuxt.config.js"

    success "$CONFIG_FILE found"

    # Check if @nuxt/content is in modules
    if grep -q "@nuxt/content" $CONFIG_FILE; then
        success "@nuxt/content configured in modules"
    else
        warning "@nuxt/content not found in modules array"
        info "Add '@nuxt/content' to modules array in $CONFIG_FILE"
    fi

    # Check if @nuxt/studio is in modules
    if grep -q "@nuxt/studio" $CONFIG_FILE; then
        success "@nuxt/studio configured in modules"
    else
        warning "@nuxt/studio not found in modules array"
        info "Add '@nuxt/studio' to modules array in $CONFIG_FILE"
    fi
else
    error "nuxt.config.ts not found"
    info "Create nuxt.config.ts in project root"
fi

echo ""

# Check content directory
echo "Checking content directory..."
if [ -d "content" ]; then
    success "content/ directory exists"

    # Count files in content directory
    FILE_COUNT=$(find content -type f | wc -l | tr -d ' ')
    if [ $FILE_COUNT -gt 0 ]; then
        success "Found $FILE_COUNT file(s) in content/"
    else
        warning "content/ directory is empty"
        info "Add some .md files to test Studio"
    fi
else
    warning "content/ directory not found"
    info "Create content/ directory: mkdir content"
fi

echo ""

# Check Git
echo "Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    success "Git v$GIT_VERSION installed"

    # Check if in git repository
    if git rev-parse --git-dir &> /dev/null; then
        success "Git repository initialized"

        # Check for remote
        if git remote -v &> /dev/null 2>&1; then
            REMOTE_COUNT=$(git remote | wc -l | tr -d ' ')
            if [ $REMOTE_COUNT -gt 0 ]; then
                success "Git remote configured"
            else
                warning "No Git remote configured"
                info "Add remote for Studio Git integration"
            fi
        fi
    else
        warning "Not a Git repository"
        info "Initialize Git: git init"
        info "Studio requires Git for content persistence"
    fi
else
    error "Git not found"
    info "Install Git from https://git-scm.com/"
    info "Studio requires Git for content persistence"
fi

echo ""

# Check for OAuth environment variables (optional)
echo "Checking OAuth environment variables (optional)..."
ENV_FOUND=false

if [ -f ".env" ] || [ -f ".env.local" ]; then
    ENV_FILE=".env"
    [ -f ".env.local" ] && ENV_FILE=".env.local"

    success "$ENV_FILE file found"

    # Check for GitHub OAuth
    if grep -q "NUXT_OAUTH_GITHUB_CLIENT_ID" $ENV_FILE; then
        success "GitHub OAuth configured in $ENV_FILE"
        ENV_FOUND=true
    fi

    # Check for GitLab OAuth
    if grep -q "NUXT_OAUTH_GITLAB_CLIENT_ID" $ENV_FILE; then
        success "GitLab OAuth configured in $ENV_FILE"
        ENV_FOUND=true
    fi

    # Check for Google OAuth
    if grep -q "NUXT_OAUTH_GOOGLE_CLIENT_ID" $ENV_FILE; then
        success "Google OAuth configured in $ENV_FILE"
        ENV_FOUND=true
    fi

    if [ "$ENV_FOUND" = false ]; then
        warning "No OAuth providers configured in $ENV_FILE"
        info "Configure OAuth for production deployment"
    fi
else
    info "No .env file found (optional for local development)"
    info "Create .env for OAuth credentials"
fi

echo ""
echo -e "${BLUE}==================================${NC}"

# Final summary
if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All required checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Visit: http://localhost:3000/_studio"
    echo "3. Start editing content!"
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please address the errors above before proceeding."
    echo "Refer to references/troubleshooting.md for help."
    exit 1
fi

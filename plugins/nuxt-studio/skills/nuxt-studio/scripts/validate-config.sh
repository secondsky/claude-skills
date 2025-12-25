#!/bin/bash

# Nuxt Studio Configuration Validator
# Validates nuxt.config.ts for correct Studio setup

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ALL_VALID=true

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}Nuxt Studio Configuration Validator${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    ALL_VALID=false
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Determine config file
CONFIG_FILE=""
if [ -f "nuxt.config.ts" ]; then
    CONFIG_FILE="nuxt.config.ts"
elif [ -f "nuxt.config.js" ]; then
    CONFIG_FILE="nuxt.config.js"
else
    error "nuxt.config.ts or nuxt.config.js not found"
    echo ""
    info "Create nuxt.config.ts in project root"
    exit 1
fi

success "Found $CONFIG_FILE"
echo ""

# Check modules array
echo "Checking modules configuration..."

if grep -q "modules:" "$CONFIG_FILE"; then
    success "modules array found"

    # Check @nuxt/content
    if grep -A 20 "modules:" "$CONFIG_FILE" | grep -q "@nuxt/content"; then
        success "@nuxt/content in modules"
    else
        error "@nuxt/content not in modules array"
        info "Add '@nuxt/content' to modules"
    fi

    # Check @nuxt/studio
    if grep -A 20 "modules:" "$CONFIG_FILE" | grep -q "@nuxt/studio"; then
        success "@nuxt/studio in modules"
    else
        warning "@nuxt/studio not in modules array"
        info "Add '@nuxt/studio' to modules"
    fi

    # Check module order (content should come before studio)
    CONTENT_LINE=$(grep -n "@nuxt/content" "$CONFIG_FILE" | head -1 | cut -d':' -f1)
    STUDIO_LINE=$(grep -n "@nuxt/studio" "$CONFIG_FILE" | head -1 | cut -d':' -f1)

    if [ ! -z "$CONTENT_LINE" ] && [ ! -z "$STUDIO_LINE" ]; then
        if [ $CONTENT_LINE -lt $STUDIO_LINE ]; then
            success "Module order correct (@nuxt/content before @nuxt/studio)"
        else
            warning "@nuxt/content should come before @nuxt/studio in modules array"
        fi
    fi
else
    error "modules array not found"
    info "Add modules array to $CONFIG_FILE"
fi

echo ""

# Check Nitro preset for Cloudflare
echo "Checking Nitro configuration..."

if grep -q "nitro:" "$CONFIG_FILE"; then
    success "nitro configuration found"

    if grep -A 10 "nitro:" "$CONFIG_FILE" | grep -q "preset:"; then
        PRESET=$(grep -A 10 "nitro:" "$CONFIG_FILE" | grep "preset:" | sed "s/.*preset:[  '\"]*//;s/['\",].*//")

        if [ "$PRESET" = "cloudflare-pages" ] || [ "$PRESET" = "cloudflare" ]; then
            success "Cloudflare preset configured: $PRESET"
        else
            warning "Nitro preset is '$PRESET' (not Cloudflare)"
            info "For Cloudflare deployment, set preset to 'cloudflare-pages' or 'cloudflare'"
        fi
    else
        warning "No nitro preset configured"
        info "Set nitro.preset for deployment platform"
    fi
else
    warning "No nitro configuration found"
    info "Add nitro config for deployment optimization"
fi

echo ""

# Check content configuration
echo "Checking content configuration..."

if grep -q "content:" "$CONFIG_FILE"; then
    success "content configuration found"

    # Check for experimental.clientDB (recommended for Studio)
    if grep -A 20 "content:" "$CONFIG_FILE" | grep -q "clientDB"; then
        success "experimental.clientDB configured (recommended for Studio)"
    else
        warning "experimental.clientDB not configured"
        info "Add content.experimental.clientDB: true for MDC components in Studio"
    fi
else
    warning "No content configuration found (using defaults)"
    info "Add content config for customization"
fi

echo ""

# Check studio configuration
echo "Checking studio configuration..."

if grep -q "studio:" "$CONFIG_FILE"; then
    success "studio configuration found"

    # Check editor config
    if grep -A 20 "studio:" "$CONFIG_FILE" | grep -q "editor:"; then
        success "editor configuration found"

        # Check default editor
        if grep -A 30 "studio:" "$CONFIG_FILE" | grep -q "default:"; then
            DEFAULT_EDITOR=$(grep -A 30 "studio:" "$CONFIG_FILE" | grep "default:" | sed "s/.*default:[  '\"]*//;s/['\",].*//")

            if [ "$DEFAULT_EDITOR" = "tiptap" ] || [ "$DEFAULT_EDITOR" = "monaco" ] || [ "$DEFAULT_EDITOR" = "form" ]; then
                success "Valid default editor: $DEFAULT_EDITOR"
            else
                error "Invalid default editor: $DEFAULT_EDITOR"
                info "Valid options: 'tiptap', 'monaco', 'form'"
            fi
        else
            info "No default editor set (will use 'tiptap' by default)"
        fi
    else
        info "No editor configuration (using Studio defaults)"
    fi

    # Check Git config
    if grep -A 20 "studio:" "$CONFIG_FILE" | grep -q "git:"; then
        success "git configuration found"
    else
        info "No git configuration (Studio will use defaults)"
    fi
else
    info "No studio configuration (using defaults)"
    info "Add studio config for customization"
fi

echo ""

# Check runtime config for OAuth
echo "Checking runtime configuration..."

if grep -q "runtimeConfig:" "$CONFIG_FILE"; then
    success "runtimeConfig found"

    # Check for OAuth config
    if grep -A 30 "runtimeConfig:" "$CONFIG_FILE" | grep -q "oauth:"; then
        success "oauth configuration found"

        # Check for GitHub
        if grep -A 40 "runtimeConfig:" "$CONFIG_FILE" | grep -q "github:"; then
            success "GitHub OAuth configured"
        fi

        # Check for GitLab
        if grep -A 40 "runtimeConfig:" "$CONFIG_FILE" | grep -q "gitlab:"; then
            success "GitLab OAuth configured"
        fi

        # Check for Google
        if grep -A 40 "runtimeConfig:" "$CONFIG_FILE" | grep -q "google:"; then
            success "Google OAuth configured"
        fi
    else
        warning "No OAuth configuration found"
        info "Add OAuth config for production authentication"
    fi

    # Check for public.studioUrl
    if grep -A 30 "runtimeConfig:" "$CONFIG_FILE" | grep -q "studioUrl"; then
        success "public.studioUrl configured"
    else
        warning "public.studioUrl not configured"
        info "Add NUXT_PUBLIC_STUDIO_URL to runtimeConfig.public"
    fi
else
    warning "No runtimeConfig found"
    info "Add runtimeConfig for OAuth and public variables"
fi

echo ""

# Check TypeScript strict mode (recommended)
echo "Checking TypeScript configuration..."

if grep -q "typescript:" "$CONFIG_FILE"; then
    if grep -A 5 "typescript:" "$CONFIG_FILE" | grep -q "strict: true"; then
        success "TypeScript strict mode enabled (recommended)"
    else
        info "TypeScript strict mode not enabled"
        info "Enable for better type safety: typescript.strict: true"
    fi
else
    info "No TypeScript configuration (using defaults)"
fi

echo ""
echo -e "${BLUE}===================================${NC}"

# Final summary
if [ "$ALL_VALID" = true ]; then
    echo -e "${GREEN}✓ Configuration validation passed!${NC}"
    echo ""
    echo "Your nuxt.config.ts is properly configured for Studio."
    echo ""
    echo "Optional improvements:"
    echo "- Add OAuth configuration for production"
    echo "- Configure editor preferences"
    echo "- Set up Git author info"
    exit 0
else
    echo -e "${RED}✗ Configuration has errors${NC}"
    echo ""
    echo "Please fix the errors above."
    echo "Refer to templates/nuxt.config.ts for a complete example."
    exit 1
fi

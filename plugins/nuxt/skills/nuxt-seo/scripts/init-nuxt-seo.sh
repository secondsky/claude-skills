#!/usr/bin/env bash
#
# Nuxt SEO Quick Setup Script
# Automatically sets up all 8 Nuxt SEO modules in a Nuxt project
#
# Usage: ./init-nuxt-seo.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Nuxt SEO Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Check if we're in a Nuxt project
check_nuxt_project() {
    if [ ! -f "nuxt.config.ts" ] && [ ! -f "nuxt.config.js" ]; then
        print_error "Not a Nuxt project (nuxt.config.ts/js not found)"
        echo ""
        echo "Create a new Nuxt project first:"
        echo "  bunx nuxi@latest init my-project"
        echo "  cd my-project"
        echo "  ./path/to/init-nuxt-seo.sh"
        exit 1
    fi
}

# Detect package manager
detect_package_manager() {
    if command -v bun &> /dev/null; then
        echo "bun"
    elif command -v pnpm &> /dev/null; then
        echo "pnpm"
    elif command -v npm &> /dev/null; then
        echo "npm"
    else
        print_error "No package manager found (bun, pnpm, or npm required)"
        exit 1
    fi
}

# Install Nuxt SEO modules
install_modules() {
    local pm=$1
    print_info "Installing @nuxtjs/seo (all 8 modules)..."

    case $pm in
        bun)
            bunx nuxi module add @nuxtjs/seo
            ;;
        pnpm)
            pnpm dlx nuxi module add @nuxtjs/seo
            ;;
        npm)
            npx nuxi module add @nuxtjs/seo
            ;;
    esac

    print_success "@nuxtjs/seo installed"
}

# Create basic configuration
create_config() {
    print_info "Creating basic SEO configuration..."

    # Check if nuxt.config.ts exists
    if [ -f "nuxt.config.ts" ]; then
        CONFIG_FILE="nuxt.config.ts"
    else
        CONFIG_FILE="nuxt.config.js"
    fi

    # Backup existing config
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
    print_info "Backed up existing config to ${CONFIG_FILE}.backup"

    # Check if modules array exists and add if needed
    if grep -q "modules:" "$CONFIG_FILE"; then
        # Add to existing modules array
        sed -i.tmp "s/modules: \[/modules: ['@nuxtjs\/seo', /" "$CONFIG_FILE" && rm "${CONFIG_FILE}.tmp"
    else
        # Add modules array to config
        sed -i.tmp "s/export default defineNuxtConfig({/export default defineNuxtConfig({\n  modules: ['@nuxtjs\/seo'],/" "$CONFIG_FILE" && rm "${CONFIG_FILE}.tmp"
    fi

    # Add site config if not exists
    if ! grep -q "site:" "$CONFIG_FILE"; then
        cat >> "$CONFIG_FILE" << 'EOF'

  // SEO Configuration
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'My Awesome Site',
    description: 'Building amazing web experiences',
    defaultLocale: 'en'
  }
EOF
    fi

    print_success "Configuration created"
}

# Create .env.example
create_env_example() {
    print_info "Creating .env.example..."

    cat > .env.example << 'EOF'
# Nuxt SEO Configuration
NUXT_PUBLIC_SITE_URL=https://example.com
NUXT_PUBLIC_SITE_NAME=My Awesome Site
NUXT_PUBLIC_ENV=production
EOF

    print_success ".env.example created"
}

# Create example OG image component
create_og_component() {
    print_info "Creating example OG image component..."

    mkdir -p components

    cat > components/OgImage.vue << 'EOF'
<template>
  <div class="w-[1200px] h-[630px] flex flex-col justify-between p-16 bg-gradient-to-br from-blue-600 to-purple-700">
    <div class="flex items-center justify-between">
      <div class="text-2xl text-white/80">{{ siteName }}</div>
    </div>

    <div class="flex-1 flex items-center">
      <div>
        <h1 class="text-7xl font-bold text-white mb-6 leading-tight">
          {{ title }}
        </h1>
        <p v-if="description" class="text-3xl text-white/90">
          {{ description }}
        </p>
      </div>
    </div>

    <div class="text-white/70 text-xl">
      {{ new Date().toLocaleDateString() }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  siteName: String
})
</script>
EOF

    print_success "OG image component created (components/OgImage.vue)"
}

# Create example sitemap endpoint
create_sitemap_example() {
    print_info "Creating example sitemap endpoint..."

    mkdir -p server/api/__sitemap__

    cat > server/api/__sitemap__/example.ts << 'EOF'
export default defineSitemapEventHandler(async () => {
  // Example: Fetch dynamic content
  // const items = await $fetch('/api/items')

  // Return sitemap entries
  return [
    {
      loc: '/about',
      lastmod: new Date(),
      changefreq: 'monthly',
      priority: 0.8
    }
  ]

  // Dynamic example:
  // return items.map(item => ({
  //   loc: `/items/${item.slug}`,
  //   lastmod: item.updatedAt,
  //   changefreq: 'weekly',
  //   priority: 0.9
  // }))
})
EOF

    print_success "Sitemap example created (server/api/__sitemap__/example.ts)"
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Setup Complete! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Update environment variables:"
    echo "   cp .env.example .env"
    echo "   # Edit .env with your site URL"
    echo ""
    echo "2. Start dev server:"
    echo "   bun run dev"
    echo "   # or: npm run dev"
    echo ""
    echo "3. Verify SEO setup:"
    echo "   • Visit http://localhost:3000/robots.txt"
    echo "   • Visit http://localhost:3000/sitemap.xml"
    echo ""
    echo "4. Customize configuration in nuxt.config.ts"
    echo ""
    echo "Documentation:"
    echo "   https://nuxtseo.com"
    echo ""
}

# Main execution
main() {
    print_header
    echo ""

    # Check if in Nuxt project
    check_nuxt_project

    # Detect package manager
    PM=$(detect_package_manager)
    print_info "Using package manager: $PM"
    echo ""

    # Install modules
    install_modules "$PM"

    # Create configuration
    create_config

    # Create .env.example
    create_env_example

    # Create OG component
    create_og_component

    # Create sitemap example
    create_sitemap_example

    # Print next steps
    print_next_steps
}

# Run main function
main

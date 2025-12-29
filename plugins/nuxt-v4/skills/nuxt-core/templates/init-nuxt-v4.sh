#!/bin/bash
# Initialize a new Nuxt 4 project with recommended setup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Nuxt 4 Project Initialization${NC}"
echo ""

# Get project name
read -p "Project name: " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo "Project name is required"
  exit 1
fi

# Create project
echo -e "${GREEN}Creating Nuxt 4 project...${NC}"
npx nuxi@latest init "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Install dependencies
echo -e "${GREEN}Installing recommended dependencies...${NC}"
npm install @nuxt/ui @nuxt/image @nuxt/fonts @nuxthub/core

# Install dev dependencies
npm install -D @nuxt/test-utils vitest @vue/test-utils happy-dom nitro-cloudflare-dev

# Create directory structure
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p app/{components,composables,layouts,middleware,pages,plugins,utils}
mkdir -p server/{api,middleware,plugins,routes,utils}
mkdir -p tests/{components,composables,server}
mkdir -p public

# Create basic files
echo -e "${GREEN}Creating configuration files...${NC}"

# .gitignore
cat > .gitignore << 'EOF'
# Nuxt
.nuxt
.output
.env
.dev.vars

# Dependencies
node_modules

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
EOF

# vitest.config.ts
cat > vitest.config.ts << 'EOF'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom'
      }
    }
  }
})
EOF

# wrangler.toml
cat > wrangler.toml << 'EOF'
name = "PROJECT_NAME_PLACEHOLDER"
main = ".output/server/index.mjs"
compatibility_date = "2024-09-19"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = ".output/public"

[vars]
PUBLIC_API_URL = "http://localhost:3000/api"
EOF

# Replace PROJECT_NAME_PLACEHOLDER (cross-platform approach)
if sed "s/PROJECT_NAME_PLACEHOLDER/$PROJECT_NAME/g" wrangler.toml > wrangler.toml.tmp; then
  mv wrangler.toml.tmp wrangler.toml
else
  echo "Error: Failed to update wrangler.toml"
  rm -f wrangler.toml.tmp
  exit 1
fi

# .dev.vars
cat > .dev.vars << 'EOF'
# Local development environment variables
API_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
EOF

# Update package.json scripts
echo -e "${GREEN}Adding npm scripts...${NC}"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.test:watch="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.deploy="npm run build && npx wrangler deploy"

echo ""
echo -e "${GREEN}✅ Nuxt 4 project initialized successfully!${NC}"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm run dev        # Start development server"
echo "  npm run test       # Run tests"
echo "  npm run build      # Build for production"
echo "  npm run deploy     # Deploy to Cloudflare"
echo ""

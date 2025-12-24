#!/bin/bash
# Initialize a new TypeScript MCP server project
# Usage: ./init-mcp-server.sh [project-name]

set -e

PROJECT_NAME="${1:-mcp-server}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$(dirname "$SCRIPT_DIR")/templates"

echo "==================================="
echo "TypeScript MCP Server Setup"
echo "==================================="
echo ""

# Create project directory
if [ -d "$PROJECT_NAME" ]; then
  echo "❌ Directory '$PROJECT_NAME' already exists"
  exit 1
fi

mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

echo "📁 Created project directory: $PROJECT_NAME"
echo ""

# Ask for template choice
echo "Select MCP server template:"
echo "1) Basic (simple tools)"
echo "2) Tool Server (multiple API integrations)"
echo "3) Resource Server (data exposure)"
echo "4) Full Server (tools + resources + prompts)"
echo "5) Authenticated Server (with API key auth)"
read -p "Choice [1-5]: " choice

case $choice in
  1) TEMPLATE="basic-mcp-server.ts" ;;
  2) TEMPLATE="tool-server.ts" ;;
  3) TEMPLATE="resource-server.ts" ;;
  4) TEMPLATE="full-server.ts" ;;
  5) TEMPLATE="authenticated-server.ts" ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

echo "✅ Selected: $TEMPLATE"
echo ""

# Initialize package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "build": "tsc && vite build",
    "deploy": "wrangler deploy",
    "test": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.2",
    "@cloudflare/workers-types": "^4.20251011.0",
    "hono": "^4.10.1",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.29",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "wrangler": "^4.43.0"
  }
}
EOF

# Update project name
sed -i "s/\"name\": \"mcp-server\"/\"name\": \"$PROJECT_NAME\"/" package.json

# Create source directory
mkdir -p src

# Copy template
echo "📄 Copying template..."
cp "$TEMPLATES_DIR/$TEMPLATE" src/index.ts

# Copy wrangler config
echo "⚙️  Creating wrangler.jsonc..."
cp "$TEMPLATES_DIR/wrangler.jsonc" wrangler.jsonc
sed -i "s/\"name\": \"my-mcp-server\"/\"name\": \"$PROJECT_NAME\"/" wrangler.jsonc

# Create tsconfig.json
echo "🔧 Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

# Create .gitignore
echo "🙈 Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
dist/
.wrangler/
.dev.vars
*.log
.DS_Store
EOF

# Create .dev.vars template
echo "🔐 Creating .dev.vars (for local secrets)..."
cat > .dev.vars << 'EOF'
# Local development secrets
# NEVER commit this file to git!

# Example:
# WEATHER_API_KEY=your-key-here
# DATABASE_URL=postgres://...
EOF

# Create README
echo "📝 Creating README.md..."
cat > README.md << EOF
# $PROJECT_NAME

TypeScript MCP server built with the official MCP SDK.

## Setup

\`\`\`bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
\`\`\`

## Testing

\`\`\`bash
# Start server
npm run dev

# In another terminal, test with MCP Inspector
npx @modelcontextprotocol/inspector

# Connect to: http://localhost:8787/mcp
\`\`\`

## Endpoints

- \`GET /\` - Server info
- \`POST /mcp\` - MCP protocol endpoint

## Environment Variables

Add secrets to Cloudflare Workers:

\`\`\`bash
wrangler secret put API_KEY
\`\`\`

For local development, add to \`.dev.vars\`:

\`\`\`
API_KEY=your-key
\`\`\`

## Deployment

\`\`\`bash
# Build
npm run build

# Deploy
npm run deploy

# View logs
wrangler tail
\`\`\`

## Documentation

- MCP Specification: https://spec.modelcontextprotocol.io/
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Cloudflare Workers: https://developers.cloudflare.com/workers/
EOF

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm run dev              # Start local server"
echo "  npm run deploy           # Deploy to Cloudflare"
echo ""
echo "Test with MCP Inspector:"
echo "  npx @modelcontextprotocol/inspector"
echo "  Connect to: http://localhost:8787/mcp"
echo ""

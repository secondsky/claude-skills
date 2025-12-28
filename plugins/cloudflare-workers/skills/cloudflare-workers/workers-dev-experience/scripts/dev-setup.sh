#!/bin/bash

# Development Environment Setup Script for Cloudflare Workers
#
# This script initializes a complete development environment including:
# - Project structure
# - TypeScript configuration
# - Wrangler configuration
# - Git setup
# - Development dependencies
#
# Usage:
#   ./dev-setup.sh [project-name]
#
# Example:
#   ./dev-setup.sh my-worker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check for required commands
check_requirements() {
    info "Checking requirements..."

    if ! command -v bun &> /dev/null; then
        error "Bun is required. Install: curl -fsSL https://bun.sh/install | bash"
    fi

    if ! command -v git &> /dev/null; then
        error "Git is required. Install: https://git-scm.com/downloads"
    fi

    success "All requirements met"
}

# Get project name
get_project_name() {
    if [ -n "$1" ]; then
        PROJECT_NAME="$1"
    else
        read -p "Enter project name: " PROJECT_NAME
    fi

    if [ -z "$PROJECT_NAME" ]; then
        error "Project name is required"
    fi

    # Validate project name (lowercase, hyphens, alphanumeric)
    if ! [[ "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
        error "Project name must start with lowercase letter and contain only lowercase letters, numbers, and hyphens"
    fi

    info "Creating project: $PROJECT_NAME"
}

# Create project structure
create_project_structure() {
    info "Creating project structure..."

    mkdir -p "$PROJECT_NAME"
    cd "$PROJECT_NAME"

    # Create directories
    mkdir -p src
    mkdir -p test
    mkdir -p migrations
    mkdir -p public

    success "Project structure created"
}

# Initialize package.json
init_package_json() {
    info "Initializing package.json..."

    cat > package.json << 'EOF'
{
  "name": "PROJECT_NAME",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "dev:remote": "wrangler dev --remote",
    "dev:persist": "wrangler dev --persist",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "check": "tsc --noEmit",
    "check:watch": "tsc --noEmit --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "types": "wrangler types",
    "tail": "wrangler tail",
    "db:migrate": "wrangler d1 migrations apply DB",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:studio": "wrangler d1 execute DB --local --command 'SELECT 1'"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.7.0",
    "@cloudflare/workers-types": "^4.20241230.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "wrangler": "^3.99.0"
  },
  "dependencies": {
    "hono": "^4.6.0"
  }
}
EOF

    # Replace placeholder with actual project name
    sed -i.bak "s/PROJECT_NAME/$PROJECT_NAME/g" package.json && rm package.json.bak

    success "package.json created"
}

# Create TypeScript configuration
create_tsconfig() {
    info "Creating TypeScript configuration..."

    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

    success "tsconfig.json created"
}

# Create Wrangler configuration
create_wrangler_config() {
    info "Creating wrangler.jsonc..."

    cat > wrangler.jsonc << EOF
{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "$PROJECT_NAME",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],

  "dev": {
    "port": 8787,
    "local_protocol": "http"
  },

  "vars": {
    "ENVIRONMENT": "development"
  },

  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  },

  // Environment overrides
  "env": {
    "staging": {
      "name": "$PROJECT_NAME-staging",
      "vars": {
        "ENVIRONMENT": "staging"
      }
    },
    "production": {
      "name": "$PROJECT_NAME-production",
      "vars": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
EOF

    success "wrangler.jsonc created"
}

# Create Vitest configuration
create_vitest_config() {
    info "Creating Vitest configuration..."

    cat > vitest.config.ts << 'EOF'
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
  },
});
EOF

    success "vitest.config.ts created"
}

# Create source files
create_source_files() {
    info "Creating source files..."

    # Main entry point
    cat > src/index.ts << 'EOF'
import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/api', (c) => {
  return c.json({
    message: 'Hello from Cloudflare Workers!',
    version: '1.0.0',
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: c.env.ENVIRONMENT === 'development' ? err.message : undefined,
    },
    500
  );
});

export default app;
EOF

    success "Source files created"
}

# Create test files
create_test_files() {
    info "Creating test files..."

    cat > test/index.test.ts << 'EOF'
import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('Worker', () => {
  it('returns healthy status', async () => {
    const response = await SELF.fetch('http://localhost/health');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  it('returns API response', async () => {
    const response = await SELF.fetch('http://localhost/api');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.message).toBe('Hello from Cloudflare Workers!');
  });

  it('returns 404 for unknown routes', async () => {
    const response = await SELF.fetch('http://localhost/unknown');
    expect(response.status).toBe(404);
  });
});
EOF

    success "Test files created"
}

# Create Git configuration
create_git_config() {
    info "Setting up Git..."

    # .gitignore
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Wrangler
.wrangler/
.dev.vars

# TypeScript
*.tsbuildinfo

# Test
coverage/

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Build
dist/
*.log
EOF

    # Initialize git repository
    git init -q
    git add .
    git commit -q -m "Initial commit: Cloudflare Worker setup"

    success "Git repository initialized"
}

# Create local secrets file
create_dev_vars() {
    info "Creating .dev.vars template..."

    cat > .dev.vars.example << 'EOF'
# Local development secrets
# Copy to .dev.vars and fill in values
# WARNING: Never commit .dev.vars to version control!

# API_KEY=your-api-key-here
# DATABASE_URL=postgres://localhost:5432/dev
EOF

    success ".dev.vars.example created"
}

# Create VS Code settings
create_vscode_settings() {
    info "Creating VS Code settings..."

    mkdir -p .vscode

    # VS Code settings
    cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.tsdk": "node_modules/typescript/lib"
}
EOF

    # Launch configuration for debugging
    cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Worker",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "sourceMaps": true,
      "resolveSourceMapLocations": [
        "${workspaceFolder}/**"
      ]
    }
  ]
}
EOF

    success "VS Code settings created"
}

# Install dependencies
install_dependencies() {
    info "Installing dependencies..."

    bun install

    success "Dependencies installed"
}

# Generate types
generate_types() {
    info "Generating Cloudflare types..."

    bunx wrangler types 2>/dev/null || warn "Could not generate types (run 'bun run types' after configuring bindings)"
}

# Main setup flow
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║     Cloudflare Workers Development Environment Setup         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    check_requirements
    get_project_name "$1"

    if [ -d "$PROJECT_NAME" ]; then
        error "Directory '$PROJECT_NAME' already exists"
    fi

    create_project_structure
    init_package_json
    create_tsconfig
    create_wrangler_config
    create_vitest_config
    create_source_files
    create_test_files
    create_git_config
    create_dev_vars
    create_vscode_settings
    install_dependencies
    generate_types

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    Setup Complete! 🎉                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. cd $PROJECT_NAME"
    echo "  2. bun run dev          # Start development server"
    echo "  3. bun run test         # Run tests"
    echo "  4. bun run deploy       # Deploy to Cloudflare"
    echo ""
    echo "Helpful commands:"
    echo ""
    echo "  bun run dev:remote      # Use real Cloudflare services"
    echo "  bun run tail            # View real-time logs"
    echo "  bun run types           # Regenerate types"
    echo ""
    echo "Documentation: https://developers.cloudflare.com/workers/"
    echo ""
}

# Run main
main "$@"

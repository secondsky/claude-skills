#!/usr/bin/env bash
#
# setup-vitest-do.sh
#
# Sets up Vitest testing environment for Cloudflare Durable Objects
#
# What it does:
# - Installs required Vitest packages
# - Creates vitest.config.ts with @cloudflare/vitest-pool-workers
# - Generates example test file
# - Configures package.json test scripts
# - Validates setup
#
# Usage:
#   ./setup-vitest-do.sh
#   ./setup-vitest-do.sh --typescript  # Use TypeScript (default)
#   ./setup-vitest-do.sh --javascript  # Use JavaScript
#
# Requirements:
# - Node.js 18+
# - wrangler.jsonc with Durable Objects configured
# - Existing Durable Object implementation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
USE_TYPESCRIPT=true
PACKAGE_MANAGER="npm"

# ============================================================================
# Helper Functions
# ============================================================================

error() {
  echo -e "${RED}❌ ERROR: $1${NC}" >&2
  exit 1
}

warning() {
  echo -e "${YELLOW}⚠️  WARNING: $1${NC}" >&2
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

header() {
  echo ""
  echo "=================================================="
  echo "$1"
  echo "=================================================="
  echo ""
}

# Detect package manager
detect_package_manager() {
  if [[ -f "bun.lockb" ]]; then
    PACKAGE_MANAGER="bun"
  elif [[ -f "pnpm-lock.yaml" ]]; then
    PACKAGE_MANAGER="pnpm"
  elif [[ -f "yarn.lock" ]]; then
    PACKAGE_MANAGER="yarn"
  elif [[ -f "package-lock.json" ]]; then
    PACKAGE_MANAGER="npm"
  else
    PACKAGE_MANAGER="npm"
  fi

  info "Detected package manager: $PACKAGE_MANAGER"
}

# Install packages
install_packages() {
  local packages="$1"

  case $PACKAGE_MANAGER in
    bun)
      bun add -D $packages
      ;;
    pnpm)
      pnpm add -D $packages
      ;;
    yarn)
      yarn add -D $packages
      ;;
    npm)
      npm install --save-dev $packages
      ;;
  esac
}

# ============================================================================
# Parse Arguments
# ============================================================================

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --typescript)
        USE_TYPESCRIPT=true
        shift
        ;;
      --javascript)
        USE_TYPESCRIPT=false
        shift
        ;;
      --help)
        echo "Usage: $0 [--typescript|--javascript]"
        echo ""
        echo "Options:"
        echo "  --typescript   Use TypeScript (default)"
        echo "  --javascript   Use JavaScript"
        echo "  --help         Show this help message"
        exit 0
        ;;
      *)
        error "Unknown option: $1"
        ;;
    esac
  done
}

# ============================================================================
# Setup Steps
# ============================================================================

# Step 1: Validate prerequisites
validate_prerequisites() {
  header "Step 1: Validating Prerequisites"

  # Check for package.json
  if [[ ! -f "package.json" ]]; then
    error "package.json not found. Run 'npm init' first."
  fi
  success "Found package.json"

  # Check for wrangler.jsonc
  if [[ ! -f "wrangler.jsonc" ]]; then
    warning "wrangler.jsonc not found (expected for Cloudflare Workers)"
  else
    success "Found wrangler.jsonc"
  fi

  # Check for Durable Object bindings
  if [[ -f "wrangler.jsonc" ]] && command -v jq &> /dev/null; then
    local bindings
    bindings=$(grep -v '^\s*//' wrangler.jsonc | jq -r '.durable_objects.bindings // [] | length' 2>/dev/null || echo "0")

    if [[ "$bindings" -gt 0 ]]; then
      success "Found $bindings Durable Object binding(s)"
    else
      warning "No Durable Object bindings found in wrangler.jsonc"
    fi
  fi

  # Check Node.js version
  local node_version
  node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [[ "$node_version" -lt 18 ]]; then
    error "Node.js 18+ required (found: $node_version)"
  fi
  success "Node.js version OK (v$node_version)"

  detect_package_manager
}

# Step 2: Install Vitest packages
install_vitest() {
  header "Step 2: Installing Vitest Packages"

  info "Installing vitest@2.0.0 and @cloudflare/vitest-pool-workers@0.5.0..."

  install_packages "vitest@2.0.0 @cloudflare/vitest-pool-workers@0.5.0"

  success "Vitest packages installed"
}

# Step 3: Create vitest.config.ts
create_vitest_config() {
  header "Step 3: Creating vitest.config.ts"

  local config_file="vitest.config.ts"

  if [[ -f "$config_file" ]]; then
    warning "vitest.config.ts already exists. Backing up to vitest.config.ts.bak"
    cp "$config_file" "$config_file.bak"
  fi

  cat > "$config_file" << 'EOF'
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
        miniflare: {
          // Durable Object bindings are automatically configured from wrangler.jsonc
        },
      },
    },
  },
});
EOF

  success "Created vitest.config.ts"
  info "Configuration file: $config_file"
}

# Step 4: Create example test file
create_example_test() {
  header "Step 4: Creating Example Test File"

  local test_dir="test"
  local test_file="$test_dir/example.test.ts"

  mkdir -p "$test_dir"

  if [[ -f "$test_file" ]]; then
    warning "$test_file already exists. Skipping example creation."
    return
  fi

  cat > "$test_file" << 'EOF'
/**
 * Example Vitest test for Durable Objects
 *
 * Run: npm test
 */

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

// Replace 'COUNTER' with your actual binding name from wrangler.jsonc
describe("Counter Durable Object", () => {
  it("should increment counter via RPC", async () => {
    const id = env.COUNTER.idFromName("test-counter");
    const stub = env.COUNTER.get(id);

    // Call your DO's RPC methods
    const count1 = await stub.increment();
    expect(count1).toBe(1);

    const count2 = await stub.increment();
    expect(count2).toBe(2);
  });

  it("should reset counter", async () => {
    const id = env.COUNTER.idFromName("test-reset");
    const stub = env.COUNTER.get(id);

    await stub.increment();
    await stub.increment();
    await stub.reset();

    const count = await stub.getCount();
    expect(count).toBe(0);
  });
});
EOF

  success "Created example test: $test_file"
  info "Update the binding name (COUNTER) to match your wrangler.jsonc configuration"
}

# Step 5: Update package.json
update_package_json() {
  header "Step 5: Updating package.json"

  if ! command -v jq &> /dev/null; then
    warning "jq not installed. Skipping package.json update."
    info "Manually add to package.json:"
    echo '  "scripts": {'
    echo '    "test": "vitest",'
    echo '    "test:watch": "vitest --watch"'
    echo '  }'
    return
  fi

  # Read current package.json
  local package_json
  package_json=$(cat package.json)

  # Add test scripts
  package_json=$(echo "$package_json" | jq '.scripts.test = "vitest"')
  package_json=$(echo "$package_json" | jq '.scripts["test:watch"] = "vitest --watch"')

  # Write back
  echo "$package_json" > package.json

  success "Updated package.json with test scripts"
  info "Added scripts: npm test, npm run test:watch"
}

# Step 6: Create .gitignore entries
update_gitignore() {
  header "Step 6: Updating .gitignore"

  local gitignore=".gitignore"

  if [[ ! -f "$gitignore" ]]; then
    touch "$gitignore"
  fi

  # Add Vitest entries if not present
  if ! grep -q "# Vitest" "$gitignore"; then
    cat >> "$gitignore" << EOF

# Vitest
coverage/
.vitest/
EOF
    success "Updated .gitignore with Vitest entries"
  else
    info ".gitignore already contains Vitest entries"
  fi
}

# Step 7: Validate setup
validate_setup() {
  header "Step 7: Validating Setup"

  local has_errors=false

  # Check if packages are installed
  if ! grep -q "vitest" package.json; then
    error "vitest not found in package.json"
    has_errors=true
  fi

  if ! grep -q "@cloudflare/vitest-pool-workers" package.json; then
    error "@cloudflare/vitest-pool-workers not found in package.json"
    has_errors=true
  fi

  # Check if vitest.config.ts exists
  if [[ ! -f "vitest.config.ts" ]]; then
    error "vitest.config.ts not found"
    has_errors=true
  fi

  # Check if test directory exists
  if [[ ! -d "test" ]]; then
    warning "test/ directory not found"
  fi

  if [[ "$has_errors" == "true" ]]; then
    error "Setup validation failed. Please fix errors above."
  fi

  success "Setup validated successfully!"
}

# ============================================================================
# Main Function
# ============================================================================

main() {
  parse_args "$@"

  echo "=================================================="
  echo "Vitest Setup for Cloudflare Durable Objects"
  echo "=================================================="
  echo ""
  info "This script will set up Vitest testing for your Durable Objects project"
  echo ""

  validate_prerequisites
  install_vitest
  create_vitest_config
  create_example_test
  update_package_json
  update_gitignore
  validate_setup

  # Final instructions
  header "Setup Complete! 🎉"

  echo "Next steps:"
  echo ""
  echo "1. Update test/example.test.ts with your actual Durable Object binding name"
  echo "2. Run tests:"
  echo "   $PACKAGE_MANAGER test"
  echo ""
  echo "3. Watch mode (auto-run on file changes):"
  echo "   $PACKAGE_MANAGER run test:watch"
  echo ""
  echo "4. Add more tests:"
  echo "   - Test DO state persistence"
  echo "   - Test WebSocket hibernation"
  echo "   - Test alarms functionality"
  echo "   - Test error handling"
  echo ""
  echo "5. See templates/vitest-do-test.ts for comprehensive examples"
  echo ""
  echo "Documentation:"
  echo "  - Vitest: https://vitest.dev"
  echo "  - Cloudflare Vitest Pool: https://developers.cloudflare.com/workers/testing/vitest-integration"
  echo "  - Skill reference: references/vitest-testing.md"
  echo ""

  success "Happy testing! 🧪"
}

# ============================================================================
# Script Entry Point
# ============================================================================

main "$@"

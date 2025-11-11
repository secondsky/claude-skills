#!/usr/bin/env bash

# Ultracite Installation Script
# Automated setup for Ultracite with framework, editor, and Git hook integrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

success() {
  echo -e "${GREEN}✓${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if we're in a Node.js project
if [ ! -f "package.json" ]; then
  error "No package.json found. Please run this script from a Node.js project root."
  exit 1
fi

info "Ultracite Installation Script"
echo ""

# Detect package manager
detect_package_manager() {
  if [ -f "bun.lockb" ] || command -v bun &> /dev/null; then
    echo "bun"
  elif [ -f "pnpm-lock.yaml" ] || command -v pnpm &> /dev/null; then
    echo "pnpm"
  elif [ -f "yarn.lock" ]; then
    echo "yarn"
  else
    echo "npm"
  fi
}

PM=$(detect_package_manager)
success "Detected package manager: $PM"

# Detect framework
detect_framework() {
  if grep -q '"next"' package.json; then
    echo "next"
  elif grep -q '"react"' package.json; then
    echo "react"
  elif grep -q '"vue"' package.json; then
    echo "vue"
  elif grep -q '"svelte"' package.json; then
    echo "svelte"
  elif grep -q '"solid-js"' package.json; then
    echo "solid"
  elif grep -q '"@angular/core"' package.json; then
    echo "angular"
  elif grep -q '"@remix-run"' package.json; then
    echo "remix"
  else
    echo "none"
  fi
}

FRAMEWORK=$(detect_framework)
if [ "$FRAMEWORK" != "none" ]; then
  success "Detected framework: $FRAMEWORK"
else
  info "No framework detected, using core preset"
fi

# Check for existing linting tools
check_existing_tools() {
  local has_eslint=false
  local has_prettier=false
  local has_biome=false

  if grep -q '"eslint"' package.json 2>/dev/null || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    has_eslint=true
    warning "ESLint detected"
  fi

  if grep -q '"prettier"' package.json 2>/dev/null || [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ]; then
    has_prettier=true
    warning "Prettier detected"
  fi

  if grep -q '"@biomejs/biome"' package.json 2>/dev/null || [ -f "biome.json" ] || [ -f "biome.jsonc" ]; then
    has_biome=true
    info "Biome detected"
  fi

  if $has_eslint || $has_prettier; then
    echo ""
    warning "Existing linting/formatting tools detected."
    echo "Ultracite can migrate from these tools automatically."
    echo ""
    read -p "Migrate and remove ESLint/Prettier? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      MIGRATE=true
    else
      MIGRATE=false
      warning "Keeping existing tools. Note: May cause conflicts."
    fi
  fi
}

check_existing_tools

# Check for existing Git hook managers
check_git_hooks() {
  local has_husky=false
  local has_lefthook=false
  local has_lint_staged=false

  if grep -q '"husky"' package.json 2>/dev/null || [ -d ".husky" ]; then
    has_husky=true
    info "Husky detected"
  fi

  if grep -q '"lefthook"' package.json 2>/dev/null || [ -f "lefthook.yml" ]; then
    has_lefthook=true
    info "Lefthook detected"
  fi

  if grep -q '"lint-staged"' package.json 2>/dev/null || [ -f ".lintstagedrc.json" ]; then
    has_lint_staged=true
    info "lint-staged detected"
  fi

  if $has_husky || $has_lefthook || $has_lint_staged; then
    warning "Git hook manager already installed. Skipping Git hooks setup."
    SKIP_HOOKS=true
  else
    echo ""
    info "Would you like to set up Git hooks for automatic formatting?"
    echo "  1) Husky (most popular)"
    echo "  2) Lefthook (fastest, native Go)"
    echo "  3) lint-staged (only staged files)"
    echo "  4) None"
    read -p "Choose [1-4]: " -n 1 -r
    echo ""
    case $REPLY in
      1) GIT_HOOK="husky" ;;
      2) GIT_HOOK="lefthook" ;;
      3) GIT_HOOK="lint-staged" ;;
      *) GIT_HOOK="none" ;;
    esac
  fi
}

check_git_hooks

# Build init command
build_init_command() {
  local cmd=""

  case $PM in
    bun) cmd="bun x ultracite init" ;;
    pnpm) cmd="pnpm dlx ultracite init" ;;
    yarn) cmd="yarn dlx ultracite init" ;;
    npm) cmd="npx ultracite init" ;;
  esac

  # Add package manager flag
  cmd="$cmd --pm $PM"

  # Add framework flag
  if [ "$FRAMEWORK" != "none" ]; then
    cmd="$cmd --frameworks $FRAMEWORK"
  fi

  # Add editor flags
  cmd="$cmd --editors vscode"

  # Add migration flags
  if [ "${MIGRATE:-false}" = true ]; then
    if grep -q '"eslint"' package.json && grep -q '"prettier"' package.json; then
      cmd="$cmd --migrate eslint,prettier"
    elif grep -q '"eslint"' package.json; then
      cmd="$cmd --migrate eslint"
    elif grep -q '"prettier"' package.json; then
      cmd="$cmd --migrate prettier"
    fi
  fi

  # Add Git hooks flag
  if [ "${SKIP_HOOKS:-false}" = false ] && [ "${GIT_HOOK:-none}" != "none" ]; then
    cmd="$cmd --integrations $GIT_HOOK"
  fi

  echo "$cmd"
}

INIT_CMD=$(build_init_command)

echo ""
info "Running: $INIT_CMD"
echo ""

# Run the init command
eval $INIT_CMD

# Verify installation
echo ""
info "Verifying installation..."

if [ -f "biome.jsonc" ] || [ -f "biome.json" ]; then
  success "Configuration file created"
else
  error "Configuration file not found"
  exit 1
fi

if grep -q '"ultracite"' package.json; then
  success "Ultracite installed"
else
  warning "Ultracite not found in package.json"
fi

# Run doctor command
echo ""
info "Running health check..."
case $PM in
  bun) bun x ultracite doctor ;;
  pnpm) pnpm dlx ultracite doctor ;;
  yarn) yarn dlx ultracite doctor ;;
  npm) npx ultracite doctor ;;
esac

echo ""
success "Ultracite installation complete!"
echo ""
info "Next steps:"
echo "  1. Restart your editor (VS Code, Cursor, etc.)"
echo "  2. Install the Biome extension if not already installed"
echo "  3. Save any file to see auto-formatting in action"
echo "  4. Run 'npx ultracite check' to see linting results"
echo "  5. Run 'npx ultracite fix' to auto-fix issues"
echo ""

if [ "$FRAMEWORK" != "none" ]; then
  info "Framework preset applied: $FRAMEWORK"
  echo "  - Review biome.jsonc for framework-specific rules"
fi

if [ "${GIT_HOOK:-none}" != "none" ]; then
  info "Git hooks configured: $GIT_HOOK"
  echo "  - Pre-commit formatting will run automatically"
fi

echo ""
info "Documentation: https://www.ultracite.ai"
success "Happy coding!"

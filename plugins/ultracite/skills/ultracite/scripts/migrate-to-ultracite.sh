#!/usr/bin/env bash

# Ultracite Migration Script
# Migrate from ESLint and/or Prettier to Ultracite

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

info "Ultracite Migration Script"
echo ""

# Detect current tools
HAS_ESLINT=false
HAS_PRETTIER=false
HAS_BIOME=false

if grep -q '"eslint"' package.json 2>/dev/null || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || [ -f ".eslintrc.cjs" ]; then
  HAS_ESLINT=true
  warning "ESLint detected"
fi

if grep -q '"prettier"' package.json 2>/dev/null || [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ] || [ -f ".prettierrc.cjs" ]; then
  HAS_PRETTIER=true
  warning "Prettier detected"
fi

if grep -q '"@biomejs/biome"' package.json 2>/dev/null || [ -f "biome.json" ] || [ -f "biome.jsonc" ]; then
  HAS_BIOME=true
  info "Biome detected (will extend with Ultracite presets)"
fi

if ! $HAS_ESLINT && ! $HAS_PRETTIER && ! $HAS_BIOME; then
  error "No linting/formatting tools detected."
  echo "  This script is for migration. For new setup, use install-ultracite.sh"
  exit 1
fi

echo ""
info "Migration targets:"
$HAS_ESLINT && echo "  - ESLint → Ultracite"
$HAS_PRETTIER && echo "  - Prettier → Ultracite"
$HAS_BIOME && echo "  - Biome → Ultracite (preset extension)"

echo ""
warning "This will modify your project configuration."
echo "  ⚠ ESLint and Prettier configs will be removed"
echo "  ⚠ Dependencies will be uninstalled"
echo "  ⚠ .vscode/settings.json will be updated"
echo ""
read -p "Continue with migration? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  info "Migration cancelled."
  exit 0
fi

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
success "Using package manager: $PM"

# Backup existing configs
backup_configs() {
  local backup_dir=".ultracite-migration-backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$backup_dir"

  info "Backing up existing configs to $backup_dir/"

  # ESLint configs
  [ -f ".eslintrc.js" ] && cp .eslintrc.js "$backup_dir/" && success "Backed up .eslintrc.js"
  [ -f ".eslintrc.json" ] && cp .eslintrc.json "$backup_dir/" && success "Backed up .eslintrc.json"
  [ -f ".eslintrc.cjs" ] && cp .eslintrc.cjs "$backup_dir/" && success "Backed up .eslintrc.cjs"
  [ -f "eslint.config.js" ] && cp eslint.config.js "$backup_dir/" && success "Backed up eslint.config.js"
  [ -f ".eslintignore" ] && cp .eslintignore "$backup_dir/" && success "Backed up .eslintignore"

  # Prettier configs
  [ -f ".prettierrc" ] && cp .prettierrc "$backup_dir/" && success "Backed up .prettierrc"
  [ -f ".prettierrc.json" ] && cp .prettierrc.json "$backup_dir/" && success "Backed up .prettierrc.json"
  [ -f ".prettierrc.js" ] && cp .prettierrc.js "$backup_dir/" && success "Backed up .prettierrc.js"
  [ -f ".prettierrc.cjs" ] && cp .prettierrc.cjs "$backup_dir/" && success "Backed up .prettierrc.cjs"
  [ -f "prettier.config.js" ] && cp prettier.config.js "$backup_dir/" && success "Backed up prettier.config.js"
  [ -f ".prettierignore" ] && cp .prettierignore "$backup_dir/" && success "Backed up .prettierignore"

  # Biome config (if extending)
  [ -f "biome.json" ] && cp biome.json "$backup_dir/" && success "Backed up biome.json"
  [ -f "biome.jsonc" ] && cp biome.jsonc "$backup_dir/" && success "Backed up biome.jsonc"

  # VS Code settings
  [ -f ".vscode/settings.json" ] && cp .vscode/settings.json "$backup_dir/" && success "Backed up .vscode/settings.json"

  success "Backup complete: $backup_dir/"
}

backup_configs

echo ""

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
  else
    echo "core"
  fi
}

FRAMEWORK=$(detect_framework)
success "Detected framework: $FRAMEWORK"

# Build migration flags
MIGRATE_FLAGS=""
$HAS_ESLINT && MIGRATE_FLAGS="${MIGRATE_FLAGS}eslint,"
$HAS_PRETTIER && MIGRATE_FLAGS="${MIGRATE_FLAGS}prettier,"
$HAS_BIOME && MIGRATE_FLAGS="${MIGRATE_FLAGS}biome,"
MIGRATE_FLAGS=${MIGRATE_FLAGS%,}  # Remove trailing comma

# Run Ultracite init with migration
echo ""
info "Running Ultracite init with migration..."

INIT_CMD=""
case $PM in
  bun) INIT_CMD="bun x ultracite init" ;;
  pnpm) INIT_CMD="pnpm dlx ultracite init" ;;
  yarn) INIT_CMD="yarn dlx ultracite init" ;;
  npm) INIT_CMD="npx ultracite init" ;;
esac

INIT_CMD="$INIT_CMD --pm $PM --frameworks $FRAMEWORK --migrate $MIGRATE_FLAGS --editors vscode"

info "Command: $INIT_CMD"
echo ""

eval $INIT_CMD

# Remove old config files (Ultracite init may not remove all)
echo ""
info "Cleaning up old configuration files..."

if $HAS_ESLINT; then
  rm -f .eslintrc.js .eslintrc.json .eslintrc.cjs eslint.config.js .eslintignore
  success "Removed ESLint config files"
fi

if $HAS_PRETTIER; then
  rm -f .prettierrc .prettierrc.json .prettierrc.js .prettierrc.cjs prettier.config.js .prettierignore
  success "Removed Prettier config files"
fi

# Uninstall old dependencies
echo ""
info "Removing old dependencies..."

REMOVE_CMD=""
case $PM in
  bun) REMOVE_CMD="bun remove" ;;
  pnpm) REMOVE_CMD="pnpm remove" ;;
  yarn) REMOVE_CMD="yarn remove" ;;
  npm) REMOVE_CMD="npm uninstall" ;;
esac

if $HAS_ESLINT; then
  # Common ESLint packages
  ESLINT_PACKAGES="eslint"

  # TypeScript ESLint
  grep -q '@typescript-eslint/parser' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES @typescript-eslint/parser"
  grep -q '@typescript-eslint/eslint-plugin' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES @typescript-eslint/eslint-plugin"

  # Framework-specific
  grep -q 'eslint-config-next' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES eslint-config-next"
  grep -q 'eslint-plugin-react' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES eslint-plugin-react"
  grep -q 'eslint-plugin-react-hooks' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES eslint-plugin-react-hooks"
  grep -q 'eslint-plugin-vue' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES eslint-plugin-vue"

  # Integrations
  grep -q 'eslint-config-prettier' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES eslint-config-prettier"
  grep -q 'eslint-plugin-prettier' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES eslint-plugin-prettier"
  grep -q 'eslint-plugin-import' package.json && ESLINT_PACKAGES="$ESLINT_PACKAGES eslint-plugin-import"

  if [ -n "$ESLINT_PACKAGES" ]; then
    eval "$REMOVE_CMD $ESLINT_PACKAGES" 2>/dev/null || warning "Some ESLint packages may not have been removed"
    success "Removed ESLint packages"
  fi
fi

if $HAS_PRETTIER; then
  PRETTIER_PACKAGES="prettier"
  grep -q 'eslint-config-prettier' package.json && PRETTIER_PACKAGES="$PRETTIER_PACKAGES eslint-config-prettier"
  grep -q 'eslint-plugin-prettier' package.json && PRETTIER_PACKAGES="$PRETTIER_PACKAGES eslint-plugin-prettier"

  eval "$REMOVE_CMD $PRETTIER_PACKAGES" 2>/dev/null || warning "Some Prettier packages may not have been removed"
  success "Removed Prettier packages"
fi

# Verify migration
echo ""
info "Verifying migration..."

if [ -f "biome.jsonc" ] || [ -f "biome.json" ]; then
  success "Ultracite configuration file exists"

  # Check for extends
  if grep -q 'ultracite/core' biome.json* 2>/dev/null; then
    success "Ultracite preset configured"
  else
    warning "Ultracite preset not found in config"
  fi
else
  error "Configuration file not found"
  exit 1
fi

if grep -q '"ultracite"' package.json; then
  success "Ultracite dependency installed"
else
  warning "Ultracite not found in package.json"
fi

# Update VS Code settings
if [ -f ".vscode/settings.json" ]; then
  info "Checking VS Code settings..."
  if grep -q '"biomejs.biome"' .vscode/settings.json; then
    success "VS Code configured for Biome"
  else
    warning "VS Code settings may need manual update"
  fi
fi

# Run doctor
echo ""
info "Running health check..."
case $PM in
  bun) bun x ultracite doctor ;;
  pnpm) pnpm dlx ultracite doctor ;;
  yarn) yarn dlx ultracite doctor ;;
  npm) npx ultracite doctor ;;
esac

echo ""
success "Migration complete!"
echo ""
info "What changed:"
$HAS_ESLINT && echo "  ✓ ESLint removed → Ultracite installed"
$HAS_PRETTIER && echo "  ✓ Prettier removed → Ultracite handles formatting"
$HAS_BIOME && echo "  ✓ Biome extended with Ultracite presets"
echo "  ✓ Configuration files migrated"
echo "  ✓ Dependencies updated"
echo "  ✓ VS Code settings configured"

echo ""
warning "Important next steps:"
echo "  1. RESTART YOUR EDITOR (VS Code, Cursor, etc.)"
echo "  2. Install Biome extension if not already installed:"
echo "     - VS Code: biomejs.biome"
echo "  3. Disable/uninstall conflicting extensions:"
echo "     - ESLint extension (dbaeumer.vscode-eslint)"
echo "     - Prettier extension (esbenp.prettier-vscode)"
echo "  4. Test formatting: Save any file"
echo "  5. Check for issues: npx ultracite check"
echo "  6. Auto-fix issues: npx ultracite fix"

echo ""
info "Backups saved to: .ultracite-migration-backup-*/"
info "If you encounter issues, you can restore from backups"

echo ""
info "Documentation: https://www.ultracite.ai"
success "Happy coding with Ultracite!"

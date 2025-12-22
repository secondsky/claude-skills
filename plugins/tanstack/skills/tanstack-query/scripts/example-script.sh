#!/bin/bash
set -euo pipefail

# Bootstrap TanStack Query v5 into an existing React project.
# - Installs @tanstack/react-query, DevTools, and ESLint plugin
# - Copies the opinionated templates from this skill into your project
# Safe by default: skips files that already exist unless --force is passed.

usage() {
  cat <<'EOF'
Usage: ./scripts/example-script.sh <project-dir> [npm|pnpm|bun] [--force]
Examples:
  ./scripts/example-script.sh ../my-app pnpm
  ./scripts/example-script.sh . npm --force
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

TARGET_DIR=$1
PKG_MANAGER=${2:-pnpm}
FORCE=${3:-}

case "$PKG_MANAGER" in
  npm|pnpm|bun|yarn) ;;
  *) echo "Unknown package manager: $PKG_MANAGER"; usage; exit 1 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/templates"

install_deps() {
  echo "Installing TanStack Query dependencies with $PKG_MANAGER..."
  case "$PKG_MANAGER" in
    pnpm) pnpm add @tanstack/react-query @tanstack/react-query-devtools; pnpm add -D @tanstack/eslint-plugin-query ;;
    npm) npm install @tanstack/react-query @tanstack/react-query-devtools; npm install -D @tanstack/eslint-plugin-query ;;
    bun) bun add @tanstack/react-query @tanstack/react-query-devtools; bun add -d @tanstack/eslint-plugin-query ;;
    yarn) yarn add @tanstack/react-query @tanstack/react-query-devtools; yarn add -D @tanstack/eslint-plugin-query ;;
  esac
}

copy_if_missing() {
  local src="$1"
  local dest="$2"
  if [[ -f "$dest" && "$FORCE" != "--force" ]]; then
    echo "Skip (exists): $dest"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo "Copied: $dest"
}

echo "Target project: $TARGET_DIR"
install_deps

# Copy core templates
copy_if_missing "$TEMPLATE_DIR/query-client-config.ts" "$TARGET_DIR/src/lib/query-client.ts"
copy_if_missing "$TEMPLATE_DIR/provider-setup.tsx" "$TARGET_DIR/src/main.tsx"
copy_if_missing "$TEMPLATE_DIR/use-query-basic.tsx" "$TARGET_DIR/src/hooks/use-query-basic.tsx"
copy_if_missing "$TEMPLATE_DIR/use-mutation-basic.tsx" "$TARGET_DIR/src/hooks/use-mutation-basic.tsx"
copy_if_missing "$TEMPLATE_DIR/devtools-setup.tsx" "$TARGET_DIR/src/components/ReactQueryDevtools.tsx"

echo "Done. Review copied files, tweak defaults (staleTime/gcTime), and run your dev server."

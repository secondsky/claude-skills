#!/bin/bash
# Common version checking logic
# Shared by ai-sdk-core and ai-sdk-ui

# Detect package manager (prefer Bun per repo guidelines)
detect_package_manager() {
  if command -v bun &> /dev/null; then
    PKG_MGR="bun"
    LIST_CMD="bun pm ls"
    VIEW_CMD="bun pm view"
    INSTALL_CMD="bun add"
  else
    PKG_MGR="npm"
    LIST_CMD="npm list"
    VIEW_CMD="npm view"
    INSTALL_CMD="npm install"
  fi
}

# Check versions for an array of packages
check_package_versions() {
  local packages=("$@")

  echo "Checking package versions..."
  echo ""

  for package in "${packages[@]}"; do
    echo "📦 $package"

    # Get installed version
    installed=$($LIST_CMD "$package" --depth=0 2>/dev/null | grep "$package" | sed 's/.*@\([0-9]\)/\1/')

    if [ -z "$installed" ]; then
      echo "   ❌ Not installed"
    else
      echo "   ✅ Installed: $installed"
    fi

    # Get latest version
    latest=$($VIEW_CMD "$package" version 2>/dev/null)

    if [ -z "$latest" ]; then
      echo "   ⚠️  Could not fetch latest version"
    else
      echo "   📌 Latest:    $latest"

      # Compare versions
      if [ "$installed" = "$latest" ]; then
        echo "   ✨ Up to date!"
      elif [ -n "$installed" ]; then
        # Use sort -V for semantic version comparison
        newer=$(printf '%s\n%s\n' "$installed" "$latest" | sort -V | tail -n1)
        if [ "$newer" = "$installed" ]; then
          echo "   ℹ️  Installed version ($installed) is newer than registry ($latest)"
        else
          echo "   ⬆️  Update available: $installed → $latest"
        fi
      fi
    fi

    echo ""
  done
}

# Show recommended versions
show_recommended_versions() {
  local title="$1"
  shift
  local versions=("$@")

  echo "==================================="
  echo " $title"
  echo "==================================="
  echo ""

  for version_line in "${versions[@]}"; do
    echo "$version_line"
  done

  echo ""
}

# Show install command
show_install_command() {
  local packages=("$@")

  echo "To update all packages:"
  if [ "$PKG_MGR" = "bun" ]; then
    echo -n "bun add"
  else
    echo -n "npm install"
  fi

  for package in "${packages[@]}"; do
    echo -n " ${package}@latest"
  done

  echo ""
  echo ""
}

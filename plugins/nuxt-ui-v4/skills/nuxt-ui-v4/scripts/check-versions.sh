#!/bin/bash
# check-versions.sh
# Verify package versions for Nuxt UI v4 skill

echo "Checking Nuxt UI v4 Package Versions..."
echo "========================================"
echo ""

# Function to check package version
check_package() {
    local package=$1
    local min_version=$2

    echo "Checking $package..."

    if command -v npm &> /dev/null; then
        latest=$(npm view $package version 2>/dev/null)
        if [ -n "$latest" ]; then
            echo "  Latest: $latest"
            echo "  Minimum Required: $min_version"
            echo "  ✓ Available"
        else
            echo "  ✗ Package not found"
        fi
    else
        echo "  ⚠ npm not found, skipping check"
    fi

    echo ""
}

# Check core packages
check_package "nuxt" "4.0.0"
check_package "@nuxt/ui" "4.0.0"
check_package "vue" "3.5.0"
check_package "tailwindcss" "4.0.0"

# Check optional packages
echo "Optional Packages:"
echo "=================="
echo ""
check_package "ai" "5.0.0"
check_package "fuse.js" "7.0.0"
check_package "embla-carousel-vue" "8.0.0"
check_package "zod" "3.22.0"

echo "========================================"
echo "Version check complete!"
echo ""
echo "To install packages:"
echo "  npm install nuxt @nuxt/ui vue tailwindcss"
echo ""
echo "Optional:"
echo "  npm install ai fuse.js embla-carousel-vue zod"

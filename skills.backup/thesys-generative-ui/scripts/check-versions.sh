#!/bin/bash

# TheSys Generative UI - Version Checker
#
# Verifies installed package versions match recommended versions
# Usage: ./scripts/check-versions.sh

set -e

echo "========================================="
echo "TheSys Generative UI - Version Checker"
echo "========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run npm/pnpm install first."
    exit 1
fi

# Recommended versions
declare -A RECOMMENDED=(
    ["@thesysai/genui-sdk"]="0.6.40"
    ["@crayonai/react-ui"]="0.8.27"
    ["@crayonai/react-core"]="0.7.6"
    ["openai"]="4.73.0"
    ["zod"]="3.24.1"
    ["react"]="19.0.0"
)

echo "Checking package versions..."
echo ""

ALL_OK=true

for package in "${!RECOMMENDED[@]}"; do
    recommended="${RECOMMENDED[$package]}"

    # Try to get installed version
    if [ -f "node_modules/$package/package.json" ]; then
        installed=$(node -p "require('./node_modules/$package/package.json').version" 2>/dev/null || echo "unknown")

        # Simple version comparison (ignores patch for minor updates)
        installed_major=$(echo "$installed" | cut -d. -f1)
        installed_minor=$(echo "$installed" | cut -d. -f2)
        recommended_major=$(echo "$recommended" | cut -d. -f1)
        recommended_minor=$(echo "$recommended" | cut -d. -f2)

        if [ "$installed_major" -eq "$recommended_major" ] && [ "$installed_minor" -ge "$recommended_minor" ]; then
            echo "✅ $package: $installed (recommended: ~$recommended)"
        else
            echo "⚠️  $package: $installed (recommended: ~$recommended)"
            ALL_OK=false
        fi
    else
        echo "❌ $package: NOT INSTALLED (recommended: ~$recommended)"
        ALL_OK=false
    fi
done

echo ""

if [ "$ALL_OK" = true ]; then
    echo "✅ All packages are at compatible versions!"
else
    echo "⚠️  Some packages need updating. Run:"
    echo "   npm install @thesysai/genui-sdk@^0.6.40 @crayonai/react-ui@^0.8.27 @crayonai/react-core@^0.7.6"
fi

echo ""
echo "For version compatibility matrix, see references/common-errors.md"

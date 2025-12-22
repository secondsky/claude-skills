#!/bin/bash
# Check installed AI SDK Core package versions against latest
# Usage: ./scripts/check-versions.sh

# Source common version checking functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../../scripts/check-versions-common.sh"

# Detect package manager
detect_package_manager

echo "==================================="
echo " AI SDK Core - Version Checker"
echo " Using: $PKG_MGR"
echo "==================================="
echo ""

# Define packages to check
packages=(
  "ai"
  "@ai-sdk/openai"
  "@ai-sdk/anthropic"
  "@ai-sdk/google"
  "workers-ai-provider"
  "zod"
)

# Check versions
check_package_versions "${packages[@]}"

# Show recommended versions
recommended_versions=(
  "ai: ^5.0.116"
  "@ai-sdk/openai: ^2.0.88"
  "@ai-sdk/anthropic: ^2.0.56"
  "@ai-sdk/google: ^2.0.51"
  "workers-ai-provider: ^2.0.0"
  "zod: ^3.23.8"
)

show_recommended_versions "Recommended Versions (AI SDK v5)" "${recommended_versions[@]}"

# Show install command
show_install_command "${packages[@]}"

#!/bin/bash

# TheSys Generative UI - Dependency Installation Script
#
# Installs all required packages for TheSys C1 integration
# Usage: ./scripts/install-dependencies.sh

set -e

echo "========================================="
echo "TheSys Generative UI - Dependency Installation"
echo "========================================="
echo ""

# Detect package manager
if command -v pnpm &> /dev/null; then
    PM="pnpm"
elif command -v npm &> /dev/null; then
    PM="npm"
else
    echo "❌ Error: No package manager found (npm or pnpm required)"
    exit 1
fi

echo "📦 Using package manager: $PM"
echo ""

# Core packages
echo "Installing core TheSys packages..."
$PM install @thesysai/genui-sdk@^0.6.40 \
    @crayonai/react-ui@^0.8.27 \
    @crayonai/react-core@^0.7.6 \
    @crayonai/stream@^0.1.0

# React dependencies (if not already installed)
echo ""
echo "Checking React dependencies..."
if ! $PM list react &> /dev/null; then
    echo "Installing React..."
    $PM install react@^19.0.0 react-dom@^19.0.0
fi

# Error boundary
echo ""
echo "Installing React Error Boundary..."
$PM install react-error-boundary@^5.0.0

# AI integration
echo ""
echo "Installing OpenAI SDK..."
$PM install openai@^4.73.0

# Tool calling
echo ""
echo "Installing Zod for tool calling..."
$PM install zod@^3.24.1 zod-to-json-schema@^3.24.1

# Optional dependencies
echo ""
read -p "Install optional dependencies (Tavily for web search)? [y/N]: " install_optional

if [[ $install_optional =~ ^[Yy]$ ]]; then
    echo "Installing optional dependencies..."
    $PM install @tavily/core@^1.0.0
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Set THESYS_API_KEY environment variable"
echo "2. Choose a template from templates/ directory"
echo "3. Start building!"
echo ""
echo "For help, see README.md or SKILL.md"

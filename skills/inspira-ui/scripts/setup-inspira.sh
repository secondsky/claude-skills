#!/bin/bash
# Inspira UI Setup Script
# Automates the installation and configuration of Inspira UI dependencies

set -e

echo "🎨 Inspira UI Setup Script"
echo "=========================="
echo ""

# Detect package manager
if command -v bun &> /dev/null; then
    PM="bun"
    ADD_CMD="bun add"
    ADD_DEV_CMD="bun add -d"
    echo "✅ Detected: Bun"
elif command -v pnpm &> /dev/null; then
    PM="pnpm"
    ADD_CMD="pnpm add"
    ADD_DEV_CMD="pnpm add -D"
    echo "✅ Detected: pnpm"
elif command -v npm &> /dev/null; then
    PM="npm"
    ADD_CMD="npm install"
    ADD_DEV_CMD="npm install -D"
    echo "✅ Detected: npm"
else
    echo "❌ No package manager found. Please install bun, npm, or pnpm."
    exit 1
fi

echo ""

# Check for existing TailwindCSS
if [ -f "tailwind.config.js" ] || [ -f "tailwind.config.ts" ]; then
    echo "✅ TailwindCSS config detected"
else
    echo "⚠️  No TailwindCSS config found. Make sure to install TailwindCSS v4+"
    echo "   Visit: https://tailwindcss.com/docs/installation"
fi

echo ""
echo "📦 Installing core dependencies..."
$ADD_DEV_CMD clsx tailwind-merge class-variance-authority tw-animate-css

echo ""
echo "📦 Installing animation dependencies..."
$ADD_CMD @vueuse/core motion-v

echo ""
read -p "Install Three.js? (for 3D components) [y/N]: " install_three
if [[ $install_three =~ ^[Yy]$ ]]; then
    echo "📦 Installing Three.js..."
    $ADD_CMD three @types/three
fi

echo ""
read -p "Install OGL? (for WebGL components) [y/N]: " install_ogl
if [[ $install_ogl =~ ^[Yy]$ ]]; then
    echo "📦 Installing OGL..."
    $ADD_CMD ogl
fi

echo ""
read -p "Install GSAP? (for advanced animations) [y/N]: " install_gsap
if [[ $install_gsap =~ ^[Yy]$ ]]; then
    echo "📦 Installing GSAP..."
    $ADD_CMD gsap
fi

echo ""
echo "✅ Dependencies installed!"
echo ""

# Create utils directory if it doesn't exist
if [ ! -d "lib" ] && [ ! -d "utils" ]; then
    echo "📁 Creating lib directory..."
    mkdir -p lib
    UTILS_DIR="lib"
elif [ -d "lib" ]; then
    UTILS_DIR="lib"
else
    UTILS_DIR="utils"
fi

# Create cn utility if it doesn't exist
if [ ! -f "$UTILS_DIR/utils.ts" ]; then
    echo "📝 Creating cn utility at $UTILS_DIR/utils.ts..."
    cat > "$UTILS_DIR/utils.ts" << 'EOF'
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ObjectValues<T> = T[keyof T];
EOF
    echo "✅ Created $UTILS_DIR/utils.ts"
else
    echo "✅ Utils file already exists at $UTILS_DIR/utils.ts"
fi

echo ""
echo "📝 Next steps:"
echo "1. Add CSS variables to your main.css (see SKILL.md for complete setup)"
echo "2. Follow motion-v setup guide: https://motion.dev/docs/vue"
echo "3. Browse components at: https://inspira-ui.com/components"
echo "4. Copy and paste components into your project"
echo ""
echo "🎉 Setup complete! Start building with Inspira UI!"

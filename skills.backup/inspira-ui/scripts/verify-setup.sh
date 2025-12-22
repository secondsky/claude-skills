#!/bin/bash

# Inspira UI Setup Verification Script
# Verifies that all required dependencies and configurations are in place

set -e

echo "🔍 Inspira UI Setup Verification"
echo "================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check if a package exists in package.json
check_package() {
  local pkg=$1
  local required=$2

  if [ -f "package.json" ]; then
    if grep -q "\"$pkg\"" package.json 2>/dev/null; then
      echo -e "${GREEN}✅ $pkg${NC}"
      return 0
    else
      if [ "$required" = "required" ]; then
        echo -e "${RED}❌ $pkg (MISSING - required)${NC}"
        ((ERRORS++))
      else
        echo -e "${YELLOW}⚠️  $pkg (not installed - optional)${NC}"
        ((WARNINGS++))
      fi
      return 1
    fi
  else
    echo -e "${RED}❌ package.json not found${NC}"
    ((ERRORS++))
    return 1
  fi
}

# Function to check if a file contains a string
check_file_contains() {
  local file=$1
  local pattern=$2
  local description=$3
  local required=$4

  if [ -f "$file" ]; then
    if grep -q "$pattern" "$file" 2>/dev/null; then
      echo -e "${GREEN}✅ $description${NC}"
      return 0
    else
      if [ "$required" = "required" ]; then
        echo -e "${RED}❌ $description (MISSING in $file)${NC}"
        ((ERRORS++))
      else
        echo -e "${YELLOW}⚠️  $description (not found in $file)${NC}"
        ((WARNINGS++))
      fi
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️  $file not found${NC}"
    ((WARNINGS++))
    return 1
  fi
}

echo "📦 Checking Core Dependencies..."
echo "--------------------------------"
check_package "clsx" "required"
check_package "tailwind-merge" "required"
check_package "class-variance-authority" "required"
check_package "tw-animate-css" "required"
check_package "@vueuse/core" "required"
check_package "motion-v" "required"
echo ""

echo "📦 Checking Optional Dependencies..."
echo "-------------------------------------"
check_package "three" "optional"
check_package "@types/three" "optional"
check_package "ogl" "optional"
check_package "gsap" "optional"
check_package "canvas-confetti" "optional"
echo ""

echo "🎨 Checking CSS Configuration..."
echo "---------------------------------"

# Find CSS files
CSS_FILES=""
for pattern in "src/assets/main.css" "assets/main.css" "src/styles/main.css" "styles/main.css" "app.css" "src/app.css"; do
  if [ -f "$pattern" ]; then
    CSS_FILES="$pattern"
    break
  fi
done

if [ -z "$CSS_FILES" ]; then
  # Try to find any CSS file with tailwind import
  CSS_FILES=$(find . -name "*.css" -path "./src/*" -o -name "*.css" -path "./assets/*" 2>/dev/null | head -1)
fi

if [ -n "$CSS_FILES" ]; then
  echo "Found CSS file: $CSS_FILES"
  check_file_contains "$CSS_FILES" '@import "tailwindcss"' "TailwindCSS import" "required"
  check_file_contains "$CSS_FILES" '@import "tw-animate-css"' "tw-animate-css import" "required"
  check_file_contains "$CSS_FILES" "var(--background)" "CSS variables (--background)" "required"
  check_file_contains "$CSS_FILES" "var(--foreground)" "CSS variables (--foreground)" "required"
  check_file_contains "$CSS_FILES" "@theme inline" "@theme inline block" "required"
  check_file_contains "$CSS_FILES" "--destructive-foreground" "Destructive foreground variable" "required"
else
  echo -e "${YELLOW}⚠️  No main CSS file found. Create one in src/assets/main.css or similar.${NC}"
  ((WARNINGS++))
fi
echo ""

echo "🛠️  Checking CN Utility..."
echo "---------------------------"

# Find utils file
UTILS_FILES=""
for pattern in "lib/utils.ts" "src/lib/utils.ts" "utils/index.ts" "src/utils/index.ts"; do
  if [ -f "$pattern" ]; then
    UTILS_FILES="$pattern"
    break
  fi
done

if [ -n "$UTILS_FILES" ]; then
  echo "Found utils file: $UTILS_FILES"
  check_file_contains "$UTILS_FILES" "export function cn" "cn() utility function" "required"
  check_file_contains "$UTILS_FILES" "twMerge" "tailwind-merge usage" "required"
  check_file_contains "$UTILS_FILES" "clsx" "clsx usage" "required"
else
  echo -e "${RED}❌ CN utility file not found. Create lib/utils.ts${NC}"
  ((ERRORS++))
fi
echo ""

echo "📁 Checking Project Structure..."
echo "---------------------------------"

if [ -d "components/ui" ] || [ -d "src/components/ui" ]; then
  echo -e "${GREEN}✅ components/ui directory exists${NC}"
else
  echo -e "${YELLOW}⚠️  components/ui directory not found (create when copying components)${NC}"
  ((WARNINGS++))
fi

if [ -f "tsconfig.json" ]; then
  echo -e "${GREEN}✅ TypeScript configured${NC}"
else
  echo -e "${YELLOW}⚠️  tsconfig.json not found (TypeScript recommended)${NC}"
  ((WARNINGS++))
fi

# Check for Vue or Nuxt
if [ -f "nuxt.config.ts" ] || [ -f "nuxt.config.js" ]; then
  echo -e "${GREEN}✅ Nuxt project detected${NC}"
elif grep -q '"vue"' package.json 2>/dev/null; then
  echo -e "${GREEN}✅ Vue project detected${NC}"
else
  echo -e "${YELLOW}⚠️  Neither Vue nor Nuxt detected in package.json${NC}"
  ((WARNINGS++))
fi
echo ""

echo "📊 Verification Summary"
echo "======================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 All checks passed! Your Inspira UI setup is complete.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Browse components at https://inspira-ui.com/components"
  echo "2. Copy components into your components/ui/ directory"
  echo "3. Import and use in your pages/components"
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Setup mostly complete with $WARNINGS warning(s).${NC}"
  echo ""
  echo "Warnings are optional dependencies or non-critical configurations."
  echo "Your project should work fine, but consider addressing the warnings."
else
  echo -e "${RED}❌ Setup incomplete with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
  echo ""
  echo "Please fix the errors above before using Inspira UI components."
  echo "Refer to references/SETUP.md for complete setup instructions."
  exit 1
fi

echo ""
echo "For detailed setup instructions: references/SETUP.md"
echo "For troubleshooting: references/TROUBLESHOOTING.md"
echo ""

exit 0

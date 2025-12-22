#!/bin/bash
#
# AI Elements Chatbot Setup Script
# Automated initialization of AI Elements in a Next.js project
#
# Prerequisites:
# - Next.js 15+ with App Router
# - shadcn/ui initialized (components.json exists)
# - pnpm installed
#
# Usage:
#   chmod +x scripts/setup-ai-elements.sh
#   ./scripts/setup-ai-elements.sh
#

set -e  # Exit on error

echo "🤖 AI Elements Chatbot Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: No package.json found${NC}"
  echo "Please run this script from your project root directory"
  exit 1
fi

echo "✅ Found package.json"
echo ""

# Check Next.js
echo "Checking Next.js..."
if ! grep -q '"next"' package.json; then
  echo -e "${RED}❌ Next.js not found in package.json${NC}"
  echo "Install with: pnpm add next@latest react@latest react-dom@latest"
  exit 1
fi

NEXT_VERSION=$(node -e "console.log(require('./package.json').dependencies.next || require('./package.json').devDependencies.next)" 2>/dev/null || echo "unknown")
echo -e "${GREEN}✅ Next.js found: $NEXT_VERSION${NC}"
echo ""

# Check shadcn/ui
echo "Checking shadcn/ui..."
if [ ! -f "components.json" ]; then
  echo -e "${RED}❌ shadcn/ui not initialized (components.json missing)${NC}"
  echo "Initialize with: pnpm dlx shadcn@latest init"
  exit 1
fi

echo -e "${GREEN}✅ shadcn/ui initialized${NC}"
echo ""

# Check AI SDK
echo "Checking AI SDK..."
if ! grep -q '"ai"' package.json; then
  echo -e "${YELLOW}⚠️  AI SDK not found. Installing...${NC}"
  pnpm add ai@latest
  echo -e "${GREEN}✅ AI SDK installed${NC}"
else
  AI_VERSION=$(node -e "console.log(require('./package.json').dependencies.ai || require('./package.json').devDependencies.ai)" 2>/dev/null || echo "unknown")
  echo -e "${GREEN}✅ AI SDK found: $AI_VERSION${NC}"
fi
echo ""

# Check Tailwind v4
echo "Checking Tailwind CSS..."
if ! grep -q '@tailwindcss/vite' package.json; then
  echo -e "${YELLOW}⚠️  Warning: @tailwindcss/vite not found${NC}"
  echo "AI Elements requires Tailwind v4 with Vite plugin"
  echo "Use the 'tailwind-v4-shadcn' skill to set this up properly"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo -e "${GREEN}✅ Tailwind v4 configured${NC}"
fi
echo ""

# Initialize AI Elements
echo "Initializing AI Elements..."
pnpm dlx ai-elements@latest init

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ AI Elements initialized${NC}"
else
  echo -e "${RED}❌ Failed to initialize AI Elements${NC}"
  exit 1
fi
echo ""

# Add core components
echo "Adding core chat components..."
echo "This will install: message, message-content, conversation, response, prompt-input, actions"
echo ""

pnpm dlx ai-elements@latest add message message-content conversation response prompt-input actions

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Core components added${NC}"
else
  echo -e "${RED}❌ Failed to add components${NC}"
  exit 1
fi
echo ""

# Verify installation
echo "Verifying installation..."
if [ -d "components/ui/ai" ]; then
  COMPONENT_COUNT=$(ls -1 components/ui/ai/*.tsx 2>/dev/null | wc -l)
  echo -e "${GREEN}✅ Found $COMPONENT_COUNT components in components/ui/ai/${NC}"
  echo ""
  echo "Installed components:"
  ls -1 components/ui/ai/ | sed 's/^/  - /'
else
  echo -e "${RED}❌ components/ui/ai/ directory not found${NC}"
  exit 1
fi
echo ""

# Check components.json for AI Elements registry
if grep -q "ai-elements" components.json; then
  echo -e "${GREEN}✅ AI Elements registry configured in components.json${NC}"
else
  echo -e "${YELLOW}⚠️  Warning: AI Elements registry not found in components.json${NC}"
  echo "This may cause issues. Try re-running: pnpm dlx ai-elements@latest init"
fi
echo ""

# Summary
echo "=============================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo ""
echo "1. Create an API route for chat:"
echo "   File: app/api/chat/route.ts"
echo ""
echo "   import { openai } from '@ai-sdk/openai';"
echo "   import { streamText } from 'ai';"
echo ""
echo "   export async function POST(req: Request) {"
echo "     const { messages } = await req.json();"
echo "     const result = streamText({"
echo "       model: openai('gpt-4o'),"
echo "       messages,"
echo "     });"
echo "     return result.toDataStreamResponse();"
echo "   }"
echo ""
echo "2. Create a chat page:"
echo "   File: app/chat/page.tsx"
echo "   (See SKILL.md for complete example)"
echo ""
echo "3. Add more components as needed:"
echo "   pnpm dlx ai-elements@latest add tool          # For tool calling"
echo "   pnpm dlx ai-elements@latest add reasoning     # For thinking display"
echo "   pnpm dlx ai-elements@latest add sources       # For citations"
echo "   pnpm dlx ai-elements@latest add code-block    # For code highlighting"
echo ""
echo "4. Start dev server:"
echo "   pnpm dev"
echo ""
echo "Full documentation: See ai-elements-chatbot/SKILL.md"
echo ""

#!/bin/bash
# Test Gemini CLI and gemini-coach installation
# Part of gemini-cli-integration skill

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing Gemini CLI Integration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Check if Gemini CLI is installed
echo "1️⃣  Checking Gemini CLI installation..."
if ! command -v gemini &> /dev/null; then
  echo "   ❌ Gemini CLI not found"
  echo ""
  echo "   Install with:"
  echo "     npm install -g @google/gemini-cli"
  echo ""
  exit 1
else
  echo "   ✅ Gemini CLI found"
  gemini --version 2>&1 | sed 's/^/   /'
fi

echo ""

# Test 2: Check if gemini-coach is installed
echo "2️⃣  Checking gemini-coach installation..."
if ! command -v gemini-coach &> /dev/null; then
  echo "   ❌ gemini-coach not found"
  echo ""
  echo "   Install with:"
  echo "     ./scripts/install-gemini-coach.sh"
  echo ""
  exit 1
else
  echo "   ✅ gemini-coach found at: $(which gemini-coach)"
fi

echo ""

# Test 3: Check if ~/.local/bin is in PATH
echo "3️⃣  Checking PATH configuration..."
if echo "$PATH" | grep -q "$HOME/.local/bin"; then
  echo "   ✅ ~/.local/bin is in PATH"
else
  echo "   ⚠️  ~/.local/bin is NOT in PATH"
  echo ""
  echo "   Add to ~/.bashrc or ~/.zshrc:"
  echo "     export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo ""
fi

echo ""

# Test 4: Test gemini-coach quick command
echo "4️⃣  Testing gemini-coach with quick question..."
echo "   Running: gemini-coach quick \"What is 2+2?\""
echo ""

if output=$(gemini-coach quick "What is 2+2?" 2>&1); then
  echo "   ✅ gemini-coach executed successfully"
  echo ""
  echo "   Response preview:"
  echo "$output" | head -5 | sed 's/^/   /'
  echo ""
else
  echo "   ❌ gemini-coach failed"
  echo ""
  echo "   Error:"
  echo "$output" | sed 's/^/   /'
  echo ""
  echo "   Common issues:"
  echo "   • Not authenticated: Run 'gemini' and follow auth prompts"
  echo "   • Rate limit exceeded: Wait 1-5 minutes"
  echo "   • Network issue: Check internet connection"
  echo ""
  exit 1
fi

# Test 5: Check if /ask-gemini slash command is installed
echo "5️⃣  Checking /ask-gemini slash command..."
if [ -f "$HOME/.claude/commands/ask-gemini.md" ]; then
  echo "   ✅ /ask-gemini command found"
else
  echo "   ⚠️  /ask-gemini command not found"
  echo ""
  echo "   Install with:"
  echo "     ./scripts/setup-slash-command.sh"
  echo ""
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You can now use:"
echo "  gemini-coach quick \"Your question\""
echo "  gemini-coach review src/file.ts"
echo "  gemini-coach architect \"Question\" ."
echo "  gemini-coach security-scan ./src"
echo ""
echo "Or from Claude Code sessions:"
echo "  /ask-gemini Your question here"
echo ""

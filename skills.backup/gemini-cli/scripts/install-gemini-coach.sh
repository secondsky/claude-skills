#!/bin/bash
# Install gemini-coach script to ~/.local/bin/
# Part of gemini-cli-integration skill

set -e

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="$HOME/.local/bin"
SCRIPT_NAME="gemini-coach"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Installing gemini-coach to ~/.local/bin/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if source file exists
if [ ! -f "$SKILL_DIR/assets/$SCRIPT_NAME" ]; then
  echo "❌ Error: $SKILL_DIR/assets/$SCRIPT_NAME not found"
  echo ""
  echo "Make sure you're running this from the skill directory:"
  echo "  cd /path/to/claude-skills/skills/gemini-cli-integration/"
  echo "  ./scripts/install-gemini-coach.sh"
  exit 1
fi

# Create ~/.local/bin if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
  echo "Creating $INSTALL_DIR..."
  mkdir -p "$INSTALL_DIR"
fi

# Copy script
echo "Copying $SCRIPT_NAME to $INSTALL_DIR..."
cp "$SKILL_DIR/assets/$SCRIPT_NAME" "$INSTALL_DIR/"

# Make executable
echo "Making executable..."
chmod +x "$INSTALL_DIR/$SCRIPT_NAME"

# Check if ~/.local/bin is in PATH
if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  echo ""
  echo "⚠️  WARNING: $INSTALL_DIR is not in your PATH"
  echo ""
  echo "Add this to your ~/.bashrc or ~/.zshrc:"
  echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
  echo ""
  echo "Then run:"
  echo "  source ~/.bashrc  # or source ~/.zshrc"
else
  echo ""
  echo "✅ $INSTALL_DIR is already in your PATH"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test with:"
echo "  gemini-coach quick \"Test question\""
echo ""
echo "Or run the test script:"
echo "  ./scripts/test-connection.sh"
echo ""

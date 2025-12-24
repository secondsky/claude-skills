#!/bin/bash
# Multi-AI Consultant - API Setup Script
# Guides user through setting up Gemini and Codex API keys

set -e

echo "=== Multi-AI Consultant API Setup ==="
echo ""

# Check if CLIs are installed
GEMINI_INSTALLED=false
CODEX_INSTALLED=false

if command -v gemini &>/dev/null; then
  GEMINI_INSTALLED=true
fi

if command -v codex &>/dev/null; then
  CODEX_INSTALLED=true
fi

# Gemini Setup
echo "--- Gemini API Setup (Required) ---"
echo ""

if [ "$GEMINI_INSTALLED" = false ]; then
  echo "❌ Gemini CLI not installed"
  echo ""
  echo "Install with:"
  echo "  npm install -g @google/generative-ai-cli"
  echo ""
  read -p "Install now? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g @google/generative-ai-cli
    echo "✅ Gemini CLI installed"
  else
    echo "Skipping Gemini CLI installation"
    echo "You can install later with: npm install -g @google/generative-ai-cli"
  fi
  echo ""
else
  echo "✅ Gemini CLI installed"
fi

# Check if API key is set
if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ GEMINI_API_KEY not set"
  echo ""
  echo "Get your API key:"
  echo "  1. Visit: https://aistudio.google.com/apikey"
  echo "  2. Create or copy your API key"
  echo ""
  read -p "Enter your Gemini API key: " GEMINI_KEY

  if [ -n "$GEMINI_KEY" ]; then
    # Add to ~/.bashrc
    echo "" >> ~/.bashrc
    echo "# Gemini API (Multi-AI Consultant skill)" >> ~/.bashrc
    echo "export GEMINI_API_KEY=\"$GEMINI_KEY\"" >> ~/.bashrc
    echo "✅ Added GEMINI_API_KEY to ~/.bashrc"

    # Set for current session
    export GEMINI_API_KEY="$GEMINI_KEY"

    # Test it
    echo ""
    echo "Testing Gemini CLI..."
    if gemini -p "test" &>/dev/null; then
      echo "✅ Gemini CLI working!"
    else
      echo "❌ Gemini CLI test failed. Check your API key."
    fi
  else
    echo "⚠️  No API key entered. You'll need to set it manually:"
    echo "  export GEMINI_API_KEY=\"your-key\""
  fi
else
  echo "✅ GEMINI_API_KEY already set"

  # Test it
  echo "Testing Gemini CLI..."
  if gemini -p "test" &>/dev/null; then
    echo "✅ Gemini CLI working!"
  else
    echo "❌ Gemini CLI test failed. Check your API key."
  fi
fi

echo ""
echo "--- Codex API Setup (Optional) ---"
echo ""

if [ "$CODEX_INSTALLED" = false ]; then
  echo "ℹ️  Codex CLI not installed (optional)"
  echo ""
  echo "Codex provides OpenAI GPT-4 consultations with repo-aware analysis."
  echo ""
  read -p "Install Codex CLI? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm install -g codex
    echo "✅ Codex CLI installed"
  else
    echo "Skipping Codex CLI installation"
    echo "You can install later with: npm install -g codex"
  fi
  echo ""
else
  echo "✅ Codex CLI installed"
fi

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "ℹ️  OPENAI_API_KEY not set (optional)"
  echo ""
  read -p "Do you have an OpenAI API key? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Get your OpenAI API key:"
    echo "  1. Visit: https://platform.openai.com/api-keys"
    echo "  2. Create or copy your API key"
    echo ""
    read -p "Enter your OpenAI API key: " OPENAI_KEY

    if [ -n "$OPENAI_KEY" ]; then
      # Add to ~/.bashrc
      echo "" >> ~/.bashrc
      echo "# OpenAI API (Multi-AI Consultant skill)" >> ~/.bashrc
      echo "export OPENAI_API_KEY=\"$OPENAI_KEY\"" >> ~/.bashrc
      echo "✅ Added OPENAI_API_KEY to ~/.bashrc"

      # Set for current session
      export OPENAI_API_KEY="$OPENAI_KEY"

      # Test it (if openai CLI installed)
      if command -v openai &>/dev/null; then
        echo ""
        echo "Testing OpenAI API..."
        if openai api models.list &>/dev/null; then
          echo "✅ OpenAI API working!"
        else
          echo "❌ OpenAI API test failed. Check your API key."
        fi
      fi
    else
      echo "⚠️  No API key entered. You'll need to set it manually:"
      echo "  export OPENAI_API_KEY=\"sk-...\""
    fi
  else
    echo "That's fine! You can still use:"
    echo "  - Gemini consultations (web research, thinking)"
    echo "  - Fresh Claude consultations (free)"
  fi
else
  echo "✅ OPENAI_API_KEY already set"

  # Test it (if openai CLI installed)
  if command -v openai &>/dev/null; then
    echo "Testing OpenAI API..."
    if openai api models.list &>/dev/null; then
      echo "✅ OpenAI API working!"
    else
      echo "❌ OpenAI API test failed. Check your API key."
    fi
  fi
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Available consultations:"

if [ -n "$GEMINI_API_KEY" ]; then
  echo "  ✅ /consult-gemini - Web research, thinking, grounding"
else
  echo "  ❌ /consult-gemini - Need GEMINI_API_KEY"
fi

if [ -n "$OPENAI_API_KEY" ]; then
  echo "  ✅ /consult-codex - Repo-aware, code review"
else
  echo "  ⚠️  /consult-codex - Optional (need OPENAI_API_KEY)"
fi

echo "  ✅ /consult-claude - Free, fast, fresh perspective"
echo "  ✅ /consult-ai - Auto-choose based on problem"

echo ""
echo "Next steps:"
echo "  1. Source your shell config: source ~/.bashrc"
echo "  2. Copy templates to your project:"
echo "     cp ~/.claude/skills/multi-ai-consultant/templates/GEMINI.md ./"
echo "     cp ~/.claude/skills/multi-ai-consultant/templates/codex.md ./"
echo "     cp ~/.claude/skills/multi-ai-consultant/templates/.geminiignore ./"
echo "  3. Start using: Just say 'I'm stuck' to Claude Code"
echo ""
echo "Documentation:"
echo "  ~/.claude/skills/multi-ai-consultant/SKILL.md"
echo "  ~/.claude/skills/multi-ai-consultant/README.md"
echo ""

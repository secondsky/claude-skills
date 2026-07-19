#!/bin/bash
# Multi-AI Consultant - API Setup Script
# Guides user through setting up Gemini and Codex API keys
#
# Security note: by default API keys are written to a dedicated, mode-0600
# file at ~/.config/multi-ai-consultant/secrets.env (with its parent
# directory mode 0700), and only a `source` line is appended to ~/.bashrc.
# This keeps the raw key values out of the world/grep-friendly ~/.bashrc.
#
# Most secure option: store keys in your OS keychain instead (see guidance
# printed at the end of this script) and skip the file write entirely.
#
# Flags:
#   --legacy-bashrc   Preserve the old behavior of writing raw
#                     `export KEY=...` lines directly to ~/.bashrc. This is
#                     less secure (the values sit in a globally-readable
#                     config file) and is provided only for backward
#                     compatibility.

set -e

LEGACY_BASHRC=false
if [ "${1:-}" = "--legacy-bashrc" ]; then
  LEGACY_BASHRC=true
fi

# Paths for the dedicated secrets file (mode 0600) and its directory (0700).
SECRETS_DIR="$HOME/.config/multi-ai-consultant"
SECRETS_FILE="$SECRETS_DIR/secrets.env"

# ensure_secrets_store: create the dedicated secrets dir + file with safe
# permissions. Idempotent.
ensure_secrets_store() {
  if [ "$LEGACY_BASHRC" = "true" ]; then
    return 0
  fi
  if [ ! -d "$SECRETS_DIR" ]; then
    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"
  fi
  if [ ! -f "$SECRETS_FILE" ]; then
    touch "$SECRETS_FILE"
    chmod 600 "$SECRETS_FILE"
  fi
}

# write_secret KEYNAME VALUE
# In default mode: appends `export KEYNAME="VALUE"` to $SECRETS_FILE if the
# key is not already present, and ensures ~/.bashrc sources that file once.
# In --legacy-bashrc mode: appends the raw export line to ~/.bashrc.
write_secret() {
  local key="$1"
  local val="$2"

  if [ "$LEGACY_BASHRC" = "true" ]; then
    # Old behavior: raw exports in ~/.bashrc (less secure).
    if ! grep -qE "^export ${key}=" ~/.bashrc 2>/dev/null; then
      {
        echo ""
        echo "# ${key} (Multi-AI Consultant skill)"
        echo "export ${key}=\"${val}\""
      } >> ~/.bashrc
    fi
    return 0
  fi

  ensure_secrets_store

  # Remove any prior line for this key, then append the fresh value. The
  # file is mode 0600 so only the owner can read it.
  if grep -qE "^export ${key}=" "$SECRETS_FILE" 2>/dev/null; then
    # Rewrite without the old line for this key (preserves other keys).
    local tmp
    tmp=$(mktemp)
    grep -vE "^export ${key}=" "$SECRETS_FILE" > "$tmp" || true
    {
      cat "$tmp"
      echo "export ${key}=\"${val}\""
    } > "$SECRETS_FILE"
    rm -f "$tmp"
    chmod 600 "$SECRETS_FILE"
  else
    echo "export ${key}=\"${val}\"" >> "$SECRETS_FILE"
    chmod 600 "$SECRETS_FILE"
  fi

  # Ensure ~/.bashrc sources the secrets file exactly once.
  if ! grep -qE "^source +\"?${SECRETS_FILE}\"?|^\. +\"?${SECRETS_FILE}\"?" ~/.bashrc 2>/dev/null; then
    {
      echo ""
      echo "# Multi-AI Consultant API keys (kept in a mode-0600 file, not here)"
      echo "source \"${SECRETS_FILE}\""
    } >> ~/.bashrc
  fi
}

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
    write_secret "GEMINI_API_KEY" "$GEMINI_KEY"
    if [ "$LEGACY_BASHRC" = "true" ]; then
      echo "✅ Added GEMINI_API_KEY to ~/.bashrc (legacy mode)"
    else
      echo "✅ Stored GEMINI_API_KEY in ${SECRETS_FILE} (mode 600); ~/.bashrc sources this file"
    fi

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
      write_secret "OPENAI_API_KEY" "$OPENAI_KEY"
      if [ "$LEGACY_BASHRC" = "true" ]; then
        echo "✅ Added OPENAI_API_KEY to ~/.bashrc (legacy mode)"
      else
        echo "✅ Stored OPENAI_API_KEY in ${SECRETS_FILE} (mode 600); ~/.bashrc sources this file"
      fi

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
if [ "$LEGACY_BASHRC" = "true" ]; then
  echo "  1. Source your shell config: source ~/.bashrc"
else
  echo "  1. Source your shell config: source ~/.bashrc"
  echo "     (keys live in ${SECRETS_FILE}, mode 600)"
fi
echo "  2. Copy templates to your project:"
echo "     cp ~/.claude/skills/multi-ai-consultant/templates/GEMINI.md ./"
echo "     cp ~/.claude/skills/multi-ai-consultant/templates/codex.md ./"
echo "     cp ~/.claude/skills/multi-ai-consultant/templates/.geminiignore ./"
echo "  3. Start using: Just say 'I'm stuck' to Claude Code"
echo ""

# Security guidance
echo "Security notes:"
if [ "$LEGACY_BASHRC" = "true" ]; then
  echo "  ⚠️  --legacy-bashrc: API keys were written as raw exports to ~/.bashrc."
  echo "      Anyone with read access to your home directory can read them."
  echo "      Consider re-running without --legacy-bashrc, or moving the keys"
  echo "      to your OS keychain (see below)."
else
  echo "  ✅ API keys are stored in ${SECRETS_FILE} (mode 600)."
  echo "      Parent directory ${SECRETS_DIR} is mode 700."
fi
echo ""
echo "  Most secure option: OS keychain"
echo "    macOS:   security add-generic-password -a \"\$USER\" -s \"GEMINI_API_KEY\" -w"
echo "             security add-generic-password -a \"\$USER\" -s \"OPENAI_API_KEY\" -w"
echo "             # retrieve with:"
echo "             #   export GEMINI_API_KEY=\$(security find-generic-password -a \"\$USER\" -s \"GEMINI_API_KEY\" -w)"
echo "    Linux:   secret-tool store api-key gemini --label='Multi-AI Consultant'"
echo "             secret-tool store api-key openai  --label='Multi-AI Consultant'"
echo "             # retrieve with:"
echo "             #   export GEMINI_API_KEY=\$(secret-tool lookup api-key gemini)"
echo ""
echo "Rotation / removal:"
echo "  To delete stored keys:  rm -f ${SECRETS_FILE}"
echo "  Also remove the 'source ${SECRETS_FILE}' line from ~/.bashrc."
echo "  To revoke a key itself, use the provider dashboard:"
echo "    Gemini: https://aistudio.google.com/apikey"
echo "    OpenAI: https://platform.openai.com/api-keys"
echo ""
echo "Documentation:"
echo "  ~/.claude/skills/multi-ai-consultant/SKILL.md"
echo "  ~/.claude/skills/multi-ai-consultant/README.md"
echo ""

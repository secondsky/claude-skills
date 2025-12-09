#!/usr/bin/env bash

set -euo pipefail

missing=()

for key in OPENAI_API_KEY ANTHROPIC_API_KEY GEMINI_API_KEY OLLAMA_HOST; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if [[ ${#missing[@]} -eq 4 ]]; then
  echo "No provider credentials found. Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or OLLAMA_HOST."
  exit 1
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing optional keys: ${missing[*]}"
else
  echo "All provider keys present. Ready to stream."
fi

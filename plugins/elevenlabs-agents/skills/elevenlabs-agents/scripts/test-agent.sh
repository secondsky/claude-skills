#!/bin/bash
# Run automated tests on ElevenLabs agent

set -e

AGENT_NAME="${1:-Support Agent}"

echo "Testing ElevenLabs agent: $AGENT_NAME"

# Check if CLI is installed
if ! command -v elevenlabs &> /dev/null; then
    echo "Error: @elevenlabs/cli is not installed"
    echo "Install with: npm install -g @elevenlabs/cli"
    exit 1
fi

# Check if authenticated
if ! elevenlabs auth whoami &> /dev/null; then
    echo "Not authenticated. Please login:"
    elevenlabs auth login
fi

# Push tests to platform
if [ -f "tests.json" ]; then
    echo "Deploying tests..."
    elevenlabs tests push
fi

# Run agent tests
echo "Running tests for: $AGENT_NAME"
elevenlabs agents test "$AGENT_NAME"

echo "✓ Tests completed!"

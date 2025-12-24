#!/bin/bash
# Create ElevenLabs agent using CLI

set -e

AGENT_NAME="${1:-Support Agent}"
TEMPLATE="${2:-customer-service}"
ENV="${3:-dev}"

echo "Creating ElevenLabs agent..."
echo "Name: $AGENT_NAME"
echo "Template: $TEMPLATE"
echo "Environment: $ENV"

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

# Initialize project if not already initialized
if [ ! -f "agents.json" ]; then
    echo "Initializing project..."
    elevenlabs agents init
fi

# Create agent
echo "Creating agent: $AGENT_NAME"
elevenlabs agents add "$AGENT_NAME" --template "$TEMPLATE"

# Push to platform
echo "Deploying to environment: $ENV"
elevenlabs agents push --env "$ENV"

echo "✓ Agent created successfully!"
echo "Edit configuration in: agent_configs/"
echo "Test with: elevenlabs agents test \"$AGENT_NAME\""

#!/bin/bash
# Multi-environment deployment for ElevenLabs agents

set -e

ENV="${1:-dev}"
AGENT_NAME="${2}"

echo "Deploying ElevenLabs agent to environment: $ENV"

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

# Dry run first to show changes
echo "Preview of changes for $ENV:"
if [ -n "$AGENT_NAME" ]; then
    elevenlabs agents push --env "$ENV" --agent "$AGENT_NAME" --dry-run
else
    elevenlabs agents push --env "$ENV" --dry-run
fi

# Confirm deployment
read -p "Deploy to $ENV? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -n "$AGENT_NAME" ]; then
        elevenlabs agents push --env "$ENV" --agent "$AGENT_NAME"
    else
        elevenlabs agents push --env "$ENV"
    fi
    echo "✓ Deployment to $ENV completed successfully!"
else
    echo "Deployment cancelled"
    exit 0
fi

#!/bin/bash
# Programmatically simulate conversation for testing

set -e

AGENT_ID="${1}"
SIMULATION_FILE="${2:-simulation.json}"

if [ -z "$AGENT_ID" ]; then
    echo "Usage: ./simulate-conversation.sh <agent_id> [simulation_file]"
    echo "Example: ./simulate-conversation.sh agent_abc123 simulation.json"
    exit 1
fi

# Check if API key is set
if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "Error: ELEVENLABS_API_KEY environment variable not set"
    exit 1
fi

# Check if simulation file exists
if [ ! -f "$SIMULATION_FILE" ]; then
    echo "Creating example simulation file: $SIMULATION_FILE"
    cat > "$SIMULATION_FILE" << 'EOF'
{
  "scenario": "Customer requests refund",
  "user_messages": [
    "I want a refund for order #12345",
    "I ordered it last week",
    "Yes, please process it"
  ],
  "success_criteria": [
    "Agent acknowledges request",
    "Agent asks for order details",
    "Agent provides refund timeline"
  ]
}
EOF
    echo "Example simulation file created. Edit $SIMULATION_FILE and run again."
    exit 0
fi

echo "Running conversation simulation..."
echo "Agent ID: $AGENT_ID"
echo "Simulation file: $SIMULATION_FILE"

# Run simulation
curl -X POST "https://api.elevenlabs.io/v1/convai/agents/$AGENT_ID/simulate" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$SIMULATION_FILE" | jq .

echo "✓ Simulation completed!"

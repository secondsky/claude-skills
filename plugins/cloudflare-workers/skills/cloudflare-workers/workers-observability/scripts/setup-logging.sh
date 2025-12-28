#!/bin/bash
# Setup Logging and Observability for Cloudflare Workers
#
# Features:
# - Enables observability in wrangler.jsonc
# - Configures Analytics Engine dataset
# - Creates Tail Worker scaffold
# - Sets up KV namespace for rate limiting
#
# Usage:
#   ./setup-logging.sh
#   ./setup-logging.sh --with-tail-worker
#   ./setup-logging.sh --analytics-only

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
WORKER_NAME=""
WITH_TAIL_WORKER=false
ANALYTICS_ONLY=false
TAIL_WORKER_NAME="log-aggregator"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-tail-worker)
      WITH_TAIL_WORKER=true
      shift
      ;;
    --analytics-only)
      ANALYTICS_ONLY=true
      shift
      ;;
    --tail-worker-name)
      TAIL_WORKER_NAME="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --with-tail-worker     Create a Tail Worker for log aggregation"
      echo "  --analytics-only       Only set up Analytics Engine"
      echo "  --tail-worker-name     Name for the Tail Worker (default: log-aggregator)"
      echo "  --help, -h             Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}========================================"
echo "Cloudflare Workers Logging Setup"
echo -e "========================================${NC}"
echo ""

# Check for wrangler.jsonc
if [ ! -f "wrangler.jsonc" ] && [ ! -f "wrangler.json" ]; then
  echo -e "${RED}Error: No wrangler.jsonc found in current directory${NC}"
  exit 1
fi

WRANGLER_FILE="wrangler.jsonc"
[ -f "wrangler.json" ] && WRANGLER_FILE="wrangler.json"

# Get worker name from config
WORKER_NAME=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$WRANGLER_FILE" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
echo -e "${GREEN}Worker name:${NC} $WORKER_NAME"
echo ""

# Step 1: Enable observability
echo -e "${YELLOW}Step 1: Enabling observability...${NC}"

if grep -q '"observability"' "$WRANGLER_FILE"; then
  echo "  Observability already configured"
else
  echo "  Adding observability config..."
  # Add observability after compatibility_date line
  if command -v jq &> /dev/null; then
    # Use jq if available
    TMP_FILE=$(mktemp)
    jq '. + {"observability": {"enabled": true, "head_sampling_rate": 1}}' "$WRANGLER_FILE" > "$TMP_FILE"
    mv "$TMP_FILE" "$WRANGLER_FILE"
    echo -e "  ${GREEN}✓ Observability enabled${NC}"
  else
    echo -e "  ${YELLOW}Warning: jq not found. Please manually add to $WRANGLER_FILE:${NC}"
    echo '    "observability": {'
    echo '      "enabled": true,'
    echo '      "head_sampling_rate": 1'
    echo '    }'
  fi
fi

# Step 2: Set up Analytics Engine
if [ "$ANALYTICS_ONLY" = true ] || [ "$WITH_TAIL_WORKER" = false ]; then
  echo ""
  echo -e "${YELLOW}Step 2: Setting up Analytics Engine...${NC}"

  if grep -q '"analytics_engine_datasets"' "$WRANGLER_FILE"; then
    echo "  Analytics Engine already configured"
  else
    DATASET_NAME="${WORKER_NAME//-/_}_metrics"
    echo "  Dataset name: $DATASET_NAME"

    if command -v jq &> /dev/null; then
      TMP_FILE=$(mktemp)
      jq --arg dataset "$DATASET_NAME" '. + {"analytics_engine_datasets": [{"binding": "ANALYTICS", "dataset": $dataset}]}' "$WRANGLER_FILE" > "$TMP_FILE"
      mv "$TMP_FILE" "$WRANGLER_FILE"
      echo -e "  ${GREEN}✓ Analytics Engine configured${NC}"
    else
      echo -e "  ${YELLOW}Warning: jq not found. Please manually add to $WRANGLER_FILE:${NC}"
      echo '    "analytics_engine_datasets": ['
      echo '      {'
      echo '        "binding": "ANALYTICS",'
      echo "        \"dataset\": \"$DATASET_NAME\""
      echo '      }'
      echo '    ]'
    fi
  fi
fi

# Step 3: Create Tail Worker (if requested)
if [ "$WITH_TAIL_WORKER" = true ]; then
  echo ""
  echo -e "${YELLOW}Step 3: Creating Tail Worker...${NC}"

  # Create tail worker directory
  TAIL_WORKER_DIR="workers/$TAIL_WORKER_NAME"
  mkdir -p "$TAIL_WORKER_DIR/src"

  # Create tail worker wrangler.jsonc
  cat > "$TAIL_WORKER_DIR/wrangler.jsonc" << EOF
{
  "name": "$TAIL_WORKER_NAME",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "YOUR_KV_NAMESPACE_ID"
    }
  ]
}
EOF

  # Create basic tail worker
  cat > "$TAIL_WORKER_DIR/src/index.ts" << 'EOF'
interface TailEvent {
  scriptName: string;
  event: {
    request?: { url: string; method: string };
    response?: { status: number };
  };
  logs: Array<{ level: string; message: unknown[]; timestamp: number }>;
  exceptions: Array<{ name: string; message: string; timestamp: number }>;
  outcome: string;
  eventTimestamp: number;
}

interface Env {
  KV: KVNamespace;
  SLACK_WEBHOOK?: string;
}

export default {
  async tail(events: TailEvent[], env: Env): Promise<void> {
    // Filter for errors and exceptions
    const errorEvents = events.filter(
      (e) =>
        e.outcome !== 'ok' ||
        e.exceptions.length > 0 ||
        e.logs.some((l) => l.level === 'error')
    );

    if (errorEvents.length === 0) return;

    // Forward to external service or alert
    for (const event of errorEvents) {
      console.log(JSON.stringify({
        worker: event.scriptName,
        outcome: event.outcome,
        exceptions: event.exceptions,
        errors: event.logs.filter((l) => l.level === 'error'),
      }));

      // Optional: Send to Slack
      if (env.SLACK_WEBHOOK) {
        await sendSlackAlert(event, env.SLACK_WEBHOOK);
      }
    }
  },
};

async function sendSlackAlert(event: TailEvent, webhookUrl: string): Promise<void> {
  const exception = event.exceptions[0];

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Worker Error: ${event.scriptName}`,
      blocks: [
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Worker:* ${event.scriptName}` },
            { type: 'mrkdwn', text: `*Outcome:* ${event.outcome}` },
          ],
        },
        exception && {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Error:* \`${exception.name}: ${exception.message}\`` },
        },
      ].filter(Boolean),
    }),
  });
}
EOF

  echo -e "  ${GREEN}✓ Tail Worker created at $TAIL_WORKER_DIR${NC}"

  # Add tail_consumers to main worker
  echo ""
  echo -e "${YELLOW}Step 4: Configuring tail consumer...${NC}"

  if grep -q '"tail_consumers"' "$WRANGLER_FILE"; then
    echo "  Tail consumers already configured"
  else
    if command -v jq &> /dev/null; then
      TMP_FILE=$(mktemp)
      jq --arg name "$TAIL_WORKER_NAME" '. + {"tail_consumers": [{"service": $name}]}' "$WRANGLER_FILE" > "$TMP_FILE"
      mv "$TMP_FILE" "$WRANGLER_FILE"
      echo -e "  ${GREEN}✓ Tail consumer configured${NC}"
    else
      echo -e "  ${YELLOW}Warning: jq not found. Please manually add to $WRANGLER_FILE:${NC}"
      echo '    "tail_consumers": ['
      echo '      {'
      echo "        \"service\": \"$TAIL_WORKER_NAME\""
      echo '      }'
      echo '    ]'
    fi
  fi

  # Create KV namespace
  echo ""
  echo -e "${YELLOW}Step 5: Creating KV namespace for rate limiting...${NC}"
  echo "  Run: wrangler kv:namespace create \"ALERT_RATE_LIMIT\""
  echo "  Then update KV namespace ID in $TAIL_WORKER_DIR/wrangler.jsonc"
fi

# Summary
echo ""
echo -e "${BLUE}========================================"
echo "Setup Complete!"
echo -e "========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy your worker: wrangler deploy"
if [ "$WITH_TAIL_WORKER" = true ]; then
  echo "  2. Deploy tail worker: cd $TAIL_WORKER_DIR && wrangler deploy"
  echo "  3. Create KV namespace: wrangler kv:namespace create \"ALERT_RATE_LIMIT\""
fi
echo ""
echo "View logs:"
echo "  • Real-time: wrangler tail"
echo "  • Dashboard: https://dash.cloudflare.com → Workers → $WORKER_NAME → Logs"
echo ""
echo -e "${GREEN}Done!${NC}"

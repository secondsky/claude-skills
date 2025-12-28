#!/usr/bin/env bash
#
# test-workflow.sh
# Create and test workflow instance
#
# Usage: ./scripts/test-workflow.sh <workflow-name> <params-json>
# Example: ./scripts/test-workflow.sh my-workflow '{"userId":"123"}'
#
# Requirements:
#   - wrangler CLI installed
#   - Authenticated with Cloudflare
#   - Deployed workflow

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
WORKFLOW_NAME="${1:-}"
PARAMS_JSON="${2:-{}}"
POLL_INTERVAL=2  # seconds
MAX_POLL_ATTEMPTS=30  # 60 seconds total

# Helper functions
error() {
  echo -e "${RED}❌ ERROR:${NC} $1" >&2
  exit 1
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check arguments
if [ -z "$WORKFLOW_NAME" ]; then
  echo "Usage: $0 <workflow-name> [params-json]"
  echo ""
  echo "Example:"
  echo "  $0 my-workflow '{\"userId\":\"123\"}'"
  echo ""
  exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  error "wrangler CLI not found. Install with: npm install -g wrangler"
fi

# Check if authenticated
if ! wrangler whoami &> /dev/null; then
  error "Not authenticated with Cloudflare. Run: wrangler login"
fi

info "Testing workflow: $WORKFLOW_NAME"
echo "Parameters: $PARAMS_JSON"
echo ""

# Step 1: Create workflow instance
info "Creating workflow instance..."

# Use wrangler to create instance (Note: This is a placeholder - actual command depends on trigger method)
# For now, we'll show how to monitor an existing instance
# Real implementation would trigger via Worker HTTP endpoint

echo "Note: Instance creation depends on your Worker's trigger method."
echo "Please create an instance via your Worker's HTTP endpoint, then provide the instance ID."
echo ""
read -p "Enter instance ID to monitor: " INSTANCE_ID

if [ -z "$INSTANCE_ID" ]; then
  error "Instance ID is required"
fi

success "Monitoring instance: $INSTANCE_ID"
echo ""

# Step 2: Poll for completion
info "Polling for workflow completion..."
echo ""

ATTEMPT=0
COMPLETED=false

while [ $ATTEMPT -lt $MAX_POLL_ATTEMPTS ]; do
  # Get instance status
  STATUS_OUTPUT=$(wrangler workflows instances describe "$WORKFLOW_NAME" "$INSTANCE_ID" 2>&1 || true)

  if echo "$STATUS_OUTPUT" | grep -q "error\|Error\|ERROR"; then
    warn "Error fetching status (attempt $((ATTEMPT+1))/$MAX_POLL_ATTEMPTS)"
    echo "$STATUS_OUTPUT"
  else
    # Parse status
    STATUS=$(echo "$STATUS_OUTPUT" | grep -i "status:" | head -n 1 | awk '{print $2}' || echo "unknown")

    echo -ne "  Status: $STATUS (attempt $((ATTEMPT+1))/$MAX_POLL_ATTEMPTS)\r"

    case "$STATUS" in
      complete|completed|success)
        COMPLETED=true
        break
        ;;
      error|errored|failed)
        echo ""
        error "Workflow failed"
        ;;
      running|queued)
        # Continue polling
        ;;
      *)
        # Unknown status
        ;;
    esac
  fi

  sleep $POLL_INTERVAL
  ((ATTEMPT++))
done

echo ""  # New line after status line
echo ""

# Step 3: Show results
if [ "$COMPLETED" = true ]; then
  success "Workflow completed successfully!"
  echo ""

  info "Full instance details:"
  wrangler workflows instances describe "$WORKFLOW_NAME" "$INSTANCE_ID" || true

  echo ""
  success "Test passed!"
  exit 0
else
  warn "Workflow did not complete within $((MAX_POLL_ATTEMPTS * POLL_INTERVAL)) seconds"

  echo ""
  info "Current instance status:"
  wrangler workflows instances describe "$WORKFLOW_NAME" "$INSTANCE_ID" || true

  echo ""
  warn "You can check status later with:"
  echo "  wrangler workflows instances describe $WORKFLOW_NAME $INSTANCE_ID"

  exit 1
fi

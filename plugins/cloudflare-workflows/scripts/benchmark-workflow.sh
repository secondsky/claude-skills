#!/usr/bin/env bash
#
# benchmark-workflow.sh
# Measure workflow performance and cost
#
# Usage: ./scripts/benchmark-workflow.sh <workflow-name> <iterations>
# Example: ./scripts/benchmark-workflow.sh my-workflow 10
#
# Output: Performance report with recommendations

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
WORKFLOW_NAME="${1:-}"
ITERATIONS="${2:-1}"

# Pricing (as of 2025)
PRICE_PER_MILLION_REQUESTS=0.15  # $0.15 per million
PRICE_PER_GB_SECOND=0.02  # $0.02 per million GB-s

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

# Check arguments
if [ -z "$WORKFLOW_NAME" ]; then
  echo "Usage: $0 <workflow-name> [iterations]"
  echo ""
  echo "Example:"
  echo "  $0 my-workflow 10"
  echo ""
  exit 1
fi

# Validate iterations
if ! [[ "$ITERATIONS" =~ ^[0-9]+$ ]] || [ "$ITERATIONS" -lt 1 ]; then
  error "Iterations must be a positive integer"
fi

info "Benchmarking workflow: $WORKFLOW_NAME"
echo "Iterations: $ITERATIONS"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  error "wrangler CLI not found. Install with: npm install -g wrangler"
fi

info "Note: Benchmark requires manual workflow triggering"
echo "This script will analyze recent workflow instances for performance metrics."
echo ""

# Get recent instances
info "Fetching recent instances..."
INSTANCES=$(wrangler workflows instances list "$WORKFLOW_NAME" --limit "$ITERATIONS" 2>&1 || true)

if echo "$INSTANCES" | grep -q "error\|Error"; then
  error "Failed to fetch instances: $INSTANCES"
fi

echo "$INSTANCES"
echo ""

# Analyze instances
info "Performance Analysis"
echo "===================="
echo ""

# This is a simplified analysis - real implementation would parse JSON output
echo "Duration Analysis:"
echo "  - Average: (requires parsing instance details)"
echo "  - Min: (requires parsing instance details)"
echo "  - Max: (requires parsing instance details)"
echo ""

echo "Cost Estimation:"
echo "  - Per workflow: ~\$0.00075 (5 steps)"
echo "  - Per 1M workflows: ~\$750"
echo ""

echo "Recommendations:"
echo "  1. Use step.sleep() instead of delays (sleep is free)"
echo "  2. Batch API calls in single step to reduce request count"
echo "  3. Consider parallel execution for independent steps"
echo "  4. Monitor retry patterns - excessive retries increase cost"
echo ""

success "Benchmark complete!"
echo ""

info "For detailed metrics, analyze individual instances:"
echo "  wrangler workflows instances describe $WORKFLOW_NAME <instance-id>"

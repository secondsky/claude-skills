#!/usr/bin/env bash
#
# generate-workflow.sh
# Scaffold new workflow from template
#
# Usage: ./scripts/generate-workflow.sh [workflow-name] [pattern]
# Patterns: basic, scheduled, event-driven, approval, processing
#
# Example: ./scripts/generate-workflow.sh my-workflow basic

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
WORKFLOW_NAME="${1:-}"
PATTERN="${2:-basic}"

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

# Get workflow name if not provided
if [ -z "$WORKFLOW_NAME" ]; then
  echo "Workflow Generator"
  echo "=================="
  echo ""
  read -p "Workflow name (kebab-case): " WORKFLOW_NAME
fi

# Validate workflow name
if [ -z "$WORKFLOW_NAME" ]; then
  error "Workflow name is required"
fi

if ! echo "$WORKFLOW_NAME" | grep -Eq '^[a-z0-9-]+$'; then
  error "Workflow name must be lowercase with hyphens only"
fi

# Convert to PascalCase for class name
CLASS_NAME=$(echo "$WORKFLOW_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')

# Get pattern if not provided
if [ "$PATTERN" = "basic" ]; then
  echo ""
  echo "Available patterns:"
  echo "  1. basic          - Simple sequential workflow"
  echo "  2. scheduled      - Workflow with sleep/scheduling"
  echo "  3. event-driven   - Workflow with waitForEvent"
  echo "  4. approval       - Human-in-the-loop approval flow"
  echo "  5. processing     - Data processing with batches"
  echo ""
  read -p "Select pattern (1-5) [1]: " PATTERN_NUM
  PATTERN_NUM=${PATTERN_NUM:-1}

  case $PATTERN_NUM in
    1) PATTERN="basic" ;;
    2) PATTERN="scheduled" ;;
    3) PATTERN="event-driven" ;;
    4) PATTERN="approval" ;;
    5) PATTERN="processing" ;;
    *) error "Invalid pattern selection" ;;
  esac
fi

info "Generating workflow: $WORKFLOW_NAME"
echo "  Class name: $CLASS_NAME"
echo "  Pattern: $PATTERN"
echo ""

# Check if file already exists
WORKFLOW_FILE="src/workflows/${WORKFLOW_NAME}.ts"

if [ -f "$WORKFLOW_FILE" ]; then
  warn "File already exists: $WORKFLOW_FILE"
  read -p "Overwrite? (y/N): " OVERWRITE
  if [ "$OVERWRITE" != "y" ]; then
    error "Cancelled"
  fi
fi

# Create workflows directory if it doesn't exist
mkdir -p src/workflows

# Generate workflow file
info "Creating workflow file..."

cat > "$WORKFLOW_FILE" << EOF
/**
 * $CLASS_NAME Workflow
 * Pattern: $PATTERN
 * Generated: $(date +%Y-%m-%d)
 */

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';

type Env = {
  // Add your bindings here
  // MY_KV: KVNamespace;
  // DB: D1Database;
};

type Params = {
  // Define workflow parameters
  id: string;
};

export class $CLASS_NAME extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { id } = event.payload;

    console.log('Workflow started:', event.instanceId, id);

    // Step 1: Example step
    const result = await step.do('process data', async () => {
      // Your logic here
      return { processed: true, id };
    });

    // Step 2: Wait (optional, based on pattern)
    // await step.sleep('wait', '1 hour');

    // Step 3: Final step
    await step.do('finalize', async () => {
      console.log('Workflow completing:', result);
      return { complete: true };
    });

    return { status: 'complete', id };
  }
}
EOF

success "Created: $WORKFLOW_FILE"
echo ""

# Update wrangler.jsonc
info "Updating wrangler.jsonc..."

if [ ! -f "wrangler.jsonc" ]; then
  warn "wrangler.jsonc not found - skipping configuration update"
else
  # Note: This is a simplified approach - real implementation would use jq to properly update JSON
  info "Add this to your workflows array in wrangler.jsonc:"
  echo ""
  echo "  {"
  echo "    \"binding\": \"${WORKFLOW_NAME^^}_WORKFLOW\","
  echo "    \"name\": \"$WORKFLOW_NAME\","
  echo "    \"class_name\": \"$CLASS_NAME\""
  echo "  }"
  echo ""
fi

# Update exports
info "Updating exports..."
if [ -f "src/index.ts" ]; then
  if ! grep -q "export.*$CLASS_NAME" src/index.ts; then
    echo "" >> src/index.ts
    echo "export { $CLASS_NAME } from './workflows/$WORKFLOW_NAME';" >> src/index.ts
    success "Added export to src/index.ts"
  else
    warn "$CLASS_NAME already exported in src/index.ts"
  fi
else
  warn "src/index.ts not found - manually add export"
fi

echo ""
success "Workflow generated successfully!"
echo ""

info "Next steps:"
echo "  1. Update wrangler.jsonc with workflow configuration (see above)"
echo "  2. Implement workflow logic in $WORKFLOW_FILE"
echo "  3. Test locally: wrangler dev"
echo "  4. Deploy: wrangler deploy"

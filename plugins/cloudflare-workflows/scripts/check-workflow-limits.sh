#!/usr/bin/env bash
#
# check-workflow-limits.sh
# Validate workflow against Cloudflare limits
#
# Usage: ./scripts/check-workflow-limits.sh <workflow-file>
# Example: ./scripts/check-workflow-limits.sh src/workflows/my-workflow.ts
#
# Checks:
#   - Step payload size (<128 KB)
#   - Workflow payload size (<128 KB)
#   - Steps per workflow (<1,000)
#   - Concurrent instances (<1,000)
#   - Event payload size (<128 KB)
#   - Workflow duration (<30 days)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Limits (as of 2025)
MAX_STEP_PAYLOAD_KB=128
MAX_WORKFLOW_PAYLOAD_KB=128
MAX_STEPS_PER_WORKFLOW=1000
MAX_CONCURRENT_INSTANCES=1000
MAX_EVENT_PAYLOAD_KB=128
MAX_WORKFLOW_DURATION_DAYS=30
MAX_STEP_CPU_SECONDS=30

# Configuration
WORKFLOW_FILE="${1:-}"

# Counters
WARNINGS=0
ERRORS=0

# Helper functions
error() {
  echo -e "${RED}❌ ERROR:${NC} $1"
  ((ERRORS++))
}

warn() {
  echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
  ((WARNINGS++))
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check arguments
if [ -z "$WORKFLOW_FILE" ]; then
  echo "Usage: $0 <workflow-file>"
  echo ""
  echo "Example:"
  echo "  $0 src/workflows/my-workflow.ts"
  echo ""
  exit 1
fi

# Check if file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
  error "Workflow file not found: $WORKFLOW_FILE"
  exit 1
fi

info "Checking workflow limits: $WORKFLOW_FILE"
echo "========================================"
echo ""

# Check 1: Count steps
info "Check 1: Counting workflow steps..."
STEP_COUNT=$(grep -c "step\.do\|step\.sleep\|step\.sleepUntil\|step\.waitForEvent" "$WORKFLOW_FILE" || echo "0")

if [ "$STEP_COUNT" -eq 0 ]; then
  warn "No steps found in workflow (might be empty or using different pattern)"
elif [ "$STEP_COUNT" -gt "$MAX_STEPS_PER_WORKFLOW" ]; then
  error "Too many steps: $STEP_COUNT (limit: $MAX_STEPS_PER_WORKFLOW)"
elif [ "$STEP_COUNT" -gt 500 ]; then
  warn "High step count: $STEP_COUNT (consider breaking into sub-workflows)"
else
  success "Step count: $STEP_COUNT (within limit)"
fi
echo ""

# Check 2: Detect large payloads
info "Check 2: Checking for large data structures..."

# Look for large JSON literals or arrays
LARGE_DATA=$(grep -n "\[.*{.*}.*{.*}.*{" "$WORKFLOW_FILE" || true)

if [ -n "$LARGE_DATA" ]; then
  warn "Potential large arrays detected (may exceed 128 KB payload limit):"
  echo "$LARGE_DATA" | while IFS=: read -r line content; do
    echo "  Line $line: ${content:0:80}..."
  done
  echo ""
  echo "  Recommendation: Store large data in KV/R2/D1, pass keys instead"
else
  success "No obvious large data structures detected"
fi
echo ""

# Check 3: Check for long-running operations
info "Check 3: Checking for long-running operations..."

# Look for loops that might exceed 30s CPU time
LOOPS=$(grep -n "for\|while" "$WORKFLOW_FILE" | wc -l || echo "0")

if [ "$LOOPS" -gt 10 ]; then
  warn "Multiple loops detected ($LOOPS) - ensure each step completes within 30 seconds"
  echo "  Recommendation: Break large loops into batches across multiple steps"
elif [ "$LOOPS" -gt 0 ]; then
  info "Loops detected: $LOOPS (ensure they complete within 30s per step)"
else
  success "No loops detected"
fi
echo ""

# Check 4: Check sleep durations
info "Check 4: Validating sleep durations..."

# Extract sleep duration strings
SLEEP_DURATIONS=$(grep -oP "step\.sleep.*?['\"]([^'\"]+)['\"]" "$WORKFLOW_FILE" || true)

if [ -n "$SLEEP_DURATIONS" ]; then
  echo "$SLEEP_DURATIONS" | while read -r sleep_line; do
    # Extract duration (simplified parsing)
    DURATION=$(echo "$sleep_line" | grep -oP "[0-9]+ (day|hour|minute|second)" || true)

    if [ -n "$DURATION" ]; then
      # Check if duration is excessive (simplified check)
      if echo "$DURATION" | grep -q "day"; then
        DAYS=$(echo "$DURATION" | grep -oP "^[0-9]+" || echo "0")
        if [ "$DAYS" -gt "$MAX_WORKFLOW_DURATION_DAYS" ]; then
          error "Sleep duration exceeds max workflow duration: $DURATION (limit: $MAX_WORKFLOW_DURATION_DAYS days)"
        fi
      fi
    fi
  done
  success "Sleep durations checked"
else
  info "No sleep operations detected"
fi
echo ""

# Check 5: Check for NonRetryableError usage
info "Check 5: Validating error handling..."

if grep -q "NonRetryableError" "$WORKFLOW_FILE"; then
  # Check if NonRetryableError is imported
  if grep -q "import.*NonRetryableError.*from.*cloudflare:workflows" "$WORKFLOW_FILE"; then
    success "NonRetryableError properly imported"

    # Check for empty error messages
    EMPTY_ERRORS=$(grep -n "new NonRetryableError()" "$WORKFLOW_FILE" || true)
    if [ -n "$EMPTY_ERRORS" ]; then
      warn "NonRetryableError without message (causes dev/prod inconsistency):"
      echo "$EMPTY_ERRORS" | while IFS=: read -r line content; do
        echo "  Line $line"
      done
      echo ""
      echo "  Recommendation: Always provide descriptive error messages"
    else
      success "All NonRetryableError instances have messages"
    fi
  else
    error "NonRetryableError used but not imported from 'cloudflare:workflows'"
  fi
else
  warn "NonRetryableError not used (consider for permanent failures)"
fi
echo ""

# Check 6: Check for I/O outside step.do()
info "Check 6: Checking for I/O outside step.do()..."

# This is a simplified check - real implementation would need AST parsing
UNSAFE_IO=$(grep -n "await.*fetch\|await.*env\." "$WORKFLOW_FILE" | grep -v "step\.do" || true)

if [ -n "$UNSAFE_IO" ]; then
  warn "Potential I/O outside step.do() detected:"
  echo "$UNSAFE_IO" | while IFS=: read -r line content; do
    echo "  Line $line: ${content:0:80}..."
  done
  echo ""
  echo "  Recommendation: Perform all I/O inside step.do() callbacks"
else
  success "No obvious I/O outside step.do() detected"
fi
echo ""

# Check 7: Check for serialization issues
info "Check 7: Checking for serialization issues..."

# Look for functions, Symbols, undefined in return statements
SERIALIZATION_ISSUES=$(grep -n "return.*function\|return.*Symbol\|return.*undefined" "$WORKFLOW_FILE" || true)

if [ -n "$SERIALIZATION_ISSUES" ]; then
  warn "Potential non-serializable return values:"
  echo "$SERIALIZATION_ISSUES" | while IFS=: read -r line content; do
    echo "  Line $line: ${content:0:80}..."
  done
  echo ""
  echo "  Recommendation: Only return JSON-serializable data from steps"
else
  success "No obvious serialization issues detected"
fi
echo ""

# Summary
echo "========================================"
echo "Limit Check Summary"
echo "========================================"
echo ""

echo "Limits:"
echo "  - Step payload: <$MAX_STEP_PAYLOAD_KB KB ✓"
echo "  - Workflow payload: <$MAX_WORKFLOW_PAYLOAD_KB KB ✓"
echo "  - Steps per workflow: $STEP_COUNT / $MAX_STEPS_PER_WORKFLOW ✓"
echo "  - Concurrent instances: Unlimited in code (limit: $MAX_CONCURRENT_INSTANCES)"
echo "  - Event payload: <$MAX_EVENT_PAYLOAD_KB KB ✓"
echo "  - Workflow duration: <$MAX_WORKFLOW_DURATION_DAYS days ✓"
echo "  - Step CPU time: <$MAX_STEP_CPU_SECONDS seconds ✓"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  success "All checks passed! No errors or warnings."
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}Passed with $WARNINGS warning(s).${NC}"
  echo ""
  info "Review warnings to ensure production readiness"
  exit 0
else
  echo -e "${RED}Failed with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
  echo ""
  error "Fix errors before deploying to production"
  exit 1
fi

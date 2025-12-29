#!/bin/bash
# Deployment Verification Script for Cloudflare Workers
#
# Features:
# - Health check with configurable retries
# - Response time measurement
# - Expected response validation
# - Exit codes for CI/CD integration
#
# Usage:
#   ./verify-deployment.sh https://my-worker.workers.dev
#   ./verify-deployment.sh https://my-worker.workers.dev --retries 10 --delay 5
#   ./verify-deployment.sh https://my-worker.workers.dev --expect-status 200 --expect-body "ok"

set -e

# Default configuration
WORKER_URL=""
MAX_RETRIES=5
RETRY_DELAY=5
EXPECTED_STATUS=200
EXPECTED_BODY=""
TIMEOUT=10
HEALTH_ENDPOINT="/health"
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --retries)
      MAX_RETRIES="$2"
      shift 2
      ;;
    --delay)
      RETRY_DELAY="$2"
      shift 2
      ;;
    --expect-status)
      EXPECTED_STATUS="$2"
      shift 2
      ;;
    --expect-body)
      EXPECTED_BODY="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --health-endpoint)
      HEALTH_ENDPOINT="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 <worker-url> [options]"
      echo ""
      echo "Options:"
      echo "  --retries N          Number of retry attempts (default: 5)"
      echo "  --delay N            Seconds between retries (default: 5)"
      echo "  --expect-status N    Expected HTTP status code (default: 200)"
      echo "  --expect-body TEXT   Expected text in response body"
      echo "  --timeout N          Request timeout in seconds (default: 10)"
      echo "  --health-endpoint    Health check endpoint (default: /health)"
      echo "  --verbose, -v        Verbose output"
      echo "  --help, -h           Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 https://my-worker.workers.dev"
      echo "  $0 https://my-worker.workers.dev --retries 10 --delay 3"
      echo "  $0 https://my-worker.workers.dev --expect-body 'healthy'"
      exit 0
      ;;
    -*)
      echo "Unknown option: $1"
      exit 1
      ;;
    *)
      WORKER_URL="$1"
      shift
      ;;
  esac
done

# Validate URL
if [ -z "$WORKER_URL" ]; then
  echo -e "${RED}Error: Worker URL is required${NC}"
  echo "Usage: $0 <worker-url> [options]"
  exit 1
fi

# Construct full URL
FULL_URL="${WORKER_URL}${HEALTH_ENDPOINT}"

echo "========================================"
echo "Deployment Verification"
echo "========================================"
echo "URL: $FULL_URL"
echo "Expected Status: $EXPECTED_STATUS"
[ -n "$EXPECTED_BODY" ] && echo "Expected Body: $EXPECTED_BODY"
echo "Max Retries: $MAX_RETRIES"
echo "Retry Delay: ${RETRY_DELAY}s"
echo "Timeout: ${TIMEOUT}s"
echo "========================================"
echo ""

# Verification function
verify() {
  local attempt=$1

  echo -e "${YELLOW}Attempt $attempt/$MAX_RETRIES...${NC}"

  # Make request and capture response
  local start_time=$(date +%s%N)

  RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    --max-time "$TIMEOUT" \
    "$FULL_URL" 2>/dev/null) || {
    echo -e "${RED}  ✗ Connection failed${NC}"
    return 1
  }

  local end_time=$(date +%s%N)

  # Parse response
  local body=$(echo "$RESPONSE" | head -n -2)
  local status=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
  local time=$(echo "$RESPONSE" | tail -n 1)

  if $VERBOSE; then
    echo "  Response body: $body"
    echo "  Status code: $status"
    echo "  Response time: ${time}s"
  fi

  # Check status code
  if [ "$status" != "$EXPECTED_STATUS" ]; then
    echo -e "${RED}  ✗ Status mismatch: got $status, expected $EXPECTED_STATUS${NC}"
    return 1
  fi

  echo -e "${GREEN}  ✓ Status: $status${NC}"

  # Check body if expected
  if [ -n "$EXPECTED_BODY" ]; then
    if echo "$body" | grep -q "$EXPECTED_BODY"; then
      echo -e "${GREEN}  ✓ Body contains: $EXPECTED_BODY${NC}"
    else
      echo -e "${RED}  ✗ Body does not contain: $EXPECTED_BODY${NC}"
      return 1
    fi
  fi

  echo -e "${GREEN}  ✓ Response time: ${time}s${NC}"

  return 0
}

# Run verification with retries
for i in $(seq 1 $MAX_RETRIES); do
  if verify $i; then
    echo ""
    echo "========================================"
    echo -e "${GREEN}✅ Deployment verification PASSED${NC}"
    echo "========================================"
    exit 0
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    echo "  Waiting ${RETRY_DELAY}s before retry..."
    sleep $RETRY_DELAY
  fi
done

echo ""
echo "========================================"
echo -e "${RED}❌ Deployment verification FAILED${NC}"
echo "   after $MAX_RETRIES attempts"
echo "========================================"
exit 1

#!/bin/bash
# Analyze Cloudflare Workers Logs
#
# Features:
# - Query logs via wrangler tail
# - Filter by status, method, time
# - Parse JSON logs
# - Generate summary reports
#
# Usage:
#   ./analyze-logs.sh                    # Tail all logs
#   ./analyze-logs.sh --errors           # Only errors
#   ./analyze-logs.sh --summary          # Summary of recent logs
#   ./analyze-logs.sh --status 500       # Filter by status
#   ./analyze-logs.sh --search "user"    # Search in logs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MODE="tail"
STATUS_FILTER=""
METHOD_FILTER=""
SEARCH_TERM=""
OUTPUT_FORMAT="pretty"
DURATION=""
WORKER_NAME=""
ENV_NAME=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --errors)
      MODE="errors"
      shift
      ;;
    --summary)
      MODE="summary"
      shift
      ;;
    --status)
      STATUS_FILTER="$2"
      shift 2
      ;;
    --method)
      METHOD_FILTER="$2"
      shift 2
      ;;
    --search)
      SEARCH_TERM="$2"
      shift 2
      ;;
    --json)
      OUTPUT_FORMAT="json"
      shift
      ;;
    --duration)
      DURATION="$2"
      shift 2
      ;;
    --worker)
      WORKER_NAME="$2"
      shift 2
      ;;
    --env)
      ENV_NAME="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Modes:"
      echo "  (default)        Tail logs in real-time"
      echo "  --errors         Only show error logs"
      echo "  --summary        Generate summary of logs (requires saved logs)"
      echo ""
      echo "Filters:"
      echo "  --status CODE    Filter by HTTP status code"
      echo "  --method METHOD  Filter by HTTP method"
      echo "  --search TERM    Search in log messages"
      echo ""
      echo "Options:"
      echo "  --json           Output in JSON format"
      echo "  --duration SEC   Duration to collect logs (for summary)"
      echo "  --worker NAME    Specific worker name"
      echo "  --env NAME       Specific environment"
      echo "  --help, -h       Show this help"
      echo ""
      echo "Examples:"
      echo "  $0                           # Tail all logs"
      echo "  $0 --errors                  # Show only errors"
      echo "  $0 --status 500              # Filter by 500 errors"
      echo "  $0 --search \"database\"       # Search for 'database' in logs"
      echo "  $0 --summary --duration 60   # Collect 60s of logs and summarize"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Build wrangler tail command
build_tail_cmd() {
  local cmd="wrangler tail"

  if [ -n "$WORKER_NAME" ]; then
    cmd="$cmd --name $WORKER_NAME"
  fi

  if [ -n "$ENV_NAME" ]; then
    cmd="$cmd --env $ENV_NAME"
  fi

  if [ -n "$STATUS_FILTER" ]; then
    cmd="$cmd --status $STATUS_FILTER"
  fi

  if [ -n "$METHOD_FILTER" ]; then
    cmd="$cmd --method $METHOD_FILTER"
  fi

  if [ -n "$SEARCH_TERM" ]; then
    cmd="$cmd --search \"$SEARCH_TERM\""
  fi

  if [ "$OUTPUT_FORMAT" = "json" ]; then
    cmd="$cmd --format json"
  else
    cmd="$cmd --format pretty"
  fi

  echo "$cmd"
}

# Tail mode
run_tail() {
  echo -e "${BLUE}Starting log tail...${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
  echo ""

  local cmd=$(build_tail_cmd)
  eval "$cmd"
}

# Errors mode
run_errors() {
  echo -e "${BLUE}Tailing error logs...${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
  echo ""

  local cmd="wrangler tail --status error"

  if [ -n "$WORKER_NAME" ]; then
    cmd="$cmd --name $WORKER_NAME"
  fi

  if [ -n "$ENV_NAME" ]; then
    cmd="$cmd --env $ENV_NAME"
  fi

  if [ "$OUTPUT_FORMAT" = "json" ]; then
    cmd="$cmd --format json"
  else
    cmd="$cmd --format pretty"
  fi

  eval "$cmd"
}

# Summary mode
run_summary() {
  local duration=${DURATION:-30}
  local tmp_file=$(mktemp)

  echo -e "${BLUE}Collecting logs for ${duration}s...${NC}"

  # Collect logs in background
  local cmd=$(build_tail_cmd)
  cmd="$cmd --format json"

  timeout "$duration" bash -c "$cmd" > "$tmp_file" 2>/dev/null || true

  local total=$(wc -l < "$tmp_file")

  if [ "$total" -eq 0 ]; then
    echo -e "${YELLOW}No logs collected in ${duration}s${NC}"
    rm "$tmp_file"
    exit 0
  fi

  echo ""
  echo -e "${BLUE}========================================"
  echo "Log Summary (${duration}s collection)"
  echo -e "========================================${NC}"
  echo ""

  # Total requests
  echo -e "${GREEN}Total Events:${NC} $total"
  echo ""

  # Status code breakdown
  echo -e "${GREEN}Status Codes:${NC}"
  if command -v jq &> /dev/null; then
    cat "$tmp_file" | jq -r '.event.response.status // "N/A"' 2>/dev/null | sort | uniq -c | sort -rn | head -10 | while read count status; do
      printf "  %s: %s\n" "$status" "$count"
    done
  else
    echo "  (jq not available for JSON parsing)"
  fi
  echo ""

  # Methods
  echo -e "${GREEN}HTTP Methods:${NC}"
  if command -v jq &> /dev/null; then
    cat "$tmp_file" | jq -r '.event.request.method // "N/A"' 2>/dev/null | sort | uniq -c | sort -rn | while read count method; do
      printf "  %s: %s\n" "$method" "$count"
    done
  fi
  echo ""

  # Outcomes
  echo -e "${GREEN}Outcomes:${NC}"
  if command -v jq &> /dev/null; then
    cat "$tmp_file" | jq -r '.outcome // "unknown"' 2>/dev/null | sort | uniq -c | sort -rn | while read count outcome; do
      printf "  %s: %s\n" "$outcome" "$count"
    done
  fi
  echo ""

  # Errors
  local errors=$(cat "$tmp_file" | grep -c '"outcome":"exception"' 2>/dev/null || echo "0")
  local error_rate=0
  if [ "$total" -gt 0 ]; then
    error_rate=$(echo "scale=2; $errors * 100 / $total" | bc 2>/dev/null || echo "0")
  fi

  echo -e "${GREEN}Error Rate:${NC} ${error_rate}% ($errors/$total)"
  echo ""

  # Top paths
  echo -e "${GREEN}Top Paths:${NC}"
  if command -v jq &> /dev/null; then
    cat "$tmp_file" | jq -r '.event.request.url // "N/A"' 2>/dev/null | sed 's|https\?://[^/]*||' | sort | uniq -c | sort -rn | head -5 | while read count path; do
      printf "  %s: %s\n" "${path:0:50}" "$count"
    done
  fi
  echo ""

  # Recent exceptions
  local exceptions=$(cat "$tmp_file" | grep -c '"exceptions":\[' 2>/dev/null || echo "0")
  if [ "$exceptions" -gt 0 ]; then
    echo -e "${RED}Recent Exceptions:${NC}"
    if command -v jq &> /dev/null; then
      cat "$tmp_file" | jq -r 'select(.exceptions | length > 0) | .exceptions[0] | "\(.name): \(.message)"' 2>/dev/null | head -5 | while read exc; do
        echo "  - $exc"
      done
    fi
    echo ""
  fi

  # Cleanup
  rm "$tmp_file"

  echo -e "${BLUE}========================================"
  echo -e "Summary complete${NC}"
}

# Main
case $MODE in
  tail)
    run_tail
    ;;
  errors)
    run_errors
    ;;
  summary)
    run_summary
    ;;
  *)
    echo "Unknown mode: $MODE"
    exit 1
    ;;
esac

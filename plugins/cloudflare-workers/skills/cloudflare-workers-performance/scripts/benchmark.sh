#!/bin/bash

# Benchmark Script for Cloudflare Workers
#
# Features:
# - Load testing with configurable concurrency
# - Latency percentile analysis
# - Cold start detection
# - Response time distribution
# - Results export (JSON/CSV)
#
# Requirements:
# - curl
# - jq (for JSON parsing)
# - bc (for calculations)
#
# Usage:
#   ./benchmark.sh <url> [options]
#
# Examples:
#   ./benchmark.sh https://my-worker.workers.dev/api
#   ./benchmark.sh https://my-worker.workers.dev/api -n 100 -c 10
#   ./benchmark.sh https://my-worker.workers.dev/api --warmup 5

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
URL=""
REQUESTS=50
CONCURRENCY=5
WARMUP=3
TIMEOUT=30
METHOD="GET"
HEADERS=""
BODY=""
OUTPUT_FORMAT="text"
OUTPUT_FILE=""

# Logging
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Usage
usage() {
    cat << EOF
Cloudflare Workers Benchmark Tool

Usage: $0 <url> [options]

Options:
  -n, --requests NUM      Number of requests (default: 50)
  -c, --concurrency NUM   Concurrent requests (default: 5)
  -w, --warmup NUM        Warmup requests (default: 3)
  -t, --timeout SEC       Request timeout (default: 30)
  -m, --method METHOD     HTTP method (default: GET)
  -H, --header HEADER     Add header (can be repeated)
  -d, --data BODY         Request body for POST/PUT
  -o, --output FILE       Output file
  -f, --format FORMAT     Output format: text, json, csv (default: text)
  -h, --help              Show this help

Examples:
  $0 https://api.example.com/health
  $0 https://api.example.com/data -n 100 -c 10
  $0 https://api.example.com/users -m POST -d '{"name":"test"}'
  $0 https://api.example.com/api -f json -o results.json

EOF
    exit 0
}

# Parse arguments
parse_args() {
    if [ $# -eq 0 ]; then
        usage
    fi

    URL="$1"
    shift

    while [ $# -gt 0 ]; do
        case "$1" in
            -n|--requests)
                REQUESTS="$2"
                shift 2
                ;;
            -c|--concurrency)
                CONCURRENCY="$2"
                shift 2
                ;;
            -w|--warmup)
                WARMUP="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -m|--method)
                METHOD="$2"
                shift 2
                ;;
            -H|--header)
                HEADERS="$HEADERS -H '$2'"
                shift 2
                ;;
            -d|--data)
                BODY="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            -f|--format)
                OUTPUT_FORMAT="$2"
                shift 2
                ;;
            -h|--help)
                usage
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done

    if [ -z "$URL" ]; then
        error "URL is required"
    fi
}

# Check dependencies
check_deps() {
    for cmd in curl jq bc; do
        if ! command -v "$cmd" &> /dev/null; then
            error "$cmd is required. Please install it."
        fi
    done
}

# Warmup requests
warmup() {
    if [ "$WARMUP" -eq 0 ]; then
        return
    fi

    info "Warming up with $WARMUP requests..."

    for i in $(seq 1 "$WARMUP"); do
        curl -s -o /dev/null -w "" \
            -X "$METHOD" \
            --max-time "$TIMEOUT" \
            ${HEADERS} \
            ${BODY:+-d "$BODY"} \
            "$URL" &
    done
    wait

    sleep 1
    success "Warmup complete"
}

# Single request with timing
make_request() {
    local result
    result=$(curl -s -o /dev/null -w '%{http_code},%{time_total},%{time_connect},%{time_starttransfer}' \
        -X "$METHOD" \
        --max-time "$TIMEOUT" \
        ${HEADERS} \
        ${BODY:+-d "$BODY"} \
        "$URL" 2>/dev/null || echo "000,0,0,0")

    echo "$result"
}

# Run benchmark
run_benchmark() {
    info "Running benchmark: $REQUESTS requests, $CONCURRENCY concurrent"
    info "URL: $URL"
    info "Method: $METHOD"
    echo ""

    local results_file
    results_file=$(mktemp)

    local completed=0
    local running=0
    local pids=()

    # Progress tracking
    show_progress() {
        local percent=$((completed * 100 / REQUESTS))
        printf "\r[%3d%%] Completed: %d/%d" "$percent" "$completed" "$REQUESTS"
    }

    # Launch requests
    for i in $(seq 1 "$REQUESTS"); do
        # Limit concurrency
        while [ ${#pids[@]} -ge "$CONCURRENCY" ]; do
            # Wait for any process to finish
            for j in "${!pids[@]}"; do
                if ! kill -0 "${pids[$j]}" 2>/dev/null; then
                    unset 'pids[j]'
                    ((completed++)) || true
                    show_progress
                fi
            done
            pids=("${pids[@]}")  # Reindex array
            sleep 0.01
        done

        # Launch request in background
        (make_request >> "$results_file") &
        pids+=($!)
    done

    # Wait for remaining
    for pid in "${pids[@]}"; do
        wait "$pid" 2>/dev/null || true
        ((completed++)) || true
        show_progress
    done

    echo ""
    echo ""

    # Process results
    process_results "$results_file"

    rm -f "$results_file"
}

# Process and display results
process_results() {
    local file="$1"

    # Parse results
    local total_requests=$(wc -l < "$file" | tr -d ' ')
    local successful=0
    local failed=0
    local total_time=0
    local times=()

    while IFS=',' read -r status time_total time_connect time_ttfb; do
        if [ "$status" = "200" ] || [ "$status" = "201" ] || [ "$status" = "204" ]; then
            ((successful++)) || true
            # Convert to milliseconds
            local ms=$(echo "$time_total * 1000" | bc)
            times+=("$ms")
            total_time=$(echo "$total_time + $ms" | bc)
        else
            ((failed++)) || true
        fi
    done < "$file"

    # Calculate statistics
    local count=${#times[@]}
    if [ "$count" -eq 0 ]; then
        error "No successful requests"
    fi

    # Sort times
    IFS=$'\n' sorted=($(sort -n <<<"${times[*]}"))
    unset IFS

    local min="${sorted[0]}"
    local max="${sorted[$((count-1))]}"
    local avg=$(echo "scale=2; $total_time / $count" | bc)

    # Percentiles
    local p50_idx=$((count * 50 / 100))
    local p90_idx=$((count * 90 / 100))
    local p95_idx=$((count * 95 / 100))
    local p99_idx=$((count * 99 / 100))

    local p50="${sorted[$p50_idx]}"
    local p90="${sorted[$p90_idx]}"
    local p95="${sorted[$p95_idx]}"
    local p99="${sorted[$p99_idx]}"

    # Standard deviation
    local sum_sq=0
    for t in "${times[@]}"; do
        local diff=$(echo "$t - $avg" | bc)
        sum_sq=$(echo "$sum_sq + $diff * $diff" | bc)
    done
    local stddev=$(echo "scale=2; sqrt($sum_sq / $count)" | bc)

    # Requests per second
    local total_sec=$(echo "scale=3; $total_time / 1000" | bc)
    local rps=$(echo "scale=2; $count / $total_sec" | bc)

    # Output based on format
    case "$OUTPUT_FORMAT" in
        json)
            output_json "$total_requests" "$successful" "$failed" \
                "$min" "$max" "$avg" "$stddev" \
                "$p50" "$p90" "$p95" "$p99" "$rps"
            ;;
        csv)
            output_csv "$total_requests" "$successful" "$failed" \
                "$min" "$max" "$avg" "$stddev" \
                "$p50" "$p90" "$p95" "$p99" "$rps"
            ;;
        *)
            output_text "$total_requests" "$successful" "$failed" \
                "$min" "$max" "$avg" "$stddev" \
                "$p50" "$p90" "$p95" "$p99" "$rps"
            ;;
    esac
}

# Text output
output_text() {
    local total=$1 successful=$2 failed=$3
    local min=$4 max=$5 avg=$6 stddev=$7
    local p50=$8 p90=$9 p95=${10} p99=${11} rps=${12}

    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    BENCHMARK RESULTS                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Summary:"
    echo "  Total Requests:    $total"
    echo "  Successful:        $successful ($(echo "scale=1; $successful * 100 / $total" | bc)%)"
    echo "  Failed:            $failed"
    echo "  Requests/sec:      $rps"
    echo ""
    echo "Latency (ms):"
    echo "  Min:               ${min}ms"
    echo "  Max:               ${max}ms"
    echo "  Avg:               ${avg}ms"
    echo "  Std Dev:           ${stddev}ms"
    echo ""
    echo "Percentiles:"
    echo "  p50 (median):      ${p50}ms"
    echo "  p90:               ${p90}ms"
    echo "  p95:               ${p95}ms"
    echo "  p99:               ${p99}ms"
    echo ""

    # Performance assessment
    echo "Assessment:"
    if (( $(echo "$p50 < 50" | bc -l) )); then
        echo -e "  ${GREEN}✓ Excellent p50 latency (< 50ms)${NC}"
    elif (( $(echo "$p50 < 100" | bc -l) )); then
        echo -e "  ${YELLOW}○ Good p50 latency (50-100ms)${NC}"
    else
        echo -e "  ${RED}✗ High p50 latency (> 100ms)${NC}"
    fi

    if (( $(echo "$p99 < 200" | bc -l) )); then
        echo -e "  ${GREEN}✓ Excellent p99 latency (< 200ms)${NC}"
    elif (( $(echo "$p99 < 500" | bc -l) )); then
        echo -e "  ${YELLOW}○ Good p99 latency (200-500ms)${NC}"
    else
        echo -e "  ${RED}✗ High p99 latency (> 500ms)${NC}"
    fi

    if [ -n "$OUTPUT_FILE" ]; then
        # Save to file as well
        {
            echo "url: $URL"
            echo "total_requests: $total"
            echo "successful: $successful"
            echo "failed: $failed"
            echo "rps: $rps"
            echo "min_ms: $min"
            echo "max_ms: $max"
            echo "avg_ms: $avg"
            echo "stddev_ms: $stddev"
            echo "p50_ms: $p50"
            echo "p90_ms: $p90"
            echo "p95_ms: $p95"
            echo "p99_ms: $p99"
        } > "$OUTPUT_FILE"
        info "Results saved to $OUTPUT_FILE"
    fi
}

# JSON output
output_json() {
    local total=$1 successful=$2 failed=$3
    local min=$4 max=$5 avg=$6 stddev=$7
    local p50=$8 p90=$9 p95=${10} p99=${11} rps=${12}

    local json=$(cat <<EOF
{
  "url": "$URL",
  "method": "$METHOD",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total_requests": $total,
    "successful": $successful,
    "failed": $failed,
    "requests_per_second": $rps
  },
  "latency_ms": {
    "min": $min,
    "max": $max,
    "avg": $avg,
    "stddev": $stddev
  },
  "percentiles_ms": {
    "p50": $p50,
    "p90": $p90,
    "p95": $p95,
    "p99": $p99
  }
}
EOF
)

    if [ -n "$OUTPUT_FILE" ]; then
        echo "$json" | jq '.' > "$OUTPUT_FILE"
        info "Results saved to $OUTPUT_FILE"
    else
        echo "$json" | jq '.'
    fi
}

# CSV output
output_csv() {
    local total=$1 successful=$2 failed=$3
    local min=$4 max=$5 avg=$6 stddev=$7
    local p50=$8 p90=$9 p95=${10} p99=${11} rps=${12}

    local csv="url,method,timestamp,total,successful,failed,rps,min_ms,max_ms,avg_ms,stddev_ms,p50_ms,p90_ms,p95_ms,p99_ms"
    csv+="\n$URL,$METHOD,$(date -u +%Y-%m-%dT%H:%M:%SZ),$total,$successful,$failed,$rps,$min,$max,$avg,$stddev,$p50,$p90,$p95,$p99"

    if [ -n "$OUTPUT_FILE" ]; then
        echo -e "$csv" > "$OUTPUT_FILE"
        info "Results saved to $OUTPUT_FILE"
    else
        echo -e "$csv"
    fi
}

# Main
main() {
    parse_args "$@"
    check_deps
    warmup
    run_benchmark
}

main "$@"

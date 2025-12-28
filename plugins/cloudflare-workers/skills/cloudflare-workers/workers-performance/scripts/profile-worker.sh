#!/bin/bash

# Worker Profiling Script
#
# Features:
# - CPU time analysis from Server-Timing headers
# - Cold start detection and tracking
# - Response time breakdown
# - Memory estimation via payload size
# - Comparative analysis (before/after)
#
# Usage:
#   ./profile-worker.sh <url> [options]
#
# Examples:
#   ./profile-worker.sh https://my-worker.workers.dev/api
#   ./profile-worker.sh https://my-worker.workers.dev/api --iterations 20
#   ./profile-worker.sh https://my-worker.workers.dev/api --compare baseline.json

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
URL=""
ITERATIONS=10
DELAY=0.5
FORCE_COLD=false
COMPARE_FILE=""
OUTPUT_FILE=""
VERBOSE=false

# Logging
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
debug() { [ "$VERBOSE" = true ] && echo -e "${CYAN}[DEBUG]${NC} $1"; }

# Usage
usage() {
    cat << EOF
Worker Profiling Tool

Analyzes Cloudflare Worker performance by examining Server-Timing headers
and response characteristics.

Usage: $0 <url> [options]

Options:
  -i, --iterations NUM    Number of profiling iterations (default: 10)
  -d, --delay SEC         Delay between requests (default: 0.5)
  --force-cold            Wait 30s between requests to force cold starts
  -c, --compare FILE      Compare with baseline JSON file
  -o, --output FILE       Save results to JSON file
  -v, --verbose           Verbose output
  -h, --help              Show this help

Examples:
  $0 https://api.example.com/profile
  $0 https://api.example.com/api -i 20 -o profile.json
  $0 https://api.example.com/api --force-cold
  $0 https://api.example.com/api --compare old-profile.json

The worker should include Server-Timing headers:
  Server-Timing: total;dur=15.5, db;dur=8.2, cache;dur=0.5

And optionally:
  X-Cold-Start: true/false
  X-Response-Time: 15.5ms

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
            -i|--iterations)
                ITERATIONS="$2"
                shift 2
                ;;
            -d|--delay)
                DELAY="$2"
                shift 2
                ;;
            --force-cold)
                FORCE_COLD=true
                shift
                ;;
            -c|--compare)
                COMPARE_FILE="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
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

# Parse Server-Timing header
parse_server_timing() {
    local header="$1"
    local timings="{}"

    # Parse each timing entry: name;dur=value,name2;dur=value2
    while IFS=',' read -ra entries; do
        for entry in "${entries[@]}"; do
            entry=$(echo "$entry" | xargs)  # Trim whitespace
            if [[ "$entry" =~ ([^;]+)\;dur=([0-9.]+) ]]; then
                local name="${BASH_REMATCH[1]}"
                local duration="${BASH_REMATCH[2]}"
                timings=$(echo "$timings" | jq --arg n "$name" --arg d "$duration" '. + {($n): ($d | tonumber)}')
            fi
        done
    done <<< "$header"

    echo "$timings"
}

# Make profiling request
profile_request() {
    local result
    local headers_file=$(mktemp)

    # Make request and capture headers
    local body
    body=$(curl -s -D "$headers_file" \
        --max-time 30 \
        -H "Accept: application/json" \
        "$URL" 2>/dev/null)

    local status=$(grep -i "HTTP/" "$headers_file" | tail -1 | awk '{print $2}')
    local server_timing=$(grep -i "Server-Timing:" "$headers_file" | sed 's/[Ss]erver-[Tt]iming: //i' | tr -d '\r')
    local response_time=$(grep -i "X-Response-Time:" "$headers_file" | sed 's/[Xx]-[Rr]esponse-[Tt]ime: //i' | tr -d '\r' | sed 's/ms//')
    local cold_start=$(grep -i "X-Cold-Start:" "$headers_file" | sed 's/[Xx]-[Cc]old-[Ss]tart: //i' | tr -d '\r')
    local content_length=$(grep -i "Content-Length:" "$headers_file" | sed 's/[Cc]ontent-[Ll]ength: //i' | tr -d '\r')

    # Parse timings
    local timings="{}"
    if [ -n "$server_timing" ]; then
        timings=$(parse_server_timing "$server_timing")
    fi

    # Estimate response size
    local size=${content_length:-$(echo -n "$body" | wc -c)}

    # Build result
    local result=$(jq -n \
        --arg status "$status" \
        --arg response_time "${response_time:-0}" \
        --arg cold "${cold_start:-false}" \
        --arg size "$size" \
        --argjson timings "$timings" \
        '{
            status: ($status | tonumber),
            response_time_ms: ($response_time | tonumber),
            cold_start: ($cold == "true"),
            size_bytes: ($size | tonumber),
            timings: $timings
        }')

    rm -f "$headers_file"
    echo "$result"
}

# Run profiling
run_profiling() {
    info "Profiling: $URL"
    info "Iterations: $ITERATIONS"
    echo ""

    local results="[]"
    local cold_count=0
    local warm_count=0

    for i in $(seq 1 "$ITERATIONS"); do
        printf "\r[%3d%%] Iteration %d/%d" "$((i * 100 / ITERATIONS))" "$i" "$ITERATIONS"

        local result=$(profile_request)
        results=$(echo "$results" | jq --argjson r "$result" '. + [$r]')

        # Count cold/warm
        if echo "$result" | jq -e '.cold_start == true' > /dev/null; then
            ((cold_count++)) || true
        else
            ((warm_count++)) || true
        fi

        debug "Result: $result"

        # Delay between requests
        if [ "$FORCE_COLD" = true ]; then
            info "Waiting 30s for cold start..."
            sleep 30
        else
            sleep "$DELAY"
        fi
    done

    echo ""
    echo ""

    # Analyze results
    analyze_results "$results" "$cold_count" "$warm_count"
}

# Analyze and display results
analyze_results() {
    local results="$1"
    local cold_count="$2"
    local warm_count="$3"

    # Calculate statistics
    local stats=$(echo "$results" | jq '
        {
            count: length,
            response_times: [.[].response_time_ms] | sort,
            sizes: [.[].size_bytes],
            cold_starts: [.[] | select(.cold_start == true)] | length,
            all_timings: [.[].timings] | add
        } |
        {
            count: .count,
            cold_starts: .cold_starts,
            response: {
                min: (.response_times | min),
                max: (.response_times | max),
                avg: ((.response_times | add) / .count),
                p50: .response_times[(.count / 2 | floor)],
                p95: .response_times[((.count * 0.95) | floor)],
                p99: .response_times[((.count * 0.99) | floor)]
            },
            size: {
                avg: ((.sizes | add) / .count)
            },
            timings: (
                if .all_timings then
                    .all_timings | to_entries | group_by(.key) | map({
                        key: .[0].key,
                        value: {
                            avg: ([.[].value] | add / length),
                            min: ([.[].value] | min),
                            max: ([.[].value] | max)
                        }
                    }) | from_entries
                else {}
                end
            )
        }
    ')

    # Display results
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    PROFILING RESULTS                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    echo "Summary:"
    echo "  Iterations:        $ITERATIONS"
    echo "  Cold Starts:       $cold_count ($(echo "scale=1; $cold_count * 100 / $ITERATIONS" | bc)%)"
    echo "  Warm Requests:     $warm_count ($(echo "scale=1; $warm_count * 100 / $ITERATIONS" | bc)%)"
    echo ""

    echo "Response Time (ms):"
    echo "$stats" | jq -r '.response | "  Min:               \(.min)ms\n  Max:               \(.max)ms\n  Avg:               \(.avg | floor)ms\n  p50:               \(.p50)ms\n  p95:               \(.p95)ms\n  p99:               \(.p99)ms"'
    echo ""

    echo "Response Size:"
    echo "$stats" | jq -r '.size | "  Average:           \(.avg | floor) bytes"'
    echo ""

    # Show individual timing breakdowns
    local timing_keys=$(echo "$stats" | jq -r '.timings | keys[]' 2>/dev/null)
    if [ -n "$timing_keys" ]; then
        echo "Server Timing Breakdown (avg ms):"
        echo "$stats" | jq -r '.timings | to_entries[] | "  \(.key): \(.value.avg | floor)ms (min: \(.value.min), max: \(.value.max))"'
        echo ""
    fi

    # Performance assessment
    echo "Assessment:"
    local avg_time=$(echo "$stats" | jq '.response.avg')

    if (( $(echo "$avg_time < 20" | bc -l) )); then
        echo -e "  ${GREEN}✓ Excellent average response time (< 20ms)${NC}"
    elif (( $(echo "$avg_time < 50" | bc -l) )); then
        echo -e "  ${GREEN}✓ Good average response time (20-50ms)${NC}"
    elif (( $(echo "$avg_time < 100" | bc -l) )); then
        echo -e "  ${YELLOW}○ Moderate response time (50-100ms)${NC}"
    else
        echo -e "  ${RED}✗ High response time (> 100ms)${NC}"
    fi

    if [ "$cold_count" -gt 0 ]; then
        if (( $(echo "$cold_count > $ITERATIONS / 2" | bc -l) )); then
            echo -e "  ${RED}✗ High cold start rate - consider warming${NC}"
        else
            echo -e "  ${YELLOW}○ Some cold starts detected${NC}"
        fi
    else
        echo -e "  ${GREEN}✓ No cold starts detected${NC}"
    fi

    # Compare with baseline
    if [ -n "$COMPARE_FILE" ] && [ -f "$COMPARE_FILE" ]; then
        echo ""
        echo "Comparison with baseline ($COMPARE_FILE):"
        compare_with_baseline "$stats"
    fi

    # Save output
    if [ -n "$OUTPUT_FILE" ]; then
        local full_results=$(jq -n \
            --arg url "$URL" \
            --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --argjson stats "$stats" \
            --argjson raw "$results" \
            '{
                url: $url,
                timestamp: $timestamp,
                stats: $stats,
                raw_results: $raw
            }')

        echo "$full_results" > "$OUTPUT_FILE"
        info "Results saved to $OUTPUT_FILE"
    fi
}

# Compare with baseline
compare_with_baseline() {
    local current="$1"
    local baseline=$(cat "$COMPARE_FILE")

    local curr_avg=$(echo "$current" | jq '.response.avg')
    local base_avg=$(echo "$baseline" | jq '.stats.response.avg')

    local diff=$(echo "scale=2; $curr_avg - $base_avg" | bc)
    local pct=$(echo "scale=1; ($diff / $base_avg) * 100" | bc)

    if (( $(echo "$diff < 0" | bc -l) )); then
        echo -e "  ${GREEN}↓ Response time improved by ${diff#-}ms (${pct#-}% faster)${NC}"
    elif (( $(echo "$diff > 0" | bc -l) )); then
        echo -e "  ${RED}↑ Response time degraded by ${diff}ms (${pct}% slower)${NC}"
    else
        echo -e "  ${BLUE}= Response time unchanged${NC}"
    fi

    local curr_cold=$(echo "$current" | jq '.cold_starts')
    local base_cold=$(echo "$baseline" | jq '.stats.cold_starts')

    if [ "$curr_cold" -lt "$base_cold" ]; then
        echo -e "  ${GREEN}↓ Fewer cold starts ($curr_cold vs $base_cold)${NC}"
    elif [ "$curr_cold" -gt "$base_cold" ]; then
        echo -e "  ${RED}↑ More cold starts ($curr_cold vs $base_cold)${NC}"
    fi
}

# Main
main() {
    parse_args "$@"
    check_deps
    run_profiling
}

main "$@"

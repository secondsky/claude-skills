#!/bin/bash
# Benchmarks R2 read/write performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="${R2_BUCKET_NAME:-test-bucket}"
TEST_DIR="/tmp/r2-benchmark-$$"
API_ENDPOINT="${R2_API_ENDPOINT:-http://localhost:8787}"
CONCURRENT_UPLOADS=${CONCURRENT_UPLOADS:-10}

echo "📊 R2 Performance Benchmark"
echo "============================"
echo ""
echo "Bucket: $BUCKET_NAME"
echo "API Endpoint: $API_ENDPOINT"
echo "Concurrent uploads: $CONCURRENT_UPLOADS"
echo ""

# Create test directory
mkdir -p "$TEST_DIR"
trap "rm -rf $TEST_DIR" EXIT

# Utility functions
benchmark() {
    local start=$(date +%s.%N)
    "$@"
    local end=$(date +%s.%N)
    echo $(echo "$end - $start" | bc)
}

format_time() {
    local time=$1
    printf "%.3f seconds" "$time"
}

format_throughput() {
    local bytes=$1
    local time=$2
    local mbps=$(echo "scale=2; ($bytes / 1048576) / $time" | bc)
    echo "${mbps} MB/s"
}

# Test 1: Sequential uploads (1KB to 100MB)
echo -e "${CYAN}=== Test 1: Sequential Upload Performance ===${NC}"
echo ""

SIZES=(1 10 100 1024 10240 102400) # KB
declare -A upload_times

for size_kb in "${SIZES[@]}"; do
    file_path="$TEST_DIR/seq-upload-${size_kb}kb.bin"
    dd if=/dev/urandom of="$file_path" bs=1024 count=$size_kb 2>/dev/null

    echo -n "  Uploading ${size_kb}KB file... "

    time=$(benchmark curl -s -X PUT \
        "$API_ENDPOINT/upload/seq-${size_kb}kb.bin" \
        -H "Content-Type: application/octet-stream" \
        --data-binary "@$file_path" \
        -o /dev/null)

    upload_times[$size_kb]=$time
    throughput=$(format_throughput $((size_kb * 1024)) $time)

    echo -e "${GREEN}$(format_time $time)${NC} ($throughput)"
done

echo ""

# Test 2: Parallel uploads (10 concurrent 10MB files)
echo -e "${CYAN}=== Test 2: Parallel Upload Performance ===${NC}"
echo ""

FILE_SIZE_MB=10
FILE_SIZE_BYTES=$((FILE_SIZE_MB * 1048576))

echo "  Creating $CONCURRENT_UPLOADS test files (${FILE_SIZE_MB}MB each)..."
for i in $(seq 1 $CONCURRENT_UPLOADS); do
    dd if=/dev/urandom of="$TEST_DIR/parallel-$i.bin" bs=1048576 count=$FILE_SIZE_MB 2>/dev/null &
done
wait

echo -n "  Uploading $CONCURRENT_UPLOADS files in parallel... "

start=$(date +%s.%N)

for i in $(seq 1 $CONCURRENT_UPLOADS); do
    curl -s -X PUT \
        "$API_ENDPOINT/upload/parallel-$i.bin" \
        -H "Content-Type: application/octet-stream" \
        --data-binary "@$TEST_DIR/parallel-$i.bin" \
        -o /dev/null &
done
wait

end=$(date +%s.%N)
parallel_time=$(echo "$end - $start" | bc)

total_bytes=$((CONCURRENT_UPLOADS * FILE_SIZE_BYTES))
throughput=$(format_throughput $total_bytes $parallel_time)

echo -e "${GREEN}$(format_time $parallel_time)${NC} ($throughput)"
echo ""

# Test 3: Sequential downloads
echo -e "${CYAN}=== Test 3: Sequential Download Performance ===${NC}"
echo ""

for size_kb in "${SIZES[@]}"; do
    echo -n "  Downloading ${size_kb}KB file... "

    time=$(benchmark curl -s \
        "$API_ENDPOINT/download/seq-${size_kb}kb.bin" \
        -o "$TEST_DIR/download-${size_kb}kb.bin")

    throughput=$(format_throughput $((size_kb * 1024)) $time)

    echo -e "${GREEN}$(format_time $time)${NC} ($throughput)"
done

echo ""

# Test 4: Parallel downloads
echo -e "${CYAN}=== Test 4: Parallel Download Performance ===${NC}"
echo ""

echo -n "  Downloading $CONCURRENT_UPLOADS files in parallel... "

start=$(date +%s.%N)

for i in $(seq 1 $CONCURRENT_UPLOADS); do
    curl -s "$API_ENDPOINT/download/parallel-$i.bin" \
        -o "$TEST_DIR/download-parallel-$i.bin" &
done
wait

end=$(date +%s.%N)
parallel_download_time=$(echo "$end - $start" | bc)

throughput=$(format_throughput $total_bytes $parallel_download_time)

echo -e "${GREEN}$(format_time $parallel_download_time)${NC} ($throughput)"
echo ""

# Test 5: List operations with various prefix counts
echo -e "${CYAN}=== Test 5: List Operations Performance ===${NC}"
echo ""

# Create files with different prefixes
PREFIXES=(10 50 100 500)

echo "  Creating files for list tests..."
for prefix_count in "${PREFIXES[@]}"; do
    for i in $(seq 1 $prefix_count); do
        echo "test" | curl -s -X PUT \
            "$API_ENDPOINT/upload/list-test-${prefix_count}/file-$i.txt" \
            -H "Content-Type: text/plain" \
            --data-binary @- \
            -o /dev/null &
    done
done
wait

echo ""

for prefix_count in "${PREFIXES[@]}"; do
    echo -n "  Listing $prefix_count objects... "

    time=$(benchmark curl -s "$API_ENDPOINT/list?prefix=list-test-${prefix_count}/" -o /dev/null)

    echo -e "${GREEN}$(format_time $time)${NC}"
done

echo ""

# Test 6: Bulk delete performance
echo -e "${CYAN}=== Test 6: Bulk Delete Performance ===${NC}"
echo ""

DELETE_COUNTS=(10 50 100)

for count in "${DELETE_COUNTS[@]}"; do
    echo -n "  Deleting $count objects... "

    start=$(date +%s.%N)

    for i in $(seq 1 $count); do
        curl -s -X DELETE "$API_ENDPOINT/delete/list-test-${count}/file-$i.txt" -o /dev/null &
    done
    wait

    end=$(date +%s.%N)
    time=$(echo "$end - $start" | bc)

    rate=$(echo "scale=2; $count / $time" | bc)

    echo -e "${GREEN}$(format_time $time)${NC} (${rate} deletes/sec)"
done

echo ""

# Summary Report
echo "============================"
echo -e "${BLUE}Performance Summary${NC}"
echo "============================"
echo ""

echo "Sequential Upload Performance:"
for size_kb in "${SIZES[@]}"; do
    time=${upload_times[$size_kb]}
    throughput=$(format_throughput $((size_kb * 1024)) $time)
    printf "  %6s KB: %12s (%s)\n" "$size_kb" "$(format_time $time)" "$throughput"
done

echo ""
echo "Parallel Upload Performance:"
printf "  %d x %d MB: %12s (%s)\n" \
    "$CONCURRENT_UPLOADS" "$FILE_SIZE_MB" \
    "$(format_time $parallel_time)" \
    "$(format_throughput $total_bytes $parallel_time)"

echo ""
echo "Parallel Download Performance:"
printf "  %d x %d MB: %12s (%s)\n" \
    "$CONCURRENT_UPLOADS" "$FILE_SIZE_MB" \
    "$(format_time $parallel_download_time)" \
    "$(format_throughput $total_bytes $parallel_download_time)"

echo ""

# Recommendations
echo "============================"
echo -e "${YELLOW}Recommendations${NC}"
echo "============================"
echo ""

# Analyze upload performance
largest_size=102400
largest_time=${upload_times[$largest_size]}
largest_throughput=$(echo "scale=2; ($largest_size * 1024 / 1048576) / $largest_time" | bc)

if (( $(echo "$largest_throughput < 10" | bc -l) )); then
    echo -e "${YELLOW}⚠ Upload throughput is low ($largest_throughput MB/s)${NC}"
    echo "  Consider:"
    echo "  - Using multipart uploads for files >100MB"
    echo "  - Checking network latency to R2 endpoint"
    echo "  - Enabling connection pooling"
else
    echo -e "${GREEN}✓ Upload throughput is good ($largest_throughput MB/s)${NC}"
fi

echo ""

# Analyze parallel performance
parallel_speedup=$(echo "scale=2; $parallel_time / (${upload_times[10240]} * $CONCURRENT_UPLOADS)" | bc)

if (( $(echo "$parallel_speedup > 0.8" | bc -l) )); then
    echo -e "${GREEN}✓ Parallel uploads show good speedup (${parallel_speedup}x)${NC}"
else
    echo -e "${YELLOW}⚠ Parallel uploads may benefit from optimization${NC}"
    echo "  Current speedup: ${parallel_speedup}x"
    echo "  Consider tuning max_concurrency settings"
fi

echo ""
echo -e "${GREEN}✅ Benchmark complete!${NC}"

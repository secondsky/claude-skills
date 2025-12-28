#!/bin/bash
# Tests R2 upload functionality with various file sizes and types

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="${R2_BUCKET_NAME:-test-bucket}"
TEST_DIR="/tmp/r2-upload-test-$$"
API_ENDPOINT="${R2_API_ENDPOINT:-http://localhost:8787}"

echo "🧪 R2 Upload Test Suite"
echo "======================="
echo ""
echo "Bucket: $BUCKET_NAME"
echo "API Endpoint: $API_ENDPOINT"
echo "Test Directory: $TEST_DIR"
echo ""

# Create test directory
mkdir -p "$TEST_DIR"
trap "rm -rf $TEST_DIR" EXIT

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name=$1
    local file_path=$2
    local content_type=$3
    local expected_size=$4

    ((TESTS_RUN++))
    echo -e "${BLUE}Test $TESTS_RUN: $test_name${NC}"

    # Upload file
    local upload_response
    if upload_response=$(curl -s -w "\n%{http_code}" -X PUT \
        "$API_ENDPOINT/upload/$(basename "$file_path")" \
        -H "Content-Type: $content_type" \
        --data-binary "@$file_path" 2>&1); then

        local http_code=$(echo "$upload_response" | tail -n 1)
        local response_body=$(echo "$upload_response" | head -n -1)

        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            echo -e "  ${GREEN}✓ Upload successful (HTTP $http_code)${NC}"

            # Verify download
            local download_path="$TEST_DIR/downloaded-$(basename "$file_path")"
            if curl -s "$API_ENDPOINT/download/$(basename "$file_path")" -o "$download_path"; then

                # Compare checksums
                local original_md5=$(md5sum "$file_path" | awk '{print $1}')
                local downloaded_md5=$(md5sum "$download_path" | awk '{print $1}')

                if [ "$original_md5" = "$downloaded_md5" ]; then
                    echo -e "  ${GREEN}✓ Download integrity verified (MD5: $original_md5)${NC}"

                    # Check file size
                    local actual_size=$(stat -f%z "$download_path" 2>/dev/null || stat -c%s "$download_path" 2>/dev/null)
                    if [ "$actual_size" = "$expected_size" ]; then
                        echo -e "  ${GREEN}✓ File size correct ($actual_size bytes)${NC}"
                        ((TESTS_PASSED++))
                    else
                        echo -e "  ${RED}✗ File size mismatch (expected: $expected_size, got: $actual_size)${NC}"
                        ((TESTS_FAILED++))
                    fi
                else
                    echo -e "  ${RED}✗ Download integrity check failed${NC}"
                    echo -e "    Original: $original_md5"
                    echo -e "    Downloaded: $downloaded_md5"
                    ((TESTS_FAILED++))
                fi
            else
                echo -e "  ${RED}✗ Download failed${NC}"
                ((TESTS_FAILED++))
            fi
        else
            echo -e "  ${RED}✗ Upload failed (HTTP $http_code)${NC}"
            echo -e "    Response: $response_body"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "  ${RED}✗ Upload request failed${NC}"
        ((TESTS_FAILED++))
    fi

    echo ""
}

# Test 1: Small file (1KB text)
echo "Creating test files..."
echo ""

dd if=/dev/urandom of="$TEST_DIR/small.txt" bs=1024 count=1 2>/dev/null
run_test "Small file (1KB text)" "$TEST_DIR/small.txt" "text/plain" 1024

# Test 2: Medium file (10MB binary)
dd if=/dev/urandom of="$TEST_DIR/medium.bin" bs=1048576 count=10 2>/dev/null
run_test "Medium file (10MB binary)" "$TEST_DIR/medium.bin" "application/octet-stream" 10485760

# Test 3: Large file (50MB - below multipart threshold)
dd if=/dev/urandom of="$TEST_DIR/large.bin" bs=1048576 count=50 2>/dev/null
run_test "Large file (50MB)" "$TEST_DIR/large.bin" "application/octet-stream" 52428800

# Test 4: Image file (synthetic JPEG)
# Create a minimal valid JPEG header + random data
printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00' > "$TEST_DIR/image.jpg"
dd if=/dev/urandom bs=1024 count=100 2>/dev/null >> "$TEST_DIR/image.jpg"
printf '\xff\xd9' >> "$TEST_DIR/image.jpg"
IMAGE_SIZE=$(stat -f%z "$TEST_DIR/image.jpg" 2>/dev/null || stat -c%s "$TEST_DIR/image.jpg" 2>/dev/null)
run_test "Image file (JPEG, ~100KB)" "$TEST_DIR/image.jpg" "image/jpeg" "$IMAGE_SIZE"

# Test 5: JSON document
cat > "$TEST_DIR/document.json" << 'EOF'
{
  "name": "R2 Upload Test",
  "description": "Testing R2 upload functionality",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "test": true,
    "size": "small"
  }
}
EOF
JSON_SIZE=$(stat -f%z "$TEST_DIR/document.json" 2>/dev/null || stat -c%s "$TEST_DIR/document.json" 2>/dev/null)
run_test "JSON document" "$TEST_DIR/document.json" "application/json" "$JSON_SIZE"

# Test 6: Content-type preservation
HTML_FILE="$TEST_DIR/page.html"
cat > "$HTML_FILE" << 'EOF'
<!DOCTYPE html>
<html><head><title>Test</title></head><body><h1>R2 Test</h1></body></html>
EOF
HTML_SIZE=$(stat -f%z "$HTML_FILE" 2>/dev/null || stat -c%s "$HTML_FILE" 2>/dev/null)
run_test "HTML file (content-type check)" "$HTML_FILE" "text/html" "$HTML_SIZE"

# Summary
echo "======================="
echo "Test Results:"
echo -e "  Total: $TESTS_RUN"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $TESTS_FAILED test(s) failed${NC}"
    exit 1
fi

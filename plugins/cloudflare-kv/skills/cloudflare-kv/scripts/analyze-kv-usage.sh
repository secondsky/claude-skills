#!/bin/bash

# Cloudflare Workers KV - Usage Analyzer
# Analyzes Worker code for KV usage patterns and suggests optimizations

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Cloudflare Workers KV - Usage Analyzer"
echo "======================================"
echo ""

# Check if file provided
if [ -z "$1" ]; then
  echo -e "${RED}Error:${NC} No file specified"
  echo "Usage: $0 <worker-file.ts|worker-file.js>"
  echo ""
  echo "Example: $0 src/index.ts"
  exit 1
fi

WORKER_FILE=$1

# Check if file exists
if [ ! -f "$WORKER_FILE" ]; then
  echo -e "${RED}Error:${NC} File not found: $WORKER_FILE"
  exit 1
fi

echo "Analyzing: $WORKER_FILE"
echo ""

# Initialize counters
TOTAL_ISSUES=0
OPTIMIZATIONS=0
WARNINGS=0

# Analysis: Check for KV operations
KV_GET_COUNT=$(grep -c "\.get(" "$WORKER_FILE" || echo "0")
KV_PUT_COUNT=$(grep -c "\.put(" "$WORKER_FILE" || echo "0")
KV_DELETE_COUNT=$(grep -c "\.delete(" "$WORKER_FILE" || echo "0")
KV_LIST_COUNT=$(grep -c "\.list(" "$WORKER_FILE" || echo "0")

echo "KV Operations Found:"
echo "  - get():    $KV_GET_COUNT"
echo "  - put():    $KV_PUT_COUNT"
echo "  - delete(): $KV_DELETE_COUNT"
echo "  - list():   $KV_LIST_COUNT"
echo ""

if [ "$KV_GET_COUNT" -eq 0 ] && [ "$KV_PUT_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}⚠${NC} No KV operations found in this file"
  echo "  This file may not use KV, or operations are in other files."
  echo ""
fi

# Check 1: Missing TTL on put() operations
echo "Issue Check 1: Missing TTL on put() operations"
echo "----------------------------------------------"

PUT_WITH_TTL=$(grep "\.put(" "$WORKER_FILE" | grep -c "expirationTtl\|expiration" || echo "0")

if [ "$KV_PUT_COUNT" -gt 0 ]; then
  if [ "$PUT_WITH_TTL" -lt "$KV_PUT_COUNT" ]; then
    MISSING_TTL=$((KV_PUT_COUNT - PUT_WITH_TTL))
    echo -e "${YELLOW}⚠${NC} $MISSING_TTL put() operation(s) without TTL/expiration"
    echo "  Issue: Data will persist indefinitely, increasing storage costs"
    echo "  Fix: Add expirationTtl or expiration to put() calls"
    echo ""
    echo "  Example:"
    echo "    await env.KV.put('key', 'value', { expirationTtl: 3600 });"
    echo ""
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✓${NC} All put() operations have TTL/expiration"
  fi
else
  echo -e "${BLUE}ℹ${NC} No put() operations to check"
fi

echo ""

# Check 2: Missing cacheTtl on get() operations
echo "Issue Check 2: Missing cacheTtl on get() operations"
echo "---------------------------------------------------"

GET_WITH_CACHE_TTL=$(grep "\.get(" "$WORKER_FILE" | grep -c "cacheTtl" || echo "0")

if [ "$KV_GET_COUNT" -gt 0 ]; then
  if [ "$GET_WITH_CACHE_TTL" -lt "$KV_GET_COUNT" ]; then
    MISSING_CACHE_TTL=$((KV_GET_COUNT - GET_WITH_CACHE_TTL))
    echo -e "${YELLOW}⚠${NC} $MISSING_CACHE_TTL get() operation(s) without cacheTtl"
    echo "  Issue: Missing edge caching optimization"
    echo "  Fix: Add cacheTtl for frequently-read data (min 60 seconds)"
    echo ""
    echo "  Example:"
    echo "    const value = await env.KV.get('key', { cacheTtl: 300 });"
    echo ""
    OPTIMIZATIONS=$((OPTIMIZATIONS + 1))
  else
    echo -e "${GREEN}✓${NC} All get() operations use cacheTtl"
  fi
else
  echo -e "${BLUE}ℹ${NC} No get() operations to check"
fi

echo ""

# Check 3: No error handling
echo "Issue Check 3: Missing error handling"
echo "-------------------------------------"

TRY_CATCH_COUNT=$(grep -c "try {" "$WORKER_FILE" || echo "0")

if [ "$KV_GET_COUNT" -gt 0 ] || [ "$KV_PUT_COUNT" -gt 0 ]; then
  if [ "$TRY_CATCH_COUNT" -eq 0 ]; then
    echo -e "${RED}✗${NC} No try-catch blocks found"
    echo "  Issue: KV operations can fail (rate limits, network errors)"
    echo "  Fix: Wrap KV operations in try-catch"
    echo ""
    echo "  Example:"
    echo "    try {"
    echo "      const value = await env.KV.get('key');"
    echo "    } catch (error) {"
    echo "      console.error('KV error:', error);"
    echo "      // Handle gracefully"
    echo "    }"
    echo ""
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
  else
    echo -e "${GREEN}✓${NC} Error handling found ($TRY_CATCH_COUNT try-catch block(s))"
  fi
else
  echo -e "${BLUE}ℹ${NC} No KV operations to check"
fi

echo ""

# Check 4: Multiple sequential get() calls (could be bulk read)
echo "Issue Check 4: Sequential get() calls (bulk read opportunity)"
echo "-------------------------------------------------------------"

# Simple heuristic: multiple awaits in sequence
SEQUENTIAL_AWAITS=$(grep -c "await.*\.get(" "$WORKER_FILE" || echo "0")

if [ "$SEQUENTIAL_AWAITS" -gt 2 ]; then
  echo -e "${YELLOW}⚠${NC} Multiple sequential await get() calls detected"
  echo "  Issue: Each get() counts as separate operation"
  echo "  Fix: Consider using Promise.all() for parallel reads"
  echo ""
  echo "  Example:"
  echo "    const [val1, val2, val3] = await Promise.all(["
  echo "      env.KV.get('key1'),"
  echo "      env.KV.get('key2'),"
  echo "      env.KV.get('key3')"
  echo "    ]);"
  echo ""
  OPTIMIZATIONS=$((OPTIMIZATIONS + 1))
else
  echo -e "${GREEN}✓${NC} No obvious sequential get() pattern detected"
fi

echo ""

# Check 5: list() without limit (pagination)
echo "Issue Check 5: list() pagination"
echo "--------------------------------"

if [ "$KV_LIST_COUNT" -gt 0 ]; then
  LIST_WITH_LIMIT=$(grep "\.list(" "$WORKER_FILE" | grep -c "limit" || echo "0")

  if [ "$LIST_WITH_LIMIT" -lt "$KV_LIST_COUNT" ]; then
    MISSING_LIMIT=$((KV_LIST_COUNT - LIST_WITH_LIMIT))
    echo -e "${YELLOW}⚠${NC} $MISSING_LIMIT list() operation(s) without limit"
    echo "  Issue: Could return too many keys (max 1000)"
    echo "  Fix: Always specify limit and use cursor for pagination"
    echo ""
    echo "  Example:"
    echo "    const { keys, cursor } = await env.KV.list({ limit: 100 });"
    echo ""
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✓${NC} All list() operations have limit"
  fi
else
  echo -e "${BLUE}ℹ${NC} No list() operations to check"
fi

echo ""

# Check 6: waitUntil() usage for async writes
echo "Issue Check 6: waitUntil() for async writes"
echo "-------------------------------------------"

WAIT_UNTIL_COUNT=$(grep -c "waitUntil" "$WORKER_FILE" || echo "0")

if [ "$KV_PUT_COUNT" -gt 0 ]; then
  if [ "$WAIT_UNTIL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC} No waitUntil() found (non-blocking writes opportunity)"
    echo "  Optimization: Use ctx.waitUntil() for non-critical writes"
    echo "  Benefit: Faster response times"
    echo ""
    echo "  Example:"
    echo "    ctx.waitUntil("
    echo "      env.KV.put('analytics', data)"
    echo "    );"
    echo "    return new Response('OK'); // Don't wait for KV write"
    echo ""
    OPTIMIZATIONS=$((OPTIMIZATIONS + 1))
  else
    echo -e "${GREEN}✓${NC} waitUntil() usage found"
  fi
else
  echo -e "${BLUE}ℹ${NC} No put() operations to check"
fi

echo ""

# Check 7: JSON.stringify usage
echo "Issue Check 7: Object storage (JSON.stringify)"
echo "----------------------------------------------"

JSON_STRINGIFY_COUNT=$(grep -c "JSON.stringify" "$WORKER_FILE" || echo "0")

if [ "$KV_PUT_COUNT" -gt 0 ]; then
  if [ "$JSON_STRINGIFY_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC} No JSON.stringify found"
    echo "  Reminder: KV stores strings only"
    echo "  For objects, use: JSON.stringify(obj)"
    echo "  For retrieval, use: JSON.parse(value)"
    echo ""
    OPTIMIZATIONS=$((OPTIMIZATIONS + 1))
  else
    echo -e "${GREEN}✓${NC} JSON.stringify usage found"
  fi
else
  echo -e "${BLUE}ℹ${NC} No put() operations to check"
fi

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo ""
echo -e "Critical Issues:   ${RED}$TOTAL_ISSUES${NC}"
echo -e "Warnings:          ${YELLOW}$WARNINGS${NC}"
echo -e "Optimizations:     ${BLUE}$OPTIMIZATIONS${NC}"
echo ""

if [ $TOTAL_ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ] && [ $OPTIMIZATIONS -eq 0 ]; then
  echo -e "${GREEN}✓ Excellent! No issues found.${NC}"
  echo ""
  echo "Your KV usage follows best practices."
elif [ $TOTAL_ISSUES -eq 0 ]; then
  echo -e "${GREEN}✓ No critical issues${NC}"
  echo ""
  if [ $WARNINGS -gt 0 ]; then
    echo "Consider addressing warnings to improve reliability."
  fi
  if [ $OPTIMIZATIONS -gt 0 ]; then
    echo "Consider optimizations to improve performance and reduce costs."
  fi
else
  echo -e "${RED}⚠ Critical issues found${NC}"
  echo ""
  echo "Please address critical issues before deploying to production."
fi

echo ""
echo "For more details, see:"
echo "  - references/best-practices.md"
echo "  - references/performance-tuning.md"
echo ""

exit $TOTAL_ISSUES

#!/bin/bash
# Migration Analysis Script
#
# Analyzes a codebase for Workers migration compatibility.
# Detects Node.js APIs, dependencies, and potential issues.
#
# Usage:
#   ./scripts/analyze-migration.sh [directory] [--format json|text]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Defaults
TARGET_DIR="${1:-.}"
FORMAT="text"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --format)
      FORMAT="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [directory] [options]"
      echo ""
      echo "Options:"
      echo "  --format json|text  Output format (default: text)"
      echo "  --verbose, -v       Show detailed findings"
      echo "  --help, -h          Show this help"
      exit 0
      ;;
    *)
      if [[ -d "$1" ]]; then
        TARGET_DIR="$1"
      fi
      shift
      ;;
  esac
done

# Validate directory
if [[ ! -d "$TARGET_DIR" ]]; then
  echo -e "${RED}Error: Directory not found: $TARGET_DIR${NC}"
  exit 1
fi

cd "$TARGET_DIR"

# ==========================================
# DETECTION FUNCTIONS
# ==========================================

# Detect platform
detect_platform() {
  if [[ -f "vercel.json" ]] || grep -q '"vercel"' package.json 2>/dev/null; then
    echo "vercel"
  elif grep -q "aws-lambda" package.json 2>/dev/null || [[ -f "serverless.yml" ]]; then
    echo "lambda"
  elif grep -q '"express"' package.json 2>/dev/null; then
    echo "express"
  elif grep -q '"next"' package.json 2>/dev/null; then
    echo "nextjs"
  else
    echo "node"
  fi
}

# Count Node.js API usage
count_node_apis() {
  local pattern="$1"
  local count=0

  if [[ -d "src" ]] || [[ -d "pages" ]] || [[ -d "api" ]]; then
    count=$(grep -r "$pattern" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null | wc -l | tr -d ' ')
  fi

  echo "$count"
}

# Find files with pattern
find_files_with_pattern() {
  local pattern="$1"
  grep -rl "$pattern" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null || true
}

# ==========================================
# ANALYSIS
# ==========================================

echo -e "${BLUE}=== Workers Migration Analysis ===${NC}"
echo -e "Directory: ${CYAN}$TARGET_DIR${NC}"
echo ""

# Platform detection
PLATFORM=$(detect_platform)
echo -e "${BLUE}Platform Detected:${NC} ${CYAN}$PLATFORM${NC}"
echo ""

# Initialize counters
CRITICAL=0
WARNING=0
INFO=0
COMPATIBLE=0

# Results arrays
declare -a CRITICAL_ISSUES
declare -a WARNING_ISSUES
declare -a INFO_ISSUES
declare -a COMPATIBLE_ITEMS

# ==========================================
# CHECK NODE.JS APIS
# ==========================================

echo -e "${BLUE}Checking Node.js API usage...${NC}"
echo ""

# fs module
FS_COUNT=$(count_node_apis "require('fs')\|from 'fs'\|from 'node:fs'")
if [[ $FS_COUNT -gt 0 ]]; then
  CRITICAL_ISSUES+=("fs module: $FS_COUNT usages (use KV/R2 instead)")
  ((CRITICAL++))
fi

# child_process
CP_COUNT=$(count_node_apis "require('child_process')\|from 'child_process'")
if [[ $CP_COUNT -gt 0 ]]; then
  CRITICAL_ISSUES+=("child_process: $CP_COUNT usages (not supported)")
  ((CRITICAL++))
fi

# net/tls
NET_COUNT=$(count_node_apis "require('net')\|from 'net'\|require('tls')\|from 'tls'")
if [[ $NET_COUNT -gt 0 ]]; then
  CRITICAL_ISSUES+=("net/tls modules: $NET_COUNT usages (use fetch/WebSocket)")
  ((CRITICAL++))
fi

# cluster/worker_threads
CLUSTER_COUNT=$(count_node_apis "require('cluster')\|from 'cluster'\|require('worker_threads')")
if [[ $CLUSTER_COUNT -gt 0 ]]; then
  CRITICAL_ISSUES+=("cluster/worker_threads: $CLUSTER_COUNT usages (not supported)")
  ((CRITICAL++))
fi

# dgram
DGRAM_COUNT=$(count_node_apis "require('dgram')\|from 'dgram'")
if [[ $DGRAM_COUNT -gt 0 ]]; then
  CRITICAL_ISSUES+=("dgram (UDP): $DGRAM_COUNT usages (not supported)")
  ((CRITICAL++))
fi

# process.env direct usage
ENV_COUNT=$(count_node_apis "process\.env\.")
if [[ $ENV_COUNT -gt 0 ]]; then
  WARNING_ISSUES+=("process.env: $ENV_COUNT usages (use env parameter)")
  ((WARNING++))
fi

# require() usage
REQUIRE_COUNT=$(count_node_apis "require(")
if [[ $REQUIRE_COUNT -gt 0 ]]; then
  WARNING_ISSUES+=("require(): $REQUIRE_COUNT usages (convert to ESM)")
  ((WARNING++))
fi

# global usage
GLOBAL_COUNT=$(count_node_apis "global\.\|globalThis\.")
if [[ $GLOBAL_COUNT -gt 0 ]]; then
  WARNING_ISSUES+=("global/globalThis: $GLOBAL_COUNT usages (limited support)")
  ((WARNING++))
fi

# crypto (partial support)
CRYPTO_COUNT=$(count_node_apis "require('crypto')\|from 'crypto'")
if [[ $CRYPTO_COUNT -gt 0 ]]; then
  INFO_ISSUES+=("crypto module: $CRYPTO_COUNT usages (partial support with nodejs_compat)")
  ((INFO++))
fi

# Buffer
BUFFER_COUNT=$(count_node_apis "Buffer\.")
if [[ $BUFFER_COUNT -gt 0 ]]; then
  INFO_ISSUES+=("Buffer: $BUFFER_COUNT usages (supported with nodejs_compat)")
  ((INFO++))
fi

# stream
STREAM_COUNT=$(count_node_apis "require('stream')\|from 'stream'")
if [[ $STREAM_COUNT -gt 0 ]]; then
  INFO_ISSUES+=("stream module: $STREAM_COUNT usages (supported with nodejs_compat)")
  ((INFO++))
fi

# path
PATH_COUNT=$(count_node_apis "require('path')\|from 'path'")
if [[ $PATH_COUNT -gt 0 ]]; then
  COMPATIBLE_ITEMS+=("path module: $PATH_COUNT usages (fully supported)")
  ((COMPATIBLE++))
fi

# util
UTIL_COUNT=$(count_node_apis "require('util')\|from 'util'")
if [[ $UTIL_COUNT -gt 0 ]]; then
  COMPATIBLE_ITEMS+=("util module: $UTIL_COUNT usages (mostly supported)")
  ((COMPATIBLE++))
fi

# ==========================================
# CHECK DEPENDENCIES
# ==========================================

echo -e "${BLUE}Checking dependencies...${NC}"
echo ""

if [[ -f "package.json" ]]; then
  # Native modules (require compilation)
  NATIVE_DEPS=("bcrypt" "sharp" "sqlite3" "canvas" "node-gyp" "better-sqlite3")
  for dep in "${NATIVE_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
      CRITICAL_ISSUES+=("Native dependency: $dep (needs pure JS alternative)")
      ((CRITICAL++))
    fi
  done

  # Problematic deps
  PROBLEM_DEPS=("puppeteer" "playwright" "selenium")
  for dep in "${PROBLEM_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
      CRITICAL_ISSUES+=("Browser automation: $dep (use Browser Rendering API)")
      ((CRITICAL++))
    fi
  done

  # DB clients (need adapters)
  DB_DEPS=("pg" "mysql" "mysql2" "mongoose" "mongodb" "redis")
  for dep in "${DB_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
      WARNING_ISSUES+=("Database client: $dep (use Hyperdrive or D1)")
      ((WARNING++))
    fi
  done

  # ORM (may need migration)
  ORM_DEPS=("prisma" "typeorm" "sequelize" "knex")
  for dep in "${ORM_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
      WARNING_ISSUES+=("ORM: $dep (consider Drizzle with D1)")
      ((WARNING++))
    fi
  done

  # HTTP clients
  HTTP_DEPS=("axios" "got" "node-fetch" "request")
  for dep in "${HTTP_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
      INFO_ISSUES+=("HTTP client: $dep (can use native fetch)")
      ((INFO++))
    fi
  done

  # Compatible deps
  COMPAT_DEPS=("lodash" "date-fns" "zod" "uuid" "jose")
  for dep in "${COMPAT_DEPS[@]}"; do
    if grep -q "\"$dep\"" package.json 2>/dev/null; then
      COMPATIBLE_ITEMS+=("Compatible dependency: $dep")
      ((COMPATIBLE++))
    fi
  done
fi

# ==========================================
# PLATFORM-SPECIFIC CHECKS
# ==========================================

echo -e "${BLUE}Platform-specific analysis...${NC}"
echo ""

case $PLATFORM in
  lambda)
    # Check Lambda handlers
    HANDLER_COUNT=$(count_node_apis "exports\.handler\|export const handler\|export async function handler")
    INFO_ISSUES+=("Lambda handlers found: $HANDLER_COUNT (use adapter pattern)")
    ((INFO++))

    # Check AWS SDK usage
    AWS_SDK=$(count_node_apis "aws-sdk\|@aws-sdk")
    if [[ $AWS_SDK -gt 0 ]]; then
      WARNING_ISSUES+=("AWS SDK: $AWS_SDK usages (replace with Workers equivalents)")
      ((WARNING++))
    fi
    ;;

  vercel)
    # Check Vercel-specific imports
    VERCEL_IMPORTS=$(count_node_apis "@vercel/")
    if [[ $VERCEL_IMPORTS -gt 0 ]]; then
      WARNING_ISSUES+=("Vercel imports: $VERCEL_IMPORTS (replace with Cloudflare bindings)")
      ((WARNING++))
    fi

    # Check Next.js API routes
    if [[ -d "pages/api" ]] || [[ -d "app/api" ]]; then
      API_ROUTES=$(find pages/api app/api -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
      INFO_ISSUES+=("API routes found: $API_ROUTES (can migrate with adapter)")
      ((INFO++))
    fi
    ;;

  express)
    # Check Express app
    EXPRESS_APP=$(count_node_apis "express()")
    INFO_ISSUES+=("Express apps: $EXPRESS_APP (consider Hono for similar API)")
    ((INFO++))

    # Check middleware usage
    MIDDLEWARE=$(count_node_apis "app\.use(")
    if [[ $MIDDLEWARE -gt 0 ]]; then
      INFO_ISSUES+=("Express middleware: $MIDDLEWARE (needs conversion)")
      ((INFO++))
    fi
    ;;

  nextjs)
    # Check for App Router vs Pages Router
    if [[ -d "app" ]]; then
      INFO_ISSUES+=("Next.js App Router detected (use OpenNext adapter)")
      ((INFO++))
    fi
    if [[ -d "pages" ]]; then
      INFO_ISSUES+=("Next.js Pages Router detected (use OpenNext adapter)")
      ((INFO++))
    fi

    # Check Server Actions
    SERVER_ACTIONS=$(count_node_apis "'use server'")
    if [[ $SERVER_ACTIONS -gt 0 ]]; then
      INFO_ISSUES+=("Server Actions: $SERVER_ACTIONS files (supported with OpenNext)")
      ((INFO++))
    fi
    ;;
esac

# ==========================================
# OUTPUT RESULTS
# ==========================================

if [[ "$FORMAT" == "json" ]]; then
  # JSON output
  echo "{"
  echo "  \"platform\": \"$PLATFORM\","
  echo "  \"summary\": {"
  echo "    \"critical\": $CRITICAL,"
  echo "    \"warning\": $WARNING,"
  echo "    \"info\": $INFO,"
  echo "    \"compatible\": $COMPATIBLE"
  echo "  },"
  echo "  \"issues\": {"
  echo "    \"critical\": ["
  for i in "${!CRITICAL_ISSUES[@]}"; do
    echo -n "      \"${CRITICAL_ISSUES[$i]}\""
    [[ $i -lt $((${#CRITICAL_ISSUES[@]} - 1)) ]] && echo "," || echo ""
  done
  echo "    ],"
  echo "    \"warning\": ["
  for i in "${!WARNING_ISSUES[@]}"; do
    echo -n "      \"${WARNING_ISSUES[$i]}\""
    [[ $i -lt $((${#WARNING_ISSUES[@]} - 1)) ]] && echo "," || echo ""
  done
  echo "    ],"
  echo "    \"info\": ["
  for i in "${!INFO_ISSUES[@]}"; do
    echo -n "      \"${INFO_ISSUES[$i]}\""
    [[ $i -lt $((${#INFO_ISSUES[@]} - 1)) ]] && echo "," || echo ""
  done
  echo "    ]"
  echo "  },"
  echo "  \"compatible\": ["
  for i in "${!COMPATIBLE_ITEMS[@]}"; do
    echo -n "    \"${COMPATIBLE_ITEMS[$i]}\""
    [[ $i -lt $((${#COMPATIBLE_ITEMS[@]} - 1)) ]] && echo "," || echo ""
  done
  echo "  ]"
  echo "}"
else
  # Text output
  echo ""
  echo -e "${BLUE}=== Results ===${NC}"
  echo ""

  # Critical issues
  if [[ ${#CRITICAL_ISSUES[@]} -gt 0 ]]; then
    echo -e "${RED}CRITICAL (blocking):${NC}"
    for issue in "${CRITICAL_ISSUES[@]}"; do
      echo -e "  ${RED}✗${NC} $issue"
    done
    echo ""
  fi

  # Warnings
  if [[ ${#WARNING_ISSUES[@]} -gt 0 ]]; then
    echo -e "${YELLOW}WARNINGS (needs changes):${NC}"
    for issue in "${WARNING_ISSUES[@]}"; do
      echo -e "  ${YELLOW}⚠${NC} $issue"
    done
    echo ""
  fi

  # Info
  if [[ ${#INFO_ISSUES[@]} -gt 0 ]]; then
    echo -e "${CYAN}INFO (may need attention):${NC}"
    for issue in "${INFO_ISSUES[@]}"; do
      echo -e "  ${CYAN}ℹ${NC} $issue"
    done
    echo ""
  fi

  # Compatible
  if [[ ${#COMPATIBLE_ITEMS[@]} -gt 0 ]]; then
    echo -e "${GREEN}COMPATIBLE:${NC}"
    for item in "${COMPATIBLE_ITEMS[@]}"; do
      echo -e "  ${GREEN}✓${NC} $item"
    done
    echo ""
  fi

  # Summary
  echo -e "${BLUE}=== Summary ===${NC}"
  echo ""
  echo -e "  Critical: ${RED}$CRITICAL${NC}"
  echo -e "  Warnings: ${YELLOW}$WARNING${NC}"
  echo -e "  Info:     ${CYAN}$INFO${NC}"
  echo -e "  OK:       ${GREEN}$COMPATIBLE${NC}"
  echo ""

  # Migration complexity
  TOTAL_ISSUES=$((CRITICAL + WARNING))
  if [[ $CRITICAL -gt 5 ]]; then
    echo -e "${RED}Migration Complexity: HIGH${NC}"
    echo "Consider incremental migration or significant refactoring."
  elif [[ $TOTAL_ISSUES -gt 10 ]]; then
    echo -e "${YELLOW}Migration Complexity: MEDIUM${NC}"
    echo "Some refactoring needed, but achievable."
  else
    echo -e "${GREEN}Migration Complexity: LOW${NC}"
    echo "Should be straightforward with adapter patterns."
  fi
  echo ""

  # Recommendations
  echo -e "${BLUE}=== Recommendations ===${NC}"
  echo ""

  case $PLATFORM in
    lambda)
      echo "1. Use Lambda adapter pattern for minimal code changes"
      echo "2. Replace AWS SDK calls with Cloudflare bindings"
      echo "3. Migrate DynamoDB to D1"
      echo "4. Migrate S3 to R2"
      ;;
    vercel)
      echo "1. Use OpenNext adapter for full Next.js support"
      echo "2. Replace @vercel/* packages with Cloudflare equivalents"
      echo "3. Migrate Vercel KV to Cloudflare KV"
      echo "4. Migrate Vercel Postgres to D1"
      ;;
    express)
      echo "1. Consider Hono as Express-like alternative"
      echo "2. Use express adapter for gradual migration"
      echo "3. Convert middleware to Hono format"
      echo "4. Migrate database to D1/KV"
      ;;
    nextjs)
      echo "1. Use OpenNext adapter"
      echo "2. Configure wrangler.jsonc for Pages/Workers"
      echo "3. Add Cloudflare bindings via getCloudflareContext"
      echo "4. Enable nodejs_compat_v2 compatibility flag"
      ;;
    *)
      echo "1. Enable nodejs_compat_v2 in wrangler.jsonc"
      echo "2. Convert require() to ESM imports"
      echo "3. Replace process.env with env parameter"
      echo "4. Replace fs with KV/R2 storage"
      ;;
  esac
fi

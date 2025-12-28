#!/bin/bash
# Build Rust Worker
#
# Prerequisites:
#   rustup target add wasm32-unknown-unknown
#   cargo install wasm-pack worker-build
#
# Usage:
#   ./scripts/build-rust.sh [--release|--dev]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
MODE="release"
OPTIMIZE=true
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dev|--debug)
      MODE="debug"
      OPTIMIZE=false
      shift
      ;;
    --release)
      MODE="release"
      shift
      ;;
    --no-optimize)
      OPTIMIZE=false
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --dev, --debug    Build in debug mode"
      echo "  --release         Build in release mode (default)"
      echo "  --no-optimize     Skip wasm-opt optimization"
      echo "  --verbose, -v     Show detailed output"
      echo "  --help, -h        Show this help"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}=== Rust Worker Build ===${NC}"
echo -e "Mode: ${YELLOW}${MODE}${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v rustc &> /dev/null; then
  echo -e "${RED}Error: Rust not installed${NC}"
  echo "Install from: https://rustup.rs/"
  exit 1
fi

if ! command -v wasm-pack &> /dev/null; then
  echo -e "${YELLOW}Installing wasm-pack...${NC}"
  cargo install wasm-pack
fi

if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
  echo -e "${YELLOW}Adding wasm32-unknown-unknown target...${NC}"
  rustup target add wasm32-unknown-unknown
fi

echo -e "${GREEN}Prerequisites OK${NC}"
echo ""

# Check for Cargo.toml
if [ ! -f "Cargo.toml" ]; then
  echo -e "${RED}Error: Cargo.toml not found${NC}"
  echo "Run this script from your Rust Worker project root"
  exit 1
fi

# Build with wasm-pack
echo -e "${BLUE}Building with wasm-pack...${NC}"

if [ "$MODE" = "release" ]; then
  if $VERBOSE; then
    wasm-pack build --target bundler --release
  else
    wasm-pack build --target bundler --release 2>&1 | grep -E "(Compiling|Finished|Optimizing|warning:|error)"
  fi
else
  if $VERBOSE; then
    wasm-pack build --target bundler --dev
  else
    wasm-pack build --target bundler --dev 2>&1 | grep -E "(Compiling|Finished|warning:|error)"
  fi
fi

echo -e "${GREEN}Build complete${NC}"
echo ""

# Optimize with wasm-opt (release only)
if $OPTIMIZE && [ "$MODE" = "release" ]; then
  if command -v wasm-opt &> /dev/null; then
    echo -e "${BLUE}Optimizing WASM with wasm-opt...${NC}"

    # Find the WASM file
    WASM_FILE=$(find pkg -name "*_bg.wasm" -type f | head -1)

    if [ -n "$WASM_FILE" ]; then
      ORIGINAL_SIZE=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE")
      ORIGINAL_KB=$((ORIGINAL_SIZE / 1024))

      # Optimize for size
      wasm-opt -Oz -o "${WASM_FILE}.opt" "$WASM_FILE"
      mv "${WASM_FILE}.opt" "$WASM_FILE"

      OPTIMIZED_SIZE=$(stat -f%z "$WASM_FILE" 2>/dev/null || stat -c%s "$WASM_FILE")
      OPTIMIZED_KB=$((OPTIMIZED_SIZE / 1024))
      SAVED_KB=$((ORIGINAL_KB - OPTIMIZED_KB))
      PERCENT=$((SAVED_KB * 100 / ORIGINAL_KB))

      echo -e "${GREEN}Optimized: ${ORIGINAL_KB}KB → ${OPTIMIZED_KB}KB (-${SAVED_KB}KB, -${PERCENT}%)${NC}"
    fi
  else
    echo -e "${YELLOW}wasm-opt not found, skipping optimization${NC}"
    echo "Install with: cargo install wasm-opt"
  fi
  echo ""
fi

# Build worker-build shim
if command -v worker-build &> /dev/null; then
  echo -e "${BLUE}Building worker shim...${NC}"

  if [ "$MODE" = "release" ]; then
    worker-build --release
  else
    worker-build --dev
  fi

  echo -e "${GREEN}Worker shim built${NC}"
  echo ""
else
  echo -e "${YELLOW}worker-build not found, skipping shim generation${NC}"
  echo "Install with: cargo install worker-build"
  echo ""
fi

# Report sizes
echo -e "${BLUE}Build artifacts:${NC}"
echo ""

if [ -d "pkg" ]; then
  echo "pkg/ (wasm-pack output):"
  ls -lh pkg/*.wasm 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
  ls -lh pkg/*.js 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
fi

if [ -d "build" ]; then
  echo ""
  echo "build/ (worker-build output):"
  ls -lh build/worker/*.mjs 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
  ls -lh build/worker/*.wasm 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
fi

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test locally: npx wrangler dev"
echo "  2. Deploy: npx wrangler deploy"

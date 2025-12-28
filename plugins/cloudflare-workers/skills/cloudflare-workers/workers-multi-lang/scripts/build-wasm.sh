#!/bin/bash
# Build and Optimize WASM Module
#
# Supports: Rust (wasm-pack), AssemblyScript, C/C++ (Emscripten)
#
# Prerequisites:
#   - Rust: rustup, wasm-pack, wasm-opt
#   - AssemblyScript: @assemblyscript/loader
#   - C/C++: Emscripten SDK
#
# Usage:
#   ./scripts/build-wasm.sh [--rust|--as|--c] [--release|--dev]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Defaults
LANG=""
MODE="release"
OPTIMIZE=true
OUTPUT_DIR="build"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --rust)
      LANG="rust"
      shift
      ;;
    --as|--assemblyscript)
      LANG="assemblyscript"
      shift
      ;;
    --c|--cpp|--emscripten)
      LANG="c"
      shift
      ;;
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
    --output|-o)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo ""
      echo "Language (auto-detected if not specified):"
      echo "  --rust              Build Rust to WASM"
      echo "  --as                Build AssemblyScript to WASM"
      echo "  --c, --cpp          Build C/C++ to WASM (Emscripten)"
      echo ""
      echo "Options:"
      echo "  --dev, --debug      Build in debug mode"
      echo "  --release           Build in release mode (default)"
      echo "  --no-optimize       Skip wasm-opt optimization"
      echo "  --output, -o DIR    Output directory (default: build)"
      echo "  --verbose, -v       Show detailed output"
      echo "  --help, -h          Show this help"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Auto-detect language
if [ -z "$LANG" ]; then
  if [ -f "Cargo.toml" ]; then
    LANG="rust"
  elif [ -f "asconfig.json" ] || [ -d "assembly" ]; then
    LANG="assemblyscript"
  elif [ -f "CMakeLists.txt" ] || ls *.c *.cpp >/dev/null 2>&1; then
    LANG="c"
  else
    echo -e "${RED}Error: Could not auto-detect language${NC}"
    echo "Specify with --rust, --as, or --c"
    exit 1
  fi
fi

echo -e "${BLUE}=== WASM Build ===${NC}"
echo -e "Language: ${CYAN}${LANG}${NC}"
echo -e "Mode: ${YELLOW}${MODE}${NC}"
echo -e "Output: ${OUTPUT_DIR}/"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# ==========================================
# RUST BUILD
# ==========================================

build_rust() {
  echo -e "${BLUE}Building Rust to WASM...${NC}"

  # Check prerequisites
  if ! command -v rustc &> /dev/null; then
    echo -e "${RED}Error: Rust not installed${NC}"
    exit 1
  fi

  if ! command -v wasm-pack &> /dev/null; then
    echo -e "${YELLOW}Installing wasm-pack...${NC}"
    cargo install wasm-pack
  fi

  if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    rustup target add wasm32-unknown-unknown
  fi

  # Build
  if [ "$MODE" = "release" ]; then
    wasm-pack build --target bundler --release --out-dir "$OUTPUT_DIR/pkg"
  else
    wasm-pack build --target bundler --dev --out-dir "$OUTPUT_DIR/pkg"
  fi

  # Find and report WASM file
  WASM_FILE=$(find "$OUTPUT_DIR/pkg" -name "*_bg.wasm" -type f | head -1)
  echo -e "${GREEN}Built: $WASM_FILE${NC}"
}

# ==========================================
# ASSEMBLYSCRIPT BUILD
# ==========================================

build_assemblyscript() {
  echo -e "${BLUE}Building AssemblyScript to WASM...${NC}"

  # Check prerequisites
  if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: Node.js/npm not installed${NC}"
    exit 1
  fi

  # Check for asc
  if ! npx asc --version &> /dev/null; then
    echo -e "${YELLOW}Installing AssemblyScript...${NC}"
    npm install --save-dev assemblyscript @assemblyscript/loader
  fi

  # Find entry file
  ENTRY=""
  if [ -f "assembly/index.ts" ]; then
    ENTRY="assembly/index.ts"
  elif [ -f "src/index.ts" ]; then
    ENTRY="src/index.ts"
  else
    echo -e "${RED}Error: Could not find AssemblyScript entry file${NC}"
    exit 1
  fi

  # Build
  if [ "$MODE" = "release" ]; then
    npx asc "$ENTRY" \
      --target release \
      --optimize \
      --exportRuntime \
      -o "$OUTPUT_DIR/module.wasm" \
      -t "$OUTPUT_DIR/module.wat"
  else
    npx asc "$ENTRY" \
      --target debug \
      --debug \
      --exportRuntime \
      -o "$OUTPUT_DIR/module.wasm" \
      -t "$OUTPUT_DIR/module.wat"
  fi

  WASM_FILE="$OUTPUT_DIR/module.wasm"
  echo -e "${GREEN}Built: $WASM_FILE${NC}"
}

# ==========================================
# C/C++ BUILD (Emscripten)
# ==========================================

build_c() {
  echo -e "${BLUE}Building C/C++ to WASM...${NC}"

  # Check prerequisites
  if ! command -v emcc &> /dev/null; then
    echo -e "${RED}Error: Emscripten not installed${NC}"
    echo "Install from: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
  fi

  # Find source files
  SOURCES=""
  if [ -f "CMakeLists.txt" ]; then
    # Use CMake
    echo -e "${BLUE}Building with CMake...${NC}"
    mkdir -p build-cmake
    cd build-cmake
    emcmake cmake .. -DCMAKE_BUILD_TYPE=$([ "$MODE" = "release" ] && echo "Release" || echo "Debug")
    cmake --build .
    cp *.wasm "../$OUTPUT_DIR/" 2>/dev/null || true
    cd ..
    WASM_FILE=$(find "$OUTPUT_DIR" -name "*.wasm" | head -1)
  else
    # Direct compilation
    if ls *.c >/dev/null 2>&1; then
      SOURCES=$(ls *.c | tr '\n' ' ')
    elif ls *.cpp >/dev/null 2>&1; then
      SOURCES=$(ls *.cpp | tr '\n' ' ')
    elif ls src/*.c >/dev/null 2>&1; then
      SOURCES=$(ls src/*.c | tr '\n' ' ')
    elif ls src/*.cpp >/dev/null 2>&1; then
      SOURCES=$(ls src/*.cpp | tr '\n' ' ')
    else
      echo -e "${RED}Error: No C/C++ source files found${NC}"
      exit 1
    fi

    echo "Sources: $SOURCES"

    OPTS="-s WASM=1 -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] -s MODULARIZE=1"

    if [ "$MODE" = "release" ]; then
      OPTS="$OPTS -O3 -s STANDALONE_WASM=1"
    else
      OPTS="$OPTS -O0 -g"
    fi

    emcc $SOURCES $OPTS -o "$OUTPUT_DIR/module.js"
    WASM_FILE="$OUTPUT_DIR/module.wasm"
  fi

  echo -e "${GREEN}Built: $WASM_FILE${NC}"
}

# ==========================================
# BUILD
# ==========================================

case $LANG in
  rust)
    build_rust
    ;;
  assemblyscript)
    build_assemblyscript
    ;;
  c)
    build_c
    ;;
esac

echo ""

# ==========================================
# OPTIMIZE
# ==========================================

if $OPTIMIZE && [ "$MODE" = "release" ]; then
  if command -v wasm-opt &> /dev/null; then
    echo -e "${BLUE}Optimizing WASM...${NC}"

    # Find all WASM files
    for wasm in $(find "$OUTPUT_DIR" -name "*.wasm" -type f); do
      ORIGINAL_SIZE=$(stat -f%z "$wasm" 2>/dev/null || stat -c%s "$wasm")
      ORIGINAL_KB=$((ORIGINAL_SIZE / 1024))

      # Create backup
      cp "$wasm" "${wasm}.bak"

      # Optimize (try different levels)
      # -Oz: optimize for size
      # -O3: optimize for speed
      # -O4: optimize aggressively
      wasm-opt -Oz -o "${wasm}.opt" "$wasm" 2>/dev/null || {
        echo -e "${YELLOW}Warning: wasm-opt failed for $wasm${NC}"
        mv "${wasm}.bak" "$wasm"
        continue
      }

      mv "${wasm}.opt" "$wasm"
      rm "${wasm}.bak"

      OPTIMIZED_SIZE=$(stat -f%z "$wasm" 2>/dev/null || stat -c%s "$wasm")
      OPTIMIZED_KB=$((OPTIMIZED_SIZE / 1024))

      if [ $ORIGINAL_KB -gt 0 ]; then
        SAVED_KB=$((ORIGINAL_KB - OPTIMIZED_KB))
        PERCENT=$((SAVED_KB * 100 / ORIGINAL_KB))
        echo -e "  ${GREEN}${wasm}: ${ORIGINAL_KB}KB → ${OPTIMIZED_KB}KB (-${SAVED_KB}KB, -${PERCENT}%)${NC}"
      fi
    done
  else
    echo -e "${YELLOW}wasm-opt not found, skipping optimization${NC}"
    echo "Install with: cargo install wasm-opt"
    echo "Or: brew install binaryen"
  fi
  echo ""
fi

# ==========================================
# STRIP DEBUG INFO (release only)
# ==========================================

if [ "$MODE" = "release" ] && command -v wasm-strip &> /dev/null; then
  echo -e "${BLUE}Stripping debug info...${NC}"

  for wasm in $(find "$OUTPUT_DIR" -name "*.wasm" -type f); do
    BEFORE=$(stat -f%z "$wasm" 2>/dev/null || stat -c%s "$wasm")
    wasm-strip "$wasm" 2>/dev/null || true
    AFTER=$(stat -f%z "$wasm" 2>/dev/null || stat -c%s "$wasm")
    SAVED=$(((BEFORE - AFTER) / 1024))

    if [ $SAVED -gt 0 ]; then
      echo -e "  ${GREEN}${wasm}: stripped ${SAVED}KB${NC}"
    fi
  done
  echo ""
fi

# ==========================================
# REPORT
# ==========================================

echo -e "${BLUE}Build artifacts:${NC}"
echo ""

find "$OUTPUT_DIR" -type f \( -name "*.wasm" -o -name "*.js" -o -name "*.mjs" \) | while read file; do
  SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
  SIZE_KB=$((SIZE / 1024))

  if [[ "$file" == *.wasm ]]; then
    echo -e "  ${CYAN}$file${NC} (${SIZE_KB}KB)"
  else
    echo -e "  $file (${SIZE_KB}KB)"
  fi
done

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""

# Usage instructions
echo "Usage in Worker:"
echo ""
echo "  import wasmModule from './$OUTPUT_DIR/module.wasm';"
echo "  import init, { myFunction } from './$OUTPUT_DIR/module.js';"
echo ""
echo "  // Initialize WASM"
echo "  await init(wasmModule);"
echo ""
echo "  // Use functions"
echo "  const result = myFunction(input);"
echo ""
echo "Next steps:"
echo "  1. Import WASM in your Worker"
echo "  2. Test locally: npx wrangler dev"
echo "  3. Deploy: npx wrangler deploy"

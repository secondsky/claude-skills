#!/bin/bash
# FastMCP Version Checker
# Verifies that FastMCP and dependencies are up to date

set -e

echo "======================================"
echo "FastMCP Version Checker"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗${NC} Python 3 is not installed"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python $(python3 --version)"
echo ""

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
REQUIRED_VERSION="3.10"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}✗${NC} Python $PYTHON_VERSION is too old. FastMCP requires Python $REQUIRED_VERSION or later"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python version $PYTHON_VERSION meets requirements"
echo ""

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}✗${NC} pip3 is not installed"
    exit 1
fi

echo "Checking package versions..."
echo ""

# Function to check package version
check_package() {
    local package=$1
    local min_version=$2

    if pip3 show "$package" &> /dev/null; then
        local installed_version=$(pip3 show "$package" | grep "Version:" | awk '{print $2}')
        echo -e "${GREEN}✓${NC} $package: $installed_version (required: >=$min_version)"

        # Note: This is a simple check. For production, use more robust version comparison
        if [ "$installed_version" != "$min_version" ]; then
            if [ "$(printf '%s\n' "$min_version" "$installed_version" | sort -V | head -n1)" != "$min_version" ]; then
                echo -e "  ${YELLOW}⚠${NC}  Installed version is older than minimum required"
            fi
        fi
    else
        echo -e "${RED}✗${NC} $package: Not installed (required: >=$min_version)"
    fi
}

# Check core packages
check_package "fastmcp" "2.12.0"
check_package "httpx" "0.27.0"
check_package "python-dotenv" "1.0.0"
check_package "pydantic" "2.0.0"

echo ""
echo "Checking optional packages..."
echo ""

# Check optional packages
if pip3 show "psutil" &> /dev/null; then
    check_package "psutil" "5.9.0"
else
    echo -e "${YELLOW}○${NC} psutil: Not installed (optional, for health checks)"
fi

if pip3 show "pytest" &> /dev/null; then
    check_package "pytest" "8.0.0"
else
    echo -e "${YELLOW}○${NC} pytest: Not installed (optional, for testing)"
fi

echo ""
echo "======================================"
echo "Version check complete!"
echo "======================================"
echo ""

# Suggestions
echo "Suggestions:"
echo "  - To update FastMCP: pip install --upgrade fastmcp"
echo "  - To update all dependencies: pip install --upgrade -r requirements.txt"
echo "  - To see outdated packages: pip list --outdated"
echo ""

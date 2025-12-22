#!/bin/bash
# FastMCP Cloud Deployment Checker
# Validates server is ready for FastMCP Cloud deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================"
echo "FastMCP Cloud Deployment Checker"
echo "======================================"
echo ""

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <server.py>"
    echo ""
    echo "Example:"
    echo "  $0 server.py"
    exit 1
fi

SERVER_PATH=$1
ERRORS=0
WARNINGS=0

# Function to check requirement
check_required() {
    local description=$1
    local command=$2

    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check warning
check_warning() {
    local description=$1
    local command=$2

    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $description"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

# 1. Check server file exists
echo "Checking server file..."
check_required "Server file exists: $SERVER_PATH" "test -f '$SERVER_PATH'"
echo ""

# 2. Check Python syntax
echo "Checking Python syntax..."
check_required "Python syntax is valid" "python3 -m py_compile '$SERVER_PATH'"
echo ""

# 3. Check for module-level server object
echo "Checking module-level server object..."
if grep -q "^mcp = FastMCP\|^server = FastMCP\|^app = FastMCP" "$SERVER_PATH"; then
    echo -e "${GREEN}✓${NC} Found module-level server object (mcp/server/app)"
else
    echo -e "${RED}✗${NC} No module-level server object found"
    echo "   Expected: mcp = FastMCP(...) at module level"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Check requirements.txt
echo "Checking requirements.txt..."
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} requirements.txt exists"

    # Check for non-PyPI dependencies
    if grep -q "^git+\|^-e \|\.whl$\|\.tar.gz$" requirements.txt; then
        echo -e "${RED}✗${NC} requirements.txt contains non-PyPI dependencies"
        echo "   FastMCP Cloud requires PyPI packages only"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓${NC} All dependencies are PyPI packages"
    fi

    # Check for fastmcp
    if grep -q "^fastmcp" requirements.txt; then
        echo -e "${GREEN}✓${NC} FastMCP is in requirements.txt"
    else
        echo -e "${YELLOW}⚠${NC} FastMCP not found in requirements.txt"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} requirements.txt not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Check for hardcoded secrets
echo "Checking for hardcoded secrets..."
if grep -i "api_key\s*=\s*[\"']" "$SERVER_PATH" | grep -v "os.getenv\|os.environ" > /dev/null; then
    echo -e "${RED}✗${NC} Found hardcoded API keys (possible security issue)"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} No hardcoded API keys found"
fi

if grep -i "password\s*=\s*[\"']\|secret\s*=\s*[\"']" "$SERVER_PATH" | grep -v "os.getenv\|os.environ" > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Found possible hardcoded passwords/secrets"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Check .gitignore
echo "Checking .gitignore..."
if [ -f ".gitignore" ]; then
    echo -e "${GREEN}✓${NC} .gitignore exists"

    if grep -q "\.env$" .gitignore; then
        echo -e "${GREEN}✓${NC} .env is in .gitignore"
    else
        echo -e "${YELLOW}⚠${NC} .env not in .gitignore"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} .gitignore not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 7. Check for circular imports
echo "Checking for potential circular imports..."
if grep -r "from __init__ import\|from . import.*get_" . --include="*.py" 2>/dev/null | grep -v ".git" > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Possible circular import pattern detected (factory functions)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} No obvious circular import patterns"
fi
echo ""

# 8. Check git repository
echo "Checking git repository..."
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"

    # Check if there are uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${GREEN}✓${NC} No uncommitted changes"
    else
        echo -e "${YELLOW}⚠${NC} There are uncommitted changes"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        echo -e "${GREEN}✓${NC} Git remote (origin) configured"
        REMOTE_URL=$(git remote get-url origin)
        echo "   Remote: $REMOTE_URL"
    else
        echo -e "${YELLOW}⚠${NC} No git remote configured"
        echo "   Run: gh repo create <name> --public"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Not a git repository"
    echo "   Run: git init"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 9. Test server can run
echo "Testing server execution..."
if timeout 5 python3 "$SERVER_PATH" --help &> /dev/null || timeout 5 fastmcp inspect "$SERVER_PATH" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Server can be loaded"
else
    echo -e "${YELLOW}⚠${NC} Could not verify server loads correctly"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "======================================"
echo "Deployment Check Summary"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Commit changes: git add . && git commit -m 'Ready for deployment'"
    echo "  2. Push to GitHub: git push -u origin main"
    echo "  3. Visit https://fastmcp.cloud"
    echo "  4. Connect your repository"
    echo "  5. Add environment variables"
    echo "  6. Deploy!"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Ready with warnings (${WARNINGS} warnings)${NC}"
    echo ""
    echo "Review warnings above before deploying."
    echo ""
    echo "To deploy anyway:"
    echo "  1. git add . && git commit -m 'Ready for deployment'"
    echo "  2. git push -u origin main"
    echo "  3. Visit https://fastmcp.cloud"
    exit 0
else
    echo -e "${RED}✗ Not ready for deployment (${ERRORS} errors, ${WARNINGS} warnings)${NC}"
    echo ""
    echo "Fix the errors above before deploying."
    echo ""
    echo "Common fixes:"
    echo "  - Export server at module level: mcp = FastMCP('name')"
    echo "  - Use only PyPI packages in requirements.txt"
    echo "  - Use os.getenv() for secrets, not hardcoded values"
    echo "  - Initialize git: git init"
    echo "  - Create .gitignore with .env"
    exit 1
fi

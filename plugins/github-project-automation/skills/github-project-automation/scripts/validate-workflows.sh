#!/bin/bash
# Workflow Validation Script
# Validates GitHub Actions workflows for syntax errors
#
# Usage: ./scripts/validate-workflows.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}===================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header "GitHub Workflows Validation"

# Check if .github/workflows exists
if [ ! -d ".github/workflows" ]; then
    print_error "No .github/workflows directory found"
    exit 1
fi

# Count workflow files
WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)

if [ "$WORKFLOW_COUNT" -eq 0 ]; then
    print_warning "No workflow files found in .github/workflows"
    exit 0
fi

echo "Found $WORKFLOW_COUNT workflow file(s)"
echo ""

# Check if yamllint is installed
HAS_YAMLLINT=false
if command -v yamllint &> /dev/null; then
    HAS_YAMLLINT=true
fi

# Check if yq is installed (alternative YAML parser)
HAS_YQ=false
if command -v yq &> /dev/null; then
    HAS_YQ=true
fi

ERRORS=0

# Validate each workflow
for workflow in .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null; do
    [ -f "$workflow" ] || continue

    filename=$(basename "$workflow")
    echo "Validating: $filename"

    # Basic checks
    ISSUES=()

    # Check for @latest usage (Error #3)
    if grep -q "@latest" "$workflow"; then
        ISSUES+=("Uses @latest for action versions (should use SHA)")
    fi

    # Check for ubuntu-latest (Error #4)
    if grep -q "runs-on:.*ubuntu-latest" "$workflow"; then
        ISSUES+=("Uses ubuntu-latest (should use ubuntu-24.04)")
    fi

    # Check for incorrect secrets syntax (Error #6)
    if grep -q '\$secrets\.' "$workflow"; then
        ISSUES+=("Incorrect secrets syntax (missing {{ }})")
    fi

    # Check for required fields
    if ! grep -q "^name:" "$workflow"; then
        ISSUES+=("Missing 'name:' field")
    fi

    if ! grep -q "^on:" "$workflow"; then
        ISSUES+=("Missing 'on:' trigger")
    fi

    # YAML syntax validation
    if [ "$HAS_YAMLLINT" = true ]; then
        if ! yamllint -d relaxed "$workflow" >/dev/null 2>&1; then
            ISSUES+=("YAML syntax errors (run yamllint for details)")
        fi
    elif [ "$HAS_YQ" = true ]; then
        if ! yq eval '.' "$workflow" >/dev/null 2>&1; then
            ISSUES+=("YAML syntax errors")
        fi
    else
        # Basic Python YAML check
        if command -v python3 &> /dev/null; then
            if ! python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
                ISSUES+=("YAML syntax errors")
            fi
        fi
    fi

    # Report results
    if [ ${#ISSUES[@]} -eq 0 ]; then
        print_success "$filename"
    else
        print_error "$filename - ${#ISSUES[@]} issue(s) found:"
        for issue in "${ISSUES[@]}"; do
            echo "    - $issue"
        done
        ERRORS=$((ERRORS + 1))
    fi

    echo ""
done

# Validate dependabot.yml if it exists
if [ -f ".github/dependabot.yml" ]; then
    echo "Validating: dependabot.yml"

    ISSUES=()

    # Check for version field
    if ! grep -q "^version:" ".github/dependabot.yml"; then
        ISSUES+=("Missing 'version:' field")
    fi

    # Check for updates field
    if ! grep -q "updates:" ".github/dependabot.yml"; then
        ISSUES+=("Missing 'updates:' section")
    fi

    # YAML syntax validation
    if [ "$HAS_YAMLLINT" = true ]; then
        if ! yamllint -d relaxed ".github/dependabot.yml" >/dev/null 2>&1; then
            ISSUES+=("YAML syntax errors")
        fi
    elif [ "$HAS_YQ" = true ]; then
        if ! yq eval '.' ".github/dependabot.yml" >/dev/null 2>&1; then
            ISSUES+=("YAML syntax errors")
        fi
    fi

    if [ ${#ISSUES[@]} -eq 0 ]; then
        print_success "dependabot.yml"
    else
        print_error "dependabot.yml - ${#ISSUES[@]} issue(s) found:"
        for issue in "${ISSUES[@]}"; do
            echo "    - $issue"
        done
        ERRORS=$((ERRORS + 1))
    fi

    echo ""
fi

# Summary
print_header "Validation Summary"

if [ $ERRORS -eq 0 ]; then
    print_success "All workflows validated successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Commit your changes: git add .github/ && git commit -m \"Add workflows\""
    echo "  2. Push to GitHub: git push"
    echo "  3. Check Actions tab for workflow runs"
    exit 0
else
    print_error "$ERRORS file(s) with issues"
    echo ""
    echo "Fix the issues above before committing."
    echo ""
    echo "Recommended tools:"
    if [ "$HAS_YAMLLINT" = false ]; then
        echo "  - Install yamllint: pip install yamllint"
    fi
    echo "  - GitHub CLI: gh workflow list"
    echo "  - Online validator: https://www.yamllint.com/"
    exit 1
fi

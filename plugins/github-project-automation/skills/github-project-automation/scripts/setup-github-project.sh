#!/bin/bash
# GitHub Project Setup Wizard
# Interactive script to set up GitHub automation for a project
#
# Usage: ./scripts/setup-github-project.sh [framework]
# Example: ./scripts/setup-github-project.sh react

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if running in a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Run 'git init' first."
    exit 1
fi

print_header "GitHub Project Automation Setup"

# Determine framework
FRAMEWORK=${1:-""}

if [ -z "$FRAMEWORK" ]; then
    echo "Which framework are you using?"
    echo "  1) React/Vite"
    echo "  2) Node.js library"
    echo "  3) Python"
    echo "  4) Cloudflare Workers"
    echo "  5) Generic/Other"
    read -p "Choose (1-5): " choice

    case $choice in
        1) FRAMEWORK="react" ;;
        2) FRAMEWORK="node" ;;
        3) FRAMEWORK="python" ;;
        4) FRAMEWORK="cloudflare" ;;
        5) FRAMEWORK="basic" ;;
        *) print_error "Invalid choice"; exit 1 ;;
    esac
fi

print_success "Framework: $FRAMEWORK"

# Get skill templates directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATES_DIR="$SKILL_DIR/templates"

if [ ! -d "$TEMPLATES_DIR" ]; then
    print_error "Templates directory not found: $TEMPLATES_DIR"
    exit 1
fi

# Create .github directory structure
print_header "Creating Directory Structure"

mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE

print_success "Created .github/workflows/"
print_success "Created .github/ISSUE_TEMPLATE/"

# Copy workflow template based on framework
print_header "Setting Up CI/CD Workflow"

case $FRAMEWORK in
    react)
        cp "$TEMPLATES_DIR/workflows/ci-react.yml" .github/workflows/ci.yml
        print_success "Copied React CI workflow"
        ;;
    node)
        cp "$TEMPLATES_DIR/workflows/ci-node.yml" .github/workflows/ci.yml
        print_success "Copied Node.js matrix CI workflow"
        ;;
    python)
        cp "$TEMPLATES_DIR/workflows/ci-python.yml" .github/workflows/ci.yml
        print_success "Copied Python matrix CI workflow"
        ;;
    cloudflare)
        cp "$TEMPLATES_DIR/workflows/ci-cloudflare-workers.yml" .github/workflows/deploy.yml
        print_success "Copied Cloudflare Workers deployment workflow"
        ;;
    basic)
        cp "$TEMPLATES_DIR/workflows/ci-basic.yml" .github/workflows/ci.yml
        print_success "Copied basic CI workflow"
        ;;
esac

# Ask about security scanning
echo ""
read -p "Enable security scanning (CodeQL + Dependabot)? [Y/n] " enable_security
enable_security=${enable_security:-Y}

if [[ $enable_security =~ ^[Yy]$ ]]; then
    cp "$TEMPLATES_DIR/workflows/security-codeql.yml" .github/workflows/codeql.yml
    cp "$TEMPLATES_DIR/security/dependabot.yml" .github/dependabot.yml
    print_success "Enabled CodeQL scanning"
    print_success "Enabled Dependabot updates"
fi

# Ask about issue templates
echo ""
read -p "Add issue templates? [Y/n] " enable_issues
enable_issues=${enable_issues:-Y}

if [[ $enable_issues =~ ^[Yy]$ ]]; then
    cp "$TEMPLATES_DIR/issue-templates/bug_report.yml" .github/ISSUE_TEMPLATE/
    cp "$TEMPLATES_DIR/issue-templates/feature_request.yml" .github/ISSUE_TEMPLATE/
    cp "$TEMPLATES_DIR/issue-templates/documentation.yml" .github/ISSUE_TEMPLATE/
    cp "$TEMPLATES_DIR/issue-templates/config.yml" .github/ISSUE_TEMPLATE/
    print_success "Added issue templates"
fi

# Ask about PR template
echo ""
read -p "Add pull request template? [Y/n] " enable_pr
enable_pr=${enable_pr:-Y}

if [[ $enable_pr =~ ^[Yy]$ ]]; then
    cp "$TEMPLATES_DIR/pr-templates/PULL_REQUEST_TEMPLATE.md" .github/
    print_success "Added PR template"
fi

# Ask about CODEOWNERS
echo ""
read -p "Add CODEOWNERS file? [Y/n] " enable_codeowners
enable_codeowners=${enable_codeowners:-Y}

if [[ $enable_codeowners =~ ^[Yy]$ ]]; then
    cp "$TEMPLATES_DIR/misc/CODEOWNERS" .github/
    print_success "Added CODEOWNERS file"
fi

# Ask about SECURITY.md
echo ""
read -p "Add SECURITY.md policy? [Y/n] " enable_security_md
enable_security_md=${enable_security_md:-Y}

if [[ $enable_security_md =~ ^[Yy]$ ]]; then
    cp "$TEMPLATES_DIR/security/SECURITY.md" .
    print_success "Added SECURITY.md"
fi

# Customization reminder
print_header "Customization Required"

print_warning "Don't forget to customize the following:"
echo "  1. Replace 'secondsky' with your GitHub username in:"
echo "     - .github/ISSUE_TEMPLATE/*.yml (assignees)"
echo "     - .github/dependabot.yml (reviewers)"
echo "     - .github/CODEOWNERS"
echo ""
echo "  2. Update CodeQL languages in .github/workflows/codeql.yml"
echo "     Current: javascript-typescript"
echo "     Options: c-cpp, csharp, go, java-kotlin, python, ruby, swift"
echo ""
echo "  3. Configure deployment secrets (if using deployment workflows):"
echo "     gh secret set CLOUDFLARE_API_TOKEN"
echo "     gh secret set NPM_TOKEN"
echo ""
echo "  4. Update URLs in templates:"
echo "     - SECURITY.md (email, website)"
echo "     - issue-templates/config.yml (links)"

# Git status
print_header "Next Steps"

echo "1. Review and customize the files"
echo "2. Test locally:"
echo "   - Validate YAML: yamllint .github/workflows/*.yml"
echo "   - Check templates look correct"
echo ""
echo "3. Commit and push:"
echo "   git add .github/ SECURITY.md"
echo "   git commit -m \"Add GitHub automation\""
echo "   git push"
echo ""
echo "4. Verify workflows run successfully in GitHub Actions tab"

print_success "Setup complete!"

# Show what was created
echo ""
echo "Files created:"
find .github -type f | sed 's/^/  /'
[ -f "SECURITY.md" ] && echo "  SECURITY.md"

exit 0

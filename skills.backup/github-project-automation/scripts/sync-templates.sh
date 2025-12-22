#!/bin/bash
# Template Sync Script
# Updates existing GitHub automation files with latest templates
#
# Usage: ./scripts/sync-templates.sh [--force]

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

FORCE=false
if [ "$1" = "--force" ]; then
    FORCE=true
fi

# Get skill templates directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TEMPLATES_DIR="$SKILL_DIR/templates"

if [ ! -d "$TEMPLATES_DIR" ]; then
    print_error "Templates directory not found: $TEMPLATES_DIR"
    exit 1
fi

# Check if .github exists
if [ ! -d ".github" ]; then
    print_error "No .github directory found. Run setup-github-project.sh first."
    exit 1
fi

print_header "GitHub Templates Sync"

UPDATED=0
SKIPPED=0
ERRORS=0

# Function to sync a file
sync_file() {
    local template_file=$1
    local dest_file=$2
    local file_type=$3

    if [ ! -f "$template_file" ]; then
        print_warning "Template not found: $template_file"
        return
    fi

    if [ -f "$dest_file" ]; then
        # Check if files are different
        if ! diff -q "$template_file" "$dest_file" >/dev/null 2>&1; then
            if [ "$FORCE" = true ]; then
                cp "$template_file" "$dest_file"
                print_success "Updated: $dest_file"
                UPDATED=$((UPDATED + 1))
            else
                print_warning "Different: $dest_file (use --force to update)"
                SKIPPED=$((SKIPPED + 1))
            fi
        else
            echo "  Up to date: $dest_file"
        fi
    else
        # File doesn't exist, copy it
        mkdir -p "$(dirname "$dest_file")"
        cp "$template_file" "$dest_file"
        print_success "Created: $dest_file"
        UPDATED=$((UPDATED + 1))
    fi
}

# Sync workflows
print_header "Syncing Workflows"

for workflow in "$TEMPLATES_DIR/workflows"/*.yml; do
    filename=$(basename "$workflow")
    sync_file "$workflow" ".github/workflows/$filename" "workflow"
done

# Sync Dependabot
print_header "Syncing Dependabot"

sync_file "$TEMPLATES_DIR/security/dependabot.yml" ".github/dependabot.yml" "config"

# Sync issue templates
print_header "Syncing Issue Templates"

for template in "$TEMPLATES_DIR/issue-templates"/*.yml; do
    filename=$(basename "$template")
    sync_file "$template" ".github/ISSUE_TEMPLATE/$filename" "issue template"
done

# Sync PR templates
print_header "Syncing PR Templates"

for template in "$TEMPLATES_DIR/pr-templates"/*.md; do
    filename=$(basename "$template")
    if [ "$filename" = "PULL_REQUEST_TEMPLATE.md" ]; then
        sync_file "$template" ".github/$filename" "PR template"
    else
        sync_file "$template" ".github/pr-templates/$filename" "PR template"
    fi
done

# Sync CODEOWNERS
print_header "Syncing CODEOWNERS"

if [ -f ".github/CODEOWNERS" ]; then
    print_warning "CODEOWNERS exists (skipping, likely customized)"
    SKIPPED=$((SKIPPED + 1))
else
    sync_file "$TEMPLATES_DIR/misc/CODEOWNERS" ".github/CODEOWNERS" "CODEOWNERS"
fi

# Sync SECURITY.md
print_header "Syncing SECURITY.md"

if [ -f "SECURITY.md" ]; then
    if [ "$FORCE" = true ]; then
        sync_file "$TEMPLATES_DIR/security/SECURITY.md" "SECURITY.md" "security policy"
    else
        print_warning "SECURITY.md exists (skipping, use --force to update)"
        SKIPPED=$((SKIPPED + 1))
    fi
else
    sync_file "$TEMPLATES_DIR/security/SECURITY.md" "SECURITY.md" "security policy"
fi

# Summary
print_header "Sync Summary"

echo "Results:"
echo "  Updated: $UPDATED file(s)"
echo "  Skipped: $SKIPPED file(s)"
if [ $ERRORS -gt 0 ]; then
    echo "  Errors: $ERRORS"
fi

echo ""

if [ $SKIPPED -gt 0 ] && [ "$FORCE" = false ]; then
    print_warning "Some files were skipped because they differ from templates"
    echo "Review the differences and:"
    echo "  - Run with --force to overwrite"
    echo "  - Or manually merge changes"
    echo ""
    echo "To see differences:"
    echo "  diff .github/workflows/ci.yml $TEMPLATES_DIR/workflows/ci-*.yml"
fi

if [ $UPDATED -gt 0 ]; then
    print_success "Templates updated!"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff"
    echo "  2. Customize usernames/settings"
    echo "  3. Test workflows: ./scripts/validate-workflows.sh"
    echo "  4. Commit: git add .github/ && git commit -m \"Update GitHub automation\""
else
    print_success "All templates are up to date!"
fi

exit 0

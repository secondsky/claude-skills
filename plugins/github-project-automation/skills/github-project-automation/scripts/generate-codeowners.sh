#!/bin/bash
# CODEOWNERS Generator
# Auto-generates CODEOWNERS file based on git history
#
# Usage: ./scripts/generate-codeowners.sh

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

# Check if in git repo
if [ ! -d ".git" ]; then
    print_error "Not a git repository"
    exit 1
fi

print_header "CODEOWNERS Generator"

# Get GitHub username
if command -v gh &> /dev/null; then
    DEFAULT_OWNER=$(gh api user -q .login 2>/dev/null || echo "")
else
    DEFAULT_OWNER=$(git config user.name | tr '[:upper:]' '[:lower:]' | tr ' ' '-' 2>/dev/null || echo "")
fi

read -p "Default owner [@$DEFAULT_OWNER]: " OWNER
OWNER=${OWNER:-$DEFAULT_OWNER}

if [ -z "$OWNER" ]; then
    print_error "No owner specified"
    exit 1
fi

# Analyze git history to find frequent contributors per path
print_header "Analyzing Git History"

echo "Finding top contributors for each directory..."
echo ""

# Create temporary file
TEMP_FILE=$(mktemp)
CODEOWNERS_FILE=".github/CODEOWNERS"

# Write header
cat > "$TEMP_FILE" << 'EOF'
# Code Owners
#
# Auto-generated based on git history
# Review and customize as needed
#
# Documentation: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

EOF

# Default owner for everything
echo "# Default owner" >> "$TEMP_FILE"
echo "* @$OWNER" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Find directories and their top contributors
echo "# Directory-specific owners (based on commit history)" >> "$TEMP_FILE"

find . -type d -not -path '*/\.*' -not -path './node_modules/*' -not -path './dist/*' -not -path './build/*' | sort | while read -r dir; do
    # Skip root directory
    if [ "$dir" = "." ]; then
        continue
    fi

    # Get commits for this directory
    COMMITS=$(git log --format="%ae" -- "$dir" 2>/dev/null | wc -l)

    if [ "$COMMITS" -gt 5 ]; then
        # Get top contributor
        TOP_CONTRIBUTOR=$(git log --format="%ae" -- "$dir" 2>/dev/null | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')

        if [ -n "$TOP_CONTRIBUTOR" ]; then
            # Extract GitHub username from email (best effort)
            GITHUB_USER=$(echo "$TOP_CONTRIBUTOR" | cut -d'@' -f1 | tr '[:upper:]' '[:lower:]' | tr '.' '-')

            # Only add if different from default owner
            if [ "$GITHUB_USER" != "$OWNER" ]; then
                echo "$dir/ @$GITHUB_USER @$OWNER" >> "$TEMP_FILE"
                echo "  $dir/ -> @$GITHUB_USER"
            fi
        fi
    fi
done

echo "" >> "$TEMP_FILE"

# Add common patterns
cat >> "$TEMP_FILE" << EOF
# Documentation
*.md @$OWNER
/docs/ @$OWNER

# Configuration files
*.yml @$OWNER
*.yaml @$OWNER
*.json @$OWNER
*.toml @$OWNER

# GitHub workflows
/.github/ @$OWNER

# Dependencies (requires careful review)
package.json @$OWNER
package-lock.json @$OWNER
requirements.txt @$OWNER
EOF

# Create .github directory if it doesn't exist
mkdir -p .github

# Move temp file to CODEOWNERS
mv "$TEMP_FILE" "$CODEOWNERS_FILE"

print_success "Generated $CODEOWNERS_FILE"

# Show preview
print_header "Preview"

head -30 "$CODEOWNERS_FILE"

if [ $(wc -l < "$CODEOWNERS_FILE") -gt 30 ]; then
    echo "..."
    echo "(Showing first 30 lines. See $CODEOWNERS_FILE for full file)"
fi

# Next steps
print_header "Next Steps"

echo "1. Review and customize $CODEOWNERS_FILE"
echo "   - Verify GitHub usernames are correct"
echo "   - Add team names if applicable (e.g., @org/team-name)"
echo "   - Adjust ownership as needed"
echo ""
echo "2. Commit the file:"
echo "   git add $CODEOWNERS_FILE"
echo "   git commit -m \"Add CODEOWNERS file\""
echo "   git push"
echo ""
echo "3. Enable branch protection:"
echo "   - Go to Settings > Branches"
echo "   - Require review from code owners"

print_success "Done!"

exit 0

#!/usr/bin/env bash
#
# PR Validation Script
# Run this before submitting a pull request to catch common issues
#

set -e

echo "🔍 PR Validation Script"
echo "======================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check 1: Are we on a feature branch?
echo "1. Checking branch name..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${RED}❌ You are on $CURRENT_BRANCH branch! Create a feature branch.${NC}"
    echo "   Fix: git checkout -b feature/your-feature-name"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ On feature branch: $CURRENT_BRANCH${NC}"
fi
echo ""

# Check 2: Personal development artifacts
echo "2. Checking for personal artifacts..."
ARTIFACTS=(
    "SESSION.md"
    "NOTES.md"
    "TODO.md"
    "SCRATCH.md"
    "DEBUGGING.md"
    "planning/"
    "research-logs/"
)

FOUND_ARTIFACTS=()
for artifact in "${ARTIFACTS[@]}"; do
    if git ls-files | grep -q "$artifact"; then
        FOUND_ARTIFACTS+=("$artifact")
    fi
done

if [ ${#FOUND_ARTIFACTS[@]} -gt 0 ]; then
    echo -e "${RED}❌ Found personal artifacts:${NC}"
    for artifact in "${FOUND_ARTIFACTS[@]}"; do
        echo "   - $artifact"
    done
    echo "   Fix: git rm ${FOUND_ARTIFACTS[@]}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No personal artifacts found${NC}"
fi
echo ""

# Check 3: Debug screenshots
echo "3. Checking for debug screenshots..."
if git ls-files | grep -E "screenshot.*\.(png|jpg|jpeg|gif)" | grep -qE "(debug|test|temp|local)"; then
    echo -e "${RED}❌ Found debug screenshots${NC}"
    git ls-files | grep -E "screenshot.*\.(png|jpg|jpeg|gif)" | grep -E "(debug|test|temp|local)" | while read -r file; do
        echo "   - $file"
    done
    echo "   Fix: git rm [screenshot files]"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No debug screenshots found${NC}"
fi
echo ""

# Check 4: Temporary test files
echo "4. Checking for temporary test files..."
if git ls-files | grep -qE "(test-manual|test-debug|quick-test|scratch-test)\.(js|ts|py|sh)"; then
    echo -e "${RED}❌ Found temporary test files${NC}"
    git ls-files | grep -E "(test-manual|test-debug|quick-test|scratch-test)\.(js|ts|py|sh)" | while read -r file; do
        echo "   - $file"
    done
    echo "   Fix: git rm [test files]"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No temporary test files found${NC}"
fi
echo ""

# Check 5: Environment files
echo "5. Checking for environment files..."
if git ls-files | grep -qE "\.env\.(local|development|test|production)$"; then
    echo -e "${RED}❌ Found environment files (should be in .gitignore)${NC}"
    git ls-files | grep -E "\.env\.(local|development|test|production)$" | while read -r file; do
        echo "   - $file"
    done
    echo "   Fix: git rm --cached [env files] && add to .gitignore"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No environment files committed${NC}"
fi
echo ""

# Check 6: Large files
echo "6. Checking for large files (>1MB)..."
LARGE_FILES=$(git ls-files | xargs -I{} sh -c 'if [ -f "{}" ]; then size=$(wc -c < "{}"); if [ $size -gt 1048576 ]; then echo "{} ($(($size / 1024))KB)"; fi; fi')
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Found large files:${NC}"
    echo "$LARGE_FILES" | while read -r file; do
        echo "   - $file"
    done
    echo "   Consider: Use Git LFS or external storage for large assets"
else
    echo -e "${GREEN}✅ No large files found${NC}"
fi
echo ""

# Check 7: Untracked files
echo "7. Checking for untracked files..."
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
    echo -e "${YELLOW}⚠️  Found untracked files:${NC}"
    echo "$UNTRACKED" | while read -r file; do
        echo "   - $file"
    done
    echo "   Action: Add to commit or .gitignore"
else
    echo -e "${GREEN}✅ No untracked files${NC}"
fi
echo ""

# Check 8: Changes summary
echo "8. Changes summary..."
CHANGED_FILES=$(git diff --name-only main 2>/dev/null || git diff --name-only master 2>/dev/null || echo "")
if [ -n "$CHANGED_FILES" ]; then
    NUM_FILES=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
    ADDITIONS=$(git diff --numstat main 2>/dev/null | awk '{sum+=$1} END {print sum}' || git diff --numstat master 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
    DELETIONS=$(git diff --numstat main 2>/dev/null | awk '{sum+=$2} END {print sum}' || git diff --numstat master 2>/dev/null | awk '{sum+=$2} END {print sum}' || echo "0")

    echo "   Files changed: $NUM_FILES"
    echo "   Additions: $ADDITIONS"
    echo "   Deletions: $DELETIONS"
    echo "   Total changes: $((ADDITIONS + DELETIONS))"

    if [ $((ADDITIONS + DELETIONS)) -gt 500 ]; then
        echo -e "   ${YELLOW}⚠️  PR is large (>500 lines). Consider splitting.${NC}"
    else
        echo -e "   ${GREEN}✅ PR size reasonable${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No changes detected${NC}"
fi
echo ""

# Check 9: Commit messages
echo "9. Checking commit messages..."
COMMITS=$(git log --oneline main..HEAD 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMITS" -eq 0 ]; then
    COMMITS=$(git log --oneline master..HEAD 2>/dev/null | wc -l | tr -d ' ')
fi

if [ "$COMMITS" -gt 0 ]; then
    echo "   Number of commits: $COMMITS"

    # Check for WIP commits
    if git log --oneline main..HEAD 2>/dev/null | grep -qiE "(wip|todo|fixup|tmp|temp)" || git log --oneline master..HEAD 2>/dev/null | grep -qiE "(wip|todo|fixup|tmp|temp)"; then
        echo -e "   ${YELLOW}⚠️  Found WIP/TODO commits. Consider squashing.${NC}"
    else
        echo -e "   ${GREEN}✅ Commit messages look clean${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  No commits detected${NC}"
fi
echo ""

# Check 10: Tests (if test command exists)
echo "10. Running tests..."
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    if npm test &>/dev/null; then
        echo -e "${GREEN}✅ All tests pass${NC}"
    else
        echo -e "${RED}❌ Tests failing${NC}"
        echo "   Fix: npm test (and fix failures)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
elif [ -f "Cargo.toml" ]; then
    if cargo test &>/dev/null; then
        echo -e "${GREEN}✅ All tests pass${NC}"
    else
        echo -e "${RED}❌ Tests failing${NC}"
        echo "   Fix: cargo test (and fix failures)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${YELLOW}⚠️  No test command found (skipping)${NC}"
fi
echo ""

# Final summary
echo "======================="
echo "Summary"
echo "======================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to submit PR.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. git push origin $CURRENT_BRANCH"
    echo "2. Go to GitHub and create pull request"
    echo "3. Fill PR description template"
    echo "4. Submit PR and monitor for CI results"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s). Fix them before submitting PR.${NC}"
    echo ""
    echo "After fixing:"
    echo "1. Run this script again to verify"
    echo "2. Push changes: git push origin $CURRENT_BRANCH"
    exit 1
fi

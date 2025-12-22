#!/bin/bash

# resume.sh - Quickly show current project state from SESSION.md
# Usage: ./scripts/resume.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Current Project State ===${NC}\n"

# Check if SESSION.md exists
if [ ! -f "SESSION.md" ]; then
    echo -e "${YELLOW}⚠️  SESSION.md not found in project root${NC}"
    echo "Run this script from your project root directory"
    echo "Or create SESSION.md first using the project-session-management skill"
    exit 1
fi

# Show current phase
echo -e "${GREEN}Current Phase:${NC}"
grep -A 15 "## .*🔄" SESSION.md | head -20 || echo "No phase currently in progress"
echo ""

# Show last checkpoint
echo -e "${GREEN}Last Checkpoint:${NC}"
if git log --oneline --grep="checkpoint:" -1 --format="%H %s%n%b" 2>/dev/null | head -15; then
    echo ""
else
    echo "No checkpoint commits found"
    echo ""
fi

# Show next action
echo -e "${GREEN}Next Action:${NC}"
grep "**Next Action**" SESSION.md | tail -1 | sed 's/\*\*Next Action\*\*: //' || echo "No next action defined"
echo ""

# Show status summary
echo -e "${GREEN}Status Summary:${NC}"
echo -n "✅ Completed: "
grep -c "✅" SESSION.md || echo "0"
echo -n "🔄 In Progress: "
grep -c "🔄" SESSION.md || echo "0"
echo -n "⏸️  Pending: "
grep -c "⏸️" SESSION.md || echo "0"
echo -n "🚫 Blocked: "
grep -c "🚫" SESSION.md || echo "0"
echo ""

# Show planning docs
echo -e "${GREEN}Planning Docs:${NC}"
grep "**Planning Docs**" SESSION.md | sed 's/\*\*Planning Docs\*\*: //' || echo "Not specified"
echo ""

echo -e "${BLUE}=== End of Summary ===${NC}"
echo ""
echo "💡 Tip: Read SESSION.md for full details"
echo "💡 Tip: Use 'git log --grep=\"checkpoint:\"' to see checkpoint history"

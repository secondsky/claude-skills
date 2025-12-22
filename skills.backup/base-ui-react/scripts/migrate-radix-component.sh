#!/bin/bash
# Automated Radix UI → Base UI migration helper
# WARNING: This script modifies files. Commit your changes first!

set -e

if [ $# -eq 0 ]; then
  echo "Usage: $0 <file.tsx>"
  echo ""
  echo "Example:"
  echo "  $0 src/components/Dialog.tsx"
  echo ""
  echo "⚠️  WARNING: This script modifies files. Commit your changes first!"
  exit 1
fi

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "❌ Error: File not found: $FILE"
  exit 1
fi

echo "🔄 Migrating $FILE from Radix UI to Base UI..."
echo ""

# Create backup
BACKUP="${FILE}.radix-backup"
cp "$FILE" "$BACKUP"
echo "✅ Created backup: $BACKUP"

# Perform migrations
echo "🔧 Applying transformations..."

# 1. Update imports
sed -i 's/import \* as Dialog from "@radix-ui\/react-dialog"/import { Dialog } from "@base-ui-components\/react\/dialog"/' "$FILE"
sed -i 's/import \* as Popover from "@radix-ui\/react-popover"/import { Popover } from "@base-ui-components\/react\/popover"/' "$FILE"
sed -i 's/import \* as Select from "@radix-ui\/react-select"/import { Select } from "@base-ui-components\/react\/select"/' "$FILE"
sed -i 's/import \* as Tooltip from "@radix-ui\/react-tooltip"/import { Tooltip } from "@base-ui-components\/react\/tooltip"/' "$FILE"
sed -i 's/import \* as Accordion from "@radix-ui\/react-accordion"/import { Accordion } from "@base-ui-components\/react\/accordion"/' "$FILE"

# 2. Replace component names
sed -i 's/\.Content\b/.Popup/g' "$FILE"
sed -i 's/\.Overlay\b/.Backdrop/g' "$FILE"

# 3. Replace props
sed -i 's/\balign="/alignment="/g' "$FILE"

# 4. Add TODO markers for manual fixes
echo ""
echo "⚠️  Manual fixes required:"
echo ""
echo "1. Replace asChild with render props:"
echo "   <Trigger asChild><button /></Trigger>"
echo "   → <Trigger render={(props) => <button {...props} />} />"
echo ""
echo "2. Add Positioner wrapper for Select, Popover, Tooltip:"
echo "   <Portal><Popup /></Portal>"
echo "   → <Positioner side=\"top\"><Portal><Popup /></Portal></Positioner>"
echo ""
echo "3. Make Portal explicit if not already"
echo ""
echo "4. Ensure all render props spread {...props}"
echo ""

# Add TODO comment at top of file
sed -i '1i // TODO: Complete Base UI migration - check render props, Positioner wrappers, and Portal usage' "$FILE"

echo "✅ Automatic transformations complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Review changes: git diff $FILE"
echo "  2. Manually fix asChild → render props"
echo "  3. Add Positioner wrappers where needed"
echo "  4. Test thoroughly"
echo "  5. Remove TODO comment when done"
echo ""
echo "📚 See references/migration-from-radix.md for complete guide"
echo ""
echo "To restore backup:"
echo "  mv $BACKUP $FILE"

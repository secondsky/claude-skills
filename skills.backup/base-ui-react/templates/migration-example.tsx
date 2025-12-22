// Migration Example: Radix UI → Base UI
// Side-by-side comparison showing key differences

import * as React from "react";

/**
 * ============================================================================
 * DIALOG COMPONENT COMPARISON
 * ============================================================================
 */

// ❌ RADIX UI (Old)
/*
import * as Dialog from "@radix-ui/react-dialog";

export function RadixDialog() {
  return (
    <Dialog.Root>
      {/* asChild pattern - merge props into child *\/}
      <Dialog.Trigger asChild>
        <button className="btn">Open</button>
      </Dialog.Trigger>

      {/* Portal is automatic *\/}
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="content">
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close asChild>
            <button>Close</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
*/

// ✅ BASE UI (New)
import { Dialog } from "@base-ui-components/react/dialog";

export function BaseUIDialog() {
  return (
    <Dialog.Root>
      {/* Render prop pattern - explicit props spreading */}
      <Dialog.Trigger
        render={(props) => (
          <button {...props} className="btn">
            Open
          </button>
        )}
      />

      {/* Portal must be explicit */}
      <Dialog.Portal>
        <Dialog.Backdrop
          render={(props) => <div {...props} className="overlay" />}
        />
        <Dialog.Popup
          render={(props) => (
            <div {...props} className="content">
              <Dialog.Title
                render={(titleProps) => (
                  <h2 {...titleProps}>Title</h2>
                )}
              />
              <Dialog.Description
                render={(descProps) => (
                  <p {...descProps}>Description</p>
                )}
              />
              <Dialog.Close
                render={(closeProps) => (
                  <button {...closeProps}>Close</button>
                )}
              />
            </div>
          )}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * ============================================================================
 * SELECT COMPONENT COMPARISON
 * ============================================================================
 */

// ❌ RADIX UI (Old)
/*
import * as Select from "@radix-ui/react-select";

export function RadixSelect() {
  return (
    <Select.Root>
      <Select.Trigger asChild>
        <button>
          <Select.Value placeholder="Select..." />
          <Select.Icon>▼</Select.Icon>
        </button>
      </Select.Trigger>

      {/* Portal is automatic *\/}
      <Select.Portal>
        <Select.Content>
          <Select.Viewport>
            <Select.Item value="1" asChild>
              <div>Option 1</div>
            </Select.Item>
            <Select.Item value="2" asChild>
              <div>Option 2</div>
            </Select.Item>
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
*/

// ✅ BASE UI (New)
import { Select } from "@base-ui-components/react/select";

export function BaseUISelect() {
  return (
    <Select.Root>
      <Select.Trigger
        render={(props) => (
          <button {...props}>
            <Select.Value
              render={(valueProps) => (
                <span {...valueProps} placeholder="Select..." />
              )}
            />
            <Select.Icon
              render={(iconProps) => <span {...iconProps}>▼</span>}
            />
          </button>
        )}
      />

      {/* Positioner is REQUIRED for positioning */}
      <Select.Positioner side="bottom" alignment="start">
        <Select.Portal>
          <Select.Popup
            render={(props) => (
              <div {...props}>
                <Select.Option
                  value="1"
                  render={(optionProps) => (
                    <div {...optionProps}>Option 1</div>
                  )}
                />
                <Select.Option
                  value="2"
                  render={(optionProps) => (
                    <div {...optionProps}>Option 2</div>
                  )}
                />
              </div>
            )}
          />
        </Select.Portal>
      </Select.Positioner>
    </Select.Root>
  );
}

/**
 * ============================================================================
 * POPOVER COMPONENT COMPARISON
 * ============================================================================
 */

// ❌ RADIX UI (Old)
/*
import * as Popover from "@radix-ui/react-popover";

export function RadixPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button>Open</button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content side="top" align="center">
          <Popover.Arrow />
          <p>Content</p>
          <Popover.Close asChild>
            <button>Close</button>
          </Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
*/

// ✅ BASE UI (New)
import { Popover } from "@base-ui-components/react/popover";

export function BaseUIPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={(props) => <button {...props}>Open</button>}
      />

      {/* Positioner wraps Portal and handles positioning */}
      <Popover.Positioner side="top" alignment="center">
        <Popover.Portal>
          <Popover.Popup
            render={(props) => (
              <div {...props}>
                <p>Content</p>
                <Popover.Close
                  render={(closeProps) => (
                    <button {...closeProps}>Close</button>
                  )}
                />
              </div>
            )}
          />
          <Popover.Arrow
            render={(props) => <div {...props} />}
          />
        </Popover.Portal>
      </Popover.Positioner>
    </Popover.Root>
  );
}

/**
 * ============================================================================
 * TOOLTIP COMPONENT COMPARISON
 * ============================================================================
 */

// ❌ RADIX UI (Old)
/*
import * as Tooltip from "@radix-ui/react-tooltip";

export function RadixTooltip() {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button>Hover</button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content side="top">
            Tooltip
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
*/

// ✅ BASE UI (New)
import { Tooltip } from "@base-ui-components/react/tooltip";

export function BaseUITooltip() {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          render={(props) => <button {...props}>Hover</button>}
        />

        <Tooltip.Positioner side="top" alignment="center">
          <Tooltip.Portal>
            <Tooltip.Popup
              render={(props) => <div {...props}>Tooltip</div>}
            />
            <Tooltip.Arrow
              render={(props) => <div {...props} />}
            />
          </Tooltip.Portal>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/**
 * ============================================================================
 * KEY MIGRATION PATTERNS
 * ============================================================================
 */

/**
 * Pattern 1: asChild → render prop
 *
 * RADIX:
 * <Trigger asChild>
 *   <button>Click</button>
 * </Trigger>
 *
 * BASE UI:
 * <Trigger render={(props) => <button {...props}>Click</button>} />
 */

/**
 * Pattern 2: Direct props → Positioner wrapper
 *
 * RADIX:
 * <Content side="top" align="center">...</Content>
 *
 * BASE UI:
 * <Positioner side="top" alignment="center">
 *   <Portal>
 *     <Popup>...</Popup>
 *   </Portal>
 * </Positioner>
 */

/**
 * Pattern 3: Content → Popup
 *
 * RADIX:
 * <Dialog.Content>...</Dialog.Content>
 *
 * BASE UI:
 * <Dialog.Popup render={(props) => <div {...props}>...</div>} />
 */

/**
 * Pattern 4: Overlay → Backdrop
 *
 * RADIX:
 * <Dialog.Overlay />
 *
 * BASE UI:
 * <Dialog.Backdrop render={(props) => <div {...props} />} />
 */

/**
 * Pattern 5: align → alignment
 *
 * RADIX:
 * align="center"
 *
 * BASE UI:
 * alignment="center"
 */

/**
 * ============================================================================
 * MIGRATION CHECKLIST
 * ============================================================================
 *
 * [ ] Replace all asChild with render prop pattern
 * [ ] Wrap Content/Popup in Positioner for popups (Select, Popover, Tooltip)
 * [ ] Rename Content → Popup
 * [ ] Rename Overlay → Backdrop
 * [ ] Change align → alignment
 * [ ] Make Portal explicit (not automatic)
 * [ ] Update Arrow styling (now requires explicit render prop)
 * [ ] Test keyboard navigation still works
 * [ ] Test screen reader announcements
 * [ ] Verify positioning near viewport edges
 */

/**
 * ============================================================================
 * COMMON GOTCHAS
 * ============================================================================
 *
 * 1. Forgot Positioner wrapper
 *    ❌ <Popup /> won't position correctly
 *    ✅ <Positioner><Portal><Popup /></Portal></Positioner>
 *
 * 2. Used asChild instead of render
 *    ❌ <Trigger asChild><button /></Trigger>
 *    ✅ <Trigger render={(props) => <button {...props} />} />
 *
 * 3. Used align instead of alignment
 *    ❌ <Positioner align="center" />
 *    ✅ <Positioner alignment="center" />
 *
 * 4. Expected automatic Portal
 *    ❌ <Popup /> (renders in place)
 *    ✅ <Portal><Popup /></Portal>
 *
 * 5. Didn't spread props from render
 *    ❌ <Trigger render={() => <button>Click</button>} />
 *    ✅ <Trigger render={(props) => <button {...props}>Click</button>} />
 */

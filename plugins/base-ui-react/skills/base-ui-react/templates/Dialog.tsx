// Base UI Dialog Component with Render Props Pattern
// @base-ui-components/react v1.0.0-beta.4

import * as React from "react";
import { Dialog } from "@base-ui-components/react/dialog";

/**
 * Example: Modal Dialog with Base UI
 *
 * Key Differences from Radix:
 * - Uses render prop pattern instead of asChild
 * - Explicit trigger/backdrop/close props
 * - No Portal by default (add manually if needed)
 */

export function DialogExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Trigger: Render prop returns button props */}
      <Dialog.Trigger
        render={(props) => (
          <button
            {...props}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Dialog
          </button>
        )}
      />

      {/* Backdrop: Optional, render prop for custom styling */}
      <Dialog.Backdrop
        render={(props) => (
          <div
            {...props}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
        )}
      />

      {/* Portal: Manual portal if you need it */}
      <Dialog.Portal>
        {/* Popup: The actual dialog container */}
        <Dialog.Popup
          render={(props) => (
            <div
              {...props}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              {/* Title */}
              <Dialog.Title
                render={(props) => (
                  <h2
                    {...props}
                    className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100"
                  >
                    Dialog Title
                  </h2>
                )}
              />

              {/* Description */}
              <Dialog.Description
                render={(props) => (
                  <p
                    {...props}
                    className="text-gray-600 dark:text-gray-400 mb-6"
                  >
                    This is an example dialog built with Base UI using the
                    render prop pattern. All styling is custom.
                  </p>
                )}
              />

              {/* Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Example Input
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type something..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Dialog.Close
                  render={(props) => (
                    <button
                      {...props}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  )}
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Confirm
                </button>
              </div>
            </div>
          )}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Alternative: Without Render Props (Direct Props)
 *
 * Base UI also supports direct className/style props if you don't need
 * the flexibility of render props.
 */
export function DialogSimple() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="px-4 py-2 bg-blue-600 text-white rounded-md">
        Open Simple Dialog
      </Dialog.Trigger>

      <Dialog.Backdrop className="fixed inset-0 bg-black/50" />

      <Dialog.Portal>
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md">
          <Dialog.Title className="text-2xl font-semibold mb-4">
            Simple Dialog
          </Dialog.Title>

          <Dialog.Description className="text-gray-600 mb-6">
            You can use direct className props if you don't need render props.
          </Dialog.Description>

          <Dialog.Close className="px-4 py-2 border rounded-md">
            Close
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Common Pitfalls:
 *
 * ❌ Don't use asChild (Radix pattern)
 * <Dialog.Trigger asChild>
 *   <button>Open</button>
 * </Dialog.Trigger>
 *
 * ✅ Use render prop
 * <Dialog.Trigger render={(props) => <button {...props}>Open</button>} />
 *
 * ❌ Don't expect automatic Portal
 * <Dialog.Content>...</Dialog.Content>
 *
 * ✅ Wrap in Portal manually
 * <Dialog.Portal>
 *   <Dialog.Popup>...</Dialog.Popup>
 * </Dialog.Portal>
 */

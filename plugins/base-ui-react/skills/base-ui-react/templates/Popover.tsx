// Base UI Popover Component with Floating UI Integration
// @base-ui-components/react v1.0.0-beta.4

import * as React from "react";
import { Popover } from "@base-ui-components/react/popover";

/**
 * Example: Popover with Base UI
 *
 * Key Features:
 * - Positioner pattern with Floating UI
 * - Anchor positioning (side, alignment, offset)
 * - Click or hover triggers
 * - Arrow support
 */

export function PopoverExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <Popover.Trigger
        render={(props) => (
          <button
            {...props}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Popover
          </button>
        )}
      />

      {/* Positioner with Floating UI options */}
      <Popover.Positioner
        side="top"
        alignment="center"
        sideOffset={8}
        render={(props) => (
          <div {...props} className="z-50">
            <Popover.Portal>
              {/* Popup */}
              <Popover.Popup
                render={(popupProps) => (
                  <div
                    {...popupProps}
                    className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-4 w-64"
                  >
                    {/* Title */}
                    <Popover.Title
                      render={(titleProps) => (
                        <h3
                          {...titleProps}
                          className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100"
                        >
                          Popover Title
                        </h3>
                      )}
                    />

                    {/* Description */}
                    <Popover.Description
                      render={(descProps) => (
                        <p
                          {...descProps}
                          className="text-sm text-gray-600 dark:text-gray-400 mb-4"
                        >
                          This is a popover with content. It positions itself
                          automatically using Floating UI.
                        </p>
                      )}
                    />

                    {/* Close button */}
                    <Popover.Close
                      render={(closeProps) => (
                        <button
                          {...closeProps}
                          className="px-3 py-1 bg-gray-200 dark:bg-gray-800 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-700"
                        >
                          Close
                        </button>
                      )}
                    />
                  </div>
                )}
              />

              {/* Arrow */}
              <Popover.Arrow
                render={(arrowProps) => (
                  <div
                    {...arrowProps}
                    className="relative w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
                  />
                )}
              />
            </Popover.Portal>
          </div>
        )}
      />
    </Popover.Root>
  );
}

/**
 * Hover Trigger Example
 */
export function HoverPopoverExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        render={(props) => (
          <button
            {...props}
            className="px-4 py-2 border border-gray-300 rounded-md hover:border-gray-400"
          >
            Hover me
          </button>
        )}
      />

      <Popover.Positioner
        side="top"
        alignment="center"
        sideOffset={4}
      >
        <Popover.Portal>
          <Popover.Popup
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            render={(props) => (
              <div
                {...props}
                className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md shadow-lg"
              >
                This is a tooltip-style popover
              </div>
            )}
          />
        </Popover.Portal>
      </Popover.Positioner>
    </Popover.Root>
  );
}

/**
 * Positioning Options Example
 */
export function PositioningExample() {
  const [side, setSide] = React.useState<"top" | "right" | "bottom" | "left">("top");
  const [alignment, setAlignment] = React.useState<"start" | "center" | "end">("center");

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Side</label>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as typeof side)}
            className="border rounded-md px-3 py-1"
          >
            <option value="top">Top</option>
            <option value="right">Right</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Alignment</label>
          <select
            value={alignment}
            onChange={(e) => setAlignment(e.target.value as typeof alignment)}
            className="border rounded-md px-3 py-1"
          >
            <option value="start">Start</option>
            <option value="center">Center</option>
            <option value="end">End</option>
          </select>
        </div>
      </div>

      {/* Popover */}
      <Popover.Root>
        <Popover.Trigger
          render={(props) => (
            <button
              {...props}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Open Popover ({side} - {alignment})
            </button>
          )}
        />

        <Popover.Positioner
          side={side}
          alignment={alignment}
          sideOffset={8}
          alignmentOffset={0}
        >
          <Popover.Portal>
            <Popover.Popup
              render={(props) => (
                <div
                  {...props}
                  className="bg-white border rounded-md shadow-lg p-4 w-64"
                >
                  <p className="text-sm">
                    Position: <strong>{side}</strong>
                    <br />
                    Alignment: <strong>{alignment}</strong>
                  </p>
                </div>
              )}
            />
            <Popover.Arrow
              render={(props) => (
                <div {...props} className="w-3 h-3 rotate-45 bg-white border" />
              )}
            />
          </Popover.Portal>
        </Popover.Positioner>
      </Popover.Root>
    </div>
  );
}

/**
 * Collision Boundary Example
 * Prevents popover from overflowing viewport
 */
export function CollisionBoundaryExample() {
  return (
    <div className="flex justify-end p-4">
      <Popover.Root>
        <Popover.Trigger
          render={(props) => (
            <button
              {...props}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Open (near edge)
            </button>
          )}
        />

        <Popover.Positioner
          side="right"
          alignment="start"
          sideOffset={8}
          collisionBoundary={null} // null = viewport (default)
          collisionPadding={8}
        >
          <Popover.Portal>
            <Popover.Popup
              render={(props) => (
                <div
                  {...props}
                  className="bg-white border rounded-md shadow-lg p-4 w-64"
                >
                  <p className="text-sm">
                    This popover will automatically flip to stay in viewport.
                  </p>
                </div>
              )}
            />
          </Popover.Portal>
        </Popover.Positioner>
      </Popover.Root>
    </div>
  );
}

/**
 * Common Pitfalls:
 *
 * ❌ Missing Positioner
 * <Popover.Root>
 *   <Popover.Trigger />
 *   <Popover.Popup /> {/* Won't position correctly */}
 * </Popover.Root>
 *
 * ✅ Wrap in Positioner
 * <Popover.Root>
 *   <Popover.Trigger />
 *   <Popover.Positioner>
 *     <Popover.Portal>
 *       <Popover.Popup />
 *     </Popover.Portal>
 *   </Popover.Positioner>
 * </Popover.Root>
 *
 * ❌ Arrow without proper styling
 * <Popover.Arrow /> {/* Invisible */}
 *
 * ✅ Style arrow correctly
 * <Popover.Arrow
 *   render={(props) => (
 *     <div {...props} className="w-3 h-3 rotate-45 bg-white border" />
 *   )}
 * />
 */

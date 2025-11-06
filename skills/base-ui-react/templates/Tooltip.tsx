// Base UI Tooltip Component
// @base-ui-components/react v1.0.0-beta.4

import * as React from "react";
import { Tooltip } from "@base-ui-components/react/tooltip";

/**
 * Example: Accessible Tooltip with Base UI
 *
 * Key Features:
 * - Hover and focus triggers
 * - Keyboard accessible
 * - Positioner for smart positioning
 * - Delay controls
 */

export function TooltipExample() {
  return (
    <Tooltip.Root>
      {/* Trigger */}
      <Tooltip.Trigger
        render={(props) => (
          <button
            {...props}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Hover me
          </button>
        )}
      />

      {/* Positioner */}
      <Tooltip.Positioner
        side="top"
        alignment="center"
        sideOffset={4}
        render={(props) => (
          <div {...props} className="z-50">
            <Tooltip.Portal>
              {/* Popup */}
              <Tooltip.Popup
                render={(popupProps) => (
                  <div
                    {...popupProps}
                    className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md shadow-lg max-w-xs"
                  >
                    This is a tooltip with helpful information
                  </div>
                )}
              />

              {/* Arrow */}
              <Tooltip.Arrow
                render={(arrowProps) => (
                  <div
                    {...arrowProps}
                    className="w-2 h-2 rotate-45 bg-gray-900"
                  />
                )}
              />
            </Tooltip.Portal>
          </div>
        )}
      />
    </Tooltip.Root>
  );
}

/**
 * Delayed Tooltip Example
 */
export function DelayedTooltipExample() {
  return (
    <Tooltip.Root
      delay={500} // 500ms delay before showing
      closeDelay={0} // Hide immediately
    >
      <Tooltip.Trigger
        render={(props) => (
          <button
            {...props}
            className="px-4 py-2 border border-gray-300 rounded-md hover:border-gray-400"
          >
            Hover me (500ms delay)
          </button>
        )}
      />

      <Tooltip.Positioner side="top" alignment="center" sideOffset={4}>
        <Tooltip.Portal>
          <Tooltip.Popup
            render={(props) => (
              <div
                {...props}
                className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md"
              >
                Delayed tooltip
              </div>
            )}
          />
        </Tooltip.Portal>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

/**
 * Rich Content Tooltip Example
 */
export function RichTooltipExample() {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={(props) => (
          <button
            {...props}
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            What's this?
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-gray-400"
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" />
              <text
                x="8"
                y="11"
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
              >
                ?
              </text>
            </svg>
          </button>
        )}
      />

      <Tooltip.Positioner side="right" alignment="start" sideOffset={8}>
        <Tooltip.Portal>
          <Tooltip.Popup
            render={(props) => (
              <div
                {...props}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-4 w-64"
              >
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Helpful Information
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  This tooltip contains rich content including headings,
                  paragraphs, and links.
                </p>
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Learn more →
                </a>
              </div>
            )}
          />
          <Tooltip.Arrow
            render={(props) => (
              <div
                {...props}
                className="w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
              />
            )}
          />
        </Tooltip.Portal>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

/**
 * Disabled State Example
 */
export function DisabledTooltipExample() {
  return (
    <div className="space-x-4">
      <Tooltip.Root>
        <Tooltip.Trigger
          render={(props) => (
            <button
              {...props}
              disabled
              className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
            >
              Disabled button
            </button>
          )}
        />

        <Tooltip.Positioner side="top">
          <Tooltip.Portal>
            <Tooltip.Popup
              render={(props) => (
                <div
                  {...props}
                  className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md"
                >
                  This button is disabled
                </div>
              )}
            />
          </Tooltip.Portal>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </div>
  );
}

/**
 * Multiple Tooltips with Provider
 * Share delay settings across multiple tooltips
 */
export function TooltipProviderExample() {
  return (
    <Tooltip.Provider delay={300} closeDelay={100}>
      <div className="flex gap-4">
        <Tooltip.Root>
          <Tooltip.Trigger
            render={(props) => (
              <button {...props} className="px-4 py-2 border rounded-md">
                First
              </button>
            )}
          />
          <Tooltip.Positioner side="top">
            <Tooltip.Portal>
              <Tooltip.Popup
                render={(props) => (
                  <div {...props} className="bg-gray-900 text-white px-3 py-2 rounded-md">
                    First tooltip
                  </div>
                )}
              />
            </Tooltip.Portal>
          </Tooltip.Positioner>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger
            render={(props) => (
              <button {...props} className="px-4 py-2 border rounded-md">
                Second
              </button>
            )}
          />
          <Tooltip.Positioner side="top">
            <Tooltip.Portal>
              <Tooltip.Popup
                render={(props) => (
                  <div {...props} className="bg-gray-900 text-white px-3 py-2 rounded-md">
                    Second tooltip
                  </div>
                )}
              />
            </Tooltip.Portal>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  );
}

/**
 * Positioning Variations
 */
export function TooltipPositionsExample() {
  const positions: Array<{
    side: "top" | "right" | "bottom" | "left";
    alignment: "start" | "center" | "end";
  }> = [
    { side: "top", alignment: "center" },
    { side: "right", alignment: "center" },
    { side: "bottom", alignment: "center" },
    { side: "left", alignment: "center" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {positions.map(({ side, alignment }) => (
        <Tooltip.Root key={`${side}-${alignment}`}>
          <Tooltip.Trigger
            render={(props) => (
              <button
                {...props}
                className="px-4 py-2 border border-gray-300 rounded-md hover:border-gray-400"
              >
                {side}
              </button>
            )}
          />

          <Tooltip.Positioner side={side} alignment={alignment} sideOffset={4}>
            <Tooltip.Portal>
              <Tooltip.Popup
                render={(props) => (
                  <div
                    {...props}
                    className="bg-gray-900 text-white text-sm px-3 py-2 rounded-md"
                  >
                    Tooltip on {side}
                  </div>
                )}
              />
              <Tooltip.Arrow
                render={(props) => (
                  <div {...props} className="w-2 h-2 rotate-45 bg-gray-900" />
                )}
              />
            </Tooltip.Portal>
          </Tooltip.Positioner>
        </Tooltip.Root>
      ))}
    </div>
  );
}

/**
 * Common Pitfalls:
 *
 * ❌ Not keyboard accessible
 * <div onMouseEnter={show}>...</div> {/* No keyboard support */}
 *
 * ✅ Use Tooltip.Trigger
 * <Tooltip.Trigger render={(props) => <button {...props}>...</button>} />
 *
 * ❌ Missing Positioner
 * <Tooltip.Popup /> {/* Won't position correctly */}
 *
 * ✅ Wrap in Positioner
 * <Tooltip.Positioner>
 *   <Tooltip.Portal>
 *     <Tooltip.Popup />
 *   </Tooltip.Portal>
 * </Tooltip.Positioner>
 *
 * ❌ Tooltip on disabled button doesn't show
 * <Tooltip.Trigger disabled /> {/* Pointer events disabled */}
 *
 * ✅ Wrap disabled element
 * <Tooltip.Trigger>
 *   <span className="inline-block">
 *     <button disabled>...</button>
 *   </span>
 * </Tooltip.Trigger>
 */

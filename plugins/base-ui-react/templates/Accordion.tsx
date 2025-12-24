// Base UI Accordion Component
// @base-ui-components/react v1.0.0-beta.4

import * as React from "react";
import { Accordion } from "@base-ui-components/react/accordion";

/**
 * Example: Collapsible Accordion with Base UI
 *
 * Key Features:
 * - Single or multiple item expansion
 * - Animated transitions
 * - Keyboard navigation (arrow keys, Home/End)
 * - Accessible (ARIA attributes)
 */

export function AccordionExample() {
  return (
    <Accordion.Root className="w-full max-w-2xl">
      {/* Item 1 */}
      <Accordion.Item value="item-1" className="border-b border-gray-200">
        {/* Header */}
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button
                {...props}
                className="flex w-full items-center justify-between py-4 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  What is Base UI?
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-200 data-[state=open]:rotate-180"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          />
        </Accordion.Header>

        {/* Panel */}
        <Accordion.Panel
          render={(props) => (
            <div
              {...props}
              className="px-2 pb-4 text-gray-600 dark:text-gray-400"
            >
              Base UI is a library of unstyled React components built by MUI.
              It provides accessible, customizable building blocks for your UI.
            </div>
          )}
        />
      </Accordion.Item>

      {/* Item 2 */}
      <Accordion.Item value="item-2" className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button
                {...props}
                className="flex w-full items-center justify-between py-4 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  How does it differ from Radix UI?
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-200 data-[state=open]:rotate-180"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          />
        </Accordion.Header>

        <Accordion.Panel
          render={(props) => (
            <div
              {...props}
              className="px-2 pb-4 text-gray-600 dark:text-gray-400"
            >
              Base UI uses render props instead of Radix's asChild pattern.
              It also has the Positioner pattern for better popup positioning
              with Floating UI.
            </div>
          )}
        />
      </Accordion.Item>

      {/* Item 3 */}
      <Accordion.Item value="item-3" className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button
                {...props}
                className="flex w-full items-center justify-between py-4 px-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Is it production ready?
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-200 data-[state=open]:rotate-180"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          />
        </Accordion.Header>

        <Accordion.Panel
          render={(props) => (
            <div
              {...props}
              className="px-2 pb-4 text-gray-600 dark:text-gray-400"
            >
              Base UI is currently in beta (v1.0.0-beta.4). Stable v1.0 is
              expected Q4 2025. Use with caution in production.
            </div>
          )}
        />
      </Accordion.Item>
    </Accordion.Root>
  );
}

/**
 * Multiple Open Items Example
 */
export function MultipleAccordionExample() {
  return (
    <Accordion.Root
      multiple // Allow multiple items open at once
      defaultValue={["item-1"]} // Start with item-1 open
      className="w-full max-w-2xl"
    >
      <Accordion.Item value="item-1" className="border-b">
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button
                {...props}
                className="flex w-full items-center justify-between py-4 px-2"
              >
                <span className="font-medium">Features</span>
                <span className="text-sm text-gray-500">▼</span>
              </button>
            )}
          />
        </Accordion.Header>
        <Accordion.Panel
          render={(props) => (
            <div {...props} className="px-2 pb-4">
              <ul className="list-disc pl-6 space-y-1">
                <li>Unstyled components</li>
                <li>Accessible by default</li>
                <li>Render prop pattern</li>
              </ul>
            </div>
          )}
        />
      </Accordion.Item>

      <Accordion.Item value="item-2" className="border-b">
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button
                {...props}
                className="flex w-full items-center justify-between py-4 px-2"
              >
                <span className="font-medium">Installation</span>
                <span className="text-sm text-gray-500">▼</span>
              </button>
            )}
          />
        </Accordion.Header>
        <Accordion.Panel
          render={(props) => (
            <div {...props} className="px-2 pb-4">
              <code className="block bg-gray-100 p-2 rounded">
                pnpm add @base-ui-components/react
              </code>
            </div>
          )}
        />
      </Accordion.Item>
    </Accordion.Root>
  );
}

/**
 * Animated Accordion Example
 */
export function AnimatedAccordionExample() {
  return (
    <Accordion.Root className="w-full max-w-2xl">
      <Accordion.Item value="item-1" className="border-b border-gray-200">
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button
                {...props}
                className="flex w-full items-center justify-between py-4 px-2 text-left group"
              >
                <span className="text-lg font-medium group-hover:text-blue-600 transition-colors">
                  Smooth Animation
                </span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="transition-transform duration-300 ease-in-out data-[state=open]:rotate-180"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          />
        </Accordion.Header>

        <Accordion.Panel
          render={(props) => (
            <div
              {...props}
              className="px-2 overflow-hidden transition-all duration-300 ease-in-out data-[state=open]:pb-4 data-[state=closed]:pb-0"
              style={{
                maxHeight: props["data-state"] === "open" ? "200px" : "0",
              }}
            >
              <div className="text-gray-600">
                This accordion uses CSS transitions for smooth open/close
                animations. The content fades in and slides down.
              </div>
            </div>
          )}
        />
      </Accordion.Item>
    </Accordion.Root>
  );
}

/**
 * Styled Accordion Example
 */
export function StyledAccordionExample() {
  const items = [
    {
      value: "basics",
      title: "Getting Started",
      content: "Learn the basics of Base UI and how to set up your project.",
    },
    {
      value: "components",
      title: "Components",
      content: "Explore all 27+ accessible components available in Base UI.",
    },
    {
      value: "migration",
      title: "Migration Guide",
      content: "Migrate from Radix UI to Base UI with our comprehensive guide.",
    },
  ];

  return (
    <Accordion.Root
      defaultValue={["basics"]}
      className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-lg"
    >
      {items.map((item, index) => (
        <Accordion.Item
          key={item.value}
          value={item.value}
          className={`${index !== items.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}`}
        >
          <Accordion.Header>
            <Accordion.Trigger
              render={(props) => (
                <button
                  {...props}
                  className="flex w-full items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 data-[state=open]:hidden">
                      Expand
                    </span>
                    <span className="text-sm text-gray-500 data-[state=closed]:hidden">
                      Collapse
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="transition-transform duration-200 data-[state=open]:rotate-180"
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </button>
              )}
            />
          </Accordion.Header>

          <Accordion.Panel
            render={(props) => (
              <div
                {...props}
                className="px-6 pb-6 text-gray-600 dark:text-gray-400"
              >
                {item.content}
              </div>
            )}
          />
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

/**
 * Disabled Item Example
 */
export function DisabledAccordionExample() {
  return (
    <Accordion.Root className="w-full max-w-2xl">
      <Accordion.Item value="item-1" className="border-b">
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button {...props} className="w-full py-4 px-2 text-left">
                Active Item
              </button>
            )}
          />
        </Accordion.Header>
        <Accordion.Panel
          render={(props) => (
            <div {...props} className="px-2 pb-4">
              This item can be expanded
            </div>
          )}
        />
      </Accordion.Item>

      <Accordion.Item value="item-2" disabled className="border-b">
        <Accordion.Header>
          <Accordion.Trigger
            render={(props) => (
              <button
                {...props}
                className="w-full py-4 px-2 text-left opacity-50 cursor-not-allowed"
              >
                Disabled Item
              </button>
            )}
          />
        </Accordion.Header>
        <Accordion.Panel
          render={(props) => (
            <div {...props} className="px-2 pb-4">
              This item cannot be expanded
            </div>
          )}
        />
      </Accordion.Item>
    </Accordion.Root>
  );
}

/**
 * Common Pitfalls:
 *
 * ❌ Missing value prop
 * <Accordion.Item> {/* Won't work */}
 *   <Accordion.Trigger />
 * </Accordion.Item>
 *
 * ✅ Provide unique value
 * <Accordion.Item value="item-1">
 *   <Accordion.Trigger />
 * </Accordion.Item>
 *
 * ❌ Animating height without max-height
 * <Accordion.Panel className="transition-all" /> {/* Jumpy animation */}
 *
 * ✅ Use max-height or grid
 * <Accordion.Panel
 *   style={{ maxHeight: open ? "200px" : "0" }}
 *   className="transition-all overflow-hidden"
 * />
 *
 * ❌ Forgetting multiple prop
 * <Accordion.Root> {/* Only one item can be open */}
 *
 * ✅ Allow multiple open
 * <Accordion.Root multiple>
 */

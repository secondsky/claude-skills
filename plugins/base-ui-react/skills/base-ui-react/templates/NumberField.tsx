// Base UI NumberField Component
// @base-ui-components/react v1.0.0-beta.4

import * as React from "react";
import { NumberField } from "@base-ui-components/react/number-field";

/**
 * Example: Number Input with Increment/Decrement
 *
 * Key Features:
 * - Built-in increment/decrement buttons
 * - Min/max validation
 * - Step control
 * - Keyboard shortcuts (arrow keys, page up/down)
 * - Scroll wheel support
 */

export function NumberFieldExample() {
  const [value, setValue] = React.useState<number>(0);

  return (
    <NumberField.Root
      value={value}
      onValueChange={setValue}
      min={0}
      max={100}
      step={1}
    >
      <div className="flex items-center gap-2">
        {/* Decrement button */}
        <NumberField.Decrement
          render={(props) => (
            <button
              {...props}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 8H12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        />

        {/* Input field */}
        <NumberField.Input
          render={(props) => (
            <input
              {...props}
              className="w-20 px-3 py-2 text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        />

        {/* Increment button */}
        <NumberField.Increment
          render={(props) => (
            <button
              {...props}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 4V12M4 8H12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        />
      </div>
    </NumberField.Root>
  );
}

/**
 * With Label and Description
 */
export function NumberFieldWithLabelExample() {
  const [quantity, setQuantity] = React.useState(1);

  return (
    <NumberField.Root
      value={quantity}
      onValueChange={setQuantity}
      min={1}
      max={99}
      step={1}
    >
      <div className="space-y-2">
        {/* Label */}
        <NumberField.Label
          render={(props) => (
            <label
              {...props}
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Quantity
            </label>
          )}
        />

        {/* Input group */}
        <div className="flex items-center gap-2">
          <NumberField.Decrement
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                −
              </button>
            )}
          />

          <NumberField.Input
            render={(props) => (
              <input
                {...props}
                className="w-20 px-3 py-2 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            )}
          />

          <NumberField.Increment
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                +
              </button>
            )}
          />
        </div>

        {/* Description */}
        <NumberField.Description
          render={(props) => (
            <p {...props} className="text-sm text-gray-600 dark:text-gray-400">
              Select quantity between 1 and 99
            </p>
          )}
        />
      </div>
    </NumberField.Root>
  );
}

/**
 * Decimal Numbers Example
 */
export function DecimalNumberFieldExample() {
  const [price, setPrice] = React.useState(9.99);

  return (
    <NumberField.Root
      value={price}
      onValueChange={setPrice}
      min={0}
      max={999.99}
      step={0.01}
      formatOptions={{
        style: "currency",
        currency: "USD",
      }}
    >
      <div className="space-y-2">
        <NumberField.Label
          render={(props) => (
            <label {...props} className="block text-sm font-medium">
              Price
            </label>
          )}
        />

        <div className="flex items-center gap-2">
          <NumberField.Decrement
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                −
              </button>
            )}
          />

          <NumberField.Input
            render={(props) => (
              <input
                {...props}
                className="w-32 px-3 py-2 text-center border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            )}
          />

          <NumberField.Increment
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                +
              </button>
            )}
          />
        </div>
      </div>
    </NumberField.Root>
  );
}

/**
 * Percentage Example
 */
export function PercentageNumberFieldExample() {
  const [percentage, setPercentage] = React.useState(50);

  return (
    <NumberField.Root
      value={percentage}
      onValueChange={setPercentage}
      min={0}
      max={100}
      step={5}
      formatOptions={{
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }}
    >
      <div className="space-y-2">
        <NumberField.Label
          render={(props) => (
            <label {...props} className="block text-sm font-medium">
              Completion
            </label>
          )}
        />

        <div className="flex items-center gap-2">
          <NumberField.Decrement
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
              >
                −
              </button>
            )}
          />

          <NumberField.Input
            render={(props) => (
              <input
                {...props}
                className="w-24 px-3 py-2 text-center border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            )}
          />

          <NumberField.Increment
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
              >
                +
              </button>
            )}
          />
        </div>

        {/* Visual progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </NumberField.Root>
  );
}

/**
 * Large Step Increments
 */
export function LargeStepNumberFieldExample() {
  const [value, setValue] = React.useState(1000);

  return (
    <NumberField.Root
      value={value}
      onValueChange={setValue}
      min={0}
      max={10000}
      step={100} // Large steps for quick adjustments
      largeStep={1000} // Page Up/Down uses this
    >
      <div className="space-y-2">
        <NumberField.Label
          render={(props) => (
            <label {...props} className="block text-sm font-medium">
              Budget
            </label>
          )}
        />

        <div className="flex items-center gap-2">
          <NumberField.Decrement
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                −
              </button>
            )}
          />

          <NumberField.Input
            render={(props) => (
              <input
                {...props}
                className="w-32 px-3 py-2 text-center border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            )}
          />

          <NumberField.Increment
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                +
              </button>
            )}
          />
        </div>

        <p className="text-xs text-gray-500">
          Tip: Use Page Up/Down for ±1000, Arrow keys for ±100
        </p>
      </div>
    </NumberField.Root>
  );
}

/**
 * Disabled State Example
 */
export function DisabledNumberFieldExample() {
  return (
    <NumberField.Root value={42} disabled>
      <div className="space-y-2">
        <NumberField.Label
          render={(props) => (
            <label {...props} className="block text-sm font-medium text-gray-400">
              Locked Value
            </label>
          )}
        />

        <div className="flex items-center gap-2">
          <NumberField.Decrement
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
              >
                −
              </button>
            )}
          />

          <NumberField.Input
            render={(props) => (
              <input
                {...props}
                className="w-20 px-3 py-2 text-center bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
              />
            )}
          />

          <NumberField.Increment
            render={(props) => (
              <button
                {...props}
                className="w-8 h-8 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
              >
                +
              </button>
            )}
          />
        </div>
      </div>
    </NumberField.Root>
  );
}

/**
 * Common Pitfalls:
 *
 * ❌ Using type="number" directly
 * <input type="number" /> {/* No increment/decrement, poor accessibility */}
 *
 * ✅ Use NumberField
 * <NumberField.Root>
 *   <NumberField.Input />
 *   <NumberField.Increment />
 *   <NumberField.Decrement />
 * </NumberField.Root>
 *
 * ❌ Forgetting min/max validation
 * <NumberField.Root value={value} /> {/* Can go negative/unlimited */}
 *
 * ✅ Set boundaries
 * <NumberField.Root value={value} min={0} max={100} />
 *
 * ❌ Wrong step for decimals
 * <NumberField.Root step={1} /> {/* Can't enter 9.99 */}
 *
 * ✅ Match step to precision
 * <NumberField.Root step={0.01} /> {/* Allows 2 decimal places */}
 */
